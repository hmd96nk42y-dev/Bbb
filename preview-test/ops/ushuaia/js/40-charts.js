'use strict';
/* ============================================================
   40 · charts
   Gold plus neutral greys. Green / amber / red appear only where
   the data itself is a state. Everything is inline SVG or CSS.
   ============================================================ */
const svgWrap=(w,h,inner,cls)=>'<svg class="ch '+(cls||'')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="img">'+inner+'</svg>';
const blendCurve=d=>.42*saleCurve((d-7)*75/68,'ga')+.58*saleCurve(d,'table');

/* the hero: deposits + tickets (+ on-site), committed hatched, breakeven, profit in gold */
function posBar(f,live){
  const max=Math.max(f.gross,f.breakeven)*1.07,w=v=>(Math.max(0,v)/max*100).toFixed(2)+'%',be=f.breakeven/max*100;
  const segs='<i class="dep" style="width:'+w(f.dep)+'"></i><i class="tix" style="width:'+w(f.tix)+'"></i>'+(live?'<i class="on" style="width:'+w(f.onsite)+'"></i>':'')+'<i class="com" style="width:'+w(f.committed)+'"></i>';
  return '<div class="pos"><div class="pos-bar"><div class="pos-l">'+segs+'</div><div class="pos-l au" style="clip-path:inset(0 0 0 '+be.toFixed(2)+'%)">'+segs+'</div>'+
    '<div class="pos-be '+(be>76?'r':be<24?'l':'')+'" style="left:'+be.toFixed(2)+'%"><b>Breakeven '+N(aedK(f.breakeven))+'</b></div></div>'+
    '<div class="pos-ax"><span class="n">0</span><span class="n">'+aedK(max/2)+'</span><span class="n">'+aedK(max)+'</span></div></div>';
}
function posLegend(f,live){const be=f.breakeven,solid=f.collected,profit=Math.max(0,solid-be);
  return '<div class="leg"><span><i class="sw-dep"></i>Deposits '+AK(f.dep)+'</span><span><i class="sw-tix"></i>Tickets '+AK(f.tix)+'</span>'+
    (live?'<span><i class="sw-on"></i>On-site '+AK(f.onsite)+'</span>':'')+'<span><i class="sw-com"></i>Committed, not collected '+AK(f.committed)+'</span>'+
    (profit>0?'<span><i class="sw-au"></i>Past breakeven '+AK(profit)+'</span>':'')+'</div>';}

