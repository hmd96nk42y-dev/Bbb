/* ---- custom split, by price point: each row is one link with an amount per guest and how many guests pay it.
   AED 0 makes it an invite link. Whatever no link covers is "left to assign", for the host to cover ---- */
const PPC=['#FF2D55','#00E5FF','#B026FF','#FF4FD8','#2F7BFF','#FF8FB1'];
const PP_NAMES=['Layla','Omar','Sofia','Karim','Nadia','Rami','Hana','Yousef','Maya','Zaid','Lina','Tarek','Dana','Faris','Rania','Adam'];
function ppSeats(){if(LIVE)return MINE.view?MINE.view.links.reduce((a,l)=>a+(l.main?l.open_seats:l.seats),0):0;   /* live: the seats nobody has taken through the booking's own link */
  const t=T(S.boothId);return Math.max(0,(S.party||(t&&t.cap)||4)-1-((S.guests||[]).length-(DEP.lg||0)));}
function ppUsedSeats(skip){return DEP.links.reduce((a,l,i)=>a+(i===skip?0:l.n),0);}
function ppAssigned(){return DEP.links.reduce((a,l)=>a+l.amt*l.n,0);}
function ppLeft(){if(LIVE)return MINE.view?Math.max(0,MINE.view.booking.left_to_assign_minor+(MINE.owes||0)-DEP.links.reduce((a,l)=>a+(l.on?0:l.amt*l.n),0)):0;   /* live: what the back end says is left, less the rows not confirmed yet */
  return Math.max(0,depTotal()-ppAssigned());}
