/* ================= utils ================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const ce=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
function h32(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return Math.abs(h)}
const DOWS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtD(d){return `${DOWS[d.getDay()]} ${d.getDate()} ${MONS[d.getMonth()]}`}
function fmtDK(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function dOf(k){return new Date(k+'T12:00:00')}
/* ---- the venue's booking rules (from its profile): deposit options, hold and cut-off ---- */
const RULES=LIVE?(r=>({depOpts:r.deposit_pct_options.map(o=>Math.round(o*100)),holdH:r.hold_hours||r.hold_minutes/60,
  shortHoldH:r.hold_close_to_night?r.hold_close_to_night.hold_minutes/60:null,shortHoldDays:r.hold_close_to_night?r.hold_close_to_night.within_days:0,
  cutoffMin:r.hold_cutoff_minutes_before_doors||0,guestFeePct:Math.round((r.guest_fee_split_pct||0)*10000)/100}))(PAGE.rules)
  :{depOpts:[50,100],holdH:24,shortHoldH:2,shortHoldDays:7,cutoffMin:120,guestFeePct:2};   /* demo: the build's own */
const NAME_BLOCKED='Please enter your full name exactly as it appears on your ID.';
/* a first look on the phone; BUBL's server makes the real check and flags borderline names for the door */
function nameCheck(n){n=String(n||'').normalize('NFKC').trim().replace(/\s+/g,' ');const k=n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  if(!/\p{L}/u.test(n))return 'blocked';if(/[\p{N}]/u.test(n)||/[^\p{L}\p{M}\s'\-.·,()]/u.test(n))return 'blocked';
  const L=[...k.replace(/[^\p{L}]/gu,'')];if(L.length<2||L.every(c=>c===L[0])||/(.)\1{3,}/u.test(k))return 'blocked';
  if(/^(test|testing|guest|none|null|na|n a|xxx+|asdf\w*|qwer\w*|john doe|jane doe|mickey mouse|donald duck|elon musk|santa claus|batman|spider ?man|no name|anonymous|unknown)$/.test(k))return 'blocked';
  return 'ok';}
const emailOk=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e||'').trim());
/* live: the amount is whole fils from the back end and is written out exactly (engine/money.js) */
const AED2=LIVE?(n=>BUBL.money.fmt(Math.round(n),CUR)):(n=>'AED '+(Math.round(n*100)/100).toLocaleString('en-US',{minimumFractionDigits:Math.round(n*100)%100?2:0,maximumFractionDigits:2}));
function doorsAt(){if(LIVE&&S.ev&&S.ev.doorsAt)return S.ev.doorsAt;const d=dOf(S.date||new Date().toISOString().slice(0,10)),hm=((S.ev&&S.ev.doors)||'20:00').split(':');d.setHours(+hm[0],+hm[1],0,0);return d.getTime();}
function cutoffAt(){return LIVE&&S.ev&&S.ev.cutoffAt?S.ev.cutoffAt:doorsAt()-RULES.cutoffMin*60000;}
/* after the cut-off there is no hold and no split: the host pays the whole deposit straight away */
/* online booking closes 2 hours before the event ends; a night that has passed is a demo date */
function nightOpen(){return LIVE?!!(S.ev&&S.ev.bookable):Date.now()<doorsAt()+5*3600000;}   /* live: the back end says whether the night can still be booked */
function lateBooking(){if(LIVE)return S.boothId?!!MINE.payNow:!!(S.ev&&S.ev.cutoffAt&&Date.now()>=S.ev.cutoffAt);return nightOpen()&&(S.bookedAt||Date.now())>=cutoffAt();}
/* more than 7 days out: 24 hours. In the last 7 days: 2 hours. Never past the cut-off. */
function holdSecs(){if(LIVE)return S.holdUntil?Math.max(0,(S.holdUntil-(S.bookedAt||Date.now()))/1000):0;   /* live: the back end set the deadline */
  if(!nightOpen())return RULES.holdH*3600;const at=S.bookedAt||Date.now(),h=(doorsAt()-at>RULES.shortHoldDays*86400000)?RULES.holdH:RULES.shortHoldH;return Math.max(0,Math.min(h*3600,(cutoffAt()-at)/1000));}
const guestFee=a=>Math.round(a*RULES.guestFeePct)/100;
const AED=LIVE?(n=>BUBL.money.fmt(Math.round(n),CUR)):(n=>'AED '+Math.round(n).toLocaleString('en-US'));
function toast(m){const t=ce('div','toast');t.textContent=m;$('#toastHost').appendChild(t);setTimeout(()=>t.remove(),3000)}
function flash(){const f=$('#flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}
function _b64u(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new TextDecoder('utf-8').decode(u);}
function timeToTOD(){return null;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
