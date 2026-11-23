/*!
 * BUBL Social Tables — drop-in module v1.0
 * bubl (algorithm-created tables) + Public tables, one engine for every venue.
 *
 * Add to any venue build (same folder in the Bbb repo):
 *   <script src="bubl-social.js"><\/script>
 *   <div id="bubl-social"></div>
 *   <script> const social = BUBLSocial.mount({ el:'#bubl-social', ...venue config... }); <\/script>
 *
 * Hooks for the venue's own 3D / plan view:
 *   social.glowFor(tableId)   -> {type:'bubl'|'public', color} or null  (colour the venue's own table with it)
 *   social.openTable(tableId) -> opens that table's detail (call it when a glowing table is tapped)
 *   social.update({...})      -> change mode / pricing / brand / data (e.g. bar -> club at midnight)
 *   social.setBooking(b)      -> hand over the guest's booking from the venue's own booking flow
 *   social.openGoPublic()     -> open "make my table public" for that booking
 *
 * Brand: by default the module reads the venue build it sits in (page background, text colour,
 * body font, heading font, and the accent from the venue's own CSS variable) and styles itself with it.
 *   brand:{ vars:{accent:'--gold'}, headingSelector:'.venue-title' }   // point it at the build's own tokens
 *   brand:{ accent:'#D6B66E', display:'"Playfair Display"', body:'Jost', radius:'4px' } // or set them outright
 *   onChange(state)           -> config callback, fires whenever tables change (re-glow your venue)
 *   social.destroy()
 */
(function(){
'use strict';
if (window.BUBLSocial) return;

const BUBL_PURPLE = '#A77BFF';            // bubl tables always glow purple, in every venue
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap';

const DEFAULT_THEME = {
  '--bg':'#0E0817','--bg2':'#160E22','--bg3':'#1E1430','--line':'rgba(214,182,110,.22)','--line2':'rgba(255,255,255,.08)',
  '--gold':'#D6B66E','--gold2':'#F0DDA8','--text':'#F3EEE6','--muted':'#A79DB3','--dim':'#6E6480',
  '--green':'120,196,140','--male':'#8FA6C9','--female':'#D49AAF'
};
const LISTS = {
  nat:['French','Lebanese','British','Emirati','Italian','Indian','Egyptian','Russian','American','Saudi','Other'],
  ind:['Finance','Tech','Real estate','Fashion','Media','Hospitality','Law','Art & design','Healthcare','Founder'],
  hob:['Padel','Art','Surfing','F1','Fitness','Travel','Wine','Music','Golf','Yoga','Fashion','Kitesurf','Reading','Cooking']
};
const SEG=['#D6B66E','#B89BDF','#8FC9A9','#D49AAF','#8FA6C9','#E3A869','#9CC4D8','#CDB4E8'];

/* ---------------- shared account (one bubl account across every venue) ---------------- */
const ACCOUNT_KEY='bubl.account.v1';
function loadAccount(){ try{ const a=JSON.parse(localStorage.getItem(ACCOUNT_KEY)); return a&&a.verified?a:null; }catch(e){ return null; } }
function saveAccount(a){ try{ localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a)); }catch(e){} }
function clearAccount(){ try{ localStorage.removeItem(ACCOUNT_KEY); }catch(e){} }

/* ---------------- styles (scoped inside shadow DOM, never leak into the venue) ---------------- */
const CSS = `
:host{display:block;color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.35;text-align:left}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
input{font:inherit;color:var(--text)}
a{color:inherit}
.mono{font-family:var(--mono);font-size:10.5px;letter-spacing:var(--label-track);text-transform:var(--label-case);color:var(--muted)}
.serif,.h2,.ring .pct,.offer-amt .v,.seat .nm,.plan .where b,.bw{font-family:var(--serif)!important;font-weight:var(--display-weight)!important;letter-spacing:var(--display-track)}
.note{font-size:12.5px;color:var(--muted);line-height:1.45}
.row{display:flex;align-items:center;gap:10px}
.between{display:flex;align-items:center;justify-content:space-between;gap:10px}
.card{background:var(--bg2);border:1px solid var(--line2);border-radius:var(--r);padding:14px;margin-bottom:12px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:var(--btn-r);background:var(--gold);color:var(--ink);font-weight:600;font-size:15px;text-decoration:none}
.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--gold2)}
.btn.plain{background:transparent;color:var(--muted);font-weight:500}
.btn.apple{background:#fff;color:#000}
.btn[disabled]{opacity:.35;pointer-events:none}
.hide{display:none!important}
.gsym{font-family:-apple-system,system-ui,'Segoe UI Symbol',sans-serif;font-size:12px}
.gsym.m{color:var(--male)} .gsym.f{color:var(--female)}

/* panel */
.acct{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.acct button{color:var(--gold);font-size:13px}
.tabs{display:flex;border-bottom:1px solid var(--line2);margin-bottom:12px}
.tabs button{flex:1;padding:11px 0 10px;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px;font-weight:500}
.tabs button.on{color:var(--text);border-color:var(--gold)}
.tabs img{height:17px}
.tabs .bw{font-family:var(--serif);font-size:19px}
.tabs .dot{width:8px;height:8px;border-radius:50%}
.sub-tabs{display:flex;gap:6px;margin-bottom:12px}
.sub-tabs button{padding:6px 12px;border-radius:99px;border:1px solid var(--line2);font-size:13px;color:var(--muted)}
.sub-tabs button.on{border-color:var(--gold);color:var(--gold2)}

.plan{background:var(--bg2);border:1px solid var(--line2);border-radius:var(--r);padding:8px 6px 6px;margin-bottom:12px}
.plan svg{display:block;width:100%;height:auto}
.plan .where{display:flex;justify-content:space-between;align-items:center;padding:6px 8px 4px;gap:8px}
.plan .where b{font-family:var(--serif);font-weight:400;font-size:17px;color:var(--gold2)}
.plan g[data-t]{cursor:pointer}
.legend{display:flex;gap:14px;align-items:center;padding:6px 8px 4px;flex-wrap:wrap}
.legend span{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.legend i{width:16px;height:9px;border-radius:2px;border:1.4px solid currentColor;display:inline-block}
.closeup{border-top:1px solid var(--line2);margin:6px 4px 0;padding-top:4px}
.closeup g[data-cseat]{cursor:pointer}

.bcard{background:var(--bg2);border:1px solid var(--line2);border-radius:var(--r);padding:14px 14px 12px;margin-bottom:12px;cursor:pointer;position:relative;overflow:hidden}
.bcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--type)}
.bc-top{display:flex;gap:12px;align-items:flex-start}
.match{flex:0 0 74px;display:flex;flex-direction:column;align-items:center;text-align:center}
.ring{position:relative;width:66px;height:66px}
.ring svg{position:absolute;inset:0}
.ring .pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:24px;color:var(--gold2)}
.ring .pct small{font-size:12px;margin-left:1px;color:var(--muted)}
.ring .lockic{font-family:var(--sans);font-size:16px;color:var(--muted)}
.match .mono{margin-top:4px;font-size:9px}
.match .why{margin-top:4px;font-size:10.5px;line-height:1.25;color:var(--gold);max-width:80px}
.chips{display:flex;flex-wrap:wrap;gap:6px;flex:1;padding-top:2px}
.chip{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:calc(var(--r)*.55);font-size:12.5px;font-weight:500;border:1px solid rgba(var(--green),.35);color:var(--text)}
.chip i{font-style:normal;font-family:var(--mono);font-size:10.5px;opacity:.85}
.chip.neutral{border-color:var(--line2);color:var(--muted);background:transparent!important}
.chip.target{border-style:dashed}
.bc-zone{margin:12px 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.bc-zone b{color:var(--gold);font-weight:500}
.status{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;padding:3px 7px;border-radius:5px;border:1px solid var(--line);color:var(--gold2);white-space:nowrap}
.status.ok{border-color:rgba(var(--green),.5);color:rgb(var(--green))}
.status.type{border-color:var(--type);color:var(--type)}
.metric{margin-top:10px}
.metric .between{margin-bottom:5px}
.metric .lbl{font-size:12px;color:var(--muted)}
.metric .val{font-size:12px;color:var(--text)}
.seatbar{display:flex;gap:3px;height:10px}
.seatbar span{flex:1;border-radius:3px;background:rgba(255,255,255,.07)}
.seatbar span.in{background:var(--gold)}
.seatbar span.you{background:rgb(var(--green))}
.seatbar span.need{background:transparent;border:1px solid rgba(214,182,110,.55)}
.gbar{display:flex;align-items:center;gap:8px}
.gbar .n{font-family:var(--mono);font-size:11px;width:30px}
.gbar .n.r{text-align:right}
.gbar .track{flex:1;display:flex;height:10px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,.07)}
.gbar .m{background:var(--male)} .gbar .f{background:var(--female)}
.minbar{display:flex;height:12px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,.07)}
.minbar span{height:100%}
.minbar span+span{border-left:1px solid var(--bg2)}
.bc-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--line2);font-size:12.5px;color:var(--muted)}
.bc-foot b{color:var(--text);font-weight:500}
.mutual{display:flex;align-items:center;gap:6px}
.empty{padding:26px 10px;text-align:center}

/* overlay: sheet + toast */
.scrim{position:fixed;inset:0;background:rgba(5,3,9,.6);opacity:0;pointer-events:none;transition:opacity .25s;z-index:2147483000}
.scrim.on{opacity:1;pointer-events:auto}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483001;max-width:440px;margin:0 auto;height:94dvh;background:var(--bg);border-top:1px solid var(--line);border-radius:20px 20px 0 0;transform:translateY(102%);transition:transform .32s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;color:var(--text);font-family:var(--sans)}
.sheet.on{transform:none}
.sheet.sm{height:auto;max-height:90dvh}
.grab{width:38px;height:4px;border-radius:2px;background:var(--line2);margin:8px auto 0}
.shead{display:flex;align-items:center;justify-content:space-between;padding:8px 16px}
.x{width:32px;height:32px;border-radius:50%;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;color:var(--muted)}
.sbody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 16px calc(24px + env(safe-area-inset-bottom))}
.toast{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,30px);opacity:0;background:var(--bg3);border:1px solid var(--line);padding:11px 16px;border-radius:12px;font-size:13.5px;z-index:2147483002;transition:all .3s;max-width:88vw;text-align:center;color:var(--text);font-family:var(--sans);pointer-events:none}
.toast.on{opacity:1;transform:translate(-50%,0)}
.h2{font-family:var(--serif);font-weight:400;font-size:26px;margin:2px 0 4px;line-height:1.1}
.sec{margin:16px 0 8px}
.seats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 12px}
.seat{border:1px solid var(--line2);border-radius:11px;padding:9px 10px;min-height:68px;text-align:left}
.seat .t{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.seat .t .mono{font-size:9.5px}
.seat .d{font-size:12.5px;line-height:1.35}
.seat .d em{font-style:normal;color:var(--muted)}
.seat.open{border-style:dashed}
.seat.open .d{color:var(--dim)}
.seat.you{border-color:rgba(var(--green),.7);background:rgba(var(--green),.06)}
.seat.sel{border-color:var(--gold);background:rgba(214,182,110,.06)}
.seat .nm{font-family:var(--serif);font-size:16px;color:var(--gold2)}
.kv{display:flex;justify-content:space-between;font-size:13.5px;padding:7px 0;border-bottom:1px solid var(--line2)}
.kv:last-child{border:0}
.kv span{color:var(--muted)}
.hold{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border:1px solid rgba(var(--green),.3);border-radius:11px;margin:12px 0;font-size:12.5px;line-height:1.45;color:var(--text)}
.field{margin-bottom:12px}
.field label{display:block;margin-bottom:6px}
.inp{width:100%;background:var(--bg2);border:1px solid var(--line2);border-radius:11px;padding:13px 12px;outline:none;font-size:16px}
.inp:focus{border-color:var(--gold)}
.pickrow{display:flex;flex-wrap:wrap;gap:7px}
.pick{padding:8px 12px;border:1px solid var(--line2);border-radius:9px;font-size:13.5px;color:var(--muted)}
.pick.on{border-color:var(--gold);color:var(--gold2);background:rgba(214,182,110,.08)}
.prog{display:flex;gap:4px;margin:4px 0 16px}
.prog span{flex:1;height:3px;border-radius:2px;background:var(--line2)}
.prog span.on{background:var(--gold)}
.lock{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--muted);margin:6px 0 14px}
.otp{display:flex;gap:8px;margin-top:8px}
.otp div{flex:1;height:48px;border:1px solid var(--line2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:24px}
.idopt{display:flex;align-items:center;justify-content:space-between;width:100%;padding:14px;border:1px solid var(--line2);border-radius:12px;margin-bottom:8px;text-align:left}
.idopt .s{font-size:12px;color:var(--muted)}
.scan{position:relative;height:170px;border:1px solid var(--line);border-radius:14px;margin:6px 0 12px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg2)}
.scan .doc{width:62%;height:62%;border:1.5px solid var(--gold);border-radius:8px;opacity:.7}
.scan .face{width:92px;height:116px;border:1.5px solid var(--gold);border-radius:50%;opacity:.7}
.scan .line{position:absolute;left:10%;right:10%;height:2px;background:var(--gold);opacity:.8;animation:scan 1.4s ease-in-out infinite}
@keyframes scan{0%{top:18%}50%{top:80%}100%{top:18%}}
.verified{display:flex;flex-direction:column;align-items:center;gap:6px;padding:22px 0}
.verified .tick{width:54px;height:54px;border-radius:50%;border:1.5px solid rgb(var(--green));display:flex;align-items:center;justify-content:center;color:rgb(var(--green));font-size:22px}
.check{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line2);text-align:left;width:100%}
.check .bx{flex:0 0 22px;height:22px;border-radius:6px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--ink)}
.vmark{display:flex;align-items:center;gap:8px;margin:0 0 10px}
.vmark img{height:22px;max-width:120px;object-fit:contain}
.vmark .vn{font-family:var(--serif);font-weight:var(--display-weight);letter-spacing:var(--display-track);font-size:18px;color:var(--gold2)}
.vmark .x2{color:var(--dim);font-size:12px}
.stepper{display:flex;align-items:center;gap:12px}
.stepper button{width:38px;height:38px;border-radius:calc(var(--r)*.7);border:1px solid var(--line2);font-size:19px}
.stepper .v{font-family:var(--serif);font-weight:var(--display-weight);font-size:28px;min-width:40px;text-align:center}
.golive{border:1px solid var(--line);border-radius:var(--r);padding:14px;margin-bottom:12px;background:var(--bg2)}
.optrow{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line2)}
.optrow:last-child{border:0}
.check .bx.on{background:rgb(var(--green));border-color:rgb(var(--green))}
.offer-amt{display:flex;align-items:baseline;justify-content:center;gap:6px;margin:6px 0 4px}
.offer-amt .cur{font-family:var(--mono);color:var(--muted);font-size:13px}
.offer-amt .v{font-family:var(--serif);font-size:44px;color:var(--gold2)}
input[type=range]{width:100%;accent-color:var(--gold)}
.quick{display:flex;gap:6px;margin:8px 0 4px}
.quick button{flex:1;padding:8px 0;border:1px solid var(--line2);border-radius:9px;font-size:12.5px;color:var(--muted)}
.quick button.on{border-color:var(--gold);color:var(--gold2)}
.req{border:1px solid var(--line2);border-radius:12px;padding:12px;margin-bottom:10px}
.req .h{display:flex;justify-content:space-between;align-items:center}
.req .handle{font-weight:600}
.req .acts{display:flex;gap:8px;margin-top:10px}
.req .acts button{flex:1;padding:10px;border-radius:10px;border:1px solid var(--line2);font-size:13.5px}
.req .acts .ok{background:var(--gold);color:var(--ink);border-color:var(--gold);font-weight:600}
.req.done{opacity:.55}
.toggle{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:0 0 13px;border-bottom:1px solid var(--line2);text-align:left;width:100%}
.sw{flex:0 0 46px;height:28px;border-radius:99px;background:var(--line2);position:relative;transition:background .2s}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}
.sw.on{background:rgb(var(--green))}
.sw.on::after{transform:translateX(18px)}
.preview{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:6px 0 14px}
.preview .top{padding:16px;background:var(--bg3)}
.preview .bot{padding:10px 14px;font-size:12px;color:var(--muted);border-top:1px solid var(--line2)}
.linkbox{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px;border:1px solid var(--line2);border-radius:11px;font-family:var(--mono);font-size:12px;margin-bottom:10px}
.pulse{animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{50%{opacity:.45}}
`;

