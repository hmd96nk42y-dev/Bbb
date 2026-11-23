'use strict';
/* ============================================================
   92c · CHAT SUMMARIES
   BUBL reads a room or a guest's conversation and says what
   happened, what is still open, what was decided and what to do
   next. Every open item has an action: open the table, light it
   on the floor, reply with a draft, tell the right team. Written
   on the device from the chat; Claude rewrites it when the BUBL
   Intelligence integration can reach it. The manager agent can
   be asked about chats too.
   ============================================================ */
const SUM_W={unread:'Since you read',recent:'Recent',all:'Whole chat'};
let _sumNoAI=false,_chQ='';
function sumS(id){const a=Chat.sumS||(Chat.sumS={}),k=UI.role+':'+id;return a[k]||(a[k]={w:null,ai:{},busy:{}});}
function sumTitle(id){if(Chat.isG(id)){const th=gth(id.slice(2));return th?G(th.g).n+' · '+CH[th.ch].l:'';}const g=chatG(id);return g?g.n:'';}
function teamWin(g,w,t){const all=chatMsgs(g.id,t).filter(m=>!m.sysm),ph=phase();
  if(w==='all')return {msgs:all,label:'in the whole chat'};
  if(w==='unread'){const from=Chat.prevRead[g.id]!=null?Chat.prevRead[g.id]:readAt(g.id);return {msgs:all.filter(m=>m.at>from),label:'since you last read'+(from&&from<t?', '+(fD(from)===fD(t)?fT(from):fDT(from)):'')};}
  const span=ph==='live'?2*HOUR:ph==='post'?10*HOUR:3*DAY;return {msgs:all.filter(m=>m.at>t-span),label:ph==='live'?'in the last two hours':ph==='post'?'since the end of the night':'in the last three days'};}
function sumStart(id){const st=sumS(id);if(!Chat.isG(id)&&!st.w){const g=chatG(id),t=now();if(!g)return;const pr=Chat.prevRead[id]!=null?Chat.prevRead[id]:readAt(id),un=chatMsgs(id,t).filter(m=>m.at>pr&&!m.sysm).length;
    st.w=un>=3?'unread':teamWin(g,'recent',t).msgs.length>=3?'recent':'all';}sumClaude(id);}
