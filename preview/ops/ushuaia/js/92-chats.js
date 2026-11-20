'use strict';
/* ============================================================
   92 · CHATS
   One messaging app for the night. Team rooms follow the role,
   with direct messages beside them; every room shows its members
   with their role under the name, and the room's admins can add or
   remove people. Guests write in on WhatsApp, Instagram and
   email (92b). Any chat can be summarised by BUBL (92c).
   Messages are timestamped on the event clock, so moving the time
   bar replays every conversation.
   ============================================================ */
const STAFF={
  roland:{n:'Roland Keyali',r:'Owner'},hana:{n:'Hana M.',r:'Duty manager'},lina:{n:'Lina A.',r:'Reservations'},
  marco:{n:'Marco D.',r:'Host · VIP Left'},nadia:{n:'Nadia K.',r:'Host · Backstage Left'},priya:{n:'Priya S.',r:'Host · VIP Right'},tomas:{n:'Tomas R.',r:'Host · Backstage Centre'},
  farah:{n:'Farah N.',r:'Door · Gate 2'},omar:{n:'Omar S.',r:'Door lead · Gate 1'},ali:{n:'Ali R.',r:'Door · Gate 3'},jamal:{n:'Jamal T.',r:'Door · Gate 4'},
  ravi:{n:'Ravi',r:'Runner · VIP Left'},jonas:{n:'Jonas',r:'Runner · VIP Left'},kenji:{n:'Kenji W.',r:'Bar lead'},viktor:{n:'Viktor S.',r:'Security lead'},
  control:{n:'Control',r:'Control room',sys:1},app:{n:'Table app',r:'Guest request',sys:1},pay:{n:'Payments',r:'Stripe',sys:1},bubl:{n:'BUBL',r:'WhatsApp',sys:1}
};
const DEPTS=[['Management',['roland','hana']],['Reservations',['lina']],['Hosts',['marco','nadia','priya','tomas']],['Door',['omar','farah','ali','jamal']],['Floor and bar',['ravi','jonas','kenji']],['Security',['viktor']]];
const GATE_STAFF={G1:'omar',G2:'farah',G3:'ali',G4:'jamal'};
const INC_L={med:'Medical',sec:'Security',cap:'Capacity',ops:'Operations',lost:'Lost property'};
const CHC=['#E0B257','#F28B82','#7FD3C4','#A5B4FC','#F9A8D4','#93C5FD','#FCD34D','#86EFAC','#C4B5FD','#FDBA74'];
const pcol=n=>CHC[h32(String(n||''))%CHC.length];
/* a round avatar: initials or an icon, tinted per person, with the channel it came in on */
function avHTML(n,o){o=o||{};return '<span class="cav'+(o.cls?' '+o.cls:'')+'" style="--c:'+(o.c||pcol(n))+'"'+(o.act?' '+o.act:'')+'>'+(o.ic?I(o.ic,o.icz||20):esc(initials(n)))+(o.ch?'<i class="cav-ch ch-'+o.ch+'">'+chGlyph(o.ch,o.chz||11)+'</i>':'')+'</span>';}
function chatGroupsAll(){const sl=SECTIONS[ROLES.host.sec].label.replace(' · ',' ');return [
  {id:'all',n:'All staff',d:'Announcements for the whole shift',ic:'bell',roles:['owner','host','door','runner'],mem:['roland','hana','lina','marco','omar','farah','ravi','kenji','viktor'],adm:['roland','hana'],qr:['Copy','On my way','Done']},
  {id:'mgr',n:'Managers',d:'Owner and duty managers',ic:'lock',roles:['owner'],mem:['roland','hana'],adm:['roland'],qr:['Approved','Hold it','Call me']},
  {id:'res',n:'Reservations',d:'Bookings, deposits and guest messages',ic:'cal',roles:['owner','host'],mem:['lina','roland','hana','marco','nadia','priya'],adm:['roland','lina'],qr:['Sending the link','Deposit paid','I’ll call them']},
  {id:'hosts',n:'Hosts',d:'Section hosts across the floor',ic:'star',roles:['owner','host'],mem:['roland','hana','marco','nadia','priya','tomas'],adm:['roland','hana'],qr:['On it','Table ready','Need a runner']},
  {id:'sec',n:sl+' team',d:'Host, runners and bar for '+sl,ic:'floor',roles:['owner','host','runner'],mem:['marco','ravi','jonas','kenji','hana'],adm:['marco','hana'],qr:['On it','Done','Need ice','Need a runner']},
  {id:'door',n:'Door and gates',d:'Arrivals, queues and ticket alerts',ic:'gate',roles:['owner','host','door'],mem:['omar','farah','ali','jamal','hana','marco'],adm:['omar','hana'],qr:['Copy','Opening a lane','VIP at the gate','Need security']},
  {id:'bar',n:'Runners and bar',d:'Bottles, pre-orders and service requests',ic:'glass',roles:['owner','host','runner'],mem:['kenji','ravi','jonas','marco','hana'],adm:['kenji','hana'],qr:['On it','Done','Need a runner','86 on it']},
  {id:'secu',n:'Security',d:'Incidents, capacity and medics',ic:'shield',roles:['owner','door'],mem:['viktor','hana','omar','farah','roland'],adm:['viktor','hana'],qr:['On my way','Resolved','Need medics']}
];}
const myName=()=>ROLES[UI.role].who;
const pkey=n=>{for(const k in STAFF)if(STAFF[k].n===n)return k;return null;};
const meKey=()=>pkey(myName());
function personOf(n){const k=pkey(n);if(k)return STAFF[k];for(const s of SEC_ORDER)if(SECTIONS[s].host===n)return {n,r:'Host · '+SECTIONS[s].label.replace(' · ',' ')};return {n,r:''};}
function chatGroups(){const me=meKey(),ov=UI.chatMem||{};
  const out=chatGroupsAll().filter(g=>g.roles.includes(UI.role)).map(g=>{const o=ov[g.id];let m=g.mem.slice();if(o){m=m.filter(k=>!o.rem.includes(k));o.add.forEach(k=>{if(!m.includes(k))m.push(k);});}if(me&&!m.includes(me))m.push(me);return Object.assign({},g,{mem:m});});
  ((UI.chatDM||{})[UI.role]||[]).forEach(k=>{if(STAFF[k]&&k!==me)out.push({id:'dm:'+k,n:STAFF[k].n,d:STAFF[k].r,ic:'user',dm:k,roles:[UI.role],mem:[me,k],adm:[],qr:['On my way','Call me when you can','Thanks 🙏']});});
  return out;}
const chatG=id=>chatGroups().find(g=>g.id===id);
const isAdm=g=>!!g&&!g.dm&&(UI.role==='owner'||g.adm.includes(meKey()));

