'use strict';
/* ============================================================
   LIVE ACTIONS · loaded in test and live mode only, after Sk's files
   In the build every button changes the simulated night in the page.
   Here the same buttons ask BUBL's back end (the `ops` function), which
   checks the person's role, does the thing for real, and writes it in
   the log; the page then reads the night again. Sk's screens are his.
   What a button says after it is pressed is what really happened.
   ============================================================ */

/* ---- who is signed in: the role comes from their staff account, never from a button ---- */
UI.role=BUBL.staff.role;
if(!GATE[UI.gate]||ROLES[UI.role].gate)UI.gate=(ROLES[UI.role].gate&&GATE[ROLES[UI.role].gate])?ROLES[UI.role].gate:(GATES[0]?GATES[0].id:UI.gate);
ON.role=()=>{};

/* ---- reading the night again ---- */
let _liveBusy=false,_liveAt=0;
async function liveRefresh(){if(_liveBusy)return;_liveBusy=true;
  try{const n=await BUBL.opsNight(W.ev.sid);
    if(n.ok){BUBL.night=n;liveIntegrations();
      (n.agreements||[]).forEach(a=>{if(a.state!=='ended'&&!SRC[a.key]){const s={id:a.key,label:a.label,grp:a.kind==='promoter'?'promoter':'partner',comm:Number((a.terms&&a.terms.rates&&a.terms.rates.tab)||0),agreement:a.id,i:SOURCES.length};SOURCES.push(s);SRC[s.id]=s;}});
      (n.tables||[]).forEach(t=>{const a=TABLE_DATA.find(x=>x.id===t.key);if(a)a.oos=!!t.oos;});
      const id=W.ev.id,rev=(W.rev||0)+1;Worlds[id]=buildWorld(EVK[id]);W=Worlds[id];W.rev=rev;_snap=null;_liveAt=Date.now();Sync.online=true;
      if(typeof paLiveSync==='function')paLiveSync();
      refresh(true);}
    else if(n.code==='sign_in_needed'||n.code==='not_staff'){BUBL.opsSignOut();}
    else if(n.code==='offline'){Sync.online=false;if(window.onSync)onSync();}
  }finally{_liveBusy=false;}}
setInterval(()=>{if(!document.hidden&&!Scan.res)liveRefresh();},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-_liveAt>4000)liveRefresh();});

/** Asks the back end to do something. Says what happened, reads the night again, and answers with the reply (or null). */
async function liveDo(door,body,okMsg){
  const r=await BUBL.ops(door,Object.assign({service:W.ev.sid},body||{}));
  if(!r.ok){haptic([30,40,30]);toast(esc(r.reason||'That could not be done.'));await liveRefresh();return null;}
  if(okMsg)toast(typeof okMsg==='function'?okMsg(r):okMsg);await liveRefresh();return r;}

/* the audit log is the back end's own: what the page used to note for itself is not kept here */
log=function(){return {};};
Sync.queue=[];flush=function(){};
window.addEventListener('offline',()=>{Sync.online=false;});

/* ---- the snapshot: the selectors run on the real records; what they would model is taken out ---- */
const _snapshot=snapshot;
snapshot=function(Wd,t,pure){
  const s=_snapshot(Wd,t,pure),N=Wd.live;s.live=true;
  /* no forecast, plan or potential: there is no imported history to forecast from (they show only as "Awaiting") */
  const z=()=>({tix:0,tables:0,att:null,door:0,bar:0,over:0,fb:0,gross:0,costs:0,profit:0,none:true});
  s.fc=z();s.plan={door:0,bar:0,att:0,hourly:[0,0,0,0,0,0,0]};s.potential=0;s.bePct=0;
  /* gates: the real scans per gate. The queue and the wait were a model; they are not drawn */
  if(s.gates)s.gates.forEach(g=>{g.queue=0;g.wait=0;});s.capAlert=false;
  if(N){
    const tk=s.tk,T=N.tickets||[];
    tk.named=sum(T,x=>Number(x.named||0));tk.unnamed=Math.max(0,sum(T,x=>Number(x.sold||0))-tk.named);tk.refunded=sum(T,x=>Number(x.refunded||0));tk.refAmt=sum(T,x=>fromMinor(x.refunded_minor)||0);
    const M_=N.money;
    /* money really taken through BUBL: deposits charged and tickets charged. On site, only what the team recorded as
       paid on the venue's own terminal at the door (counted apart: BUBL did not take it). The bars and the table
       checks are the POS's, and stay empty until it is connected. */
    s.fin.dep=M_?fromMinor(M_.deposits_charged_minor):0;s.fin.held=M_?fromMinor(M_.deposits_held_minor):0;s.fin.tix=M_?fromMinor(M_.tickets_charged_minor):0;
    s.fin.door=M_?fromMinor(M_.door_terminal_minor)||0:0;s.fin.bar=0;s.fin.settled=0;s.fin.onsite=s.fin.door;s.fin.collected=s.fin.dep+s.fin.tix+s.fin.door;s.fin.gross=s.fin.collected+s.fin.committed;
    s.fin.breakeven=Wd.be.unset?0:Wd.be.amt;s.fin.beSet=!Wd.be.unset;s.fin.profit=Wd.be.unset?0:s.fin.collected-Wd.be.amt;
    s.cost={fixed:s.fin.breakeven,vari:0,v:0,lines:[],breakeven:s.fin.breakeven,total:s.fin.breakeven,set:Wd.be};
    /* the team: who has opened OPS for this night. The venue's staff plan is not in BUBL, so there is no "of N" */
    const by={};Wd.staff.forEach(x=>{by[x.role]=(by[x.role]||0)+1;});s.staff=Object.keys(by).map(r=>({sp:{role:r,zone:'',plan:null},in:by[r]}));
  }
  return s;};