const CAT={vip:['VIP arrival','VIP arrivals'],arr:['table arrival','table arrivals'],svc:['service request','service requests'],pre:['pre-order fired','pre-orders fired'],alert:['ticket alert','ticket alerts'],inc:['incident','incidents'],req:['Backstage request','Backstage requests'],book:['new booking','new bookings'],hold:['table past the hold','tables past the hold'],pay:['declined card','declined cards'],link:['guest link','guest links'],guest:['guest message shared','guest messages shared']};
const catL=(k,n)=>CAT[k][n===1?0:1];
const catOf=m=>!m.card?'talk':m.card.k||(/ sent · /.test(m.card.title)?'link':'other');
function sumTeam(g,w){const t=now(),win=teamWin(g,w,t),ms=win.msgs,ppl={},cats={},open=[],dec=[],tids=new Set(),seen=new Set();
  ms.forEach(m=>{if(!m.by.sys&&m.by.n)ppl[m.by.n]=(ppl[m.by.n]||0)+1;const k=catOf(m);cats[k]=(cats[k]||0)+1;
    String(m.txt+' '+(m.card?m.card.title+' '+(m.card.sub||''):'')).replace(/\{t:([A-Z0-9]+)\}/g,(x,id)=>{if(W.T[id])tids.add(id);return x;});});
  /* what is still open, judged on the state of the event right now */
  ms.forEach(m=>{const c=m.card;if(!c)return;const b=c.b?bk(c.b):null,key=c.k+':'+(c.b||c.svc||c.inc);if(seen.has(key))return;
    if(c.k==='hold'&&b){if(!b.seats.some(x=>x.ar&&x.ar<=t)&&!(b.relAt&&b.relAt<=t)&&!(b.cancelAt&&b.cancelAt<=t)){seen.add(key);const id=tableAt(b,t);open.push({tone:'bad',ic:'clock',title:W.T[id].name+' is past the hold',sub:esc(gName(b.booker))+' · nobody in yet · since '+fT(m.at),tid:id});}}
    else if(c.k==='pay'&&b){const mm=money(b,t);if(mm.balance>0){seen.add(key);const id=tableAt(b,t);open.push({tone:'bad',ic:'card',title:'Balance to collect at '+W.T[id].name,sub:N(aed(mm.balance))+' · card declined at '+fT(m.at),tid:id});}}
    else if(c.k==='svc'){const r=W.svc.find(x=>x.id===c.svc);if(r&&!(r.res&&r.res<=t)){seen.add(key);const id=tableAt(r.b,t);open.push({tone:'warn',ic:'bell',title:r.kind+' at '+W.T[id].name,sub:'Open for '+fWait(t-r.at),tid:id});}}
    else if(c.k==='req'&&b){if(b.at>t&&!(b.cancelAt&&b.cancelAt<=t)){seen.add(key);open.push({tone:'neu',ic:'star',title:'Backstage request waiting: '+esc(gName(b.booker)),sub:W.T[b.table].name+' · party of '+b.party,tid:b.table});}}
    else if(c.k==='inc'){const x=W.incidents[c.inc];if(x&&!(x.closed&&x.at+12*MIN<=t)){seen.add(key);open.push({tone:'bad',ic:'shield',title:(INC_L[x.type]||'Incident')+' · '+esc(x.zone),sub:esc(x.note)});}}});
  /* questions nobody has answered */
  ms.forEach((m,i)=>{if(m.card||m.by.sys||!/\?\s*$/.test(m.txt))return;if(!ms.slice(i+1).some(x=>x.by.n!==m.by.n))open.push({tone:'warn',ic:'msg',title:'No answer yet for '+esc(m.by.n.split(' ')[0]),sub:'“'+esc(chatPlain(m.txt))+'”'});});
  ms.forEach(m=>{if(!m.card&&!m.by.sys&&/\b(approved|hold|release|releasing|moving|pulling|cut-?off|we hold|lights up|bills to|opening|closed out|debrief|signed off|go out at)\b/i.test(m.txt))dec.push(m);});
  const top=Object.keys(cats).filter(k=>CAT[k]).sort((a,b)=>cats[b]-cats[a]),np=Object.keys(ppl).length,talk=cats.talk||0;
  let head=ms.length?N(ms.length)+' '+pl(ms.length,'message')+' '+win.label+(np?' from '+N(np)+' '+pl(np,'person','people'):'')+'. ':'Nothing new '+win.label+'. ';
  if(top.length)head+='Mostly '+top.slice(0,2).map(k=>N(cats[k])+' '+catL(k,cats[k])).join(' and ')+(talk?', with '+N(talk)+' from the team':'')+'. ';
  else if(talk)head+='All conversation, no alerts. ';
  head+=open.length?N(open.length)+' '+(open.length===1?'thing still needs':'things still need')+' someone.':ms.length?'Nothing is left open.':'';
  const otids=open.map(o=>o.tid).filter(Boolean);
  return {head,cats:top.slice(0,6).map(k=>[cats[k],catL(k,cats[k])]),open,dec:dec.slice(-4).reverse(),people:Object.keys(ppl).sort((a,b)=>ppl[b]-ppl[a]).slice(0,4).map(n=>({n,r:personOf(n).r,c:ppl[n]})),
    tids:otids.length?[...new Set(otids)]:[...tids].slice(0,40),fLabel:otids.length?'Still open in '+g.n:'Tables in '+g.n,n:ms.length,label:win.label,ms};}
