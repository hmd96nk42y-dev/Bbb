(function(){const bud=document.getElementById('budget');if(!bud)return;let cur=null;
  const set=k=>{cur=k;bud.querySelectorAll('[data-dd]').forEach(b=>b.setAttribute('aria-expanded',b.dataset.dd===k?'true':'false'));bud.querySelectorAll('.bud-pn').forEach(p=>p.classList.toggle('on',p.dataset.pn===k));};
  bud.querySelectorAll('[data-dd]').forEach(b=>b.addEventListener('click',()=>set(cur===b.dataset.dd?null:b.dataset.dd)));
  bud.addEventListener('click',e=>{if(e.target.closest('#budGuests .bgp,#budPre button'))setTimeout(()=>set(null),240);});
  window.budOpen=k=>set(k||null);})();
