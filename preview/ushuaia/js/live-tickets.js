/* Tickets, for real (test and live mode).
   Sk's ticket sheet is unchanged: the night, the ticket cards, one per person, "Your details", the pay sheet, the
   ticket with its QR, and the ticket holder's panel on the main screen. What sits behind it is now real:
     - which tickets a night has, and each one's price right now, come from the venue's own data (a fixed price, or
       the wave on sale at this moment). A ticket that cannot be bought is shown off, with why;
     - the phone is proven with a login code and BUBL's server checks the name, exactly as for a table;
     - tapping pay keeps one place for the guest for the venue's few minutes, at that price. The card is charged
       the moment the bank approves it, and only then does the ticket exist: its QR is the ticket's own code;
     - coming back to the page, the ticket is still there.
   Three things from the build are not shown here, because nothing real stands behind them yet: the drop-down text
   message, "Share this night" with its free drink, and the invite code (DECISIONS question 57).
   How each ticket LOOKS (its colours, its badge, its two lines) is this skin's; what it is called and what it costs
   is the venue's. */
const TK_LOOK={
  early:{cls:'',ic:'GA',small:'General admission',floor:true,lis:t=>['General admission, standing',t.valid_until?`Entry <b>before ${esc(t.valid_until)}</b> only`:'Entry any time from doors']},
  second:{cls:'ember',ic:'GA',small:'General admission',floor:true,lis:()=>['General admission, standing','Entry any time from doors']},
  vip_standing:{cls:'gild',ic:'V',small:'VIP standing',floor:false,lis:()=>['Standing in the VIP area','Entry any time from doors']}};
const tkLook=t=>TK_LOOK[t.key||t.type]||{cls:'',ic:'GA',small:t.label,floor:false,lis:()=>[esc(t.sub||t.label)]};
/* a ticket that only gets you in until a time says that time, from the venue's rule, so the card and the rule agree */
const tkSub=t=>t.valid_until?`Before ${t.valid_until}`:(t.sub||'');
const LT={pick:null,mine:[],watch:null};
const tkRef=t=>'US-'+String(t.ticket_id).replace(/-/g,'').slice(0,6).toUpperCase();
const tkMine=()=>LT.mine.find(t=>t.service===S.ev.id&&(t.state==='issued'||t.state==='scanned'))||null;
const tkFrom=ev=>{const on=(ev.ga||[]).filter(t=>t.on_sale&&t.price_minor!=null).map(t=>t.price_minor);return on.length?Math.min(...on):null;};
const tkAge=()=>PAGE.venue.min_age?`${PAGE.venue.min_age}+, `:'';

/* the line under "Buy tickets", and whether the button is there at all, for the night on screen */
function tixNight(){
  const ev=S.ev,row=$('.tix-row'),ts=$('#tixSub'),has=!!(ev.ga&&ev.ga.length);if(row)row.style.display=has?'':'none';
  if(ts&&has)ts.textContent=ev.from!=null?`From ${AED(ev.from)}. ${tkAge()}original Emirates ID or passport at the door.`
    :(ev.ga.every(t=>t.why==='sold_out')?'Tickets for this night are sold out.':'Tickets for this night are not on sale yet.');
  tix.done=tkMine()?tkRef(tkMine()):null;showTixBlockLive(false);
}
/* the venue's page is asked again, so the prices are the ones on sale now */
async function tkRefresh(){const r=await BUBL.venue();if(!r.ok||!r.tickets)return;EVENTS.forEach(e=>{e.ga=r.tickets[e.id]||[];e.from=tkFrom(e);});tixNight();}
/* my own tickets, from the back end */
async function tkSync(){const r=await BUBL.me();if(r.ok)LT.mine=r.tickets||[];tixNight();return tkMine();}