/* ---------- the night, written into the rooms ---------- */
function chatSeed(){if(W._chat)return W._chat;const D=W.D,C=W.C,ev=W.ev,out={};let n=0;
  const add=(g,at,by,txt,card)=>{(out[g]=out[g]||[]).push({id:'s'+(n++),at:Math.round(at),by:typeof by==='string'?STAFF[by]:by,txt:txt||'',card:card||null});};
  const pick=(a,k)=>a[h32(ev.id+':'+k)%a.length],tk=b=>'{t:'+b.table+'}',gk=gi=>'{g:'+gi+'}',hs=ROLES.host.sec;
  const secB=W.bookings.filter(b=>b.sec===hs&&!b.walk),firstAr=b=>{let a=Infinity;b.seats.forEach(x=>{if(x.ar&&x.ar<a)a=x.ar;});return a<Infinity?a:0;};
  /* before doors */
  add('all',D-6*DAY-9*HOUR,'roland',ev.short+' is on '+fD(D)+'. Full black, briefing 18:30 at Gate 3. Your gate and section are in the rota.');
  add('all',D-DAY-4*HOUR,'hana','Tomorrow: staff entrance through Gate 4 from 16:30. Bring your Emirates ID.');
  add('all',D-100*MIN,'roland','Briefing at Gate 3 in ten minutes.');
  add('all',D-25*MIN,'hana','Scanners out of practice mode and synced, please. Doors at '+ev.doorsT+'.');
  add('mgr',D-10*DAY-6*HOUR,'roland','Deposits are coming in. Lina is chasing the unpaid links this week.');
  add('mgr',D-2*DAY-6*HOUR,'hana','Security plan signed off. 72 on the plan, six medics confirmed.');
  add('mgr',D-4*HOUR,'roland','Artist has landed. Soundcheck at 17:00.');
  add('hosts',D-2*DAY-5*HOUR,'roland','Section sheets are in the app. Know your Backstage List guests by name before doors.');
  add('hosts',D-DAY-3*HOUR,'marco',SECTIONS[hs].label.replace(' · ',' ')+': '+secB.length+' tables, '+secB.filter(b=>b.pre.length).length+' with pre-orders.');
  add('hosts',D-2*HOUR,'nadia','Backstage deck is dressed. Walk-through at 19:30.');
  if(secB[0])add('sec',D-135*MIN,'marco','Section briefing 19:15 at '+tk(secB[0])+'. '+secB.length+' tables tonight.');
  add('sec',D-35*MIN,'ravi','Ice and mixers stocked at the station.');
  add('door',D-DAY-8*HOUR,'omar','Gate plan: G1 and G2 general admission, G3 tables and VIP, G4 Backstage and artist only.');
  add('door',D-80*MIN,'farah','Gate 2 lanes set, six open. Practice scans all green.');
  add('door',D-8*MIN,'omar','Queue at Gate 1 is already long. All lanes open at doors.');
  add('bar',D-5*HOUR,'kenji','Pre-order bottles staged by section from 19:00. Runners collect at the Backstage bar.');
  add('secu',D-DAY-5*HOUR,'viktor','Briefing 19:00 at Gate 3. Licence is '+n0(VENUE.capacity)+', we hold at 9,700.');
  add('secu',D-30*MIN,'viktor','All posts manned. Medics at first aid north and south.');
  /* reservations: requests, confirmations and the deposit run */
  W.bookings.forEach(b=>{if(b.walk)return;const so=SRC[b.src]||{label:''};
    if(b.reqAt){add('res',b.reqAt,'lina','',{k:'req',b:b.id,tone:'neu',ic:'star',title:'Backstage request · '+gk(b.booker),sub:tk(b)+' · party of '+b.party+' · '+crmLabel(G(b.booker)),act:{k:'table',v:b.table}});
      if(b.at>b.reqAt)add('res',b.at,'roland','Approved '+tk(b)+'. Lina, send the invitation, the deposit is on it.');}
    else if(b.vip||b.grp==='bs')add('res',b.at,'lina','',{k:'book',b:b.id,tone:'ok',ic:'check',title:'Booked · '+gk(b.booker),sub:tk(b)+' · party of '+b.party+' · '+so.label,act:{k:'table',v:b.table}});});
  {const t1=D-5*DAY-8*HOUR,u=W.bookings.filter(b=>b.at<=t1&&b.depPct&&!(b.depAt&&b.depAt<=t1)&&!b.walk).length;add('res',t1,'lina',u+' deposits unpaid. Reminders go out at 12:00.');}
  {const t2=D-2*DAY-6*HOUR;let cl=0,tot=0;W.bookings.forEach(b=>{if(b.at>t2||b.walk)return;tot+=b.party;b.seats.forEach(x=>{if(x.cl&&x.cl<=t2)cl++;});});add('res',t2,'lina','Seat claims are at '+Math.round(cl/Math.max(1,tot)*100)+'%. Nudging tables under half claimed tonight.');}
  /* the night */
  add('all',D+MIN,'roland','Doors are open. Have a great night, everyone.');
  add('all',D+165*MIN,'hana','Busy on the front floor. Keep the aisles clear and walk table guests round the side.');
  add('all',C-30*MIN,'roland','Thirty minutes. Bills to every table now, please.');
  add('all',C+2*MIN,'roland','Lights up. Thank you, everyone.');
  add('hosts',D+60*MIN,'roland','Right side is slow to seat. Hosts, meet your tables at Gate 3.');
  add('hosts',D+200*MIN,'priya','VIP Right fully seated.');
  add('door',D+15*MIN,'omar','Gate 1 wait around 15 minutes. All six lanes open.');
  add('door',D+105*MIN,'omar','Early entry cut-off in 15 minutes. Second wave from 22:00.');
  add('door',D+120*MIN,'farah','Gate 2 queue down to about five minutes.');
  add('bar',D+215*MIN,'kenji','Running low on Dom at the VIP bar. Pulling from Backstage stock.');
  {const t3=D+30*MIN,rr=W.staff.filter(x=>x.role==='Runners'),inn=rr.filter(x=>x.inAt&&x.inAt<=t3).length;if(inn<rr.length)add('mgr',t3+5*MIN,'hana','Runners '+inn+' of '+rr.length+' signed in. Moving two from the back bar.');}
  {const t4=D+150*MIN,ns=W.bookings.filter(b=>!b.walk&&b.at<=t4&&b.arriveBy+VENUE.graceMin*MIN<t4&&!(b.cancelAt&&b.cancelAt<=t4)&&!b.seats.some(x=>x.ar&&x.ar<=t4)).length;if(ns)add('mgr',t4,'hana',ns+' '+pl(ns,'table')+' past the hold. Releasing to the waitlist from 22:45.');}
  W.bookings.forEach(b=>{if(b.walk)return;const fa=firstAr(b),vipish=b.vip||b.grp==='bs',inSec=b.sec===hs;
    if(fa&&(vipish||inSec)){const s0=b.seats.find(x=>x.ar===fa),gs=GATE_STAFF[(s0&&s0.gate)||'G3']||'ali',nIn=b.seats.filter(x=>x.ar&&x.ar<=fa+4*MIN).length;
      const card={k:vipish?'vip':'arr',b:b.id,tone:'ok',ic:vipish?'star':'users',title:(vipish?'VIP in · ':'Arrived · ')+gk(b.booker),sub:tk(b)+' · '+nIn+' of '+b.party+' through '+GATE[(s0&&s0.gate)||'G3'].label,act:{k:'table',v:b.table}};
      if(vipish)add('door',fa,gs,'',card);if(inSec){add('sec',fa,gs,'',card);if(vipish&&h32(b.id)%3)add('sec',fa+MIN,'marco',pick(['Meeting them at the gate.','On my way to Gate 3.','Got them.'],b.id));}}
    if(!fa&&b.arriveBy+VENUE.graceMin*MIN<C&&(vipish||inSec)){const at=b.arriveBy+VENUE.graceMin*MIN;
      add(inSec?'sec':'res',at,inSec?'marco':'lina','',{k:'hold',b:b.id,tone:'bad',ic:'clock',title:'Past the hold · '+tk(b),sub:gk(b.booker)+' · nobody in yet',act:{k:'table',v:b.table}});
      add(inSec?'sec':'res',at+3*MIN,inSec?'hana':'roland','Hold '+tk(b)+' fifteen more minutes, then release to the waitlist.');}
    if(b.declined){add('mgr',b.declined,'pay','',{k:'pay',b:b.id,tone:'bad',ic:'card',title:'Card declined · '+tk(b),sub:gk(b.payer)+' · balance to collect',act:{k:'table',v:b.table}});if(inSec)add('sec',b.declined+MIN,'marco','On it, going to '+tk(b)+' with the terminal.');}});
  W.svc.forEach(r=>{const b=r.b;if(!b||b.walk)return;const inSec=b.sec===hs,spark=/Sparkler/.test(r.kind);if(!inSec&&!spark)return;
    const card={k:'svc',svc:r.id,b:b.id,tone:r.kind==='Security assist'?'bad':'warn',ic:spark?'star':'bell',title:r.kind+' · '+tk(b),sub:gk(b.booker)+' · from the table app',act:{k:'table',v:b.table}},rr=Math.min(r.res||r.at+2*MIN,r.at+2*MIN);
    if(inSec){add('sec',r.at,'app','',card);add('sec',rr,h32(r.id)%2?'ravi':'jonas',pick(['On it.','Taking it now.','Two minutes.'],r.id));}
    if(spark){add('bar',r.at,'app','',card);add('bar',rr,'kenji','Sparklers on their way to '+tk(b)+'.');}});
  W.bookings.forEach(b=>{b.orders.forEach(o=>{if(o.pre&&o.amt>=3000&&!b.walk)add('bar',o.at,'app','',{k:'pre',b:b.id,tone:'neu',ic:'glass',title:'Pre-order fired · '+o.nm,sub:tk(b)+' · '+aedK(o.amt),act:{k:'table',v:b.table}});});});
  W.alerts.forEach(a=>{add('door',a.at,GATE_STAFF[a.gate]||'omar','',{k:'alert',tone:'bad',ic:'shield',title:a.type==='dup'?'Duplicate ticket stopped':'Name does not match the ID',sub:(GATE[a.gate]?GATE[a.gate].label:a.gate)+' · '+a.ref});});
  W.incidents.forEach((x,i)=>{add('secu',x.at,'control','',{k:'inc',inc:i,tone:x.type==='med'||x.type==='sec'?'bad':'warn',ic:x.type==='med'?'plus':'shield',title:(INC_L[x.type]||'Incident')+' · '+x.zone,sub:x.note});
    if(x.closed)add('secu',x.at+12*MIN,'viktor','Closed out.');});
  /* after close */
  add('all',C+45*MIN,'roland','Great night. Debrief Monday 15:00 at the Gate 3 office.');
  add('all',C+6*HOUR,'hana','Lost and found: three phones and a wallet at Gate 3. Logged with photos.');
  add('mgr',C+70*MIN,'roland','Close-out is in Report. Thanks for holding the line on comps.');
  add('res',C+7*HOUR,'lina','Follow-ups go out at 12:00, with first pick for the next event.');
  add('hosts',C+25*MIN,'marco',SECTIONS[hs].label.replace(' · ',' ')+' closed out. Thanks, team.');
  add('sec',C+15*MIN,'marco','All tables settled. Thank you both.');
  add('door',C+20*MIN,'omar','Gates closed. Exit flow clear.');
  add('bar',C+30*MIN,'kenji','Bars closed. Stock count in the morning.');
  add('secu',C+15*MIN,'viktor','Venue clear. No open incidents.');
  Object.values(out).forEach(a=>a.sort((x,y)=>x.at-y.at));W._chat=out;return out;}
