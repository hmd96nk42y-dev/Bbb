/* ================= pickers ================= */
function buildEvents(){
  const row=$('#dateRow');row.innerHTML='';
  EVENTS.forEach(ev=>{const d=dOf(ev.k),c=ce('button','dcard');c.type='button';c.dataset.k=ev.k;c.style.setProperty('--ea',ev.acc);
    c.innerHTML=`<span class="dow">${DOWS[d.getDay()]}</span><span class="dom">${d.getDate()}</span><span class="mon">${MONS[d.getMonth()].toUpperCase()}</span><span class="nm">${esc(ev.short)}</span>`;
    c.addEventListener('click',()=>{pickEvent(ev);advancePicker();});
    if(S.ev&&S.ev.k===ev.k)c.classList.add('sel');row.appendChild(c);});
}
function pickEvent(ev){
  applyEvent(ev);$$('.dcard').forEach(x=>x.classList.toggle('sel',x.dataset.k===ev.k));setLbl('#pkDate',ev.short);
  if(S.boothId)toast('Your table stays with '+(EVK[S.date]?EVK[S.date].short:'this night')+'.');
  afterPick();
}
function slotsFor(ev){const [h,m]=ev.doors.split(':').map(Number),out=[];for(let i=0;i<8;i++){const mm=h*60+m+i*30;out.push(String(Math.floor(mm/60)%24).padStart(2,'0')+':'+String(mm%60).padStart(2,'0'));}return out;}
function buildTimes(){
  const row=$('#timeRow');row.innerHTML='';
  slotsFor(S.ev).forEach(t=>{const p=ce('button','tpill',t);p.type='button';
    p.addEventListener('click',()=>{S.time=t;$$('.tpill').forEach(x=>x.classList.remove('sel'));p.classList.add('sel');setLbl('#pkTime',t);afterPick();advancePicker();});
    if(S.time===t)p.classList.add('sel');row.appendChild(p);});
  const h=$('#pnTime .pkhint');if(h)h.textContent=`Doors at ${S.ev.doors}. Arrive before 22:00 for early entry.`;
}
function buildParty(){
  const row=$('#partyRow');row.innerHTML='';
  for(let n=2;n<=16;n++){const p=ce('button','ppill',n);p.type='button';
    p.addEventListener('click',()=>{S.party=n;$$('.ppill').forEach(x=>x.classList.remove('sel'));p.classList.add('sel');setLbl('#pkParty',String(n));afterPick();advancePicker();});
    row.appendChild(p);}
}
function setLbl(sel,v){const l=$(sel+' .lbl');l.textContent=v;l.classList.remove('empty');}
function afterPick(){
  if(ready()&&!S._wasReady){S._wasReady=true;S.view=null;}
  if(S.pick&&!tableOpen(T(S.pick)))S.pick=null;
  renderRoom();renderInterested();
}
function openPicker(k){if(S.openPicker===k){closePicker();return}closePicker();S.openPicker=k;const K=k[0].toUpperCase()+k.slice(1);$(`#pk${K}`).classList.add('on');$(`#pn${K}`).classList.add('open');}
function closePicker(){$$('.pkr').forEach(p=>p.classList.remove('on'));$$('.pkpanel').forEach(p=>p.classList.remove('open'));S.openPicker=null;}

$$('.pkr').forEach(p=>p.addEventListener('click',()=>openPicker(p.dataset.key)));
document.addEventListener('click',e=>{if(S.openPicker&&!e.target.closest('.pkr')&&!e.target.closest('.pkpanel'))closePicker()});
function advancePicker(){
  setTimeout(()=>{
    closePicker();finishFlow();
  },150);
}
function finishFlow(){
  const f=S.flow;S.flow=null;
  if(f==='tickets'){setTimeout(openTix,260);return;}
  if(S.tixMode){S.tixMode=false;syncDoll();}
  const app=$('#app'),rc=$('#roomCanvas');
  setTimeout(()=>{app.scrollTo({top:rc.offsetTop-150,behavior:'smooth'});
    if(f==='table'&&S.pick&&tableOpen(T(S.pick)))setTimeout(()=>openTableSheet(S.pick),450);},200);
}
function promptWhen(msg){
  const app=$('#app'),pk=$('#pickSec');
  app.scrollTo({top:Math.max(0,pk.getBoundingClientRect().top+app.scrollTop-app.getBoundingClientRect().top-120),behavior:'smooth'});
  const bd=$('#budget');if(bd)setTimeout(()=>app.scrollTo({top:bd.getBoundingClientRect().top+app.scrollTop-app.getBoundingClientRect().top-90,behavior:'smooth'}),60);
  if(window.budOpen)budOpen('g');
  toast(msg||'Choose your guests in Find your table');
}