/* ---- the Manager PIN: each owner or manager's own, checked by the back end ---- */
let LIVE_PIN=null;
const pinNow=()=>LIVE_PIN&&Date.now()-LIVE_PIN.at<120000?LIVE_PIN.pin:undefined;
function pinPad(title,sub,noteText,onFour){let v='',busy=false;
  const o=Sheet.open({modal:true,static:true,title,sub:esc(sub),
    body:()=>'<div class="pin-dots" id="pinDots">'+[0,1,2,3].map(i=>'<i class="'+(i<v.length?'on':'')+'"></i>').join('')+'</div><p class="note" id="pinNote" style="text-align:center">'+esc(noteText)+'</p>'+
      '<div class="pin-pad">'+[1,2,3,4,5,6,7,8,9].map(d=>'<button data-act="pinKey" data-k="'+d+'">'+d+'</button>').join('')+'<span></span><button data-act="pinKey" data-k="0">0</button><button data-act="pinKey" data-k="del" aria-label="Delete">'+I('left',22)+'</button></div>'});
  const wrong=msg=>{haptic([30,40,30]);const d=$('#pinDots',o.el);if(d)d.classList.add('err');setTimeout(()=>{v='';busy=false;noteText=msg||noteText;o._b=null;Sheet.paint(o);},340);};
  ON.pinKey=async el=>{if(busy)return;const k=el.dataset.k;if(k==='del')v=v.slice(0,-1);else if(v.length<4)v+=k;o._b=null;Sheet.paint(o);
    if(v.length===4){busy=true;await onFour(v,wrong);}};
  return o;}
function withPin(reason,cb){
  const me=BUBL.staff;
  /* an owner or manager who has not chosen theirs yet picks it now, on the same pad */
  if(me.role==='owner'&&me.pin&&!me.pin.set){let first=null;
    const ask=()=>pinPad(first?'Repeat your PIN':'Choose your Manager PIN',reason,first?'Enter the same four digits again.':'Four digits only you know. It approves comps, releases and overrides, and your name goes in the log each time.',async(v,wrong)=>{
      if(!first){first=v;Sheet.close();ask();return;}
      if(v!==first){first=null;Sheet.close();toast('Those did not match. Choose your PIN again.');ask();return;}
      const r=await BUBL.ops('pin-set',{pin:v});
      if(!r.ok){first=null;Sheet.close();toast(esc(r.code==='pin_refused'?'Choose a different PIN: not four of the same, a run like 1234, or a year.':r.reason||'That could not be saved.'));ask();return;}
      me.pin.set=true;LIVE_PIN={pin:v,at:Date.now()};haptic(20);Sheet.close();toast('Your PIN is set.');cb(me.name);});
    ask();return;}
  pinPad('Manager PIN',reason,'Every approval is written to the audit log with your name.',async(v,wrong)=>{
    const r=await BUBL.ops('pin-check',{pin:v});
    if(r.ok){LIVE_PIN={pin:v,at:Date.now()};haptic(20);setTimeout(()=>{Sheet.close();cb(r.approver);},140);return;}
    if(r.code==='pin_locked'){Sheet.close();toast('Too many wrong tries. Approvals on this phone are paused until '+fT(Date.parse(r.locked_until))+'.');return;}
    wrong(r.code==='pin_wrong'?'That is not a manager’s PIN.'+(r.tries_left!=null?' '+r.tries_left+' tries left.':''):(r.reason||'That could not be checked.'));});}

