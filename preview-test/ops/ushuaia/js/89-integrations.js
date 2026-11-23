'use strict';
/* ============================================================
   89 · INTEGRATIONS AND DATA COVERAGE
   Every number in the app traces back to a feed. This section
   shows those feeds working live, lets a manager switch any of
   them off to see exactly what goes dark across the product,
   and shows what the integrations not yet connected would add.
   ============================================================ */
const INTEG=[
  {id:'book',n:'BUBL Reservations',sub:'Tables, requests, holds, seat claims, waitlist, promoter and partner links',ic:'floor',conn:1,core:1,how:['Built into BUBL. Nothing to connect.']},
  {id:'tix',n:'BUBL Ticketing',sub:'Tickets, presale windows, door tickets bought on a phone',ic:'scan',conn:1,core:1,how:['Built into BUBL. Nothing to connect.']},
  {id:'staff',n:'BUBL OPS sign-in',sub:'Door staff, hosts and runners sign in on their phone',ic:'user',conn:1,core:1,how:['Built into BUBL. Each person signs in at the start of their shift.']},
  {id:'scan',n:'BUBL Scan',sub:'Ticket and seat QR codes at Gates 1 to 4, on staff phones',ic:'gate',conn:1,how:['Staff phones running BUBL OPS at each gate','The ticket list is downloaded to every phone, so scanning keeps working offline']},
  {id:'pay',n:'Adyen',sub:'Deposits held on guest cards and charged once a table is secured, tickets, door tickets, refunds',ic:'card',conn:1,wait:1,how:['The venue’s own Adyen account, with an API key its finance team creates for BUBL','Adyen confirms every hold, charge and refund to BUBL within seconds']},
  {id:'pos',n:'POS',sub:'Open and closed checks, items and totals',ic:'glass',conn:1,wait:1,how:['Read-only access the venue grants BUBL in its POS','Each POS table mapped once to its BUBL table','Optional: servers key the seat number on bottle orders, for spend per guest']},
  {id:'kds',n:'Runner tasks',sub:'BUBL OPS · bottles and pre-orders from the POS, delivered by a tap',ic:'run',conn:1,wait:1,how:['Runners use BUBL OPS on their phones','Orders arrive from the POS feed, so nothing is typed twice']},
  {id:'wa',n:'WhatsApp Business',sub:'Guest chats, invitations, reminders and follow-ups from the venue’s number',ic:'msg',conn:1,wait:1,how:['The venue’s number on the WhatsApp Business Platform, verified by Meta','One approved template per kind of link: invitation, seat claim, deposit reminder, arrival, ticket, thank-you','Template messages are paid per message; replies inside 24 hours are free']},
  {id:'ig',n:'Instagram messaging',sub:'Replies to DMs sent to the venue account',ic:'star',conn:1,wait:1,how:['The venue’s Instagram professional account linked to its Meta Business portfolio','Messaging permission for BUBL approved by Meta']},
  {id:'mail',n:'Email inbox',sub:'reservations@ · guest emails threaded by booking',ic:'doc',conn:1,wait:1,how:['Forwarding from the reservations mailbox to BUBL','SPF and DKIM set so replies come from the venue’s domain']},
  {id:'hist',n:'Past season records',sub:'Guest and spend history imported from past events',ic:'cal',conn:1,wait:1,static:1,how:['A one-off export of past events’ guests, tickets and spend, matched to BUBL guests','Forecasts appear once three past events are in']},
  {id:'ai',n:'BUBL Intelligence',sub:'Manager answers, chat summaries and reply drafts · Claude',ic:'spark',conn:1,how:['Runs through the BUBL backend with a monthly spend cap. Nothing for the venue to set up.']}
];
const IG={};INTEG.forEach(x=>IG[x.id]=x);
const AREAS=[['money','Money'],['floor','Floor'],['door','Door'],['service','Service'],['guests','Guests'],['intel','Intelligence']];
/* data points. mods ending in ~ degrade (partial) instead of going dark */
const FEEDS=[
  {l:'Table bookings, holds and requests',a:'floor',req:['book'],mods:['sell','vipconf','holds','ring','waitlist','waitl','changes']},
  {l:'Ticket sales and presale windows',a:'money',req:['tix'],mods:['sell','windows','pace~']},
  {l:'Promoter attribution and commission',a:'money',req:['book','tix'],mods:['sources','promoters']},
  {l:'Partner bookings, through their own links',a:'money',req:['book'],mods:['sources~','promoters~'],note:'concierge and corporate'},
  {l:'Deposits on invitations',a:'money',req:['pay'],mods:['position','chase','forecast~','pace~','needs~'],ov:['unpaid']},
  {l:'Refunds and disputes',a:'money',req:['pay'],mods:['queue','refunds']},
  {l:'Table checks closed in the POS',a:'money',req:['pos'],mods:['balances','recon~','closeout~','position~']},
  {l:'Door tickets',a:'door',req:['tix'],mods:['position~']},
  {l:'On-site orders and spend',a:'money',req:['pos'],mods:['minspend','hourly','split','tablesmin','tiers','recon~','closeout~','position~','mysec~'],ov:['heat']},
  {l:'Spend per guest',a:'guests',req:['pos'],note:'only where servers key seat numbers'},
  {l:'Pre-order fulfilment',a:'service',req:['pos','kds'],ov:['prepend']},
  {l:'Service speed and runner times',a:'service',req:['kds'],mods:['svc','svcm','runs','lessons~'],ov:['speed']},
  {l:'Arrivals and admissions',a:'door',req:['scan'],mods:['arrivals','head','ring~','noshow','vipl','unseated','attend','closeout~','mysec~','needs~'],ov:['noshow','att']},
  {l:'Gate scan rates',a:'door',req:['scan'],mods:['gates','lessons~']},
  {l:'Ticket fraud alerts',a:'door',req:['scan'],mods:['fraud']},
  {l:'Team signed in',a:'service',req:['staff'],mods:['staff']},
  {l:'Invitations, reminders and follow-ups',a:'guests',req:['wa'],mods:['claims~','follow','chase~']},
  {l:'Guest chats on WhatsApp',a:'guests',req:['wa'],mods:['inbox~']},
  {l:'Guest DMs on Instagram',a:'guests',req:['ig'],mods:['inbox~']},
  {l:'Guest emails to reservations',a:'guests',req:['mail'],mods:['inbox~']},
  {l:'Chat summaries and reply drafts',a:'intel',req:['ai'],mods:[]},
  {l:'Guest history and tiers',a:'guests',req:['hist'],mods:['noshowp~','newknown~','tiers~']},
  {l:'No-show forecast',a:'intel',req:['book','hist'],mods:['noshowp']},
  {l:'Forecasts from past events',a:'intel',req:['hist'],mods:['forecast','tiers','season']},
  {l:'Manager answers and intelligence requests',a:'intel',req:['ai'],mods:['agent','intel']},
  {l:'Who comes with whom',a:'guests',req:['book'],mods:['coatt']}
];
if(!UI.integOff)UI.integOff={};
if(!UI.demoOn)UI.demoOn={};
/* awaiting connection: a feed the venue still has to connect. Its screens stay dark unless a manager previews them with demo data. */
const waiting=id=>!!(IG[id]&&IG[id].wait&&!UI.demoOn[id]);
const demoAny=()=>INTEG.some(x=>x.wait&&UI.demoOn[x.id]);
const isOn=id=>!!(IG[id]&&IG[id].conn&&!UI.integOff[id]&&!waiting(id));
const feedOn=f=>f.req.every(isOn);
const offNames=feeds=>[...new Set([].concat(...feeds.map(f=>f.req.filter(r=>!isOn(r)))))].map(r=>IG[r].n);
function gapFor(id){const full=[],part=[];if(!Object.keys(UI.integOff).some(k=>UI.integOff[k])&&!INTEG.some(x=>waiting(x.id)))return {full,part};
  FEEDS.forEach(f=>{if(f.lock||feedOn(f))return;(f.mods||[]).forEach(m=>{const p=m.endsWith('~');if((p?m.slice(0,-1):m)===id)(p?part:full).push(f);});});
  if(!full.length&&part.length&&!FEEDS.some(f=>!f.lock&&feedOn(f)&&(f.mods||[]).some(m=>m.replace('~','')===id)))return {full:part,part:[]};return {full,part};}
