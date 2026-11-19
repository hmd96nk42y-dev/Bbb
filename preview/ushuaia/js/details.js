/* ---- details before paying: name and mobile, in the same sheet style ---- */
function openDetails(o){const sc=ce('div','pay-scrim'),sh=ce('div','pay-sheet');
  sh.innerHTML=`<div class="pay-grip"></div><div class="pay-hd"><span>${LIVE?esc(PAGE.venue.name):'Ushua\u00efa Dubai Harbour'}</span><button type="button" class="pay-x" aria-label="Close">\u2715</button></div>
<div class="pay-amt"><small>${esc(o.title)}</small><b>Your details</b><span>${esc(o.sub||'')}</span></div>
<p class="id-note"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="5.6" cy="7.4" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.4 11c.5-1.1 1.3-1.6 2.2-1.6s1.7.5 2.2 1.6M9.6 6.6h3M9.6 9h2.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg><span>Your name must match your ID at the door, or entry isn&#39;t guaranteed.</span></p><input class="pay-in" id="tdName" autocomplete="name" placeholder="Full name as on your ID" value="${esc(o.name||'')}">
<div class="pay-row td-row"><select class="pay-in" id="tdCc"><option>+971</option><option>+966</option><option>+974</option><option>+965</option><option>+44</option><option>+1</option></select><input class="pay-in" id="tdTel" inputmode="tel" autocomplete="tel-national" placeholder="50 123 4567" value="${esc(o.phone||'')}"></div>
<input class="pay-in" id="tdEm" type="email" autocomplete="email" autocapitalize="off" placeholder="Email" value="${esc(o.email||'')}">
<p class="pay-err" hidden>Add your full name, a mobile number and your email.</p>
<button type="button" class="pay-go td-go">Continue to payment</button>
${LIVE?'':'<p class="pay-fine">Your tickets and entry QR go to this number, and the receipt to your email.</p>'}`;   /* live: no message is sent yet (messaging is step 11), so the page does not say one is */
  document.body.appendChild(sc);document.body.appendChild(sh);requestAnimationFrame(()=>{sc.classList.add('on');sh.classList.add('on');});
  ['click','pointerdown','pointerup','touchstart','touchend'].forEach(ev=>{sh.addEventListener(ev,e=>e.stopPropagation());sc.addEventListener(ev,e=>e.stopPropagation());});
  const shut=()=>{if(sh.__ui&&sh.__ui.cancel)sh.__ui.cancel();sc.classList.remove('on');sh.classList.remove('on');setTimeout(()=>{sc.remove();sh.remove();},420);};
  sc.addEventListener('click',shut);setTimeout(()=>{const n=sh.querySelector('#tdName');if(n&&!n.value)n.focus();},350);
  sh.addEventListener('input',()=>{const er=sh.querySelector('.pay-err');if(er)er.hidden=true;});
  sh.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('pay-x'))return shut();
    if(b.classList.contains('td-go')){if(LIVE)return detailsGoLive(sh,o,shut);   /* live: the real checks, the login code and the kept place (live-tickets.js) */
      const nm=sh.querySelector('#tdName').value.trim(),tel=sh.querySelector('#tdTel').value.replace(/\D/g,'');
      const em=sh.querySelector('#tdEm').value.trim(),er=sh.querySelector('.pay-err');
      if(nm.length>=2&&nameCheck(nm)==='blocked'){er.textContent=NAME_BLOCKED;er.hidden=false;return;}
      if(nm.length<2||tel.length<7||!emailOk(em)){er.textContent='Add your full name, a mobile number and your email.';er.hidden=false;return;}
      shut();setTimeout(()=>o.onDone&&o.onDone(nm,sh.querySelector('#tdCc').value+' '+tel),300);}});}
window.openDetails=openDetails;