/* ---- the floor: holds, requests, seating, moves, releases ---- */
const HOLD_KEY={'VIP hold':'vip','Promoter hold':'promoter','Artist hold':'artist','House hold':'house','Hotel hold':'hotel'};
const bLive=b=>b&&b.uid;
Act.hold=function(tb,kind,who,hours){liveDo('hold-new',{table:tb.id,kind:HOLD_KEY[kind]||'house',for:who,hours},esc(tb.name)+' held for '+esc(who)+'.');return {};};
Act.releaseHold=function(h){liveDo('hold-release',{booking:h.id,reason:'Released from OPS'},esc(W.T[h.table].name)+' is back on sale.');};
ON.holdRel=el=>{const h=W.holds.find(x=>x.id===el.dataset.h);if(h)Act.releaseHold(h);};
ON.holdExt=el=>{const h=W.holds.find(x=>x.id===el.dataset.h);if(h)liveDo('hold-extend',{booking:h.id,hours:24},'Held for 24 hours more.');};
(function(){const open=ON.holdNew;ON.holdNew=el=>{open(el);const T=W.T[el.dataset.id],o=Sheet.top();
  ON.hSave=()=>{const who=$('#hWho',o.el).value.trim()||actor(),kind=($('.seg .on[data-act="hK"]',o.el)||{dataset:{k:'VIP hold'}}).dataset.k,hrs=+(($('.on[data-act="hH"]',o.el)||{dataset:{h:24}}).dataset.h)||24;
    Sheet.close();Sheet.refresh(true);Act.hold(T,kind,who,hrs);};};})();
ON.reqMin=el=>{const b=bk(el.dataset.b);b.min=Math.max(0,b.min+(+el.dataset.d));Sheet.top()._b=null;Sheet.refresh(true);};
ON.reqOk=el=>{const b=bk(el.dataset.b);if(!(b.min>0)){toast('Set the table’s minimum first.');return;}
  liveDo('request-answer',{booking:b.uid,confirm:true,minimum_minor:toMinor(b.min)},'Confirmed at '+aed(b.min)+' minimum for '+esc(gName(b.booker))+'.');};
ON.reqNo=el=>{const b=bk(el.dataset.b);liveDo('request-answer',{booking:b.uid,confirm:false},'Declined. '+esc(gName(b.booker))+'’s request is closed.');};
/* Releasing a table. When the venue cancels one whose deposit was charged, every charge goes back to the card that paid
   it, in full and at once (Sk, 20 Nov 2026); the message says how much, as BUBL's back end reports it. */
/* an amount to the fils when it has any, and as the build writes a whole amount when it has none */
const aedExact=v=>Number.isInteger(v)?aed(v):'AED '+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const releasedMsg=nm=>r=>esc(nm)+(r.given_back_minor>0?' cancelled. '+aedExact(fromMinor(r.given_back_minor))+' is going back to the '+(r.cards>1?r.cards+' cards':'card')+' that paid.':' released and back on sale.');
/* Sk, 22 Nov 2026: the pad says the amount before the PIN, "Release PL01 · AED 7,500 back to the card" */
const releaseTitle=(b,nm)=>{const g=b.live&&b.live.refund_on_release;return 'Release '+nm+(g&&g.minor>0?' · '+aedExact(fromMinor(g.minor))+' back to the '+(g.cards>1?'cards':'card'):'');};
ON.relB=el=>{const b=bk(el.dataset.b),nm=W.T[tableAt(b,now())].name;withPin(releaseTitle(b,nm),()=>{liveDo('booking-release',{booking:b.uid,reason:'Released by a manager',pin:pinNow()},releasedMsg(nm));});};
Act.release=function(b,mgr,why){liveDo('booking-release',{booking:b.uid,reason:why||'Released by a manager',pin:pinNow()},releasedMsg(W.T[tableAt(b,now())].name));};
Act.seatTable=function(b){liveDo('booking-step',{booking:b.uid,to:'seated'});return b.seats.filter(s=>s.ar&&!s.st).length||b.party;};
Act.seatOne=function(s){liveDo('booking-step',{booking:s.b.uid,to:'seated'});};
ON.seatAll=el=>{const b=bk(el.dataset.b);haptic(15);liveDo('booking-step',{booking:b.uid,to:'seated'},esc(W.T[tableAt(b,now())].name)+' is seated.');};
ON.seatOne=el=>{const s=W.seats.find(x=>x.ref===el.dataset.r);if(!s)return;haptic(15);liveDo('booking-step',{booking:s.b.uid,to:'seated'},esc(W.T[tableAt(s.b,now())].name)+' is seated.');};
Act.closeSeats=function(b){liveDo('booking-step',{booking:b.uid,to:'closed'},'Closed.');};
Act.move=function(b,toId,why){const q=UI.floor.moveQ?W.queue.find(x=>x.id===UI.floor.moveQ):null;
  liveDo('booking-move',{booking:b.uid,table:toId,request:q&&q.live?q.id:undefined},esc(gName(b.booker))+' moved to '+esc(W.T[toId].name)+'.');};
