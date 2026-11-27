/* The invitation, for a real guest (test and live mode).
   Someone was sent a link. They open it: Sk's invitation (the envelope, the room with the table lit, who is at the
   table, "Claim your spot") is drawn from what the back end says that link is for. Claiming is real: the guest's own
   name, number and email, a login code, and the seat is theirs in the database. Their part of the deposit, if they
   have one, is the back end's figure, and paying it holds their card.
   A guest never types anyone else's details, and sees other guests by first name only. */
window.GUEST=null;   /* { token, view (what the link shows), me (my first name once I have a seat), seat (my seat) } */
function guestsButMe(v){const a=(v.guests||[]).slice();if(GUEST&&GUEST.me){const i=a.indexOf(GUEST.me);if(i>-1)a.splice(i,1);}return a;}
const LINK_SAYS={ended:'This invitation has ended.',inactive:'This link is no longer active. Ask your host for the new one.',full:'Every seat on this link has been claimed.',not_confirmed_yet:'This table is not confirmed yet. Try again in a moment.',link_invalid:'This link is not one we know. Check it with your host.'};

/* the page was opened from a link (…/?i=<token>): show that invitation. → true if there was a link to show */
async function openGuestLink(){
  const token=new URLSearchParams(location.search).get('i');if(!token)return false;
  const v=await BUBL.link({token});
  if(!v.ok){toast(LINK_SAYS[v.code]||v.reason);return false;}
  const ev=EVENTS.find(e=>e.id===v.service);
  if(!ev||v.status==='ended'||v.status==='inactive'){toast(LINK_SAYS[v.status]||LINK_SAYS.ended);return false;}
  GUEST={token,view:v,me:null,seat:v.your_seat||null};
  if(S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}
  if(v.your_seat){const me=await BUBL.me();if(me.ok&&me.guest){GUEST.me=me.guest.full_name.split(' ')[0];window.__ipClaimed=true;window.__ipName=GUEST.me;const mine=(me.bookings||[]).find(b=>b.my_seat&&b.my_seat.seat_no===v.your_seat.seat_no&&b.table.key===v.table.key);GUEST.booking=mine||null;GUEST.bookingId=mine?mine.booking_id:null;}}
  S.holdUntil=v.hold_expires_at?Date.parse(v.hold_expires_at):0;
  window.openInvitePreview();guestIntro();
  if(GUEST.me){try{guestOwnPlace();}catch(_){}setTimeout(guestClaimedView,0);}
  return true;
}
/* A guest who already has their seat at this table opens the link on their own place, not on the sealed envelope
   (Sk, 26 Nov 2026): "You're on the table, <name>.", with their part of the deposit and its button in view. The back
   end says whose seat it is from the sign-in and the table, so any link of that table does this, not only the one
   they joined through. The envelope is opened by the build's own key for it, with its picture never shown; a guest
   who has not joined gets the envelope as always. */
function guestOwnPlace(){
  const R=document.getElementById('ipv');if(!R)return;
  const stage=R.querySelector('.ip-stage'),env=R.querySelector('.ip-env'),sc=R.querySelector('.ip-scroll');
  if(stage)stage.style.display='none';
  if(env)env.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  R.classList.remove('sealed');R.classList.add('open');
  guestClaimedView();
  let touched=false;['touchmove','wheel','pointerdown'].forEach(k=>R.addEventListener(k,()=>{touched=true;},{passive:true,capture:true}));
  const put=()=>{const c=R.querySelector('.ip-claim');if(touched||!R.isConnected||!sc||!c)return;
    const top=Math.max(0,Math.round(sc.scrollTop+c.getBoundingClientRect().top-sc.getBoundingClientRect().top+20));
    try{sc.scrollTo({top:top,behavior:'instant'});}catch(_){sc.scrollTop=top;}};
  put();[60,400,1200,2500,4500,7000].forEach(ms=>setTimeout(put,ms));   /* again as the parts above it arrive */
}
/* what the back end now says about this link and my seat */
async function guestRefresh(){
  if(!GUEST)return;const v=await BUBL.link({token:GUEST.token});if(!v.ok)return;
  GUEST.view=v;GUEST.seat=v.your_seat||GUEST.seat;S.holdUntil=v.hold_expires_at?Date.parse(v.hold_expires_at):0;
  GDEP.paid=!!(GUEST.seat&&(GUEST.seat.card||(GUEST.seat.share_minor>0&&GUEST.seat.paid_minor>=GUEST.seat.share_minor)));
  if(v.your_seat&&['confirmed','arrived','seated'].includes(v.booking_state)&&!(GUEST.booking&&GUEST.booking.entry_token)){const me=await BUBL.me();if(me.ok)GUEST.booking=(me.bookings||[]).find(b=>b.table.key===v.table.key&&b.my_seat&&b.my_seat.seat_no===v.your_seat.seat_no)||null;}
  ipDepRender();ipWaitRender();guestIntro();
}
setInterval(()=>{if(GUEST&&GUEST.me&&!document.hidden&&document.querySelector('.ip-dep'))guestRefresh();},6000);

