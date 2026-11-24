/* =====================================================================
   PROMOTER ACCESS
   The manager creates a promoter's access: which sections or tables they
   can sell, how many tickets and list spots, their cut on tickets, tables
   and their guests' bar spend, and the agreement that goes with it.
   An exclusive access hands the event to one event company.
   Sending creates the promoter's holds on the floor, a source for the
   promoter filter and scorecard, and the link to their promoter page.
   ===================================================================== */
const PA={list:null,seq:0,d:null,o:null};
/* the venue's own rules, from its profile (seed/ushuaia.venue.json): never hard-coded rates */
const RULES=CFG.RULES;
const SETTLE={dep:['Deposit to book','Their guest picks 50% or the full minimum on the invitation, can split it or send price-point links, and every card is held, not charged, until the table is secured.'],
  night:['Settle on the night','No deposit. The table is confirmed when the guest gives their details, and the minimum is collected at the table on arrival.'],
  choice:['They choose per invitation','Deposit by default. For a guest they vouch for, they can switch that invitation to settle on the night.']};
const holdRule=()=>'Held '+RULES.holdH+' hours on each invitation, '+RULES.shortHoldH+' hours in the last '+RULES.shortHoldDays+' days, never past '+(RULES.cutoffMin/60)+' hours before doors. After that, the guest pays in full straight away.';
const PA_LISTCUT='22:00',PA_SLUG='ushuaia-dxb';
const PA_STEPS=[['who','Who'],['tables','Tables'],['tickets','Tickets'],['cut','Cut'],['contract','Contract'],['send','Send']];
const PA_SUGG=['Pay within 7 days','Add a minimum guarantee of AED 250K','Add a no-show penalty','Add a non-compete for 7 days','Add an event cancellation clause','Bar spend 5%','Use DIFC Courts','Remove the review clause'];
const paSlug=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'promoter';
const paFirst=s=>String(s||'').trim().split(/\s+/)[0]||'';
const paPct=v=>(Math.round(v*10)/10).toString().replace(/\.0$/,'')+'%';
/* (test and live: a night that is over is not offered for a new access. Sk, 24 Nov 2026: "OPS offers past nights".) */
const paEvs=()=>EVENTS.filter(e=>e.announced&&!(LIVE&&e.close&&e.close<now()));
const paSecLabel=k=>SECTIONS[k].label;
const paSecShort=k=>SECTIONS[k].label.replace('Backstage','BS').replace('Platinum','Plat').replace(' · ',' ');
const paLink=a=>'https://bubl.app/'+PA_SLUG+'/p/'+paSlug(a.name)+(a.kind==='exclusive'?'/x':'');
const paCanEdit=()=>UI.role==='owner';
const paTkPrice=k=>GA[k].price;
const PA_TK=['early','wave','vips'];

/* ---------- the season's accesses: seeded from the promoters already on the floor ---------- */
function paAll(){if(LIVE)return livePaAll();   /* test and live: the venue's own agreements (live-partners.js) */
  if(PA.list)return PA.list;PA.list=[];
  const t=now(),ev=W.ev,proms=SOURCES.filter(s=>s.grp==='promoter');
  const RATES=CFG.PA_RATES;
  proms.forEach((s,i)=>{const own=[];
    W.holds.forEach(h=>{if(h.kind==='Promoter hold'&&h.who===s.label&&!(h.relAt&&h.relAt<=t))own.push(h.table);});
    W.bookings.forEach(b=>{if(b.src===s.id&&b.grp!=='bs'&&bActive(b,t)&&!own.includes(b.table))own.push(b.table);});
    if(s.id==='p3'){const pad=['PL08','GL07','GL08','GL11','VE2','VE3','PL04','PL05'];for(const id of pad){if(own.length>=8)break;if(!own.includes(id))own.push(id);}}
    const sold=[0,1,2].map(k=>W.tix.filter(x=>x.s===s.id&&x.k===k).length),r=RATES[s.id]||[s.comm*100,s.comm*100,0];
    const tix={early:Math.ceil(sold[0]*1.04/5)*5,wave:Math.ceil(sold[1]*1.06/5)*5,vips:Math.ceil(sold[2]*1.1/5)*5};
    const person=/^[A-Z][a-z]+ [A-Z]\.$/.test(s.label);
    const a={id:'PA'+(++PA.seq),src:s.id,name:person?s.label:CFG.PA_CONTACTS[i%4],company:person?'':s.label,ph:'+971 5'+(i+1)+' 4'+(20+i*7)+' '+(3100+i*411),email:'',licence:person?'':'DED '+(810000+i*3711),
      kind:'promoter',events:[ev.id],tmode:'tab',secs:[],tables:own.slice(0,Math.max(4,own.length)),cap:own.length,tix,list:s.id==='p3'?60:[40,50,60,40,50,30][i]||40,
      rates:{tix:r[0],tab:r[1],bar:r[2]},one:r[0]===r[1]&&!r[2],barBase:'over',payDays:14,release:48,settle:i===2?'choice':'dep',offers:{on:i===2,floor:CFG.PA_BLANK.offersFloor},notice:7,law:'dxb',extra:[],ovr:{},removed:{},
      status:'signed',created:W.ON+(3+i)*DAY,sentAt:W.ON+(3+i)*DAY+2*HOUR,openAt:W.ON+(3+i)*DAY+5*HOUR,signedAt:W.ON+(4+i)*DAY,venueSig:{by:ROLES.owner.who,at:W.ON+(3+i)*DAY+HOUR},promoSig:null,chg:{},log:[]};
    a.promoSig={by:a.name,at:a.signedAt};
    if(s.id==='p6'){a.status='sent';a.signedAt=0;a.promoSig=null;a.sentAt=t-26*HOUR;a.openAt=t-20*HOUR;a.created=t-27*HOUR;a.venueSig={by:ROLES.owner.who,at:t-26.2*HOUR};}
    PA.list.push(a);});
  return PA.list;}