Act.queue=function(q,ok){if(q.type!=='change')return;if(!ok)liveDo('change-decline',{request:q.id},'Declined. The table stays as it is.');};
ON.qNo=el=>{const q=W.queue.find(x=>String(x.id)===el.dataset.q);if(q)Act.queue(q,false);};
ON.tOos=el=>{const T=W.T[el.dataset.id],out=!T.oos;Sheet.close();liveDo('table-service',{table:T.id,out},esc(T.name)+(out?' is out of service and hidden from guests.':' is back in service.'));};
Act.layout=function(){};Act.note=function(){};Act.book=function(){return null;};Act.unbook=function(){};Act.comp=function(){};Act.discount=function(){};Act.collect=function(){return 0;};
Act.chaseDeposit=function(){};Act.markDeposit=function(){};Act.nudge=function(){};Act.offer=function(){};Act.ackAlert=function(){};Act.svc=function(){};Act.deliver=function(){};Act.assign=function(){};Act.doorSale=function(){};
Act.confirmReq=function(b,min){liveDo('request-answer',{booking:b.uid,confirm:true,minimum_minor:toMinor(min)});};
Act.declineReq=function(b){liveDo('request-answer',{booking:b.uid,confirm:false});};

/* ---- what the team types in ---- */
ON.clock=()=>{};   /* the clock is the real one: there is nothing to play back */
ON.costSave=()=>{const el=Sheet.top().el,i=$('#beAmt',el),nt=$('#beNote',el),v=parseFloat(String(i.value).replace(/[^0-9.]/g,''));if(isNaN(v)||v<=0){toast('Enter the breakeven in AED.');return;}
  const nv=Math.round(v*100)/100,note=nt?nt.value.trim():'';if(!W.be.unset&&nv===W.be.amt&&note===(W.be.note||'')){toast('No changes to save.');return;}
  withPin('Set the breakeven to '+aed(nv),async()=>{const r=await liveDo('breakeven',{amount_minor:toMinor(nv),note:note||null,pin:pinNow()},'Breakeven set at '+aed(nv)+'.');const o=Sheet.top();if(r&&o){o._b=null;Sheet.paint(o);}});};
Act.incident=function(type,zone,note){liveDo('incident',{type,zone,note},'Logged.');};
Act.check=function(id,v){liveDo('checklist',{key:id,done:!!v});};
Act.breakeven=function(val,mgr,note){liveDo('breakeven',{amount_minor:toMinor(val),note:note||null,pin:pinNow()},'Breakeven set at '+aed(val)+'.');};

/* ---- the door ---- */
Scan.mode=function(){return 'live';};   /* every scan counts: there are no practice tickets on a real night */
commitScan=function(){};scanQueue=function(){return [];};practiceSet=function(){return [];};
const SCAN_SAYS={
  wrong_event:r=>({tone:'bad',code:'WRONG_EVENT',title:'Wrong event',sub:r.event_title?'This is for '+r.event_title+'.':'This is for a different night.'}),
  void:()=>({tone:'bad',code:'VOID',title:'Refunded ticket',sub:'This ticket was refunded. Do not admit.'}),
  unpaid:()=>({tone:'bad',code:'VOID',title:'Not paid for',sub:'This ticket was never paid for. Do not admit.'}),
  not_found:()=>({tone:'bad',code:'NOT_FOUND',title:'Not a valid ticket',sub:'No ticket or table seat with this code for '+W.ev.short+'.'}),
  not_confirmed:()=>({tone:'bad',code:'VOID',title:'Booking not active',sub:'This table is not confirmed.'}),
  dup:r=>({tone:'warn',code:'DUP',title:'Already scanned',sub:'Scanned at '+fT(Date.parse(r.first_at))+(r.first_gate&&GATE[r.first_gate]?', '+GATE[r.first_gate].label:'')+'.'}),
  /* a ticket shown after its time. Where the venue has a paid upgrade at the door (Sk, 22 Nov 2026) this is the build's
     own "Early entry ended" result, with its upgrade button; otherwise it is refused, or admitted with the Manager PIN */
  late:r=>r.upgrade_minor>0?{tone:'warn',code:'EARLY',title:'Early entry ended',sub:'Valid until '+fT(Date.parse(r.valid_until))+'. Upgrade'+(BUBL.night.door_ticket&&BUBL.night.door_ticket.label?' to '+BUBL.night.door_ticket.label:'')+' for '+aedExact(fromMinor(r.upgrade_minor))+'.'}
    :{tone:'warn',code:'DUP',title:'Entry time has passed',sub:'This ticket was valid until '+fT(Date.parse(r.valid_until))+'.'},
  ok:()=>({tone:'ok',code:'OK',title:'Admit',sub:''}),vip:()=>({tone:'ok',code:'VIP',title:'Admit',sub:''}),override:()=>({tone:'ok',code:'OK',title:'Admit',sub:'Admitted on a manager’s approval'})};
