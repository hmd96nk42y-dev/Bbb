/* ================= the ticket holder · after buying, the main screen shows their ticket, their link and code, and where they go ================= */
function tixCode(){const first=((TIXB.name||'').split(' ')[0]||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,6)||'GUEST';return first+String(h32(tix.done||'x')%90+10);}
function showTixBlock(n){if(LIVE)return showTixBlockLive(true);   /* live: the real ticket (live-tickets.js) */
  const b=$('#tixBlock');if(!b||!tix.done)return;const ev=S.ev,first=(TIXB.name||'').split(' ')[0]||'You',code=tixCode(),share=`bubl.app/ushuaia-dxb/n/${S.date}?ref=${code}`;
  const kinds=[['Early entry',tix.q[0]],['Second wave',tix.q[1]],['VIP standing',tix.q[2]]].filter(k=>k[1]).map(k=>`${k[1]} \u00d7 ${k[0]}`).join(', ');
  b.innerHTML=`<p class="vp-hello">Your ticket,</p><h2 class="vp-name">${esc(first)}</h2>
<div class="vp-card hn-card ok" style="--hc:#39FF14"><small>General admission <em class="hn-badge ok">Confirmed</em></small><p class="vp-tier">Admit ${n||1}</p>
<div class="hn-meta"><span>${esc(ev.short)}</span><span>${esc(fmtD(dOf(S.date)))}</span><span>Doors ${esc(ev.doors)}</span></div><div class="vp-cardf"><span>${esc(kinds)}</span><span>${tix.done}</span></div></div>
<div class="hn-qrc">${hostQR(tix.done)}<div><b>Your entry QR</b><p>Tap it to fill the screen at the General Admission gate. Bring your ID.</p><span class="hn-code">${tix.done}</span></div></div>
<div class="tk-where"><b>Where you go</b><p>General admission is the floor in front of the stage, lit green in the room below. Come in through the General Admission gate, bottom left of the venue.</p><button type="button" class="tk-show">Show me in the room</button></div>
<div class="tk-ref"><small>Your link</small><div class="tk-link"><span>${share}</span><button type="button" class="tk-copy">Copy</button></div>
<small>Your invite code</small><div class="tk-code"><b>${code}</b><span>Every ticket bought with your link or code is a free drink for you.</span></div>
<div class="tk-acts"><button type="button" class="tk-share">Share link</button><button type="button" class="tk-wa">WhatsApp</button></div></div>`;
  b.hidden=false;b.classList.add('on','now');try{dollPost({cmd:'ga',on:true});}catch(_){}
  {const bt=$('#buyTix');if(bt){const sp=bt.querySelector('span');if(sp)sp.textContent='Your ticket';else bt.textContent='Your ticket';}}
  const a=$('#app');if(a)a.scrollTo({top:Math.max(0,b.offsetTop-70),behavior:'smooth'});}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#tixBlock button');if(!b)return;const code=tixCode(),share=`https://bubl.app/ushuaia-dxb/n/${S.date}?ref=${code}`;
  if(b.classList.contains('tk-show')){S.view='iso';try{paintVtog();dollPost({cmd:'setView',view:'iso'});dollPost({cmd:'ga',on:true});}catch(_){}const a=$('#app'),rc=$('#roomCanvas');if(a&&rc)a.scrollTo({top:rc.offsetTop-110,behavior:'smooth'});}
  else if(b.classList.contains('tk-copy')){try{navigator.clipboard.writeText(share);}catch(_){}toast('Link copied');}
  else if(b.classList.contains('tk-share')){if(navigator.share)navigator.share({title:'Ushua\u00efa',text:`Come to ${S.ev.short} at Ushua\u00efa. Use my code ${code}.`,url:share}).catch(()=>{});else{try{navigator.clipboard.writeText(share);}catch(_){}toast('Link copied');}}
  else if(b.classList.contains('tk-wa')){try{window.open('https://wa.me/?text='+encodeURIComponent(`Come to ${S.ev.short} at Ushua\u00efa: ${share} (code ${code})`),'_blank');}catch(_){}}});
window.showTixBlock=showTixBlock;