function sumGuest(th){const t=now(),gs=G(th.g),b=th.b&&bk(th.b),ms=gMsgs(th,t),k=gK(th,t),gi=GI[k],c=gc(th,t),need=gNeeds(th,t),f=gs.n.split(' ')[0],links=gLinks(th,t),lastUs=ms.filter(m=>m.who==='us').pop(),want=gi?gi.w(c):'General question';
  let head='<b>'+esc(f)+'</b> · '+esc(want)+'. ';
  if(need)head+='Waiting '+N(fWait(gWait(th,t)))+' for a reply, looked after by '+esc(th.as.n.replace(/\.$/,''))+'. ';
  else if(gDone(th,t))head+='Marked done at '+N(fT(th.doneAt))+'. ';
  else if(lastUs)head+='Answered by '+esc(lastUs.by.n===myName()?'you':lastUs.by.n)+' at '+N(fT(lastUs.at))+'. ';
  links.forEach(l=>{const s=linkSt(l,t);head+=esc(LT[l.type].l)+' '+(s.k==='done'?esc(LDONE[l.type].toLowerCase()):s.k==='opened'?'opened':s.k==='read'?'read, not opened yet':s.k==='delivered'?'delivered, not read yet':s.k==='failed'?'did not send':'sent')+'. ';});
  const facts=[['Channel',CH[th.ch].l+' · '+gContact(th.g,th.ch)],['Guest',crmLabel(gs)+(gs.v?' · '+gs.v+(gs.v===1?' visit':' visits'):'')+(gs.prefs?' · '+gs.prefs[0]:'')]];
  if(b){const m=money(b,t),sc=seatCounts(b,t);facts.push(['Booking',W.T[tableAt(b,t)].name+' · '+b.party+' guests · '+aed(b.min)+' minimum']);facts.push(['Money',phase()==='pre'?(m.depDue?'Deposit due · '+aed(m.depDue):m.dep?'Deposit paid · '+aed(m.dep):b.comp?'Comped':'No deposit'):'Spend '+aed(m.spend)+(m.balance?' · '+aed(m.balance)+' to collect':'')]);facts.push(['Seats',sc.claimed+' of '+b.party+' named'+(phase()!=='pre'?' · '+sc.present+' in':'')]);}
  else facts.push(['Booking',th.lead?'New enquiry, not booked':'Ticket holder, no table']);
  facts.push(['Looked after by',th.as.n+(th.via?' · via '+th.via:'')]);
  /* next steps BUBL can take from here */
  const nx=[],D=need?gDrafts(th,t):[];
  if(need&&D[0])nx.push(D[0].link?act('Reply with the '+LT[D[0].link].l.toLowerCase(),()=>{sumClose();gOpenLink(th,D[0].link,D[0].txt);},'link'):act('Use the BUBL reply',()=>{sumClose();setTimeout(()=>{const i=$('#chQ');if(i){i.value=D[0].txt;i.focus();}},90);},'msg'));
  if(b&&phase()==='pre'&&money(b,t).depDue&&!links.some(l=>l.type==='deposit')&&!(D[0]&&D[0].link==='deposit'))nx.push(act('Resend the invitation',()=>{sumClose();gOpenLink(th,'deposit');},'card'));
  if(b&&phase()==='pre'&&b.seats.filter(x=>x.cl&&x.cl<=t).length<b.party*.5&&!(D[0]&&D[0].link==='claim'))nx.push(act('Send the seat-claim link',()=>{sumClose();gOpenLink(th,'claim');},'users'));
  if((k==='move'||k==='leadB')&&canTables()){const s=S(),bs=W.tables.filter(T=>T.grp==='bs'&&!s.ix[T.id]&&!T.oos&&!T.removed);if(bs.length)nx.push(act('Light '+bs.length+' free Backstage tables',()=>chShowFloor(bs.map(T=>T.id),'Free Backstage tables',f+' asked to move closer to the stage.'),'floor'));}
  if(gi&&gi.tell){const gg=chatG(gTellGid(th));if(gg)nx.push(act('Tell '+gg.n,()=>gTellTo(th,gg.id),'users'));}
  if(b&&canTables())nx.push(act('Show '+W.T[tableAt(b,t)].name+' on the floor',()=>chShowFloor([tableAt(b,t)],W.T[tableAt(b,t)].name,f+': '+want+'.'),'floor'));
  {const VB={claim:'claim the spots',deposit:'pay the deposit',preorder:'place the pre-order',tables:'pick a table',thanks:'take your first pick',invite:'open your invitation',arrival:'check the arrival details',ticket:'save your ticket',custom:'take a look'};
    const pend=links.filter(l=>{const k2=linkSt(l,t).k;return k2!=='done'&&k2!=='failed'&&l.type!=='custom'&&t-l.at>20*MIN;}).pop();
    if(pend&&!need&&chOn(th.ch)){const txt='Hi '+f+', just checking in: did you get a chance to '+VB[pend.type]+'? Happy to help if anything’s unclear.';nx.push(act('Follow up on the '+LT[pend.type].l.toLowerCase(),()=>{sumClose();setTimeout(()=>{const i=$('#chQ');if(i){i.value=txt;i.focus();}},90);},'msg'));}}
  if(!need&&!gDone(th,t))nx.push(act('Mark this chat done',()=>{sumClose();ON.gDone();},'check'));
  nx.push(act('Open '+f+'’s profile',()=>{sumClose();openGuest(th.g);},'user'));
  return {head,facts,links,nx,n:ms.length};}
