/* ============================================================
   BUBL OPS · Ushuaïa Dubai Harbour · operator layer
   00 · utilities
   ============================================================ */
'use strict';
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sum=(a,f)=>{let s=0;for(let i=0;i<a.length;i++)s+=f?f(a[i],i):a[i];return s;};
const by=(a,f)=>{const m={};a.forEach(x=>{const k=f(x);(m[k]=m[k]||[]).push(x);});return m;};
const MIN=60e3,HOUR=3600e3,DAY=86400e3,GST=4*HOUR;

/* deterministic PRNG: every event's world is reproducible from its id */
function h32(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;const f=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  f.int=(lo,hi)=>lo+Math.floor(f()*(hi-lo+1));f.pick=a=>a[Math.floor(f()*a.length)];f.chance=p=>f()<p;
  f.norm=()=>{let u=0,v=0;while(!u)u=f();while(!v)v=f();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307*v);};
  f.w=(pairs)=>{let t=0;for(const p of pairs)t+=p[1];let x=f()*t;for(const p of pairs){x-=p[1];if(x<=0)return p[0];}return pairs[pairs.length-1][0];};
  return f;}

/* ---- time: everything the operator sees is Gulf Standard Time ---- */
const pad=n=>String(n).padStart(2,'0');
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const g=ms=>new Date(ms+GST);
const gstAt=(y,m,d,hh,mm)=>Date.UTC(y,m-1,d,hh||0,mm||0)-GST;
const fT=ms=>{const d=g(ms);return pad(d.getUTCHours())+':'+pad(d.getUTCMinutes());};
const fD=ms=>{const d=g(ms);return DOW[d.getUTCDay()]+' '+d.getUTCDate()+' '+MON[d.getUTCMonth()];};
const fDS=ms=>{const d=g(ms);return d.getUTCDate()+' '+MON[d.getUTCMonth()];};
const fISO=ms=>{const d=g(ms);return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());};
const fDT=ms=>fD(ms)+', '+fT(ms);
function fDur(ms){const a=Math.abs(ms),d=Math.floor(a/DAY),h=Math.floor(a%DAY/HOUR),m=Math.floor(a%HOUR/MIN);
  return d>0?d+'d '+pad(h)+'h':h>0?h+'h '+pad(m)+'m':m+'m';}
function fAgo(ms){const a=Math.max(0,ms);return a<MIN?'now':a<HOUR?Math.floor(a/MIN)+'m ago':a<DAY?Math.floor(a/HOUR)+'h ago':Math.floor(a/DAY)+'d ago';}

/* ---- numerals: JetBrains Mono everywhere, via .n ---- */
const n0=v=>Math.round(v).toLocaleString('en-US');
const N=v=>'<span class="n">'+v+'</span>';
const aed=v=>'AED '+n0(v);
function kfmt(v){const a=Math.abs(v);return a>=1e6?(v/1e6).toFixed(a>=1e7?1:2)+'M':a>=1e4?Math.round(v/1e3)+'K':a>=1e3?(v/1e3).toFixed(1)+'K':String(Math.round(v));}
const aedK=v=>'AED '+kfmt(v);
const A=v=>N(aed(v)),AK=v=>N(aedK(v));
const pct=(a,b,dp)=>b?(a/b*100).toFixed(dp||0)+'%':'0%';
const P=(a,b,dp)=>N(pct(a,b,dp));

