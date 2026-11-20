/* =====================================================================
   THE WIZARD
   ===================================================================== */
function paBlank(kind){const ex=kind==='exclusive',B=CFG.PA_BLANK[ex?'exclusive':'promoter'];   /* a new access starts from the venue's own defaults, if it has any */
  return {id:null,src:null,name:'',company:'',ph:'',email:'',licence:'',kind:kind||'promoter',events:[W.ev.id],tmode:ex?'sec':'tab',secs:ex?SEC_ORDER.filter(k=>SECTIONS[k].grp!=='bs'):[],tables:[],cap:B.cap,
  tix:Object.assign({},B.tix),list:B.list,rates:Object.assign({},B.rates),one:false,barBase:'over',payDays:B.payDays,release:B.release,settle:B.settle,notice:B.notice,law:'dxb',extra:[],ovr:{},removed:{},chg:{},status:'draft',ver:1,zoom:null,agent:[]};}
function paWizard(a,step){const d=a?JSON.parse(JSON.stringify(a)):paBlank('promoter');d._edit=!!a;d.chg={};d.agent=[];d.zoom=null;d.drafted=!!a;
  if(!a)paClampTix(d);
  PA.d=d;PA.step=step||0;
  PA.o=Sheet.open({tall:true,static:true,title:()=>d._edit?'Change '+esc(paSrcLabel(d))+'’s access':'New promoter access',sub:()=>esc(PA_STEPS[PA.step][1])+' · step '+(PA.step+1)+' of '+PA_STEPS.length,
    body:()=>'<div class="pa-wz">'+paStepsHTML()+paBody()+'</div>',foot:()=>paFoot(),onPaint:el=>paBind(el),onClose:()=>{PA.d=null;PA.o=null;}});}
function paRe(keepScroll){const o=PA.o;if(!o)return;o._b=null;o._f=null;Sheet.paint(o);if(!keepScroll){const b=$('.sh-body',o.el);if(b)b.scrollTop=0;}}
function paStepsHTML(){return '<div class="pa-steps">'+PA_STEPS.map((s,i)=>'<button class="'+(i===PA.step?'on':i<PA.step?'done':'')+'" data-act="paGo" data-i="'+i+'"><i></i>'+s[1]+'</button>').join('')+'</div>';}
function paFoot(){const last=PA.step===PA_STEPS.length-1,d=PA.d;
  if(d&&d._sent)return '<button class="btn pri full" data-act="paDone">Done</button>';
  return '<div style="display:grid;grid-template-columns:'+(PA.step?'auto 1fr':'1fr')+';gap:8px">'+(PA.step?'<button class="btn" data-act="paBack" aria-label="Back">'+I('left',18)+'</button>':'')+
    (last?'<button class="btn pri" data-act="paSend">'+I('lock',17)+(d._edit?'Sign and send the new version':'Sign and send')+'</button>':'<button class="btn pri" data-act="paNext">'+(PA.step===3?'Draft the agreement':'Next: '+PA_STEPS[PA.step+1][1])+I('right',17)+'</button>')+'</div>';}
function paCheck(i){const d=PA.d;
  if(i===0){if(String(d.name).trim().length<2)return 'Add the promoter’s name.';if(d.kind==='exclusive'&&String(d.company).trim().length<2)return 'Add the event company’s name.';if(!d.events.length)return 'Pick at least one event.';}
  if(i===2){const L=paTixLeft(d),o=PA_TK.find(k=>(d.tix[k]||0)>L[k].left);if(o)return 'More '+GA[PA_TK.indexOf(o)].label+' tickets than are left to give. Lower it to '+n0(L[o].left)+'.';}
  if(i===1){const p=paPool(d);if(d.tmode==='tab'&&!d.tables.length)return 'Pick at least one table, or switch to sections.';if(d.tmode==='sec'&&!d.secs.length)return 'Pick at least one section.';if(d.tmode==='sec'&&!p.length)return 'Those sections have no open tables.';}
  return null;}
