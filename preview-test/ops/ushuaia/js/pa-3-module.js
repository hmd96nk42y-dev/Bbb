/* =====================================================================
   THE MODULE: tile and list
   ===================================================================== */
TMETA.paccess={ic:'users',f:'gold',s:'BUBL · LINKS',k:'own'};
M.paccess={t:'Promoter access',tall:true,
  tile:s=>{const L=paFor(W.ev.id),live=L.filter(a=>a.status==='signed'),wait=L.filter(a=>a.status==='sent'),ex=paExclusive(W.ev.id),tables=sum(paLive(W.ev.id),a=>paPool(a).length);
    return tile('paccess','Promoter access',ex?'Exclusive':live.length+'<small>signed</small>',ex?esc(paSrcLabel(ex))+' runs '+esc(W.ev.short):N(tables)+' tables held · '+N(wait.length)+' waiting to sign',
      gRows(paLive(W.ev.id).slice(0,3).map(a=>{const p=paPool(a).length,b=paPool(a).filter(id=>{const e=tableIndex(W,now())[id];return e&&e.st==='booked';}).length;return {l:paFirst(paSrcLabel(a)),v:p?b/p:0,t:b+'/'+p};}),{max:1}));},
  sub:s=>esc(W.ev.short)+' · who can sell your room, on what terms',
  detail:s=>'<div class="pa-wz">'+paListHTML(s)+'</div>',
  foot:()=>paCanEdit()?'<button class="btn pri full" data-act="paNew">'+I('plus',18)+'New promoter access</button>':''};
function paStatus(a){return a.status==='signed'?pill('ok','Signed'):a.status==='sent'?(a.openAt?pill('warn','Opened, not signed'):pill('warn','Sent, not signed')):a.status==='paused'?pill('mut','Paused'):a.status==='revoked'?pill('bad','Ended'):pill('mut','Draft');}
function paListHTML(s){const L=paFor(W.ev.id),ex=paExclusive(W.ev.id),tk=paTaken(null),open=W.tables.filter(T=>!tk[T.id]).length;
  const held=sum(paLive(W.ev.id),a=>paPool(a).length),tix=sum(paLive(W.ev.id),a=>sum(PA_TK,k=>a.tix[k]||0)),list=sum(paLive(W.ev.id),a=>a.list);
  let h=(ex?'<div class="pa-ex">'+I('star',22)+'<div><b>'+esc(paSrcLabel(ex))+' runs '+esc(W.ev.short)+'</b><span>Exclusive · '+(ex.status==='signed'?'signed':'waiting for their signature')+'. Other promoter access is paused for this event.</span></div></div>':'')+
    '<div class="pa-sum"><div><b class="n">'+n0(held)+'</b><span>tables with promoters</span></div><div><b class="n">'+n0(tix)+'</b><span>tickets allocated</span></div><div><b class="n">'+n0(list)+'</b><span>list spots</span></div></div>'+
    '<p class="note">'+N(n0(open))+' tables are still open for the house to sell. Each promoter sells only what you give them here, through their own link, so every booking lands under their name in the promoter filter.</p>';
  h+='<div class="rows">'+L.map(a=>{const p=paPool(a),r=paRates(a);return '<button class="row tap" data-act="paOpen" data-id="'+a.id+'"><div class="ri '+(a.kind==='exclusive'?'neu':a.status==='signed'?'ok':a.status==='sent'?'warn':'')+'">'+esc(initials(paSrcLabel(a)))+'</div><div class="rt"><b>'+esc(paSrcLabel(a))+(a.kind==='exclusive'?' · Exclusive':'')+'</b><span>'+
    (a.tmode==='sec'?N(a.cap)+' tables in '+N(a.secs.length)+' sections':N(p.length)+' tables')+' · '+N(n0(sum(PA_TK,k=>a.tix[k]||0)))+' tickets · '+N(a.list)+' list · '+N(paPct(r.tix))+(a.one?'':' / '+N(paPct(r.tab))+(r.bar?' / '+N(paPct(r.bar))+' bar':''))+'</span></div><div class="ra pa-row-r">'+paStatus(a)+'</div></button>';}).join('')+'</div>';
  if(!L.length)h+=empty('No promoter access for this event yet.');
  return h;}
