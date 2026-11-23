/* the invitation owns the screen while it's open */
(function(){const st=document.createElement('style');st.textContent='body:has(.ip-page) .mgrbar,body:has(.ip-page) #mgrbar{display:none!important}';document.head.appendChild(st);})();
/* every form submits through script: sandboxed viewers block native form submission */
(function(){const fire=f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  function fix(f){if(f.__fx)return;f.__fx=1;f.querySelectorAll('button[type=submit],button:not([type])').forEach(b=>{b.type='button';b.addEventListener('click',()=>fire(f));});
    f.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.tagName==='INPUT'){e.preventDefault();fire(f);}});}
  const scan=()=>document.querySelectorAll('form').forEach(fix);scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});})();
/* before the guest claims their spot, a tap on the table votes takes them to the form */
document.addEventListener('click',e=>{const v=e.target.closest&&e.target.closest('.ip-vote');if(!v||(window.ipVotesOpen&&ipVotesOpen()))return;e.preventDefault();e.stopPropagation();
  const sc=document.querySelector('.ip-scroll');
  if(!window.__ipClaimed){const c=document.querySelector('.ip-claim');if(c&&sc)sc.scrollTo({top:c.offsetTop-70,behavior:'smooth'});setTimeout(()=>{const n=document.querySelector('.ip-name');if(n&&!n.value)n.focus({preventScroll:true});},450);}
  else{const d=document.querySelector('.ip-dep')||document.querySelector('.ipg-wait');if(d&&sc)sc.scrollTo({top:Math.max(0,d.offsetTop-90),behavior:'smooth'});if(d){d.classList.remove('nudge');void d.offsetWidth;d.classList.add('nudge');}}},true);
new MutationObserver(()=>{if(window.ipVotesOpen&&ipVotesOpen())return;document.querySelectorAll('.ip-vote:not(.locked)').forEach(v=>v.classList.add('locked'));}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(!(e.target.closest&&e.target.closest('.ip-claimbtn')))return;const sc=document.querySelector('.ip-scroll'),c=document.querySelector('.ip-claim');
  if(sc&&c)sc.scrollTo({top:c.offsetTop-70,behavior:'smooth'});setTimeout(()=>{const n=document.querySelector('.ip-name');if(n&&!n.value)n.focus({preventScroll:true});},500);});
