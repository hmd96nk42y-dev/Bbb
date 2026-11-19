/* ================= his hits · tap him, on the header or at the booth, for five seconds of a hit =================
   The tracks, artwork and audio are Apple Music's public 30-second previews, looked up live; no audio is stored in this file.
   Each preview is scanned once for the five seconds that hit hardest (the hook or the drop) and only that part plays. */
const HITS={'Black Coffee':[
  {q:'Drive',by:'David Guetta, Black Coffee & Delilah Montagu'},
  {q:'Superman',by:'Black Coffee feat. Bucie'},
  {q:'We Dance Again',by:'Black Coffee feat. Nakhane'},
  {q:'Wish You Were Here',by:'Black Coffee feat. Msaki'},
  {q:'10 Missed Calls',by:'Black Coffee, Pharrell Williams & Jozzy'},
  {q:'Never Gonna Forget',by:'Black Coffee, Diplo & Elderbrook'}
]};
const HIT_DUR=5,HIT_F=20;
const HP={by:{},cur:null,H:null,mode:null,t0:0,off:0,src:null,gain:null,aud:null,ctx:null,raf:0,sess:false,silent:null,startedAt:0};
const HIT_IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

function hitsOf(ev){if(!ev||!HITS[ev.head])return null;const key=ev.head;
  if(!HP.by[key])HP.by[key]={key,next:0,ready:null,artistUrl:'',list:HITS[key].map((d,i)=>({i,q:d.q,name:d.q,artist:d.by,year:'',art:'',preview:'',url:'',id:0,off:null,env:null,buf:null,st:'idle',an:null}))};
  return HP.by[key];}

/* ---- Apple Music lookups (JSONP, so it works from any frame) ---- */
let _hjn=0;
function hitJsonp(url){return new Promise((res,rej)=>{const cb='__hitcb'+(++_hjn),s=document.createElement('script');let done=false;
  const end=()=>{done=true;clearTimeout(to);window[cb]=function(){};s.remove();};
  const to=setTimeout(()=>{if(!done){end();rej(new Error('timeout'));}},9000);
  window[cb]=d=>{if(!done){end();res(d);}};s.onerror=()=>{if(!done){end();rej(new Error('net'));}};
  s.src=url+'&callback='+cb;document.head.appendChild(s);});}
const _hn=s=>String(s||'').toLowerCase().replace(/\s*[\(\[][^\)\]]*[\)\]]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function hitPick(rs,tr,artist){let best=null,bs=-1e9;const q=_hn(tr.q),al=artist.toLowerCase();
  (rs||[]).forEach(r=>{if(!r||r.kind!=='song'||!r.previewUrl)return;if(String(r.artistName||'').toLowerCase().indexOf(al)<0)return;
    const n=_hn(r.trackName);let sc;if(n===q)sc=10;else if(n.indexOf(q)===0)sc=3;else return;
    if(/remix|mix\)|extended|\bedit\b|\blive\b|instrumental|acapella|a cappella|\bdub\b|version|radio/i.test(r.trackName||''))sc-=8;
    if(/remix|mixed|compilation|essentials|best of|hits/i.test(r.collectionName||''))sc-=2;
    const y=parseInt(String(r.releaseDate||'').slice(0,4),10)||2100;sc-=(y-1990)*.01;   /* the original release wins a tie */
    if(sc>bs){bs=sc;best=r;}});
  return best;}
