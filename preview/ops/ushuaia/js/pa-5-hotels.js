/* =====================================================================
   HOTELS
   Partner hotels get a concierge desk link. Ushuaïa holds tables for each
   hotel, sets the terms (commission to the hotel, guarantee or deposit,
   no-show charge, when free tables come back) and answers the requests a
   desk sends when its tables are taken. The desk sends each guest an
   invitation from the hotel; the guest books on it. Bookings land under
   the hotel's name as a partner source.
   Hotel names are fictional placeholders.
   ===================================================================== */
const HT={list:null,seq:0,d:null,o:null};
function htAll(){if(LIVE)return liveHtAll();   /* test and live: the venue's own agreements (live-partners.js) */
  if(HT.list)return HT.list;const t=now();
  const mk=(id,name,area,cont,role,ph,tabs,tab,tix,guar,ns,rel,stat,b,reqs)=>({id,name,area,cont,role,ph,tables:tabs,tab,tix,guar,noShow:ns,release:rel,status:stat,booked:b,reqs:reqs||[],src:null,created:W.ON+5*DAY,sentAt:W.ON+5*DAY,openAt:W.ON+5*DAY+3*HOUR});
  HT.list=CFG.HOTELS.map(h=>mk(h[0],h[1],h[2],h[3],h[4],h[5],h[6].slice(),h[7],h[8],h[9],h[10],h[11],h[12],h[13].slice(),(h[14]||[]).map(r=>({id:r.id,g:r.g,tier:r.tier,party:r.party,occ:r.occ,by:r.by,at:t-r.ago*MIN,lang:r.lang}))));
  HT.list.forEach((h,i)=>{const id='ht'+(i+1);h.src=id;
    h.tables.forEach(tid=>{if(h.booked.includes(tid))return;const ix=tableIndex(W,t);if(ix[tid])return;W.holds.push({id:'HH'+i+tid,table:tid,kind:'Hotel hold',who:h.name,from:W.ON+5*DAY,until:W.D-2*HOUR,relAt:0});});});
  return HT.list;}
/* hotel sources exist from the start, so every snapshot carries them */
if(!LIVE)CFG.HOTELS.forEach((h,i)=>{const id='ht'+(i+1);if(SRC[id])return;SOURCES.push({id,label:h[1],grp:'partner',comm:h[7]/100,i:SOURCES.length,hotel:1});SRC[id]=SOURCES[SOURCES.length-1];});
const htLink=h=>'https://bubl.app/'+PA_SLUG+'/h/'+paSlug(h.name);
const htReqs=()=>htAll().flatMap(h=>h.reqs.filter(r=>!r.ans).map(r=>Object.assign({h},r)));
function htFree(h){const ix=tableIndex(W,now());return h.tables.filter(id=>{const e=ix[id];return e&&e.st==='held'&&e.h.who===h.name;});}

TMETA.hotels={ic:'star',f:'silver',s:'BUBL · DESKS',k:'own'};
M.hotels={t:'Hotels',tall:true,
  tile:s=>{const L=htAll().filter(h=>h.status!=='ended'),rq=htReqs(),held=sum(L,h=>h.tables.length),bk=sum(L,h=>h.booked.length);
    return tile('hotels','Hotels',rq.length?rq.length+'<small>'+pl(rq.length,'request')+'</small>':L.length+'<small>desks</small>',rq.length?'From '+esc(rq.map(r=>r.h.name.replace(/^The /,'')).join(', '))+' · answer now':N(bk)+' of '+N(held)+' held tables booked by guests',
      gRows(L.filter(h=>h.tables.length).slice(0,3).map(h=>({l:h.name.replace(/^The /,'').split(' ')[0],v:h.tables.length?h.booked.length/h.tables.length:0,t:h.booked.length+'/'+h.tables.length})),{max:1}),{dot:rq.length?'warn':''});},
  sub:s=>esc(W.ev.short)+' · concierge desks and their guests',
  detail:s=>'<div class="pa-wz">'+htListHTML()+'</div>',
  foot:()=>UI.role==='owner'?'<button class="btn pri full" data-act="htNew">'+I('plus',18)+'Add a hotel</button>':''};
