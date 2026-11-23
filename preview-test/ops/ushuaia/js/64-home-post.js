'use strict';
/* ============================================================
   64 · HOME · POST
   Report-style. The same numbers feed the PDF (85-report.js),
   so the screen and the document can never disagree.
   ============================================================ */
function postStats(Wd,s){if(Wd._post&&Wd._postK===Wd.rev+':'+Math.floor(s.t/HOUR))return Wd._post;const t=s.t,D=Wd.D,C=Wd.C,p={};
  /* attendance */
  p.show=[['Early entry',s.tk.sold[0],s.tk.in[0]],['Second wave',s.tk.sold[1],s.tk.in[1]],['VIP standing',s.tk.sold[2],s.tk.in[2]],['Table seats',s.tb.seats,s.tb.seatIn],['Guest list and comps',s.tk.sold[4],s.tk.in[4]],['Promoter lists',s.tk.sold[5],s.tk.in[5]],['Door tickets',s.tk.sold[3],s.tk.in[3]]];
  p.issued=sum(p.show,r=>r[1]);p.inAll=sum(p.show,r=>r[2]);p.showRate=p.inAll/Math.max(1,p.issued);
  p.bySrc=SRC_GROUPS.map(g_=>{const l=SOURCES.filter(x=>x.grp===g_[0]);return {id:g_[0],label:g_[1],n:sum(l,x=>s.src[x.id].n),in:sum(l,x=>s.src[x.id].in),rev:sum(l,x=>s.src[x.id].rev),comm:sum(l,x=>s.src[x.id].comm)};});
  /* arrivals: the busiest five minutes, from scans. Exits aren't counted, so there is no peak inside or time spent */
  let cum=0,arrW=0;for(let i=0;i<Wd.nB;i++){const n=sum([0,1,2,3,4],k=>s.arr[k][i]);cum+=n;arrW+=n*(D+i*5*MIN);}
  p.peak=Math.round(s.peak||0);p.peakAt=s.peakAt||D;p.avgArr=arrW/Math.max(1,cum);p.rush=s.peakAt;
  /* gates: the busiest five minutes at each gate, against what its lanes can scan */
  p.gates=GATES.map(gt=>{let mx=0,mxT=D,over=0;for(let i=0;i<Wd.nB;i++){const r=s.gate[gt.id][i]/5;if(r>mx){mx=r;mxT=D+i*5*MIN;}if(r>gt.cap*.9)over++;}return {g:gt,top:mx,at:mxT,over:over*5,total:sum(s.gate[gt.id])};});
  /* tables */
  const bks=Wd.bookings.filter(b=>bActive(b,t));p.above=[];p.below=[];p.noshow=[];
  bks.forEach(b=>{const m=money(b,t),arr=b.seats.some(x=>x.ar);b._m=m;if(!arr)p.noshow.push(b);else if(b.comp||m.spend>=m.min)p.above.push(b);else p.below.push(b);});
  p.shortfall=sum(p.below,b=>b._m.min-b._m.spend);p.overSum=sum(p.above,b=>Math.max(0,b._m.spend-b._m.min));
  p.seatBooked=sum(bks,b=>b.party);p.seatIn=sum(bks,b=>b.seats.filter(x=>x.ar).length);
  /* service + seating */
  const del=[],seat=[];bks.forEach(b=>{b.orders.forEach(o=>{if(o.del&&o.del>o.at)del.push((o.del-o.at)/MIN);});b.seats.forEach(x=>{if(x.ar&&x.st>x.ar)seat.push((x.st-x.ar)/MIN);});});
  del.sort((a,b)=>a-b);seat.sort((a,b)=>a-b);const med=a=>a.length?a[Math.floor(a.length/2)]:0;
  p.delMed=med(del);p.delSlow=del.filter(x=>x>15).length;p.delN=del.length;p.seatMed=med(seat);p.seatSlow=seat.filter(x=>x>12).length;
  p.moves=[];bks.forEach(b=>b.moves.forEach(m=>p.moves.push({b,m})));p.walkins=bks.filter(b=>b.walk);
  /* guests */
  const att={};Wd.tix.forEach(x=>{if(x.sc&&x.g>=0)att[x.g]=1;});Wd.seats.forEach(x=>{if(x.ar&&x.g>=0)att[x.g]=1;});const ids=Object.keys(att).map(Number);
  p.guests=ids.length;p.newG=ids.filter(i=>Wd.guests[i].crm===0).length;p.known=p.guests-p.newG;p.bl=ids.filter(i=>Wd.guests[i].crm===2).length;
  p.mk=ids.filter(i=>Wd.guests[i].mk).length;
  /* tier moves */
  p.up=bks.filter(b=>{const gst=Wd.guests[b.booker];return gst.crm<2&&b.seats[0].ar&&b._m.spend>=25000&&gst.v>=1;}).sort((a,b)=>b._m.spend-a._m.spend).slice(0,12);
  p.down=p.noshow.filter(b=>Wd.guests[b.booker].crm===2);p.firstTable=bks.filter(b=>Wd.guests[b.booker].crm===0&&b.seats[0].ar&&b._m.spend>=b._m.min*1.2).slice(0,12);
  /* money vs forecast at doors */
  if(!Wd._fcD){const sd=snapshot(Wd,D-MIN,true);Wd._fcD=sd.fc;}
  const f=s.fin,fd=Wd._fcD;p.recon=[['Tickets, presale',fd.tix,f.tix],['Table minimums',fd.tables,s.tb.minSum],['Table spend over minimum',fd.over,s.tb.over],['Bars',fd.bar,f.bar],['Door tickets',fd.door,f.door]];
  p.fcGross=sum(p.recon,r=>r[1]);p.gross=sum(p.recon,r=>r[2]);p.writeOff=f.writeOff;p.open=f.committed;p.costs=s.cost.breakeven;p.profit=p.gross-p.costs-p.writeOff;p.fcProfit=fd.profit;
  /* promoters */
  p.promo=SOURCES.filter(x=>x.comm>0).map(x=>{const d=s.src[x.id];return {x,n:d.n,in:d.in,rev:d.rev,spend:d.spend,comm:d.comm,show:d.in/Math.max(1,d.n)};}).filter(o=>o.n).sort((a,b)=>b.rev-a.rev);
  /* follow-ups */
  p.follow=[{id:'thanks',l:'Thank-you from the host',d:'Bookers who spent above their minimum',n:p.above.filter(b=>!b.comp).length,ch:'WhatsApp template, signed by their host'},
    {id:'feedback',l:'Feedback request',d:'Everyone who attended and opted in',n:p.mk,ch:'One-question survey link on WhatsApp'},
    {id:'first',l:'First look at the next event',d:'Attendees who opted in, and the waitlist, 24 hours before general sale',n:p.mk+Wd.waitlist.length,ch:'WhatsApp template with their link'},
    {id:'recover',l:'Service recovery',d:'Tables with a delivery over 15 minutes',n:new Set(bks.filter(b=>b.orders.some(o=>o.del-o.at>15*MIN)).map(b=>b.id)).size,ch:'Personal call from the host'},
    {id:'missed',l:'We missed you',d:'No-show tables and Backstage List guests who did not come',n:p.noshow.length,ch:'The team, by message'}];
  p.sent=Wd.sent||(Wd.sent={});
  p.inc=by(Wd.incidents.filter(x=>x.at<=t),x=>x.type);p.alerts=Wd.alerts.filter(a=>a.at<=t);
  Wd._post=p;Wd._postK=Wd.rev+':'+Math.floor(s.t/HOUR);return p;}