function paWorld(evId){return !evId||evId===W.ev.id?W:(Worlds[evId]||(Worlds[evId]=buildWorld(EVK[evId])));}
const paFW=d=>!d||!d.events?W:(d!==PA.d&&d.events.includes(W.ev.id))?W:paWorld(d.events[0]);
const paFor=evId=>paAll().filter(a=>a.events.includes(evId));
const paLive=evId=>paFor(evId).filter(a=>a.status!=='revoked'&&a.status!=='paused');
const paExclusive=evId=>paLive(evId).find(a=>a.kind==='exclusive'&&(a.status==='signed'||a.status==='sent'));

/* ---------- what the floor allows ---------- */
function paTaken(d){const Wd=paFW(d),t=now(),ix=tableIndex(Wd,t),m={},me=d&&d.src;
  Wd.tables.forEach(T=>{const e=ix[T.id];if(T.oos){m[T.id]='taken';return;}if(!e)return;
    if(e.st==='booked'){m[T.id]=me&&e.b.src===me?'mineb':'taken';return;}
    if(e.st==='requested'){m[T.id]='taken';return;}
    if(e.st==='held'){if(d&&e.h.kind==='Promoter hold'&&e.h.who===paSrcLabel(d))return;m[T.id]=e.h.kind==='Promoter hold'?'promo':'taken';}});
  paLive(Wd.ev.id).forEach(a=>{if(d&&(a.id===d.id))return;if(a.tmode==='tab')a.tables.forEach(id=>{if(!m[id])m[id]='promo';});});
  return m;}
function paSrcLabel(d){return d.company||d.name;}
function paSecOpen(k,tk){return W.tables.filter(T=>T.sec===k&&!tk[T.id]).length;}
function paPool(d,tk){tk=tk||paTaken(d);if(d.tmode==='tab')return d.tables.slice();return W.tables.filter(T=>d.secs.includes(T.sec)&&(!tk[T.id]||tk[T.id]==='mineb')).map(T=>T.id);}
function paSoldBy(src,k,Wd){if(!src)return 0;const t=now();return (Wd||W).tix.filter(x=>x.s===src&&x.k===k&&x.at<=t&&!(x.st===1&&x.stAt<=t)).length;}
function paTixLeft(d){const Wd=paFW(d),s=Wd===W?S():snapshot(Wd,now()),out={};PA_TK.forEach((k,i)=>{const others=sum(paLive(Wd.ev.id).filter(a=>a.id!==(d&&d.id)),a=>Math.max(0,(a.tix[k]||0)-paSoldBy(a.src,i,Wd)));
  out[k]={alloc:GA[i].alloc,sold:s.tk.sold[i],others,left:Math.max(0,GA[i].alloc-s.tk.sold[i]-others+(d?paSoldBy(d.src,i,Wd):0))};});return out;}

/* ---------- money: what the allocation is worth and what it pays ---------- */
function paEstimate(d){const tk=paTaken(d),pool=paPool(d,tk),n=d.tmode==='sec'?Math.min(d.cap||pool.length,pool.length):pool.length;
  const avgMin=pool.length?sum(pool,id=>W.T[id].min)/pool.length:0,tabRev=n*avgMin*.82,tixRev=sum(PA_TK,(k,i)=>(d.tix[k]||0)*GA[i].price*.72),
    barRev=d.barBase==='over'?tabRev*.15:tabRev*1.15,r=paRates(d);
  return {n,tabRev,tixRev,barRev,rev:tabRev+tixRev,pay:tixRev*r.tix/100+tabRev*r.tab/100+barRev*r.bar/100,pTix:tixRev*r.tix/100,pTab:tabRev*r.tab/100,pBar:barRev*r.bar/100};}
function paRates(d){return d.one?{tix:d.rates.tix,tab:d.rates.tix,bar:d.rates.tix}:d.rates;}
function paToDate(a){const s=S(),so=a.src&&s.src[a.src],t=now();if(!so)return {rev:0,comm:0,n:0,bar:0,tab:0,tix:0};const r=paRates(a);
  let tixRev=0,tabMin=0,bar=0;W.tix.forEach(x=>{if(x.s===a.src&&x.k<3&&x.at<=t&&!(x.st===1&&x.stAt<=t))tixRev+=x.pr;});
  W.bookings.forEach(b=>{if(b.src!==a.src||!bActive(b,t)||b.comp)return;tabMin+=b.min;const m=b._m||money(b,t);bar+=a.barBase==='over'?m.over:m.spend;});
  return {tix:tixRev,tab:tabMin,bar,rev:tixRev+tabMin,comm:tixRev*r.tix/100+tabMin*r.tab/100+bar*r.bar/100,n:so.n};}