/* the claim form: Sk's first step, then his code step, then the seat is taken for real */
function wireFormLive(I,ip){
  const q=ip.q,R=ip.R;
  if(!window.GUEST){const c=q('.ip-claim');if(c)c.style.display='none';return;}   /* the host previewing: nothing to claim */
  if(GUEST.view.status==='full'&&!GUEST.me){q('.ip-s1').hidden=true;q('.ip-claim .ip-why').textContent=LINK_SAYS.full;return;}
  const e1=q('.ip-e1'),say=(m,el)=>{e1.textContent=m;if(el){el.classList.add('bad');el.focus();}};
  q('.ip-tel').addEventListener('input',e=>{e.target.classList.remove('bad');e1.textContent='';});
  q('.ip-name').addEventListener('input',e=>{e.target.classList.remove('bad');e1.textContent='';});
  q('.ip-em').addEventListener('input',e=>{e.target.classList.remove('bad');e1.textContent='';emFit(e.target);});
  setTimeout(()=>{if(R.isConnected)emFit(q('.ip-em'));},400);
  ccWire(q('.ip-cc'),q('.ip-tel'));
  let busy=false;
  q('.ip-s1').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;
    const nm=q('.ip-name').value.trim().replace(/\s+/g,' '),em=q('.ip-em').value.trim(),ph=BUBL.phone.parse(q('.ip-tel').value,q('.ip-cc').value);
    if(nm.length<2){e1.innerHTML=`Add your name so <em>${esc(I.first)}</em> knows who's coming.`;q('.ip-name').classList.add('bad');q('.ip-name').focus();return;}
    if(nameCheck(nm)==='blocked')return say(NAME_BLOCKED,q('.ip-name'));
    if(!emailOk(em))return say('Add your email. Your confirmation and receipt go there.',q('.ip-em'));
    if(!ph.ok)return say(ph.reason,q('.ip-tel'));
    busy=true;const b=q('.ip-send');b.disabled=true;b.textContent='Sending';
    const s2=q('.ip-s2');
    /* the second step is Sk's code screen; its button reads "Claim my spot" */
    const ui={show:on=>{q('.ip-s1').hidden=on;s2.hidden=!on;if(on)s2.innerHTML='<div class="ip-code"></div><button class="ip-btn ip-verify" type="button" disabled>Claim my spot</button>';},
      get codeBox(){return s2.querySelector('.ip-code');},get verifyBtn(){return s2.querySelector('.ip-verify');}};
    const already=await BUBL.auth.phone();
    if(already!==ph.e164)ui.show(true);
    const who=await provePhoneFor(ph.e164,ui);
    const back=()=>{busy=false;b.disabled=false;b.textContent='Send code';s2.hidden=true;q('.ip-s1').hidden=false;};
    if(!R.isConnected)return;
    if(who===false){back();q('.ip-tel').focus();return;}
    if(who&&who.ok===false){back();return say(who.reason,q('.ip-tel'));}
    const r=await BUBL.join({token:GUEST.token,details:{full_name:nm,email:em}});
    if(!R.isConnected)return;
    if(!r.ok){back();return say(r.field==='full_name'?NAME_BLOCKED:(LINK_SAYS[r.code]||r.reason),r.field==='full_name'?q('.ip-name'):r.field==='email'?q('.ip-em'):null);}
    const me=await BUBL.me();GUEST.me=(me.ok&&me.guest?me.guest.full_name:nm).split(' ')[0];
    GUEST.bookingId=r.booking_id;GUEST.seat={seat_no:r.seat_no,share_minor:r.share_minor,paid_minor:r.paid_minor,card:null,requested_minor:null};
    await guestRefresh();ip.named(GUEST.me);guestClaimedView();
  });
}
/* A long email address is written a little smaller so that all of it is seen in its box, rather than cut off at the
   box's right edge (Sk, 26 Nov 2026: "the email is clipped on the right"). The box itself does not change. */
