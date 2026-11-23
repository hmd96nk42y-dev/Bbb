'use strict';
/* ============================================================
   30 · store
   Selectors read the world at a time t. Actions append to it at
   "now", write the audit log, and go through the outbox so they
   survive being offline.
   ============================================================ */
const UI={device:'hand',tab:'home',atlas:'command',role:'owner',phaseOv:null,sound:false,gate:'G2',evId:null,
  flags:{posSeat:true},floor:{},home:{},scan:{}};
let W=null;const Worlds={};
const now=()=>Clock.now();
const autoPhase=(ev,t)=>t<ev.doors?'pre':t<=ev.close?'live':'post';
const phase=()=>UI.phaseOv||autoPhase(W.ev,now());
function defaultEvent(t){const up=EVENTS.filter(e=>e.announced&&t<e.close+36*HOUR);return (up[0]||EVENTS.filter(e=>e.announced).pop()).id;}
function loadEvent(id){W=Worlds[id]||(Worlds[id]=buildWorld(EVK[id]));UI.evId=id;W.rev=W.rev||0;_snap=null;}
let _snap=null,_key='';
function bump(){W.rev++;_snap=null;}
function S(){const t=now(),k=W.ev.id+':'+W.rev+':'+Math.floor(t/15000);if(_snap&&_key===k)return _snap;_key=k;return _snap=snapshot(W,t);}
const G=i=>W.guests[i]||{n:'Unnamed guest',ph:'',crm:0,v:0,idv:0};
const gName=i=>i>=0?W.guests[i].n:'Unnamed guest';
const crmLabel=g=>(!isOn('hist')&&g.crm===1)?'Guest':CRM[g.crm].label;

/* ---------- state at time t ---------- */
const bActive=(b,t)=>b.at<=t&&!(b.cancelAt&&b.cancelAt<=t)&&!(b.relAt&&b.relAt<=t);
const bPending=(b,t)=>!!b.reqAt&&b.reqAt<=t&&t<b.at&&!(b.cancelAt&&b.cancelAt<=t)&&!(b.relAt&&b.relAt<=t);
function tableAt(b,t){let id=b.table;for(const m of b.moves)if(m.at<=t)id=m.to;return id;}
function tableIndex(Wd,t){const m={};
  Wd.bookings.forEach(b=>{if(bActive(b,t))m[tableAt(b,t)]={b,st:'booked'};else if(bPending(b,t))m[b.table]={b,st:'requested'};});
  Wd.holds.forEach(h=>{if(!m[h.table]&&h.from<=t&&t<h.until&&!(h.relAt&&h.relAt<=t))m[h.table]={h,st:'held'};});return m;}
function money(b,t){let preCredit=0,prePaid=0,live=0;
  b.pre.forEach(p=>{if(p.at<=t){preCredit+=p.credit;prePaid+=p.paid;}});
  b.orders.forEach(o=>{if(!o.pre&&!o.comp&&o.at<=t)live+=o.amt;});
  const min=b.min,dep=b.depAt&&b.depAt<=t?Math.round(min*b.depPct):0,collected=Math.max(dep,prePaid),due=Math.max(min-preCredit,live),
    owed=Math.max(0,due-(collected-prePaid)),paid=b.payAt&&b.payAt<=t,disc=b.disc||0;
  return {min,preCredit,prePaid,dep,collected,live,due,spend:preCredit+live,balance:paid?0:Math.max(0,owed-disc),settled:paid?Math.max(0,owed-disc):0,
    over:Math.max(0,live-Math.max(0,min-preCredit)),depDue:b.depPct&&!dep?Math.round(min*b.depPct):0,saved:preCredit-prePaid};}
function seatCounts(b,t){let seated=0,arr=0,claimed=0;b.seats.forEach(s=>{if(s.st&&s.st<=t)seated++;else if(s.ar&&s.ar<=t)arr++;if(s.cl&&s.cl<=t)claimed++;});return {seated,arr,claimed,present:seated+arr};}
function liveState(b,t){const c=seatCounts(b,t),late=t>b.arriveBy+VENUE.graceMin*MIN;
  if(!c.present)return late?'noshow':'expected';if(late||b.closed)return c.arr?'partial':'seated';return c.seated>=b.party?'seated':'partial';}