/* ---------------- helpers ---------------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function band(a){ if(a<25)return[21,24]; const lo=25+Math.floor((a-25)/4)*4; return[lo,lo+3]; }
const bandLbl=b=>b[0]+'–'+b[1];
const gCount=arr=>({M:arr.filter(g=>g==='M').length,F:arr.filter(g=>g==='F').length});
const gs=g=>`<span class="gsym ${g==='M'?'m':'f'}">${g==='M'?'♂':'♀'}</span>`;
const leftTime=min=>{const h=Math.floor(min/60),m=min%60;return (h?h+'h ':'')+m+'m'};
const clone=o=>JSON.parse(JSON.stringify(o));
function hexA(hex,a){ const h=hex.replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function ensureFonts(){ if(document.querySelector('link[data-bubl-fonts]')) return; const l=document.createElement('link'); l.rel='stylesheet'; l.href=FONT_HREF; l.setAttribute('data-bubl-fonts',''); document.head.appendChild(l); }

function seatsAround(cx,cy,r,n,start){ const s=[]; for(let i=0;i<n;i++){const a=start+2*Math.PI*i/n; s.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);} return s; }
function rotP(p,t){ if(!t.rot) return p; const a=t.rot*Math.PI/180, dx=p[0]-t.x, dy=p[1]-t.y; return [t.x+dx*Math.cos(a)-dy*Math.sin(a), t.y+dx*Math.sin(a)+dy*Math.cos(a)]; }
function tableSeats(t){
  if(t.kind==='high'||t.shape==='round') return seatsAround(t.x,t.y,(t.r||8)+7,t.seats,-Math.PI/4);
  if(t.kind==='lounge'&&t.side){ const wx=t.side==='L'?-1:1, s=[]; const back=Math.max(1,t.seats-2);
    for(let i=0;i<back;i++) s.push([t.x+wx*16, t.y-t.h/2+ (t.h/back)*(i+.5)]);
    for(let i=0;i<t.seats-back;i++) s.push([t.x-wx*15,t.y-6+12*i]);
    return s.map(p=>rotP(p,t)); }
  const half=Math.ceil(t.seats/2), s=[];
  for(let i=0;i<half;i++) s.push([t.x-t.w/2+(t.w/half)*(i+.5), t.y+t.h/2+7]);
  for(let i=0;i<t.seats-half;i++) s.push([t.x-t.w/2+(t.w/(t.seats-half))*(i+.5), t.y-t.h/2-7]);
  return s.map(p=>rotP(p,t));
}

/* ---------------- brand: read the venue build, derive every token ---------------- */
let _probe=null;
function toRGB(c){ if(!c) return null; if(typeof c==='object') return c; if(!_probe){_probe=document.createElement('span');_probe.style.display='none';document.body.appendChild(_probe);}
  _probe.style.color=''; _probe.style.color=c; if(!_probe.style.color) return null; const m=getComputedStyle(_probe).color.match(/[\d.]+/g); return m?{r:+m[0],g:+m[1],b:+m[2],a:m[3]==null?1:+m[3]}:null; }
const rgb=o=>`rgb(${Math.round(o.r)},${Math.round(o.g)},${Math.round(o.b)})`;
const rgba=(o,a)=>`rgba(${Math.round(o.r)},${Math.round(o.g)},${Math.round(o.b)},${a})`;
const mix=(a,b,t)=>({r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t,a:1});
function lum(o){ const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)}; return .2126*f(o.r)+.7152*f(o.g)+.0722*f(o.b); }
function pageBg(el){ for(let n=el;n&&n.nodeType===1;n=n.parentElement){ const c=toRGB(getComputedStyle(n).backgroundColor); if(c&&c.a>.5) return c; }
  const h=toRGB(getComputedStyle(document.documentElement).backgroundColor); return h&&h.a>.5?h:null; }
const ACCENT_PROBES=['--accent','--brand','--gold','--primary','--venue-accent'];
function buildBrand(cfg,host){
  const b=cfg.brand||{}, auto=b.auto!==false, rs=getComputedStyle(document.documentElement), o={};
  if(auto&&host){
    const cs=getComputedStyle(host);
    o.bg=pageBg(host); o.text=toRGB(cs.color); o.body=cs.fontFamily;
    const h=document.querySelector(b.headingSelector||'h1,h2,.venue-name,.venue-title,.title');
    if(h){ const hs=getComputedStyle(h); o.display=hs.fontFamily; o.displayWeight=hs.fontWeight; o.displayTrack=hs.letterSpacing==='normal'?'0':hs.letterSpacing; }
    const vars=b.vars||{};
    for(const k in vars){ const v=rs.getPropertyValue(vars[k]).trim(); if(v) o[k]=/^(display|body|label|radius)$/.test(k)?v:toRGB(v); }
    if(!o.accent) for(const n of ACCENT_PROBES){ const v=rs.getPropertyValue(n).trim(); if(v&&toRGB(v)){ o.accent=toRGB(v); break; } }
  }
  ['bg','text','accent','surface','line','muted','positive'].forEach(k=>{ if(b[k]) o[k]=toRGB(b[k]); });
  ['display','body','label','radius','displayWeight','displayTrack','labelCase'].forEach(k=>{ if(b[k]) o[k]=b[k]; });
  const bg=o.bg||{r:14,g:8,b:23}, text=o.text||(lum(bg)>.4?{r:20,g:18,b:24}:{r:243,g:238,b:230}), accent=o.accent||{r:214,g:182,b:110};
  const light=lum(bg)>.4, white={r:255,g:255,b:255}, black={r:0,g:0,b:0};
  const surface=o.surface||mix(bg,text,light?.035:.05), pos=o.positive||{r:120,g:196,b:140};
  const t={
    '--bg':rgb(bg),'--bg2':rgb(surface),'--bg3':rgb(mix(bg,text,light?.07:.1)),
    '--line':o.line?rgb(o.line):rgba(accent,.26),'--line2':rgba(text,.09),
    '--gold':rgb(accent),'--gold2':rgb(light?mix(accent,black,.25):mix(accent,white,.35)),
    '--text':rgb(text),'--muted':rgb(o.muted||mix(text,bg,.38)),'--dim':rgb(mix(text,bg,.6)),
    '--ink':lum(accent)>.42?rgb(mix(bg,black,.4)):'#ffffff',
    '--green':`${pos.r},${pos.g},${pos.b}`,'--male':'#8FA6C9','--female':'#D49AAF',
    '--serif':o.display||'Georgia,serif','--sans':o.body||'system-ui,-apple-system,sans-serif','--mono':o.label||o.body||'system-ui,sans-serif',
    '--display-weight':o.displayWeight||'400','--display-track':o.displayTrack||'0',
    '--label-case':o.labelCase||'uppercase','--label-track':(o.labelCase==='none')?'.02em':'.12em',
    '--r':o.radius||'14px','--btn-r':b.buttonRadius||o.radius||'12px'
  };
  return Object.assign(t, cfg.theme||{});   // explicit theme tokens still win
}

