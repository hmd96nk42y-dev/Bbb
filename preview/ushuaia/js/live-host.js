/* The host's page, from what the back end holds (test and live mode).
   Sk's host screens are drawn by the same code as before (host.js, deposit.js, price-points.js). This file is what
   feeds them: every few seconds, and after every action, it asks the back end for the table as it stands (who has
   opened a link, who has joined, who has paid, what is left to assign, when the hold runs out) and puts that in the
   page's own terms. Nothing is simulated: no guest arrives, pays or confirms unless a real phone did it. */

/* the address a guest opens for a link: this page, with the link's token */
function inviteUrl(token){const u=new URL('./',location.href);u.search='?i='+encodeURIComponent(token);u.hash='';return u.host+u.pathname+u.search;}

/* ---- the host's table as the back end has it, put in the page's own terms ---- */
let hostT=null,hostBusy=false;
function hostWatch(){clearInterval(hostT);hostSync();hostT=setInterval(()=>{if(!document.hidden&&MINE.id)hostSync();},5000);}
function hostStop(){clearInterval(hostT);hostT=null;MINE.id=null;MINE.view=null;}
async function hostSync(){
  if(!MINE.id)return;const id=MINE.id,v=await BUBL.hostView({booking_id:id});if(MINE.id!==id)return;
  if(!v.ok){if(v.code==='not_found'||v.code==='not_host')leaveTable('This table is no longer held for you.');return;}
  const st=v.booking.state;
  if(st==='released'||st==='cancelled'||st==='no_show'||st==='closed'){leaveTable(st==='released'?(MINE.payNow?'The table was not paid for in time, so it is open again. Nothing was charged.':'The hold ran out and the table was released. Nothing was charged.'):'This booking has ended.');return;}
  applyHostView(v);
}
function applyHostView(v){
  MINE.view=v;const b=v.booking,host=v.host,tot=b.deposit_minor||0;
  MINE.state=b.state;MINE.depositMinor=b.deposit_minor;MINE.payNow=!!b.pay_now;S.bookMin=b.minimum_minor||0;S.party=b.party_size||S.party;
  S.holdUntil=b.hold_expires_at?Date.parse(b.hold_expires_at):0;
  const main=v.links.find(l=>l.main),points=v.links.filter(l=>!l.main&&!(l.closed&&!l.claimed));
  const bySeat=(a,c)=>a.seat_no-c.seat_no,mainGuests=(main?main.guests:[]).slice().sort(bySeat),linkGuests=[].concat(...points.map(l=>l.guests.slice().sort(bySeat)));
  const hostPaid=host.share_minor>0&&host.paid_minor>=host.share_minor;
  /* who has joined: the invite's list and the "x of y confirmed" figures */
  const joined=mainGuests.concat(linkGuests),sig=joined.map(g=>g.seat_no+':'+g.name).join('|');
  if(sig!==MINE.sig){const first=MINE.sig==null,had=new Set((MINE.sig||'').split('|'));MINE.sig=sig;S.guests=joined.map(g=>g.name);paintJoined(joined,b);
    if(!first)joined.forEach(g=>{if(!had.has(g.seat_no+':'+g.name))toast(`${g.name} claimed their spot`);});}
  DEP.lg=linkGuests.length;DEP.pct=b.minimum_minor?Math.round(tot/b.minimum_minor*100):RULES.depOpts[0];
  const drafts=DEP.links.filter(l=>!l.on);
  if(b.pay_now&&!hostPaid){   /* a late table not yet paid: Sk's "Pay now to confirm" card. No hold, no split. */
    DEP.sent=false;DEP.how='';DEP.shares=[];DEP.paid={};DEP.amts=[];MINE.owes=host.share_minor;DEP.links=[];
  }else if(points.length){   /* price points: one link per price */
    DEP.sent=true;DEP.how='links';MINE.owes=hostPaid?0:host.share_minor;DEP.hostCovered=b.left_to_assign_minor===0&&hostPaid;
    DEP.links=points.map(l=>({amt:l.amount_minor||0,n:l.seats,on:true,id:l.token,linkId:l.id,
      gs:l.guests.slice().sort(bySeat).map(g=>({n:g.name,st:g.card||g.paid_minor>0?'paid':'confirmed',seat:g.seat_no,remind:!!g.reminders_on})).concat((l.opened||[]).map(o=>({n:o.name,st:'opened'}))),
      remind:l.guests.some(g=>g.reminders_on)})).concat(drafts);
  }else if(b.assigned_minor>0){   /* "Split deposit", or the host took it all on */
    const open=main?main.open_seats:0,openEach=open?(main.amount_minor!=null?main.amount_minor:Math.floor((b.assigned_minor-host.share_minor-mainGuests.reduce((a,g)=>a+g.share_minor,0))/open)):0;
    DEP.amts=[host.share_minor].concat(mainGuests.map(g=>g.share_minor),Array(open).fill(openEach));
    DEP.paid={};DEP.paid[0]=hostPaid;mainGuests.forEach((g,i)=>{DEP.paid[i+1]=!!g.card||g.paid_minor>0;});
    DEP.seats=[host.seat_no].concat(mainGuests.map(g=>g.seat_no));DEP.remind=mainGuests.some(g=>g.reminders_on);
    DEP.shares=DEP.amts.map(a=>tot?a/tot*100:0);DEP.sent=true;MINE.owes=0;DEP.links=drafts;
    DEP.how=host.share_minor===tot&&DEP.amts.slice(1).every(a=>!a)?'host':'even';
  }else{DEP.sent=false;DEP.how='';DEP.shares=[];DEP.paid={};DEP.amts=[];MINE.owes=0;DEP.links=drafts;}
  /* the table is confirmed the moment the back end says so: the QR unlocks */
  const ok=b.state==='confirmed'||b.state==='arrived'||b.state==='seated';
  if(ok&&!HN.confirmed){HN.confirmed=true;DEP.open=false;toast('Deposit received. Your table is confirmed.');
    BUBL.me().then(r=>{const mine=r.ok&&(r.bookings||[]).find(x=>x.booking_id===MINE.id);if(mine)MINE.entryToken=mine.entry_token;hostTransition(()=>becomeHost());});}
  if(!DEP.open||!depSecured())depRender();depHold();hnRefresh();hnTabs();
  if(openSheetEl&&openSheetEl.id==='depSheet')ppRender();
  const sm=$('#selMeta');if(sm)sm.textContent=b.state==='requested'?`requested for ${S.ev.short}, the team confirms the minimum`:`${ok?'confirmed':b.pay_now?'pay now to confirm':'held'} for ${S.ev.short}, ${AED(S.bookMin)} minimum`;
}
/* "Guests joined 2 of 5" and the list under it, from the real seats */
function ago(iso){const m=Math.max(0,Math.round((Date.now()-Date.parse(iso))/60000));return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:`${Math.round(m/1440)} d ago`;}
function paintJoined(joined,b){
  const tot=Math.max(1,(b.party_size||S.party||2)-1),n=joined.length,feed=$('#gfeed');if(!feed)return;
  feed.innerHTML=n?joined.map(g=>`<div class="grow"><span class="gav">${esc((g.name||'?')[0])}</span><span class="gnm">${esc(g.name||'')}</span><span class="gwh">${g.claimed_at?ago(g.claimed_at):''}</span></div>`).join(''):'<p class="gempty">Waiting for your guests to claim their spots</p>';
  $('#pfill').style.width=`${Math.min(100,n/tot*100)}%`;
  const lab=$('#glab');if(n>=tot){lab.textContent='Your table is complete';lab.classList.add('done');}else{lab.classList.remove('done');lab.innerHTML=`Guests joined <span id="gj">${n}</span> of <span id="gt">${tot}</span>`;}
}
/* the table stopped being this guest's: back to the room */
function leaveTable(msg){
  hostStop();MINE.sig=null;unbecomeHost();S.boothId=null;S.pick=null;S.view=null;S.holdUntil=0;dollPost({cmd:'book',id:null});dollPost({cmd:'clear'});
  $('#selSum').classList.remove('show');$('#minSpend').hidden=true;hideInvite();renderRoom();if(msg)toast(msg);
}

