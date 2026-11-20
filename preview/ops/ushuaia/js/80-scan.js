'use strict';
/* ============================================================
   80 · SCAN
   The tab opens the camera straight away. If no camera is
   available (preview frames, file:// on iOS) the same screen runs
   on the queue of people the simulation says are at this gate.
   Validation is local against the manifest, so it works offline.
   ============================================================ */
const scanVis=()=>UI.device!=='atlas'&&UI.tab==='scan'&&!!$('#scVid');
const CAMMSG={
  starting:['Starting the camera',''],
  insecure:['Open BUBL OPS from its link','The camera only works on the https web link, not from a downloaded file. Open the link in Safari, then Share › Add to Home Screen.'],
  embedded:['Camera blocked in this preview','Open the BUBL OPS link directly to scan with the camera.'],
  denied:['Camera access is off','Tap Try again and choose Allow. No prompt? Open Settings › Apps › Safari › Camera, choose Ask, then close BUBL OPS in the app switcher and reopen it.'],
  busy:['The camera is in use','Another app is using the camera. Close it, then tap Try again.'],
  nocam:['No camera found','This device has no camera BUBL OPS can use.'],
  unsupported:['This browser can’t open the camera','Open the link in Safari on iPhone or Chrome on Android.'],
  failed:['The camera didn’t start','Tap Try again.'],
  idle:['Camera is off','Tap to start scanning.']};
