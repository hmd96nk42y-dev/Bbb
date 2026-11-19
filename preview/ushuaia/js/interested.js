/* ================= interested wall ================= */
const INT_SEED=['noor.dxb','layla.k','rami_h','yasmin.alv','zayd.m','mayasaid','kareem.og','tala.r','omarfx','dana.mk','sami.jr','hind_q','faris.w','lina.n','adam.dxb','reem.s','jad.b','sara.h'];
const myInt={};const AVC=['#FF1414','#ffffff','#F4B43A','#ff6a60','#d9d9de'];
function nightKey(){return S.date||'any';}
function renderInterested(){
  if(LIVE){renderInterestedLive();return;}   /* live: the real list (below) */
  $('#interested').hidden=!S.date;if(!S.date)return;
  const k=nightKey(),seed=h32(k),n=120+seed%380,mine=myInt[k];
  const shown=INT_SEED.slice().sort((a,b)=>(h32(a+k)%100)-(h32(b+k)%100)).slice(0,9);
  const w=$('#intWall');w.innerHTML='';
  const inv=!!S.boothId;
  const chip=(h,me)=>`<span class="ih${me?' me':''}${inv&&!me?' can':''}"><i style="background:${AVC[h32(h)%AVC.length]}">${esc(h[0].toUpperCase())}</i>@${esc(h)}${inv&&!me?`<button class="ihv${invited.has(h)?' done':''}" data-h="${esc(h)}" type="button">${invited.has(h)?'Invited':'Invite'}</button>`:''}</span>`;
  let html=mine?chip(mine,1):'';html+=shown.map(h=>chip(h)).join('');html+=`<span class="ih more">and ${n-shown.length} more</span>`;w.innerHTML=html;
  $('#intCount').textContent=`${n+(mine?1:0)} interested${S.date?' for '+fmtD(dOf(S.date)):''}`;
  $('#intSub').textContent=mine?`You're on the list${S.date?' for '+fmtD(dOf(S.date)):''}. Hold a table to bring people with you.`:'Going to this one? Add your Instagram: you\u2019re on the list everyone can see, and hosts can invite you to their tables.';
  $('#intForm').style.display=mine?'none':'';
  if(inv)$('#intSub').textContent=`You hold ${BNAMES[S.boothId]}. Invite anyone on the list to your table.`;
  $$('.ihv',w).forEach(b=>b.addEventListener('click',()=>{const h=b.dataset.h;if(invited.has(h))return;invited.add(h);b.textContent='Invited';b.classList.add('done');toast(`Invite sent to @${h}`);}));
}
const invited=new Set();
$('#intForm').addEventListener('submit',e=>{e.preventDefault();
  if(LIVE){intAddLive();return;}
  const v=$('#intIn').value.trim().replace(/^@/,'');
  if(!v){$('#intErr').textContent='Add your Instagram handle. Interest is always under a real name.';$('#intIn').focus();return;}
  if(!/^[a-z0-9._]{2,30}$/i.test(v)){$('#intErr').textContent='Handles use letters, numbers, dots and underscores.';$('#intIn').focus();return;}
  $('#intErr').textContent='';myInt[nightKey()]=v.toLowerCase();$('#intIn').value='';renderInterested();toast(`@${v} is on the list`);});
$('#intIn').addEventListener('input',()=>{$('#intErr').textContent='';});

/* ---- live: the Interested wall, kept by BUBL's back end ----
   The list is the handles guests put there themselves and starts empty; the count is how many there are. Adding
   yourself needs a sign-in, so a handle always belongs to a guest BUBL knows. The build's "Invite" buttons are not
   drawn: nothing can carry an invite to a handle yet. */
const INT={k:null,wall:null};
async function intLoad(){const ev=S.ev;if(!ev)return;const r=await BUBL.call('guest','interested',{venue:BUBL.venueSlug,service:ev.id});if(S.ev!==ev)return;INT.k=ev.id;INT.wall=r.ok?r:null;renderInterestedLive();}
function renderInterestedLive(){
  const box=$('#interested'),ev=S.ev;box.hidden=!S.date||!ev||!PAGE.modules.includes('interested');if(box.hidden)return;
  if(INT.k!==ev.id){INT.k=ev.id;INT.wall=null;intLoad();}
  const wv=INT.wall,on=fmtD(dOf(S.date)),w=$('#intWall');
  if(!wv){w.innerHTML='';$('#intCount').textContent='';return;}
  const chip=(h,me)=>`<span class="ih${me?' me':''}"><i style="background:${AVC[h32(h)%AVC.length]}">${esc(h[0].toUpperCase())}</i>@${esc(h)}</span>`;
  const others=wv.handles.filter(h=>h!==wv.mine),more=wv.count-others.length-(wv.mine?1:0);
  w.innerHTML=(wv.mine?chip(wv.mine,1):'')+others.map(h=>chip(h)).join('')+(more>0?`<span class="ih more">and ${more} more</span>`:'');
  $('#intCount').textContent=`${wv.count} interested for ${on}`;
  $('#intSub').textContent=wv.mine?`You're on the list for ${on}. Hold a table to bring people with you.`:'Going to this one? Add your Instagram and you’re on the list everyone can see.';
  $('#intForm').style.display=wv.mine?'none':'';
}
async function intAddLive(){
  const v=$('#intIn').value.trim().replace(/^@/,''),ev=S.ev;
  if(!v){$('#intErr').textContent='Add your Instagram handle. Interest is always under a real name.';$('#intIn').focus();return;}
  if(!/^[a-z0-9._]{2,30}$/i.test(v)){$('#intErr').textContent='Handles use letters, numbers, dots and underscores.';$('#intIn').focus();return;}
  $('#intErr').textContent='';
  const r=await BUBL.call('guest','interest',{venue:BUBL.venueSlug,service:ev.id,handle:v});
  if(!r.ok){
    /* not signed in yet: the bubl log-in, then straight back here */
    if((r.code==='sign_in_needed'||r.code==='sign_up_needed')&&typeof window.bublLogin==='function'){window.bublLogin(()=>{try{closeSheet();}catch(_){}intAddLive();});return;}
    $('#intErr').textContent=r.reason;return;}
  $('#intIn').value='';INT.k=ev.id;INT.wall=r;renderInterestedLive();toast(`@${r.mine} is on the list`);
}
