/* ================= venue bridge ================= */
let dollFrame=null,dollReady=false,dollUrl=null;
function dollPost(msg){try{dollFrame&&dollFrame.contentWindow&&dollFrame.contentWindow.postMessage(Object.assign({source:'ush-host'},msg),'*');}catch(_){}}
function fits(t,p){if(!p)return false;return p>=2&&p<=t.cap+EXTRA_MAX;}
function takenPct(t){return {bsA:60,vip:55,plat:42,gold:36,silver:30}[t.tier]||45;}
/* live: the tables really taken for the night on screen, kept up to date by the back end (BUBL.watchTables).
   demo: the build's own stand-in, worked out from the table's name. */
let TAKEN=new Set(),takenFor=null,stopWatch=null;
function watchNight(ev){if(!LIVE||!ev||takenFor===ev.id)return;takenFor=ev.id;TAKEN=new Set();if(stopWatch)stopWatch();
  stopWatch=BUBL.watchTables(ev.id,null,set=>{if(takenFor!==ev.id)return;TAKEN=set;if(S.pick&&!tableOpen(T(S.pick))&&!(openSheetEl&&openSheetEl.id==='tSheet'))S.pick=null;syncDoll();});}
function isTaken(k,t){return LIVE?TAKEN.has(t.id):(h32(`${k}|${t.id}`)%100)<takenPct(t);}
function seeded(id){return !isTaken(S.date,T(id));}
function tableOpen(t){if(S.boothId===t.id)return true;if((window.lcEXCL||[]).includes(t.id))return !!S.vip&&(!S.party||fits(t,S.party));if(S.party&&!fits(t,S.party))return false;return seeded(t.id);}
function ready(){return !!(S.date&&S.time&&S.party);}
function openCount(){return TABLES.filter(tableOpen).length;}
function energyOf(t){if(!t||!S.ev)return .6;const [h,m]=t.split(':').map(Number),[dh,dm]=S.ev.doors.split(':').map(Number);let a=h*60+m,d=dh*60+dm;if(a<d)a+=1440;return Math.max(.3,Math.min(1,.3+(a-d)/300*.7));}
function syncDoll(){
  if(!dollFrame)return;
  try{if(window.__socialGlow)window.__socialGlow();}catch(_){}
  dollPost({cmd:'setView',view:curView()});paintVtog();
  dollPost({cmd:'energy',value:energyOf(viewTime())});
  const av=!S.boothId&&!S.tixMode;dollPost({cmd:'avail',on:av});$('.rleg').classList.toggle('avail',av);
  dollPost({cmd:'statuses',list:TABLES.map(t=>({id:t.id,status:tableOpen(t)?'available':'occupied'}))});
  dollPost({cmd:'book',id:S.boothId});
  if(!S.boothId){if(S.pick)dollPost({cmd:'select',id:S.pick});else dollPost({cmd:'clear'});}
  if(window.lcGlowExcl)window.lcGlowExcl();
  if(S.ev)dollPost({cmd:'theme',theme:evTheme(S.ev)});
  syncBudget();updateBkCtx();
}
function updateBkCtx(){
  const box=$('#bkCtx');box.classList.remove('is-pick');
  const pick=S.boothId||S.pick;
  if(pick){const t=T(pick);box.classList.remove('is-prompt');box.classList.add('is-pick');
    $('#bkMain').textContent=t.name+(S.boothId?(t.req?' is requested':' is yours'):'');
    $('#bkSub').textContent=t.req?`${t.label}, held for the Backstage List, minimum on request`:`${t.label}, ${AED(S.boothId?S.bookMin:minFor(t,S.party))} minimum${S.boothId?`, arrive by ${S.time}`:''}`;
    $('#bkOpenN').textContent=String(t.cap);$('#bkOpen').lastChild.textContent='\u00a0seats';}
  else if(ready()){box.classList.remove('is-prompt');
    $('#bkMain').textContent=`${S.ev.short}, party of ${S.party}`;
    $('#bkSub').textContent=`Arrive by ${S.time}. Tap a section, then your table.`;
    $('#bkOpenN').textContent=String(openCount());$('#bkOpen').lastChild.textContent='\u00a0open';}
  else{box.classList.add('is-prompt');
    $('#bkMain').textContent=`${S.ev?S.ev.short:'Pick your night'}: find your table`;
    $('#bkSub').textContent=S.ev?`Tap a section, then your table. Doors ${S.ev.doors}, arrive by ${S.time}.`:'Tap a section, then your table';
    $('#bkOpenN').textContent=String(openCount());$('#bkOpen').lastChild.textContent='\u00a0open';}
  refreshRoomStats();
}
function viewTime(){return S.viewTime||S.time||(S.ev?slotsFor(S.ev)[3]:'22:00');}
function roomNight(){return S.date||EVENTS[0].k;}
function daysOut(k){const a=new Date();a.setHours(12,0,0,0);return Math.max(0,Math.round((dOf(k)-a)/864e5));}
function nightStats(k,t){
  /* live: only what BUBL really knows. Tables booked is counted from real bookings. How many are on the floor needs
     scans at the gates, and "interested" needs the interested list: neither exists yet, so neither is shown. */
  if(LIVE)return {pct:TABLES.length?Math.round(TABLES.filter(x=>TAKEN.has(x.id)).length/TABLES.length*100):0,floor:null,intr:null};
  const dd=daysOut(k),close=Math.max(.3,Math.min(1,1-dd*.02));
  const finalTaken=TABLES.filter(x=>isTaken(k,x)).length;
  const booked=Math.min(TABLES.length,Math.round(finalTaken*close)+(S.boothId?1:0));
  const floor=Math.round((900+energyOf(t)*8200+(h32(k+t)%600))*(.55+.45*close));
  const intr=120+h32(k)%380+(myInt[k]?1:0);
  return {pct:Math.round(booked/TABLES.length*100),floor,intr};
}
function refreshRoomStats(){
  const w=$('#roomStats'),k=roomNight(),t=viewTime();
  w.hidden=!(S.date&&S.time);if(w.hidden)return;
  const st=nightStats(k,t);
  $('#rsTaken').textContent=st.pct+'%';if(st.floor==null){$('#rsFloor').parentNode.style.display='none';$('#rsLocked').style.display='none';}else $('#rsFloor').textContent=st.floor.toLocaleString('en-US');w.classList.add('is-on');
}
function renderRoom(){
  if(!dollFrame){
    const host=$('#roomCanvas');host.classList.remove('ready');
    dollFrame=document.createElement('iframe');dollFrame.className='doll-frame';dollFrame.title='Ushua\u00efa, pick your table in 3D';dollFrame.setAttribute('scrolling','no');
    dollFrame.src=VENUE_SRC;
    host.appendChild(dollFrame);addVtog(host);
  }
  syncDoll();
}
window.addEventListener('message',function(ev){
  const d=ev.data;if(!d||d.source!=='ush-venue')return;
  if(!dollFrame||ev.source!==dollFrame.contentWindow)return;
  if(d.type==='ctxlost'){try{dollFrame.remove();}catch(_){}if(dollUrl){try{URL.revokeObjectURL(dollUrl);}catch(_){}dollUrl=null;}dollFrame=null;dollReady=false;_paused=null;setTimeout(()=>{if(!document.body.classList.contains('ipv-open'))renderRoom();},700);return;}
  if(d.type==='fatal'){$('#bkMain').textContent="The 3D room couldn't start";$('#bkSub').textContent=String(d.msg||'').slice(0,120);return;}
  if(!dollReady){dollReady=true;syncDoll();}
  if(d.type==='frame'){$('#roomCanvas').classList.add('ready');return;}
  if(d.type==='select'&&d.table){if(window.sxOpenTable&&window.sxOpenTable(d.table.id)){dollPost({cmd:'clear'});return;}onPick(d.table.id);return;}
  if(d.type==='dj'){openDj();if(typeof hitsOf==='function'){const H=hitsOf(S.ev);if(H)hitPlay(H,H.next||0,'venue');}return;}
  if(d.type==='strobe'){if(d.on)hostStrobe();return;}
  if(d.type==='section'){S.sec=d.id;paintSecChips();return;}
  if(d.type==='view'){S.view=d.view;paintVtog();return;}
});

