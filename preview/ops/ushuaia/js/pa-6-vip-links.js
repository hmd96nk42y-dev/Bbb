/* =====================================================================
   VIP LINKS (rule 28)
   A manager makes one link for one guest, with the table and how the
   minimum is settled decided up front: a deposit, the full minimum, a set
   amount, or settle on the night. The link can carry price points so the
   guest's friends each pay their own part, and an AED 0 invite link.
   The guest gives their full name as on their ID and their email on the
   link, or at the door: no details, no entry. Each link is a source of
   its own kind (custom_offer), so the booking lands under it.
   ===================================================================== */
const VL={list:null,seq:0,d:null,o:null};
const VL_SET={dep50:['50% deposit','Half the minimum is held on their card until the table is secured.'],dep100:['Full minimum upfront','The whole minimum is held on their card until the table is secured.'],
  amt:['A set amount upfront','You choose the amount. It is held on their card and counts towards the minimum.'],night:['Settle on the night','No deposit. The table is confirmed when they give their details; the minimum is collected at the table.']};
const VL_EXP={cut:'At the cut-off',h24:'In 24 hours',h48:'In 48 hours'};
const vlUrl=v=>LIVE?liveGuestLink('v',v.token):'https://bubl.app/'+PA_SLUG+'/v/'+v.token;
const vlUp=v=>v.settle==='dep50'?Math.round(v.min*.5):v.settle==='dep100'?v.min:v.settle==='amt'?Math.min(v.amt||0,v.min):0;
const vlAssigned=v=>(v.pp||[]).reduce((a,r)=>a+r.amt*r.n,0);
const vlExpAt=v=>v.expAt?v.expAt:v.exp==='h24'?v.created+24*HOUR:v.exp==='h48'?v.created+48*HOUR:EVK[v.ev].doors-RULES.cutoffMin*60000;
function vlState(v){const t=now();if(v.cancelled)return 'cancelled';if(v.bookedAt&&v.bookedAt<=t)return 'booked';if(vlExpAt(v)<=t)return 'expired';if(v.openAt&&v.openAt<=t)return 'opened';return 'sent';}
const VL_PILL={sent:['neu','Sent'],opened:['warn','Opened'],booked:['ok','Booked'],expired:['mut','Expired'],cancelled:['mut','Cancelled']};
function vlAll(){if(LIVE)return liveVlAll();   /* test and live: the links really made (live-partners.js) */
  if(VL.list)return VL.list;VL.list=[];const t=now(),ix=tableIndex(W,t),open=W.tables.filter(T=>!ix[T.id]&&!T.oos&&T.grp!=='bs');
  const seed=CFG.VIP_LINKS.map(x=>({g:x.g,ph:x.ph,settle:x.settle,grp:x.grp,open:t-x.openHoursAgo*HOUR,booked:x.bookedHoursAgo?t-x.bookedHoursAgo*HOUR:0,pp:x.pp}));
  seed.forEach((x,i)=>{const T=open.find(T=>T.grp===x.grp&&!VL.list.some(v=>v.table===T.id));if(!T)return;
    const v={id:'VL'+(++VL.seq),token:paSlug(x.g.split(' ')[0])+'-'+(7310+i*911),g:x.g,ph:x.ph,email:'',ev:W.ev.id,table:T.id,min:T.min,settle:x.settle,amt:0,split:!!x.pp,pp:x.pp||[],exp:'cut',note:'',created:t-40*HOUR,by:ROLES.owner.who,openAt:x.open,bookedAt:x.booked,cancelled:0};
    VL.list.push(v);W.holds.push({id:'VLH'+v.id,table:T.id,kind:'VIP link',who:x.g,from:v.created,until:vlExpAt(v),relAt:0,op:1});});
  return VL.list;}
const vlFor=evId=>vlAll().filter(v=>v.ev===evId);
function vlRow(v){const st=vlState(v),T=W.T[v.table],pp=VL_PILL[st];
  return row(initials(v.g),'',esc(v.g),esc(T?T.name:v.table)+' · '+esc(VL_SET[v.settle][0])+(v.split?' · split':''),'<span class="pill '+pp[0]+'">'+pp[1]+'</span>','data-act="vlOpen" data-id="'+v.id+'"');}