function ppStep(){const t=depTotal()/UNIT;return (t>=20000?500:t>=5000?250:100)*UNIT;}
function ppEnsure(){if(!DEP.links.length){const seats=ppSeats(),each=seats?Math.floor(depTotal()/(seats+1)/ppStep())*ppStep():0,a=seats>1?Math.ceil(seats/2):seats;DEP.links=[{amt:each,n:a,on:false,id:'',gs:[],remind:false}];if(seats-a>0)DEP.links.push({amt:0,n:seats-a,on:false,id:'',gs:[],remind:false});}}
/* room for one more price point: a free seat, or a seat taken from a row that isn't live yet */
function ppCanAdd(){return ppUsedSeats()<ppSeats()||DEP.links.some(l=>!l.on&&l.n>1);}
function ppUrl(l){return LIVE?inviteUrl(l.id):`bubl.app/ushuaia-dxb/${l.id}`;}   /* live: the real address of that link */
function ppTitle(l){return l.amt?`${AED(l.amt)} each`:'Invite link';}
function ppRowHTML(l,i){const col=PPC[i%PPC.length],paid=l.gs.some(g=>g.st==='paid'),free=ppSeats()-ppUsedSeats(i),maxAmt=Math.floor((LIVE?ppLeft()+l.amt*l.n:depTotal()-ppAssigned()+l.amt*l.n)/Math.max(1,l.n));
  const amt=`<div class="pp-amt"><b>${AED(l.amt)}<small>each</small></b><em>Invite link</em></div>`;
  if(!l.on)return `<div class="pp-row${l.amt?'':' inv'}" data-i="${i}"><i style="background:${col};color:${col}"></i>${amt}
<button type="button" class="sp-b pp-am" data-pp="amt" data-i="${i}" data-d="-1"${l.amt<=0?' disabled':''} aria-label="Less">−</button><button type="button" class="sp-b pp-ap" data-pp="amt" data-i="${i}" data-d="1"${l.amt+ppStep()>maxAmt?' disabled':''} aria-label="More">+</button>
<span class="pp-cnt">${l.n} ${l.n===1?'guest':'guests'}${l.amt?`, ${AED(l.amt*l.n)} in all`:', nothing to pay'}</span>
<button type="button" class="sp-b pp-cm" data-pp="n" data-i="${i}" data-d="-1"${l.n<=1?' disabled':''} aria-label="Fewer guests">−</button><button type="button" class="sp-b pp-cp" data-pp="n" data-i="${i}" data-d="1"${free<=0||(l.amt&&(l.n+1)*l.amt>(LIVE?ppLeft()+l.amt*l.n:depTotal()-ppAssigned()+l.amt*l.n))?' disabled':''} aria-label="More guests">+</button>
<div class="pp-ft"><span>${l.amt?'Each guest holds their own card':'Guests join free and add their details'}</span><button type="button" class="pp-ok" data-pp="ok" data-i="${i}"${l.n<1?' disabled':''}>Confirm</button></div></div>`;
  return `<div class="pp-row${l.amt?'':' inv'}" data-i="${i}"><i style="background:${col};color:${col}"></i>${amt}<span></span><span></span>
<span class="pp-cnt">${l.gs.filter(g=>g.st!=='pending').length} of ${l.n} opened${l.amt?`, ${l.gs.filter(g=>g.st==='paid').length} held`:''}${paid?' · amount fixed':''}</span><span></span><span></span>
<div class="pp-lk"><span>${ppUrl(l)}</span><button type="button" class="pri" data-pp="copy" data-i="${i}">Copy</button><button type="button" data-pp="share" data-i="${i}">Share</button></div></div>`;}
function ppLeftHTML(){const left=ppLeft();return `<div class="pp-left${left?'':' zero'}"><span>${left?'Left to assign, you cover it':'Every dirham is on a link'}</span><b>${AED(left)}</b></div>`;}
function ppRender(){const tot=depTotal(),seats=ppSeats();
  $('#dsSub').textContent=`${AED(tot)} across ${seats} guest ${seats===1?'seat':'seats'} and you. One link per price, not per person.`;
  const canAdd=ppCanAdd();
  $('#dsBody').innerHTML=`<div class="sp ds pp"><div class="sp-hd"><b>Price points</b></div>
<div class="pp-list">${DEP.links.map(ppRowHTML).join('')}</div>${ppLeftHTML()}
${canAdd?'<button type="button" class="pp-add" data-pp="add">+ Add a price point</button>':''}
<p class="pp-note">Lower a price to AED 0 and it becomes an invite link. Every guest adds their own name, number and email through their link, and their card is held, not charged, until the table is secured. A split share carries a ${RULES.guestFeePct}% booking fee.</p>
<div class="sp-ft"><button type="button" class="sp-even" data-pp="close">Close</button><button type="button" class="sp-send" data-pp="done">Done</button></div></div>`;}
function ppMorph(i){const r=document.querySelector(`#dsBody .pp-row[data-i="${i}"]`);if(r){r.classList.remove('morph');void r.offsetWidth;r.classList.add('morph');}}
function ppAct(b){const i=+b.dataset.i,l=DEP.links[i],k=b.dataset.pp,st=ppStep();
  if(LIVE&&(k==='ok'||k==='copy'||k==='share')){ppActLive(b,l,k);return;}
  if(k==='amt'&&l&&!l.on){const was=l.amt;l.amt=Math.max(0,l.amt+(+b.dataset.d)*st);if(LIVE){const over=DEP.links.reduce((a,x)=>a+(x.on?0:x.amt*x.n),0)-(MINE.view.booking.left_to_assign_minor+(MINE.owes||0));if(over>0)l.amt=Math.max(0,Math.floor((l.amt*l.n-over)/l.n/st)*st);}
    else{const room=depTotal()-ppAssigned()+l.amt*l.n-was*0;if(ppAssigned()>depTotal())l.amt=Math.max(0,Math.floor((depTotal()-ppAssigned()+l.amt*l.n)/l.n/st)*st);}
    const row=document.querySelector(`#dsBody .pp-row[data-i="${i}"]`);if(row&&(was===0)!==(l.amt===0)){row.classList.toggle('inv',l.amt===0);ppMorph(i);setTimeout(ppRender,560);return;}}
  else if(k==='n'&&l&&!l.on){l.n=Math.max(1,Math.min(ppSeats()-ppUsedSeats(i),l.n+(+b.dataset.d)));}
  else if(k==='ok'&&l&&!l.on){l.on=true;l.id=Math.random().toString(36).slice(2,8);DEP.sent=true;DEP.how='links';ppSimulate(l);copyLink(ppUrl(l));
    toast(l.amt?`Link for ${AED(l.amt)} each is live and copied. Send it to the ${l.n} ${l.n===1?'guest':'guests'} paying that.`:`Invite link is live and copied. ${l.n} ${l.n===1?'guest joins':'guests join'} free.`);depRender();depHold();}
  else if(k==='add'){let free=ppSeats()-ppUsedSeats();if(free<=0){const donor=DEP.links.filter(l=>!l.on&&l.n>1).sort((a,b)=>b.n-a.n)[0];if(!donor){toast('Every guest seat is already on a link.');return;}donor.n--;free=1;}DEP.links.push({amt:0,n:free,on:false,id:'',gs:[],remind:false});}
  else if(k==='copy'&&l){copyLink(ppUrl(l));toast('Link copied');return;}
  else if(k==='share'&&l){const u='https://'+ppUrl(l);if(navigator.share)navigator.share({title:'Join my table',text:l.amt?`Join my table at Ushuaïa. Your part is ${AED(l.amt)}.`:'Join my table at Ushuaïa.',url:u}).catch(()=>{});else{copyLink(ppUrl(l));toast('Link copied');}return;}
  else if(k==='close'){DEP.links=DEP.links.filter(x=>x.on);if(!DEP.links.length&&DEP.how==='links'){DEP.how='';DEP.sent=false;}closeSheet(true);depRender();depHold();return;}
  else if(k==='done'){DEP.links=DEP.links.filter(x=>x.on);if(!DEP.links.length&&DEP.how==='links'){DEP.how='';DEP.sent=false;}closeSheet(true);depRender();depHold();return;}
  ppRender();}