/* ---- every button on the deposit card, sent to the back end ---- */
async function depActLive(b){
  if(hostBusy||!MINE.id)return;hostBusy=true;const id=MINE.id,has=c=>b.classList.contains(c),k=b.dataset.pp;let r=null,pay=null;
  try{
    if(b.dataset.dp&&MINE.payNow){   /* a late table: the other deposit option means letting this card form go and opening one for the new amount */
      if(+b.dataset.dp!==DEP.pct){const t=T(S.boothId),x=await BUBL.abandon({booking_id:id});
        if(x.ok){hostStop();MINE.id=null;MINE.sig=null;await bookLate(t,+b.dataset.dp,true);}else toast(x.reason);}
      return;}
    if(b.dataset.dp){if(+b.dataset.dp!==DEP.pct)r=await BUBL.depositOption({booking_id:id,deposit_pct:+b.dataset.dp/100});}
    /* after the cut-off the one button reads "Pay … now": it pays, it does not split (DECISIONS question 59) */
    else if(has('dep-all')){if(!MINE.payNow)r=await BUBL.payItAll({booking_id:id});pay='The table’s deposit';}   /* a late table already owes the whole deposit on the host's own seat */
    else if(has('dep-split')){r=await BUBL.split({booking_id:id});if(r.ok)toast(`Split ${r.shares_minor.length} ways. Every invite now asks for ${AED(r.shares_minor[0])}.`);}
    else if(has('dep-pay')){pay='Your part of the deposit';}
    else if(has('dep-cover')&&!k){r=await BUBL.payItAll({booking_id:id});pay='Everything still unpaid';}
    else if(k==='cover'){r=await BUBL.cover({booking_id:id});pay='Left to assign';}
    else if(k==='all'){r=await BUBL.payItAll({booking_id:id});pay='Everything still unpaid';}
    else if(has('dep-reset')){r=await BUBL.reset({booking_id:id});
      if(r.ok){DEP.links=[];const j=r.joined_guests||0;toast(j?`Split reset. Every card hold is cancelled. The ${j} ${j===1?'guest who joined keeps their seat':'guests who joined keep their seats'} and accept their new amount.`:'Split reset. Every card hold is cancelled.');}}
    else if(has('dep-rm')||k==='rm'){   /* WhatsApp reminders: for each guest who has joined and not yet paid */
      const l=k==='rm'?DEP.links[+b.dataset.i]:null,on=l?!l.remind:!DEP.remind;
      const seats=l?l.gs.filter(g=>g.st==='confirmed').map(g=>g.seat):(DEP.seats||[]).filter((s,i)=>i>0&&!DEP.paid[i]);
      for(const s of seats){const x=await BUBL.reminders({booking_id:id,seat_no:s,on});if(!x.ok){r=x;break;}}
      if(!r)toast(on?'WhatsApp reminders on. They stop once each guest pays.':'WhatsApp reminders off');}
    if(r&&!r.ok){toast(r.reason);pay=null;}
    await hostSync();
    if(pay)await payLive(pay);
  }finally{hostBusy=false;}
}
/* a price point's Confirm, Copy and Share */
async function ppActLive(b,l,k){
  if(!l)return;
  if(k==='ok'){if(hostBusy||l.on)return;hostBusy=true;b.disabled=true;
    const r=await BUBL.pricePoint({booking_id:MINE.id,amount_minor:l.amt,seats:l.n});hostBusy=false;
    if(!r.ok){b.disabled=false;toast(r.reason);return;}
    DEP.links=DEP.links.filter(x=>x!==l);copyLink(inviteUrl(r.token));
    toast(l.amt?`Link for ${AED(l.amt)} each is live and copied. Send it to the ${l.n} ${l.n===1?'guest':'guests'} paying that.`:`Invite link is live and copied. ${l.n} ${l.n===1?'guest joins':'guests join'} free.`);
    await hostSync();return;}
  const u='https://'+ppUrl(l);
  if(k==='copy'){copyLink(ppUrl(l));toast('Link copied');}
  else if(k==='share'){if(navigator.share)navigator.share({title:'Join my table',text:l.amt?`Join my table at ${PAGE.venue.name}. Your part is ${AED(l.amt)}.`:`Join my table at ${PAGE.venue.name}.`,url:u}).catch(()=>{});else{copyLink(ppUrl(l));toast('Link copied');}}
}