function scanResult(a,code){const r=(SCAN_SAYS[a.result]||SCAN_SAYS.not_found)(a);
  Object.assign(r,{raw:code,server:a,mode:'live',name:a.name||(a.kind?'Unnamed':''),ref:a.ref||'',gateWant:UI.gate,vip:a.result==='vip',gst:a.name?{crm:1}:null});
  if(a.kind==='ticket'&&a.label){r.rec={k:0};r.tier=a.label;}
  if(a.upgrade_minor>0)VENUE.earlyUpgrade=fromMinor(a.upgrade_minor);   /* the venue's own amount, on the build's button */
  if(a.kind==='seat'&&a.table){const T=W.T[a.table.key]||{};r.rec={b:{}};r.seat=true;r.tier=(TIERS[a.table.tier]||{}).label||'';r.table=a.table.name;r.tableId=a.table.key;r.seatN=a.seat_no;r.host=(SECTIONS[T.sec]||{}).host||'';r.b=a.booking;
    const owed=a.booking&&a.booking.booking&&a.booking.booking.owed_note;if(owed&&r.tone!=='bad')r.sub=[r.sub,owed].filter(Boolean).join(' ');}
  if(a.check_id&&r.tone!=='bad')r.sub=[r.sub,'Check ID: the name must match.'].filter(Boolean).join(' ');
  return r;}
Scan.handle=async function(code){if(this.asking)return;this.asking=true;
  const a=await BUBL.ops('scan',{service:W.ev.sid,gate:UI.gate,code});this.asking=false;
  if(!a.ok){toast(esc(a.reason||'The scan could not be checked. Try again.'));return;}
  this.show(scanResult(a,code));};
Scan.show=function(r){this.res=r;const ok=r.tone==='ok';haptic(ok?40:r.tone==='warn'?[60,60,60]:[200,80,200]);beep(r.tone);if(ok){this.mine++;if(r.tableId)UI.floor.ping={table:r.tableId,at:Date.now(),name:r.name};}
  this.paint();
  /* a table with seats nobody has given details for: the door is asked what to do for a guest without a QR */
  const open=ok&&r.b&&(r.b.seats||[]).filter(s=>!s.has_details&&!s.arrived_at).length;
  clearTimeout(this._d);if(ok)this._d=setTimeout(()=>{if(open)this.noDetails(r);else this.dismiss();},1500);liveRefresh();};
/* Sk, 20 Nov 2026: for a guest with no details the operator can fill the name in, skip, or show the table's QR */
Scan.noDetails=function(r){const seats=(r.b.seats||[]).filter(s=>!s.has_details&&!s.arrived_at);if(!seats.length){this.dismiss();return;}
  this.res={tone:'warn',code:'NODETAILS',mode:'live',from:r,seats};const el=$('#scRes');$('#stage').classList.add('scanres');
  el.innerHTML='<div class="sc-res warn" role="alert"><div class="big-ic">'+I('user',52)+'</div><h2>Guests without details</h2><div class="who">'+esc(r.table)+'</div>'+
    '<p class="why">'+N(seats.length)+' '+(seats.length===1?'seat has':'seats have')+' no details yet. For a guest of this table with no QR:</p>'+
    '<div class="acts"><button class="btn pri" data-act="scClaim">'+I('user',18)+'Take their name, admit</button><button class="btn" data-act="ndSkip">Skip, admit</button>'+
    '<button class="btn" data-act="ndQr">'+I('scan',18)+'Show the table’s QR</button><button class="btn" data-act="scAck">Done</button></div></div>';};
async function doorAdmit(how,name){const cur=Scan.res;if(!cur||cur.code!=='NODETAILS')return;const seat=cur.seats[0],bid=cur.from.b.booking.id;
  const a=await BUBL.ops('door-admit',{booking:bid,seat_no:seat.seat_no,how,name});
  if(!a.ok){toast(esc(a.reason||'That could not be done.'));return;}
  haptic(40);beep('ok');Scan.mine++;toast(how==='typed'?esc(name)+' admitted.':'Guest admitted without details.');
  cur.from.b=a.booking;liveRefresh();Scan.noDetails(cur.from);}
