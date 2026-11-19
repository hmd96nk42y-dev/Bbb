/* ================= table offers (tap a table) ================= */
function onPick(id){
  if(!S.party&&T(id)){S.party=Math.min(16,T(id).cap);if(window.paintGuests)paintGuests();try{afterPick();}catch(_){}}
  if(S.tixMode){S.tixMode=false;setTimeout(syncDoll,350);}
  if(S.boothId&&S.boothId!==id){S.pick=null;dollPost({cmd:'book',id:S.boothId});}
  else S.pick=id;
  updateBkCtx();openTableSheet(id);
}
function tableState(t){
  if(S.boothId===t.id)return {ok:false,msg:'This is your table.',cta:'Your table',warn:false};
  if(S.boothId)return {ok:false,msg:`You already hold ${BNAMES[S.boothId]}. Change it below the room to switch.`,cta:'Already holding a table',warn:true};
  if(t.req&&!S.vip)return {ok:false,msg:'Held for the Backstage List. Returning guests can sign in above.',cta:'Held for members',warn:true};
  if(!ready())return {ok:true,need:true,msg:'Choose your guests in Find your table to hold it.',cta:'Choose guests'};
  if(!fits(t,S.party))return {ok:false,msg:`Seats ${t.cap}, plus up to ${EXTRA_MAX} extra guests. For ${S.party}, look at a bigger table.`,cta:'Not your size',warn:true};
  if(t.req)return {ok:true,msg:`Held for you. The team confirms this table and its minimum for ${S.ev.short} with you directly.`,cta:'Request this table'};
  if(!seeded(t.id))return {ok:false,msg:`Taken for ${S.ev.short}. Try another table in this section.`,cta:'Taken',warn:true};
  const ex=extrasFor(t,S.party);
  return {ok:true,msg:ex?`Open for ${S.ev.short}. A party of ${S.party} is ${ex} over, so ${ex} extra guest${ex>1?'s':''} at ${AED(t.extra)} each: ${AED(minFor(t,S.party))} minimum.`:`Open for ${S.ev.short}, party of ${S.party}. Arrive by ${S.time}: your table is held until then.`,cta:'Hold this table'};
}
function openTableSheet(id){
  const t=T(id),st=tableState(t);
  $('#tsHead').innerHTML=`<span class="tier ${t.cls}"><i></i>${t.label}</span><h3>${t.name}</h3>`;
  $('#tsBody').innerHTML=`
    <div class="ts-facts"><div><b>${t.req?'On request':AED(t.min)}</b><span>minimum spend</span></div><div><b>${t.cap}</b><span>guests</span></div><div><b>${t.extra?AED(t.extra):'\u2014'}</b><span>per extra guest</span></div></div>
    <p class="ts-vote">${t.where}, on the ${t.side} side of the floor. ${t.req?'Held for the Backstage List.':`The price covers up to ${t.cap} guests, up to ${EXTRA_MAX} more can join at ${AED(t.extra)} each.`}</p>
    <h4>Offers for this table</h4>
    ${OFFERS[t.tier].map(o=>`<div class="offer"><b>${esc(o.t)}</b><span>${esc(o.d)}</span></div>`).join('')}
    <p class="ts-state ${st.warn?'warn':''}">${esc(st.msg)}</p>
    <div class="ts-acts"><button class="btn ghost" id="tsMenu" type="button">Browse the menu</button><button class="btn ${st.ok?'red':'ghost'}" id="tsHold" type="button" ${st.ok?'':'disabled'}>${st.cta}</button></div>`;
  if(typeof sxTableSheet==='function')sxTableSheet(t,st);
  $('#tsMenu').addEventListener('click',()=>{closeSheet(true);openMenu('Bottles');});
  $('#tsHold').addEventListener('click',()=>{if(st.need){S.flow='table';closeSheet(true);promptWhen();return;}closeSheet(true);openGinfo(t);});
  openSheet($('#tSheet'),()=>{if(!S.boothId&&S.pick===id){S.pick=null;dollPost({cmd:'clear'});updateBkCtx();}});
}
