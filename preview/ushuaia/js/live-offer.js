/* ================= a VIP link (test and live) =================
   The venue's team makes a VIP link in OPS for one guest: one table on one night, the table's price in that link and
   what is paid up front, anything from nothing to the whole minimum (BUILD_SPEC section 6, question 28).
   The link opens this page (…/?v=<token>) on that night with Sk's own hold card for that table, showing the link's
   terms. The guest gives their own details and proves their number as on any table; "Hold" then takes the link
   instead of making an ordinary hold. From there the page is the host's, as for any table. */
let OFFER=null;
const OFFER_SAYS={link_invalid:'This link is not valid.',link_inactive:'This link is no longer active.',offer_taken:'This link has already been used.',taken:'This table has just been taken. Please contact the venue.'};
async function openOfferLink(){
  let token=null;try{token=new URLSearchParams(location.search).get('v');}catch(_){}
  if(!token)return false;
  const v=await BUBL.call('guest','offer',{token});
  if(!v.ok){toast(OFFER_SAYS[v.code]||v.reason);return false;}
  if(v.status!=='open'){toast(v.status==='taken'?OFFER_SAYS.offer_taken:OFFER_SAYS.link_inactive);return false;}
  const ev=EVENTS.find(e=>e.id===v.service),t=T(v.table_key);
  if(!ev||!t){toast('This link is for a night that is not open yet.');return false;}
  if(S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}
  S.party=v.party_size;OFFER={token,table:t.id,view:v};
  openGinfo(t);
  /* the card says the link's own terms: its price for this table, and what is paid up front */
  $('#ginfoHed').textContent='Your table: '+t.name;
  $('#ginfoSum').innerHTML=`<span>${esc(ev.short)}, ${v.party_size} guests, ${v.settled_on_the_night?'settled on the night':AED(v.deposit_minor)+' to secure it'}</span><b>${AED(v.minimum_minor)} min</b>`;
  return true;
}
