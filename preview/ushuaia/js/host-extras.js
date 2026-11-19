/* ---- a table change is a request: the team clears it, then you pick ---- */
function requestChange(){if(HN.chgReq)return;HN.chgReq=true;const t=T(S.boothId);toast('Table change requested. The team will come back to you.');
  try{dollPost({cmd:'mgrTyping'});}catch(_){}
  setTimeout(()=>{try{dollPost({cmd:'mgrSay',text:`We've got your request to move from ${t?t.name:'your table'}. You're cleared to change: pick your new table in the room and we'll hold it.`});}catch(_){}
    setTimeout(()=>{HN.chgReq=false;hostTransition(()=>{window.__chgOK=true;$('#selChg').click();});},2600);},1800);}
/* ---- the booked change: a black veil covers the swap, then a light sweep as it lifts ---- */
function hostTransition(fn){const v=document.createElement('div');v.className='hn-veil';document.body.appendChild(v);
  requestAnimationFrame(()=>requestAnimationFrame(()=>v.classList.add('in')));
  setTimeout(()=>{try{fn();}catch(_){}const sw=document.createElement('div');sw.className='hn-sweep';document.body.appendChild(sw);
    requestAnimationFrame(()=>{v.classList.add('out');sw.classList.add('go');});setTimeout(()=>{v.remove();sw.remove();},1600);},320);}
/* ---- one clock for every shine: the logo and the Black Coffee portrait sweep together ---- */
function shinePulse(){document.querySelectorAll('animateTransform[data-shine]').forEach(a=>{try{a.beginElement();}catch(_){}});
  document.querySelectorAll('.eh-sh:not(.eh-glow)').forEach(e=>{e.classList.remove('go');void e.offsetWidth;e.classList.add('go');});}
setTimeout(()=>{shinePulse();setInterval(shinePulse,6800);},1500);
