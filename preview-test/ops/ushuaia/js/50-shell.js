'use strict';
/* ============================================================
   50 · shell
   One delegated click handler, bottom sheets (right drawer on
   Atlas), toasts with undo, Manager PIN, top bar, shared sheets.
   ============================================================ */
const ON={};let pointerDown=false;
document.addEventListener('pointerdown',()=>{pointerDown=true;},true);
['pointerup','pointercancel'].forEach(e=>document.addEventListener(e,()=>{setTimeout(()=>pointerDown=false,60);},true));
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('[data-act]');if(!el)return;const f=ON[el.dataset.act];if(f){e.preventDefault();f(el,e);}});
const bk=id=>W.bookings.find(b=>b.id===id);
const can=a=>{const r=UI.role;if(r==='owner')return true;
  return ({host:['seat','move','collect','book','note','svc','nudge','scan','verify','offer','incident'],door:['scan','verify','doorsale','incident','alert','note'],runner:['deliver','svc','incident']}[r]||[]).includes(a);};

/* ---------- sheets ---------- */
const Sheet={stack:[],
  open(o){const el=document.createElement('div');el.className='sheet'+(o.tall?' tall':'')+(o.modal?' modal':'');
    el.innerHTML='<div class="sh-grip"></div><div class="sh-hd"><div class="t"><h3></h3><p></p></div><button class="sh-x" data-act="sheetClose" aria-label="Close">'+I('x',20)+'</button></div><div class="sh-body"></div><div class="sh-foot"></div>';
    o.el=el;$('#sheets').appendChild(el);this.stack.push(o);this.paint(o);$('#sheets').classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));
    this.drag(o);if(o.onOpen)o.onOpen(el);return o;},
  paint(o){o=o||this.top();if(!o)return;const el=o.el,body=$('.sh-body',el),st=body.scrollTop,v=f=>typeof f==='function'?f():f||'';
    $('h3',el).innerHTML=v(o.title);const sub=v(o.sub);$('.sh-hd p',el).innerHTML=sub;$('.sh-hd p',el).style.display=sub?'':'none';
    const b=v(o.body);if(b!==o._b){body.innerHTML=b;o._b=b;body.scrollTop=st;if(o.onPaint)o.onPaint(el);}
    const f=v(o.foot),ft=$('.sh-foot',el);if(f!==o._f){ft.innerHTML=f;o._f=f;}ft.style.display=f?'':'none';},
  top(){return this.stack[this.stack.length-1];},
  refresh(force){const o=this.top();if(o&&(!o.static||force))this.paint(o);},
  close(all){const o=this.stack.pop();if(!o)return;o.el.classList.remove('on');setTimeout(()=>o.el.remove(),320);if(o.onClose)o.onClose();
    if(!this.stack.length)$('#sheets').classList.remove('on');if(all&&this.stack.length)this.close(true);},
  drag(o){const hd=$('.sh-hd',o.el);let y0=null,dy=0;if(UI.device==='atlas')return;
    hd.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;y0=e.clientY;dy=0;o.el.style.transition='none';hd.setPointerCapture(e.pointerId);});
    hd.addEventListener('pointermove',e=>{if(y0==null)return;dy=Math.max(0,e.clientY-y0);o.el.style.transform='translateY('+dy+'px)';});
    const end=()=>{if(y0==null)return;y0=null;o.el.style.transition='';o.el.style.transform='';if(dy>90&&Sheet.top()===o)Sheet.close();};
    hd.addEventListener('pointerup',end);hd.addEventListener('pointercancel',end);}
};
ON.sheetClose=()=>Sheet.close();
document.addEventListener('click',e=>{if(e.target.classList&&e.target.classList.contains('scrim'))Sheet.close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&Sheet.stack.length)Sheet.close();});

/* ---------- toasts, with undo ---------- */
function toast(msg,opt){opt=opt||{};const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');
  el.innerHTML='<span>'+msg+'</span>'+(opt.undo?'<button type="button">'+I('undo',15)+'Undo <b class="n">10</b></button>':'');
  $('#toasts').appendChild(el);let left=opt.undo?10:0,iv=null;const kill=()=>{clearInterval(iv);el.remove();};
  if(opt.undo){const b=$('button',el);iv=setInterval(()=>{left--;$('b',b).textContent=left;if(left<=0)kill();},1000);b.addEventListener('click',()=>{kill();opt.undo();});}
  else setTimeout(kill,opt.ms||2600);}

