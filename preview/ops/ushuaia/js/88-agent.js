'use strict';
/* ============================================================
   88 · MANAGER AGENT + INTELLIGENCE REQUESTS
   The agent answers from the same store the screens read, so it
   cannot disagree with them. Known questions are answered on the
   device, instantly and offline. Open questions go to Claude with
   a compact snapshot of the event. Every action it proposes is a
   button the person taps; it never acts on its own.
   In production the Claude call goes through the BUBL backend.
   ============================================================ */
const ACTS={};let _an=0;
function act(label,fn,ic){const id='a'+(++_an);ACTS[id]=fn;return {id,label,ic:ic||'right'};}
ON.runAct=el=>{const f=ACTS[el.dataset.a];if(f)f(el);};
const goMod=id=>()=>{Sheet.close(true);openMod(id);};
const goFloor=(ov,sec)=>()=>{Sheet.close(true);UI.floor.overlay=ov||null;if(sec)UI.floor.focus=sec;if(UI.device==='atlas'){UI.atlas='floor';Atlas.render();}else setTab('floor');};
const goTable=id=>()=>{Sheet.close(true);ON.table({dataset:{id}});};
const isFin=()=>UI.role==='owner';
const paceVs=s=>{const d=s.days.today;return s.days.com[d]/Math.max(1,TARGET.presale*blendCurve(d))-1;};
const sgn=v=>(v>=0?'+':'−')+Math.abs(Math.round(v*100))+'%';

/* ---------- local answers: one function per question family ---------- */
function aSummary(s){const f=s.fin,t=s.t;if(UI.role==='host')return aMySec(s);
  if(s.ph==='pre'&&!isOn('pay')){const n=needsPre(s);return {text:'T−'+N(fDur(W.D-t))+' to doors. Tickets are '+P(s.gaSold,sum(GA,x=>x.alloc))+' sold ('+AK(f.tix)+') and tables '+P(s.tb.booked,s.tb.total)+' booked. Deposits, spend and forecasts show once Adyen and the POS are connected.',
    facts:[['Tickets sold',N(s.gaSold)],['Tables booked',N(s.tb.booked)],['Waiting on you',String(n.length)]],acts:n.slice(0,2).map(x=>act(stripTags(x.title),goMod(x.id)))};}
  if(s.ph==='pre'){const n=needsPre(s);return {text:'T−'+N(fDur(W.D-t))+' to doors. '+AK(f.collected)+' collected, '+P(f.collected,f.breakeven)+' of breakeven'+(f.gross>=f.breakeven?', and committed balances take the event past it.':'. Another '+AK(f.breakeven-f.gross)+' needs to sell.')+' Tickets are '+P(s.gaSold,sum(GA,x=>x.alloc))+' sold, tables '+P(s.tb.booked,s.tb.total)+' booked, pace '+N(sgn(paceVs(s)))+' against target.',
    facts:[['Forecast revenue',aedK(s.fc.gross)],['Projected profit',aedK(s.fc.profit)],['Waiting on you',String(n.length)]],acts:n.slice(0,2).map(x=>act(stripTags(x.title),goMod(x.id)))};}
  if(s.ph==='live'){const st=s.tb.st,g_=s.gates.slice().sort((a,b)=>b.wait-a.wait)[0],n=needsLive(s);
    return {text:N(fT(t))+'. '+N(n0(s.head))+' in the venue, '+P(s.head,VENUE.capacity)+' of capacity, arriving at '+N(Math.round(s.rate))+' a minute. '+N(st.seated)+' of '+N(s.tb.booked)+' tables seated, '+N(st.partial)+' partly in, '+N(st.noshow)+' no-shows. '+(!isOn('pos')||!isOn('pay')?'Spend and breakeven show once Adyen and the POS are connected.':f.collected>=f.breakeven?'Breakeven passed, '+AK(f.profit)+' clear.':AK(f.breakeven-f.collected)+' to breakeven.')+(g_.wait>=1?' Longest gate wait '+N(g_.wait.toFixed(0))+' min at '+esc(g_.g.label)+'.':' No queues at the gates.'),
      facts:(!isOn('pos')||!isOn('pay'))?[['In the venue',n0(s.head)],['Tables seated',N(st.seated)]]:[['On-site so far',aedK(f.onsite)],['Forecast for the night',aedK(s.fc.gross)]],acts:n.slice(0,2).map(x=>act(stripTags(x.title),goMod(x.id)))};}
  const p=postStats(W,s);if(!isOn('pos')||!isOn('pay'))return {text:N(n0(p.inAll))+' came, '+P(p.showRate,1,1)+' of everyone holding a ticket or seat. '+N(p.noshow.length)+' tables did not come. Revenue, profit and minimum spend show once Adyen and the POS are connected.',
    facts:[['Peak in venue',n0(p.peak)+' at '+fT(p.peakAt)],['New guests captured',n0(p.newG)]],acts:[act('Open the report',()=>{Sheet.close(true);ON.report();},'doc'),act('Ops lessons',goMod('lessons'))]};
  return {text:N(n0(p.inAll))+' came, '+P(p.showRate,1,1)+' of everyone holding a ticket or seat. Revenue '+AK(p.gross)+', profit '+AK(p.profit)+', '+N(sgn(p.gross/p.fcGross-1))+' against the forecast at doors. '+N(p.above.length)+' tables finished above minimum, '+N(p.below.length)+' below, '+N(p.noshow.length)+' did not come.',
    facts:[['Peak in venue',n0(p.peak)+' at '+fT(p.peakAt)],['New guests captured',n0(p.newG)]],acts:[act('Open the report',()=>{Sheet.close(true);ON.report();},'doc'),act('Ops lessons',goMod('lessons'))]};}
function aNeeds(s){const n=s.ph==='live'?needsLive(s):s.ph==='pre'?needsPre(s):[];if(s.ph==='post'){const q=pendingQ(['refund','dispute']),fl=postStats(W,s).follow.filter(f=>!W.sent||!W.sent[f.id]);return {text:N(q.length)+' refunds and disputes are open and '+N(fl.length)+' follow-up messages have not gone out.',acts:[act('Refunds and disputes',goMod('queue')),act('Follow-ups',goMod('follow'))]};}
  if(!n.length)return {text:'Nothing is waiting on you right now.'};return {text:'Start with '+stripTags(n[0].title).replace(/^(\d)/,'the $1')+': '+stripTags(n[0].sub).replace(/^([A-Z])(?=[a-z])/,c=>c.toLowerCase())+'.'+(n.length>1?' Then '+N(n.length-1)+' more, most urgent first.':''),rows:n.slice(0,5).map(x=>[x.ic,x.tone,x.title,x.sub]),acts:n.slice(0,2).map(x=>act(stripTags(x.title),goMod(x.id)))};}
function aPace(s){if(s.ph!=='pre')return aSummary(s);const d=s.days.today,v=paceVs(s),left=Math.max(1,75-d),pv=PAST[0].gross*.74*blendCurve(Math.max(0,d-2)),wk=s.days.com[d]-s.days.com[Math.max(0,d-7)];
  return {text:'Presale is '+N(sgn(v))+' against target and '+N(sgn(s.days.com[d]/pv-1))+' against '+esc(PAST[0].name)+' at the same point. The last 7 days brought '+AK(wk)+'. To reach the presale target you need '+AK(Math.max(0,TARGET.presale-s.days.com[d])/left)+' a day for '+N(left)+' days.',acts:[act('Sales pace',goMod('pace')),act('Sell-through by tier',goMod('sell'))]};}
function aMoney(s){if(!isFin())return {text:'Venue financials are for managers. Your section is at '+P(s.sec[ROLES.host.sec].spend,s.sec[ROLES.host.sec].min)+' of its minimums.'};const f=s.fin;
  return {text:AK(f.collected)+' collected against a breakeven of '+AK(f.breakeven)+'. '+(f.collected>=f.breakeven?'You are '+AK(f.collected-f.breakeven)+' past it.':'Another '+AK(f.breakeven-f.collected)+' in cash gets you there; '+AK(f.committed)+' is committed but not collected.')+' Projected profit '+AK(s.fc.profit)+' on '+AK(s.fc.gross)+' revenue.',
    facts:[['Deposits',aedK(f.dep)],['Tickets',aedK(f.tix)],['On-site',aedK(f.onsite)],['Breakeven',aedK(s.cost.breakeven)]],acts:[act('Breakeven',goMod('cost')),act('Forecast',goMod('forecast'))]};}
function aForecast(s){if(!isFin())return aMoney(s);const f=s.fc;return {text:'At this pace the night lands at '+AK(f.gross)+': tickets '+AK(f.tix)+', table minimums '+AK(f.tables)+', F&B '+AK(f.fb)+', door '+AK(f.door)+'. Against the breakeven of '+AK(f.costs)+' you set, that is '+AK(f.profit)+' profit.',acts:[act('Forecast detail',goMod('forecast'))]};}
function aDeposits(s){const t=s.t;if(s.ph==='pre'){const d=s.tb.depDue.slice().sort((a,b)=>a.at-b.at);if(!d.length)return {text:'Every deposit is paid.'};
    return {text:N(d.length)+' deposits are unpaid on their invitations, '+AK(sum(d,b=>b._m.depDue))+' in total. The oldest is '+esc(gName(d[0].booker))+' at '+esc(W.T[d[0].table].name)+', sent '+fAgo(t-d[0].at)+'.',rows:d.slice(0,5).map(b=>['card','warn',esc(gName(b.booker))+' · '+esc(W.T[b.table].name),N(aed(b._m.depDue))+' · sent '+fAgo(t-b.at)]),
      acts:[act('Remind all '+d.length,()=>{d.forEach(b=>Act.chaseDeposit(b));toast('Reminders sent to '+N(d.length)+' bookers on WhatsApp.');refresh(true);},'msg'),act('Deposits',goMod('chase'))]};}
  const l=s.tb.balDue.filter(b=>!mySec()||b.sec===mySec());if(!l.length)return {text:'No checks are open near close. Bills settle on the venue terminals as tables finish.'};
  return {text:N(l.length)+' checks are still open in the POS near close, '+AK(sum(l,b=>b._m.balance))+' to settle on the venue terminals.',rows:l.slice(0,5).map(b=>['card','warn',esc(W.T[tableAt(b,t)].name)+' · '+esc(gName(b.booker)),N(aed(b._m.balance))]),acts:[act('Show on the floor',goFloor('unpaid'),'floor'),act('Open checks',goMod('balances'))]};}
