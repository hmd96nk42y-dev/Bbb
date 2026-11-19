/* ================= table votes · the table agrees what to pre-order and which tracks go to the DJ ================= */
const VT_MULT={bsA:5,bsB:5,bsC:5,vip:4,plat:3,gold:2,silver:1};
const VT_PRE=['Moët Impérial','Grey Goose','Don Julio 1942','Dom Pérignon 2013'];
const VT_SONGS={bc:['Drive · Black Coffee','We Dance Again · Black Coffee'],mo:['Feel · Mahmut Orhan'],artbat:['Return to Oz · ARTBAT remix']};
const VT={key:null,pre:{},song:{},order:[],done:false};
function vtPrice(nm){for(const c of MENU)for(const d of c.d)if(d.nm===nm)return d.pr;return 0;}
function vtReset(){const k=(S.boothId||'')+'|'+(S.ev?S.ev.k:'');if(VT.key===k)return;VT.key=k;VT.done=false;
  VT.pre={'Grey Goose':['Omar'],'Moët Impérial':['Tariq']};VT.song={};VT.order=[];
  (VT_SONGS[S.ev&&S.ev.screen]||[]).forEach((s,i)=>{VT.song[s]=i?['Tariq']:['Omar'];VT.order.push(s);});}
function vtWho(el){return el.dataset.who==='guest'?'You':'Host';}
function vtRender(){if(LIVE){vtRenderLive();return;}   /* live: the table's real votes (below) */
  if(!S.boothId)return;vtReset();const t=T(S.boothId);if(!t)return;const m=VT_MULT[t.tier]||1,tierN=(TIERS[t.tier]&&TIERS[t.tier].short)||t.grp;
  document.querySelectorAll('.vote').forEach(el=>{const me=vtWho(el),host=el.dataset.who!=='guest';
    const preN=VT_PRE.map(n=>(VT.pre[n]||[]).length),pmax=Math.max(1,...preN),lead=VT_PRE[preN.indexOf(Math.max(...preN))];
    const songs=VT.order.slice().sort((a,b)=>(VT.song[b]||[]).length-(VT.song[a]||[]).length),smax=Math.max(1,...songs.map(s=>(VT.song[s]||[]).length));
    el.innerHTML=`<div class="vt-hd"><h3 class="vt-h">Table votes</h3><span class="vt-x">${esc(t.name)} counts ×${m}</span></div>
<div class="vt-sec"><div class="vt-t">Pre-order</div><p class="vt-s">The bottle with the most votes is ordered for arrival and counts toward the minimum.</p>
${VT_PRE.map((n,i)=>{const v=VT.pre[n]||[],on=v.includes(me);return `<button type="button" class="vt-row${on?' on':''}" data-k="pre" data-n="${esc(n)}"><span class="vt-n">${esc(n)}<small>AED ${vtPrice(n).toLocaleString('en-US')}</small></span><span class="vt-bar"><i style="width:${Math.round(v.length/pmax*100)}%"></i></span><b>${v.length}</b></button>`;}).join('')}
${host?`<button type="button" class="vt-go"${VT.done?' disabled':''}>${VT.done?`${esc(lead)} is on the pre-order`:`Pre-order ${esc(lead)}, the table's pick`}</button>`:`<p class="vt-s vt-lead">Leading: <b>${esc(lead)}</b></p>`}</div>
<div class="vt-sec"><div class="vt-t">Song vote</div><p class="vt-s">Your table's picks go to the DJ, and every vote from ${esc(t.name)} counts ×${m}.</p>
${songs.length?songs.map(s=>{const v=VT.song[s]||[],on=v.includes(me);return `<button type="button" class="vt-row${on?' on':''}" data-k="song" data-n="${esc(s)}"><span class="vt-n">${esc(s)}<small>${v.length} vote${v.length===1?'':'s'} × ${m}</small></span><span class="vt-bar"><i style="width:${Math.round(v.length/smax*100)}%"></i></span><b>${v.length*m}</b></button>`;}).join(''):'<p class="vt-s">No requests yet. Be the first.</p>'}
<div class="vt-add"><input type="text" maxlength="60" placeholder="Request a track" aria-label="Request a track"><button type="button" class="vt-addb">Add</button></div></div>`;
    el.style.setProperty('--vt',GCOL[t.grp]||'#fff');});}
