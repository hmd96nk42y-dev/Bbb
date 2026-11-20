'use strict';
/* ============================================================
   95 · HOME DATA UI
   Tiles speak the Sirene OPS language in Ushuaïa gold: an icon,
   the system the number comes from, a large figure and a real
   graphic. Estimates say they are estimates. Every Needs you row
   says how we know. The live hero adds the night so far.
   ============================================================ */
const TMETA={
  pace:{ic:'chart',f:'gold',s:'BUBL SALES',k:'own',over:1},sell:{ic:'pie',f:'gold',s:'BUBL TICKETS',k:'own',over:1},forecast:{ic:'spark',f:'gold',s:'FORECAST',k:'est'},
  sources:{ic:'pie',f:'gold',s:'BUBL · LINKS',k:'own'},windows:{ic:'cal',f:'cyan',s:'BUBL TICKETS',k:'own'},waitlist:{ic:'users',f:'silver',s:'BUBL',k:'own'},
  claims:{ic:'users',f:'silver',s:'SEAT CLAIMS',k:'own',over:1},noshowp:{ic:'clock',f:'cyan',s:'MODEL',k:'est'},ready:{ic:'check',f:'orange',s:'CHECKLIST',k:'man',over:1},
  head:{ic:'users',f:'cyan',s:'GATE SCANS',k:'live',over:1},gates:{ic:'gate',f:'cyan',s:'GATE SCANS',k:'live'},split:{ic:'cash',f:'gold',s:'POS · ADYEN',k:'live'},
  noshow:{ic:'clock',f:'cyan',s:'GATE SCANS',k:'live'},vipl:{ic:'star',f:'silver',s:'GATE SCANS',k:'live',over:1},fraud:{ic:'shield',f:'orange',s:'BUBL SCAN',k:'live'},
  staff:{ic:'user',f:'orange',s:'BUBL SIGN-INS',k:'own'},minspend:{ic:'glass',f:'gold',s:'POS',k:'live'},hourly:{ic:'chart',f:'gold',s:'POS',k:'live',over:1},
  incidents:{ic:'flag',f:'orange',s:'STAFF LOG',k:'man'},waitl:{ic:'users',f:'silver',s:'BUBL',k:'own'},svc:{ic:'bell',f:'orange',s:'WHATSAPP · HOSTS',k:'man'},
  changes:{ic:'swap',f:'silver',s:'RESERVATIONS',k:'man'},holds:{ic:'lock',f:'gold',s:'BUBL',k:'own'},attend:{ic:'users',f:'cyan',s:'GATE SCANS',k:'live',over:1},
  recon:{ic:'chart',f:'gold',s:'POS · ADYEN',k:'live'},tablesmin:{ic:'glass',f:'gold',s:'POS',k:'live'},promoters:{ic:'pie',f:'gold',s:'PROMOTER LINKS',k:'own'},
  newknown:{ic:'user',f:'silver',s:'SEAT CLAIMS',k:'own'},tiers:{ic:'star',f:'silver',s:'MODEL',k:'est'},
  coatt:{ic:'net',f:'silver',s:'SEAT CLAIMS',k:'own'},queue:{ic:'card',f:'gold',s:'ADYEN',k:'live'},season:{ic:'cal',f:'gold',s:'PAST SEASONS',k:'own'},
  follow:{ic:'msg',f:'silver',s:'WHATSAPP',k:'live'},lessons:{ic:'gate',f:'cyan',s:'GATE SCANS',k:'live'},intel:{ic:'bulb',f:'sky',s:'CLAUDE',k:'ai'},
  inbox:{ic:'msg',f:'silver',s:'3 CHANNELS',k:'live'},unseated:{ic:'users',f:'orange',s:'SCANS · HOSTS',k:'live'},balances:{ic:'card',f:'gold',s:'POS',k:'live'}
};
const tvz=(id,s)=>{try{return TVIZ[id]?TVIZ[id](s||S()):'';}catch(e){return '';}};
function gxTile(id,lbl,val,sub,viz,o){o=o||{};const m=TMETA[id]||{},fam=m.f||'gold',gv=(m.over&&TVIZ[id])?(tvz(id)||viz||''):(viz||tvz(id));
  return '<button class="tile'+(o.w2?' w2':'')+' gx f-'+fam+(o.dot?' al-'+o.dot:'')+'" data-act="mod" data-id="'+id+'"><span class="gx-top"><span class="gx-ic">'+I(m.ic||'grid',17)+'</span>'+
    (m.s?'<span class="gx-src '+(m.k||'')+(o.dot?' '+o.dot:'')+'">'+(o.dot?'<i></i>':'')+m.s+'</span>':'')+'</span><span class="tl">'+lbl+'</span><span class="tv">'+val+'</span>'+(gv?'<span class="tviz">'+gv+'</span>':'')+(sub?'<span class="ts">'+sub+'</span>':'')+'</button>';}