function aNoShow(s){if(s.ph==='pre'){const ns=PAST[3];return {text:'Season 2 rates say about '+N(pct(ns.noShowGA,1,1))+' of tickets and '+N(pct(ns.noShowSeat,1,1))+' of table seats will not come, roughly '+N(n0(s.gaSold*ns.noShowGA+s.tb.seats*ns.noShowSeat))+' people.',acts:[act('No-show forecast',goMod('noshowp')),act('Tables at risk',()=>{Sheet.close(true);openIntel('risk');},'bulb')]};}
  if(s.ph==='post'){const p=postStats(W,s);return {text:N(p.noshow.length)+' booked tables did not come. '+AK(p.writeOff)+' of balances was written off.',acts:[act('Tables against minimum',goMod('tablesmin'))]};}
  const l=noShowTables(s),t=s.t,late=W.bookings.filter(b=>bActive(b,t)&&b._c&&!b._c.present&&t>b.arriveBy&&t<=b.arriveBy+VENUE.graceMin*MIN&&(!mySec()||b.sec===mySec()));
  return {text:(l.length?N(l.length)+' tables are past their hold: '+l.slice(0,3).map(b=>esc(W.T[tableAt(b,t)].name)).join(', ')+(l.length>3?' and more':'')+'.':'No table is past its hold.')+' '+N(late.length)+' more are late but still inside the '+VENUE.graceMin+' minute hold.',
    acts:[act('Show on the floor',goFloor('noshow'),'floor'),act('Release or offer',goMod('noshow'))]};}
function aGates(s){if(s.ph==='pre')return {text:'Gates 1 and 2 take GA at '+N(GATE.G1.cap+GATE.G2.cap)+' a minute together, Gate 3 tables and VIP at '+N(GATE.G3.cap)+', Gate 4 Backstage at '+N(GATE.G4.cap)+(isOn('hist')?'. Past events peaked around '+N(PAST[3].peak)+', so the Early entry cut-off at 22:00 is the pinch point.':'.'),acts:[act('Readiness',goMod('ready'))]};
  if(s.ph==='post'){const p=postStats(W,s),w=p.gates.slice().sort((a,b)=>b.top/b.g.cap-a.top/a.g.cap)[0];return {text:esc(w.g.label)+' was the busiest gate, scanning '+N(Math.round(w.top))+' of '+N(w.g.cap)+' a minute around '+N(fT(w.at))+'.',acts:[act('Ops lessons',goMod('lessons'))]};}
  const g_=s.gates.slice().sort((a,b)=>b.load-a.load)[0];return {text:esc(g_.g.label)+' is the busiest, scanning '+N(g_.rate.toFixed(0))+' of the '+N(g_.g.cap)+' a minute its lanes can do. Overall '+N(Math.round(s.rate))+' a minute against '+N(s.gateCap)+'. Queue length isn’t measured; ask the door team in the Door room.'+(s.capAlert?' Open the overflow lane and move a scanner from Gate 4.':''),
    rows:s.gates.map(x=>['gate',x.load>.9?'bad':x.load>.75?'warn':'ok',esc(x.g.label),N(x.rate.toFixed(0))+' of '+N(x.g.cap)+'/min']),acts:[act('Gates',goMod('gates'),'gate')]};}
function aHead(s){if(s.ph==='pre')return {text:'Expect about '+N(n0(s.fc.att||TARGET.att))+' through the gates against a licence of '+N(n0(VENUE.capacity))+'.',acts:[act('No-show forecast',goMod('noshowp'))]};
  if(s.ph==='post'){const p=postStats(W,s);return {text:N(n0(p.inAll))+' came through the gates, '+P(p.inAll,VENUE.capacity)+' of the licence. The busiest five minutes were at '+N(fT(p.peakAt))+', '+N(n0(p.peak))+' a minute. Exits aren’t counted, so there is no figure for how long people stayed.'};}
  return {text:N(n0(s.inAll))+' have come through the gates tonight, '+P(s.inAll,VENUE.capacity)+' of the licence, and '+N(n0(Math.max(0,s.issued-s.inAll)))+' tickets and seats are still to come. Exits aren’t counted, so this is admissions, not the number inside right now.',acts:[act('Through the gates',goMod('head'))]};}
function aVip(s){const t=s.t,sec=mySec(),v=W.bookings.filter(b=>bActive(b,t)&&b.vip&&(!sec||b.sec===sec));
  if(s.ph==='pre')return {text:N(v.length)+' VIP and Backstage tables are booked'+(s.tb.pending?', with '+N(s.tb.pending)+' Backstage requests waiting for your answer':'')+'.',acts:s.tb.pending?[act('Answer requests',goMod('vipconf'),'star')]:[act('VIP on the floor',goFloor('vip'),'floor')]};
  const inn=v.filter(b=>b.seats[0].ar&&b.seats[0].ar<=t),next=v.filter(b=>!(b.seats[0].ar&&b.seats[0].ar<=t)).sort((a,b)=>a.arriveBy-b.arriveBy).slice(0,3);
  return {text:N(inn.length)+' of '+N(v.length)+' VIP tables have arrived.'+(next.length?' Still to come: '+next.map(b=>esc(gName(b.booker))+' (due '+N(fT(b.arriveBy))+')').join(', ')+'.':''),acts:[act('VIP arrivals',goMod('vipl'),'star'),act('VIP on the floor',goFloor('vip'),'floor')]};}
function aSources(s){if(!isFin())return {text:'Source and commission figures are for managers.'};const sl=srcSlices(s,'rev'),tot=sum(sl,x=>x.v)||1,pr=SOURCES.filter(x=>x.comm).map(x=>({x,d:s.src[x.id]})).filter(o=>o.d.n).sort((a,b)=>b.d.rev-a.d.rev);
  return {text:'Direct sells '+P(sl[0].v,tot)+' of revenue, promoters '+P(sl[1].v,tot)+', partners '+P(sl[2].v,tot)+'. Top promoter is '+esc(pr[0].x.label)+' with '+AK(pr[0].d.rev)+'.'+(s.ph==='post'?' Commission due '+AK(sum(pr,o=>o.d.comm))+'.':''),rows:pr.slice(0,5).map(o=>['users','',esc(o.x.label),N(n0(o.d.n))+' guests · '+(s.ph==='pre'?'showed '+pct(pastShow(o.x.id),1)+' last season':'show '+pct(o.d.in,o.d.n)),N(aedK(o.d.rev))]),
    acts:[act('Sources',goMod('sources'),'pie'),act('Promoter allocation',()=>{Sheet.close(true);openIntel('promo');},'bulb')]};}
function aWaitlist(s){const t=s.t,wl=W.waitlist.filter(w=>w.at<=t&&!w.offered);return {text:N(wl.length)+' parties are waiting with '+AK(sum(wl,w=>w.budget))+' in budgets. '+N(wl.filter(w=>G(w.g).crm===2).length)+' are Backstage List. '+N(s.tb.st.open||s.tb.open)+' tables are open.',acts:[act('Waitlist',goMod(s.ph==='live'?'waitl':'waitlist'))]};}
function aStaff(s){const sp=STAFF_PLAN.filter(x=>STAFF_BUBL.includes(x.role));if(!s.staff)return {text:'Door staff, hosts and runners sign in to BUBL OPS from three hours before doors. The plan is '+N(sum(sp,x=>x.plan))+' people across '+N(sp.length)+' roles. Bar, security and medics are on the venue’s own rota.'};const gaps=s.staff.filter(x=>x.in/x.sp.plan<.92);
  return {text:N(sum(s.staff,x=>x.in))+' of '+N(sum(s.staff,x=>x.sp.plan))+' door staff, hosts and runners are signed in.'+(gaps.length?' Short on '+gaps.map(x=>esc(x.sp.role.toLowerCase())+' ('+x.in+' of '+x.sp.plan+')').join(', ')+'.':' Every role is at plan.'),acts:[act('Team signed in',goMod('staff'),'user')]};}
function aClaims(s){return {text:N(n0(s.tb.claimed))+' of '+N(n0(s.tb.seats))+' table seats have a named guest, and '+P(s.tk.named,s.tk.named+s.tk.unnamed)+' of tickets are claimed. Unclaimed seats are the slowest scans at the door.',acts:[act('Nudge tables under half',()=>{ON.nudgeAll();},'bell'),act('Seat claims on the floor',goFloor('claims'),'floor')]};}
function aPreorders(s){const t=s.t;if(s.ph==='live'){const l=[];W.bookings.forEach(b=>{if(!bActive(b,t))return;b.orders.forEach(o=>{if(o.pre&&o.at<=t&&(!o.del||o.del>t)&&!o.opDel)l.push({b,o});});});
    return {text:l.length?N(l.length)+' pre-orders are on their way. The oldest has been '+N(fDur(t-l.sort((a,b)=>a.o.at-b.o.at)[0].o.at))+' at '+esc(W.T[tableAt(l[0].b,t)].name)+'.':'Every pre-order fired tonight has been delivered.',acts:[act('Pre-orders on the floor',goFloor('prepend'),'floor')]};}
  const n=W.bookings.filter(b=>bActive(b,t)&&b.pre.some(p=>p.at<=t)).length;return {text:N(n)+' tables have pre-ordered, '+AK(s.tb.pre)+' at menu value. Guests saved '+AK(s.tb.saved)+' by ordering early.',acts:[act('Pre-orders on the floor',goFloor('pre'),'floor')]};}
function aFraud(s){const a=liveAlerts(s.t);return {text:a.length?N(a.length)+' ticket alerts are open, mostly duplicate codes. The first scan always stands; the second is stopped.':'No ticket alerts are open.',acts:a.length?[act('Ticket alerts',goMod('fraud'),'shield')]:[]};}
function aIncidents(s){const l=W.incidents.filter(x=>x.at<=s.t);const last=l[l.length-1];return {text:N(l.length)+' entries in the log tonight.'+(last?' Latest at '+N(fT(last.at))+', '+esc(last.zone)+': '+esc(last.note):''),acts:[act('Incident log',goMod('incidents'),'flag')]};}
function aSpend(s){const t=s.t,sec=mySec();if(s.ph==='pre')return {text:AK(s.tb.minSum)+' of table minimums are booked.'};
  if(s.ph==='post'){const p=postStats(W,s);return {text:N(p.below.length)+' tables finished below minimum, '+N(p.above.length)+' above. The gap on the ones below is '+AK(sum(p.below,b=>Math.max(0,b._m.min-b._m.spend)))+'.',acts:[act('Tables against minimum',goMod('tablesmin'))]};}
  const behind=W.bookings.filter(b=>bActive(b,t)&&b._c&&b._c.present&&!b.comp&&(!sec||b.sec===sec)&&b._m.spend<b._m.min*.6&&t-Math.min.apply(null,b.seats.filter(x=>x.ar).map(x=>x.ar))>90*MIN);
  return {text:'Tables in the venue have spent '+P(s.tb.spendArr,s.tb.minArr)+' of their minimums. '+N(behind.length)+' have been seated over 90 minutes and are under 60%.',rows:behind.slice(0,5).map(b=>['tdown','warn',esc(W.T[tableAt(b,t)].name)+' · '+esc(gName(b.booker)),N(aedK(b._m.spend))+' of '+N(aedK(b._m.min))+' · host '+esc(b.host)]),acts:[act('Spend vs minimums',goMod('minspend'))]};}
