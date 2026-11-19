/* ================= hold → guest details ================= */
let _pending=null;
function openGinfo(t){
  _pending=t;$('#ginfoHed').textContent=`${t.req?'Request':'Hold'} ${t.name}`;
  $('#ginfoSum').innerHTML=`<span>${esc(S.ev.short)}, ${S.party} guests, arrive by ${S.time}</span><b>${t.req?'On request':AED(minFor(t,S.party))+' min'}</b>`;
  $('#ginfoName').value=S.vip?(S.guestName||''):'';$('#ginfoPhone').value=S.vip?(S.guestPhone||''):'';$('#ginfoEmail').value=S.vip?(S.guestEmail||''):'';$('#ginfoErr').textContent='Add your name, number and email, and accept the terms.';$('#ginfoTc').checked=false;window.__setTc&&window.__setTc(false);
  ['#ginfoName','#ginfoPhone','#ginfoEmail'].forEach(s=>$(s).classList.remove('err'));$('#ginfoErr').classList.remove('show');
  $('#ginfoModal').classList.add('show');setTimeout(()=>$('#ginfoName').focus(),200);
}
$('#ginfoModal').addEventListener('click',e=>{if(e.target.id==='ginfoModal'){if(LIVE)ginfoShut();$('#ginfoModal').classList.remove('show');_pending=null;}});
$('#ginfoCta').addEventListener('click',()=>{
  if(LIVE){liveHoldCta();return;}   /* test and live: the real thing (live-hold.js) */
  const n=$('#ginfoName').value.trim().replace(/\s+/g,' '),p=$('#ginfoPhone').value.trim(),em=$('#ginfoEmail').value.trim(),tc=$('#ginfoTc').checked,nv=nameCheck(n),eok=emailOk(em);
  $('#ginfoName').classList.toggle('err',!n||nv==='blocked');$('#ginfoPhone').classList.toggle('err',!p);$('#ginfoEmail').classList.toggle('err',!eok);
  if(n&&nv==='blocked'){$('#ginfoErr').textContent=NAME_BLOCKED;$('#ginfoErr').classList.add('show');return;}
  if(!n||!p||!eok||!tc){$('#ginfoErr').textContent=em&&!eok?'Check your email address.':'Add your name, number and email, and accept the terms.';$('#ginfoErr').classList.add('show');return;}
  if(S.heldPhone&&S.heldPhone===p.replace(/\D/g,'')&&S.heldDate===S.date&&S.boothId){$('#ginfoErr').textContent='This number already has a table on this night. Change your table instead.';$('#ginfoErr').classList.add('show');return;}
  S.guestName=n;S.guestPhone=p;S.guestEmail=em;S.heldPhone=p.replace(/\D/g,'');S.heldDate=S.date;const t=_pending;_pending=null;$('#ginfoModal').classList.remove('show');if(t)book(t);
});
function book(t){
  S.boothId=t.id;S.bookMin=minFor(t,S.party);S.pick=null;S.autoConfirmed=false;S.view=null;
  dollPost({cmd:'book',id:t.id});flash();renderRoom();
  $('#selSum').classList.add('show');$('#selName').textContent=t.name;$('#selMeta').textContent=t.req?`requested for ${S.ev.short}, the team confirms the minimum`:`held for ${S.ev.short}, ${AED(S.bookMin)} minimum`;
  showMinSpend();showInvite(t);if(window.lcShowPrivileges)window.lcShowPrivileges();renderInterested();
  toast(t.req?`${t.name} requested. The team will confirm it with you.`:`${t.name} is held for you. Pay the deposit to confirm it and unlock your entry QR.`);
  setTimeout(()=>hostTransition(becomeHost),260);
  if(typeof sxAfterBook==='function')sxAfterBook(t);
}
$('#selChg').addEventListener('click',()=>{
  if(!window.__chgOK){requestChange();return;}window.__chgOK=false;
  unbecomeHost();S.boothId=null;S.pick=null;S.view=null;dollPost({cmd:'book',id:null});dollPost({cmd:'clear'});
  $('#selSum').classList.remove('show');$('#minSpend').hidden=true;hideInvite();renderRoom();renderInterested();updateBasket();
  setTimeout(()=>{const a=$('#app');a.scrollTo({top:$('#roomCanvas').offsetTop-100,behavior:'smooth'})},80);
});