function tableState(Wd,tb,ix,t,ph){if(tb.oos)return 'oos';const e=ix[tb.id];
  if(ph==='post'){if(!e||e.st!=='booked')return 'unsold';const b=e.b;if(!b.seats.some(s=>s.ar&&s.ar<=t))return 'noshow';const m=money(b,t);return b.comp||m.spend>=m.min?'above':'below';}
  if(!e)return 'open';if(e.st!=='booked')return e.st;return ph==='pre'?'booked':liveState(e.b,t);}

/* ---------- cost model ---------- */
function costModel(Wd,rev){/* the breakeven is the manager's number: BUBL never sees supplier or staff costs */
  const be=Wd.be.amt;return {fixed:be,vari:0,v:0,lines:[],breakeven:be,total:be,set:Wd.be};}

/* ---------- the snapshot: every aggregate the views need at time t ---------- */
function snapshot(Wd,t,pure){
  const D=Wd.D,C=Wd.C,ON=Wd.ON,ph=autoPhase(Wd.ev,t),ix=tableIndex(Wd,t),s={t,ph,ix};
  const stash=pure?{T:Wd.tables.map(T=>T._st),B:Wd.bookings.map(b=>[b._m,b._c])}:null;
  const nDays=76,dayOf=x=>clamp(Math.floor((x-ON)/DAY),0,nDays-1),today=dayOf(Math.min(t,D));
  const dTix=new Array(nDays).fill(0),dDep=new Array(nDays).fill(0),dCom=new Array(nDays).fill(0);
  /* tickets */
  const tk={sold:[0,0,0,0,0,0],rev:[0,0,0,0,0,0],in:[0,0,0,0,0,0],named:0,unnamed:0,idv:0,refunded:0,refAmt:0};
  const nB=Wd.nB,arr=[0,1,2,3,4].map(()=>new Array(nB).fill(0)),arrTier=[0,1,2,3,4].map(()=>new Array(nB).fill(0)),gate={G1:new Array(nB).fill(0),G2:new Array(nB).fill(0),G3:new Array(nB).fill(0),G4:new Array(nB).fill(0)};
  const src={};SOURCES.forEach(x=>src[x.id]={rev:0,n:0,in:0,spend:0,comm:0});
  let commBase=0,lateEarly=0;const typeOf=[0,0,0,4,3,2];
  for(const x of Wd.tix){if(x.at>t)continue;const dead=x.st===1&&x.stAt<=t;
    if(dead){tk.refunded++;tk.refAmt+=x.pr;continue;}
    tk.sold[x.k]++;tk.rev[x.k]+=x.pr;const so=src[x.s];so.rev+=x.pr;so.n++;so.comm+=x.pr*SRC[x.s].comm;if(x.k<3)dTix[dayOf(x.at)]+=x.pr;
    if(x.g>=0&&x.cl<=t){tk.named++;if(Wd.guests[x.g].idv)tk.idv++;}else tk.unnamed++;
    if(x.sc&&x.sc<=t){tk.in[x.k]++;so.in++;const bi=Wd.bucket(x.sc);arr[typeOf[x.k]][bi]++;arrTier[x.k<3?x.k:4][bi]++;(gate[x.gt]||(gate[x.gt]=new Array(nB).fill(0)))[bi]++;if(x.late)lateEarly++;}}
  s.tk=tk;s.lateEarly=lateEarly;
  /* tables */
  const tb={booked:0,pending:0,held:0,open:0,oos:0,total:Wd.tables.length,byTier:{},minSum:0,dep:0,committed:0,settled:0,spend:0,over:0,live:0,pre:0,
    seats:0,claimed:0,seatIn:0,seated:0,unseated:0,st:{seated:0,partial:0,expected:0,noshow:0,open:0,held:0,requested:0,oos:0},depDue:[],balDue:[],comps:0,saved:0,minArr:0,spendArr:0};
  TIER_ORDER.forEach(k=>tb.byTier[k]={total:0,booked:0,pending:0,held:0,min:0,spend:0,seated:0});
  const sec={};SEC_ORDER.forEach(k=>sec[k]={total:0,booked:0,seated:0,partial:0,expected:0,noshow:0,open:0,min:0,spend:0,guests:0,in:0});
  let fbTables=0;
  for(const T of Wd.tables){const bt=tb.byTier[T.tier],sc=sec[T.sec];bt.total++;sc.total++;const e=ix[T.id];
    const st=tableState(Wd,T,ix,t,ph==='post'?'live':ph);T._st=st;
    if(T.oos){tb.oos++;continue;}
    if(!e){tb.open++;tb.st.open++;sc.open++;continue;}
    if(e.st==='held'){tb.held++;bt.held++;tb.st.held++;continue;}
    if(e.st==='requested'){tb.pending++;bt.pending++;tb.st.requested++;continue;}
    const b=e.b,m=money(b,t),c=seatCounts(b,t);b._m=m;b._c=c;
    tb.booked++;bt.booked++;sc.booked++;tb.minSum+=m.min;bt.min+=m.min;sc.min+=m.min;tb.dep+=m.collected;tb.settled+=m.settled;tb.spend+=m.spend;bt.spend+=m.spend;sc.spend+=m.spend;
    tb.over+=m.over;tb.live+=m.live;tb.pre+=m.preCredit;tb.saved+=m.saved;tb.seats+=b.party;tb.claimed+=c.claimed;tb.seatIn+=c.present;tb.seated+=c.seated;tb.unseated+=c.arr;sc.guests+=b.party;sc.in+=c.present;
    if(b.comp)tb.comps++;
    const so=src[b.src];so.rev+=m.min;so.n+=b.party;so.in+=c.present;so.spend+=m.spend;so.comm+=m.min*SRC[b.src].comm;
    dDep[dayOf(Math.max(b.depAt||b.at,b.at))]+=m.collected;dCom[dayOf(b.at)]+=m.min;
    const noShowLate=ph!=='pre'&&st==='noshow';
    if(!noShowLate)tb.committed+=m.balance;else tb.writeOff=(tb.writeOff||0)+m.balance;
    if(m.depDue)tb.depDue.push(b);if(ph!=='pre'&&m.balance>0&&(b.declined&&b.declined<=t||t>C-70*MIN))tb.balDue.push(b);
    if(ph!=='pre'){if(tb.st[st]!=null)tb.st[st]++;if(sc[st]!=null)sc[st]++;if(st==='seated')bt.seated++;if(c.present){tb.minArr+=m.min;tb.spendArr+=m.spend;}}
    fbTables+=Math.max(m.min,m.spend);
    for(const x of b.seats){if(x.ar&&x.ar<=t){const bi=Wd.bucket(x.ar);arr[1][bi]++;arrTier[3][bi]++;(gate[x.gate]||(gate[x.gate]=new Array(nB).fill(0)))[bi]++;}}}
  s.tb=tb;s.sec=sec;s.src=src;s.arr=arr;s.arrTier=arrTier;s.gate=gate;
  /* headline counts */
  const inTix=sum(tk.in),inAll=inTix+tb.seatIn,exits=0;
  s.inAll=inAll;s.exits=exits;s.head=Math.max(0,inAll-exits);s.capPct=s.head/VENUE.capacity;
  s.gaSold=tk.sold[0]+tk.sold[1]+tk.sold[2];s.issued=sum(tk.sold)+tb.seats;
  /* money */
  const bi=Wd.bucket(t),bar=t<D?0:Wd.barCum[Math.min(bi,Wd.nB-1)]||0;
  const tixPre=tk.rev[0]+tk.rev[1]+tk.rev[2],door=tk.rev[3];
  s.fin={dep:tb.dep,tix:tixPre,committed:tb.committed,door,bar,settled:tb.settled,onsite:door+bar+tb.settled,writeOff:tb.writeOff||0};
  s.fin.collected=s.fin.dep+s.fin.tix+s.fin.onsite;s.fin.gross=s.fin.collected+s.fin.committed;
  commBase=sum(SOURCES,x=>src[x.id].comm);
  s.cost=costModel(Wd,{fb:fbTables+bar,all:s.fin.gross,comm:commBase});
  s.fin.breakeven=s.cost.breakeven;s.fin.profit=s.fin.collected-s.cost.fixed-s.cost.v*s.fin.collected;
  /* forecast */
  const sN=clamp((t-ON)/DAY,0,75),pG=Math.max(.04,saleCurve((sN-7)*75/68,'ga')),pT=Math.max(.06,saleCurve(sN,'table'));
  const allocRev=sum(GA,x=>x.alloc*x.price),allMins=sum(Wd.tables,T=>TIERS[T.tier].min);
  const fc={};fc.tix=t>=D?tixPre:Math.min(allocRev,(tk.rev[0]+tk.rev[1])/pG+tk.rev[2]/pT);fc.tables=t>=D?tb.minSum:Math.min(allMins,tb.minSum/pT);
  const ns=PAST[3]||{noShowGA:0,noShowSeat:0};fc.att=t>=D?null:Math.round(Math.min(VENUE.capacity,(Math.min(7600,(tk.sold[0]+tk.sold[1])/pG+tk.sold[2]/pT))*(1-ns.noShowGA)+Math.min(2800,tb.seats/pT)*(1-ns.noShowSeat)+420));
  s.plan=planFor(Wd,t,fc);fc.door=t>=C?door:s.plan.door;fc.bar=t>=C?bar:Math.max(bar,s.plan.bar*(t>D?.5+.5*bar/Math.max(1,s.plan.bar):1));
  fc.over=t>=C?tb.over:Math.max(tb.over,fc.tables*.15);if(t>D&&t<C){const done=clamp((t-D)/(C-D),0,1);fc.bar=bar+s.plan.bar*(1-Math.pow(done,1.4))*.92;fc.over=tb.over+fc.tables*.15*(1-done);}
  fc.fb=fc.bar+fc.over;fc.gross=fc.tix+fc.tables+fc.door+fc.fb;fc.costs=s.cost.fixed+s.cost.v*fc.gross;fc.profit=fc.gross-fc.costs;
  s.fc=fc;s.potential=allocRev+allMins+s.plan.bar+allMins*.15+s.plan.door;s.bePct=s.cost.breakeven/s.potential;s.pG=pG;s.pT=pT;
  /* day series for the cumulative view */
  const cum=[],com=[];let a=0,c2=0;for(let d=0;d<nDays;d++){a+=dTix[d]+dDep[d];c2+=dTix[d]+dCom[d];cum.push(a);com.push(c2);}
  s.days={n:nDays,today,cum,com,dTix,dDep};
  /* live-only aggregates */
  if(ph!=='pre'){
    const last=clamp(bi,0,nB-1),rate=i=>i<0?0:sum([0,1,2,3,4],k=>arr[k][i])/5;
    const part=(t-(D+last*5*MIN))/(5*MIN);s.rate=t>C+90*MIN?0:Math.round((rate(last)*5+rate(last-1)*5*(1-part))/5*10)/10;
    s.ratePrev=rate(last-2);let pk=0,pkI=0;for(let i=0;i<=last;i++){const r=rate(i);if(r>pk){pk=r;pkI=i;}}s.peak=pk;s.peakAt=D+pkI*5*MIN;s.bucket=last;
    s.gates=GATES.map(gt=>{let q=0;for(let i=0;i<=last;i++){q=Math.max(0,q+gate[gt.id][i]*1.3-gt.cap*5);}
      const r=(gate[gt.id][last]+(last?gate[gt.id][last-1]:0)*(1-part))/5;return {g:gt,rate:Math.round(r*10)/10,queue:Math.round(q),wait:Math.round(q/gt.cap*10)/10,load:r/gt.cap,total:sum(gate[gt.id])};});
    s.gateCap=sum(GATES,x=>x.cap);s.capAlert=s.rate>s.gateCap*.74||s.gates.some(x=>x.load>.85);
    /* hourly on-site revenue */
    const hrs=Math.ceil((C-D)/HOUR),hr=new Array(hrs).fill(0);
    for(let h=0;h<hrs;h++){const i0=h*12,i1=Math.min(last,(h+1)*12-1);if(i0>last)break;hr[h]+=(Wd.barCum[i1]||0)-(i0?Wd.barCum[i0-1]:0);}
    Wd.bookings.forEach(b=>{if(!bActive(b,t))return;b.orders.forEach(o=>{if(!o.pre&&!o.comp&&o.at<=t){const h=clamp(Math.floor((o.at-D)/HOUR),0,hrs-1);hr[h]+=o.amt;}});});
    Wd.tix.forEach(x=>{if(x.k===TK.door&&x.at<=t){hr[clamp(Math.floor((x.at-D)/HOUR),0,hrs-1)]+=x.pr;}});
    s.hourly=hr;s.hourNow=clamp(Math.floor((t-D)/HOUR),0,hrs-1);
    /* staff */
    s.staff=STAFF_PLAN.filter(sp=>STAFF_BUBL.includes(sp.role)).map(sp=>({sp,in:Wd.staff.filter(x=>x.role===sp.role&&x.inAt&&x.inAt<=t).length}));
  }
  if(stash){Wd.tables.forEach((T,i)=>T._st=stash.T[i]);Wd.bookings.forEach((b,i)=>{b._m=stash.B[i]&&stash.B[i][0];b._c=stash.B[i]&&stash.B[i][1];});}
  return s;
}
function planFor(Wd,t,fc){if(Wd._plan&&t>=Wd.D)return Wd._plan;const att=fc.att||(TARGET?TARGET.att:0),p={door:Math.round(380*VENUE.doorPrice),bar:Math.round(att*.76*172),att};
  const prof=[.05,.13,.2,.23,.2,.13,.06];p.hourly=prof.map(x=>Math.round((p.bar+p.door+fc.tables*.5)*x));if(t<Wd.D)Wd._plan=p;else if(!Wd._plan)Wd._plan=p;return p;}