/* the panel itself */
function sumHTML(id){if(!Chat.valid(id))return '<p class="note">This chat is no longer available.</p>';const st=sumS(id),isG=Chat.isG(id),t=now(),key=isG?'g':st.w;let r,h;
  if(isG)r=sumGuest(gth(id.slice(2)));else{if(!st.w)sumStart(id);r=sumTeam(chatG(id),st.w);}
  h='<div class="smy">'+(UI.device==='atlas'?'<div class="sm-hd"><span class="sm-av">'+bublMark(st.busy[key]?'think':'')+'</span><div><b>BUBL summary</b><span>'+esc(sumTitle(id))+'</span></div></div>':'');
  if(!isG)h+='<div class="seg sm-w">'+Object.keys(SUM_W).map(k=>'<button class="'+(st.w===k?'on':'')+'" data-act="smW" data-w="'+k+'">'+SUM_W[k]+'</button>').join('')+'</div>';
  const ai=st.ai[key];
  h+='<p class="sm-t">'+r.head+'</p>';
  if(ai)h+='<div class="sm-ai"><div class="sm-ail">'+I('spark',13)+'Claude</div><p>'+esc(ai.text)+'</p>'+(ai.next?'<p class="sm-nx"><b>Next</b> '+esc(ai.next)+'</p>':'')+'</div>';
  else if(st.busy[key])h+='<div class="sm-ai busy"><div class="sm-ail">'+I('spark',13)+'Claude is reading the chat</div><i class="sm-sk"></i><i class="sm-sk s2"></i></div>';
  if(isG){h+='<div class="kv sm-kv">'+r.facts.map(f=>'<span>'+esc(f[0])+'</span><b>'+esc(f[1])+'</b>').join('')+'</div>';
    if(r.links.length)h+='<div class="grp"><div class="lbl">Links in this chat</div><div class="rows">'+r.links.map(waRow).join('')+'</div></div>';
    h+='<div class="grp"><div class="lbl">Next</div><div class="sm-nxl">'+r.nx.map((a,i)=>'<button class="sm-nb'+(i===0?' pri':'')+'" data-act="runAct" data-a="'+a.id+'">'+I(a.ic,16)+'<span>'+esc(a.label)+'</span>'+I('right',14)+'</button>').join('')+'</div></div>';}
  else{if(r.cats.length)h+='<div class="sm-cats">'+r.cats.map(c=>'<span><b class="n">'+c[0]+'</b>'+esc(c[1])+'</span>').join('')+'</div>';
    h+='<div class="grp"><div class="lbl">Still open'+(r.open.length?' · '+r.open.length:'')+'</div>'+(r.open.length?'<div class="rows">'+r.open.slice(0,8).map(o=>row(o.ic,o.tone,o.title,o.sub,o.tid&&canTables()?'<button class="btn xs" data-act="chTable" data-id="'+o.tid+'">Open</button>':'')).join('')+'</div>':'<p class="note">Nothing waiting on anyone.</p>')+'</div>';
    if(r.dec.length)h+='<div class="grp"><div class="lbl">Decided</div><div class="sm-dec">'+r.dec.map(m=>'<div>'+avHTML(m.by.n,{cls:'xs'})+'<p><b>'+esc(m.by.n.split(' ')[0])+'</b> '+chatTokens(m.txt)+'</p><em class="n">'+fT(m.at)+'</em></div>').join('')+'</div></div>';
    if(r.people.length)h+='<div class="grp"><div class="lbl">Most active</div><div class="sm-ppl">'+r.people.map(p=>'<div>'+avHTML(p.n,{cls:'md'})+'<span><b>'+esc(p.n)+'</b><em>'+esc(p.r||'')+'</em></span><i class="n">'+p.c+'</i></div>').join('')+'</div></div>';
    const acts=[];if(r.tids.length&&canTables())acts.push(act('Light '+r.tids.length+' '+pl(r.tids.length,'table')+' on the floor',()=>chShowFloor(r.tids,r.fLabel,stripTags(r.head)),'floor'));
    acts.push(act('Ask the manager about this',()=>{sumClose();Agent.ask('Summarise the '+chatG(id).n+' chat');},'spark'));
    h+='<div class="sm-nxl">'+acts.map((a,i)=>'<button class="sm-nb'+(i===0?' pri':'')+'" data-act="runAct" data-a="'+a.id+'">'+I(a.ic,16)+'<span>'+esc(a.label)+'</span>'+I('right',14)+'</button>').join('')+'</div>';}
  h+='<div class="ai-src">'+(ai?'Claude, from the chat':'Written on this device from '+N(r.n)+' '+pl(r.n,'message'))+' · '+N(fT(t))+'</div></div>';return h;}