function hitsLoad(H){if(H.ready)return H.ready;
  H.ready=Promise.all(H.list.map(tr=>hitJsonp('https://itunes.apple.com/search?media=music&entity=song&limit=25&term='+encodeURIComponent(H.key+' '+tr.q))
    .then(d=>{const r=hitPick(d&&d.results,tr,H.key);if(!r){tr.st='none';return;}
      tr.id=r.trackId;tr.name=String(r.trackName||tr.q).replace(/\s*\((feat|with|ft)\.?\s[^)]*\)/ig,'').trim()||tr.q;tr.artist=r.artistName||tr.artist;
      tr.year=String(r.releaseDate||'').slice(0,4);tr.art=String(r.artworkUrl100||'').replace(/\/\d+x\d+bb\./,'/200x200bb.');tr.preview=r.previewUrl;tr.url=r.trackViewUrl||'';tr.st='ok';
      if(!H.artistUrl&&String(r.artistName||'').toLowerCase().indexOf(H.key.toLowerCase())===0&&r.artistViewUrl)H.artistUrl=r.artistViewUrl;
      try{const o=parseFloat(localStorage.getItem('ush.hit.'+tr.id));if(o>=0)tr.off=o;}catch(_){}})
    .catch(()=>{tr.st='err';}))).then(()=>{hitsPaint(H);});
  return H.ready;}

/* ---- the scan: loudness every 50 ms, then the five seconds that are loudest and land hardest ---- */
function hitDecodeCtx(){const C=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!C)return null;try{return new C(2,44100,44100);}catch(_){return null;}}
function hitAnalyse(tr){if(tr.an)return tr.an;
  tr.an=(async()=>{if(!tr.preview||!window.fetch)throw 0;const dc=hitDecodeCtx();if(!dc)throw 0;
    const r=await fetch(tr.preview,{mode:'cors',credentials:'omit'});if(!r.ok)throw 0;const ab=await r.arrayBuffer();
    const buf=await new Promise((res,rej)=>{try{const p=dc.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej);}catch(e){rej(e);}});
    const hop=Math.floor(buf.sampleRate/HIT_F),n=Math.floor(buf.length/hop),ch=[];for(let c=0;c<buf.numberOfChannels;c++)ch.push(buf.getChannelData(c));
    const env=new Float32Array(n);let mx=1e-6;
    for(let k=0;k<n;k++){let s=0,m=0;const a=k*hop;for(let j=0;j<hop;j+=3){let v=0;for(let c=0;c<ch.length;c++)v+=ch[c][a+j];v/=ch.length;s+=v*v;m++;}const e=Math.sqrt(s/m);env[k]=e;if(e>mx)mx=e;}
    for(let k=0;k<n;k++)env[k]/=mx;
    tr.env=env;tr.buf=buf;
    if(tr.off==null){tr.off=hitBest(env);try{localStorage.setItem('ush.hit.'+tr.id,tr.off.toFixed(2));}catch(_){}}
  })().catch(()=>{tr.noScan=true;});
  return tr.an;}
function hitBest(env){const F=HIT_F,n=env.length,W=HIT_DUR*F,lo=Math.round(.5*F),hi=n-W-Math.round(2.5*F);   /* skip Apple's fade in and fade out */
  if(hi<=lo)return Math.max(0,Math.min(.5,(n-W)/F));
  const P=new Float64Array(n+1);for(let i=0;i<n;i++)P[i+1]=P[i]+env[i];const m=(a,b)=>(P[b]-P[a])/Math.max(1,b-a);
  let bs=lo,best=-1;
  for(let s=lo;s<=hi;s++){const sc=m(s,s+W)+.45*Math.max(0,m(s,s+16)-m(Math.max(0,s-30),s));if(sc>best){best=sc;bs=s;}}
  let b2=bs,rise=-1;for(let s=Math.max(1,bs-8);s<=Math.min(hi,bs+8);s++){const d=env[s]-env[s-1];if(d>rise){rise=d;b2=s;}}   /* start right on the hit */
  return Math.max(0,(b2-1)/F);}

