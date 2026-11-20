'use strict';
/* ============================================================
   60 · HOME
   Modules are small objects with a tile (glance) and a detail
   (bottom sheet on the handheld, panel on Atlas). The phase and
   the role decide which modules appear, never the other way round.
   ============================================================ */
const M={};
const tile=(id,lbl,val,sub,viz,o)=>gxTile(id,lbl,val,sub,viz,o);
const hbar=(lbl,frac,val,cls,mark,hatchFrac)=>'<div class="hb"><span>'+lbl+'</span><div class="tr"><i class="'+(cls||'')+'" style="width:'+clamp(frac*100,0,100).toFixed(1)+'%"></i>'+(hatchFrac?'<i class="h" style="left:'+clamp(frac*100,0,100).toFixed(1)+'%;width:'+clamp(hatchFrac*100,0,100-frac*100).toFixed(1)+'%"></i>':'')+(mark!=null?'<em style="left:'+clamp(mark*100,0,100)+'%"></em>':'')+'</div><b class="n">'+val+'</b></div>';
const row=(ic,tone,title,sub,right,act)=>'<'+(act?'button':'div')+' class="row '+(act?'tap':'')+'" '+(act||'')+'><div class="ri '+(tone||'')+'">'+(IC[ic]?I(ic,17):esc(ic))+'</div><div class="rt"><b>'+title+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</div><div class="ra">'+(right||'')+'</div></'+(act?'button':'div')+'>';
const pl=(n,one,many)=>n===1?one:(many||one+'s');
const empty=txt=>'<p class="note" style="padding:6px 0">'+txt+'</p>';
function pendingQ(types){const t=now();return W.queue.filter(q=>types.includes(q.type)&&q.at<=t&&!q.op&&(!q.resAt||q.resAt>t));}
const pastShow=id=>.8+(h32('show'+id)%15)/100;
ON.mod=el=>openMod(el.dataset.id);
function openMod(id){const m=M[id];if(!m)return;if(m.go&&!gapFor(id).full.length){m.go();return;}if(gapFor(id).full.length){ON.integGap({dataset:{id}});return;}if(!m.detail)return;
  Sheet.open({title:m.t,sub:m.sub?(()=>m.sub(S())):'',tall:!!m.tall,static:!!m.static,body:()=>m.detail(S()),foot:m.foot?(()=>m.foot(S())):'',onOpen:m.onOpen,onPaint:m.onPaint});}

const HOME={
  pre:{owner:['position','agent','needs','pace','sell','forecast','sources','windows','waitlist','claims','noshowp','ready','intel','data'],host:['agent','needs','claims','waitlist','ready','intel'],door:['ready','noshowp','sell','claims'],runner:['ready','noshowp']},
  live:{owner:['position','agent','needs','arrivals','head','ring','gates','split','noshow','vipl','fraud','staff','minspend','hourly','incidents','waitl','data'],host:['mysec','agent','needs','ring','vipl','waitl','incidents','intel'],door:['arrivals','head','gates','fraud','incidents','staff'],runner:['runs','svcm','incidents']},
  post:{owner:['closeout','agent','attend','recon','tablesmin','promoters','newknown','tiers','coatt','refunds','season','follow','lessons','data'],host:['closeout','agent','tablesmin','follow'],door:['closeout','attend','lessons'],runner:['closeout','lessons']}
};
const Home={
  render(v){const p=phase(),ids=HOME[p][UI.role]||[],s=S();
    v.innerHTML='<div class="page" id="home">'+this.html(ids,s)+(p==='post'&&UI.role==='owner'?'<button class="btn pri full" data-act="report" style="position:sticky;bottom:10px;box-shadow:0 10px 30px rgba(60,45,10,.3)">'+I('dl',18)+'Download report (PDF)</button>':'')+'</div>';
    this.ids=ids;},
  html(ids,s){let out='',grid='';const flush=()=>{if(grid){out+='<div class="tiles">'+grid+'</div>';grid='';}};
    ids.forEach(id=>{const m=M[id];if(!m)return;if(m.hero){flush();out+='<section data-mod="'+id+'">'+modHTML(id,s,'home')+'</section>';}else grid+='<div data-mod="'+id+'" style="display:contents">'+modHTML(id,s,'home')+'</div>';});flush();return out;},
  update(){const s=S(),ae=document.activeElement;(this.ids||[]).forEach(id=>{const el=$('[data-mod="'+id+'"]');if(!el||(ae&&ae.tagName==='INPUT'&&el.contains(ae)))return;const h=modHTML(id,s,'home');if(el._h!==h){el.innerHTML=h;el._h=h;}});}
};

