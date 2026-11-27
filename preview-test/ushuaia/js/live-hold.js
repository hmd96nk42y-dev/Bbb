/* Holding a table for real (test and live mode).
   Sk's form is unchanged: "Full name as on your ID", mobile number, email, the terms tick, "Hold my table".
   What happens behind the button is now real:
     1. a first look at the name and the email, and the mobile number checked for its own country;
     2. the phone is proven with a login code (Sk's six-box code screen, shown inside the same card);
     3. BUBL's server checks the name and saves the guest's own details, once;
     4. the table is held in the database: the minimum, the deposit and the deadline come back from there.
   Nothing here decides a price or a time. */
const GI={busy:false,code:false,ui:null};
function ginfoCodeMode(on){   /* swap the form's boxes for the code boxes, inside the same card, and back */
  GI.code=on;const card=$('.ginfo-card');
  ['.id-note','label[for=ginfoName]','#ginfoName','label[for=ginfoPhone]','#ginfoPhone','label[for=ginfoEmail]','#ginfoEmail','#ginfoTcRow'].forEach(s=>{const e=card.querySelector(s);if(e)e.style.display=on?'none':'';});
  let box=$('#ginfoCode');if(!box){box=ce('div','ip-step');box.id='ginfoCode';box.style.marginTop='14px';$('#ginfoErr').insertAdjacentElement('beforebegin',box);}
  box.style.display=on?'':'none';$('#ginfoErr').classList.remove('show');return box;
}
function ginfoSay(msg,field){const e=$('#ginfoErr');e.textContent=msg;e.classList.add('show');if(field){const el=$({full_name:'#ginfoName',phone:'#ginfoPhone',email:'#ginfoEmail'}[field]);if(el)el.classList.add('err');}}
function ginfoIdle(label){GI.busy=false;const c=$('#ginfoCta');c.disabled=false;c.textContent=label;}
function ginfoShut(){if(GI.ui&&GI.ui.cancel)GI.ui.cancel();ginfoCodeMode(false);GI.busy=false;$('#ginfoModal').classList.remove('show');if(typeof offerNotYoursShut==='function')offerNotYoursShut();}
/* what the back end said, in the guest's words: most refusals already are a sentence fit to show */
const HOLD_SAYS={taken:'That table was just taken. Pick another one.',sign_up_needed:'Add your name and email first.',pending_hold_limit:'You already have a table waiting for its deposit. Settle that one first.',
  table_limit:'This number already has a table on this night.',not_on_sale:'This night is not on sale.',booking_closed:'Online booking has closed for this night.',ended:'This night is over.'};
