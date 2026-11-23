/* ---- deposit: it rides on the one invite link. One tap splits it across every seat; a custom split sets each seat's part.
   Every guest sees and pays their part on the invite they already have: there is no second link ---- */
const DEP={pct:RULES.depOpts[0],shares:[],sent:false,how:'',paid:{},due:{},mode:'aed',open:false,remind:false,links:[]};
const LINK_IC='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.6 11.4a3.2 3.2 0 0 0 4.5 0l2.6-2.6a3.2 3.2 0 0 0-4.5-4.5l-1 1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M11.4 8.6a3.2 3.2 0 0 0-4.5 0l-2.6 2.6a3.2 3.2 0 0 0 4.5 4.5l1-1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
function depTotal(){return LIVE?(MINE.depositMinor||0):Math.round((S.bookMin||0)*DEP.pct/100);}   /* live: the deposit is the back end's own figure */
function depEnsure(){const p=spPeople();if(DEP.shares.length!==p.length)DEP.shares=p.map(()=>100/p.length);return p;}
function evenArr(a){return !a.length||a.every(v=>Math.abs(v-a[0])<.01);}
/* move one seat's part; the host's own part takes up the difference; seats that have paid stay as they are */
function depShift(sh,i,d,lock){if(i===0||!sh.length||(lock&&lock[i]))return;let nv=Math.max(0,Math.min(100,sh[i]+d)),dl=nv-sh[i];if(sh[0]-dl<0){dl=sh[0];nv=sh[i]+dl;}sh[i]=nv;sh[0]-=dl;}
function depEvenOut(sh,lock){const free=sh.map((_,i)=>!(lock&&lock[i])),fixed=sh.reduce((a,v,i)=>a+(free[i]?0:v),0),nf=free.filter(Boolean).length;return sh.map((v,i)=>free[i]?(100-fixed)/Math.max(1,nf):v);}
function hms(sec){sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),x=sec%60;return `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`;}
function holdLeft(){if(LIVE)return S.holdUntil?(S.holdUntil-Date.now())/1000:0;return S.bookedAt?holdSecs()-(Date.now()-S.bookedAt)/1000:holdSecs();}
function depCollected(){if(LIVE)return MINE.view?MINE.view.booking.paid_minor:0;const tot=depTotal();return spPeople().reduce((a,_,i)=>a+(DEP.paid[i]?Math.round(tot*DEP.shares[i]/100):0),0);}
/* the split goes live on every invite at once; guests who've claimed start paying their parts */
function depGoLive(how){DEP.sent=true;DEP.how=how;DEP.due={};const now=Date.now();spPeople().forEach((n,i)=>{if(i>0&&n.indexOf('Seat ')!==0&&!DEP.paid[i])DEP.due[i]=now+4000+Math.random()*12000;});}
function depRender(){const box=$('#hnDep');if(!box||!S.boothId)return;if(LIVE&&!MINE.view)return;   /* live: drawn once the back end has answered */
  /* once everyone has paid the card folds away; tap it to look again */
  if(depSecured()&&!DEP.open){box.classList.add('folded');box.innerHTML=`<button type="button" class="dep-fold"><span class="dep-ok"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="dep-ft"><b>${AED(depTotal())} secured</b><small>${DEP.how==='host'?'You covered the deposit. Tap to see it.':'Everyone has paid. Tap to see who paid what.'}</small></span><i class="dep-chev">›</i></button>`;return;}
  box.classList.remove('folded');const ppl=depEnsure(),tot=depTotal(),n=ppl.length,host=(S.guestName||'').trim().split(' ')[0];
  if(!DEP.sent){
    const chips=`<div class="dep-chips">${RULES.depOpts.map(p=>`<button type="button" data-dp="${p}" class="${DEP.pct===p?'on':''}">${p===100?'Full minimum':p+'%'}</button>`).join('')}</div>`;
    if(lateBooking()){box.innerHTML=`<div class="sp-hd"><b>${AED(tot)}<small> deposit, ${DEP.pct===100?'the full minimum':DEP.pct+'% of the minimum'}</small></b></div>${chips}
<div class="dep-late"><b>Pay now to confirm</b>It’s past the cut-off, so there’s no hold and no split: the deposit is paid in one go. Your guests join free on your invite link and give their own details there, or at the door.</div>
<button type="button" class="dep-split dep-all"><b>Pay ${AED(tot)} now</b><small>Confirms your table straight away</small></button>`;return;}
    box.innerHTML=`<div class="sp-hd"><b>${AED(tot)}<small> deposit, ${DEP.pct===100?'the full minimum':DEP.pct+'% of the minimum'}</small></b></div>
${chips}
<p class="dep-one"><i>${LINK_IC}</i><span>It goes out on your invite link, so there’s nothing extra to send. Split it and every guest sees their part the moment they open the invite.</span></p>
<button type="button" class="dep-split"><b>Split deposit</b><small>${AED(LIVE?BUBL.money.evenShares(tot,n)[0]:Math.ceil(tot/n))} a seat, across all ${n}, on every invite</small></button>
<div class="dep-alt"><button type="button" class="dep-custom">Custom split</button><button type="button" class="dep-all">Pay it all, ${AED(tot)}</button></div>
<p class="pp-note">Cards are held, not charged, until the whole deposit is in. If the table is released, every hold is cancelled.</p>`;return;}
  if(DEP.how==='links'){box.innerHTML=ppCard();return;}
  const aed=DEP.mode==='aed',col=depCollected(),left=holdLeft(),how=DEP.how==='host'?'you covered it':evenArr(DEP.shares)?`split ${n} ways`:'custom split';
  box.innerHTML=`<div class="sp-hd"><b>${AED(tot)}<small> deposit, ${how}, on every invite</small></b><div class="sp-mode"><button type="button" data-dm="pct" class="${aed?'':'on'}">%</button><button type="button" data-dm="aed" class="${aed?'on':''}">AED</button></div></div>
<div class="sp-top">${neonPie(DEP.shares,DEP.paid)}<div class="sp-mid"><b>${AED(col)}</b><span>secured of ${AED(tot)}</span><div class="dep-bar"><i style="width:${tot?Math.round(col/tot*100):0}%"></i></div><span class="dep-clock${left<=0&&!depSecured()?' x':''}" id="depClock">${depSecured()?'All in. Table confirmed':left>0?'Paid on the invite, '+hms(left)+' left':'The hold has run out'}</span></div></div>
<div class="sp-list">${ppl.map((nm,i)=>{const v=DEP.shares[i],a=LIVE?(DEP.amts[i]||0):Math.round(tot*v/100),pd=!!DEP.paid[i];
  const st=pd?'<span class="dep-st ok">Paid</span>':i===0?'<button type="button" class="dep-pay">Pay my part</button>':nm.indexOf('Seat ')===0?'<span class="dep-st">Open seat</span>':'<span class="dep-st">On their invite</span>';
  return `<div class="sp-row sent"><i style="background:${SPC[i%SPC.length]};color:${SPC[i%SPC.length]}"></i><span class="sp-n">${esc(nm)}</span><span class="sp-v">${aed?AED(a):Math.round(v)+'%'}<small>${aed?Math.round(v)+'%':AED(a)}</small></span>${st}</div>`;}).join('')}</div>
${depSecured()?'<button type="button" class="dep-hide">Hide</button>':`<div class="pp-rm"><span>WhatsApp reminders to guests who confirmed but haven’t paid</span><button type="button" class="pp-tg dep-rm${DEP.remind?' on':''}" aria-label="WhatsApp reminders"></button></div>${DEP.paid[0]?`<button type="button" class="dep-cover">Pay it all, ${AED(depLeftAmt())}</button>`:''}<div class="sp-ft"><button type="button" class="sp-even dep-reset">Reset</button><button type="button" class="sp-send dep-custom">Custom split</button></div>`}`;}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#hnDep button');if(!b)return;const tot=depTotal()||1;if(LIVE&&!b.classList.contains('dep-fold')&&!b.classList.contains('dep-hide')&&!b.dataset.dm&&!b.classList.contains('dep-custom')){depActLive(b);return;}   /* live: every action goes to the back end (live-host.js) */
  if(b.dataset.pp){ppCardAct(b);return;}
  if(b.classList.contains('dep-fold'))DEP.open=true;
  else if(b.classList.contains('dep-hide'))DEP.open=false;
  else if(b.dataset.dm)DEP.mode=b.dataset.dm;
  else if(b.dataset.dp)DEP.pct=+b.dataset.dp;
  else if(b.classList.contains('dep-split')){DEP.shares=depEvenOut(DEP.shares,DEP.paid);depGoLive('even');const n=spPeople().length;
    toast(`Split ${n} ways. Every invite now asks for ${AED(Math.ceil(depTotal()/n))}.`);}
  else if(b.classList.contains('dep-custom')){openDepSplit();return;}
  else if(b.classList.contains('dep-all')){openPay({amount:depTotal(),held:!lateBooking(),title:'The table’s deposit',sub:`${T(S.boothId).name}, ${S.ev.short}`,onDone:()=>{DEP.how='host';DEP.sent=true;spPeople().forEach((_,i)=>{DEP.paid[i]=true;});depRender();depHold();depCheck();}});return;}
  else if(b.classList.contains('dep-pay')){const amt=Math.round(depTotal()*DEP.shares[0]/100);openPay({amount:amt,fee:guestFee(amt),held:true,title:'Your part of the deposit',sub:`${T(S.boothId).name}, ${S.ev.short}`,onDone:()=>{DEP.paid[0]=true;depRender();depHold();depCheck();}});return;}
  else if(b.classList.contains('dep-cover')){const rest=depLeftAmt();openPay({amount:rest,held:true,title:'Everything still unpaid',sub:`${T(S.boothId).name}, ${S.ev.short}`,onDone:()=>{spPeople().forEach((_,i)=>{DEP.paid[i]=true;});depRender();depCheck();}});return;}
  else if(b.classList.contains('dep-rm')){DEP.remind=!DEP.remind;toast(DEP.remind?'WhatsApp reminders on. They stop once each guest pays.':'WhatsApp reminders off');}
  else if(b.classList.contains('dep-reset')){depReset();return;}
  depRender();depHold();});
