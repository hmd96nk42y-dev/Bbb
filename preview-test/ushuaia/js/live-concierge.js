/* bubl concierge and the guest page (test and live mode). Plumbing only: no screen, button or word is added
   (Sk, 23 Nov 2026). In demo mode this file does nothing.

   1. Signed in from the chat. A button bubl sends in WhatsApp carries a one-time key after the "#" of the address.
      The page hands the key back to bubl once and drops it from the address; bubl answers with the sign-in of the
      guest whose own chat the button was sent to. The page's own start waits for that before it looks at who is
      signed in. A key that was used, is too old, or was never real changes nothing: the guest signs in as today.
      Someone already signed in on this browser stays signed in: the chat never signs anyone out or swaps accounts.
   2. Opening from its own address. ?e=<night> opens that night, ?n=<guests> sets the party, and ?tier=<kind of
      table> lights the open tables of that kind the way the build's own budget search lights its matches: by
      recolouring the tables' own details: their glow, and their seats in their section's own colour. Nothing is
      drawn on top. Tables of that kind that are taken or too small for the party are not lit: they look
      unavailable, as they do today. The venue opens whole, in its 3D view at an angle, so the guest sees where
      that section sits; they tap it and pick the exact table, or any other.
   3. The page's own WhatsApp button is shown again, pointing at bubl's number, once bubl has one. */
(function(){
if(!LIVE)return;
const q=new URLSearchParams(location.search);

/* ---- 1. signed in from the chat ---- */
const key=BUBL.auth.takeChatKey();   /* already taken out of the address, the moment the page started (engine/api.js) */
const entered=(async()=>{
  if(!key)return false;
  if(await BUBL.auth.phone())return false;
  const r=await BUBL.call('concierge-hooks','web/enter',{key:key});
  return !!(r&&r.ok&&r.session)&&await BUBL.auth.enter(r.session);
})().catch(()=>false);
const startAsBuilt=window.openGuestLink;
window.openGuestLink=async function(){await entered;return startAsBuilt.apply(this,arguments);};

/* ---- 2. the night, the party and the kind of table bubl spoke of ---- */
const want={e:q.get('e'),tier:q.get('tier'),n:parseInt(q.get('n')||'',10)};
let lit=null,opened=false;   /* lit: the kind of table bubl suggested, by the venue's own key */
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
function whenRoomShows(fn){let tries=0;const t=setInterval(()=>{const up=dollReady;   /* the 3D venue has spoken: it is listening */
  if(up||++tries>300){clearInterval(t);if(up)fn();}},100);}
/* The whole venue in its 3D view, at an angle with the city line behind it, so the guest sees where the lit section
   sits (Sk, 23 Nov 2026). The angle is this venue's own: it is given to the 3D venue through the camera hook the
   build already has, and the venue file itself is not changed. It holds until the guest touches the venue, changes
   view, or the suggestion steps aside; from then on the 3D view moves as it always does. The guest pinches in or taps
   the section for the plan, then the table, as always. */
const OPENING_ANGLE={theta:-2.25,phi:1.33,R:1600,tx:-30,ty:90,tz:470,fov:40};
let held=null;   /* the 3D venue's own window, while the opening angle is held */
function letGo(){if(!held)return;const w=held;held=null;try{w.__camO=null;w.removeEventListener('pointerdown',letGo,true);}catch(_){}}
function holdAngle(){
  try{const w=dollFrame&&dollFrame.contentWindow;if(!w||held===w)return;letGo();w.__camO=Object.assign({},OPENING_ANGLE);w.addEventListener('pointerdown',letGo,true);held=w;}catch(_){return;}
  const t=setInterval(()=>{if(!held){clearInterval(t);return;}if(!litNow()||curView()!=='iso'||!dollFrame||dollFrame.contentWindow!==held){letGo();clearInterval(t);}},250);
}
function showLit(){
  if(!litIds().length)return;
  S.view='iso';paintVtog();dollPost({cmd:'setView',view:'iso'});dollPost({cmd:'focus',zone:'all'});holdAngle();
  const a=$('#app'),rc=$('#roomCanvas');if(a&&rc)a.scrollTo({top:Math.max(0,rc.offsetTop-150),behavior:'smooth'});
}
function fromChat(){
  if(opened)return;opened=true;
  if(S.boothId||window.GUEST)return;   /* the guest already has a table, or opened an invitation: the page shows that, as it always does */
  const ev=want.e?EVENTS.find(x=>x.id===want.e):null;
  if(want.e&&!ev)return;   /* a night that is no longer on sale: the page opens as it always does */
  if(ev&&S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}
  if(want.n>=2&&want.n<=16&&!S.party){S.party=want.n;$$('.ppill').forEach(p=>p.classList.toggle('sel',p.textContent===String(want.n)));setLbl('#pkParty',String(want.n));if(window.paintGuests)paintGuests();}
  if(want.tier&&TIERS[want.tier]&&!TIERS[want.tier].req)lit=want.tier;
  afterPick();
  if(lit){S.view='iso';paintVtog();dollPost({cmd:'setView',view:'iso'});}   /* from the first frame: the venue never shows flat first and then turns */
  if(lit)whenRoomShows(()=>{if(litNow()){syncBudget();showLit();}});
}
const restoreAsBuilt=window.restoreMine;
window.restoreMine=async function(){const r=await restoreAsBuilt.apply(this,arguments);try{fromChat();}catch(_){}return r;};

/* ---- 3. the page's own WhatsApp button, pointed at bubl ---- */
BUBL.call('concierge-hooks','web/line',{}).then(r=>{
  const n=r&&r.ok&&typeof r.number==='string'&&/^[0-9]{6,20}$/.test(r.number)?r.number:null,box=$('#waBox');if(!n||!box)return;
  const shown=$('#waNum');if(shown)shown.textContent=BUBL.phone.pretty('+'+n);   /* written the way the page writes every number */
  box.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();try{window.open('https://wa.me/'+n,'_blank');}catch(_){}toast('Opening WhatsApp');},true);
  /* the button was hidden only because the build's number was a placeholder (live-gates.js): it is offered again */
  const st=document.getElementById('not-yet-css');
  if(st&&NOT_YET&&NOT_YET.whatsapp){const css=st.textContent,i=css.indexOf('{');
    st.textContent=css.slice(0,i).split(',').filter(s=>s.trim()!==NOT_YET.whatsapp).join(',')+css.slice(i);delete NOT_YET.whatsapp;}
},()=>{});
})();