/* ---------- audit log + offline outbox ---------- */
const Sync={online:true,forced:false,queue:[],busy:false,lastAt:0};
function actor(){return ROLES[UI.role].who;}
function log(action,detail,mgr){const e={at:now(),who:actor(),role:UI.role,action,detail,mgr:mgr||null,synced:false};W.ops.unshift(e);Sync.queue.push(e);flush();return e;}
function flush(){if(!Sync.online||Sync.busy||!Sync.queue.length)return;Sync.busy=true;setTimeout(()=>{const e=Sync.queue.shift();if(e)e.synced=true;Sync.busy=false;Sync.lastAt=Date.now();if(window.onSync)onSync();flush();},260+Math.random()*420);}
function setOnline(v){Sync.online=v;if(v)flush();if(window.onSync)onSync();}
window.addEventListener('online',()=>{if(!Sync.forced)setOnline(true);});window.addEventListener('offline',()=>setOnline(false));

/* ---------- actions ---------- */
const Act={
  seatTable(b){const t=now();let n=0;b.seats.forEach(s=>{if(s.ar&&s.ar<=t&&!(s.st&&s.st<=t)){s.st=t;s.opSeat=t;n++;}});if(n){log('Seated guests',n+' at '+W.T[tableAt(b,t)].name);bump();}return n;},
  seatOne(s){const t=now();if(!(s.ar&&s.ar<=t)){s.ar=t;s.opScan=t;}s.st=t;s.opSeat=t;log('Seated guest',gName(s.g)+', seat '+s.n+', '+W.T[tableAt(s.b,t)].name);bump();},
  closeSeats(b){b.closed=true;log('Closed out seats',W.T[tableAt(b,now())].name);bump();},
  collect(b,method){const t=now(),m=money(b,t);b.payAt=t;b.declined=0;b.payMethod=method;log('Collected balance',aed(m.balance)+' by '+method+', '+W.T[tableAt(b,t)].name);bump();return m.balance;},
  chaseDeposit(b){b.chasedAt=now();log('Sent deposit reminder',gName(b.booker)+', '+W.T[b.table].name);bump();},
  markDeposit(b){b.depAt=now();log('Deposit received',aed(Math.round(b.min*b.depPct))+', '+W.T[b.table].name);bump();},
  nudge(b){b.nudgedAt=now();const c=seatCounts(b,now());log('Nudged unclaimed seats',(b.party-c.claimed)+' at '+W.T[b.table].name);bump();},
  confirmReq(b,min){b.min=min;b.at=now();if(b.depPct)b.depAt=0;log('Confirmed Backstage request',W.T[b.table].name+' for '+gName(b.booker)+', minimum '+aed(min));bump();},
  declineReq(b){b.cancelAt=now();log('Declined Backstage request',W.T[b.table].name+' for '+gName(b.booker));bump();},
  release(b,mgr,why){const t=now();b.relAt=t;log('Released table',W.T[tableAt(b,t)].name+(why?', '+why:''),mgr);bump();},
  move(b,toId,why){const t=now(),from=tableAt(b,t);b.moves.push({at:t,from,to:toId,why:why||'Moved by '+actor(),by:actor(),op:1});log('Moved party',gName(b.booker)+': '+W.T[from].name+' to '+W.T[toId].name);bump();},
  hold(tb,kind,who,hours){const t=now(),h={id:'H'+Math.random().toString(36).slice(2,8).toUpperCase(),table:tb.id,kind,who,from:t,until:t+hours*HOUR,relAt:0,op:1};W.holds.push(h);log('Held table',tb.name+' for '+who+', '+hours+'h');bump();return h;},
  releaseHold(h){h.relAt=now();log('Released hold',W.T[h.table].name+', '+h.who);bump();},
  book(d){const t=now(),tb=W.T[d.table],T=TIERS[tb.tier];let gi=d.guest;if(gi==null){const gst={i:W.guests.length,n:d.name,ph:d.phone||'',crm:0,v:0,res:true,mk:false,ltv:0};W.guests.push(gst);gi=gst.i;}
    const b={id:'B'+Math.random().toString(36).slice(2,8).toUpperCase(),table:tb.id,tier:tb.tier,sec:tb.sec,grp:T.grp,party:d.party,src:d.src,booker:gi,payer:gi,host:d.host,reqAt:0,at:t,min:d.comp?0:d.min,comp:!!d.comp,
      depPct:d.pay==='link'?VENUE.depositPct:0,depAt:0,pre:[],orders:[],seats:[],moves:[],arriveBy:Math.max(t+20*MIN,W.D+VENUE.arriveByMin*MIN),cancelAt:0,payAt:0,declined:0,note:d.note||'',vip:d.srcKind==='vip'||G(gi).crm===2,walk:d.srcKind==='walk',op:t,pay:d.pay,closed:false,xtra:[]};
    if(d.pay==='card'){b.depPct=VENUE.depositPct;b.depAt=t;}
    for(let i=0;i<d.party;i++){const here=d.srcKind==='walk'&&phase()==='live';const s={ref:'S'+Math.random().toString(36).slice(2,8).toUpperCase(),b,n:i+1,g:i===0?gi:-1,cl:i===0?t:0,ar:here?t:0,st:0,gate:T.grp==='bs'?'G4':'G3',opScan:0,opSeat:0};b.seats.push(s);W.seats.push(s);W.byRef[s.ref]=s;}
    W.bookings.push(b);log(d.comp?'Comped table':'Booked table',tb.name+' for '+G(gi).n+', party of '+d.party+', '+(d.comp?'comp: '+d.reason:aed(d.min)+' minimum, '+d.payLabel),d.mgr);bump();return b;},
  unbook(b){const i=W.bookings.indexOf(b);if(i>=0)W.bookings.splice(i,1);b.seats.forEach(s=>{const k=W.seats.indexOf(s);if(k>=0)W.seats.splice(k,1);delete W.byRef[s.ref];});log('Undid booking',W.T[b.table].name);bump();},
  queue(q,ok,mgr){q.op=now();q.ok=ok;const who=gName(q.g);
    if(q.type==='change'&&ok&&q.to){Act.move(q.b,q.to,'Guest request: '+q.want);}
    log((ok?'Approved ':'Declined ')+q.type,who+(q.amt?', '+aed(q.amt):''),mgr);bump();},
  offer(w,tb){w.offered=now();w.table=tb.id;log('Offered table to waitlist',tb.name+' to '+gName(w.g)+', party of '+w.party);bump();},
  ackAlert(a,what){a.ack=now();a.res=what;log('Fraud alert handled',what+', ticket '+a.ref);bump();},
  svc(r){r.op=now();log('Service request done',r.kind+', '+W.T[tableAt(r.b,now())].name);bump();},
  deliver(o,b){o.del=now();o.opDel=1;log('Order delivered',o.nm+', '+W.T[tableAt(b,now())].name);bump();},
  assign(o,runner){o.runner=runner;log('Runner assigned',runner+': '+o.nm);bump();},
  incident(type,zone,note){W.incidents.push({at:now(),type,zone,note,by:actor(),closed:0,op:1});W.incidents.sort((a,b)=>a.at-b.at);log('Logged incident',zone+': '+note);bump();},
  check(id,v){W.check[id]=v?now():0;log(v?'Checklist item done':'Checklist item reopened',CHECKLIST.find(c=>c.id===id).label);bump();},
  breakeven(val,mgr,note){const old=W.be.amt;W.be={amt:val,by:mgr,at:now(),note:note||''};log('Breakeven set',aed(old)+' to '+aed(val)+(note?': '+note:''),mgr);bump();},
  note(gi,txt){const gst=W.guests[gi];(gst.notes=gst.notes||[]).unshift({at:now(),by:actor(),txt});log('Guest note',gst.n+': '+txt);bump();},
  comp(b,item,mgr,why){b.orders.push({at:now(),nm:item[0],amt:item[1],seat:0,pre:0,comp:1,runner:RUNNERS[0],del:0});log('Comped item',item[0]+' ('+aed(item[1])+') at '+W.T[tableAt(b,now())].name+': '+why,mgr);bump();},
  discount(b,amt,mgr,why){b.disc=(b.disc||0)+amt;log('Discount applied',aed(amt)+' at '+W.T[tableAt(b,now())].name+': '+why,mgr);bump();},
  layout(tb,what){log('Layout edit',tb.name+': '+what);bump();},
  doorSale(n,method){const t=now();for(let i=0;i<n;i++){const gst={i:W.guests.length,n:'Door guest',ph:'',crm:0,v:0,res:false,mk:false,ltv:VENUE.doorPrice};W.guests.push(gst);
      const x={ref:'UD'+Math.random().toString(36).slice(2,7).toUpperCase(),k:TK.door,b:gst.i,g:gst.i,s:'door',at:t,pr:VENUE.doorPrice,cl:t,st:0,stAt:0,sc:t,gt:UI.gate,late:0,opScan:t};W.tix.push(x);W.byRef[x.ref]=x;}
    log('Door sale',n+' × '+aed(VENUE.doorPrice)+' by '+method+', '+UI.gate);bump();}
};

