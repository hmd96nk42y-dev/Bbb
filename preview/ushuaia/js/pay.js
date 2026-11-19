/* ================= payment terminal · Apple Pay or card, for tickets and deposit shares ================= */
const PAY={cards:[{id:'v4417',brand:'VISA',last:'4417',exp:'09/28'}],sel:'v4417'};
function payFmtCard(v){return v.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ');}
function openPay(o){const host=document.body;const sc=ce('div','pay-scrim'),sh=ce('div','pay-sheet');sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Payment');
  const cardsHtml=()=>PAY.cards.map(c=>`<button type="button" class="pay-card${PAY.sel===c.id?' on':''}" data-c="${c.id}"><span class="pc-brand">${c.brand}</span><span class="pc-num">\u2022\u2022\u2022\u2022 ${c.last}</span><span class="pc-exp">${c.exp}</span><i></i></button>`).join('');
  sh.innerHTML=`<div class="pay-grip"></div><div class="pay-hd"><span>Ushua\u00efa Dubai Harbour</span><button type="button" class="pay-x" aria-label="Close">\u2715</button></div>
<div class="pay-amt"><small>${esc(o.title)}</small><b>${o.fee?AED2(o.amount+o.fee):AED(o.amount)}</b><span>${esc(o.sub||'')}</span>${o.fee?`<span class="pay-fee">${AED(o.amount)} + ${AED2(o.fee)} booking fee</span>`:''}</div>${o.held?'<p class="pay-held"><i></i>Your card is held, not charged, until the table is secured.</p>':''}
<button type="button" class="pay-apple" aria-label="Pay with Apple Pay"><span class="ap">\uF8FF</span><span>Pay</span></button>
<div class="pay-or"><span>or pay with card</span></div>
<div class="pay-cards">${cardsHtml()}</div>
<button type="button" class="pay-addc">+ Add a card</button>
<div class="pay-form" hidden><input class="pay-in" id="pfNum" inputmode="numeric" autocomplete="cc-number" placeholder="Card number"><div class="pay-row"><input class="pay-in" id="pfExp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"><input class="pay-in" id="pfCvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC"></div><input class="pay-in" id="pfName" autocomplete="cc-name" placeholder="Name on card"><p class="pay-err" hidden>Check the card details.</p></div>
<button type="button" class="pay-go">${o.held?'Hold':'Pay'} ${o.fee?AED2(o.amount+o.fee):AED(o.amount)}</button>
<p class="pay-fine">Payments are encrypted end to end. Your card details are never stored on this device.</p>`;
  host.appendChild(sc);host.appendChild(sh);requestAnimationFrame(()=>{sc.classList.add('on');sh.classList.add('on');});
  let busy=false;const shut=(paid)=>{sc.classList.remove('on');sh.classList.remove('on');setTimeout(()=>{sc.remove();sh.remove();if(!paid&&o.onCancel)o.onCancel();},420);};
  const success=(how)=>{sh.innerHTML=`<div class="pay-ok"><div class="pay-tick"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none"/><path d="M15 27l7 7 15-16" fill="none"/></svg></div><b>${o.held?'Held':'Paid'} ${o.fee?AED2(o.amount+o.fee):AED(o.amount)}</b><span>${o.held?how+'. Charged only once the table is secured. The receipt is in your email.':how+'. The receipt is in your email.'}</span></div>`;
    setTimeout(()=>{shut(true);o.onDone&&o.onDone();},1300);};
  sc.addEventListener('click',e=>{e.stopPropagation();if(!busy)shut();});
  ['click','pointerdown','pointerup','touchstart','touchend'].forEach(ev=>{sh.addEventListener(ev,e=>e.stopPropagation());sc.addEventListener(ev,e=>e.stopPropagation());});   /* keep the payment's taps from reaching the page underneath */
  sh.addEventListener('input',e=>{if(e.target.id==='pfNum')e.target.value=payFmtCard(e.target.value);if(e.target.id==='pfExp'){let v=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=v.length>2?v.slice(0,2)+' / '+v.slice(2):v;}if(e.target.id==='pfCvc')e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);});
  sh.addEventListener('click',e=>{const t=e.target.closest('button');if(!t||busy)return;
    if(t.classList.contains('pay-x'))return shut();
    if(t.classList.contains('pay-card')){PAY.sel=t.dataset.c;sh.querySelector('.pay-form').hidden=true;sh.querySelectorAll('.pay-card').forEach(b=>b.classList.toggle('on',b===t));return;}
    if(t.classList.contains('pay-addc')){const f=sh.querySelector('.pay-form');f.hidden=!f.hidden;PAY.sel=f.hidden?PAY.cards[0].id:'new';sh.querySelectorAll('.pay-card').forEach(b=>b.classList.toggle('on',!f.hidden?false:b.dataset.c===PAY.sel));if(!f.hidden)setTimeout(()=>sh.querySelector('#pfNum').focus(),60);return;}
    if(t.classList.contains('pay-apple')){busy=true;const ap=ce('div','ap-sheet',`<div class="ap-top"><span class="ap-l">\uF8FF<b>Pay</b></span><button type="button" class="ap-c">Cancel</button></div>
<div class="ap-row"><span class="ap-card"></span><div><b>Apple Card</b><small>\u2022\u2022\u2022\u2022 1234</small></div></div><div class="ap-row ap-tot"><span>Pay Ushua\u00efa Dubai Harbour</span><b>${AED(o.amount)}</b></div>
<div class="ap-side"><i class="ap-face"></i><span>Confirm with Side Button</span></div>`);sh.appendChild(ap);requestAnimationFrame(()=>ap.classList.add('on'));
      ap.querySelector('.ap-c').addEventListener('click',()=>{ap.classList.remove('on');setTimeout(()=>ap.remove(),300);busy=false;});
      setTimeout(()=>{const s=ap.querySelector('.ap-side');if(s){s.classList.add('scan');s.querySelector('span').textContent='Face ID';}},1500);
      setTimeout(()=>{const s=ap.querySelector('.ap-side');if(s){s.classList.add('done');s.querySelector('span').textContent='Done';}},2400);
      setTimeout(()=>success('Paid with Apple Pay'),3000);return;}
    if(t.classList.contains('pay-go')){if(PAY.sel==='new'){const n=sh.querySelector('#pfNum').value.replace(/\D/g,''),x=sh.querySelector('#pfExp').value.replace(/\D/g,''),c=sh.querySelector('#pfCvc').value;
        if(n.length<15||x.length<4||c.length<3){sh.querySelector('.pay-err').hidden=false;return;}PAY.cards.push({id:'n'+n.slice(-4),brand:n[0]==='5'?'MASTERCARD':n[0]==='3'?'AMEX':'VISA',last:n.slice(-4),exp:x.slice(0,2)+'/'+x.slice(2)});PAY.sel='n'+n.slice(-4);}
      busy=true;t.classList.add('busy');t.innerHTML='<i class="pay-spin"></i>Processing';const cd=PAY.cards.find(c=>c.id===PAY.sel)||PAY.cards[0];setTimeout(()=>success(`Paid with ${cd.brand} \u2022\u2022\u2022\u2022 ${cd.last}`),1500);}});}
window.openPay=openPay;
