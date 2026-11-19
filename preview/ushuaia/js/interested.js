/* ================= interested wall ================= */
const INT_SEED=['noor.dxb','layla.k','rami_h','yasmin.alv','zayd.m','mayasaid','kareem.og','tala.r','omarfx','dana.mk','sami.jr','hind_q','faris.w','lina.n','adam.dxb','reem.s','jad.b','sara.h'];
const myInt={};const AVC=['#FF1414','#ffffff','#F4B43A','#ff6a60','#d9d9de'];
function nightKey(){return S.date||'any';}
function renderInterested(){
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
  const v=$('#intIn').value.trim().replace(/^@/,'');
  if(!v){$('#intErr').textContent='Add your Instagram handle. Interest is always under a real name.';$('#intIn').focus();return;}
  if(!/^[a-z0-9._]{2,30}$/i.test(v)){$('#intErr').textContent='Handles use letters, numbers, dots and underscores.';$('#intIn').focus();return;}
  $('#intErr').textContent='';myInt[nightKey()]=v.toLowerCase();$('#intIn').value='';renderInterested();toast(`@${v} is on the list`);});
$('#intIn').addEventListener('input',()=>{$('#intErr').textContent='';});