function copyLink(u){try{navigator.clipboard&&navigator.clipboard.writeText('https://'+u);}catch(_){}}
/* who has opened, confirmed (details in) and paid through each link */
function ppSimulate(l){if(LIVE)return;   /* live: nobody is simulated */
  const now=Date.now(),used=new Set([].concat(...DEP.links.map(x=>x.gs.map(g=>g.n))));for(let k=0;k<l.n;k++){let j=h32(l.id+k)%PP_NAMES.length;while(used.has(PP_NAMES[j])&&used.size<PP_NAMES.length)j=(j+1)%PP_NAMES.length;const nm=PP_NAMES[j];used.add(nm);l.gs.push({n:nm,st:'pending',at:now+3000+k*2600+Math.random()*4000});}}
setInterval(()=>{if(LIVE)return;if(DEP.how!=='links'||!document.body.classList.contains('booked'))return;const now=Date.now();let ch=false;
  DEP.links.forEach(l=>l.gs.forEach(g=>{if(holdLeft()<=0)return;if(g.st==='pending'&&now>=g.at){g.st='opened';ch=true;}else if(g.st==='opened'&&now>=g.at+2500){g.st='confirmed';ch=true;DEP.lg=(DEP.lg||0)+1;try{const t=T(S.boothId);addGuest(g.n,Math.max(1,(S.party||(t&&t.cap)||4)-1));}catch(_){}}else if(g.st==='confirmed'&&l.amt&&now>=g.at+(l.remind?5000:9000)){g.st='paid';ch=true;toast(`${g.n} paid ${AED(l.amt)}`);}}));
  if(ch){if(!DEP.open||!depSecured())depRender();depHold();depCheck();if($('#depSheet')&&$('#depSheet').classList.contains('show'))ppRender();}},1000);