TMETA.vlinks={ic:'star',f:'gold',s:'BUBL · LINKS',k:'own'};
M.vlinks={t:'VIP links',tall:true,
  tile:s=>{const L=vlFor(W.ev.id),live=L.filter(v=>['sent','opened'].includes(vlState(v))),bk=L.filter(v=>vlState(v)==='booked');
    return tile('vlinks','VIP links',N(live.length)+'<small>open</small>',N(bk.length)+' booked · '+N(L.filter(v=>v.settle==='night').length)+' settle on the night',
      gRows(L.slice(0,3).map(v=>{const st=vlState(v);return {l:v.g.split(' ')[0],v:st==='booked'?1:st==='opened'?.5:.15,t:VL_PILL[st][1]};}),{max:1}));},
  sub:s=>esc(W.ev.short)+' · one guest, one table, your terms',
  detail:s=>{const L=vlFor(W.ev.id);return '<div class="pa-wz"><p class="note" style="margin-top:0">A VIP link is for one guest you want to look after. You choose the table and how the minimum is settled before you send it. They give their own details on the link, or at the door.</p><div class="rows">'+(L.length?L.map(vlRow).join(''):empty('No VIP links for this event yet.'))+'</div></div>';},
  foot:()=>paCanEdit()||UI.role==='manager'?'<button class="btn pri full" data-act="vlNew">'+I('plus',18)+'New VIP link</button>':''};
