'use strict';
/* ============================================================
   99 · boot
   ============================================================ */
function boot(){
  Object.keys(FONTS).forEach(k=>{try{const ff=new FontFace(FAM[k.slice(0,2)],b64bytes(FONTS[k].b64).buffer,{weight:k[2]==='5'?'100 599':'600 900'});ff.load().then(x=>document.fonts.add(x)).catch(()=>{});}catch(_){}});
  loadEvent(defaultEvent(now()));const app=$('#app');app.dataset.phase=phase();UI._ph=phase();layout();
  let lw=window.innerWidth;window.addEventListener('resize',()=>{const w=window.innerWidth;if((w>=900)!==(lw>=900)){lw=w;layout();}else if(UI.tab==='floor'||UI.atlas==='floor'){lw=w;}});
  setInterval(tick,1000);
  /* the offline helper sits next to this file. It only controls this page, never the other builds in the folder */
  try{const pg=location.pathname.split('/').pop();if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&window.top===window&&/\.html?$/i.test(pg))
    navigator.serviceWorker.register('ushuaia-ops-sw.js?page='+encodeURIComponent(decodeURIComponent(pg)),{scope:'./'+pg}).catch(()=>{});}catch(_){}
}
window.OPS_START=boot;   /* called by ops/engine/boot.js once every file is here */
