/* ================= public tables at Ushuaïa · engine: bubl-social.js v1.0 (inlined above, runs hidden, public tables only) =================
   Every screen a guest sees is drawn here in the venue's own booking sheet. Public tables glow amber in the room.
   Above the room: Public tables, expandable. Tap one to see it in the room (a beacon rises from it), tap it again to open it.
   A guest switches their table to public as they hold it, or any time after from under the booking summary (setBooking → myTable). */
(function(){
  if(!window.BUBLSocial)return;
  if(!offered('publicTables'))return;   /* test and live: not wired yet, so nothing simulated runs */
  const PUB='#FF7A1A',BUBL=BUBLSocial.BUBL_PURPLE,GR='120,196,140',ACCT_KEY='bubl.account.v1';
  const TIERC={vip:'#FF4FC8',plat:'#9A6BFF',gold:'#FFF0D2',silver:'#6FD2FF'};

  /* ---------- tonight's tables: generated per night ---------- */
  const NM={F:['Layla','Chloé','Sofia','Aisha','Nour','Maya','Zara','Inès','Lina','Mila','Yasmin','Clara','Dana','Rita'],M:['Omar','Karim','Marco','Lucas','Hugo','Rami','Theo','Adam','Yusuf','Leo','Elias','Sami','Nico','Faris']};
  const NAT=['French','Lebanese','British','Emirati','Italian','Indian','Egyptian','Russian','American','Saudi'],IND=['Finance','Tech','Real estate','Fashion','Media','Hospitality','Law','Art & design','Healthcare','Founder'],HOB=['Padel','Art','Surfing','F1','Fitness','Travel','Wine','Music','Golf','Yoga','Fashion','Kitesurf','Reading','Cooking'];
  const THEMES=[{ages:[29,32],nat:['French','Lebanese'],ind:['Finance','Founder'],hob:['Padel','Travel','Wine']},{ages:[25,28],nat:['British','Italian'],ind:['Tech','Media'],hob:['Music','Surfing','Art']},
    {ages:[33,36],nat:['Emirati','Saudi','Lebanese'],ind:['Real estate','Finance'],hob:['Golf','F1','Fitness']},{ages:[25,28],nat:['Indian','British'],ind:['Fashion','Art & design'],hob:['Fashion','Yoga','Music']},
    {ages:[29,32],nat:['Russian','French'],ind:['Hospitality','Media'],hob:['Kitesurf','Travel','Music']},{ages:[33,36],nat:['American','British'],ind:['Tech','Founder'],hob:['F1','Padel','Wine']}];
  function rng(seed){let s=0;for(const c of String(seed))s=(s*31+c.charCodeAt(0))|0;s=(s>>>0)||7;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
  function at(ev,add){const [h,m]=ev.doors.split(':').map(Number),t=h*60+m+add;return String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
  function dataFor(ev){const r=rng(ev.id+'/social'),pk=a=>a[Math.floor(r()*a.length)],used={};if(S.boothId)used[S.boothId]=1;
    const tableIn=tier=>{const c=TABLES.filter(t=>t.tier===tier&&!used[t.id]);const t=c[Math.floor(r()*c.length)];used[t.id]=1;return t;};
    const th=THEMES.slice().sort(()=>r()-.5);
    const member=(T_,g)=>{const hb=[pk(T_.hob)];if(r()<.7)hb.push(pk(T_.hob));if(r()<.45)hb.push(pk(HOB));
      return {g,age:T_.ages[0]+Math.floor(r()*(T_.ages[1]-T_.ages[0]+1)),nat:r()<.72?pk(T_.nat):pk(NAT),ind:r()<.72?pk(T_.ind):pk(IND),hob:[...new Set(hb)].slice(0,3),name:pk(NM[g])};};
    const bubl=(k,tier,seats,confirmAt,gs,T_,mutual)=>{const t=tableIn(tier);return {id:ev.id+'-b'+k,table:t.id,seats,confirmAt,members:gs.map(g=>member(T_,g)),builtFor:T_,min:t.min,closes:at(ev,150),mutual};};
    const bubls=[bubl(1,'vip',8,6,['F','M','F'],th[0],2),bubl(2,'plat',8,6,['M','F','M','F','F'],th[1],1),bubl(3,'gold',8,6,['M','F','M','F','M','F'],th[2],0),bubl(4,'silver',6,4,[],th[3],0)];
    const hostP=()=>{const g=r()<.5?'M':'F',h1=pk(HOB),h2=pk(HOB);return {g,age:25+Math.floor(r()*12),ind:pk(IND),nat:pk(NAT),hob:h1===h2?[h1]:[h1,h2],name:pk(NM[g])};};
    const pub=(k,tier,share,group,left)=>{const t=tableIn(tier),min=t.min,paid=share.map(f=>Math.round(min*f/50)*50);return {id:ev.id+'-p'+k,table:t.id,host:hostP(),min,paid,group,cap:t.cap,closes:at(ev,180),left};};
    const publics=[pub(1,'vip',[.38],['M','M','F'],140),pub(2,'plat',[.3,.15],['F','F','M','F'],95),pub(3,'gold',[.4],['M','M'],60)];
    return {bubls,publics,myTable:null};}
  /* the engine needs a plan for its own (hidden) panel; it is never shown */
  function planFor(data,extra){const tables={};[...data.bubls.map(b=>[b.table,b.seats]),...data.publics.map(p=>[p.table,p.cap||8]),...(extra||[]).map(id=>[id,(T(id)||{}).cap||8])].forEach(([id,n])=>{const t=T(id);if(t)tables[id]={x:0,y:0,w:20,h:8,seats:n,zone:t.label,num:t.name};});return {viewBox:'0 0 10 10',decor:'',tables};}

  /* ---------- the engine, hidden ---------- */
  const hid=document.createElement('div');hid.style.display='none';hid.setAttribute('aria-hidden','true');document.body.appendChild(hid);
  let eng=null,lastEv=null,lastBooth=null,mine=null;   /* mine: {ev,tbl}, the guest's own table once they've set it up (the engine's myTable) */
  const covered=p=>p.paid.reduce((a,b)=>a+b,0);
  const myT=()=>(eng&&eng.data.myTable)||null;
  function glowMap(){const m={};if(!eng)return m;eng.tables().forEach(x=>{m[x.table]=x.type==='bubl'?BUBL:PUB;});const M=myT();if(M&&M.isPublic)m[M.table]=PUB;return m;}
  function postGlow(){try{if(typeof dollPost==='function')dollPost({cmd:'social',map:glowMap()});}catch(_){}paintOwn();paintBar();}
  function onEng(){postGlow();if(openSheetEl===$('#sxSheet')&&sheetFor==='host')keepScroll(drawHost);}
  function groupOf(n,me){const a=me?me.g:'M',b=a==='M'?'F':'M';return Array.from({length:n},(_,i)=>i%2?b:a);}
  /* the venue's booking is handed to the engine, so "make it public" starts from it */
  function syncBooking(){if(!eng)return;const t=S.boothId&&T(S.boothId),M=myT();
    if(!t||t.req){if(eng.booking)eng.booking=null;return;}
    if(M&&M.table===t.id){eng.booking=null;return;}
    if(eng.booking&&eng.booking.table===t.id)return;
    const n=Math.max(1,S.party||2);eng.setBooking({table:t.id,min:S.bookMin||t.min,paid:[],group:groupOf(n,eng.me()),cap:Math.max(t.cap,n)});}
  function rebuild(){if(!S.ev)return;const data=dataFor(S.ev),keep=!!(mine&&mine.ev===S.ev.id);data.bubls=[];   /* Ushuaïa runs public tables only */if(keep)data.myTable=mine.tbl;
    const cfg={plan:planFor(data,S.boothId?[S.boothId]:[]),data,features:['public'],pricing:{type:'minimum',depositPct:.5},currency:'AED',
      venue:{name:'Ushuaïa Dubai Harbour',code:'UDH'},publicGlow:PUB,bublGlow:BUBL,bublMark:'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      brand:{vars:{accent:'--red'}},closeOptions:[120,150,180,210].map(a=>at(S.ev,a))};
    if(!eng){eng=window.__social=BUBLSocial.mount(Object.assign({el:hid,onChange:onEng},cfg));eng.render=function(){};eng.toast=m=>toast(m);try{eng.ohost.style.display='none';}catch(_){}}
    else{eng.booking=null;eng.update(cfg);}
    if(keep)mine.tbl=eng.data.myTable;
    BAR.k=null;BAR.sel=null;beamsOff();syncBooking();postGlow();}

  /* ---------- small pieces, in the booking sheet's style ---------- */
  const band=a=>{if(a<25)return[21,24];const lo=25+Math.floor((a-25)/4)*4;return[lo,lo+3];},bl=b=>b[0]+'–'+b[1];
  const gs=g=>`<i class="sx-gs ${g==='M'?'m':'f'}" aria-label="${g==='M'?'man':'woman'}">${g==='M'?'♂':'♀'}</i>`;
  const leftTime=min=>{const h=Math.floor(min/60),m=min%60;return (h?h+'h ':'')+m+'m';};
  const MUT=`<svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor"/><circle cx="16" cy="6" r="4.5" fill="none" stroke="currentColor"/></svg>`;
  const SEG=['rgba(var(--acc-rgb),1)','rgba(var(--acc-rgb),.72)','rgba(var(--acc-rgb),.5)','rgba(255,255,255,.55)','rgba(255,255,255,.35)'];
  function gbar(arr){const M=arr.filter(g=>g==='M').length,F=arr.length-M,t=Math.max(1,M+F);return `<div class="sx-g"><span>${gs('M')} ${M}</span><div class="sx-gt"><b class="m" style="width:${100*M/t}%"></b><b class="f" style="width:${100*F/t}%"></b></div><span>${F} ${gs('F')}</span></div>`;}
  function seatbar(n,inN,you,need){let s='';for(let i=0;i<n;i++)s+=`<i class="${i<inN?'in':i<inN+you?'you':i<need?'need':''}"></i>`;return `<div class="sx-seats">${s}</div>`;}
  function minbar(p,extra,extraCol){let s='';p.paid.forEach((v,i)=>s+=`<b style="width:${100*v/p.min}%;background:${SEG[i%SEG.length]}"></b>`);if(extra)s+=`<b style="width:${100*extra/p.min}%;background:${extraCol||`rgb(${GR})`}"></b>`;return `<div class="sx-min">${s}</div>`;}
  function chip(c){if(c.neutral)return `<span class="sx-chip n">${esc(c.l)} <em>×${c.c}</em></span>`;
    if(c.target)return `<span class="sx-chip t${c.hit?' hit':''}">${esc(c.l)}</span>`;
    return `<span class="sx-chip" style="background:rgba(${GR},${(.14+.6*(c.c/c.n)).toFixed(2)})">${esc(c.l)} <em>×${c.c}</em></span>`;}
  const hostLine=h=>`${gs(h.g)} ${bl(band(h.age))} · ${esc(h.ind)} · ${esc(h.nat)}`;
  const kv=(k,v)=>`<div class="sx-kv"><span>${k}</span><b>${v}</b></div>`;
  const head=(col,label,title)=>{$('#sxHead').innerHTML=`<span class="tier" style="color:${col}"><i></i>${label}</span><h3>${esc(title)}</h3>`;};
  function body(html,bind){const b=$('#sxBody');b.innerHTML=html;if(bind)bind(b);}
  function open(onClose){const el=$('#sxSheet');if(openSheetEl!==el)openSheet(el,onClose||null);}
  function keepScroll(fn){const b=$('#sxBody'),y=b.scrollTop;fn();b.scrollTop=y;}

  /* ---------- a bubl ---------- */
  function openBubl(b){
    const draw=()=>{const me=eng.me(),p=eng.bublMatch(b),st=eng.bublState(b),req=eng.S.requests[b.id],t=T(b.table),pr=eng.seatPrice(b);
      const inN=b.members.length+(req==='in'?1:0),need=Math.max(0,b.confirmAt-inN),confirmed=st==='confirmed'||st==='full',reveal=req==='in'&&confirmed;
      const genders=[...b.members.map(x=>x.g),...(req==='in'&&me?[me.g]:[])];
      head(BUBL,'bubl · '+t.label,t.name);
      let seats='';for(let i=0;i<b.seats;i++){const x=b.members[i];
        if(x)seats+=`<div class="offer sx-seat"><b>Seat ${i+1} ${gs(x.g)}${reveal?' <em>'+esc(x.name)+'</em>':''}</b><span>${bl(band(x.age))} · ${esc(x.ind)} · ${esc(x.nat)} · ${esc(x.hob.join(', '))}</span></div>`;
        else if(i===b.members.length&&req==='in')seats+=`<div class="offer sx-seat you"><b>Seat ${i+1} · you ${gs(me.g)}</b><span>${bl(band(me.age))} · ${esc(me.ind)} · ${esc(me.nat)}</span></div>`;
        else if(i===b.members.length&&!req)seats+=`<div class="offer sx-seat you open"><b>Seat ${i+1} · yours if you join</b><span>Open</span></div>`;}
      const open_=b.seats-Math.max(b.members.length+(req?1:0),0);if(open_>0)seats+=`<div class="offer sx-seat open"><b>${open_} more open seat${open_>1?'s':''}</b><span>Filled by bubl from people who match this table</span></div>`;
      const chips=eng.bublChips(b).map(chip).join('');
      let acts;
      if(!req)acts=`<button class="btn red full" id="sxGo" type="button">Request to join · ${AED(pr.dep)} held</button><p class="sx-fine">${me?'Your bubl account is verified, one tap.':'You’ll make your bubl account next. Everyone at this table did the same.'}</p>`;
      else if(req==='pending')acts=`<div class="sx-wait"><b class="sx-pulse">Request sent</b><p class="sx-fine">The table sees your ranges, the same way you saw theirs.</p></div>`;
      else acts=`<div class="sx-wait"><b class="sx-ok2">${confirmed?'Confirmed · names revealed':'You’re in · '+need+' more to confirm'}</b><p class="sx-fine">${confirmed?'See you at the table.':'You’ll get a message each time someone joins.'}</p></div>`;
      body(`<div class="ts-facts"><div><b>${p==null?'—':p+'%'}</b><span>${p==null?'log in to see your match':'your match'}</span></div><div><b>${inN} of ${b.seats}</b><span>${confirmed?'confirmed':need+' more to confirm'}</span></div><div><b>${AED(pr.seat)}</b><span>a seat</span></div></div>
        <p class="ts-vote">${b.members.length?`A table bubl put together for tonight, from people who match each other. It confirms at ${b.confirmAt}, by ${esc(b.closes)}.`:`bubl built this table for the people below. Be the first in. It confirms at ${b.confirmAt}, by ${esc(b.closes)}.`}</p>
        <h4>${b.members.length?(me?'What you share with them':'Who’s in'):'Built for'}</h4><div class="sx-chips">${chips}</div>
        ${p==null?`<button class="sx-link" id="sxLogin" type="button">Log in to see your match</button>`:''}
        <div class="sx-m"><div class="sx-mh"><span>${confirmed?'Confirmed':'Confirms at '+b.confirmAt}</span><span>${inN} in${need?` · <b>${need} to go</b>`:` · ${b.seats-inN} left`}</span></div>${seatbar(b.seats,b.members.length,req==='in'?1:0,b.confirmAt)}</div>
        ${genders.length?`<div class="sx-m"><div class="sx-mh"><span>Gender ratio</span></div>${gbar(genders)}</div>`:''}
        ${me&&b.mutual?`<p class="sx-mut">${MUT}<span><b>${b.mutual}</b> table mutual${b.mutual>1?'s':''}. Someone here shared a table with someone you did.</span></p>`:''}
        <h4>The table · ${reveal?'names revealed':'names stay hidden until it confirms'}</h4>${seats}
        <h4>Your seat</h4>${kv('Table minimum',AED(b.min))}${kv('Your share',AED(pr.seat))}${kv('Deposit now',AED(pr.dep)+' · held')}${kv('Confirm by',esc(b.closes))}
        <p class="ts-state">Your deposit is held, not charged. If this bubl doesn’t reach ${b.confirmAt} by ${esc(b.closes)}, the hold drops off your card straight away.</p>
        <div class="sx-acts">${acts}</div>`,bd=>{
          const lg=bd.querySelector('#sxLogin');if(lg)lg.onclick=()=>login(()=>openBubl(b));
          const go=bd.querySelector('#sxGo');if(go)go.onclick=()=>{
            const done=()=>{eng.S.requests[b.id]='pending';open();keepScroll(draw);
              setTimeout(()=>{eng.S.requests[b.id]='in';eng.changed();if(openSheetEl===$('#sxSheet')&&sheetFor===b.id)keepScroll(draw);const s2=eng.bublState(b);toast(s2==='confirmed'||s2==='full'?`Accepted. Your bubl at ${T(b.table).name} is confirmed`:`Accepted. You’re in at ${T(b.table).name}`);},2600);};
            if(eng.me())hold(pr.dep,'Seat deposit',done,()=>openBubl(b));else signup({amount:pr.dep,label:'Seat deposit',charge:'Only when it confirms',done,back:()=>openBubl(b)});};});};
    sheetFor=b.id;draw();open();$('#sxBody').scrollTop=0;}
  let sheetFor=null;

  /* ---------- someone else's public table ---------- */
  function openPublic(p){
    const t=T(p.table),spots=Math.max(1,p.cap-p.group.length),o={offer:Math.min(p.min-covered(p),Math.round((p.min-covered(p))/spots/250)*250),party:0,ig:''};p.closes=cutoff();
    const draw=()=>{const r=eng.S.pubReq[p.id],me=eng.me(),left=Math.max(0,p.min-covered(p));if(o.offer>left)o.offer=left;
      const preview=[...p.group,...(me&&!r?[me.g]:[])],rs=r?r.state:'',seated=rs==='in'||rs==='charged';
      head(PUB,'Public table · '+t.label,t.name);
      let acts;
      if(!r)acts=`<div class="ts-acts"><button class="btn ghost" id="sxShare" type="button">Share</button><button class="btn red" id="sxGo" type="button">Ask to join${o.offer?' · offer '+AED(o.offer):''}</button></div>${me?'':'<p class="sx-fine">You’ll make your bubl account next.</p>'}`;
      else if(rs==='pending')acts=`<div class="sx-wait"><b class="sx-pulse">Waiting for the host</b><p class="sx-fine">${r.offer?'Your offer: '+AED(r.offer)+'. ':''}Nothing is taken yet. The host sees your ranges, your match${r.offer?', your offer':''}${eng.S.acct&&eng.S.acct.social?' and your social link':''}. It lapses in ${lt(r.exp-Date.now())} if they don’t answer.</p></div><button class="sx-link" id="sxOut" type="button">Take my request back</button>`;
      else if(rs==='acc')acts=`<div class="sx-wait"><b class="sx-ok2">The host accepted</b><p class="sx-fine">Hold your card within ${lt(r.cardDue-Date.now())} to take the seat. Held, not charged, until the minimum is covered by ${esc(p.closes)}.</p></div><button class="btn red full" id="sxHold" type="button">Hold ${AED(r.offer)} + ${AED(Math.round(r.offer*PUB_FEE))} bubl fee</button><button class="sx-link" id="sxOut" type="button">Take my request back</button>`;
      else acts=`<div class="sx-wait"><b class="sx-ok2">${rs==='charged'?'Your seat is confirmed':'On the table'}</b><p class="sx-fine">${rs==='charged'?'The minimum is covered and every hold was charged. '+(r.offer?AED(r.offer)+' went to Ushuaïa, never to the host.':''):r.offer?AED(r.offer)+' held on your card. Charged once the minimum is covered.':'You joined with no offer.'}</p></div>${rs==='charged'?'':'<button class="sx-link" id="sxOut" type="button">Take my request back</button>'}<button class="btn ghost full" id="sxFb" type="button">After the night: bubl needs your feedback</button>`;
      body(`<div class="ts-facts"><div><b>${AED(left)}</b><span>left of ${AED(p.min)}</span></div><div><b>${p.group.length} of ${p.cap}</b><span>in the group</span></div><div><b>${esc(p.closes)}</b><span>closes · ${leftTime(p.left)} left</span></div></div>
        <div class="sx-host"><span class="sx-k">Host</span><span>${rs==='charged'&&p.host.name?esc(p.host.name)+' · ':''}${hostLine(p.host)}</span><span class="sx-ok">Number verified</span></div>${me?matchRow(p.host,'You and the host'):''}
        <div class="sx-m"><div class="sx-mh"><span>Minimum ${AED(p.min)}</span><span><b>${AED(left)}</b> left</span></div>${minbar(p,r?0:o.offer)}<div class="sx-mh" style="margin:6px 0 0"><span>${p.paid.length} contribution${p.paid.length===1?'':'s'} so far${!r&&o.offer?' · <b style="color:rgb('+GR+')">green is yours</b>':''}</span></div></div>
        <div class="sx-m"><div class="sx-mh"><span>The group${!r&&me?' with you':''}</span><span>${preview.length} of ${p.cap}</span></div>${gbar(preview)}</div>
        <p class="ts-state">If the minimum isn’t covered by ${esc(p.closes)}, the table cancels and every hold is released.</p>
        ${r?'':`<h4>Your offer · only the host sees it</h4>
        <div class="sx-amt"><small>AED</small><b id="sxAmt">${o.offer.toLocaleString('en-US')}</b></div>
        <input class="sx-range" id="sxRange" type="range" min="0" max="${left}" step="50" value="${o.offer}" aria-label="Your contribution">
        <div class="sx-pills">${[[0,'Nothing'],[Math.round(left/4/50)*50,'¼ of it'],[Math.round(left/2/50)*50,'½ of it'],[left,'All of it']].map(([v,l])=>`<button class="tpill${v===o.offer?' sel':''}" data-q="${v}" type="button">${l}</button>`).join('')}</div>
        ${!o.offer&&me&&!hasIg()?`<label class="ginfo-label">Your Instagram · needed to ask with no offer</label><input class="ginfo-input" id="sxIg" autocapitalize="off" placeholder="@yourhandle" value="${esc(o.ig)}">`:''}
        <p class="sx-fine">Nothing is taken when you ask. If the host accepts, you hold your card within 12 hours (3 hours in the last 3 days)${o.offer?', with bubl’s 10% on top':''}. It’s charged only once the minimum is covered by ${esc(p.closes)}; if it isn’t, the hold drops off at once. Paid to Ushuaïa, never to the host.</p>
        <p class="sx-fine">Bringing friends? Each asks with their own bubl account.</p>`}
        <div class="sx-acts">${acts}</div>`,bd=>{
          const R=bd.querySelector('#sxRange');if(R){R.oninput=()=>{o.offer=+R.value;bd.querySelector('#sxAmt').textContent=o.offer.toLocaleString('en-US');};R.onchange=()=>keepScroll(draw);}
          bd.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>{o.offer=+x.dataset.q;keepScroll(draw);});
          const ig=bd.querySelector('#sxIg');if(ig)ig.oninput=()=>{o.ig=ig.value.trim();};
          const out=bd.querySelector('#sxOut');if(out)out.onclick=()=>{const rr=eng.S.pubReq[p.id];if(rr&&rr.offer&&rr.state==='in'){const k=p.paid.indexOf(rr.offer);if(k>-1)p.paid.splice(k,1);}if(rr&&rr.state==='in'){const k2=p.group.lastIndexOf(eng.me().g);if(k2>0)p.group.splice(k2,1);}delete eng.S.pubReq[p.id];eng.changed();keepScroll(draw);toast('Request taken back. Any hold is released.');};
          const hb=bd.querySelector('#sxHold');if(hb)hb.onclick=()=>{const rr=eng.S.pubReq[p.id];openPay({amount:rr.offer,fee:Math.round(rr.offer*PUB_FEE),held:true,title:'Your offer, '+t.name,sub:S.ev.short,onDone:()=>{rr.state='in';p.paid.push(rr.offer);p.group.push(eng.me().g);if(covered(p)>=p.min)rr.state='charged';eng.changed();if(openSheetEl===$('#sxSheet')&&sheetFor===p.id)keepScroll(draw);toast(rr.state==='charged'?'The minimum is covered. Every hold is charged and your seat is confirmed.':'Card held. Charged once the minimum is covered.');}});};
          const fb=bd.querySelector('#sxFb');if(fb)fb.onclick=()=>openFeedback(p.id,(rs==='charged'?[p.host.name||'The host']:[]),()=>openPublic(p));
          const sh=bd.querySelector('#sxShare');if(sh)sh.onclick=()=>share(p,()=>openPublic(p));
          const go=bd.querySelector('#sxGo');if(go)go.onclick=()=>{
            const done=()=>{if(!o.offer&&!hasIg()){const h=(o.ig||'').replace(/^@/,'');if(!/^[A-Za-z0-9._]{2,30}$/.test(h)){toast('Add your Instagram to ask with no offer');open();keepScroll(draw);return;}const ac=eng.S.acct;if(ac){ac.social='Instagram @'+h;saveAcct(ac);}}
              eng.S.pubReq[p.id]={state:'pending',offer:o.offer,party:[eng.me().g],exp:Date.now()+120*60000};eng.changed();open();keepScroll(draw);toast('Asked. The host sees your ranges and your match.');
              setTimeout(()=>{const rr=eng.S.pubReq[p.id];if(!rr||rr.state!=='pending')return;rr.state=rr.offer?'acc':'in';rr.cardDue=Date.now()+12*3600000;if(!rr.offer)p.group.push(eng.me().g);eng.changed();if(openSheetEl===$('#sxSheet')&&sheetFor===p.id)keepScroll(draw);toast(rr.offer?'The host accepted. Hold your card to take the seat.':`The host accepted. You’re on ${t.name}.`);},3500);};
            if(eng.me())done();else signup({amount:null,label:'Your request',done,back:()=>openPublic(p)});};});};
    sheetFor=p.id;draw();open();$('#sxBody').scrollTop=0;}


  /* ---------- public tables, as BUBL's server runs them (step 5b) ----------
     A request is one seat and takes nothing from the card; it lapses after 2 hours. If the host accepts, the guest holds their card
     within 12 hours (3 in the last 3 days) with bubl's 10% on top; every hold is charged once the minimum is covered by the cut-off.
     Asking with no offer needs an Instagram handle. No names before a seat is confirmed: ranges, the match and the offer only. */
  const PUB_FEE=.10,CUTOFF_MIN=120;
  const matchFor=x=>{const me=eng&&eng.me();return me&&x&&window.bublMatchOf?window.bublMatchOf(me,x):null;};
  const shared=x=>{const me=eng&&eng.me();if(!me||!x)return [];const c=[];if(band(me.age)[0]===band(x.age)[0])c.push(bl(band(x.age)));if(me.ind===x.ind)c.push(x.ind);if(me.nat===x.nat)c.push(x.nat);(x.hob||[]).forEach(h=>{if((me.hob||[]).includes(h))c.push(h);});return c;};
  const matchRow=(x,lbl)=>{const p=matchFor(x);if(p==null)return '';const c=shared(x);return `<div class="sx-mt"><b>${p}<small>%</small></b><span><em>${lbl||'Your match'}</em>${c.length?c.map(esc).join(' · '):'Different crowds'}</span></div>`;};
  const hasIg=()=>{const a=eng&&eng.S.acct;return !!(a&&/^Instagram\s*@?\S+/i.test(a.social||''));};
  const lt=ms=>{const m=Math.max(0,Math.round(ms/60000));return (m>=60?Math.floor(m/60)+'h ':'')+(m%60)+'m';};
  const cutoff=()=>at(S.ev,-CUTOFF_MIN);
  if(!document.getElementById('bmDefsU')){const d=document.createElement('div');d.id='bmDefsU';d.innerHTML='<svg class="bm-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>\n<radialGradient id="lbGlass" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".015"/><stop offset=".7" stop-color="#fff" stop-opacity=".03"/><stop offset=".88" stop-color="#E6D6FF" stop-opacity=".16"/><stop offset=".965" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity=".62"/></radialGradient>\n<radialGradient id="lbRimM" cx="50%" cy="50%" r="50%"><stop offset=".58" stop-color="#000"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></radialGradient>\n<mask id="lbRim"><circle cx="32" cy="32" r="28" fill="url(#lbRimM)"/></mask>\n<radialGradient id="lbF1" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#D9B774"/><stop offset="1" stop-color="#D9B774" stop-opacity="0"/></radialGradient>\n<radialGradient id="lbF2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9A63F0" stop-opacity=".95"/><stop offset="1" stop-color="#9A63F0" stop-opacity="0"/></radialGradient>\n<radialGradient id="lbF3" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#E8A2BE" stop-opacity=".95"/><stop offset="1" stop-color="#E8A2BE" stop-opacity="0"/></radialGradient>\n<radialGradient id="lbF4" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F3E2B8" stop-opacity=".95"/><stop offset="1" stop-color="#F3E2B8" stop-opacity="0"/></radialGradient>\n<radialGradient id="lbSpec" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>\n<radialGradient id="lbCaus" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF1D8" stop-opacity=".6"/><stop offset="1" stop-color="#FFF1D8" stop-opacity="0"/></radialGradient>\n<linearGradient id="lbGlint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>\n<clipPath id="lbClip"><circle cx="32" cy="32" r="28"/></clipPath>\n</defs></svg>';d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';document.body.appendChild(d);}
  /* the real bubl mark, from Sk's builds */
  function bublMarkU(cls){return '<svg class="bm'+(cls?' '+cls:'')+'" viewBox="0 0 64 64" aria-hidden="true"><g clip-path="url(#lbClip)"><g class="bm-f" mask="url(#lbRim)"><g class="bf-a"><ellipse cx="46" cy="18" rx="20" ry="14" fill="url(#lbF1)"/><ellipse cx="14" cy="44" rx="18" ry="16" fill="url(#lbF3)"/></g><g class="bf-b"><ellipse cx="48" cy="46" rx="17" ry="15" fill="url(#lbF2)"/><ellipse cx="18" cy="16" rx="12" ry="10" fill="url(#lbF4)"/></g></g><circle cx="32" cy="32" r="28" fill="url(#lbGlass)"/><ellipse cx="41" cy="45" rx="7" ry="4.5" fill="url(#lbCaus)" transform="rotate(-35 41 45)"/></g><circle class="bm-rim" cx="32" cy="32" r="27.8" fill="none" stroke="#C8A46C" stroke-opacity=".75" stroke-width="1.1"/><g class="bf-glint"><path d="M32 4.2A27.8 27.8 0 0 1 52.6 13.2" fill="none" stroke="url(#lbGlint)" stroke-width="1.4" stroke-linecap="round"/></g><ellipse class="bf-spec" cx="21.5" cy="18.5" rx="8.5" ry="4.6" fill="url(#lbSpec)" transform="rotate(-38 21.5 18.5)"/><circle cx="16.8" cy="25.4" r="1.5" fill="#fff" opacity=".85"/></svg>';}
  /* ---------- after the night: bubl needs your feedback (only bubl sees it) ---------- */
  const FB={},FB_RATE=['#ff2d55','#ff5a36','#ff9a2a','#ffd23a','#b4f03c','#39ff6a'],FB_WORD=['Not for me','Poor','Okay','Good','Great','Perfect night'];
  const FB_Q=[['match','Did everyone match their bubl profile?',['Yes, everyone','Someone looked different','Not sure']],['came','Did everyone who confirmed come?',['Everyone came','Someone didn’t','Very late']],['safe','Did anyone make you uncomfortable?',['No','Yes, tell bubl']]];
  function openFeedback(key,ppl,back){const C=FB[key]||(FB[key]={rate:null,again:'',next:{},q:{},note:'',sent:false}),me=(eng&&eng.S.acct)||{};
    const ready=()=>C.rate!=null&&C.again&&FB_Q.every(q=>C.q[q[0]]);
    const draw=()=>{head(PUB,'For bubl only',(me.first?esc(me.first)+', we':'We')+' need your feedback');
      if(C.sent){body(`<div class="sx-done"><div class="sx-tick">✓</div><b>Thank you${me.first?', '+esc(me.first):''}</b><p class="sx-fine">This never reaches the table or the venue. It keeps every bubl table honest.</p></div><div class="sx-acts"><button class="sx-link" id="sxBack" type="button">Back</button></div>`,bd=>{bd.querySelector('#sxBack').onclick=back;});return;}
      const v=C.rate;
      body(`<div class="fb-q"><b>How was your table tonight?</b><div class="fb-rate">${[0,1,2,3,4,5].map(k=>{const on=v!=null&&k<=v;return `<button type="button" class="fb-rb${on?' on':''}" data-r="${k}" aria-label="${k}" style="--rc:${on?FB_RATE[v]:'transparent'}">${bublMarkU('')}<small>${k}</small></button>`;}).join('')}</div>
        <p class="fb-rw" style="color:${v==null?'var(--mute)':FB_RATE[v]}">${v==null?'0 is the worst, 5 the best':v+' · '+FB_WORD[v]}</p></div>
        <div class="fb-q"><b>Would you sit with this group again?</b><div class="sx-pills">${['Yes','No'].map(o=>`<button class="tpill${C.again===o?' sel':''}" data-a="${o}" type="button">${o}</button>`).join('')}</div></div>
        ${ppl.length?`<div class="fb-q"><b>Anyone you’d like at your next table?</b><small>Optional</small><div class="sx-pills sx-wrap">${ppl.map((n,i)=>`<button class="tpill${C.next[i]?' sel':''}" data-n="${i}" type="button">${esc(n)}</button>`).join('')}</div></div>`:''}
        ${FB_Q.map(q=>`<div class="fb-q"><b>${q[1]}</b><div class="sx-pills sx-wrap">${q[2].map(o=>`<button class="tpill${C.q[q[0]]===o?' sel':''}" data-q="${q[0]}" data-v="${esc(o)}" type="button">${esc(o)}</button>`).join('')}</div></div>`).join('')}
        <div class="fb-q"><b>Anything else bubl should know?</b><small>Optional</small><textarea class="ginfo-input fb-note" rows="2" id="fbNote" placeholder="In your own words">${esc(C.note)}</textarea></div>
        <div class="sx-acts"><button class="btn red full" id="fbSend" type="button"${ready()?'':' disabled'}>Send privately</button><button class="sx-link" id="sxBack" type="button">Back</button></div>`,bd=>{
          bd.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{C.rate=+b.dataset.r;keepScroll(draw);});
          bd.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{C.again=b.dataset.a;keepScroll(draw);});
          bd.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{C.next[b.dataset.n]=!C.next[b.dataset.n];keepScroll(draw);});
          bd.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{C.q[b.dataset.q]=b.dataset.v;keepScroll(draw);});
          const nt=bd.querySelector('#fbNote');nt.oninput=()=>{C.note=nt.value;};
          bd.querySelector('#fbSend').onclick=()=>{if(!ready())return;C.sent=true;
            /* kept by BUBL's server with the request's record: the answers as given, plus the one yes or no the matchmaking brain reads */
            (window.__fbSent=window.__fbSent||[]).push({table:key,rating:C.rate,again:C.again,satisfied:C.again==='Yes',next:Object.keys(C.next).filter(k=>C.next[k]).map(k=>ppl[k]),q:C.q,note:C.note});keepScroll(draw);toast('Sent privately. Thank you.');};
          bd.querySelector('#sxBack').onclick=back;});};
    sheetFor='fb:'+key;draw();open();$('#sxBody').scrollTop=0;}

  /* ---------- share a public table ---------- */
  function share(p,back){const t=T(p.table),left=Math.max(0,p.min-covered(p)),code='UDH-'+String(p.mine?'H7Q2':p.id.split('-').pop()).toUpperCase(),url='bubl.app/t/'+code,M=p.group.filter(g=>g==='M').length,F=p.group.length-M;
    head(PUB,'Share',p.mine?'Share your table':'Share this table');
    body(`<p class="ts-vote">This is what people see before they open it. Names stay hidden.</p>
      <div class="sx-card"><div class="sx-card-t"><span>Ushuaïa · ${esc(S.ev.short)} · ${esc(t.label)}</span><b>${AED(left)} left to cover</b><span>${p.group.length} in · ${M} ${gs('M')} ${F} ${gs('F')} · closes ${esc(p.closes)}</span></div><div class="sx-card-u">${url}</div></div>
      <div class="ts-acts"><button class="btn ghost" id="sxCopy" type="button">Copy link</button><a class="btn red" id="sxWa" href="https://wa.me/?text=${encodeURIComponent('Join our table at Ushuaïa for '+S.ev.short+' · '+AED(left)+' left to cover · https://'+url)}" target="_blank" rel="noopener">Send on WhatsApp</a></div>
      <p class="sx-fine">Anyone who opens it needs a bubl account to request.</p>
      <button class="sx-link" id="sxBack" type="button">Back</button>`,bd=>{
        bd.querySelector('#sxCopy').onclick=()=>{try{navigator.clipboard.writeText('https://'+url).then(()=>toast('Link copied'),()=>toast('Link copied'));}catch(_){toast('Link copied');}};
        bd.querySelector('#sxBack').onclick=back;});
    open();$('#sxBody').scrollTop=0;}

  /* ---------- your table: make it public, its settings, requests ---------- */
  const sw=on=>`<span class="sx-sw${on?' on':''}" aria-hidden="true"></span>`;
  const stepper=(k,lbl)=>`<span class="sx-step"><button type="button" data-st="${k}-" aria-label="Fewer">−</button><b>${lbl}</b><button type="button" data-st="${k}+" aria-label="More">+</button></span>`;
  const minsTo=hm=>{const [h,m]=hm.split(':').map(Number),[dh,dm]=S.ev.doors.split(':').map(Number);return ((h*60+m)-(dh*60+dm)+1440)%1440||60;};
  const demoReq=T_=>{const l=Math.max(0,T_.min-covered(T_)),r=f=>Math.round(l*f/250)*250;
    return [{handle:'Instagram @lina.dxb',name:'Lina',g:'F',age:27,nat:'Lebanese',ind:'Media',hob:['Art','Travel'],party:['F'],offer:r(.15)},{handle:'Instagram @omar.k',name:'Omar',g:'M',age:30,nat:'British',ind:'Tech',hob:['Padel','F1'],party:['M'],offer:0},{handle:'',name:'Hugo',g:'M',age:33,nat:'French',ind:'Finance',hob:['Wine','Golf'],party:['M'],offer:r(.2)}];};
  function openGoPublic(){if(!eng)return;const M=myT(),src=M||eng.booking;if(!src){toast('Hold a table first, then make it public');return;}
    const t=T(src.table),edit=!!(M&&M.isPublic),ownN=M?(M.ownN||M.group.length):src.group.length,own=src.group.slice(0,ownN),
      joined=M?src.group.slice(ownN):[],offers=M?src.paid.slice(M.ownPaid?1:0):[],cap0=Math.max(t.cap,src.cap||0),opts=eng.cfg.closeOptions;
    const o={share:M?(M.ownPaid||0):Math.round(src.min*.5/250)*250,M:own.filter(g=>g==='M').length,F:own.filter(g=>g==='F').length,closes:cutoff()};
    o.spots=edit?Math.max(1,M.cap-M.group.length):Math.max(1,cap0-own.length-joined.length);
    const draw=()=>{const grpN=o.M+o.F+joined.length,maxSp=Math.max(1,cap0-grpN);o.spots=Math.min(Math.max(1,o.spots),maxSp);
      const paid=[...(o.share?[o.share]:[]),...offers],left=Math.max(0,src.min-paid.reduce((a,b)=>a+b,0)),me=eng.me();
      head(PUB,(edit?'Public settings · ':'Make it public · ')+t.label,t.name);
      body(`<div class="ts-facts"><div><b>${AED(src.min)}</b><span>minimum spend</span></div><div><b>${o.spots}</b><span>spot${o.spots>1?'s':''} open</span></div><div><b>${AED(left)}</b><span>left to cover</span></div></div>
        <p class="ts-vote">Your table glows amber in the room for everyone with a bubl account. Guests ask for a seat and offer what they’d put towards the minimum, or nothing with their Instagram. You choose who joins.</p>
        <h4>You cover</h4>
        <div class="sx-amt"><small>AED</small><b id="sxAmt">${o.share.toLocaleString('en-US')}</b></div>
        <input class="sx-range" id="sxRange" type="range" min="0" max="${src.min}" step="250" value="${o.share}" aria-label="What you cover">
        <div class="sx-pills">${[.25,.5,.75,1].map(f=>{const v=Math.round(src.min*f/250)*250;return `<button class="tpill${v===o.share?' sel':''}" data-q="${v}" type="button">${f===1?'All of it':f===.5?'Half':f*100+'%'}</button>`;}).join('')}</div>
        <div class="sx-m"><div class="sx-mh"><span>Minimum ${AED(src.min)}</span><span><b>${AED(left)}</b> left for others</span></div>${minbar({min:src.min,paid},0)}</div>
        <h4>Your group</h4>
        <div class="sx-opt"><span>Men</span>${stepper('M',gs('M')+' '+o.M)}</div>
        <div class="sx-opt"><span>Women</span>${stepper('F',gs('F')+' '+o.F)}</div>
        ${joined.length?`<p class="sx-fine">Plus ${joined.length} guest${joined.length>1?'s':''} you accepted.</p>`:''}
        <h4>Open spots</h4>
        <div class="sx-opt"><span>Seats for guests you accept</span>${stepper('S',o.spots)}</div>
        <h4>Requests close</h4>
        <p class="sx-fine">At ${esc(o.closes)}, 2 hours before doors. Each request lapses after 2 hours if you don’t answer.</p>
        <p class="ts-state">If the minimum isn’t covered by ${esc(o.closes)}, every guest’s hold is released at once and the table is simply your booking again. Guests’ offers go to Ushuaïa, never to you.</p>
        <h4>What people see</h4>
        <div class="sx-host"><span class="sx-k">Host</span><span>${me?hostLine(me):'Your age range, industry and nationality'}</span><span class="sx-ok">Number verified</span></div>
        <p class="sx-fine">Never your name. A guest sees it once their own seat is confirmed.</p>
        <div class="sx-acts"><div class="ts-acts"><button class="btn ghost" id="sxLater" type="button">${edit?'Cancel':'Keep it private'}</button><button class="btn red" id="sxGo" type="button">${edit?'Save':'Go public'}</button></div></div>`,bd=>{
          const R=bd.querySelector('#sxRange');R.oninput=()=>{o.share=+R.value;bd.querySelector('#sxAmt').textContent=o.share.toLocaleString('en-US');};R.onchange=()=>keepScroll(draw);
          bd.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>{o.share=+x.dataset.q;keepScroll(draw);});
          bd.querySelectorAll('[data-c]').forEach(x=>x.onclick=()=>{o.closes=x.dataset.c;keepScroll(draw);});
          bd.querySelectorAll('[data-st]').forEach(x=>x.onclick=()=>{const k=x.dataset.st[0],d=x.dataset.st[1]==='+'?1:-1;
            if(k==='S')o.spots+=d;else{o[k]=Math.max(0,o[k]+d);if(o.M+o.F<1)o[k]=1;if(o.M+o.F+joined.length>cap0)o[k]-=1;}keepScroll(draw);});
          bd.querySelector('#sxLater').onclick=()=>{closeSheet();if(!edit)toast('Kept private. You can make it public any time under your booking');};
          bd.querySelector('#sxGo').onclick=()=>{const go=()=>publish(src,o,joined,offers);if(edit){go();return;}
            if(eng.me())hold(o.share,'Your share of '+t.name,go,()=>openGoPublic(),'Go public');
            else signup({amount:o.share,label:'Your share of '+t.name,charge:'Only when the table confirms',h:'Go public',cta:'Go public',done:go,back:()=>openGoPublic()});};});};
    sheetFor='golive';draw();open();$('#sxBody').scrollTop=0;}
  function publish(src,o,joined,offers){const me=eng.me(),t=T(src.table),M0=myT(),edit=!!(M0&&M0.isPublic);
    const own=[...Array(o.M).fill('M'),...Array(o.F).fill('F')];const k=me?own.indexOf(me.g):-1;if(k>0){own.splice(k,1);own.unshift(me.g);}
    const T_=M0||{table:src.table,min:src.min,requests:[]};
    Object.assign(T_,{isPublic:true,ownN:own.length,ownPaid:o.share,paid:[...(o.share?[o.share]:[]),...offers],group:[...own,...joined],closes:o.closes,left:minsTo(o.closes)});
    T_.cap=T_.group.length+o.spots;
    eng.data.myTable=T_;eng.booking=null;mine={ev:S.ev.id,tbl:T_};
    const first=!T_.requests.length;if(first)eng.cfg.demoRequests=demoReq(T_);
    eng.changed();
    if(edit){closeSheet();toast('Saved');return;}
    share(Object.assign({mine:true},T_),()=>openHost());setTimeout(()=>toast(`${t.name} is public. It glows amber in the room.`),400);
    if(first&&eng.cfg.demo!==false)eng.simulateRequests();}
  let drawHost=()=>{};
  function openHost(){if(!myT())return;
    drawHost=()=>{const T_=myT();if(!T_){closeSheet();return;}const t=T(T_.table),left=Math.max(0,T_.min-covered(T_)),nw=T_.requests.filter(r=>r.state==='new').length,spots=Math.max(0,T_.cap-T_.group.length);
      head(PUB,'Your table · '+t.label,t.name);
      body(`<button class="sx-tog" id="sxTog" type="button"><span><b>${T_.isPublic?'Public':'Private'}</b><span>${T_.isPublic?'Glowing in the room · anyone with a bubl account can request to join':'Only you and the people you invite'}</span></span>${sw(T_.isPublic)}</button>
        ${T_.isPublic?`<div class="sx-opt"><span>${spots} spot${spots===1?'':'s'} open · closes ${esc(T_.closes)}</span><button class="sx-edit" id="sxEdit" type="button">Edit</button></div>`:''}
        <div class="ts-facts"><div><b>${AED(left)}</b><span>left of ${AED(T_.min)}</span></div><div><b>${T_.group.length} of ${T_.cap}</b><span>in the group</span></div><div><b>${esc(T_.closes)}</b><span>closes · ${leftTime(T_.left)}</span></div></div>
        <div class="sx-m"><div class="sx-mh"><span>Minimum ${AED(T_.min)}</span><span><b>${AED(left)}</b> left</span></div>${minbar(T_,0)}</div>
        <div class="sx-m"><div class="sx-mh"><span>The group</span><span>${T_.group.length} in · ${spots} spot${spots===1?'':'s'}</span></div>${gbar(T_.group)}</div>
        <p class="ts-state">If the minimum isn’t covered by ${esc(T_.closes)}, the table cancels and every hold is released instantly.</p>
        <h4>Requests${nw?' · '+nw+' new':''}</h4>
        ${T_.requests.length?T_.requests.map(r=>{const m=matchFor(r),cov=covered(T_)>=T_.min,line=r.state==='new'?'Lapses in '+lt((r.exp||Date.now())-Date.now())+' if you don’t answer':r.state==='acc'?(r.offer?'Accepted · their card is due within 12 hours':'Accepted · joins with no offer'):r.state==='held'?(cov?'Seat confirmed · '+esc(r.name||'Guest'):r.offer?'Card held · charged once the minimum is covered':'On the table'):'Declined';
          return `<div class="sx-req${r.state!=='new'?' done':''}"><div class="h"><span>${r.handle?esc(r.handle):'<span class="sx-dim">No social link</span>'}${m!=null?` <i class="sx-rm">${m}% match</i>`:''}</span><span>${r.offer?AED(r.offer):'<span class="sx-dim">No offer</span>'}</span></div>
          <div class="s">${hostLine(r)}${r.hob&&r.hob.length?' · '+r.hob.map(esc).join(', '):''}</div>
          ${r.state==='new'?`<div class="a"><button class="btn ghost" data-dec="${r.id}" type="button">Decline</button><button class="btn red" data-acc="${r.id}" type="button">Accept</button></div>`:`<div class="s" style="color:${r.state==='dec'?'var(--mute)':'rgb('+GR+')'}">${line}</div>`}</div>`;}).join(''):`<p class="sx-fine">${T_.isPublic?'Requests appear here. You’ll get a message for each one.':'Make the table public to receive requests.'}</p>`}
        ${T_.requests.some(r=>r.state==='held')&&covered(T_)>=T_.min?'<button class="btn ghost full" id="sxFbH" type="button">After the night: bubl needs your feedback</button>':''}
        <div class="sx-acts">${T_.isPublic?'<button class="btn red full" id="sxShare" type="button">Share link</button>':'<button class="btn red full" id="sxPub" type="button">Make it public</button>'}</div>`,bd=>{
          bd.querySelector('#sxTog').onclick=()=>T_.isPublic?confirmPrivate():openGoPublic();
          const ed=bd.querySelector('#sxEdit');if(ed)ed.onclick=()=>openGoPublic();
          const pb=bd.querySelector('#sxPub');if(pb)pb.onclick=()=>openGoPublic();
          const sh=bd.querySelector('#sxShare');if(sh)sh.onclick=()=>share(Object.assign({mine:true},T_),()=>openHost());
          bd.querySelectorAll('[data-acc]').forEach(x=>x.onclick=()=>{const r=T_.requests.find(y=>y.id===x.dataset.acc);r.state='acc';T_.group.push(r.party[0]);eng.changed();toast(r.offer?'Accepted. They have 12 hours to hold their card.':'Accepted. They join with no offer.');
            if(r.offer)setTimeout(()=>{if(r.state!=='acc')return;r.state='held';T_.paid.push(r.offer);eng.changed();toast(`${r.handle||'Guest'} held their card · ${AED(r.offer)} towards the minimum`);},4500);else r.state='held';});
          bd.querySelectorAll('[data-dec]').forEach(x=>x.onclick=()=>{const r=T_.requests.find(y=>y.id===x.dataset.dec);r.state='dec';eng.changed();toast('Declined. Nothing was taken from their card.');});
          const fh=bd.querySelector('#sxFbH');if(fh)fh.onclick=()=>openFeedback('mine',T_.requests.filter(r=>r.state==='held').map(r=>r.name||'Guest'),()=>openHost());});};
    sheetFor='host';drawHost();open();$('#sxBody').scrollTop=0;}
  function confirmPrivate(){const T_=myT();if(!T_)return;const t=T(T_.table),pend=T_.requests.filter(r=>r.state==='new').length;
    head(PUB,'Make private · '+t.label,t.name);sheetFor='private';
    body(`<p class="ts-vote">Make your table private? It stops glowing in the room and leaves the public tables.${pend?` ${pend} pending request${pend>1?'s are':' is'} declined and ${pend>1?'their holds are':'the hold is'} released.`:''} Guests you already accepted stay on the table.</p>
      <div class="sx-acts"><div class="ts-acts"><button class="btn ghost" id="sxKeep" type="button">Keep it public</button><button class="btn red" id="sxPriv" type="button">Make private</button></div></div>`,bd=>{
        bd.querySelector('#sxKeep').onclick=()=>openHost();
        bd.querySelector('#sxPriv').onclick=()=>{T_.isPublic=false;T_.requests.forEach(r=>{if(r.state==='new')r.state='dec';});clearTimeout(eng._simT1);clearTimeout(eng._simT2);closeSheet();eng.changed();toast(`${t.name} is private. It stops glowing in the room.`);};});
    open();$('#sxBody').scrollTop=0;}

  /* ---------- holds, log in and the bubl account, in the booking's own style ---------- */
  function hold(amount,label,done,back,cta){head('var(--acc)','Confirm',label);
    body(`${kv('Amount',amount?AED(amount):'None')}${kv('Charged','Only when it confirms')}${kv('If it cancels','Released straight away')}
      <div class="sx-acts"><button class="btn ${amount?'pri':'red'} full" id="sxPay" type="button">${amount?' Pay':(cta||'Send request')}</button><button class="sx-link" id="sxBack" type="button">Back</button></div>`,bd=>{
        bd.querySelector('#sxPay').onclick=()=>{done();};bd.querySelector('#sxBack').onclick=back;});open();}
  function saveAcct(a){try{localStorage.setItem(ACCT_KEY,JSON.stringify(a));}catch(_){}eng.S.acct=a;}
  const phoneBlock=a=>`<label class="ginfo-label">Mobile number</label><div class="sx-row"><input class="ginfo-input" style="flex:0 0 78px" id="sxCc" value="${esc(a.cc||'+971')}"><input class="ginfo-input" id="sxPh" inputmode="tel" value="${esc(a.phone||'')}" placeholder="50 123 4567"></div>
    ${a.otp?'<p class="sx-ok3">Number verified</p><div class="sx-otp"><i>4</i><i>8</i><i>2</i><i>1</i></div>':'<button class="btn ghost full" id="sxOtp" type="button" style="margin-top:10px">Send code</button><div class="sx-otp" id="sxOtpBox" style="opacity:.4"><i></i><i></i><i></i><i></i></div>'}`;
  function bindPhone(bd,a,after){const b=bd.querySelector('#sxOtp');if(!b)return;b.onclick=()=>{a.phone=(bd.querySelector('#sxPh')||{}).value||'';b.textContent='Code sent';const box=bd.querySelector('#sxOtpBox');box.style.opacity=1;
    '4821'.split('').forEach((x,k)=>setTimeout(()=>{box.children[k].textContent=x;if(k===3){a.otp=true;toast('Number verified');after&&after();}},350+k*260));};}
  function login(then){const a={otp:false};
    const paint=()=>{head('var(--acc)','bubl account','Log in to bubl');
      body(`<p class="ts-vote">One bubl account works at every venue.</p>${phoneBlock(a)}
        <div class="sx-acts"><button class="btn red full" id="sxIn" type="button" ${a.otp?'':'disabled'}>Log in</button><button class="sx-link" id="sxNew" type="button">New here? Make a bubl account</button></div>`,bd=>{
          bindPhone(bd,a,paint);
          bd.querySelector('#sxIn').onclick=()=>{let acct=null;try{acct=JSON.parse(localStorage.getItem(ACCT_KEY));}catch(_){}
            if(!acct||!acct.verified)acct={first:'Sam',last:'K',verified:true,social:'@samk',email:'sam@example.com',phone:a.phone,profile:{g:'M',age:30,nat:'Lebanese',ind:'Founder',hob:['Padel','F1','Travel']}};
            saveAcct(acct);eng.changed();toast('Welcome back, '+acct.first);then&&then();};
          bd.querySelector('#sxNew').onclick=()=>signup({done:then,back:()=>login(then)});});};
    paint();open();}
  function signup(ctx){const d={g:'',nat:'',ind:'',hob:[]},a={first:'',last:'',dob:'',email:'',social:'',otp:false,id:null,stage:'',idDone:false,c1:false,c2:false};let i=0;
    const val=(bd,s)=>{const e=bd.querySelector(s);return e?e.value.trim():'';};
    const picks=(f,list,multi)=>`<div class="sx-pills sx-wrap" data-f="${f}"${multi?` data-multi="${multi}"`:''}>${list.map(x=>`<button class="tpill${(multi?d.hob.includes(x[0]):d[f]===x[0])?' sel':''}" data-v="${x[0]}" type="button">${x[1]}</button>`).join('')}</div>`;
    const L=a=>a.map(x=>[x,x]);
    const steps=[
      {h:'Make your bubl account',b:()=>`<p class="ts-vote">Takes a minute, and works at every venue.</p>${phoneBlock(a)}<label class="ginfo-label">Email</label><input class="ginfo-input" id="sxEm" type="email" value="${esc(a.email)}" placeholder="you@email.com" autocapitalize="off">
         <button class="sx-link" id="sxHave" type="button">Already have a bubl account? Log in</button>`,
       bind:bd=>{bindPhone(bd,a,()=>{a.email=val(bd,'#sxEm');paint();});bd.querySelector('#sxHave').onclick=()=>login(ctx.done);},
       save:bd=>{a.phone=val(bd,'#sxPh')||a.phone;a.email=val(bd,'#sxEm');if(!a.otp)return 'Verify your number first';if(!/.+@.+\..+/.test(a.email))return 'Add your email';}},
      {h:'About you',b:()=>`<p class="ts-vote">Your name stays hidden. Only the people at your table see it, once your seat is confirmed.</p><p class="sx-fine">Your name must match your ID at the door, or entry isn’t guaranteed.</p>
         <div class="sx-row"><div style="flex:1"><label class="ginfo-label">First name</label><input class="ginfo-input" id="sxFn" value="${esc(a.first)}" autocomplete="given-name"></div><div style="flex:1"><label class="ginfo-label">Last name</label><input class="ginfo-input" id="sxLn" value="${esc(a.last)}" autocomplete="family-name"></div></div>
         <label class="ginfo-label">Date of birth · tables see an age range</label><input class="ginfo-input" id="sxDob" type="date" value="${esc(a.dob)}">
         <label class="ginfo-label">Gender</label>${picks('g',[['F','♀ Woman'],['M','♂ Man']])}
         <label class="ginfo-label">Nationality</label>${picks('nat',L(NAT.concat(['Other'])))}
         <label class="ginfo-label">Industry</label>${picks('ind',L(IND))}
         <label class="ginfo-label">Hobbies · up to 4</label>${picks('hob',L(HOB),4)}`,
       bind:bd=>bd.querySelectorAll('[data-f]').forEach(row=>{const f=row.dataset.f,multi=+row.dataset.multi||0;row.querySelectorAll('.tpill').forEach(b=>b.onclick=()=>{
         if(multi){const v=b.dataset.v,k=d.hob.indexOf(v);if(k>-1)d.hob.splice(k,1);else{if(d.hob.length>=multi){toast('Up to '+multi);return;}d.hob.push(v);}b.classList.toggle('sel',d.hob.includes(v));}
         else{d[f]=b.dataset.v;row.querySelectorAll('.tpill').forEach(x=>x.classList.toggle('sel',x===b));}});}),
       save:bd=>{a.first=val(bd,'#sxFn');a.last=val(bd,'#sxLn');a.dob=val(bd,'#sxDob');if(!a.first||!a.last)return 'Add your first and last name, as on your ID';if(nameCheck(a.first+' '+a.last)==='blocked')return NAME_BLOCKED;if(!a.dob)return 'Add your date of birth';
         const age=Math.floor((Date.now()-new Date(a.dob))/31557600000);if(!(age>=21))return 'Public tables are 21+';d.age=Math.min(age,80);
         if(!d.g)return 'Pick your gender';if(!d.nat)return 'Pick your nationality';if(!d.ind)return 'Pick your industry';if(!d.hob.length)return 'Pick at least one hobby';}},
      {h:'Social link',skip:true,b:()=>`<p class="ts-vote">Optional, and only shown to a host with your request. To ask for a public seat with no offer, an Instagram handle is needed.</p><label class="ginfo-label">Instagram, LinkedIn, TikTok or X</label><input class="ginfo-input" id="sxSo" value="${esc(a.social)}" placeholder="@handle or link" autocapitalize="off">`,
       save:bd=>{a.social=val(bd,'#sxSo');}},
      {h:'Verify your ID',off:true,b:()=>{
         if(a.idDone)return `<div class="sx-done"><div class="sx-tick">✓</div><b>${esc(a.id)} · matched</b><p class="sx-fine">21+ confirmed. Your ID is never shown to anyone.</p></div>`;
         if(a.id)return `<div class="sx-scan">${a.id==='UAE Pass'?'<b class="sx-pulse">Waiting for approval in UAE Pass…</b>':`<div class="${a.stage==='selfie'?'face':'doc'}"></div><div class="ln"></div>`}</div><p class="sx-fine" style="text-align:center">${a.id==='UAE Pass'?'':a.stage==='selfie'?'Now a quick selfie to match it':'Hold it inside the frame'}</p>`;
         return `<p class="ts-vote">Everyone on a public table is verified. Done once, for every venue.</p>${[['UAE Pass','Residents · one tap'],['Emirates ID','Scan and a selfie'],['Passport','Visitors · scan and a selfie']].map(([k,s])=>`<button class="sx-id" data-id="${k}" type="button"><div><b>${k}</b><span>${s}</span></div><i>›</i></button>`).join('')}`;},
       bind:bd=>bd.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{a.id=b.dataset.id;a.stage='doc';paint();
         if(a.id==='UAE Pass')setTimeout(()=>{a.idDone=true;paint();},2000);else{setTimeout(()=>{a.stage='selfie';paint();},1800);setTimeout(()=>{a.idDone=true;paint();},3600);}}),
       save:()=>{if(!a.idDone)return 'Verify your ID to continue';}},
      {h:ctx.h||(ctx.amount!=null?'Send your request':'You’re set'),last:true,b:()=>`
         <button class="ginfo-tc2${a.c1?' on':''}" data-c="c1" type="button"><span class="gtc-box"></span><span><b>Show my ranges</b><br>Age range, gender, nationality, industry and hobbies, to the hosts I request and the guests who ask to join me</span></button>
         <button class="ginfo-tc2${a.c2?' on':''}" data-c="c2" type="button"><span class="gtc-box"></span><span><b>Show my name once I’m on a table</b><br>Only to the people at that table</span></button>
         ${ctx.amount!=null?kv(esc(ctx.label),ctx.amount?AED(ctx.amount):'None')+kv('Charged',esc(ctx.charge||'Only when it confirms'))+kv('If it cancels','Released straight away'):''}
         <div class="sx-acts"><button class="btn ${ctx.amount?'pri':'red'} full" id="sxPay" type="button" ${a.c1&&a.c2?'':'disabled'}>${ctx.amount?' Pay':ctx.cta||(ctx.amount!=null?'Send request':'Make my account')}</button></div>`,
       bind:bd=>{bd.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{a[b.dataset.c]=!a[b.dataset.c];paint();});
         bd.querySelector('#sxPay').onclick=()=>{saveAcct({first:a.first,last:a.last,email:a.email,phone:a.phone,social:a.social?(/^(instagram|linkedin|tiktok|x)\b/i.test(a.social)?a.social:'Instagram @'+a.social.replace(/^@/,'')):'',verified:false,profile:d});eng.changed();toast(ctx.cta||ctx.amount==null?'bubl account made':'bubl account made. Request sent');ctx.done&&ctx.done();};}}];
    for(let k=steps.length-1;k>=0;k--)if(steps[k].off)steps.splice(k,1);   /* the ID scan comes back once that integration is real */
    const paint=()=>{const s=steps[i];head('var(--acc)',`bubl account · ${i+1} of ${steps.length}`,s.h);
      body(`<div class="sx-prog">${steps.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>${s.b()}
        <div class="sx-acts">${s.last?'':'<button class="btn red full" id="sxNext" type="button">Continue</button>'}${s.skip?'<button class="sx-link" id="sxSkip" type="button">Skip</button>':''}<button class="sx-link" id="sxBk" type="button">Back</button></div>`,bd=>{
          s.bind&&s.bind(bd);
          const n=bd.querySelector('#sxNext');if(n)n.onclick=()=>{const err=s.save&&s.save(bd);if(err){toast(err);return;}i++;paint();bd.scrollTop=0;};
          const sk=bd.querySelector('#sxSkip');if(sk)sk.onclick=()=>{a.social='';i++;paint();};
          bd.querySelector('#sxBk').onclick=()=>{if(i){i--;paint();}else if(ctx.back)ctx.back();else closeSheet();};});
      $('#sxBody').scrollTop=0;};
    paint();open();}

  /* ---------- the room: tapping a glowing table ---------- */
  function openTable(id){if(!eng)return false;const M=myT();if(M&&M.table===id){openHost();return true;}
    const b=eng.data.bubls.find(x=>x.table===id);if(b){openBubl(b);return true;}const p=eng.data.publics.find(x=>x.table===id);if(p){openPublic(p);return true;}return false;}
  window.sxOpenTable=id=>!!(eng&&eng.glowFor(id))&&openTable(id);

  /* ---------- the table sheet: hold it as a public table, or manage your own ---------- */
  function ownState(){const t=S.boothId&&T(S.boothId);if(!t||t.req||!eng)return null;const M=myT();return {t,M:M&&M.table===t.id?M:null};}
  function ownRow(){const o=ownState();if(!o)return '';const M=o.M,nw=M&&M.isPublic?M.requests.filter(r=>r.state==='new').length:0;
    const [h,s]=M&&M.isPublic?['Your public table',nw?nw+' new request'+(nw>1?'s':''):'Share the link to fill it']:M?['Your table is private','Make it public again any time before the night']:['Make it a public table','Share the minimum with people you choose'];
    return `<button class="sx-mk" type="button"><i></i><span><b>${h}</b><span>${s}</span></span><em>›</em></button>`;}
  function ownGo(){const o=ownState();if(!o)return;if(o.M)openHost();else openGoPublic();}
  function paintOwn(){const el=$('#sxOwn');if(!el)return;const html=ownRow();if(!html){el.hidden=true;el.innerHTML='';return;}el.hidden=false;el.innerHTML=html;el.querySelector('button').onclick=ownGo;}
  window.sxTableSheet=function(t,st){if(!eng||t.req)return;const acts=document.querySelector('#tsBody .ts-acts');if(!acts)return;
    if(S.boothId===t.id){const w=document.createElement('div');w.innerHTML=ownRow();const b=w.firstElementChild;if(!b)return;b.onclick=()=>{closeSheet(true);setTimeout(ownGo,60);};acts.insertAdjacentElement('afterend',b);return;}
    if(!st||!st.ok||S.boothId)return;
    const hb=$('#tsHold'),b=document.createElement('button');b.type='button';b.className='sx-tog sx-tog-ts';b.setAttribute('role','switch');
    const paint=()=>{const on=S.sxPubNext===t.id;b.setAttribute('aria-checked',on?'true':'false');
      b.innerHTML=`<span><b>Make it a public table</b><span>Glows in the room. Verified guests can request a seat and help cover the minimum.</span></span>${sw(on)}`;
      if(hb&&!st.need)hb.textContent=on?'Hold and go public':st.cta;};
    b.onclick=()=>{S.sxPubNext=S.sxPubNext===t.id?null:t.id;paint();};paint();acts.insertAdjacentElement('beforebegin',b);};
  /* the venue just held a table: hand it to the engine; if they switched public on, set it up */
  window.sxAfterBook=function(t){if(!eng)return;const go=S.sxPubNext===t.id;S.sxPubNext=null;lastBooth=S.boothId||null;
    const M=myT();if(M&&M.table!==t.id){mine=null;eng.data.myTable=null;}eng.booking=null;syncBooking();postGlow();
    if(go)setTimeout(openGoPublic,1500);};

  /* ---------- above the room: Public tables, expandable; tap a table to see it in the room ---------- */
  const BAR={k:null,sel:null};
  const colOf=k=>k==='bubl'?BUBL:PUB;
  function beamsOff(){try{dollPost({cmd:'beacon',key:'grp',off:true});dollPost({cmd:'beacon',key:'one',off:true});}catch(_){}}
  function barItems(k){if(!eng)return [];if(k==='bubl')return eng.data.bubls.map(b=>({id:b.table,b}));
    const L=eng.data.publics.map(p=>({id:p.table,p})),M=myT();if(M&&M.isPublic)L.unshift({id:M.table,p:M,mine:true});return L;}
  function barCard(it,k){const t=T(it.id),on=BAR.sel===it.id;let v,s;
    if(k==='bubl'){const b=it.b,req=eng.S.requests[b.id],inN=b.members.length+(req==='in'?1:0),st=eng.bublState(b),m=eng.bublMatch(b),need=Math.max(0,b.confirmAt-inN);
      v=`${inN}<small> of ${b.seats}</small>`;
      s=req==='in'?'<em class="ok">You’re in</em>':req==='pending'?'<em>Requested</em>':m!=null?`<em class="ok">${m}% match</em>`:st==='confirmed'||st==='full'?'Confirmed':`${need} more to confirm`;}
    else{const p=it.p,left=Math.max(0,p.min-covered(p)),r=it.mine?null:eng.S.pubReq[p.id];
      v=`<small>AED </small>${left.toLocaleString('en-US')}`;
      s=it.mine?`<em style="color:${PUB}">Your table</em>`:r?(r.state==='pending'?'<em>Requested</em>':'<em class="ok">You’re in</em>'):`left · closes ${esc(p.closes)}`;}
    return `<button class="sxc${on?' on':''}" data-id="${it.id}" type="button" aria-pressed="${on}"><span class="sxc-t"><i style="background:${TIERC[t.tier]||'#FF2D2D'}"></i>${esc(t.name)}</span><b class="sxc-v">${v}</b><span class="sxc-s">${s}</span><span class="sxc-go">${on?'Open ›':'Show in the room'}</span></button>`;}
  function addCard(){const o=ownState();if(o&&o.M&&o.M.isPublic)return '';
    return `<button class="sxc add" data-add type="button"><span class="sxc-t">Your table</span><b class="sxc-v">+</b><span class="sxc-s">${o?'Make it public':'Open your own'}</span><span class="sxc-go">${o?'Set it up ›':'How it works'}</span></button>`;}
  function paintBar(){const bar=$('#sxBar');if(!bar||!eng)return;
    ['public'].forEach(k=>{const b=bar.querySelector(`[data-k="${k}"]`);if(!b)return;const n=barItems(k).length;b.querySelector('em').textContent=n;b.classList.toggle('none',!n);b.setAttribute('aria-expanded',BAR.k===k?'true':'false');});
    const tray=$('#sxTray');tray.classList.toggle('on',!!BAR.k);if(!BAR.k)return;
    const items=barItems(BAR.k);if(BAR.sel&&!items.some(i=>i.id===BAR.sel))BAR.sel=null;
    tray.style.setProperty('--c',colOf(BAR.k));
    $('#sxHint').textContent='Tap one to see it in the room, tap again to open it.';
    const list=$('#sxList'),x=list.scrollLeft;list.innerHTML=items.map(it=>barCard(it,BAR.k)).join('')+(BAR.k==='public'?addCard():'');list.scrollLeft=x;}
  function revealRoom(){const a=$('#app'),bar=$('#sxBar');if(!a||!bar)return;const top=bar.getBoundingClientRect().top;
    if(top<56||top>140)a.scrollTo({top:a.scrollTop+top-72,behavior:'smooth'});}
  function barToggle(k){if(!eng)return;if(BAR.k===k){BAR.k=null;BAR.sel=null;beamsOff();paintBar();return;}
    const items=barItems(k);if(!items.length){toast(k==='bubl'?'No bubls tonight yet':'No public tables tonight yet');return;}
    BAR.k=k;BAR.sel=null;beamsOff();dollPost({cmd:'beacon',key:'grp',ids:items.map(i=>i.id),color:colOf(k),dur:9});paintBar();$('#sxList').scrollLeft=0;revealRoom();}
  function barPick(id){if(BAR.sel===id){openTable(id);return;}BAR.sel=id;
    dollPost({cmd:'beacon',key:'grp',off:true});dollPost({cmd:'beacon',key:'one',ids:[id],color:colOf(BAR.k),dur:14,w:11,h:260,gain:1.9,frame:true});paintBar();revealRoom();}
  function addGo(){if(ownState()){ownGo();return;}toast('Tap a table in the room, then switch on Make it a public table as you hold it');}
  (function(){const bar=$('#sxBar');if(!bar)return;bar.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>barToggle(b.dataset.k)));
    $('#sxList').addEventListener('click',e=>{const c=e.target.closest('.sxc');if(!c)return;if(c.hasAttribute('data-add'))addGo();else barPick(c.dataset.id);});})();

  /* ---------- night changes, booking changes ---------- */
  window.socialEvent=function(ev){if(!ev||ev.id===lastEv)return;lastEv=ev.id;rebuild();};
  window.__socialGlow=function(){if(!eng)return;const b=S.boothId||null;if(b!==lastBooth){lastBooth=b;const M=myT();if(M&&M.table!==b){mine=null;eng.data.myTable=null;}eng.booking=null;syncBooking();}postGlow();};
  lastBooth=S.boothId||null;lastEv=S.ev&&S.ev.id;rebuild();
})();
