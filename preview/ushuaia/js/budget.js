/* ================= budget bar · which tables meet your number ================= */
const BUD={on:false,search:false,val:15000,min:6000,max:30000};
const GROUPS=[['bs','Backstage'],['vip','VIP'],['plat','Platinum'],['gold','Gold'],['silver','Silver']];
const GCOL={bs:'#FF2D2D',vip:'#FF4FC8',plat:'#9A6BFF',gold:'#FFF0D2',silver:'#6FD2FF'};
const GPRICE={bs:'A \u00b7 30k',vip:'18k',plat:'15k',gold:'10k',silver:'6k'};
const GSEC={vip:'vip',plat:'pl',gold:'gd',silver:'sl'};
function secGroup(s){return !s?null:s.indexOf('bs')===0?'bs':s.indexOf('vip')===0?'vip':s.indexOf('pl')===0?'plat':s.indexOf('gd')===0?'gold':'silver';}
function budgetIds(){
  if(!BUD.on&&!BUD.search)return null;const p=S.party||0;
  return TABLES.filter(t=>{if(t.req)return false;if(BUD.on&&minFor(t,p)>BUD.val*UNIT)return false;if(p&&!fits(t,p))return false;if(!S.boothId&&!seeded(t.id))return false;return true;}).map(t=>t.id);
}
function paintGuests(){const r=$('#budGuests');if(!r)return;if(!r.childElementCount){{const a0=ce('button','bgp bgp-any','Any');a0.type='button';a0.dataset.n=0;a0.addEventListener('click',()=>{S.party=null;paintGuests();if(S.pick&&!tableOpen(T(S.pick)))S.pick=null;renderBudget();syncDoll();renderRoom&&renderRoom();});r.appendChild(a0);}for(let n=2;n<=16;n++){const b=ce('button','bgp',n);b.type='button';b.dataset.n=n;
    b.addEventListener('click',()=>{S.party=S.party===n?null:n;paintGuests();if(S.pick&&!tableOpen(T(S.pick)))S.pick=null;renderBudget();syncDoll();renderRoom&&renderRoom();});r.appendChild(b);}}
  $$('#budGuests .bgp').forEach(b=>b.classList.toggle('sel',(+b.dataset.n||null)===(S.party||null)));const v=$('#budGv');if(v){v.textContent=S.party?String(S.party):'Any';v.classList.toggle('off',!S.party);}}
window.paintGuests=paintGuests;
function renderBudget(){paintGuests();
  const v=$('#budVal');if(v){v.textContent=BUD.on?(Math.round(Math.min(BUD.val,BUD.max)/1000)+'k'+(BUD.val>=BUD.max?'+':'')):'Any';v.classList.toggle('off',!BUD.on);}
  const x=$('#budClr');if(x)x.hidden=!BUD.on;
  $$('#budPre button').forEach(b=>b.classList.toggle('on',b.classList.contains('bud-any')?!BUD.on:BUD.on&&+b.dataset.v===BUD.val));}
function paintSecChips(){}
function syncBudget(){const ids=budgetIds();dollPost({cmd:'budget',on:BUD.on||BUD.search,ids:ids||[]});renderBudget();}
function budSearch(){BUD.search=true;syncBudget();const ids=budgetIds()||[];S.view='top';paintVtog();dollPost({cmd:'setView',view:'top'});dollPost({cmd:'focus',zone:'all'});
  const a=$('#app'),rc=$('#roomCanvas');if(a&&rc)a.scrollTo({top:rc.offsetTop-150,behavior:'smooth'});
  toast(ids.length?`${ids.length} table${ids.length===1?'':'s'} open${S.party?` for ${S.party} guests`:''}${BUD.on?` within ${AED(BUD.val*UNIT)}`:''}. Tap a section to see them.`:'Nothing open for that. Try fewer guests or a higher budget.');}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#budGo'))budSearch();});
function zoomGroup(g){
  const ids=budgetIds(),set=ids?new Set(ids):null;
  const secs=g==='bs'?['bsC','bsL','bsR']:[GSEC[g]+'L',GSEC[g]+'R'];
  let best=secs[0],bn=-1;
  secs.forEach(s=>{const n=TABLES.filter(t=>t.sec===s&&(!set||set.has(t.id)||(t.req&&S.vip))).length;if(n>bn){bn=n;best=s;}});
  dollPost({cmd:'focus',zone:best});
  const a=$('#app'),rc=$('#roomCanvas');a.scrollTo({top:Math.max(0,rc.offsetTop-110),behavior:'smooth'});
}
(function(){
  const pre=$('#budPre');{const b=ce('button','bud-any','Any');b.type='button';b.addEventListener('click',()=>{BUD.on=false;syncBudget();});pre.appendChild(b);}[[6000,'6k'],[10000,'10k'],[15000,'15k'],[20000,'20k'],[30000,'30k+']].forEach(([v,l])=>{const b=ce('button','',l);b.type='button';b.dataset.v=v;b.addEventListener('click',()=>{if(BUD.on&&BUD.val===v){BUD.on=false;}else{BUD.on=true;BUD.val=v;}syncBudget();});pre.appendChild(b);});
  $('#budClr').addEventListener('click',()=>{BUD.on=false;syncBudget();});
})();
