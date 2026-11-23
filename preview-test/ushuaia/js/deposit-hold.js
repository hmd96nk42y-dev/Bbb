/* ---- how long the table is held before it's released, unless the deposit is in ---- */
function depSecured(){if(LIVE)return !!HN.confirmed;if(DEP.how==='links')return ppSecured();const p=spPeople();return DEP.sent&&p.every((_,i)=>DEP.paid[i]);}
function depLeftAmt(){if(LIVE||DEP.how==='links')return ppUnpaid();const tot=depTotal();return spPeople().reduce((a,_,i)=>a+(DEP.paid[i]?0:Math.round(tot*DEP.shares[i]/100)),0);}
/* when the deposit is all in: the table is confirmed, the QR unlocks, the message goes out */
function depCheck(){if(LIVE)return;   /* live: the back end confirms the table; the page hears it in hostSync (live-host.js) */
  if(HN.confirmed||!depSecured())return;HN.confirmed=true;DEP.open=false;depHold();
  setTimeout(()=>hostTransition(()=>{becomeHost();}),400);
  setTimeout(()=>{const t=T(S.boothId);if(!t)return;$('#smsLine').textContent='Deposit received. Your table at Ushua\u00efa is confirmed. Your entry QR code is in this message.';
    $('#confSumm').textContent=`${t.name}, ${S.ev.short}, ${fmtD(dOf(S.date))}, arrive by ${S.time}, ref ${hostCode()}`;try{showSmsBanner();}catch(_){}},1700);}
function depHold(){hnTabs();const el=$('#depHold');if(!el||!S.bookedAt)return;if(depSecured()){el.className='dep-hold ok';el.textContent='Table confirmed';return;}
  if(lateBooking()&&!DEP.sent){el.className='dep-hold late';el.textContent='Pay now to confirm';return;}const left=holdLeft();el.className='dep-hold'+(left<3600?' late':'');el.textContent=left>0?`${hms(left)} to secure your table`:'Hold expired';}
setInterval(()=>{if(document.body.classList.contains('booked'))depHold();},1000);