function emFit(el){
  if(!el)return;el.style.fontSize='';if(!el.value||!el.clientWidth)return;
  for(let px=16;px>=12&&el.scrollWidth>el.clientWidth;px--)el.style.fontSize=px+'px';
}
/* the code part alone (the join call saves the guest's details itself) → true: proven; false: "use a different number"; {ok:false}: could not send */
async function provePhoneFor(e164,ui){
  if((await BUBL.auth.phone())===e164)return true;
  const sent=await BUBL.auth.sendCode(e164);if(!sent.ok)return sent;
  return new Promise(res=>{const step=codeStep(ui.codeBox,{phone:e164,verifyBtn:ui.verifyBtn,onVerified:()=>res(true),onChangeNumber:()=>res(false)});step.sent();});
}
/* "You're on the table, Layla." */
function guestClaimedView(){
  const R=document.getElementById('ipv');if(!R||!GUEST||!GUEST.me)return;const q=s=>R.querySelector(s),host=esc((GUEST.view.host_name||'').split(' ').slice(0,2).join(' '));
  window.__ipClaimed=true;window.__ipName=GUEST.me;R.querySelectorAll('.ip-claimbtn').forEach(b=>b.remove());
  const cb=q('.ip-close2');if(cb)cb.textContent='Continue';
  q('.ip-dh').textContent=`You're on the table, ${GUEST.me}.`;q('.ip-dp').innerHTML=`<em>${host}</em> can see you're coming.`;
  /* the claim form's own line, not the first ".ip-why" on the page: that one is now the intro under the logo, and
     hiding it left the form's line showing above "You're on the table" (Sk, 26 Nov 2026) */
  q('.ip-ch').style.display='none';R.querySelectorAll('.ip-claim .ip-why').forEach(p=>{p.style.display='none';});q('.ip-s1').hidden=true;q('.ip-s2').hidden=true;q('.ip-done').hidden=false;
  if(!q('.ip-dep'))q('.ip-done').insertAdjacentHTML('beforeend','<div class="ip-dep"></div>');
  /* the list "At the table" now has me on it */
  const first=host,joined=guestsButMe(GUEST.view),party=Math.max(2,GUEST.view.party_size||2);
  const rows=[[first,'Host','on']].concat(joined.map(n=>[esc(n),'Confirmed','on']),[[esc(GUEST.me),'Confirmed','you on']]);
  let h='';rows.forEach(([n,s,c],i)=>{h+=`<div class="ip-g"><i class="${c}"></i><b${i===0?' class="host"':''}>${n}</b><span>${s}</span></div>`;});
  for(let i=rows.length;i<party;i++)h+='<div class="ip-g"><i></i><b class="muted">Open place</b><span></span></div>';
  q('.ip-guests').innerHTML=h;q('.ip-count').textContent=`${rows.length} of ${party} confirmed`;
  ipDepRender();guestIntro();guestUpdatesButton(R);
}
/* The booking fee is shown wherever the guest's share is (Sk, 26 Nov 2026), and only ever as the back end's own
   figure: the page works no fee out. Without one from the back end, nothing is said of a fee here; the card step
   shows it, as it always has. */