const sumFoot=()=>'';
const sumBusy=id=>{const st=sumS(id);return !!st.busy[Chat.isG(id)?'g':st.w];};
function sumRepaint(){if(UI.device==='atlas'){const sd=$('#chSide');if(sd&&Chat.side==='sum'){const st=sd.scrollTop;sd.innerHTML=Chat.sideHTML();sd._h=null;sd.scrollTop=st;}}else{const o=Sheet.stack.find(x=>x.chs);if(o){o._b=null;Sheet.paint(o);}}}
function sumClose(){if(UI.device==='atlas'){if(Chat.side){Chat.side=null;if(Chat.visible())Chat.render(Chat.host);}}else{while(Sheet.stack.some(x=>x.chs||x.chi))Sheet.close();}}
ON.smW=el=>{const id=Chat.open;if(!id)return;sumS(id).w=el.dataset.w;sumClaude(id);sumRepaint();};
/* light tables on the floor plan, with the answer card the floor agent uses */
function chShowFloor(ids,label,text){if(!canTables()){toast('The floor plan is for hosts and managers.');return;}ids=(ids||[]).filter(id=>W.T[id]);if(!ids.length){toast('No tables to show.');return;}
  sumClose();Sheet.close(true);const F=UI.floor;F.ans={q:label,m:{text:esc(text||label),focus:fz(ids,label),acts:[act('Back to the chat',()=>{const back=Chat.open||'all';try{ON.faClear();}catch(_){F.ans=null;}chatGoTo(back);},'msg')]}};F.ai=-1;
  if(UI.device==='atlas'){UI.atlas='floor';Atlas.render();}else setTab('floor');}
/* Claude rewrites the summary when it can be reached; otherwise the local one stands */
async function sumClaude(id){if(!isOn('ai')||_sumNoAI)return;const st=sumS(id),isG=Chat.isG(id),k=isG?'g':st.w;if(!k||st.ai[k]||st.busy[k])return;
  const t=now();let tr,ctx;
  if(isG){const th=gth(id.slice(2));if(!th)return;const gs=G(th.g),b=th.b&&bk(th.b);
    tr=gMsgs(th,t).map(m=>fT(m.at)+' '+(m.who==='them'?gs.n:(m.by?m.by.n:'Venue'))+': '+(m.m||'')+(m.link&&waRec(m.link)?' [link: '+LT[waRec(m.link).type].l+', '+linkSt(waRec(m.link),t).l+']':'')).join('\n');
    ctx={guest:gs.n,status:crmLabel(gs),visits:gs.v,channel:CH[th.ch].l,booking:b?{table:W.T[tableAt(b,t)].name,party:b.party,minimum_aed:b.min,deposit_due_aed:money(b,t).depDue,seats_named:seatCounts(b,t).claimed}:null,looked_after_by:th.as.n,waiting_for_reply:gNeeds(th,t)};}
  else{const g=chatG(id);if(!g)return;const r=sumTeam(g,st.w);if(!r.n)return;tr=r.ms.slice(-90).map(m=>fT(m.at)+' '+(m.by.n||'')+(m.by.r?' ('+m.by.r+')':'')+': '+chatPlain(m.card?m.card.title+(m.card.sub?' · '+m.card.sub:''):m.txt)).join('\n');
    ctx={room:g.n,window:r.label,open_items:r.open.map(o=>stripTags(o.title+' · '+(o.sub||'')))};}
  st.busy[k]=1;sumRepaint();
  const sys='You summarise a chat for staff at '+VENUE.name+' inside BUBL OPS. Be plain, short and factual, using only the transcript and CONTEXT. Use AED and 24-hour times. Respond with ONLY JSON, no markdown: {"summary":"two or three sentences","next":"one concrete next step, or empty"}';
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),20000);
  try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:600,system:sys,messages:[{role:'user',content:'CONTEXT: '+JSON.stringify(ctx)+'\nTRANSCRIPT:\n'+tr}]})});
    clearTimeout(to);if(!r.ok)throw new Error('http '+r.status);const d=await r.json(),txt=(d.content||[]).filter(c=>c.type==='text').map(c=>c.text).join(''),j=JSON.parse(txt.replace(/```json|```/g,'').trim());
    if(!j.summary)throw new Error('empty');st.ai[k]={text:String(j.summary),next:String(j.next||'')};}
  catch(e){clearTimeout(to);_sumNoAI=true;}
  delete st.busy[k];sumRepaint();}