M.closeout={t:'Close-out',hero:s=>{const p=postStats(W,s),d=p.gross/p.fcGross-1;
  return '<div class="hud hero"><span class="lbl">Close-out · '+esc(W.ev.head)+', '+fD(W.D)+'</span><div class="big n" style="margin-top:10px">'+n0(p.inAll)+'<small>through the gates</small></div>'+
    '<p class="sub" style="margin-top:6px;color:var(--t2)">'+N(pct(p.showRate,1,1))+' of everyone with a ticket or seat came. Busiest at the gates at '+N(fT(p.peakAt))+', '+N(n0(p.peak))+' a minute.</p>'+(!(isOn('pay')&&isOn('pos'))?'<div class="stat3"><div><b>'+aedK(s.fin.tix)+'</b><span>tickets</span></div><div><b>'+n0(p.seatIn)+'</b><span>table seats attended</span></div><div><b>'+n0(p.newG)+'</b><span>new guests</span></div></div><p class="note" style="margin-top:10px">Deposits, on-site spend and profit show once Adyen and the POS are connected.</p></div>':posBar(s.fin,true)+posLegend(s.fin,true)+
    '<div class="stat3"><div><b>'+aedK(p.gross)+'</b><span>revenue</span></div><div><b>'+aedK(p.profit)+'</b><span>profit</span></div><div><b>'+(d>=0?'+':'')+(d*100).toFixed(1)+'%</b><span>vs forecast at doors</span></div></div></div>');},
  panel:s=>M.closeout.hero(s)};

