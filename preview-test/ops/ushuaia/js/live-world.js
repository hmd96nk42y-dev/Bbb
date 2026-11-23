'use strict';
/* ============================================================
   LIVE WORLD · loaded in test and live mode only (in place of js/20-world.js)
   Sk's build says of its simulated world: "In production this file is
   replaced by the BUBL API + realtime feed; everything downstream
   (30-store selectors, all views) stays as is." This is that file.
   buildWorld(ev) gives the night's records, as BUBL's back end holds
   them for the person signed in, in the shapes the selectors read:
   every record with its own real timestamp. Nothing is generated.
   What BUBL has no record of is empty: no POS lines, no bar revenue,
   no waitlist, no seating rules, no staff plan.
   ============================================================ */
/* The simulated night shaped its sales with a curve, and the forecast read it. There is no forecast here until past
   events are imported (js/live-actions.js takes the forecast out of every figure), so the curve is flat. */
function saleCurve(){return 1;}
const HOLD_KIND={vip:'VIP hold',promoter:'Promoter hold',artist:'Artist hold',house:'House hold',hotel:'Hotel hold',vip_link:'VIP link'};
const ROLE_TEAM={owner:'Managers',host:'Hosts',door:'Door and scanning',runner:'Runners'};
const ms=iso=>iso?Date.parse(iso):0;