function feeOk(f){return Number.isSafeInteger(f)&&f>0;}
/* my part of the deposit, from the back end's own figures */
function ipDepRenderLive(box){
  if(!GUEST||!GUEST.seat){box.innerHTML='';return;}
  const s=GUEST.seat,v=GUEST.view,host=esc((v.host_name||'').split(' ')[0]||'Your host'),owes=Math.max(0,s.share_minor-s.paid_minor),paid=!!s.card||(s.share_minor>0&&s.paid_minor>=s.share_minor);
  const ok=['confirmed','arrived','seated'].includes(v.booking_state),tok=GUEST.booking&&GUEST.booking.entry_token;
  const qr=tok?`<div class="hn-qrc ipd-qr">${BUBL.qr.tile(BUBL.qr.payload('seat',tok))}<div><b>Your entry QR</b><p>Tap it to fill the screen at the door. Bring your ID.</p></div></div>`:'';
  if(s.requested_minor!=null&&!paid)   /* the host changed the split: a higher amount is only ever taken with the guest's own yes (Sk, 17 Nov 2026) */
    box.innerHTML=`<div class="ipd"><small>Your part of the deposit</small><b>${AED(s.requested_minor)}</b><span>${host} changed the split. Your part was ${AED(s.share_minor)}. It only changes if you accept.</span><button type="button" class="ip-btn ipd-yes">Accept ${AED(s.requested_minor)}</button><button type="button" class="ip-link ipd-no">Keep ${AED(s.share_minor)}</button></div>`;
  else if(paid)box.innerHTML=`<div class="ipd ok"><b>Your part is ${s.card==='charged'?'paid':'held'}</b><span>${AED(s.share_minor)} toward the table's deposit. ${s.card==='charged'?'Your spot is locked.':'Your card is held, not charged, until the table is secured.'}</span>${qr}</div>`;
  else if(owes>0)box.innerHTML=`<div class="ipd"><small>Your part of the deposit</small><b>${AED(owes)}</b>${feeOk(s.fee_minor)?`<span>Plus a ${AED(s.fee_minor)} booking fee.</span>`:''}<span class="ipd-t" id="ipdT">Due in ${hms(holdLeft())}, or the spot is released</span><button type="button" class="ip-btn ipd-go">Pay your part</button></div>`;
  else if(ok)box.innerHTML=`<div class="ipd ok"><b>${host} covered the deposit</b><span>Nothing for you to pay. Your spot is locked.</span>${qr}</div>`;
  else if(v.own_link)box.innerHTML=`<div class="ipd soft"><small>Your part of the deposit</small><b>Not split yet</b><span>${host} hasn’t split the table’s deposit yet. Your part shows up right here, on this invite, the moment they do.</span></div>`;
  else box.innerHTML=`<div class="ipd soft"><small>Your part of the deposit</small><b>Nothing to pay</b><span>${host} sent you an invite link: you join free. Your entry QR appears here once the table is confirmed.</span></div>`;
}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('.ipd-yes,.ipd-no');if(!b||!LIVE||!GUEST||!GUEST.booking&&!GUEST.view)return;
  const id=(GUEST.booking&&GUEST.booking.booking_id)||GUEST.bookingId;if(!id)return;b.disabled=true;
  const r=await BUBL.answerAmount({booking_id:id,accept:b.classList.contains('ipd-yes')});if(!r.ok)toast(r.reason);await guestRefresh();});
async function ipPayPartLive(){
  if(!GUEST||!GUEST.seat)return;const id=(GUEST.booking&&GUEST.booking.booking_id)||GUEST.bookingId;if(!id)return;
  const r=await BUBL.pay({booking_id:id});
  if(!r.ok){if(r.code!=='nothing_owed')toast(r.reason);await guestRefresh();return;}
  openPayLive(r,{title:'Your part of the deposit',sub:`${GUEST.view.table.name}, ${S.ev.short}`,held:true,onDone:()=>guestRefresh(),onCancel:()=>guestRefresh()});
}

/* ---- the first screen: who invites, to which table, and this guest's part (Sk, 25 Nov 2026) ----
   Under the venue's logo, in the invitation's own words and type. The host and the table are the back end's; the part
   is the back end's figure for this link's next seat, or for my own seat once I have one. No figure from the back
   end, or a part of nothing: no word about a part (a nought is never shown). */