/* cumulative by day with projection (dotted) to doors */
function cumChart(s,Wd){
  const Wp=340,Hp=170,L=34,Rr=8,T=12,B=22,n=s.days.n,today=s.days.today,f=s.fin;
  const depShare=s.tb.minSum?s.tb.dep/s.tb.minSum:.6,finalCol=s.days.cum[today]+(s.fc.tix-f.tix)+(s.fc.tables-s.tb.minSum)*depShare,finalCom=s.fc.tix+s.fc.tables;
  const max=Math.max(finalCom,f.breakeven,TARGET.presale)*1.08,x=d=>L+(Wp-L-Rr)*d/(n-1),y=v=>T+(Hp-T-B)*(1-v/max);
  const path=(arr,a,b)=>{let p='';for(let d=a;d<=b;d++)p+=(d===a?'M':'L')+x(d).toFixed(1)+' '+y(arr[d]).toFixed(1);return p;};
  const c0=blendCurve(today),proj=(from,to)=>{let p='M'+x(today).toFixed(1)+' '+y(from).toFixed(1);for(let d=today+1;d<n;d++){const k=(blendCurve(d)-c0)/Math.max(.001,1-c0);p+='L'+x(d).toFixed(1)+' '+y(from+(to-from)*k).toFixed(1);}return p;};
  let tgt='';for(let d=0;d<n;d++)tgt+=(d?'L':'M')+x(d).toFixed(1)+' '+y(TARGET.presale*blendCurve(d)).toFixed(1);
  let g='';[0,.25,.5,.75,1].forEach(k=>{const v=max*k;g+='<line x1="'+L+'" x2="'+(Wp-Rr)+'" y1="'+y(v)+'" y2="'+y(v)+'" class="s-line" stroke-width=".5"/><text x="'+(L-5)+'" y="'+(y(v)+3)+'" text-anchor="end" class="cn">'+kfmt(v)+'</text>';});
  [75,60,45,30,15,0].forEach(dd=>{const d=75-dd;g+='<text x="'+x(d)+'" y="'+(Hp-6)+'" text-anchor="middle" class="cn">'+(dd?'T-'+dd:'Doors')+'</text>';});
  const by=y(f.breakeven);
  g+='<line x1="'+L+'" x2="'+(Wp-Rr)+'" y1="'+by+'" y2="'+by+'" class="s-t1" stroke-width="1"/><text x="'+(L+4)+'" y="'+(by-4)+'" class="cb">Breakeven</text>';
  g+='<path d="'+tgt+'" class="f-none s-g3" stroke-width="1.2" stroke-dasharray="2 3"/>';
  g+='<path d="'+path(s.days.com,0,today)+'" class="f-none s-g2" stroke-width="1.4"/>';
  g+='<path d="'+path(s.days.cum,0,today)+'L'+x(today).toFixed(1)+' '+y(0)+'L'+x(0)+' '+y(0)+'Z" class="f-gold" opacity=".12"/>';
  g+='<path d="'+path(s.days.cum,0,today)+'" class="f-none s-gold" stroke-width="2.2" stroke-linejoin="round"/>';
  if(today<n-1){g+='<path d="'+proj(s.days.cum[today],finalCol)+'" class="f-none s-gold" stroke-width="2" stroke-dasharray="1.5 4" stroke-linecap="round"/>';
    g+='<path d="'+proj(s.days.com[today],finalCom)+'" class="f-none s-g2" stroke-width="1.4" stroke-dasharray="1.5 4" stroke-linecap="round"/>';
    g+='<line x1="'+x(today)+'" x2="'+x(today)+'" y1="'+T+'" y2="'+(Hp-B)+'" class="s-g3" stroke-width=".8"/><text x="'+x(today)+'" y="'+(T-3)+'" text-anchor="middle" class="ct">Today</text>';}
  g+='<circle cx="'+x(today)+'" cy="'+y(s.days.cum[today])+'" r="3.5" class="f-gold s-bg" stroke-width="1.5"/>';
  return svgWrap(Wp,Hp,g)+'<div class="leg"><span><i class="sw-au" style="height:3px"></i>Collected</span><span><i class="sw-g2" style="height:3px"></i>Collected + committed</span><span><i class="sw-dot"></i>Projected</span><span><i class="sw-g3" style="height:2px"></i>Target</span></div>';
}
/* sales pace: this event vs target vs last season, same days-out */
function paceChart(s){const Wp=340,Hp=150,L=34,Rr=8,T=10,B=22,n=s.days.n,today=s.days.today,prev=PAST[0].gross*.74;
  const final=s.fc.tix+s.fc.tables,max=Math.max(final,TARGET.presale,prev)*1.08,x=d=>L+(Wp-L-Rr)*d/(n-1),y=v=>T+(Hp-T-B)*(1-v/max);
  const line=(fn,a,b)=>{let p='';for(let d=a;d<=b;d++)p+=(d===a?'M':'L')+x(d).toFixed(1)+' '+y(fn(d)).toFixed(1);return p;};
  let g='';[0,.5,1].forEach(k=>{const v=max*k;g+='<line x1="'+L+'" x2="'+(Wp-Rr)+'" y1="'+y(v)+'" y2="'+y(v)+'" class="s-line" stroke-width=".5"/><text x="'+(L-5)+'" y="'+(y(v)+3)+'" text-anchor="end" class="cn">'+kfmt(v)+'</text>';});
  [75,50,25,0].forEach(dd=>{g+='<text x="'+x(75-dd)+'" y="'+(Hp-6)+'" text-anchor="middle" class="cn">'+(dd?'T-'+dd:'Doors')+'</text>';});
  g+='<path d="'+line(d=>prev*blendCurve(Math.max(0,d-2)),0,n-1)+'" class="f-none s-g4" stroke-width="1.6"/>';
  g+='<path d="'+line(d=>TARGET.presale*blendCurve(d),0,n-1)+'" class="f-none s-g2" stroke-width="1.2" stroke-dasharray="2 3"/>';
  g+='<path d="'+line(d=>s.days.com[d],0,today)+'" class="f-none s-gold" stroke-width="2.2" stroke-linejoin="round"/>';
  if(today<n-1){const c0=blendCurve(today),a=s.days.com[today];g+='<path d="'+line(d=>a+(final-a)*(blendCurve(d)-c0)/Math.max(.001,1-c0),today,n-1)+'" class="f-none s-gold" stroke-width="2" stroke-dasharray="1.5 4" stroke-linecap="round"/>';}
  g+='<circle cx="'+x(today)+'" cy="'+y(s.days.com[today])+'" r="3.5" class="f-gold s-bg" stroke-width="1.5"/>';
  return svgWrap(Wp,Hp,g)+'<div class="leg"><span><i class="sw-au" style="height:3px"></i>'+esc(W.ev.short)+'</span><span><i class="sw-dot"></i>Projected</span><span><i class="sw-g2" style="height:2px"></i>Target</span><span><i class="sw-g4" style="height:3px"></i>'+esc(PAST[0].name)+', '+esc(PAST[0].date)+'</span></div>';}

