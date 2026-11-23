/* ---- event hero art: one per night, drawn from that night's palette ---- */
function _r(seed){let s=seed>>>0;return()=>{s=Math.imul(s^(s>>>15),2246822507)^Math.imul(s^(s>>>13),3266489909);s^=s>>>16;return(s>>>0)/4294967296;};}
const HERO={
  arcs(p){let s=`<defs><radialGradient id="hg1" cx="50%" cy="100%" r="85%"><stop offset="0" stop-color="${p[0]}" stop-opacity=".62"/><stop offset="1" stop-color="${p[0]}" stop-opacity="0"/></radialGradient></defs><rect width="360" height="186" fill="#050506"/><rect width="360" height="186" fill="url(#hg1)"/>`;
    for(let i=0;i<10;i++){const r=34+i*21;s+=`<path d="M${180-r} 186A${r} ${r} 0 0 1 ${180+r} 186" fill="none" stroke="${i%2?p[1]:p[0]}" stroke-width="${i%3?1.3:2.6}" opacity="${(.9-i*.07).toFixed(2)}"/>`;}
    return s+`<circle cx="180" cy="186" r="24" fill="${p[2]}" opacity=".95"/>`;},
  sunset(p){const R=_r(7);let s=`<defs><linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0710"/><stop offset=".55" stop-color="${p[2]}" stop-opacity=".85"/><stop offset=".82" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="360" height="186" fill="url(#hg2)"/><circle cx="238" cy="132" r="46" fill="${p[1]}" opacity=".95"/>`;
    let x=-6;while(x<366){const w=10+R()*20,h=26+R()*(x>120&&x<270?70:44);s+=`<rect x="${x.toFixed(1)}" y="${(186-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#12060a"/>`;x+=w+1+R()*3;}
    s+=`<path d="M176 186V70l3-16 3 16v116z" fill="#12060a"/>`;return s;},
  x(p){let s=`<rect width="360" height="186" fill="#03060a"/><defs><radialGradient id="hg3" cx="50%" cy="75%" r="70%"><stop offset="0" stop-color="${p[2]}" stop-opacity=".5"/><stop offset="1" stop-color="${p[2]}" stop-opacity="0"/></radialGradient></defs><rect width="360" height="186" fill="url(#hg3)"/>`;
    for(let i=0;i<8;i++){const r=40+i*26;s+=`<path d="M${180-r} 186A${r} ${r} 0 0 1 ${180+r} 186" fill="none" stroke="${p[0]}" stroke-width="1" opacity="${(.5-i*.05).toFixed(2)}"/>`;}
    s+=`<g stroke-linecap="round"><path d="M126 22L234 164M234 22L126 164" stroke="#fff" stroke-width="15" opacity=".96"/><path d="M126 22L234 164M234 22L126 164" stroke="${p[0]}" stroke-width="4.5"/></g>`;
    return s+`<rect x="0" y="176" width="360" height="10" fill="${p[0]}" opacity=".35"/>`;},
  angular(p){let s=`<rect width="360" height="186" fill="#060505"/><defs><linearGradient id="hg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${p[1]}" stop-opacity="0"/></linearGradient></defs><rect width="360" height="186" fill="url(#hg4)"/>`;
    for(let i=0;i<9;i++){const y=26+i*13;s+=`<path d="M-20 186L180 ${y}L380 186" fill="none" stroke="${i%3===0?p[2]:p[0]}" stroke-width="${i%3===0?2:1.2}" opacity="${(.92-i*.08).toFixed(2)}"/>`;}
    s+=`<path d="M150 186L180 92L210 186z" fill="#060505" stroke="${p[0]}" stroke-width="1.6"/>`;
    return s+`<circle cx="180" cy="72" r="15" fill="none" stroke="${p[2]}" stroke-width="2"/>`;},
  waves(p){let s=`<defs><linearGradient id="hg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b1c"/><stop offset=".7" stop-color="#151f45"/><stop offset="1" stop-color="${p[1]}" stop-opacity=".45"/></linearGradient></defs><rect width="360" height="186" fill="url(#hg5)"/><circle cx="270" cy="58" r="26" fill="${p[2]}" opacity=".9"/>`;
    for(let k=0;k<9;k++){let d='M0 '+(100+k*10);for(let x=0;x<=360;x+=12)d+=`L${x} ${(100+k*10+Math.sin(x*.032+k*.8)*(8+k*.7)).toFixed(1)}`;d+='L360 186L0 186Z';s+=`<path d="${d}" fill="${k%2?p[0]:p[1]}" opacity="${(.12+k*.045).toFixed(2)}"/>`;}
    return s;},
  neworld(p){const R=_r(31);let s=`<rect width="360" height="186" fill="#07020a"/><defs><radialGradient id="hg6"><stop offset="0" stop-color="${p[0]}" stop-opacity=".85"/><stop offset="1" stop-color="${p[1]}" stop-opacity="0"/></radialGradient></defs>`;
    for(let i=0;i<7;i++){const cx=30+R()*300,cy=20+R()*120,r=30+R()*60;s+=`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${[p[0],p[1],p[2]][i%3]}" opacity="${(.14+R()*.16).toFixed(2)}"/>`;}
    for(let r=1;r<8;r++)s+=`<ellipse cx="180" cy="92" rx="${r*26}" ry="${r*11}" fill="none" stroke="${p[r%3]}" stroke-width="1.1" opacity="${(.7-r*.07).toFixed(2)}"/>`;
    for(let i=0;i<34;i++)s+=`<circle cx="${(R()*360).toFixed(0)}" cy="${(R()*186).toFixed(0)}" r="${(.7+R()*1.5).toFixed(1)}" fill="#fff" opacity="${(.4+R()*.6).toFixed(2)}"/>`;
    return s;}
};
const BC_IMG='media/black-coffee.jpg',BC_MASK='media/black-coffee-mask.png';
function heroSVG(ev){return `<svg viewBox="0 0 360 186" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${HERO[ev.art](ev.pal)}</svg>`;}
function fmtLong(k){const d=dOf(k);return `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]} ${d.getDate()} ${['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]}`;}
function renderHero(){
  const ev=S.ev,h=$('#evHero');if(!ev||!h)return;
  const d=dOf(ev.k);
  h.classList.remove('swap');void h.offsetWidth;
  const photo=ev.screen==='bc';h.classList.toggle('photo',photo);
  h.innerHTML=`${photo?'<div class="eh-art eh-ph"><img src="'+BC_IMG+'" alt=""><i class="eh-sh" style="-webkit-mask-image:url('+BC_MASK+');mask-image:url('+BC_MASK+')"></i></div>':'<div class="eh-art">'+heroSVG(ev)+'</div>'}<div class="eh-veil"></div><div class="eh-in"><span class="eh-k">${DOWS[d.getDay()]} ${d.getDate()} ${MONS[d.getMonth()]} \u00b7 Doors ${ev.doors}${typeof heroCd==='function'?heroCd(ev):''}</span><h2 class="eh-t">${esc(ev.head)}</h2><p class="eh-s">${esc(ev.tag)}</p>${ev.lineup.length>1?`<p class="eh-l">${esc(ev.lineup.map(x=>x[0]).join(' \u00b7 '))}</p>`:''}</div>`;
  h.classList.add('swap');if(typeof hitsHero==='function')hitsHero(h,ev);if(typeof railPaint==='function')railPaint();if(typeof socialEvent==='function')socialEvent(ev);
  $('#hdrNight').innerHTML=`<b>${DOWS[d.getDay()]} ${d.getDate()} ${MONS[d.getMonth()]}</b>, doors ${ev.doors}`;
  $('.mast-line').textContent=`Season 3, open air on the harbour`;
}
function evTheme(ev){const n=h=>parseInt(h.slice(1),16);return {pal:ev.pal.map(n),acc:ev.acc,screen:ev.screen,title:ev.head.replace('Argy presents ','').toUpperCase(),sub:ev.tag.toUpperCase()};}
function arriveBy(ev){const [h,m]=ev.doors.split(':').map(Number),mm=h*60+m+(LIVE?(PAGE.rules.arrive_by_minutes_after_doors||0):120);return String(Math.floor(mm/60)%24).padStart(2,'0')+':'+String(mm%60).padStart(2,'0');}
function applyEvent(ev){
  watchNight(ev);
  if(typeof hitStop==='function'&&S.ev!==ev)hitStop();S.ev=ev;S.date=ev.k;S.time=arriveBy(ev);
  const r=document.documentElement.style;r.setProperty('--acc',ev.acc);r.setProperty('--acc-rgb',ev.rgb);r.setProperty('--a2',ev.pal[1]);r.setProperty('--a3',ev.pal[2]);r.setProperty('--on',ev.on||'#000');
  if(S.time&&!slotsFor(ev).includes(S.time)){S.time=null;const l=$('#pkTime .lbl');if(l){l.textContent='Choose';l.classList.add('empty');}}
  buildTimes();renderHero();
  const ts=$('#tixSub');if(ts&&!LIVE)ts.textContent=`From ${AED(ev.from)}. 21+, original Emirates ID or passport at the door.`;
  if(LIVE&&typeof tixNight==='function')tixNight();   /* live: this night's own tickets, and the guest's ticket for it if they have one */
  const me=document.querySelector('meta[name=theme-color]');if(me)me.setAttribute('content','#000000');
}
