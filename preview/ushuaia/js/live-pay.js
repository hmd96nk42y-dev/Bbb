/* The card step, for real (test and live mode).
   Sk's pay sheet is kept: the venue's name, what is being paid, the amount, "Your card is held, not charged, until
   the table is secured", and the Hold button. Three things differ from the build, each because the build's version
   could not be real:
     - the amount, the booking fee and the total are the back end's own figures (the phone works none of them out);
     - the card number is typed into the payment processor's own secure field, which sits where the build drew its
       card boxes (a page may not handle card numbers itself);
     - the saved "VISA 4417" card and the Apple Pay button are not shown: there is no saved card, and Apple Pay needs
       a registered address. Both come back when they are real (DECISIONS question 56).
   The card is HELD, not charged; the back end charges every share at once when the whole deposit is secured. */
let stripeJs=null;
function loadStripe(){return stripeJs||(stripeJs=new Promise((res,rej)=>{if(window.Stripe)return res();const s=document.createElement('script');s.src='https://js.stripe.com/v3/';s.onload=()=>res();s.onerror=()=>{stripeJs=null;rej(new Error('offline'));};document.head.appendChild(s);}));}
/* r: what …/payments/pay (or pay-now, pay-public) answered. o: { title, sub, held, onDone, onCancel } */
function openPayLive(r,o){
  const sc=ce('div','pay-scrim'),sh=ce('div','pay-sheet');sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Payment');
  const part=r.share_minor!=null?r.share_minor:(r.offer_minor!=null?r.offer_minor:r.amount_minor-(r.fee_minor||0)),fee=r.fee_minor||0,total=r.amount_minor,cur=r.currency||CUR,M=n=>BUBL.money.fmt(n,cur);
  sh.innerHTML=`<div class="pay-grip"></div><div class="pay-hd"><span>${esc(PAGE.venue.name)}</span><button type="button" class="pay-x" aria-label="Close">✕</button></div>
<div class="pay-amt"><small>${esc(o.title)}</small><b>${M(total)}</b><span>${esc(o.sub||'')}</span>${fee?`<span class="pay-fee">${M(part)} + ${M(fee)} booking fee</span>`:''}</div>${o.held?`<p class="pay-held"><i></i>${esc(r.notice||'Your card is held, not charged, until the table is secured.')}</p>`:''}
<div class="pay-form"><div class="pay-in" id="payEl" style="padding-top:15px"></div><p class="pay-err" hidden></p></div>
<button type="button" class="pay-go" disabled>${o.held?'Hold':'Pay'} ${M(total)}</button>
<p class="pay-fine">Payments are encrypted end to end. Your card details are never stored on this device.</p>`;
  document.body.appendChild(sc);document.body.appendChild(sh);requestAnimationFrame(()=>{sc.classList.add('on');sh.classList.add('on');});
  let busy=false,done=false,confirm=null;const err=sh.querySelector('.pay-err'),go=sh.querySelector('.pay-go');
  const say=m=>{err.textContent=m;err.hidden=!m;};
  const shut=paid=>{sc.classList.remove('on');sh.classList.remove('on');setTimeout(()=>{sc.remove();sh.remove();if(!paid&&o.onCancel)o.onCancel();},420);};
  const success=()=>{done=true;sh.innerHTML=`<div class="pay-ok"><div class="pay-tick"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none"/><path d="M15 27l7 7 15-16" fill="none"/></svg></div><b>${o.held?'Held':'Paid'} ${M(total)}</b><span>${o.held?(o.heldNote||'Charged only once the table is secured.'):'Thank you.'}</span></div>`;
    setTimeout(()=>{shut(true);o.onDone&&o.onDone();},1300);};
  sc.addEventListener('click',e=>{e.stopPropagation();if(!busy)shut();});
  ['click','pointerdown','pointerup','touchstart','touchend'].forEach(ev=>{sh.addEventListener(ev,e=>e.stopPropagation());sc.addEventListener(ev,e=>e.stopPropagation());});
  sh.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t||busy||done)return;
    if(t.classList.contains('pay-x'))return shut();
    if(t.classList.contains('pay-go')&&confirm){busy=true;say('');t.classList.add('busy');const was=t.textContent;t.innerHTML='<i class="pay-spin"></i>Processing';
      const problem=await confirm();
      if(problem){busy=false;t.classList.remove('busy');t.textContent=was;return say(problem);}
      /* the processor has answered: the back end looks for itself, the phone's word is not taken */
      let st=null;for(let i=0;i<8&&!st;i++){const x=await BUBL.payRefresh({payment_id:r.payment_id});if(x.ok&&(x.card==='held'||x.card==='charged'))st=x;else await new Promise(z=>setTimeout(z,900));}
      busy=false;if(st)return success();
      t.classList.remove('busy');t.textContent=was;say('Your bank has not confirmed yet. Give it a moment, then try again.');}});
  /* the processor's own card field */
  const c=r.client||{};
  if(c.processor==='stripe'){
    loadStripe().then(()=>{const stripe=window.Stripe(c.publishableKey),card=stripe.elements().create('card',{hidePostalCode:true,style:{base:{color:'#fff',fontSize:'16px',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif','::placeholder':{color:'rgba(255,255,255,.4)'},iconColor:'#fff'},invalid:{color:'#ff6a60',iconColor:'#ff6a60'}}});
      card.mount(sh.querySelector('#payEl'));card.on('change',ev=>{go.disabled=!ev.complete;say(ev.error?ev.error.message:'');});
      confirm=async()=>{const x=await stripe.confirmCardPayment(c.clientSecret,{payment_method:{card}});return x.error?(x.error.message||'Your card was not accepted.'):null;};
    }).catch(()=>say('The card form could not load. Check your connection and try again.'));
  }else say('The card form for this venue is not connected yet.');
}