/* ---- playback: Web Audio with a soft fade when the scan worked, a plain audio element otherwise ---- */
function hitAud(){if(HP.aud)return HP.aud;const a=new Audio();a.preload='auto';a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');HP.aud=a;return a;}
function hitCtx(){if(HP.ctx)return HP.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{HP.ctx=new C();}catch(_){HP.ctx=null;}return HP.ctx;}
function hitWake(){   /* runs inside the tap: lets the phone play sound even on silent, and wakes the audio engine */
  if(!HP.sessTried){HP.sessTried=true;let top=null;try{top=window.top;}catch(_){}[window,top].forEach(w=>{try{if(w&&w.navigator&&w.navigator.audioSession){w.navigator.audioSession.type='playback';HP.sess=true;}}catch(_){}});}
  const ctx=hitCtx();if(ctx&&ctx.state!=='running'){try{const p=ctx.resume();if(p&&p.catch)p.catch(()=>{});}catch(_){}}}
function hitPlay(H,i,from){const tr=H.list[i];if(!tr)return;
  if(tr.st==='none'||tr.st==='err'){toast(tr.st==='err'?"Couldn't reach Apple Music, try again in a moment":"That one isn't on Apple Music here");return;}
  hitStop(true);HP.cur=tr;HP.H=H;HP.from=from;HP.mode=null;HP.startedAt=performance.now();H.next=(i+1)%H.list.length;
  hitWake();
  const el=hitAud(),willWait=!(tr.buf||tr.noScan);HP.live=false;
  if(willWait){try{el.src=hitSilent();const p=el.play();if(p&&p.catch)p.catch(()=>{});}catch(_){}}   /* the sound starts a moment later, so claim the audio element now, inside the tap */
  const go=()=>{if(HP.cur!==tr)return;if(!tr.preview){hitStop();toast(tr.st==='none'?"That one isn't on Apple Music here":"Couldn't reach Apple Music, try again in a moment");return;}
    const off=tr.off!=null?tr.off:.5;HP.off=off;
    if(tr.buf&&hitWaOk()){const ctx=HP.ctx,src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=tr.buf;src.connect(g);g.connect(ctx.destination);const t=ctx.currentTime+.03;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.05);g.gain.setValueAtTime(1,t+HIT_DUR-.75);g.gain.linearRampToValueAtTime(0,t+HIT_DUR);
      try{src.start(t,off,HIT_DUR+.05);}catch(_){src.start(t,off);}
      HP.src=src;HP.gain=g;HP.mode='wa';HP.t0=performance.now()+30;try{el.pause();}catch(_){}}
    else{HP.mode='el';el.src=tr.preview+'#t='+off.toFixed(2)+','+(off+HIT_DUR).toFixed(2);
      const p=el.play();if(p&&p.catch)p.catch(()=>{if(HP.cur===tr){hitStop();toast('Tap a track to hear it');}});}
    hitsPaint(H);const nx=H.list[H.next];if(nx&&nx.preview)hitAnalyse(nx);};   /* get the next one ready */
  /* not scanned yet: give the scan a moment to find the hook (a beat if the spot is already known from last time) */
  const scanThen=()=>{if(!tr.preview||tr.buf||tr.noScan){go();return;}Promise.race([hitAnalyse(tr),new Promise(r=>setTimeout(r,tr.off!=null?300:2600))]).then(go);};
  hitsPaint(H);hitLoop();
  if(tr.preview)scanThen();else hitsLoad(H).then(scanThen);}
function hitWaOk(){const c=HP.ctx;return !!(c&&c.state==='running'&&(!HIT_IOS||HP.sess));}
function hitSilent(){if(HP.silent)return HP.silent;const n=800,b=new Uint8Array(44+n),v=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i);};
  w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);b.fill(128,44);
  return HP.silent=URL.createObjectURL(new Blob([b],{type:'audio/wav'}));}
function hitStop(quiet){cancelAnimationFrame(HP.raf);HP.raf=0;
  if(HP.src){const s=HP.src,g=HP.gain;HP.src=null;HP.gain=null;try{const t=HP.ctx.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.12);s.stop(t+.14);}catch(_){try{s.stop();}catch(__){}}}
  if(HP.aud){try{HP.aud.pause();}catch(_){}}
  const H=HP.H;HP.cur=null;HP.mode=null;hitsTick(0,0);if(H&&!quiet)hitsPaint(H);}