ON.paNext=()=>{const e=paCheck(PA.step);if(e){toast(e);return;}PA.step++;if(PA_STEPS[PA.step][0]==='contract'&&!PA.d.drafted)paDraft();paRe();};
ON.paBack=()=>{PA.step=Math.max(0,PA.step-1);paRe();};
ON.paGo=el=>{const i=+el.dataset.i;if(i>PA.step){for(let k=PA.step;k<i;k++){const e=paCheck(k);if(e){toast(e);return;}}}PA.step=i;if(PA_STEPS[i][0]==='contract'&&!PA.d.drafted)paDraft();paRe();};
function paDraft(){const d=PA.d;d.drafting=true;d.agent=[{me:0,t:'I drafted this from the terms you set. Tell me what to change, in your own words.'}];setTimeout(()=>{d.drafting=false;d.drafted=true;if(PA.d===d&&PA_STEPS[PA.step][0]==='contract')paRe(true);},1100);}
function paBody(){const d=PA.d;return ({who:paWho,tables:paTables,tickets:paTickets,cut:paCut,contract:paContract,send:paSendStep})[PA_STEPS[PA.step][0]](d);}
function paBind(el){$$('[data-pk]',el).forEach(i=>i.addEventListener('input',()=>{const k=i.dataset.pk,d=PA.d;if(!d)return;
  if(k==='offFloor'){paOff(d).floor=Math.max(0,parseInt(i.value.replace(/\D/g,''))||0);return;}
  if(k==='tix'){d.tix[i.dataset.t]=Math.max(0,parseInt(i.value.replace(/\D/g,''))||0);paLiveBits();return;}
  if(k==='list'||k==='cap'){d[k]=Math.max(0,parseInt(i.value.replace(/\D/g,''))||0);paLiveBits();return;}
  if(k==='rate'){d.rates[i.dataset.t]=parseFloat(i.value);if(d.one&&i.dataset.t==='tix'){}const o=$('#paRv_'+i.dataset.t,el);if(o)o.innerHTML=paPct(d.rates[i.dataset.t]).replace('%','<small>%</small>');paLiveBits();return;}
  d[k]=i.value;if(k==='name'||k==='company'){const t=$('.sh-hd h3',PA.o.el);}}));
  const ask=$('#paAsk',el);if(ask)ask.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ON.paAsk();}});
  const ag=$('#paAg',el);if(ag)ag.scrollTop=ag.scrollHeight;}
function paLiveBits(){const d=PA.d,el=PA.o&&PA.o.el;if(!el)return;const e=paEstimate(d);
  const set=(id,h)=>{const x=$('#'+id,el);if(x)x.innerHTML=h;};
  set('paEstPay',kfmt(e.pay)+'<small>AED</small>');set('paEstRev',A(e.rev));set('paEstTix',A(e.pTix));set('paEstTab',A(e.pTab));set('paEstBar',A(e.pBar));
  const left=paTixLeft(d);PA_TK.forEach(k=>{const b=$('#paTb_'+k,el);if(b){const L=left[k].left;b.style.width=Math.min(100,(d.tix[k]||0)/Math.max(1,L)*100)+'%';const w=$('#paTw_'+k,el);if(w)w.innerHTML=(d.tix[k]>L?'<b style="color:var(--bad)">Over by '+n0(d.tix[k]-L)+'</b> · ':'')+n0(L)+' left to allocate';}});}

/* ---------- step 1: who ---------- */
function paWho(d){const evs=paEvs(),known=SOURCES.filter(s=>s.grp==='promoter'&&!paAll().some(a=>a.src===s.id&&a.status!=='revoked'&&a.events.some(id=>d.events.includes(id))));
  const exOther=d.events.map(id=>paExclusive(id)).find(x=>x&&x.id!==d.id),others=d.kind==='exclusive'?sum(d.events,id=>paLive(id).filter(a=>a.id!==d.id&&a.kind!=='exclusive').length):0;
  return '<div class="pa-kind"><button class="'+(d.kind==='promoter'?'on':'')+'" data-act="paKind" data-k="promoter"><em></em>'+I('user',20)+'<b>Promoter</b><span>Sells part of the room alongside the house and other promoters.</span></button>'+
    '<button class="'+(d.kind==='exclusive'?'on':'')+'" data-act="paKind" data-k="exclusive"><em></em>'+I('star',20)+'<b>Exclusive</b><span>One event company runs promoter sales for the whole event.</span></button></div>'+
    (exOther?'<div class="pa-warn">'+I('alert',18)+'<div><b>'+esc(paSrcLabel(exOther))+'</b> already has '+esc(EVK[exOther.events[0]].short)+' exclusively. Access you send for it will start paused.</div></div>':'')+
    (others?'<div class="pa-warn">'+I('alert',18)+'<div>Sending this pauses <b>'+others+' promoter '+(others===1?'access':'accesses')+'</b> for '+esc(d.events.map(id=>EVK[id].short).join(', '))+'. Bookings they’ve already made still count and still earn.</div></div>':'')+
    (known.length&&!d._edit&&d.kind==='promoter'?'<div class="grp"><div class="lbl">Already selling for you</div><div class="pa-known">'+known.map(s=>'<button class="chip '+(d.src===s.id?'on':'')+'" data-act="paKnown" data-k="'+s.id+'"><span class="av">'+esc(initials(s.label))+'</span>'+esc(s.label)+'</button>').join('')+'</div></div>':'')+
    '<div class="pa-fld"><label>'+(d.kind==='exclusive'?'Contact name':'Name')+'</label><input class="inp" data-pk="name" value="'+esc(d.name)+'" placeholder="'+(d.kind==='exclusive'?'Who signs for the company':'Full name')+'" autocomplete="off" maxlength="50"></div>'+
    '<div class="pa-fld"><label>Company '+(d.kind==='exclusive'?'':'<span>· optional</span>')+'</label><input class="inp" data-pk="company" value="'+esc(d.company)+'" placeholder="Event company or agency" autocomplete="off" maxlength="60"></div>'+
    '<div class="pa-two"><div class="pa-fld"><label>WhatsApp</label><input class="inp" data-pk="ph" value="'+esc(d.ph)+'" inputmode="tel" placeholder="+971 5…" maxlength="20"></div><div class="pa-fld"><label>Trade licence <span>· optional</span></label><input class="inp" data-pk="licence" value="'+esc(d.licence)+'" placeholder="DED …" maxlength="30"></div></div>'+
    '<div class="pa-fld"><label>Email <span>· for the signed copy</span></label><input class="inp" data-pk="email" value="'+esc(d.email)+'" inputmode="email" placeholder="name@company.com" maxlength="60"></div>'+
    '<div class="grp"><div class="lbl">Events</div><div class="pa-evs">'+evs.map(e=>'<button class="chip '+(d.events.includes(e.id)?'on':'')+'" data-act="paEv" data-k="'+e.id+'" '+(e.id===W.ev.id&&d.events.length===1&&d.events[0]===e.id?'':'')+'>'+esc(e.short)+'<small>'+fD(e.doors)+'</small></button>').join('')+'</div>'+
    (d.events.length>1?'<p class="note">Tables are picked on '+esc(W.ev.short)+'’s floor and held the same way for each event you add. Ticket allocations apply per event.</p>':'')+'</div>';}
