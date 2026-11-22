/* ================= a VIP link (test and live) =================
   The venue's team makes a VIP link in OPS for one guest: one table on one night, the table's price in that link and
   what is paid up front, anything from nothing to the whole minimum (BUILD_SPEC section 6, question 28).
   The link opens this page (…/?v=<token>) on that night with Sk's own hold card for that table, showing the link's
   terms. The guest gives their own details and proves their number as on any table; "Hold" then takes the link
   instead of making an ordinary hold. From there the page is the host's, as for any table. */
let OFFER=null;
/* A link the team typed a number on is that number's alone (Sk, 22 Nov 2026, DECISIONS question 77). The check happens
   once the person has confirmed their number; until then the page shows no price, no name and no number. Someone who
   confirmed another number sees Sk's own screen, in his hold card: the title, the line under it, and two ways on. */
const OFFER_SAYS={link_invalid:'This link is not valid.',link_inactive:'This link is no longer active.',offer_taken:'This link has already been used.',taken:'This table has just been taken. Please contact the venue.'};
const NOT_YOURS_HIDE=['.ginfo-sum','.id-note','label[for=ginfoName]','#ginfoName','label[for=ginfoPhone]','#ginfoPhone','label[for=ginfoEmail]','#ginfoEmail','#ginfoErr','#ginfoTcRow','#ginfoCta','#ginfoCode'];
function offerNotYoursShut(){const card=$('.ginfo-card'),box=$('#ginfoNotYours');if(!box)return;box.remove();
  NOT_YOURS_HIDE.forEach(q=>{const e=card.querySelector(q);if(e)e.style.display='';});const c=$('#ginfoCode');if(c)c.style.display='none';
  const sub=card.querySelector('.ginfo-sub');if(sub&&sub.dataset.was!=null){sub.textContent=sub.dataset.was;delete sub.dataset.was;}}
function offerNotYours(token,v){
  const card=$('.ginfo-card'),sub=card.querySelector('.ginfo-sub'),venue=(v&&v.venue&&(v.venue.short_name||v.venue.name))||'The venue',night=v&&v.service;
  ginfoShut();OFFER=null;_pending=null;
  $('#ginfoHed').textContent='This table is held for someone else';
  sub.dataset.was=sub.textContent;sub.textContent=venue+' sent this table to one guest, so only their number can take it. We’ve let them know.';
  NOT_YOURS_HIDE.forEach(q=>{const e=card.querySelector(q);if(e)e.style.display='none';});
  const box=ce('div');box.id='ginfoNotYours';box.style.marginTop='18px';
  box.innerHTML='<button class="btn red full" type="button" id="nyOther">See other tables</button><button class="ip-link" type="button" id="nyNumber" style="display:block;margin:14px auto 0">Not you? Use another number</button>';
  card.appendChild(box);$('#ginfoModal').classList.add('show');
  /* the same night, with nothing held; the link is dropped from the address so that coming back does not ask again */
  box.querySelector('#nyOther').onclick=()=>{ginfoShut();
    try{history.replaceState(null,'',location.pathname);}catch(_){}
    const ev=EVENTS.find(e=>e.id===night);if(ev&&S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}};
  /* back to the sign-in: this phone is signed out, and the link opens again as for anyone who has not confirmed a number */
  box.querySelector('#nyNumber').onclick=async()=>{await BUBL.auth.signOut();S.guestName='';S.guestPhone='';S.guestEmail='';
    ginfoShut();openOfferLink();};
}
async function openOfferLink(){
  let token=null;try{token=new URLSearchParams(location.search).get('v');}catch(_){}
  if(!token)return false;
  const v=await BUBL.call('guest','offer',{token});
  if(!v.ok){toast(OFFER_SAYS[v.code]||v.reason);return false;}
  if(v.status==='not_yours'){offerNotYours(token,v);return true;}
  if(v.status!=='open'){toast(v.status==='taken'?OFFER_SAYS.offer_taken:OFFER_SAYS.link_inactive);return false;}
  const ev=EVENTS.find(e=>e.id===v.service),t=T(v.table_key);
  if(!ev||!t){toast('This link is for a night that is not open yet.');return false;}
  if(S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}
  S.party=v.party_size;OFFER={token,table:t.id,view:v};
  openGinfo(t);
  /* the card says the link's own terms: its price for this table, and what is paid up front. Where the link is for
     one number, only once that number is confirmed: until then the card names the night and the party, and no price */
  $('#ginfoHed').textContent='Your table: '+t.name;
  $('#ginfoSum').innerHTML=v.number_needed?`<span>${esc(ev.short)}, ${v.party_size} guests</span><b></b>`
    :`<span>${esc(ev.short)}, ${v.party_size} guests, ${v.settled_on_the_night?'settled on the night':AED(v.deposit_minor)+' to secure it'}</span><b>${AED(v.minimum_minor)} min</b>`;
  return true;
}