/* ---------- small graphics, drawn in the tile's own colour ---------- */
const gW=150;
function gArea(vals,o){o=o||{};const h=o.h||44,n=vals.length;if(n<2)return '';const all=vals.concat(o.proj!=null?[o.proj]:[]),mx=Math.max(...all,o.cap||0)||1,x=i=>i*(gW/(Math.max(n,o.span||n)-1)),y=v=>h-2-(h-6)*v/mx;
  const p=vals.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(''),last=n-1;
  let g='<path d="'+p+'L'+x(last).toFixed(1)+' '+h+'L0 '+h+'Z" class="g-fill"/><path d="'+p+'" class="g-line"/>';
  if(o.proj!=null)g+='<path d="M'+x(last).toFixed(1)+' '+y(vals[last]).toFixed(1)+'L'+x((o.span||n)-1).toFixed(1)+' '+y(o.proj).toFixed(1)+'" class="g-dash"/>';
  if(o.cap)g+='<line x1="0" x2="'+gW+'" y1="'+y(o.cap).toFixed(1)+'" y2="'+y(o.cap).toFixed(1)+'" class="g-cap"/>';
  g+='<circle cx="'+x(last).toFixed(1)+'" cy="'+y(vals[last]).toFixed(1)+'" r="3" class="g-dot"/>';
  return '<svg class="gsv" viewBox="0 0 '+gW+' '+h+'" preserveAspectRatio="none" aria-hidden="true">'+g+'</svg>';}