/* The form names only what is still missing (Sk, 26 Nov 2026: "Tick the box to accept the terms"), never the whole list. */
function ginfoMissing(name,phone,email,terms){
  const w=[];if(name)w.push('name');if(phone)w.push('number');if(email)w.push('email');
  if(!w.length)return terms?'Tick the box to accept the terms.':'';
  if(w.length===1&&!terms)return name?'Add your full name, as on your ID.':phone?'Add your mobile number.':'Add your email address.';
  const list=w.length===1?w[0]:w.slice(0,-1).join(', ')+' and '+w[w.length-1];
  return 'Add your '+list+(terms?', and tick the box to accept the terms.':'.');
}
async function liveHoldCta(){
  if(GI.busy||GI.code)return;const t=_pending;if(!t)return;
  const label=$('#ginfoCta').textContent;
  const n=$('#ginfoName').value.trim().replace(/\s+/g,' '),p=$('#ginfoPhone').value.trim(),em=$('#ginfoEmail').value.trim(),tc=$('#ginfoTc').checked,nv=nameCheck(n),eok=emailOk(em);
  const ph=BUBL.phone.parse(p);
  $('#ginfoName').classList.toggle('err',!n||nv==='blocked');$('#ginfoPhone').classList.toggle('err',!ph.ok);$('#ginfoEmail').classList.toggle('err',!eok);
  if(n&&nv==='blocked')return ginfoSay(NAME_BLOCKED);
  if(!n||!p||!eok||!tc)return ginfoSay(em&&!eok?'Check your email address.':ginfoMissing(!n,!p,!em,!tc));
  if(!ph.ok)return ginfoSay(ph.reason);
  GI.busy=true;const cta=$('#ginfoCta');cta.disabled=true;cta.textContent='One moment';
  GI.ui={codeBox:ginfoCodeMode(false),verifyBtn:cta,show:on=>{ginfoCodeMode(on);cta.textContent=on?label:'One moment';cta.disabled=true;}};
  const who=await provePhone({name:n,phone:ph.e164,email:em},GI.ui);
  if(!$('#ginfoModal').classList.contains('show')||_pending!==t)return;   /* the guest closed the card meanwhile */
  if(who===null)return ginfoIdle(label);                                   /* "Use a different number" */
  if(!who.ok){ginfoIdle(label);return ginfoSay(who.reason,who.field);}
  S.guestName=who.guest.full_name;S.guestPhone=who.guest.phone_e164;S.guestEmail=who.guest.email;
  /* a table opened from a VIP link is taken on the link's own terms (live-offer.js) */
  const offer=typeof OFFER!=='undefined'&&OFFER&&OFFER.table===t.id?OFFER:null;
  const r=offer?await BUBL.call('guest','offer-accept',{token:offer.token}):await BUBL.hold({table:t.id,service:S.ev.id,party_size:S.party,deposit_pct:RULES.depOpts[0]/100});
  if(offer&&!r.ok){ginfoIdle(label);
    /* the number they confirmed is not the one the link was sent to: Sk's own screen (live-offer.js) */
    if(r.code==='offer_not_yours'){const again=await BUBL.call('guest','offer',{token:offer.token});return offerNotYours(offer.token,again.ok&&again.status==='not_yours'?again:{venue:offer.view.venue,service:offer.view.service});}
    return ginfoSay(OFFER_SAYS[r.code]||HOLD_SAYS[r.code]||r.reason);}
  if(offer)OFFER=null;
  if(!r.ok){ginfoIdle(label);
    if(r.code==='pay_now_only'){S.ev.late=true;}   /* the cut-off passed while the form was open: the table is booked by paying straight away */
    else return ginfoSay(HOLD_SAYS[r.code]||r.reason);}
  _pending=null;ginfoShut();ginfoIdle(label);
  if(r.ok)bookLive(t,{booking_id:r.booking_id,state:r.state,minimum_minor:r.minimum_minor,deposit_minor:r.deposit_minor,hold_expires_at:r.hold_expires_at,invitation_token:r.invitation_token,party_size:S.party,pay_now:!!r.pay_now},true);
  else bookLate(t);
}
/* The table is the guest's in the database: the page becomes the host's, from what the back end holds. */
const MINE={id:null,state:null,token:null,payNow:false,view:null,depositMinor:null,seat:null,entryToken:null};
function bookLive(t,b,fresh){
  MINE.id=b.booking_id;MINE.state=b.state;MINE.token=b.invitation_token||null;MINE.payNow=!!b.pay_now;MINE.depositMinor=b.deposit_minor;MINE.entryToken=b.entry_token||null;MINE.seat=b.my_seat||null;
  S.party=b.party_size||S.party;S.boothId=t.id;S.bookMin=b.minimum_minor||0;S.pick=null;S.autoConfirmed=false;S.view=null;
  S.bookedAt=Date.now();S.holdUntil=b.hold_expires_at?Date.parse(b.hold_expires_at):0;
  HN.confirmed=b.state==='confirmed'||b.state==='arrived'||b.state==='seated';
  dollPost({cmd:'book',id:t.id});if(fresh)flash();renderRoom();
  $('#selSum').classList.add('show');$('#selName').textContent=t.name;
  /* a late table being paid for is not a hold, and is never called one (Sk, 17 Nov 2026) */
  $('#selMeta').textContent=b.state==='requested'?`requested for ${S.ev.short}, the team confirms the minimum`:`${HN.confirmed?'confirmed':MINE.payNow?'pay now to confirm':'held'} for ${S.ev.short}, ${AED(S.bookMin)} minimum`;
  showInvite(t);
  if(fresh)toast(b.state==='requested'?`${t.name} requested. The team will confirm it with you.`:HN.confirmed?`${t.name} is confirmed.`:MINE.payNow?`Pay the deposit now to confirm ${t.name} and unlock your entry QR.`:`${t.name} is held for you. Pay the deposit to confirm it and unlock your entry QR.`);
  if(fresh)setTimeout(()=>hostTransition(becomeHost),260);else becomeHost();
  hostWatch();
  if(PAGE.modules.includes('table_votes')){$('#minSpend').hidden=false;if(window.vtRender)vtRender();}   /* the table's song vote (votes.js); the spend figures of that section stay hidden */
  if(!fresh)BUBL.call('guest','change-request',{booking_id:b.booking_id,look:true}).then(c=>{HN.chgReq=!!(c.ok&&c.request&&c.request.state==='pending');});   /* a table change already asked for is still with the team */
  if(typeof sxAfterBook==='function')sxAfterBook(t);   /* public tables: the table is handed to those screens; "Hold and go public" opens its sheet */
}
/* After the cut-off there is no hold and no split: the table is booked by paying the deposit in one go.
   The back end keeps the table for the venue's own few minutes while the host pays (never shown as a hold) and opens
   the card form; the page becomes the host's, with Sk's "Pay now to confirm" card. Paid: confirmed at once. Not paid
   in those minutes: the table opens up again and nothing is charged. pct: which of the venue's deposit options. */
async function bookLate(t,pct,again){
  const r=await BUBL.payNow({table:t.id,service:S.ev.id,party_size:S.party,deposit_pct:(pct||RULES.depOpts[0])/100});
  if(!r.ok){if(again)leaveTable(HOLD_SAYS[r.code]||r.reason);else toast(HOLD_SAYS[r.code]||r.reason);return false;}
  bookLive(t,{booking_id:r.booking_id,state:'held',minimum_minor:minFor(t,S.party),deposit_minor:r.share_minor,hold_expires_at:null,invitation_token:r.invitation_token,party_size:S.party,pay_now:true},!again);
  return true;
}