function chatLive(){return W.chatLive||(W.chatLive={});}
function uptoAt(a,t){let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m].at<=t)lo=m+1;else hi=m;}return lo;}
function chatMsgs(gid,t){t=t==null?now():t;const a=chatSeed()[gid]||[],sd=a.slice(0,uptoAt(a,t)),lv=(chatLive()[gid]||[]).filter(m=>m.at<=t);
  return lv.length?sd.concat(lv).sort((x,y)=>x.at-y.at||(x.live?1:0)-(y.live?1:0)):sd;}
function chatRead(){return UI.chatRead||(UI.chatRead={});}
function chatSync(){const t=now();if(Chat._seen!=null&&Math.abs(t-Chat._seen)<=5*MIN){Chat._seen=t;return;}Chat._seen=t;const r=chatRead(),floor=t-30*MIN;
  Object.keys(r).forEach(k=>{if(r[k]<floor)r[k]=floor;});const g=UI.gRead||(UI.gRead={});gchSeed().forEach(th=>{if((g[th.id]||0)<floor-3*HOUR)g[th.id]=floor-3*HOUR;});Chat.prevRead={};}
function chatUnread(gid,t){t=t==null?now():t;const r=chatRead(),k=UI.role+':'+gid;if(r[k]==null)r[k]=gid.indexOf('dm:')===0?0:t;const me=myName(),from=r[k];if(from>=t)return 0;
  const a=chatSeed()[gid]||[];let c=0;for(let i=uptoAt(a,from);i<a.length&&a[i].at<=t;i++)if(a[i].by.n!==me)c++;
  (chatLive()[gid]||[]).forEach(m=>{if(m.at>from&&m.at<=t&&m.by.n!==me&&!m.sysm)c++;});return c;}
const readAt=gid=>chatRead()[UI.role+':'+gid]||0;
const markRead=(gid,t)=>{const r=chatRead(),k=UI.role+':'+gid;r[k]=Math.max(r[k]||0,t);};
function chatUnreadAll(){chatSync();const t=now();let c=0;chatGroups().forEach(g=>{if(g.id!==Chat.open||!Chat.visible())c+=chatUnread(g.id,t);});if(canGuestChat())c+=gUnreadAll(t);return c;}

/* ---------- text: tokens become tappable tables and guests ---------- */
function chatTokens(txt){return esc(txt).replace(/\{t:([A-Z0-9]+)\}/g,(m,id)=>{const T=W.T[id];if(!T)return m;return canTables()?'<button class="cref" data-act="chTable" data-id="'+id+'">'+esc(T.name)+'</button>':'<b class="cref">'+esc(T.name)+'</b>';})
  .replace(/\{g:(\d+)\}/g,(m,gi)=>'<button class="cref g" data-act="guest" data-g="'+gi+'">'+esc(gName(+gi))+'</button>');}
const chatPlain=txt=>String(txt||'').replace(/\{t:([A-Z0-9]+)\}/g,(m,id)=>W.T[id]?W.T[id].name:m).replace(/\{g:(\d+)\}/g,(m,gi)=>gName(+gi));
function chatTableRe(){if(W._chRe)return W._chRe;const names=W.tables.map(T=>T.name).sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  W._chRe=new RegExp('\\b('+names.join('|')+')\\b','gi');return W._chRe;}
function chatEncode(txt){const byName={};W.tables.forEach(T=>byName[T.name.toLowerCase()]=T.id);
  let s=String(txt).replace(chatTableRe(),m=>{const id=byName[m.toLowerCase()];return id?'{t:'+id+'}':m;});
  (Chat.att||[]).forEach(a=>{if(a.k==='g'&&s.includes(a.n))s=s.split(a.n).join('{g:'+a.v+'}');});return s;}
function dayLabel(ms,t){const a=fD(ms);if(a===fD(t))return 'Today';if(a===fD(t-DAY))return 'Yesterday';return a;}
const backI=()=>I('right',22).replace('<svg','<svg style="transform:scaleX(-1)"');

