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
  window.openInvitePreview();
  if(GUEST.me)setTimeout(guestClaimedView,0);
  return true;
}
/* what the back end now says about this link and my seat */
async function guestRefresh(){
  if(!GUEST)return;const v=await BUBL.link({token:GUEST.token});if(!v.ok)return;
  GUEST.view=v;GUEST.seat=v.your_seat||GUEST.seat;S.holdUntil=v.hold_expires_at?Date.parse(v.hold_expires_at):0;
  GDEP.paid=!!(GUEST.seat&&(GUEST.seat.card||(GUEST.seat.share_minor>0&&GUEST.seat.paid_minor>=GUEST.seat.share_minor)));
  if(v.your_seat&&['confirmed','arrived','seated'].includes(v.booking_state)&&!(GUEST.booking&&GUEST.booking.entry_token)){const me=await BUBL.me();if(me.ok)GUEST.booking=(me.bookings||[]).find(b=>b.table.key===v.table.key&&b.my_seat&&b.my_seat.seat_no===v.your_seat.seat_no)||null;}
  ipDepRender();ipWaitRender();
}
setInterval(()=>{if(GUEST&&GUEST.me&&!document.hidden&&document.querySelector('.ip-dep'))guestRefresh();},6000);

/* the claim form: Sk's first step, then his code step, then the seat is taken for real */
function wireFormLive(I,ip){
  const q=ip.q,R=ip.R;
  if(!window.GUEST){const c=q('.ip-claim');if(c)c.style.display='none';return;}   /* the host previewing: nothing to claim */
  if(GUEST.view.status==='full'&&!GUEST.me){q('.ip-s1').hidden=true;q('.ip-why').textContent=LINK_SAYS.full;return;}
  const e1=q('.ip-e1'),say=(m,el)=>{e1.textContent=m;if(el){el.classList.add('bad');el.focus();}};
  q('.ip-tel').addEventListener('input',e=>{e.target.classList.remove('bad');e1.textContent='';});
  q('.ip-name').addEventListener('input',e=>{e.target.classList.remove('bad');e1.textContent='';});
  q('.ip-em').addEventListener('input',e=>{e.target.classList.remove('bad');e1.textContent='';});
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
  q('.ip-ch').style.display='none';q('.ip-why').style.display='none';q('.ip-s1').hidden=true;q('.ip-s2').hidden=true;q('.ip-done').hidden=false;
  if(!q('.ip-dep'))q('.ip-done').insertAdjacentHTML('beforeend','<div class="ip-dep"></div>');
  /* the list "At the table" now has me on it */
  const first=host,joined=guestsButMe(GUEST.view),party=Math.max(2,GUEST.view.party_size||2);
  const rows=[[first,'Host','on']].concat(joined.map(n=>[esc(n),'Confirmed','on']),[[esc(GUEST.me),'Confirmed','you on']]);
  let h='';rows.forEach(([n,s,c],i)=>{h+=`<div class="ip-g"><i class="${c}"></i><b${i===0?' class="host"':''}>${n}</b><span>${s}</span></div>`;});
  for(let i=rows.length;i<party;i++)h+='<div class="ip-g"><i></i><b class="muted">Open place</b><span></span></div>';
  q('.ip-guests').innerHTML=h;q('.ip-count').textContent=`${rows.length} of ${party} confirmed`;
  ipDepRender();
}
/* my part of the deposit, from the back end's own figures */
function ipDepRenderLive(box){
  if(!GUEST||!GUEST.seat){box.innerHTML='';return;}
  const s=GUEST.seat,v=GUEST.view,host=esc((v.host_name||'').split(' ')[0]||'Your host'),owes=Math.max(0,s.share_minor-s.paid_minor),paid=!!s.card||(s.share_minor>0&&s.paid_minor>=s.share_minor);
  const ok=['confirmed','arrived','seated'].includes(v.booking_state),tok=GUEST.booking&&GUEST.booking.entry_token;
  const qr=tok?`<div class="hn-qrc ipd-qr">${BUBL.qr.tile(BUBL.qr.payload('seat',tok))}<div><b>Your entry QR</b><p>Tap it to fill the screen at the door. Bring your ID.</p></div></div>`:'';
  if(s.requested_minor!=null&&!paid)   /* the host changed the split: a higher amount is only ever taken with the guest's own yes (Sk, 17 Nov 2026) */
    box.innerHTML=`<div class="ipd"><small>Your part of the deposit</small><b>${AED(s.requested_minor)}</b><span>${host} changed the split. Your part was ${AED(s.share_minor)}. It only changes if you accept.</span><button type="button" class="ip-btn ipd-yes">Accept ${AED(s.requested_minor)}</button><button type="button" class="ip-link ipd-no">Keep ${AED(s.share_minor)}</button></div>`;
  else if(paid)box.innerHTML=`<div class="ipd ok"><b>Your part is ${s.card==='charged'?'paid':'held'}</b><span>${AED(s.share_minor)} toward the table's deposit. ${s.card==='charged'?'Your spot is locked.':'Your card is held, not charged, until the table is secured.'}</span>${qr}</div>`;
  else if(owes>0)box.innerHTML=`<div class="ipd"><small>Your part of the deposit</small><b>${AED(owes)}</b><span class="ipd-t" id="ipdT">Due in ${hms(holdLeft())}, or the spot is released</span><button type="button" class="ip-btn ipd-go">Pay your part</button></div>`;
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