/* ================================================================ */
function Instance(cfg){
  this.cfg = Object.assign({ currency:'AED', features:['bubl','public'], pricing:{type:'minimum',depositPct:.5}, publicGlow:'#F2C14E', bublGlow:BUBL_PURPLE, theme:{}, bublMark:'bubl-mark.png', data:{bubls:[],publics:[],myTable:null} }, cfg);
  this.data = clone(this.cfg.data); if(!this.data.myTable) this.data.myTable=null; this.booking=this.data.myBooking||null;
  const acct = loadAccount();
  this.S = { tab:this.cfg.features[0], pubTab:'browse', acct, requests:{}, pubReq:{}, sel:-1 };
  if(this.cfg.brand&&this.cfg.brand.loadFonts) ensureFonts();
  // panel host (inline in the venue page)
  this.host = typeof this.cfg.el==='string' ? document.querySelector(this.cfg.el) : this.cfg.el;
  if(!this.host){ this.host=document.createElement('div'); document.body.appendChild(this.host); }
  this.root = this.host.shadowRoot || this.host.attachShadow({mode:'open'});
  // overlay host (sheets + toasts) appended to body so transformed venue containers never trap it
  this.ohost = document.createElement('div'); this.ohost.setAttribute('data-bubl-overlay','');
  document.body.appendChild(this.ohost);
  this.oroot = this.ohost.attachShadow({mode:'open'});
  this.oroot.innerHTML = `<style>${CSS}</style><style class="vars"></style><div class="scrim"></div><div class="sheet"><div class="grab"></div><div class="shead"><span class="mono st"></span><button class="x" type="button" aria-label="Close">✕</button></div><div class="sbody"></div></div><div class="toast"></div>`;
  this.sheet=this.oroot.querySelector('.sheet'); this.scrim=this.oroot.querySelector('.scrim'); this.sbody=this.oroot.querySelector('.sbody');
  this.oroot.querySelector('.x').onclick=()=>this.closeSheet(); this.scrim.onclick=()=>this.closeSheet();
  this.render();
}
const P = Instance.prototype;

/* ---------------- public API ---------------- */
P.update=function(patch){ if(patch.data){ this.data=clone(patch.data); delete patch.data; } Object.assign(this.cfg,patch); if(!this.cfg.features.includes(this.S.tab)) this.S.tab=this.cfg.features[0]; this.render(); };
P.glowFor=function(id){ if(this.cfg.features.includes('bubl')&&this.data.bubls.some(b=>b.table===id)) return {type:'bubl',color:this.cfg.bublGlow};
  if(this.cfg.features.includes('public')&&(this.data.publics.some(p=>p.table===id)||(this.data.myTable&&this.data.myTable.isPublic&&this.data.myTable.table===id))) return {type:'public',color:this.cfg.publicGlow}; return null; };
P.setBooking=function(b){ this.booking=b?Object.assign({group:[],paid:[],cap:(this.tbl(b.table)||{}).seats||6},b):null; this.changed(); };
P.openGoPublic=function(){ if(this.data.myTable) return this.openGoPublicSheet(this.data.myTable); if(this.booking) return this.openGoPublicSheet(this.booking); this.openBookPicker(); };
P.openTable=function(id){ const b=this.data.bubls.find(x=>x.table===id); if(b) return this.openBubl(b.id); const p=this.data.publics.find(x=>x.table===id); if(p) return this.openPublic(p.id);
  if(this.data.myTable&&this.data.myTable.table===id){ this.S.tab='public'; this.S.pubTab='host'; this.render(); } };
P.tables=function(){ return [...this.data.bubls.map(b=>({table:b.table,type:'bubl',id:b.id})),...this.data.publics.map(p=>({table:p.table,type:'public',id:p.id}))]; };
P.account=function(){ return this.S.acct; };
P.logout=function(){ clearAccount(); this.S.acct=null; this.render(); };
P.destroy=function(){ this.root.innerHTML=''; this.ohost.remove(); };

/* ---------------- internals ---------------- */
P.fmt=function(n){ const c=this.cfg.currency; return (c==='£'||c==='GBP'?'£':c==='$'?'$':c+' ')+Math.round(n).toLocaleString('en-US'); };
P.me=function(){ return this.S.acct&&this.S.acct.profile; };
P.tokens=function(){ return buildBrand(this.cfg,this.host); };
P.vars=function(){ const t=this.tokens(); this._t=t; return ':host{'+Object.entries(t).map(([k,v])=>k+':'+v).join(';')+'}'; };
P.venueMark=function(){ const v=this.cfg.venue||{}; return `<div class="vmark">${v.logo?`<img src="${esc(v.logo)}" alt="${esc(v.name)}" onerror="this.outerHTML='<span class=&quot;vn&quot;>${esc(v.name)}</span>'">`:`<span class="vn">${esc(v.name||'')}</span>`}<span class="x2">×</span><img src="${esc(this.cfg.bublMark)}" alt="bubl" style="height:16px" onerror="this.outerHTML='<span class=&quot;mono&quot;>bubl</span>'"></div>`; };
P.toast=function(t){ const el=this.oroot.querySelector('.toast'); el.textContent=t; el.classList.add('on'); clearTimeout(this._tt); this._tt=setTimeout(()=>el.classList.remove('on'),2600); };
P.openSheet=function(title,html,small){ this.oroot.querySelector('.st').textContent=title; this.sbody.innerHTML=html; this.sbody.scrollTop=0; this.sheet.classList.toggle('sm',!!small); this.sheet.classList.add('on'); this.scrim.classList.add('on'); this.sheetName=title; };
P.closeSheet=function(){ this.sheet.classList.remove('on'); this.scrim.classList.remove('on'); this.sheetName=null; };
P.changed=function(){ this.render(); if(typeof this.cfg.onChange==='function') try{ this.cfg.onChange({tables:this.tables(),account:this.S.acct}); }catch(e){} };
P.tbl=function(id){ return this.cfg.plan.tables[id]; };

/* ---------------- match engine ---------------- */
P.memberScore=function(me,x){ return matchOf(me,x)/100; };
P._oldMemberScore=function(me,x){ const bm=band(me.age), bx=band(x.age);
  const age=bm[0]===bx[0]?1:(Math.abs(bm[0]-bx[0])===4?.5:0), nat=me.nat===x.nat?1:0, ind=me.ind===x.ind?1:0, ov=x.hob.filter(h=>me.hob.includes(h)).length;
  return .25*age+.2*nat+.25*ind+.3*Math.min(1,ov/2); };
const MATCH_W={hobbies:.4,industry:.25,age:.2,nationality:.15};
function matchOf(me,x){ if(!me||!x||x.age==null) return null; const w=me.w||MATCH_W, bm=band(me.age), bx=band(x.age), a=[...new Set(me.hob||[])], b=[...new Set(x.hob||[])], sh=a.filter(h=>b.includes(h)).length;
  return Math.round(100*(w.age*(bm[0]===bx[0]?1:0)+w.nationality*(me.nat===x.nat?1:0)+w.industry*(me.ind===x.ind?1:0)+w.hobbies*(a.length&&b.length?sh/Math.sqrt(a.length*b.length):0))); }
window.bublMatchOf=matchOf;
P.bublMatch=function(b){ const me=this.me(); if(!me) return null;
  if(b.members.length) return Math.round(b.members.reduce((a,x)=>a+matchOf(me,x),0)/b.members.length);
  if(!b.members.length){ const bf=b.builtFor; let sc=.25*((me.age>=bf.ages[0]&&me.age<=bf.ages[1])?1:0)+.2*(bf.nat.includes(me.nat)?1:0)+.25*(bf.ind.includes(me.ind)?1:0)+.3*Math.min(1,bf.hob.filter(h=>me.hob.includes(h)).length/2); return Math.round(100*Math.sqrt(sc)); }
  return Math.round(100*Math.sqrt(b.members.reduce((a,x)=>a+this.memberScore(me,x),0)/b.members.length)); };
P.bublChips=function(b){ const ms=b.members, n=ms.length, me=this.me();
  if(!n){ const bf=b.builtFor; return [{l:bandLbl(bf.ages),age:1},...bf.ind.map(l=>({l})),...bf.nat.map(l=>({l})),...bf.hob.map(l=>({l}))]
      .map(c=>({l:c.l,target:true,hit:!!me&&(c.l===me.ind||c.l===me.nat||me.hob.includes(c.l)||(c.age&&me.age>=bf.ages[0]&&me.age<=bf.ages[1]))})); }
  if(!me){ const cnt={}; ms.forEach(x=>[bandLbl(band(x.age)),x.ind,x.nat,...x.hob].forEach(k=>cnt[k]=(cnt[k]||0)+1));
    return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([l,c])=>({l,c,n,neutral:true})); }
  const out=[], bl=bandLbl(band(me.age)), push=(l,c)=>{if(c)out.push({l,c,n})};
  push(bl,ms.filter(x=>bandLbl(band(x.age))===bl).length); push(me.ind,ms.filter(x=>x.ind===me.ind).length); push(me.nat,ms.filter(x=>x.nat===me.nat).length);
  me.hob.forEach(h=>push(h,ms.filter(x=>x.hob.includes(h)).length)); return out.sort((a,b)=>b.c-a.c); };
const chipHTML=c=>{ if(c.neutral) return `<span class="chip neutral">${esc(c.l)} <i>×${c.c}</i></span>`;
  if(c.target) return `<span class="chip target ${c.hit?'':'neutral'}" style="background:rgba(var(--green),${c.hit?.38:0})">${esc(c.l)}</span>`;
  return `<span class="chip" style="background:rgba(var(--green),${(.12+.62*(c.c/c.n)).toFixed(2)})">${esc(c.l)} <i>×${c.c}</i></span>`; };
function ringSVG(p){ const r=29,C=2*Math.PI*r,v=p==null?0:p/100;
  return `<svg viewBox="0 0 66 66"><circle cx="33" cy="33" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2" ${p==null?'stroke-dasharray="3 4"':''}/><circle cx="33" cy="33" r="${r}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="${(C*v).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 33 33)"/></svg>`; }
P.matchBlock=function(p){ if(p!=null) return `<div class="match"><div class="ring">${ringSVG(p)}<div class="pct">${p}<small>%</small></div></div><span class="mono">match</span></div>`;
  return `<div class="match"><div class="ring">${ringSVG(null)}<div class="pct"><span class="lockic">🔒</span></div></div><span class="mono">match</span><button type="button" class="why" data-login>Log in to see your match</button></div>`; };