/* ---------- the chat app: list, thread, and on Atlas a side panel ---------- */
const Chat={open:null,mode:null,q:'',f:'all',side:null,att:[],typing:{},host:null,_last:null,_sig:'',prevRead:{},
  visible(){return !!(this.host&&this.host.isConnected&&$('#chat',this.host));},
  isG(id){id=id==null?this.open:id;return !!id&&id.indexOf('G:')===0;},
  valid(id){if(this.isG(id)){if(!canGuestChat())return false;const th=gth(id.slice(2));return !!th&&gVis(th);}return !!chatG(id);},
  firstId(){if(this.mode==='guests'){const T=gThreads(now());if(T.length)return 'G:'+T[0].id;}const g=this.teamRows(now())[0];return g?g.g.id:null;},
  render(v){if(!v)return;this.host=v;chatSync();const atl=UI.device==='atlas';if(!canGuestChat())this.mode='team';else if(!this.mode)this.mode='guests';
    if(this.open&&!this.valid(this.open))this.open=null;if(atl&&!this.open)this.open=this.firstId();if(!this.open)this.side=null;
    const full=!atl&&!!this.open,app=$('#app');if(app)app.classList.toggle('ch-full',full);
    v.innerHTML='<div class="chat'+(atl?' atl':'')+(full?' th-on':'')+(atl&&this.side?' side-on':'')+'" id="chat">'+
      (atl||!this.open?'<aside class="ch-list" id="chList">'+this.listShell()+'</aside>':'')+
      (this.open?'<section class="ch-th'+(this.isG()?' g ch-'+gth(this.open.slice(2)).ch:'')+'" id="chTh">'+this.threadHTML()+'</section>':atl?'<section class="ch-th ch-none"><div class="ch-e">'+I('msg',30)+'<b>Pick a conversation</b><span>Guest chats carry their booking. Team rooms follow your role.</span></div></section>':'')+
      (atl&&this.open&&this.side?'<aside class="ch-side" id="chSide">'+this.sideHTML()+'</aside>':'')+'</div>';
    this.wire();this.afterPaint(true);this._sig=this.sig();},
  wire(){const s=this.host&&$('#chS',this.host);if(s&&!s._w){s._w=1;s.addEventListener('input',()=>{this.q=s.value;this.paintRows(true);});}},
  /* ----- list ----- */
  listShell(){const g=canGuestChat();return '<div class="ch-lh"><h2>Chats</h2><button class="ch-new" data-act="chNew" aria-label="New message">'+I('edit',19)+'</button></div>'+
      (g?'<div class="ch-seg" id="chSeg">'+this.segHTML()+'</div>':'')+
      '<label class="ch-srch">'+I('search',17)+'<input id="chS" type="search" placeholder="'+(this.mode==='guests'?'Search guests, tables, messages':'Search rooms and people')+'" value="'+esc(this.q)+'" autocomplete="off" autocapitalize="none" aria-label="Search chats"></label>'+
      (this.mode==='guests'?'<div class="ch-flt" id="chFlt">'+this.fltHTML()+'</div>':'')+'<div class="ch-rows" id="chRows">'+this.rowsHTML()+'</div>';},
  segHTML(){const t=now(),gu=gUnreadAll(t),gn=gThreads(t).filter(th=>gNeeds(th,t)).length;let tu=0;chatGroups().forEach(g=>tu+=chatUnread(g.id,t));
    return '<button class="'+(this.mode==='guests'?'on':'')+'" data-act="chMode" data-m="guests">Guests'+(gn?'<i class="n warn">'+gn+'</i>':gu?'<i class="n">'+gu+'</i>':'')+'</button><button class="'+(this.mode==='team'?'on':'')+'" data-act="chMode" data-m="team">Team'+(tu?'<i class="n">'+(tu>99?'99+':tu)+'</i>':'')+'</button>';},
  fltHTML(){const t=now(),T=gThreads(t),c={all:T.length,need:T.filter(th=>gNeeds(th,t)).length,unread:T.filter(th=>gUnread(th,t)).length,links:T.filter(th=>gLinks(th,t).length).length,done:T.filter(th=>gDone(th,t)).length};
    return [['all','All'],['need','Needs reply'],['unread','Unread'],['links','Links'],['done','Done']].map(f=>'<button class="chip'+(this.f===f[0]?' on':'')+'" data-act="chF" data-f="'+f[0]+'">'+f[1]+(c[f[0]]&&f[0]!=='all'?' <span class="n">'+c[f[0]]+'</span>':'')+'</button>').join('');},
  teamRows(t){const me=myName();return chatGroups().map(g=>{const m=chatMsgs(g.id,t),last=m[m.length-1];return {g,last,u:chatUnread(g.id,t),at:last?last.at:0};})
    .sort((a,b)=>(a.g.id==='all'?-1:0)-(b.g.id==='all'?-1:0)||b.at-a.at);},
  rowsHTML(){const t=now(),q=this.q.trim().toLowerCase();
    if(this.mode==='guests'){let T=gThreads(t);const f=this.f;
      if(f==='need')T=T.filter(th=>gNeeds(th,t));else if(f==='unread')T=T.filter(th=>gUnread(th,t));else if(f==='links')T=T.filter(th=>gLinks(th,t).length);else if(f==='done')T=T.filter(th=>gDone(th,t));
      if(q)T=T.filter(th=>gSearch(th,t).includes(q));
      return T.length?T.map(th=>gRowHTML(th,t,this.open==='G:'+th.id)).join(''):'<p class="ch-empty">'+(q?'No guest chats match “'+esc(this.q)+'”.':!Object.keys(CH).some(k=>isOn(CH[k].int))?esc(gapLine(gapFor('inbox')))+'. Guest chats from WhatsApp, Instagram and email show here once connected.':f==='need'?'Every guest has an answer.':'No guest chats here yet.')+'</p>';}
    const me=myName();let R=this.teamRows(t);if(q)R=R.filter(r=>(r.g.n+' '+r.g.d+' '+r.g.mem.map(k=>STAFF[k]?STAFF[k].n:'').join(' ')).toLowerCase().includes(q));
    return R.length?R.map(r=>{const g=r.g,last=r.last,ty=this.typing[g.id]&&Date.now()<this.typing[g.id].until?this.typing[g.id]:null;
      const pv=ty?'<em class="ch-ty">'+esc(g.dm?'typing…':ty.n.split(' ')[0]+' is typing…')+'</em>':last?(last.sysm?esc(last.txt):(last.by.n===me?'You: ':last.by.sys||g.dm?'':esc(last.by.n.split(' ')[0])+': ')+esc(chatPlain(last.card?last.card.title:last.txt))):esc(g.d);
      return '<button class="ch-r'+(this.open===g.id?' on':'')+(r.u?' unr':'')+'" data-act="chOpen" data-g="'+g.id+'">'+(g.dm?avHTML(g.n):avHTML(g.n,{ic:g.ic,c:'#E0B257',cls:'grp'}))+
        '<span class="ch-rt"><span class="ch-r1"><b>'+esc(g.n)+'</b><em class="n">'+(last?rowTime(last.at,t):'')+'</em></span><span class="ch-r2"><span class="pv">'+pv+'</span>'+(r.u?'<i class="ch-ub n">'+(r.u>99?'99+':r.u)+'</i>':'')+'</span></span></button>';}).join(''):'<p class="ch-empty">No rooms match “'+esc(this.q)+'”.</p>';},
  paintRows(force){const el=this.host&&$('#chRows',this.host);if(!el)return;const h=this.rowsHTML();if(force||el._h!==h){el.innerHTML=h;el._h=h;}
    const sg=$('#chSeg',this.host);if(sg){const s=this.segHTML();if(sg._h!==s){sg.innerHTML=s;sg._h=s;}}
    const fl=$('#chFlt',this.host);if(fl){const s=this.fltHTML();if(fl._h!==s){fl.innerHTML=s;fl._h=s;}}},
  /* ----- thread ----- */
  threadHTML(){if(this.isG())return gThreadHTML(gth(this.open.slice(2)));const g=chatG(this.open);if(!g)return '';const t=now();
    if(this.prevRead[g.id]==null)this.prevRead[g.id]=readAt(g.id);markRead(g.id,t);
    return '<div class="ch-thd">'+(UI.device!=='atlas'?'<button class="ch-bk" data-act="chBack" aria-label="All chats">'+backI()+'</button>':'')+
      '<button class="ch-hd" data-act="chInfo" aria-label="Members and info">'+(g.dm?avHTML(g.n,{cls:'md'}):avHTML(g.n,{ic:g.ic,c:'#E0B257',cls:'md grp',icz:18}))+'<span class="ch-tt"><b>'+esc(g.n)+'</b><span id="chSub">'+this.subHTML(g)+'</span></span></button>'+
      '<button class="ch-sumb" data-act="chSum" aria-label="Summarise this chat">'+bublMark()+'<span>Summary</span></button></div>'+
      '<div class="ch-msgs" id="chMsgs">'+this.msgsHTML(g)+'</div>'+
      '<div class="ch-comp"><div class="ch-qr">'+g.qr.map(q=>'<button class="chip" data-act="chQuick" data-q="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div>'+
      '<div class="ch-att" id="chAtt">'+this.attHTML()+'</div>'+
      '<div class="ch-in"><button class="ch-plus" data-act="chAttach" aria-label="Attach a table or guest">'+I('plus',20)+'</button><input id="chQ" type="text" placeholder="'+(g.dm?'Message '+esc(g.n.split(' ')[0]):'Message')+'" enterkeyhint="send" autocomplete="off" aria-label="Message"><button class="ch-send" data-act="chSend" aria-label="Send">'+I('send',19)+'</button></div></div>';},
  subHTML(g){const ty=this.typing[g.id];if(ty&&Date.now()<ty.until)return '<em class="ch-ty">'+(g.dm?'typing…':esc(ty.n.split(' ')[0])+' is typing…')+'</em>';
    if(g.dm)return esc(g.d);const me=meKey();return esc(g.mem.filter(k=>k!==me).map(k=>STAFF[k].n.split(' ')[0]).join(', ')+', You');},
  attHTML(){return (this.att||[]).map((a,i)=>'<span class="ch-chip">'+I(a.k==='t'?'floor':'user',13)+esc(a.n)+'<button data-act="chUnatt" data-i="'+i+'" aria-label="Remove">'+I('x',12)+'</button></span>').join('');},
  msgsHTML(g){const t=now(),all=chatMsgs(g.id,t),me=myName(),lim=this.lim||80,list=all.slice(-lim);let h='',prev=null,pd='';
    if(all.length>list.length)h+='<button class="ch-more" data-act="chMore">Earlier messages</button>';
    if(!all.length)h+='<div class="ch-hello">'+(g.dm?avHTML(g.n,{cls:'lg'}):avHTML(g.n,{ic:g.ic,c:'#E0B257',cls:'lg grp',icz:30}))+'<b>'+esc(g.n)+'</b><span>'+esc(g.dm?g.d:g.d)+'</span><p>'+(g.dm?'Messages here are only between you and '+esc(g.n.split(' ')[0])+'.':'No messages yet.')+'</p></div>';
    const same=(a,b)=>a&&b&&!a.card&&!b.card&&!a.sysm&&!b.sysm&&a.by.n===b.by.n&&Math.abs(b.at-a.at)<6*MIN&&fD(a.at)===fD(b.at);
    list.forEach((m,i)=>{const d=fD(m.at);if(d!==pd){h+='<div class="ch-day"><span>'+dayLabel(m.at,t)+'</span></div>';pd=d;prev=null;}
      if(m.sysm){h+='<div class="ch-sys"><span>'+esc(m.txt)+'</span></div>';prev=null;return;}
      const mine=m.by.n===me,first=!same(prev,m),last=!same(m,list[i+1]);
      if(m.card){const c=m.card;h+='<div class="ch-card '+c.tone+'"><span class="ch-ci">'+I(c.ic,16)+'</span><div class="ch-ct"><b>'+chatTokens(c.title)+'</b>'+(c.sub?'<span>'+chatTokens(c.sub)+'</span>':'')+'<em><span class="n">'+fT(m.at)+'</span> · '+esc(m.by.n)+(m.by.r&&!m.by.sys?' · '+esc(m.by.r):'')+'</em></div>'+
        (c.act&&c.act.k==='table'&&canTables()?'<button class="btn xs" data-act="chTable" data-id="'+c.act.v+'">Open</button>':'')+'</div>';prev=null;return;}
      const pk=pkey(m.by.n);
      h+='<div class="ch-m'+(mine?' me':'')+(first?' first':'')+(last?' last':'')+'">'+(!mine&&!g.dm?(last?avHTML(m.by.n,{cls:'sm',act:pk?'data-act="chMem" data-k="'+pk+'" role="button"':''}):'<span class="cav-sp"></span>'):'')+
        '<div class="ch-b">'+(!mine&&first&&!g.dm?'<div class="ch-who" style="--c:'+pcol(m.by.n)+'"><b>'+esc(m.by.n)+'</b><span>'+esc(m.by.r||'')+'</span></div>':'')+
        '<p>'+chatTokens(m.txt)+'<span class="ch-meta"><span class="n">'+fT(m.at)+'</span>'+(mine?tTicks(m,t):'')+'</span></p></div></div>';prev=m;});
    const ty=this.typing[g.id];if(ty&&Date.now()<ty.until)h+='<div class="ch-m first last">'+(g.dm?'':avHTML(ty.n,{cls:'sm'}))+'<div class="ch-b ch-typ"><i></i><i></i><i></i></div></div>';
    return h;},
  afterPaint(first){const ms=this.host&&$('#chMsgs',this.host);if(ms&&(first||this._stick)){ms.scrollTop=ms.scrollHeight;this._stick=false;}},
  /* ----- side panel on Atlas; a sheet on the handheld ----- */
  sideHTML(){if(!this.open||!this.side)return '';const x='<button class="ch-sx" data-act="chSideX" aria-label="Close">'+I('x',18)+'</button>';
    return x+(this.side==='sum'?sumHTML(this.open):this.isG()?gInfoHTML(gth(this.open.slice(2))):infoHTML(chatG(this.open)));},
  showInfo(){if(!this.open)return;if(UI.device==='atlas'){this.side=this.side==='info'?null:'info';this.render(this.host);return;}
    const id=this.open;Sheet.open({chi:true,tall:true,title:()=>this.isG(id)?'Guest':(chatG(id)&&chatG(id).dm?'Contact':'Group info'),sub:'',body:()=>this.valid(id)?(this.isG(id)?gInfoHTML(gth(id.slice(2))):infoHTML(chatG(id))):'<p class="note">This chat is no longer available.</p>'});},
  showSum(){if(!this.open)return;const id=this.open;sumStart(id);if(UI.device==='atlas'){this.side='sum';this.render(this.host);return;}
    if(Sheet.top()&&Sheet.top().chs){Sheet.refresh(true);return;}
    Sheet.open({chs:true,tall:true,title:()=>'<span class="sh-bub">'+bublMark(sumBusy(id)?'think':'')+'BUBL summary</span>',sub:()=>esc(sumTitle(id)),body:()=>sumHTML(id),foot:()=>sumFoot(id)});},
  /* ----- keeping it live ----- */
  sig(){const t=now();let s=UI.role+'|'+this.mode+'|'+(this.open||'')+'|';chatGroups().forEach(g=>{s+=chatMsgs(g.id,t).length+',';});
    if(canGuestChat())gThreads(t).forEach(th=>{s+=th.id+':'+uptoAt(th.msgs,t)+(gNeeds(th,t)?'n':'')+(gDone(th,t)?'d':'')+';';});
    for(const k in this.typing)if(Date.now()<this.typing[k].until)s+='ty'+k;
    if(this.isG()){const th=gth(this.open.slice(2));if(th)s+=gLinks(th,t).map(m=>linkSt(m,t).k).join(',')+gTickSig(th,t);}
    return s+'|'+offCount();},
  update(){if(!this.visible())return;chatSync();if(this.open&&!this.valid(this.open)){this.open=null;this.side=null;this.render(this.host);return;}
    const t=now();this.paintRows();
    if(this.open){const ms=$('#chMsgs',this.host);if(ms){const near=ms.scrollHeight-ms.scrollTop-ms.clientHeight<90,h=this.isG()?gMsgsHTML(gth(this.open.slice(2))):this.msgsHTML(chatG(this.open));
        if(ms._h!==h){ms.innerHTML=h;ms._h=h;if(near||this._stick)ms.scrollTop=ms.scrollHeight;this._stick=false;}}
      if(this.isG()){const th=gth(this.open.slice(2));gMarkRead(th,t);gPaintBits(th,this.host);}else{const g=chatG(this.open);markRead(g.id,t);const sb=$('#chSub',this.host);if(sb){const s=this.subHTML(g);if(sb._h!==s){sb.innerHTML=s;sb._h=s;}}}}
    const sd=$('#chSide',this.host);if(sd){const h='<!--'+this.side+'-->'+this.sideHTML();if(sd._h!==h){const st=sd.scrollTop;sd.innerHTML=this.sideHTML();sd._h=h;sd.scrollTop=st;}}
    this.badge();},
  badge(){const n=chatUnreadAll(),txt=n?(n>99?'99+':String(n)):'';
    const tb=$('#tabs [data-t="chat"] .bdg'),tbtn=$('#tabs [data-t="chat"]');if(tbtn){if(txt&&UI.tab!=='chat'){if(tb)tb.textContent=txt;else tbtn.insertAdjacentHTML('beforeend','<span class="bdg">'+txt+'</span>');}else if(tb)tb.remove();}
    const rb=$('#rail [data-v="chat"]');if(rb){const b=rb.querySelector('.rbdg');if(txt&&UI.atlas!=='chat'){if(b)b.textContent=txt;else rb.insertAdjacentHTML('beforeend','<span class="rbdg n">'+txt+'</span>');}else if(b)b.remove();}},
  /* every second: repaint only when something changed, and a quiet banner when a message lands elsewhere */
  tick(){if(!W)return;const t=now(),me=myName();
    if(this.visible()){const s=this.sig();if(s!==this._sig){this._sig=s;this.update();const o=Sheet.top();if(o&&(o.chi||o.chs))Sheet.refresh(true);}}
    if(this._last==null||t<this._last||t-this._last>5*MIN){this._last=t;this.badge();return;}
    const fresh=[];chatGroups().forEach(g=>{const a=chatSeed()[g.id]||[];for(let i=uptoAt(a,this._last);i<a.length&&a[i].at<=t;i++)if(a[i].by.n!==me)fresh.push({id:g.id,g,m:a[i]});});
    if(canGuestChat())gThreads(t).forEach(th=>{th.msgs.forEach(m=>{if(m.who==='them'&&m.at>this._last&&m.at<=t&&!m.live)fresh.push({id:'G:'+th.id,th,m});});});
    this._last=t;if(!fresh.length)return;this.badge();if(fresh.length>3)return;const f=fresh[fresh.length-1];if(this.visible()&&this.open===f.id)return;
    if(f.th)this.banner(f.id,avHTML(G(f.th.g).n,{cls:'sm',ch:f.th.ch,chz:9}),G(f.th.g).n,f.m.m);else this.banner(f.id,avHTML(f.g.n,{ic:f.g.ic,c:'#E0B257',cls:'sm grp',icz:15}),f.g.n,(f.m.by.sys?'':f.m.by.n.split(' ')[0]+': ')+chatPlain(f.m.card?f.m.card.title:f.m.txt));},
  banner(id,av,title,txt){const st=$('#stage');if(!st)return;let el=$('#chNb');if(!el){el=document.createElement('button');el.id='chNb';el.className='ch-nb';el.setAttribute('data-act','chNbGo');st.appendChild(el);}
    el.dataset.g=id;el.innerHTML=av+'<span class="ch-nbt"><b>'+esc(title)+'</b><span>'+esc(txt)+'</span></span>';
    el.classList.remove('in');void el.offsetWidth;el.classList.add('in');clearTimeout(this._nbT);this._nbT=setTimeout(()=>el.classList.remove('in'),4200);},
  /* ----- sending in a team room ----- */
  send(txt){txt=String(txt||'').trim();if(!txt||!this.open)return;if(this.isG()){gSend(gth(this.open.slice(2)),txt);return;}const g=chatG(this.open);if(!g)return;const L=chatLive(),me=myName();
    const m={id:'l'+Date.now()+Math.random().toString(36).slice(2,6),at:now(),by:{n:me,r:ROLES[UI.role].label},txt:chatEncode(txt),live:1};(L[g.id]=L[g.id]||[]).push(m);this.att=[];
    markRead(g.id,now());this._stick=true;this.repaint();haptic(8);this.reply(g,txt);},
  post(gid,by,txt,card){const L=chatLive();(L[gid]=L[gid]||[]).push({id:'p'+Date.now()+Math.random().toString(36).slice(2,6),at:now(),by:typeof by==='string'?STAFF[by]:by,txt:txt||'',card:card||null,live:1});if(this.visible())this.update();else this.badge();},
  sys(gid,txt){const L=chatLive();(L[gid]=L[gid]||[]).push({id:'y'+Date.now()+Math.random().toString(36).slice(2,6),at:now(),by:{n:'',r:''},txt,sysm:1,live:1});},
  reply(g,txt){const low=txt.toLowerCase(),me=myName(),mem=g.mem.map(k=>STAFF[k]).filter(p=>p&&p.n!==me);if(!mem.length)return;
    const T=findTable(txt),has=k=>mem.find(p=>p===STAFF[k]);let who=null,ans='';
    if(g.dm){who=mem[0];ans=/\?/.test(txt)?['Yes, on it.','Give me two minutes.','Let me check and come back to you.'][h32(txt)%3]:['👍','Copy that.','Thanks!','On it.'][h32(txt)%4];}
    else if(/runner|ice|mixer|bottle|glass|water|napkin/.test(low)){who=has('ravi')||has('jonas')||has('kenji');ans=['On my way.','Taking it now.','Two minutes.'][Date.now()%3];}
    else if(/security|fight|medic|medical|hurt|drunk|aggressive/.test(low)){who=has('viktor')||has('hana')||has('omar');ans='Security on the way.';}
    else if(/deposit|link|booking|invite|whatsapp|request|confirm/.test(low)){who=has('lina')||has('roland');ans='I’ll send it now.';}
    else if(T){const hn=SECTIONS[T.sec]&&SECTIONS[T.sec].host,hp=mem.find(p=>p.n===hn)||has('marco')||has('hana');who=hp||mem[0];ans=/gate|arriv/.test(low)?'On my way to the gate for '+T.name+'.':'On it, heading to '+T.name+'.';}
    else if(/queue|gate|scan|lane|line/.test(low)){who=has('omar')||has('farah');ans='Copy. Opening another lane.';}
    if(!who){who=mem[h32(txt)%mem.length];ans=['Copy.','Seen, thanks.','On it.','Got it.'][h32(txt+'a')%4];}
    const gid=g.id,d1=900+Math.random()*700,d2=1800+Math.random()*1600;
    setTimeout(()=>{this.typing[gid]={n:who.n,until:Date.now()+d2+400};if(this.visible())this.update();},d1);
    setTimeout(()=>{delete this.typing[gid];const L=chatLive();(L[gid]=L[gid]||[]).push({id:'r'+Date.now(),at:now(),by:who,txt:chatEncode(ans),live:1});
      if(this.visible()&&this.open===gid){markRead(gid,now());this._stick=true;this.update();}else{this.badge();this.banner(gid,avHTML(who.n,{cls:'sm'}),g.n,(g.dm?'':who.n.split(' ')[0]+': ')+ans);}},d1+d2);},
  repaint(){if(!this.visible())return;const th=$('#chTh',this.host);if(th){const v=$('#chQ',th),keep=v&&document.activeElement===v;const ms=$('#chMsgs',th);
      if(ms){const h=this.isG()?gMsgsHTML(gth(this.open.slice(2))):this.msgsHTML(chatG(this.open));ms.innerHTML=h;ms._h=h;ms.scrollTop=ms.scrollHeight;}
      const at=$('#chAtt',th);if(at)at.innerHTML=this.attHTML();if(this.isG())gPaintBits(gth(this.open.slice(2)),this.host,true);if(keep)v.focus();}
    this.paintRows(true);const sd=$('#chSide',this.host);if(sd){sd.innerHTML=this.sideHTML();sd._h=null;}this.badge();this._sig=this.sig();}
};
function tTicks(m,t){const a=t-m.at;return a<1200?'<i class="tk">✓</i>':'<i class="tk'+(a>6000?' rd':'')+'">✓✓</i>';}
function rowTime(at,t){return fD(at)===fD(t)?fT(at):fD(at)===fD(t-DAY)?'Yesterday':fD(at).replace(/^\w+ /,'');}

/* ---------- group info: members with their role, admins add and remove ---------- */
function infoHTML(g){if(!g)return '';const me=meKey(),adm=isAdm(g),t=now(),n=chatMsgs(g.id,t).length;
  if(g.dm){const p=STAFF[g.dm];return '<div class="ci-top">'+avHTML(p.n,{cls:'xl'})+'<b>'+esc(p.n)+'</b><span>'+esc(p.r)+'</span></div>'+
    '<button class="ci-sum" data-act="chSum">'+bublMark()+'<span><b>Summarise this chat</b><em>'+N(n)+' '+pl(n,'message')+'</em></span>'+I('right',16)+'</button>'+
    '<div class="grp"><div class="lbl">In the same rooms</div><div class="ci-ml">'+chatGroups().filter(x=>!x.dm&&x.mem.includes(g.dm)).map(x=>'<button class="ci-m" data-act="chOpen" data-g="'+x.id+'">'+avHTML(x.n,{ic:x.ic,c:'#E0B257',cls:'md grp',icz:17})+'<span class="ci-mt"><b>'+esc(x.n)+'</b><span>'+x.mem.length+' members</span></span>'+I('right',15)+'</button>').join('')+'</div></div>';}
  const mem=g.mem.slice().sort((a,b)=>(b===me)-(a===me)||(g.adm.includes(b)||b==='roland')-(g.adm.includes(a)||a==='roland')||STAFF[a].n.localeCompare(STAFF[b].n));
  return '<div class="ci-top">'+avHTML(g.n,{ic:g.ic,c:'#E0B257',cls:'xl grp',icz:34})+'<b>'+esc(g.n)+'</b><span>Group · '+g.mem.length+' members</span><p>'+esc(g.d)+'</p></div>'+
    '<button class="ci-sum" data-act="chSum">'+bublMark()+'<span><b>Summarise this chat</b><em>'+N(n)+' '+pl(n,'message')+' · open items, decisions, who said what</em></span>'+I('right',16)+'</button>'+
    '<div class="grp"><div class="lbl ci-lbl"><span>'+g.mem.length+' members</span>'+(adm?'<em class="ci-you">You’re an admin</em>':'')+'</div><div class="ci-ml">'+
    (adm?'<button class="ci-m ci-add" data-act="chAddMem"><span class="cav md ci-plus">'+I('plus',20)+'</span><span class="ci-mt"><b>Add members</b><span>From any team on tonight’s rota</span></span></button>':'')+
    mem.map(k=>{const p=STAFF[k],isA=g.adm.includes(k)||k==='roland'&&g.roles.includes('owner');return '<button class="ci-m" data-act="chMem" data-k="'+k+'">'+avHTML(p.n,{cls:'md'})+'<span class="ci-mt"><b>'+esc(p.n)+(k===me?' <em>You</em>':'')+'</b><span>'+esc(p.r)+'</span></span>'+(isA?'<i class="ci-adm">Admin</i>':'')+'</button>';}).join('')+'</div>'+
    (adm?'':'<p class="note">Only admins can add or remove people: '+esc(g.adm.map(k=>STAFF[k].n).join(', '))+'.</p>')+'</div>';}
function memSet(gid,k,on){const ov=UI.chatMem||(UI.chatMem={}),o=ov[gid]||(ov[gid]={add:[],rem:[]});
  if(on){o.rem=o.rem.filter(x=>x!==k);if(!o.add.includes(k))o.add.push(k);}else{o.add=o.add.filter(x=>x!==k);if(!o.rem.includes(k))o.rem.push(k);}}
function chRefreshInfo(){if(UI.device==='atlas'){Chat.repaint();return;}const o=Sheet.stack.find(x=>x.chi);if(o){o._b=null;Sheet.paint(o);}Chat.repaint();}
ON.chMem=el=>{const k=el.dataset.k,p=STAFF[k];if(!p)return;const g=Chat.open&&!Chat.isG()?chatG(Chat.open):null,me=meKey();if(k===me){toast('That’s you.');return;}
  const can=g&&!g.dm&&isAdm(g)&&g.mem.includes(k),grs=chatGroups().filter(x=>!x.dm&&x.mem.includes(k));
  Sheet.open({modal:true,static:true,title:esc(p.n),sub:esc(p.r),body:()=>'<div class="ci-top sm">'+avHTML(p.n,{cls:'lg'})+'<span>'+esc(p.r)+'</span></div>'+(grs.length?'<p class="note" style="text-align:center">In '+esc(grs.map(x=>x.n).join(', '))+'</p>':''),
    foot:()=>'<button class="btn pri full" data-act="chDM" data-k="'+k+'">'+I('msg',17)+'Message '+esc(p.n.split(' ')[0])+'</button>'+(can?'<button class="btn full bad-o" data-act="chRemMem" data-k="'+k+'">'+I('x',17)+'Remove from '+esc(g.n)+'</button>':'')});};
ON.chRemMem=el=>{const k=el.dataset.k,g=chatG(Chat.open);if(!g||!isAdm(g))return;memSet(g.id,k,false);Chat.sys(g.id,myName()+' removed '+STAFF[k].n);log('Chat member removed',STAFF[k].n+' · '+g.n);Sheet.close();chRefreshInfo();toast(esc(STAFF[k].n)+' removed from '+esc(g.n)+'.');};
ON.chAddMem=()=>{const g=chatG(Chat.open);if(!g||!isAdm(g))return;const sel=new Set();
  const body=()=>{const gg=chatG(g.id);return '<p class="note">Everyone you add sees the whole history of '+esc(gg.n)+'.</p>'+DEPTS.map(d=>{const ks=d[1].filter(k=>!gg.mem.includes(k));return ks.length?'<div class="grp"><div class="lbl">'+d[0]+'</div><div class="ci-ml">'+ks.map(k=>'<button class="ci-m pick'+(sel.has(k)?' on':'')+'" data-act="chPick" data-k="'+k+'">'+avHTML(STAFF[k].n,{cls:'md'})+'<span class="ci-mt"><b>'+esc(STAFF[k].n)+'</b><span>'+esc(STAFF[k].r)+'</span></span><i class="ci-ck">'+I('check',14)+'</i></button>').join('')+'</div></div>':'';}).join('')||'<p class="note">Everyone on tonight’s rota is already in this group.</p>';};
  const o=Sheet.open({tall:true,static:true,title:'Add to '+esc(g.n),sub:'Pick people. Their role shows under their name.',body,foot:()=>'<button class="btn pri full" data-act="chAddGo"'+(sel.size?'':' disabled')+'>'+I('plus',17)+(sel.size?'Add '+sel.size+' '+pl(sel.size,'person','people'):'Pick someone to add')+'</button>'});
  ON.chPick=el=>{const k=el.dataset.k;if(sel.has(k))sel.delete(k);else sel.add(k);o._b=null;o._f=null;Sheet.paint(o);};
  ON.chAddGo=()=>{if(!sel.size)return;const ks=[...sel];ks.forEach(k=>memSet(g.id,k,true));Chat.sys(g.id,myName()+' added '+ks.map(k=>STAFF[k].n).join(', '));log('Chat members added',ks.map(k=>STAFF[k].n).join(', ')+' · '+g.n);Sheet.close();chRefreshInfo();toast('Added to '+esc(g.n)+'.');};};
function startDM(k){const D=UI.chatDM||(UI.chatDM={}),a=D[UI.role]||(D[UI.role]=[]);if(!a.includes(k))a.push(k);Chat.mode='team';Chat.side=null;chatGoTo('dm:'+k);}
ON.chDM=el=>{Sheet.close(true);startDM(el.dataset.k);};
ON.chNew=()=>{const me=meKey();Sheet.open({tall:true,static:true,title:'New message',sub:'A direct message to anyone on tonight’s rota',
  body:()=>(canGuestChat()?'<button class="ci-m ci-add" data-act="chNewG"><span class="cav md ci-plus">'+I('send',18)+'</span><span class="ci-mt"><b>Message a guest</b><span>Search a guest, then send a message or a link</span></span></button>':'')+
    DEPTS.map(d=>{const ks=d[1].filter(k=>k!==me);return ks.length?'<div class="grp"><div class="lbl">'+d[0]+'</div><div class="ci-ml">'+ks.map(k=>'<button class="ci-m" data-act="chDM" data-k="'+k+'">'+avHTML(STAFF[k].n,{cls:'md'})+'<span class="ci-mt"><b>'+esc(STAFF[k].n)+'</b><span>'+esc(STAFF[k].r)+'</span></span></button>').join('')+'</div></div>':'';}).join('')});};

/* ---------- navigation ---------- */
function chatGoTo(gid,prefill){Chat.open=gid;Chat.lim=80;Chat.mode=Chat.isG(gid)?'guests':'team';if(Chat.side&&Chat.side!=='info')Chat.side=null;Sheet.close(true);
  if(UI.device==='atlas'){UI.atlas='chat';Atlas.render();}else if(UI.tab==='chat')Chat.render($('#view'));else setTab('chat');
  if(prefill){setTimeout(()=>{const i=$('#chQ');if(i){i.value=prefill;i.focus();}},60);}}
ON.chMode=el=>{Chat.mode=el.dataset.m;Chat.q='';if(UI.device==='atlas'){Chat.open=Chat.firstId();Chat.side=null;}Chat.render(Chat.host);};
ON.chF=el=>{Chat.f=el.dataset.f;Chat.paintRows(true);};
ON.chOpen=el=>{const id=el.dataset.g;Sheet.close(true);Chat.open=id;Chat.lim=80;Chat.att=[];if(!Chat.isG(id))Chat.mode='team';if(Chat.side==='sum')Chat.side=null;Chat.render(UI.device==='atlas'?Chat.host:$('#view'));};
ON.chBack=()=>{Chat.open=null;Chat.side=null;Chat.render($('#view'));};
ON.chInfo=()=>Chat.showInfo();
ON.chSum=()=>{if(UI.device!=='atlas'&&Sheet.stack.some(o=>o.chi)){Sheet.close();setTimeout(()=>Chat.showSum(),40);}else Chat.showSum();};
ON.chSideX=()=>{Chat.side=null;Chat.render(Chat.host);};
ON.chMore=()=>{Chat.lim=(Chat.lim||80)+120;const ms=$('#chMsgs');if(ms&&!Chat.isG()){const h0=ms.scrollHeight;ms.innerHTML=Chat.msgsHTML(chatG(Chat.open));ms._h=null;ms.scrollTop=ms.scrollHeight-h0;}};
ON.chSend=()=>{const i=$('#chQ');if(!i)return;const v=i.value;if(!v.trim())return;if(Chat.isG()){const th=gth(Chat.open.slice(2));if(th&&!chOn(th.ch)){toast(CH[th.ch].l+' is switched off in Integrations. Nothing was sent.');return;}}i.value='';Chat.send(v);};
ON.chQuick=el=>{Chat.send(el.dataset.q);};
ON.chTable=el=>{if(!canTables()){toast('Table details are for hosts and managers.');return;}openTable(el.dataset.id);};
ON.chNbGo=el=>{el.classList.remove('in');chatGoTo(el.dataset.g);};
ON.chUnatt=el=>{Chat.att.splice(+el.dataset.i,1);const a=$('#chAtt');if(a)a.innerHTML=Chat.attHTML();};
ON.chAttach=()=>{Sheet.open({title:'Attach',sub:canTables()?'A table or a guest. It shows as a link the team can tap.':'A guest. It shows as a link the team can tap.',tall:true,static:true,
  body:()=>'<label class="srch">'+I('search',18)+'<input id="chAq" placeholder="Table or guest name" autocomplete="off" autocapitalize="none"></label><div id="chAr" class="rows"></div>',
  onOpen:el=>{const inp=$('#chAq',el),res=$('#chAr',el);const paint=()=>{const v=inp.value.trim().toLowerCase();let h='';
      if(canTables()){const sel=UI.floor.sel&&W.T[UI.floor.sel],ts=v?W.tables.filter(T=>T.name.toLowerCase().includes(v)||T.id.toLowerCase()===v).slice(0,6):(sel?[sel]:[]);
        ts.forEach(T=>{h+=row('floor','',esc(T.name),esc(SECTIONS[T.sec].label)+(sel&&sel===T&&!v?' · selected on the floor':''),'',' data-act="chAttT" data-id="'+T.id+'"');});}
      if(v.length>=2){const seen={};searchAll(v,20).forEach(r=>{const gi=r.type==='seat'?r.s.g:r.type==='tix'?r.x.g:null;if(gi==null||gi<0||seen[gi])return;seen[gi]=1;h+=row('user','',esc(gName(gi)),esc(crmLabel(G(gi))),'',' data-act="chAttG" data-g="'+gi+'"');});}
      res.innerHTML=h||'<p class="note">Type a table or a guest name.</p>';};inp.addEventListener('input',paint);paint();setTimeout(()=>inp.focus(),80);}});};
function chatAttach(a){Sheet.close();Chat.att=(Chat.att||[]).concat([a]);const at=$('#chAtt');if(at)at.innerHTML=Chat.attHTML();const i=$('#chQ');if(i){i.value=(i.value?i.value.replace(/\s*$/,' '):'')+a.n+' ';i.focus();}}
ON.chAttT=el=>{const T=W.T[el.dataset.id];chatAttach({k:'t',v:T.id,n:T.name});};
ON.chAttG=el=>{const gi=+el.dataset.g;chatAttach({k:'g',v:gi,n:gName(gi)});};
ON.chTeam=el=>{const T=W.T[el.dataset.id];const gid=T.sec===ROLES.host.sec&&chatG('sec')?'sec':chatG('hosts')?'hosts':'all';chatGoTo(gid,T.name+' ');};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='chQ'){e.preventDefault();ON.chSend();}});
