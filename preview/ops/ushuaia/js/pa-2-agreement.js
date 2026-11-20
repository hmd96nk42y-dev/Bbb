/* =====================================================================
   THE AGREEMENT: drafted by BUBL from the terms the manager set
   ===================================================================== */
function paParty(d){return d.kind==='exclusive'?'the Company':'the Promoter';}
function paClauses(d){const L=[],P=paParty(d),Pc=P[0].toUpperCase()+P.slice(1),evs=d.events.map(id=>EVK[id]),r=paRates(d),tk=paTaken(d),pool=paPool(d,tk);
  const add=(id,h,t)=>{if(d.removed[id])return;L.push({id,h,t:d.ovr[id]||t});};
  const who=(d.company?d.company+(d.licence?' (trade licence '+d.licence+')':'')+', represented by '+d.name:d.name)||'[Name]';
  add('parties','Parties','This agreement is between Ushuaïa Dubai Harbour (“the Venue”) and '+who+' (“'+P+'”).');
  add('events','Events',Pc+' promotes '+(evs.length>1?'these events':'this event')+' at the Venue: '+evs.map(e=>e.head+', '+fD(e.doors)).join('; ')+'. Doors, prices and line-ups are set by the Venue.');
  if(d.kind==='exclusive')add('excl','Exclusivity',Pc+' is the only promoter for '+(evs.length>1?'these events':'this event')+'. The Venue won’t give promoter access to anyone else for '+(evs.length>1?'them':'it')+'. The Venue keeps its own direct sales, host desk, hotel concierge desks and corporate partners.');
  const tabTxt=d.tmode==='sec'?'Any open table in '+d.secs.map(paSecLabel).join(', ')+', holding up to '+(d.cap||pool.length)+' at a time.':pool.length+' tables held for '+P+': '+pool.map(id=>W.T[id].name).join(', ')+'.';
  const tixTxt=PA_TK.filter(k=>d.tix[k]).map((k,i)=>n0(d.tix[k])+' '+GA[PA_TK.indexOf(k)].label).join(', ');
  add('alloc','Allocation','Tables: '+tabTxt+' Tickets: '+(tixTxt||'none')+', sold through '+P+'’s link at the Venue’s prices; when a ticket allocation is used up, the link stops selling it. Promoter list: '+n0(d.list)+' spots, free entry until '+PA_LISTCUT+'.');
  add('holds','Holds and deposits','Tables '+P+' hasn’t sent to a guest return to the Venue '+d.release+' hours before doors. '+SETTLE[d.settle||'dep'][0]+': '+SETTLE[d.settle||'dep'][1]+' '+holdRule()+' A table whose hold runs out returns to '+P+'’s holds.');
  add('count','How sales are counted','A sale counts for '+P+' when it is made through '+P+'’s own BUBL link or invitation. Each booking is counted once, under one name. The BUBL record is the reference for both parties.');
  add('comm','Commission','The Venue pays '+P+' '+paPct(r.tix)+' of ticket face value and '+paPct(r.tab)+' of the minimum spend on tables booked'+(r.bar?', plus '+paPct(r.bar)+' of the bar spend '+(d.barBase==='over'?'above the minimum ':'')+'on those tables, as recorded by the Venue’s POS. Spend at the open bars by ticket and list guests is not counted, because it can’t be tied to '+P:'')+'. Refunded sales earn nothing. Amounts exclude VAT.');
  add('pay','Payment','The Venue pays the Promoter directly, within '+d.payDays+' days after each event closes, from a statement BUBL produces for both parties. BUBL does not hold or pay commission.');
  if(d.offers&&d.offers.on)add('offers','Offers on upon-request tables','On tables the Venue lists as upon request, the Promoter may set the minimum spend, how it is settled and any price points on their own invitation, never below '+aed(d.offers.floor)+'. Every other table keeps the price the Venue sets.');
  add('conduct','Conduct','The Venue’s published prices only, no resale above face value, and Ushuaïa’s name and artwork used only as supplied by the Venue.');
  add('data','Guest data','Guest details collected through '+P+'’s links are held by the Venue under UAE data protection law. '+Pc+' sees names and booking status for its own guests only, and uses them only for these events.');
  add('review','Review','After each event the Venue reviews '+P+'’s show rate: guests confirmed through '+P+' who came through the gates. At 90% or more, the next allocation rises 20%. Under 80%, it falls 30%.');
  d.extra.forEach(x=>add(x.id,x.h,x.t));
  add('term','Ending the agreement','Either party can end this agreement with '+d.notice+' days’ written notice. Holds return to the Venue straight away. Commission earned up to that date is still paid.');
  add('law','Law',d.law==='difc'?'This agreement is governed by the laws of the DIFC, and the DIFC Courts have exclusive jurisdiction.':'This agreement is governed by the laws of the Emirate of Dubai and the federal laws of the UAE. The courts of Dubai have jurisdiction.');
  return L;}