function aSell(s){return {text:'Tickets: '+GA.map((x,i)=>esc(x.label)+' '+(s.tk.sold[i]>=x.alloc*.985?'sold out':n0(s.tk.sold[i])+' of '+n0(x.alloc))).join(', ')+'. Tables: '+N(s.tb.booked)+' of '+N(s.tb.total)+' booked, '+N(s.tb.held)+' held, '+N(s.tb.open)+' open.',acts:[act('Sell-through',goMod('sell')),act('Price check',()=>{Sheet.close(true);openIntel('price');},'bulb')]};}
function aQueue(s){const q=pendingQ(s.ph==='post'?['refund','dispute']:['transfer','refund']);return {text:q.length?N(q.length)+' requests are open, '+AK(sum(q,x=>x.amt||0))+' in question.':'The transfer and refund queue is clear.',acts:q.length?[act('Open the queue',goMod('queue'),'swap')]:[]};}
function aReady(s){const c=checkState(W,s.t),open=c.filter(x=>!x.done);return {text:N(c.length-open.length)+' of '+N(c.length)+' readiness items are done.'+(open.length?' Next: '+esc(open[0].c.label.toLowerCase())+', '+esc(open[0].c.who)+'.':''),acts:[act('Readiness',goMod('ready'),'flag')]};}
function aSeason(s){const r=seasonRows().filter(x=>x.status!=='tba'&&x.status!=='soon');return {text:'Season 3 so far: '+r.map(x=>esc(x.ev.short)+' '+(x.status==='post'?AK(x.s.fin.gross):'forecast '+AK(x.s.fc.gross))).join(', ')+'. Season 2 averaged '+AK(PAST[3].gross)+' a night.',acts:[act('Season',()=>{Sheet.close(true);if(UI.device==='atlas'){UI.atlas='season';Atlas.render();}else ON.season();},'cal')]};}
function aMySec(s){const k=ROLES.host.sec,x=s.sec[k],t=s.t,next=W.bookings.filter(b=>bActive(b,t)&&b.sec===k&&!(b._c&&b._c.present)).sort((a,b)=>a.arriveBy-b.arriveBy).slice(0,3);
  return {text:esc(SECTIONS[k].label)+': '+N(x.booked)+' tables booked'+(s.ph==='pre'?'':', '+N(x.seated)+' seated, '+N(x.in)+' of '+N(x.guests)+' guests in, '+P(x.spend,x.min)+' of minimums spent')+'.'+(next.length?' Next to arrive: '+next.map(b=>esc(gName(b.booker))+' ('+N(b.party)+')').join(', ')+'.':''),acts:[act('My section on the floor',goFloor(null,k),'floor')]};}
function aTable(s,T){const t=s.t,e=s.ix[T.id];if(!canTables())return {text:'Table details are for hosts and managers.'};
  if(!e)return {text:esc(T.name)+' is open. Minimum '+AK(T.min)+', seats '+N(T.cap)+'.',acts:[act('Open '+T.name,goTable(T.id),'floor')]};
  if(e.st==='held')return {text:esc(T.name)+' is held for '+esc(e.h.who)+' ('+esc(e.h.kind.toLowerCase())+') for another '+N(fDur(e.h.until-t))+'.',acts:[act('Open '+T.name,goTable(T.id),'floor')]};
  const b=e.b,m=money(b,t),c=seatCounts(b,t);if(e.st==='requested')return {text:esc(gName(b.booker))+' has requested '+esc(T.name)+' for '+N(b.party)+'. It is waiting for your answer.',acts:[act('Answer requests',goMod('vipconf'),'star')]};
  return {text:esc(T.name)+': '+esc(gName(b.booker))+'’s party of '+N(b.party)+', host '+esc(b.host)+'. '+(s.ph==='pre'?N(c.claimed)+' seats claimed, ':N(c.present)+' in, '+N(c.seated)+' seated, ')+'spend '+AK(m.spend)+' against '+AK(m.min)+'.'+(m.balance&&s.ph!=='pre'?' Balance '+AK(m.balance)+'.':m.depDue?' Deposit of '+AK(m.depDue)+' not paid.':''),
    acts:[act('Open '+T.name,goTable(T.id),'floor')]};}
function aGuest(s,gi){const gst=G(gi),r=guestRecs(gi,s.t),t=s.t;let where='';
  if(r.seats.length){const x=r.seats[0];where=(canTables()?esc(W.T[tableAt(x.b,t)].name)+', seat '+N(x.n):'a table guest')+'. '+(x.st&&x.st<=t?'Seated at '+N(fT(x.st))+'.':x.ar&&x.ar<=t?'Through the gate at '+N(fT(x.ar))+', not seated yet.':'Not arrived.');}
  else if(r.tix.length){const x=r.tix[0];where=['Early entry','Second wave','VIP standing','Door ticket','Guest list','Promoter list'][x.k]+'. '+(x.sc&&x.sc<=t?'In at '+N(fT(x.sc))+'.':'Not in yet.');}
  return {text:esc(gst.n)+', '+crmLabel(gst).toLowerCase()+(isOn('hist')&&gst.v?', '+N(gst.v)+' visits':'')+'. '+(where||'No ticket for this event.')+(gst.prefs?' Note: '+esc(gst.prefs[0])+'.':''),acts:[act('Guest card',()=>openGuest(gi),'user')]};}
function aFallback(){return {text:'I can answer from this event’s data: money, pace, gates, tables, guests, VIPs, no-shows, promoters, staff, readiness. Ask about a table by name, like “Gold R12”, or a guest by name.'};}

const fromI=r=>({text:r.sum,rows:r.rows,acts:r.acts,focus:r.focus});
function aInvite(s){return s.ph==='post'?fromI(iInvite(s)):s.ph==='pre'?fromI(iUpsell(s)):aVip(s);}
function aRisk(s){return s.ph==='post'?aNoShow(s):fromI(iRisk(s));}
function aLeak(s){return s.ph==='live'?fromI(iLeak(s)):s.ph==='pre'?fromI(iUpsell(s)):aSpend(s);}
function aRelease(s){return s.ph==='pre'?fromI(iRelease(s)):aSell(s);}
function aPrice(s){return s.ph==='pre'?fromI(iPrice(s)):aSpend(s);}
function aUnseated(s){if(s.ph!=='live')return aClaims(s);const u=unseatedTables(s.t);return {text:u.length?N(u.length)+' tables have guests through the gate but not seated. Longest wait '+N(fDur(u[0].wait))+' at '+esc(W.T[tableAt(u[0].b,s.t)].name)+'.':'Everyone through the gate has been seated.',acts:[act('Waiting to be seated',goMod('unseated'),'users')]};}
function aInteg(s){const cv=coverage(),off=INTEG.filter(x=>x.conn&&!isOn(x.id));return {text:N(cv.on)+' of '+N(cv.tot)+' data feeds are live.'+(off.length?' Switched off: '+off.map(x=>esc(x.n)).join(', ')+'.':' Every connected integration is sending data.')+(cv.more?' '+N(cv.more)+' more feeds are available from integrations not yet connected.':''),acts:[act('Integrations',()=>{Sheet.close(true);ON.integ();},'net')]};}
function reqFor(f,ph){const m=new Map([[aMoney,['pay']],[aForecast,['pay','hist']],[aSeason,['hist']],[aPace,['pay']],[aDeposits,ph==='pre'?['pay']:['pos']],[aGates,['scan']],[aHead,ph==='pre'?[]:['scan']],[aFraud,['scan']],[aUnseated,['scan']],[aStaff,['staff']],[aSpend,ph==='pre'?[]:['pos']],[aLeak,ph==='live'?['pos','kds']:[]],
    [aNoShow,ph==='pre'?['hist']:['scan']],[aVip,ph==='pre'?[]:['scan']],[aPreorders,ph==='live'?['pos','kds']:[]]]);return m.get(f)||[];}
const INTENTS=[
  [/\b(integration|data feed|feeds|connected|coverage|missing data|pos (is|on|off))/,aInteg],
  [/\b(waiting to be seated|unseated|not seated|waiting to sit|seat them)/,aUnseated],
  [/\b(summar|brief|overview|how are we|how('?s| is) (it|tonight|the night|everything)|status|update me|what('?s| is) happening|how did|go\b)/,aSummary],
  [/\b(need|priorit|focus|urgent|what should|to.?do|first)/,aNeeds],
  [/\b(pace|pacing|on track|ahead|behind|selling)/,aPace],
  [/\b(break.?even|profit|money|revenue|cash|collected|financ|earn|made|position)/,aMoney],
  [/\b(forecast|project|expect(ed)? revenue|land)/,aForecast],
  [/\b(deposit|unpaid|owe|balance|collect|declin|payment)/,aDeposits],
  [/\b(no.?show|late|not (arrived|here|come)|missing|release)/,aNoShow],
  [/\b(gate|queue|wait|line|bottleneck|throughput|entry)/,aGates],
  [/\b(capacity|headcount|how many|inside|crowd|density|full|busy|peak)/,aHead],
  [/\b(vip|backstage|bl\b)/,aVip],
  [/\b(promoter|source|channel|commission|partner)/,aSources],
  [/\b(waitlist|wait list|demand)/,aWaitlist],
  [/\b(staff|coverage|runner|bartender|security staff|clocked)/,aStaff],
  [/\b(claim|unnamed|named|seats? (open|empty)|open seats|empty seats)/,aClaims],
  [/\b(pre.?order|bottle|pack)/,aPreorders],
  [/\b(alert|fraud|duplicate|fake|scam)/,aFraud],
  [/\b(incident|medical|fight|injur|security issue)/,aIncidents],
  [/\b(spend|minimum|under min|over min)/,aSpend],
  [/\b(sell.?through|sold out|left|remaining|available|stock|to sell|open tables)/,aSell],
  [/\b(refund|transfer|dispute|chargeback)/,aQueue],
  [/\b(ready|readiness|checklist|prepared)/,aReady],
  [/\b(season|compare|last (year|season)|season 2)/,aSeason],
  [/\b(my section|my tables|arriving next|who is arriving)/,aMySec],
  [/\b(invite|win back|come back|loyal|regulars)/,aInvite],
  [/\b(risk|likely to (miss|no))/,aRisk],
  [/\b(leak|losing money|slow tables|upsell)/,aLeak],
  [/\b(release more|second wave|more tickets)/,aRelease],
  [/\b(price|pricing|raise the minimum|discount)/,aPrice]
];
const STOP=new Set('where what when which who whom whose is are was were the a an at in on for of to and or with my our any is there here how many much does did tonight table tables guest guests find show tell me about please can you sitting seated arrived arrive'.split(' '));
function findTable(q){const ql=q.toLowerCase();const ts=W.tables.slice().sort((a,b)=>b.name.length-a.name.length);for(const T of ts){if(ql.includes(T.name.toLowerCase()))return T;}
  const m=ql.match(/\b([a-z]{2}\d{1,2})\b/g);if(m)for(const x of m){const T=W.T[x.toUpperCase()];if(T)return T;}return null;}