/* ---------- Manager PIN: comps, discounts, refunds, overrides ---------- */
function withPin(reason,cb){let v='';const o=Sheet.open({modal:true,static:true,title:'Manager PIN',sub:esc(reason),
  body:()=>'<div class="pin-dots" id="pinDots">'+[0,1,2,3].map(i=>'<i class="'+(i<v.length?'on':'')+'"></i>').join('')+'</div><p class="note" style="text-align:center">Every approval is written to the audit log with your name. Demo PIN <span class="n">'+Object.keys(MANAGERS)[0]+'</span></p>'+
    '<div class="pin-pad">'+[1,2,3,4,5,6,7,8,9].map(d=>'<button data-act="pinKey" data-k="'+d+'">'+d+'</button>').join('')+'<span></span><button data-act="pinKey" data-k="0">0</button><button data-act="pinKey" data-k="del" aria-label="Delete">'+I('left',22)+'</button></div>'});
  ON.pinKey=el=>{const k=el.dataset.k;if(k==='del')v=v.slice(0,-1);else if(v.length<4)v+=k;o._b=null;Sheet.paint(o);
    if(v.length===4){const m=MANAGERS[v];if(m){haptic(20);setTimeout(()=>{Sheet.close();cb(m);},140);}else{haptic([30,40,30]);const d=$('#pinDots',o.el);d.classList.add('err');setTimeout(()=>{v='';o._b=null;Sheet.paint(o);},340);}}};}
const guard=(action,reason,fn)=>{if(!can(action)&&UI.role!=='owner'){toast('Your role cannot do this. Ask a manager.');return;}fn();};

