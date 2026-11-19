/* terms tick: toggles on touch-down (before an open keyboard closes and shifts the sheet); click covers mouse; guarded against double toggles */
(function(){const row=document.getElementById('ginfoTcRow'),cb=document.getElementById('ginfoTc');if(!row||!cb)return;let tDown=0;
  const set=v=>{cb.checked=!!v;row.setAttribute('aria-checked',v?'true':'false');row.classList.toggle('on',!!v);if(v){const e=document.getElementById('ginfoErr');if(e)e.classList.remove('show');}};
  window.__setTc=set;
  row.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();tDown=Date.now();set(!cb.checked);
    const a=document.activeElement;if(a&&a.blur&&a.tagName==='INPUT')setTimeout(()=>a.blur(),30);});
  row.addEventListener('click',()=>{if(Date.now()-tDown<900)return;set(!cb.checked);});
  row.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();set(!cb.checked);}});
})();