function findGuest(q){const words=(q.match(/[A-Za-zÀ-ž’'\-]{3,}/g)||[]).filter(w=>!STOP.has(w.toLowerCase()));if(!words.length)return null;const t=now();
  const pool=[];W.bookings.forEach(b=>{if(bActive(b,t))b.seats.forEach(x=>{if(x.g>=0)pool.push(x.g);});});W.tix.forEach(x=>{if(x.g>=0&&x.at<=t)pool.push(x.g);});
  const uniq=[...new Set(pool)],lw=words.map(w=>w.toLowerCase());let best=null,bs=0;
  for(const gi of uniq){const n=W.guests[gi].n.toLowerCase().split(' ');let sc=0;lw.forEach(w=>{if(n.includes(w))sc+=w.length>3?2:1;});if(sc>bs){bs=sc;best=gi;}}
  return bs>=3?best:null;}
/* ---------- what each answer lights up on the floor ---------- */
const tid=(b,tone)=>({id:tableAt(b,now()),tone});
function fz(list,label,o){const ids=[],tone={};(list||[]).forEach(x=>{const id=typeof x==='string'?x:x.id;if(id&&W.T[id]&&!W.T[id].removed&&!tone[id]){ids.push(id);tone[id]=(x&&x.tone)||(o&&o.tone)||'gold';}});return Object.assign({ids,tone,zones:[],gates:[],label},o||{},{tone});}
function fOpen(s,label){return fz(W.tables.filter(T=>!s.ix[T.id]&&!T.oos).map(T=>T.id),label||'Open tables',{ov:s.ph==='pre'?'tier':null});}
function fNeeds(s){const t=s.t;if(s.ph==='pre')return fz(s.tb.depDue.map(b=>tid(b,'warn')).concat(W.tables.filter(T=>s.ix[T.id]&&s.ix[T.id].st==='requested').map(T=>({id:T.id,tone:'gold'}))),'Waiting on you');
  if(s.ph==='live')return fz(noShowTables(s).map(b=>tid(b,'bad')).concat(s.tb.balDue.filter(b=>b.declined&&b.declined<=t).map(b=>tid(b,'bad')),unseatedTables(t).map(x=>tid(x.b,'warn'))),'Needs attention now');
  const p=postStats(W,s);return fz(p.noshow.map(b=>({id:b.table,tone:'bad'})).concat(p.below.map(b=>tid(b,'warn'))),'No-shows and below minimum');}
const ZN={'Front floor':'front','Mid floor':'mid','Back floor':'back','Pit':'pit','Entry plaza':'plaza'};
const FOC=new Map([
  [aSummary,fNeeds],[aNeeds,fNeeds],
  [aPace,s=>s.ph==='pre'?fOpen(s,'Still to sell'):null],[aSell,s=>s.ph!=='post'?fOpen(s,'Open tables'):null],
  [aDeposits,s=>s.ph==='pre'?fz(s.tb.depDue.map(b=>tid(b,'warn')),'Deposit not paid'):fz(s.tb.balDue.map(b=>tid(b,'warn')),'Checks still open',{ov:'unpaid'})],
  [aNoShow,s=>{const t=s.t;if(s.ph==='pre')return fromI(iRisk(s)).focus;if(s.ph==='post')return fz(postStats(W,s).noshow.map(b=>({id:b.table,tone:'bad'})),'Did not come');
    return fz(noShowTables(s).map(b=>tid(b,'bad')).concat(W.bookings.filter(b=>bActive(b,t)&&b._c&&!b._c.present&&t>b.arriveBy&&t<=b.arriveBy+VENUE.graceMin*MIN&&(!mySec()||b.sec===mySec())).map(b=>tid(b,'warn'))),'Late and no-show',{ov:'noshow'});}],
  [aUnseated,s=>s.ph==='live'?fz(unseatedTables(s.t).map(x=>tid(x.b,x.wait>15*MIN?'bad':'warn')),'Guests waiting to sit'):null],
  [aGates,s=>{if(s.ph==='live'){const g_=s.gates.slice().sort((a,b)=>b.load-a.load);return fz([],g_[0].g.label+' is the busiest',{gates:[g_[0].g.id],zones:['plaza']});}if(s.ph==='post'){const w=postStats(W,s).gates.slice().sort((a,b)=>b.top/b.g.cap-a.top/a.g.cap)[0];return fz([],w.g.label+' was the busiest',{gates:[w.g.id],zones:['plaza']});}return fz([],'Gates',{gates:['G1','G2','G3','G4']});}],
  [aHead,s=>null],
  [aVip,s=>{const t=s.t,sec=mySec(),v=W.bookings.filter(b=>bActive(b,t)&&b.vip&&(!sec||b.sec===sec));const inn=b=>b.seats[0].ar&&b.seats[0].ar<=t,v2=s.ph==='pre'?v:v.filter(b=>!inn(b)).concat(v.filter(inn));const n=v.filter(b=>!inn(b)).length;
    return fz(v2.map(b=>tid(b,s.ph==='pre'?'gold':inn(b)?'ok':'gold')),s.ph==='pre'?'VIP and Backstage bookings':n+' still to come in gold, arrived in green',{ov:'vip'});}],
  [aSources,s=>{const pr=SOURCES.filter(x=>x.comm).map(x=>({x,d:s.src[x.id]})).sort((a,b)=>b.d.rev-a.d.rev)[0];if(!pr)return null;return fz(W.bookings.filter(b=>bActive(b,s.t)&&b.src===pr.x.id).map(b=>tid(b,'gold')),pr.x.label+' tables',{ov:'promo',promo:pr.x.id});}],
  [aWaitlist,s=>{const g=new Set(W.waitlist.filter(w=>w.at<=s.t&&!w.offered).map(w=>w.grp));return fz(W.tables.filter(T=>!s.ix[T.id]&&!T.oos&&g.has(T.grp)).map(T=>T.id),'Open tables the waitlist can take');}],
  [aClaims,s=>s.ph==='pre'?fz(W.bookings.filter(b=>bActive(b,s.t)&&b._c&&b._c.claimed<b.party*.5).map(b=>tid(b,'warn')),'Fewer than half the seats named',{ov:'claims'}):null],
  [aPreorders,s=>{const t=s.t;if(s.ph==='live')return fz(W.bookings.filter(b=>bActive(b,t)&&b.orders.some(o=>o.pre&&o.at<=t&&(!o.del||o.del>t)&&!o.opDel)).map(b=>tid(b,'gold')),'Pre-orders on their way',{ov:'prepend'});
    if(s.ph==='pre')return fz(W.bookings.filter(b=>bActive(b,t)&&b.pre.some(p=>p.at<=t)).map(b=>tid(b,'gold')),'Tables that pre-ordered',{ov:'pre'});return null;}],
  [aSpend,s=>{const t=s.t,sec=mySec();if(s.ph==='post')return fz(postStats(W,s).below.map(b=>tid(b,'warn')),'Below minimum');if(s.ph==='pre')return null;
    return fz(W.bookings.filter(b=>bActive(b,t)&&b._c&&b._c.present&&!b.comp&&(!sec||b.sec===sec)&&b._m.spend<b._m.min*.6&&t-Math.min.apply(null,b.seats.filter(x=>x.ar).map(x=>x.ar))>90*MIN).map(b=>tid(b,'warn')),'Under 60% of minimum after 90 min');}],
  [aMySec,s=>{const k=ROLES.host.sec;return fz(W.tables.filter(T=>T.sec===k&&s.ix[T.id]).map(T=>({id:T.id,tone:T._st==='noshow'?'bad':T._st==='expected'?'warn':'gold'})),SECTIONS[k].label,{sec:k});}],
  [aIncidents,s=>{const z=[...new Set(W.incidents.filter(x=>x.at<=s.t).slice(-6).map(x=>ZN[x.zone]||(/Gate/.test(x.zone)?'plaza':null)).filter(Boolean))];return z.length?fz([],'Where tonight’s incidents were',{zones:z}):null;}],
  [aFraud,s=>fz([],'Alerts come through the GA gates',{gates:['G1','G2'],zones:['plaza']})]
]);
function localAnswer(q,s){const ql=' '+q.toLowerCase()+' ';const T=findTable(q);if(T){const a=aTable(s,T);if(canTables())a.focus=fz([T.id],T.name);return a;}
  if(/\b(where|find|is|has|arrived|seated|guest)\b/.test(ql)||/^[A-Z][a-z]+ [A-Z]/.test(q.trim())){const gi=findGuest(q);if(gi!=null){const a=aGuest(s,gi),r=guestRecs(gi,s.t);if(r.seats.length&&canTables())a.focus=fz([tableAt(r.seats[0].b,s.t)],gName(gi)+'’s table');return a;}}
  let best=null,bs=0;INTENTS.forEach(([re,f],i)=>{const m=ql.match(new RegExp(re.source,'g'));const sc=m?m.length+(i<2?0:.1):0;if(sc>bs){bs=sc;best=f;}});
  if(!best)return null;const rq=reqFor(best,s.ph).filter(r=>!isOn(r));
  if(rq.length)return {text:'I can’t answer that yet. '+andList(rq.map(r=>IG[r].n))+' '+(rq.length>1?'are':'is')+' '+(rq.every(waiting)?'awaiting connection':'switched off')+', so that data isn’t coming in.',acts:[act('Integrations',()=>{Sheet.close(true);ON.integ();},'net')]};
  const a=best(s);if(!a.focus&&FOC.has(best)&&(canTables()||best===aGates||best===aHead||best===aFraud)){try{a.focus=FOC.get(best)(s)||null;}catch(e){a.focus=null;}}
  if(a.focus&&!a.focus.ids.length&&!a.focus.zones.length&&!a.focus.gates.length)a.focus=null;return a;}

/* ---------- Claude: open questions, answered from a snapshot of this event ---------- */
function agentCtx(s){const t=s.t,f=s.fin,o={venue:VENUE.name,event:W.ev.head,doors:fDT(W.D),close:fT(W.C),now:fDT(t)+' GST',phase:s.ph,role:ROLES[UI.role].label,
  sales:{tickets:GA.map((x,i)=>({tier:x.label,sold:s.tk.sold[i],alloc:x.alloc,price:x.price})),tables:TIER_ORDER.map(k=>({tier:TIERS[k].label,booked:s.tb.byTier[k].booked,total:s.tb.byTier[k].total,min:TIERS[k].min})),pending_backstage_requests:s.tb.pending,held:s.tb.held,seats_claimed:s.tb.claimed+'/'+s.tb.seats},
  waitlist:W.waitlist.filter(w=>w.at<=t&&!w.offered).length};
  if(isFin())o.money={collected:Math.round(f.collected),deposits:Math.round(f.dep),tickets:Math.round(f.tix),onsite:Math.round(f.onsite),committed_not_collected:Math.round(f.committed),breakeven:Math.round(f.breakeven),breakeven_set_by_manager:Math.round(s.cost.breakeven),forecast_revenue:Math.round(s.fc.gross),forecast_profit:Math.round(s.fc.profit),pace_vs_target:sgn(paceVs(s))};
  o.needs=(s.ph==='live'?needsLive(s):s.ph==='pre'?needsPre(s):[]).map(x=>stripTags(x.title)+': '+stripTags(x.sub));
  o.sources=SOURCES.map(x=>({src:x.label,group:x.grp,revenue:Math.round(s.src[x.id].rev),guests:s.src[x.id].n,arrived:s.src[x.id].in})).filter(x=>x.guests).slice(0,14);
  if(s.ph!=='pre')o.live={scanned_in_tonight:s.inAll,exits:'not counted',capacity:VENUE.capacity,arrivals_per_min:s.rate,peak:Math.round(s.peak)+' at '+fT(s.peakAt),gates:(s.gates||[]).map(x=>({gate:x.g.label,scans_per_min:x.rate,capacity_per_min:x.g.cap})),queue_length:'not measured',
    tables:s.tb.st,no_show_tables:noShowTables(s).map(b=>W.T[tableAt(b,t)].name),balances_due:s.tb.balDue.length,ticket_alerts:liveAlerts(t).length,staff_signed_in:(s.staff||[]).map(x=>x.sp.role+' '+x.in+'/'+x.sp.plan),zone_density:'not measured',
    incidents:W.incidents.filter(x=>x.at<=t).slice(-5).map(x=>fT(x.at)+' '+x.zone+': '+x.note)};
  if(s.ph==='post'){const p=postStats(W,s);o.post={attendance:p.inAll,show_rate:pct(p.showRate,1,1),revenue:Math.round(p.gross),profit:Math.round(p.profit),forecast_at_doors:Math.round(p.fcGross),tables_above_min:p.above.length,below:p.below.length,no_show_tables:p.noshow.length,busiest_gate_minute:p.peak+' a minute at '+fT(p.peakAt),
    gates:p.gates.map(x=>x.g.label+' peak '+Math.round(x.top)+' of '+x.g.cap+' scans a minute at '+fT(x.at)),promoters:p.promo.map(x=>x.x.label+': '+x.n+' guests, show '+pct(x.show,1)+', revenue '+Math.round(x.rev)),new_guests:p.newG,delivery_median_min:p.delMed.toFixed(0)};}
  if(UI.role==='host')o.my_section=Object.assign({name:SECTIONS[ROLES.host.sec].label},s.sec[ROLES.host.sec]);
  /* the Manager only sees numbers that come from a connected source */
  {const AW=id=>'awaiting connection: '+IG[id].n;
   if(o.money){if(!isOn('pay')){o.money.deposits=AW('pay');o.money.committed_not_collected=AW('pay');o.money.collected='tickets only: '+Math.round(f.tix);}
     if(!isOn('pos'))o.money.onsite=AW('pos');
     if(!isOn('hist')||!isOn('pay')||!isOn('pos')){o.money.forecast_revenue='not available until Adyen, POS and past season records are connected';o.money.forecast_profit=o.money.forecast_revenue;o.money.pace_vs_target='tickets only';}}
   if(o.live){if(!isOn('pos'))o.live.balances_due=AW('pos');}
   if(o.post){if(!isOn('pos')||!isOn('pay')){o.post.revenue='tickets only: '+Math.round(f.tix);o.post.profit='not available';o.post.forecast_at_doors='not available';o.post.tables_above_min=AW('pos');o.post.below=AW('pos');}
     if(!isOn('kds'))o.post.delivery_median_min=AW('kds');}
   o.not_connected=INTEG.filter(x=>waiting(x.id)).map(x=>x.n);}
  if(canTables())o.tables_by_state=(()=>{const r={};W.tables.forEach(T=>{const e=s.ix[T.id];const k=!e?'open':e.st!=='booked'?e.st:s.ph==='pre'?(e.b._m&&e.b._m.depDue?'deposit_due':'booked'):(T._st||'booked');(r[k]=r[k]||[]).push(T.name);});Object.keys(r).forEach(k=>{if(r[k].length>40)r[k]=r[k].slice(0,40).concat(['…']);});return r;})();
  return o;}
function agentCatalog(s){const c=[];const add=(id,l,f)=>c.push([id,l,f]);
  if(s.ph==='pre'){add('deposits','Unpaid deposits',goMod('chase'));add('pace','Sales pace',goMod('pace'));add('sell','Sell-through',goMod('sell'));add('waitlist','Waitlist',goMod('waitlist'));add('claims','Seat claims',goMod('claims'));add('ready','Readiness',goMod('ready'));if(isFin()){add('cost','Breakeven',goMod('cost'));add('forecast','Forecast',goMod('forecast'));add('sources','Sources',goMod('sources'));}}
  if(s.ph==='live'){add('gates','Gates',goMod('gates'));add('noshow','No-shows',goMod('noshow'));add('floor_noshow','No-shows on the floor',goFloor('noshow'));add('floor_unpaid','Unpaid on the floor',goFloor('unpaid'));add('vip','VIP arrivals',goMod('vipl'));add('head','Headcount',goMod('head'));add('fraud','Ticket alerts',goMod('fraud'));add('staff','Staff coverage',goMod('staff'));add('minspend','Spend vs minimums',goMod('minspend'));add('incidents','Incident log',goMod('incidents'));}
  if(s.ph==='post'){add('recon','Revenue against forecast',goMod('recon'));add('promoters','Promoter scorecard',goMod('promoters'));add('lessons','Ops lessons',goMod('lessons'));add('tiers','Tier suggestions',goMod('tiers'));add('follow','Follow-ups',goMod('follow'));add('report','Post-event report',()=>{Sheet.close(true);ON.report();});}
  return c;}
async function claudeAnswer(q,s,thread,deep){if(!isOn('ai'))return null;const cat=agentCatalog(s),ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),20000);
  const sys='You are the manager agent inside BUBL OPS, the operator app for '+VENUE.name+', a '+n0(VENUE.capacity)+'-capacity open-air event venue. You speak to venue staff on a phone or tablet during operations. Answer using only CONTEXT. Lead with the answer, then the numbers that matter. '+(deep?'Write a short brief: up to 6 plain sentences, no lists, then one recommendation.':'Maximum 3 short sentences.')+' Use AED and 24-hour GST times. If CONTEXT does not contain the answer, say what you can see instead. Never invent guests, tables or numbers. The role in CONTEXT limits what you may disclose: hosts do not see venue financials. Respond with ONLY valid JSON, no markdown: {"answer":"...","actions":["id"],"tables":["table names from CONTEXT"],"zones":["pit|front|mid|back|plaza"]} with at most 2 ids from ACTIONS. List in tables and zones only what the answer is about; the app lights them up on the floor plan.';
  const hist=thread.filter(m=>m.text).slice(-6).map(m=>({role:m.me?'user':'assistant',content:m.me?m.text:stripTags(m.text)}));
  const msgs=hist.concat([{role:'user',content:'CONTEXT: '+JSON.stringify(agentCtx(s))+'\nACTIONS: '+JSON.stringify(cat.map(x=>({id:x[0],label:x[1]})))+'\nQUESTION: '+q}]);
  while(msgs.length&&msgs[0].role!=='user')msgs.shift();
  try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:sys,messages:msgs})});
    clearTimeout(to);if(!r.ok)throw new Error('http '+r.status);const d=await r.json(),txt=(d.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('');
    const j=JSON.parse(txt.replace(/```json|```/g,'').trim());if(!j.answer)throw new Error('empty');
    return {text:String(j.answer).split(/(AED\s?[\d.,]+[KM]?|\d[\d,.:]*%?)/).map((x,i)=>i%2?'<span class="n">'+esc(x)+'</span>':esc(x)).join(''),acts:(j.actions||[]).map(id=>cat.find(x=>x[0]===id)).filter(Boolean).slice(0,2).map(x=>act(x[1],x[2])),src:'claude',
      focus:(()=>{const ids=(j.tables||[]).map(n=>{const T=findTable(String(n));return T&&T.id;}).filter(Boolean),zs=(j.zones||[]).filter(z=>ZONES[z]);return ids.length||zs.length?fz(canTables()?ids:[],ids.length?ids.length+' '+pl(ids.length,'table'):'On the floor',{zones:zs}):null;})()};}
  catch(e){clearTimeout(to);return null;}}