ON.paKind=el=>{const d=PA.d,k=el.dataset.k;if(d.kind===k)return;const keep={name:d.name,company:d.company,ph:d.ph,email:d.email,licence:d.licence,events:d.events,id:d.id,src:d.src,_edit:d._edit,status:d.status,ver:d.ver};
  PA.d=Object.assign(paBlank(k),keep);paClampTix(PA.d);paRe(true);};
ON.paKnown=el=>{const d=PA.d,s=SRC[el.dataset.k];if(d.src===s.id){d.src=null;d.name='';d.company='';}else{d.src=s.id;const person=/^[A-Z][a-z]+ [A-Z]\.$/.test(s.label);d.name=person?s.label:'';d.company=person?'':s.label;d.rates={tix:s.comm*100,tab:s.comm*100,bar:d.rates.bar};}paRe(true);};
ON.paEv=el=>{const d=PA.d,k=el.dataset.k,i=d.events.indexOf(k);if(i>=0){if(d.events.length===1)return;d.events.splice(i,1);}else d.events.push(k);const f0=d.events[0];d.events.sort((a,b)=>EVK[a].doors-EVK[b].doors);if(d.events[0]!==f0){d.tables=[];d.zoom=null;}paClampTix(d);paRe(true);};
function paClampTix(d){const L=paTixLeft(d);PA_TK.forEach(k=>{d.tix[k]=d.kind==='exclusive'?L[k].left:Math.min(d.tix[k]||0,L[k].left);});}

/* ---------- step 2: tables ---------- */
function paVB(d){if(d.tmode==='tab'&&d.zoom){const b=secBox(d.zoom),pad=18,ar=1.05;let w=b.w+pad*2,h=b.h+pad*2;if(w/h<ar)w=h*ar;else h=w/ar;return [b.cx-w/2,b.y-pad-(h-(b.h+pad*2))/2,w,h];}return [-282,-14,564,936];}
function paFloorSVG(d){const tk=paTaken(d),sel={},secOn={},vb=paVB(d),sec=d.tmode==='sec';
  if(sec)d.secs.forEach(k=>secOn[k]=1);else d.tables.forEach(id=>sel[id]=1);
  const PT=a=>a.map(p=>p[0]+','+FY(p[1])).join(' ');
  let h='<svg class="pa-fl '+(sec?'secmode':'')+' '+(d.tmode==='tab'&&!d.zoom?'lod2':'')+'" viewBox="'+vb.map(v=>v.toFixed(1)).join(' ')+'" style="aspect-ratio:'+(vb[2]/vb[3]).toFixed(3)+'" aria-label="Floor plan, pick '+(sec?'sections':'tables')+'"><defs><pattern id="paHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="4" style="stroke:var(--g4)" stroke-width="1.6"/></pattern><filter id="paGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  h+='<rect x="-272" y="0" width="544" height="912" rx="6" class="pz bg"/><polygon class="pz" points="'+PT([[-268,688],[-112,688],[-112,770],[112,770],[112,688],[268,688],[268,880],[-268,880]])+'"/>';
  [[598,694],[368,566],[146,338]].forEach(z=>{[-1,1].forEach(sd=>{h+='<rect class="pz" x="'+(sd<0?-270:124)+'" y="'+FY(z[1])+'" width="146" height="'+(z[1]-z[0])+'" rx="3"/>';});});
  [-1,1].forEach(sd=>{h+='<polygon class="pz" points="'+PT([[118,152],[47,81],[130,-2],[270,-2],[270,152]].map(p=>[sd*p[0],p[1]]))+'"/>';});
  h+='<rect class="pdj" x="-23" y="'+(FY(785)-4)+'" width="46" height="26" rx="3"/><text class="pdjt" x="0" y="'+(FY(785)+13)+'">DJ</text><text class="pzl" x="0" y="'+(FY(880)-8)+'">Stage</text>';
  SEC_ORDER.forEach(k=>{const b=secBox(k);h+='<text class="pzl '+(secOn[k]||(!sec&&d.tables.some(id=>W.T[id].sec===k))?'on':'')+'" x="'+b.cx+'" y="'+(b.y+7)+'">'+esc(paSecShort(k))+'</text>';});
  if(sec)SEC_ORDER.forEach(k=>{const b=secBox(k),open=paSecOpen(k,tk);h+='<rect class="psec '+(secOn[k]?'on':'')+(open?'':' full')+'" data-act="paSec" data-k="'+k+'" x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="6" role="button" aria-label="'+esc(paSecLabel(k))+', '+open+' open"/>';});
  W.tables.forEach(T=>{const tr=TIERS[T.tier],w=tr.w*(T.wide||1),hh=tr.h,st=tk[T.id];let c='';
    if(st==='mineb')c='mineb';else if(sec){if(secOn[T.sec]&&!st)c='sel';else if(st)c=st;}else{if(sel[T.id])c='sel';else if(st)c=st;}
    const tap=!sec&&(!st||sel[T.id]||st==='mineb');
    h+='<g class="pt '+c+(tap?' tap':'')+'" '+(tap?'data-act="paTab" data-id="'+T.id+'" role="button" aria-label="'+esc(T.name)+'"':'')+' transform="translate('+T.x+' '+FY(T.z)+') rotate('+tRot(T)+')"><rect x="'+(-w/2)+'" y="'+(-hh/2)+'" width="'+w+'" height="'+hh+'" rx="2.4"/><text y="2.2" transform="rotate('+(-tRot(T))+')">'+shortId(T.id)+'</text></g>';});
  return h+'</svg>';}