/* =================== PRE =================== */
function positionHero(s,live){if(LIVE)return livePositionHero(s,live);   /* test and live: real figures only (live-views.js) */
  const f=s.fin,be=f.breakeven,toBE=f.collected/be,past=f.collected>=be,mode=UI.home.posMode||'bar';
  const headline=live?(past?'Breakeven passed. '+AK(f.profit)+' clear so far.':AK(be-f.collected)+' to breakeven.'):(past?'Breakeven passed on cash collected.':P(f.collected,be)+' of breakeven collected. '+(f.gross>=be?'Committed balances take it past.':AK(be-f.gross)+' still to sell.'));
  return '<div class="hud hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="lbl">Financial position</span>'+
    (live?'<button class="btn xs" data-act="mod" data-id="cost">Breakeven</button>':'<div class="seg" style="width:164px"><button class="'+(mode==='bar'?'on':'')+'" data-act="posMode" data-m="bar">Position</button><button class="'+(mode==='day'?'on':'')+'" data-act="posMode" data-m="day">By day</button></div>')+'</div>'+
    '<div class="big n" style="margin-top:10px">'+aedK(f.collected).replace('AED ','<small style="margin:0 6px 0 0">AED</small>')+'<small>collected</small></div><p class="sub" style="margin-top:6px;color:var(--t2)">'+headline+'</p>'+
    (mode==='day'&&!live?'<div style="margin-top:12px">'+cumChart(s,W)+'</div>':posBar(f,live)+posLegend(f,live))+
    (live?nightHero(s):'<div class="stat3"><div><b>'+P(s.bePct,1)+'</b><span>sold at breakeven</span></div><div><b>'+aedK(s.fc.profit)+'</b><span>projected profit</span></div><div><button data-act="mod" data-id="cost" style="display:block"><b class="gold" style="font-family:var(--body);font-size:14px;font-weight:700;letter-spacing:0">Breakeven</b><span>set by '+esc(String(W.be.by).split(' ')[0])+'</span></button></div></div>')+'</div>';}
ON.posMode=el=>{UI.home.posMode=el.dataset.m;refresh(true);};
M.position={t:'Financial position',hero:s=>positionHero(s,s.ph!=='pre'&&phase()!=='pre'),
  panel:s=>positionHero(s,phase()!=='pre')};

M.cost={t:'Breakeven',sub:s=>LIVE?liveCostSub():'Set by '+esc(W.be.by)+' · '+fDT(W.be.at),static:true,
  detail:s=>{if(LIVE)return liveCostDetail(s);const c=s.cost,f=s.fin,past=f.collected>=c.breakeven;return '<p class="note">The breakeven is the manager’s number for this event: everything it costs to put on, in one figure. BUBL doesn’t see supplier invoices or payroll, so profit in BUBL means revenue above this line. Changing it needs a Manager PIN.</p>'+
    '<div class="grp"><div class="lbl">Breakeven for '+esc(W.ev.short)+'</div><label class="be-in"><span class="n">AED</span><input class="be-inp n" id="beAmt" inputmode="numeric" autocomplete="off" value="'+n0(c.breakeven)+'" aria-label="Breakeven in AED"></label><input class="inp" id="beNote" placeholder="What it covers, optional: artist, production, staff, licences" value="'+esc(W.be.note||'')+'"></div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Set by</span><b>'+esc(W.be.by)+'</b><span>Last changed</span><b class="n">'+fDT(W.be.at)+'</b><span>Collected so far</span><b>'+A(f.collected)+'</b><span>'+(past?'Above breakeven':'Still to breakeven')+'</span><b class="'+(past?'gold':'')+'">'+A(Math.abs(f.collected-c.breakeven))+'</b><span>Reached at</span><b>'+P(s.bePct,1)+' of potential sold</b><span>Forecast revenue</span><b>'+A(s.fc.gross)+'</b><span>Forecast profit</span><b>'+A(s.fc.profit)+'</b></div></div>';},
  foot:()=>'<button class="btn pri full" data-act="costSave">'+I('lock',17)+'Save breakeven</button>'};
ON.costSave=()=>{const el=Sheet.top().el,i=$('#beAmt',el),nt=$('#beNote',el),v=parseFloat(String(i.value).replace(/[^0-9.]/g,''));if(isNaN(v)||v<=0){toast('Enter the breakeven in AED.');return;}
  const nv=Math.round(v),note=nt?nt.value.trim():'';if(nv===W.be.amt&&note===(W.be.note||'')){toast('No changes to save.');return;}
  withPin('Set the breakeven to '+aed(nv),m=>{Act.breakeven(nv,m,note);_snap=null;const o=Sheet.top();if(o){o._b=null;Sheet.paint(o);}refresh(true);toast('Breakeven set to '+aedK(nv)+'.');});};

function needsPre(s){return needsOk(needsPre0(s));}
function needsPre0(s){const t=now(),out=[],q=pendingQ(['transfer','refund']),ch=pendingQ(['change']),ck=checkState(W,t).filter(c=>c.late||c.soon);
  const exp=W.holds.filter(h=>s.ix[h.table]&&s.ix[h.table].h===h&&h.until-t<48*HOUR);
  if(s.tb.depDue.length)out.push({id:'chase',tone:'warn',ic:'card',title:N(s.tb.depDue.length)+pl(s.tb.depDue.length,' deposit')+' to chase',sub:AK(sum(s.tb.depDue,b=>b._m.depDue))+' on invitations not paid yet'});
  if(s.tb.pending)out.push({id:'vipconf',tone:'neu',ic:'star',title:N(s.tb.pending)+' Backstage '+pl(s.tb.pending,'request')+' waiting',sub:'The team is holding these guests for your answer'});
  if(q.length)out.push({id:'queue',tone:'warn',ic:'swap',title:N(q.length)+' transfers and refunds',sub:AK(sum(q,x=>x.amt||0))+' across the queue'});
  if(ch.length)out.push({id:'changes',tone:'neu',ic:'edit',title:N(ch.length)+' table change '+pl(ch.length,'request'),sub:'Guests asked to move'});
  if(exp.length)out.push({id:'holds',tone:'warn',ic:'clock',title:N(exp.length)+pl(exp.length,' hold expires',' holds expire')+' within 48h',sub:'Release or extend before they lapse'});
  if(ck.length)out.push({id:'ready',tone:ck.some(c=>c.late)?'bad':'warn',ic:'flag',title:N(ck.length)+' readiness '+pl(ck.length,'item')+' due',sub:esc(ck[0].c.label)});
  return out;}