/* ---------- the agent UI ---------- */
const AG_SUG={pre:{owner:['What needs me today?','Are we on pace?','When do we pass breakeven?','Which deposits are unpaid?','How is the waitlist?'],host:['Who is arriving in my section?','Which tables have open seats?','Any Backstage requests?']},
  live:{owner:['Give me a 30-second brief','Where is the bottleneck?','Which tables are no-shows?','How are VIPs arriving?','Is any table under minimum?'],host:['Who is arriving next in my section?','Which tables are under minimum?','Any VIPs due soon?']},
  post:{owner:['How did the night go?','Which promoters performed?','What went wrong at the gates?','Who should we invite back first?'],host:['How did my section do?','Which tables were under minimum?']}};
/* ---------- the BUBL bubble: La Cave's champagne-glass mark ---------- */
function bublSprite(){if(document.getElementById('bublDefs'))return;document.body.insertAdjacentHTML('afterbegin','<svg id="bublDefs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>'+
  '<radialGradient id="bbGlass" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6E2" stop-opacity=".03"/><stop offset=".7" stop-color="#FFF1D6" stop-opacity=".05"/><stop offset=".88" stop-color="#F2E2B0" stop-opacity=".16"/><stop offset=".965" stop-color="#FFF8E8" stop-opacity=".45"/><stop offset="1" stop-color="#FFF8E8" stop-opacity=".7"/></radialGradient>'+
  '<radialGradient id="bbRimM" cx="50%" cy="50%" r="50%"><stop offset=".56" stop-color="#000"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></radialGradient><mask id="bbRim"><circle cx="32" cy="32" r="28" fill="url(#bbRimM)"/></mask>'+
  '<radialGradient id="bbF1"><stop offset="0" stop-color="#F6D98E" stop-opacity=".95"/><stop offset="1" stop-color="#F6D98E" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="bbF2"><stop offset="0" stop-color="#E8A77C" stop-opacity=".9"/><stop offset="1" stop-color="#E8A77C" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="bbF3"><stop offset="0" stop-color="#C98E3E" stop-opacity=".9"/><stop offset="1" stop-color="#C98E3E" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="bbF4"><stop offset="0" stop-color="#FFF3D1" stop-opacity=".8"/><stop offset="1" stop-color="#FFF3D1" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="bbSpec"><stop offset="0" stop-color="#FFFDF6" stop-opacity=".95"/><stop offset=".45" stop-color="#FFF6E0" stop-opacity=".45"/><stop offset="1" stop-color="#FFF6E0" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="bbCaus"><stop offset="0" stop-color="#F6E2B0" stop-opacity=".6"/><stop offset="1" stop-color="#F6E2B0" stop-opacity="0"/></radialGradient>'+
  '<linearGradient id="bbGlint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF8E8" stop-opacity="0"/><stop offset=".5" stop-color="#FFF8E8" stop-opacity=".95"/><stop offset="1" stop-color="#FFF8E8" stop-opacity="0"/></linearGradient>'+
  '<clipPath id="bbClip"><circle cx="32" cy="32" r="28"/></clipPath></defs></svg>');}