function ppClaimed(){return DEP.links.reduce((a,l)=>a+l.gs.filter(g=>g.st!=='pending'&&g.st!=='opened').length,0);}
function ppUnpaid(){if(LIVE)return MINE.view?Math.max(0,MINE.view.booking.deposit_minor-MINE.view.booking.paid_minor):0;return DEP.links.reduce((a,l)=>a+l.gs.filter(g=>g.st!=='paid').length*l.amt+(l.n-l.gs.length)*l.amt,0)+(DEP.hostCovered?0:ppLeft());}
function ppSecured(){if(LIVE)return !!HN.confirmed;return DEP.links.length>0&&(DEP.hostCovered||!ppLeft())&&DEP.links.every(l=>l.gs.length>=l.n&&(!l.amt||l.gs.every(g=>g.st==='paid')));}
function ppCard(){const tot=depTotal(),left=ppLeft(),held=DEP.links.reduce((a,l)=>a+l.gs.filter(g=>g.st==='paid').length*l.amt,0)+(DEP.hostCovered?left:0);
  const shares=DEP.links.map(l=>l.amt*l.n/tot*100).concat(left?[left/tot*100]:[]),paid=DEP.links.map(l=>!l.amt||l.gs.every(g=>g.st==='paid')&&l.gs.length>=l.n).concat(left?[!!DEP.hostCovered]:[]);
  const stl={pending:'',opened:'Opened',confirmed:'Confirmed',paid:'Paid'},cls={opened:'',confirmed:'cf',paid:'pd'};
  return `<div class="sp-hd"><b>${AED(tot)}<small> deposit, on ${DEP.links.length} ${DEP.links.length===1?'link':'links'}</small></b></div>
<div class="sp-top">${neonPie(shares,paid)}<div class="sp-mid"><b>${AED(held)}</b><span>held of ${AED(tot)}</span><div class="dep-bar"><i style="width:${tot?Math.round(held/tot*100):0}%"></i></div><span class="dep-clock" id="depClock">${depSecured()?'All in. Table confirmed':holdLeft()>0?'Held on the links, '+hms(holdLeft())+' left':'The hold has run out'}</span></div></div>
<div class="pp-list">${DEP.links.map((l,i)=>{const col=PPC[i%PPC.length],gs=l.gs.filter(g=>g.st!=='pending');return `<div class="pp-row${l.amt?'':' inv'}"><i style="background:${col};color:${col}"></i><div class="pp-amt"><b>${AED(l.amt)}<small>each</small></b><em>Invite link</em></div><span></span><span></span>
<span class="pp-cnt">${gs.filter(g=>g.st!=='opened').length} of ${l.n} confirmed${l.amt?`, ${l.gs.filter(g=>g.st==='paid').length} paid`:''}</span><span></span><span></span>
<div class="pp-gs"><div class="pp-lk"><span>${ppUrl(l)}</span><button type="button" class="pri" data-pp="copy" data-i="${i}">Copy</button><button type="button" data-pp="share" data-i="${i}">Share</button></div>
${gs.map((g,k)=>`<div class="pp-g"><span>${g.st==='opened'?'Seat '+(k+1)+', adding details':esc(g.n)}</span><em class="${cls[g.st]}">${stl[g.st]}</em></div>`).join('')}
${l.amt&&gs.some(g=>g.st==='confirmed')?`<div class="pp-rm"><span>WhatsApp reminders to who confirmed but hasn’t paid</span><button type="button" class="pp-tg${l.remind?' on':''}" data-pp="rm" data-i="${i}" aria-label="WhatsApp reminders"></button></div>`:''}</div></div>`;}).join('')}</div>
${left?`<div class="pp-left${DEP.hostCovered?' zero':''}"><span>${DEP.hostCovered?'Left to assign, covered by you':'Left to assign'}</span><b>${AED(left)}</b></div>${DEP.hostCovered?'':`<button type="button" class="dep-cover" data-pp="cover">Cover what’s left, ${AED(left)}</button>`}`:''}
${depSecured()?'<button type="button" class="dep-hide">Hide</button>':`<div class="sp-ft"><button type="button" class="sp-even dep-reset">Reset</button><button type="button" class="sp-send" data-pp="all">Pay it all, ${AED(ppUnpaid())}</button></div>${ppUsedSeats()<ppSeats()?'<button type="button" class="pp-add" data-pp="more">+ Add a link for the open seats</button>':''}`}`;}
function ppCardAct(b){const i=+b.dataset.i,l=DEP.links[i],k=b.dataset.pp;
  if(LIVE&&k!=='more'){if(k==='copy'||k==='share')ppActLive(b,l,k);else depActLive(b);return;}
  if(k==='copy'||k==='share'){ppAct(b);return;}
  if(k==='rm'&&l){l.remind=!l.remind;toast(l.remind?'WhatsApp reminders on for this link. They stop once each guest pays.':'WhatsApp reminders off');}
  else if(k==='cover'){const left=ppLeft();openPay({amount:left,held:true,title:'Left to assign',sub:`${T(S.boothId).name}, ${S.ev.short}`,onDone:()=>{DEP.hostCovered=true;depRender();depHold();depCheck();}});return;}
  else if(k==='all'){const all=ppUnpaid();openPay({amount:all,held:true,title:'Everything still unpaid',sub:`${T(S.boothId).name}, ${S.ev.short}`,onDone:()=>{DEP.hostCovered=true;DEP.links.forEach(x=>{while(x.gs.length<x.n)x.gs.push({n:'Open seat',st:'pending',at:Infinity});x.gs.forEach(g=>{if(g.st!=='paid'&&x.amt)g.st='paid';});x.amt&&(x.coveredByHost=true);});depRender();depHold();depCheck();}});return;}
  else if(k==='more'){ppEnsureMore();ppRender();openSheet($('#depSheet'));return;}
  depRender();}