function htListHTML(){const L=htAll(),rq=htReqs();
  let h='';
  if(rq.length)h+='<div class="grp"><div class="lbl">Waiting for your answer · requests close 22:00 on the night</div><div class="rows">'+rq.map(r=>'<button class="row tap" data-act="htReq" data-h="'+r.h.id+'" data-r="'+r.id+'"><div class="ri warn">'+I('bell',17)+'</div><div class="rt"><b>'+esc(r.g)+' · '+TIERS[r.tier].label+', '+r.party+' guests</b><span>'+esc(r.h.name)+' · '+esc(r.by)+(r.occ?' · '+esc(r.occ):'')+' · '+fAgo(now()-r.at)+'</span></div><div class="ra">'+I('right',16)+'</div></button>').join('')+'</div></div>';
  h+='<div class="pa-sum"><div><b class="n">'+L.filter(x=>x.status==='live').length+'</b><span>desks live</span></div><div><b class="n">'+sum(L,x=>x.tables.length)+'</b><span>tables held</span></div><div><b class="n">'+sum(L,x=>x.booked.length)+'</b><span>booked by guests</span></div></div>';
  h+='<div class="rows">'+L.map(x=>'<button class="row tap" data-act="htOpen" data-id="'+x.id+'"><div class="ri '+(x.status==='live'?'ok':'warn')+'" style="font-family:Georgia,serif">'+esc(initials(x.name.replace(/^The /,'')))+'</div><div class="rt"><b>'+esc(x.name)+'</b><span>'+(x.tables.length?N(x.booked.length)+' of '+N(x.tables.length)+' tables booked':'No tables held, requests only')+' · '+N(x.tab+'%')+' to the hotel · '+(x.guar?'hotel guarantees':'guest deposit')+'</span></div><div class="ra">'+(x.status==='live'?pill('ok','Live'):pill('warn','Desk not opened'))+'</div></button>').join('')+'</div>'+
    '<p class="note">Each hotel’s desk invites its own guests to these tables. Commission goes to the hotel on a monthly statement, never to a person. A guest’s details reach you only when they book.</p>';
  return h;}