function bublMark(cls){bublSprite();return '<svg class="bubl '+(cls||'')+'" viewBox="0 0 64 64" role="img" aria-label="BUBL"><g clip-path="url(#bbClip)"><g mask="url(#bbRim)" style="mix-blend-mode:screen">'+
  '<g class="bb-a"><ellipse cx="46" cy="18" rx="20" ry="14" fill="url(#bbF1)"/><ellipse cx="14" cy="44" rx="18" ry="16" fill="url(#bbF3)"/></g><g class="bb-b"><ellipse cx="48" cy="46" rx="17" ry="15" fill="url(#bbF2)"/><ellipse cx="18" cy="16" rx="12" ry="10" fill="url(#bbF4)"/></g></g>'+
  '<circle cx="32" cy="32" r="28" fill="url(#bbGlass)"/><ellipse cx="41" cy="45" rx="7" ry="4.5" fill="url(#bbCaus)" transform="rotate(-35 41 45)"/></g>'+
  '<circle cx="32" cy="32" r="27.8" fill="none" stroke="#F2E2B0" stroke-opacity=".38" stroke-width=".55"/><g class="bb-glint"><path d="M32 4.2A27.8 27.8 0 0 1 52.6 13.2" fill="none" stroke="url(#bbGlint)" stroke-width="1.4" stroke-linecap="round"/></g>'+
  '<ellipse class="bb-spec" cx="21.5" cy="18.5" rx="8.5" ry="4.6" fill="url(#bbSpec)" transform="rotate(-38 21.5 18.5)"/><circle cx="16.8" cy="25.4" r="1.5" fill="#FFFDF6" opacity=".85"/></svg>';}
const Agent={busy:false,
  thread(){return W.agent||(W.agent=[]);},
  card(){const ph=phase(),sug=(AG_SUG[ph][UI.role]||AG_SUG[ph].owner);
    return '<div class="agent hud"><div class="ag-top"><span class="ag-badge">'+bublMark()+'</span><div><b>Manager</b><span>Ask anything about this event. Answers come from live data.</span></div>'+(this.thread().length?'<button class="btn xs" data-act="agOpen">'+N(this.thread().filter(m=>m.me).length)+' asked</button>':'')+'</div>'+
      '<div class="ag-in"><input id="agQ" type="text" placeholder="Ask about money, gates, a table, a guest" enterkeyhint="send" autocomplete="off" aria-label="Ask the manager agent"><button data-act="agSend" aria-label="Ask">'+I('send',20)+'</button></div>'+
      '<div class="chips">'+sug.map(q=>'<button class="chip" data-act="agSug" data-q="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div>'+this.last()+'</div>';},
  last(){if(UI.device!=='atlas')return '';const th=this.thread(),a=th.slice().reverse().find(m=>!m.me&&!m.typing),q=a&&th[th.indexOf(a)-1];return a?'<button class="ag-last" data-act="agOpen" style="text-align:left"><b>'+esc(q&&q.text||'')+'</b>'+a.text+'</button>':'';},
  msgHTML(m){if(m.me)return '<div class="msg me">'+esc(m.text)+'</div>';if(m.typing)return '<div class="msg ai typing" aria-label="Thinking"><span class="ai-av">'+bublMark('think')+'</span><i></i><i></i><i></i></div>';
    return '<div class="msg ai"><span class="ai-av">'+bublMark()+'</span><div class="ai-t">'+m.text+'</div>'+(m.facts&&m.facts.length?'<div class="kv">'+m.facts.map(f=>'<span>'+esc(f[0])+'</span><b class="n">'+esc(f[1])+'</b>').join('')+'</div>':'')+
      (m.rows&&m.rows.length?'<div class="rows">'+m.rows.map(r=>row(r[0],r[1],r[2],r[3],r[4]?'<b class="n">'+r[4]+'</b>':'')).join('')+'</div>':'')+
      (m.acts&&m.acts.length?'<div class="ai-acts">'+m.acts.map((a,i)=>'<button class="btn xs '+(i===0?'pri':'')+'" data-act="runAct" data-a="'+a.id+'">'+I(a.ic,14)+esc(a.label)+'</button>').join('')+'</div>':'')+
      '<div class="ai-src">'+(m.src==='claude'?'Claude, from this event’s data':'From live data, on this device')+' · '+N(fT(m.at))+'</div></div>';},
  paint(){const el=$('#agThread');if(!el)return;el.innerHTML=this.thread().map(m=>this.msgHTML(m)).join('');const b=el.closest('.sh-body');if(b)b.scrollTop=b.scrollHeight;},
  open(){if(Sheet.top()&&Sheet.top().agent){$('#agQ2',Sheet.top().el).focus();return;}
    Sheet.open({agent:true,tall:true,static:true,title:'Manager',sub:()=>esc(W.ev.short)+' · '+({pre:'planning',live:'live',post:'after the event'}[phase()])+' · '+esc(ROLES[UI.role].label),
      body:()=>'<div class="ag-thread" id="agThread"></div>'+(this.thread().length?'':'<div class="chips" style="flex-wrap:wrap">'+(AG_SUG[phase()][UI.role]||AG_SUG[phase()].owner).map(q=>'<button class="chip" data-act="agSug" data-q="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div>'),
      foot:()=>'<div class="ag-in" style="margin:0"><input id="agQ2" type="text" placeholder="Ask a follow-up" enterkeyhint="send" autocomplete="off" aria-label="Ask the manager agent"><button data-act="agSend2" aria-label="Ask">'+I('send',20)+'</button></div>',
      onOpen:()=>this.paint()});},
  async ask(q,o){q=String(q||'').trim();if(!q||this.busy)return;o=o||{};const th=this.thread();th.push({me:1,text:q,at:now()});if(!o.silent){this.open();}const typing={typing:1};th.push(typing);this.paint();this.busy=true;
    const s=S();let a=o.deep?null:localAnswer(q,s);if(!a||o.deep){const c=await claudeAnswer(q,s,th.filter(m=>m!==typing),o.deep);a=c||a||aFallback();}
    await new Promise(r=>setTimeout(r,a.src==='claude'?0:260));th.splice(th.indexOf(typing),1);const m=Object.assign({at:now(),src:a.src||'data'},a);
    if(!o.floor&&m.focus){const n=m.focus.ids.length;m.acts=[act(n?'See '+(n===1?'it':'these '+n)+' on the floor':'See it on the floor',()=>{UI.floor.ans={q,m};UI.floor.ai=-1;UI.floor.ask=false;goFloor(null)();},'floor')].concat((m.acts||[]).filter(x=>x.ic!=='floor'));}
    th.push(m);this.busy=false;this.paint();
    log('Asked the manager agent',q.slice(0,80));if(UI.device==='atlas')Atlas.update(true);return m;}
};
M.agent={t:'Manager',hero:()=>Agent.card()};
ON.agSend=()=>{const i=$('#agQ'),q=i&&i.value;if(!q||!q.trim()){Agent.open();return;}i.value='';i.blur();Agent.ask(q);};
ON.agSend2=()=>{const i=$('#agQ2'),q=i&&i.value;if(!q||!q.trim())return;i.value='';Agent.ask(q);};
ON.agSug=el=>{Agent.ask(el.dataset.q);};
ON.agOpen=()=>Agent.open();
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='faQ'){e.preventDefault();ON.faSend();return;}if(e.target.id==='agQ'){e.preventDefault();ON.agSend();}else if(e.target.id==='agQ2'){e.preventDefault();ON.agSend2();}else if(e.target.id==='inQ'&&ON.inAsk){e.preventDefault();ON.inAsk();}});

/* ============================================================
   INTELLIGENCE REQUESTS
   Deeper reads that take a few seconds to read, not to compute.
   Each one ends in something you can do.
   ============================================================ */