const Scan={stream:null,raf:0,res:null,busy:false,cam:false,torch:false,torchOK:false,mine:0,det:null,pi:0,gen:0,err:null,wl:null,_re:0,
  mode(){return {pre:'practice',live:'live',post:'post'}[phase()];},
  render(v){const m=this.mode();this.res=null;
    v.innerHTML='<div class="scan" id="scan"><video id="scVid" playsinline muted autoplay style="display:none"></video><div class="sim" id="scSim"></div><canvas id="scCv" style="display:none"></canvas>'+
      '<div class="sc-top"><button class="sc-mode" data-act="profile">'+I(m==='live'?'gate':m==='practice'?'flag':'note',15)+'<span id="scMode"></span></button><div class="sc-count" id="scCount"></div></div>'+
      '<div class="sc-ret"><i></i><em></em></div><div id="scCam"></div><div class="sc-hint" id="scHint"></div>'+
      '<div class="sc-bot"><div class="sc-q" id="scQ"></div><button class="sc-next" id="scNext" data-act="scNext"></button>'+
      '<div class="sc-acts"><button data-act="scTorch" id="scTorch">'+I('torch',20)+'Torch</button><button data-act="scLookup">'+I('search',20)+'Look up</button><button data-act="scDoor">'+I('card',20)+'Door sale</button><button data-act="scSound" id="scSnd">'+I(UI.sound?'vol':'mute',20)+'Sound</button></div></div>'+
      '<div id="scRes"></div></div>';
    $('#stage').classList.remove('scanres');
    if(this.stream&&this.stream.getVideoTracks().some(x=>x.readyState==='live')){this.attach();}else{this.update();this.start();}},
  update(){const el=$('#scan');if(!el)return;const m=this.mode(),s=S(),t=now();
    $('#scMode').textContent=m==='live'?GATE[UI.gate].label+' · live':m==='practice'?'Practice · nothing counts':'Audit · late scans flagged';
    $('#scCount').innerHTML=m==='live'?'<b>'+n0(s.inAll)+'</b>in · this device '+this.mine+(Sync.online?'':' · offline, '+Sync.queue.length+' queued'):m==='practice'?'<b>'+this.mine+'</b>practice scans':'<b>'+n0(s.inAll)+'</b>final count';
    $('#scHint').textContent=this.cam?'Point at a ticket QR. Scanning is continuous.':this.err==='starting'?'':m==='practice'?'No camera. Tap a sample ticket to rehearse each result.':'No camera. Scan the next guest in line below.';
    this.paintCam(el);
    const q=$('#scQ'),nx=$('#scNext');
    if(m==='practice'){const ps=practiceSet();q.innerHTML=ps.map((p,i)=>'<button data-act="scPr" data-i="'+i+'">'+esc(p.l)+'</button>').join('');nx.style.display='none';}
    else{const qu=scanQueue(1);q.innerHTML='';nx.style.display=this.cam?'none':'';nx.innerHTML=I('scan',20)+(m==='post'?'Scan a late ticket':qu.length?'Scan next in line':'Nobody in line');nx.disabled=m==='live'&&!qu.length;}},
  tick(){if(!this.res)this.update();},
  paintCam(el){const c=$('#scCam',el);if(!c)return;const k=this.cam?null:(this.err||'idle'),big=k&&(isPhone()||k==='insecure'||k==='starting'),M_=k&&CAMMSG[k];
    el.classList.toggle('nocam',!this.cam);const tb=$('#scTorch',el);if(tb)tb.classList.toggle('na',this.cam&&!this.torchOK);
    const h=!big?'':'<div class="sc-cam" role="status">'+(k==='starting'?'<i class="sc-spin"></i>':'<span class="sc-cic">'+I(k==='denied'||k==='insecure'||k==='embedded'?'lock':'scan',22)+'</span>')+'<b>'+M_[0]+'</b>'+(M_[1]?'<p>'+M_[1]+'</p>':'')+
      (['denied','busy','failed','idle'].includes(k)?'<button class="btn pri sm" data-act="scCam">'+I('scan',16)+(k==='idle'?'Turn on camera':'Try again')+'</button>':'')+'</div>';
    if(c._h!==h){c.innerHTML=h;c._h=h;}},
  async start(){this.release();const g=++this.gen;
    if(!window.isSecureContext){this.err='insecure';this.update();return;}
    const md=navigator.mediaDevices;if(!md||!md.getUserMedia){this.err='unsupported';this.update();return;}
    this.err='starting';this.update();let st=null,er=null;
    try{st=await md.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});}
    catch(e){er=e;if(!e||(e.name!=='NotAllowedError'&&e.name!=='SecurityError')){try{st=await md.getUserMedia({video:true,audio:false});er=null;}catch(e2){er=e2;}}}
    if(g!==this.gen){if(st)st.getTracks().forEach(x=>x.stop());return;}
    if(!st){const n=er&&er.name;this.err=n==='NotAllowedError'||n==='SecurityError'?(window.top!==window&&!isPhone()?'embedded':'denied'):n==='NotReadableError'||n==='AbortError'?'busy':n==='NotFoundError'||n==='OverconstrainedError'?'nocam':'failed';this.cam=false;this.update();return;}
    if(!scanVis()){st.getTracks().forEach(x=>x.stop());return;}
    this.stream=st;const tr=st.getVideoTracks()[0];let cap=null;try{cap=tr.getCapabilities?tr.getCapabilities():null;}catch(_){}
    this.torchOK=!!(cap&&cap.torch);this.torch=false;
    if(cap&&cap.focusMode&&cap.focusMode.includes('continuous'))tr.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{});
    /* iOS ends the track when the app is backgrounded or another app takes the camera */
    tr.addEventListener('ended',()=>{if(this.stream!==st)return;this.release();if(!document.hidden&&scanVis()&&Date.now()-this._re>3000){this._re=Date.now();this.start();}else{this.update();}});
    try{this.det='BarcodeDetector' in window?new BarcodeDetector({formats:['qr_code']}):null;}catch(_){this.det=null;}
    this.err=null;await this.attach();this.wake(true);},
  async attach(){const v=$('#scVid'),st=this.stream;if(!v||!st)return;v.muted=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
    if(v.srcObject!==st)v.srcObject=st;v.style.display='';const sim=$('#scSim');if(sim)sim.style.display='none';try{await v.play();}catch(_){}
    this.cam=true;this.err=null;this.update();this.loop();},
  release(){cancelAnimationFrame(this.raf);this.raf=0;this.busy=false;if(this.stream){this.stream.getTracks().forEach(x=>x.stop());this.stream=null;}
    this.cam=false;this.torch=false;this.wake(false);const v=$('#scVid');if(v){try{v.srcObject=null;}catch(_){}v.style.display='none';const sim=$('#scSim');if(sim)sim.style.display='';}},
  stop(){this.gen++;$('#stage').classList.remove('scanres');this.res=null;this.release();},
  async wake(on){try{if(on){if(this.wl||!('wakeLock' in navigator))return;const w=await navigator.wakeLock.request('screen');if(!this.stream){w.release().catch(()=>{});return;}this.wl=w;w.addEventListener('release',()=>{if(this.wl===w)this.wl=null;});}
    else if(this.wl){const w=this.wl;this.wl=null;await w.release();}}catch(_){this.wl=null;}},
  /* iPhone has no BarcodeDetector, so frames go to jsQR. Alternate frames read the whole picture
     and a sharper crop of the centre, and every fourth frame also tries light-on-dark codes. */
  loop(){cancelAnimationFrame(this.raf);const v=$('#scVid'),cv=$('#scCv');if(!v||!cv)return;let last=0,n=0;const cx=cv.getContext('2d',{willReadFrequently:true});
    const step=async ts=>{if(!this.stream)return;if(!scanVis()){this.release();return;}this.raf=requestAnimationFrame(step);
      if(this.res||this.busy||ts-last<140||v.readyState<2||!v.videoWidth)return;last=ts;this.busy=true;n++;let code=null;
      try{if(this.det){const r=await this.det.detect(v);if(r.length)code=r[0].rawValue;}
        else if(window.jsQR){const vw=v.videoWidth,vh=v.videoHeight;let sx=0,sy=0,sw=vw,sh=vh,w,h;
          if(n%2){const side=Math.min(vw,vh)*.62;sx=(vw-side)/2;sy=(vh-side)*.44;sw=sh=side;w=h=Math.min(560,Math.round(side));}
          else{w=Math.min(720,vw);h=Math.round(w*vh/vw);}
          if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;cx.drawImage(v,sx,sy,sw,sh,0,0,w,h);
          const d=cx.getImageData(0,0,w,h),r=jsQR(d.data,w,h,{inversionAttempts:n%4===3?'attemptBoth':'dontInvert'});if(r)code=r.data;}}catch(_){}
      this.busy=false;if(code&&!(code===this.lastCode&&Date.now()-this.lastAt<2500)){this.lastCode=code;this.lastAt=Date.now();this.handle(code);}};
    this.raf=requestAnimationFrame(step);},
  handle(code,how){const m=this.mode(),r=evalScan(code,m);r.mode=m;if(m==='practice'&&this.prDup&&r.rec){Object.assign(r,{tone:'warn',code:'DUP',title:'Already scanned',sub:'Scanned at '+fT(now()-4*MIN)+', '+GATE[UI.gate].label+'.'});}
    this.prDup=false;this.show(r,how);},
  show(r,how){this.res=r;const ok=r.tone==='ok',m=r.mode;haptic(ok?40:r.tone==='warn'?[60,60,60]:[200,80,200]);beep(r.tone);
    if(ok&&m==='live'){commitScan(r,how);this.mine++;}else if(m==='practice')this.mine++;else if(m==='post'&&r.rec){log('Audit scan',r.name+', '+r.title);bump();}
    this.paint();if(ok){clearTimeout(this._d);this._d=setTimeout(()=>this.dismiss(),1500);}},
  paint(){const r=this.res,el=$('#scRes');$('#stage').classList.toggle('scanres',!!r);if(!el)return;if(!r){el.innerHTML='';return;}const gst=r.gst,ok=r.tone==='ok';
    const idl='';
    let acts='';
    if(r.code==='DUP')acts='<button class="btn pri" data-act="scDeny">Do not admit</button>'+(r.mode==='live'?'<button class="btn" data-act="scOverride">'+I('lock',18)+'Admit anyway (Manager PIN)</button>':'');
    else if(r.code==='EARLY')acts='<button class="btn pri" data-act="scUpgrade">'+I('card',18)+(r.rec.k===TK.early?aed(VENUE.earlyUpgrade)+' upgrade paid, admit':'Door ticket paid, '+aed(VENUE.doorPrice)+', admit')+'</button><button class="btn" data-act="scDeny">Refuse entry</button>';
    else if(r.code==='UNNAMED')acts='<button class="btn pri" data-act="scClaim">'+I('user',18)+'Take their name, admit</button><button class="btn" data-act="scDeny">Refuse entry</button>';
    else if(r.code==='AUDIT')acts='<button class="btn pri" data-act="scAck">Logged. Next</button>';
    else if(!ok)acts='<button class="btn pri" data-act="scDeny">'+(r.tone==='bad'?'Refuse entry':'Acknowledge')+'</button>'+(r.code==='NOT_FOUND'?'<button class="btn" data-act="scLookup">'+I('search',18)+'Look up by name</button>':'');
    el.innerHTML='<div class="sc-res '+r.tone+'" role="alert"><div class="big-ic">'+I(ok?'check':r.tone==='warn'?'alert':'x',52)+'</div><h2>'+esc(r.title)+(r.mode==='practice'?' · practice':'')+'</h2><div class="who">'+esc(r.name||r.ref||'')+(r.vip?' ★':'')+'</div>'+(r.sub?'<p class="why">'+esc(r.sub)+'</p>':'')+
      (r.rec?'<div class="facts"><div><span>Tier</span><b>'+esc(r.tier)+'</b></div><div><span>'+(r.table?'Table':'Gate')+'</span><b>'+esc(r.table||GATE[r.gateWant].label)+'</b></div>'+(r.table?'<div><span>Seat</span><b class="n">'+r.seatN+'</b></div><div><span>Host</span><b>'+esc(r.host)+'</b></div>':'<div><span>Code</span><b class="n">'+esc(r.ref)+'</b></div><div><span>Standing</span><b>'+(gst?crmLabel(gst):'Not claimed')+'</b></div>')+'</div>':'')+
      (idl?'<div class="idl">'+idl+'</div>':'')+(ok&&r.vip?'<div class="idl">'+I('bell',18)+esc(r.host||'Host')+' has been pinged. Table lit on the floor.</div>':'')+(ok&&r.gateWant&&r.gateWant!==UI.gate&&r.table?'<div class="idl">'+I('gate',18)+'Fast lane for tables is '+esc(GATE[r.gateWant].label)+'</div>':'')+
      (ok?'<div class="bar"><i></i></div>':'<div class="acts">'+acts+'</div>')+'</div>';},
  dismiss(){clearTimeout(this._d);this.res=null;this.paint();this.update();},
  admit(how){const r=this.res;if(!r||!r.rec)return this.dismiss();Object.assign(r,{tone:'ok',code:'OK',title:'Admit',sub:how||''});if(r.mode==='live'){commitScan(r,how);this.mine++;}haptic(40);beep('ok');this.paint();this._d=setTimeout(()=>this.dismiss(),1500);}
};
ON.scNext=()=>{const m=Scan.mode();if(m==='post'){const x=W.tix.find(t=>!t.sc&&t.g>=0&&!t.st&&!t._aud);if(x){x._aud=1;Scan.handle(x.ref);}return;}
  const t=now();Scan.pi++;const inj=Scan.pi%9===0?liveAlerts(t)[0]||W.alerts.find(a=>!a.ack&&a.type==='dup'&&W.byRef[a.ref]&&W.byRef[a.ref].sc&&W.byRef[a.ref].sc<=t):null;if(inj){Scan.handle(inj.ref);return;}
  const q=scanQueue(1);if(q.length)Scan.handle(q[0].ref);};
