/* The login code step, for test and live mode: "Enter the code we texted to …", six boxes, a new code after 30 seconds.
   It is Sk's own code screen from the invitation (same markup, same styles, same behaviour), made usable anywhere a
   phone has to be proven: holding a table, joining a link, buying a ticket.
   What is gone is the simulation: no message drops down inside the page with the code in it and nothing fills the
   boxes by itself. A real text arrives, and the phone's own keyboard offers the code. */
function codeStep(box,o){   /* o: { phone:'+971…', onVerified(), onChangeNumber(), verifyBtn (optional: an existing button to use) } */
  box.innerHTML=`<p class="ip-sent">Enter the code we texted to <b class="ip-to">${esc(BUBL.phone.pretty(o.phone))}</b>.</p>
<button class="ip-link ip-chg" type="button">Use a different number</button>
<div class="ip-otp"><input inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="Digit 1"><input inputmode="numeric" maxlength="1" aria-label="Digit 2"><input inputmode="numeric" maxlength="1" aria-label="Digit 3"><input inputmode="numeric" maxlength="1" aria-label="Digit 4"><input inputmode="numeric" maxlength="1" aria-label="Digit 5"><input inputmode="numeric" maxlength="1" aria-label="Digit 6"></div>
<p class="ip-err ip-e2" role="alert"></p><p class="ip-resend"></p>`;
  const q=s=>box.querySelector(s),boxes=[...box.querySelectorAll('.ip-otp input')],btn=o.verifyBtn,val=()=>boxes.map(b=>b.value).join('');
  let left=0,resendT=null,busy=false,gone=false;
  const sync=()=>{if(btn)btn.disabled=busy||val().length!==6;};
  const setOtp=s=>{s=s.replace(/\D/g,'').slice(0,6);boxes.forEach((b,i)=>b.value=s[i]||'');sync();};
  const clearOtp=()=>{boxes.forEach(b=>b.value='');q('.ip-otp').classList.remove('bad');q('.ip-e2').textContent='';sync();};
  const bad=msg=>{const ot=q('.ip-otp');ot.classList.remove('shake');void ot.offsetWidth;ot.classList.add('bad','shake');q('.ip-e2').textContent=msg;};
  const tick=()=>{const r=q('.ip-resend');if(!r||gone)return clearInterval(resendT);
    if(left>0){r.textContent=`You can request a new code in 0:${String(left).padStart(2,'0')}`;left--;}
    else{clearInterval(resendT);r.innerHTML='';const b=document.createElement('button');b.type='button';b.className='ip-link';b.textContent='Text me a new code';b.onclick=()=>{clearOtp();send();};r.appendChild(b);}};
  const count=()=>{left=30;clearInterval(resendT);tick();resendT=setInterval(tick,1000);};
  async function send(){count();const r=await BUBL.auth.sendCode(o.phone);if(!r.ok&&!gone)q('.ip-e2').textContent=r.reason;}
  async function verify(){const v=val();if(v.length!==6||busy)return;busy=true;sync();const was=btn?btn.textContent:'';if(btn)btn.textContent='Confirming';
    const r=await BUBL.auth.verify(o.phone,v);busy=false;if(gone)return;if(btn)btn.textContent=was;sync();
    if(!r.ok){bad(r.reason);return;}
    stop();o.onVerified();}
  function stop(){gone=true;clearInterval(resendT);if(btn)btn.removeEventListener('click',verify);}
  q('.ip-chg').addEventListener('click',()=>{stop();o.onChangeNumber&&o.onChangeNumber();});
  boxes.forEach((b,i)=>{
    b.addEventListener('input',()=>{const v=b.value.replace(/\D/g,'');q('.ip-otp').classList.remove('bad');q('.ip-e2').textContent='';
      if(v.length>1){setOtp(v);boxes[Math.min(5,v.length-1)].focus();if(v.length>=6&&btn)btn.focus();return;}
      b.value=v;if(v&&i<5)boxes[i+1].focus();sync();if(val().length===6&&btn)btn.focus();});
    b.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!b.value&&i>0){boxes[i-1].focus();boxes[i-1].value='';sync();e.preventDefault();}if(e.key==='Enter'){e.preventDefault();verify();}});
    b.addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData).getData('text');if(t){e.preventDefault();setOtp(t);}});
    b.addEventListener('focus',()=>b.select());});
  if(btn)btn.addEventListener('click',verify);
  sync();count();setTimeout(()=>{if(!gone)boxes[0].focus({preventScroll:true});},60);
  return {stop,verify,sent:count};
}

/* Proves a phone and makes sure it has a guest record: the one gate in front of holding, joining and buying.
   → { ok:true, guest } or { ok:false, code, reason, field } (a refusal to show on the form), or null if the guest went back.
   ui: { codeBox (where the code step is drawn), show(codeIsShowing), verifyBtn } */
async function provePhone(details,ui){   /* details: { name, phone:'+971…', email } */
  const already=await BUBL.auth.phone();
  if(already!==details.phone){
    const sent=await BUBL.auth.sendCode(details.phone);
    if(!sent.ok)return Object.assign({field:'phone'},sent);
    const ok=await new Promise(res=>{ui.show(true);const step=codeStep(ui.codeBox,{phone:details.phone,verifyBtn:ui.verifyBtn,onVerified:()=>res(true),onChangeNumber:()=>res(false)});ui.cancel=()=>{step.stop();res(false);};});
    ui.show(false);ui.codeBox.innerHTML='';
    if(!ok)return null;
  }
  /* the guest's own name and email, once: BUBL's server makes the real name check */
  return BUBL.signUp({full_name:details.name,email:details.email});
}
