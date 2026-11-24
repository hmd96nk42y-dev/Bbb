'use strict';
/* ============================================================
   LIVE PARTNERS · loaded in test and live mode only
   VIP links, Promoter access and Hotels on the venue's real records.
   - A VIP link is made for real, with the Manager PIN: the table is
     kept for the guest, and the link opens the guest app on that table
     with the price and the amount up front the team chose.
   - A promoter or hotel agreement is the venue's own: every rate is
     typed by the team (a new one starts at nothing) and it is signed
     with the Manager PIN. Sk, 20 Nov 2026: the agreement is saved now;
     sending it, and the partner's own link, arrive with their apps in
     step 8. So the last step here says "Signed for the venue".
   ============================================================ */
/* a link into the guest app: it sits beside OPS, as the preview serves it */
function liveGuestLink(kind,token){return new URL('../../ushuaia/index.html?'+kind+'='+encodeURIComponent(token),location.href).href;}

/* ---- VIP links ---- */
function liveVlAll(){const ev=W.ev.id;return ((W.live&&W.live.vip_links)||[]).map(x=>{const min=fromMinor(x.minimum_minor)||0,dep=fromMinor(x.deposit_minor)||0,pp=(x.price_points||[]).map(r=>({amt:fromMinor(r.amount_minor),n:r.guests}));
  return {id:x.id,token:x.token||'',g:(x.guest&&x.guest.name)||'VIP guest',ph:(x.guest&&x.guest.phone)||'',email:(x.guest&&x.guest.email)||'',ev,table:x.table,min,
    settle:dep===0?'night':dep===min?'dep100':dep*2===min?'dep50':'amt',amt:dep,split:pp.length>0,pp,exp:'cut',expAt:ms(x.expires_at),note:x.note||'',created:ms(x.made_at),by:x.made_by||'',
    openAt:0,bookedAt:x.booking?ms(x.booking.at):0,cancelled:ms(x.cancelled_at),wrong:x.wrong_number||null};});}
/* Sk, 22 Nov 2026: a link the team typed a number on can only be taken by that number, "and the sender is told". Until
   the sender's own chat exists (step 11) this is where they are told: one more row in the link's Progress, in the
   build's own row, only when it has happened. The other person's number is never kept or shown. */
function liveVlWrong(v){const w=v.wrong;if(!w||!w.n)return '';
  return row('alert','warn','Opened by a different number',fDT(ms(w.last_at))+' · they could not take the table'+(w.n>1?' · '+N(w.n)+' tries':''),'','');}
function liveVlWizard(){
  ON.vlEv=()=>{};   /* a link is for the night that is open: pick another night first to make one for it */
  ON.vlSave=()=>{const d=VL.d,g=String(d.g).trim().replace(/\s+/g,' ');if(g.split(' ').length<2||/\d/.test(g)){toast('Add their full name, as on their ID.');return;}
    if(String(d.ph).replace(/\D/g,'').length<9){toast('Add their WhatsApp number.');return;}if(!d.table){toast('Pick the table.');return;}
    if(d.settle==='amt'&&!d.amt){toast('Set the amount upfront.');return;}
    const T=W.T[d.table],lower=d.min<T.min,up=vlUp(d);
    withPin((lower?'VIP link below the minimum: ':'VIP link: ')+g+' · '+T.name+' · '+VL_SET[d.settle][0],async()=>{
      const r=await liveDo('vip-new',{table:d.table,party_size:T.cap,minimum_minor:toMinor(d.min),deposit_minor:toMinor(up),guest_name:g,guest_phone:d.ph,guest_email:d.email||null,
        price_points:d.split&&d.settle!=='night'?d.pp.map(p=>({amount_minor:toMinor(p.amt),guests:p.n})):[],closes:d.exp==='h24'?'24h':d.exp==='h48'?'48h':'cutoff',note:d.note||null,pin:pinNow()},'VIP link made. '+esc(T.name)+' is kept for '+esc(paFirst(g))+'.');
      if(!r)return;Sheet.close();const v=liveVlAll().find(x=>x.id===r.link_id);if(v)vlDetail(v);});};}