function paTables(d){const tk=paTaken(d),pool=paPool(d,tk),mins=sum(pool,id=>W.T[id].min),sec=d.tmode==='sec';
  return '<div class="pa-h">Which tables can '+esc(paFirst(d.name)||'they')+' sell?<small>'+(sec?'Tap whole sections. They pick any open table inside, up to the number you set.':'Tap the exact tables to hold for them. Zoom into a section to tap them easily.')+'</small></div>'+
    '<div class="seg"><button class="'+(sec?'on':'')+'" data-act="paTm" data-k="sec">By section</button><button class="'+(!sec?'on':'')+'" data-act="paTm" data-k="tab">By table</button></div>'+
    (!sec?'<div class="pa-zoom"><button class="chip '+(!d.zoom?'on':'')+'" data-act="paZoom" data-k="">Whole venue</button>'+SEC_ORDER.map(k=>'<button class="chip '+(d.zoom===k?'on':'')+'" data-act="paZoom" data-k="'+k+'">'+esc(paSecShort(k))+(d.tables.some(id=>W.T[id].sec===k)?' · '+d.tables.filter(id=>W.T[id].sec===k).length:'')+'</button>').join('')+'</div>':'')+
    '<div class="pa-flw">'+paFloorSVG(d)+'</div>'+
    '<div class="pa-leg"><span><i class="sel"></i>'+(sec?'They can sell':'Held for them')+'</span>'+(d._edit&&d.src?'<span><i class="mineb"></i>Booked through them</span>':'')+'<span><i class="promo"></i>Another promoter</span><span><i class="taken"></i>Booked or held</span><span><i></i>Open</span></div>'+
    (sec?'<div class="pa-stp"><div class="l"><b>Most tables at once</b><span>'+N(pool.length)+' open in '+N(d.secs.length)+' sections right now</span></div><div class="c"><button data-act="paStep" data-k="cap" data-v="-1">−</button><input data-pk="cap" inputmode="numeric" value="'+d.cap+'"><button data-act="paStep" data-k="cap" data-v="1">+</button></div></div>':'')+
    '<div class="pa-sum"><div><b class="n">'+(sec?Math.min(d.cap,pool.length):pool.length)+'</b><span>tables</span></div><div><b class="n">'+kfmt(sec&&pool.length?mins/pool.length*Math.min(d.cap,pool.length):mins)+'</b><span>in minimums</span></div><div><b class="n">'+(sec?d.secs.length:new Set(pool.map(id=>W.T[id].sec)).size)+'</b><span>sections</span></div></div>'+
    (SEC_ORDER.some(k=>SECTIONS[k].grp==='bs'&&(sec?d.secs.includes(k):d.tables.some(id=>W.T[id].sec===k)))?'<div class="pa-info">'+I('star',17)+'<div>Backstage B and C stay request-only. A promoter’s guest can ask for them, and you still approve each one.</div></div>':'');}
