/* ---- split the bill: a pie the host shapes by % or by AED; the host's own share absorbs every change ---- */
const SPLIT={open:false,mode:'pct',shares:[],sig:'',sent:false};
const SPC=['#FF2D55','#00E5FF','#B026FF','#FF4FD8','#39FF14','#2F7BFF','#FFFFFF','#FF8FB1','#7DF9FF','#C77DFF','#9DFF6E','#5AA9FF','#FFC2D6','#B5F2FF','#E0B3FF','#D7FFB8'];
function spPeople(){const t=T(S.boothId),n=S.party||(t&&t.cap)||4,ppl=['You'].concat((S.guests||[]).slice(0,n-1));while(ppl.length<n)ppl.push('Seat '+(ppl.length+1));return ppl;}
function spEnsure(){const p=spPeople();if(SPLIT.shares.length!==p.length){SPLIT.shares=p.map(()=>100/p.length);}return p;}
function spIsEven(){const s=SPLIT.shares;return !s.length||s.every(v=>Math.abs(v-s[0])<.01);}
function spAdj(i,d){const s=SPLIT.shares;if(i===0||!s.length)return;let nv=Math.max(0,Math.min(100,s[i]+d)),dl=nv-s[i];if(s[0]-dl<0){dl=s[0];nv=s[i]+dl;}s[i]=nv;s[0]-=dl;SPLIT.sent=false;}
let _pid=0;
function neonPie(shares,paid){const id='np'+(++_pid),R=50,C=2*Math.PI*R,n=shares.filter(v=>v>.05).length,gap=n>1?4.2:0;let off=0,out='';
  shares.forEach((v,i)=>{const L=C*v/100,len=L-gap;if(len>.4){const col=SPC[i%SPC.length],dim=paid&&!paid[i]?.42:1;
    out+=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="${col}" stroke-opacity="${dim}" stroke-width="11" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-(off+gap/2)).toFixed(2)}" transform="rotate(-90 70 70)"/>`;}off+=L;});
  return `<svg class="sp-pie" viewBox="0 0 140 140" aria-hidden="true"><defs><filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle r="${R}" cx="70" cy="70" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="15"/><circle r="${R-11}" cx="70" cy="70" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1"/><g filter="url(#${id})">${out}</g></svg>`;}
function spPie(){return neonPie(SPLIT.shares);}
function spRender(){const box=$('#hnSplit');if(!box)return;if(!SPLIT.open){box.hidden=true;box.innerHTML='';hnRefresh();return;}
  const ppl=spEnsure(),min=S.bookMin||0,pct=SPLIT.mode==='pct';SPLIT.sig=ppl.join('|');box.hidden=false;
  box.innerHTML=`<div class="sp-hd"><b>Split the bill</b><div class="sp-mode"><button type="button" data-sm="pct" class="${pct?'on':''}">%</button><button type="button" data-sm="aed" class="${pct?'':'on'}">AED</button></div></div>
<div class="sp-top">${spPie()}<div class="sp-mid"><b>${AED(min)}</b><span>minimum across ${ppl.length}</span></div></div>
<div class="sp-list">${ppl.map((n,i)=>{const v=SPLIT.shares[i],a=Math.round(min*v/100);return `<div class="sp-row"><i style="background:${SPC[i%SPC.length]};color:${SPC[i%SPC.length]}"></i><span class="sp-n">${esc(n)}${i===0?'<small>takes up the difference</small>':''}</span>
<button type="button" class="sp-b" data-i="${i}" data-d="-1"${i===0?' disabled':''} aria-label="Less">\u2212</button><span class="sp-v">${pct?Math.round(v)+'%':AED(a)}<small>${pct?AED(a):Math.round(v)+'%'}</small></span><button type="button" class="sp-b" data-i="${i}" data-d="1"${i===0?' disabled':''} aria-label="More">+</button></div>`;}).join('')}</div>
<div class="sp-ft"><button type="button" class="sp-even">Split evenly</button><button type="button" class="sp-send">${SPLIT.sent?'Sent to guests':'Send shares to guests'}</button></div>`;
  hnRefresh();}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#hnSplit button');if(!b)return;const min=S.bookMin||1;
  if(b.dataset.sm){SPLIT.mode=b.dataset.sm;}
  else if(b.classList.contains('sp-b')){const i=+b.dataset.i,d=+b.dataset.d;spAdj(i,SPLIT.mode==='pct'?d*5:d*250/min*100);}
  else if(b.classList.contains('sp-even')){const n=SPLIT.shares.length;SPLIT.shares=SPLIT.shares.map(()=>100/n);SPLIT.sent=false;}
  else if(b.classList.contains('sp-send')){SPLIT.sent=true;toast('Shares sent. Every guest sees theirs on the invite.');}
  spRender();});
