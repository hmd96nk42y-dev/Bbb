/* bubl concierge and the guest page (test and live mode). Plumbing only: no screen, button or word is added
   (Sk, 23 Nov 2026). In demo mode this file does nothing.

   1. Signed in from the chat. A button bubl sends in WhatsApp carries a one-time key after the "#" of the address.
      The page hands the key back to bubl once and drops it from the address; bubl answers with the sign-in of the
      guest whose own chat the button was sent to. The page's own start waits for that before it looks at who is
      signed in. A key that was used, is too old, or was never real changes nothing: the guest signs in as today.
      Someone already signed in on this browser stays signed in: the chat never signs anyone out or swaps accounts.
   1b. What the chat already knows goes into the page's own forms (Sk, 24 Nov 2026: "prefill the hold form from the
      chat"). With the sign-in bubl also says who the guest is: their number, and their name and email where it has
      them. The hold form and the invitation's form open with those already in their own boxes, for the guest to
      check or change. The number the guest is signed in on is proven by that sign-in, so it is taken as it is and
      no code is asked for again. (The studio's simulated guests are on numbers no phone can have: without this the
      form could never be passed.) Nothing is added to either form.
   2. Opening from its own address. ?e=<night> opens that night, ?n=<guests> sets the party, and ?tier=<kind of
      table> lights the open tables of that kind the way the build's own budget search lights its matches: by
      recolouring the tables' own details: their glow, and their seats in their section's own colour. Nothing is
      drawn on top. Tables of that kind that are taken or too small for the party are not lit: they look
      unavailable, as they do today. The venue opens on the plan of the section where those tables are (Sk, 24 Nov
      2026; before that, whole and in 3D); the guest picks the exact table there, or any other.
      ?e=<night>&p=<plan> alone (the message a host forwards) opens on the venue for that night.
      ?pick=1 also proposes one table of that kind (Sk, 23 Nov 2026: a table picked for the guest is shown before
      anything is confirmed, to change or to confirm). The table is selected exactly as a tap selects it, with its
      own sheet open: its own button holds it, and closing the sheet and tapping another table changes it. Nothing
      is held by the page itself.
   3. The page's own WhatsApp button is shown again, pointing at bubl's number, once bubl has one. */