ON.scPr=el=>{const p=practiceSet()[+el.dataset.i];Scan.prDup=!!p.dup;Scan.handle(p.ref);};
ON.scDeny=()=>{const r=Scan.res;if(r&&r.mode==='live'&&r.tone!=='ok')log('Entry refused',(r.name||r.ref)+': '+r.title+', '+UI.gate);Scan.dismiss();};
ON.scAck=()=>Scan.dismiss();
ON.scOverride=()=>withPin('Admit a ticket that was already scanned',m=>{log('Duplicate overridden',Scan.res.name+', '+UI.gate,m);Scan.res.rec.dupOv=1;if(Scan.res.seat)Scan.res.rec.ar=0;else Scan.res.rec.sc=0;Scan.admit('manager override');});
ON.scUpgrade=()=>{const r=Scan.res;if(r.mode==='live'){if(r.rec.k===TK.early){r.rec.k=TK.wave;r.rec.pr+=VENUE.earlyUpgrade;log('Early entry upgraded',r.name+', +'+aed(VENUE.earlyUpgrade));}else{Act.doorSale(1,'venue terminal');Scan.dismiss();toast('Door ticket recorded and admitted.');return;}}Scan.admit('upgraded at the door');};
ON.scClaim=()=>{const r=Scan.res;const o=Sheet.open({title:'Name this ticket',sub:'Their name goes on the guest list',static:true,body:()=>'<input class="inp" id="clName" placeholder="First and last name"><input class="inp" id="clPhone" type="tel" placeholder="Mobile number"><div class="banner neu">'+I('id',17)+'<span>ID is checked by sight at the gate, as for every guest: original Emirates ID or passport, '+VENUE.minAge+' or older. BUBL stores nothing from the document.</span></div>',
  foot:()=>'<button class="btn pri full" data-act="clGo">'+I('check',18)+'Name taken, admit</button>'});
  ON.clGo=()=>{const n=$('#clName',o.el).value.trim();if(n.length<3){toast('Enter the guest’s name.');return;}const gst={i:W.guests.length,n,ph:$('#clPhone',o.el).value.trim(),crm:0,v:0,res:false,mk:false,ltv:0};W.guests.push(gst);r.rec.g=gst.i;r.rec.cl=now();r.gst=gst;r.name=n;if(r.mode==='live'){log('Ticket named at the gate',n+', '+UI.gate);bump();}Sheet.close();Scan.admit('claimed at the door');};};