const INTEL=[
  {id:'risk',req:['pay','hist'],ph:['pre','live'],t:'Tables at risk of not showing',d:'Scores every booked table on deposit, seat claims, history and source',run:iRisk},
  {id:'upsell',req:['hist'],ph:['pre'],t:'Ticket holders who could take a table',d:'Returning guests on tickets, matched to open tables',run:iUpsell},
  {id:'release',req:['hist'],ph:['pre'],t:'Can we release more Second wave?',d:'Headroom at peak from past no-show rates',run:iRelease},
  {id:'price',ph:['pre'],t:'Price check by tier',d:'Demand against stock, with the time left to sell',run:iPrice},
  {id:'leak',req:['pos','kds'],ph:['live'],t:'Where tonight is leaking revenue',d:'Slow tables, slow service, guests waiting to sit',run:iLeak},
  {id:'promo',req:['pay','pos'],ph:['pre','live','post'],t:'Promoter allocation for the next event',d:'Show rate, spend and commission by promoter',run:iPromo},
  {id:'invite',ph:['post'],t:'Invite list for the next event',d:'Who gets first pick, who to win back',run:iInvite}
];
function iRisk(s){const t=s.t,rows=[];W.bookings.forEach(b=>{if(!bActive(b,t)||b.comp)return;const c=seatCounts(b,t);if(s.ph==='live'&&c.present)return;const m=money(b,t),gst=G(b.booker),so=SRC[b.src];let sc=0;const why=[];
    if(m.depDue){sc+=3;why.push('deposit unpaid');}if(c.claimed<b.party*.5){sc+=2;why.push(c.claimed+' of '+b.party+' named');}if(gst.crm===0){sc+=1;why.push('first booking');}
    if(so.grp==='promoter'&&pastShow(so.id)<.86){sc+=1;why.push(so.label+' showed '+pct(pastShow(so.id),1));}if(s.ph==='live'&&t>b.arriveBy){sc+=2;why.push(Math.round((t-b.arriveBy)/MIN)+' min late');}
    if(sc>=3)rows.push({b,sc,why,m,c});});rows.sort((a,b)=>b.sc-a.sc);const dep=rows.filter(r=>r.m.depDue).map(r=>r.b),cl=rows.filter(r=>r.c.claimed<r.b.party*.5).map(r=>r.b);
  const focus=fz(rows.map(r=>tid(r.b,r.sc>=5?'bad':'warn')),'Most likely not to show');
  return {focus,sum:N(rows.length)+' tables carry most of the no-show risk, '+AK(sum(rows,r=>Math.max(0,r.m.min-r.m.collected)))+' of minimums not yet paid. An unpaid deposit is the strongest signal; unnamed seats come next.',
    rows:rows.slice(0,10).map(r=>['tdown',r.sc>=5?'bad':'warn',esc(W.T[tableAt(r.b,t)].name)+' · '+esc(gName(r.b.booker)),esc(r.why.join(', ')),'Risk '+r.sc]),
    acts:[dep.length?act('Remind '+dep.length+' deposits',()=>{dep.forEach(b=>Act.chaseDeposit(b));toast('Reminders sent to '+N(dep.length)+' bookers.');refresh(true);},'msg'):null,cl.length?act('Nudge '+cl.length+' tables',()=>{cl.forEach(b=>Act.nudge(b));toast('Nudged '+N(cl.length)+' tables.');refresh(true);},'bell'):null].filter(Boolean)};}
function iUpsell(s){const t=s.t,booked=new Set();W.bookings.forEach(b=>{if(bActive(b,t))b.seats.forEach(x=>{if(x.g>=0)booked.add(x.g);});});
  const c=[];W.tix.forEach(x=>{if(x.at>t||x.g<0||x.st===1||x.k>2||booked.has(x.g))return;const gst=W.guests[x.g];if(gst.crm>=1&&gst.v>=2)c.push({x,gst});});c.sort((a,b)=>b.gst.crm-a.gst.crm||b.gst.v-a.gst.v);
  const open=W.tables.filter(T=>!s.ix[T.id]&&!T.oos),og=by(open,T=>T.grp);const top=c.slice(0,40);
  return {focus:fz(open.filter(T=>T.grp==='gold'||T.grp==='silver').map(T=>T.id),'Gold and Silver still open'),sum:N(c.length)+' returning guests hold tickets but have no table. '+N(open.length)+' tables are still open: '+GROUPS.filter(g_=>og[g_[0]]).map(g_=>N(og[g_[0]].length)+' '+g_[1]).join(', ')+'. Offer Gold and Silver first, they convert best from tickets.',
    rows:top.slice(0,10).map(o=>['user',o.gst.crm===2?'neu':'',esc(o.gst.n),['Early entry','Second wave','VIP standing'][o.x.k]+' · '+crmLabel(o.gst)+', '+o.gst.v+' visits']),
    acts:[act('Send table offer to '+top.length,()=>{log('Table offers sent',top.length+' ticket holders');bump();toast('Offers sent to '+N(top.length)+' guests with a link to the open tables.');},'msg')]};}
function iRelease(s){const ns=PAST[3],exp=s.fc.att||TARGET.att,head=VENUE.capacity*.97-exp,can_=Math.max(0,Math.floor((head-250)/100)*100),left=GA[1].alloc-s.tk.sold[1];
  return {focus:fz([],'Room on the floor at peak',{zones:['front','mid','back']}),sum:'Expected attendance is '+N(n0(exp))+' against a licence of '+N(n0(VENUE.capacity))+', after '+N(pct(ns.noShowGA,1,1))+' of tickets and '+N(pct(ns.noShowSeat,1,1))+' of seats not arriving. '+(can_>0?'You can release about '+N(n0(can_))+' more Second wave and still keep a 250-person buffer at peak.':'Hold. Peak is already forecast close to capacity.'),
    rows:[['users','','Expected through the gates',N(n0(exp))],['gate','','Second wave still unsold',N(n0(left))],['shield',can_>0?'ok':'warn','Safe extra release',N(n0(can_))]],acts:[act('Presale windows',goMod('windows'),'cal')]};}
function iPrice(s){const elapsed=s.pT,wl=W.waitlist.filter(w=>w.at<=s.t&&!w.offered),rows=TIER_ORDER.map(k=>{const b=s.tb.byTier[k],sold=b.booked/b.total,dem=wl.filter(w=>w.grp===TIERS[k].grp).length,free=b.total-b.booked-b.held-b.pending,ahead=sold/Math.max(.05,elapsed);
    const rec=ahead>1.15&&dem>free?'Ahead and over-demanded. Hold price, add a late-booking minimum.':ahead<.85?'Behind pace. Push through promoters or bundle a pre-order.':'On pace. Leave it.';return ['tag',ahead>1.15?'ok':ahead<.85?'warn':'',esc(TIERS[k].label)+' · '+aed(TIERS[k].min),pct(sold,1)+' sold, '+dem+' waiting, '+free+' free. '+rec];});
  return {sum:'By now the season curve expects '+N(pct(elapsed,1))+' of tables sold. Tiers well ahead with a waitlist bigger than their free stock can carry a higher late minimum; tiers behind need a push, not a discount.',rows,acts:[act('Sell-through',goMod('sell'))]};}
function iLeak(s){const t=s.t,un=unseatedTables(t),slow=[];W.bookings.forEach(b=>{if(!bActive(b,t))return;b.orders.forEach(o=>{if(o.at<=t&&(!o.del||o.del>t)&&t-o.at>12*MIN)slow.push({b,o});});});
  const under=W.bookings.filter(b=>bActive(b,t)&&b._c&&b._c.present&&!b.comp&&b._m.spend<b._m.min*.6&&t-Math.min.apply(null,b.seats.filter(x=>x.ar).map(x=>x.ar))>90*MIN);
  return {focus:fz(under.map(b=>tid(b,'warn')).concat(slow.map(x=>tid(x.b,'bad'))),'Slow tables and slow service'),sum:N(under.length)+' seated tables are under 60% of minimum after 90 minutes, '+N(slow.length)+' orders have been on the way over 12 minutes, and '+N(un.length)+' tables have guests waiting to sit. Fix service first: slow tables stop ordering.',
    rows:under.slice(0,6).map(b=>['tdown','warn',esc(W.T[tableAt(b,t)].name),N(aedK(b._m.spend))+' of '+N(aedK(b._m.min))+' · host '+esc(b.host)]).concat(slow.slice(0,4).map(x=>['glass','bad',esc(x.o.nm),esc(W.T[tableAt(x.b,t)].name)+' · '+N(fDur(t-x.o.at))+' · '+esc(x.o.runner)])),
    acts:[act('Spend vs minimums',goMod('minspend')),act('Waiting to be seated',goMod('unseated'),'users')]};}
function iPromo(s){const live=s.ph!=='pre',l=SOURCES.filter(x=>x.comm).map(x=>{const d=s.src[x.id],show=live?d.in/Math.max(1,d.n):pastShow(x.id);return {x,d,show,per:d.rev/Math.max(1,d.n)};}).filter(o=>o.d.n).sort((a,b)=>b.show-a.show);
  return {sum:'Ranked by '+(live?'show rate tonight':'show rate last season')+'. Grow the promoters whose guests turn up and spend, shrink the ones who fill lists that do not arrive.',
    rows:l.map(o=>['users',o.show>=.9?'ok':o.show<.8?'warn':'',esc(o.x.label),pct(o.show,1)+' show · '+n0(o.d.n)+' guests · '+aedK(o.per)+' a guest · '+(o.show>=.9?'raise allocation 20%':o.show<.8?'cut allocation 30%':'hold'),N(aedK(o.d.comm))]),acts:[act('Sources',goMod(live&&s.ph==='post'?'promoters':'sources'),'pie')]};}
function iInvite(s){const p=postStats(W,s),n=p.up.length+p.firstTable.length,lost=p.down;
  return {focus:fz(p.up.map(b=>tid(b,'gold')).concat(p.firstTable.map(b=>tid(b,'ok')),p.down.map(b=>({id:b.table,tone:'bad'}))),'Gold: invite up · green: first-timers · red: missed'),sum:N(p.up.length)+' guests earned a Backstage List invite, '+N(p.firstTable.length)+' first-time bookers spent well over minimum, and '+N(lost.length)+' Backstage List guests did not come. Offer the first two groups first pick for the next event; the team calls the third.',
    rows:p.up.slice(0,6).map(b=>['star','neu',esc(gName(b.booker)),'Spent '+aedK(b._m.spend)+' · '+(G(b.booker).v+1)+' visits']).concat(lost.slice(0,4).map(b=>['phone','warn',esc(gName(b.booker)),'Booked '+W.T[b.table].name+', did not come'])),
    acts:[act('Send first pick to '+n,()=>{log('First-pick invites sent',n+' guests');bump();toast('First pick sent to '+N(n)+' guests for the next event.');},'msg'),act('Tier suggestions',goMod('tiers'),'star')]};}
function intelCard(r){return '<div class="hud ir"><div class="ir-h"><b>'+esc(r.title)+'</b><span class="n">'+fT(r.at)+'</span></div>'+(r.res.sum?'<p class="ir-p">'+r.res.sum+'</p>':'')+
  (r.res.rows&&r.res.rows.length?'<div class="rows">'+r.res.rows.map(x=>row(x[0],x[1],x[2],x[3],x[4]?'<b class="n">'+x[4]+'</b>':'')).join('')+'</div>':'')+
  (r.res.acts&&r.res.acts.length?'<div class="ai-acts">'+r.res.acts.map((a,i)=>'<button class="btn xs '+(i===0?'pri':'')+'" data-act="runAct" data-a="'+a.id+'">'+I(a.ic,14)+esc(a.label)+'</button>').join('')+'</div>':'')+(r.res.src==='claude'?'<div class="ai-src">Claude, from this event’s data</div>':'')+'</div>';}
