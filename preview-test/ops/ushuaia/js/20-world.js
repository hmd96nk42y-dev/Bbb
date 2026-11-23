'use strict';
/* ============================================================
   20 · the world
   One event = one timeline. Every record carries its own timestamp,
   so "the state at time t" is a filter, never a mutation. Pre, Live,
   Post and the replay scrubber all read the same records.
   In production this file is replaced by the BUBL API + realtime feed;
   everything downstream (30-store selectors, all views) stays as is.
   ============================================================ */
function saleCurve(s,kind){const u=clamp(s/75,0,1);
  return kind==='table'?clamp(.45*(1-Math.exp(-s/8))+.35*u+.20*u*u*u,0,1):clamp(.30*(1-Math.exp(-s/6))+.22*u+.48*u*u*u*u,0,1);}
function invCurve(p,kind){let lo=0,hi=75;for(let i=0;i<22;i++){const m=(lo+hi)/2;if(saleCurve(m,kind)<p)lo=m;else hi=m;}return (lo+hi)/2;}
const STRENGTH={bc:1,adr:.9,art:.87,mo:.92,nw:1.07};

function buildWorld(ev){
  const R=rng(h32('ushuaia·'+ev.id)),D=ev.doors,C=ev.close,ON=D-75*DAY,K=STRENGTH[ev.id]||.9;
  const W={ev,D,C,ON,guests:[],tix:[],bookings:[],seats:[],tables:[],T:{},holds:[],byRef:{},alerts:[],svc:[],incidents:[],queue:[],waitlist:[],rules:[],staff:[],
    cost:COST_DEFAULT.map(c=>Object.assign({},c)),be:{amt:Math.round(4650000*(.9+.1*K)/10000)*10000,by:'Roland Keyali',at:ON+12*DAY,note:''},check:{},windows:{},ops:[],layoutLocked:false,doorSales:0};
  let refN=0;const ref=p=>{refN++;return p+((h32(ev.id+refN)%2176782336).toString(36).toUpperCase().padStart(6,'0')).slice(0,6);};
  function person(crmW,forceRes){const crm=R.w(crmW),res=forceRes!=null?forceRes:R.chance(.64);
    const cc=res?'+971 5'+R.int(0,8):R.pick(['+44 7','+966 5','+33 6','+49 15','+7 9','+91 9','+974 5','+1 6']);
    const gst={i:W.guests.length,n:R.pick(FIRST)+' '+R.pick(LAST),ph:cc+R.int(0,9)+' '+R.int(100,999)+' '+R.int(1000,9999),crm,v:crm===0?0:crm===1?R.int(1,4):R.int(4,14),
      res,idv:0,idvAt:0,age:null,mk:R.chance(.71),pc:R.chance(.58),ltv:0,prefs:null,notes:null};
    if(crm>0&&R.chance(crm===2?.9:.35)){gst.prefs=[R.pick(PREFS)];if(R.chance(.4))gst.prefs.push(R.pick(PREFS));}
    W.guests.push(gst);return gst;}
  function verify(gst,at){if(gst._v)return;if(gst.res&&R.chance(.78))gst._v=1;}

  /* ---- tables ---- */
  TABLE_DATA.forEach(a=>{const T=TIERS[a.tier],t={id:a.id,tier:a.tier,x:a.x,z:a.z,o:a.o,name:tableName(a.id),cap:T.cap,min:T.min,grp:T.grp,oos:false,ox:a.x,oz:a.z};t.sec=secOf(t);W.tables.push(t);W.T[t.id]=t;});

  /* ---- table bookings ---- */
  const finalP={bsA:.93,bsB:.87,bsC:1,vip:.92,plat:.9,gold:.86,silver:.8};
  const srcW={bs:[['host',42],['direct',16],['p3',8],['p5',7],['con',9],['corp',8],['art',6],['comp',4]],
    vip:[['host',24],['direct',30],['p1',8],['p2',7],['p3',6],['p5',5],['con',10],['corp',8],['ref',2]],
    plat:[['direct',38],['host',12],['p1',9],['p2',8],['p4',7],['p6',6],['con',9],['corp',5],['ref',6]],
    gold:[['direct',42],['host',8],['p1',8],['p2',7],['p4',9],['p6',9],['con',6],['ref',11]],
    silver:[['direct',46],['p1',7],['p4',10],['p6',12],['con',4],['ref',16],['host',5]]};
  const crmW={bs:[[0,.14],[1,.34],[2,.52]],vip:[[0,.3],[1,.46],[2,.24]],plat:[[0,.46],[1,.42],[2,.12]],gold:[[0,.56],[1,.38],[2,.06]],silver:[[0,.66],[1,.31],[2,.03]]};
  const packFor=tier=>MENU.packs.filter(p=>p[3].includes(tier));
  W.tables.forEach(t=>{
    const T=TIERS[t.tier];if(R()>finalP[t.tier]*Math.min(1.06,K+.02))return;
    const walk=!T.req&&T.grp!=='bs'&&T.grp!=='vip'&&R.chance(.06);
    let u=R();if(T.grp==='bs'||T.grp==='vip')u=Math.pow(u,1.5);
    let at=walk?D+R.int(35,200)*MIN:T.req?ON+70*DAY*Math.pow(R(),.8):Math.min(ON+invCurve(u,'table')*DAY+R()*DAY*.6,D-3*HOUR);
    const cap=T.cap,party=Math.max(2,R.w([[cap-4,1],[cap-2,2],[cap-1,2],[cap,4],[cap+1,1.1],[cap+2,.9],[cap+4,.4]]));
    const src=walk?'door':R.w(srcW[T.grp]),comp=src==='comp'||(src==='art'&&R.chance(.7));
    const baseMin=T.req?Math.round(T.min*R.pick([.85,1,1,1.15,1.3])/5000)*5000:T.min+Math.max(0,party-cap)*T.extra;
    const booker=person(crmW[T.grp],walk?null:undefined),payer=R.chance(.82)?booker:person([[0,.7],[1,.3]]);
    const b={id:ref('B'),table:t.id,tier:t.tier,sec:t.sec,grp:T.grp,party,src,booker:booker.i,payer:payer.i,host:SECTIONS[t.sec].host,
      reqAt:T.req?at:0,at,min:comp?0:baseMin,comp,depPct:comp?0:walk?0:R.w([[.5,.68],[1,.32]]),depAt:0,pre:[],orders:[],seats:[],moves:[],
      arriveBy:walk?at+10*MIN:D+VENUE.arriveByMin*MIN,cancelAt:0,payAt:0,declined:0,note:R.chance(.3)?R.pick(NOTE_POOL):'',vip:booker.crm===2||T.grp==='bs',walk,op:null,closed:false,xtra:[]};
    if(T.req){at=Math.min(at+R.int(24,190)*HOUR,D-6*HOUR);b.at=at;}
    b.depAt=b.depPct?(R.chance(.3)?Math.min(at+R.int(20,210)*HOUR,D-20*HOUR):at):0;
    if(!walk&&!comp&&R.chance(.55)){const pk=packFor(t.tier);const n=R.chance(.3)?2:1;for(let i=0;i<n&&pk.length;i++){const p=R.pick(pk);
      b.pre.push({nm:p[0],paid:p[1],credit:p[2],at:Math.min(at+(D-6*HOUR-at)*Math.sqrt(R()),D-6*HOUR),by:0});}}
    if(!walk&&R.chance(.018)&&!b.vip)b.cancelAt=at+(D-at)*(.3+.6*R());
    const noShow=!walk&&!b.cancelAt&&R.chance(.03);
    const tArr=walk?at+4*MIN:(R.chance(.86)?b.arriveBy-R.int(5,100)*MIN:b.arriveBy+R.int(0,48)*MIN);
    const slowSeat=R.chance(.07)?R.int(10,22)*MIN:0;
    for(let i=0;i<party;i++){
      let gi=-1,cl=0,ar=0;
      if(i===0){gi=booker.i;cl=at;verify(booker,at);}
      else if(walk||R.chance(.86)){const p=person([[0,.6],[1,.3],[2,.1]]);gi=p.i;cl=walk?at:(R.chance(.6)?Math.min(at+R()*3*DAY,D-HOUR):at+R()*(D-2*HOUR-at));verify(p,cl);}
      const shows=!noShow&&!b.cancelAt&&(gi<0?R.chance(.5):R.chance(i===0?.985:.92));
      if(shows){ar=tArr+(i===0?0:Math.abs(R.norm())*14*MIN+(R.chance(.15)?R.int(10,70)*MIN:0));ar=Math.min(ar,C-40*MIN);}
      const s={ref:ref('S'),b:b,n:i+1,g:gi,cl,ar,st:ar?ar+R.int(3,9)*MIN+slowSeat:0,gate:T.grp==='bs'?'G4':'G3',opScan:0,opSeat:0};
      b.seats.push(s);W.seats.push(s);W.byRef[s.ref]=s;}
    b.pre.forEach(p=>{p.by=R.int(0,Math.min(3,party-1));});
    /* live POS lines */
    const arr=b.seats.filter(s=>s.ar).sort((x,y)=>x.ar-y.ar);
    if(arr.length&&!comp){const first=arr[0].ar,preCredit=sum(b.pre,p=>p.credit),rest=Math.max(0,b.min-preCredit);
      b.pre.forEach(p=>{const slow=R.chance(.1);b.orders.push({at:first,nm:p.nm,amt:p.credit,seat:p.by,pre:1,runner:R.pick(RUNNERS),del:first+(slow?R.int(15,26):R.int(5,13))*MIN});});
      const target=rest*Math.exp(R.norm()*.3+.04),end=Math.max(first+30*MIN,C-25*MIN),pool=MENU.bottles.filter(x=>x[1]<5000||T.grp==='bs');let acc=0,guard=0;
      while(acc<target&&guard++<40){const it=R.chance(.82)?R.pick(pool):R.pick(MENU.small),q=it[1]>3000?1:R.int(1,2),oa=first+8*MIN+(end-first-8*MIN)*Math.pow(R(),.85),slow=R.chance(.1);if(it[1]>9000&&!R.chance(.25))continue;
        acc+=it[1]*q;b.orders.push({at:oa,nm:(q>1?q+' × ':'')+it[0],amt:it[1]*q,seat:R.int(0,arr.length-1),pre:0,runner:R.pick(RUNNERS),del:oa+(slow?R.int(15,24):R.int(4,12))*MIN});}
      b.orders.sort((x,y)=>x.at-y.at);
      if(R.chance(.03)){b.payAt=C-R.int(20,50)*MIN;}else b.payAt=C-R.int(15,160)*MIN;}
    if(comp&&arr.length){const first=arr[0].ar;for(let i=0;i<R.int(2,4);i++){const it=R.pick(MENU.bottles);b.orders.push({at:first+R.int(10,200)*MIN,nm:it[0],amt:it[1],seat:0,pre:0,runner:R.pick(RUNNERS),del:0,comp:1});}
      b.orders.forEach(o=>o.del=o.at+R.int(4,11)*MIN);b.orders.sort((x,y)=>x.at-y.at);}
    W.bookings.push(b);
  });
  /* a few parties get moved on the night (seating review + replay) */
  (function(){const open=W.tables.filter(t=>!W.bookings.some(b=>b.table===t.id));let n=0;
    W.bookings.forEach(b=>{if(n>=6||b.walk||b.grp==='bs')return;const first=b.seats.find(s=>s.ar);if(!first||!R.chance(.06))return;
      const k=open.findIndex(t=>t.tier===b.tier);if(k<0)return;const to=open.splice(k,1)[0];
      b.moves.push({at:first.ar+R.int(6,40)*MIN,from:b.table,to:to.id,why:R.pick(['Asked to be nearer the stage','Table next to speakers','Merged with friends','Spill at the table']),by:b.host});n++;});})();

  /* ---- holds on unbooked tables (promoter, artist, VIP) ---- */
  (function(){const open=W.tables.filter(t=>!W.bookings.some(b=>b.table===t.id));
    open.forEach(t=>{if(!R.chance(.42))return;const kind=t.grp==='bs'?R.w([['Artist hold',5],['VIP hold',5]]):R.w([['Promoter hold',6],['VIP hold',2],['House hold',2]]);
      const who=kind==='Promoter hold'?R.pick(SOURCES.filter(s=>s.grp==='promoter')).label:kind==='Artist hold'?ev.short+' management':kind==='VIP hold'?'The team':'Owner';
      W.holds.push({id:ref('H'),table:t.id,kind,who,from:ON+R.int(2,40)*DAY,until:D-R.pick([2,3,5,7,10,14,1])*DAY+R.int(0,20)*HOUR,relAt:0});});})();

  /* ---- entry tickets ---- */
  const tixSrc=[['direct',52],['ref',9],['p1',6],['p2',5],['p3',3],['p4',5],['p5',2],['p6',6],['con',4],['corp',3]];
  const gaCrm=[[0,.68],[1,.28],[2,.04]];
  function issue(k,price,at,buyer,holder,cl,src,gate){const t={ref:ref('U'),k,b:buyer.i,g:holder?holder.i:-1,s:src,at,pr:price,cl,st:0,stAt:0,sc:0,gt:gate,late:0,opScan:0};W.tix.push(t);W.byRef[t.ref]=t;return t;}
  function sellOrder(k,price,at,src,gateF){const n=R.w([[1,2.4],[2,4.2],[3,1.6],[4,1.4],[5,.5],[6,.5]]),buyer=person(gaCrm);verify(buyer,at);const out=[];
    for(let i=0;i<n;i++){let h=null,cl=0;if(i===0){h=buyer;cl=at;}else if(R.chance(.8)){h=person(gaCrm);cl=R.chance(.6)?Math.min(at+R()*3*DAY,D-HOUR):at+R()*(D-2*HOUR-at);verify(h,cl);}
      out.push(issue(k,price,at,buyer,h,cl,src,gateF()));}return out;}
  const gaGate=()=>R.chance(.58)?'G1':'G2';
  (function(){const need=GA[0].alloc+Math.round(4450*K),orders=[];let n=0;
    while(n<need){const at=Math.min(ON+7*DAY*(R()<.06?R():1)+invCurve(R(),'ga')*DAY*(68/75)+R()*DAY*.5,D-2*HOUR);orders.push(at);n+=2.3;}
    orders.sort((a,b)=>a-b);let sold=0;
    orders.forEach(at=>{if(sold>=need)return;const k=sold<GA[0].alloc?TK.early:TK.wave;const ts=sellOrder(k,GA[k].price,at,R.w(tixSrc),gaGate);sold+=ts.length;});
    const vn=Math.round(760*K);let v=0;while(v<vn){let u=Math.pow(R(),1.2);const at=Math.min(ON+invCurve(u,'table')*DAY+R()*DAY*.5,D-2*HOUR);v+=sellOrder(TK.vips,GA[2].price,at,R.w(tixSrc.concat([['host',14]])),()=>'G3').length;}})();
  /* comps, promoter lists, door sales */
  (function(){for(let i=0;i<Math.round(180*K);i++){const p=person([[0,.4],[1,.4],[2,.2]]),at=D-R.int(1,20)*DAY;issue(TK.comp,0,at,p,p,at,R.chance(.55)?'art':'comp','G4');}
    const pl=SOURCES.filter(s=>s.grp==='promoter');for(let i=0;i<Math.round(260*K);i++){const p=person(gaCrm),at=D-R.int(1,9)*DAY-R()*DAY;issue(TK.plist,0,at,p,p,at,R.pick(pl).id,gaGate());}
    for(let i=0;i<Math.round(420*K);i++){const p=person([[0,.85],[1,.15]]),at=D+clamp(150+R.norm()*70,20,300)*MIN;const t=issue(TK.door,VENUE.doorPrice,at,p,p,at,'door',gaGate());t.sc=at;}})();
  /* status changes + arrivals */
  W.tix.forEach(t=>{if(t.k===TK.door)return;
    if(t.pr&&R.chance(.012)){t.st=1;t.stAt=t.at+(D-t.at)*R();}
    else if(t.g>=0&&t.pr&&R.chance(.025)){t.st=2;t.stAt=t.at+(D-t.at)*(.4+.6*R());const p=person(gaCrm);t.from=t.g;t.g=p.i;t.cl=t.stAt;}
    const showP=t.st===1?0:t.g<0?.6:{0:.93,1:.91,2:.95,4:.82,5:.74}[t.k];
    if(!R.chance(showP))return;let m;
    if(t.k===TK.early||t.k===TK.plist){m=R.chance(.05)?R.int(122,175):5+115*Math.pow(R(),.55);if(m>VENUE.earlyCutMin)t.late=1;}
    else if(t.k===TK.vips)m=clamp(150+R.norm()*45,20,300);else if(t.k===TK.comp)m=clamp(140+R.norm()*60,15,320);else m=clamp(162+R.norm()*52,12,335);
    t.sc=D+m*MIN+R()*MIN;});
  /* anomalies the door will meet */
  (function(){const sc=W.tix.filter(t=>t.sc&&t.k<3);for(let i=0;i<26;i++){const t=R.pick(sc);W.alerts.push({at:t.sc+R.int(2,45)*MIN,type:'dup',ref:t.ref,gate:R.chance(.5)?t.gt:gaGate(),first:t.sc,firstGate:t.gt,ack:0});}
    for(let i=0;i<9;i++){R.pick(sc);R.pick(FIRST);R.pick(LAST);}
    W.tix.filter(t=>t.st===1).slice(0,5).forEach(t=>W.alerts.push({at:D+R.int(40,200)*MIN,type:'void',ref:t.ref,gate:t.gt,ack:0}));
    W.alerts.sort((a,b)=>a.at-b.at);})();

  /* ---- service requests, incidents, staff ---- */
  W.bookings.forEach(b=>{const first=b.seats.find(s=>s.ar);if(!first)return;const n=R.w([[0,5],[1,3],[2,1]]);
    for(let i=0;i<n;i++){const at=first.ar+R.int(15,220)*MIN;if(at>C-10*MIN)continue;W.svc.push({id:ref('R'),b,at,kind:R.w([['Ice and mixers',4],['Host to the table',3],['Bill requested',2],['Sparkler show',1.4],['Security assist',.5]]),res:at+(R.chance(.1)?R.int(15,26):R.int(2,9))*MIN,op:0});}});
  W.svc.sort((a,b)=>a.at-b.at);
  [[108,'cap','Gate 2','Queue over 12 minutes. Overflow lane opened.',1],[104,'cap','Gate 1','Early entry rush, all lanes open.',1],[155,'med','Gold · Left','Heat, guest seated and given water. Cleared by medic.',1],
   [190,'ops','Platinum · Right','Spill on the deck stairs, cleaned.',1],[212,'sec','Pit','Guest removed for pushing. No injuries.',1],[236,'cap','Front floor','Density near the rail, security spread the crowd.',1],
   [262,'ops','Bars','Ice delivery late to the south bar, 9 minutes.',1],[318,'sec','Gate 3','Entry refused, ID did not match ticket.',1],[352,'med','VIP · Right','Minor cut, treated at the table.',1]]
    .forEach(a=>W.incidents.push({at:D+a[0]*MIN+R.int(-6,6)*MIN,type:a[1],zone:a[2],note:a[3],by:'Control',closed:a[4]}));
  STAFF_PLAN.forEach(sp=>{for(let i=0;i<sp.plan;i++){const absent=R.chance(sp.role==='Runners'?.12:.05);W.staff.push({role:sp.role,inAt:absent?0:D-R.int(55,150)*MIN+(R.chance(.08)?R.int(60,140)*MIN:0)});}});

  /* ---- queues: backstage confirmations, deposits, transfers, refunds, change requests ---- */
  W.tix.forEach(t=>{if(t.st===2&&R.chance(.5))W.queue.push({id:ref('Q'),type:'transfer',at:t.stAt-R.int(4,60)*HOUR,resAt:t.stAt,ref:t.ref,g:t.from,to:t.g,amt:t.pr,op:0});
    if(t.st===1)W.queue.push({id:ref('Q'),type:'refund',at:t.stAt-R.int(6,70)*HOUR,resAt:t.stAt,ref:t.ref,g:t.b,amt:t.pr,why:R.pick(['Cannot travel','Bought twice','Event clash','Medical']),op:0});});
  W.bookings.forEach(b=>{if(b.cancelAt)W.queue.push({id:ref('Q'),type:'refund',at:b.cancelAt-R.int(6,40)*HOUR,resAt:b.cancelAt,b,g:b.booker,amt:Math.round(b.min*b.depPct),why:R.pick(['Group cancelled','Travel changed']),op:0});
    else if(!b.walk&&R.chance(.035))W.queue.push({id:ref('Q'),type:'change',at:b.at+(D-b.at)*R(),resAt:0,b,g:b.booker,want:R.pick(['Closer to the stage','A bigger table, two more guests','Next to '+tableName(R.pick(W.tables).id),'Left side, away from the stairs']),op:0});});
  W.queue.filter(q=>q.type==='change').forEach(q=>q.resAt=Math.min(q.at+R.int(30,160)*HOUR,D-4*HOUR));
  for(let i=0;i<5;i++){const b=R.pick(W.bookings);W.queue.push({id:ref('Q'),type:'dispute',at:C+R.int(3,90)*HOUR,resAt:0,b,g:b.payer,amt:R.pick([1500,3350,6000,2500,9200]),why:R.pick(['Card dispute on final bill','Says a bottle was not delivered','Charged minimum, left early']),op:0});}
  for(let i=0;i<7;i++){const t=R.pick(W.tix);W.queue.push({id:ref('Q'),type:'refund',at:C+R.int(2,40)*HOUR,resAt:0,ref:t.ref,g:t.b,amt:t.pr||300,why:R.pick(['Refused at the door, no ID','Early entry expired, would not upgrade','Queue too long, left']),op:0});}
  W.queue.sort((a,b)=>a.at-b.at);

  /* ---- waitlist + interest ---- */
  for(let i=0;i<Math.round(44*K);i++){const grp=R.w([['bs',2],['vip',3],['plat',3],['gold',2],['silver',1.5]]),p=person(crmW[grp]);
    W.waitlist.push({id:ref('W'),g:p.i,party:R.int(4,14),grp,budget:R.pick([8000,10000,12000,15000,20000,25000,35000,50000]),at:D-R.int(1,40)*DAY-R()*DAY,offered:0,table:null});}
  for(let i=0;i<7;i++){const p=person([[0,.8],[1,.2]]);W.waitlist.push({id:ref('W'),g:p.i,party:R.int(4,10),grp:R.pick(['gold','silver','plat']),budget:R.pick([6000,8000,10000,15000]),at:D+R.int(40,210)*MIN,offered:0,table:null,walk:1});}
  W.waitlist.sort((a,b)=>a.at-b.at);
  W.interest=Math.round(1840*K);

  /* ---- separation / adjacency rules ---- */
  (function(){const bk=W.bookings.filter(b=>b.vip&&!b.cancelAt);if(bk.length<8)return;
    [['apart','Dispute at Mahmut Orhan, NYE'],['apart','Ex business partners'],['apart','Asked not to be seated near'],['near','Same wedding party'],['near','Brothers, book separately every time']].forEach(r=>{
      const a=R.pick(bk);let b=R.pick(bk),n=0;while((b===a||(r[0]==='near'&&b.sec!==a.sec))&&n++<40)b=R.pick(bk);W.rules.push({kind:r[0],a:a.booker,b:b.booker,why:r[1]});});})();

  /* ---- precomputed night profile: 5-minute buckets ---- */
  W.nB=Math.ceil((C+90*MIN-D)/(5*MIN));W.bucket=t=>clamp(Math.floor((t-D)/(5*MIN)),0,W.nB-1);
  W.finalIn=W.tix.filter(t=>t.sc).length+W.seats.filter(s=>s.ar).length;
  W.exits=t=>{if(t<=D+150*MIN)return 0;const early=.04*clamp((t-(D+150*MIN))/(C-D-150*MIN),0,1),main=.96/(1+Math.exp(-(t-(C-50*MIN))/(26*MIN)));return Math.round(W.finalIn*Math.min(1,early+main));};
  (function(){const ga=new Array(W.nB).fill(0);W.tix.forEach(t=>{if(t.sc)ga[W.bucket(t.sc)]++;});
    const gaFinal=sum(ga);let cum=0,rev=0;W.barCum=new Array(W.nB).fill(0);W.barPlan=new Array(W.nB).fill(0);
    for(let i=0;i<W.nB;i++){cum+=ga[i];const t=D+i*5*MIN,inside=Math.max(0,cum-W.exits(t)*(gaFinal/Math.max(1,W.finalIn))),ph=(t-D)/(C-D);
      const rate=(34+26*Math.exp(-Math.pow((ph-.52)/.26,2)))*(1+.08*Math.sin(i*1.7));rev+=t<C?inside*rate/12:0;W.barCum[i]=rev;W.barPlan[i]=0;}
    W.barFinal=rev;})();
  /* guest value: what the CRM would know after this night */
  W.bookings.forEach(b=>{const v=Math.max(b.min,sum(b.orders,o=>o.comp?0:o.amt));W.guests[b.booker].ltv+=v;});
  W.tix.forEach(t=>{W.guests[t.b].ltv+=t.pr;});
  return W;
}