ON.scTorch=async()=>{const tr=Scan.stream&&Scan.stream.getVideoTracks()[0];if(!tr){toast('Turn the camera on first.');return;}
  if(!Scan.torchOK){toast('This browser can’t switch the torch on. Ticket screens light themselves, so scans still work in the dark.');return;}
  Scan.torch=!Scan.torch;try{await tr.applyConstraints({advanced:[{torch:Scan.torch}]});$('#scTorch').classList.toggle('on',Scan.torch);}catch(_){Scan.torch=false;$('#scTorch').classList.remove('on');toast('The torch did not turn on.');}};
ON.scCam=()=>{audioUnlock();Scan._re=0;Scan.start();};
/* backgrounding the home screen app kills the camera: let it go, and bring it back on return */
document.addEventListener('visibilitychange',()=>{if(document.hidden){Scan.release();return;}
  if(_ac&&_ac.state!=='running'){try{const r=_ac.resume();if(r&&r.catch)r.catch(()=>{});}catch(_){}}
  if(scanVis()&&!Scan.stream)Scan.start();});
window.addEventListener('pagehide',()=>Scan.release());
window.addEventListener('pageshow',e=>{if(e.persisted&&scanVis()&&!Scan.stream)Scan.start();});
ON.scSound=()=>{UI.sound=!UI.sound;$('#scSnd').innerHTML=I(UI.sound?'vol':'mute',20)+'Sound';$('#scSnd').classList.toggle('on',UI.sound);if(UI.sound)beep('ok');};
ON.scLookup=()=>{if(Scan.res)Scan.dismiss();let q='';Sheet.open({title:'Manual lookup',sub:'Name, phone or ticket code',tall:true,static:true,
  body:()=>'<label class="srch">'+I('search',18)+'<input id="lq" placeholder="Start typing" autocomplete="off" autocapitalize="none"></label><div id="lres" class="rows"></div>',
  onOpen:el=>{const inp=$('#lq',el),res=$('#lres',el);inp.addEventListener('input',()=>{q=inp.value;const r=searchAll(q,25).filter(x=>x.type!=='table');res.innerHTML=q.length<2?'':r.length?r.map(x=>{const ref=x.type==='seat'?x.s.ref:x.x.ref,gst=x.gst;return row(initials(gst.n),gst.crm===2?'neu':'',esc(gst.n),(x.type==='seat'?esc(W.T[tableAt(x.b,now())].name)+', seat '+N(x.s.n):['Early entry','Second wave','VIP standing','Door ticket','Guest list','Promoter list'][x.x.k])+' · '+N(ref),'<button class="btn xs pri" data-act="lkGo" data-r="'+ref+'">Check in</button>');}).join(''):'<p class="note" style="padding-top:10px">No ticket under that name.</p>';});setTimeout(()=>inp.focus(),350);}});};