function paDocHTML(d,o){o=o||{};const cl=paClauses(d),evs=d.events.map(id=>EVK[id]);
  return '<div class="pa-doc"><div class="dh"><div><small>Ushuaïa Dubai Harbour · '+esc(VENUE.season)+'</small><h4>'+(d.kind==='exclusive'?'Exclusive promotion agreement':'Promoter agreement')+'</h4></div><div class="ver">v'+(d.ver||1)+'<br>'+esc(evs.map(e=>e.short).join(', '))+'</div></div>'+
    (o.drafting?'<div class="pa-skel">'+[92,80,96,64,88,72,90,58].map(w=>'<i style="width:'+w+'%"></i>').join('')+'</div>':
    cl.map((c,i)=>'<div class="cl '+(d.chg[c.id]?'chg':'')+' '+(d.chg[c.id]==='new'?'new':'')+'"><h5><span class="n">'+(i+1)+'</span>'+esc(c.h)+'</h5><p>'+esc(c.t)+'</p></div>').join('')+
    '<div class="sig"><div><small>For the Venue</small>'+(d.venueSig?'<b>'+esc(d.venueSig.by.replace(/ \(.*\)/,''))+'</b><em>'+fDT(d.venueSig.at)+'</em>':'<b class="none">Signs with a manager PIN</b>')+'</div><div><small>For '+esc(paParty(d).replace('the ',''))+'</small>'+(d.promoSig?'<b>'+esc(d.promoSig.by)+'</b><em>'+fDT(d.promoSig.at)+'</em>':'<b class="none">Signs in their link</b>')+'</div></div>')+'</div>';}