function guestIntro(){
  const R=document.getElementById('ipv');if(!R||!GUEST||!GUEST.view)return;const v=GUEST.view,brand=R.querySelector('.ip-brand');if(!brand)return;
  const host=esc((v.host_name||'').trim().split(/\s+/)[0]||''),table=v.table&&v.table.name?esc(v.table.name):'';
  const part=GUEST.seat?GUEST.seat.share_minor:v.amount_minor;
  let h=host&&table?`<em>${host}</em> invites you to ${table}.`:host?`<em>${host}</em> invites you.`:table?`You are invited to ${table}.`:'';
  const fee=GUEST.seat?GUEST.seat.fee_minor:v.fee_minor;   /* BUBL's fee on that part: the back end's own figure, or no word of a fee */
  if(Number.isSafeInteger(part)&&part>0)h+=` Your part of the deposit is ${AED(part)}${feeOk(fee)?`, plus a ${AED(fee)} booking fee`:''}.`;
  let box=R.querySelector('.ip-intro');
  if(!h){if(box)box.remove();return;}
  if(!box){box=document.createElement('div');box.className='ip-hw ip-intro';box.innerHTML='<p class="ip-why"></p>';brand.insertAdjacentElement('afterend',box);}
  const p=box.firstChild;if(p.innerHTML!==h)p.innerHTML=h;
}

/* ---- the country box follows the number (Sk, 25 Nov 2026) ----
   A number written with its country code (+44…, 0044…) says which country it is: the box beside it shows that country,
   picked from its own list, or added to it when the list does not have it. A code that is no country's (the studio's
   simulated +999 numbers) shows a plain "+", never a country the number is not from. Once the number no longer starts
   with a code, the box goes back to what the guest had chosen. Choosing a country by hand keeps the rest of the number. */
function ccRead(text){
  const t=String(text||'').trim().replace(/^00/,'+');if(t.charAt(0)!=='+')return null;
  let code='',country=null,rest='';try{const a=new libphonenumber.AsYouType();a.input(t);code=a.getCallingCode()||'';country=a.getCountry()||null;rest=a.getNationalNumber()||'';}catch(_){}
  return {code,country,rest,digits:t.replace(/\D/g,'')};
}
function ccFollow(cc,tel){
  if(!cc||!tel)return;const n=ccRead(tel.value),own=()=>{if(cc.__own&&cc.__own.isConnected&&!cc.__own.selected){cc.__own.remove();cc.__own=null;}};
  if(!n){if(cc.__was!=null){cc.value=cc.__was;cc.__was=null;if(cc.selectedIndex<0)cc.selectedIndex=0;}own();return;}
  if(!n.code&&n.digits.length<4)return;   /* a country code is one to three digits: too early to say */
  if(cc.__was==null)cc.__was=cc.value;
  const listed=n.code?[...cc.options].find(o=>o!==cc.__own&&o.value===n.code):null;
  if(listed){cc.value=n.code;own();return;}
  if(!cc.__own||!cc.__own.isConnected){cc.__own=document.createElement('option');cc.appendChild(cc.__own);}
  const flag=n.country&&/^[A-Z]{2}$/.test(n.country)?String.fromCodePoint(...[...n.country].map(c=>0x1F1E6+c.charCodeAt(0)-65))+' ':'';
  cc.__own.value=n.code;cc.__own.textContent=n.code?flag+'+'+n.code:'+';cc.__own.selected=true;
}
/* A whole number bubl already knows (the invitation's form, opened from the chat) is put in the two boxes the way the
   build shows a number: its country in the box, the rest of it in the number box (Sk, 26 Nov 2026: "the country box
   shows '+' alone, the full number is in the second box"). A number that is no country's (the studio's simulated +999
   numbers) shows its own first three digits in the box, "+999", and the rest beside it: the two together are always
   the number itself. → true when the number was put in. */