function hitLoop(){cancelAnimationFrame(HP.raf);
  const step=()=>{const tr=HP.cur;if(!tr)return;let e=0;
    if(HP.mode==='wa')e=(performance.now()-HP.t0)/1000;
    else if(HP.mode==='el'){const a=HP.aud;if(a&&!a.paused&&a.readyState>0){if(a.currentTime<HP.off-.4){try{a.currentTime=HP.off;}catch(_){}}e=Math.max(0,a.currentTime-HP.off);}}
    if(!HP.mode||(HP.mode==='el'&&e===0)){if(performance.now()-HP.startedAt>9000){hitStop();toast("Couldn't load the preview");return;}}
    if(e>0&&!HP.live){HP.live=true;hitsPaint(HP.H);}
    const k=Math.min(1,e/HIT_DUR);let lv=0;
    if(e>0){if(tr.env){const ix=Math.round((HP.off+e)*HIT_F);lv=Math.pow(tr.env[Math.min(tr.env.length-1,ix)]||0,1.8);}else lv=.25+.5*Math.pow(.5+.5*Math.cos(e*Math.PI*2*2.07),4);}
    hitsTick(k,lv*Math.min(1,e/.15)*Math.max(0,Math.min(1,(HIT_DUR-e)/.7)));
    if(e>=HIT_DUR){hitStop();return;}
    HP.raf=requestAnimationFrame(step);};
  HP.raf=requestAnimationFrame(step);}

/* ---- what it looks like: the header pill and progress, his glow, the rows in his sheet ---- */
function hitsTick(k,lv){const h=document.getElementById('evHero');if(h){h.style.setProperty('--hl',Math.min(1,lv*1.1).toFixed(3));const p=h.querySelector('.eh-prog i');if(p)p.style.transform='scaleX('+k.toFixed(4)+')';}
  const on=document.querySelector('.hh-row.on .rp');if(on)on.style.strokeDashoffset=(94.25*(1-k)).toFixed(2);}
function hitsPaint(H){const cur=HP.cur,h=document.getElementById('evHero');
  if(h&&h.classList.contains('has-hits')&&S.ev&&S.ev.head===H.key){const playing=!!cur&&HP.H===H;h.classList.toggle('is-playing',playing);
    const t=h.querySelector('.eh-ht');if(t)t.textContent=playing?cur.name:'Top hits';
    const b=h.querySelector('.eh-hits');if(b)b.setAttribute('aria-label',playing?'Playing '+cur.name+'. Open '+H.key+'’s top hits':'Open '+H.key+'’s top hits');}
  document.querySelectorAll('.hh[data-k]').forEach(box=>{if(box.dataset.k!==H.key)return;
    H.list.forEach((tr,i)=>{const row=box.querySelector('.hh-row[data-i="'+i+'"]');if(!row)return;
      const on=cur===tr;row.classList.toggle('on',on);row.classList.toggle('wait',on&&!HP.live);row.classList.toggle('off',tr.st==='none');
      if(!on){const rp=row.querySelector('.rp');if(rp)rp.style.strokeDashoffset='94.25';}
      row.querySelector('b').textContent=tr.name;row.querySelector('small').textContent=tr.artist+(tr.year?' · '+tr.year:'');
      const art=row.querySelector('.hh-art');if(tr.art&&!art.querySelector('img')){const im=new Image();im.alt='';im.decoding='async';im.onerror=()=>im.remove();im.src=tr.art;art.appendChild(im);}
      row.setAttribute('aria-label',(on?'Playing ':'Play five seconds of ')+tr.name);});
    const src=box.querySelector('.hh-src a');if(src&&H.artistUrl)src.href=H.artistUrl;});}