ON.paTm=el=>{const d=PA.d;d.tmode=el.dataset.k;if(d.tmode==='tab'&&!d.tables.length&&d.secs.length){const tk=paTaken(d);d.tables=W.tables.filter(T=>d.secs.includes(T.sec)&&!tk[T.id]).slice(0,d.cap).map(T=>T.id);}
  if(d.tmode==='sec'&&!d.secs.length&&d.tables.length){d.secs=[...new Set(d.tables.map(id=>W.T[id].sec))];d.cap=d.tables.length;}paRe(true);};
ON.paSec=el=>{const d=PA.d,k=el.dataset.k,i=d.secs.indexOf(k);if(i>=0)d.secs.splice(i,1);else{if(!paSecOpen(k,paTaken(d))){toast('Every table in '+paSecLabel(k)+' is booked or held.');return;}d.secs.push(k);}haptic(8);paRe(true);};
ON.paTab=el=>{const d=PA.d,id=el.dataset.id,i=d.tables.indexOf(id);if(i>=0)d.tables.splice(i,1);else d.tables.push(id);haptic(8);
  if(!d.zoom&&i<0&&d.tables.length===1){d.zoom=W.T[id].sec;}paRe(true);};
ON.paZoom=el=>{PA.d.zoom=el.dataset.k||null;paRe(true);};
ON.paStep=el=>{const d=PA.d,k=el.dataset.k,v=+el.dataset.v,t=el.dataset.t;
  if(k==='tix'){const st=t==='vips'?5:t==='early'?25:25;d.tix[t]=Math.max(0,(d.tix[t]||0)+v*st);}
  else if(k==='list')d.list=Math.max(0,d.list+v*10);
  else if(k==='cap')d.cap=Math.max(1,d.cap+v);
  paRe(true);};

/* ---------- step 3: tickets ---------- */
function paTickets(d){const left=paTixLeft(d);
  return '<div class="pa-h">How many can '+esc(paFirst(d.name)||'they')+' sell?<small>Their link sells these at your prices. When a tier is used up, their link stops selling it.</small></div>'+
    PA_TK.map((k,i)=>{const L=left[k];return '<div class="pa-stp" style="flex-wrap:wrap"><div class="l"><b>'+GA[i].label+'</b><span>'+aed(GA[i].price)+' · '+esc(GA[i].sub)+'</span></div><div class="c"><button data-act="paStep" data-k="tix" data-t="'+k+'" data-v="-1">−</button><input data-pk="tix" data-t="'+k+'" inputmode="numeric" value="'+(d.tix[k]||0)+'"><button data-act="paStep" data-k="tix" data-t="'+k+'" data-v="1">+</button></div>'+
      '<div style="flex-basis:100%"><div class="pa-bar"><i id="paTb_'+k+'" style="width:'+Math.min(100,(d.tix[k]||0)/Math.max(1,L.left)*100)+'%"></i></div><p class="note" style="margin-top:6px" id="paTw_'+k+'">'+(d.tix[k]>L.left?'<b style="color:var(--bad)">Over by '+n0(d.tix[k]-L.left)+'</b> · ':'')+n0(L.left)+' left to allocate · '+n0(L.sold)+' sold · '+n0(L.others)+' with other promoters</p></div></div>';}).join('')+
    '<div class="pa-stp"><div class="l"><b>Promoter list</b><span>Free entry until '+esc(PA_LISTCUT)+', then '+aed(VENUE.doorPrice)+' at the door</span></div><div class="c"><button data-act="paStep" data-k="list" data-v="-1">−</button><input data-pk="list" inputmode="numeric" value="'+d.list+'"><button data-act="paStep" data-k="list" data-v="1">+</button></div></div>'+
    '<div class="pa-info">'+I('scan',17)+'<div>Each name on their list claims a spot with their number and gets their own QR, so <b>Gate 1 and 2 scans count toward their show rate</b>.</div></div>'+
    (d.kind==='exclusive'?'<button class="btn sm full" data-act="paAllTix">Give them everything that’s left</button>':'');}
ON.paAllTix=()=>{const d=PA.d,left=paTixLeft(d);PA_TK.forEach(k=>d.tix[k]=left[k].left);paRe(true);};