function ccPut(cc,tel,number){
  const n=ccRead(number);if(!cc||!tel||!n||n.digits.length<5)return false;
  const code=n.code||n.digits.slice(0,3),rest=n.code&&n.rest?n.rest:n.digits.slice(code.length);
  const listed=[...cc.options].find(o=>o!==cc.__own&&o.value===code);
  if(listed){cc.value=code;if(cc.__own&&cc.__own.isConnected){cc.__own.remove();cc.__own=null;}}
  else{if(!cc.__own||!cc.__own.isConnected){cc.__own=document.createElement('option');cc.appendChild(cc.__own);}
    const flag=n.code&&n.country&&/^[A-Z]{2}$/.test(n.country)?String.fromCodePoint(...[...n.country].map(c=>0x1F1E6+c.charCodeAt(0)-65))+' ':'';
    cc.__own.value=code;cc.__own.textContent=flag+'+'+code;cc.__own.selected=true;}
  cc.__was=null;tel.value=rest;tel.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
}
function ccWire(cc,tel){
  if(!cc||!tel)return;
  tel.addEventListener('input',()=>ccFollow(cc,tel));
  cc.addEventListener('change',()=>{const n=ccRead(tel.value);cc.__was=null;
    if(n)tel.value=n.code?n.rest:n.digits;   /* the guest chose the country themselves: the number keeps its own part */
    if(cc.__own&&!cc.__own.selected){cc.__own.remove();cc.__own=null;}});
  ccFollow(cc,tel);
}

/* ---- "Get updates on WhatsApp", once a friend has their seat (Sk, 25 Nov 2026) ----
   A guest who writes to bubl first may be written back to (WhatsApp's 24-hour rule). The button opens WhatsApp on
   bubl's own number, which only the back end knows, with the message ready to send. No number (the line is not
   connected), or no table name to put in the message: no button. */
let _bublLine=null;
function bublLine(){
  return _bublLine||(_bublLine=BUBL.call('concierge-hooks','web/line',{}).then(r=>r&&r.ok&&typeof r.number==='string'&&/^[0-9]{6,20}$/.test(r.number)?r.number:null,()=>null)
    .then(n=>{if(!n)_bublLine=null;return n;}));
}
function guestUpdatesButton(R){
  const table=GUEST&&GUEST.view&&GUEST.view.table&&GUEST.view.table.name;if(!R||!table||R.querySelector('.ip-wa')||R.__waAsked)return;
  R.__waAsked=true;
  bublLine().then(n=>{R.__waAsked=false;
    const row=R.querySelector('.ip-done .ip-row');if(!n||!row||!R.isConnected||R.querySelector('.ip-wa'))return;
    row.insertAdjacentHTML('afterend','<div class="ip-row" style="margin-top:10px"><button class="ip-btn ip-wa" type="button">Get updates on WhatsApp</button></div>');
    R.querySelector('.ip-wa').addEventListener('click',()=>{try{window.open('https://wa.me/'+n+'?text='+encodeURIComponent('Keep me posted on '+table),'_blank');}catch(_){}toast('Opening WhatsApp');});
  });
}

/* ---- "Tables booked" is not shown at 0% (Sk, 25 Nov 2026) ----
   On the invitation and on the page, in test and live mode: the figure is real, and it is shown as soon as it is more
   than nought. A row left with nothing in it is not shown either. */
if(LIVE){
  const nightAsBuilt=window.fillIpNight;
  window.fillIpNight=function(el){
    /* "Your night starts in" counts to the night's doors, as the back end gives them (Sk, 26 Nov 2026). The build
       counts to the arrive-by time (22:00 on a night whose doors are 20:00), and at nought says "Doors are open". */
    const whenAsBuilt=window.arrivalAt,doors=S.ev&&S.ev.doorsAt;let r;
    if(typeof whenAsBuilt==='function'&&Number.isFinite(doors))window.arrivalAt=()=>new Date(doors);
    try{r=nightAsBuilt.apply(this,arguments);}finally{window.arrivalAt=whenAsBuilt;}
    try{const box=el.querySelector('.ipn-stats');
      if(box){[...box.children].forEach(d=>{const b=d.querySelector('b'),l=d.querySelector('span');if(b&&l&&l.textContent==='Tables booked'&&b.textContent.trim()==='0%')d.style.display='none';});
        if([...box.children].every(d=>d.style.display==='none'))box.style.display='none';}}catch(_){}
    return r;
  };
  const statsAsBuilt=window.refreshRoomStats;
  window.refreshRoomStats=function(){
    const r=statsAsBuilt.apply(this,arguments);
    try{const w=$('#roomStats'),b=$('#rsTaken');
      if(w&&b){b.parentNode.style.display=b.textContent.trim()==='0%'?'none':'';
        if(!w.hidden&&[...w.querySelectorAll('.rs')].every(x=>getComputedStyle(x).display==='none'))w.hidden=true;}}catch(_){}
    return r;
  };
}