/* ---- icons: 24-grid strokes, inherit currentColor ---- */
const IC={
  home:'M3 11l9-7 9 7M5.5 9.5V20h13V9.5',
  floor:'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  scan:'M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16',
  search:'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  check:'M5 12.5l4.5 4.5L19 7',
  x:'M6 6l12 12M18 6L6 18',
  alert:'M12 4l9 16H3zM12 10v4.5M12 17.4v.2',
  clock:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7.5V12l3 2',
  user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0',
  users:'M9 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 19.5a6.5 6.5 0 0113 0M16 5.2a3.5 3.5 0 010 6.6M18 14.3a6.5 6.5 0 013.5 5.2',
  torch:'M9 3h6l-1 6h3l-7 12 1.5-8.5H8z',
  cloud:'M7 18a4.5 4.5 0 01-.5-9 6 6 0 0111.5 1.5A3.8 3.8 0 0117.5 18z',
  cloudoff:'M7 18a4.5 4.5 0 01-.5-9M9.5 6.2A6 6 0 0118 10.5 3.8 3.8 0 0119.6 17M3 3l18 18',
  sync:'M4 12a8 8 0 0113.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 01-13.7 5.6L4 15M4 20v-5h5',
  lock:'M6.5 11h11V20h-11zM8.5 11V8a3.5 3.5 0 017 0v3',
  unlock:'M6.5 11h11V20h-11zM8.5 11V8a3.5 3.5 0 016.6-1.6',
  down:'M6 9l6 6 6-6',up:'M6 15l6-6 6 6',right:'M9 6l6 6-6 6',left:'M15 6l-6 6 6 6',
  plus:'M12 5v14M5 12h14',minus:'M5 12h14',
  tup:'M5 16l5-5 3 3 6-7M14 7h5v5',tdown:'M5 8l5 5 3-3 6 7M14 17h5v-5',tflat:'M4 12h16',
  share:'M12 15V4M8 7.5L12 4l4 3.5M5 12v7h14v-7',
  dl:'M12 4v11M8 11.5l4 3.5 4-3.5M5 19h14',
  bell:'M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5h4',
  card:'M3 6.5h18v11H3zM3 10h18M6.5 14.5h3',
  cash:'M3 7h18v10H3zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM6 9.5v.1M18 14.4v.1',
  star:'M12 4l2.4 5 5.6.7-4.1 3.8 1.1 5.5L12 16.3 7 19l1.1-5.5L4 9.7 9.6 9z',
  shield:'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6zM9 12l2.2 2.2L15.2 10',
  flag:'M5 21V4M5 5h11l-1.5 3.5L16 12H5',
  filter:'M4 6h16M7 12h10M10 18h4',
  layers:'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
  play:'M8 5l11 7-11 7z',pause:'M8 5v14M16 5v14',
  undo:'M8 5L4 9l4 4M4 9h10a5 5 0 010 10h-3',
  edit:'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  link:'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1',
  msg:'M4 5h16v11H9l-5 4z',
  more:'M5 12h.1M12 12h.1M19 12h.1',
  gate:'M4 20V8l8-4 8 4v12M9 20v-6h6v6',
  glass:'M7 4h10l-1.2 7a3.9 3.9 0 01-7.6 0zM12 14.5V20M8.5 20h7',
  run:'M13.5 5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6 21l3-6 3 2v4M9 15l1-5 4 1 2 3h3M10 10L7 9l-2 3',
  swap:'M4 8h13M13.5 4.5L17 8l-3.5 3.5M20 16H7M10.5 12.5L7 16l3.5 3.5',
  note:'M6 3.5h9l3.5 3.5V20.5H6zM14.5 3.5V7.5H18M9 12h6M9 15.5h6',
  phone:'M6.5 3.5h3l1.5 4-2 1.5a11 11 0 006 6l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5.5a2 2 0 012-2z',
  id:'M3 6h18v12H3zM8.5 13a2 2 0 100-4 2 2 0 000 4zM5.5 16a3.2 3.2 0 016 0M14 10h4.5M14 13.5h3',
  grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  chart:'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  pie:'M12 3v9h9A9 9 0 1112 3zM15 3.5A9 9 0 0120.5 9H15z',
  cal:'M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
  doc:'M6 3.5h9l3.5 3.5V20.5H6zM14.5 3.5V7.5H18',
  cog:'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8',
  pin:'M12 21s6.5-5.6 6.5-11A6.5 6.5 0 005.5 10c0 5.4 6.5 11 6.5 11zM12 12.3a2.3 2.3 0 100-4.600 2.3 2.3 0 000 4.6z',
  net:'M6 7a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM12 21a2 2 0 100-4 2 2 0 000 4zM5 15a2 2 0 100-4 2 2 0 000 4zM7.800 5.600l8.300 1.100M6.800 6.800L11 17.200M17 8.800l-4.200 8.400M6.800 13.700l3.600 4',
  half:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v18',
  wave:'M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0',
  expand:'M4 10V4h6M20 14v6h-6M4 4l7 7M20 20l-7-7',
  vol:'M4 9.500h3.500L12 6v12l-4.500-3.500H4zM15.500 9a4 4 0 010 6M18 6.500a7.500 7.500 0 010 11',
  mute:'M4 9.500h3.500L12 6v12l-4.500-3.500H4zM16 9.500l4.500 5M20.500 9.500l-4.500 5',
  spark:'M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9zM18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  send:'M12 19V5M6 11l6-6 6 6',
  bulb:'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z'
};
const initials=n=>{const w=String(n).replace(/[^A-Za-z\u00C0-\u017F .]/g,'').split(' ').filter(Boolean);return (w.length>1?w[0][0]+w[w.length-1][0]:String(n).slice(0,2)).toUpperCase();};
const stripTags=h=>String(h).replace(/<[^>]+>/g,'');
function I(name,size){const s=size||18;return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(IC[name]||'')+'"/></svg>';}
/* state glyph + label: colour is never the only signal */
const STATE={
  seated:{c:'ok',ic:'check',l:'Seated'},partial:{c:'warn',ic:'half',l:'Partial'},noshow:{c:'bad',ic:'x',l:'No-show'},
  expected:{c:'neu',ic:'clock',l:'Expected'},open:{c:'mut',ic:'plus',l:'Open'},held:{c:'mut',ic:'lock',l:'Held'},
  requested:{c:'neu',ic:'bell',l:'Requested'},oos:{c:'mut',ic:'minus',l:'Out of service'},
  above:{c:'ok',ic:'tup',l:'Above minimum'},below:{c:'warn',ic:'tdown',l:'Below minimum'},unsold:{c:'mut',ic:'minus',l:'Unsold'}
};
function pill(state,txt){const s=STATE[state]||{c:state,ic:null,l:txt};return '<span class="pill '+s.c+'">'+(s.ic?I(s.ic,12):'')+esc(txt||s.l)+'</span>';}
function tag(cls,ic,txt){return '<span class="pill '+cls+'">'+(ic?I(ic,12):'')+esc(txt)+'</span>';}
function trend(v,unit){const up=v>0.5,dn=v<-0.5;return '<span class="trend">'+I(up?'tup':dn?'tdown':'tflat',14)+N((v>0?'+':'')+Math.round(v)+(unit||''))+'</span>';}