(function(){
if(!LIVE)return;
const q=new URLSearchParams(location.search);

/* ---- 1. signed in from the chat ---- */
let chatGuest=null;   /* { phone:'+…', name, email }: who bubl says this page was signed in as; only ever set by that sign-in */
const digits=v=>String(v==null?'':v).replace(/\D/g,'');
const key=BUBL.auth.takeChatKey();   /* already taken out of the address, the moment the page started (engine/api.js) */
const entered=(async()=>{
  if(!key)return false;
  if(await BUBL.auth.phone())return false;
  const r=await BUBL.call('concierge-hooks','web/enter',{key:key});
  const ok=!!(r&&r.ok&&r.session)&&await BUBL.auth.enter(r.session);
  if(ok&&r.guest&&typeof r.guest.phone==='string'&&/^\+\d{5,20}$/.test(r.guest.phone))chatGuest={phone:r.guest.phone,name:typeof r.guest.name==='string'?r.guest.name:'',email:typeof r.guest.email==='string'?r.guest.email:''};
  return ok;
})().catch(()=>false);
const startAsBuilt=window.openGuestLink;
/* The page's own start calls this the moment it has drawn itself. A button from the chat is acted on right there,
   before anything is waited for (Sk, 26 Nov 2026: "open on the picked table straight away"): see fromChat below. */
window.openGuestLink=async function(){try{if(!q.get('i')&&!q.get('v')){early=true;fromChat();}}catch(_){}await entered;return startAsBuilt.apply(this,arguments);};

/* ---- 1b. what the chat already knows goes into the page's own forms ---- */
/* the number this page is signed in on, from the guest's own chat: proven already, so every form takes it as it is */
const parseAsBuilt=BUBL.phone.parse;
BUBL.phone.parse=function(text,dial){
  let r;try{r=parseAsBuilt.apply(this,arguments);}catch(_){r={ok:false,reason:'That does not look like a mobile number. Check it and try again.'};}
  if(!r.ok&&chatGuest){const mine=digits(chatGuest.phone),typed=digits(text);
    if(typed&&(typed===mine||digits(dial)+typed.replace(/^0+/,'')===mine))return {ok:true,e164:chatGuest.phone,country:null};}
  return r;
};
const fill=(el,v)=>{if(el&&v&&!el.value){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}};
/* the hold form: the build opens it empty; what bubl knows is then put in its own boxes */
const holdFormAsBuilt=window.openGinfo;
if(typeof holdFormAsBuilt==='function')window.openGinfo=function(){
  const r=holdFormAsBuilt.apply(this,arguments);
  if(chatGuest){fill($('#ginfoName'),chatGuest.name);fill($('#ginfoPhone'),chatGuest.phone);fill($('#ginfoEmail'),chatGuest.email);}
  return r;
};
/* the invitation's form (drawn when an invitation is opened): its country box is set where the number's code is one
   it lists, and the rest of the number goes in the number box */
function fillInvitation(root){
  if(!chatGuest||!root||!root.querySelector)return;
  const tel=root.querySelector('.ip-tel'),cc=root.querySelector('.ip-cc');
  fill(root.querySelector('.ip-name'),chatGuest.name);fill(root.querySelector('.ip-em'),chatGuest.email);
  /* the country goes in the box and the rest of the number beside it, also for a code the box does not list; a
     simulated number shows "+999" in the box (ccPut, live-invite.js). The two boxes always add up to the number. */
  if(tel&&!tel.value&&!(cc&&typeof ccPut==='function'&&ccPut(cc,tel,chatGuest.phone)))fill(tel,chatGuest.phone);
}
try{new MutationObserver(list=>{if(!chatGuest)return;for(const m of list)for(const n of m.addedNodes){if(n.nodeType!==1)continue;
  if((n.matches&&n.matches('.ip-s1'))||(n.querySelector&&n.querySelector('.ip-s1')))fillInvitation(n.closest&&n.closest('#ipv')||n);}}).observe(document.documentElement,{childList:true,subtree:true});}catch(_){}
entered.then(ok=>{if(ok)fillInvitation(document);});

/* ---- 2. the night, the party and the kind of table bubl spoke of ---- */
const want={e:q.get('e'),tier:q.get('tier'),n:parseInt(q.get('n')||'',10),pick:q.get('pick')};
let lit=null,opened=false,early=false,putAt=null;   /* early: acted on at the page's start; putAt: where the page was put then */
/* lit: the kind of table bubl suggested, by the venue's own key */
const litIds=()=>TABLES.filter(t=>t.tier===lit&&!t.req&&tableOpen(t)).map(t=>t.id);
/* the suggestion steps aside once the guest has a table, is buying tickets, or searches by budget themselves */
const litNow=()=>!!lit&&!S.boothId&&!S.tixMode&&!BUD.on&&!BUD.search;
/* The lit tables' own seats also take their section's own colour (Sk, 23 Nov 2026: "right much better"), with the
   seat colouring the venue view already has for public tables; a public table keeps its own colour. The colours are
   the 3D venue's own, read from it: none is written here. */
const postAsBuilt=window.dollPost;
let seatsAsSent={},coloured=false;   /* seatsAsSent: the seat colours the page itself last sent (public tables) */
function litColours(){
  const m={};
  try{const w=dollFrame&&dollFrame.contentWindow;if(!w||!w.TIER||!w.UshVenue)return m;
    const kind={};w.UshVenue.tables.forEach(t=>{kind[t.id]=t.tier;});
    litIds().forEach(id=>{const c=w.TIER[kind[id]]&&w.TIER[kind[id]].c;if(typeof c==='number')m[id]='#'+c.toString(16).padStart(6,'0');});}catch(_){}
  return m;
}
window.dollPost=function(m){
  if(m&&m.cmd==='social'){seatsAsSent=m.map||{};if(litNow()){coloured=true;m=Object.assign({},m,{map:Object.assign(litColours(),seatsAsSent)});}}
  return postAsBuilt.call(this,m);
};
const syncAsBuilt=window.syncBudget;
window.syncBudget=function(){syncAsBuilt.apply(this,arguments);
  if(litNow()){dollPost({cmd:'budget',on:true,ids:litIds()});dollPost({cmd:'social',map:seatsAsSent});}
  else if(coloured){coloured=false;dollPost({cmd:'social',map:seatsAsSent});}   /* the suggestion stepped aside: the seats go back to their own */
};
/* The venue view can take a while to load on a phone, more so inside the studio's own phone. It is waited for as long
   as five minutes, not thirty seconds: given up on sooner, the page was left at its top with nothing lit and nothing
   proposed (Sk, 24 Nov 2026: the link "landed on Buy tickets / Returning guest"). */
function whenRoomShows(fn){let tries=0;const t=setInterval(()=>{const up=dollReady;   /* the 3D venue has spoken: it is listening */
  if(up||++tries>3000){clearInterval(t);if(up)fn();}},100);}
/* The venue opens on the plan of the section where the lit tables are (Sk, 24 Nov 2026: "open the venue on the lit
   section's plan, not 3D"; before that it opened whole, in 3D at an angle). Where a kind of table sits on both sides,
   it is the side with more of them open; the build's own "other side" chip shows the rest. The plan and the section
   are asked of the venue view exactly as a tap on its "Plan" switch and on a section asks them. */
function litSection(){
  const n={};litIds().forEach(id=>{const t=T(id);if(t)n[t.sec]=(n[t.sec]||0)+1;});
  return Object.keys(n).sort((a,b)=>n[b]-n[a]||a.localeCompare(b))[0]||null;
}
/* The page is put on the venue in one step, not slid there: while the venue view loads the phone is too busy to slide,
   and the guest was left looking at the event's cover until it had finished (Sk, 26 Nov 2026). */
function toVenue(){const a=$('#app'),rc=$('#roomCanvas');if(a&&rc){const top=Math.max(0,rc.offsetTop-150);try{a.scrollTo({top:top,behavior:'instant'});}catch(_){a.scrollTop=top;}putAt=a.scrollTop;}}
/* the venue view has loaded: the page is put on the venue once more, and again when what loads after it has arrived */
function settle(){[0,700,1800,3500].forEach(ms=>setTimeout(()=>{if(!S.boothId&&!S.tixMode&&!moved())toVenue();},ms));}
function showLit(){
  const sec=litSection();if(!sec)return;
  S.view='top';paintVtog();dollPost({cmd:'setView',view:'top'});dollPost({cmd:'focus',zone:sec});
  settle();
}
/* The table proposed: the one named if it is still open, or the first open one of the lit kind that fits the party.
   It is shown the way the build's own helper shows a table it found: the venue goes to its section, then the table
   is picked as a tap picks it. Between the two the table is seen glowing where it stands, by the venue view's own
   selection, for a moment: on a phone the table's sheet then covers most of the venue. A guest who taps a table
   themselves in that moment has chosen, and nothing more is proposed. */
function proposed(){const open=litIds().map(T).filter(t=>t&&(!S.party||fits(t,S.party))),sec=litSection();return open.find(t=>t.id===want.pick)||open.find(t=>t.sec===sec)||open[0]||null;}
function propose(){
  const t=proposed();if(!t||S.boothId||!litNow())return;
  dollPost({cmd:'focus',zone:t.sec});
  const still=()=>!S.boothId&&litNow()&&!S.pick;
  if(!still())return;
  /* The venue view answers a selection by opening the table's sheet at once. For the proposed table that answer
     is held back for a moment (a tap on any other table is not), then given exactly as built. The table is selected
     the moment the venue view listens, and its sheet follows after the same moment as before: there is no other wait
     (Sk, 26 Nov 2026; before that the table was selected 1.4 seconds after the venue view listened). */
  const pickAsBuilt=window.onPick;let done=false;
  const giveBack=()=>{done=true;window.onPick=pickAsBuilt;};
  window.onPick=function(id){if(id===t.id&&!done)return;giveBack();return pickAsBuilt.apply(this,arguments);};
  dollPost({cmd:'select',id:t.id});
  setTimeout(()=>{if(done)return;giveBack();if(still())pickAsBuilt(t.id);},1700);
}
/* Run at the page's start, before the sign-in and the guest's own tables are known: the night, the party and the
   page's place on the venue wait for nothing. (They used to wait for the back end's answer, which the phone could not
   take in until the venue view had finished loading: many seconds on the event's cover.) */
function fromChat(){
  if(opened)return;opened=true;
  if(S.boothId||window.GUEST)return;   /* the guest already has a table, or opened an invitation: the page shows that, as it always does */
  const ev=want.e?EVENTS.find(x=>x.id===want.e):null;
  if(want.e&&!ev)return;   /* a night that is no longer on sale: the page opens as it always does */
  if(ev&&S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}
  if(want.n>=2&&want.n<=16&&!S.party){S.party=want.n;$$('.ppill').forEach(p=>p.classList.toggle('sel',p.textContent===String(want.n)));setLbl('#pkParty',String(want.n));if(window.paintGuests)paintGuests();}
  if(want.tier&&TIERS[want.tier]&&!TIERS[want.tier].req)lit=want.tier;
  afterPick();
  if(lit){S.view='top';paintVtog();dollPost({cmd:'setView',view:'top'});}   /* the plan from the first frame: the venue never shows one way first and then turns */
  /* the page goes to the venue at once, while the venue view is still loading: the guest is never left at the top */
  /* and again as the parts of the page above the venue arrive and push it down, for as long as the guest has not
     scrolled the page themselves */
  if(lit||(ev&&q.get('p'))){toVenue();let n=0;const t=setInterval(()=>{if(++n>24||S.boothId||S.tixMode||moved())clearInterval(t);else toVenue();},350);}
  if(lit)whenRoomShows(()=>{if(litNow()){syncBudget();showLit();if(want.pick)propose();}});
  /* The night alone, from the message a host forwards ("Are you in?"): the page opens on the venue for that night
     rather than leaving a friend at the ticket button further up (Sk, 24 Nov 2026). Nothing is lit or proposed. */
  else if(ev&&q.get('p'))whenRoomShows(()=>{settle();});
}
/* the guest has scrolled the page themselves: it is left where they put it. (Told by their own finger, tap or wheel, not by
   where the page is: the page also shifts by itself as the parts above the venue arrive.) */
let touched=false;
['touchmove','wheel','pointerdown'].forEach(k=>{try{window.addEventListener(k,()=>{touched=true;},{passive:true,capture:true});}catch(_){}});
function moved(){return touched;}
const restoreAsBuilt=window.restoreMine;
window.restoreMine=async function(){const r=await restoreAsBuilt.apply(this,arguments);
  try{fromChat();
    /* the guest turned out to have a table already: the page shows that from its top, as it always does */
    if(early&&S.boothId){lit=null;}
    if(early&&S.boothId&&putAt!=null&&!moved()){const a=$('#app');putAt=null;if(a){try{a.scrollTo({top:0,behavior:'instant'});}catch(_){a.scrollTop=0;}}}
  }catch(_){}return r;};

/* ---- 3. the page's own WhatsApp button, pointed at bubl ---- */
bublLine().then(n=>{   /* asked once for the whole page (live-invite.js) */
  const box=$('#waBox');if(!n||!box)return;
  const shown=$('#waNum');if(shown)shown.textContent=BUBL.phone.pretty('+'+n);   /* written the way the page writes every number */
  box.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();try{window.open('https://wa.me/'+n,'_blank');}catch(_){}toast('Opening WhatsApp');},true);
  /* the button was hidden only because the build's number was a placeholder (live-gates.js): it is offered again */
  const st=document.getElementById('not-yet-css');
  if(st&&NOT_YET&&NOT_YET.whatsapp){const css=st.textContent,i=css.indexOf('{');
    st.textContent=css.slice(0,i).split(',').filter(s=>s.trim()!==NOT_YET.whatsapp).join(',')+css.slice(i);delete NOT_YET.whatsapp;}
},()=>{});
})();