ON.vlNew=()=>vlWizard();
function vlWizard(){const t=now();const d={g:'',ph:'',email:'',ev:W.ev.id,table:null,min:0,settle:'dep50',amt:0,split:false,pp:[{amt:0,n:2}],exp:'cut',note:'',zoom:null};VL.d=d;
  const free=()=>{const ix=tableIndex(W,now());return W.tables.filter(T=>!ix[T.id]&&!T.oos);};
  const body=()=>{const f=free(),T=d.table&&W.T[d.table],up=T?vlUp(d):0,left=Math.max(0,up-vlAssigned(d));
    return '<div class="pa-wz">'+
      '<div class="pa-fld"><label>Guest’s full name, as on their ID</label><input class="inp" data-vk="g" value="'+esc(d.g)+'" placeholder="First and last name" maxlength="50" autocomplete="off"></div>'+
      '<div class="pa-two"><div class="pa-fld"><label>WhatsApp number</label><input class="inp" data-vk="ph" value="'+esc(d.ph)+'" inputmode="tel" placeholder="+971 5…" maxlength="18"></div><div class="pa-fld"><label>Email <small>· optional, they confirm it</small></label><input class="inp" data-vk="email" value="'+esc(d.email)+'" type="email" placeholder="guest@email.com" maxlength="60" autocapitalize="off"></div></div>'+
      '<div class="grp"><div class="lbl">Event</div><div class="chips" style="flex-wrap:wrap">'+paEvs().map(e=>'<button class="chip '+(d.ev===e.id?'on':'')+'" data-act="vlEv" data-k="'+e.id+'">'+esc(e.short)+'</button>').join('')+'</div></div>'+
      '<div class="grp"><div class="lbl">Table'+(T?' · '+esc(T.name)+', minimum '+A(T.min):'')+'</div><div class="pa-zoom">'+SEC_ORDER.map(k=>'<button class="chip '+(d.zoom===k?'on':'')+'" data-act="vlZoom" data-k="'+k+'">'+esc(paSecShort(k))+'</button>').join('')+'</div>'+
        (d.zoom?'<div class="chips" style="flex-wrap:wrap;margin-top:8px">'+f.filter(x=>x.sec===d.zoom).map(x=>'<button class="chip '+(d.table===x.id?'on':'')+'" data-act="vlTab" data-t="'+x.id+'">'+esc(shortId(x.id))+' · '+kfmt(x.min)+'</button>').join('')+'</div>':'<p class="note">Pick a section to see its open tables.</p>')+'</div>'+
      (T?'<div class="pa-fld"><label>Minimum spend <small>· lowering it needs the manager PIN</small></label><input class="inp" data-vk="min" inputmode="numeric" value="'+d.min+'"></div>':'')+
      '<div class="grp"><div class="lbl">How the minimum is settled</div><div class="pa-terms pa-settle">'+Object.keys(VL_SET).map(k=>'<button class="'+(d.settle===k?'on':'')+'" data-act="vlSet" data-v="'+k+'"><b>'+VL_SET[k][0]+'</b></button>').join('')+'</div><p class="note">'+VL_SET[d.settle][1]+(T&&up?' Upfront: '+A(up)+'.':'')+'</p>'+
        (d.settle==='amt'?'<div class="pa-fld"><label>Amount upfront (AED)</label><input class="inp" data-vk="amt" inputmode="numeric" value="'+(d.amt||'')+'" placeholder="5000"></div>':'')+'</div>'+
      (d.settle!=='night'?'<div class="grp"><div class="lbl">Let their friends pay their own part</div><div class="seg"><button class="'+(!d.split?'on':'')+'" data-act="vlSplit" data-v="0">One payer</button><button class="'+(d.split?'on':'')+'" data-act="vlSplit" data-v="1">Price points</button></div>'+
        (d.split?'<div class="rows">'+d.pp.map((r,i)=>'<div class="row"><div class="ri">'+(r.amt?'AED':'0')+'</div><div class="rt"><b>'+(r.amt?A(r.amt)+' each':'Invite link')+'</b><span>'+r.n+' '+pl(r.n,'guest')+'</span></div><div class="vl-st"><span>Amount</span><span>Guests</span><div><button class="btn xs" data-act="vlPP" data-i="'+i+'" data-k="amt" data-d="-1" aria-label="Less">−</button><button class="btn xs" data-act="vlPP" data-i="'+i+'" data-k="amt" data-d="1" aria-label="More">+</button></div><div><button class="btn xs" data-act="vlPP" data-i="'+i+'" data-k="n" data-d="-1" aria-label="Fewer guests">−</button><button class="btn xs" data-act="vlPP" data-i="'+i+'" data-k="n" data-d="1" aria-label="More guests">+</button></div></div></div>').join('')+'</div>'+
          '<p class="note">Each row becomes one link: an amount per guest and how many pay it. AED 0 is an invite link. '+(up?'Left for '+esc(paFirst(d.g)||'the guest')+' to cover: '+A(left)+'.':'')+'</p><button class="btn sm" data-act="vlPPAdd">'+I('plus',15)+'Add a price point</button>':'')+'</div>':'')+
      '<div class="grp"><div class="lbl">The link closes</div><div class="pa-terms">'+Object.keys(VL_EXP).map(k=>'<button class="'+(d.exp===k?'on':'')+'" data-act="vlExp" data-v="'+k+'"><b>'+VL_EXP[k]+'</b></button>').join('')+'</div><p class="note">The table is held for them until then. Cut-off: '+(RULES.cutoffMin/60)+' hours before doors.</p></div>'+
      '<div class="pa-fld"><label>Personal note <small>· optional</small></label><input class="inp" data-vk="note" value="'+esc(d.note)+'" placeholder="Looking forward to hosting you" maxlength="90"></div>'+
      '<div class="pa-info">'+I('user',17)+'<div><b>No details, no entry.</b> '+esc(paFirst(d.g)||'The guest')+' gives their full name as on their ID and their email on the link. Friends on price-point links do the same, or at the door.</div></div></div>';};
  const o=Sheet.open({tall:true,static:true,title:'New VIP link',sub:'One guest, one table, terms decided now',body,foot:()=>'<button class="btn pri full" data-act="vlSave">'+I('lock',17)+'Create the VIP link</button>',
    onPaint:el=>{$$('[data-vk]',el).forEach(i=>i.addEventListener('input',()=>{const k=i.dataset.vk;d[k]=(k==='min'||k==='amt')?Math.max(0,parseInt(String(i.value).replace(/\D/g,''),10)||0):i.value;}));}});
  const re=()=>{o._b=null;o._f=null;Sheet.paint(o);};
  ON.vlEv=e=>{d.ev=e.dataset.k;re();};ON.vlZoom=e=>{d.zoom=d.zoom===e.dataset.k?null:e.dataset.k;re();};
  ON.vlTab=e=>{d.table=e.dataset.t;d.min=W.T[d.table].min;re();};
  ON.vlSet=e=>{d.settle=e.dataset.v;if(d.settle==='night')d.split=false;re();};ON.vlSplit=e=>{d.split=e.dataset.v==='1';re();};ON.vlExp=e=>{d.exp=e.dataset.v;re();};
  ON.vlPP=e=>{const r=d.pp[+e.dataset.i],k=e.dataset.k,dd=+e.dataset.d;if(k==='amt')r.amt=Math.max(0,r.amt+dd*250);else r.n=Math.max(1,Math.min(24,r.n+dd));
    const up=d.table?vlUp(d):0;if(up&&vlAssigned(d)>up){if(k==='amt')r.amt-=250;else r.n--;toast('That’s more than the '+A(up)+' upfront.');}re();};
  ON.vlPPAdd=()=>{d.pp.push({amt:0,n:1});re();};
  ON.vlSave=()=>{const g=String(d.g).trim().replace(/\s+/g,' ');if(g.split(' ').length<2||/\d/.test(g)){toast('Add their full name, as on their ID.');return;}
    if(String(d.ph).replace(/\D/g,'').length<9){toast('Add their WhatsApp number.');return;}if(!d.table){toast('Pick the table.');return;}
    if(d.settle==='amt'&&!d.amt){toast('Set the amount upfront.');return;}
    const T=W.T[d.table],lower=d.min<T.min;
    withPin((lower?'VIP link below the minimum: ':'VIP link: ')+g+' · '+T.name+' · '+VL_SET[d.settle][0],m=>{
      const v=Object.assign({},d,{id:'VL'+(++VL.seq),token:paSlug(g.split(' ')[0])+'-'+(1000+Math.floor(Math.random()*9000)),g,created:now(),by:m||myName(),openAt:0,bookedAt:0,cancelled:0,pp:d.split?d.pp.slice():[]});delete v.zoom;
      vlAll().push(v);W.holds.push({id:'VLH'+v.id,table:v.table,kind:'VIP link',who:g,from:now(),until:vlExpAt(v),relAt:0,op:1});
      log('VIP link created',g+': '+T.name+', '+VL_SET[v.settle][0]+(lower?', minimum '+aed(v.min)+' (was '+aed(T.min)+')':''),m);bump();Sheet.close();vlDetail(v);refresh(true);});};}