function hitsHero(h,ev){const H=hitsOf(ev);if(!h)return;
  h.classList.toggle('has-hits',!!H);h.style.removeProperty('--hl');
  if(!H){h.removeAttribute('role');h.removeAttribute('tabindex');h.removeAttribute('aria-label');return;}
  h.setAttribute('role','button');h.setAttribute('tabindex','0');h.setAttribute('aria-label','Play five seconds of a '+H.key+' hit');
  const ph=h.querySelector('.eh-ph'),sh=ph&&ph.querySelector('.eh-sh');
  if(ph&&sh&&!ph.querySelector('.eh-glow')){const g=document.createElement('i');g.className='eh-sh eh-glow';g.setAttribute('style',sh.getAttribute('style')||'');ph.appendChild(g);}
  if(!h.querySelector('.eh-hits')){const b=document.createElement('button');b.type='button';b.className='eh-hits';b.innerHTML='<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="eh-ht">Top hits</span><span class="eh-chev" aria-hidden="true"></span>';h.appendChild(b);}
  if(!h.querySelector('.eh-prog')){const p=document.createElement('div');p.className='eh-prog';p.innerHTML='<i></i>';h.appendChild(p);}
  hitsPaint(H);if(!H.ready)setTimeout(()=>hitsLoad(H),900);}
function hitsSheet(ev){const H=hitsOf(ev),body=document.getElementById('djBody');if(!H||!body)return;
  const rows=H.list.map((tr,i)=>`<button class="hh-row" type="button" data-i="${i}"><span class="hh-art"><span class="hh-n">${i+1}</span></span><span class="hh-tx"><b></b><small></small></span><span class="hh-pl" aria-hidden="true"><svg viewBox="0 0 34 34"><circle class="rg" cx="17" cy="17" r="15"/><circle class="rp" cx="17" cy="17" r="15"/></svg><span class="tri"></span><span class="eq"><i></i><i></i><i></i><i></i></span></span></button>`).join('');
  const sec=document.createElement('div');sec.innerHTML=`<h4 class="lu-h">Top hits</h4><div class="hh" data-k="${esc(H.key)}">${rows}<p class="hh-src">Five-second previews from Apple Music. <a href="https://music.apple.com/search?term=${encodeURIComponent(H.key)}" target="_blank" rel="noopener">Hear the full tracks</a></p></div>`;
  const ab=body.querySelector('.lu-ab');if(ab&&ab.nextSibling)body.insertBefore(sec,ab.nextSibling);else body.insertBefore(sec,body.firstChild);
  sec.querySelectorAll('.hh-row').forEach(r=>r.addEventListener('click',()=>{const i=+r.dataset.i,tr=H.list[i];if(tr&&HP.cur===tr){hitStop();return;}hitPlay(H,i,'sheet');}));
  hitsPaint(H);hitsLoad(H).then(()=>{H.list.reduce((pr,tr)=>pr.then(()=>tr.preview&&typeof openSheetEl!=='undefined'&&openSheetEl&&openSheetEl.id==='djSheet'?hitAnalyse(tr):null),Promise.resolve());});}

/* ---- wiring ---- */
(function(){const h=document.getElementById('evHero');if(!h)return;
  const fire=e=>{if(!h.classList.contains('has-hits'))return;if(e.target.closest('.eh-hits')){e.stopPropagation();openDj();return;}
    const H=hitsOf(S.ev);if(H)hitPlay(H,H.next||0,'hero');};
  h.addEventListener('click',fire);
  h.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===h){e.preventDefault();fire(e);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hitStop();});
  /* on the first touch anywhere, quietly get his first hit ready (no sound, nothing interrupted) */
  const early=()=>{document.removeEventListener('pointerdown',early,true);const H=hitsOf(S.ev);if(H)hitsLoad(H).then(()=>{const t=H.list[H.next||0];if(t&&t.preview)hitAnalyse(t);});};
  document.addEventListener('pointerdown',early,true);
  try{hitsHero(h,S.ev);}catch(_){}})();
