/* ================= Roland · the host, working the harbour ================= */
(function(){
  /* live: every figure the team gives is the venue's own (its tiers, its tickets) or counted from real bookings;
     what BUBL cannot do yet (the menu, pre-orders, calling the team) is not offered. */
  const livePrices=()=>{const ts=Object.keys(TIERS).map(k=>TIERS[k]).filter(t=>!t.req&&t.min!=null),ex=ts.map(t=>t.extra).filter(Boolean);
    return ts.map(t=>`${t.label} is ${AED(t.min)} for ${t.cap}`).join(', ')+'.'+(ex.length?` Extra guests are ${AED(Math.min(...ex))}${Math.min(...ex)===Math.max(...ex)?'':` to ${AED(Math.max(...ex))}`} each, depending on the section.`:'');};
  const liveTickets=ev=>{const g=ev.ga||[];return g.length?g.map(t=>`${t.label} is ${t.on_sale&&t.price_minor!=null?AED(t.price_minor):t.why==='sold_out'?'sold out':'not on sale yet'}${t.valid_until?`, before ${t.valid_until}`:''}`).join('; ')+'. One ticket per person. Tap Buy tickets above the room.':`Tickets for ${ev.short} are not sold here.`;};
  const PRICE_LINE=LIVE?livePrices():`Backstage A is ${AED(30000)} for 12. VIP ${AED(18000)} for 12, Platinum ${AED(15000)} for 12, Gold ${AED(10000)} for 10, Silver ${AED(6000)} for 8. Extra guests are ${AED(750)} to ${AED(2500)} each, depending on the section.`;
  function busy(){const o=openCount(),tot=TABLES.filter(t=>!t.req).length,taken=tot-TABLES.filter(t=>!t.req&&tableOpen(t)).length;return {o,taken,tot,d:taken/tot>.6?'filling fast':'still plenty open'};}
  function recommend(){
    const p=S.party||6,cand=TABLES.filter(t=>!t.req&&fits(t,p)&&seeded(t.id));
    const within=BUD.on?cand.filter(t=>minFor(t,p)<=BUD.val):cand;
    const pool=within.length?within:cand;if(!pool.length)return null;
    const rank={bsA:5,vip:4,plat:3,gold:2,silver:1};
    const best=BUD.on?Math.max(...pool.map(t=>rank[t.tier])):Math.min(...pool.map(t=>rank[t.tier]));
    return pool.filter(t=>rank[t.tier]===best).sort((a,b)=>b.z-a.z)[0];
  }
  /* ---- the agent: understands what you're after, finds it, shows it in the room, acts on it ---- */
  const AG={last:null,list:[],idx:0,crit:null};
  const PLACES={dj:{x:0,z:780,l:'the DJ'},stage:{x:0,z:690,l:'the stage'},floor:{x:0,z:420,l:'the dance floor'},door:{x:0,z:-40,l:'the entrance'}};
  const RANK={bsA:5,bsB:5,bsC:5,vip:4,plat:3,gold:2,silver:1};
  function money(v,unit){v=parseFloat(String(v).replace(/,/g,''));if(isNaN(v))return 0;if(unit==='k'||v<1000)v*=1000;return Math.round(v)*UNIT;}   /* live: in the back end's minor units, like every price */
  function parseCrit(q){const c={};let m,qb=q;
    if((m=q.match(/(?:for|party of|group of|table of|we are|we re|there are|there s)\s+(\d{1,2})\b/))||(m=q.match(/\b(\d{1,2})\s*(?:people|guests|pax|persons|of us|friends|girls|guys)\b/))){c.party=Math.max(2,Math.min(16,+m[1]));qb=q.replace(m[0],' ');}
    if((m=qb.match(/between\s+(?:aed\s*)?(\d[\d,.]*)\s*(k)?\s*(?:and|to|-)\s*(?:aed\s*)?(\d[\d,.]*)\s*(k)?/))){c.min=money(m[1],m[2]||m[4]);c.max=money(m[3],m[4]);}
    else if((m=qb.match(/(?:aed\s*)?(\d[\d,.]*)\s*(k|thousand)?\b/))&&(m[2]||+String(m[1]).replace(/,/g,'')>=1000||/aed|budget|under|below|max|up to|around|about| at |spend|minimum|less than/.test(qb))){const v=money(m[1],m[2]?'k':null);if(v>=3000*UNIT)c.max=v;}
    if(/backstage|stage deck|ring a|behind the dj/.test(q))c.tier='bs';else if(/\bvip\b/.test(q))c.tier='vip';else if(/platinum|\bplat\b/.test(q))c.tier='plat';else if(/\bgold\b/.test(q))c.tier='gold';else if(/silver/.test(q))c.tier='silver';
    if(/\bleft\b/.test(q))c.side='left';else if(/\bright\b/.test(q))c.side='right';
    if(/\b(dj|booth|decks)\b/.test(q))c.near='dj';else if(/\bstage\b/.test(q)&&c.tier!=='bs')c.near='stage';else if(/dance ?floor|the crowd|the floor|middle|center|centre/.test(q))c.near='floor';else if(/entrance|door|exit|gate/.test(q))c.near='door';
    if(/closest|nearest|close to|near|next to|front row|right by|by the/.test(q)&&!c.near)c.near='dj';
    if(/cheapest|lowest|least expensive|most affordable|budget friendly/.test(q))c.order='cheap';else if(/most expensive|best|premium|top table|the best|biggest|exclusive/.test(q))c.order='best';else if(/quiet|far from|away from|chill|calm/.test(q))c.order='far';
    if(c.near&&!c.order)c.order='near';return c;}
  function wantsTable(q,c){if(/\b(cost|how much|price|prices|pricing)\b/.test(q)&&!c.near&&!c.order&&!c.max&&!c.party)return false;
    if(/\b(table|tables|seat|seats|booth|sofa|spot|place to sit|where should we sit)\b/.test(q)&&(c.near||c.order||c.max||c.tier||c.party||c.side||/\b(find|show|get|book|which|best|any|available|open|want|need|give)\b/.test(q)))return true;
    return !!c.tier&&!!(c.party||c.side||c.max||c.near||c.order||/\b(find|show|get|book|want|need|like|give|any|available|open)\b/.test(q));}
  function dist(t,p){return Math.hypot(t.x-p.x,t.z-p.z);}
  function search(c){const p=c.party||S.party||0;
    let cand=TABLES.filter(t=>!t.req&&seeded(t.id)&&(!p||fits(t,p)));
    if(c.tier)cand=cand.filter(t=>c.tier==='bs'?t.tier.charAt(0)==='b':t.tier===c.tier);
    if(c.side)cand=cand.filter(t=>t.side===c.side);
    if(c.max)cand=cand.filter(t=>minFor(t,p)<=c.max);
    if(c.min)cand=cand.filter(t=>minFor(t,p)>=c.min);
    const P=PLACES[c.near||'dj'];
    if(c.order==='cheap')cand.sort((a,b)=>minFor(a,p)-minFor(b,p)||dist(a,PLACES.dj)-dist(b,PLACES.dj));
    else if(c.order==='best')cand.sort((a,b)=>RANK[b.tier]-RANK[a.tier]||dist(a,PLACES.dj)-dist(b,PLACES.dj));
    else if(c.order==='far')cand.sort((a,b)=>dist(b,PLACES.dj)-dist(a,PLACES.dj));
    else if(c.near)cand.sort((a,b)=>dist(a,P)-dist(b,P));
    else if(c.max)cand.sort((a,b)=>(c.max-minFor(a,p))-(c.max-minFor(b,p))||dist(a,PLACES.dj)-dist(b,PLACES.dj));
    else cand.sort((a,b)=>RANK[b.tier]-RANK[a.tier]||dist(a,PLACES.dj)-dist(b,PLACES.dj));
    return cand;}
  function showTable(t,c,lead){AG.last=t;const p=c.party||S.party||0;
    if(c.party&&S.party!==c.party){S.party=c.party;try{paintGuests();syncDoll&&syncDoll();}catch(_){}}
    try{dollPost({cmd:'suggest',id:t.id});S.view='iso';paintVtog();}catch(_){}
    try{const a=$('#app'),rc=$('#roomCanvas');if(a&&rc)a.scrollTo({top:Math.max(0,rc.offsetTop-110),behavior:'smooth'});}catch(_){}
    try{window.__ushChips&&window.__ushChips();}catch(_){}
    const near=c.near?` to ${PLACES[c.near].l}`:'',d=Math.round(dist(t,PLACES[c.near||'dj'])*.23);
    const why=c.order==='cheap'?'The best-priced open table':c.order==='best'?'The best open table':c.order==='far'?'The calmest open table':c.near?`The closest open table${near}`:'Our pick';
    return `${lead||why}${c.max?` within ${AED(c.max)}`:''}${p?` for ${p}`:''}: ${t.name}, ${t.where.toLowerCase()}${c.near?`, about ${d} m from ${PLACES[c.near].l}`:''}. ${AED(minFor(t,p))} minimum. It's lit green in 3D. Tap it and we'll take you straight to booking${AG.list.length>1?`, or say "another" for the next of ${AG.list.length} options`:''}.`;}
  function agent(q){const c=parseCrit(q),booked=!!S.boothId;
    /* follow-ups on the last table we showed */
    if(AG.last&&(/\b(book it|hold it|take it|that one|lets do it|let s do it|go ahead|reserve it|yes please|book that|we ll take it)\b/.test(q)||q.indexOf('book '+AG.last.name.toLowerCase())>-1)){const t=AG.last;
      try{dollPost({cmd:'suggest',id:null});dollPost({cmd:'focus',zone:t.sec});setTimeout(()=>onPick(t.id),900);}catch(_){}return `Done. ${t.name} is open on the plan, check the details and hold it.`;}
    if(AG.list.length&&/\b(another|next one|next option|other one|something else|different one|show me more|more options)\b/.test(q)){AG.idx=(AG.idx+1)%AG.list.length;return showTable(AG.list[AG.idx],AG.crit,`Option ${AG.idx+1} of ${AG.list.length}`);}
    if(AG.last&&/\b(cheaper|less expensive|lower minimum|cheaper one)\b/.test(q)){const p=AG.crit.party||S.party||0,cc=Object.assign({},AG.crit,{max:minFor(AG.last,p)-1});const L=search(cc);if(!L.length)return `${AG.last.name} is already the best price that fits.`;AG.list=L;AG.idx=0;AG.crit=cc;return showTable(L[0],cc,'Cheaper');}
    if(AG.last&&/\b(closer|nearer)\b/.test(q)){const P=PLACES[AG.crit.near||'dj'],cur=dist(AG.last,P),cc=Object.assign({},AG.crit,{near:AG.crit.near||'dj',order:'near'});const L=search(cc).filter(t=>dist(t,P)<cur-1);if(!L.length)return `${AG.last.name} is the closest that fits${AG.crit.max?` within ${AED(AG.crit.max)}`:''}. Raise the budget and we can get you nearer.`;AG.list=L;AG.idx=0;AG.crit=cc;return showTable(L[0],cc,'Closer');}
    /* the rest of the night */
    if(/\b(buy|get|need|want|book)\b.*\btickets?\b|\btickets? for\b/.test(q)){if(LIVE){const g=S.ev.ga||[];if(g.length){try{openTix();}catch(_){}}return tix.done?`You already have your ticket, ${tix.done}. It's one per person.`:g.length?`Tickets are open. It's one per person: pick your ticket, add your details, then pay by card.`:`Tickets for ${S.ev.short} are not sold here.`;}
      try{openTix();}catch(_){}return tix.done?`You already have your ticket, ${tix.done}. It's one per person, so share your link and friends buy their own.`:`Tickets are open. It's one per person: pick your ticket, add your details, then pay with Apple Pay or card. Friends buy their own with your link.`;}
    if(!LIVE&&/\b(show|open|see)\b.*\bmenu\b|^ menu $/.test(q)){try{$('#menuBtn').click();}catch(_){}return `Here's the menu. Pre-order and you pay 10% less, still counted in full toward your minimum.`;}
    if(/firework|light show|pyro/.test(q)){try{dollPost({cmd:'fireworks'});const a=$('#app'),rc=$('#roomCanvas');if(a&&rc)a.scrollTo({top:Math.max(0,rc.offsetTop-110),behavior:'smooth'});}catch(_){}return `Watch the dome.`;}
    if(/\b(3d|three d)\b/.test(q)&&/\b(show|switch|go|view|see)\b/.test(q)){try{S.view='iso';paintVtog();dollPost({cmd:'setView',view:'iso'});}catch(_){}return `Here's the room in 3D.`;}
    if(/\bplan\b/.test(q)&&/\b(show|switch|go|view|see)\b/.test(q)){try{S.view='top';paintVtog();dollPost({cmd:'setView',view:'top'});}catch(_){}return `Here's the plan. Tap a section to zoom in.`;}
    if(booked&&/invite|send (the )?link|share (the )?link|my guests/.test(q)){try{const a=$('#app'),el=$('#invite');if(a&&el)a.scrollTo({top:el.getBoundingClientRect().top+a.scrollTop-a.getBoundingClientRect().top-80,behavior:'smooth'});}catch(_){}return `Here's your guest link. Each guest claims their own spot.`;}
    if(booked&&/deposit/.test(q)){try{HN.depOpen=true;hnTabs();const a=$('#app'),el=$('#tabDep');if(a&&el)a.scrollTo({top:el.getBoundingClientRect().top+a.scrollTop-a.getBoundingClientRect().top-80,behavior:'smooth'});}catch(_){}return `Here's your deposit. Split it evenly in one tap, or open Custom split to set each seat's part. It goes out on your invite link, nothing extra to send.`;}
    if(!LIVE&&booked&&/split/.test(q)){try{HN.decOpen=true;hnTabs();SPLIT.open=true;spRender();const a=$('#app'),el=$('#hnSplit');if(a&&el)a.scrollTo({top:el.getBoundingClientRect().top+a.scrollTop-a.getBoundingClientRect().top-80,behavior:'smooth'});}catch(_){}return `Here's the split. Set each person's share by % or AED.`;}
    /* finding a table */
    if(wantsTable(q,c)){const L=search(c);AG.crit=c;AG.list=L;AG.idx=0;
      if(!L.length){AG.last=null;try{dollPost({cmd:'suggest',id:null});}catch(_){}return `Nothing open matches that${c.max?` within ${AED(c.max)}`:''}${c.party?` for ${c.party}`:''} for ${S.ev.short}. Try a higher budget, a smaller group or another section.`;}
      return showTable(L[0],c);}
    return null;}
  window.__ushAgent=agent;window.__ushAG=AG;
  window.__ushReply=function(qRaw){
    const q=' '+String(qRaw).toLowerCase().replace(/[^a-z0-9'\s]/g,' ')+' ',has=(...w)=>w.some(t=>q.indexOf(t)>-1),ev=S.ev,b=busy();
    {const r=agent(q.replace(/'/g,' '));if(r)return r;}
    if(has('hello',' hi ',' hey','evening','greeting'))return `Good evening from the Ushua\u00efa team. We look after the tables here. Ask us about ${ev.short}, the sections or ${LIVE?'when to arrive':'what to order'}.`;
    if(has('thank','cheers'))return `Our pleasure. Tap a section when you're ready, then your table, and we'll have it set before you arrive.`;
    if(has('other night','other event','season','what else','next event','upcoming','calendar'))return `Season 3 so far: ${EVENTS.map(e=>`${e.short} on ${fmtD(dOf(e.k))}`).join(', ')}. Pick a night under the event card to switch.`;
    if(has('dress','wear','attire',' code','outfit'))return `Casual, but no flip-flops. 21 and over, and bring your original Emirates ID or passport, copies aren't accepted.`;
    if(has('who','lineup','line up','music','dj',' play','set ','sound','headlin','support'))return `${ev.head}: ${ev.lineup.map(x=>x[0]).join(', ')}. ${ev.about}`;
    if(has('busy','full','packed','crowd','how many','sold','left'))return `${b.taken} of ${b.tot} tables are gone for ${ev.short}, ${b.d}. ${b.o} still fit ${S.party?'your party':'a group'}.`;
    if(has('recommend','suggest','which table','where should','best table','best seat','seat us','put us','table for')){
      const t=recommend();if(!t)return `For ${S.party||'your group'} everything that fits is gone for ${ev.short}. Try a smaller party size or another night.`;
      try{dollPost({cmd:'select',id:t.id});}catch(_){}
      return `For ${S.party?S.party:'your group'}${BUD.on?` on ${AED(BUD.val)}`:''}, we'd put you at ${t.name}: ${t.where.toLowerCase()}. ${AED(minFor(t,S.party))} minimum. We've lit it in the room, tap it to hold it.`;}
    if(LIVE&&has('backstage','behind the dj','stage deck','ring')){const a=TIERS.bsA;return `Backstage wraps the DJ booth on the stage deck in three rings.${a&&a.min!=null?` Ring A is ${AED(a.min)} for ${a.cap}${a.extra?`, extra guests ${AED(a.extra)} each`:''}.`:''} Rings B and C are on request: the team confirms the minimum with you.`;}
    if(has('backstage','behind the dj','stage deck','ring'))return `Backstage wraps the DJ booth on the stage deck in three rings. Ring A is ${AED(30000)} for 12, extra guests ${AED(2500)} each. Rings B and C are held for the Backstage List and priced on request.`;
    if(LIVE&&has('ticket','general admission','door price',' ga '))return liveTickets(ev);   /* live: a question about tickets is answered with tickets, before the table prices */
    if(has('minimum','min spend','spend','price','cost','how much','budget','extra','silver','gold','platinum',' vip'))return `${PRICE_LINE} Slide the budget bar under the room and every table that fits lights up.`;
    if(!LIVE&&has('bottle','drink','order','champagne','tequila','vodka','menu','cocktail','shot'))return `Most tables open with Don Julio 1942 or Grey Goose and add champagne later. Pre-order before you arrive and you pay 10% less, while it still counts in full toward your minimum.`;
    if(LIVE&&has('arrive','arrival','when','time','early','late','doors')){const e=(ev.ga||[]).find(t=>t.valid_until);return `Doors ${ev.doors}.${e?` The ${e.label.toLowerCase()} ticket works before ${e.valid_until}.`:''} Sunset over the harbour is the best time to walk in.`;}
    if(has('arrive','arrival','when','time','early','late','doors'))return `Doors ${ev.doors}${ev.ends?`, music until ${ev.ends}`:''}. The early-entry ticket works before 22:00. Sunset over the harbour is the best time to walk in.`;
    if(LIVE&&has('ticket','entry','general admission','door price',' ga '))return liveTickets(ev);
    if(has('ticket','entry','general admission','door price',' ga '))return `Early entry is ${AED(250)} before 22:00, second wave ${AED(300)}, VIP standing ${AED(1500)}. One ticket per person. Tap Buy tickets above the room.`;
    if(has('where','address','location','find you','directions','metro','taxi','parking','park'))return `Dubai Harbour, off Sheikh Mohammed bin Rashid Boulevard. Parking is limited, so a taxi is easiest. By metro, the Red Line to Nakheel Harbour and Tower, about 5 km away. The map is at the bottom of this page.`;
    if(has('re entry','reentry','leave and','come back','photo','video','camera','smok'))return `No re-entry once you're in. No photography or videography. Smoking is allowed in the venue.`;
    if(has('book','hold','reserve','how do','how to','tap','zoom','section'))return `Tap a section in the room and it zooms in, then tap your table. Or slide the budget bar under the room and only the tables that fit stay lit. One link then goes to your guests and each claims their own spot.`;
    if(has('strobe','lights','laser','pyro'))return `Double-tap the stage in the room above. That's the strobe, on the house.`;
    if(has('who are you','your name','what are you',' bot','roland'))return `The Ushua\u00efa team. We host the tables every night of the season, and we know every section from the stage back.`;
    return `We know this venue: the lineup, the sections, the prices, when to arrive. What would you like to know?`;
  };
  function reply(q){return window.__ushReply(q);}
  function suggestions(){if(AG.last)return [`Book ${AG.last.name}`,`Show me another`,`Something cheaper`,`Closer to the DJ`];
    const b=[`Closest table to the DJ at 20k`,`Who's playing?`,`Best table for 8 under 15k`,`What do tables cost?`,`Cheapest table for 6`,`When should we arrive?`,`Show me the fireworks`];
    return b.slice(0,6);}
  function greeting(){return `Good evening from the Ushua\u00efa team. ${S.ev?S.ev.short+' is on '+fmtD(dOf(S.ev.k))+'. ':''}Ask us anything about the night.`;}
  /* ----- docked input bar: WhatsApp-style, lives in the booking page so it can ride above the soft keyboard ----- */
  var BARCSS='';
  var st=document.createElement('style');st.id='mgrbar-css';st.textContent=BARCSS;document.head.appendChild(st);

  var bar=document.createElement('div');bar.className='mgrbar';bar.id='mgrbar';
  bar.innerHTML='<div class="mgrbar-chips" id="mgrbarChips"></div><div class="mgrbar-row"><button class="mgrbar-call" id="mgrbarCall" type="button" aria-label="Call the team"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.5a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/></svg></button><input id="mgrbarIn" class="mgrbar-in" type="text" inputmode="text" autocomplete="off" enterkeyhint="send" placeholder="Ask the team\u2026"/><button class="mgrbar-send" id="mgrbarSend" type="button" aria-label="Send">\u2191</button></div>';
  document.body.appendChild(bar);
  var chipsEl=bar.querySelector('#mgrbarChips'),inEl=bar.querySelector('#mgrbarIn'),sendEl=bar.querySelector('#mgrbarSend'),barOpen=false;

  window.__ushChips=function(){try{renderChips();}catch(_){}};
  function renderChips(){chipsEl.innerHTML='';suggestions().forEach(function(q){var c=document.createElement('button');c.type='button';c.className='mgrbar-chip';c.textContent=q;c.addEventListener('click',function(){handleAsk(q);});chipsEl.appendChild(c);});}
  function handleAsk(t){var q=(t||'').trim();if(!q)return;inEl.value='';try{dollPost({cmd:'mgrTyping'});}catch(_){}
    var ans=reply(q),delay=420+Math.min(900,ans.length*7);
    setTimeout(function(){try{dollPost({cmd:'mgrSay',text:ans});}catch(_){}renderChips();},delay);}
  function showBar(){if(barOpen)return;barOpen=true;renderChips();bar.classList.add('on');document.body.classList.add('bar-on');
    requestAnimationFrame(function(){ try{
      var rc=document.getElementById('roomCanvas'); if(!rc)return;
      var barTop=(window.innerHeight||0)-(bar.offsetHeight||130), gap=18;
      var rb=rc.getBoundingClientRect(), over=rb.bottom-(barTop-gap);
      if(over>2){ var sc=document.scrollingElement||document.documentElement; sc.scrollTo({top:sc.scrollTop+over,behavior:'smooth'}); }
    }catch(_){} });
  }
  function hideBar(){if(!barOpen)return;barOpen=false;bar.classList.remove('on');document.body.classList.remove('bar-on');try{inEl.blur();}catch(_){}}

  sendEl.addEventListener('click',function(){handleAsk(inEl.value);});
  inEl.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();handleAsk(inEl.value);}});
  var callEl=bar.querySelector('#mgrbarCall');
  var _conn=null,_connT=0;
  function showConnecting(){
    if(!_conn){ _conn=document.createElement('div'); _conn.id='connOvr';
      _conn.innerHTML='<div class="conn-card"><div class="conn-spin"></div><div class="conn-tx"><b>Calling the team</b><span>Please hold\u2026</span></div></div>';
      document.body.appendChild(_conn); }
    _conn.classList.add('on'); clearTimeout(_connT); _connT=setTimeout(function(){ _conn.classList.remove('on'); },2400);
  }
  if(LIVE&&callEl)callEl.style.display='none';   /* live: no number to call until the venue gives one */
  if(callEl) callEl.addEventListener('click',showConnecting);

  /* ride above the soft keyboard like WhatsApp */
  var vv=window.visualViewport;
  function fitBar(){if(!vv)return;var overlap=window.innerHeight-vv.height-vv.offsetTop;bar.style.bottom=Math.max(0,overlap)+'px';bar.classList.toggle('kb',overlap>40);}
  if(vv){vv.addEventListener('resize',fitBar);vv.addEventListener('scroll',fitBar);}

  /* tap on \u00c9tienne opens his thinking bubble \u2192 reveal the bar + greet; closing hides it */
  var _veilLocks=0;
  function _setGutter(off){try{var el=document.querySelector('.rcanvas.is3d .scroll-gutter');if(el)el.style.pointerEvents=off?'none':'';}catch(_){}}
  function veilLock(on){ _veilLocks=Math.max(0,_veilLocks+(on?1:-1)); _setGutter(_veilLocks>0); }
  window.addEventListener('message',function(ev){var d=ev.data;if(!d||d.source!=='ush-venue')return;if(typeof dollFrame==='undefined'||!dollFrame||ev.source!==dollFrame.contentWindow)return;
    if(d.type==='djOpen'||d.type==='djClose'){var rc=document.querySelector('.rcanvas.is3d');if(rc)rc.classList.toggle('veiled',d.type==='djOpen');}
    if(d.type==='djOpen'||d.type==='mgrShown'){veilLock(true);return;}
    if(d.type==='djClose'||d.type==='mgrHidden'){veilLock(false);return;}
    if(d.type==='mgrOpen'){showBar();try{dollPost({cmd:'mgrSay',text:greeting()});}catch(_){}}
    else if(d.type==='mgrShowBar'){showBar();}
    else if(d.type==='mgrGreetReq'){try{dollPost({cmd:'mgrGreet',text:greeting()});}catch(_){}}
    else if(d.type==='mgrClose'){hideBar();}
    else if(d.type==='barOpen'){try{openDrinksMenu();}catch(_){}}
  });
})();