(function(){const open=vlWizard;vlWizard=function(){open();liveVlWizard();};ON.vlNew=()=>vlWizard();})();
ON.vlCancel=el=>{const v=vlAll().find(x=>x.id===el.dataset.id);if(!v)return;withPin('Cancel the VIP link for '+v.g,async()=>{
  const r=await liveDo('vip-cancel',{link:v.id,reason:'Cancelled from OPS',pin:pinNow()},'Cancelled. The table is back on sale.');if(r)Sheet.close();});};

/* ---- Promoter access and Hotels: the venue's own agreements ---- */
const agList=kind=>((W.live&&W.live.agreements)||[]).filter(a=>a.kind===kind);
function livePaAll(){return agList('promoter').map(a=>{const o=(a.terms&&a.terms.ops)||{},t=a.terms||{},r=t.rates||{};
  return Object.assign({events:[W.ev.id],tmode:'tab',secs:[],tables:[],cap:0,tix:{early:0,wave:0,vips:0},list:0,one:false,barBase:'over',payDays:0,release:0,settle:'dep',notice:0,law:'dxb',extra:[],ovr:{},removed:{},chg:{},log:[]},o,{
    id:a.id,src:a.key,name:(a.contact&&a.contact.name)||a.label,company:(a.contact&&a.contact.company)||'',ph:(a.contact&&a.contact.phone)||'',email:(a.contact&&a.contact.email)||'',licence:(a.contact&&a.contact.licence)||'',
    kind:t.exclusive?'exclusive':'promoter',greetVip:t.greet_vip===true,_terms:t,rates:{tix:Number(r.tix||0)*100,tab:Number(r.tab||0)*100,bar:Number(r.bar||0)*100},tables:(a.allocation&&a.allocation.tables)||[],secs:(a.allocation&&a.allocation.sections)||[],
    /* signed for the venue; the promoter signs in their own app, which is step 8 */
    status:a.state==='ended'?'revoked':a.state==='paused'?'paused':'sent',created:ms(a.signed_at),sentAt:0,openAt:0,signedAt:0,venueSig:{by:a.signed_by,at:ms(a.signed_at)},promoSig:null});});}
function paLiveSync(){PA.list=null;HT.list=null;VL.list=null;}
paStatus=function(a){return a.status==='revoked'?pill('bad','Ended'):a.status==='paused'?pill('mut','Paused'):pill('ok','Signed for '+esc(VENUE.name.split(' ')[0]));};
/* the agreement's terms, as the back end keeps them: rates as shares, money in minor units, and the wizard's own
   record beside them so the screen opens it again exactly as it was made */
function paTerms(d){const r=paRates(d),o=JSON.parse(JSON.stringify(d));['_sent','_saving','_saved','agent','busy','drafting','drafted','zoom','_bumped','_edit','id','src','status','_terms'].forEach(k=>delete o[k]);
  return {rates:{tix:r.tix/100,tab:r.tab/100,bar:r.bar/100},bar_base:d.barBase,pay_days:d.payDays,release_hours:d.release||undefined,settle:d.settle,notice_days:d.notice,exclusive:d.kind==='exclusive',greet_vip:d.greetVip===true,
    tickets:d.tix,list_spots:d.list,offers:{allowed:!!(d.offers&&d.offers.on),floor_minor:d.offers?toMinor(d.offers.floor||0):0},ops:o};}
/* (access is given table by table for now: live-gates.js, "promoterSections". The build's own hint is said without its
   second half.) */