/* ---------- step 4: the cut ---------- */
function paCut(d){const e=paEstimate(d),r=paRates(d),rate=(k,l,s)=>'<div class="pa-rate"><div class="top"><div class="l"><b>'+l+'</b><span>'+s+'</span></div><div class="pv" id="paRv_'+k+'">'+paPct(d.rates[k]).replace('%','<small>%</small>')+'</div></div><input type="range" min="0" max="'+(k==='bar'?20:30)+'" step="0.5" value="'+d.rates[k]+'" data-pk="rate" data-t="'+k+'" aria-label="'+l+' rate">'+
    (k==='bar'?'<div class="seg base"><button class="'+(d.barBase==='over'?'on':'')+'" data-act="paBase" data-k="over">Above the minimum</button><button class="'+(d.barBase==='all'?'on':'')+'" data-act="paBase" data-k="all">Whole table spend</button></div>':'')+'</div>';
  return '<div class="pa-h">What’s their cut?<small>Worked out by BUBL from their own links, and paid by you after each event.</small></div>'+
    '<div class="seg"><button class="'+(d.one?'on':'')+'" data-act="paOne" data-k="1">One rate on everything</button><button class="'+(!d.one?'on':'')+'" data-act="paOne" data-k="0">Per stream</button></div>'+
    (d.one?rate('tix','On everything','Tickets, table minimums and bar spend at their tables'):
      rate('tix','Tickets','Face value of tickets sold through their link')+rate('tab','Table minimums','Minimum spend on tables booked through their invitations')+rate('bar','Bar spend from their guests','From the POS, on tables booked through them'))+
    (waiting('pos')?'<div class="pa-info">'+I('cloudoff',17)+'<div><b>Bar spend needs the POS.</b> The rate goes in the agreement now. BUBL counts it once the venue connects its POS; until then their statement shows bar spend as awaiting.</div></div>':'')+
    '<div class="pa-info">'+I('glass',17)+'<div><b>What bar spend counts.</b> The POS ties spend to a table, so BUBL counts the bar spend on tables booked through them. Spend at the open bars by their ticket and list guests can’t be tied to a promoter with the POS feed, so it isn’t counted.</div></div>'+
    '<div class="grp"><div class="lbl">Paid</div><div class="pa-terms">'+[7,14,30].map(n=>'<button class="'+(d.payDays===n?'on':'')+'" data-act="paTerm" data-k="payDays" data-v="'+n+'"><b>'+n+'</b><span>days after close</span></button>').join('')+'</div></div>'+
    '<div class="grp"><div class="lbl">Unsent holds return</div><div class="pa-terms">'+[24,48,72].map(n=>'<button class="'+(d.release===n?'on':'')+'" data-act="paTerm" data-k="release" data-v="'+n+'"><b>'+n+'h</b><span>before doors</span></button>').join('')+'</div></div>'+
    '<div class="grp"><div class="lbl">How their guests secure a table</div><div class="pa-terms pa-settle">'+Object.keys(SETTLE).map(k=>'<button class="'+((d.settle||'dep')===k?'on':'')+'" data-act="paSettle" data-v="'+k+'"><b>'+SETTLE[k][0]+'</b></button>').join('')+'</div><p class="note">'+SETTLE[d.settle||'dep'][1]+'</p><p class="note">'+holdRule()+'</p></div>'+
    '<div class="grp"><div class="lbl">Their own offers on upon-request tables</div><div class="seg"><button class="'+(paOff(d).on?'on':'')+'" data-act="paOff" data-v="1">Allowed</button><button class="'+(!paOff(d).on?'on':'')+'" data-act="paOff" data-v="0">Ask the venue</button></div>'+(paOff(d).on?'<div class="pa-fld" style="margin-top:10px"><label>Lowest offer they can send <small>· minimum spend, AED</small></label><input class="inp" data-pk="offFloor" inputmode="numeric" value="'+paOff(d).floor+'"></div>':'')+'<p class="note">'+(paOff(d).on?'On tables with no set price (Backstage B and C), they set the minimum, how it’s settled and any price points on their own invitation. Never below this amount. Tables with a set price always keep it.':'Tables with no set price go out only after you give them an offer.')+'</p></div>'+
    '<div class="pa-info">'+I('chart',17)+'<div><b>BUBL’s share.</b> BUBL takes '+RULES.bublPartnerSharePct+'% of whatever you pay them through BUBL links. It’s on your monthly statement; they never see it.</div></div>'+
    (!isOn('hist')?'<div class="pa-est"><div class="lbl">Payout estimate</div><p class="note">'+esc(gapLine({full:[{req:['hist']}],part:[]}))+'. The estimate shows once past season records are in.</p></div>':
    '<div class="pa-est"><div class="lbl">If they sell like Season 2 promoters</div><div class="row2"><div class="big n" id="paEstPay">'+kfmt(e.pay)+'<small>AED</small></div><span class="mut" style="font-size:12px;text-align:right">their payout per event<br>on <span id="paEstRev">'+A(e.rev)+'</span> sold</span></div>'+
    '<div class="kv"><span>From tickets</span><b id="paEstTix">'+A(e.pTix)+'</b><span>From table minimums</span><b id="paEstTab">'+A(e.pTab)+'</b><span>From bar spend</span><b id="paEstBar">'+A(e.pBar)+'</b></div><p class="note" style="margin-top:10px">Estimate: 72% of tickets and 82% of tables sold, bar spend from last season’s promoter tables.</p></div>');}
ON.paOne=el=>{const d=PA.d;d.one=el.dataset.k==='1';if(!d.one&&d.rates.tab==null)d.rates.tab=d.rates.tix;paRe(true);};
ON.paBase=el=>{PA.d.barBase=el.dataset.k;paRe(true);};
ON.paTerm=el=>{PA.d[el.dataset.k]=+el.dataset.v;paRe(true);};
ON.paSettle=el=>{PA.d.settle=el.dataset.v;paRe(true);};
const paOff=d=>d.offers||(d.offers={on:false,floor:CFG.PA_BLANK.offersFloor});
ON.paOff=el=>{paOff(PA.d).on=el.dataset.v==='1';paRe(true);};