/* ---------- checklist state ---------- */
function checkState(Wd,t){return CHECKLIST.map(c=>{const manual=Wd.check[c.id];let done=manual!=null?!!manual:(c.auto!=null&&t>=Wd.D+c.auto);if(c.id==='layout'&&manual==null)done=Wd.layoutLocked;
  const due=Wd.D+c.due;return {c,done,due,late:!done&&t>due,soon:!done&&t>due-DAY};});}

/* ---------- scanning ---------- */
function parseCode(raw){const m=String(raw).trim().match(/(?:\/t\/|^)([A-Z][A-Z0-9]{5,7})$/i);return m?m[1].toUpperCase():null;}
function evalScan(raw,mode){
  const t=now(),ref=parseCode(raw),rec=ref&&W.byRef[ref];
  if(!rec){const other=ref&&Object.keys(Worlds).find(k=>k!==W.ev.id&&Worlds[k].byRef[ref]);
    return {tone:'bad',code:other?'WRONG_EVENT':'NOT_FOUND',title:other?'Wrong event':'Not a valid ticket',sub:other?'This ticket is for '+EVK[other].short+', '+fD(EVK[other].doors)+'.':'No ticket with this code for '+W.ev.short+'.',ref:ref||String(raw).slice(0,18)};}
  const seat=!!rec.b&&typeof rec.b==='object',gi=rec.g,gst=gi>=0?W.guests[gi]:null,r={rec,seat,gst,ref,name:gst?gst.n:'Unnamed ticket'};
  if(seat){const b=rec.b,tbl=W.T[tableAt(b,t)];Object.assign(r,{tier:TIERS[b.tier].label,table:tbl.name,tableId:tbl.id,seatN:rec.n,host:b.host,vip:b.vip,gateWant:rec.gate,b});
    if(!bActive(b,t))return Object.assign(r,{tone:'bad',code:'VOID',title:'Booking not active',sub:b.cancelAt?'Cancelled '+fDT(b.cancelAt)+'.':'Table released.'});}
  else{Object.assign(r,{tier:['Early entry','Second wave','VIP standing','Door ticket','Guest list','Promoter list'][rec.k],gateWant:rec.gt,vip:rec.k===TK.vips&&gst&&gst.crm===2});
    if(rec.st===1&&rec.stAt<=t)return Object.assign(r,{tone:'bad',code:'VOID',title:'Refunded ticket',sub:'Refunded '+fDT(rec.stAt)+'. Do not admit.'});}
  const at=seat?rec.ar:rec.sc,scanned=at&&at<=t;
  if(mode==='post')return Object.assign(r,scanned?{tone:'warn',code:'DUP',title:'Already scanned',sub:'Scanned at '+fT(at)+', '+GATE[seat?rec.gate:rec.gt].label+'.'}:{tone:'warn',code:'AUDIT',title:'Late scan, flagged',sub:'Doors closed '+fT(W.C)+'. Logged for audit, not counted as attendance.'});
  if(scanned)return Object.assign(r,{tone:'warn',code:'DUP',title:'Already scanned',sub:'Scanned at '+fT(at)+', '+GATE[seat?rec.gate:rec.gt].label+'.',firstAt:at});
  if(!gst)return Object.assign(r,{tone:'warn',code:'UNNAMED',title:'Ticket not claimed',sub:'No name on this '+(seat?'seat':'ticket')+'. Take the guest’s name and check ID.'});
  if(!seat&&(rec.k===TK.early||rec.k===TK.plist)&&t>W.D+VENUE.earlyCutMin*MIN)return Object.assign(r,{tone:'warn',code:'EARLY',title:rec.k===TK.early?'Early entry ended':'List closed at 22:00',sub:rec.k===TK.early?'Valid until '+fT(W.D+VENUE.earlyCutMin*MIN)+'. Upgrade to Second wave for '+aed(VENUE.earlyUpgrade)+'.':'Promoter list entry ended. Door ticket '+aed(VENUE.doorPrice)+'.'});
  return Object.assign(r,{tone:'ok',code:r.vip?'VIP':'OK',title:'Admit',sub:''});
}
function commitScan(r,how){const t=now(),rec=r.rec;if(r.seat){rec.ar=t;rec.gate=UI.gate;rec.opScan=t;if(!(rec.st&&rec.st>t))rec.st=0;rec.st=rec.st||0;UI.floor.ping={table:r.tableId,at:Date.now(),name:r.name};}
  else{rec.sc=t;rec.gt=UI.gate;rec.opScan=t;}
  log('Scanned in',r.name+', '+r.tier+(r.table?', '+r.table+' seat '+r.seatN:'')+', '+UI.gate+(how?' ('+how+')':''));if(r.vip)log('Host pinged',(r.host||'VIP host')+': '+r.name+' at '+UI.gate);bump();}