function openIntel(runId){const list=()=>W.intel||(W.intel=[]);let o=null;
  o=Sheet.open({tall:true,static:true,title:'Intelligence request',sub:'Ask Atlas for a deeper read. Results stay here for this event.',
    body:()=>{const ph=phase(),tpl=INTEL.filter(x=>(x.req||[]).every(isOn)&&x.ph.includes(ph));return '<div class="grp"><div class="lbl">Ready to run</div><div class="rows">'+tpl.map(x=>row('bulb','neu',esc(x.t),esc(x.d),'<button class="btn xs pri" data-act="inRun" data-i="'+x.id+'">Run</button>')).join('')+'</div></div>'+
      '<div class="grp"><div class="lbl">Or describe what you need</div><div class="ag-in" style="margin:0"><input id="inQ" type="text" placeholder="e.g. which Gold tables booked late and spent most" enterkeyhint="send" autocomplete="off"><button data-act="inAsk" aria-label="Request">'+I('send',20)+'</button></div></div>'+
      '<div class="grp" id="inRes">'+(list().length?'<div class="lbl">Results</div>'+list().map(intelCard).join(''):'')+'</div>';}});
  const paintRes=()=>{const el=$('#inRes',o.el);if(el)el.innerHTML='<div class="lbl">Results</div>'+list().map(intelCard).join('');const b=$('.sh-body',o.el);if(b&&el)b.scrollTop=el.offsetTop-20;};
  ON.inRun=el=>{const x=INTEL.find(i=>i.id===el.dataset.i);list().unshift({id:x.id,at:now(),title:x.t,res:x.run(S())});log('Intelligence request',x.t);bump();paintRes();refresh(true);};
  ON.inAsk=async()=>{const i=$('#inQ',o.el),q=i&&i.value.trim();if(!q)return;i.value='';const r={id:'q',at:now(),title:q,res:{sum:'<span class="mut">Working on it…</span>'}};list().unshift(r);paintRes();
    const s=S(),c=await claudeAnswer(q,s,[],true),a=c||localAnswer(q,s)||{text:'This needs the BUBL intelligence service, which is not reachable from here. The request is saved and will run when it is.'};
    r.res={sum:a.text,rows:a.rows,acts:a.acts,src:c?'claude':'data'};log('Intelligence request',q.slice(0,80));bump();paintRes();refresh(true);};
  if(runId)setTimeout(()=>ON.inRun({dataset:{i:runId}}),60);}
M.intel={t:'Intelligence request',go:()=>openIntel(),tile:s=>{const n=(W.intel||[]).length;return tile('intel','Intelligence request',n?n+'<small>ready</small>':'<span style="color:var(--gold)">'+I('bulb',28)+'</span>',n?'Last: '+esc((W.intel[0].title||'').slice(0,40)):'Deep reads on guests, pricing and promoters');},
  panel:s=>'<div class="ph"><h4>Intelligence request</h4><span>deeper reads, each ending in an action</span></div><div class="rows">'+INTEL.filter(x=>(x.req||[]).every(isOn)&&x.ph.includes(phase())).map(x=>row('bulb','neu',esc(x.t),esc(x.d),'<button class="btn xs pri" data-act="inGo" data-i="'+x.id+'">Run</button>')).join('')+'</div>'};
ON.inGo=el=>openIntel(el.dataset.i);

/* ============================================================
   FLOOR AGENT
   Ask on the plan and the plan answers: the overlay switches to
   the right encoding, the relevant tables light up in their own
   outline while the rest of the room dims, zones and gates glow,
   and the camera frames them. No markers are laid over the venue.
   ============================================================ */
const FA={
  ph(){const p=phase();return p==='pre'?'Ask the floor: unpaid deposits?':p==='live'?'Ask the floor: who is late?':'Ask the floor: who came in under?';},
  sug(){const p=phase(),host=UI.role==='host';return p==='pre'?['Unpaid deposits','Empty seats','Open tables to sell','VIP and Backstage','Tables at risk','Waitlist matches']
    :p==='live'?(host?['My section','Who is late?','Waiting to be seated','Under minimum','VIPs still to come']:['Who is late?','Unpaid tables','Where is it busiest?','Busiest gate','VIPs still to come','Under minimum','Pre-orders on the way','Waiting to be seated'])
    :['Below minimum','No-shows','Where did it peak?','Longest queue','Top promoter tables','Who to invite back'];},
  async ask(q){q=String(q||'').trim();if(!q||Agent.busy)return;const F=UI.floor;F.ask=false;F.ans={q,m:null};F.ai=-1;F.sel=null;F.spot=null;Floor.paintTop();this.paint();Floor.update(true);
    const m=await Agent.ask(q,{silent:true,floor:true});if(!F.ans||F.ans.q!==q)return;F.ans={q,m};this.paint();Floor.spotlight(m&&m.focus);},
  paint(){const host=Floor.host,el=host&&$('#faCard',host);if(!el)return;const F=UI.floor,a=F.ans;
    if(!a){el.style.display='none';el.innerHTML='';Floor.paintLeg();return;}el.style.display='';
    if(!a.m){el.innerHTML='<div class="fa-h"><span class="fa-av">'+bublMark('think')+'</span><b>'+esc(a.q)+'</b></div><div class="fa-th">Reading the floor…</div>';Floor.paintLeg();return;}
    const m=a.m,fc=m.focus,ids=fc?fc.ids:[],cur=F.ai==null?-1:F.ai;
    let h='<div class="fa-h"><span class="fa-av">'+bublMark()+'</span><b>'+esc(a.q)+'</b><button class="fa-x" data-act="faClear" aria-label="Clear the answer">'+I('x',17)+'</button></div><div class="fa-t">'+m.text+'</div>';
    if(ids.length)h+='<div class="fa-nav"><span class="fa-lab">'+esc(fc.label||(ids.length+' tables'))+'</span><span class="fa-step"><button data-act="faStep" data-d="-1" aria-label="Previous table">'+I('right',16).replace('<svg','<svg style="transform:scaleX(-1)"')+'</button><b class="n">'+(cur>=0?(cur+1)+'/':'')+ids.length+'</b><button data-act="faStep" data-d="1" aria-label="Next table">'+I('right',16)+'</button>'+(cur>=0?'<button class="fa-all" data-act="faAll">All</button>':'')+'</span></div>'+
      '<div class="fa-list">'+ids.slice(0,60).map((id,i)=>'<button class="fa-tb '+(fc.tone[id]||'gold')+(i===cur?' on':'')+'" data-act="faGo" data-i="'+i+'">'+esc(W.T[id].name)+'</button>').join('')+'</div>';
    else if(fc)h+='<div class="fa-nav"><span class="fa-lab">'+esc(fc.label||'')+'</span></div>';
    const acts=(m.acts||[]).filter(x=>x.ic!=='floor').slice(0,3);if(acts.length)h+='<div class="ai-acts">'+acts.map(x=>'<button class="btn xs" data-act="runAct" data-a="'+x.id+'">'+I(x.ic,14)+esc(x.label)+'</button>').join('')+'</div>';
    el.innerHTML=h;const cl=$('.fa-list .on',el);if(cl)cl.scrollIntoView({inline:'center',block:'nearest'});Floor.paintLeg();Floor.dock();}
};
Object.assign(Floor,{
  spotlight(fc){const F=UI.floor;if(!fc){const had=!!F.spot;F.spot=null;F.sel=null;if(had)F.overlay=null;F.promo=null;this.paintTop();this.update(true);this.seats();this.fit();return;}
    F.spot={ids:new Set(fc.ids||[]),tone:fc.tone||{},zones:fc.zones||[],gates:fc.gates||[]};
    if(fc.ov!==undefined&&chipsFor(phase()).some(c=>c[0]===(fc.ov||'')))F.overlay=fc.ov||null;F.promo=fc.promo||null;F.zone=null;
    this.paintTop();this.update(true);requestAnimationFrame(()=>{this.frame();setTimeout(()=>this.seats(),420);});haptic(10);},
  frame(now_){const F=UI.floor,sp=F.spot;if(!sp||!this.host)return;if(F.ai>=0&&F.sel){const T=W.T[F.sel];if(T)return this.zoomBox(T.x-34,FY(T.z)-30,T.x+34,FY(T.z)+30,now_);}
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const add=(a,b,c,d)=>{x0=Math.min(x0,a);y0=Math.min(y0,b);x1=Math.max(x1,c);y1=Math.max(y1,d);};
    sp.ids.forEach(id=>{const T=W.T[id];if(T)add(T.x-14,FY(T.z)-10,T.x+14,FY(T.z)+10);});
    sp.zones.forEach(z=>{const a=GA_Z.find(g=>g[0]===z);if(a)add(a[1],FY(a[2]+a[4]),a[1]+a[3],FY(a[2]));});
    const GP={G1:[-150,-8],G2:[150,-8],G3:[0,-8],G4:[272,800]};sp.gates.forEach(g=>{const p=GP[g];if(p)add(p[0]-16,FY(p[1])-10,p[0]+16,FY(p[1])+10);});
    if(x0>x1){this.fit(now_);return;}this.zoomBox(x0,y0,x1,y1,now_);},
  zoomBox(x0,y0,x1,y1,now_){const s=this.size(),n=this.ins(),aw=s.w-n.l,ah=s.h-n.b,pad=30,L=this.lim(),k=clamp(Math.min(aw/(x1-x0+pad*2),ah/(y1-y0+pad*2)),L.min,Math.min(L.max,this.fitK*3.6));
    this.atFit=false;this.v={k,tx:n.l+aw/2-(x0+x1)/2*k,ty:ah/2-(y0+y1)/2*k};this.apply(now_);}
});
ON.faAsk=()=>{const F=UI.floor;F.ask=!F.ask;Floor.paintTop();if(F.ask){const i=$('#faQ',Floor.host);if(i)i.focus();}};
ON.faSend=()=>{const i=Floor.host&&$('#faQ',Floor.host),q=i&&i.value;if(!q||!q.trim())return;i.blur();FA.ask(q);};
ON.faSug=el=>FA.ask(el.dataset.q);
ON.faClear=()=>{const F=UI.floor;F.ans=null;F.ai=-1;F.overlay=null;FA.paint();Floor.spotlight(null);};
ON.faGo=el=>{const F=UI.floor,fc=F.ans&&F.ans.m&&F.ans.m.focus;if(!fc)return;const i=+el.dataset.i;F.ai=i;F.sel=fc.ids[i];Floor.update(true);Floor.frame();FA.paint();haptic(8);};
ON.faStep=el=>{const F=UI.floor,fc=F.ans&&F.ans.m&&F.ans.m.focus;if(!fc||!fc.ids.length)return;const n=fc.ids.length;F.ai=((F.ai==null||F.ai<0)?(+el.dataset.d>0?-1:0):F.ai)+(+el.dataset.d);F.ai=(F.ai+n)%n;F.sel=fc.ids[F.ai];Floor.update(true);Floor.frame();FA.paint();haptic(8);};
ON.faAll=()=>{const F=UI.floor;F.ai=-1;F.sel=null;Floor.update(true);Floor.frame();FA.paint();};