const ovOff=ov=>FEEDS.some(f=>!f.lock&&!feedOn(f)&&(f.ov||[]).includes(ov));
const offCount=()=>INTEG.filter(x=>x.conn&&UI.integOff[x.id]).length;
const waitCount=()=>INTEG.filter(x=>waiting(x.id)).length;
function coverage(){const live=FEEDS.filter(f=>!f.lock),on=live.filter(feedOn);return {on:on.length,tot:live.length,more:FEEDS.filter(f=>f.lock).length};}
function gapIds(g){return [...new Set([].concat(...(g.full.length?g.full:g.part).map(f=>f.req.filter(r=>!isOn(r)))))];}
function gapAllWait(g){const ids=gapIds(g);return ids.length&&ids.every(waiting);}
const andList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
function gapLine(g){const ids=gapIds(g),w=ids.filter(waiting).map(r=>IG[r].n),o=ids.filter(r=>!waiting(r)).map(r=>IG[r].n);return [w.length?'Awaiting connection: '+andList(w):'',o.length?andList(o)+' off':''].filter(Boolean).join(' · ');}
function gapTile(id,g){const m=M[id];let w2=false;try{w2=/class="tile w2/.test(m.tile(S()));}catch(e){}return '<button class="tile gap'+(gapAllWait(g)?' wait':'')+(w2?' w2':'')+'" data-act="integGap" data-id="'+id+'"><span class="tl">'+esc(m.t)+'</span><span class="tv">'+I('cloudoff',24)+'</span><span class="ts">'+(gapAllWait(g)?'':'No data. ')+esc(gapLine(g))+'.</span></button>';}
function gapCard(id,g,panel){const m=M[id],aw=gapAllWait(g);return '<div class="'+(panel?'':'hud ')+'gapc'+(aw?' wait':'')+'"><div class="gapc-h">'+I('cloudoff',18)+'<b>'+esc(m.t)+'</b></div><p>'+(aw?esc(gapLine(g))+'. '+esc(g.full.map(f=>f.l).join(', '))+' show here once it is connected.':esc(g.full.map(f=>f.l).join(', '))+' not coming in. '+esc(gapLine(g))+'.')+'</p><button class="btn xs" data-act="integGap" data-id="'+id+'">'+(aw?'What it unlocks':'What is missing')+'</button></div>';}
function gapBar(g){return gapAllWait(g)?'<div class="gapbar wait" data-act="integGap">'+I('cloudoff',14)+'<span>'+esc(gapLine(g))+' · '+esc(g.part.map(f=>f.l.toLowerCase()).join(', '))+' show here once connected</span></div>':'<div class="gapbar" data-act="integGap">'+I('cloudoff',14)+'<span>Partial: '+esc(g.part.map(f=>f.l.toLowerCase()).join(', '))+' missing · '+esc(gapLine(g))+'</span></div>';}
/* module rendering goes through here, so every screen reacts the same way */
function modHTML(id,s,mode){const m=M[id],g=gapFor(id);
  if(g.full.length)return m.hero||mode==='panel'?gapCard(id,g,mode==='panel'):gapTile(id,g);
  let h=mode==='panel'?panelHTML0(id,s):m.hero?m.hero(s):m.tile(s);
  if(g.part.length){if(m.hero||mode==='panel')h=gapBar(g)+h;else h=h.replace(/^<button class="tile/,'<button data-gap="'+esc(gapLine(g))+'" class="tile');}
  return h;}

/* ---------- the live event stream, built from the same records the screens read ---------- */
const KN=['Early entry','Second wave','VIP standing','Door ticket','Guest list','Promoter list'];
function integIndex(){const k=W.ev.id+':'+W.rev;if(W._ix&&W._ixK===k)return W._ix;const by={};const add=(at,src,txt,tone)=>{if(!at)return;(by[src]=by[src]||[]).push({at,src,txt,tone});};
  W.bookings.forEach(b=>{const T=W.T[b.table],tn=T?T.name:'';
    add(b.reqAt||b.at,'book',(b.reqAt?'Backstage request':'Booking')+' · '+tn+' · party of '+b.party);
    if(b.depAt)add(b.depAt,'pay','Deposit paid · '+tn+' · AED '+n0(Math.round(b.min*b.depPct)));
    if(b.payAt)add(b.payAt,'pos','Check closed · '+tn);
    b.pre.forEach(p=>add(p.at,'book','Pre-order · '+p.nm+' · '+tn));
    b.seats.forEach(x=>{if(x.cl&&x.n>1)add(x.cl,'book','Seat claimed on the invitation · '+tn);if(x.ar)add(x.ar,'scan',(x.gate||'G3')+' · table guest in · '+tn);});
    b.orders.forEach(o=>{if(!o.pre)add(o.at,'pos',o.nm+' · '+tn+' · AED '+n0(o.amt));if(o.del)add(o.del,'kds','Delivered '+o.nm+' to '+tn+' in '+Math.max(1,Math.round((o.del-o.at)/MIN))+' min',o.del-o.at>15*MIN?'warn':null);});});
  W.tix.forEach(x=>{const sr=SRC[x.s];add(x.at,'tix','Ticket · '+KN[x.k]+(sr?' · '+sr.label:''));if(x.k===3&&x.pr)add(x.at,'pay','Door ticket paid · '+(x.gt||'G1')+' · AED '+n0(x.pr));if(x.sc)add(x.sc,'scan',(x.gt||'G1')+' · '+KN[x.k]+' in');});
  W.staff.forEach(x=>{if(x.inAt&&STAFF_BUBL.includes(x.role))add(x.inAt,'staff','Signed in to BUBL OPS · '+x.role);});
  W.svc.forEach(r=>{const T=W.T[r.b.table];add(r.at,'kds','Table request · '+r.kind+' · '+(T?T.name:''));});
  W.alerts.forEach(a=>add(a.at,'scan','Ticket alert · '+(a.kind||'duplicate code'),'bad'));
  Object.values(by).forEach(a=>a.sort((x,y)=>x.at-y.at));W._ix=by;W._ixK=k;return by;}
function upto(a,t){let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m].at<=t)lo=m+1;else hi=m;}return lo;}
function opsEvents(t){return W.ops.filter(o=>o.at<=t&&!/^Integration/.test(o.action)).slice(0,30).map(o=>({at:o.at,src:/agent|Intelligence/i.test(o.action)?'ai':/remind|nudge|Follow|invite|offer/i.test(o.action)?'wa':'book',txt:o.action+(o.detail?' · '+o.detail:'')}));}
function integStats(id,t,ph){const a=(integIndex()[id]||[]),n=upto(a,t),last=n?a[n-1]:null,win=ph==='pre'?DAY:10*MIN;let c=0;for(let i=n-1;i>=0&&a[i].at>t-win;i--)c++;
  const B=ph==='pre'?14:24,step=ph==='pre'?DAY:5*MIN,end=ph==='post'?W.C:t,buckets=new Array(B).fill(0);for(let i=upto(a,end)-1;i>=0;i--){const k=Math.floor((end-a[i].at)/step);if(k>=B)break;buckets[B-1-k]++;}
  return {last,rate:ph==='pre'?c:c/10,unit:ph==='pre'?'today':'a min',buckets,total:n};}
function spark(b,cls){const mx=Math.max(1,...b);return '<svg class="isp '+(cls||'')+'" viewBox="0 0 '+(b.length*5)+' 22" preserveAspectRatio="none">'+b.map((v,i)=>'<rect x="'+(i*5+.6)+'" y="'+(22-Math.max(1,v/mx*21)).toFixed(1)+'" width="3.8" height="'+Math.max(1,v/mx*21).toFixed(1)+'" rx="1"/>').join('')+'</svg>';}
function agoS(ms){const s=Math.round(ms/1000);return s<60?s+'s ago':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+'h ago':Math.round(s/86400)+'d ago';}

/* ---------- previews: what each missing integration would show, from tonight's data ---------- */
function preview(id){const s=S(),t=s.t,ph=s.ph;
  if(id==='cctv'){const z=densityZones(ph==='pre'?snapshot(W,W.D+150*MIN,true):s);return '<div class="kv">'+z.map(x=>{const mz=Math.round(x.n*(.93+(h32(x.id+W.ev.id)%14)/100));return '<span>'+ZONES[x.id].l+'</span><b class="n">'+n0(mz)+' measured · '+n0(x.n)+' est.</b>';}).join('')+'</div>'+
    '<p class="note">Today density is estimated from scans in and out. Sensors measure it per zone, and show queue length per gate lane.</p>';}
  if(id==='wx'){const d=new Date(W.D),m=d.getMonth(),tC=[27,31,34,36,35,33,29,26,23,21,22,24][m]-3,hum=55+(h32(W.ev.id)%25),wind=8+(h32(W.ev.id+'w')%18);
    return '<div class="kv"><span>Doors, '+fT(W.D)+'</span><b class="n">'+tC+'°C · humidity '+hum+'% · wind '+wind+' km/h</b><span>At close</span><b class="n">'+(tC-4)+'°C</b><span>No-show adjustment</span><b>'+(wind>22?'+1.5% for wind':'None, clear night')+'</b></div><p class="note">Feeds the no-show forecast and the readiness checklist for an open-air venue.</p>';}
  if(id==='ride'){const v=W.bookings.filter(b=>bActive(b,t)&&b.vip&&b.seats[0].ar>t).sort((a,b)=>a.seats[0].ar-b.seats[0].ar).slice(0,5);
    return v.length?'<div class="rows">'+v.map(b=>row('run','neu',esc(gName(b.booker))+' · '+esc(W.T[b.table].name),'Party of '+N(b.party),'<b class="n">ETA '+Math.max(1,Math.round((b.seats[0].ar-t)/MIN))+' min</b>')).join('')+'</div><p class="note">Hosts see who is minutes away and hold their table instead of releasing it.</p>'
      :'<p class="note">From doors, VIP parties sharing their ride show an ETA here, so hosts hold the table instead of releasing it. At close it forecasts pick-up demand by lane.</p>';}
  if(id==='acct'){const c=s.cost;return '<div class="kv">'+[['Artist and production',c.fixed*.62],['Staff',c.fixed*.18],['Security and medical',c.fixed*.11],['Venue and licences',c.fixed*.09]].map(r=>{const v=(h32(r[0]+W.ev.id)%13-6)/100;return '<span>'+r[0]+'</span><b class="n">'+aedK(r[1]*(1+v))+' <em class="'+(v>0?'warn':'ok')+'">'+(v>0?'+':'')+Math.round(v*100)+'% vs model</em></b>';}).join('')+'</div><p class="note">Replaces the cost model with booked costs, so profit is the real number after the event.</p>';}
  if(id==='ads'){const d=s.src.direct,base=Math.max(40,d.n);return '<div class="kv">'+[['Instagram, presale teaser',.38,18000],['Meta, lookalike Season 2',.27,14000],['Google, brand search',.12,6000]].map(r=>'<span>'+r[0]+'</span><b class="n">'+n0(Math.round(base*r[1]))+' bookings · AED '+Math.round(r[2]/Math.max(1,base*r[1]))+' each</b>').join('')+'</div><p class="note">Cost per booking by campaign, next to promoter commission in Sources.</p>';}
  if(id==='nps'){return '<div class="kv">'+SEC_ORDER.slice(0,6).map(k=>{const x=s.sec[k],sc=7.4+(h32(k+W.ev.id)%22)/10;return '<span>'+esc(SECTIONS[k].label)+' · '+esc(SECTIONS[k].host)+'</span><b class="n">'+sc.toFixed(1)+' / 10</b>';}).join('')+'</div><p class="note">Scores by section and host, and an alert when a guest leaves a low review.</p>';}
  return '';}

/* ---------- the section ---------- */
const Integ={host:null,
  visible(){return this.host&&this.host.isConnected;},
  card(x,t,ph){const on=isOn(x.id),st=x.conn?integStats(x.id,t,ph):null,feeds=FEEDS.filter(f=>f.req.includes(x.id)),mods=new Set();feeds.forEach(f=>(f.mods||[]).forEach(m=>mods.add(m.replace('~',''))));
    const wt=waiting(x.id),dm=x.wait&&!wt,state=(!x.conn||wt)?'add':!on?'off':x.sandbox?'sb':'on',lab={add:wt?'Awaiting connection':'Not connected',off:'Off',sb:'Sandbox',on:'Live'}[state];
    const live=st&&st.last?(t-st.last.at<(ph==='pre'?DAY:3*MIN)):false;
    return '<div class="ig-card '+state+(live&&on?' pulse':'')+'" data-ig="'+x.id+'"><div class="ig-h"><span class="ig-ic">'+I(x.ic,18)+'</span><div class="ig-t"><b>'+esc(x.n)+'</b><span>'+esc(x.sub)+'</span></div>'+
      (x.core?'<span class="ig-st on"><i></i>Core</span>':dm?'<span class="ig-st sb"><i></i>Demo data</span>':(x.conn&&!wt)?'<button class="ig-sw '+(on?'on':'')+'" data-act="integSw" data-id="'+x.id+'" aria-label="'+(on?'Switch off':'Switch on')+' '+esc(x.n)+'" role="switch" aria-checked="'+on+'"><i></i></button>':'<span class="ig-st add">'+lab+'</span>')+'</div>'+
      ((x.conn&&!wt)?'<div class="ig-m"><div><b class="n" data-k="rate">'+(on?(st.unit==='today'?n0(st.rate):st.rate.toFixed(st.rate<10?1:0)):'—')+'</b><span>'+(st.unit==='today'?'events today':'events a min')+'</span></div><div><b class="n" data-k="last">'+(on&&st.last?agoS(t-st.last.at):x.static?'imported':'—')+'</b><span>last event</span></div><div class="ig-sp" data-k="sp">'+(on?spark(st.buckets):spark(st.buckets,'off'))+'</div></div>'+
        (on&&st.last?'<div class="ig-last" data-k="ev"><span class="n">'+fT(st.last.at)+'</span>'+esc(st.last.txt)+'</div>':!on?'<div class="ig-last off">'+I('cloudoff',13)+'Switched off. '+N(feeds.length)+' '+pl(feeds.length,'feed')+' and '+N(mods.size)+' '+pl(mods.size,'screen')+' affected.</div>':'')
      :'<div class="ig-last add">Unlocks: '+esc(feeds.map(f=>f.l.toLowerCase()).join(', '))+'</div>')+
      '<button class="ig-more" data-act="integOpen" data-id="'+x.id+'">'+(wt?'What it unlocks':x.conn?'What it feeds':'Preview')+I('right',14)+'</button></div>';},
  matrix(){const rows=INTEG.filter(x=>!x.core);return '<div class="mx"><div class="mx-r mx-hd"><span></span>'+AREAS.map(a=>'<b>'+(a[0]==='intel'?'AI':a[1])+'</b>').join('')+'</div>'+rows.map(x=>{const st=(!x.conn||waiting(x.id))?'add':isOn(x.id)?'on':'off';
    return '<button class="mx-r" data-act="integOpen" data-id="'+x.id+'"><span class="mx-n">'+esc(x.n)+'</span>'+AREAS.map(a=>{const c=FEEDS.filter(f=>f.a===a[0]&&f.req.includes(x.id)).length;return '<i class="mx-c '+(c?st:'')+'">'+(c?c:'')+'</i>';}).join('')+'</button>';}).join('')+
    '<div class="mx-leg"><span><i class="mx-c on">1</i>Live</span><span><i class="mx-c off">1</i>Off, data missing</span><span><i class="mx-c add">1</i>Awaiting connection</span></div></div>';},
  missing(){const off=FEEDS.filter(f=>!f.lock&&!feedOn(f));if(!off.length)return '<p class="note">Nothing is missing. Switch any feed off above to see what goes dark across the app.</p>';
    return '<div class="rows">'+off.map(f=>{const ms=(f.mods||[]).map(m=>M[m.replace('~','')]).filter(Boolean).map(m=>m.t);return row('cloudoff','bad',esc(f.l),esc(gapLine({full:[f],part:[]}))+(ms.length?' · '+esc(ms.slice(0,4).join(', '))+(ms.length>4?' +'+(ms.length-4):''):'')+((f.ov||[]).length?' · floor layer':''));}).join('')+'</div>';},
  stream(t){const ix=integIndex(),all=[];Object.keys(ix).forEach(k=>{if(!isOn(k))return;const a=ix[k],n=upto(a,t);for(let i=n-1;i>=Math.max(0,n-14);i--)all.push(a[i]);});opsEvents(t).forEach(e=>{if(isOn(e.src))all.push(e);});
    all.sort((a,b)=>b.at-a.at);return all.slice(0,14).map(e=>'<div class="ist '+(e.tone||'')+'"><span class="n">'+fT(e.at)+'</span><b class="ist-s">'+esc(IG[e.src]?IG[e.src].n:e.src)+'</b><span class="ist-t">'+esc(e.txt)+'</span></div>').join('')||'<p class="note">No events yet at this point in time.</p>';},
  html(atlas){const t=now(),ph=phase(),cv=coverage(),conn=INTEG.filter(x=>x.conn&&!x.wait),wt=INTEG.filter(x=>x.wait),avail=INTEG.filter(x=>!x.conn),pctv=cv.on/cv.tot;
    const hero='<div class="hud hero ig-hero"><div class="ig-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" class="rg-b"/><circle cx="60" cy="60" r="50" class="rg-f" style="stroke-dasharray:'+(pctv*314).toFixed(1)+' 314"/></svg><div><b class="n">'+Math.round(pctv*100)+'%</b><span>coverage</span></div></div>'+
      '<div class="ig-hx"><span class="lbl">Data feeds</span><div class="big n">'+cv.on+'<small>of '+cv.tot+' live</small></div><p class="note" style="margin:0">'+(cv.on<cv.tot?N(cv.tot-cv.on)+' '+pl(cv.tot-cv.on,'feed')+' dark: '+[waitCount()?N(waitCount())+' '+pl(waitCount(),'integration')+' awaiting connection':'',offCount()?N(offCount())+' switched off':''].filter(Boolean).join(', ')+'.':'Every connected feed is live.')+(avail.length?' '+N(cv.more)+' more with '+N(avail.length)+' integrations you can add.':'')+'</p>'+
      (offCount()?'<button class="btn xs" style="align-self:flex-start" data-act="integAllOn">'+I('undo',14)+'Switch everything back on</button>':'')+'</div></div>';
    const G={conn:'<div class="grp"><div class="lbl">Connected · switch one off to see what goes dark</div><div class="ig-grid ig-c3" data-ip="conn">'+conn.map(x=>this.card(x,t,ph)).join('')+'</div></div>'+(wt.length?'<div class="grp"><div class="lbl">Awaiting connection · the venue connects these</div><div class="ig-grid ig-c3">'+wt.map(x=>this.card(x,t,ph)).join('')+'</div></div>':''),
      miss:'<div class="grp"><div class="lbl">Missing right now</div><div data-ip="miss">'+this.missing()+'</div></div>',
      mx:'<div class="grp"><div class="lbl">What feeds what</div><div class="hud" style="padding:12px 12px 10px">'+this.matrix()+'</div></div>',
      add:avail.length?'<div class="grp"><div class="lbl">Available to add · what each one would show</div><div class="ig-grid ig-c3">'+avail.map(x=>this.card(x,t,ph)).join('')+'</div></div>':''};
    return atlas?'<div class="agrid ig-page"><div class="atitle"><div><h2>Integrations</h2><p>Every number in BUBL comes from one of these feeds, live.</p></div></div><section class="c12">'+hero+'</section>'+
      '<section class="c12 ig-col">'+G.conn+'</section><section class="c5 ig-col">'+G.miss+'</section><section class="c7 ig-col">'+G.mx+'</section>'+(G.add?'<section class="c12 ig-col">'+G.add+'</section>':'')+'</div>'
      :hero+G.conn+G.miss+G.mx+G.add;},
  render(v){v.innerHTML=this.html(true);this.host=v;},
  update(){const h=this.host;if(!this.visible())return;const t=now(),ph=phase();
    $$('.ig-card[data-ig]',h).forEach(c=>{const x=IG[c.dataset.ig];if(!x.conn||!isOn(x.id)||!$('[data-k="rate"]',c))return;const st=integStats(x.id,t,ph),r=$('[data-k="rate"]',c),l=$('[data-k="last"]',c),sp=$('[data-k="sp"]',c),ev=$('[data-k="ev"]',c);
      if(r)r.textContent=st.unit==='today'?n0(st.rate):st.rate.toFixed(st.rate<10?1:0);if(l&&st.last)l.textContent=agoS(t-st.last.at);if(sp){const z=spark(st.buckets);if(sp._h!==z){sp.innerHTML=z;sp._h=z;}}
      if(ev&&st.last){const z='<span class="n">'+fT(st.last.at)+'</span>'+esc(st.last.txt);if(ev._h!==z){ev.innerHTML=z;ev._h=z;c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');}}});},
  repaint(){if(!this.visible())return;if(UI.device==='atlas'&&UI.atlas==='data')this.render(this.host);else{const o=Sheet.stack.find(x=>x.integ);if(o){const b=o.el.querySelector('.sh-body'),st=b.scrollTop;b.innerHTML=this.html(false);o._b=null;b.scrollTop=st;}}}
};
function openIntegSheet(){Sheet.open({integ:true,tall:true,static:true,title:'Integrations',sub:'Every number in BUBL comes from one of these feeds',body:()=>Integ.html(false),onOpen:el=>{Integ.host=el;}});}
function openInteg(id){const x=IG[id];if(!x)return;const feeds=FEEDS.filter(f=>f.req.includes(id)),on=isOn(id);
  Sheet.open({tall:true,title:x.n,sub:x.sub,body:()=>{const mods=[...new Set([].concat(...feeds.map(f=>(f.mods||[]).map(m=>m.replace('~','')))))].map(m=>M[m]).filter(Boolean);
    const ovs=[...new Set([].concat(...feeds.map(f=>f.ov||[])))];
    let h='<div style="display:flex;gap:6px;flex-wrap:wrap">'+(x.core?tag('ok','check','Core, always on'):waiting(id)?tag('mut','cloudoff','Awaiting connection'):x.wait?tag('neu',null,'Showing demo data'):!x.conn?tag('mut',null,'Not connected'):isOn(id)?tag('ok','check',x.sandbox?'Live in sandbox':'Live'):tag('bad','cloudoff','Switched off'))+'</div>';
    h+='<div class="grp"><div class="lbl">'+(x.conn?'What it feeds':'What it would add')+'</div><div class="rows">'+feeds.map(f=>row(f.lock?'plus':feedOn(f)?'check':'cloudoff',f.lock?'neu':feedOn(f)?'ok':'bad',esc(f.l),esc(AREAS.find(a=>a[0]===f.a)[1])+(f.note?' · '+esc(f.note):'')+(f.req.length>1?' · also needs '+esc(f.req.filter(r=>r!==id).map(r=>IG[r].n).join(', ')):''))).join('')+'</div></div>';
    if(mods.length)h+='<div class="grp"><div class="lbl">Screens that '+(isOn(id)?'go dark if it is off':'are dark now')+'</div><div class="chips" style="flex-wrap:wrap">'+mods.map(m=>'<span class="chip">'+esc(m.t)+'</span>').join('')+(ovs.length?ovs.map(o=>'<span class="chip">Floor layer · '+esc({unpaid:'Unpaid',heat:'Heat map',prepend:'Pre-orders pending',speed:'Service speed',noshow:'No-show',att:'Attended',dens:'Density',promo:'Promoters'}[o]||o)+'</span>').join(''):'')+'</div></div>';
    if(!x.conn)h+='<div class="grp"><div class="lbl">Preview with this event’s data</div><div class="hud" style="padding:14px">'+preview(id)+'</div></div>';
    h+='<div class="grp"><div class="lbl">What it takes</div><div class="rows">'+x.how.map((s_,i)=>row(String(i+1),'',esc(s_),'')).join('')+'</div></div>';
    return h;},
    foot:()=>x.core?'':x.wait?'<button class="btn full" data-act="integDemo" data-id="'+id+'">'+(UI.demoOn[id]?I('undo',18)+'Stop the demo preview':I('play',18)+'Preview with demo data')+'</button>':x.conn?'<button class="btn full '+(isOn(id)?'':'pri')+'" data-act="integSw" data-id="'+id+'">'+(isOn(id)?I('cloudoff',18)+'Switch off to see what goes dark':I('check',18)+'Switch back on')+'</button>':'<button class="btn pri full" data-act="integReq" data-id="'+id+'">'+I('plus',18)+'Request this integration</button>'});}
ON.integ=()=>{if(UI.device==='atlas'){Sheet.close(true);UI.atlas='data';Atlas.render();}else openIntegSheet();};
ON.integOpen=el=>openInteg(el.dataset.id);
ON.integGap=el=>{const id=el&&el.dataset&&el.dataset.id;if(id){const g=gapFor(id),offs=[...new Set([].concat(...g.full.concat(g.part).map(f=>f.req.filter(r=>!isOn(r)))))];if(offs.length===1){openInteg(offs[0]);return;}}ON.integ();};
ON.integSw=el=>{const id=el.dataset.id,x=IG[id];if(!x||x.core||!x.conn)return;UI.integOff[id]=!UI.integOff[id];const off=UI.integOff[id],lost=FEEDS.filter(f=>!f.lock&&f.req.includes(id));
  log(off?'Integration switched off (simulation)':'Integration switched back on',x.n);haptic(12);_snap=null;
  toast(off?esc(x.n)+' off. '+N(lost.length)+' '+pl(lost.length,'feed')+' dark across the app.':esc(x.n)+' back on.');
  if(Sheet.top()&&!Sheet.top().integ)Sheet.close(true);if(UI.device==='atlas'&&UI.atlas==='data'){Integ.render(Integ.host);}else{Integ.repaint();}if(UI.device!=='atlas')renderTop();refresh(true);if(UI.device==='atlas'&&UI.atlas!=='data')Atlas.render();};
ON.integDemo=el=>{const id=el.dataset.id,x=IG[id];if(!x||!x.wait)return;UI.demoOn[id]=!UI.demoOn[id];const on=UI.demoOn[id];
  log(on?'Demo preview on':'Demo preview off',x.n);haptic(12);_snap=null;document.body.classList.toggle('demo-data',demoAny());
  toast(on?esc(x.n)+' screens show DEMO data until you stop the preview.':esc(x.n)+' back to awaiting connection.');
  if(Sheet.top()&&!Sheet.top().integ)Sheet.close(true);if(UI.device==='atlas'&&UI.atlas==='data'){Integ.render(Integ.host);}else{Integ.repaint();}if(UI.device!=='atlas')renderTop();refresh(true);if(UI.device==='atlas'&&UI.atlas!=='data')Atlas.render();};
ON.integAllOn=()=>{UI.integOff={};_snap=null;log('Integrations','All switched back on');toast('Every integration is back on.');if(UI.device==='atlas'&&UI.atlas==='data')Integ.render(Integ.host);else Integ.repaint();if(UI.device!=='atlas')renderTop();refresh(true);};
ON.integReq=el=>{const x=IG[el.dataset.id];log('Integration requested',x.n);toast('Request logged. BUBL will send '+esc(x.n)+' setup steps to the venue.');Sheet.close();};
M.data={t:'Integrations',go:()=>ON.integ(),tile:s=>{const cv=coverage(),off=offCount(),st=integStats('pos',s.t,s.ph),sc=integStats('scan',s.t,s.ph);
  return '<button class="tile w2 gx f-sky ig-tile" data-act="integ"><span class="gx-top"><span class="gx-ic">'+I('net',17)+'</span><span class="gx-src '+(off?'bad':'')+'">'+(off?'<i></i>'+off+' SWITCHED OFF':waitCount()?waitCount()+' AWAITING CONNECTION':'ALL CONNECTED')+'</span></span><span class="tl">Integrations</span><span class="tv">'+cv.on+'<small>of '+cv.tot+' feeds live</small></span><span class="ts">'+(off?N(off)+' switched off · '+N(cv.tot-cv.on)+' feeds dark':waitCount()?'Waiting on: '+andList(INTEG.filter(x=>waiting(x.id)).map(x=>x.n)):s.ph==='pre'?'Adyen, tickets, WhatsApp, Instagram and email':'POS '+N(st.rate.toFixed(0))+'/min · Access '+N(sc.rate.toFixed(0))+'/min')+'</span><span class="tviz">'+spark(s.ph==='pre'?integStats('pay',s.t,s.ph).buckets:sc.buckets)+'</span></button>';}};