/* ---- the clock: real time by default; the simulation can move it ---- */
const Clock={mode:'real',simAt:0,realAt:0,speed:1,
  now(){return this.mode==='real'?Date.now():this.simAt+(performance.now()-this.realAt)*this.speed;},
  set(ms,speed){this.mode='sim';this.simAt=ms;this.realAt=performance.now();this.speed=speed==null?this.speed:speed;},
  setSpeed(s){this.set(this.now(),s);},
  real(){this.mode='real';this.speed=1;}
};
const isIOS=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isPhone=()=>(navigator.maxTouchPoints||0)>0&&Math.min(screen.width,screen.height)<900;
const standalone=()=>window.navigator.standalone===true||!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
/* iPhone has no vibrate(). Safari gives a system haptic when a switch control toggles,
   so a hidden switch is toggled once per pulse: one for admit, two for a warning, three for a refusal. */
let _hl=null;
function iosTap(p){if(!isIOS())return;const ae=document.activeElement;if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'))return;
  if(!_hl){_hl=document.createElement('label');_hl.setAttribute('aria-hidden','true');_hl.style.cssText='position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden';
    const i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');i.tabIndex=-1;_hl.appendChild(i);_hl.addEventListener('click',e=>e.stopPropagation());document.body.appendChild(_hl);}
  const n=Array.isArray(p)?(p[0]>=150?3:2):1;for(let k=0;k<n;k++)setTimeout(()=>{try{_hl.click();}catch(_){}},k*120);}
const haptic=p=>{try{if(navigator.vibrate&&!isIOS()){navigator.vibrate(p);return;}iosTap(p);}catch(_){}};
let _ac=null;
/* iPhone only plays sound after a tap, and mutes web audio on the silent switch.
   The first tap unlocks audio; the playback session keeps door beeps audible on silent. */
function audioUnlock(){if(_ac&&_ac.state==='running')return;try{if(navigator.audioSession&&UI&&UI.sound&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';}catch(_){}
  try{_ac=_ac||new (window.AudioContext||window.webkitAudioContext)();const r=_ac.resume();if(r&&r.catch)r.catch(()=>{});const b=_ac.createBuffer(1,1,22050),src=_ac.createBufferSource();src.buffer=b;src.connect(_ac.destination);src.start(0);}catch(_){}}
['touchend','pointerup','keydown'].forEach(ev=>document.addEventListener(ev,audioUnlock,{capture:true,passive:true}));
function beep(kind){if(!UI||!UI.sound)return;try{_ac=_ac||new (window.AudioContext||window.webkitAudioContext)();if(_ac.state!=='running'){const r=_ac.resume();if(r&&r.catch)r.catch(()=>{});}const o=_ac.createOscillator(),gn=_ac.createGain();
  o.frequency.value=kind==='ok'?1180:kind==='warn'?620:300;o.type=kind==='ok'?'sine':'square';gn.gain.value=.06;o.connect(gn);gn.connect(_ac.destination);o.start();o.stop(_ac.currentTime+(kind==='ok'?.09:.22));}catch(_){}}
const reduceMotion=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