ON.ndSkip=()=>doorAdmit('skip',null);
ON.scClaim=()=>{const o=Sheet.open({title:'Name this guest',sub:'Their name goes on the table’s list',static:true,body:()=>'<input class="inp" id="clName" placeholder="First and last name" maxlength="80"><div class="banner neu">'+I('id',17)+'<span>ID is checked by sight at the gate, as for every guest. BUBL stores nothing from the document.</span></div>',
  foot:()=>'<button class="btn pri full" data-act="clGo">'+I('check',18)+'Name taken, admit</button>'});
  ON.clGo=()=>{const n=$('#clName',o.el).value.trim().replace(/\s+/g,' ');if(n.length<3||/\d/.test(n)){toast('Enter the guest’s name.');return;}Sheet.close();doorAdmit('typed',n);};};
ON.ndQr=async()=>{const cur=Scan.res;if(!cur||cur.code!=='NODETAILS')return;const a=await BUBL.ops('door-link',{booking:cur.from.b.booking.id});
  if(!a.ok||!a.token){toast(esc(a.reason||'The table’s link could not be opened.'));return;}
  const url=new URL('../../ushuaia/index.html?i='+encodeURIComponent(a.token),location.href).href;
  Sheet.open({title:'The table’s invitation',sub:esc(cur.from.table),static:true,body:()=>'<div class="qrbox">'+QR.svg(url,200)+'</div><p class="note" style="text-align:center">The guest scans this with their own phone, gives their own details, and their seat’s QR opens. Scan it like any other.</p>',
    foot:()=>'<button class="btn pri full" data-act="sheetClose">Done</button>'});};
ON.scAck=()=>Scan.dismiss();
ON.scDeny=()=>Scan.dismiss();
ON.scOverride=()=>{const r=Scan.res;if(!r||!r.raw)return;withPin(r.title==='Already scanned'?'Admit a ticket that was already scanned':'Admit a ticket after its entry time',async()=>{
  const a=await BUBL.ops('scan-override',{service:W.ev.sid,gate:UI.gate,code:r.raw,reason:r.title,pin:pinNow()});
  if(!a.ok){toast(esc(a.reason||'That could not be approved.'));Scan.dismiss();return;}
  Scan.show(scanResult(a,r.raw));});};
/* the upgrade is paid on the venue's terminal, then recorded: a small door sale, and the guest is admitted */
ON.scUpgrade=async()=>{const r=Scan.res;if(!r||!r.raw||!r.server||!(r.server.upgrade_minor>0)||Scan.asking)return;Scan.asking=true;
  const a=await BUBL.ops('door-upgrade',{service:W.ev.sid,gate:UI.gate,code:r.raw,price_minor:r.server.upgrade_minor});Scan.asking=false;
  if(!a.ok){haptic([30,40,30]);toast(esc(a.reason||'The upgrade could not be recorded.'));Scan.dismiss();return;}
  Scan.show(scanResult(a,r.raw));};
ON.scNext=()=>{};
/* with no camera there is no "next in line" to tap here: a guest is found with Look up */
(function(){const upd=Scan.update;Scan.update=function(){upd.call(this);const nx=$('#scNext'),h=$('#scHint');if(nx)nx.style.display='none';
  if(h&&!this.cam&&this.err!=='starting')h.textContent='No camera on this device. Use Look up to find a guest by name.';};})();
ON.scLookup=()=>{if(Scan.res)Scan.dismiss();let last=0;Sheet.open({title:'Manual lookup',sub:'The guest’s name',tall:true,static:true,
  body:()=>'<label class="srch">'+I('search',18)+'<input id="lq" placeholder="Start typing" autocomplete="off" autocapitalize="none"></label><div id="lres" class="rows"></div>',
  onOpen:el=>{const inp=$('#lq',el),res=$('#lres',el);inp.addEventListener('input',async()=>{const q=inp.value.trim(),mine=++last;if(q.length<2){res.innerHTML='';return;}
    const a=await BUBL.ops('lookup',{service:W.ev.sid,q});if(mine!==last)return;const r=a.ok?a.results:[];
    res.innerHTML=r.length?r.map((x,i)=>row(initials(x.name),'',esc(x.name)+(x.check_id?' · Check ID':''),esc(x.label)+(x.kind==='seat'?', seat '+N(x.seat_no):'')+(x.state==='scanned'||x.arrived_at?' · already in':''),
      '<button class="btn xs pri" data-act="lkGo" data-i="'+i+'">Check in</button>')).join(''):'<p class="note" style="padding-top:10px">Nobody under that name for '+esc(W.ev.short)+'.</p>';res._r=r;});setTimeout(()=>inp.focus(),80);}});
  ON.lkGo=async el=>{const res=$('#lres'),x=res&&res._r&&res._r[+el.dataset.i];if(!x)return;Sheet.close(true);
    const a=await BUBL.ops('admit',{service:W.ev.sid,gate:UI.gate,ticket:x.ticket_id,booking:x.booking_id,seat_no:x.seat_no});
    if(!a.ok){toast(esc(a.reason||'That could not be checked.'));return;}if(UI.tab!=='scan')setTab('scan');Scan.show(scanResult(a,null));};};