M.attend={t:'Final attendance',tile:s=>{const p=postStats(W,s);return tile('attend','Show rate',pct(p.showRate,1,1),N(n0(p.inAll))+' of '+N(n0(p.issued))+' issued','<div class="meter"><i style="width:'+pct(p.showRate,1)+'"></i></div>');},
  detail:s=>{const p=postStats(W,s);return '<div class="grp"><div class="lbl">By ticket and table tier</div>'+p.show.map(r=>hbar(r[0],r[2]/Math.max(1,r[1]),pct(r[2],r[1])+' · '+n0(r[2]))).join('')+'</div><div class="grp"><div class="lbl">By source</div>'+p.bySrc.map(r=>hbar(r.label,r.in/Math.max(1,r.n),pct(r.in,r.n)+' · '+n0(r.in),'g')).join('')+'</div>'+
    '<div class="hud" style="padding:14px"><div class="kv">'+(isOn('hist')?'<span>Past events average show rate</span><b class="n">'+pct(PAST[3].show,1,1)+'</b>':'')+'<span>Early entry that arrived after 22:00</span><b class="n">'+s.lateEarly+'</b><span>Table seats booked and attended</span><b class="n">'+n0(p.seatIn)+' of '+n0(p.seatBooked)+'</b></div></div>';}};

M.recon={t:'Revenue against forecast',tile:s=>{const p=postStats(W,s),d=p.gross-p.fcGross;return tile('recon','Against forecast',(d>=0?'+':'−')+kfmt(Math.abs(d))+'<small>AED</small>','Revenue '+N(aedK(p.gross))+' · forecast '+N(aedK(p.fcGross)));},
  detail:s=>{const p=postStats(W,s),mx=Math.max.apply(null,p.recon.map(r=>Math.max(r[1],r[2])));return '<div class="rows">'+p.recon.map(r=>{const d=r[2]-r[1];return '<div class="row" style="grid-template-columns:1fr auto"><div class="rt"><b>'+r[0]+'</b><span>Forecast '+N(aedK(r[1]))+'</span><div class="meter" style="height:6px;margin-top:6px"><i style="width:'+(r[2]/mx*100).toFixed(1)+'%"></i><em style="left:'+(r[1]/mx*100).toFixed(1)+'%"></em></div></div><div class="ra" style="flex-direction:column;align-items:flex-end;gap:0"><b class="n">'+aedK(r[2])+'</b><span class="n mut" style="font-size:12px">'+(d>=0?'+':'−')+kfmt(Math.abs(d))+'</span></div></div>';}).join('')+'</div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Revenue</span><b class="gold">'+A(p.gross)+'</b><span>Breakeven, set by '+esc(String(W.be.by).split(' (')[0])+'</span><b>'+A(p.costs)+'</b><span>No-show balances written off</span><b>'+A(p.writeOff)+'</b><span>Balances still open</span><b>'+A(p.open)+'</b><span>Profit</span><b class="gold">'+A(p.profit)+'</b><span>Forecast profit at doors</span><b>'+A(p.fcProfit)+'</b></div></div><p class="note">The white marker on each bar is the forecast taken one minute before doors. Profit is revenue above the manager’s breakeven, less no-show balances written off.</p>';}};

