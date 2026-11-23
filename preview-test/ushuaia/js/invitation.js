/* ================= spliced La Cave systems ================= */
(function(){
let autoT=null,armT=null,R=null,ipFrame=null,ipUrl=null,st='closed',dir=0,p=0,x0=0,y0=0,drag=false,cracked=false,W=0,H=0,CX=0,TY=0,SR=40,JAG=[],spotSent=false,tries=0,nbT=null,code='',resendT=null,left=0,myName='';
const q=s=>R.querySelector(s),qa=s=>[...R.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rnd(seed){let s=seed>>>0;return()=>{s=Math.imul(s^(s>>>15),2246822507)^Math.imul(s^(s>>>13),3266489909);s^=s>>>16;return(s>>>0)/4294967296;};}
let PAPER='';
function paper(){if(PAPER)return PAPER;try{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),id=x.createImageData(256,256),d=id.data,r=rnd(4242),lay=[];
for(let j=0;j<256;j++)lay.push((j%3===0?.55:0)+r()*.25);
for(let j=0;j<256;j++)for(let i=0;i<256;i++){const k=(j*256+i)*4,a=Math.max(0,r()-.35)*14+lay[j]*3;d[k]=255;d[k+1]=255;d[k+2]=255;d[k+3]=Math.min(255,a);}
x.putImageData(id,0,0);x.globalAlpha=.04;x.strokeStyle='#ffffff';x.lineWidth=.5;
for(let f=0;f<70;f++){const sx=r()*256,sy=r()*256,a=r()*6.28,l=4+r()*10;x.beginPath();x.moveTo(sx,sy);x.quadraticCurveTo(sx+Math.cos(a)*l*.5+r()*3,sy+Math.sin(a)*l*.5+r()*3,sx+Math.cos(a)*l,sy+Math.sin(a)*l);x.stroke();}
PAPER=c.toDataURL('image/png');}catch(_){}return PAPER;}
function info(){
/* live: a guest who opened a link sees the table that link is for (GUEST.view, from the back end); the host previewing sees their own */
const G=LIVE&&window.GUEST?GUEST.view:null;
const host=(G?G.host_name:(S.guestName||(LIVE?'':'Sam K'))).trim().replace(/\s+/g,' ');
const first=host.split(' ').slice(0,2).join(' ');
const ini=host.split(' ').filter(Boolean).map(w=>w[0].toUpperCase()).join('').slice(0,2)||'A';
const d=S.date?new Date(S.date+'T12:00:00'):new Date();
const t=S.time||'23:00',[hh,mm]=t.split(':').map(Number);
const party=Math.max(2,G?G.party_size:(S.party||4));
const joined=G?guestsButMe(G):LIVE?(S.guests||[]).map(n=>String(n).split(' ')[0]):(S.guests||[]).slice(0,party-2);
return {first,ini,d,hh,mm,party,joined,
day:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}),
t12:((hh%12)||12)+(mm?':'+String(mm).padStart(2,'0'):'')+(hh<12?' am':' pm')};
}
function markup(I){return `
<div class="ip-scroll"><main class="ip-page">
<div class="ip-hw"><h1 class="ip-h1 ip-to">Invitation to</h1></div>
<div class="ip-brand">${logoSVG()}</div>
<div class="ip-acts"></div>
<div class="ip-night"></div>
<div class="rcanvas is3d ip-venue"><div class="ip-wait">Lighting the room</div><div class="vtog ip-vtog" role="group" aria-label="Room view"><button type="button" data-v="iso" class="on">3D</button><button type="button" data-v="top">Plan</button></div></div>
<div class="ip-facts"><div><small>${esc(S.ev?S.ev.short:'Date')}</small><p>${esc(I.day)}</p></div><div><small>Arrive by</small><p>${esc(I.t12)}</p></div></div>
<section class="ip-table"><div class="ip-thd"><b>At the table</b><span class="ip-count"></span></div><div class="ip-guests"></div></section>
<section class="vote ip-vote" data-who="guest"></section>
<section class="ip-int"></section>
<section class="ip-claim">
<h2 class="ip-ch">Claim your spot</h2>
<p class="ip-why">Each guest confirms their own spot, so <em>${esc(I.first)}</em> knows exactly who's coming.</p>
<form class="ip-step ip-s1" novalidate>
<p class="id-note ip-idn"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="5.6" cy="7.4" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.4 11c.5-1.1 1.3-1.6 2.2-1.6s1.7.5 2.2 1.6M9.6 6.6h3M9.6 9h2.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg><span>Your name must match your ID at the door, or entry isn&#39;t guaranteed.</span></p><label class="ip-fld"><small>Full name as on your ID</small><input class="ip-in ip-name" autocomplete="name" placeholder="First and last name"></label>
<label class="ip-fld"><small>Mobile number</small><span class="ip-phone">
<select class="ip-in ip-cc" aria-label="Country code"><option value="971" selected>🇦🇪 +971</option><option value="966">🇸🇦 +966</option><option value="974">🇶🇦 +974</option><option value="965">🇰🇼 +965</option><option value="973">🇧🇭 +973</option><option value="968">🇴🇲 +968</option><option value="961">🇱🇧 +961</option><option value="44">🇬🇧 +44</option><option value="33">🇫🇷 +33</option><option value="1">🇺🇸 +1</option></select>
<input class="ip-in ip-tel" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="50 123 4567"></span></label>
<label class="ip-fld"><small>Email</small><input class="ip-in ip-em" type="email" autocomplete="email" autocapitalize="off" placeholder="you@email.com"></label>
<p class="ip-err ip-e1" role="alert"></p>
<button class="ip-btn ip-send" type="submit">Send code</button>
<p class="ip-fine">We send a 6-digit code to confirm it's you. Your number and email are only used for this reservation.</p>
</form>
<form class="ip-step ip-s2" hidden novalidate>
<p class="ip-sent">Enter the code we texted to <b class="ip-to"></b>.</p>
<button class="ip-link ip-chg" type="button">Use a different number</button>
<div class="ip-otp"><input inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="Digit 1"><input inputmode="numeric" maxlength="1" aria-label="Digit 2"><input inputmode="numeric" maxlength="1" aria-label="Digit 3"><input inputmode="numeric" maxlength="1" aria-label="Digit 4"><input inputmode="numeric" maxlength="1" aria-label="Digit 5"><input inputmode="numeric" maxlength="1" aria-label="Digit 6"></div>
<p class="ip-err ip-e2" role="alert"></p><p class="ip-resend"></p>
<button class="ip-btn ip-verify" type="submit" disabled>Claim my spot</button>
</form>
<div class="ip-step ip-done" hidden>
<svg viewBox="0 0 62 62" aria-hidden="true"><circle cx="31" cy="31" r="28" fill="none" stroke="#39FF6A" stroke-width="2"/><path d="M19 31.5l8 8 16-17" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
<h3 class="ip-dh"></h3><p class="ip-dp"></p>
<div class="ip-row"><button class="ip-btn ip-close2" type="button">Done</button></div>
</div>
</section>
${window.lcMapHTML?window.lcMapHTML('ip'):''}
<p class="ip-foot">Tables at Ushuaïa are held spot by spot.</p>
</main></div>
<section class="ip-stage"><div class="ip-spill"></div>
<div class="ip-env" role="button" tabindex="0" aria-label="Swipe across the seal to open the invitation">
<div class="ip-piece ip-pb"><div class="ip-clip"></div></div><div class="ip-piece ip-pt"><div class="ip-clip"></div></div>
<svg class="ip-trail" aria-hidden="true"></svg><div class="ip-trail ip-track" aria-hidden="true"><i class="ip-spark"></i></div>
</div></section>
<button class="ip-x" type="button" aria-label="Close preview">✕</button>
<div class="ios-nb ip-nb" role="status"><div class="ios-nb-ic" aria-hidden="true"><svg viewBox="0 0 40 40"><defs><linearGradient id="ipMg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67F07F"/><stop offset="1" stop-color="#1FC23B"/></linearGradient></defs><rect width="40" height="40" rx="9.5" fill="url(#ipMg)"/><path d="M20 9.2c-6.9 0-12.4 4.5-12.4 10.1 0 3.2 1.8 6 4.6 7.9-.2 1.7-1 3.3-2.4 4.5 2.5.1 4.6-.8 6.1-2.3 1.3.3 2.6.5 4.1.5 6.9 0 12.4-4.5 12.4-10.1S26.9 9.2 20 9.2z" fill="#fff"/></svg></div>
<div class="ios-nb-body"><div class="ios-nb-top"><span class="ios-nb-title">BUBL</span><span class="ios-nb-time">now</span></div><p class="ios-nb-msg ip-nbm"></p></div></div>`;}
function addActs(){const va=document.querySelector('.venue-actions'),box=q('.ip-acts');if(!va||!box)return;
const c=va.cloneNode(true);c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));c.querySelectorAll('canvas').forEach((cv,i)=>{const o=va.querySelectorAll('canvas')[i];if(o){cv.width=o.width;cv.height=o.height;try{cv.getContext('2d').drawImage(o,0,0);}catch(_){}}});
const bs=c.querySelectorAll('.vact');
if(bs[0])bs[0].addEventListener('click',()=>{const o=document.getElementById('mediaBtn');if(o)o.click();});
if(bs[1])bs[1].addEventListener('click',()=>{const o=document.getElementById('menuBtn');if(o)o.click();});
box.appendChild(c);}
function fitLine(el){if(!el)return;el.style.fontSize='';const pc=getComputedStyle(el.parentNode);let f=parseFloat(getComputedStyle(el).fontSize),w=el.parentNode.clientWidth-parseFloat(pc.paddingLeft)-parseFloat(pc.paddingRight);
for(let i=0;i<40&&el.scrollWidth>w&&f>20;i++){f-=1;el.style.fontSize=f+'px';}}
function renderGuests(I){setTimeout(()=>{if(window.vtRender)vtRender();},0);
const rows=[[I.first,'Host','on']].concat(I.joined.map(n=>[n,'Confirmed','on']));
if(!(LIVE&&!window.GUEST))rows.push(myName?[myName,'Confirmed','you on']:['You','Waiting for you','you']);   /* live: the host previewing is already on the list */
let h='';rows.forEach(([n,s,c],i)=>{h+=`<div class="ip-g"><i class="${c}"></i><b${i===0?' class="host"':''}>${esc(n)}</b><span${(!myName&&i===rows.length-1)?' class="gold"':''}>${s}</span></div>`;});
for(let i=rows.length;i<I.party;i++)h+=`<div class="ip-g"><i></i><b class="muted">Open place</b><span></span></div>`;
q('.ip-guests').innerHTML=h;
q('.ip-count').textContent=`${1+I.joined.length+(myName?1:0)} of ${I.party} confirmed`;
}
function sealPath(cx,cy,r){const r2=rnd(77),n=26,P=[];let d='';
for(let i=0;i<n;i++){const a=i/n*Math.PI*2;let rr=r*(1+(r2()-.5)*.09);if(i===7||i===19)rr*=1.12;P.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}
for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];d+=(i?'Q':'M'+((P[n-1][0]+a[0])/2).toFixed(2)+' '+((P[n-1][1]+a[1])/2).toFixed(2)+' Q')+a[0].toFixed(2)+' '+a[1].toFixed(2)+' '+((a[0]+b[0])/2).toFixed(2)+' '+((a[1]+b[1])/2).toFixed(2)+' ';}
return d+'Z';}
function envSVG(k,I){
const cx=CX,cy=TY,tip=TY+SR*.62,s=SR/31,hy=Math.min(H-60,TY+SR+64);
let beads='';for(let i=0;i<40;i++){const a=i/40*Math.PI*2;beads+=`<circle cx="${(cx+Math.cos(a)*19.6).toFixed(2)}" cy="${(cy+Math.sin(a)*19.6).toFixed(2)}" r=".62" fill="url(#bd${k})"/>`;}
const mono=I.ini.length>1?`<tspan>${I.ini[0]}</tspan><tspan dx="-1.2">${I.ini[1]}</tspan>`:I.ini,fs=I.ini.length>1?18.5:24;
const T=(f,o,dx,dy)=>`<text x="${cx}" y="${cy+.9}" text-anchor="middle" dominant-baseline="central" font-family="Anton,Impact,sans-serif" font-style="normal" font-weight="400" font-size="${fs}" fill="${f}" opacity="${o}" transform="translate(${dx} ${dy})">${mono}</text>`;
return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs>
<pattern id="pap${k}" patternUnits="userSpaceOnUse" width="85" height="85"><image href="${paper()}" width="85" height="85"/></pattern>
<linearGradient id="fl${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1c1f"/><stop offset="1" stop-color="#111113"/></linearGradient>
<linearGradient id="fs${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#151517"/><stop offset="1" stop-color="#0e0e10"/></linearGradient>
<linearGradient id="fb${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#18181b"/><stop offset="1" stop-color="#0c0c0e"/></linearGradient>
<linearGradient id="gi${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a80"/><stop offset=".5" stop-color="#FF1414"/><stop offset="1" stop-color="#d00a0f"/></linearGradient>
<filter id="fsh${k}" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.6" flood-color="#000" flood-opacity=".75"/></filter>
<radialGradient id="wx${k}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ff7a70"/><stop offset=".45" stop-color="#ff1a1a"/><stop offset="1" stop-color="#b8060b"/></radialGradient>
<radialGradient id="wf${k}" cx=".6" cy=".66" r=".8"><stop offset="0" stop-color="#ff2a2a"/><stop offset="1" stop-color="#d40a10"/></radialGradient>
<linearGradient id="rim${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a0206"/><stop offset=".5" stop-color="#ff1a1a"/><stop offset="1" stop-color="#ffc4be"/></linearGradient>
<linearGradient id="bd${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a0306"/><stop offset="1" stop-color="#ffb4ac"/></linearGradient>
<filter id="sb${k}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="gl${k}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>
<rect width="${W}" height="${H}" fill="#0d0d0f"/>
<path d="M0 0 L0 ${H} L${cx-W*.08} ${tip-6} Z" fill="url(#fs${k})"/><path d="M${W} 0 L${W} ${H} L${cx+W*.08} ${tip-6} Z" fill="url(#fs${k})"/>
<path d="M0 ${H} L${cx} ${TY-H*.07} L${W} ${H} Z" fill="url(#fb${k})" filter="url(#fsh${k})"/>
<path d="M0 0 L${W} 0 L${cx} ${tip} Z" fill="url(#fl${k})" filter="url(#fsh${k})"/>
<path d="M16 14 L${cx} ${tip-11} L${W-16} 14" fill="none" stroke="url(#gi${k})" stroke-width="1" stroke-linejoin="round" opacity=".9"/>
<rect width="${W}" height="${H}" fill="url(#pap${k})"/>

<g class="ip-hintg ip-go" opacity=".95"><text x="${cx+15}" y="${hy}" text-anchor="middle" font-family="Space Grotesk,system-ui,sans-serif" font-weight="500" font-size="14" fill="#ffffff" fill-opacity=".6">Swipe across the seal to open</text>
<path d="M${cx-134} ${hy-5} h22 m-5 -4.5 l5 4.5 -5 4.5" fill="none" stroke="#FF1414" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>
<g transform="translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})">
<g transform="translate(${cx} ${cy}) scale(.08) translate(${-(LOGO_V.bb[0]+LOGO_V.bb[2])/2} ${-(LOGO_V.bb[1]+LOGO_V.bb[3])/2})">
<g transform="translate(26 38)"><path d="${LOGO_V.bird}" fill="#3a0003" fill-rule="evenodd" opacity=".85"/><path d="${LOGO_V.wing}" fill="#3a0003" fill-rule="evenodd" opacity=".85"/></g>
<g transform="translate(-12 -14)"><path d="${LOGO_V.bird}" fill="#ffc4be" fill-rule="evenodd" opacity=".55"/><path d="${LOGO_V.wing}" fill="#ffc4be" fill-rule="evenodd" opacity=".55"/></g>
<path d="${LOGO_V.bird}" fill="url(#wx${k})" fill-rule="evenodd"/><path d="${LOGO_V.wing}" fill="url(#wx${k})" fill-rule="evenodd"/></g>

</g></svg>`;}
function fiber(k,rev){const pts=rev?JAG.slice().reverse():JAG,off=k==='t'?-1:1;
return `<path class="ip-fib ${rev?'rv':'fw'}" d="M${pts.map(a=>a[0].toFixed(1)+' '+(a[1]+off).toFixed(1)).join(' L')}" fill="none" stroke="#FF1414" stroke-opacity=".7" stroke-width="2" stroke-linejoin="round" stroke-linecap="butt" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;}
function buildEnv(I){
const r=R.getBoundingClientRect();W=Math.max(1,Math.round(r.width));H=Math.max(1,Math.round(r.height));
CX=W/2;TY=Math.round(H*.47);SR=Math.max(36,Math.min(56,Math.min(W,H)*.11));
const rr=rnd(1987),n=Math.max(28,Math.round(W/7));JAG=[];
for(let i=0;i<=n;i++){const x=i/n*W,s=Math.abs(x-CX)<SR*1.02,a=s?SR*.1:2.3;JAG.push([x,TY+(i===0||i===n?0:(rr()-.5)*2*a+(s?(i%2?SR*.07:-SR*.07):0))]);}
[['t','.ip-pt'],['b','.ip-pb']].forEach(([k,sel])=>{const pc=q(sel),cl=pc.querySelector('.ip-clip');cl.innerHTML=envSVG(k,I);
const o=pc.querySelector('.ip-fibers');if(o)o.remove();
pc.insertAdjacentHTML('beforeend',`<svg class="ip-fibers" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%">${fiber(k,false)}${fiber(k,true)}</svg>`);});
const rj=JAG.slice().reverse();
q('.ip-pt .ip-clip').style.clipPath='polygon(0px 0px,'+W+'px 0px,'+rj.map(a=>a[0].toFixed(1)+'px '+Math.min(H,a[1]+1).toFixed(1)+'px').join(',')+')';
q('.ip-pb .ip-clip').style.clipPath='polygon(0px '+H+'px,'+W+'px '+H+'px,'+rj.map(a=>a[0].toFixed(1)+'px '+(a[1]-.2).toFixed(1)+'px').join(',')+')';
const tr=q('svg.ip-trail');tr.setAttribute('viewBox',`0 0 ${W} ${H}`);
tr.innerHTML=`<defs><linearGradient id="ipTg" x1="0" x2="1"><stop offset="0" stop-color="#FF1414" stop-opacity="0"/><stop offset=".5" stop-color="#FF1414" stop-opacity=".9"/><stop offset="1" stop-color="#FF1414" stop-opacity="0"/></linearGradient></defs><path d="M18 ${TY} L${W-18} ${TY}" stroke="url(#ipTg)" stroke-width="1" stroke-dasharray="3 6" fill="none"/>`;
q('.ip-track').style.top=TY+'px';q('.ip-spill').style.setProperty('--ty',TY+'px');
}
function draw(){
const pT=q('.ip-pt'),pB=q('.ip-pb'),px=dir>0?W:0;
pT.style.transformOrigin=pB.style.transformOrigin=px+'px '+TY+'px';
pT.style.transform=`skewY(${(dir*p*4.6).toFixed(3)}deg) translateY(${(-p*3).toFixed(2)}px)`;
pB.style.transform=`skewY(${(-dir*p*1.7).toFixed(3)}deg) translateY(${(p*2).toFixed(2)}px)`;
const f=Math.min(1,p*1.4);
qa('.ip-fib.fw').forEach(e=>e.style.strokeDashoffset=dir>0?1-f:1);qa('.ip-fib.rv').forEach(e=>e.style.strokeDashoffset=dir<0?1-f:1);
q('.ip-spill').style.opacity=Math.min(1,p*1.5).toFixed(3);
if(!cracked&&p>.5){cracked=true;try{navigator.vibrate&&navigator.vibrate(12);}catch(_){}}
}
function springBack(){const p0=p,t0=performance.now();(function f(t){if(!R)return;const k=Math.min(1,(t-t0)/380);p=p0*(1-(1-Math.pow(1-k,3)));draw();
if(k<1)requestAnimationFrame(f);else{p=0;cracked=false;dir=0;q('.ip-env').classList.remove('tearing');}})(t0);}
function autoTear(){if(st!=='sealed')return;dir=1;q('.ip-env').classList.add('tearing');const t0=performance.now();
(function f(t){if(!R)return;const k=Math.min(1,(t-t0)/760);p=k<1?k*k*(3-2*k)*.92:1;draw();if(k<1)requestAnimationFrame(f);else openEnv();})(t0);}
function openEnv(){
if(st!=='sealed')return;st='opening';p=1;draw();
const pT=q('.ip-pt'),pB=q('.ip-pb'),e='cubic-bezier(.55,.06,.68,.19)';
pT.animate([{transform:pT.style.transform},{transform:`translate(${-dir*24}px,${-(TY+180)}px) rotate(${-dir*8}deg)`}],{duration:900,easing:e,fill:'forwards'});
pB.animate([{transform:pB.style.transform},{transform:`translate(${dir*10}px,${H-TY+180}px) rotate(${dir*3}deg)`}],{duration:960,delay:50,easing:e,fill:'forwards'});
q('.ip-spill').animate([{opacity:1},{opacity:0}],{duration:900,delay:250,fill:'forwards'});
setTimeout(()=>{if(!R)return;st='open';R.classList.remove('sealed');R.classList.add('open');},240);
setTimeout(()=>{if(!R)return;const s=q('.ip-stage');if(s)s.remove();if(!ipFrame)mountVenue();},950);
}
function releaseBooking(){
if(typeof dollFrame!=='undefined'&&dollFrame){try{dollFrame.remove();}catch(_){}dollFrame=null;dollReady=false;
if(dollUrl){try{URL.revokeObjectURL(dollUrl);}catch(_){}dollUrl=null;}}
}
function ipPaintV(v){if(!R)return;qa('.ip-vtog button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.ip-vtog button');if(!b)return;ipPost({cmd:'setView',view:b.dataset.v});ipPaintV(b.dataset.v);});
function ipPost(m){try{ipFrame&&ipFrame.contentWindow&&ipFrame.contentWindow.postMessage(Object.assign({source:'ush-host'},m),'*');}catch(_){}}
function mountVenue(){
if(!R)return;const host=q('.ip-venue');
releaseBooking();
if(ipFrame){try{ipFrame.remove();}catch(_){}}if(ipUrl){try{URL.revokeObjectURL(ipUrl);}catch(_){}ipUrl=null;}
spotSent=false;tries++;host.classList.remove('ready');
ipFrame=document.createElement('iframe');
ipFrame.className='doll-frame';
ipFrame.title='Ushuaïa, with your table lit';
ipFrame.setAttribute('scrolling','no');
ipFrame.src=VENUE_SRC;
host.insertBefore(ipFrame,host.firstChild);
}
function onVenueMsg(ev){
const d=ev.data;if(!R||!ipFrame||!d||d.source!=='ush-venue'||ev.source!==ipFrame.contentWindow)return;
if(!spotSent){spotSent=true;
ipPost({cmd:'readonly',on:true});
const tod=timeToTOD(S.time);if(tod!=null)ipPost({cmd:'setTOD',value:tod});
ipPost({cmd:'book',id:LIVE&&window.GUEST?GUEST.view.table.key:S.boothId});if(R)q('.ip-venue').classList.add('ready');
}
if(d.type==='view'){ipPaintV(d.view);return;}
if((d.type==='ctxlost'||d.type==='fatal')&&tries<3)setTimeout(mountVenue,400);
}
function fmtTel(d){const s=d.replace(/\D/g,'');return s.replace(/^(\d{2})(\d{3})(\d{0,4}).*$/,(_,a,b,c)=>[a,b,c].filter(Boolean).join(' '))||s;}
function showNb(msg){const nb=q('.ip-nb');q('.ip-nbm').textContent=msg;clearTimeout(nbT);nb.classList.remove('nb-in');void nb.offsetWidth;requestAnimationFrame(()=>nb.classList.add('nb-in'));nbT=setTimeout(hideNb,7500);}
function hideNb(){if(!R)return;clearTimeout(nbT);q('.ip-nb').classList.remove('nb-in');}
function wireForm(I){
if(LIVE){wireFormLive(I,{q,R,named:n=>{myName=n;},renderGuests:()=>renderGuests(info())});return;}   /* test and live: the real claim (live-invite.js) */
const boxes=qa('.ip-otp input'),val=()=>boxes.map(b=>b.value).join('');
const sync=()=>{q('.ip-verify').disabled=val().length!==6;};
const setOtp=s=>{s=s.replace(/\D/g,'').slice(0,6);boxes.forEach((b,i)=>b.value=s[i]||'');sync();};
const clearOtp=()=>{boxes.forEach(b=>b.value='');q('.ip-otp').classList.remove('bad');q('.ip-e2').textContent='';sync();};
const tick=()=>{const r=q('.ip-resend');if(!r)return;if(left>0){r.textContent=`You can request a new code in 0:${String(left).padStart(2,'0')}`;left--;}
else{clearInterval(resendT);r.innerHTML='';const b=document.createElement('button');b.type='button';b.className='ip-link';b.textContent='Text me a new code';b.onclick=()=>{clearOtp();send();};r.appendChild(b);}};
const send=()=>{code=String(100000+Math.floor(Math.random()*900000));
clearTimeout(autoT);const my=code;
setTimeout(()=>{if(R)showNb(`Your Ushuaïa code is ${code}. It confirms your spot at ${I.first}'s table. Don't share it.`);},900);
setTimeout(()=>{if(!R)return;let h=q('.ip-codehint');if(!h){h=document.createElement('button');h.type='button';h.className='ip-codehint';q('.ip-otp').insertAdjacentElement('afterend',h);}h.innerHTML=`<small>From Messages</small><b>${code}</b><span>Tap to fill</span>`;h.onclick=()=>{setOtp(code);hideNb();h.remove();q('.ip-verify').click();};},700);
autoT=setTimeout(()=>{if(!R||my!==code||q('.ip-s2').hidden||val()===code)return;setOtp(code);const o=q('.ip-otp');o.classList.remove('fill');void o.offsetWidth;o.classList.add('fill');
autoT=setTimeout(()=>{if(!R||q('.ip-s2').hidden)return;hideNb();const h=q('.ip-codehint');if(h)h.remove();q('.ip-verify').click();},750);},1800);
left=30;clearInterval(resendT);tick();resendT=setInterval(tick,1000);};
q('.ip-tel').addEventListener('input',e=>{const d=e.target.value.replace(/\D/g,'').slice(0,12);e.target.value=q('.ip-cc').value==='971'?fmtTel(d):d;e.target.classList.remove('bad');q('.ip-e1').textContent='';});
q('.ip-name').addEventListener('input',e=>{e.target.classList.remove('bad');q('.ip-e1').textContent='';});
q('.ip-s1').addEventListener('submit',e=>{e.preventDefault();
const nm=q('.ip-name').value.trim().replace(/\s+/g,' '),dg=q('.ip-tel').value.replace(/\D/g,'').replace(/^0+/,'');
if(nm.length<2){q('.ip-name').classList.add('bad');q('.ip-e1').innerHTML=`Add your name so <em>${esc(I.first)}</em> knows who's coming.`;q('.ip-name').focus();return;}
if(window.parent&&window.parent.nameCheck?window.parent.nameCheck(nm)==='blocked':(typeof nameCheck==='function'&&nameCheck(nm)==='blocked')){q('.ip-name').classList.add('bad');q('.ip-e1').textContent='Please enter your full name exactly as it appears on your ID.';q('.ip-name').focus();return;}
{const em=(q('.ip-em')||{}).value||'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.trim())){q('.ip-em').classList.add('bad');q('.ip-e1').textContent='Add your email. Your confirmation and receipt go there.';q('.ip-em').focus();return;}}
if(dg.length<7||dg.length>12){q('.ip-tel').classList.add('bad');q('.ip-e1').textContent='Enter your mobile number, 7 to 12 digits, without the country code.';q('.ip-tel').focus();return;}
const b=q('.ip-send');b.disabled=true;b.textContent='Sending';
setTimeout(()=>{if(!R)return;b.disabled=false;b.textContent='Send code';
q('.ip-s2 .ip-to').textContent='+'+q('.ip-cc').value+' '+(q('.ip-cc').value==='971'?fmtTel(dg):dg);
q('.ip-s1').hidden=true;q('.ip-s2').hidden=false;send();setTimeout(()=>boxes[0].focus({preventScroll:true}),60);},650);});
q('.ip-chg').addEventListener('click',()=>{clearInterval(resendT);clearTimeout(autoT);hideNb();clearOtp();q('.ip-s2').hidden=true;q('.ip-s1').hidden=false;q('.ip-tel').focus();});
boxes.forEach((b,i)=>{
b.addEventListener('input',()=>{const v=b.value.replace(/\D/g,'');q('.ip-otp').classList.remove('bad');q('.ip-e2').textContent='';
if(v.length>1){setOtp(v);boxes[Math.min(5,v.length-1)].focus();if(v.length>=6)q('.ip-verify').focus();return;}
b.value=v;if(v&&i<5)boxes[i+1].focus();sync();if(val().length===6)q('.ip-verify').focus();});
b.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!b.value&&i>0){boxes[i-1].focus();boxes[i-1].value='';sync();e.preventDefault();}});
b.addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData).getData('text');if(t){e.preventDefault();setOtp(t);}});
b.addEventListener('focus',()=>b.select());});
q('.ip-s2').addEventListener('submit',e=>{e.preventDefault();const v=val();if(v.length!==6)return;
if(v!==code){const o=q('.ip-otp');o.classList.remove('shake');void o.offsetWidth;o.classList.add('bad','shake');q('.ip-e2').textContent="That code doesn't match. Check the text we just sent, or request a new one.";return;}
const b=q('.ip-verify');b.disabled=true;b.textContent='Confirming';
setTimeout(()=>{if(!R)return;clearInterval(resendT);hideNb();myName=q('.ip-name').value.trim().split(' ')[0];window.__ipClaimed=true;window.__ipName=myName;document.querySelectorAll('.ip-claimbtn').forEach(b=>b.remove());{const cb=q('.ip-close2');if(cb)cb.textContent='Continue';}renderGuests(I);
q('.ip-dh').textContent=`You're on the table, ${myName}.`;q('.ip-dp').innerHTML=`<em>${esc(I.first)}</em> can see you're coming.`;
q('.ip-ch').style.display='none';q('.ip-why').style.display='none';q('.ip-s2').hidden=true;q('.ip-done').hidden=false;
if(!q('.ip-dep'))q('.ip-done').insertAdjacentHTML('beforeend','<div class="ip-dep"></div>');if(window.ipDepRender)ipDepRender();
q('.ip-claim').scrollIntoView({behavior:'smooth',block:'start'});},800);});
(function(){const nb=q('.ip-nb');let y=null,dy=0,mv=false;
nb.addEventListener('pointerdown',e=>{y=e.clientY;dy=0;mv=false;nb.classList.add('drag');clearTimeout(nbT);});
nb.addEventListener('pointermove',e=>{if(y===null)return;dy=e.clientY-y;if(Math.abs(dy)>4)mv=true;nb.style.transform=`translate3d(0,${dy<0?dy:Math.pow(dy,.62)}px,0)`;});
const end=()=>{if(y===null)return;y=null;nb.classList.remove('drag');nb.style.transform='';
if(!mv){if(code&&!q('.ip-s2').hidden){setOtp(code);q('.ip-verify').focus({preventScroll:true});}hideNb();}else if(dy<-26)hideNb();else nbT=setTimeout(hideNb,4000);};
nb.addEventListener('pointerup',end);nb.addEventListener('pointercancel',end);})();
}
function close(){
if(!R)return;clearTimeout(nbT);clearInterval(resendT);clearTimeout(autoT);clearTimeout(armT);
if(ipFrame){try{ipFrame.remove();}catch(_){}ipFrame=null;}if(ipUrl){try{URL.revokeObjectURL(ipUrl);}catch(_){}ipUrl=null;}
const r=R;R=null;st='closed';r.classList.remove('on');setTimeout(()=>r.remove(),320);document.body.classList.remove('ipv-open');
removeEventListener('message',onVenueMsg);removeEventListener('keydown',onKey);
if(typeof dollFrame!=='undefined'&&!dollFrame)setTimeout(()=>{try{renderRoom();}catch(_){}},340);
}
function onKey(e){if(e.key==='Escape')close();}
window.openInvitePreview=function(){
if(R)return;
const I=info();
st='sealed';dir=0;p=0;cracked=false;tries=0;myName=LIVE&&window.GUEST&&GUEST.me?GUEST.me:'';code='';
R=document.createElement('div');R.id='ipv';R.className='sealed';R.setAttribute('role','dialog');R.setAttribute('aria-modal','true');R.setAttribute('aria-label','Invitation preview');
R.innerHTML=markup(I);
if(LIVE&&!window.GUEST)R.classList.add('ip-preview');   /* live: the host looks, a guest claims */
(document.querySelector('.screen')||document.body).appendChild(R);document.body.classList.add('ipv-open');
buildEnv(I);renderGuests(I);wireForm(I);fitLine(q('.ip-h1'));addActs();
const env=q('.ip-env');
env.addEventListener('pointerdown',e=>{if(st!=='sealed')return;drag=true;x0=e.clientX;y0=e.clientY;dir=0;try{env.setPointerCapture(e.pointerId);}catch(_){}});
env.addEventListener('pointermove',e=>{if(!drag||st!=='sealed')return;const dx=e.clientX-x0,dy=e.clientY-y0;
if(!dir){if(Math.abs(dx)<6)return;if(Math.abs(dy)>Math.abs(dx)*1.4){drag=false;return;}dir=dx>0?1:-1;env.classList.add('tearing');}
p=Math.max(0,Math.min(1,(dx*dir)/(W*.62)));draw();if(p>=1){drag=false;openEnv();}});
const up=()=>{if(!drag)return;drag=false;if(st!=='sealed')return;if(p>.45)openEnv();else springBack();};
env.addEventListener('pointerup',up);env.addEventListener('pointercancel',up);
env.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();autoTear();}});
let tapT=0;env.addEventListener('click',()=>{if(st!=='sealed'||dir)return;const n=Date.now();if(n-tapT<600)autoTear();tapT=n;});
q('.ip-x').addEventListener('click',close);q('.ip-close2').addEventListener('click',()=>{if(window.ipGuestNext)ipGuestNext();else close();});
addEventListener('message',onVenueMsg);addEventListener('keydown',onKey);
requestAnimationFrame(()=>R&&R.classList.add('on'));
q('.ip-env').classList.add('armed');
armT=setTimeout(()=>{if(R&&st==='sealed'&&!dir&&!ipFrame)mountVenue();},350);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(R){fitLine(q('.ip-h1'));if(st==='sealed'&&!dir)buildEnv(I);}});
};
const btn=document.getElementById('ipvBtn');if(btn)btn.addEventListener('click',()=>window.openInvitePreview());
})();