/* a door sale, as the build's sheet has it.
   On the guest's phone: they buy on the booking page at the price on sale right now, and their ticket is scanned like
   any other. On the venue's terminal (Sk, 20 Nov 2026: "yes BUBL should count"): the operator takes the money on the
   terminal, then records it here; BUBL writes the tickets at the price on sale at this moment, admits them at this gate
   and counts them apart from the cards it charged itself. The terminal choice is drawn only while BUBL's back end says a
   door ticket is on sale (the doors are open and the wave has places). The build's line "matched with the terminal at
   close-out" is left out: BUBL is not connected to the terminal, so it cannot match anything. */
ON.scDoor=()=>{const url=new URL('../../ushuaia/index.html',location.href).href;let n=1,how='phone',busy=false;
  const dt=()=>BUBL.night.door_ticket||{},term=()=>!!(dt().on_sale&&dt().price_minor!=null),price=()=>fromMinor(dt().price_minor);
  const o=Sheet.open({title:'Door sale',sub:(GATE[UI.gate]?GATE[UI.gate].label:'')+(term()?' · '+aed(price())+' each':''),static:true,
    body:()=>{if(!term())how='phone';
      return (term()?'<div class="seg"><button class="'+(how==='phone'?'on':'')+'" data-act="dsH" data-h="phone">Guest pays on their phone</button><button class="'+(how==='term'?'on':'')+'" data-act="dsH" data-h="term">Venue terminal</button></div>':'')+
      (how==='phone'?'<div class="qrbox">'+QR.svg(url,180)+'</div><p class="note" style="text-align:center">The guest scans this, buys a ticket on the booking page at the price on sale right now, and their ticket opens on their phone. Scan it like any other ticket.</p>'
        :'<div style="display:flex;align-items:center;justify-content:space-between"><div class="step"><button data-act="dsN" data-d="-1" aria-label="Fewer">'+I('minus',18)+'</button><b>'+n+'</b><button data-act="dsN" data-d="1" aria-label="More">'+I('plus',18)+'</button></div><div class="big n" style="font-size:30px">'+aed(n*price())+'</div></div><p class="note">Take payment on the venue’s card terminal first, then record it here. Door tickets admit straight away.</p>');},
    foot:()=>how==='phone'?'<button class="btn pri full" data-act="sheetClose">Done</button>':'<button class="btn pri full" data-act="dsGo">'+I('card',18)+'Paid on the terminal, admit '+n+'</button>'});
  const rp=()=>{o._b=null;o._f=null;Sheet.paint(o);};
  ON.dsN=e=>{n=clamp(n+(+e.dataset.d),1,Math.min(10,dt().left_at_this_price||10));rp();};ON.dsH=e=>{how=e.dataset.h;rp();};
  ON.dsGo=async()=>{if(busy||how!=='term'||!term())return;busy=true;
    const a=await BUBL.ops('door-sale',{service:W.ev.sid,gate:UI.gate,n,price_minor:dt().price_minor});busy=false;
    if(!a.ok){haptic([30,40,30]);toast(esc(a.reason||'That could not be recorded.'));await liveRefresh();if(Sheet.top()===o)rp();return;}
    Scan.mine+=a.n;Sheet.close();haptic([15,40,15]);toast(N(a.n)+' door ticket'+(a.n>1?'s':'')+' recorded and admitted.');await liveRefresh();};};

/* ---- another night ---- */
ON.pickEv=async el=>{const ev=EVK[el.dataset.id];if(!ev)return;const n=await BUBL.opsNight(ev.sid);
  if(!n.ok){toast(esc(n.reason||'That night could not be opened.'));return;}
  BUBL.night=n;liveIntegrations();delete Worlds[ev.id];loadEvent(ev.id);UI.phaseOv=null;Sheet.close(true);UI.floor={};applyPhase(true);toast('Now working on '+esc(W.ev.short));};
/* the season list: each night and where it stands. Its figures open with the night itself. */
seasonRows=function(){const t=now();return EVENTS.map(ev=>{const ph=autoPhase(ev,t),mine=ev.id===W.ev.id,s=mine?S():null;
  return {ev,s,ph,Wd:{ON:0},status:ph,live:true,mine,ga:0,tb:mine&&s.tb.total?s.tb.booked/s.tb.total:0};});};