M.tablesmin={t:'Tables against minimum spend',tile:s=>{const p=postStats(W,s);return tile('tablesmin','Tables above minimum',p.above.length+'<small>of '+(p.above.length+p.below.length)+'</small>',N(p.below.length)+' below, charged the minimum · '+N(p.noshow.length)+' no-shows');},
  detail:s=>{const p=postStats(W,s),t=s.t;return '<div class="hud" style="padding:14px"><div class="kv"><span>Above minimum</span><b class="n">'+p.above.length+' tables, +'+aedK(p.overSum).replace('AED ','')+'</b><span>Below minimum</span><b class="n">'+p.below.length+' tables, −'+kfmt(p.shortfall)+' unspent</b><span>No-show tables</span><b class="n">'+p.noshow.length+'</b></div></div>'+
    '<div class="grp"><div class="lbl">Spend against minimum, by section</div>'+SEC_ORDER.map(k=>{const x=s.sec[k];return x.min?hbar(esc(SECTIONS[k].label),Math.min(1.5,x.spend/x.min)/1.5,pct(x.spend,x.min),'',1/1.5):'';}).join('')+'</div>'+
    '<div class="grp"><div class="lbl">Furthest below minimum</div><div class="rows">'+p.below.slice().sort((a,b)=>a._m.spend/a._m.min-b._m.spend/b._m.min).slice(0,8).map(b=>row('tdown','warn',esc(W.T[tableAt(b,t)].name)+' · '+esc(gName(b.booker)),N(aedK(b._m.spend))+' of '+N(aedK(b._m.min))+' · '+esc(SRC[b.src].label),I('right',16),'data-act="table" data-id="'+tableAt(b,t)+'"')).join('')+'</div></div>';}};

M.promoters={t:'Promoter scorecard',tile:s=>{const p=postStats(W,s);return tile('promoters','Commission due',kfmt(sum(p.promo,o=>o.comm))+'<small>AED</small>',N(p.promo.length)+' promoters and partners · best show rate '+N(pct(Math.max.apply(null,p.promo.map(o=>o.show)),1)));},
  detail:s=>{const p=postStats(W,s);return '<div class="rows">'+p.promo.map(o=>'<div class="row" style="grid-template-columns:auto 1fr auto"><div class="ri '+(o.show<.8?'warn':'')+'">'+esc(o.x.label[0])+'</div><div class="rt"><b>'+esc(o.x.label)+'</b><span>'+N(n0(o.n))+' guests · showed '+N(pct(o.show,1))+' · revenue '+N(aedK(o.rev))+(o.spend?' · table spend '+N(aedK(o.spend)):'')+'</span></div><div class="ra" style="flex-direction:column;align-items:flex-end;gap:0"><b class="n">'+aedK(o.comm)+'</b><span class="mut" style="font-size:11.5px">'+N((o.x.comm*100).toFixed(0)+'%')+'</span></div></div>').join('')+'</div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Commission due</span><b class="gold">'+A(sum(p.promo,o=>o.comm))+'</b><span>Revenue they brought</span><b>'+A(sum(p.promo,o=>o.rev))+'</b></div></div><p class="note">BUBL works out commission on tickets sold and table minimums booked, per each agreement, from the promoter’s own links and codes. The venue pays it as it does today. A show rate under 80% is flagged for the next allocation.</p>';}};