/* ---------- top bar (handheld) ---------- */
function syncPill(){const q=Sync.queue.length,io=typeof offCount==='function'?offCount():0;if(io&&Sync.online&&!q)return '<button class="syncp q" data-act="integ" aria-label="Integrations switched off"><i></i>'+io+' '+(io===1?'feed':'feeds')+' off</button>';return '<button class="syncp '+(!Sync.online?'off':q?'q':'')+'" data-act="profile" aria-label="Sync status"><i></i>'+(!Sync.online?'Offline'+(q?' · '+N(q)+' queued':''):q?'Syncing '+N(q):'Synced')+'</button>';}
/* ---------- the time bar: Launch ── Live ── Post. It only moves the clock ---------- */
const TBar={drag:false,el:null,
  R(){return {ON:W.ON,D:W.D,C:W.C,P:W.C+8*HOUR};},
  toP(t){const r=this.R();if(t<r.D)return clamp((t-r.ON)/(r.D-r.ON),0,1)*.5;if(t<=r.C)return .5+(t-r.D)/(r.C-r.D)*.47;return .97+clamp((t-r.C)/(r.P-r.C),0,1)*.03;},
  toT(p){const r=this.R();if(p<.5)return Math.min(r.D-HOUR,Math.round((r.ON+(r.D-r.ON)*p/.5)/HOUR)*HOUR);if(p<=.97)return clamp(Math.round((r.D+(r.C-r.D)*(p-.5)/.47)/(5*MIN))*5*MIN,r.D,r.C);return r.P;},
  mount(slot){if(!slot)return;slot.innerHTML='<div class="tbar" data-tbar><div class="tb-track" role="slider" tabindex="0" aria-label="Event time" aria-valuemin="0" aria-valuemax="100"><div class="tb-rail"><i></i><i></i></div><i class="tb-fill"></i><i class="tb-mid"></i><i class="tb-now"></i><span class="tb-bub"></span><span class="tb-thumb"></span></div>'+
    '<div class="tb-lab"><span data-p="pre">Launch</span><span data-p="live">Live</span><span data-p="post">Post</span></div></div><div class="tb-read" id="tbRead"></div>';this.el=slot;this.bind();this.paint();},
  bub(t){const ph=t<W.D?'pre':t<=W.C?'live':'post';if(ph==='live')return fT(t);if(ph==='post')return 'Post';const d=W.D-t;return d>=2*DAY?'T−'+Math.floor(d/DAY)+'d':'T−'+fDur(d);},
  read(t){const ev=W.ev,ph=autoPhase(ev,t),sim=Clock.mode==='sim',ov=UI.phaseOv;let a,b;
    if(t<W.ON){a='<b class="n">Presale in '+fDur(W.ON-t)+'</b>';b='Opens '+fD(W.ON);}
    else if(ph==='pre'){const d=ev.doors-t,days=Math.floor(d/DAY);a='<b class="n">'+(days>=2?'T−'+days+' days':'T−'+fDur(d))+'</b><span>'+fD(t)+'</span>';b='Doors '+fD(ev.doors).replace(/^\w+ /,'')+', '+N(ev.doorsT);}
    else if(ph==='live'){a='<b class="n">'+fT(t)+'</b><span>doors +'+N(fDur(t-ev.doors))+'</span>';b='Closes '+N(fT(ev.close));}
    else{a='<b>Post</b><span>'+fD(t)+', '+N(fT(t))+'</span>';b='Closed '+N(fT(ev.close));}
    return '<button class="tb-a" data-act="clock">'+(ov?'<em class="warn">'+ov.toUpperCase()+' override</em>':'')+a+'</button><span class="tb-b">'+b+(sim?'<button class="tb-nowb" data-act="tbNow">'+I('undo',13)+'Now</button>':'')+'</span>';},
  paint(){const el=this.el;if(!el||!el.isConnected||!W)return;const t=now(),p=this.toP(t),ph=phase();
    $('.tb-thumb',el).style.left=(p*100).toFixed(2)+'%';$('.tb-fill',el).style.width=(p*100).toFixed(2)+'%';$('.tb-track',el).setAttribute('aria-valuenow',Math.round(p*100));$('.tb-track',el).setAttribute('aria-valuetext',stripTags(this.bub(t)));
    const rn=Date.now(),nw=$('.tb-now',el);if(Clock.mode==='sim'&&rn>=W.ON&&rn<=W.C+8*HOUR){nw.style.display='';nw.style.left=(this.toP(rn)*100).toFixed(2)+'%';}else nw.style.display='none';
    $$('.tb-lab span',el).forEach(s=>s.classList.toggle('on',s.dataset.p===ph));$('.tb-bub',el).textContent=this.bub(t);$('.tb-bub',el).style.left=(p*100).toFixed(2)+'%';
    const r=$('#tbRead',el),h=this.read(t);if(r._h!==h){r.innerHTML=h;r._h=h;}},
  commit(t,final){Clock.set(t,Clock.mode==='sim'&&Clock.speed!==1?Clock.speed:1);UI.phaseOv=null;_snap=null;this.paint();
    const ph=phase();if(ph!==UI._ph){haptic(12);applyPhase(final);}else if(final)renderAll();else refresh(true);},
  bind(){const tr=$('.tb-track',this.el),self=this;let raf=0,pend=null,last=0,pid=null;
    const pAt=e=>{const r=tr.getBoundingClientRect();let p=clamp((e.clientX-r.left)/r.width,0,1);if(Math.abs(p-.5)<.014)p=.5;if(p>.975)p=1;return p;};
    const loop=()=>{raf=0;if(pend==null)return;const t=pend;pend=null;Clock.set(t,1);self.paint();const n=performance.now();if(n-last>150){last=n;self.commit(t,false);}};
    tr.addEventListener('pointerdown',e=>{pid=e.pointerId;tr.setPointerCapture(pid);self.drag=true;self.el.classList.add('drag');pend=self.toT(pAt(e));if(!raf)raf=requestAnimationFrame(loop);});
    tr.addEventListener('pointermove',e=>{if(!self.drag||e.pointerId!==pid)return;pend=self.toT(pAt(e));if(!raf)raf=requestAnimationFrame(loop);});
    const end=e=>{if(!self.drag||e.pointerId!==pid)return;self.drag=false;self.el.classList.remove('drag');const t=self.toT(pAt(e));pend=null;cancelAnimationFrame(raf);raf=0;self.commit(t,true);haptic(8);};
    tr.addEventListener('pointerup',end);tr.addEventListener('pointercancel',end);
    tr.addEventListener('keydown',e=>{const t=now(),ph=autoPhase(W.ev,t),st=ph==='pre'?DAY:15*MIN;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();self.commit(clamp(t+(e.key==='ArrowRight'?st:-st),W.ON,W.C+8*HOUR),true);}});}
};
ON.tbNow=()=>{Clock.real();UI.phaseOv=null;_snap=null;TBar.paint();applyPhase(true);renderAll();toast('Back to the real clock.');};
ON.clock=()=>{Sheet.open({title:'Event clock',sub:'Drag the bar to move through the event. This sheet is for playback and override.',body:()=>{const t=now(),p=phase(),auto=autoPhase(W.ev,t);
    return '<div class="hud" style="padding:14px"><div class="kv"><span>Launch</span><b>'+N(fD(W.ON))+'</b><span>Doors</span><b>'+N(fD(W.D)+', '+W.ev.doorsT)+'</b><span>Close</span><b>'+N(fT(W.C))+'</b><span>Showing</span><b class="gold">'+p.toUpperCase()+(UI.phaseOv?' (override)':Clock.mode==='sim'?' (moved)':' (live clock)')+'</b></div></div>'+
      '<div class="grp"><div class="lbl">Playback speed</div><div class="seg" role="group" aria-label="Clock speed">'+[[0,'Pause'],[1,'1×'],[30,'30×'],[120,'120×']].map(x=>'<button class="'+((Clock.mode==='sim'&&Clock.speed===x[0])||(Clock.mode==='real'&&x[0]===1)?'on':'')+'" data-act="speed" data-s="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
      (Clock.mode==='sim'?'<button class="btn sm full" data-act="tbNow">'+I('undo',16)+'Back to the real clock</button>':'')+'<p class="note">The seeded night runs on this clock. With the live feed connected the bar becomes a read-only timeline of the event.</p></div>'+
      '<div class="grp"><div class="lbl">Manager override</div><p class="note">Force a phase without moving the clock, for example when doors open early. Needs a Manager PIN and is logged.</p>'+
      '<div class="btnrow">'+['pre','live','post'].map(k=>'<button class="btn sm '+(UI.phaseOv===k?'pri':'')+'" data-act="phaseOv" data-p="'+k+'">'+k.toUpperCase()+'</button>').join('')+'</div>'+
      (UI.phaseOv?'<button class="btn sm full" data-act="phaseAuto">'+I('undo',16)+'Return to auto ('+auto.toUpperCase()+')</button>':'')+'</div>';}});};
ON.speed=el=>{const s_=+el.dataset.s;if(Clock.mode==='real'&&s_===1)return;Clock.set(now(),s_);Sheet.refresh();TBar.paint();};
function renderTop(){const ev=W.ev,r=ROLES[UI.role],r1=$('#topR1');if(!r1)return;
  r1.innerHTML='<button class="evbtn" data-act="season"><b>'+esc(ev.short)+I('down',16)+'</b><span>'+fD(ev.doors)+' · '+esc(VENUE.season)+' · '+esc(r.label)+'</span></button>'+
    '<span id="syncSlot">'+syncPill()+'</span><button class="ibtn" data-act="search" aria-label="Search guests and tables">'+I('search',20)+'</button><button class="ibtn av" data-act="profile" aria-label="Profile and settings">'+esc(initials(r.who))+'</button>';
  const sl=$('#tslot');if(sl&&!$('[data-tbar]',sl))TBar.mount(sl);else TBar.paint();}
function renderTabs(){const tabs=[['home','HOME','home'],['floor','FLOOR','floor'],['chat','CHAT','msg'],['scan','SCAN','scan']].filter(t=>ROLES[UI.role].tabs.includes(t[0]));const s=S(),al=phase()==='live'?needsLive(s).filter(x=>x.tone==='bad').length:0;
  $('#tabs').innerHTML=tabs.map(t=>'<button class="'+(UI.tab===t[0]?'on':'')+'" data-act="tab" data-t="'+t[0]+'" aria-current="'+(UI.tab===t[0])+'">'+I(t[2],22)+t[1]+(t[0]==='home'&&al&&UI.tab!=='home'?'<span class="bdg">'+al+'</span>':'')+(t[0]==='chat'&&UI.tab!=='chat'?(n=>n?'<span class="bdg">'+(n>99?'99+':n)+'</span>':'')(chatUnreadAll()):'')+'</button>').join('');}
window.onSync=()=>{const el=$('#syncSlot');if(el)el.innerHTML=syncPill();const a=$('#async');if(a)a.innerHTML=syncPill();};ON.tab=el=>{setTab(el.dataset.t);};
function setTab(t){if(UI.tab==='scan'&&t!=='scan')Scan.stop();UI.tab=t;renderAll();}
ON.phaseOv=el=>{const p=el.dataset.p;withPin('Override phase to '+p.toUpperCase(),m=>{UI.phaseOv=p;log('Phase override',p.toUpperCase(),m);Sheet.close(true);applyPhase(true);});};

ON.phaseAuto=()=>{UI.phaseOv=null;log('Phase returned to auto','');Sheet.close();applyPhase(true);};

/* ---------- season switcher ---------- */
function seasonRows(){const t=now();return EVENTS.map(ev=>{if(!ev.announced)return {ev,status:'tba'};
  const Wd=Worlds[ev.id]||(Worlds[ev.id]=buildWorld(ev));Wd.rev=Wd.rev||0;const k=Math.floor(t/HOUR)+':'+Wd.rev;if(!Wd._sum||Wd._sumK!==k){Wd._sum=snapshot(Wd,t,true);Wd._sumK=k;}
  const s=Wd._sum,ph=autoPhase(ev,t);return {ev,s,ph,Wd,status:t<Wd.ON?'soon':ph,ga:s.gaSold/sum(GA,x=>x.alloc),tb:s.tb.booked/s.tb.total};});}
ON.season=()=>{Sheet.open({title:VENUE.season,sub:'10 events at Dubai Harbour. Table prices are the same every night.',tall:true,body:()=>'<div class="rows">'+seasonRows().map(r=>{const ev=r.ev,on=ev.id===W.ev.id;
    if(r.status==='tba')return '<div class="row" style="opacity:.5"><div class="ri n">'+g(ev.doors).getUTCDate()+'</div><div class="rt"><b>To be announced</b><span>'+fD(ev.doors)+' '+g(ev.doors).getUTCFullYear()+'</span></div><div class="ra">'+pill('mut','Not on sale')+'</div></div>';
    const st=r.status==='soon'?tag('mut','clock','Presale in '+fDur(r.Wd.ON-now())):r.status==='pre'?tag('neu',null,'On sale'):r.status==='live'?tag('ok','check','Live now'):tag('mut',null,'Closed');
    return '<button class="row tap" data-act="pickEv" data-id="'+ev.id+'"><div class="ri '+(on?'neu':'')+' n">'+g(ev.doors).getUTCDate()+'<br></div><div class="rt"><b>'+esc(ev.head)+'</b><span>'+fD(ev.doors)+', doors '+N(ev.doorsT)+(r.status!=='soon'?' · tickets '+P(r.ga,1)+' · tables '+P(r.tb,1):'')+'</span></div><div class="ra">'+st+'</div></button>';}).join('')+'</div>'});};
ON.pickEv=el=>{loadEvent(el.dataset.id);UI.phaseOv=null;if(Clock.mode==='sim')Clock.real();Sheet.close(true);UI.floor={};applyPhase(true);toast('Now working on '+esc(W.ev.short));};

/* ---------- profile, role, integrations ---------- */
ON.profile=()=>{Sheet.open({title:'You and this device',sub:()=>esc(ROLES[UI.role].who)+' · '+esc(ROLES[UI.role].label),tall:true,body:()=>{
  const sw=(k,on,l,d)=>'<button class="row tap" data-act="flag" data-k="'+k+'"><div class="ri '+(on?'ok':'')+'">'+I(on?'check':'minus',18)+'</div><div class="rt"><b>'+l+'</b><span>'+d+'</span></div><div class="ra">'+pill(on?'ok':'mut',on?'On':'Off')+'</div></button>';
  return '<div class="grp"><div class="lbl">Role</div><p class="note">Each role sees only what it needs. In production the role comes from the staff login.</p><div class="tiles">'+Object.keys(ROLES).map(k=>'<button class="btn sm '+(UI.role===k?'pri':'')+'" data-act="role" data-r="'+k+'">'+ROLES[k].label+'</button>').join('')+'</div></div>'+
    '<div class="grp"><div class="lbl">This device is at</div><div class="seg">'+GATES.map(x=>'<button class="'+(UI.gate===x.id?'on':'')+'" data-act="gate" data-g="'+x.id+'">'+x.label+'</button>').join('')+'</div></div>'+
    (UI.role==='owner'?'<div class="grp"><div class="lbl">Integrations</div><div class="rows"><button class="row tap" data-act="integ"><div class="ri '+(offCount()?'warn':'ok')+'">'+I('net',18)+'</div><div class="rt"><b>Integrations and data feeds</b><span>'+coverage().on+' of '+coverage().tot+' feeds live'+(offCount()?' · '+offCount()+' switched off':'')+'</span></div><div class="ra">'+I('right',16)+'</div></button></div></div>':'')+
    (ROLES[UI.role].tabs.includes('scan')&&UI.device!=='atlas'?'<div class="grp"><div class="lbl">Scanning on this phone</div><div class="rows">'+
      (standalone()?'<div class="row"><div class="ri ok">'+I('check',18)+'</div><div class="rt"><b>Running from the home screen</b><span>Full screen, camera at the door, screen stays on while scanning.</span></div></div>'
        :'<div class="row"><div class="ri neu">'+I('dl',18)+'</div><div class="rt"><b>Add to Home Screen</b><span>'+(isIOS()?'In Safari tap Share, then Add to Home Screen. It opens full screen like an app.':'Use your browser’s Install or Add to Home Screen option.')+'</span></div></div>')+
      '<button class="row tap" data-act="camGo"><div class="ri '+(Scan.cam?'ok':Scan.err&&Scan.err!=='starting'?'warn':'')+'">'+I('scan',18)+'</div><div class="rt"><b>Camera</b><span>'+(Scan.cam?'On and scanning':Scan.err&&CAMMSG[Scan.err]?CAMMSG[Scan.err][0]:'Starts when you open Scan')+'</span></div><div class="ra">'+I('right',16)+'</div></button>'+
      '<button class="row tap" data-act="testTickets"><div class="ri">'+I('grid',18)+'</div><div class="rt"><b>Test tickets</b><span>QR codes to show on a second screen and scan</span></div><div class="ra">'+I('right',16)+'</div></button></div></div>':'')+
    '<div class="grp"><div class="lbl">Connection</div><div class="rows">'+
      '<button class="row tap" data-act="offline"><div class="ri '+(Sync.online?'ok':'bad')+'">'+I(Sync.online?'cloud':'cloudoff',18)+'</div><div class="rt"><b>'+(Sync.online?'Online':'Offline')+'</b><span>'+(Sync.online?'Tap to test offline. Scans and seating keep working and sync later.':N(Sync.queue.length)+' actions queued on this device. Tap to reconnect.')+'</span></div><div class="ra">'+pill(Sync.online?'ok':'bad',Sync.online?'Synced':'Queued')+'</div></button>'+
      sw('sound',UI.sound,'Scan sounds','A beep on every scan, for loud gates')+'</div></div>'+
    '<div class="grp"><div class="lbl">Integrations</div><div class="rows">'+
      sw('posSeat',UI.flags.posSeat,'POS lines bound to seats','Off: ordered spend shows at table level only.')+'</div></div>'+
    '<div class="grp"><div class="btnrow"><button class="btn sm" data-act="audit">'+I('note',16)+'Audit log</button>'+(window.innerWidth>=900?'<button class="btn sm" data-act="device">'+I('grid',16)+(UI.device==='atlas'?'Handheld view':'Open Atlas')+'</button>':'')+'</div>'+
    '<p class="note">Data source: seeded simulation, one deterministic night per event. Selectors and actions are written against the same shapes the BUBL API returns.</p></div>';}});};
ON.camGo=()=>{Sheet.close(true);if(UI.tab!=='scan')setTab('scan');else{audioUnlock();Scan.start();}};
ON.role=el=>{UI.role=el.dataset.r;if(!ROLES[UI.role].tabs.includes(UI.tab))UI.tab='home';if(UI.role==='door'&&ROLES.door.gate)UI.gate=ROLES.door.gate;Sheet.refresh();renderAll();};
ON.gate=el=>{UI.gate=el.dataset.g;Sheet.refresh();refresh(true);};
ON.offline=()=>{Sync.forced=Sync.online;setOnline(!Sync.online);Sheet.refresh();toast(Sync.online?'Back online. Syncing queued actions.':'Offline mode. Actions queue on this device.');};
ON.flag=el=>{const k=el.dataset.k;if(k==='sound')UI.sound=!UI.sound;else UI.flags[k]=!UI.flags[k];Sheet.refresh();refresh(true);};
ON.device=()=>{UI.device=UI.device==='atlas'?'hand':'atlas';UI.deviceForced=true;Sheet.close(true);layout();};
ON.audit=()=>{Sheet.open({title:'Audit log',sub:()=>N(W.ops.length)+' actions on this event',tall:true,body:()=>W.ops.length?'<div class="rows">'+W.ops.slice(0,120).map(e=>'<div class="row"><div class="ri '+(e.mgr?'neu':'')+'">'+I(e.mgr?'lock':'note',16)+'</div><div class="rt"><b>'+esc(e.action)+'</b><span>'+esc(e.detail)+'</span><span>'+esc(e.who)+' ('+esc(ROLES[e.role].label)+')'+(e.mgr?' · approved by '+esc(e.mgr):'')+'</span></div><div class="ra">'+N(fT(e.at))+(e.synced?'':' '+I('cloudoff',14))+'</div></div>').join('')+'</div>':'<p class="note">Nothing yet. Every booking, scan, move, comp and override made here is recorded with who, when and who approved it.</p>'});};

/* ---------- search ---------- */
ON.search=()=>{let q='';const o=Sheet.open({title:'Find a guest or table',tall:true,static:true,
  body:()=>'<label class="srch">'+I('search',18)+'<input id="q" placeholder="Name, phone, table or ticket code" autocomplete="off" autocapitalize="none" value="'+esc(q)+'"></label><div id="qres" class="rows"></div>',
  onOpen:el=>{const inp=$('#q',el),res=$('#qres',el);const run=()=>{q=inp.value;const r=searchAll(q,30);res.innerHTML=q.length<2?'<p class="note" style="padding-top:10px">Search all '+N(n0(W.guests.length))+' guests on file for this event.</p>':r.length?r.map(resultRow).join(''):'<p class="note" style="padding-top:10px">No match. Check the spelling or search by phone.</p>';};
    inp.addEventListener('input',run);run();setTimeout(()=>inp.focus(),350);}});};
function resultRow(x){if(x.type==='table')return '<button class="row tap" data-act="table" data-id="'+x.T.id+'"><div class="ri">'+I('floor',16)+'</div><div class="rt"><b>'+esc(x.T.name)+'</b><span>'+esc(SECTIONS[x.T.sec].label)+' · '+(STATE[x.T._st]||STATE.open).l+'</span></div><div class="ra">'+I('right',16)+'</div></button>';
  const gst=x.gst,t=now();if(x.type==='seat'){const st=x.s.st&&x.s.st<=t?'seated':x.s.ar&&x.s.ar<=t?'arrived':'expected';
    return '<button class="row tap" data-act="guest" data-g="'+gst.i+'"><div class="ri '+(gst.crm===2?'neu':'')+'">'+esc(gst.n.split(' ').map(w=>w[0]).join('').slice(0,2))+'</div><div class="rt"><b>'+esc(gst.n)+'</b><span>'+esc(W.T[tableAt(x.b,t)].name)+', seat '+N(x.s.n)+' · '+crmLabel(gst)+'</span></div><div class="ra">'+(st==='seated'?pill('seated'):st==='arrived'?tag('warn','clock','At gate'):pill('expected'))+'</div></button>';}
  const sc=x.x.sc&&x.x.sc<=t;return '<button class="row tap" data-act="guest" data-g="'+gst.i+'"><div class="ri">'+esc(gst.n.split(' ').map(w=>w[0]).join('').slice(0,2))+'</div><div class="rt"><b>'+esc(gst.n)+'</b><span>'+['Early entry','Second wave','VIP standing','Door ticket','Guest list','Promoter list'][x.x.k]+' · '+N(x.x.ref)+'</span></div><div class="ra">'+(sc?tag('ok','check','In '+fT(x.x.sc)):pill('expected','Not in'))+'</div></button>';}

/* ---------- guest card: tier, history, preferences, notes, consent, ID ---------- */
function guestRecs(gi,t){const out={seats:[],tix:[]};W.bookings.forEach(b=>{if(bActive(b,t)||bPending(b,t))b.seats.forEach(s=>{if(s.g===gi)out.seats.push(s);});});W.tix.forEach(x=>{if(x.g===gi&&x.at<=t)out.tix.push(x);});return out;}
function idLine(gst){return '';}
ON.guest=el=>{const gi=+el.dataset.g;openGuest(gi);};
ON.addNote=el=>{const inp=$('#gnote',Sheet.top().el),v=inp&&inp.value.trim();if(!v)return;Act.note(+el.dataset.g,v);toast('Note saved to '+esc(W.guests[+el.dataset.g].n));Sheet.refresh(true);};

/* ---------- layout + frame ---------- */
function layout(){const wide=window.innerWidth>=900;if(!UI.deviceForced)UI.device=wide?'atlas':'hand';if(!wide)UI.device='hand';
  const app=$('#app');app.dataset.device=UI.device;app.classList.toggle('framed',wide&&UI.device==='hand');buildShell();renderAll();}
function buildShell(){const st=$('#stage');
  if(UI.device==='atlas')st.innerHTML='<nav id="rail" aria-label="Atlas"></nav><div id="amain"><header id="atop"><div id="atopL"></div><div id="tslot"></div><div id="atopR"></div></header><main id="aview"></main></div><div id="sheets"><div class="scrim"></div></div><div id="toasts"></div>';
  else st.innerHTML='<header id="top"><div class="top-r1" id="topR1"></div><div id="tslot"></div></header><main id="view"></main><nav id="tabs" aria-label="Sections"></nav><div id="sheets"><div class="scrim"></div></div><div id="toasts"></div>';
  Sheet.stack=[];}
function applyPhase(announce){const p=phase(),app=$('#app'),was=app.dataset.phase;app.dataset.phase=p;UI._ph=p;document.querySelector('meta[name=theme-color]').setAttribute('content',p==='live'?'#000000':'#0B0C10');
  if(was!==p){UI.floor.overlay=null;UI.floor.zone=null;UI.floor.edit=false;UI.floor.add=null;UI.floor.move=null;UI.floor.spot=null;UI.floor.ans=null;UI.floor.ask=false;}renderAll();if(announce&&was&&was!==p)toast({pre:'Planning view.',live:'Doors are open. Live view.',post:'Event closed. Post view.'}[p]);}
function renderAll(){_snap=null;if(UI.device==='atlas'){Atlas.render();return;}renderTop();renderTabs();const v=$('#view');v.scrollTop=0;
  $('#app').classList.remove('ch-full');if(UI.tab==='home')Home.render(v);else if(UI.tab==='floor')Floor.render(v);else if(UI.tab==='chat')Chat.render(v);else Scan.render(v);}
function refresh(force){if(pointerDown&&!force)return;if(UI.device==='atlas'){Atlas.update();Sheet.refresh();return;}
  if(UI.tab==='home')Home.update();else if(UI.tab==='floor')Floor.update();else if(UI.tab==='chat')Chat.update();else Scan.update();Sheet.refresh();renderTabs();}
let _tk='';
function tick(){if(!W)return;const p=phase();if(p!==UI._ph&&!TBar.drag){applyPhase(true);return;}
  if(!TBar.drag)TBar.paint();
  if(typeof Integ!=='undefined'&&Integ.visible())Integ.update();
  const k=W.rev+':'+Math.floor(now()/15000);if(k!==_tk&&!TBar.drag){_tk=k;refresh();}
  if(UI.tab==='scan'&&UI.device==='hand')Scan.tick();
  if(!TBar.drag&&typeof Chat!=='undefined')Chat.tick();}
