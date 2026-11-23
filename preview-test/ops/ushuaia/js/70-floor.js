'use strict';
/* ============================================================
   70 · FLOOR
   Top-down plan from the same geometry as the guest app.
   Every overlay has its own encoding and its own legend:
   status uses shape + state colour, money uses gold intensity,
   progress uses a fill level, attention uses a pulse.
   Tap a table: data, straight away. Tap the floor: zone data
   drawn in the empty floor space. The pen only edits the layout.
   ============================================================ */
const FY=z=>904-z;
const shortId=id=>{const m=id.match(/^([A-Z])([A-Z])0*(\d+)$/);return m?m[2]+m[3]:id;};
function tRot(T){if(T.grp==='bs')return T.o==='c'?90:T.o==='d'?(T.x<0?-45:45):0;if(T.grp==='silver')return T.x<0?45:-45;return 0;}
function secBox(k){const ts=W.tables.filter(T=>T.sec===k);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;ts.forEach(T=>{x0=Math.min(x0,T.x);x1=Math.max(x1,T.x);y0=Math.min(y0,FY(T.z));y1=Math.max(y1,FY(T.z));});return {x:x0-24,y:y0-22,w:x1-x0+48,h:y1-y0+44,cx:(x0+x1)/2,cy:(y0+y1)/2};}
const GA_Z=[['pit',-108,690,216,76],['front',-112,560,224,128],['mid',-112,360,224,198],['back',-112,152,224,206],['plaza',-100,0,200,150]];
const ZONES={pit:{l:'Pit',s:'Pit',sec:14,bars:'Pit bar, two stations',who:'VIP standing'},front:{l:'Front floor',s:'Front',sec:18,bars:'North and south bars',who:'Early entry and Second wave'},
  mid:{l:'Mid floor',s:'Mid',sec:12,bars:'Centre bar',who:'Early entry and Second wave'},back:{l:'Back floor',s:'Back',sec:10,bars:'Back bars, two',who:'Second wave and door tickets'},plaza:{l:'Entry plaza',s:'Plaza',sec:18,bars:'Plaza kiosks',who:'Everyone arriving through Gates 1 to 3'}};
const canTables=()=>UI.role==='owner'||UI.role==='host';
const priceBand=v=>v>=60000?5:v>=30000?4:v>=15000?3:v>=10000?2:1;
function medDel(b,t){const d=b.orders.filter(o=>o.del>o.at&&o.del<=t).map(o=>(o.del-o.at)/MIN).sort((a,c)=>a-c);return d.length?d[Math.floor(d.length/2)]:null;}
function zoneAt(x,z){const a=GA_Z.find(a=>x>=a[1]&&x<=a[1]+a[3]&&z>=a[2]&&z<=a[2]+a[4]);return a?a[0]:null;}
function zoneData(s,p){const by_=a=>{const o={};a.forEach(z=>o[z.id]=z);return o;};
  if(p==='live')return by_(densityZones(s));
  if(p==='post'){const k=W.rev+':post';if(W._pz&&W._pzK===k)return W._pz;const ps=postStats(W,s),sp=snapshot(W,ps.peakAt,true);W._pzK=k;W._pz=by_(densityZones(sp));W._pz._at=ps.peakAt;return W._pz;}
  const att=s.fc.att||TARGET.att,vs=Math.round(s.tk.sold[2]*.95),rest=Math.max(0,att*.93-s.tb.seats*.88-vs);
  return by_([{id:'pit',n:vs,cap:800},{id:'front',n:rest*.34,cap:2300},{id:'mid',n:rest*.36,cap:2600},{id:'back',n:rest*.24,cap:2000},{id:'plaza',n:rest*.06,cap:900}]);}

/* ---------- what each overlay means, per phase and role ---------- */
function chipsFor(p){const R=UI.role;
  if(!canTables())return p==='live'?[['','Status']].concat(R==='runner'?[['prepend','Pre-orders pending']]:[]):[['','Status']];
  if(p==='pre')return [['','Status'],['tier','Price'],['promo','Promoters'],['vip','VIP and holds'],['claims','Seat claims'],['hosts','Hosts'],['pre','Pre-orders']];
  if(p==='live')return [['','All'],['vip','VIP'],['unpaid','Unpaid'],['noshow','No-show'],['prepend','Pre-orders pending'],['promo','Promoters']];
  return [['','Outcome'],['heat','Heat map'],['att','Attended'],['speed','Service speed'],['seating','Reseats, walk-ins']];}
function legendFor(p,ov,dens){const it=(cls,l,o)=>Object.assign({cls,l},o||{}),full=canTables(),R=UI.role;
  const dz=p==='live'&&dens?[{html:'<b class="lg-t lg-s">Floor density, % full</b>'},{html:'<span class="lg-dz"><i class="dz a"></i>&lt;80<i class="dz b"></i>80–92<i class="dz c"></i>&gt;92</span>'}]:[];
  const dimO=l=>it('ov-out',l,{dim:1});
  let L;
  if(p==='pre'){
    if(ov==='tier')L={t:'Minimum spend',i:[it('ov-p1','AED 6K'),it('ov-p2','AED 10K'),it('ov-p3','AED 15K to 18K'),it('ov-p4','AED 30K to 40K',{ink:1}),it('ov-p5','AED 60K and up',{ink:1})]};
    else if(ov==='promo')L={t:'Who sold the table',i:[it('ov-on','Promoter',{ink:1}),it('ov-grey','Partner'),dimO('Direct and other')]};
    else if(ov==='vip')L={t:'VIP and holds',i:[it('ov-on','Backstage List or Backstage',{ink:1,txt:'★'}),it('st-held','Held'),it('st-requested','Requested'),dimO('Everything else')]};
    else if(ov==='claims')L={t:'Seats named by guests',i:[it('ov-lvl','All seats claimed',{lvl:1}),it('ov-lvl','About half',{lvl:.5}),it('ov-lvl','None yet',{lvl:0}),dimO('Not booked')]};
    else if(ov==='hosts')L={t:'Section hosts',i:SEC_ORDER.map(k=>({html:'<span class="lg-h"><b class="n">'+initials(SECTIONS[k].host)+'</b>'+esc(SECTIONS[k].host.split(' ')[0])+' <em>'+esc(SECTIONS[k].label.replace('Backstage','BS').replace('Platinum','Plat').replace(' · ',' ').replace('Left','L').replace('Right','R').replace('Centre','C'))+'</em></span>'}))};
    else if(ov==='pre')L={t:'Pre-ordered, share of minimum',i:[it('ov-lvl','Fully covered',{lvl:1}),it('ov-lvl','Half covered',{lvl:.5}),it('ov-lvl','Nothing yet',{lvl:0,dim:1}),dimO('Not booked')]};
    else L={t:'Table status',i:[it('st-booked','Booked'),it('st-requested','Requested'),it('st-held','Held'),it('st-open','Open')]};}
  else if(p==='live'){
    if(ov==='vip')L={t:'VIP tables',i:[it('st-seated','Seated'),it('st-partial','Partly in'),it('st-expected','Expected'),it('st-noshow','No-show'),dimO('Not VIP')]};
    else if(ov==='unpaid')L={t:'Money to chase',i:[it('ov-warn','Deposit unpaid, or check open near close',{txt:'2K'}),dimO('Paid or not due yet')]};
    else if(ov==='noshow')L={t:'Late and no-show',i:[it('st-noshow','No-show, past the hold'),it('ov-warn','Late, inside the '+VENUE.graceMin+' min hold',{txt:'+12'}),dimO('Arrived or not due')]};
    else if(ov==='prepend')L={t:'Pre-orders',i:[it('ov-pulse','On its way, minutes since fired',{txt:'6m'}),dimO('Delivered or none')]};
    else if(ov==='promo')L={t:'Who sold the table',i:[it('ov-on','Promoter',{ink:1}),it('ov-grey','Partner'),dimO('Direct and other')]};
    else if(!isOn('scan'))L={t:'Bookings · arrivals unknown',i:[it('st-booked','Booked'),it('st-requested','Requested'),it('st-held','Held'),it('st-open','Open')].concat(full&&isOn('term')?[it('st-booked fxr','Red edge: card declined')]:[])};
    else{const i=[it('st-seated','Seated'),it('st-partial','Partly in'),it('st-noshow','No-show'),it('st-expected','Expected'),it('st-open','Open')];
      if(full&&isOn('term'))i.push(it('st-seated fxr','Red edge: card declined'));if(full||R==='runner')i.push(it('st-partial fxa','Amber edge: waiting 8+ min'));L={t:'Tables now',i};}}
  else{
    if(ov==='heat')L={t:'Spend against minimum',i:[{html:'<span class="lg-grad"><i></i></span>'},{html:'<span class="lg-ax"><em class="n">50%</em><em class="n">100%</em><em class="n">150%+</em></span>'},dimO('No-show or not booked')]};
    else if(ov==='att')L={t:'Guests who came',i:[it('ov-lvl','Whole party',{lvl:1}),it('ov-lvl','Half the party',{lvl:.5}),it('ov-lvl','Nobody',{lvl:0}),dimO('Not booked')]};
    else if(ov==='speed')L={t:'Order to table, median',i:[it('ov-ok','Under 10 min',{ink:1}),it('ov-warn','10 to 15 min'),it('ov-bad','Over 15 min'),dimO('No orders')]};
    else if(ov==='seating')L={t:'Seating changes',i:[it('ov-on','Moved on the night',{ink:1,txt:'M'}),it('ov-grey','Walk-in',{txt:'W'}),dimO('Booked and stayed')]};
    else L={t:'Outcome',i:[it('st-above','Above minimum'),it('st-below','Below minimum'),it('st-noshow','No-show'),it('st-unsold','Unsold')]};}
  return {title:L.t,items:L.i.concat(dz)};}
function legSw(it){if(it.dot)return '<svg width="22" height="14" viewBox="-11 -7 22 14"><g class="tb"><circle class="'+it.dot+'" r="4"/></g></svg>';
  return '<svg width="24" height="15" viewBox="-12 -7.5 24 15"><g class="tb '+it.cls+(it.ink?' ink':'')+(it.dim?' dim':'')+'"><rect class="b" x="-10" y="-6" width="20" height="12" rx="2.2"/><rect class="lv" x="-10" y="-6" width="'+(20*(it.lvl||0))+'" height="12" rx="2.2"/>'+
    (it.cls==='st-noshow'?'<path class="gl" d="M-10 -6L10 6M10 -6L-10 6"/>':'')+(it.txt?'<text y="2" style="font-size:6.5px">'+it.txt+'</text>':'')+'</g></svg>';}