/* ---------------- plan ---------------- */
P.planSVG=function(opts){ // opts: {focus, seatStates, sel, overview}
  const pl=this.cfg.plan, G=(this._t||this.tokens())['--green'];
  let s=`<svg viewBox="${pl.viewBox}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="bglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`+(pl.decor||'');
  const C={member:'var(--gold)',host:'var(--gold2)',you:`rgb(${G})`};
  for(const [id,t] of Object.entries(pl.tables)){
    const g=this.glowFor(id), f=id===opts.focus, pickable=opts.pick&&opts.pick.includes(id);
    const lit = opts.overview ? !!g : f;
    const col = (f&&opts.focusColor)?opts.focusColor:(g?g.color:'var(--gold)');
    const op = opts.pick ? (f?1:(pickable?.6:.15)) : opts.focus ? (f?1:.22) : (opts.overview ? (g?1:.4) : 1);
    const tfill = lit?(col.startsWith('#')?hexA(col,.22):'rgba(214,182,110,.16)'):'rgba(127,127,127,.06)', tstroke=lit?col:'var(--muted)';
    s+=`<g opacity="${op}" ${opts.overview&&g?`data-t="${id}"`:''} ${pickable&&!f?`data-pick="${id}" style="cursor:pointer"`:''}>`;
    const shape = (t.kind==='high'||t.shape==='round') ? `<circle cx="${t.x}" cy="${t.y}" r="${t.r||8}"` : `<rect x="${t.x-t.w/2}" y="${t.y-t.h/2}" width="${t.w}" height="${t.h}" rx="3" transform="rotate(${t.rot||0} ${t.x} ${t.y})"`;
    if(lit) s+=`${shape} fill="none" stroke="${tstroke}" stroke-width="2.2" filter="url(#bglow)" opacity=".9"/>`;
    s+=`${shape} fill="${tfill}" stroke="${tstroke}" stroke-opacity="${lit?1:.5}" stroke-width="${lit?1.4:.8}"/>`;
    if(t.num!=null) s+=`<text x="${t.x}" y="${t.y+2.4}" text-anchor="middle" font-family="DM Mono" font-size="6.5" fill="${lit?'var(--text)':'var(--dim)'}">${t.num}</text>`;
    tableSeats(t).forEach((p,i)=>{
      let fill='transparent', stroke=lit?col:'var(--muted)', so=lit?.6:.4, r=2.6, dash='';
      if(f&&opts.seatStates){ const st=opts.seatStates[i]||'open'; if(st!=='open'){fill=C[st];stroke=C[st];so=1;} else {stroke='var(--gold)';so=.75;dash='stroke-dasharray="1.6 1.4"';} r=i===opts.sel?4.6:3.4; }
      s+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-opacity="${so}" stroke-width="${f&&i===opts.sel?1.6:.8}" ${dash}/>`;
    });
    if((opts.overview&&g)||(pickable&&!f)) s+=`<rect x="${t.x-22}" y="${t.y-20}" width="44" height="40" fill="transparent"/>`; // tap area
    s+=`</g>`;
  }
  return s+'</svg>';
};
P.legend=function(){ const f=this.cfg.features; return `<div class="legend">${f.includes('bubl')?`<span style="color:${this.cfg.bublGlow}"><i></i><b style="font-weight:500;color:var(--muted)">bubl</b></span>`:''}${f.includes('public')?`<span style="color:${this.cfg.publicGlow}"><i></i><b style="font-weight:500;color:var(--muted)">Public table</b></span>`:''}<span style="color:var(--muted)"><i style="opacity:.4"></i><b style="font-weight:500">Other tables</b></span></div>`; };
P.closeUpSVG=function(t,states,sel){ const n=states.length, G=(this._t||this.tokens())['--green'];
  let s=`<svg viewBox="0 0 320 ${t.kind==='high'?128:118}" xmlns="http://www.w3.org/2000/svg">`, pos=[];
  if(t.kind==='high'||t.shape==='round'){ s+=`<circle cx="160" cy="64" r="26" fill="rgba(214,182,110,.14)" stroke="var(--gold)" stroke-width="1.2"/>`; for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n;pos.push([160+48*Math.cos(a),64+48*Math.sin(a)]);} }
  else { const top=Math.ceil(n/2), bot=n-top, W=Math.min(290,Math.max(150,top*34)), x0=160-W/2;
    if(t.kind==='lounge'||t.kind==='vip') s+=`<path d="M${x0-14},14 L${x0+W+14},14" stroke="var(--muted)" stroke-opacity=".4" stroke-width="9" stroke-linecap="round"/><text x="160" y="9" text-anchor="middle" font-family="DM Mono" font-size="6.5" letter-spacing="1.2" fill="var(--dim)">COUCH</text>`;
    s+=`<rect x="${x0}" y="46" width="${W}" height="30" rx="5" fill="rgba(214,182,110,.14)" stroke="var(--gold)" stroke-width="1.2"/>`;
    for(let i=0;i<top;i++) pos.push([x0+W*(i+.5)/top,30]); for(let i=0;i<bot;i++) pos.push([x0+W*(i+.5)/bot,94]); }
  pos.forEach((p,i)=>{ const st=states[i]||'open', on=i===sel, fill=st==='member'||st==='host'?'var(--gold)':st==='you'?`rgb(${G})`:'transparent', stroke=on?'var(--text)':(st==='open'?'var(--gold)':fill);
    s+=`<g data-cseat="${i}"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${on?12.5:11}" fill="${fill}" stroke="${stroke}" stroke-width="${on?2:1}" ${st==='open'&&!on?'stroke-dasharray="2.4 2"':''}/><text x="${p[0].toFixed(1)}" y="${(p[1]+3.6).toFixed(1)}" text-anchor="middle" font-family="DM Mono" font-size="10" fill="${st==='open'?'var(--muted)':'var(--ink)'}">${i+1}</text></g>`; });
  return s+'</svg>'; };

/* ---------------- main panel ---------------- */
P.render=function(){
  const f=this.cfg.features, S=this.S, acct=S.acct;
  this.oroot.querySelector('.vars').textContent=this.vars();
  this.root.innerHTML=`<style>${CSS}</style><style>${this.vars()}</style>
  <div class="acct">${acct?`<span class="mono" style="color:var(--text)">✓ ${esc(acct.first)} · bubl account</span><button type="button" data-logout>Log out</button>`:`<span class="mono">Browsing</span><button type="button" data-login>Log in</button>`}</div>
  <div class="tabs">
    ${f.includes('bubl')?`<button type="button" data-tab="bubl" class="${S.tab==='bubl'?'on':''}"><span class="dot" style="background:${this.cfg.bublGlow}"></span><img src="${esc(this.cfg.bublMark)}" alt="bubl" onerror="this.outerHTML='<span class=&quot;bw&quot;>bubl</span>'"></button>`:''}
    ${f.includes('public')?`<button type="button" data-tab="public" class="${S.tab==='public'?'on':''}"><span class="dot" style="background:${this.cfg.publicGlow}"></span>Public tables</button>`:''}
  </div>
  ${this.cfg.notice?`<div class="card note">${esc(this.cfg.notice)}</div>`:''}
  ${S.tab==='public'&&S.pubTab==='host'?'':`<div class="plan">${this.planSVG({overview:true})}${this.legend()}</div>`}
  <div class="body">${S.tab==='bubl'?this.renderBubls():this.renderPublic()}</div>`;
  this.bindPanel();
};
P.bindPanel=function(){
  const r=this.root, q=s=>r.querySelectorAll(s);
  q('[data-tab]').forEach(b=>b.onclick=()=>{this.S.tab=b.dataset.tab;this.render()});
  q('[data-pub]').forEach(b=>b.onclick=()=>{this.S.pubTab=b.dataset.pub;this.render()});
  q('[data-login]').forEach(b=>b.onclick=e=>{e.stopPropagation();this.openLogin()});
  q('[data-logout]').forEach(b=>b.onclick=()=>{this.logout();this.toast('Logged out')});
  q('[data-t]').forEach(g=>g.onclick=()=>this.openTable(g.dataset.t));
  q('[data-bubl]').forEach(c=>c.onclick=()=>this.openBubl(c.dataset.bubl));
  q('[data-pub-id]').forEach(c=>c.onclick=e=>{ if(e.target.closest('[data-share]')) return; this.openPublic(c.dataset.pubId); });
  q('[data-share]').forEach(b=>b.onclick=e=>{e.stopPropagation();this.openShare(b.dataset.share)});
  const pt=r.querySelector('[data-pubtoggle]'); if(pt) pt.onclick=()=>{const T=this.data.myTable; if(T.isPublic) this.confirmPrivate(); else this.openGoPublicSheet(T);};
  q('[data-golive]').forEach(b=>b.onclick=e=>{e.stopPropagation();this.openGoPublic();});
  q('[data-book]').forEach(b=>b.onclick=()=>this.startBooking());
  q('[data-acc]').forEach(b=>b.onclick=()=>{const T=this.data.myTable,x=T.requests.find(y=>y.id===b.dataset.acc);x.state='acc';T.group.push(...x.party);if(x.offer)T.paid.push(x.offer);this.changed();this.toast(`${x.handle||'Guest'} is in${x.offer?' · '+this.fmt(x.offer)+' towards the minimum':''}`)});
  q('[data-dec]').forEach(b=>b.onclick=()=>{const x=this.data.myTable.requests.find(y=>y.id===b.dataset.dec);x.state='dec';this.changed();this.toast('Declined. Their hold is released.')});
};

/* ---------------- bubl ---------------- */
P.bublState=function(b){ const n=b.members.length+(this.S.requests[b.id]==='in'?1:0); if(n>=b.confirmAt) return n>=b.seats?'full':'confirmed'; return n===0?'forming0':'forming'; };
P.seatBar=function(b){ const inN=b.members.length, you=this.S.requests[b.id]==='in'?1:0; let s=''; for(let i=0;i<b.seats;i++){let c='';if(i<inN)c='in';else if(i<inN+you)c='you';else if(i<b.confirmAt)c='need';s+=`<span class="${c}"></span>`;} return `<div class="seatbar">${s}</div>`; };
function genderBar(arr){ const c=gCount(arr),t=c.M+c.F||1; return `<div class="gbar"><span class="n">${gs('M')} ${c.M}</span><div class="track"><span class="m" style="width:${100*c.M/t}%"></span><span class="f" style="width:${100*c.F/t}%"></span></div><span class="n r">${c.F} ${gs('F')}</span></div>`; }
P.seatPrice=function(b){ const pr=this.cfg.pricing; return pr.type==='deposit'?{seat:0,dep:pr.seatDeposit}:{seat:b.min/b.seats,dep:b.min/b.seats*pr.depositPct}; };
P.mutualHTML=function(b){ const ic=`<svg width="22" height="12" viewBox="0 0 22 12"><circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--gold)"/><circle cx="16" cy="6" r="4.5" fill="none" stroke="var(--gold)"/></svg>`;
  if(this.me()&&b.mutual) return `<span class="mutual">${ic}<span><b>${b.mutual}</b> table mutual${b.mutual>1?'s':''}</span></span>`;
  return `<span class="mutual" style="opacity:.7">${ic}<span>Confirm by ${esc(b.closes)}</span></span>`; };
P.renderBubls=function(){
  const list=this.data.bubls.map(b=>({b,p:this.bublMatch(b)}));
  if(this.me()) list.sort((a,b)=>b.p-a.p); else list.sort((a,b)=>(b.b.members.length/b.b.confirmAt)-(a.b.members.length/a.b.confirmAt));
  if(!list.length) return `<div class="empty note">No bubls forming tonight.</div>`;
  return list.map(({b,p})=>this.bublCard(b,p)).join('');
};
P.bublCard=function(b,p){
  const S=this.S, st=this.bublState(b), mine=S.requests[b.id], inN=b.members.length+(mine==='in'?1:0), need=Math.max(0,b.confirmAt-inN), t=this.tbl(b.table), pr=this.seatPrice(b);
  const tag=mine==='pending'?'<span class="status pulse">Requested</span>':mine==='in'?'<span class="status ok">You\'re in</span>':(st==='confirmed'||st==='full')?'<span class="status ok">Confirmed</span>':st==='forming0'?'<span class="status type">Be the first</span>':'<span class="status type">bubl · forming</span>';
  const genders=[...b.members.map(x=>x.g),...(mine==='in'?[this.me().g]:[])];
  return `<div class="bcard" data-bubl="${b.id}" style="--type:${this.cfg.bublGlow}">
    <div class="bc-top">${this.matchBlock(p)}<div class="chips">${b.members.length?'':'<span class="mono" style="width:100%;margin-bottom:2px">Built for</span>'}${this.bublChips(b).map(chipHTML).join('')}</div></div>
    <div class="bc-zone"><span class="mono"><b>${esc(t.zone)}</b>${t.num!=null?' · '+t.num:''} · ${b.seats} seats</span>${tag}</div>
    <div class="metric"><div class="between"><span class="lbl">${st==='confirmed'||st==='full'?'Confirmed':'Confirms at '+b.confirmAt}</span><span class="val">${inN} in${need?` · <b style="color:var(--gold2)">${need} to go</b>`:` · ${b.seats-inN} left`}</span></div>${this.seatBar(b)}</div>
    ${genders.length?`<div class="metric"><div class="between"><span class="lbl">Gender ratio</span></div>${genderBar(genders)}</div>`:''}
    <div class="bc-foot">${this.mutualHTML(b)}<span>${this.cfg.pricing.type==='deposit'?`<b>No minimum</b> · ${this.fmt(pr.dep)} deposit`:`<b>${this.fmt(pr.seat)}</b> a seat`}</span></div>
  </div>`;
};
P.openBubl=function(id){
  const b=this.data.bubls.find(x=>x.id===id); if(!b) return; this.S.sel=-1;
  const draw=()=>{
    const S=this.S, me=this.me(), t=this.tbl(b.table), p=this.bublMatch(b), st=this.bublState(b), mine=S.requests[b.id], confirmed=st==='confirmed'||st==='full', reveal=mine==='in'&&confirmed;
    const inN=b.members.length+(mine==='in'?1:0), need=Math.max(0,b.confirmAt-inN), yourIx=b.members.length, pr=this.seatPrice(b);
    const states=[]; for(let i=0;i<b.seats;i++) states.push(i<b.members.length?'member':(i===yourIx&&mine!=='pending'?'you':'open'));
    const genders=[...b.members.map(x=>x.g),...(mine==='in'?[me.g]:[])];
    let seats='';
    for(let i=0;i<b.seats;i++){ const x=b.members[i];
      if(x) seats+=`<button type="button" class="seat ${S.sel===i?'sel':''}" data-seat="${i}"><div class="t"><span class="mono">Seat ${i+1}</span>${gs(x.g)}</div>${reveal?`<div class="nm">${esc(x.name)}</div>`:''}<div class="d">${bandLbl(band(x.age))} · ${esc(x.ind)}<br><em>${esc(x.nat)} · ${esc(x.hob.join(', '))}</em></div></button>`;
      else if(i===yourIx&&mine==='in') seats+=`<button type="button" class="seat you" data-seat="${i}"><div class="t"><span class="mono" style="color:rgb(var(--green))">Seat ${i+1} · you</span>${gs(me.g)}</div><div class="d">${reveal?`<span class="nm">${esc(S.acct.first)}</span><br>`:''}${bandLbl(band(me.age))} · ${esc(me.ind)}</div></button>`;
      else if(i===yourIx&&!mine) seats+=`<button type="button" class="seat open you" data-seat="${i}"><div class="t"><span class="mono" style="color:rgb(var(--green))">Seat ${i+1} · yours</span></div><div class="d">Request to take it</div></button>`;
      else seats+=`<button type="button" class="seat open ${S.sel===i?'sel':''}" data-seat="${i}"><div class="t"><span class="mono">Seat ${i+1}</span></div><div class="d">Open</div></button>`; }
    let h=`<div class="plan"><div class="where"><span class="mono" style="color:${this.cfg.bublGlow}">bubl</span><b>${esc(t.zone)}${t.num!=null?' · '+t.num:''}</b></div>${this.planSVG({focus:b.table,seatStates:states,sel:S.sel})}
        <div class="closeup">${this.closeUpSVG(t,states,S.sel)}</div>
        <div class="where" style="padding-top:2px"><span class="mono" style="font-size:9px"><span style="color:var(--gold)">●</span> In &nbsp; <span style="color:rgb(var(--green))">●</span> Yours &nbsp; ◌ Open</span><span class="mono" style="font-size:9px">${b.seats} seats</span></div></div>
      <div class="bc-top" style="margin-bottom:6px">${this.matchBlock(p)}<div class="chips">${b.members.length?'':'<span class="mono" style="width:100%">Built for</span>'}${this.bublChips(b).map(chipHTML).join('')}</div></div>
      <div class="metric"><div class="between"><span class="lbl">${confirmed?'Confirmed':'Confirms at '+b.confirmAt}</span><span class="val">${inN} in${need?` · <b style="color:var(--gold2)">${need} to go</b>`:''}</span></div>${this.seatBar(b)}</div>
      ${genders.length?`<div class="metric"><div class="between"><span class="lbl">Gender ratio</span></div>${genderBar(genders)}</div>`:''}
      ${me&&b.mutual?`<div class="metric between" style="font-size:12.5px;color:var(--muted)">${this.mutualHTML(b)}<span class="note" style="text-align:right;max-width:55%">Someone here shared a table with someone you did</span></div>`:''}
      <div class="sec mono">The table · ${reveal?'names revealed':'names hidden until it confirms'}</div>
      <div class="seats">${seats}</div>
      <div class="card" style="padding:4px 14px">${this.cfg.pricing.type==='deposit'?`<div class="kv"><span>Minimum</span><b>None</b></div><div class="kv"><span>Seat deposit</span><b>${this.fmt(pr.dep)} · goes on your bill</b></div>`:`<div class="kv"><span>Table minimum</span><b>${this.fmt(b.min)}</b></div><div class="kv"><span>Your seat</span><b>${this.fmt(pr.seat)}</b></div><div class="kv"><span>Deposit now</span><b>${this.fmt(pr.dep)}</b></div>`}<div class="kv"><span>Confirm by</span><b>${esc(b.closes)}</b></div></div>
      <div class="hold"><span>⟲</span><span>Your deposit is <b>held, not charged</b>. If this bubl doesn't reach ${b.confirmAt} by ${esc(b.closes)}, the hold drops off your card instantly. No refund to wait for.</span></div>`;
    if(!mine) h+=`<button class="btn" type="button" data-req>Request to join${me?' · '+this.fmt(pr.dep):''}</button><p class="note" style="text-align:center;margin-top:8px">${me?'Your bubl account is verified. One tap.':'You\'ll create your bubl account next. Everyone at this table did the same.'}</p>`;
    else if(mine==='pending') h+=`<div class="card" style="text-align:center"><div class="mono pulse" style="color:var(--gold2)">Request sent</div><p class="note" style="margin:6px 0 0">The table sees your ranges, the same way you saw theirs.</p></div>`;
    else h+=`<div class="card" style="text-align:center"><div class="mono" style="color:rgb(var(--green))">${confirmed?'Confirmed · names revealed':'You\'re in · '+need+' more to confirm'}</div>${confirmed?'':'<p class="note" style="margin:6px 0 0">You\'ll get a message each time someone joins.</p>'}</div>`;
    this.sbody.innerHTML=h;
    const sb=this.sbody, redraw=()=>{const tp=sb.scrollTop;draw();sb.scrollTop=tp;};
    sb.querySelectorAll('[data-cseat],[data-seat]').forEach(x=>x.onclick=()=>{const i=+(x.dataset.cseat??x.dataset.seat);this.S.sel=this.S.sel===i?-1:i;redraw();});
    sb.querySelectorAll('[data-login]').forEach(x=>x.onclick=()=>{this.closeSheet();setTimeout(()=>this.openLogin(()=>this.openBubl(id)),320)});
    const rq=sb.querySelector('[data-req]'); if(rq) rq.onclick=()=>{
      const go=()=>{ this.S.requests[b.id]='pending'; this.changed(); this.openBubl(b.id); this.sbody.scrollTop=this.sbody.scrollHeight;
        setTimeout(()=>{ this.S.requests[b.id]='in'; this.changed(); if(this.sheetName==='bubl'){const tp=this.sbody.scrollTop;draw();this.sbody.scrollTop=tp;}
          const s2=this.bublState(b); this.toast(s2==='confirmed'||s2==='full'?'Accepted. bubl confirmed, names revealed':'Accepted. You\'re in'); },2600); };
      if(this.me()) this.holdPay(pr.dep,'Seat deposit · held',go);
      else { this.closeSheet(); setTimeout(()=>this.openSignup({amount:pr.dep,label:'Seat deposit',charge:'Only when it confirms',done:go}),320); }
    };
  };
  this.openSheet('bubl',''); draw();
};

/* ---------------- public tables ---------------- */
const covered=p=>p.paid.reduce((a,b)=>a+b,0);
function minBar(p,extra){ let s=''; p.paid.forEach((v,i)=>s+=`<span style="width:${100*v/p.min}%;background:${SEG[i%SEG.length]}"></span>`); if(extra) s+=`<span style="width:${100*extra/p.min}%;background:rgb(var(--green));opacity:.85"></span>`; return `<div class="minbar">${s}</div>`; }
const hostLine=h=>`${gs(h.g)} ${bandLbl(band(h.age))} · ${esc(h.ind)} · ${esc(h.nat)} <span style="color:rgb(var(--green))">✓</span>`;
P.renderPublic=function(){
  const S=this.S, T=this.data.myTable; let h=`<div class="sub-tabs"><button type="button" data-pub="browse" class="${S.pubTab==='browse'?'on':''}">Join a table</button><button type="button" data-pub="host" class="${S.pubTab==='host'?'on':''}">My table${T&&T.isPublic?' · public':''}</button></div>`;
  if(S.pubTab==='host') return h+(T?this.renderHost():this.renderNoTable());
  if(!T) h+=`<button type="button" class="golive" data-golive style="width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:10px"><span><span class="mono" style="color:${this.cfg.publicGlow}">Have a table?</span><br><span style="font-size:13.5px">${this.booking?'Make your booking public and let the room help cover the minimum':'Book one and make it public'}</span></span><span class="mono" style="color:var(--gold)">›</span></button>`;
  h+=`<p class="note" style="margin:0 0 12px">Hosts open their table to cover the minimum. Request a seat with what you'd like to contribute. Only the host sees your offer.</p>`;
  if(!this.data.publics.length) return h+`<div class="empty note">No public tables yet tonight.</div>`;
  return h+this.data.publics.map(p=>this.publicCard(p)).join('');
};
P.publicCard=function(p){
  const t=this.tbl(p.table), left=Math.max(0,p.min-covered(p)), r=this.S.pubReq[p.id], grp=[...p.group,...(r&&r.state==='in'?r.party:[])];
  const tag=r?(r.state==='pending'?'<span class="status pulse">Requested</span>':'<span class="status ok">You\'re in</span>'):`<button type="button" class="mono" data-share="${p.id}" style="color:var(--gold)">Share ↗</button>`;
  return `<div class="bcard" data-pub-id="${p.id}" style="--type:${this.cfg.publicGlow}">
    <div class="between"><span class="mono"><b style="color:${this.cfg.publicGlow};font-weight:500">Public</b> · ${esc(t.zone)}${t.num!=null?' · '+t.num:''}</span>${tag}</div>
    <div style="margin:10px 0 2px;font-size:13.5px"><span class="mono" style="margin-right:6px">Host</span>${hostLine(p.host)}</div>
    <div class="metric"><div class="between"><span class="lbl">Minimum ${this.fmt(p.min)}</span><span class="val"><b style="color:var(--gold2)">${this.fmt(left)}</b> left</span></div>${minBar(p,0)}</div>
    <div class="metric"><div class="between"><span class="lbl">${grp.length} in · ${p.cap-grp.length} spots</span></div>${genderBar(grp)}</div>
    <div class="bc-foot"><span>Closes <b>${esc(p.closes)}</b> · ${leftTime(p.left)} left</span><span class="mono" style="color:var(--gold)">Request ›</span></div>
  </div>`;
};
P.renderNoTable=function(){
  const bk=this.booking;
  if(bk){ const t=this.tbl(bk.table), left=Math.max(0,bk.min-covered(bk));
    return `<div class="plan"><div class="where"><span class="mono">Your booking · private</span><b>${esc(t.zone)}${t.num!=null?' · '+t.num:''}</b></div>${this.planSVG({focus:bk.table,seatStates:bk.group.map((g,i)=>i?'member':'you')})}</div>
    <div class="card"><div class="metric" style="margin-top:0"><div class="between"><span class="lbl">Minimum ${this.fmt(bk.min)}</span><span class="val"><b style="color:var(--gold2)">${this.fmt(left)}</b> left</span></div>${minBar(bk,0)}</div>
    <div class="metric"><div class="between"><span class="lbl">${bk.group.length} in · ${bk.cap-bk.group.length} spots</span></div>${genderBar(bk.group)}</div>
    <p class="note" style="margin:12px 0">Can't fill it or don't want to cover the whole minimum? Make it public. Verified guests request a seat and offer what they'd put towards the minimum. You choose who joins.</p>
    <button type="button" class="btn" data-golive>Make it public</button></div>`; }
  return `<div class="card" style="text-align:center;padding:22px 16px"><div class="h2" style="font-size:22px">No table yet</div><p class="note" style="margin:6px 0 14px">Book a table and make it public in the same step, or book first and switch it to public any time before the night.</p><button type="button" class="btn" data-book>Book a table</button></div>`;
};
P.renderHost=function(){
  const T=this.data.myTable, t=this.tbl(T.table), left=Math.max(0,T.min-covered(T)), states=T.group.map((g,i)=>i===0?'you':'member');
  let h=`<div class="plan"><div class="where"><span class="mono">Your table</span><b>${esc(t.zone)}${t.num!=null?' · '+t.num:''}</b></div>${this.planSVG({focus:T.table,seatStates:states})}</div>
  <div class="card"><button type="button" class="toggle" data-pubtoggle><div><div style="font-weight:500">${T.isPublic?'Public':'Private'}</div><div class="note">${T.isPublic?'Glowing on the plan · anyone with a bubl account can request to join':'Only you and the people you invite'}</div></div><span class="sw ${T.isPublic?'on':''}"></span></button>
    ${T.isPublic?`<div class="optrow" style="padding-top:12px"><span class="note">${T.cap-T.group.length} spots open · closes ${esc(T.closes)}</span><button type="button" class="mono" data-golive style="color:var(--gold)">Edit</button></div>`:''}
    <div class="metric"><div class="between"><span class="lbl">Minimum ${this.fmt(T.min)}</span><span class="val"><b style="color:var(--gold2)">${this.fmt(left)}</b> left</span></div>${minBar(T,0)}</div>
    <div class="metric"><div class="between"><span class="lbl">${T.group.length} in · ${T.cap-T.group.length} spots</span></div>${genderBar(T.group)}</div>
    <div class="note" style="margin-top:12px">Closes <b style="color:var(--text)">${esc(T.closes)}</b> (${leftTime(T.left)}). If the minimum isn't covered by then, the table cancels and every hold is released instantly.</div>
    <div style="margin-top:12px"><button type="button" class="btn ghost" data-share="mine">Share link ↗</button></div></div>
  <div class="sec mono">Requests · ${T.requests.filter(r=>r.state==='new').length} new</div>${T.requests.length?'':`<div class="card note" style="text-align:center">${T.isPublic?'Requests appear here. You\'ll get a message for each one.':'Make the table public to receive requests.'}</div>`}`;
  T.requests.forEach(r=>{ const c=gCount(r.party);
    h+=`<div class="req ${r.state!=='new'?'done':''}"><div class="h"><span class="handle">${r.handle?esc(r.handle):'<span style="color:var(--muted);font-weight:400">No social link</span>'}</span><span class="mono" style="color:${r.offer?'var(--gold2)':'var(--muted)'}">${r.offer?this.fmt(r.offer):'No contribution'}</span></div>
      <div class="note" style="margin-top:4px;color:var(--text)">${hostLine(r)}</div><div class="note" style="margin-top:3px">Party of ${r.party.length} · ${c.M?c.M+' ♂ ':''}${c.F?c.F+' ♀':''} · all verified</div>
      ${r.state==='new'?`<div class="acts"><button type="button" data-dec="${r.id}">Decline</button><button type="button" class="ok" data-acc="${r.id}">Accept</button></div>`:`<div class="mono" style="margin-top:8px;color:${r.state==='acc'?'rgb(var(--green))':'var(--muted)'}">${r.state==='acc'?'Accepted · offer charged':'Declined · hold released'}</div>`}</div>`; });
  return h;
};
P.openPublic=function(id){
  const p=this.data.publics.find(x=>x.id===id); if(!p) return; const t=this.tbl(p.table), sym=this.cfg.currency==='£'?'£':this.cfg.currency;
  const r0=this.S.pubReq[id], spots=Math.max(1,p.cap-p.group.length), o={offer:r0?r0.offer:Math.round((p.min-covered(p))/spots/50)*50, party:0};
  const draw=()=>{
    const r=this.S.pubReq[id], me=this.me(), left=p.min-covered(p);
    const states=p.group.map((g,i)=>i===0?'host':'member'); if(r&&r.state==='in') r.party.forEach(()=>states.push('you'));
    const preview=[...p.group,...(me&&!r?Array(o.party+1).fill(me.g):[])];
    let h=`<div class="plan"><div class="where"><span class="mono" style="color:${this.cfg.publicGlow}">Public table</span><b>${esc(t.zone)}${t.num!=null?' · '+t.num:''}</b></div>${this.planSVG({focus:p.table,seatStates:states})}</div>
      <div class="card" style="padding:12px 14px"><div class="between"><span class="mono">Host</span><span class="mono" style="color:rgb(var(--green))">ID verified</span></div><div style="margin-top:6px">${hostLine(p.host)}</div>
        <div class="metric"><div class="between"><span class="lbl">Minimum ${this.fmt(p.min)}</span><span class="val"><b style="color:var(--gold2)">${this.fmt(left)}</b> left</span></div>${minBar(p,r?0:o.offer)}<div class="note" style="margin-top:5px">${p.paid.length} contribution${p.paid.length===1?'':'s'} so far${!r&&o.offer?' · <span style="color:rgb(var(--green))">green is your offer</span>':''}</div></div>
        <div class="metric"><div class="between"><span class="lbl">The group${!r&&me?' with you':''}</span><span class="val">${preview.length} of ${p.cap}</span></div>${genderBar(preview)}</div>
        <div class="note" style="margin-top:10px">Closes ${esc(p.closes)} · ${leftTime(p.left)} left. If the minimum isn't covered by then, the table cancels and every hold is released.</div></div>`;
    if(!r){
      h+=`<div class="sec mono">Your contribution · private to the host</div>
      <div class="offer-amt"><span class="cur">${esc(sym)}</span><span class="v" data-offv>${o.offer.toLocaleString('en-US')}</span></div>
      <input type="range" data-offr min="0" max="${left}" step="50" value="${Math.min(o.offer,left)}">
      <div class="quick">${[[0,'0'],[Math.round(left/4/50)*50,'¼ left'],[Math.round(left/2/50)*50,'½ left'],[left,'All of it']].map(([v,l])=>`<button type="button" data-q="${v}" class="${v===o.offer?'on':''}">${l}</button>`).join('')}</div>
      <p class="note">Paid to the venue as part of the minimum, never to the host. Held when you request, charged only if the host accepts.</p>
      <div class="sec mono">Coming with</div>
      <div class="pickrow">${['Just me','+1','+2','+3'].map((l,i)=>`<button type="button" class="pick ${o.party===i?'on':''}" data-p="${i}">${l}</button>`).join('')}</div>
      ${o.party?`<p class="note" style="margin-top:8px">Each friend gets a link to make their own bubl account. The request goes to the host once everyone is in.</p>`:''}
      <button class="btn" type="button" data-preq style="margin-top:16px">Request to join${o.offer?' · '+this.fmt(o.offer):''}</button>
      ${me?'':'<p class="note" style="text-align:center;margin-top:8px">You\'ll create your bubl account next.</p>'}
      <button class="btn ghost" type="button" data-share="${p.id}" style="margin-top:8px">Share this table ↗</button>`;
    } else h+=`<div class="card" style="text-align:center"><div class="mono ${r.state==='pending'?'pulse':''}" style="color:${r.state==='pending'?'var(--gold2)':'rgb(var(--green))'}">${r.state==='pending'?'Waiting for the host':'Accepted · you\'re on the table'}</div><p class="note" style="margin:6px 0 0">${r.state==='pending'?(r.offer?this.fmt(r.offer)+' held. ':'')+'The host sees your ranges'+(this.S.acct&&this.S.acct.social?' and your social link':'')+'.':(r.charged?this.fmt(r.charged)+' charged towards the minimum.':'No contribution.')}</p></div>`;
    this.sbody.innerHTML=h;
    const sb=this.sbody, redraw=()=>{const tp=sb.scrollTop;draw();sb.scrollTop=tp;};
    const R=sb.querySelector('[data-offr]'); if(R){ R.oninput=()=>{o.offer=+R.value; sb.querySelector('[data-offv]').textContent=o.offer.toLocaleString('en-US');}; R.onchange=redraw; }
    sb.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{o.offer=+b.dataset.q;redraw();});
    sb.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{o.party=+b.dataset.p;redraw();});
    sb.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>{this.closeSheet();setTimeout(()=>this.openShare(b.dataset.share),320)});
    const pr=sb.querySelector('[data-preq]'); if(pr) pr.onclick=()=>{
      const go=()=>{ const party=Array(o.party+1).fill(this.me().g); this.S.pubReq[id]={state:'pending',offer:o.offer,party}; this.changed(); this.openPublic(id);
        setTimeout(()=>{ const rr=this.S.pubReq[id]; rr.state='in'; rr.charged=rr.offer; if(rr.offer)p.paid.push(rr.offer); p.group.push(...party); this.changed(); if(this.sheetName==='Public table') this.openPublic(id); this.toast('The host accepted. You\'re on the table'); },3000); };
      if(this.me()) this.holdPay(o.offer,'Contribution · held',go);
      else { this.closeSheet(); setTimeout(()=>this.openSignup({amount:o.offer,label:'Your contribution',charge:'Only if the host accepts',done:go}),320); }
    };
  };
  this.openSheet('Public table',''); draw();
};
P.openShare=function(id){
  const p=id==='mine'?this.data.myTable:this.data.publics.find(x=>x.id===id); if(!p) return;
  const t=this.tbl(p.table), left=p.min-covered(p), code=(this.cfg.venue.code||this.cfg.venue.name.slice(0,2).toUpperCase())+'-'+(id==='mine'?'H7Q2':String(id).toUpperCase());
  const base=this.cfg.shareBase||'bubl.app/t/', url=base+code, c=gCount(p.group);
  this.openSheet('Share',`<div class="h2">Share the table, not the names</div><p class="note" style="margin:0 0 6px">This is what people see before they open it.</p>
    <div class="preview"><div class="top">${this.venueMark()}<div class="mono" style="color:${this.cfg.publicGlow}">Public table · ${esc(t.zone)}</div><div class="serif" style="font-size:24px;margin:8px 0 4px">${this.fmt(left)} left to cover</div><div class="note">${p.group.length} in · ${c.M} ♂ ${c.F} ♀ · closes ${esc(p.closes)}</div></div><div class="bot">${esc(url)}</div></div>
    <div class="linkbox"><span>${esc(url)}</span><button type="button" class="mono" data-cp style="color:var(--gold)">Copy</button></div>
    <a class="btn" href="https://wa.me/?text=${encodeURIComponent('Join our table at '+this.cfg.venue.name+' · '+this.fmt(left)+' left to cover · https://'+url)}" target="_blank" rel="noopener">Send on WhatsApp</a>
    <p class="note" style="text-align:center;margin-top:10px">Anyone who opens it needs a bubl account to request.</p>`,true);
  this.sbody.querySelector('[data-cp]').onclick=()=>{ try{ navigator.clipboard.writeText('https://'+url).then(()=>this.toast('Link copied'),()=>this.toast('Link copied')); }catch(e){ this.toast('Link copied'); } };
};