/* strobe envelope mirrored on the host, so the page blackout works even when the room is cross-origin */
window.__hostParty={active:false,energy:0,pulse:0};
function hostStrobe(){const P=window.__hostParty,t0=performance.now(),dur=3200;P.active=true;
  (function f(now){const el=now-t0;if(el>=dur){P.active=false;P.energy=0;P.pulse=0;return;}const k=el/dur;P.energy=k<.75?1:Math.max(0,1-(k-.75)/.25);P.pulse=((el/1000*9.5)%1)<.38?1:0;requestAnimationFrame(f);})(t0);}

/* pause the 3D room when it's scrolled away or covered by a full sheet, gallery or the invitation */
let roomVisible=true,_paused=null;
function roomCovered(){return (openSheetEl&&(openSheetEl.id==='tixSheet'||openSheetEl.id==='menuSheet'))||$('#mediaOvr').classList.contains('show')||document.body.classList.contains('ipv-open')||$('#ginfoModal').classList.contains('show');}
function updatePause(){if(!dollFrame)return;const on=!roomVisible||roomCovered();if(on!==_paused){_paused=on;dollPost({cmd:'pause',on});}}
try{new IntersectionObserver(es=>{es.forEach(e=>{roomVisible=e.isIntersecting;});updatePause();},{root:$('#app'),threshold:[0,.02]}).observe($('#roomCanvas'));}catch(_){}
setInterval(updatePause,400);
$('#roomCanvas').addEventListener('pointerdown',()=>{if(!roomCovered()){_paused=null;updatePause();}},{passive:true});
