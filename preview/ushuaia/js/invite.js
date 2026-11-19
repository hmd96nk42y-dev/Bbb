/* ================= invite ================= */
let gTimers=[];const GNAMES=['Omar','Layla','Rami','Nadia','Karim','Yasmin','Zayd','Maya','Tariq'];
function showInvite(t){
  if(LIVE){$('#invite').classList.add('show');$('#linkKey').textContent=MINE.token?inviteUrl(MINE.token):'';MINE.sig=null;S.guests=[];paintJoined([],{party_size:S.party});return;}   /* live: the booking's own link; guests appear when they really join (live-host.js) */
  $('#invite').classList.add('show');const tot=Math.max(1,(S.party||4)-1);
  $('#glab').classList.remove('done');$('#glab').innerHTML=`Guests joined <span id="gj">0</span> of <span id="gt">${tot}</span>`;$('#pfill').style.width='0%';
  $('#gfeed').innerHTML='<p class="gempty">Waiting for your guests to claim their spots</p>';
  S.guests=[];gTimers.forEach(clearTimeout);gTimers=[];S.autoConfirmed=false;
  const seed=h32(`${S.date}|${S.time}|${t.id}`),names=[...GNAMES];
  for(let i=names.length-1;i>0;i--){const j=(seed+i*7)%(i+1);[names[i],names[j]]=[names[j],names[i]];}
  let delay=4200;names.slice(0,tot).forEach((nm,i)=>{gTimers.push(setTimeout(()=>addGuest(nm,tot),delay));delay+=3400+i*600;});
}
function addGuest(name,tot){
  S.guests.push(name);const n=S.guests.length;const e=$('#gfeed .gempty');if(e)e.remove();
  const row=ce('div','grow',`<span class="gav">${name[0]}</span><span class="gnm">${name}</span><span class="gwh">just now</span>`);$('#gfeed').appendChild(row);
  $$('.grow .gwh').forEach((w,i,a)=>{if(i<a.length-1)w.textContent=`${a.length-1-i} min ago`});
  $('#pfill').style.width=`${Math.min(100,n/tot*100)}%`;const gj=$('#gj');if(gj)gj.textContent=n;
  toast(`${name} claimed their spot`);
  if(n>=tot){$('#glab').textContent='Your table is complete';$('#glab').classList.add('done');if(!S.autoConfirmed){S.autoConfirmed=true;setTimeout(showConfirm,900);}}
}
function hideInvite(){if(LIVE){$('#invite').classList.remove('show');S.guests=[];return;}$('#invite').classList.remove('show');gTimers.forEach(clearTimeout);gTimers=[];S.guests=[];}
function doCopy(){try{navigator.clipboard&&navigator.clipboard.writeText((LIVE?'https://':'')+$('#linkKey').textContent);}catch(_){}toast('Link copied');}
$('#copyBtn').addEventListener('click',doCopy);$('#sCopy').addEventListener('click',doCopy);
$('#sWA').addEventListener('click',()=>{if(LIVE){const u='https://'+$('#linkKey').textContent;try{window.open('https://wa.me/?text='+encodeURIComponent(`Join my table at ${PAGE.venue.name}, ${S.ev.short}: ${u}`),'_blank');}catch(_){}return;}toast('Opening WhatsApp');});
$('#sMore').addEventListener('click',()=>{if(LIVE){const u='https://'+$('#linkKey').textContent;if(navigator.share)navigator.share({title:'Join my table',text:`Join my table at ${PAGE.venue.name}, ${S.ev.short}.`,url:u}).catch(()=>{});else doCopy();return;}toast('Opening share sheet');});
$('#sSMS').addEventListener('click',()=>$('#smsForm').classList.toggle('show'));
$('.smsf .snd').addEventListener('click',()=>{const n=$('.smsf .num').value.trim();if(!n)return;toast('Invite sent');$('.smsf .num').value='';$('#smsForm').classList.remove('show');});
function showConfirm(){
  window.__nbAction=null;
  if(!S.boothId)return;const t=T(S.boothId);const ref=(typeof hostCode==='function')?hostCode():'US-'+String(h32(S.date+S.time+S.boothId)%9999).padStart(4,'0');
  const n=Math.max(1,(S.party||4)-1);
  $('#smsLine').textContent=`All ${n} guest${n===1?' has':'s have'} claimed their spot at your table. Pay the deposit to confirm it.`;
  $('#confSumm').textContent=`${t.name}, ${S.ev.short}, ${fmtD(dOf(S.date))}, arrive by ${S.time}, ref ${ref}`;
  showSmsBanner();
}
/* iOS-style banner: springs down from the top, lingers, then retracts; swipe up or tap to dismiss */
let _nbT=null;
function showSmsBanner(){
  const b=$('#smsBanner');if(!b)return;
  clearTimeout(_nbT);b.classList.remove('nb-in','drag');b.style.transform='';
  void b.offsetWidth;
  b.classList.add('nb-in');
  _nbT=setTimeout(hideSmsBanner,6800);
}
function hideSmsBanner(){const b=$('#smsBanner');if(!b)return;clearTimeout(_nbT);b.classList.remove('drag');b.style.transform='';b.classList.remove('nb-in');}
(function(){
  const b=$('#smsBanner');if(!b)return;
  let y0=null,dy=0,moved=false;
  b.addEventListener('pointerdown',e=>{y0=e.clientY;dy=0;moved=false;b.classList.add('drag');clearTimeout(_nbT);try{b.setPointerCapture(e.pointerId);}catch(_){}});
  b.addEventListener('pointermove',e=>{if(y0===null)return;dy=e.clientY-y0;if(Math.abs(dy)>4)moved=true;
    const t=dy<0?dy:Math.pow(dy,.62);b.style.transform=`translate3d(0,${t}px,0)`;});
  const end=()=>{if(y0===null)return;y0=null;b.classList.remove('drag');
    if(dy<-26||!moved){b.style.transform='';hideSmsBanner();}
    else{b.style.transform='';_nbT=setTimeout(hideSmsBanner,4200);}};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
})();

/* tapping the drop-down message opens what it's about */
$('#smsBanner').addEventListener('click',()=>{const a=window.__nbAction;if(a){try{a();}catch(_){}}});