/* ---------------- booking hand-off + go public / go private ---------------- */
P.startBooking=function(){ if(typeof this.cfg.onBookTable==='function'){ this.cfg.onBookTable(); return; } this.openBookPicker(); };
P.minFor=function(id){ const t=this.tbl(id), m=this.cfg.minimums||{}; return t.min||m[id]||m[t.zone]||m[t.kind]||0; };
P.openBookPicker=function(){
  const taken=new Set([...this.data.bubls.map(b=>b.table),...this.data.publics.map(p=>p.table)]);
  const free=Object.keys(this.cfg.plan.tables).filter(id=>!taken.has(id));
  const st={id:free[0],M:this.me()&&this.me().g==='F'?0:1,F:this.me()&&this.me().g==='F'?1:0,pub:true};
  const draw=()=>{ const t=this.tbl(st.id), min=this.minFor(st.id), dep=min*((this.cfg.pricing||{}).depositPct||.5), n=st.M+st.F;
    this.sbody.innerHTML=`${this.venueMark()}<div class="h2">Book a table</div><p class="note" style="margin:0 0 10px">Tap a table on the plan.</p>
      <div class="plan"><div class="where"><span class="mono">${esc(t.zone)}</span><b>${this.fmt(min)} min</b></div>${this.planSVG({focus:st.id,seatStates:[],pick:free})}</div>
      <div class="golive"><div class="optrow" style="padding-top:0"><span>Coming</span><span class="row" style="gap:16px"><span class="stepper"><button type="button" data-g="M-">−</button><span class="v" style="font-size:20px;min-width:34px">${gs('M')} ${st.M}</span><button type="button" data-g="M+">+</button></span></span></div>
        <div class="optrow"><span></span><span class="stepper"><button type="button" data-g="F-">−</button><span class="v" style="font-size:20px;min-width:34px">${gs('F')} ${st.F}</span><button type="button" data-g="F+">+</button></span></div>
        <button type="button" class="toggle" data-pubopt style="border:0;padding:12px 0 0"><div><div style="font-weight:500">Make it a public table</div><div class="note">Glows on the plan. Verified guests can request a seat and help cover the minimum.</div></div><span class="sw ${st.pub?'on':''}"></span></button></div>
      <div class="card" style="padding:4px 14px"><div class="kv"><span>Minimum</span><b>${this.fmt(min)}</b></div><div class="kv"><span>Deposit</span><b>${this.fmt(dep)}</b></div><div class="kv"><span>Guests</span><b>${n} of ${t.seats}</b></div></div>
      <button type="button" class="btn" data-bk ${n?'':'disabled'}>${st.pub?'Book and set up public':'Book · '+this.fmt(dep)}</button>`;
    const sb=this.sbody;
    sb.querySelectorAll('[data-pick]').forEach(g=>g.onclick=()=>{st.id=g.dataset.pick;const tp=sb.scrollTop;draw();sb.scrollTop=tp;});
    sb.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const k=b.dataset.g[0],d=b.dataset.g[1]==='+'?1:-1;st[k]=Math.max(0,st[k]+d);if(st.M+st.F>t.seats)st[k]-=1;const tp=sb.scrollTop;draw();sb.scrollTop=tp;});
    sb.querySelector('[data-pubopt]').onclick=()=>{st.pub=!st.pub;const tp=sb.scrollTop;draw();sb.scrollTop=tp;};
    sb.querySelector('[data-bk]').onclick=()=>{
      const book=()=>{ const g=[...Array(st.M).fill('M'),...Array(st.F).fill('F')]; const me=this.me(); if(me){const i=g.indexOf(me.g); if(i>0){g.splice(i,1);g.unshift(me.g);}}
        this.booking={table:st.id,min,paid:[dep],group:g,cap:t.seats}; this.S.tab='public'; this.S.pubTab='host'; this.changed();
        if(st.pub) this.openGoPublicSheet(this.booking); else { this.closeSheet(); this.toast('Booked. You can make it public any time'); } };
      this.holdPay(dep,'Table deposit',book);
    };
  };
  this.openSheet('Book a table',''); draw();
};
P.openGoPublicSheet=function(src){
  if(!this.me()){ this.closeSheet(); setTimeout(()=>this.openSignup({done:()=>this.openGoPublicSheet(src)}),320); return; }
  const t=this.tbl(src.table), opts=this.cfg.closeOptions||['22:30','23:00','23:30','00:00'];
  const st={spots:Math.max(1,Math.min(src.isPublic?(src.cap-src.group.length):(src.cap-src.group.length),src.cap-src.group.length)),closes:src.closes||opts[1]};
  const maxSpots=Math.max(1,src.cap-src.group.length);
  const draw=()=>{ const left=Math.max(0,src.min-covered(src)), glow=this.cfg.publicGlow;
    this.sbody.innerHTML=`${this.venueMark()}<div class="h2">${src.isPublic?'Public settings':'Make your table public'}</div><p class="note" style="margin:0 0 10px">Your table will glow <span style="color:${glow}">●</span> on the plan for everyone with a bubl account.</p>
      <div class="plan"><div class="where"><span class="mono" style="color:${glow}">Public table</span><b>${esc(t.zone)}${t.num!=null?' · '+t.num:''}</b></div>${this.planSVG({focus:src.table,seatStates:src.group.map((g,i)=>i?'member':'you'),focusColor:glow})}</div>
      <div class="golive">
        <div class="optrow" style="padding-top:0"><span>Minimum left to cover</span><b style="color:var(--gold2)">${this.fmt(left)}</b></div>
        <div class="optrow"><span>Open spots</span><span class="stepper"><button type="button" data-sp="-">−</button><span class="v">${st.spots}</span><button type="button" data-sp="+">+</button></span></div>
        <div style="padding:12px 0 4px"><div class="between"><span>Closes at</span><span class="note">time limit</span></div><div class="pickrow" style="margin-top:8px">${opts.map(o=>`<button type="button" class="pick ${st.closes===o?'on':''}" data-cl="${o}">${o}</button>`).join('')}</div></div>
      </div>
      <div class="hold"><span>⟲</span><span>If the minimum isn't covered by <b>${esc(st.closes)}</b>, the table cancels and every hold, yours included, is released instantly. Guests' offers go to ${esc((this.cfg.venue||{}).name||'the venue')}, never to you.</span></div>
      <button type="button" class="btn" data-live>${src.isPublic?'Save':'Go public'}</button>
      ${src.isPublic?'':'<button type="button" class="btn plain" data-later style="margin-top:4px">Keep it private for now</button>'}`;
    const sb=this.sbody, tp=()=>sb.scrollTop;
    sb.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{st.spots=Math.max(1,Math.min(maxSpots,st.spots+(b.dataset.sp==='+'?1:-1)));const y=tp();draw();sb.scrollTop=y;});
    sb.querySelectorAll('[data-cl]').forEach(b=>b.onclick=()=>{st.closes=b.dataset.cl;const y=tp();draw();sb.scrollTop=y;});
    const lt=sb.querySelector('[data-later]'); if(lt) lt.onclick=()=>{this.closeSheet();this.toast('Booked. Switch it to public any time');};
    sb.querySelector('[data-live]').onclick=()=>{
      const T=this.data.myTable||Object.assign({requests:[]},clone(src));
      T.isPublic=true; T.closes=st.closes; T.cap=T.group.length+st.spots; T.left=T.left||120; T.requests=T.requests||[];
      this.data.myTable=T; this.booking=null; this.S.tab='public'; this.S.pubTab='host'; this.closeSheet(); this.changed();
      this.toast(src.isPublic?'Saved':'Your table is public and glowing');
      if(!src.isPublic&&this.cfg.demo!==false) this.simulateRequests();
      if(!src.isPublic) setTimeout(()=>this.openShare('mine'),700);
    };
  };
  this.openSheet('Public table',''); draw();
};
P.confirmPrivate=function(){
  const T=this.data.myTable, pend=T.requests.filter(r=>r.state==='new').length;
  this.openSheet('Make private',`<div class="h2">Make your table private?</div><p class="note" style="margin:0 0 14px">It stops glowing and leaves the public list.${pend?` ${pend} pending request${pend>1?'s are':' is'} declined and ${pend>1?'their holds are':'the hold is'} released.`:''} Guests you already accepted stay on the table.</p>
    <button type="button" class="btn" data-priv>Make private</button><button type="button" class="btn plain" data-keep style="margin-top:4px">Keep it public</button>`,true);
  this.sbody.querySelector('[data-priv]').onclick=()=>{ T.isPublic=false; T.requests.forEach(r=>{if(r.state==='new')r.state='dec';}); clearTimeout(this._simT1); clearTimeout(this._simT2); this.closeSheet(); this.changed(); this.toast('Your table is private'); };
  this.sbody.querySelector('[data-keep]').onclick=()=>this.closeSheet();
};
P.simulateRequests=function(){ // demo only: requests arriving after going public
  const pool=(this.cfg.demoRequests||[{handle:'@giulia.mrt',g:'F',age:27,nat:'Italian',ind:'Fashion',party:['F','F'],offer:0},{handle:'@arjun.kap',g:'M',age:31,nat:'Indian',ind:'Tech',party:['M'],offer:1500},{handle:'',g:'F',age:30,nat:'French',ind:'Finance',party:['F'],offer:500}]);
  let n=0; const add=()=>{ const T=this.data.myTable; if(!T||!T.isPublic||n>=pool.length) return; const r=Object.assign({id:'sr'+Date.now()+n,state:'new'},pool[n++]); T.requests.unshift(r); this.changed(); this.toast(`New request${r.handle?' from '+r.handle:''}`); };
  this._simT1=setTimeout(add,3500); this._simT2=setTimeout(()=>{add();setTimeout(add,2500);},7000);
};