/* ---------- the manager agent can read the chats too ---------- */
(function(){const la=localAnswer;localAnswer=function(q,s){_chQ=String(q||'');return la.apply(this,arguments);};})();
function aInbox(s){const t=s.t;if(!canGuestChat())return {text:'Guest chats are for hosts and managers.',acts:[]};const T=gThreads(t),nr=T.filter(th=>gNeeds(th,t)).sort((a,b)=>gWait(b,t)-gWait(a,t));
  return {text:N(T.length)+' guest '+pl(T.length,'chat')+' across '+(CHK.filter(k=>T.some(th=>th.ch===k)).map(k=>CH[k].l).join(', ')||'no channels')+'. '+(nr.length?N(nr.length)+' waiting for a reply, longest '+N(fWait(gWait(nr[0],t)))+' ('+esc(G(nr[0].g).n.split(' ')[0])+').':'Every guest has an answer.'),
    rows:nr.slice(0,5).map(th=>['msg','warn',esc(G(th.g).n),CH[th.ch].l+' · '+esc((gLast(th,t).m||'').slice(0,60)),fWait(gWait(th,t))]),
    acts:[act('Open guest chats',()=>chatGoGuests(),'msg')].concat(nr[0]?[act('Reply to '+G(nr[0].g).n.split(' ')[0],()=>chatGoTo('G:'+nr[0].id),'send')]:[]),
    focus:canTables()?fz(nr.filter(th=>th.b).map(th=>({id:tableAt(bk(th.b),t),tone:'warn'})),'Guests waiting for a reply'):null};}
function aChats(s){const q=_chQ.toLowerCase(),t=s.t;if(/guest|whatsapp|instagram|insta|sms|text|e-?mail|inbox|\bdms?\b/.test(q)&&canGuestChat())return aInbox(s);
  const map=[[/door|gate/,'door'],[/\bbar\b|runner/,'bar'],[/secur/,'secu'],[/host/,'hosts'],[/manager/,'mgr'],[/reserv|booking/,'res'],[/section|my team|vip left/,'sec'],[/all staff|everyone/,'all']];let gid=null;
  for(const [re,id] of map)if(re.test(q)&&chatG(id)){gid=id;break;}
  if(gid){const g=chatG(gid),r=sumTeam(g,'recent');return {text:'<b>'+esc(g.n)+'</b>. '+r.head,rows:r.open.slice(0,5).map(o=>[o.ic,o.tone,o.title,stripTags(o.sub||'')]),
    acts:[act('Open '+g.n,()=>chatGoTo(gid),'msg'),act('Full summary',()=>{chatGoTo(gid);setTimeout(()=>Chat.showSum(),140);},'spark')],focus:canTables()&&r.tids.length?fz(r.tids,r.fLabel):null};}
  const L=chatGroups().filter(g=>!g.dm).map(g=>({g,u:chatUnread(g.id,t),r:sumTeam(g,'recent')})),un=L.filter(x=>x.u).sort((a,b)=>b.u-a.u),op=[].concat(...L.map(x=>x.r.open.map(o=>Object.assign({room:x.g.n},o))));
  return {text:(un.length?N(sum(un,x=>x.u))+' unread: '+un.slice(0,4).map(x=>esc(x.g.n)+' '+N(x.u)).join(', ')+'. ':'You’re up to date in every room. ')+(op.length?N(op.length)+' open '+pl(op.length,'item')+' across the rooms.':'Nothing is left open in the rooms.')+(canGuestChat()?' '+aInbox(s).text:''),
    rows:op.slice(0,5).map(o=>[o.ic,o.tone,o.title,esc(o.room)]),acts:[act('Open Chats',()=>chatGoTo(un[0]?un[0].g.id:'all'),'msg')].concat(canGuestChat()?[act('Guest chats',()=>chatGoGuests(),'send')]:[]),
    focus:canTables()?fz(op.map(o=>o.tid).filter(Boolean),'Open items from the team chats'):null};}
INTENTS.unshift([/\b(chats?|inbox|group chats?|rooms?|messages?|whatsapp|instagram|dms?|summari[sz]e)\b/,aChats]);
(function(){try{AG_SUG.pre.owner.push('Guest messages on WhatsApp?');AG_SUG.pre.host.push('Guest messages on WhatsApp?');AG_SUG.live.owner.push('Summarise the door chat');AG_SUG.live.host.push('Summarise my section chat');AG_SUG.post.owner.push('Any guest messages on WhatsApp?');}catch(_){}
  const fs=FA.sug;FA.sug=function(){const a=fs.call(this);if(canGuestChat())a.push('Unanswered guest messages');return a;};})();