M.newknown={t:'Guests captured',tile:s=>{const p=postStats(W,s);return tile('newknown','New guests',n0(p.newG)+'','of '+N(n0(p.guests))+' named guests · '+N(pct(p.mk,p.guests))+' opted in to marketing','<div class="meter"><i class="pre" style="width:'+pct(p.known,p.guests)+'"></i><i style="left:'+pct(p.known,p.guests)+';width:'+pct(p.newG,p.guests)+'"></i></div>');},
  detail:s=>{const p=postStats(W,s);return hbar('New to Ushuaïa',p.newG/p.guests,n0(p.newG))+hbar('Returning',(p.known-p.bl)/p.guests,n0(p.known-p.bl),'g')+hbar('Backstage List',p.bl/p.guests,n0(p.bl),'g')+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Named guests who attended</span><b class="n">'+n0(p.guests)+'</b><span>Opted in to marketing</span><b class="n">'+pct(p.mk,p.guests)+'</b></div></div><p class="note">Named guests are the ones who claimed a seat or ticket on their invitation link. The opt-in is a box on that claim step. Guests who didn’t tick it only get messages about their booking.</p>';}};

M.tiers={t:'Tier suggestions',tile:s=>{const p=postStats(W,s);return tile('tiers','Tier moves',(p.up.length+p.down.length+p.firstTable.length)+'<small>suggested</small>',N(p.up.length)+' up to Backstage List · '+N(p.down.length)+' to review');},
  detail:s=>{const p=postStats(W,s),t=s.t,r=(b,why)=>row(initials(gName(b.booker)),'neu',esc(gName(b.booker)),why,I('right',16),'data-act="guest" data-g="'+b.booker+'"');
    return '<div class="grp"><div class="lbl">Invite to the Backstage List</div><div class="rows">'+(p.up.map(b=>r(b,'Spent '+N(aedK(b._m.spend))+' at '+esc(W.T[tableAt(b,t)].name)+' · '+N(G(b.booker).v+1)+' visits')).join('')||empty('Nobody crossed the line tonight.'))+'</div></div>'+
    '<div class="grp"><div class="lbl">Review Backstage List standing</div><div class="rows">'+(p.down.map(b=>r(b,'Booked '+esc(W.T[b.table].name)+' and did not arrive')).join('')||empty('Every Backstage List booker showed.'))+'</div></div>'+
    '<div class="grp"><div class="lbl">Mark as returning, offer the presale</div><div class="rows">'+(p.firstTable.map(b=>r(b,'First table, spent '+N(pct(b._m.spend,b._m.min))+' of minimum')).join('')||empty('No first-time bookers went well over.'))+'</div></div><p class="note">These are suggestions. A tier only changes when a manager confirms it on the guest card.</p>';}};

M.coatt={t:'Co-attendance',tile:s=>{const gph=W._co||(W._co=coGraph(W,s.t));return tile('coatt','Connections',gph.edges.length+'<small>links</small>',N(gph.hubs.length)+' Backstage List guests bring most of the room');},
  detail:s=>{const gph=W._co||(W._co=coGraph(W,s.t));return network(gph.nodes,gph.edges,null)+'<p class="note">Each dot is a guest, each line is a night spent at the same table. Gold dots are Backstage List guests who bring others. Tap a dot for the guest card.</p><div class="rows">'+gph.hubs.slice(0,6).map(i=>row(initials(gName(i)),'neu',esc(gName(i)),'Brought '+N(gph.nodes.find(n=>n.id===i).deg)+' guests tonight',I('right',16),'data-act="guest" data-g="'+i+'"')).join('')+'</div>';}};

M.refunds={t:'Open refunds and disputes',tile:s=>{const q=pendingQ(['refund','dispute']);return tile('queue','Refunds and disputes',q.length+'<small>open</small>',N(aedK(sum(q,x=>x.amt||0)))+' in question',null,{dot:q.some(x=>x.type==='dispute')?'bad':null});}};

M.season={t:'Event comparison',tile:s=>{const p=postStats(W,s);return tile('season','Against past events',((p.gross/PAST[3].gross-1)*100).toFixed(0)+'<small>% revenue</small>','Same night last season: '+N(aedK(PAST[0].gross)));},
  detail:s=>{const p=postStats(W,s),rows=[{name:W.ev.short,date:fDS(W.D)+' '+g(W.D).getUTCFullYear(),att:p.inAll,gross:p.gross,profit:p.profit,show:p.showRate,me:1}].concat(PAST),mx=Math.max.apply(null,rows.map(r=>r.gross));
    return '<div class="rows">'+rows.map(r=>'<div class="row" style="grid-template-columns:1fr auto"><div class="rt"><b'+(r.me?' class="gold"':'')+'>'+esc(r.name)+'</b><span>'+esc(r.date)+' · '+N(n0(r.att))+' in · show '+N(pct(r.show,1))+' · profit '+N(aedK(r.profit))+'</span><div class="meter" style="height:6px;margin-top:6px"><i class="'+(r.me?'':'pre')+'" style="width:'+(r.gross/mx*100).toFixed(1)+'%"></i></div></div><div class="ra"><b class="n">'+aedK(r.gross)+'</b></div></div>').join('')+'</div>'+
    '<div class="grp"><div class="lbl">Season 3 so far</div><div class="rows">'+seasonRows().filter(r=>r.status!=='tba').map(r=>row(String(g(r.ev.doors).getUTCDate()),r.ev.id===W.ev.id?'neu':'',esc(r.ev.short),fD(r.ev.doors)+(r.status==='soon'?' · presale not open':' · tickets '+N(pct(r.ga,1))+' · tables '+N(pct(r.tb,1))),'<b class="n">'+(r.status==='soon'?'—':aedK(r.s.fin.gross))+'</b>')).join('')+'</div></div>';}};

M.follow={t:'Follow-up queue',tile:s=>{const p=postStats(W,s),left=p.follow.filter(f=>!p.sent[f.id]).length;return tile('follow','Follow-ups',left+'<small>to send</small>','Thank-yous, feedback, next-event first look');},
  detail:s=>{const p=postStats(W,s);return '<div class="rows">'+p.follow.map(f=>row(p.sent[f.id]?'check':'msg',p.sent[f.id]?'ok':'',esc(f.l)+' · '+N(n0(f.n)),esc(f.d)+' · '+esc(f.ch),p.sent[f.id]?pill('ok','Sent'):'<button class="btn xs pri" data-act="follow" data-f="'+f.id+'">Send</button>')).join('')+'</div><p class="note">Marketing templates only go to guests who opted in on their invitation. Thank-yous and service recovery are about their booking, so they go to everyone who came.</p>';}};
ON.follow=el=>{const p=postStats(W,S()),f=p.follow.find(x=>x.id===el.dataset.f);W.sent[f.id]=now();log('Follow-up sent',f.l+' to '+f.n+' guests');bump();toast(esc(f.l)+' queued for '+N(n0(f.n))+' guests.');refresh(true);};

M.lessons={t:'Operations lessons',tile:s=>{const p=postStats(W,s),w=p.gates.slice().sort((a,b)=>b.top/b.g.cap-a.top/a.g.cap)[0];return tile('lessons','Busiest gate',Math.round(w.top/w.g.cap*100)+'<small>% of scan rate</small>',esc(w.g.label)+' at '+N(fT(w.at))+' · '+N(w.over)+' min above 90%');},
  detail:s=>{const p=postStats(W,s),gaps=s.staff.filter(x=>x.in/x.sp.plan<.92);return '<div class="grp"><div class="lbl">Gate pressure</div><div class="rows">'+p.gates.map(x=>row('gate',x.top>x.g.cap*.9?'warn':'',esc(x.g.label)+' · '+esc(x.g.sub),'Busiest five minutes '+N(Math.round(x.top))+' of '+N(x.g.cap)+' a minute at '+N(fT(x.at))+' · '+N(x.over)+' min above 90% · '+N(n0(x.total))+' scanned','')).join('')+'</div></div>'+
    '<div class="grp"><div class="lbl">Coverage gaps</div>'+(gaps.length?gaps.map(x=>hbar(esc(x.sp.role),x.in/x.sp.plan,x.in+' / '+x.sp.plan,'warn')).join(''):empty('Every role was at or above 92% of plan.'))+'</div>'+
    '<div class="grp"><div class="lbl">Service and seating</div><div class="hud" style="padding:14px"><div class="kv"><span>Order to table, median</span><b class="n">'+p.delMed.toFixed(0)+' min</b><span>Deliveries over 15 minutes</span><b class="n">'+p.delSlow+' of '+p.delN+'</b><span>Gate to seat, median</span><b class="n">'+p.seatMed.toFixed(0)+' min</b><span>Seated after more than 12 minutes</span><b class="n">'+p.seatSlow+'</b><span>Parties moved</span><b class="n">'+p.moves.length+'</b><span>Walk-in tables</span><b class="n">'+p.walkins.length+'</b></div></div></div>'+
    '<div class="grp"><div class="lbl">Incidents</div><div class="hud" style="padding:14px"><div class="kv">'+Object.keys(INC_T).map(k=>'<span>'+INC_T[k][0]+'</span><b class="n">'+((p.inc[k]||[]).length)+'</b>').join('')+'<span>Ticket alerts</span><b class="n">'+p.alerts.length+'</b></div></div></div>'+
    '<div class="banner neu">'+I('flag',17)+'<span><b>For the next event.</b> Split Early entry across both GA gates from 21:15, add two scanners to '+esc(p.gates.slice().sort((a,b)=>b.top/b.g.cap-a.top/a.g.cap)[0].g.label)+' until 22:15, and plan '+N(Math.max(2,gaps.length*2))+' more runners than tonight.</span></div>';}};