/* ---------------- forms ---------------- */
function crowdForm(d){
  return `<div class="field"><label class="mono">Gender</label><div class="pickrow" data-f="g">${[['F','♀ Woman'],['M','♂ Man']].map(([k,l])=>`<button type="button" class="pick ${d.g===k?'on':''}" data-val="${k}">${l}</button>`).join('')}</div></div>
  <div class="field"><label class="mono">Nationality</label><div class="pickrow" data-f="nat">${LISTS.nat.map(x=>`<button type="button" class="pick ${d.nat===x?'on':''}" data-val="${x}">${x}</button>`).join('')}</div></div>
  <div class="field"><label class="mono">Industry</label><div class="pickrow" data-f="ind">${LISTS.ind.map(x=>`<button type="button" class="pick ${d.ind===x?'on':''}" data-val="${x}">${x}</button>`).join('')}</div></div>
  <div class="field"><label class="mono">Hobbies · up to 4</label><div class="pickrow" data-f="hob" data-multi="4">${LISTS.hob.map(x=>`<button type="button" class="pick ${d.hob.includes(x)?'on':''}" data-val="${x}">${x}</button>`).join('')}</div></div>`;
}
P.bindCrowd=function(d){ this.sbody.querySelectorAll('[data-f]').forEach(row=>{ const f=row.dataset.f, multi=+row.dataset.multi||0;
  row.querySelectorAll('.pick').forEach(b=>b.onclick=()=>{ if(multi){ const v=b.dataset.val,i=d.hob.indexOf(v); if(i>-1)d.hob.splice(i,1); else{ if(d.hob.length>=multi){this.toast('Up to '+multi);return;} d.hob.push(v);} b.classList.toggle('on',d.hob.includes(v)); }
    else { d[f]=b.dataset.val; row.querySelectorAll('.pick').forEach(x=>x.classList.toggle('on',x===b)); } }); }); };

