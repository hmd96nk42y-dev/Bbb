/* ================= your night · once a table is held, the page becomes the host's: booking, entry QR, and the calls to make ================= */
function hostCode(){if(LIVE)return 'US-'+String(MINE.id||'').replace(/-/g,'').slice(0,6).toUpperCase();   /* live: the booking's own reference */
  return 'US-'+String(h32((S.boothId||'')+(S.date||'')+(S.guestName||''))%900000+100000);}
function hostQR(code){if(LIVE)return MINE.entryToken?BUBL.qr.tile(BUBL.qr.payload('seat',MINE.entryToken)):'';   /* live: a real QR code of the seat's entry token (engine/qr.js) */
  const N=25;let seed=h32(code)>>>0;const R=()=>{seed=(Math.imul(seed^(seed>>>15),2246822507)+1013904223)>>>0;return seed/4294967296;};
  const on=[];for(let y=0;y<N;y++){on.push([]);for(let x=0;x<N;x++)on[y].push(R()>.52);}
  const finder=(fx,fy)=>{for(let y=-1;y<8;y++)for(let x=-1;x<8;x++){const X=fx+x,Y=fy+y;if(X<0||Y<0||X>=N||Y>=N)continue;const r=Math.max(Math.abs(x-3),Math.abs(y-3));on[Y][X]=(r===3||r<=1)&&x>=0&&y>=0&&x<7&&y<7;}};
  finder(0,0);finder(N-7,0);finder(0,N-7);for(let i=8;i<N-8;i++){on[6][i]=i%2===0;on[i][6]=i%2===0;}
  let r='';for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(on[y][x])r+=`<rect x="${x+2}" y="${y+2}" width="1.02" height="1.02"/>`;
  return `<svg class="hn-qr" viewBox="0 0 ${N+4} ${N+4}" role="img" aria-label="Entry QR code"><rect width="${N+4}" height="${N+4}" rx="1.6" fill="#fff"/><g fill="#0a0a0a">${r}</g></svg>`;}
const HN={nudged:false,split:false,remind:true,dj:false,depOpen:true,decOpen:true};
function hnDecisions(){const t=T(S.boothId);if(!t)return '';const joined=((S.guests||[]).length+1),tot=S.party||t.cap,min=S.bookMin||0;
  let lead='',leadN=0,song='',songP=0;try{if(typeof VT!=='undefined'){vtReset();VT_PRE.forEach(n=>{const v=(VT.pre[n]||[]).length;if(v>leadN){leadN=v;lead=n;}});const m=VT_MULT[t.tier]||1;VT.order.forEach(s=>{const p=(VT.song[s]||[]).length*m;if(p>songP){songP=p;song=s;}});}}catch(_){}
  const row=(k,h,sub,btn,on)=>`<div class="hn-row"><div><b>${h}</b><span>${sub}</span></div><button type="button" class="hn-b${on?' on':''}" data-k="${k}">${btn}</button></div>`;
  return row('nudge',`${joined} of ${tot} confirmed`,HN.nudged?'Nudged the rest a minute ago':'The rest haven\u2019t claimed a spot yet',HN.nudged?'Nudged':'Nudge the rest',HN.nudged)
    +row('votes',lead?`${esc(lead)} leads the pre-order`:'No pre-order votes yet',(typeof VT!=='undefined'&&VT.done)?'Locked in for arrival':'The table votes, you lock it in',(typeof VT!=='undefined'&&VT.done)?'Locked':'Review votes',(typeof VT!=='undefined'&&VT.done))
    +row('remind',`Arrival reminder`,HN.remind?`Everyone gets a nudge 90 minutes before ${S.time}`:'Off: guests won\u2019t get a reminder',HN.remind?'On':'Off',HN.remind);}