/* arrivals: guests per minute in 5-minute buckets, stacked */
const ARR_CLS=['f-g1','f-gold','f-g2','f-g3','f-g4'],TIER_CLS=['f-g1','f-g2','f-g3','f-gold','f-g4'];
function arrChart(s,Wd,byTier,compact){
  const src=byTier?s.arrTier:s.arr,cls=byTier?TIER_CLS:ARR_CLS,Wp=340,Hp=compact?92:150,L=compact?4:26,Rr=4,T=8,B=compact?4:20,nb=Math.ceil((Wd.C-Wd.D)/(5*MIN)),bw=(Wp-L-Rr)/nb;
  let max=s.gateCap*5*1.1;for(let i=0;i<nb;i++){const v=sum([0,1,2,3,4],k=>src[k][i]);if(v>max)max=v;}
  const y=v=>T+(Hp-T-B)*(1-v/max);let g='';
  if(!compact){[0,.5,1].forEach(k=>{const v=Math.round(max*k/5);g+='<line x1="'+L+'" x2="'+(Wp-Rr)+'" y1="'+y(v*5)+'" y2="'+y(v*5)+'" class="s-line" stroke-width=".5"/><text x="'+(L-4)+'" y="'+(y(v*5)+3)+'" text-anchor="end" class="cn">'+v+'</text>';});
    for(let h=0;h<=Math.floor((Wd.C-Wd.D)/HOUR);h++)g+='<text x="'+(L+h*12*bw)+'" y="'+(Hp-5)+'" text-anchor="middle" class="cn">'+fT(Wd.D+h*HOUR)+'</text>';}
  for(let i=0;i<=Math.min(s.bucket,nb-1);i++){let acc=0;for(let k=0;k<5;k++){const v=src[k][i];if(!v)continue;const y1=y(acc+v),h=y(acc)-y1;g+='<rect x="'+(L+i*bw+.4).toFixed(1)+'" y="'+y1.toFixed(1)+'" width="'+(bw-.8).toFixed(1)+'" height="'+Math.max(.5,h).toFixed(1)+'" class="'+cls[k]+'"/>';acc+=v;}}
  const cy=y(s.gateCap*5);g+='<line x1="'+L+'" x2="'+(Wp-Rr)+'" y1="'+cy+'" y2="'+cy+'" class="'+(s.capAlert?'s-warn':'s-g2')+'" stroke-width="1" stroke-dasharray="4 3"/>';
  if(!compact)g+='<text x="'+(Wp-Rr)+'" y="'+(cy-4)+'" text-anchor="end" class="ct">Gate throughput '+s.gateCap+'/min</text>';
  return svgWrap(Wp,Hp,g);
}
function arrLegend(s,byTier){const labs=byTier?['Early entry','Second wave','VIP standing','Tables','List, comp, door']:['Presold ticket','Table guest','Promoter list','Guest list / comp','Door purchase'],src=byTier?s.arrTier:s.arr,cls=byTier?TIER_CLS:ARR_CLS;
  return '<div class="leg">'+labs.map((l,k)=>'<span><i class="sw-'+cls[k].slice(2).replace('gold','au')+'"></i>'+l+' '+N(n0(sum(src[k])))+'</span>').join('')+'</div>';}