/* phone + code block (account key for sign-up and log in) */
P.phoneBlock=function(a){ return `<div class="field"><label class="mono">Mobile number</label><div class="row"><input class="inp" style="flex:0 0 76px" value="${esc(a.cc||'+971')}" data-cc><input class="inp" data-phone inputmode="tel" value="${esc(a.phone||'')}" placeholder="50 123 4567"></div></div>
  ${a.otp?`<div class="mono" style="color:rgb(var(--green))">Number verified</div><div class="otp">${'4821'.split('').map(x=>`<div>${x}</div>`).join('')}</div>`:`<button class="btn ghost" type="button" data-otp>Send code</button><div class="otp" data-otpbox style="opacity:.4"><div></div><div></div><div></div><div></div></div>`}`; };
P.bindPhone=function(a,after){ const b=this.sbody.querySelector('[data-otp]'); if(!b) return; b.onclick=()=>{ a.phone=(this.sbody.querySelector('[data-phone]')||{}).value||''; b.textContent='Code sent'; const box=this.sbody.querySelector('[data-otpbox]'); box.style.opacity=1;
  '4821'.split('').forEach((x,k)=>setTimeout(()=>{ box.children[k].textContent=x; if(k===3){ a.otp=true; this.toast('Number verified'); after&&after(); } },350+k*260)); }; };