/* ---------- step 5: the agreement ---------- */
function paContract(d){return '<div class="pa-h">The agreement<small>BUBL drafts it from your terms. Ask for any change in plain words.</small></div>'+
  '<div class="pa-askw"><div class="pa-ag" id="paAg">'+d.agent.filter(m=>!m.me).slice(-1).map(m=>'<div class="pa-m '+(m.typing?'typing':'')+'">'+bublMark()+'<p>'+esc(m.t)+'</p></div>').join('')+'</div>'+
  '<div class="pa-ask">'+bublMark()+'<input id="paAsk" placeholder="Ask BUBL to change the agreement" autocomplete="off" maxlength="200"'+(d.drafting||d.busy?' disabled':'')+'><button data-act="paAsk" aria-label="Send">'+I('send',18)+'</button></div>'+
  '<div class="pa-sugg">'+PA_SUGG.map(s=>'<button class="chip" data-act="paSug" data-q="'+esc(s)+'">'+esc(s)+'</button>').join('')+'</div></div>'+
  paDocHTML(d,{drafting:d.drafting})+
  '<p class="note">Drafted by BUBL from the terms you set. Have it checked by your own legal team before you rely on it.</p>';}
ON.paSug=el=>{const i=$('#paAsk');if(i)i.value=el.dataset.q;ON.paAsk();};
ON.paAsk=async()=>{const d=PA.d,i=$('#paAsk');if(!d||!i||d.busy)return;const q=i.value.trim();if(!q)return;
  d.agent.push({me:1,t:q});d.agent.push({me:0,t:'Changing the agreement…',typing:1});d.busy=true;paRe(true);
  const r=await paAgent(q,d);d.agent.pop();d.busy=false;d.chg=r.ch||{};if(Object.keys(d.chg).length)d.ver=(d.ver||1)+(d._bumped?0:1),d._bumped=true;
  d.agent.push({me:0,t:r.reply});if(PA.d===d)paRe(true);
  setTimeout(()=>{const b=PA.o&&$('.sh-body',PA.o.el),c=PA.o&&$('.pa-doc .cl.chg',PA.o.el);if(b&&c)c.scrollIntoView({block:'center',behavior:'smooth'});},60);};

/* ---------- step 6: sign and send ---------- */
function paMsg(d){const evs=d.events.map(id=>EVK[id].short).join(', '),r=paRates(d),pool=paPool(d),tix=sum(PA_TK,k=>d.tix[k]||0);
  return 'Hi '+paFirst(d.name)+', Ushuaïa Dubai Harbour has opened '+evs+' to '+(d.company&&d.kind==='exclusive'?d.company:'you')+(d.kind==='exclusive'?' as the exclusive promoter':'')+': '+(d.tmode==='sec'?'up to '+Math.min(d.cap,pool.length)+' tables':pool.length+' tables')+', '+n0(tix)+' tickets and '+n0(d.list)+' list spots, '+(d.one?paPct(r.tix)+' on everything':paPct(r.tix)+' on tickets, '+paPct(r.tab)+' on tables'+(r.bar?', '+paPct(r.bar)+' on bar spend':''))+'. Review and sign your agreement here:';}
function paSendStep(d){const L=paLink(d),pool=paPool(d),r=paRates(d);
  if(d._sent)return '<div class="pa-ok">'+I('check',30)+'</div><div class="pa-h" style="text-align:center">Sent to '+esc(paFirst(d.name))+'<small>Signed for Ushuaïa by '+esc(d.venueSig.by.replace(/ \(.*\)/,''))+'. '+(d.tmode==='tab'?N(pool.length)+' tables are now held for them on the floor.':'They can pick from '+N(d.secs.length)+' sections.')+' You’ll see it here when they open and sign.</small></div>'+
    '<div class="hud" style="padding:12px 14px;display:flex;align-items:center;gap:10px">'+I('link',18)+'<span class="n" style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(L.replace('https://',''))+'</span><button class="btn xs" data-act="paCopy" data-u="'+esc(L)+'">Copy</button></div>';
  return '<div class="pa-h">Check it, sign it, send it<small>It goes from the venue’s WhatsApp number with the agreement attached. '+esc(paFirst(d.name))+' signs in their link.</small></div>'+
    '<div class="pa-wa"><div class="wh"><span class="av">U</span><span><b>Ushuaïa Dubai Harbour</b><span>to '+esc(d.ph||paFirst(d.name))+'</span></span></div><div class="wb"><div class="bub"><div class="card"><span class="th">USHUAÏA<br>PROMOTER</span><span><b>'+(d.kind==='exclusive'?'Exclusive promotion agreement':'Promoter access')+' · '+esc(d.events.map(id=>EVK[id].short).join(', '))+'</b><span>From '+esc(ROLES.owner.who)+', Ushuaïa Dubai Harbour</span><em>bubl.app</em></span></div><div class="txt">'+esc(paMsg(d))+' <a>'+esc(L.replace('https://',''))+'</a></div><span class="tm">'+fT(now())+'</span></div></div></div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>'+(d.kind==='exclusive'?'Exclusive for':'Events')+'</span><b>'+esc(d.events.map(id=>EVK[id].short).join(', '))+'</b><span>Tables</span><b>'+(d.tmode==='sec'?'Up to '+Math.min(d.cap,pool.length)+' in '+d.secs.length+' sections':pool.length+' held')+'</b><span>Tickets</span><b>'+n0(sum(PA_TK,k=>d.tix[k]||0))+'</b><span>List</span><b>'+n0(d.list)+'</b><span>Cut</span><b>'+(d.one?paPct(r.tix)+' on everything':paPct(r.tix)+' / '+paPct(r.tab)+' / '+paPct(r.bar)+' bar')+'</b><span>Agreement</span><b>v'+(d.ver||1)+', '+paClauses(d).length+' clauses</b></div></div>'+
    (d.kind==='exclusive'&&sum(d.events,id=>paLive(id).filter(a=>a.id!==d.id&&a.kind!=='exclusive').length)?'<div class="pa-warn">'+I('pause',18)+'<div>Sending pauses the other promoter access for '+esc(d.events.map(id=>EVK[id].short).join(', '))+'.</div></div>':'')+
    '<p class="note">Signing needs a manager PIN and is written to the audit log.</p>';}