(function(){const check=paCheck;paCheck=function(i){const e=check(i);return typeof e==='string'?e.replace(', or switch to sections',''):e;};})();
ON.paSend=()=>{const d=PA.d;
  /* signed already, or being saved right now: a second tap signs nothing again (Sk, 24 Nov 2026: one signing made two
     agreements; the button stayed live for the second or two the save takes) */
  if(d._sent||d._saving)return;
  for(let k=0;k<3;k++){const e=paCheck(k);if(e){PA.step=k;paRe();toast(e);return;}}
  if(!paRates(d).tix&&!paRates(d).tab&&!paRates(d).bar){PA.step=3;paRe();toast('Set their cut: every rate is still at nothing.');return;}
  withPin('Sign the agreement for '+VENUE.name,async()=>{
    if(d._sent||d._saving)return;d._saving=true;const b=$('[data-act="paSend"]');if(b)b.disabled=true;
    const r=await liveDo('agreement-save',{id:(d._edit||d._saved)&&d.id?d.id:undefined,kind:'promoter',label:paSrcLabel(d),contact:{name:d.name,company:d.company,phone:d.ph,email:d.email,licence:d.licence},
      terms:paTerms(d),allocation:{tables:d.tmode==='tab'?d.tables:[],sections:d.tmode==='sec'?d.secs:[]},services:d.events.map(id=>EVK[id].sid),contract:paClauses(d).map(c=>c.h+'\n'+c.t).join('\n\n'),pin:pinNow()},
      'Signed for '+esc(VENUE.name)+'.');
    d._saving=false;const b2=$('[data-act="paSend"]');if(b2)b2.disabled=false;
    if(!r)return;d._sent=true;d._saved=true;d.id=r.id;d.venueSig={by:BUBL.staff.name,at:Date.now()};haptic(20);paRe();});};
/* "Greet as VIP at the door" (Sk, 24 Nov 2026, answer 126): one term of the venue's agreement, changed with the Manager
   PIN and written to the audit log with the terms before and after. The door reads it from the agreement itself. */
ON.paGreet=el=>{const a=paAll().find(x=>x.id===el.dataset.id),on=el.dataset.v==='1';if(!a||!!a.greetVip===on)return;
  if(!paCanEdit()||a.status==='revoked'){toast(a.status==='revoked'?'This access has ended.':'Only a manager can change a promoter’s terms.');return;}
  withPin('Greet '+paSrcLabel(a)+'’s guests as VIP at the door: '+(on?'on':'off'),async()=>{
    const r=await liveDo('agreement-terms',{id:a.id,terms:Object.assign({},a._terms||{},{greet_vip:on}),pin:pinNow()},'Saved. The change is in the audit log with the terms before and after.');if(r)Sheet.close();});};
ON.paEnd=el=>{const a=paAll().find(x=>x.id===el.dataset.id);if(!a)return;withPin('End '+paSrcLabel(a)+'’s access',async()=>{
  const r=await liveDo('agreement-end',{id:a.id,reason:'Ended from OPS',pin:pinNow()},'Access ended. Their held tables are back on sale.');if(r)Sheet.close();});};
/* the last step: signed for the venue and saved. Sending and the promoter's own link are step 8. */
(function(){const step=paSendStep;paSendStep=function(d){const pool=paPool(d),r=paRates(d);
  if(d._sent)return '<div class="pa-ok">'+I('check',30)+'</div><div class="pa-h" style="text-align:center">Signed for '+esc(VENUE.name)+'<small>Signed by '+esc(d.venueSig.by)+'. '+(d.tmode==='tab'?N(pool.length)+' tables are now held for them on the floor.':'They can pick from '+N(d.secs.length)+' sections.')+' It is saved in BUBL. Sending it to '+esc(paFirst(d.name))+' opens with the promoter app.</small></div>';
  return '<div class="pa-h">Check it, then sign it<small>Signing saves the agreement in BUBL and holds their tables. Sending it to '+esc(paFirst(d.name))+' opens with the promoter app.</small></div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>'+(d.kind==='exclusive'?'Exclusive for':'Events')+'</span><b>'+esc(d.events.map(id=>EVK[id].short).join(', '))+'</b><span>Tables</span><b>'+(d.tmode==='sec'?'Up to '+Math.min(d.cap,pool.length)+' in '+d.secs.length+' sections':pool.length+' held')+'</b><span>Tickets</span><b>'+n0(sum(PA_TK,k=>d.tix[k]||0))+'</b><span>List</span><b>'+n0(d.list)+'</b><span>Cut</span><b>'+(d.one?paPct(r.tix)+' on everything':paPct(r.tix)+' / '+paPct(r.tab)+' / '+paPct(r.bar)+' bar')+'</b><span>Agreement</span><b>v'+(d.ver||1)+', '+paClauses(d).length+' clauses</b></div></div>'+
    '<p class="note">Signing needs a manager PIN and is written to the audit log.</p>';};void step;})();