function ppEnsureMore(){const free=ppSeats()-ppUsedSeats();if(free>0&&!DEP.links.some(x=>!x.on))DEP.links.push({amt:0,n:free,on:false,id:'',gs:[],remind:false});}
/* Reset: every card hold is cancelled straight away and the links close. Guests who joined keep their seat and are asked to accept their new amount. The table's hold does not restart. */
function depReset(){if(LIVE){depActLive({classList:{contains:c=>c==='dep-reset'},dataset:{}});return;}const joined=DEP.how==='links'?DEP.links.reduce((a,l)=>a+l.gs.filter(g=>g.st!=='pending').length,0):spPeople().filter((n,i)=>i>0&&n.indexOf('Seat ')!==0).length;
  Object.assign(DEP,{shares:[],sent:false,how:'',paid:{},due:{},links:[],hostCovered:false,remind:false,lg:0});depRender();depHold();
  toast(joined?`Split reset. Every card hold is cancelled. The ${joined} ${joined===1?'guest who joined keeps their seat':'guests who joined keep their seats'} and accept their new amount.`:'Split reset. Every card hold is cancelled.');}

/* custom split: the whole pie opens over the page; nothing changes on the invites until it's applied */
const DS={shares:[],mode:'aed'};
function openDepSplit(){if(lateBooking())return;if(LIVE){if(!MINE.view)return;if(MINE.view.booking.paid_minor>0){toast('Reset the split first. Cards already held are released straight away.');return;}ppEnsure();ppRender();openSheet($('#depSheet'));return;}try{gTimers.forEach(clearTimeout);gTimers=[];}catch(_){}depEnsure();if(DEP.sent&&DEP.how!=='links'&&Object.keys(DEP.paid).some(k=>DEP.paid[k])){toast('Reset the split first. Cards already held are released straight away.');return;}ppEnsure();ppRender();openSheet($('#depSheet'));}
function dsRender(){const ppl=spPeople(),tot=depTotal(),aed=DS.mode==='aed',lock=DEP.sent?DEP.paid:{};
  $('#dsSub').textContent=`${AED(tot)} across ${ppl.length} seats. Each guest sees their part on the invite.`;
  $('#dsBody').innerHTML=`<div class="sp ds"><div class="sp-hd"><b>Who pays what</b><div class="sp-mode"><button type="button" data-xm="pct" class="${aed?'':'on'}">%</button><button type="button" data-xm="aed" class="${aed?'on':''}">AED</button></div></div>
<div class="sp-top">${neonPie(DS.shares)}<div class="sp-mid"><b>${AED(tot)}</b><span>Tap − or + on a seat. Your part takes up the difference.</span></div></div>
<div class="sp-list">${ppl.map((nm,i)=>{const v=DS.shares[i],a=Math.round(tot*v/100),lk=!!lock[i];return `<div class="sp-row"><i style="background:${SPC[i%SPC.length]};color:${SPC[i%SPC.length]}"></i><span class="sp-n">${esc(nm)}${i===0?'<small>takes up the difference</small>':lk?'<small>paid, stays as is</small>':''}</span>
<button type="button" class="sp-b" data-xi="${i}" data-xd="-1"${i===0||lk?' disabled':''} aria-label="Less">−</button><span class="sp-v">${aed?AED(a):Math.round(v)+'%'}<small>${aed?Math.round(v)+'%':AED(a)}</small></span><button type="button" class="sp-b" data-xi="${i}" data-xd="1"${i===0||lk?' disabled':''} aria-label="More">+</button></div>`;}).join('')}</div>
<div class="sp-ft"><button type="button" class="sp-even ds-even">Split evenly</button><button type="button" class="sp-send ds-go">Put it on every invite</button></div></div>`;}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#depSheet .sp button');if(!b)return;if(b.dataset.pp){ppAct(b);return;}const tot=depTotal()||1,lock=DEP.sent?DEP.paid:{};
  if(b.dataset.xm)DS.mode=b.dataset.xm;
  else if(b.dataset.xi!=null)depShift(DS.shares,+b.dataset.xi,DS.mode==='pct'?+b.dataset.xd*5:+b.dataset.xd*100/tot*100,lock);
  else if(b.classList.contains('ds-even'))DS.shares=depEvenOut(DS.shares,lock);
  else if(b.classList.contains('ds-go')){DEP.shares=DS.shares.slice();DEP.mode=DS.mode;const was=DEP.sent;depGoLive(evenArr(DEP.shares)?'even':'custom');closeSheet(true);depRender();depHold();
    toast(was?'Split updated. Every invite shows the new parts.':'Done. Every invite now shows that seat’s part.');return;}
  dsRender();});
setInterval(()=>{if(LIVE)return;if(!document.body.classList.contains('booked'))return;const sig=spPeople().join('|');if(sig!==DEP.sig){const first=!DEP.sig;DEP.sig=sig;if(!first&&!DEP.open&&!depSecured())depRender();}   /* new guests show up on the list as they claim */
  if(!DEP.sent||DEP.how==='host'||DEP.how==='links')return;let ch=false;const now=Date.now();
  Object.keys(DEP.due).forEach(i=>{if(!DEP.paid[i]&&now>=DEP.due[i]&&holdLeft()>0){DEP.paid[i]=true;ch=true;const p=spPeople()[i];if(p)toast(`${p} paid their part`);}});
  spPeople().forEach((n,i)=>{if(i>0&&n.indexOf('Seat ')!==0&&!DEP.paid[i]&&!DEP.due[i])DEP.due[i]=now+5000+Math.random()*8000;});
  if(ch){depRender();depCheck();}else{const c=$('#depClock');if(c&&!depSecured()){const l=holdLeft();c.textContent=l>0?'Paid on the invite, '+hms(l)+' left':'The hold has run out';}}},1000);
