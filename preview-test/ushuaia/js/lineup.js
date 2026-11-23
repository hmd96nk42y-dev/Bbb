/* ================= lineup · tap the stage ================= */
function lineupHTML(){
  const ev=S.ev;
  return `<p class="lu-ab">${esc(ev.about)}</p>
  <div>${ev.lineup.map(([n,r])=>`<div class="lu-row"><span class="lu-av">${esc(n[0])}</span><div class="lu-nm">${esc(n)}${r?`<small>${esc(r)}</small>`:''}</div></div>`).join('')}</div>
  <h4 class="lu-h">Good to know</h4>
  <ul class="lu-li"><li>Doors ${ev.doors}${ev.ends?`, music until ${ev.ends}`:''}. Open air on Dubai Harbour.</li><li>21+. Original Emirates ID or passport at the door.</li><li>No re-entry. Casual dress, no flip-flops.</li><li>No photography or videography.</li></ul>
  ${LIVE&&ev.from==null?'':`<button class="btn red full lu-go" id="luTix" type="button">Buy tickets, from ${AED(ev.from)}</button>`}`;   /* live: only where a ticket is on sale */
}
function openDj(){
  const ev=S.ev;
  $('#djSheet .msh-hd').innerHTML=`<div class="dj-av"><i>${esc(ev.short[0])}</i></div><div class="t"><h3 style="margin-top:0;font-size:26px">${esc(ev.head)}</h3><div class="dj-sub"><span>${fmtLong(ev.k)}</span><span>Doors ${ev.doors}</span></div></div><button class="msh-x" data-close type="button" aria-label="Close">\u2715</button>`;
  $('#djSheet .msh-x').addEventListener('click',()=>closeSheet());
  $('#djBody').innerHTML=lineupHTML();if(typeof hitsSheet==='function')hitsSheet(ev);
  if($('#luTix'))$('#luTix').addEventListener('click',()=>{closeSheet(true);S.tixMode=true;openTix();});
  openSheet($('#djSheet'),()=>{if(typeof hitStop==='function')hitStop();});
}
function openDrinksMenu(){openMenu('Cocktails');}