function buildWorld(ev){
  const N=BUBL.night,mine=N.service&&N.service.key===ev.id;
  const D=ev.doors,C=ev.close;
  const W={ev,D,C,ON:D-75*DAY,guests:[],tix:[],bookings:[],seats:[],tables:[],T:{},holds:[],byRef:{},alerts:[],svc:[],incidents:[],queue:[],waitlist:[],rules:[],staff:[],
    cost:[],be:{amt:0,by:'',at:0,note:'',unset:true},check:{},checkBy:{},windows:{},ops:[],layoutLocked:false,doorSales:0,interest:0,live:mine?N:null,loaded:mine};
  TABLE_DATA.forEach(a=>{const T=TIERS[a.tier],t={id:a.id,tier:a.tier,x:a.x,z:a.z,o:a.o,name:tableName(a.id),cap:a.cap||T.cap,min:a.min!=null?a.min:T.min,grp:T.grp,oos:!!a.oos,ox:a.x,oz:a.z,sec:a.sec,uuid:a.uuid};
    if(!t.sec)t.sec=secOf(t);W.tables.push(t);W.T[t.id]=t;});
  W.nB=Math.max(1,Math.ceil((C+90*MIN-D)/(5*MIN)));W.bucket=t=>clamp(Math.floor((t-D)/(5*MIN)),0,W.nB-1);
  W.exits=()=>0;W.barCum=new Array(W.nB).fill(0);W.barPlan=new Array(W.nB).fill(0);W.barFinal=0;W.finalIn=0;
  if(!mine)return W;   /* another night: its records are asked for when it is opened */

  const person=(name,more)=>{const g=Object.assign({i:W.guests.length,n:name||'Unnamed guest',ph:'',crm:0,v:0,res:true,idv:0,idvAt:0,age:null,mk:false,pc:false,ltv:0,prefs:null,notes:null},more||{});W.guests.push(g);return g.i;};
  let early=D;
  (N.bookings||[]).forEach(x=>{
    const T=W.T[x.table];if(!T)return;const tm=x.times||{},made=ms(x.created_at);if(made&&made<early)early=made;
    if(x.hold){   /* a hold the team placed */
      W.holds.push({id:x.id,table:(x.moves&&x.moves.length?x.moves[0].from:x.table),kind:HOLD_KIND[x.hold.kind]||'Hold',who:x.hold.for||x.hold.by||'The team',from:made,
        until:ms(x.hold_expires_at)||C,relAt:ms(tm.released)||0,live:x});return;}
    const Tr=TIERS[T.tier],h=x.host||{},booker=person(h.name,{ph:h.phone||'',email:h.email||'',checkId:!!h.check_id});
    const orig=x.moves&&x.moves.length?x.moves[0].from:x.table,OT=W.T[orig]||T;
    const requested=x.state==='requested'||!!tm.requested&&!tm.held;
    const confirmedAt=ms(tm.confirmed),min=fromMinor(x.minimum_minor)||0,depPct=Number(x.deposit_pct)||0;
    const b={id:x.ref,uid:x.id,table:OT.id,tier:OT.tier,sec:OT.sec,grp:Tr.grp,party:x.party,src:x.source||'direct',booker,payer:booker,host:(SECTIONS[OT.sec]||{}).host||'',
      reqAt:requested?made:0,at:requested?(confirmedAt||Infinity):made,min,comp:false,depPct,
      /* the deposit counts from the moment it was secured (the table confirmed) */
      depAt:depPct&&confirmedAt?confirmedAt:0,pre:[],orders:[],seats:[],moves:(x.moves||[]).map(m=>({at:ms(m.at),from:m.from,to:m.to,why:'',by:m.by||'',op:1})),
      arriveBy:D+VENUE.arriveByMin*MIN,cancelAt:ms(tm.cancelled)||0,relAt:ms(tm.released)||0,payAt:0,declined:0,note:'',vip:!!x.vip,walk:false,op:null,closed:x.state==='closed',xtra:[],
      state:x.state,live:x};
    (x.seats||[]).forEach(s=>{const gi=s.has_details||s.name?(s.n===1&&s.has_details?booker:person(s.name,{checkId:!!s.check_id,typedAtDoor:!s.has_details})):-1;
      const ar=ms(s.arrived_at);
      const seat={ref:x.ref+'-'+s.n,b,n:s.n,g:gi,cl:ms(s.claimed_at)||(s.n===1?made:0),ar,st:ar&&tm.seated?Math.max(ar,ms(tm.seated)):0,gate:'',opScan:0,opSeat:0,live:s};
      b.seats.push(seat);W.seats.push(seat);});
    if(!x.seats){for(let i=1;i<=x.party;i++){const seat={ref:x.ref+'-'+i,b,n:i,g:i===1?booker:-1,cl:i===1?made:0,ar:0,st:0,gate:'',opScan:0,opSeat:0};b.seats.push(seat);W.seats.push(seat);}}
    /* a table the host seated without a scan has arrived, by the host's word */
    if(tm.seated&&!b.seats.some(s=>s.ar)){const s0=b.seats[0];s0.ar=ms(tm.arrived)||ms(tm.seated);s0.st=ms(tm.seated);}
    if(x.change_request)W.queue.push({id:x.change_request.id,type:'change',at:ms(x.change_request.at),resAt:0,b,g:booker,want:'Asked for a table change',op:0,live:x.change_request});
    W.bookings.push(b);
  });
  W.ON=Math.min(W.ON,early);

  /* tickets: BUBL's counts for this night, one record per ticket. An owner is sent the day and the price of each
     sale; the door and hosts are sent counts only. Scans carry their real five-minute step and gate. */
  const types=GA.map(g=>g.id),sales=N.ticket_sales;
  types.forEach((key,k)=>{
    const agg=(N.tickets||[]).find(x=>x.type===key);if(!agg)return;const made=[];
    if(sales){sales.filter(x=>x.type===key).forEach(x=>{const at=Date.parse(x.day+'T12:00:00Z'),pr=fromMinor(x.revenue_minor)/x.n;if(at<W.ON)W.ON=at;
      for(let i=0;i<x.n;i++)made.push({ref:'',k,b:-1,g:-1,s:x.door_terminal?'door':'direct',at:Math.min(at,D),pr,cl:0,st:0,stAt:0,sc:0,gt:'',late:0,opScan:0});});}
    else for(let i=0;i<Number(agg.sold||0);i++)made.push({ref:'',k,b:-1,g:-1,s:'direct',at:0,pr:0,cl:0,st:0,stAt:0,sc:0,gt:'',late:0,opScan:0});
    let i=0;(N.scans||[]).filter(x=>x.kind==='ticket'&&x.type===key).forEach(x=>{for(let n=0;n<x.n&&i<made.length;n++,i++){made[i].sc=ms(x.t);made[i].gt=x.gate||'';}});
    made.forEach(x=>W.tix.push(x));
  });
  /* which gate a table's guests came through: the real scans of seats */
  W.seatGate={};(N.scans||[]).filter(x=>x.kind==='seat').forEach(x=>{W.seatGate[x.gate]=(W.seatGate[x.gate]||0)+x.n;});
  W.finalIn=W.tix.filter(t=>t.sc).length+W.seats.filter(s=>s.ar).length;

  const RES={dup:'dup',void:'void',wrong_event:'wrong',unpaid:'unpaid',late:'late',not_found:'unknown',override:'override'};
  (N.alerts||[]).forEach(a=>W.alerts.push({at:ms(a.at),type:RES[a.result]||a.result,ref:a.ref||'',gate:a.gate||'',first:0,firstGate:'',ack:a.result==='override'?ms(a.at):0,by:a.by,live:a}));
  (N.requests||[]).forEach(r=>{const b=W.bookings.find(x=>x.live&&tableAt(x,Date.now())===r.table)||W.bookings.find(x=>x.table===r.table);if(!b)return;
    W.svc.push({id:r.id,b,at:ms(r.at),kind:r.note,res:ms(r.done_at)||Infinity,op:ms(r.done_at)||0,by:r.by,doneBy:r.done_by,live:r});});
  (N.incidents||[]).forEach(x=>W.incidents.push({at:ms(x.at),type:x.type,zone:x.zone||'',note:x.note,by:x.by,closed:1}));
  (N.team||[]).forEach(x=>W.staff.push({role:ROLE_TEAM[x.role]||x.role,inAt:ms(x.first_seen_at),name:x.name||''}));
  if(N.breakeven)W.be={amt:fromMinor(N.breakeven.amount_minor),by:N.breakeven.by,at:ms(N.breakeven.at),note:N.breakeven.note||'',approvedBy:N.breakeven.approved_by};
  (N.checklist||[]).forEach(c=>{W.check[c.key]=c.done?ms(c.at):0;W.checkBy[c.key]={by:c.by,at:ms(c.at)};});
  (N.audit||[]).forEach(a=>W.ops.push({at:ms(a.at),who:a.who,role:ROLES[a.role]?a.role:'owner',action:a.action,detail:(a.detail||'')+(a.why?' · '+a.why:''),mgr:a.approved_by||null,synced:true}));
  W.interest=N.interested||0;
  return W;
}