document.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('.vote .vt-row,.vote .vt-go,.vote .vt-addb');if(!r)return;if(LIVE){vtActLive(r);return;}const el=r.closest('.vote'),me=vtWho(el);
  if(r.classList.contains('vt-row')){const k=r.dataset.k,n=r.dataset.n;
    if(k==='pre'){VT_PRE.forEach(p=>{VT.pre[p]=(VT.pre[p]||[]).filter(x=>x!==me);});if(!r.classList.contains('on'))(VT.pre[n]=VT.pre[n]||[]).push(me);}
    else{const v=VT.song[n]=VT.song[n]||[];const i=v.indexOf(me);if(i>=0)v.splice(i,1);else v.push(me);}
    vtRender();return;}
  if(r.classList.contains('vt-go')){const preN=VT_PRE.map(n=>(VT.pre[n]||[]).length),lead=VT_PRE[preN.indexOf(Math.max(...preN))],pr=vtPrice(lead);
    basket.items.push(lead);basket.total+=Math.round(pr*.9);basket.credit+=pr;VT.done=true;updateBasket();vtRender();toast(`${lead} is on the pre-order, AED ${pr.toLocaleString('en-US')} toward the minimum`);return;}
  if(r.classList.contains('vt-addb')){const inp=el.querySelector('.vt-add input'),s=(inp.value||'').trim();if(!s)return;if(!VT.song[s]){VT.song[s]=[];VT.order.push(s);}if(!VT.song[s].includes(me))VT.song[s].push(me);vtRender();toast('Added to the table\u2019s song vote');}});
/* ---- live: the song vote, kept by BUBL's back end ----
   The people with a seat at the table add tracks and vote; the counts are theirs and start empty. How much this
   table's vote weighs is the venue's own number for its tier. Two parts of the build's card are not drawn here:
   the pre-order vote (it votes on the menu, which is hidden until the venue sends its own), and the words "go to the
   DJ" (nothing carries the picks to the DJ yet). */
const VTL={};
const vtBookingOf=el=>el.dataset.who==='guest'?((window.GUEST&&GUEST.bookingId)||null):((typeof MINE!=='undefined'&&MINE.id)||null);
const vtTableOf=el=>{const k=el.dataset.who==='guest'?(window.GUEST&&GUEST.view&&GUEST.view.table&&GUEST.view.table.key):S.boothId;return k?T(k):null;};
async function vtLoad(id){const r=await BUBL.call('guest','votes',{booking_id:id});if(r.ok){VTL[id]=r;vtRenderLive(true);}}
function vtRenderLive(loaded){
  document.querySelectorAll('.vote').forEach(el=>{const id=vtBookingOf(el),t=vtTableOf(el);
    if(!id||!t||!PAGE.modules.includes('table_votes')){el.innerHTML='';return;}
    const d=VTL[id];if(!d){if(!loaded)vtLoad(id);return;}
    if(document.activeElement&&el.contains(document.activeElement)&&loaded==='poll')return;   /* never redraw under a guest who is typing */
    const m=d.weight,songs=d.tracks,smax=Math.max(1,...songs.map(s=>s.votes));
    el.innerHTML=`<div class="vt-hd"><h3 class="vt-h">Table votes</h3><span class="vt-x">${esc(t.name)} counts ×${m}</span></div>
<div class="vt-sec"><div class="vt-t">Song vote</div><p class="vt-s">Every vote from ${esc(t.name)} counts ×${m}.</p>
${songs.length?songs.map(s=>`<button type="button" class="vt-row${s.mine?' on':''}" data-k="song" data-n="${esc(s.track)}"><span class="vt-n">${esc(s.track)}<small>${s.votes} vote${s.votes===1?'':'s'} × ${m}</small></span><span class="vt-bar"><i style="width:${Math.round(s.votes/smax*100)}%"></i></span><b>${s.votes*m}</b></button>`).join(''):'<p class="vt-s">No requests yet. Be the first.</p>'}
<div class="vt-add"><input type="text" maxlength="60" placeholder="Request a track" aria-label="Request a track"><button type="button" class="vt-addb">Add</button></div></div>`;
    el.style.setProperty('--vt',GCOL[t.grp]||'#fff');});}
async function vtActLive(r){const el=r.closest('.vote'),id=vtBookingOf(el);if(!id||r.classList.contains('vt-go'))return;let track,on=true;const add=r.classList.contains('vt-addb');
  if(add){track=(el.querySelector('.vt-add input').value||'').trim();if(!track)return;}else{track=r.dataset.n;on=!r.classList.contains('on');}
  const x=await BUBL.call('guest','vote',{booking_id:id,track,on});if(!x.ok){toast(x.reason);return;}
  VTL[id]=x;vtRenderLive(true);if(add)toast('Added to the table’s song vote');}
if(LIVE)setInterval(()=>{if(document.hidden)return;const ids=new Set();document.querySelectorAll('.vote').forEach(el=>{const id=vtBookingOf(el);if(id&&el.offsetParent)ids.add(id);});
  ids.forEach(async id=>{const r=await BUBL.call('guest','votes',{booking_id:id});if(r.ok){VTL[id]=r;vtRenderLive('poll');}});},15000);
window.vtRender=vtRender;