ON.lkGo=el=>{Sheet.close(true);Scan.handle(el.dataset.r,'manual lookup');};
ON.scDoor=()=>{if(phase()!=='live'){toast('Door sales open with the doors.');return;}let n=1,how='phone';const url='https://bubl.app/ushuaia-dxb/door/'+UI.gate.toLowerCase();
  const o=Sheet.open({title:'Door sale',sub:GATE[UI.gate].label+' · '+aed(VENUE.doorPrice)+' each',static:true,
  body:()=>{const s=S(),room=VENUE.capacity*.95-s.inAll;return (room<50?'<div class="banner bad">'+I('alert',17)+'<span><b>Admissions are at the 95% line.</b> Door sales are on hold until a manager lifts it.</span></div>':'')+
    '<div class="seg"><button class="'+(how==='phone'?'on':'')+'" data-act="dsH" data-h="phone">Guest pays on their phone</button><button class="'+(how==='term'?'on':'')+'" data-act="dsH" data-h="term">Venue terminal</button></div>'+
    (how==='phone'?'<div class="qrbox">'+QR.svg(url,180)+'</div><p class="note" style="text-align:center">The guest scans this, buys a door ticket on the booking page with Apple Pay or a card, and their ticket opens on their phone. Scan it like any other ticket.</p>'
      :'<div style="display:flex;align-items:center;justify-content:space-between"><div class="step"><button data-act="dsN" data-d="-1" aria-label="Fewer">'+I('minus',18)+'</button><b>'+n+'</b><button data-act="dsN" data-d="1" aria-label="More">'+I('plus',18)+'</button></div><div class="big n" style="font-size:30px">'+aed(n*VENUE.doorPrice)+'</div></div><p class="note">Take payment on the venue’s card terminal first, then record it here. Door tickets admit straight away and are matched with the terminal at close-out.</p>');},
  foot:()=>how==='phone'?'<button class="btn pri full" data-act="dsGo">'+I('check',18)+'Ticket bought, admit</button>':'<button class="btn pri full" data-act="dsGo">'+I('card',18)+'Paid on the terminal, admit '+n+'</button>'});
  const rp=()=>{o._b=null;o._f=null;Sheet.paint(o);};ON.dsN=e=>{n=clamp(n+(+e.dataset.d),1,10);rp();};ON.dsH=e=>{how=e.dataset.h;rp();};
  ON.dsGo=()=>{const k=how==='phone'?1:n;Act.doorSale(k,how==='phone'?'booking page (Adyen)':'venue terminal');Scan.mine+=k;Sheet.close();haptic([15,40,15]);toast(N(k)+' door ticket'+(k>1?'s':'')+' '+(how==='phone'?'bought and admitted.':'recorded and admitted.'));refresh(true);};};