function vlDetail(v){const T=W.T[v.table],st=vlState(v),u=vlUrl(v),up=vlUp(v);
  Sheet.open({tall:true,static:true,title:esc(v.g),sub:esc(T.name)+' · '+esc(EVK[v.ev].short),
    body:()=>'<div class="pa-wz"><div style="display:flex;gap:6px;flex-wrap:wrap">'+'<span class="pill '+VL_PILL[st][0]+'">'+VL_PILL[st][1]+'</span>'+(v.split?'<span class="pill neu">'+v.pp.length+' price points</span>':'')+'</div>'+
      '<div class="hud" style="padding:14px;margin-top:12px"><div class="kv"><span>Minimum</span><b>'+A(v.min)+'</b><span>Settled</span><b>'+esc(VL_SET[v.settle][0])+'</b>'+(up?'<span>Upfront</span><b>'+A(up)+'</b>':'')+'<span>Closes</span><b>'+fDT(vlExpAt(v))+'</b><span>Made by</span><b>'+esc(v.by)+'</b></div></div>'+
      (v.split?'<div class="grp"><div class="lbl">Price points</div><div class="rows">'+v.pp.map(r=>row(r.amt?'AED':'0','',r.amt?A(r.amt)+' each':'Invite link',r.n+' '+pl(r.n,'guest'),'','')).join('')+'</div></div>':'')+
      '<div class="grp"><div class="lbl">The link</div><div class="pa-link"><span>'+esc(u.replace('https://',''))+'</span><button class="btn xs" data-act="paCopy" data-u="'+esc(u)+'">'+I('link',15)+'Copy</button></div></div>'+
      '<div class="grp"><div class="lbl">Progress</div><div class="rows">'+row('check','ok','Created',fDT(v.created),'','')+row(v.openAt&&v.openAt<=now()?'check':'clock',v.openAt&&v.openAt<=now()?'ok':'','Opened',v.openAt&&v.openAt<=now()?fDT(v.openAt):'Not yet','','')+row(v.bookedAt&&v.bookedAt<=now()?'check':'clock',v.bookedAt&&v.bookedAt<=now()?'ok':'','Details in, table booked',v.bookedAt&&v.bookedAt<=now()?fDT(v.bookedAt):'Not yet','','')+(LIVE?liveVlWrong(v):'')+'</div></div>'+
      (v.note?'<p class="note">Note: '+esc(v.note)+'</p>':'')+'</div>',
    foot:()=>['sent','opened'].includes(st)?'<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:8px"><button class="btn sm bad" data-act="vlCancel" data-id="'+v.id+'">Cancel</button><button class="btn sm pri" data-act="vlSend" data-id="'+v.id+'">'+I('msg',17)+(isOn('wa')?'Send on WhatsApp':'Open in WhatsApp')+'</button></div>':''});}