ON.season=()=>{Sheet.open({title:VENUE.season||VENUE.name,sub:N(EVENTS.length)+' nights in BUBL.',tall:true,body:()=>'<div class="rows">'+seasonRows().map(r=>{const ev=r.ev,on=r.mine;
  const st=ev.status==='draft'?tag('mut',null,'Not on sale'):r.status==='pre'?tag('neu',null,ev.status==='on_sale'?'On sale':'Announced'):r.status==='live'?tag('ok','check','Live now'):tag('mut',null,'Closed');
  return '<button class="row tap" data-act="pickEv" data-id="'+ev.id+'"><div class="ri '+(on?'neu':'')+' n">'+g(ev.doors).getUTCDate()+'<br></div><div class="rt"><b>'+esc(ev.head)+'</b><span>'+fD(ev.doors)+', doors '+N(ev.doorsT)+(on?' · tables '+P(r.tb,1):'')+'</span></div><div class="ra">'+st+'</div></button>';}).join('')+'</div>'});};

/* ---- "You and this device": who is signed in, and what this phone is for ---- */
ON.profile=()=>{Sheet.open({title:'You and this device',sub:()=>esc(BUBL.staff.name)+' · '+esc(ROLES[UI.role].label),tall:true,body:()=>{
  const sw=(k,on,l,d)=>'<button class="row tap" data-act="flag" data-k="'+k+'"><div class="ri '+(on?'ok':'')+'">'+I(on?'check':'minus',18)+'</div><div class="rt"><b>'+l+'</b><span>'+d+'</span></div><div class="ra">'+pill(on?'ok':'mut',on?'On':'Off')+'</div></button>';
  const scan=ROLES[UI.role].tabs.includes('scan');
  return '<div class="grp"><div class="lbl">Signed in</div><div class="rows"><div class="row"><div class="ri ok">'+I('user',18)+'</div><div class="rt"><b>'+esc(BUBL.staff.name)+'</b><span>'+esc(ROLES[UI.role].label)+' · '+esc(VENUE.name)+'</span></div><div class="ra"><button class="btn xs" data-act="signOut">Sign out</button></div></div></div></div>'+
    (scan&&GATES.length?'<div class="grp"><div class="lbl">This device is at</div><div class="seg">'+GATES.map(x=>'<button class="'+(UI.gate===x.id?'on':'')+'" data-act="gate" data-g="'+x.id+'">'+x.label+'</button>').join('')+'</div></div>':'')+
    (UI.role==='owner'?'<div class="grp"><div class="lbl">Integrations</div><div class="rows"><button class="row tap" data-act="integ"><div class="ri '+(waitCount()?'warn':'ok')+'">'+I('net',18)+'</div><div class="rt"><b>Integrations and data feeds</b><span>'+coverage().on+' of '+coverage().tot+' feeds live'+(waitCount()?' · '+waitCount()+' awaiting connection':'')+'</span></div><div class="ra">'+I('right',16)+'</div></button></div></div>':'')+
    (scan&&UI.device!=='atlas'?'<div class="grp"><div class="lbl">Scanning on this phone</div><div class="rows">'+
      (standalone()?'<div class="row"><div class="ri ok">'+I('check',18)+'</div><div class="rt"><b>Running from the home screen</b><span>Full screen, camera at the door, screen stays on while scanning.</span></div></div>'
        :'<div class="row"><div class="ri neu">'+I('dl',18)+'</div><div class="rt"><b>Add to Home Screen</b><span>'+(isIOS()?'In Safari tap Share, then Add to Home Screen. It opens full screen like an app.':'Use your browser’s Install or Add to Home Screen option.')+'</span></div></div>')+
      '<button class="row tap" data-act="camGo"><div class="ri '+(Scan.cam?'ok':Scan.err&&Scan.err!=='starting'?'warn':'')+'">'+I('scan',18)+'</div><div class="rt"><b>Camera</b><span>'+(Scan.cam?'On and scanning':Scan.err&&CAMMSG[Scan.err]?CAMMSG[Scan.err][0]:'Starts when you open Scan')+'</span></div><div class="ra">'+I('right',16)+'</div></button>'+
      sw('sound',UI.sound,'Scan sounds','A beep on every scan, for loud gates')+'</div></div>':'')+
    '<div class="grp"><div class="btnrow">'+(UI.role==='owner'?'<button class="btn sm" data-act="audit">'+I('note',16)+'Audit log</button>':'')+(window.innerWidth>=900?'<button class="btn sm" data-act="device">'+I('grid',16)+(UI.device==='atlas'?'Handheld view':'Open Atlas')+'</button>':'')+'</div>'+
    '<p class="note">'+(BUBL.night.venue.mode==='live'?'':'Test mode: real bookings and scans, test payments. ')+'Read from BUBL '+(_liveAt?fT(_liveAt):'just now')+'.</p></div>';}});};
ON.signOut=()=>BUBL.opsSignOut();
