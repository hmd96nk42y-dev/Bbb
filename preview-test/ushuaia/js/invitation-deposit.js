/* ---- the guest's side: their part of the deposit sits on the same invitation, once the host has split it ---- */
const GDEP={paid:false};
function ipDepAmount(){if(LIVE)return window.GUEST&&GUEST.seat?Math.max(0,GUEST.seat.share_minor-GUEST.seat.paid_minor):0;const t=T(S.boothId);if(!t||!DEP.sent||DEP.how==='host')return 0;if(DEP.how==='links'){const l=DEP.links.find(x=>x.on&&x.amt);return l?l.amt:0;}const p=spPeople(),tot=depTotal(),i=Math.min(p.length-1,1);return Math.round(tot*((DEP.shares[i]!=null?DEP.shares[i]:100/p.length))/100);}
function ipGuestCode(){return 'US-'+String(h32((S.boothId||'')+(window.__ipName||'guest')+(S.date||''))%900000+100000);}
function ipHost(){const n=(S.guestName||'').trim().split(' ')[0];return n?esc(n):'Your host';}
function ipDepRender(){const box=document.querySelector('.ip-dep');if(!box)return;if(LIVE){ipDepRenderLive(box);return;}const amt=ipDepAmount(),left=holdLeft(),code=ipGuestCode();
  const qr=`<div class="hn-qrc ipd-qr">${hostQR(code)}<div><b>Your entry QR</b><p>Tap it to fill the screen at the door. Bring your ID.</p><span class="hn-code">${code}</span></div></div>`;
  box.innerHTML=GDEP.paid?`<div class="ipd ok"><b>Your part is paid</b><span>${AED(amt)} toward the table's deposit. Your spot is locked.</span>${qr}</div>`
  :DEP.sent&&DEP.how==='host'?`<div class="ipd ok"><b>${ipHost()} covered the deposit</b><span>Nothing for you to pay. Your spot is locked.</span>${qr}</div>`
  :!DEP.sent?`<div class="ipd soft"><small>Your part of the deposit</small><b>Not split yet</b><span>${ipHost()} hasn’t split the table’s deposit yet. Your part shows up right here, on this invite, the moment they do.</span></div>`
  :`<div class="ipd"><small>Your part of the deposit</small><b>${AED(amt)}</b><span class="ipd-t" id="ipdT">Due in ${hms(left)}, or the spot is released</span><button type="button" class="ip-btn ipd-go">Pay your part</button></div>`;}
function ipScrollTo(el){const sc=document.querySelector('.ip-scroll');if(sc&&el)sc.scrollTo({top:Math.max(0,el.offsetTop-80),behavior:'smooth'});}
function ipPayPart(){if(LIVE){ipPayPartLive();return;}const amt=ipDepAmount(),t=T(S.boothId);if(!amt)return;
  openPay({amount:amt,fee:guestFee(amt),held:true,title:'Your part of the deposit',sub:t?`${t.name}, ${S.ev.short}`:'',
    onDone:()=>{GDEP.paid=true;ipDepRender();ipWaitRender();document.querySelectorAll('.ip-vote').forEach(v=>v.classList.remove('locked'));const cb=document.querySelector('.ip-close2');if(cb)cb.textContent='Vote with the table';setTimeout(()=>ipScrollTo(document.querySelector('.ip-dep')),120);},
    onCancel:()=>{ipWaitRender();const sc=document.querySelector('.ip-scroll');if(sc){sc.scrollTop=0;sc.scrollTo({top:0,behavior:'auto'});}}});}
/* the guest can vote once they've claimed their spot and their part is settled (paid, covered, or not asked for yet) */
window.ipVotesOpen=()=>!!window.__ipClaimed&&(!!GDEP.paid||ipDepAmount()===0)&&offered('votes');
/* claimed but not paid: the invitation says so up top, with the way to pay */
function ipWaitRender(){const sc=document.querySelector('.ip-scroll');if(!sc)return;const f=sc.querySelector('.ip-venue')||sc.querySelector('.ip-facts');if(!f)return;let w=document.querySelector('.ipg-wait');
  if(!window.__ipClaimed||GDEP.paid||!ipDepAmount()){if(w)w.remove();return;}
  if(!w){w=document.createElement('div');w.className='ipg-wait';f.insertAdjacentElement('beforebegin',w);}
  w.innerHTML=`<div><b>Waiting for your deposit</b><span>You're on the table, ${esc(window.__ipName||'')}. Pay ${AED(ipDepAmount())} to lock your spot${offered('votes')?' and vote with the table':''}.</span><em id="ipwT">Due in ${hms(holdLeft())}</em></div><button type="button" class="ipw-go">Pay your part</button>`;}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.ipw-go'))ipPayPart();});
setInterval(()=>{const el=document.getElementById('ipwT');if(el)el.textContent='Due in '+hms(holdLeft());},1000);
/* "Continue" after claiming: pay your part if there's one to pay, otherwise go and vote */
window.ipGuestNext=function(){if(LIVE&&ipDepAmount()<=0){document.querySelector('.ip-x')&&document.querySelector('.ip-x').click();return;}if(!GDEP.paid&&ipDepAmount()>0){ipScrollTo(document.querySelector('.ip-dep'));setTimeout(ipPayPart,250);}else ipScrollTo(document.querySelector('.ip-vote'));};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.ipd-go,.ipd-vote');if(!b)return;if(b.classList.contains('ipd-vote'))ipScrollTo(document.querySelector('.ip-vote'));else ipPayPart();});
setInterval(()=>{const el=document.getElementById('ipdT');if(el)el.textContent=`Due in ${hms(holdLeft())}, or the spot is released`;},1000);
window.ipDepRender=ipDepRender;