/* ---------------- LOG IN ---------------- */
P.openLogin=function(then){
  const a={otp:false};
  const paint=()=>{ this.sbody.innerHTML=`${this.venueMark()}<div class="h2">Log in to bubl</div><p class="note" style="margin:0 0 16px">One bubl account works at every venue.</p>${this.phoneBlock(a)}
    <button class="btn" type="button" data-go style="margin-top:14px" ${a.otp?'':'disabled'}>Log in</button>
    <button class="btn plain" type="button" data-new style="margin-top:6px">New here? Create a bubl account</button>`;
    this.bindPhone(a,paint);
    const go=this.sbody.querySelector('[data-go]'); go.onclick=()=>{ // demo: the verified number returns the stored account, or a demo account
      const acct=loadAccount()||{first:'Sam',last:'K',verified:true,social:'@samk',email:'sam@example.com',phone:a.phone,profile:{g:'M',age:30,nat:'Lebanese',ind:'Founder',hob:['Padel','F1','Travel']}};
      saveAccount(acct); this.S.acct=acct; this.closeSheet(); this.changed(); this.toast('Welcome back, '+acct.first); if(then) setTimeout(then,340); };
    this.sbody.querySelector('[data-new]').onclick=()=>this.openSignup({done:then});
  };
  this.openSheet('Log in','',true); paint();
};

/* ---------------- SIGN-UP (seamless, triggered by Request to join) ---------------- */
P.openSignup=function(ctx){
  ctx=ctx||{};
  const d={g:'',nat:'',ind:'',hob:[]}, a={first:'',last:'',dob:'',email:'',social:'',otp:false,id:null,stage:'',idDone:false,c1:false,c2:false};
  let i=0; const val=sel=>{const e=this.sbody.querySelector(sel);return e?e.value.trim():''};
  const steps=[
    {t:'Number', body:()=>`${this.venueMark()}<div class="h2">Create your bubl account</div><p class="note" style="margin:0 0 16px">Takes a minute. Works at every venue.</p>${this.phoneBlock(a)}
       <div class="field" style="margin-top:14px"><label class="mono">Email</label><input class="inp" data-email type="email" value="${esc(a.email)}" placeholder="you@email.com" autocapitalize="off"></div>
       <button class="btn plain" type="button" data-haveacct>Already have a bubl account? Log in</button>`,
     bind:()=>{ this.bindPhone(a,()=>{a.email=val('[data-email]');paint();}); this.sbody.querySelector('[data-haveacct]').onclick=()=>this.openLogin(ctx.done); },
     save:()=>{ a.phone=val('[data-phone]')||a.phone; a.email=val('[data-email]'); if(!a.otp) return 'Verify your number first'; if(!/.+@.+\..+/.test(a.email)) return 'Add your email'; }},
    {t:'You', body:()=>`<div class="h2">About you</div><div class="lock"><span>🔒</span><span>Your name stays hidden. Only the people at your table see it, once it confirms.</span></div>
       <div class="row"><div class="field" style="flex:1"><label class="mono">First name</label><input class="inp" data-first value="${esc(a.first)}" autocomplete="given-name"></div><div class="field" style="flex:1"><label class="mono">Last name</label><input class="inp" data-last value="${esc(a.last)}" autocomplete="family-name"></div></div>
       <div class="field"><label class="mono">Date of birth · tables see an age range</label><input class="inp" data-dob type="date" value="${esc(a.dob)}"></div>${crowdForm(d)}`,
     bind:()=>this.bindCrowd(d),
     save:()=>{ a.first=val('[data-first]'); a.last=val('[data-last]'); a.dob=val('[data-dob]');
       if(!a.first) return 'Add your first name'; if(!a.dob) return 'Add your date of birth';
       const age=Math.floor((Date.now()-new Date(a.dob))/31557600000); if(!(age>=21)) return 'bubl tables are 21+'; d.age=Math.min(age,80);
       if(!d.g) return 'Pick your gender'; if(!d.nat) return 'Pick your nationality'; if(!d.ind) return 'Pick your industry'; if(!d.hob.length) return 'Pick at least one hobby'; }},
    {t:'Social', body:()=>`<div class="h2">Social link</div><p class="note" style="margin:0 0 14px">Optional. Tables and hosts see it with your request, which makes you far more likely to be accepted.</p>
       <div class="field"><label class="mono">Instagram, LinkedIn or any profile</label><input class="inp" data-social value="${esc(a.social)}" placeholder="@handle or link" autocapitalize="off"></div>`,
     save:()=>{ a.social=val('[data-social]'); }, skip:true},
    {t:'ID', body:()=>{
       if(a.idDone) return `<div class="h2">Identity verified</div><div class="verified"><div class="tick">✓</div><div class="mono" style="color:rgb(var(--green))">${esc(a.id)} · matched</div><div class="note">21+ confirmed · your ID is never shown to anyone</div></div>`;
       if(a.id) return `<div class="h2">${a.id==='UAE Pass'?'Approve in UAE Pass':'Scan your '+esc(a.id)}</div><div class="scan">${a.id==='UAE Pass'?'<div class="mono pulse" style="color:var(--gold2)">Waiting for approval in UAE Pass…</div>':`<div class="${a.stage==='selfie'?'face':'doc'}"></div><div class="line"></div>`}</div><p class="note" style="text-align:center">${a.id==='UAE Pass'?'':a.stage==='selfie'?'Now a quick selfie to match it':'Hold it inside the frame'}</p>`;
       return `<div class="h2">Verify your ID</div><p class="note" style="margin:0 0 14px">Everyone at a bubl table is verified. Done once, for every venue.</p>
         ${[['UAE Pass','Residents · one tap'],['Emirates ID','Scan + selfie'],['Passport','Visitors · scan + selfie']].map(([k,s])=>`<button type="button" class="idopt" data-id="${k}"><div><div style="font-weight:500">${k}</div><div class="s">${s}</div></div><span class="mono">›</span></button>`).join('')}`; },
     bind:()=>this.sbody.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{ a.id=b.dataset.id; a.stage='doc'; paint();
       if(a.id==='UAE Pass') setTimeout(()=>{a.idDone=true;paint()},2000); else { setTimeout(()=>{a.stage='selfie';paint()},1800); setTimeout(()=>{a.idDone=true;paint()},3600); } }),
     save:()=>{ if(!a.idDone) return 'Verify your ID to continue'; }},
    {t:'Done', last:true, body:()=>`<div class="h2">${ctx.amount!=null?'Send your request':'You\'re set'}</div>
       <button type="button" class="check" data-c="c1"><span class="bx ${a.c1?'on':''}">${a.c1?'✓':''}</span><span><b style="font-weight:500">Show my ranges</b><br><span class="note">Age range, gender, nationality, industry and hobbies, to the tables I request</span></span></button>
       <button type="button" class="check" data-c="c2"><span class="bx ${a.c2?'on':''}">${a.c2?'✓':''}</span><span><b style="font-weight:500">Show my name once a table confirms</b><br><span class="note">Only to the people at that table</span></span></button>
       ${ctx.amount!=null?`<div class="card" style="padding:4px 14px;margin-top:14px"><div class="kv"><span>${esc(ctx.label)}</span><b>${ctx.amount?this.fmt(ctx.amount):'None'}</b></div><div class="kv"><span>Charged</span><b>${esc(ctx.charge||'Only when it confirms')}</b></div><div class="kv"><span>If it cancels</span><b>Hold released instantly</b></div></div>`:''}
       ${ctx.amount?`<button class="btn apple" type="button" data-pay ${a.c1&&a.c2?'':'disabled'}> Pay</button><button class="btn ghost" type="button" data-pay ${a.c1&&a.c2?'':'disabled'} style="margin-top:8px">Add card</button>`:`<button class="btn" type="button" data-pay ${a.c1&&a.c2?'':'disabled'} style="margin-top:14px">${ctx.amount!=null?'Send request':'Create account'}</button>`}`,
     bind:()=>{ this.sbody.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{a[b.dataset.c]=!a[b.dataset.c];paint();});
       this.sbody.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>{ const acct={first:a.first,last:a.last,email:a.email,phone:a.phone,social:a.social,idType:a.id,verified:true,profile:d};
         saveAccount(acct); this.S.acct=acct; this.closeSheet(); this.changed(); this.toast(ctx.amount!=null?'bubl account created. Request sent':'bubl account created'); if(ctx.done) setTimeout(ctx.done,350); }); }}
  ];
  const paint=()=>{ const s=steps[i];
    this.sbody.innerHTML=`<div class="prog">${steps.map((_,k)=>`<span class="${k<=i?'on':''}"></span>`).join('')}</div>${s.body()}
      ${s.last?'':`<button class="btn" type="button" data-next style="margin-top:14px">Continue</button>`}
      ${s.skip?`<button class="btn plain" type="button" data-skip style="margin-top:4px">Skip</button>`:''}
      ${i?`<button class="btn plain" type="button" data-back style="margin-top:2px">Back</button>`:''}`;
    this.oroot.querySelector('.st').textContent=`bubl account · ${i+1} of ${steps.length}`;
    s.bind&&s.bind();
    const n=this.sbody.querySelector('[data-next]'); if(n) n.onclick=()=>{ const err=s.save&&s.save(); if(err){this.toast(err);return;} i++; paint(); this.sbody.scrollTop=0; };
    const sk=this.sbody.querySelector('[data-skip]'); if(sk) sk.onclick=()=>{ a.social=''; i++; paint(); };
    const bk=this.sbody.querySelector('[data-back]'); if(bk) bk.onclick=()=>{ i--; paint(); };
  };
  this.openSheet('bubl account',''); paint();
};
P.holdPay=function(amount,label,done){
  this.openSheet('Confirm',`<div class="h2">${esc(label)}</div><div class="card" style="padding:4px 14px;margin-top:10px"><div class="kv"><span>Amount</span><b>${amount?this.fmt(amount):'None'}</b></div><div class="kv"><span>If it cancels</span><b>Released instantly</b></div></div>${amount?'<button class="btn apple" type="button" data-hp> Pay</button>':'<button class="btn" type="button" data-hp>Send request</button>'}`,true);
  this.sbody.querySelector('[data-hp]').onclick=()=>{ this.closeSheet(); setTimeout(done,300); };
};

window.BUBLSocial = { version:'1.0.0', BUBL_PURPLE, mount:cfg=>new Instance(cfg), resetAccount:clearAccount };
})();