/* ---------- the contract agent: Claude when BUBL Intelligence is on, the built-in drafter otherwise ---------- */
function paParseAmt(q){const m=q.replace(/,/g,'').match(/(?:aed\s*)?(\d+(?:\.\d+)?)\s*(k|m|thousand|million)?\b/i);if(!m)return null;let v=parseFloat(m[1]);const u=(m[2]||'').toLowerCase();if(u==='k'||u==='thousand')v*=1e3;if(u==='m'||u==='million')v*=1e6;return v;}
function paLocalAgent(q,d){const s=q.toLowerCase(),P=paParty(d),ch={},done=[];let m;
  const ext=(id,h,t)=>{const i=d.extra.findIndex(x=>x.id===id);if(i>=0)d.extra[i]={id,h,t};else d.extra.push({id,h,t});delete d.removed[id];ch[id]=i>=0?'chg':'new';};
  const num=re=>{const mm=s.match(re);return mm?parseFloat(mm[1]):null;};
  if(/\b(remove|delete|drop|take out)\b/.test(s)){const cl=paClauses(d);let hit=null;const n=num(/clause\s*(\d+)/);if(n&&cl[n-1])hit=cl[n-1];
    if(!hit)hit=cl.find(c=>s.includes(c.h.toLowerCase())||(c.id==='review'&&/review|show rate/.test(s))||(c.id==='noshow'&&/no-?show|penalty/.test(s))||(c.id==='guar'&&/guarantee/.test(s))||(c.id==='noncomp'&&/compet/.test(s))||(c.id==='excl'&&/exclusiv/.test(s)));
    if(hit&&!['parties','events','comm','alloc'].includes(hit.id)){const i=d.extra.findIndex(x=>x.id===hit.id);if(i>=0)d.extra.splice(i,1);else d.removed[hit.id]=1;return {reply:'Removed “'+hit.h+'”.',ch};}
    if(hit)return {reply:'“'+hit.h+'” is what the agreement is built on, so it stays. You can change what it says instead.',ch};}
  if(/\b(\d+)\s*days?\b/.test(s)&&/(pay|paid|payment|settle)/.test(s)){d.payDays=num(/(\d+)\s*days?/);ch.pay='chg';done.push('payment is due within '+d.payDays+' days of each event');}
  if(/(notice|terminat|end the agreement)/.test(s)&&/\d+\s*days?/.test(s)){d.notice=num(/(\d+)\s*days?/);ch.term='chg';done.push('either side can end it with '+d.notice+' days’ notice');}
  if(/(hold|release)/.test(s)&&/(\d+)\s*(h|hours?)\b/.test(s)){d.release=num(/(\d+)\s*(?:h|hours?)\b/);ch.holds='chg';done.push('unsent holds return '+d.release+' hours before doors');}
  if(/deposit/.test(s)&&/(\d+)\s*(h|hours?)\b/.test(s)){d.depH=num(/(\d+)\s*(?:h|hours?)\b/);ch.holds='chg';done.push('guests get '+d.depH+' hours to pay the deposit');}
  if((m=s.match(/(\d+(?:\.\d+)?)\s*%/))){const v=Math.min(40,parseFloat(m[1]));const tgt=/bar|drink|spend/.test(s)?['bar']:/ticket/.test(s)?['tix']:/table|minimum/.test(s)?['tab']:/(all|everything|across)/.test(s)?['tix','tab','bar']:null;
    if(tgt){if(d.one&&!(tgt.length===3)){d.rates={tix:d.rates.tix,tab:d.rates.tix,bar:d.rates.tix};d.one=false;}tgt.forEach(k=>d.rates[k]=v);if(tgt.length===3)d.one=true;ch.comm='chg';done.push((tgt.length===3?'every stream':{bar:'bar spend',tix:'tickets',tab:'tables'}[tgt[0]])+' now earns '+paPct(v));}}
  if(/guarantee/.test(s)){const v=paParseAmt(s.replace(/\d+\s*days?/,''))||250000;ext('guar','Minimum guarantee',paParty(d)[0].toUpperCase()+paParty(d).slice(1)+' guarantees AED '+n0(v)+' of ticket and table sales across its allocation for each event. If sales fall short, the difference is deducted from that event’s commission, and '+P+' pays any remainder within 14 days.');done.push('a minimum guarantee of AED '+n0(v)+' per event is in');}
  if(/no-?show|penalt/.test(s)){const v=num(/(\d+)\s*%/)||10;ext('noshow','No-show penalty','If fewer than 80% of the guests confirmed through '+P+' come through the gates, the Venue keeps back '+v+'% of that event’s commission.');done.push('a '+v+'% no-show penalty under an 80% show rate is in');}
  if(/compet|non-?compete/.test(s)){const n=num(/(\d+)\s*days?/)||7;ext('noncomp','Competing events',paParty(d)[0].toUpperCase()+paParty(d).slice(1)+' won’t promote a competing event in Dubai on the same night as an event in this agreement, or in the '+n+' days before it, without the Venue’s written approval.');done.push('a '+n+'-day non-compete is in');}
  if(/cancel|postpone|force majeure/.test(s)){ext('cancel','Cancelled events','If the Venue cancels or postpones an event, holds for it end, the Venue refunds guests directly, and no commission is due on refunded sales. Neither party owes the other anything else for that event.');done.push('a cancellation clause is in');}
  if(/difc/.test(s)){d.law='difc';ch.law='chg';done.push('disputes go to the DIFC Courts');}
  else if(/(dubai courts|onshore|uae law)/.test(s)){d.law='dxb';ch.law='chg';done.push('disputes go to the courts of Dubai');}
  if(/exclusiv/.test(s)&&!/remove|delete|drop/.test(s)&&d.kind!=='exclusive'){d.kind='exclusive';ch.excl='new';ch.parties='chg';done.push('this is now an exclusive agreement');}
  if(/(bar).*(above|over).*(minimum)/.test(s)){d.barBase='over';ch.comm='chg';done.push('bar spend counts above the minimum only');}
  else if(/(bar).*(whole|all|total|entire)/.test(s)){d.barBase='all';ch.comm='chg';done.push('bar spend counts on the whole table spend');}
  if(!done.length)return {reply:'I can change the rates, payment days, hold release, deposit window and notice period, add a minimum guarantee, a no-show penalty, a non-compete or a cancellation clause, switch the courts, or remove a clause. Which one?',ch,miss:1};
  return {reply:'Done: '+done.join('; ')+'.',ch};}