function liveHtAll(){return agList('hotel').map(a=>{const t=a.terms||{},r=t.rates||{},c=a.contact||{};
  return {id:a.id,name:a.label,area:c.area||'',cont:c.name||'',role:c.role||'',ph:c.phone||'',tables:(a.allocation&&a.allocation.tables)||[],tab:Number(r.tab||0)*100,tix:Number(r.tix||0)*100,guar:!!t.guarantee,noShow:fromMinor(t.no_show_minor)||0,
    release:t.release_time||'',status:a.state==='ended'?'ended':'sent',booked:[],reqs:[],src:a.key,created:ms(a.signed_at),sentAt:0,openAt:0};});}
const htTerms=d=>({rates:{tab:Number(d.tab||0)/100,tix:Number(d.tix||0)/100},guarantee:!!d.guar,no_show_minor:d.guar?toMinor(d.noShow||0):0,release_time:d.release||undefined});
(function(){const openNew=ON.htNew;ON.htNew=()=>{openNew();const d=HT.d;
  ON.htSave=()=>{if(String(d.name).trim().length<2){toast('Add the hotel’s name.');return;}if(String(d.cont).trim().length<2){toast('Add the desk contact.');return;}
    if(d.tab>100||d.tix>100){toast('A rate cannot be more than 100%.');return;}
    withPin('Add '+d.name+' as a partner hotel',async()=>{
      const r=await liveDo('agreement-save',{kind:'hotel',label:d.name.trim(),contact:{name:d.cont.trim(),role:d.role,phone:d.ph,area:d.area},terms:htTerms(d),allocation:{tables:d.tables.slice()},services:[W.ev.sid],pin:pinNow()},
        esc(d.name.trim())+' added. '+(d.tables.length?N(d.tables.length)+' tables are held for its guests.':'')+' Its desk link opens with the hotel app.');
      if(r)Sheet.close();});};};})();
(function(){const openTerms=ON.htTerms;if(!openTerms)return;ON.htTerms=el=>{openTerms(el);const h=htAll().find(x=>x.id===el.dataset.id),o=Sheet.top();
  ON.htTSave=()=>{const d={};$$('[data-tk]',o.el).forEach(i=>{d[i.dataset.tk]=Math.max(0,parseFloat(String(i.value).replace(/[^0-9.]/g,''))||0);});
    const guarBtn=$('.on[data-act="htTG"]',o.el),relBtn=$('.on[data-act="htTR"]',o.el);const next=Object.assign({},h,d,{guar:guarBtn?guarBtn.dataset.v==='1':h.guar,release:relBtn?relBtn.dataset.v:h.release});
    if(next.tab>100||next.tix>100){toast('A rate cannot be more than 100%.');return;}
    withPin('Hotel terms: '+h.name,async()=>{const r=await liveDo('agreement-terms',{id:h.id,terms:htTerms(next),pin:pinNow()},'Saved. The change is in the audit log with the terms before and after.');if(r)Sheet.close();});};};})();