/* the people actually walking up to this gate next: the door's queue */
function scanQueue(n){const t=now(),out=[];const ph=phase();
  if(ph==='live'){for(const x of W.tix){if(x.sc>t&&x.sc<t+25*MIN&&x.k!==TK.door)out.push({at:x.sc,ref:x.ref});}
    for(const s of W.seats){if(s.ar>t&&s.ar<t+25*MIN&&bActive(s.b,t))out.push({at:s.ar,ref:s.ref});}
    out.sort((a,b)=>a.at-b.at);}
  return out.slice(0,n||12);}
function practiceSet(){const tx=W.tix,ok=tx.find(x=>x.k===TK.wave&&x.g>=0&&!x.st),early=tx.find(x=>x.k===TK.early&&x.g>=0&&!x.st),
  vip=W.seats.find(s=>s.b.vip&&s.n===1&&s.g>=0&&!s.b.cancelAt),ref=tx.find(x=>x.st===1),un=tx.find(x=>x.g<0&&!x.st);
  return [{l:'Valid ticket',ref:ok&&ok.ref},{l:'Backstage List guest',ref:vip&&vip.ref},{l:'Same ticket again',ref:ok&&ok.ref,dup:1},{l:'Unclaimed ticket',ref:un&&un.ref},{l:'Refunded ticket',ref:ref&&ref.ref},{l:'Unknown code',ref:'XX0000'}].filter(x=>x.ref);}