function renderTixLive(){
  const step=tixStep();if(step){renderTixPick(step);return;}
  const ev=S.ev,types=ev.ga||[],mine=tkMine();
  $('#tixHead').innerHTML=`<span class="tier vvip" style="color:var(--acc)"><i></i>Entry</span><h3>${esc(ev.short)}</h3><div class="dj-sub" style="margin-top:6px">${fmtD(dOf(S.date))}, doors ${ev.doors}${mine?'':' <button class="tpk-chg" id="tkChg" type="button">Change</button>'}</div>`;
  const chg=$('#tkChg');if(chg)chg.addEventListener('click',()=>{tix.edit='date';renderTix();});
  if(mine){const lk=tkLook(mine);
    $('#tixBody').innerHTML=`
    <div class="tkt${lk.cls==='gild'?' gild':''} done"><span class="grid"></span>
      <div class="tkt-main"><div class="tkt-top"><span class="tkt-ic">${lk.ic}</span><span class="tkt-name">Admit 1</span></div>
        <div class="dj-sub" style="margin-top:6px;color:rgba(255,255,255,.8)">${esc(ev.short)}, ${fmtD(dOf(S.date))}, doors ${ev.doors}</div>
        <span class="tk-qr">${BUBL.qr.plain(BUBL.qr.payload('ticket',mine.qr_token),150)}</span>
        <div class="tk-ref">REF ${tkRef(mine)}</div>
        <ul><li><i></i><span>1 × ${esc(mine.label)}.</span></li>
        <li><i></i><span>Show this at the door with your original Emirates ID or passport. ${tkAge()}no re-entry.</span></li></ul></div>
      <div class="tkt-stub"><span class="tkt-adm">USHUAÏA</span><span class="tkt-adm">ENTRY</span></div>
    </div>
    <button class="btn pri full" id="tkDone" type="button" style="margin-top:14px">Done</button>`;
    $('#tkDone').addEventListener('click',()=>closeSheet());return;}
  if(!types.some(t=>t.key===LT.pick&&t.on_sale))LT.pick=(types.find(t=>t.on_sale)||{}).key||null;
  const sel=types.find(t=>t.key===LT.pick)||null;
  $('#tixBody').innerHTML=types.map(t=>{const lk=tkLook(t),off=!t.on_sale,on=sel&&sel.key===t.key;
    return `<div class="tkt ${lk.cls}"><span class="grid"></span>
    <div class="tkt-main">
      <div class="tkt-top"><span class="tkt-ic">${lk.ic}</span><span class="tkt-name">${esc(t.label)}</span></div>
      <div class="tkt-price">${t.price_minor!=null?`<b>${AED(t.price_minor)}</b>`:''}<span>${esc(tkSub(t))}</span></div>
      <ul>${lk.lis(t).map(l=>`<li class="${off?'off':''}"><i></i><span>${l}</span></li>`).join('')}</ul>
      ${off?`<p class="tk-h">${t.why==='sold_out'?'Sold out.':'Not on sale yet.'}</p>`:''}
    </div>
    <div class="tkt-stub"><span class="tkt-adm">ADMIT</span><div class="vstep tk-one"><button type="button" data-k="${esc(t.key)}" ${off||on?'disabled':''} aria-label="Choose this ticket">${on?'✓':'+'}</button><b>${on?1:0}</b></div></div>
  </div>`;}).join('')+
    `<div class="tk-sum"><b>${sel?AED(sel.price_minor):AED(0)}</b><span>One per person<br>${tkAge()}original ID</span></div>
    <button class="btn red full" id="tkBuy" type="button" ${sel?'':'disabled'}>Buy tickets, ${sel?AED(sel.price_minor):AED(0)}</button>`;
  $$('#tixBody .vstep button').forEach(b=>b.addEventListener('click',()=>{LT.pick=b.dataset.k;renderTix();}));   /* one ticket per person: choosing a type swaps it */
  $('#tkBuy').addEventListener('click',()=>{if(!sel)return;
    openDetails({title:'Tickets',sub:`${ev.short}, ${fmtD(dOf(S.date))}, admit 1`,name:S.guestName||'',email:S.guestEmail||'',
      ticket:{service:ev.id,ticket:sel.key},
      onStart:r=>openPayLive(r,{title:'Tickets',sub:`${(S.guestName||'').split(' ')[0]}, ${ev.short}, admit 1`,held:false,onDone:tkPaid})});});
}
/* The bank has approved. The ticket exists once the charge has gone through: usually at once; where a processor
   answers a little later, the page keeps asking and says so. */
async function tkPaid(){
  let t=null;for(let i=0;i<6&&!t;i++){t=await tkSync();if(!t)await new Promise(z=>setTimeout(z,1000));}
  if(!t){toast('Your payment is approved. Your ticket will appear here in a moment.');
    clearInterval(LT.watch);let n=0;LT.watch=setInterval(async()=>{if(await tkSync()||++n>24){clearInterval(LT.watch);if(tkMine()){renderTix();showTixBlockLive(true);}}},5000);return;}
  flash();renderTix();
  setTimeout(()=>{try{closeSheet();}catch(_){}showTixBlockLive(true);},1700);   /* back to the main screen, with the ticket holder's panel */
}

