(function(){
const ME={name:'Sam K',phone:'+971 50 123 4417',since:'November 2024',tier:'Backstage List',pct:2,visits:9,guests:71,night:'Headline nights',
exclusives:TABLES.filter(t=>t.req).map(t=>({id:t.id,name:t.name})),
remembered:['Don Julio 1942, no salt','Backstage, stage left when it\'s free','No photos at the table','Birthday on 14 March'],
circle:['Omar','Layla','Rami','Nadia'],
perks:['Backstage rings B and C, closest to the booth, open to you','Straight past the door line, your whole table','Your table held 30 minutes if you\'re running late','The team confirms your table and minimum with you directly'],
last:'Black Coffee, Saturday 27 December, Backstage A, with Omar, Layla and Rami'};
window.lcME=ME;window.lcEXCL=ME.exclusives.map(e=>e.id);
const t12=t=>{const[h,m]=t.split(':').map(Number);return((h%12)||12)+(m?':'+String(m).padStart(2,'0'):'')+(h<12?' am':' pm');};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scr=()=>document.querySelector('.screen')||document.body;
const tick='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2" fill="none" stroke="#F4B43A" stroke-width="1"/><path d="M4.8 8.2l2.1 2.1 4.3-4.6" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
window.__shine=function(f){shineChange(f);};
function shineChange(apply){
const sc=scr(),app=document.getElementById('app');
if(!app||matchMedia('(prefers-reduced-motion: reduce)').matches){apply();return;}
const sr=sc.getBoundingClientRect(),ar=app.getBoundingClientRect(),W=sr.width,H=sr.height;
const g=app.cloneNode(true);
g.querySelectorAll('iframe').forEach(f=>{const d=document.createElement('div');d.className=f.className;d.style.cssText=f.style.cssText;f.replaceWith(d);});
const cs=getComputedStyle(sc);
Object.assign(g.style,{position:'absolute',left:(ar.left-sr.left)+'px',top:(ar.top-sr.top)+'px',width:ar.width+'px',height:ar.height+'px',inset:'auto',
zIndex:284,pointerEvents:'none',overflow:'hidden',scrollBehavior:'auto',backgroundColor:cs.backgroundColor,backgroundImage:cs.backgroundImage,backgroundSize:cs.backgroundSize});
g.setAttribute('aria-hidden','true');sc.appendChild(g);g.scrollTop=app.scrollTop;
const anchor=document.querySelector('.signin'),y0=anchor?anchor.getBoundingClientRect().top:0;
apply();
const blk=document.getElementById('vipBlock');
if(blk){const sb=app.style.scrollBehavior;app.style.scrollBehavior='auto';app.scrollTop+=blk.getBoundingClientRect().top-y0;app.style.scrollBehavior=sb;}
const band=document.createElement('div');band.className='vshine';band.innerHTML='<i></i><b></b>';sc.appendChild(band);
const bi=band.querySelector('i'),bw=band.querySelector('b'),BW=W*.75,T=Math.tan(16*Math.PI/180),D=1250,t0=performance.now();
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const gx=ar.left-sr.left,gy=ar.top-sr.top;
(function f(now){
const k=Math.min(1,(now-t0)/D),e=ease(k);
const pos=W-(W+BW+T*H)*e;
const edge=pos+BW/2;
bi.style.transform=`translateX(${pos.toFixed(1)}px) skewX(-16deg)`;
bw.style.opacity=(Math.sin(Math.PI*k)*.5).toFixed(3);
const top=edge+T*H/2-gx,bot=edge-T*H/2-gx;
g.style.clipPath=`polygon(0 0,${Math.max(0,top).toFixed(1)}px 0,${Math.max(0,bot).toFixed(1)}px ${H}px,0 ${H}px)`;
if(top<=0&&bot<=0)g.style.visibility='hidden';
if(k<1)requestAnimationFrame(f);else{g.remove();band.remove();}
})(t0);
}
function openSheet(){
if(LIVE){openSheetLive();return;}   /* live: a real sign-in and the guest's real history (below) */
if(document.querySelector('.vp-sheet'))return;
const sc=document.createElement('div');sc.className='vp-scrim';
const sh=document.createElement('div');sh.className='vp-sheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Access your experience');
sh.innerHTML=`<div class="vp-grip"></div><h3>Access your experience</h3><p class="vp-sub">Welcome back to Ushuaïa.</p>
<label class="vp-f"><small>Name<em>Saved on this device</em></small><input class="vp-in" id="vpName" autocomplete="name" value="${esc(ME.name)}"></label>
<label class="vp-f"><small>Mobile number<em>Saved on this device</em></small><input class="vp-in" id="vpTel" type="tel" autocomplete="tel" value="${esc(ME.phone)}"></label>
<button class="vp-go" id="vpGo" type="button">Continue</button>
<button class="vp-not" id="vpNot" type="button">Not ${esc(ME.name)}?</button>`;
scr().appendChild(sc);scr().appendChild(sh);
requestAnimationFrame(()=>{sc.classList.add('on');sh.classList.add('on');});
const shut=()=>{sc.classList.remove('on');sh.classList.remove('on');setTimeout(()=>{sc.remove();sh.remove();},500);};
sc.addEventListener('click',shut);
sh.querySelector('#vpNot').addEventListener('click',()=>{sh.querySelector('#vpName').value='';sh.querySelector('#vpTel').value='';sh.querySelector('#vpName').focus();});
sh.querySelector('#vpGo').addEventListener('click',()=>{
const n=sh.querySelector('#vpName').value.trim(),t=sh.querySelector('#vpTel').value.trim();
if(n.length<2||t.replace(/\D/g,'').length<7){sh.querySelector(n.length<2?'#vpName':'#vpTel').focus();return;}
const b=sh.querySelector('#vpGo');b.disabled=true;b.textContent='Opening your experience';
setTimeout(()=>{S.vip=true;S.guestName=n;S.guestPhone=t;shut();setTimeout(()=>shineChange(becomeVip),380);},650);
});
}
function becomeVip(){
const sg=document.querySelector('.signin');if(sg)sg.hidden=true;
const b=document.getElementById('vipBlock');if(!b)return;
const first=(S.guestName||ME.name).trim();
b.innerHTML=`<p class="vp-hello">Welcome back,</p><h2 class="vp-name">${esc(first)}</h2>
<div class="vp-card"><small>Your standing</small><p class="vp-tier">${esc(ME.tier)}</p>
<div class="vp-pct"><b>Top ${ME.pct}%</b><span>of every guest who has booked at Ushuaïa</span></div>
<div class="vp-bar"><i></i></div>
<div class="vp-cardf"><span>Member since ${esc(ME.since)}</span><span>${esc(first.split(' ').map(w=>w[0]).join('').toUpperCase())} · 0412</span></div></div>
<div class="vp-stats"><div><b>${ME.visits}</b><span>visits</span></div><div><b>${ME.guests}</b><span>guests hosted</span></div><div><b>${esc(ME.night)}</b><span>your night</span></div></div>
<h3 class="vp-h">Remembered for you</h3><div class="vp-chips">${ME.remembered.map(r=>`<span>${esc(r)}</span>`).join('')}</div>
<h3 class="vp-h">Your circle</h3><div class="vp-circle"><div class="vp-dots">${ME.circle.map(n=>`<i title="${esc(n)}">${esc(n[0])}</i>`).join('')}</div>
<p>${ME.circle.slice(0,-1).join(', ')} and ${ME.circle[ME.circle.length-1]} join you most often. Last time: ${esc(ME.last.replace(/, with .*$/,''))}.</p></div>
<h3 class="vp-h">Held for you</h3><p class="vp-excl">Backstage rings B and C, closest to the DJ booth, are held for the Backstage List. They\'re open to you now and lit gold in the room below. Pick your table and the team confirms it with you.</p>`;
b.hidden=false;b.classList.add('on','now');
const pk=document.getElementById('pickSec'),rc=document.getElementById('roomCanvas');
if(pk&&rc&&rc.parentNode){pk.classList.add('pk-above');rc.parentNode.insertBefore(pk,rc);}
glowExcl();try{renderRoom();}catch(_){}
setTimeout(()=>{try{dollPost({cmd:'focus',zone:'bsC'});}catch(_){}},900);
}
function glowExcl(){dollPost({cmd:'excl',ids:ME.exclusives.map(x=>x.id),vip:!!S.vip});}
window.lcGlowExcl=glowExcl;
window.lcShowPrivileges=function(){
if(!S.vip)return;const p=document.getElementById('vPriv');if(!p||!p.hidden)return;
p.innerHTML=`<h3 class="vp-h">Your privileges</h3><p class="vprv-sub">Applied to this booking, ${esc((S.guestName||ME.name).split(' ')[0])}.</p><ul class="vp-perks">${ME.perks.map(x=>`<li>${tick}<span>${esc(x)}</span></li>`).join('')}</ul>`;
p.hidden=false;requestAnimationFrame(()=>p.classList.add('on'));
};
/* ---- live: "Access your experience", for real ----
   The mobile number is the sign-in: a code is sent and typed into the six boxes. A guest BUBL knows gets "Welcome
   back" with what BUBL has really recorded of them here (nights they were at, guests they hosted, since when), and
   their table or ticket is back on the page. What the build's panel shows that nothing real feeds yet is not drawn:
   the standing card and "Top 2%", "Remembered for you", "Your circle", and the Backstage List's "Held for you". */
function openSheetLive(){
if(document.querySelector('.vp-sheet'))return;
const sc=document.createElement('div');sc.className='vp-scrim';
const sh=document.createElement('div');sh.className='vp-sheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Access your experience');
const known=S.guestName||'',tel=S.guestPhone?BUBL.phone.pretty(S.guestPhone):'';
sh.innerHTML=`<div class="vp-grip"></div><h3>Access your experience</h3><p class="vp-sub">Welcome back to Ushuaïa.</p>
<label class="vp-f"><small>Name${known?'<em>Saved on this device</em>':''}</small><input class="vp-in" id="vpName" autocomplete="name" value="${esc(known)}"></label>
<label class="vp-f"><small>Mobile number${tel?'<em>Saved on this device</em>':''}</small><input class="vp-in" id="vpTel" type="tel" autocomplete="tel" value="${esc(tel)}"></label>
<div class="ip-step" id="vpCode" style="display:none;margin-top:14px"></div>
<button class="vp-go" id="vpGo" type="button">Continue</button>
${known?`<button class="vp-not" id="vpNot" type="button">Not ${esc(known)}?</button>`:''}`;
scr().appendChild(sc);scr().appendChild(sh);
requestAnimationFrame(()=>{sc.classList.add('on');sh.classList.add('on');});
let step=null;
const shut=()=>{if(step)step.stop();sc.classList.remove('on');sh.classList.remove('on');setTimeout(()=>{sc.remove();sh.remove();},500);};
sc.addEventListener('click',shut);
const b=sh.querySelector('#vpGo'),box=sh.querySelector('#vpCode'),fields=on=>sh.querySelectorAll('.vp-f').forEach(f=>{f.style.display=on?'':'none';});
const not=sh.querySelector('#vpNot');if(not)not.addEventListener('click',async()=>{await BUBL.auth.signOut();S.guestName='';S.guestPhone='';S.guestEmail='';sh.querySelector('#vpName').value='';sh.querySelector('#vpTel').value='';not.remove();sh.querySelector('#vpTel').focus();});
const done=async()=>{b.disabled=true;b.textContent='Opening your experience';const me=await BUBL.me();
  if(!me.ok||!me.guest){shut();toast('No table or ticket under this number yet. Once you have one, it will be here.');return;}
  S.guestName=me.guest.full_name;S.guestPhone=me.guest.phone_e164;S.guestEmail=me.guest.email;shut();
  setTimeout(()=>shineChange(()=>welcome(me)),380);if(typeof restoreMine==='function')restoreMine();};
b.addEventListener('click',async()=>{if(b.dataset.mode==='verify'||b.disabled)return;
  const ph=BUBL.phone.parse(sh.querySelector('#vpTel').value,'+971');if(!ph.ok){toast(ph.reason);sh.querySelector('#vpTel').focus();return;}
  if(await BUBL.auth.phone()===ph.e164)return done();
  b.disabled=true;const sent=await BUBL.auth.sendCode(ph.e164);b.disabled=false;if(!sent.ok){toast(sent.reason);return;}
  fields(false);box.style.display='';b.dataset.mode='verify';
  step=codeStep(box,{phone:ph.e164,verifyBtn:b,onVerified:()=>{step=null;done();},onChangeNumber:()=>{step=null;delete b.dataset.mode;box.style.display='none';box.innerHTML='';fields(true);b.disabled=false;}});});
}
function welcome(me){
const sg=document.querySelector('.signin');if(sg)sg.hidden=true;
const blk=document.getElementById('vipBlock');if(!blk||!me||!me.guest)return;
const h=me.history||{},since=h.since?new Date(h.since+'-01T12:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}):'';
blk.innerHTML=`<p class="vp-hello">Welcome back,</p><h2 class="vp-name">${esc(me.guest.full_name)}</h2>
<div class="vp-stats"><div><b>${h.visits||0}</b><span>visits</span></div><div><b>${h.guests_hosted||0}</b><span>guests hosted</span></div><div><b>${esc(since)}</b><span>member since</span></div></div>`;
blk.hidden=false;blk.classList.add('on','now');
}
window.lcWelcome=welcome;
function paintSignin(){
const p=document.querySelector('.signin');if(!p)return;
p.innerHTML=`Returning guest? <span class="lk" id="signinLk">Access your experience</span>`;
p.querySelector('#signinLk').addEventListener('click',openSheet);
}
paintSignin();
})();