/* ---------- search across guests, tables, bookings ---------- */
function searchAll(q,limit){q=q.trim().toLowerCase();if(q.length<2)return [];const out=[],t=now();
  if(canTables())for(const T of W.tables){if(T.name.toLowerCase().includes(q)||T.id.toLowerCase()===q)out.push({type:'table',T});if(out.length>5)break;}
  const seen={};
  for(const b of W.bookings){if(!bActive(b,t)&&!bPending(b,t))continue;for(const s of b.seats){if(s.g<0||seen[s.g])continue;const gst=W.guests[s.g];
    if(gst.n.toLowerCase().includes(q)||gst.ph.replace(/\s/g,'').includes(q.replace(/\s/g,''))||s.ref.toLowerCase()===q){seen[s.g]=1;out.push({type:'seat',s,gst,b});}}if(out.length>(limit||40))return out;}
  for(const x of W.tix){if(x.at>t||x.g<0||seen[x.g])continue;const gst=W.guests[x.g];if(gst.n.toLowerCase().includes(q)||x.ref.toLowerCase()===q||gst.ph.replace(/\s/g,'').includes(q.replace(/\s/g,''))){seen[x.g]=1;out.push({type:'tix',x,gst});if(out.length>(limit||40))break;}}
  return out;}
function conflicts(gi,tableId){const out=[],t=now(),ix=S().ix,T=W.T[tableId];
  W.rules.forEach(r=>{if(r.a!==gi&&r.b!==gi)return;const other=r.a===gi?r.b:r.a,ob=W.bookings.find(b=>bActive(b,t)&&b.booker===other);if(!ob)return;const OT=W.T[tableAt(ob,t)],d=Math.hypot(OT.x-T.x,OT.z-T.z);
    if(r.kind==='apart'&&d<70)out.push({r,other,OT,d,bad:1});if(r.kind==='near'&&d>120)out.push({r,other,OT,d,bad:0});});
  const e=ix[tableId];if(e&&e.st==='held')out.push({hold:e.h,bad:1});return out;}