/* "Continue to payment" on Your details: the number is checked for its country, the phone is proven with a code
   (inside the same sheet), the server checks the name, and the place is kept. */
async function detailsGoLive(sh,o,shut){
  if(sh.__busy||sh.__code)return;
  const q=s=>sh.querySelector(s),er=q('.pay-err'),go=q('.td-go'),say=m=>{er.textContent=m;er.hidden=false;};
  const nm=q('#tdName').value.trim().replace(/\s+/g,' '),em=q('#tdEm').value.trim(),tel=q('#tdTel').value.trim();
  if(nm.length>=2&&nameCheck(nm)==='blocked')return say(NAME_BLOCKED);
  if(nm.length<2||!tel||!emailOk(em))return say('Add your full name, a mobile number and your email.');
  const ph=BUBL.phone.parse(tel,q('#tdCc').value);if(!ph.ok)return say(ph.reason);
  sh.__busy=true;go.disabled=true;const label=go.textContent;go.textContent='One moment';
  let box=q('#tdCode');if(!box){box=ce('div','ip-step');box.id='tdCode';box.style.marginTop='14px';er.insertAdjacentElement('beforebegin',box);}
  const ui=sh.__ui={codeBox:box,verifyBtn:go,show:on=>{sh.__code=on;['.id-note','#tdName','.td-row','#tdEm'].forEach(s=>{const e=q(s);if(e)e.style.display=on?'none':'';});
    box.style.display=on?'':'none';er.hidden=true;go.textContent=on?label:'One moment';go.disabled=true;}};
  const idle=()=>{sh.__busy=false;go.disabled=false;go.textContent=label;};
  const who=await provePhone({name:nm,phone:ph.e164,email:em},ui);
  if(!sh.isConnected)return;                    /* the guest closed the sheet meanwhile */
  if(who===null)return idle();                  /* "Use a different number" */
  if(!who.ok){idle();return say(who.reason);}
  S.guestName=who.guest.full_name;S.guestPhone=who.guest.phone_e164;S.guestEmail=who.guest.email;
  const r=await BUBL.payTicket(o.ticket);
  if(!sh.isConnected)return;
  if(!r.ok){idle();say(r.reason);if(r.code==='already_have_ticket')tkSync().then(()=>{shut();renderTix();});else if(r.code==='sold_out'||r.code==='not_on_sale'||r.code==='ticketing_off')tkRefresh();return;}
  shut();setTimeout(()=>o.onStart(r),300);
}

/* the ticket holder's panel on the main screen, for the night on screen */
function showTixBlockLive(scroll){
  const b=$('#tixBlock'),t=tkMine(),bt=$('#buyTix'),sp=bt&&bt.querySelector('span');if(!b)return;
  if(sp)sp.textContent=t?'Your ticket':'Buy tickets';
  if(!t){if(!b.hidden){b.hidden=true;b.classList.remove('on','now');b.innerHTML='';try{dollPost({cmd:'ga',on:false});}catch(_){}}return;}
  const ev=S.ev,first=(S.guestName||'').split(' ')[0]||'You',lk=tkLook(t),ref=tkRef(t);
  b.innerHTML=`<p class="vp-hello">Your ticket,</p><h2 class="vp-name">${esc(first)}</h2>
<div class="vp-card hn-card ok" style="--hc:#39FF14"><small>${esc(lk.small)} <em class="hn-badge ok">Confirmed</em></small><p class="vp-tier">Admit 1</p>
<div class="hn-meta"><span>${esc(ev.short)}</span><span>${esc(fmtD(dOf(S.date)))}</span><span>Doors ${esc(ev.doors)}</span></div><div class="vp-cardf"><span>1 × ${esc(t.label)}</span><span>${ref}</span></div></div>
<div class="hn-qrc">${BUBL.qr.tile(BUBL.qr.payload('ticket',t.qr_token))}<div><b>Your entry QR</b><p>Tap it to fill the screen at the ${lk.floor?'General Admission gate':'door'}. Bring your ID.</p><span class="hn-code">${ref}</span></div></div>
${lk.floor?`<div class="tk-where"><b>Where you go</b><p>General admission is the floor in front of the stage, lit green in the room below. Come in through the General Admission gate, bottom left of the venue.</p><button type="button" class="tk-show">Show me in the room</button></div>`:''}`;
  b.hidden=false;b.classList.add('on','now');if(lk.floor){try{dollPost({cmd:'ga',on:true});}catch(_){}}
  if(scroll){const a=$('#app');if(a)a.scrollTo({top:Math.max(0,b.offsetTop-70),behavior:'smooth'});}
}