function donut(slices,sel,center){
  const tot=sum(slices,x=>x.v)||1,R=62,r=38,cx=80,cy=80;let a=-Math.PI/2,g='';
  slices.forEach((sl,i)=>{const fr=sl.v/tot,a1=a+fr*Math.PI*2,big=fr>.5?1:0,p=(rad,ang)=>(cx+rad*Math.cos(ang)).toFixed(1)+' '+(cy+rad*Math.sin(ang)).toFixed(1),on=sel===sl.id;
    const Ro=on?R+5:R;
    g+='<path data-act="slice" data-id="'+sl.id+'" d="M'+p(Ro,a)+'A'+Ro+' '+Ro+' 0 '+big+' 1 '+p(Ro,a1)+'L'+p(r,a1)+'A'+r+' '+r+' 0 '+big+' 0 '+p(r,a)+'Z" class="'+sl.cls+' s-bg" stroke-width="1.5" style="cursor:pointer"/>';
    if(fr>.07){const m=(a+a1)/2;g+='<text x="'+(cx+(R+r)/2*Math.cos(m)).toFixed(1)+'" y="'+(cy+(R+r)/2*Math.sin(m)+3.5).toFixed(1)+'" text-anchor="middle" class="cnb '+(sl.cls==='f-g3'||sl.cls==='f-g4'?'':'c-bg')+'" style="pointer-events:none;font-size:10.5px">'+Math.round(fr*100)+'%</text>';}
    a=a1;});
  if(center)g+='<text x="'+cx+'" y="'+(cy-1)+'" text-anchor="middle" class="cnb" style="font-size:13px">'+center[0]+'</text><text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" class="ct">'+center[1]+'</text>';
  return svgWrap(160,160,g);
}
function ring(parts,big,small,size){const tot=sum(parts,p=>p.v)||1,R=42,cx=50,cy=50,C=2*Math.PI*R;let off=0,g='<circle cx="50" cy="50" r="'+R+'" class="f-none s-g4" stroke-width="9" opacity=".5"/>';
  parts.forEach(p=>{if(!p.v)return;const len=p.v/tot*C;g+='<circle cx="50" cy="50" r="'+R+'" class="f-none '+p.cls+'" stroke-width="9" stroke-dasharray="'+Math.max(0,len-1.2).toFixed(2)+' '+(C-len+1.2).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 50 50)"/>';off+=len;});
  g+='<text x="50" y="'+(small?50:55)+'" text-anchor="middle" class="cnb" style="font-size:17px">'+big+'</text>'+(small?'<text x="50" y="63" text-anchor="middle" class="ct" style="font-size:8px">'+small+'</text>':'');
  return '<div style="width:'+(size||96)+'px;flex-shrink:0">'+svgWrap(100,100,g)+'</div>';}
function spark(vals,w,h,cls){w=w||120;h=h||28;const mx=Math.max.apply(null,vals)||1,mn=Math.min.apply(null,vals),x=i=>i*(w/(vals.length-1)),y=v=>h-2-(h-4)*(v-mn)/Math.max(1,mx-mn);
  return svgWrap(w,h,'<path d="'+vals.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join('')+'" class="f-none '+(cls||'s-gold')+'" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>');}
function miniBars(vals,hi,w,h){w=w||140;h=h||30;const mx=Math.max.apply(null,vals)||1,bw=w/vals.length;
  return svgWrap(w,h,vals.map((v,i)=>'<rect x="'+(i*bw+.5).toFixed(1)+'" y="'+(h-Math.max(1,v/mx*h)).toFixed(1)+'" width="'+(bw-1).toFixed(1)+'" height="'+Math.max(1,v/mx*h).toFixed(1)+'" rx="1" class="'+(i===hi?'f-gold':'f-g3')+'"/>').join(''));}
function hourChart(act,plan,nowI,Wd,done){const Wp=340,Hp=140,L=30,T=8,B=20,n=act.length,bw=(Wp-L-6)/n,max=Math.max(Math.max.apply(null,act),Math.max.apply(null,plan))*1.12||1,y=v=>T+(Hp-T-B)*(1-v/max);let g='';
  [0,.5,1].forEach(k=>{g+='<line x1="'+L+'" x2="'+(Wp-6)+'" y1="'+y(max*k)+'" y2="'+y(max*k)+'" class="s-line" stroke-width=".5"/><text x="'+(L-4)+'" y="'+(y(max*k)+3)+'" text-anchor="end" class="cn">'+kfmt(max*k)+'</text>';});
  for(let i=0;i<n;i++){const x=L+i*bw,fut=!done&&i>nowI;g+='<rect x="'+(x+3).toFixed(1)+'" y="'+y(plan[i]).toFixed(1)+'" width="'+(bw-6).toFixed(1)+'" height="'+(y(0)-y(plan[i])).toFixed(1)+'" class="f-none s-g3" stroke-width="1" stroke-dasharray="2 2" rx="2"/>';
    if(!fut)g+='<rect x="'+(x+6).toFixed(1)+'" y="'+y(act[i]).toFixed(1)+'" width="'+(bw-12).toFixed(1)+'" height="'+Math.max(.5,y(0)-y(act[i])).toFixed(1)+'" class="'+(i===nowI&&!done?'f-gold':'f-g2')+'" rx="2"/>';
    g+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(Hp-5)+'" text-anchor="middle" class="cn">'+fT(Wd.D+i*HOUR)+'</text>';}
  return svgWrap(Wp,Hp,g)+'<div class="leg"><span><i class="sw-g2"></i>Actual</span><span><i class="sw-au"></i>This hour</span><span><i class="sw-open"></i>Plan</span></div>';}

/* co-attendance: who comes with whom */
function network(nodes,edges,sel){const Wp=340,Hp=240,R=rng(7);nodes.forEach((n,i)=>{const a=i/nodes.length*6.283;n.x=Wp/2+Math.cos(a)*90*(.5+R()*.6);n.y=Hp/2+Math.sin(a)*70*(.5+R()*.6);});
  const idx={};nodes.forEach((n,i)=>idx[n.id]=i);
  for(let it=0;it<140;it++){for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;const f=380/(d*d);dx/=d;dy/=d;a.x+=dx*f;a.y+=dy*f;b.x-=dx*f;b.y-=dy*f;}
    edges.forEach(e=>{const a=nodes[idx[e.a]],b=nodes[idx[e.b]];if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=(d-34)*.02*Math.min(3,e.w);a.x+=dx/d*f;a.y+=dy/d*f;b.x-=dx/d*f;b.y-=dy/d*f;});
    nodes.forEach(n=>{n.x+=(Wp/2-n.x)*.012;n.y+=(Hp/2-n.y)*.016;n.x=clamp(n.x,14,Wp-14);n.y=clamp(n.y,14,Hp-14);});}
  let g='';edges.forEach(e=>{const a=nodes[idx[e.a]],b=nodes[idx[e.b]];if(a&&b)g+='<line x1="'+a.x.toFixed(1)+'" y1="'+a.y.toFixed(1)+'" x2="'+b.x.toFixed(1)+'" y2="'+b.y.toFixed(1)+'" class="'+(sel!=null&&(e.a===sel||e.b===sel)?'s-gold':'s-g3')+'" stroke-width="'+Math.min(3,.5+e.w*.5)+'" opacity=".7"/>';});
  nodes.forEach(n=>{const r=4+Math.min(9,n.deg*1.1);g+='<circle data-act="guest" data-g="'+n.id+'" cx="'+n.x.toFixed(1)+'" cy="'+n.y.toFixed(1)+'" r="'+r.toFixed(1)+'" class="'+(n.hub?'f-gold':'f-g2')+' s-bg" stroke-width="1.5" style="cursor:pointer"/>';
    if(n.hub)g+='<text x="'+n.x.toFixed(1)+'" y="'+(n.y-r-4).toFixed(1)+'" text-anchor="middle" class="ct" style="fill:var(--t1);font-weight:700">'+esc(n.label)+'</text>';});
  return svgWrap(Wp,Hp,g);}