ON.htOpen=el=>{const h=htAll().find(x=>x.id===el.dataset.id);Sheet.open({tall:true,title:esc(h.name),sub:esc(h.area)+' · '+esc(h.cont)+', '+esc(h.role),body:()=>{const free=htFree(h);
  return '<div class="grp"><div class="lbl">Held for '+esc(h.name)+' at '+esc(W.ev.short)+'</div><div class="hud" style="padding:14px"><div class="pa-alloc"><div class="a"><b>Booked by their guests</b><span>'+h.booked.length+' of '+h.tables.length+'</span><div class="pa-bar"><i style="width:'+Math.round(h.booked.length/Math.max(1,h.tables.length)*100)+'%"></i></div></div></div><p class="note" style="margin-top:10px">'+(h.tables.length?h.tables.map(id=>W.T[id].name+(h.booked.includes(id)?' (booked)':free.includes(id)?'':' (taken)')).join(', '):'None')+'</p></div></div>'+
    '<div class="grp"><div class="lbl">Terms</div><div class="hud" style="padding:14px"><div class="kv"><span>To the hotel on tables</span><b>'+h.tab+'%</b><span>On tickets</span><b>'+h.tix+'%</b><span>Deposits</span><b>'+(h.guar?'Hotel guarantees':'Guest pays a deposit')+'</b>'+(h.guar?'<span>Guaranteed no-show</span><b>'+aed(h.noShow)+' off commission</b>':'')+'<span>Free tables return</span><b>'+h.release+' on the night</b><span>Paid</span><b>By Ushuaïa, from the monthly statement</b></div><button class="btn sm full" style="margin-top:12px" data-act="htTerms" data-id="'+h.id+'">'+I('edit',16)+'Change the terms</button></div></div>'+
    '<div class="grp"><div class="lbl">Desk link</div><div class="hud" style="padding:12px 14px;display:flex;align-items:center;gap:10px">'+I('link',18)+'<span class="n" style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(htLink(h).replace('https://',''))+'</span><button class="btn xs" data-act="paCopy" data-u="'+esc(htLink(h))+'">Copy</button></div><p class="note">The whole concierge team shares this desk. Guests never see it; they only get the invitation the desk sends.</p></div>';},
  foot:()=>'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn sm" data-act="htFloor" data-id="'+h.id+'">'+I('floor',17)+'On the floor</button><button class="btn sm" data-act="htSendDesk" data-id="'+h.id+'">'+I('send',17)+'Send desk link</button></div>'});};
ON.htTerms=el=>{const h=htAll().find(x=>x.id===el.dataset.id),d={tab:h.tab,tix:h.tix,guar:h.guar,noShow:h.noShow||0,release:h.release};
  const o=Sheet.open({static:true,title:'Terms for '+esc(h.name),sub:'As in their contract. The desk sees the change straight away.',body:()=>
    '<div class="pa-two"><div class="pa-fld"><label>On table minimums <small>· %</small></label><input class="inp" data-tk="tab" inputmode="numeric" value="'+d.tab+'"></div><div class="pa-fld"><label>On tickets <small>· %</small></label><input class="inp" data-tk="tix" inputmode="numeric" value="'+d.tix+'"></div></div>'+
    '<div class="grp"><div class="lbl">Deposits</div><div class="seg"><button class="'+(d.guar?'on':'')+'" data-act="htTG" data-v="1">Hotel guarantees</button><button class="'+(!d.guar?'on':'')+'" data-act="htTG" data-v="0">Guest holds a deposit</button></div></div>'+
    (d.guar?'<div class="pa-fld"><label>No-show charge <small>· AED, off the hotel’s commission</small></label><input class="inp" data-tk="noShow" inputmode="numeric" value="'+d.noShow+'"></div>':'')+
    '<div class="grp"><div class="lbl">Free tables come back</div><div class="pa-terms">'+['16:00','18:00','20:00'].map(x=>'<button class="'+(d.release===x?'on':'')+'" data-act="htTR" data-v="'+x+'"><b>'+x+'</b><span>on the night</span></button>').join('')+'</div></div>',
    foot:()=>'<button class="btn pri full" data-act="htTSave">'+I('lock',17)+'Save the terms</button>',
    onPaint:el=>{$$('[data-tk]',el).forEach(i=>i.addEventListener('input',()=>{d[i.dataset.tk]=Math.max(0,parseInt(i.value.replace(/\D/g,''),10)||0);}));}});
  const re=()=>{o._b=null;o._f=null;Sheet.paint(o);};
  ON.htTG=e=>{d.guar=e.dataset.v==='1';re();};ON.htTR=e=>{d.release=e.dataset.v;re();};
  ON.htTSave=()=>{if(d.tab>30||d.tix>30){toast('That rate looks too high. Check the contract.');return;}
    withPin('Hotel terms: '+h.name,m=>{const was=h.tab+'% / '+h.tix+'% / '+(h.guar?'guarantee, no-show '+aed(h.noShow):'deposit');Object.assign(h,d);
      log('Hotel terms changed',h.name+': '+was+' → '+h.tab+'% / '+h.tix+'% / '+(h.guar?'guarantee, no-show '+aed(h.noShow):'deposit'),m);bump();Sheet.close();toast('Saved. '+esc(h.name)+'’s desk shows the new terms.');refresh(true);});};};
ON.htFloor=el=>{const h=htAll().find(x=>x.id===el.dataset.id);Sheet.close(true);UI.floor.overlay='vip';setTab('floor');toast(esc(h.name)+'’s tables show as Held.');};
ON.htSendDesk=el=>{const h=htAll().find(x=>x.id===el.dataset.id);const m='Hello '+paFirst(h.cont)+', here is the '+h.name+' concierge desk for Ushuaïa Dubai Harbour, Season 3. Invite your guests to the tables we hold for you, and send us requests for anything else: '+htLink(h)+'\n– '+ROLES.owner.who+', Ushuaïa';window.open('https://wa.me/'+String(h.ph).replace(/\D/g,'')+'?text='+encodeURIComponent(m),'_blank','noopener');h.sentAt=now();log('Hotel desk link sent',h.name);};

/* ---------- answer a request from a desk ---------- */
ON.htReq=el=>{const h=htAll().find(x=>x.id===el.dataset.h),r=h.reqs.find(x=>x.id===el.dataset.r);const ix=tableIndex(W,now());
  const grp=TIERS[r.tier].grp,open=W.tables.filter(T=>!ix[T.id]&&!T.oos&&TIERS[T.tier].grp===grp&&!TIERS[T.tier].req&&T.cap>=Math.min(r.party,TIERS[T.tier].cap)).slice(0,6);let pick=open[0]&&open[0].id;
  const o=Sheet.open({title:esc(r.g),sub:esc(h.name)+' asks for '+TIERS[r.tier].label+' · '+r.party+' guests',static:true,body:()=>'<div class="hud" style="padding:14px"><div class="kv"><span>From</span><b>'+esc(r.by)+', '+esc(h.name)+'</b><span>Asked</span><b>'+fAgo(now()-r.at)+'</b>'+(r.occ?'<span>Occasion</span><b>'+esc(r.occ)+'</b>':'')+'<span>Guest’s language</span><b>'+{en:'English',ar:'Arabic',fr:'French',ru:'Russian',zh:'Chinese'}[r.lang]+'</b><span>Deposits</span><b>'+(h.guar?'Hotel guarantees':'Guest pays a deposit')+'</b></div></div>'+
    (open.length?'<div class="grp"><div class="lbl">Open '+TIERS[r.tier].label+' tables</div><div class="chips" style="flex-wrap:wrap">'+open.map(T=>'<button class="chip '+(pick===T.id?'on':'')+'" data-act="htPick" data-t="'+T.id+'">'+esc(T.name)+' · '+kfmt(T.min)+'</button>').join('')+'</div></div><p class="note">Saying yes holds the table for '+esc(h.name)+'. The guest’s invitation updates by itself and they book it from there.</p>':'<p class="note">No open '+TIERS[r.tier].label+' tables. Decline, or the desk can offer the guest another tier.</p>'),
    foot:()=>'<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:8px"><button class="btn sm bad" data-act="htNo">Decline</button><button class="btn sm pri" data-act="htYes" '+(pick?'':'disabled')+'>'+I('check',17)+'Hold '+(pick?esc(W.T[pick].name):'a table')+'</button></div>'});
  ON.htPick=e=>{pick=e.dataset.t;o._b=null;o._f=null;Sheet.paint(o);};
  ON.htYes=()=>{if(!pick)return;r.ans='yes';r.table=pick;r.ansAt=now();h.tables.push(pick);W.holds.push({id:'HR'+r.id,table:pick,kind:'Hotel hold',who:h.name,from:now(),until:W.D+2*HOUR,relAt:0,op:1});log('Hotel request approved',h.name+': '+W.T[pick].name+' for '+r.g);bump();Sheet.close();toast(W.T[pick].name+' held for '+esc(h.name)+'. Their guest can book it now.');Sheet.refresh(true);refresh(true);};
  ON.htNo=()=>{r.ans='no';r.ansAt=now();log('Hotel request declined',h.name+': '+r.g);bump();Sheet.close();toast('Declined. '+esc(h.name)+'’s desk and the guest’s card both show it.');Sheet.refresh(true);refresh(true);};};

/* ---------- add a hotel ---------- */
ON.htNew=()=>{const d=Object.assign({name:'',area:'',cont:'',ph:'',tables:[],zoom:null},CFG.HT_BLANK);HT.d=d;
  const free=()=>{const ix=tableIndex(W,now());return W.tables.filter(T=>!ix[T.id]&&!T.oos&&T.grp!=='bs');};
  const o=Sheet.open({tall:true,static:true,title:'Add a hotel',sub:'Its concierge desk gets a link to invite guests',body:()=>{const f=free();
    return '<div class="pa-fld"><label>Hotel</label><input class="inp" data-hk="name" value="'+esc(d.name)+'" placeholder="Hotel name" maxlength="50"></div>'+
      '<div class="pa-two"><div class="pa-fld"><label>Area</label><input class="inp" data-hk="area" value="'+esc(d.area)+'" placeholder="Palm Jumeirah" maxlength="30"></div><div class="pa-fld"><label>Desk WhatsApp</label><input class="inp" data-hk="ph" value="'+esc(d.ph)+'" inputmode="tel" placeholder="+971 …" maxlength="20"></div></div>'+
      '<div class="pa-two"><div class="pa-fld"><label>Contact</label><input class="inp" data-hk="cont" value="'+esc(d.cont)+'" placeholder="Name" maxlength="40"></div><div class="pa-fld"><label>Role</label><input class="inp" data-hk="role" value="'+esc(d.role)+'" maxlength="30"></div></div>'+
      '<div class="grp"><div class="lbl">Tables to hold for them at '+esc(W.ev.short)+' · '+d.tables.length+' picked</div><div class="pa-zoom">'+['vipR','vipL','plR','plL','gdR','gdL'].map(k=>'<button class="chip '+(d.zoom===k?'on':'')+'" data-act="htZoom" data-k="'+k+'">'+esc(paSecShort(k))+'</button>').join('')+'</div>'+
      (d.zoom?'<div class="chips" style="flex-wrap:wrap">'+f.filter(T=>T.sec===d.zoom).map(T=>'<button class="chip '+(d.tables.includes(T.id)?'on':'')+'" data-act="htTab" data-t="'+T.id+'">'+esc(shortId(T.id))+' · '+kfmt(T.min)+'</button>').join('')+'</div>':'<p class="note">Pick a section, then tap the open tables. You can also hold none: the desk then sends requests only.</p>')+'</div>'+
      '<div class="pa-rate"><div class="top"><div class="l"><b>To the hotel on table minimums</b><span>Paid to the hotel on a monthly statement</span></div><div class="pv">'+d.tab+'<small>%</small></div></div><input type="range" min="0" max="20" step="1" value="'+d.tab+'" data-hk="tab"></div>'+
      '<div class="pa-rate"><div class="top"><div class="l"><b>On tickets</b><span>Tickets booked on the hotel’s invitations</span></div><div class="pv">'+d.tix+'<small>%</small></div></div><input type="range" min="0" max="15" step="1" value="'+d.tix+'" data-hk="tix"></div>'+
      '<div class="grp"><div class="lbl">Deposits</div><div class="seg"><button class="'+(d.guar?'on':'')+'" data-act="htGuar" data-v="1">Hotel guarantees</button><button class="'+(!d.guar?'on':'')+'" data-act="htGuar" data-v="0">Guest pays a deposit</button></div>'+(d.guar?'<div class="pa-fld" style="margin-top:10px"><label>No-show charge <small>· AED, as in the hotel’s contract</small></label><input class="inp" data-hk="noShow" inputmode="numeric" value="'+d.noShow+'"></div>':'')+'<p class="note">'+(d.guar?'No deposit for the guest. If a guaranteed guest doesn’t come, this amount comes off the hotel’s commission.':'The guest holds a deposit on their invitation, like any other booking.')+'</p></div>'+
      '<div class="grp"><div class="lbl">Free tables come back</div><div class="pa-terms">'+['16:00','18:00','20:00'].map(x=>'<button class="'+(d.release===x?'on':'')+'" data-act="htRel" data-v="'+x+'"><b>'+x+'</b><span>on the night</span></button>').join('')+'</div></div>';},
    foot:()=>'<button class="btn pri full" data-act="htSave">'+I('lock',17)+'Add and send the desk link</button>',
    onPaint:el=>{$$('[data-hk]',el).forEach(i=>i.addEventListener('input',()=>{const k=i.dataset.hk;d[k]=i.type==='range'?+i.value:k==='noShow'?Math.max(0,parseInt(i.value.replace(/\D/g,''),10)||0):i.value;if(i.type==='range'){const pv=i.closest('.pa-rate').querySelector('.pv');pv.innerHTML=d[k]+'<small>%</small>';}}));}});
  const re=()=>{o._b=null;o._f=null;Sheet.paint(o);};
  ON.htZoom=e=>{d.zoom=d.zoom===e.dataset.k?null:e.dataset.k;re();};
  ON.htTab=e=>{const i=d.tables.indexOf(e.dataset.t);if(i>=0)d.tables.splice(i,1);else d.tables.push(e.dataset.t);re();};
  ON.htGuar=e=>{d.guar=e.dataset.v==='1';re();};ON.htRel=e=>{d.release=e.dataset.v;re();};
  ON.htSave=()=>{if(String(d.name).trim().length<2){toast('Add the hotel’s name.');return;}if(String(d.cont).trim().length<2){toast('Add the desk contact.');return;}
    withPin('Add '+d.name+' as a partner hotel',m=>{const L=htAll(),id='h'+(L.length+1),sid='ht'+(L.length+1);
      const h={id,name:d.name.trim(),area:d.area,cont:d.cont.trim(),role:d.role,ph:d.ph,tables:d.tables.slice(),tab:d.tab,tix:d.tix,guar:d.guar,noShow:d.guar?d.noShow:0,release:d.release,status:'sent',booked:[],reqs:[],src:sid,created:now(),sentAt:now(),openAt:0};
      L.push(h);SOURCES.push({id:sid,label:h.name,grp:'partner',comm:h.tab/100,i:SOURCES.length,hotel:1});SRC[sid]=SOURCES[SOURCES.length-1];_snap=null;Object.keys(Worlds).forEach(k=>{if(Worlds[k]._ix)Worlds[k]._ix=null;});
      h.tables.forEach(tid=>W.holds.push({id:'HH'+id+tid,table:tid,kind:'Hotel hold',who:h.name,from:now(),until:W.D-2*HOUR,relAt:0,op:1}));
      log('Partner hotel added',h.name+', '+h.tables.length+' tables held, '+h.tab+'% to the hotel',m);bump();Sheet.close();ON.htSendDesk({dataset:{id}});toast(esc(h.name)+' added. Desk link ready to send.');Sheet.refresh(true);refresh(true);});};};

/* ---------- where it shows up ---------- */
['pre','live'].forEach(p=>{const L=HOME[p].owner,i=L.indexOf('paccess');if(!L.includes('hotels'))L.splice(i>=0?i+1:L.length,0,'hotels');});
if(ASETS.sources){['pre','live'].forEach(p=>{if(!ASETS.sources[p].includes('hotels'))ASETS.sources[p].splice(2,0,'hotels');});}