async function paAgent(q,d){
  if(typeof isOn==='function'&&isOn('ai')){try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),15000);
    const sys='You edit a promoter agreement inside BUBL OPS for '+VENUE.name+'. You get the current TERMS and CLAUSES as JSON and the manager\'s REQUEST. Change only what was asked. Write clauses in plain, short English. Respond with ONLY JSON: {"reply":"one sentence saying what changed","terms":{"payDays":n,"release":n,"notice":n,"rates":{"tix":n,"tab":n,"bar":n},"law":"dxb|difc"},"add":[{"id":"short_id","h":"Heading","t":"Clause text"}],"remove":["clause id"]} with only the keys you change.';
    const body={model:'claude-sonnet-4-6',max_tokens:900,system:sys,messages:[{role:'user',content:'TERMS: '+JSON.stringify({kind:d.kind,payDays:d.payDays,release:d.release,settle:d.settle,notice:d.notice,rates:paRates(d),law:d.law})+'\nCLAUSES: '+JSON.stringify(paClauses(d).map(c=>({id:c.id,h:c.h,t:c.t})))+'\nREQUEST: '+q}]};
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,body:JSON.stringify(body)});clearTimeout(to);
    if(!r.ok)throw new Error('http');const j=await r.json(),txt=(j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('').replace(/```json|```/g,'').trim(),p=JSON.parse(txt),ch={};
    const T=p.terms||{};['payDays','release','depH','notice'].forEach(k=>{if(T[k]){d[k]=T[k];ch[{payDays:'pay',release:'holds',depH:'holds',notice:'term'}[k]]='chg';}});
    if(T.rates){d.one=false;Object.assign(d.rates,T.rates);ch.comm='chg';}if(T.law){d.law=T.law;ch.law='chg';}
    (p.add||[]).forEach(x=>{if(!x||!x.t)return;const id=String(x.id||'x'+Date.now()).replace(/\W/g,'');const i=d.extra.findIndex(e=>e.id===id);if(i>=0)d.extra[i]={id,h:x.h,t:x.t};else d.extra.push({id,h:x.h||'Additional term',t:x.t});ch[id]=i>=0?'chg':'new';});
    (p.remove||[]).forEach(id=>{const i=d.extra.findIndex(e=>e.id===id);if(i>=0)d.extra.splice(i,1);else if(!['parties','events','comm','alloc'].includes(id))d.removed[id]=1;});
    return {reply:p.reply||'Done.',ch};}catch(e){/* fall through to the built-in drafter */}}
  return paLocalAgent(q,d);}