const Floor={v:{k:1,tx:0,ty:0},fitK:.5,el:null,
  render(host){const p=phase(),F=UI.floor;this.host=host;this.lod=0;if(F.leg==null)F.leg=true;
    host.innerHTML='<div class="floor"><div class="fl-top" id="flTop"></div><div class="fl-map" id="flMap"><svg id="flSvg" aria-label="Venue floor plan"><defs>'+
      '<pattern id="hatchG" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--g3)" stroke-width="2"/></pattern>'+
      '<pattern id="halfW" width="1" height="1" patternContentUnits="objectBoundingBox"><rect width=".5" height="1" style="fill:var(--warn)"/><rect x=".5" width=".5" height="1" style="fill:var(--bg)"/></pattern></defs>'+
      '<g id="flW"><g id="flBase"></g><g id="flDens"></g><g id="flTabs"></g><g id="flSeats" class="seatg"></g><g id="flFx"></g></g></svg>'+
      '<div class="fl-over" id="flOver">'+GA_Z.map(z=>'<div class="zl" data-z="'+z[0]+'"></div>').join('')+'<div class="zcard" id="zCard" style="display:none"></div></div>'+
      '<div class="fl-dock" id="flDock"><div class="fa-card" id="faCard" style="display:none"></div><div class="fl-leg" id="flLeg"></div></div><div class="fl-ctl"><button class="ibtn" data-act="flFit" aria-label="Show the whole venue">'+I('expand',20)+'</button>'+
      (p==='pre'&&UI.role==='owner'?'<button class="ibtn" data-act="flEdit" aria-label="Edit layout">'+I('edit',20)+'</button>':'')+
      (p==='post'&&UI.role==='owner'?'<button class="ibtn" data-act="flTpl" aria-label="Save layout as template">'+I('dl',20)+'</button>':'')+
      '<button class="ibtn" data-act="flLeg" aria-label="Show or hide the legend">'+I('layers',20)+'</button></div></div></div>';
    this.el=$('#flMap',host);this.g=$('#flW',host);this.drawBase();this.drawTables();this.bind();this.paintTop();this._lk='';
    requestAnimationFrame(()=>{if(!this.host||!$('#flSvg',this.host))return;this.fit(true);const f=F.focus;F.focus=null;if(f)this.zoomSec(f,true);this.update(true);if(F.ans){FA.paint();if(F.ans.m&&F.ans.m.focus)this.spotlight(F.ans.m.focus);}if(F.open){const id=F.open;F.open=null;openTable(id);}});},
  size(){const r=this.el.getBoundingClientRect();return {w:r.width||390,h:r.height||500};},
  lim(){return {min:this.fitK*.96,max:this.fitK*5.2};},
  ins(){const d=this.host&&$('#flDock',this.host),on=d&&d.style.visibility!=='hidden'&&d.offsetHeight;if(!on)return {l:0,b:0};return UI.device==='atlas'?{l:d.offsetWidth+28,b:0}:{l:0,b:d.offsetHeight};},
  fit(now_){const s=this.size(),n=this.ins(),aw=s.w-n.l-(UI.device==='atlas'?n.l*.35:0),ah=s.h-n.b,k=Math.min(aw/590,ah/985);this.fitK=k;this.v={k,tx:n.l+aw/2,ty:(ah-985*k)/2+48*k};this.atFit=true;UI.floor.sec=null;this.apply(now_);},
  zoomTo(k,cx,cy,now_){this.atFit=false;const L=this.lim(),s=this.size();k=clamp(k,L.min,L.max);this.v={k,tx:s.w/2-cx*k,ty:s.h/2-cy*k};this.apply(now_);},
  zoomSec(k,now_){const b=secBox(k),s=this.size();this.zoomTo(Math.min(s.w/b.w,s.h/b.h),b.cx,b.cy,now_);UI.floor.sec=k;this.paintTop();},
  zoomTable(id){const T=W.T[id];this.zoomTo(Math.max(this.v.k,this.fitK*3.6),T.x,FY(T.z)+40);UI.floor.sec=T.sec;},
  clampV(){const v=this.v,s=this.size(),mx=s.w*.3,my=s.h*.25;v.tx=clamp(v.tx,mx-272*v.k,s.w-mx+272*v.k);v.ty=clamp(v.ty,my-912*v.k,s.h-my);},
  apply(now_){const v=this.v,g_=this.g;if(!g_||!g_.isConnected)return;this.clampV();g_.style.transition=now_||reduceMotion()?'none':'transform .35s cubic-bezier(.2,.8,.2,1)';
    g_.setAttribute('transform','translate('+v.tx.toFixed(1)+' '+v.ty.toFixed(1)+') scale('+v.k.toFixed(3)+')');
    const z=v.k/this.fitK,lod=z<1.7?1:z<3.1?2:3,svg=$('#flSvg',this.host);if(svg&&this.lod!==lod){this.lod=lod;svg.setAttribute('class','lod'+lod);}
    if(now_)this.placeOver();else{clearTimeout(this._po);this._po=setTimeout(()=>this.placeOver(),360);}
    clearTimeout(this._st);this._st=setTimeout(()=>this.seats(),now_?0:380);},
  drawBase(){const P=a=>a.map(p=>p[0]+','+FY(p[1])).join(' ');let h='<rect x="-272" y="0" width="544" height="912" rx="6" class="zone" style="fill:var(--bg2)"/>';
    h+='<polygon class="zone deck" points="'+P([[-268,688],[-112,688],[-112,770],[112,770],[112,688],[268,688],[268,880],[-268,880]])+'"/>';
    [[598,694],[368,566],[146,338]].forEach(z=>{[-1,1].forEach(sd=>{h+='<rect class="zone deck" x="'+(sd<0?-270:124)+'" y="'+FY(z[1])+'" width="146" height="'+(z[1]-z[0])+'" rx="3"/>';});});
    [-1,1].forEach(sd=>{h+='<polygon class="zone deck" points="'+P([[118,152],[47,81],[130,-2],[270,-2],[270,152]].map(p=>[sd*p[0],p[1]]))+'"/>';});
    h+='<rect x="-23" y="'+(FY(785)-4)+'" width="46" height="26" rx="3" style="fill:var(--gold-bg);stroke:var(--gold)" stroke-width="1.2"/><text x="0" y="'+(FY(785)+13)+'" class="zlbl sm" style="fill:var(--gold)">DJ</text>';
    h+='<text x="0" y="'+(FY(880)-8)+'" class="zlbl sm">Stage</text>';
    [['G1',-150,-8],['G2',150,-8],['G3',0,-8],['G4',272,800]].forEach(a=>{h+='<g class="gate" data-g="'+a[0]+'"><rect x="'+(a[1]-13)+'" y="'+(FY(a[2])-7)+'" width="26" height="14" rx="4" style="fill:var(--card2);stroke:var(--line2)"/><text x="'+a[1]+'" y="'+(FY(a[2])+3.5)+'" class="zlbl sm" style="font-family:var(--mono);fill:var(--t2)">'+a[0]+'</text></g>';});
    SEC_ORDER.forEach(k=>{const b=secBox(k),lbl=SECTIONS[k].label.replace(' · ',' ').replace('Backstage','BS').replace('Platinum','Plat');h+='<text x="'+b.cx+'" y="'+(b.y+7)+'" class="zlbl sm">'+esc(lbl)+'</text>';});
    $('#flBase',this.host).innerHTML=h;
    $('#flDens',this.host).innerHTML=GA_Z.map(z=>'<rect class="dens" data-z="'+z[0]+'" x="'+z[1]+'" y="'+FY(z[2]+z[4])+'" width="'+z[3]+'" height="'+z[4]+'" rx="4"/>').join('');},
  drawTables(){$('#flTabs',this.host).innerHTML=W.tables.map(T=>{const tr=TIERS[T.tier],w=tr.w*(T.wide||1),h=tr.h;
      return '<g class="tb" data-id="'+T.id+'" transform="translate('+T.x+' '+FY(T.z)+') rotate('+tRot(T)+')"><rect class="b" x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="'+h+'" rx="2.4"/><rect class="lv" x="'+(-w/2)+'" y="'+(-h/2)+'" width="0" height="'+h+'" rx="2.4"/><path class="gl" d=""/><text y="1.9" transform="rotate('+(-tRot(T))+')">'+shortId(T.id)+'</text></g>';}).join('');
    this.nodes={};$$('#flTabs .tb',this.host).forEach(n=>{const T=W.T[n.dataset.id],tr=TIERS[T.tier];n._w=tr.w*(T.wide||1);n._h=tr.h;this.nodes[T.id]=n;});},
  info(T,ix,t,p,late){const F=UI.floor,ov=F.overlay||'',e=ix[T.id],b=e&&e.st==='booked'?e.b:null,R=UI.role,full=canTables(),r={cls:'',txt:shortId(T.id),dim:false,lvl:null,fx:'',ink:false,op:null};
    if(T.oos){r.cls='st-oos';return r;}
    const m=b?(b._m||money(b,t)):null,c=b?seatCounts(b,t):null,dimOut=()=>{r.cls='ov-out';r.dim=true;};
    const promo=()=>{const sc=b&&SRC[b.src];if(!sc||!(sc.grp==='promoter'||sc.grp==='partner')||(F.promo&&b.src!==F.promo))return dimOut();r.cls=sc.grp==='promoter'?'ov-on':'ov-grey';r.ink=sc.grp==='promoter';r.txt=initials(sc.label);};
    if(p==='pre'){const st=!e?'open':e.st==='booked'?'booked':e.st;
      if(!ov)r.cls='st-'+st;
      else if(ov==='tier'){const v=b?b.min:e&&e.st==='requested'?e.b.min:T.min,bd=priceBand(v);r.cls='ov-p'+bd;r.ink=bd>=4;r.txt=kfmt(v);}
      else if(ov==='promo')promo();
      else if(ov==='vip'){if(b&&b.vip){r.cls='ov-on';r.ink=true;r.txt='★';}else if(e&&e.st==='held')r.cls='st-held';else if(e&&e.st==='requested')r.cls='st-requested';else dimOut();}
      else if(ov==='claims'){if(b){r.cls='ov-lvl';r.lvl=c.claimed/b.party;r.txt=c.claimed+'/'+b.party;}else dimOut();}
      else if(ov==='hosts'){const i=SEC_ORDER.indexOf(T.sec),mine=R==='host'&&T.sec===ROLES.host.sec;r.cls=mine?'ov-on':i%2?'ov-grey':'ov-out';r.ink=mine;r.txt=initials(SECTIONS[T.sec].host);}
      else if(ov==='pre'){if(b&&!b.comp){r.cls='ov-lvl';r.lvl=Math.min(1,m.preCredit/Math.max(1,m.min));r.txt=m.preCredit?Math.round(r.lvl*100)+'%':'0';r.dim=!m.preCredit;}else dimOut();}}
    else if(p==='live'){const st=isOn('scan')?(T._st||'open'):(b?'booked':!e?'open':e.st);
      if(!ov){r.cls='st-'+st;if(b&&full&&isOn('term')&&b.declined&&b.declined<=t&&!(b.payAt&&b.payAt<=t))r.fx='fx';else if(b&&(full||R==='runner')&&isOn('scan')&&late.has(b))r.fx='fxa';}
      else if(ov==='vip'){r.cls='st-'+st;r.dim=!(b&&b.vip);}
      else if(ov==='unpaid'){if(b&&b.declined&&b.declined<=t&&!(b.payAt&&b.payAt<=t)){r.cls='ov-bad';r.txt=kfmt(m.balance);}else if(b&&(m.depDue||(m.balance>0&&t>W.C-70*MIN))){r.cls='ov-warn';r.txt=kfmt(m.depDue||m.balance);}else dimOut();}
      else if(ov==='noshow'){if(st==='noshow'){r.cls='st-noshow';r.txt='+'+Math.round((t-b.arriveBy)/MIN);}else if(st==='expected'&&b&&t>b.arriveBy){r.cls='ov-warn';r.txt='+'+Math.round((t-b.arriveBy)/MIN);}else dimOut();}
      else if(ov==='prepend'){const o=b&&b.orders.find(o=>o.pre&&o.at<=t&&(!o.del||o.del>t)&&!o.opDel);if(o){r.cls='ov-pulse';r.txt=Math.max(1,Math.round((t-o.at)/MIN))+'m';}else dimOut();}
      else if(ov==='promo')promo();}
    else{const st=tableState(W,T,ix,t,'post');
      if(!ov)r.cls='st-'+st;
      else if(ov==='heat'){if(b&&c.present){const q=m.spend/Math.max(1,m.min);r.cls='ov-heat';r.op=b.comp?.5:clamp((q-.4)/1.1,.1,1);r.ink=r.op>.55;r.txt=b.comp?'comp':Math.round(q*100)+'%';}else dimOut();}
      else if(ov==='att'){if(b){r.cls='ov-lvl';r.lvl=c.present/b.party;r.txt=c.present+'/'+b.party;}else dimOut();}
      else if(ov==='speed'){const md=b&&medDel(b,t);if(md!=null){r.cls=md<10?'ov-ok':md<=15?'ov-warn':'ov-bad';r.ink=md<10;r.txt=Math.round(md)+'m';}else dimOut();}
      else if(ov==='seating'){if(b&&b.moves.length){r.cls='ov-on';r.ink=true;r.txt='M';}else if(b&&b.walk){r.cls='ov-grey';r.txt='W';}else dimOut();}}
    return r;},
  update(force){if(!this.host||!$('#flSvg',this.host))return;const s=S(),p=phase(),t=now(),ix=s.ix,F=UI.floor;this.ix=ix;
    const pg=F.ping&&Date.now()-F.ping.at<25000?F.ping:null,late=new Set();if(p==='live'){W.svc.forEach(r=>{if(r.at<=t&&!r.op&&r.res>t&&t-r.at>6*MIN)late.add(r.b);});W.bookings.forEach(b=>{if(b.seats.some(x=>x.ar&&x.ar<=t&&!(x.st&&x.st<=t)&&t-x.ar>8*MIN))late.add(b);});}
    for(const T of W.tables){const n=this.nodes[T.id];if(!n)continue;const i=this.info(T,ix,t,p,late),sp=F.spot,on=sp&&sp.ids.has(T.id),cls='tb '+i.cls+(i.ink?' ink':'')+(i.dim&&!on?' dim':'')+(i.fx==='fx'?' fxr':i.fx==='fxa'?' fxa':'')+(pg&&pg.table===T.id?' pinged':'')+(on?' spot spot-'+(sp.tone[T.id]||'gold'):sp?' dim2':'')+(F.sel===T.id?' sel':'')+(F.move&&i.cls==='st-open'?' tgt':'');
      if(n._c!==cls){n.setAttribute('class',cls);n._c=cls;const w=n._w/2,h=n._h/2;n.children[2].setAttribute('d',i.cls==='st-noshow'?'M'+(-w)+' '+(-h)+'L'+w+' '+h+'M'+w+' '+(-h)+'L'+(-w)+' '+h:'');}
      const lv=i.lvl==null?0:clamp(i.lvl,0,1);if(n._l!==lv){n.children[1].setAttribute('width',(n._w*lv).toFixed(1));n._l=lv;}
      const op=i.op==null?'':i.op.toFixed(2);if(n._o!==op){n.children[0].style.fillOpacity=op;n._o=op;}
      if(n._t!==i.txt){n.children[3].textContent=i.txt;n._t=i.txt;}
}
    const zd=null;$$('.dens',this.host).forEach(r=>{const z=zd&&zd[r.dataset.z],f=z?z.n/z.cap:0,on=F.dens!==false&&z;
      const zs=F.spot&&F.spot.zones.includes(r.dataset.z);r.setAttribute('class','dens'+(F.zone===r.dataset.z?' zsel':'')+(zs?' zspot':''));r.style.fillOpacity=zs?'':on?(f*.42).toFixed(2):0;r.style.fill=zs?'':f>.92?'var(--bad)':f>.8?'var(--warn)':'var(--gold)';});
    $$('#flBase .gate',this.host).forEach(g_=>{const c='gate'+(F.spot&&F.spot.gates.includes(g_.dataset.g)?' gspot':'');if(g_._c!==c){g_.setAttribute('class',c);g_._c=c;}});
    const lk=p+':'+(F.overlay||'')+':'+(F.dens!==false)+':'+UI.role+':'+F.leg+':'+Object.keys(UI.integOff||{}).filter(k=>UI.integOff[k]).join(',');if(lk!==this._lk){this._lk=lk;this.paintLeg();}
    this.paintOver(s,p);
    if(force||this._tp!==W.rev+':'+Math.floor(t/60000)){this._tp=W.rev+':'+Math.floor(t/60000);this.paintTop();if(this.lod===3)this.seats();}},
  seats(){const sg=$('#flSeats',this.host);if(!sg)return;if(this.lod!==3){sg.innerHTML='';return;}const v=this.v,s=this.size(),t=now(),ix=this.ix||S().ix,p=phase();let h='';
    for(const T of W.tables){const sx=T.x*v.k+v.tx,sy=FY(T.z)*v.k+v.ty;if(sx<-60||sy<-60||sx>s.w+60||sy>s.h+60)continue;const e=ix[T.id];if(!e||e.st!=='booked')continue;const b=e.b,tr=TIERS[T.tier],n=b.party,rot=tRot(T)*Math.PI/180,late=t>b.arriveBy+VENUE.graceMin*MIN;
      for(let i=0;i<n;i++){const a=i/n*6.283-1.57,ex=(tr.w*(T.wide||1)/2+3.2)*Math.cos(a),ey=(tr.h/2+3.2)*Math.sin(a),x=T.x+ex*Math.cos(rot)-ey*Math.sin(rot),y=FY(T.z)+ex*Math.sin(rot)+ey*Math.cos(rot),st=b.seats[i];
        const c=(p==='pre'?(st.cl&&st.cl<=t?'cl':'un'):st.st&&st.st<=t?'se':st.ar&&st.ar<=t?'ar':late||p==='post'?'ns':st.cl?'cl':'un')+(UI.floor.spot&&!UI.floor.spot.ids.has(T.id)?' sd':'');h+='<circle class="seatd '+c+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.9"/>';}}
    sg.innerHTML=h;},
  /* ---------- zone data, drawn in the empty floor space ---------- */
  paintOver(s,p){const ov=$('#flOver',this.host);if(!ov)return;const zd=null,F=UI.floor;
    GA_Z.forEach(a=>{const el=$('.zl[data-z="'+a[0]+'"]',ov),Z=ZONES[a[0]],inc=p==='pre'?0:W.incidents.filter(x=>x.at<=s.t&&x.zone===Z.l).length;
      const h='<b>'+Z.s+'</b>'+(inc?'<em class="warn">'+inc+' logged</em>':'<em>'+Z.sec+' security</em>');
      if(el._h!==h){el.innerHTML=h;el._h=h;}});
    const lg=$('#flDock',this.host);if(lg&&lg.style.visibility!==(F.zone?'hidden':'')){lg.style.visibility=F.zone?'hidden':'';this.dock();}
    const card=$('#zCard',ov);if(!F.zone){if(card.style.display!=='none'){card.style.display='none';card._h='';}this.placeOver();return;}
    const h=zoneCard(F.zone,s,p,zd);if(card._h!==h){card.innerHTML=h;card._h=h;}card.style.display='';this.placeOver();},
  placeOver(){const ov=this.host&&$('#flOver',this.host);if(!ov)return;const v=this.v,s=this.size(),F=UI.floor,X=x=>x*v.k+v.tx,Y=y=>y*v.k+v.ty;
    GA_Z.forEach(a=>{const el=$('.zl[data-z="'+a[0]+'"]',ov),x0=X(a[1]),x1=X(a[1]+a[3]),y0=Y(FY(a[2]+a[4])),y1=Y(FY(a[2])),w=x1-x0,h=y1-y0,show=w>=60&&h>=26&&!(F.zone&&['front','mid','back'].includes(a[0]))&&x1>0&&x0<s.w&&y1>0&&y0<s.h;
      el.style.cssText='left:'+x0.toFixed(0)+'px;top:'+y0.toFixed(0)+'px;width:'+w.toFixed(0)+'px;height:'+h.toFixed(0)+'px;display:'+(show?'flex':'none')+(h<44?';flex-direction:row;gap:6px':'');});
    const card=$('#zCard',ov);if(card.style.display==='none')return;const fx0=X(-112),fx1=X(112),fy0=Y(FY(688)),fy1=Y(FY(152)),fw=fx1-fx0,cw=Math.min(s.w-16,Math.max(fw-10,UI.device==='atlas'?240:236)),cx=clamp((fx0+fx1)/2-cw/2,8,s.w-cw-8),top=clamp(fy0+6,8,s.h-170),hh=Math.max(160,Math.min(fy1-fy0-12,s.h-top-8));
    card.style.left=cx.toFixed(0)+'px';card.style.top=top.toFixed(0)+'px';card.style.width=cw.toFixed(0)+'px';card.style.maxHeight=hh.toFixed(0)+'px';},
  paintTop(){const el=$('#flTop',this.host);if(!el)return;if(document.activeElement&&document.activeElement.id==='faQ'&&el.contains(document.activeElement))return;const p=phase(),F=UI.floor,s=S(),cs=chipsFor(p);if(!cs.some(c=>c[0]===(F.overlay||'')))F.overlay=null;
    if(F.overlay&&ovOff(F.overlay))F.overlay=null;
    const chips=cs.map(c=>c[0]&&ovOff(c[0])?'<button class="chip off" data-act="integGap" aria-label="'+esc(c[1])+' needs a feed that is off">'+I('cloudoff',13)+c[1]+'</button>':'<button class="chip '+((F.overlay||'')===c[0]?'on':'')+'" data-act="flOv" data-k="'+c[0]+'">'+c[1]+'</button>').join('')+'';
    const order=UI.role==='host'?[ROLES.host.sec].concat(SEC_ORDER.filter(k=>k!==ROLES.host.sec)):SEC_ORDER;
    const strip=order.map(k=>{const x=s.sec[k];if(!x)return '';const so=p!=='pre'&&!isOn('scan'),v=p==='pre'||so?x.booked+' of '+x.total+' booked'+(so?' · arrivals unknown':''):p==='live'?x.seated+' of '+x.booked+' seated · '+x.in+' in':(canTables()?pct(x.spend,x.min)+' of minimums':x.booked+' tables');
      return '<button class="fl-sec '+(F.sec===k?'on':'')+'" data-act="flSec" data-k="'+k+'"><b>'+esc(SECTIONS[k].label)+'</b><span class="n">'+v+'</span><div class="meter"><i style="width:'+clamp((p==='pre'||so?x.booked/x.total:p==='live'?x.seated/Math.max(1,x.booked):Math.min(1,x.spend/Math.max(1,x.min)))*100,0,100)+'%"></i></div></button>';}).join('');
    const mv=F.move?'<div class="banner neu">'+I('swap',17)+'<span><b>Moving '+esc(gName(F.move.booker))+'’s party.</b> Tap an open table. <button data-act="flMoveX" class="lnk">Cancel</button></span></div>':'';
    const ed=F.edit?(F.add?'<div class="banner neu">'+I('plus',17)+'<span><b>Tap an empty spot</b> for the new '+esc(TIERS[F.add].label)+' table. <button data-act="flAdd" data-k="'+F.add+'" class="lnk">Cancel</button></span></div>'
      :'<div class="banner neu">'+I('edit',17)+'<span><b>Editing the layout.</b> Drag a table to move it, tap one to remove it. <button data-act="flEdit" class="lnk">Done</button></span></div>')+
      '<div class="chips"><span class="chip-l">Add</span>'+TIER_ORDER.slice().reverse().map(k=>'<button class="chip '+(F.add===k?'on':'')+'" data-act="flAdd" data-k="'+k+'">'+I('plus',13)+esc(TIERS[k].label)+'</button>').join('')+'<button class="chip" data-act="flLock">'+I('lock',13)+'Lock layout</button></div>':'';
    const askOK=canTables()&&!F.edit&&!F.move&&isOn('ai'),ask=askOK&&F.ask;
    const askRow='<div class="fa-ask"><span class="fa-av">'+bublMark()+'</span><input id="faQ" type="text" placeholder="'+esc(FA.ph())+'" enterkeyhint="send" autocomplete="off" aria-label="Ask about the floor"><button class="fa-go" data-act="faSend" aria-label="Ask">'+I('send',18)+'</button><button class="fa-x" data-act="faAsk" aria-label="Close">'+I('x',18)+'</button></div>'+
      '<div class="chips">'+FA.sug().map(q=>'<button class="chip" data-act="faSug" data-q="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div>';
    const scanOff=p!=='pre'&&!isOn('scan')?'<div class="banner bad" data-act="integGap">'+I('cloudoff',17)+'<span><b>Access control is off.</b> Arrivals are not coming in, so tables show bookings only.</span></div>':'';
    const h=mv+ed+scanOff+(F.edit?'':ask?askRow:'<div class="chips">'+(askOK?'<button class="fa-btn" data-act="faAsk" aria-label="Ask the manager about the floor">'+bublMark()+'<span>Ask</span></button>':'')+chips+'</div>'+(F.overlay==='promo'?'<div class="chips">'+SOURCES.filter(x=>x.comm).map(x=>'<button class="chip '+(F.promo===x.id?'on':'')+'" data-act="flPromo" data-k="'+x.id+'">'+esc(x.label)+'</button>').join('')+(UI.role==='owner'?'<button class="chip" data-act="paHome">'+I('plus',13)+'Promoter access</button>':'')+'</div>':''))+(ask?'':'<div class="fl-strip">'+strip+'</div>');
    if(el._h!==h){const sl=$('.fl-strip',el),sx=sl?sl.scrollLeft:0,cl=$$('.chips',el).map(c=>c.scrollLeft);el.innerHTML=h;el._h=h;const s2=$('.fl-strip',el);if(s2)s2.scrollLeft=sx;$$('.chips',el).forEach((c,i)=>c.scrollLeft=cl[i]||0);}},
  paintLeg(){const el=$('#flLeg',this.host);if(!el)return;const F=UI.floor;el.style.display=F.leg===false||(F.ans&&UI.device!=='atlas')?'none':'';const L=legendFor(phase(),F.overlay||'',false);
    el.innerHTML='<b class="lg-t">'+esc(L.title)+'</b>'+L.items.map(it=>it.html||('<span>'+legSw(it)+esc(it.l)+'</span>')).join('');this.dock();},
  dock(){const d=$('#flDock',this.host),ctl=$('.fl-ctl',this.host);if(!d||!ctl)return;const hand=UI.device!=='atlas',hid=d.style.visibility==='hidden'||!d.offsetHeight;
    ctl.style.bottom=(hand&&!hid?d.offsetHeight+10:14)+'px';const key=d.offsetHeight+':'+d.offsetWidth;if(this._lh!==key){this._lh=key;if(UI.floor.spot)this.frame(true);else if(this.atFit)this.fit(true);}},
  bind(){const el=this.el,Pm=new Map(),self=this;let moved=0,t0=0,start=null,lp=null,drag=null,pinch=null,downTb=null;
    const world=e=>{const r=el.getBoundingClientRect();return {x:(e.clientX-r.left-self.v.tx)/self.v.k,y:(e.clientY-r.top-self.v.ty)/self.v.k};};
    el.addEventListener('pointerdown',e=>{if(e.target.closest('button,.zcard'))return;el.setPointerCapture(e.pointerId);Pm.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;t0=Date.now();start={x:e.clientX,y:e.clientY,tx:self.v.tx,ty:self.v.ty};self.g.style.transition='none';
      const tb=e.target.closest('#flTabs .tb'),F=UI.floor;downTb=tb;
      if(Pm.size===2){const a=[...Pm.values()];pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),k:self.v.k,tx:self.v.tx,ty:self.v.ty,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2};clearTimeout(lp);drag=null;return;}
      if(tb&&F.edit&&!W.layoutLocked){drag={T:W.T[tb.dataset.id],n:tb,edit:1};return;}
      if(tb&&phase()==='live'&&can('move')&&canTables()){const T=W.T[tb.dataset.id],en=(self.ix||{})[T.id];if(en&&en.st==='booked')lp=setTimeout(()=>{if(moved<8){haptic(25);F.move=en.b;drag={b:en.b,ghost:1};self.paintTop();self.update(true);$('#flFx',self.host).insertAdjacentHTML('beforeend','<g id="ghost"><circle r="12" style="fill:var(--gold);opacity:.85"/></g>');}},480);}});
    el.addEventListener('pointermove',e=>{const pt=Pm.get(e.pointerId);if(!pt)return;pt.x=e.clientX;pt.y=e.clientY;
      if(pinch&&Pm.size===2){const a=[...Pm.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),r=el.getBoundingClientRect(),L=self.lim(),k=clamp(pinch.k*d/pinch.d,L.min,L.max),cx=pinch.cx-r.left,cy=pinch.cy-r.top;self.atFit=false;self.v={k,tx:cx-(cx-pinch.tx)*k/pinch.k,ty:cy-(cy-pinch.ty)*k/pinch.k};self.apply(true);moved=99;return;}
      if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;moved=Math.max(moved,Math.hypot(dx,dy));if(moved>8)clearTimeout(lp);
      if(drag&&drag.edit){const w=world(e);drag.T.x=Math.round(w.x*2)/2;drag.T.z=Math.round((904-w.y)*2)/2;drag.n.setAttribute('transform','translate('+drag.T.x+' '+FY(drag.T.z)+') rotate('+tRot(drag.T)+')');return;}
      if(drag&&drag.ghost){const w=world(e),gh=$('#ghost',self.host);if(gh)gh.setAttribute('transform','translate('+w.x+' '+w.y+')');return;}
      if(moved>4){self.atFit=false;self.v.tx=start.tx+dx;self.v.ty=start.ty+dy;self.apply(true);}});
    const up=e=>{if(!Pm.has(e.pointerId))return;Pm.delete(e.pointerId);clearTimeout(lp);if(pinch){if(Pm.size<2)pinch=null;start=null;return;}const F=UI.floor;
      if(drag&&drag.edit){if(moved>3){drag.T.sec=secOf(drag.T);Act.layout(drag.T,'moved');toast(esc(drag.T.name)+' moved.');}else openEdit(drag.T);drag=null;start=null;return;}
      if(drag&&drag.ghost){const gh=$('#ghost',self.host);if(gh)gh.remove();const hit=document.elementFromPoint(e.clientX,e.clientY),tb=hit&&hit.closest&&hit.closest('.tb');drag=null;start=null;if(tb&&moved>12)tryMove(F.move,tb.dataset.id);else toast('Tap an open table to move the party there.');return;}
      if(start&&moved<8&&Date.now()-t0<600){const tb=downTb,w=world(e);
        if(tb){const id=tb.dataset.id;if(F.move)tryMove(F.move,id);else if(F.edit)openEdit(W.T[id]);else openTable(id);}
        else if(F.edit&&F.add){const T=Act.addTable(F.add,w.x,904-w.y);F.add=null;self.drawTables();self.update(true);toast(esc(T.name)+' added. Drag it into place.',{undo:()=>{Act.removeTable(T);self.drawTables();self.update(true);}});}
        else{const z=zoneAt(w.x,904-w.y);F.zone=z&&z!==F.zone?z:null;self.update(true);}}
      start=null;};
    el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
    el.addEventListener('wheel',e=>{e.preventDefault();const r=el.getBoundingClientRect(),cx=e.clientX-r.left,cy=e.clientY-r.top,L=self.lim(),k=clamp(self.v.k*(e.deltaY<0?1.15:.87),L.min,L.max);self.atFit=false;self.v={k,tx:cx-(cx-self.v.tx)*k/self.v.k,ty:cy-(cy-self.v.ty)*k/self.v.k};self.apply(true);},{passive:false});}
};
function zoneCard(id,s,p,zd){const Z=ZONES[id],t=s.t,inc=W.incidents.filter(x=>x.at<=t&&(x.zone===Z.l||(id==='plaza'&&/Gate/.test(x.zone))||(id==='pit'&&x.zone==='Pit')));
  let h='<div class="zc-h"><b>'+Z.l+'</b><button class="sh-x" data-act="zClose" aria-label="Close">'+I('x',18)+'</button></div>';
  const kv=[['For',Z.who],['Security',String(Z.sec)+(p==='pre'?' planned':' posted')],['Bars',Z.bars]];
  if(p!=='pre')kv.push(['Incidents logged',String(inc.length)]);
  if(p==='live'&&id==='plaza'&&s.gates)s.gates.filter(x=>x.g.id!=='G4').forEach(x=>kv.push([x.g.label,Math.round(x.rate)+' of '+x.g.cap+' scans a minute']));
  h+='<div class="kv">'+kv.map(r=>'<span>'+r[0]+'</span><b>'+esc(r[1])+'</b>').join('')+'</div>';
  if(inc.length&&p!=='pre')h+='<p class="zc-w">Last: '+esc(fT(inc[inc.length-1].at)+', '+inc[inc.length-1].note)+'</p>';
  h+='<p class="zc-w">How full a zone is isn’t measured. Staff on the floor log crowding here.</p>';
  if(p==='live'){h+='<div class="btnrow">'+(can('incident')?'<button class="btn xs" data-act="incNew" data-z="'+esc(Z.l)+'">'+I('flag',14)+'Log here</button>':'')+(id==='plaza'?'<button class="btn xs" data-act="mod" data-id="gates">'+I('gate',14)+'Gates</button>':'<button class="btn xs" data-act="mod" data-id="head">'+I('users',14)+'Through the gates</button>')+'</div>';}
  return h;}
ON.zClose=()=>{UI.floor.zone=null;Floor.update(true);};
ON.flFit=()=>{Floor.fit();Floor.paintTop();};
ON.flLeg=()=>{UI.floor.leg=UI.floor.leg===false;Floor._lk='';Floor.atFit=true;Floor.update(true);};
ON.flOv=el=>{UI.floor.overlay=el.dataset.k||null;UI.floor.promo=null;Floor.update(true);};
ON.flPromo=el=>{UI.floor.promo=UI.floor.promo===el.dataset.k?null:el.dataset.k;Floor.update(true);};
ON.flDens=()=>{UI.floor.dens=UI.floor.dens===false;Floor.update(true);};
ON.flSec=el=>{if(UI.floor.sec===el.dataset.k)Floor.fit();else Floor.zoomSec(el.dataset.k);Floor.paintTop();};
ON.flMoveX=()=>{UI.floor.move=null;Floor.update(true);};
ON.flEdit=()=>{const F=UI.floor;if(F.edit){F.edit=false;F.add=null;Floor.update(true);return;}const go=()=>{F.edit=true;F.zone=null;Floor.update(true);};if(W.layoutLocked)withPin('Unlock the layout to edit',m=>{W.layoutLocked=false;log('Layout unlocked','',m);bump();go();});else go();};
ON.flAdd=el=>{const F=UI.floor;F.add=F.add===el.dataset.k?null:el.dataset.k;Floor.paintTop();};
ON.flLock=()=>{W.layoutLocked=true;W.check.layout=now();log('Layout locked',W.tables.filter(T=>!T.oos).length+' tables');bump();UI.floor.edit=false;UI.floor.add=null;Sheet.close(true);Floor.update(true);toast('Layout locked for '+esc(W.ev.short)+'. Readiness updated.');};
ON.flTpl=()=>{log('Layout saved as template',W.ev.short+' layout, '+W.tables.filter(T=>!T.oos).length+' tables');bump();toast('Layout saved as a template for the next event.');};

/* ---------- layout editing: the pen's only job ---------- */
Act.addTable=(tier,x,z)=>{const n=(W._addN=(W._addN||0)+1),pre={bsA:'BA',bsB:'BB',bsC:'BC',vip:'VX',plat:'PX',gold:'GX',silver:'SX'}[tier],id=pre+(90+n),Tr=TIERS[tier];
  const T={id,tier,x:Math.round(x*2)/2,z:Math.round(z*2)/2,o:'',cap:Tr.cap,min:Tr.min,grp:Tr.grp,oos:false,added:1};T.name=tableName(id);T.sec=secOf(T);T.ox=T.x;T.oz=T.z;W.tables.push(T);W.T[id]=T;log('Layout edit','Added '+T.name);bump();return T;};
Act.removeTable=T=>{const i=W.tables.indexOf(T);if(i<0)return;W.tables.splice(i,1);T.removed=1;log('Layout edit','Removed '+T.name);bump();return i;};
function openEdit(T){const busy=()=>{const e=S().ix[T.id];return e&&(e.st==='booked'||e.st==='requested')?e:null;};
  Sheet.open({modal:UI.device==='atlas',title:()=>'Edit '+esc(T.name),sub:()=>esc(TIERS[T.tier].label)+' · seats '+N(T.cap)+' · '+N(aed(T.min))+' minimum',
    body:()=>{const e=busy(),hd=S().ix[T.id];return (e?'<div class="banner warn">'+I('lock',17)+'<span><b>Booked by '+esc(gName(e.b.booker))+'.</b> Move the party before removing this table.</span></div>':hd&&hd.st==='held'?'<div class="banner neu">'+I('lock',17)+'<span>Held for '+esc(hd.h.who)+'. Removing it releases the hold.</span></div>':'')+
      '<p class="note">Drag the table on the plan to move it. Changes apply to '+esc(W.ev.short)+' only. Save the layout as a template after the event to reuse it.</p>';},
    foot:()=>{const e=busy();return '<div class="btnrow"><button class="btn sm" data-act="tOos" data-id="'+T.id+'">'+(T.oos?'Back in service':'Out of service')+'</button><button class="btn sm" data-act="tMerge" data-id="'+T.id+'">'+(T.merged?'Split':'Merge with next')+'</button></div>'+
      '<button class="btn sm full bad" data-act="tRemove" data-id="'+T.id+'" '+(e?'disabled':'')+'>'+I('minus',16)+'Remove from layout</button>';}});}
ON.tRemove=el=>{const T=W.T[el.dataset.id],hd=S().ix[T.id];if(hd&&hd.st==='held')Act.releaseHold(hd.h);W.waitlist.forEach(w=>{if(w.table===T.id){w.offered=0;w.table=null;}});const i=Act.removeTable(T);Sheet.close();Floor.drawTables();Floor.update(true);
  toast(esc(T.name)+' removed.',{undo:()=>{W.tables.splice(i,0,T);T.removed=0;log('Layout edit','Restored '+T.name);bump();Floor.drawTables();Floor.update(true);}});};

/* ---------- table sheet ---------- */
ON.table=el=>{const id=el.dataset.id;if(!canTables()){toast('Table details are for hosts and managers.');return;}if(UI.device==='hand'&&UI.tab!=='floor'){Sheet.close(true);UI.floor.open=id;UI.floor.focus=W.T[id].sec;setTab('floor');return;}if(UI.device==='atlas'&&UI.atlas!=='floor'){Sheet.close(true);UI.floor.open=id;UI.floor.focus=W.T[id].sec;UI.atlas='floor';Atlas.render();return;}Sheet.close(true);Floor.zoomTable(id);openTable(id);};
function minBar(m){const tot=Math.max(m.min,m.spend,1);return '<div class="meter" style="height:12px"><i class="pre" style="width:'+(m.preCredit/tot*100).toFixed(1)+'%;border-radius:5px 0 0 5px"></i><i style="left:'+(m.preCredit/tot*100).toFixed(1)+'%;width:'+(m.live/tot*100).toFixed(1)+'%;border-radius:0"></i><em style="left:'+Math.min(99.4,m.min/tot*100).toFixed(1)+'%"></em></div>'+
  '<div class="leg" style="margin-top:8px"><span><i class="sw-g2"></i>Pre-ordered '+AK(m.preCredit)+'</span><span><i class="sw-au"></i>Ordered tonight '+AK(m.live)+'</span><span>Minimum '+AK(m.min)+'</span></div>';}
function openTable(id){if(!canTables()){toast('Table details are for hosts and managers.');return;}const T=W.T[id],F=UI.floor;F.sel=id;F.zone=null;Floor.update(true);
  Sheet.open({tall:false,title:()=>esc(T.name),sub:()=>{const e=S().ix[id];return esc(SECTIONS[T.sec].label)+' · seats '+N(T.cap)+' · '+(TIERS[T.tier].req&&!(e&&e.b)?'minimum on request':N(aed(e&&e.b&&e.st==='booked'?e.b.min:T.min))+' minimum');},
    onClose:()=>{F.sel=null;Floor.update(true);},
    body:()=>tableBody(T),foot:()=>tableFoot(T)});}
function tableBody(T){const s=S(),p=phase(),t=p==='post'&&UI.floor.replay!=null?UI.floor.replay:now(),e=s.ix[T.id],st=p==='post'?T._st:(T.oos?'oos':!e?'open':e.st==='booked'?(p==='pre'?'booked':T._st):e.st);
  let h='<div class="tsh"><div class="tc '+({seated:'g',above:'g',partial:'a',below:'a',expected:'a',requested:'a',held:'m',noshow:'r',booked:'au',open:'m',unsold:'m',oos:'m'}[st]||'m')+'">'+shortId(T.id)+'</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+(st==='booked'?tag('neu','check','Booked'):pill(st))+tag('mut',null,TIERS[T.tier].label)+(e&&e.b&&e.b.vip?tag('neu','star','VIP'):'')+(e&&e.b&&e.b.comp?tag('mut',null,'Comp'):'')+'</div></div>';
  if(T.oos)return h+'<p class="note">Out of service for this event. It is hidden from guests.</p>';
  if(!e){const wl=W.waitlist.filter(w=>w.at<=t&&!w.offered&&w.grp===T.grp&&w.budget>=T.min*.8).sort((a,b)=>G(b.g).crm-G(a.g).crm).slice(0,2);
    return h+'<p class="note">Open. '+(p==='post'?'It did not sell for this event.':'Book it for a guest, hold it, or offer it to the waitlist.')+'</p>'+(wl.length&&p!=='post'?'<div class="grp"><div class="lbl">Waitlist matches</div><div class="rows">'+wl.map(w=>row(initials(gName(w.g)),G(w.g).crm===2?'neu':'',esc(gName(w.g))+' · party of '+N(w.party),'Budget '+N(aedK(w.budget))+' · '+crmLabel(G(w.g)),'<button class="btn xs pri" data-act="offer" data-w="'+w.id+'" data-t="'+T.id+'">Offer</button>')).join('')+'</div></div>':'');}
  if(e.st==='held'){const hd=e.h;return h+'<div class="hud" style="padding:14px"><div class="kv"><span>Hold</span><b>'+esc(hd.kind)+'</b><span>For</span><b>'+esc(hd.who)+'</b><span>Releases in</span><b class="n">'+fDur(hd.until-t)+'</b><span>Until</span><b class="n">'+fDT(hd.until)+'</b></div></div><div class="btnrow"><button class="btn sm" data-act="holdExt" data-h="'+hd.id+'">Extend 24h</button><button class="btn sm" data-act="holdRel" data-h="'+hd.id+'">Release now</button></div>';}
  const b=e.b,gst=G(b.booker);
  if(e.st==='requested')return h+'<div class="hud" style="padding:14px"><div class="kv"><span>Requested by</span><b>'+esc(gst.n)+'</b><span>Standing</span><b>'+crmLabel(gst)+', '+N(gst.v)+' visits</b><span>Party</span><b class="n">'+b.party+'</b><span>Asked</span><b class="n">'+fAgo(t-b.reqAt)+'</b><span>Proposed minimum</span><b>'+A(b.min)+'</b></div></div><div class="btnrow"><button class="btn sm ok" data-act="reqOk" data-b="'+b.id+'">'+I('check',16)+'Confirm</button><button class="btn sm" data-act="reqNo" data-b="'+b.id+'">Decline</button></div>';
  const m=money(b,t),c=seatCounts(b,t),late=t>b.arriveBy+VENUE.graceMin*MIN,cf=W.rules.filter(r=>r.a===b.booker||r.b===b.booker);
  h+='<div class="hud" style="padding:14px"><div class="kv"><span>Booker</span><b><button data-act="guest" data-g="'+b.booker+'" class="gold" style="font-weight:700">'+esc(gst.n)+'</button></b><span>Host</span><b>'+esc(b.host)+'</b><span>Source</span><b>'+esc(SRC[b.src].label)+'</b><span>Party</span><b class="n">'+b.party+(b.party>T.cap?' ('+(b.party-T.cap)+' extra)':'')+'</b><span>'+(p==='pre'?'Arrive by':'Arrive by')+'</span><b class="n">'+fT(b.arriveBy)+'</b></div></div>';
  if(b.note)h+='<div class="banner neu">'+I('note',16)+'<span>'+esc(b.note)+'</span></div>';
  if(gst.prefs)h+='<div class="banner">'+I('star',16)+'<span><b>'+esc(gst.n.split(' ')[0])+':</b> '+esc(gst.prefs.join('. '))+'</span></div>';
  cf.forEach(r=>{const o=r.a===b.booker?r.b:r.a,ob=W.bookings.find(x=>bActive(x,t)&&x.booker===o);if(ob)h+='<div class="banner '+(r.kind==='apart'?'warn':'ok')+'">'+I(r.kind==='apart'?'alert':'users',16)+'<span><b>'+(r.kind==='apart'?'Keep apart from ':'Seat near ')+esc(gName(o))+'</b> at '+esc(W.T[tableAt(ob,t)].name)+'. '+esc(r.why)+'</span></div>';});
  /* money */
  if(!b.comp&&!isOn('pay'))h+=gapBar({part:[FEEDS[4]],full:[]});
  if(!b.comp&&isOn('pay')){h+='<div class="grp"><div class="lbl">'+(p==='pre'?'Minimum and pre-orders':'Spend against minimum')+'</div>'+(p!=='pre'&&!isOn('pos')?gapBar({part:[FEEDS[8]],full:[]}):'')+minBar(m)+'<div class="kv" style="margin-top:4px"><span>Paid before doors</span><b>'+A(m.collected)+'</b>'+(m.depDue?'<span class="warn">Deposit not paid on the invitation</span><b class="warn">'+A(m.depDue)+'</b>':'')+'<span>'+(p==='pre'?'Due on the night':m.balance?'Check open in the POS':m.settled?'Check closed '+fT(b.payAt):'Check')+'</span><b class="'+(m.balance&&p!=='pre'?'warn':'')+'">'+A(m.balance||m.settled)+'</b>'+(m.saved?'<span>Saved by pre-ordering</span><b>'+A(m.saved)+'</b>':'')+'</div></div>';}
  /* seats */
  h+='<div class="grp"><div style="display:flex;justify-content:space-between;align-items:center"><span class="lbl">Guests · '+(p==='pre'?N(c.claimed)+' of '+N(b.party)+' claimed':N(c.seated)+' seated, '+N(c.arr)+' at the gate, '+N(b.party-c.present)+' not in')+' · '+(b.comp?'comp':bSplit(b)?'deposit split by seat':'booker pays the deposit')+'</span>'+(p==='pre'&&c.claimed<b.party&&isOn('wa')?'<button class="btn xs" data-act="nudge" data-b="'+b.id+'">'+I('bell',14)+'Nudge</button>':'')+'</div>'+
    b.seats.map((x,i)=>{const sg=x.g>=0?W.guests[x.g]:null,ss=seatStatus(b,x,t,p),ps=payState(b,i,t,p);
      return '<'+(sg?'button class="seatc tap" data-act="guest" data-g="'+x.g+'"':'div class="seatc"')+'><div class="sn '+ss.c+'">'+x.n+'</div><div class="sw"><b'+(sg?'':' class="mut"')+'>'+(sg?esc(sg.n):'Not claimed yet')+(sg&&x.g===b.booker&&!bSplit(b)?'<i class="pyr" title="Booker">'+I('card',11)+'</i>':'')+'</b><span>'+esc(ss.l)+(sg?' · '+crmLabel(sg)+(isOn('hist')&&sg.v?', '+sg.v+' visits':''):' · claim link with the booker')+'</span></div>'+payTag(ps)+'</'+(sg?'button':'div')+'>';}).join('')+'</div>';
  if(!UI.flags.posSeat&&p!=='pre')h+='<p class="note">POS lines are not bound to seats, so ordered spend is shown for the table only.</p>';
  if(p!=='pre'){const arr=b.seats.filter(x=>x.ar&&x.ar<=t),od=b.orders.filter(o=>o.at<=t),span=W.C-W.D,px=v=>clamp((v-W.D)/span*100,0,100).toFixed(1);
    h+='<div class="grp"><div class="lbl">Arrival and order timeline</div><div class="tline"><div class="ax"></div>'+arr.map(x=>'<i style="left:'+px(x.ar)+'%"></i>').join('')+od.map(o=>'<i class="o" style="left:'+px(o.at)+'%"></i>').join('')+'<em style="left:'+px(b.arriveBy)+'%"></em>'+[0,2,4,6].map(hh=>'<span style="left:'+(hh*HOUR/span*100).toFixed(1)+'%">'+fT(W.D+hh*HOUR)+'</span>').join('')+'</div><div class="leg" style="margin-top:0"><span><i class="sw-ok" style="border-radius:50%"></i>Guest in</span><span><i class="sw-au"></i>Order</span><span><i style="width:2px;background:var(--t1)"></i>Arrive by</span></div></div>';
    if(od.length&&isOn('pos'))h+='<div class="grp"><div class="lbl">Orders and fulfilment</div><div class="rows">'+od.slice().reverse().slice(0,8).map(o=>{const done=o.del&&o.del<=t,i=b.orders.indexOf(o);return row(o.pre?'star':'glass',done?'':'warn',esc(o.nm)+(o.comp?' · comp':o.pre?' · pre-order':''),N(fT(o.at))+' · runner '+esc(o.runner)+(done?' · delivered in '+N(Math.round((o.del-o.at)/MIN))+' min':' · on its way, '+N(fDur(t-o.at))),done?'<b class="n">'+(o.comp?'0':kfmt(o.amt))+'</b>':(can('deliver')?'<button class="btn xs ok" data-act="deliver" data-b="'+b.id+'" data-i="'+i+'">Delivered</button>':tag('warn','run','Running')));}).join('')+'</div></div>';
    const sv=W.svc.filter(r=>r.b===b&&r.at<=t&&!r.op&&r.res>t);if(sv.length)h+='<div class="grp"><div class="lbl">Table requests</div><div class="rows">'+sv.map(r=>row('bell','warn',esc(r.kind),N(fDur(t-r.at))+' ago','<button class="btn xs ok" data-act="svcDone" data-r="'+r.id+'">Done</button>')).join('')+'</div></div>';
    if(b.moves.length)h+='<div class="grp"><div class="lbl">Seating changes</div><div class="rows">'+b.moves.filter(x=>x.at<=t).map(x=>row('swap','',esc(W.T[x.from].name)+' to '+esc(W.T[x.to].name),esc(x.why)+' · '+esc(x.by),N(fT(x.at)))).join('')+'</div></div>';}
  if(p==='post')h+='<div class="grp"><div class="lbl">Host note for next time</div><div style="display:flex;gap:8px"><input class="inp" id="gnote" placeholder="What should we know next visit?"><button class="btn pri" data-act="addNoteT" data-g="'+b.booker+'" aria-label="Save note">'+I('check',18)+'</button></div></div>';
  return h;}
function tableFoot(T){const s=S(),p=phase(),e=s.ix[T.id],t=now(),F=UI.floor;if(p==='post')return e&&e.st==='booked'?'<div class="btnrow"><button class="btn sm" data-act="sendLinks" data-b="'+e.b.id+'">'+I('send',16)+'Send thank-you</button><button class="btn sm" data-act="chTeam" data-id="'+T.id+'">'+I('msg',16)+'Message team</button></div>':'';
  if(T.oos)return '';
  if(!e)return can('book')?'<button class="btn pri full" data-act="bookOpen" data-id="'+T.id+'">'+I('plus',18)+'Book table</button>'+(p==='pre'&&UI.role==='owner'?'<button class="btn sm full" data-act="holdNew" data-id="'+T.id+'">'+I('lock',16)+'Hold this table</button>':''):'';
  if(e.st!=='booked')return '';const b=e.b,m=money(b,t),c=seatCounts(b,t);let h='';
  if(p==='live'){if(c.arr&&can('seat'))h+='<button class="btn ok full" data-act="seatAll" data-b="'+b.id+'">'+I('check',18)+'Seat '+c.arr+' waiting guest'+(c.arr>1?'s':'')+'</button>';
    if(m.balance>0&&can('collect')&&t>W.C-70*MIN)h+='<button class="btn full" data-act="collect" data-b="'+b.id+'">'+I('card',18)+'Check open · '+aed(m.balance)+'</button>';
    h+='<div class="btnrow">'+(can('move')?'<button class="btn sm" data-act="moveFrom" data-b="'+b.id+'">'+I('swap',16)+'Move party</button>':'')+(UI.role==='owner'?'<button class="btn sm" data-act="compOpen" data-b="'+b.id+'">'+I('lock',16)+'Comp</button><button class="btn sm" data-act="relB" data-b="'+b.id+'">Release</button>':'')+'</div>';}
  else h+='<div class="btnrow">'+(m.depDue?'<button class="btn sm" data-act="chase" data-b="'+b.id+'">'+I('msg',16)+'Remind deposit</button>':'')+'<button class="btn sm" data-act="moveFrom" data-b="'+b.id+'">'+I('swap',16)+'Move party</button>'+(UI.role==='owner'?'<button class="btn sm" data-act="relB" data-b="'+b.id+'">'+I('lock',16)+'Release</button>':'')+'</div>';
  h+='<div class="btnrow"><button class="btn sm" data-act="sendLinks" data-b="'+b.id+'">'+I('send',16)+'Send links</button><button class="btn sm" data-act="chTeam" data-id="'+T.id+'">'+I('msg',16)+'Message team</button></div>';
  return h;}
ON.seatOne=el=>{const s=W.byRef[el.dataset.r];Act.seatOne(s);haptic(15);refresh(true);};
ON.addNoteT=el=>{const inp=$('#gnote',Sheet.top().el),v=inp&&inp.value.trim();if(!v)return;Act.note(+el.dataset.g,v);inp.value='';toast('Note saved to the guest card.');};
ON.tOos=el=>{const T=W.T[el.dataset.id];T.oos=!T.oos;Act.layout(T,T.oos?'out of service':'back in service');Sheet.close();Floor.update(true);toast(esc(T.name)+(T.oos?' is out of service and hidden from guests.':' is back in service.'));};
ON.tMerge=el=>{const T=W.T[el.dataset.id];if(T.merged){const o=W.T[T.merged];o.oos=false;T.cap-=o.cap;T.min-=o.min;T.merged=null;T.wide=1;Act.layout(T,'split from '+o.name);}
  else{const s=S(),o=W.tables.filter(x=>x!==T&&x.tier===T.tier&&!x.oos&&!s.ix[x.id]&&!x.merged).sort((a,b)=>Math.hypot(a.x-T.x,a.z-T.z)-Math.hypot(b.x-T.x,b.z-T.z))[0];if(!o||Math.hypot(o.x-T.x,o.z-T.z)>40||s.ix[T.id]){toast('No free neighbouring table to merge with.');return;}o.oos=true;T.cap+=o.cap;T.min+=o.min;T.merged=o.id;T.wide=1.5;Act.layout(T,'merged with '+o.name+', seats '+T.cap);}
  Floor.drawTables();Floor.update(true);Sheet.close();};
ON.holdNew=el=>{const T=W.T[el.dataset.id];let kind='VIP hold',hrs=24;const o=Sheet.open({title:'Hold '+esc(T.name),static:true,body:()=>'<div class="grp"><div class="lbl">Held for</div><div class="seg">'+['VIP hold','Promoter hold','Artist hold','House hold'].map(k=>'<button class="'+(kind===k?'on':'')+'" data-act="hK" data-k="'+k+'">'+k.replace(' hold','')+'</button>').join('')+'</div><input class="inp" id="hWho" placeholder="Name of the guest or promoter"></div><div class="grp"><div class="lbl">Release automatically after</div><div class="seg">'+[[2,'2 hours'],[24,'24 hours'],[72,'3 days'],[168,'7 days']].map(x=>'<button class="'+(hrs===x[0]?'on':'')+'" data-act="hH" data-h="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>',foot:()=>'<button class="btn pri full" data-act="hSave">Hold table</button>'});
  const keep=()=>{const v=$('#hWho',o.el).value;o._b=null;Sheet.paint(o);$('#hWho',o.el).value=v;};ON.hK=e=>{kind=e.dataset.k;keep();};ON.hH=e=>{hrs=+e.dataset.h;keep();};
  ON.hSave=()=>{const who=$('#hWho',o.el).value.trim()||actor();Act.hold(T,kind,who,hrs);Sheet.close();Sheet.refresh(true);toast(esc(T.name)+' held for '+esc(who)+'.');refresh(true);};};

/* ---------- move a party, with conflict checks ---------- */
ON.moveFrom=el=>{const b=bk(el.dataset.b);UI.floor.move=b;UI.floor.moveQ=el.dataset.q||null;Sheet.close(true);if(UI.device==='hand'&&UI.tab!=='floor'){UI.floor.focus=b.sec;setTab('floor');}else if(UI.device==='atlas'&&UI.atlas!=='floor'){UI.atlas='floor';Atlas.render();}else{Floor.zoomSec(b.sec);Floor.update(true);}};
function tryMove(b,toId){const T=W.T[toId],s=S(),e=s.ix[toId],t=now(),from=W.T[tableAt(b,t)];
  if(toId===from.id){return;}if(T.oos||(e&&e.st==='booked')||(e&&e.st==='requested')){toast(esc(T.name)+' is taken. Pick an open table.');haptic([20,30,20]);return;}
  const cf=conflicts(b.booker,toId),small=b.party>T.cap+VENUE.extraMax,cheaper=TIERS[T.tier].min<TIERS[from.tier].min,dearer=TIERS[T.tier].min>TIERS[from.tier].min;
  Sheet.open({modal:true,title:'Move to '+esc(T.name)+'?',sub:esc(gName(b.booker))+', party of '+b.party+', from '+esc(from.name),
    body:()=>(small?'<div class="banner bad">'+I('alert',17)+'<span><b>Too small.</b> '+esc(T.name)+' seats '+N(T.cap)+' plus '+N(VENUE.extraMax)+' extra.</span></div>':'')+
      cf.map(c=>c.hold?'<div class="banner warn">'+I('lock',17)+'<span><b>Held for '+esc(c.hold.who)+'.</b> Moving here releases the hold.</span></div>':'<div class="banner '+(c.bad?'bad':'warn')+'">'+I('alert',17)+'<span><b>'+(c.r.kind==='apart'?'Too close to ':'Far from ')+esc(gName(c.other))+'</b> at '+esc(c.OT.name)+'. '+esc(c.r.why)+'</span></div>').join('')+
      (dearer?'<div class="banner neu">'+I('tup',17)+'<span>Minimum goes from '+N(aed(TIERS[from.tier].min))+' to '+N(aed(TIERS[T.tier].min))+'. Keep the old minimum, or tell the guest.</span></div>':cheaper?'<div class="banner neu">'+I('tdown',17)+'<span>This is a lower tier. The booked minimum of '+N(aed(b.min))+' stays unless a manager discounts it.</span></div>':'')+
      (!small&&!cf.length&&!dearer&&!cheaper?'<div class="banner ok">'+I('check',17)+'<span>No conflicts. Same tier, table is free.</span></div>':''),
    foot:()=>'<div class="btnrow"><button class="btn" data-act="sheetClose">Cancel</button><button class="btn pri" data-act="moveGo" '+(small?'disabled':'')+'>Move party</button></div>'});
  ON.moveGo=()=>{cf.forEach(c=>{if(c.hold)Act.releaseHold(c.hold);});Act.move(b,toId,UI.floor.moveQ?'Guest request':null);if(UI.floor.moveQ){const q=W.queue.find(x=>x.id===UI.floor.moveQ);if(q){q.op=now();q.ok=true;}}UI.floor.move=null;UI.floor.moveQ=null;Sheet.close(true);haptic(20);
    toast(esc(gName(b.booker))+' moved to '+esc(T.name)+'. Host and guests are told.',{undo:()=>{b.moves.pop();log('Undid move',T.name);bump();refresh(true);}});refresh(true);};}

/* ---------- manual booking ---------- */
ON.bookOpen=el=>{const T=W.T[el.dataset.id],tr=TIERS[T.tier],live=phase()==='live';
  const F={guest:null,name:'',phone:'',q:'',party:Math.min(T.cap,live?6:T.cap),pay:live?'card':'link',mk:false,reason:'',srcKind:live?'walk':'phone',src:live?'door':'host',host:SECTIONS[T.sec].host,disc:0,links:true,minOv:null};
  const min=()=>F.minOv!=null?F.minOv:T.min+Math.max(0,F.party-T.cap)*tr.extra;
  const o=Sheet.open({title:'Book '+esc(T.name),sub:esc(tr.label)+' · seats '+T.cap+', up to '+VENUE.extraMax+' extra at '+aed(tr.extra)+' each',tall:true,static:true,
    body:()=>{const res=F.q.length>=2&&F.guest==null?W.guests.filter(x=>x.n.toLowerCase().includes(F.q.toLowerCase())||x.ph.replace(/\s/g,'').includes(F.q.replace(/\s/g,''))).slice(0,5):[],cf=F.guest!=null?conflicts(F.guest,T.id):conflicts(-9,T.id),mn=min(),net=Math.round(mn*(1-F.disc/100));
      return '<div class="grp"><div class="lbl">Guest</div>'+(F.guest!=null?'<div class="seatc"><div class="sn cl">'+initials(G(F.guest).n)+'</div><div><b>'+esc(G(F.guest).n)+'</b><span>'+crmLabel(G(F.guest))+' · '+N(esc(G(F.guest).ph))+'</span></div><button class="btn xs" data-act="bkClear">Change</button></div>'
        :'<label class="srch">'+I('search',18)+'<input id="bkQ" placeholder="Search by name or phone" autocomplete="off" value="'+esc(F.q)+'"></label><div class="rows" id="bkRes">'+res.map(x=>row(initials(x.n),x.crm===2?'neu':'',esc(x.n),crmLabel(x)+' · '+N(esc(x.ph)),'<button class="btn xs" data-act="bkPick" data-g="'+x.i+'">Select</button>')).join('')+'</div>'+
         '<div class="lbl" style="margin-top:4px">Or a new guest</div><input class="inp" id="bkName" placeholder="First and last name" value="'+esc(F.name)+'"><input class="inp" id="bkPhone" type="tel" placeholder="+971 50 000 0000" value="'+esc(F.phone)+'">')+'</div>'+
      '<div class="grp"><div class="lbl">Party size</div><div style="display:flex;align-items:center;gap:14px"><div class="step"><button data-act="bkParty" data-d="-1" aria-label="Fewer">'+I('minus',18)+'</button><b>'+F.party+'</b><button data-act="bkParty" data-d="1" aria-label="More">'+I('plus',18)+'</button></div><span class="note">'+(F.party>T.cap?N(F.party-T.cap)+' extra, +'+N(aed((F.party-T.cap)*tr.extra)):'Fits the table')+'</span></div></div>'+
      '<div class="grp"><div class="lbl">Minimum spend</div><div class="hud" style="padding:14px"><div class="kv"><span>'+esc(tr.label)+(tr.req?', set by you':'')+'</span><b>'+A(mn)+'</b>'+(F.disc?'<span>Discount '+F.disc+'%</span><b>−'+A(mn-net)+'</b><span>Guest pays at least</span><b class="gold">'+A(net)+'</b>':'')+'<span>Deposit now</span><b>'+(F.pay==='comp'?'None':A(Math.round(net*VENUE.depositPct)))+'</b></div></div>'+
        (tr.req?'<div class="seg">'+[30000,40000,50000,60000,80000].map(v=>'<button class="'+(mn===v?'on':'')+'" data-act="bkMin" data-v="'+v+'">'+kfmt(v)+'</button>').join('')+'</div>':'')+
        '<div class="seg">'+[0,5,10,15,20].map(v=>'<button class="'+(F.disc===v?'on':'')+'" data-act="bkDisc" data-v="'+v+'">'+(v?v+'% off':'No discount')+'</button>').join('')+'</div></div>'+
      '<div class="grp"><div class="lbl">Deposit</div><div class="seg">'+[['link','On the invitation'],['card','Venue terminal'],['comp','Comp']].map(x=>'<button class="'+(F.pay===x[0]?'on':'')+'" data-act="bkPay" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
        (F.pay==='comp'?'<input class="inp" id="bkReason" placeholder="Reason for the comp (required)" value="'+esc(F.reason)+'">':'<p class="note">'+({link:'The deposit sits on the guest’s invitation, the one link they get. The card is held, and the table shows unpaid until the deposit is secured.',card:'Take the deposit on the venue’s own card terminal, then confirm here. It is matched with the terminal at close-out.'}[F.pay])+'</p>')+'</div>'+
      '<div class="grp"><div class="lbl">Source</div><div class="seg">'+[['phone','Phone'],['walk','Walk-up'],['vip','VIP'],['promoter','Promoter']].map(x=>'<button class="'+(F.srcKind===x[0]?'on':'')+'" data-act="bkSrc" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
        (F.srcKind==='promoter'?'<div class="chips">'+SOURCES.filter(x=>x.comm).map(x=>'<button class="chip '+(F.src===x.id?'on':'')+'" data-act="bkProm" data-v="'+x.id+'">'+esc(x.label)+'</button>').join('')+'</div>':'')+'</div>'+
      '<div class="grp"><div class="lbl">Host</div><div class="chips">'+[SECTIONS[T.sec].host].concat(HOSTS.filter(x=>x!==SECTIONS[T.sec].host)).map(x=>'<button class="chip '+(F.host===x?'on':'')+'" data-act="bkHost" data-v="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div></div>'+
      '<div class="grp"><div class="lbl">Invitation</div><button class="row tap" data-act="bkLinks"><div class="ri '+(F.links?'ok':'')+'">'+I(F.links?'check':'minus',17)+'</div><div class="rt"><b>Send the invitation on WhatsApp</b><span>One link, sent once. The booker shares it with the table and each guest claims their own seat on it.</span></div><div class="ra">'+pill(F.links?'ok':'mut',F.links?'On':'Off')+'</div></button></div>'+
      (cf.length?cf.map(c=>c.hold?'<div class="banner warn">'+I('lock',17)+'<span><b>Held for '+esc(c.hold.who)+'</b> until '+N(fDT(c.hold.until))+'. Booking releases the hold.</span></div>':'<div class="banner '+(c.bad?'bad':'warn')+'">'+I('alert',17)+'<span><b>'+(c.r.kind==='apart'?'Keep apart from ':'Usually seated near ')+esc(gName(c.other))+'</b> at '+esc(c.OT.name)+'. '+esc(c.r.why)+'</span></div>').join(''):'<div class="banner ok">'+I('check',17)+'<span>No holds or seating rules in the way.</span></div>');},
    foot:()=>'<button class="btn pri full" data-act="bkGo">'+(F.pay==='comp'||F.disc?I('lock',17):'')+(F.pay==='comp'?'Comp this table':'Confirm booking · '+aed(Math.round(min()*(1-F.disc/100)))+' minimum')+'</button>',
    onOpen:el2=>{el2.addEventListener('input',e=>{const i=e.target;if(i.id==='bkQ'){F.q=i.value;const r=F.q.length>=2?W.guests.filter(x=>x.n.toLowerCase().includes(F.q.toLowerCase())||x.ph.replace(/\s/g,'').includes(F.q.replace(/\s/g,''))).slice(0,5):[];$('#bkRes',el2).innerHTML=r.map(x=>row(initials(x.n),x.crm===2?'neu':'',esc(x.n),crmLabel(x)+' · '+N(esc(x.ph)),'<button class="btn xs" data-act="bkPick" data-g="'+x.i+'">Select</button>')).join('');}
      else if(i.id==='bkName')F.name=i.value;else if(i.id==='bkPhone')F.phone=i.value;else if(i.id==='bkReason')F.reason=i.value;});}});
  const rp=()=>{o._b=null;o._f=null;Sheet.paint(o);};
  ON.bkPick=e=>{F.guest=+e.dataset.g;rp();};ON.bkClear=()=>{F.guest=null;rp();};ON.bkParty=e=>{F.party=clamp(F.party+(+e.dataset.d),1,T.cap+VENUE.extraMax);rp();};
  ON.bkMin=e=>{F.minOv=+e.dataset.v;rp();};ON.bkDisc=e=>{F.disc=+e.dataset.v;rp();};ON.bkPay=e=>{F.pay=e.dataset.v;rp();};ON.bkSrc=e=>{F.srcKind=e.dataset.v;F.src={phone:'host',walk:'door',vip:'host',promoter:'p1'}[F.srcKind];rp();};
  ON.bkProm=e=>{F.src=e.dataset.v;rp();};ON.bkHost=e=>{F.host=e.dataset.v;rp();};ON.bkLinks=()=>{F.links=!F.links;rp();};
  ON.bkGo=()=>{if(F.guest==null&&F.name.trim().length<3){toast('Pick a guest or enter a name.');return;}if(F.pay==='comp'&&F.reason.trim().length<3){toast('A comp needs a reason.');return;}
    const mn=Math.round(min()*(1-F.disc/100)),go=m=>{const hold=S().ix[T.id];if(hold&&hold.h)Act.releaseHold(hold.h);
      const b=Act.book({table:T.id,guest:F.guest,name:F.name.trim(),phone:F.phone.trim(),party:F.party,min:mn,pay:F.pay,payLabel:{link:'deposit on the invitation',card:'deposit on the venue terminal'}[F.pay],comp:F.pay==='comp',reason:F.reason.trim(),src:F.src,srcKind:F.srcKind,host:F.host,mgr:m,note:F.disc?F.disc+'% discount approved by '+m:''});
      Sheet.close(true);haptic([15,40,15]);toast(esc(T.name)+' booked for '+esc(gName(b.booker))+'.'+(F.links?' Invitation sent.':''),{undo:()=>{Act.unbook(b);refresh(true);toast('Booking undone.');}});refresh(true);};
    if(F.pay==='comp'||F.disc)withPin(F.pay==='comp'?'Comp '+T.name+': '+F.reason:F.disc+'% discount on '+T.name,go);else go(null);};};

/* ---------- the open check: read from the POS, settled on the venue's own terminals ---------- */
ON.collect=el=>{const b=bk(el.dataset.b),t=now(),T=W.T[tableAt(b,t)];
  Sheet.open({modal:UI.device==='atlas',title:'Check at '+esc(T.name),sub:esc(gName(b.booker))+' · host '+esc(b.host),
    body:()=>{const m=money(b,now()),paid=m.collected-m.prePaid;return '<div class="hud" style="padding:16px;text-align:center"><div class="lbl">Still to settle</div><div class="big n" style="margin-top:6px">'+aed(m.balance)+'</div><p class="note" style="margin-top:8px">Check '+N(aed(m.due))+' in the POS, less '+N(aed(paid))+' deposit'+(b.disc?' and '+N(aed(b.disc))+' discount':'')+'. Below the minimum, the POS charges the minimum.</p></div>'+
      '<div class="kv"><span>Minimum</span><b>'+A(m.min)+'</b><span>Ordered tonight</span><b>'+A(m.live)+'</b><span>Pre-ordered</span><b>'+A(m.preCredit)+'</b><span>Deposit paid</span><b>'+A(paid)+'</b></div>'+
      '<div class="banner neu">'+I('card',17)+'<span>The bill is settled on the venue’s own card terminal, as it is today. BUBL reads the check from the POS and marks the table closed when the POS closes it.</span></div>';},
    foot:()=>'<button class="btn pri full" data-act="chTeam" data-id="'+T.id+'">'+I('msg',18)+'Message '+esc(b.host.split(' ')[0])+'</button>'});};
ON.compOpen=el=>{const b=bk(el.dataset.b),T=W.T[tableAt(b,now())];let kind='comp',item=0,amt=1000,why='';
  const o=Sheet.open({modal:UI.device==='atlas',title:'Comp or discount',sub:esc(T.name)+' · '+esc(gName(b.booker)),static:true,
    body:()=>'<div class="seg"><button class="'+(kind==='comp'?'on':'')+'" data-act="cpK" data-v="comp">Comp an item</button><button class="'+(kind==='disc'?'on':'')+'" data-act="cpK" data-v="disc">Discount the bill</button></div>'+
      (kind==='comp'?'<div class="chips">'+MENU.bottles.slice(0,7).map((x,i)=>'<button class="chip '+(item===i?'on':'')+'" data-act="cpI" data-v="'+i+'">'+esc(x[0])+' '+N(kfmt(x[1]))+'</button>').join('')+'</div>':'<div class="seg">'+[500,1000,2500,5000].map(v=>'<button class="'+(amt===v?'on':'')+'" data-act="cpA" data-v="'+v+'">'+aed(v)+'</button>').join('')+'</div>')+
      '<input class="inp" id="cpWhy" placeholder="Reason (required, goes in the audit log)" value="'+esc(why)+'">',
    foot:()=>'<button class="btn pri full" data-act="cpGo">'+I('lock',17)+'Approve with Manager PIN</button>',onOpen:e2=>e2.addEventListener('input',e=>{if(e.target.id==='cpWhy')why=e.target.value;})});
  const rp=()=>{o._b=null;Sheet.paint(o);};ON.cpK=e=>{kind=e.dataset.v;rp();};ON.cpI=e=>{item=+e.dataset.v;rp();};ON.cpA=e=>{amt=+e.dataset.v;rp();};
  ON.cpGo=()=>{if(why.trim().length<3){toast('Add a reason first.');return;}withPin(kind==='comp'?'Comp '+MENU.bottles[item][0]:'Discount '+aed(amt),m=>{if(kind==='comp')Act.comp(b,MENU.bottles[item],m,why.trim());else Act.discount(b,amt,m,why.trim());Sheet.close();toast((kind==='comp'?esc(MENU.bottles[item][0])+' comped':N(aed(amt))+' discounted')+'. Logged under '+esc(m)+'.');refresh(true);});};};