/* ---- the card step ---- */
async function payLive(title){
  const r=await BUBL.pay({booking_id:MINE.id});
  if(!r.ok){if(r.code!=='nothing_owed')toast(r.reason);await hostSync();return;}
  openPayLive(r,{title,sub:`${T(S.boothId).name}, ${S.ev.short}`,held:!MINE.payNow,onDone:()=>hostSync(),onCancel:()=>hostSync()});
}

/* ---- coming back to the page: the table is still there ---- */
async function restoreMine(){
  const r=await BUBL.me();if(!r.ok||!r.guest)return;
  S.guestName=r.guest.full_name;S.guestPhone=r.guest.phone_e164;S.guestEmail=r.guest.email;
  LT.mine=r.tickets||[];tixNight();   /* my tickets (live-tickets.js) */
  if(window.lcWelcome)lcWelcome(r);   /* a guest BUBL knows is welcomed back, with their real history (member.js) */
  const b=(r.bookings||[]).find(x=>x.role==='host'&&EVENTS.some(e=>e.id===x.service)&&T(x.table.key));if(!b)return;
  const ev=EVENTS.find(e=>e.id===b.service);if(S.ev!==ev){applyEvent(ev);buildEvents();setLbl('#pkDate',ev.short);}
  S.party=b.party_size;if(window.paintGuests)paintGuests();
  bookLive(T(b.table.key),b,false);
}
