/* ---- the nights of the season, always in view under the event card; tap one to switch ---- */
function heroCd(ev){try{const t=new Date();t.setHours(12,0,0,0);const n=Math.round((dOf(ev.k)-t)/864e5);return n===0?' · Tonight':n===1?' · Tomorrow':(n>1&&n<=60)?' · In '+n+' days':'';}catch(_){return '';}}
function railBuild(){const r=document.getElementById('evRail');if(!r)return;r.innerHTML='';
  const hd=document.getElementById('evRailN');if(hd)hd.textContent=EVENTS.length+' nights this season';
  EVENTS.forEach((ev,i)=>{const d=dOf(ev.k),b=document.createElement('button');b.type='button';b.className='evc';b.setAttribute('role','tab');b.dataset.k=ev.k;b.style.setProperty('--ea',ev.acc);
    const art=ev.screen==='bc'?'<img src="'+BC_IMG+'" alt="">':heroSVG(ev).replace(/id="hg/g,'id="rl'+i+'hg').replace(/url\(#hg/g,'url(#rl'+i+'hg');
    b.innerHTML=`<span class="evc-art">${art}</span><span class="evc-veil"></span><span class="evc-d"><small>${DOWS[d.getDay()].toUpperCase()}</small><b>${d.getDate()}</b><i>${MONS[d.getMonth()].toUpperCase()}</i></span><span class="evc-on" aria-hidden="true"></span><span class="evc-n">${esc(ev.short)}</span><span class="evc-t">${esc(ev.tag)}</span>`;
    b.setAttribute('aria-label',ev.head+', '+fmtLong(ev.k)+', doors '+ev.doors);
    b.addEventListener('click',()=>{if(!S.ev||S.ev.k!==ev.k)pickEvent(ev);railToVenue();});
    r.appendChild(b);});
  railPaint(true);}
/* tapping a night takes you down to the venue, set to that night */
function railToVenue(){const app=$('#app'),rc=$('#roomCanvas');if(!app||!rc)return;setTimeout(()=>{try{app.scrollTo({top:Math.max(0,rc.offsetTop-150),behavior:'smooth'});}catch(_){app.scrollTop=rc.offsetTop-150;}},180);}
function railPaint(jump){const r=document.getElementById('evRail');if(!r||!S.ev)return;let on=null;
  r.querySelectorAll('.evc').forEach(b=>{const s=b.dataset.k===S.ev.k;b.classList.toggle('sel',s);b.setAttribute('aria-selected',s?'true':'false');if(s)on=b;});
  if(on&&r.clientWidth){const x=on.offsetLeft-r.offsetLeft-(r.clientWidth-on.offsetWidth)/2;try{r.scrollTo({left:Math.max(0,x),behavior:jump?'auto':'smooth'});}catch(_){r.scrollLeft=Math.max(0,x);}}}
try{railBuild();}catch(_){}
try{renderHero();}catch(_){}   /* the card was drawn before this script loaded: draw it again with the countdown */