function coGraph(Wd,t){const deg={},edges=[],seen={};
  Wd.bookings.forEach(b=>{if(!bActive(b,t))return;const here=b.seats.filter(s=>s.g>=0&&(t<Wd.D||s.ar)).slice(0,5);const host=b.booker;here.forEach(s=>{if(s.g===host)return;edges.push({a:host,b:s.g,w:1+Wd.guests[s.g].v*.3});deg[host]=(deg[host]||0)+1;deg[s.g]=(deg[s.g]||0)+1;});});
  Wd.rules.forEach(r=>{if(r.kind==='near'){edges.push({a:r.a,b:r.b,w:3});deg[r.a]=(deg[r.a]||0)+2;deg[r.b]=(deg[r.b]||0)+2;}});
  const hubs=Object.keys(deg).map(Number).filter(i=>Wd.guests[i].crm===2).sort((a,b)=>deg[b]-deg[a]).slice(0,9),keep={};hubs.forEach(h=>keep[h]=1);
  const E=edges.filter(e=>keep[e.a]||keep[e.b]).slice(0,60);E.forEach(e=>{keep[e.a]=1;keep[e.b]=1;});
  /* bridges: people who link two hubs are the ones worth knowing */
  for(let i=0;i<hubs.length-1;i+=2)E.push({a:hubs[i],b:hubs[i+1],w:2});
  const nodes=Object.keys(keep).map(Number).map(i=>({id:i,label:Wd.guests[i].n.split(' ')[0]+' '+Wd.guests[i].n.split(' ').pop()[0]+'.',deg:deg[i]||1,hub:hubs.includes(i)}));
  return {nodes,edges:E,hubs};}
