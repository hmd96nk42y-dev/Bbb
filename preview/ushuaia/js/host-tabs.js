/* ---- tap a QR and it fills the screen, for the door ---- */
document.addEventListener('click',e=>{const q_=e.target.closest&&e.target.closest('.hn-qr,.tk-qr');if(!q_)return;
  const o=ce('div','qr-full',`<div class="qr-box">${q_.outerHTML}</div><p class="qr-ref">${esc((q_.closest('.hn-qrc')&&q_.closest('.hn-qrc').querySelector('.hn-code')||{}).textContent||'')}</p><p class="qr-tip">Turn your brightness up. Tap anywhere to close.</p>`);
  document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add('on'));o.addEventListener('click',()=>{o.classList.remove('on');setTimeout(()=>o.remove(),300);});});

/* ---- deposit and decisions are tabs: close either to a slim bar, close both and they become Manage booking ---- */
function hnTabs(){const d=$('#tabDep'),c=$('#tabDec'),mb=$('#hnMB');if(!d||!c||!mb)return;const both=!HN.depOpen&&!HN.decOpen;
  d.classList.toggle('shut',!HN.depOpen);c.classList.toggle('shut',!HN.decOpen);d.hidden=both;c.hidden=both;mb.hidden=!both;
  const bt=$('#depBarTxt');if(bt)bt.textContent=depSecured()?`${AED(depTotal())} secured`:DEP.how==='links'?`${DEP.links.filter(l=>l.on).length} links live`:(DEP.sent?'On every invite':lateBooking()?'Pay now to confirm':'Not split yet');}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#hostBlock .hn-x,#hostBlock .hn-bar,#hostBlock .hn-mb');if(!b)return;
  if(b.classList.contains('hn-mb')){HN.depOpen=true;HN.decOpen=true;}
  else{const k=b.dataset.tab==='dep'?'depOpen':'decOpen';HN[k]=!b.classList.contains('hn-x');}
  hnTabs();});