function invHome(){const inv=$('#invite');if(inv&&HN.invHome&&inv.parentNode!==HN.invHome.p){HN.invHome.p.insertBefore(inv,HN.invHome.n&&HN.invHome.n.parentNode===HN.invHome.p?HN.invHome.n:null);}}
function becomeHost(){const t=T(S.boothId),b=$('#hostBlock');if(!t||!b)return;invHome();document.body.classList.add('booked');b.hidden=false;b.classList.add('on','now');
  const first=(S.guestName||(window.ME&&ME.name)||'Your night').trim(),code=hostCode(),col=GCOL[t.grp]||'#fff';
  const ok=!!HN.confirmed;
  b.innerHTML=`<p class="vp-hello">${ok?'Table confirmed,':'Your night,'}</p><h2 class="vp-name">${esc(first)}</h2>
<div class="vp-card hn-card${ok?' ok':''}" style="--hc:${ok?'#39FF14':col}"><small>Your table <em class="hn-badge${ok?' ok':''}">${ok?'Confirmed':'Held'}</em></small><p class="vp-tier">${esc(t.name)}</p>
<div class="hn-meta"><span>${esc(S.ev.short)}</span><span>${esc(fmtD(dOf(S.date)))}</span><span>Arrive by ${esc(S.time)}</span></div>
<div class="vp-cardf"><span>${t.req?'Minimum on request':AED(S.bookMin)+' minimum'}</span><span>${code}</span></div></div>
${ok?`<div class="hn-qrc">${hostQR(code)}<div><b>Your entry QR</b><p>Tap it to fill the screen at the door. Bring your ID. It\u2019s also in your messages.</p><span class="hn-code">${code}</span></div></div>`:`<div class="hn-qrc locked"><div class="hn-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></div><div><b>Your entry QR</b><p>It unlocks the moment the deposit is in. Collect it below.</p></div></div>`}
<div class="vp-stats"><div><b id="hnConf">1/${S.party||t.cap}</b><span>confirmed</span></div><div><b>${esc(S.time)}</b><span>arrive by</span></div><div><b id="hnSpent">${AED(basket.credit||0)}</b><span>toward minimum</span></div></div>
<button type="button" class="hn-mb" id="hnMB" hidden><span>Manage booking</span><i>\u203a</i></button>
<section class="hn-tab" id="tabDep"><div class="hn-th"><h3 class="vp-h dep-h">Deposit <span class="dep-hold" id="depHold"></span></h3><button type="button" class="hn-x" data-tab="dep" aria-label="Close deposit">\u2715</button></div>
<div class="hn-tb"><div class="sp dep" id="hnDep"></div></div><button type="button" class="hn-bar" data-tab="dep"><span>Deposit</span><em id="depBarTxt"></em><i>\u203a</i></button></section>
<section class="hn-tab" id="tabDec"><div class="hn-th"><h3 class="vp-h">Tonight\u2019s decisions</h3><button type="button" class="hn-x" data-tab="dec" aria-label="Close decisions">\u2715</button></div>
<div class="hn-tb"><div class="hn-dec" id="hnDec">${hnLast=hnDecisions()}</div><div class="sp" id="hnSplit" hidden></div></div><button type="button" class="hn-bar" data-tab="dec"><span>Tonight\u2019s decisions</span><em></em><i>\u203a</i></button></section>
<div class="hn-acts"><button type="button" data-go="invite">Invite guests</button><button type="button" data-go="menu">Pre-order</button><button type="button" data-go="change">Request table change</button></div>`;
  {const inv=$('#invite'),dep=$('#tabDep');if(inv&&dep){if(!HN.invHome)HN.invHome={p:inv.parentNode,n:inv.nextSibling};inv.classList.add('hn-inv');dep.parentNode.insertBefore(inv,dep);}}   /* your guests come before the deposit */
  if(!S.bookedAt)S.bookedAt=Date.now();depRender();depHold();hnTabs();const a=$('#app');if(a)a.scrollTo({top:Math.max(0,b.offsetTop-70),behavior:'auto'});}
let hnLast='';
function hnRefresh(){const d=$('#hnDec');if(d&&document.body.classList.contains('booked')){const h=hnDecisions();if(h!==hnLast){hnLast=h;d.innerHTML=h;}}const s=$('#hnSpent');if(s)s.textContent=AED(basket.credit||0);
  const c=$('#hnConf'),t=T(S.boothId);if(c&&t)c.textContent=(((S.guests||[]).length+1))+'/'+(S.party||t.cap);}
function unbecomeHost(){invHome();{const inv=$('#invite');if(inv)inv.classList.remove('hn-inv');}S.bookedAt=0;HN.confirmed=false;SPLIT.open=false;SPLIT.shares=[];SPLIT.sent=false;Object.assign(DEP,{pct:RULES.depOpts[0],shares:[],sent:false,how:'',paid:{},due:{},open:false,sig:'',remind:false,links:[],lg:0,hostCovered:false});GDEP.paid=false;document.body.classList.remove('booked');const b=$('#hostBlock');if(b){b.hidden=true;b.innerHTML='';b.classList.remove('on','now');}Object.assign(HN,{nudged:false,split:false,remind:true,dj:false,depOpen:true,decOpen:true});}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#hostBlock .hn-b,#hostBlock .hn-acts button');if(!b)return;const a=$('#app');
  const go=el=>{if(a&&el)a.scrollTo({top:el.offsetTop-80,behavior:'smooth'});};
  if(b.dataset.go==='invite')return go($('#invite'));if(b.dataset.go==='menu')return $('#msPre')&&$('#msPre').click();if(b.dataset.go==='change')return requestChange();
  const k=b.dataset.k;if(k==='nudge'&&!HN.nudged){HN.nudged=true;toast('Nudged everyone who hasn\u2019t claimed a spot');}
  else if(k==='votes'){go($('#tVote'));return;}
  else if(k==='dj'){HN.dj=!HN.dj;toast(HN.dj?'Sent to the DJ with your table\u2019s weight':'Pulled back from the DJ');}
  else if(k==='split'){SPLIT.open=!SPLIT.open;spRender();}
  else if(k==='remind'){HN.remind=!HN.remind;}
  hnRefresh();});
setInterval(()=>{if(document.body.classList.contains('booked')){hnRefresh();if(SPLIT.open){const sig=spPeople().join('|');if(sig!==SPLIT.sig)spRender();}}},1500);