function gBars(vals,o){o=o||{};const h=o.h||40,n=vals.length,mx=Math.max(...vals,1),bw=gW/n;
  return '<svg class="gsv" viewBox="0 0 '+gW+' '+h+'" preserveAspectRatio="none" aria-hidden="true">'+vals.map((v,i)=>{const bh=Math.max(2,v/mx*(h-2));return '<rect x="'+(i*bw+1).toFixed(1)+'" y="'+(h-bh).toFixed(1)+'" width="'+Math.max(1,bw-3).toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="2" class="'+(o.hi!=null?(i===o.hi?'g-fc':i>o.hi?'g-dim':'g-fc2'):'g-fc')+'"/>';}).join('')+'</svg>';}
function gRows(rows,o){o=o||{};const mx=o.max||Math.max(...rows.map(r=>r.v),1);
  return '<span class="grows">'+rows.map(r=>'<span class="grow"><em>'+esc(r.l)+'</em><i><b class="'+(r.c||'')+'" style="width:'+Math.max(2,Math.min(100,r.v/mx*100)).toFixed(1)+'%"></b></i><span class="n">'+r.t+'</span></span>').join('')+'</span>';}
function gSeg(parts){const tot=sum(parts,p=>p.v)||1;
  return '<span class="gseg">'+parts.map(p=>p.v?'<i class="'+p.c+'" style="flex:'+p.v+'"></i>':'').join('')+'</span><span class="gleg">'+parts.filter(p=>p.l).map(p=>'<span><i class="'+p.c+'"></i>'+esc(p.l)+' <b class="n">'+(p.t!=null?p.t:p.v)+'</b></span>').join('')+'</span>';}
function gDots(items){return '<span class="gdots">'+items.map(c=>'<i class="'+c+'"></i>').join('')+'</span>';}
function gAv(names,more){return '<span class="gav">'+names.map(n=>'<i>'+esc(initials(n))+'</i>').join('')+(more?'<em class="n">+'+more+'</em>':'')+'</span>';}
function gStrip(t0,t1,marks,nowT){const x=v=>clamp((v-t0)/(t1-t0),0,1)*100;
  return '<span class="gstrip"><i class="ln"></i>'+marks.map(m=>'<b class="'+(m.c||'')+'" style="left:'+x(m.at).toFixed(1)+'%"></b>').join('')+(nowT!=null&&nowT>t0&&nowT<t1?'<em style="left:'+x(nowT).toFixed(1)+'%"></em>':'')+'</span>';}

const TVIZ={
  pace:s=>{const d=s.days.today;return gArea(s.days.com.slice(Math.max(0,d-21),d+1));},
  forecast:s=>{const d=s.days.today,n=s.days.n,a=s.days.com.slice(0,d+1).filter((_,i)=>i%2===0||i===d);return gArea(a,{proj:s.fc.tix+s.fc.tables,span:Math.ceil(n/2)});},
  sell:s=>gRows(GA.map((x,i)=>({l:x.label.replace(/ ticket$/i,''),v:s.tk.sold[i]/Math.max(1,x.alloc),t:pct(s.tk.sold[i],x.alloc)})).slice(0,4),{max:1}),
  sources:s=>{const sl=srcSlices(s,'rev'),tot=sum(sl,x=>x.v)||1,cl=['g-fc','g-fc2','g-fc3','g-dim'];return gSeg(sl.slice(0,4).map((x,i)=>({v:x.v,c:cl.at(i),l:x.label,t:pct(x.v,tot)})));},
  windows:s=>{const l=windowsList(s),t=now();return gRows(l.slice(0,4).map(w=>({l:w.l.replace(/ presale$/i,''),v:w.st==='open'?1:w.st==='soon'?.25:.6,c:w.st==='open'?'':w.st==='soon'?'dim':'done',t:w.st==='open'?'open':w.st==='soon'?fDur(w.opens-t):'closed'})),{max:1});},
  waitlist:s=>{const t=now(),wl=W.waitlist.filter(w=>w.at<=t&&!w.offered);return wl.length?gAv(wl.slice(0,5).map(w=>gName(w.g)),Math.max(0,wl.length-5)):'';},
  waitl:s=>TVIZ.waitlist(s),
  claims:s=>gSeg([{v:s.tb.claimed,c:'g-fc',l:'Named',t:n0(s.tb.claimed)},{v:s.tb.seats-s.tb.claimed,c:'g-dim',l:'No name yet',t:n0(s.tb.seats-s.tb.claimed)}]),
  noshowp:s=>{const ns=PAST[3],ga=s.gaSold*ns.noShowGA,st=s.tb.seats*ns.noShowSeat,tot=s.gaSold+s.tb.seats;return gSeg([{v:tot-ga-st,c:'g-fc',l:'Will come',t:n0(tot-ga-st)},{v:ga+st,c:'g-warn',l:'Won’t',t:n0(ga+st)}]);},
  ready:s=>{const c=checkState(W,now());return gDots(c.map(x=>x.done?'on':x.late?'bad':x.soon?'warn':''));},
  head:s=>{const b=integStats('scan',s.t,'live').buckets;let c=0;const cum=b.map(v=>c+=v),base=Math.max(0,s.inAll-c);return gArea(cum.map(v=>v+base),{cap:VENUE.capacity*.95});},
  gates:s=>s.gates?gRows(s.gates.map(g=>({l:g.g.id,v:g.load,c:g.load>.9?'bad':g.load>.75?'warn':'',t:Math.round(g.rate)+'/'+g.g.cap})),{max:1}):'',
  noshow:s=>{const st=s.tb.st;return gSeg([{v:st.seated,c:'g-ok',l:'Seated',t:st.seated},{v:st.partial,c:'g-fc',l:'Partial',t:st.partial},{v:st.expected,c:'g-dim',l:'Due',t:st.expected},{v:st.noshow,c:'g-bad',l:'No-show',t:st.noshow}]);},
  vipl:s=>{const t=now(),v=W.bookings.filter(b=>bActive(b,t)&&b.vip);return gDots(v.slice(0,40).map(b=>b.seats[0].ar&&b.seats[0].ar<=t?'on':''));},
  fraud:s=>{const a=liveAlerts(now()),g=['G1','G2','G3','G4'];return gRows(g.map(id=>({l:id,v:a.filter(x=>x.gate===id).length,c:'bad',t:a.filter(x=>x.gate===id).length})));},
  staff:s=>s.staff?gRows(s.staff.slice().sort((a,b)=>a.in/a.sp.plan-b.in/b.sp.plan).slice(0,4).map(x=>({l:x.sp.role.split(' ')[0],v:x.in/x.sp.plan,c:x.in/x.sp.plan<.92?'warn':'',t:x.in+'/'+x.sp.plan})),{max:1}):'',
  hourly:s=>s.hourly?gBars(s.hourly.map((v,i)=>i<=s.hourNow?v:(s.plan.hourly[i]||0)),{hi:s.hourNow}):'',
  incidents:s=>{const t=now(),l=W.incidents.filter(x=>x.at<=t);return gStrip(W.D,W.C,l.map(x=>({at:x.at,c:x.type==='med'||x.type==='sec'?'bad':'warn'})),t);},
  svc:s=>{const l=openSvc(now()),k={};l.forEach(r=>k[r.kind]=(k[r.kind]||0)+1);const r=Object.keys(k).sort((a,b)=>k[b]-k[a]).slice(0,3);return r.length?gRows(r.map(x=>({l:x.split(' ')[0],v:k[x],t:k[x]}))):'';},
  attend:s=>{const p=postStats(W,s);return gSeg([{v:p.inAll,c:'g-fc',l:'Came',t:n0(p.inAll)},{v:Math.max(0,p.issued-p.inAll),c:'g-dim',l:'Didn’t',t:n0(Math.max(0,p.issued-p.inAll))}]);},
  recon:s=>{const p=postStats(W,s);return gRows([{l:'Actual',v:p.gross,t:kfmt(p.gross)},{l:'Forecast',v:p.fcGross,c:'dim',t:kfmt(p.fcGross)}]);},
  tablesmin:s=>{const p=postStats(W,s);return gSeg([{v:p.above.length,c:'g-ok',l:'Above',t:p.above.length},{v:p.below.length,c:'g-warn',l:'Below',t:p.below.length},{v:p.noshow.length,c:'g-bad',l:'No-show',t:p.noshow.length}]);},
  promoters:s=>{const p=postStats(W,s);return gRows(p.promo.slice().sort((a,b)=>b.comm-a.comm).slice(0,4).map(o=>({l:o.x.label.split(' ')[0],v:o.comm,t:kfmt(o.comm)})));},
  newknown:s=>{const p=postStats(W,s);return gSeg([{v:p.known,c:'g-fc2',l:'Known',t:n0(p.known)},{v:p.newG,c:'g-fc',l:'New',t:n0(p.newG)}]);},
  tiers:s=>{const p=postStats(W,s);return gRows([{l:'Up',v:p.up.length,c:'',t:p.up.length},{l:'Review',v:p.down.length,c:'warn',t:p.down.length},{l:'First',v:p.firstTable.length,c:'dim',t:p.firstTable.length}]);},
  coatt:s=>{const gph=W._co||(W._co=coGraph(W,s.t)),n=Math.min(9,gph.hubs.length+4),pts=Array.from({length:n},(_,i)=>{const a=i/n*6.283+(h32(W.ev.id)%7)/7,r=i%3?18:9;return [75+Math.cos(a)*r*2.4,22+Math.sin(a)*r];});
    return '<svg class="gsv" viewBox="0 0 150 44" aria-hidden="true">'+pts.map((p,i)=>'<line x1="75" y1="22" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" class="g-cap"/>').join('')+pts.map(p=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.2" class="g-fc2"/>').join('')+'<circle cx="75" cy="22" r="6" class="g-fc"/></svg>';},
  queue:s=>{const q=pendingQ(['refund','dispute']);return gSeg([{v:q.filter(x=>x.type==='refund').length,c:'g-fc',l:'Refunds',t:q.filter(x=>x.type==='refund').length},{v:q.filter(x=>x.type==='dispute').length,c:'g-bad',l:'Disputes',t:q.filter(x=>x.type==='dispute').length}]);},
  season:s=>{const p=postStats(W,s);return gBars(PAST.map(x=>x.gross).concat([p.gross]),{hi:PAST.length});},
  follow:s=>{const p=postStats(W,s),left=p.follow.filter(f=>!p.sent[f.id]).length;return gSeg([{v:p.follow.length-left,c:'g-fc',l:'Sent',t:p.follow.length-left},{v:left,c:'g-dim',l:'To send',t:left}]);},
  lessons:s=>{const p=postStats(W,s);return gRows(p.gates.map(g=>({l:g.g.id,v:g.top/g.g.cap,c:g.top>g.g.cap*.9?'warn':'',t:Math.round(g.top)+'/'+g.g.cap})),{max:1});},
  unseated:s=>{const u=unseatedTables(now());return gRows(u.slice(0,3).map(x=>({l:W.T[tableAt(x.b,now())].name.replace(/^(VIP|Backstage|Platinum|Gold|Silver) /,''),v:x.wait,c:x.wait>15*MIN?'bad':'warn',t:fDur(x.wait)})));}
};

/* ---------- the live hero: the night so far ---------- */
function nightHero(s){const f=s.fin,h=s.hourly||[],pl=(s.plan&&s.plan.hourly)||[],n=Math.max(h.length,pl.length,1),hn=s.hourNow==null?h.length-1:s.hourNow,t=s.t;
  let ca=0,cp=0;const act=h.slice(0,hn+1).map(v=>ca+=v),plan=pl.map(v=>cp+=v);const Wd=320,Hd=84,max=Math.max(cp,ca,1)*1.08,x=i=>Wd*(i+1)/n,y=v=>Hd-2-(Hd-6)*v/max;
  const pa='M0 '+y(0).toFixed(1)+act.map((v,i)=>'L'+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(''),pp='M0 '+y(0).toFixed(1)+plan.map((v,i)=>'L'+x(i).toFixed(1)+' '+y(v).toFixed(1)).join('');
  const area=act.length?pa+'L'+x(act.length-1).toFixed(1)+' '+Hd+'L0 '+Hd+'Z':'',lx=act.length?x(act.length-1)/Wd*100:0,ly=act.length?y(ca)/Hd*100:100;
  const mins=Math.max(1,(t-(W.D+hn*HOUR))/MIN),rate=(h[hn]||0)/mins,ph=s.inAll?ca/s.inAll:0,clear=f.collected-f.breakeven;
  const chart='<div class="nh-ch"><div class="nh-l"><span class="lbl">Spend tonight</span><span class="nh-v n">'+aedK(ca)+'</span><span class="nh-p">'+(cp?N(pct(ca,plan.at(hn)||1))+' of plan to this hour':'')+'</span></div>'+
    '<div class="nh-plot"><svg viewBox="0 0 '+Wd+' '+Hd+'" preserveAspectRatio="none" class="nh-sv" aria-hidden="true"><path d="'+pp+'" class="nh-plan"/>'+(area?'<path d="'+area+'" class="nh-area"/><path d="'+pa+'" class="nh-line"/>':'')+'</svg>'+(act.length?'<i class="nh-pt" style="left:'+lx.toFixed(2)+'%;top:'+ly.toFixed(2)+'%"></i>':'')+'</div>'+
    '<div class="nh-ax n"><span>'+fT(W.D)+'</span><span>'+fT(W.D+Math.round(n/2)*HOUR)+'</span><span>'+fT(W.C)+'</span></div>'+
    '<div class="nh-leg"><span><i class="a"></i>Actual · POS</span><span><i class="p"></i>Plan by hour</span></div></div>';
  const chips='<div class="kchips"><div><b class="n">'+n0(s.inAll||0)+'</b><span>Scanned in</span></div><div><b class="n">'+n0(rate)+'</b><span>AED / min</span></div><div><b class="n">'+n0(ph)+'</b><span>Per head</span></div><div class="'+(clear>=0?'ok':'')+'"><b class="n">'+(clear>=0?'+':'−')+kfmt(Math.abs(clear))+'</b><span>'+(clear>=0?'Clear':'To breakeven')+'</span></div></div>';
  return chart+chips;}
const NSRC={chase:'Stripe · deposit on the invitation link, not paid yet',vipconf:'BUBL Reservations · requests from the booking page',queue:'BUBL Tickets and Adyen · open requests',changes:'Logged by reservations from guest messages',
  holds:'BUBL Reservations · hold end dates',head:'Gate scans in tonight · exits are not counted',gates:'BUBL Scan · scans per gate, last 5 minutes',fraud:'BUBL Scan · checked against the ticket list on each phone',
  unseated:'Gate scan in, no host seating tap yet',svc:'Guest WhatsApp or the section host · not marked done',noshow:'No gate scan on the booking after the hold time',staff:'BUBL OPS sign-ins against the plan',
  balances:'POS · check still open near close',chaseL:'POS · check still open',inbox:'Guest’s message is the last one in the chat'};