ON.paOpen=el=>{const a=paAll().find(x=>x.id===el.dataset.id);if(a)paDetail(a);};
ON.paNew=()=>{if(!paCanEdit()){toast('Only a manager can create promoter access.');return;}paWizard(null);};
ON.paHome=()=>openMod('paccess');

/* ---------- one access ---------- */
function paDetail(a){const o=Sheet.open({tall:true,static:true,title:()=>esc(paSrcLabel(a)),sub:()=>(a.kind==='exclusive'?'Exclusive event company':'Promoter')+' · '+esc(a.events.map(id=>EVK[id].short).join(', ')),
  body:()=>'<div class="pa-wz">'+(()=>{const t=now(),tk=paTaken(a),pool=paPool(a,tk),ix=tableIndex(W,t),booked=pool.filter(id=>ix[id]&&ix[id].st==='booked').length,s=S(),r=paRates(a),td=paToDate(a);
    const tl='<div class="pa-tl"><div class="done">Drafted<small>'+fDT(a.created)+'</small></div><div class="'+(a.venueSig?'done':'')+'">Signed for Ushuaïa'+(a.venueSig?' · '+esc(a.venueSig.by.replace(/ \(.*\)/,'')):'')+'<small>'+(a.venueSig?fDT(a.venueSig.at):'')+'</small></div><div class="'+(a.sentAt?'done':'')+'">Sent on WhatsApp<small>'+(a.sentAt?fDT(a.sentAt):'')+'</small></div><div class="'+(a.openAt?'done':a.sentAt?'now':'')+'">'+(a.openAt?'Opened their link':'Not opened yet')+'<small>'+(a.openAt?fDT(a.openAt):'')+'</small></div><div class="'+(a.promoSig?'done':a.openAt?'now':'')+'">'+(a.promoSig?'Signed by '+esc(a.promoSig.by):'Waiting for their signature')+'<small>'+(a.promoSig?fDT(a.promoSig.at):'')+'</small></div></div>';
    const tix=PA_TK.map((k,i)=>({k,i,sold:paSoldBy(a.src,i),al:a.tix[k]||0})).filter(x=>x.al);
    return (a.status==='paused'?'<div class="pa-warn">'+I('pause',18)+'<div><b>Paused.</b> '+esc((paExclusive(W.ev.id)?paSrcLabel(paExclusive(W.ev.id)):'An exclusive company'))+' has this event. Bookings already made still count.</div></div>':'')+
      tl+'<div class="grp"><div class="lbl">Allocation used</div><div class="hud" style="padding:14px"><div class="pa-alloc">'+
      '<div class="a"><b>Tables</b><span>'+booked+' of '+(a.tmode==='sec'?Math.min(a.cap,pool.length):pool.length)+' booked</span><div class="pa-bar"><i style="width:'+Math.round(booked/Math.max(1,a.tmode==='sec'?Math.min(a.cap,pool.length):pool.length)*100)+'%"></i></div></div>'+
      tix.map(x=>'<div class="a"><b>'+GA[x.i].label+'</b><span>'+n0(x.sold)+' of '+n0(x.al)+'</span><div class="pa-bar"><i style="width:'+Math.min(100,Math.round(x.sold/x.al*100))+'%"></i></div></div>').join('')+
      '<div class="a"><b>Promoter list</b><span>'+n0(a.list)+' spots</span></div></div></div></div>'+
      '<div class="grp"><div class="lbl">Their cut</div><div class="hud" style="padding:14px"><div class="kv"><span>Tickets</span><b>'+N(paPct(r.tix))+'</b><span>Table minimums</span><b>'+N(paPct(r.tab))+'</b><span>Bar spend at their tables'+(a.barBase==='over'?', above minimum':'')+'</span><b>'+N(paPct(r.bar))+'</b><span>Paid</span><b>'+a.payDays+' days after close</b><span>Holds release</span><b>'+a.release+'h before doors</b><span>Earned so far</span><b class="gold">'+A(td.comm)+'</b></div></div><p class="note">Earned so far uses tickets sold and tables booked through their link, plus POS spend on those tables. It’s final once the event closes.</p></div>'+
      /* Sk, 24 Nov 2026 (answer 126): the venue chooses the door greeting per promoter. Off unless switched on;
         changing it takes the manager PIN, like every other term. */
      '<div class="grp"><div class="lbl">Greet as VIP at the door</div><div class="seg"><button class="'+(a.greetVip?'on':'')+'" data-act="paGreet" data-id="'+a.id+'" data-v="1">On</button><button class="'+(!a.greetVip?'on':'')+'" data-act="paGreet" data-id="'+a.id+'" data-v="0">Off</button></div><p class="note">'+(a.greetVip?'Their guests are greeted as VIP when they’re scanned in.':'Their guests are greeted like any other guest at the door.')+' Changing this needs a manager PIN.</p></div>'+
      '<div class="grp"><div class="lbl">Their link</div><div class="hud" style="padding:12px 14px;display:flex;align-items:center;gap:10px">'+I('link',18)+'<span class="n" style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(paLink(a).replace('https://',''))+'</span><button class="btn xs" data-act="paCopy" data-u="'+esc(paLink(a))+'">'+I('link',14)+'Copy</button></div></div>';})()+'</div>',
  foot:()=>'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn sm" data-act="paDoc" data-id="'+a.id+'">'+I('doc',17)+'Agreement</button><button class="btn sm" data-act="paFloor" data-id="'+a.id+'">'+I('floor',17)+'On the floor</button></div>'+
    (paCanEdit()&&a.status!=='revoked'?'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+(a.status==='sent'?'<button class="btn sm" data-act="paResend" data-id="'+a.id+'">'+I('send',17)+'Remind</button>':'<button class="btn sm" data-act="paEdit" data-id="'+a.id+'">'+I('edit',17)+'Change terms</button>')+'<button class="btn sm bad" data-act="paEnd" data-id="'+a.id+'">'+I('x',17)+'End access</button></div>':'')});
  return o;}
ON.paCopy=el=>copyText(el.dataset.u);
ON.paGreet=el=>{const a=paAll().find(x=>x.id===el.dataset.id),on=el.dataset.v==='1';if(!a||!!a.greetVip===on)return;
  if(!paCanEdit()||a.status==='revoked'){toast(a.status==='revoked'?'This access has ended.':'Only a manager can change a promoter’s terms.');return;}
  withPin('Greet '+paSrcLabel(a)+'’s guests as VIP at the door: '+(on?'on':'off'),m=>{a.greetVip=on;log('Promoter terms changed',paSrcLabel(a)+', VIP greeting at the door '+(on?'on':'off'),m);bump();Sheet.refresh(true);toast('Saved.');});};
ON.paDoc=el=>{const a=paAll().find(x=>x.id===el.dataset.id);Sheet.open({tall:true,title:'Agreement',sub:esc(paSrcLabel(a))+' · v'+(a.ver||1),body:()=>paDocHTML(Object.assign({},a,{chg:{}}))+'<p class="note">Drafted by BUBL from the terms you set. Have it checked by your own legal team before you rely on it.</p>'});};
ON.paFloor=el=>{const a=paAll().find(x=>x.id===el.dataset.id);Sheet.close(true);UI.floor.overlay='promo';UI.floor.promo=a.src||null;setTab('floor');};
ON.paResend=el=>{const a=paAll().find(x=>x.id===el.dataset.id);a.sentAt=now();log('Promoter access reminder',paSrcLabel(a));toast('Reminder sent to '+esc(paFirst(a.name))+' on WhatsApp.');Sheet.refresh(true);};
ON.paEdit=el=>{const a=paAll().find(x=>x.id===el.dataset.id);Sheet.close();paWizard(a,1);};
ON.paEnd=el=>{const a=paAll().find(x=>x.id===el.dataset.id);withPin('End '+paSrcLabel(a)+'’s access',m=>{a.status='revoked';a.events.map(paWorld).forEach(Wd=>Wd.holds.forEach(h=>{if(h.kind==='Promoter hold'&&h.who===paSrcLabel(a)&&!h.relAt)h.relAt=now();}));
  if(a.kind==='exclusive')paFor(W.ev.id).forEach(x=>{if(x.status==='paused')x.status=x.promoSig?'signed':'sent';});
  log('Ended promoter access',paSrcLabel(a)+', holds returned',m);bump();Sheet.close(true);toast(esc(paSrcLabel(a))+'’s access ended. Their holds are back with the house.');refresh(true);});};