function needsOk(list){return list.filter(x=>!gapFor(x.id).full.length);}
function needsCard(list,title){return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">'+title+'</span><span class="n mut">'+list.length+'</span></div>'+
  (list.length?'<div class="rows" style="margin-top:4px">'+list.map(x=>row(x.ic,x.tone,x.title,x.sub+((x.src||NSRC[x.id])?'<em class="nsrc">'+I('net',11)+esc(x.src||NSRC[x.id])+'</em>':''),I('right',16),'data-act="mod" data-id="'+x.id+'"')).join('')+'</div>':'<p class="note" style="margin-top:8px">Nothing is waiting on you.</p>')+'</div>';}
M.needs={t:'Needs you',hero:s=>phase()==='live'?needsCard(needsLive(s),'Needs you now'):needsCard(needsPre(s),'Needs you')};

M.chase={t:'Deposits and balances',sub:s=>aedK(s.fin.committed)+' committed, due on the night',detail:s=>{const t=now();
  return (s.tb.depDue.length?'<div class="grp"><div class="lbl">Deposits not paid on the invitation</div><div class="rows">'+s.tb.depDue.map(b=>'<div class="row" style="grid-template-columns:auto 1fr"><div class="ri warn">'+I('card',17)+'</div><div class="rt"><b>'+esc(gName(b.booker))+' · '+esc(W.T[b.table].name)+'</b><span>'+A(b._m.depDue)+' deposit, invitation sent '+fAgo(t-b.at)+(b.chasedAt?' · reminded '+fAgo(t-b.chasedAt):'')+'</span>'+
      '<div class="btnrow" style="margin-top:8px"><button class="btn xs" data-act="chase" data-b="'+b.id+'">'+I('msg',14)+'Remind</button><button class="btn xs ok" data-act="depPaid" data-b="'+b.id+'">'+I('check',14)+'Mark paid</button><button class="btn xs" data-act="relB" data-b="'+b.id+'">'+I('lock',14)+'Release</button></div></div></div>').join('')+'</div></div>':empty('Every deposit is paid.'))+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Deposits collected</span><b>'+A(s.fin.dep)+'</b><span>Balances due on the night</span><b>'+A(s.fin.committed)+'</b><span>Tables on full prepay</span><b class="n">'+W.bookings.filter(b=>bActive(b,t)&&b.depPct===1).length+'</b><span>Pre-orders paid</span><b>'+A(s.tb.pre-s.tb.saved)+'</b></div></div><p class="note">A balance is the table minimum less what is already paid. Pre-orders are credited at full menu value.</p>';}};
ON.chase=el=>{const b=bk(el.dataset.b);Act.chaseDeposit(b);toast('Reminder sent to '+esc(gName(b.booker))+' on WhatsApp.');refresh(true);};
ON.depPaid=el=>{const b=bk(el.dataset.b);Act.markDeposit(b);toast('Deposit recorded for '+esc(W.T[b.table].name)+'.');refresh(true);};
ON.relB=el=>{const b=bk(el.dataset.b);withPin('Release '+W.T[tableAt(b,now())].name,m=>{Act.release(b,m,'released by manager');toast(esc(W.T[b.table].name)+' released and back on sale.');refresh(true);});};

M.vipconf={t:'Backstage confirmations',sub:()=>'Rings B and C are held for the Backstage List',detail:s=>{const t=now(),pend=W.bookings.filter(b=>bPending(b,t)),bl=W.bookings.filter(b=>bActive(b,t)&&b.grp==='bs');
  return (pend.length?'<div class="rows">'+pend.map(b=>{const gst=G(b.booker);return '<div class="row" style="grid-template-columns:auto 1fr"><div class="ri neu">'+initials(gst.n)+'</div><div class="rt"><b>'+esc(gst.n)+' · '+esc(W.T[b.table].name)+'</b><span>Party of '+N(b.party)+(LIVE?'':' · '+crmLabel(gst)+', '+N(gst.v)+' visits')+' · asked '+fAgo(t-b.reqAt)+'</span>'+
    '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap"><div class="step"><button data-act="reqMin" data-b="'+b.id+'" data-d="-5000" aria-label="Lower minimum">'+I('minus',16)+'</button><b style="min-width:92px;font-size:15px">'+kfmt(b.min)+'</b><button data-act="reqMin" data-b="'+b.id+'" data-d="5000" aria-label="Raise minimum">'+I('plus',16)+'</button></div>'+
    '<button class="btn sm ok" data-act="reqOk" data-b="'+b.id+'">'+I('check',15)+'Confirm</button><button class="btn sm" data-act="reqNo" data-b="'+b.id+'">Decline</button></div></div></div>';}).join('')+'</div>':empty('No Backstage requests are waiting.'))+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Backstage tables confirmed</span><b class="n">'+bl.length+' of '+W.tables.filter(x=>x.grp==='bs').length+'</b><span>Backstage List guests booked</span><b class="n">'+W.bookings.filter(b=>bActive(b,t)&&G(b.booker).crm===2).length+'</b><span>Backstage minimums committed</span><b>'+A(sum(bl,b=>b.min))+'</b></div></div>';}};
ON.reqMin=el=>{const b=bk(el.dataset.b);b.min=Math.max(20000,b.min+(+el.dataset.d));Sheet.top()._b=null;Sheet.refresh(true);};
ON.reqOk=el=>{const b=bk(el.dataset.b);Act.confirmReq(b,b.min);toast('Confirmed. The team has told '+esc(gName(b.booker))+'. The deposit is on their invitation.');refresh(true);};
ON.reqNo=el=>{const b=bk(el.dataset.b);Act.declineReq(b);toast('Declined. The team will offer '+esc(gName(b.booker))+' Backstage A.');refresh(true);};

M.queue={t:'Transfers and refunds',detail:s=>{const q=phase()==='post'?pendingQ(['refund','dispute']):pendingQ(['transfer','refund']),t=now();
  return q.length?'<div class="rows">'+q.map(x=>'<div class="row" style="grid-template-columns:auto 1fr"><div class="ri '+(x.type==='dispute'?'bad':'warn')+'">'+I(x.type==='transfer'?'swap':x.type==='dispute'?'alert':'undo',17)+'</div><div class="rt"><b>'+({transfer:'Transfer',refund:'Refund',dispute:'Dispute'}[x.type])+' · '+esc(gName(x.g))+'</b><span>'+(x.type==='transfer'?'Ticket '+N(x.ref)+' to '+esc(gName(x.to)):(x.b?esc(W.T[x.b.table].name)+' · ':x.ref?'Ticket '+N(x.ref)+' · ':'')+esc(x.why||''))+' · '+A(x.amt)+' · '+fAgo(t-x.at)+'</span>'+
    '<div class="btnrow" style="margin-top:8px"><button class="btn xs ok" data-act="qOk" data-q="'+x.id+'">'+(x.type==='transfer'?I('check',14):I('lock',14))+(x.type==='dispute'?'Accept':'Approve')+'</button><button class="btn xs" data-act="qNo" data-q="'+x.id+'">'+(x.type==='dispute'?'Contest':'Decline')+'</button></div></div></div>').join('')+'</div><p class="note">Refunds need a Manager PIN. A transfer voids the old QR and issues a new named ticket.</p>':empty('The queue is clear.');}};
ON.qOk=el=>{const q=W.queue.find(x=>x.id===el.dataset.q),go=m=>{Act.queue(q,true,m);toast(({transfer:'Transfer approved. New ticket issued.',refund:'Refund approved.',dispute:'Dispute accepted.',change:'Change approved.'})[q.type]);refresh(true);};if(q.type==='transfer')go();else withPin('Approve '+q.type+' of '+aed(q.amt),go);};
ON.qNo=el=>{const q=W.queue.find(x=>x.id===el.dataset.q);Act.queue(q,false);toast('Declined. The guest is told why.');refresh(true);};
M.changes={t:'Table change requests',detail:s=>{const q=pendingQ(['change']),t=now();return q.length?'<div class="rows">'+q.map(x=>'<div class="row" style="grid-template-columns:auto 1fr"><div class="ri neu">'+I('edit',17)+'</div><div class="rt"><b>'+esc(gName(x.g))+' · '+esc(W.T[tableAt(x.b,t)].name)+'</b><span>“'+esc(x.want)+'” · asked '+fAgo(t-x.at)+'</span><div class="btnrow" style="margin-top:8px"><button class="btn xs" data-act="moveFrom" data-b="'+x.b.id+'" data-q="'+x.id+'">'+I('floor',14)+'Pick a table</button><button class="btn xs" data-act="qNo" data-q="'+x.id+'">Decline</button></div></div></div>').join('')+'</div>':empty('No change requests.');}};
M.holds={t:'Holds',sub:()=>'Each hold releases itself when its timer ends',detail:s=>{const t=now(),hs=W.holds.filter(h=>s.ix[h.table]&&s.ix[h.table].h===h).sort((a,b)=>a.until-b.until);
  return hs.length?'<div class="rows">'+hs.map(h=>'<div class="row"><div class="ri '+(h.until-t<48*HOUR?'warn':'')+'">'+I('lock',17)+'</div><div class="rt"><b>'+esc(W.T[h.table].name)+' · '+esc(h.kind)+'</b><span>For '+esc(h.who)+' · releases in '+N(fDur(h.until-t))+'</span></div><div class="ra"><button class="btn xs" data-act="holdExt" data-h="'+h.id+'">+24h</button><button class="btn xs" data-act="holdRel" data-h="'+h.id+'">Release</button></div></div>').join('')+'</div>':empty('No tables are held.');}};
ON.holdRel=el=>{const h=W.holds.find(x=>x.id===el.dataset.h);Act.releaseHold(h);toast(esc(W.T[h.table].name)+' is back on sale.');refresh(true);};
ON.holdExt=el=>{const h=W.holds.find(x=>x.id===el.dataset.h);h.until+=DAY;log('Extended hold',W.T[h.table].name+', +24h');bump();refresh(true);};

M.pace={t:'Sales pace',tile:s=>{const d=s.days.today,vs=s.days.com[d]/Math.max(1,TARGET.presale*blendCurve(d))-1;
    return tile('pace','Sales pace',(vs>=0?'+':'')+(vs*100).toFixed(0)+'<small>%</small>','vs target at T−'+Math.max(0,75-d),spark(s.days.com.slice(Math.max(0,d-21),d+1)));},
  detail:s=>{const d=s.days.today,now_=s.days.com[d],tg=TARGET.presale*blendCurve(d),pv=PAST[0].gross*.74*blendCurve(Math.max(0,d-2)),wk=now_-s.days.com[Math.max(0,d-7)],left=Math.max(1,75-d);
    return paceChart(s)+'<div class="hud" style="padding:14px"><div class="kv"><span>Presale booked so far</span><b>'+A(now_)+'</b><span>Against target for today</span><b>'+trend((now_/tg-1)*100,'%')+'</b><span>Against '+esc(PAST[0].name)+' at the same point</span><b>'+trend((now_/pv-1)*100,'%')+'</b><span>Last 7 days</span><b>'+A(wk)+'</b><span>Needed per day to hit target</span><b>'+A(Math.max(0,TARGET.presale-now_)/left)+'</b></div></div><p class="note">Presale is tickets plus table minimums booked. Dotted lines are projections, not sales.</p>';}};

M.sell={t:'Sell-through by tier',tile:s=>{const a=sum(GA,x=>x.alloc);return tile('sell','Sell-through',pct(s.gaSold,a)+'<small>tickets</small>',N(pct(s.tb.booked,s.tb.total))+' of tables booked','<div class="meter"><i style="width:'+pct(s.gaSold,a)+'"></i></div>');},
  detail:s=>'<div class="grp"><div class="lbl">Entry tickets</div>'+GA.map((x,i)=>hbar(x.label,s.tk.sold[i]/x.alloc,s.tk.sold[i]>=x.alloc*.985?'Sold out':n0(s.tk.sold[i])+' / '+n0(x.alloc))).join('')+'</div>'+
    '<div class="grp"><div class="lbl">Tables</div>'+TIER_ORDER.map(k=>{const b=s.tb.byTier[k];return hbar(TIERS[k].label,b.booked/b.total,b.booked+' / '+b.total,'',null,(b.held+b.pending)/b.total);}).join('')+
    '<div class="leg"><span><i class="sw-au"></i>Booked</span><span><i class="sw-com"></i>Held or requested</span></div></div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Tickets sold</span><b class="n">'+n0(s.gaSold)+' of '+n0(sum(GA,x=>x.alloc))+'</b><span>Tables booked</span><b class="n">'+s.tb.booked+' of '+s.tb.total+'</b><span>Table minimums booked</span><b>'+A(s.tb.minSum)+'</b><span>Refunded tickets</span><b class="n">'+s.tk.refunded+'</b></div></div>'};

M.forecast={t:'Revenue forecast',tile:s=>tile('forecast','Forecast',kfmt(s.fc.gross)+'<small>AED</small>','Profit '+N(aedK(s.fc.profit))+' at this pace'),
  detail:s=>{const f=s.fc,line=(l,v,sp,now_)=>'<div class="row" style="grid-template-columns:1fr auto"><div class="rt"><b>'+l+'</b><span>'+N(aedK(v*(1-sp)))+' to '+N(aedK(v*(1+sp)))+(now_!=null?' · '+N(aedK(now_))+' booked':'')+'</span></div><div class="ra"><b class="n" style="font-size:16px">'+aedK(v)+'</b></div></div>';
    return '<div class="rows">'+line('Tickets',f.tix,.06,s.fin.tix)+line('Tables, minimums',f.tables,.05,s.tb.minSum)+line('F&B on the night',f.fb,.16,s.ph==='pre'?null:s.fin.bar+s.tb.over)+line('Door sales',f.door,.25,s.ph==='pre'?null:s.fin.door)+'</div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Forecast revenue</span><b class="gold">'+A(f.gross)+'</b><span>Breakeven, set by the manager</span><b>'+A(f.costs)+'</b><span>Projected profit</span><b>'+A(f.profit)+'</b><span>Season target</span><b>'+A(TARGET.gross)+'</b>'+(f.att?'<span>Expected through the gates</span><b class="n">'+n0(f.att)+'</b>':'')+'</div></div>'+
    '<p class="note">Tickets and tables are projected from this event’s own sales curve. F&B uses past events’ spend per head and the share of tables that go over their minimum.</p>';}};

function srcSlices(s,mode){const cls=['f-gold','f-g1','f-g2','f-g3'];return SRC_GROUPS.map((g_,i)=>({id:g_[0],label:g_[1],cls:cls[i],v:sum(SOURCES.filter(x=>x.grp===g_[0]),x=>s.src[x.id][mode==='n'?'n':'rev'])}));}
M.sources={t:'Where sales come from',tile:s=>{const sl=srcSlices(s,'rev'),tot=sum(sl,x=>x.v)||1;return tile('sources','Sources',pct(sl[0].v,tot)+'<small>direct</small>','Promoters '+N(pct(sl[1].v,tot))+', partners '+N(pct(sl[2].v,tot)));},
  detail:s=>{const mode=UI.home.srcMode||'rev',sel=UI.home.srcSel||'direct',sl=srcSlices(s,mode),tot=sum(sl,x=>x.v)||1,live=s.ph!=='pre',grp=SOURCES.filter(x=>x.grp===sel).map(x=>({x,d:s.src[x.id]})).filter(o=>o.d.n).sort((a,b)=>b.d.rev-a.d.rev);
    const small=grp.filter(o=>o.d.rev<tot*.01&&mode==='rev'),main=grp.filter(o=>!small.includes(o));
    return '<div class="seg"><button class="'+(mode==='rev'?'on':'')+'" data-act="srcMode" data-m="rev">By revenue</button><button class="'+(mode==='n'?'on':'')+'" data-act="srcMode" data-m="n">By tickets and seats</button></div>'+
    '<div style="display:flex;align-items:center;gap:14px"><div style="width:160px;flex-shrink:0">'+donut(sl,sel,[mode==='rev'?kfmt(tot):n0(tot),mode==='rev'?'AED':'guests'])+'</div><div class="leg" style="flex-direction:column;gap:9px;margin:0">'+sl.map(x=>'<span><i class="sw-'+x.cls.slice(2).replace('gold','au')+'"></i>'+x.label+' '+N(pct(x.v,tot))+'</span>').join('')+'</div></div>'+
    '<div class="grp"><div class="lbl">'+SRC_GROUPS.find(x=>x[0]===sel)[1]+' · tap a slice to switch</div><div class="rows">'+main.map(o=>row(o.x.label[0],'',esc(o.x.label),(live?'Show rate '+N(pct(o.d.in,o.d.n))+' · ':LIVE?'':'Showed '+N(pct(pastShow(o.x.id),1))+' last season · ')+N(n0(o.d.n))+' guests'+(o.d.spend?' · table spend '+N(aedK(o.d.spend)):'')+(o.x.comm?' · commission '+N(aedK(o.d.comm)):''),'<b class="n">'+aedK(o.d.rev)+'</b>')).join('')+
      (small.length?row('…','','Other, '+small.length+' small sources',small.map(o=>esc(o.x.label)).join(', '),'<b class="n">'+aedK(sum(small,o=>o.d.rev))+'</b>'):'')+'</div></div>';}};
ON.srcMode=el=>{UI.home.srcMode=el.dataset.m;Sheet.refresh(true);if(UI.device==='atlas')Atlas.update(true);};
ON.slice=el=>{UI.home.srcSel=el.dataset.id;Sheet.refresh(true);if(UI.device==='atlas')Atlas.update(true);};

function windowsList(s){const t=now(),ON_=W.ON,D=W.D,earlyOut=s.tk.sold[0]>=GA[0].alloc*.985,w=(id,l,opens,closes,note)=>{const ov=W.windows[id];let st=t<opens?'soon':t>=closes?'closed':'open';if(ov)st=ov;return {id,l,opens,closes,note,st};};
  return [w('bl','Backstage List presale',ON_,D,'Rings B and C, and first pick of every section'),w('ret','Returning guests',ON_+3*DAY,D,'Anyone who has attended before'),w('gen','General on sale',ON_+7*DAY,D,'All tables and tickets'),
    Object.assign(w('early','Early entry tier',ON_+7*DAY,D,GA[0].alloc+' tickets at '+aed(GA[0].price)),earlyOut?{st:'sold'}:{}),w('plist','Promoter lists',D-10*DAY,D+VENUE.earlyCutMin*MIN,'Free entry before 22:00, named guests only'),w('door','Door sales',D,W.C-90*MIN,aed(VENUE.doorPrice)+' at Gates 1 and 2')];}
M.windows={t:'Presale windows and access',tile:s=>{const l=windowsList(s),open=l.filter(x=>x.st==='open').length,nx=l.filter(x=>x.st==='soon').sort((a,b)=>a.opens-b.opens)[0];return tile('windows','Presale windows',open+'<small>open</small>',nx?esc(nx.l)+' in '+N(fDur(nx.opens-now())):'All windows have opened');},
  detail:s=>'<div class="rows">'+windowsList(s).map(x=>row(x.st==='open'?'check':x.st==='soon'?'clock':x.st==='sold'?'check':'lock',x.st==='open'?'ok':'',esc(x.l),esc(x.note)+' · '+(x.st==='soon'?'opens '+N(fDS(x.opens)):'opened '+N(fDS(x.opens))),
      (x.st==='sold'?pill('mut','Sold out'):x.st==='open'?'<button class="btn xs" data-act="winT" data-w="'+x.id+'" data-to="closed">Close</button>':x.st==='closed'&&now()<x.closes?'<button class="btn xs" data-act="winT" data-w="'+x.id+'" data-to="open">Reopen</button>':x.st==='soon'?'<button class="btn xs" data-act="winT" data-w="'+x.id+'" data-to="open">Open now</button>':pill('mut','Closed')))).join('')+'</div><p class="note">Opening or closing a window changes what guests can buy right away, so it needs a Manager PIN.</p>'};
ON.winT=el=>{const id=el.dataset.w,to=el.dataset.to;withPin((to==='open'?'Open':'Close')+' a sales window',m=>{W.windows[id]=to;log('Sales window '+(to==='open'?'opened':'closed'),id,m);bump();refresh(true);});};

function bestTableFor(w,s){const open=W.tables.filter(T=>T.grp===w.grp&&!T.oos&&!s.ix[T.id]&&TIERS[T.tier].min<=w.budget*1.15&&!W.waitlist.some(o=>o.table===T.id));return open.sort((a,b)=>b.z-a.z)[0];}
function waitRows(s,list){const t=now();return list.map(w=>{const gst=G(w.g),T=w.offered?W.T[w.table]:bestTableFor(w,s);
  return '<div class="row"><div class="ri '+(gst.crm===2?'neu':'')+'">'+initials(gst.n)+'</div><div class="rt"><b>'+esc(gst.n)+' · party of '+N(w.party)+'</b><span>Wants '+esc(GROUPS.find(x=>x[0]===w.grp)[1])+' up to '+N(aedK(w.budget))+' · '+crmLabel(gst)+' · waiting '+fAgo(t-w.at).replace(' ago','')+'</span></div><div class="ra">'+
    (w.offered?tag('ok','check','Offered '+esc(T.name)):T?'<button class="btn xs pri" data-act="offer" data-w="'+w.id+'" data-t="'+T.id+'">Offer '+esc(T.id)+'</button>':pill('mut','No table free'))+'</div></div>';}).join('');}
M.waitlist={t:'Waitlist and demand',tile:s=>{const t=now(),wl=W.waitlist.filter(w=>w.at<=t&&!w.offered);return tile('waitlist','Waitlist',wl.length+'<small>parties</small>',N(aedK(sum(wl,w=>w.budget)))+' in budgets waiting');},
  detail:s=>{const t=now(),wl=W.waitlist.filter(w=>w.at<=t),open=wl.filter(w=>!w.offered),int=Math.round(W.interest*clamp((t-W.ON)/(W.D-W.ON),0,1));
    return '<div class="grp"><div class="lbl">Demand by section</div>'+GROUPS.map(g_=>{const n=open.filter(w=>w.grp===g_[0]).length,free=W.tables.filter(T=>T.grp===g_[0]&&!s.ix[T.id]).length;return hbar(g_[1],n/Math.max(1,open.length),n+' waiting, '+free+' free','g');}).join('')+'</div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Parties waiting</span><b class="n">'+open.length+'</b><span>Combined budget</span><b>'+A(sum(open,w=>w.budget))+'</b><span>Asked to be told when tables open</span><b class="n">'+n0(int)+'</b></div></div>'+
    '<div class="grp"><div class="lbl">One-tap offers</div><div class="rows">'+(waitRows(s,wl.slice().sort((a,b)=>G(b.g).crm-G(a.g).crm||b.budget-a.budget).slice(0,14))||empty('Nobody is waiting.'))+'</div></div><p class="note">An offer holds the table for 2 hours and sends the guest an invitation with that table on WhatsApp. The deposit is on the invitation.</p>';}};
ON.offer=el=>{const w=W.waitlist.find(x=>x.id===el.dataset.w),T=W.T[el.dataset.t];Act.offer(w,T);Act.hold(T,'Waitlist offer',gName(w.g),2);toast(esc(T.name)+' offered to '+esc(gName(w.g))+'. Held for 2 hours.');refresh(true);};

M.claims={t:'Seats and tickets claimed',tile:s=>tile('claims','Seats claimed',pct(s.tb.claimed,s.tb.seats)+'',N(n0(s.tb.seats-s.tb.claimed))+' table seats without a name','<div class="meter"><i style="width:'+pct(s.tb.claimed,s.tb.seats)+'"></i></div>'),
  detail:s=>{const t=now(),low=W.bookings.filter(b=>bActive(b,t)&&b._c&&b._c.claimed<b.party).sort((a,b)=>a._c.claimed/a.party-b._c.claimed/b.party).slice(0,12);
    return hbar('Table seats',s.tb.claimed/Math.max(1,s.tb.seats),n0(s.tb.claimed)+' / '+n0(s.tb.seats))+hbar('Named tickets',s.tk.named/Math.max(1,s.tk.named+s.tk.unnamed),n0(s.tk.named)+' / '+n0(s.tk.named+s.tk.unnamed))+
    '<p class="note">Each guest claims their own seat on the booker’s invitation, with a code sent to their phone. Unclaimed seats are the door’s slowest scans, so chase them before the night.</p>'+
    '<div class="grp"><div style="display:flex;justify-content:space-between;align-items:center"><span class="lbl">Tables with open seats</span>'+(isOn('wa')?'<button class="btn xs" data-act="nudgeAll">Nudge all under half</button>':'')+'</div><div class="rows">'+low.map(b=>row(String(b._c.claimed),'',esc(W.T[b.table].name)+' · '+esc(gName(b.booker)),N(b._c.claimed)+' of '+N(b.party)+' claimed'+(b.nudgedAt?' · nudged '+fAgo(t-b.nudgedAt):''),isOn('wa')?'<button class="btn xs" data-act="nudge" data-b="'+b.id+'">'+I('bell',14)+'Nudge</button>':'')).join('')+'</div></div>';}};
ON.nudge=el=>{const b=bk(el.dataset.b);Act.nudge(b);toast('Nudged the unclaimed seats at '+esc(W.T[b.table].name)+'.');refresh(true);};
ON.nudgeAll=()=>{const t=now(),l=W.bookings.filter(b=>bActive(b,t)&&seatCounts(b,t).claimed<b.party/2);l.forEach(b=>{b.nudgedAt=t;});log('Nudged unclaimed seats',l.length+' tables under half claimed');bump();toast('Nudged '+N(l.length)+' tables.');refresh(true);};

M.noshowp={t:'Predicted no-shows',tile:s=>{const ns=PAST[3],ga=s.gaSold*ns.noShowGA,st=s.tb.seats*ns.noShowSeat,tot=s.gaSold+s.tb.seats;return tile('noshowp','No-show forecast',pct(ga+st,tot,1),'About '+N(n0(ga+st))+' of '+N(n0(tot))+' will not come');},
  detail:s=>{const rows=[['Early entry',s.tk.sold[0],.07],['Second wave',s.tk.sold[1],.105],['VIP standing',s.tk.sold[2],.05],['Table seats',s.tb.seats,PAST[3].noShowSeat],['Guest list and promoter lists',s.tk.sold[4]+s.tk.sold[5],.22]],exp=sum(rows,r=>r[1]*(1-r[2])),issued=sum(rows,r=>r[1]),fcIssued=s.fc.att?s.fc.att/(1-.1):issued,head=VENUE.capacity-(s.fc.att||exp)*.97;
    return '<div class="rows">'+rows.map(r=>'<div class="row" style="grid-template-columns:1fr auto"><div class="rt"><b>'+r[0]+'</b><span>'+N(n0(r[1]))+' issued · expect '+N(n0(r[1]*(1-r[2])))+' through the gate</span></div><div class="ra"><b class="n">'+(r[2]*100).toFixed(1)+'%</b></div></div>').join('')+'</div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Issued so far</span><b class="n">'+n0(issued)+'</b><span>Expected attendance on the night</span><b class="n">'+n0(s.fc.att||exp)+'</b><span>Licensed capacity</span><b class="n">'+n0(VENUE.capacity)+'</b><span>Headroom at peak</span><b class="n '+(head<200?'warn':'')+'">'+n0(head)+'</b></div></div>'+
    '<p class="note">Rates are from past events: '+N((PAST[3].noShowGA*100).toFixed(1)+'%')+' of tickets and '+N((PAST[3].noShowSeat*100).toFixed(1)+'%')+' of table seats did not arrive. '+(head>300?'There is room to release about '+N(n0(Math.floor(head/100)*100))+' more Second wave tickets and stay under capacity at peak.':'Hold further releases. Peak is forecast close to capacity.')+'</p>';}};

M.ready={t:'Readiness',tile:s=>{const c=checkState(W,now()),d=c.filter(x=>x.done).length,late=c.some(x=>x.late);return tile('ready','Readiness',d+'<small>of '+c.length+'</small>',late?'Something is overdue':'On track for doors','<div class="meter"><i style="width:'+pct(d,c.length)+'"></i></div>',{dot:late?'bad':null});},
  detail:s=>{const t=now();return '<div class="rows">'+checkState(W,t).map(x=>'<button class="row tap" data-act="chk" data-c="'+x.c.id+'" data-v="'+(x.done?0:1)+'"><div class="ri '+(x.done?'ok':x.late?'bad':x.soon?'warn':'')+'">'+I(x.done?'check':x.late?'alert':'clock',17)+'</div><div class="rt"><b>'+esc(x.c.label)+'</b><span>'+esc(x.c.who)+' · '+(x.done?'done':x.late?'overdue by '+N(fDur(t-x.due)):'due '+N(fD(x.due)+' '+fT(x.due)))+'</span></div><div class="ra">'+(x.done?pill('ok','Done'):x.late?pill('bad','Overdue'):pill('mut','Open'))+'</div></button>').join('')+'</div>'+
    '<div class="btnrow"><button class="btn sm" data-act="brief">'+I('msg',16)+'Send arrival brief</button><button class="btn sm" data-act="goPractice">'+I('scan',16)+'Scan drill</button></div><p class="note">Layout lock is set from the Floor tab. The ticket manifest downloads to every signed-in device one hour before doors so scanning works offline.</p>';}};
ON.chk=el=>{Act.check(el.dataset.c,el.dataset.v==='1');refresh(true);};
ON.brief=()=>{Act.check('comms',true);toast('Arrival brief sent to '+N(n0(S().tk.named+S().tb.claimed))+' named guests: gate, arrive-by time, ID to bring.');refresh(true);};
ON.goPractice=()=>{Sheet.close(true);if(UI.device==='atlas'){UI.atlas='door';Atlas.render();}else setTab('scan');};