ON.vlOpen=el=>{const v=vlAll().find(x=>x.id===el.dataset.id);if(v)vlDetail(v);};
ON.vlSend=el=>{const v=vlAll().find(x=>x.id===el.dataset.id),T=W.T[v.table],up=vlUp(v);
  const m='Hi '+paFirst(v.g)+', we’ve kept '+T.name+' for you at '+EVK[v.ev].short+' (minimum '+aed(v.min)+'). '+(up?aed(up)+' is held on your card to secure it, never charged until the table is confirmed.':'Nothing to pay now: the minimum is settled at the table on the night.')+(v.note?' '+v.note:'')+' Please add your details here: '+vlUrl(v)+'\n– '+myName()+', Ushuaïa';
  window.open('https://wa.me/'+String(v.ph).replace(/\D/g,'')+'?text='+encodeURIComponent(m),'_blank','noopener');log('VIP link sent',v.g);toast(isOn('wa')?'Sent.':'Opened in WhatsApp on this phone. Sending from the venue’s number starts once WhatsApp Business is connected.');};
ON.vlCancel=el=>{const v=vlAll().find(x=>x.id===el.dataset.id);withPin('Cancel the VIP link for '+v.g,m=>{v.cancelled=now();const h=W.holds.find(x=>x.id==='VLH'+v.id);if(h)h.relAt=now();log('VIP link cancelled',v.g,m);bump();Sheet.close();toast('Cancelled. The table is back on sale and any card hold is released.');refresh(true);});};
['pre','live'].forEach(p=>{const L=HOME[p].owner,i=L.indexOf('paccess');if(!L.includes('vlinks'))L.splice(i>=0?i:L.length,0,'vlinks');});
if(ASETS.sources){['pre','live'].forEach(p=>{if(!ASETS.sources[p].includes('vlinks'))ASETS.sources[p].splice(1,0,'vlinks');});}


/* ---------- removed from the widgets: Sales pace, Forecast, Readiness ---------- */
(function(){const drop=['pace','forecast','ready'];
  Object.keys(HOME).forEach(p=>Object.keys(HOME[p]).forEach(r=>{HOME[p][r]=HOME[p][r].filter(id=>!drop.includes(id));}));
  if(typeof ASETS!=='undefined')Object.keys(ASETS).forEach(k=>{const v=ASETS[k];Object.keys(v).forEach(p=>{if(Array.isArray(v[p]))v[p]=v[p].filter(id=>!drop.includes(id));});});})();