ON.paSend=()=>{const d=PA.d;for(let k=0;k<3;k++){const e=paCheck(k);if(e){PA.step=k;paRe();toast(e);return;}}
  withPin('Sign the agreement for Ushuaïa',m=>{const t=now(),lbl=paSrcLabel(d);
    let a=d.id&&paAll().find(x=>x.id===d.id);
    if(!d.src){const id='pa'+(++PA.seq);SOURCES.push({id,label:lbl,grp:'promoter',comm:paRates(d).tix/100,i:SOURCES.length});SRC[id]=SOURCES[SOURCES.length-1];d.src=id;
      Object.keys(Worlds).forEach(k=>{});}
    else if(SRC[d.src])SRC[d.src].comm=paRates(d).tix/100;
    d.venueSig={by:m,at:t};d.sentAt=t;d.openAt=0;d.promoSig=null;d.status='sent';if(!a){d.id='PA'+(++PA.seq);d.created=t;}
    const clean=JSON.parse(JSON.stringify(d));['_sent','agent','busy','drafting','drafted','zoom','_bumped','_edit'].forEach(k=>delete clean[k]);clean.chg={};
    if(a)Object.assign(a,clean);else{a=clean;paAll().push(a);}
    /* holds on the floor, in the promoter's name */
    a.events.forEach(evId=>{const Wd=paWorld(evId);
      Wd.holds.forEach(h=>{if(h.kind==='Promoter hold'&&h.who===lbl&&!h.relAt&&!(a.tmode==='tab'&&a.tables.includes(h.table)))h.relAt=t;});
      if(a.tmode!=='tab')return;const ix=tableIndex(Wd,t);a.tables.forEach(id=>{const e=ix[id];if(e&&(e.st==='booked'||e.st==='requested'))return;if(e&&e.st==='held'&&e.h.who===lbl)return;if(e&&e.st==='held')return;
        Wd.holds.push({id:'H'+Math.random().toString(36).slice(2,8).toUpperCase(),table:id,kind:'Promoter hold',who:lbl,from:t,until:Wd.D-a.release*HOUR,relAt:0,op:1});});});
    if(a.kind==='exclusive')a.events.forEach(id=>paFor(id).forEach(x=>{if(x.id!==a.id&&x.kind!=='exclusive'&&x.status!=='revoked')x.status='paused';}));
    else if(a.events.some(id=>paExclusive(id)&&paExclusive(id).id!==a.id))a.status='paused';
    log(d._edit?'Promoter access changed':'Promoter access sent',lbl+(a.kind==='exclusive'?' (exclusive)':'')+', '+paPool(a).length+' tables, '+n0(sum(PA_TK,k=>a.tix[k]||0))+' tickets, v'+(a.ver||1),m);bump();
    d._sent=true;d.id=a.id;haptic(20);paRe();refresh(true);});};
ON.paDone=()=>{const id=PA.d&&PA.d.id;Sheet.close();const a=paAll().find(x=>x.id===id);if(a&&Sheet.top()&&Sheet.top().title===M.paccess.t)Sheet.refresh(true);};

/* ---------- where it shows up ---------- */
['pre','live'].forEach(p=>{const L=HOME[p].owner,i=L.indexOf('sources');if(!L.includes('paccess'))L.splice(i>=0?i+1:L.length,0,'paccess');});
if(ASETS.sources){['pre','live'].forEach(p=>{if(!ASETS.sources[p].includes('paccess'))ASETS.sources[p].splice(1,0,'paccess');});}
