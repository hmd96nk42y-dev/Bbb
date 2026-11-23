'use strict';
/* ============================================================
   92b · GUEST INBOX
   Guests write in on WhatsApp, Instagram and email. Each
   channel is an integration: switch one off and its chats go
   quiet. Each one keeps its own rules: WhatsApp replies are free
   for 24 hours after the guest's last message, then only approved
   templates; Instagram only replies, for 7 days; email any time. A guest's chat carries their booking and who looks after
   them, BUBL reply drafts, and every custom link sent from it,
   with its progress right in the thread: delivered, read, opened,
   done. One conversation per guest per channel.
   ============================================================ */
const CH={wa:{l:'WhatsApp',int:'wa'},ig:{l:'Instagram',int:'ig'},mail:{l:'Email',int:'mail'}};
const CHK=['wa','ig','mail'];
const chOn=k=>isOn(CH[k].int);
const canGuestChat=()=>UI.role==='owner'||UI.role==='host';
function chGlyph(k,s){s=s||12;const P={
  wa:'<path d="M12 3.3a8.7 8.7 0 0 0-7.5 13.1L3.3 20.7l4.4-1.1A8.7 8.7 0 1 0 12 3.3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.3 7.7c.3 0 .6.2.7.5l.6 1.5c.1.3 0 .6-.2.8l-.5.6a6 6 0 0 0 2.9 2.9l.6-.5c.2-.2.5-.3.8-.2l1.5.6c.3.1.5.4.5.7v.4c0 .9-.8 1.6-1.7 1.5a7.3 7.3 0 0 1-6.6-6.6c-.1-.9.6-1.7 1.4-1.7z" fill="currentColor"/>',
  ig:'<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.3" fill="currentColor"/>',
  sms:'<path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-10L5.5 21v-3.5H4A1.5 1.5 0 0 1 2.5 16V7A1.5 1.5 0 0 1 4 5.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="11.5" r="1.3" fill="currentColor"/><circle cx="12" cy="11.5" r="1.3" fill="currentColor"/><circle cx="16" cy="11.5" r="1.3" fill="currentColor"/>',
  mail:'<rect x="3" y="5.5" width="18" height="13" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.6 7.2 12 13l8.4-5.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'};
  return '<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" aria-hidden="true">'+(P[k]||P.sms)+'</svg>';}
const asc=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z]/g,'').toLowerCase();
const gIG=g=>g.ig||('@'+asc(g.n.split(' ')[0])+'.'+asc(g.n.split(' ').slice(1).join('')));
const gEM=g=>g.em||(asc(g.n.split(' ')[0])+'.'+asc(g.n.split(' ').slice(-1)[0])+'@'+['gmail.com','icloud.com','outlook.com','hotmail.com'][h32(g.n)%4]);
function gContact(gi,ch){const g=G(gi);return ch==='ig'?gIG(g):ch==='mail'?gEM(g):(g.ph||'No number on file');}
const DOWN={Sun:'Sunday',Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday'};
function nextEv(){const i=EVENTS.findIndex(e=>e.id===W.ev.id);for(let j=i+1;j<EVENTS.length;j++)if(EVENTS[j].announced!==false)return EVENTS[j];return null;}
const lowMin=()=>Math.min(...TIER_ORDER.map(k=>TIERS[k].min).filter(Boolean));
const bsMin=()=>Math.min(...TIER_ORDER.filter(k=>TIERS[k].grp==='bs').map(k=>TIERS[k].min).filter(Boolean));
const fWait=ms=>{const m=Math.max(0,Math.round(ms/MIN));return m<1?'just now':m<60?m+' min':m<1440?Math.floor(m/60)+'h'+(m%60?' '+m%60+'m':''):Math.floor(m/1440)+'d';};
const waRec=id=>(W.wa||[]).find(x=>x.id===id);
function gc(th,at){at=at==null?now():at;const gs=G(th.g),b=th.b?bk(th.b):null,T=b?W.T[tableAt(b,at)]:null,ne=nextEv(),f=gs.n.split(' ')[0];
  return {f,tn:T?T.name:'your table',party:b?b.party:6,min:b?aedK(b.min):'',dep:b?aed(Math.round(b.min*(b.depPct||.3))):'',depPaid:!!(b&&b.depAt&&b.depAt<=at),
    dayN:DOWN[fD(W.D).split(' ')[0]]||fD(W.D),doors:W.ev.doorsT,arr:b?fT(b.arriveBy):fT(W.D+2*HOUR),short:W.ev.short,head:W.ev.head,hostF:b&&b.host?b.host.split(' ')[0]:'Your host',
    n2:th.n2||'Sara',rel:th.rel||'wife',minLo:aedK(lowMin()),minBS:aedK(bsMin()),ne:ne?ne.short:'our next night',neDay:ne?fD(ne.doors):'soon'};}

/* ---------- what guests ask, and how the team answers ---------- */
const GI={
  add:{w:c=>'Wants to add 2 guests to '+c.tn,s:'Adding guests to our table',them:c=>'Hi! We’re '+c.party+' at '+c.tn+' on '+c.dayN+'. Could I add 2 more friends?',us:c=>'Of course, '+c.f+'. I’ve added 2 to '+c.tn+' and the minimum stays at '+c.min+'. Here’s the link for them to claim their spots:',link:'claim',back:['Perfect, sending it to them now 🙏','Amazing, thank you!']},
  bday:{w:c=>'Birthday at '+c.tn,s:'A birthday at our table',them:c=>'Hey, it’s my '+c.rel+'’s birthday on '+c.dayN+' 🎂 Can you do something special at the table?',us:c=>'Lovely! We’ll bring a cake and a sparkler show to '+c.tn+'. What name should go on the card?',back:c=>[c.n2+'! Thank you so much 🥹']},
  dress:{w:()=>'Asking about the dress code',s:'Dress code',them:c=>'What’s the dress code for '+c.short+'?',us:c=>'Hi '+c.f+'. Smart and stylish: no sportswear, shorts or flip-flops. Bring the ID that matches your booking name.',back:['Great, thanks','Perfect 👌']},
  park:{w:()=>'Asking about parking',s:'Parking',them:()=>'Is there parking at Dubai Harbour or should we take a taxi?',us:c=>'Hi '+c.f+', there’s valet at the Dubai Harbour entrance, complimentary for table guests. Come in through Gate 3 for '+c.tn+'.',back:['👍','Thank you!']},
  dep:{w:c=>c.depPaid?'Checking their deposit went through':'Asking for the deposit link again',s:'Deposit',them:c=>c.depPaid?'I paid the deposit but haven’t had a confirmation yet. Can you check?':'Hi, I lost the payment link for the deposit. Can you send it again?',
    us:c=>c.depPaid?'Thanks '+c.f+', I can see '+c.dep+' paid on '+c.tn+'. Your confirmation is on its way now.':'Of course, '+c.f+'. The '+c.dep+' deposit for '+c.tn+' is on your invitation, here it is again:',link:c=>c.depPaid?null:'deposit',back:['Got it, thanks!','Paid ✅']},
  pre:{w:()=>'Wants to pre-order',s:'Pre-order',them:()=>'Can we pre-order a Dom Pérignon magnum for when we arrive?',us:c=>'Yes! Pre-orders save 10% and count toward your minimum. Here’s your pre-order link for '+c.tn+':',link:'preorder',back:['Done ✅','Ordered, thank you!']},
  time:{w:()=>'Asking about arrival and set times',s:'Arrival time',them:c=>'What time should we get there? And when does '+c.head+' start?',us:c=>'Doors open at '+c.doors+'. Please be at Gate 3 by '+c.arr+' for '+c.tn+'. '+c.head+' plays the closing set.',back:['Perfect','See you then 🙌']},
  move:{w:()=>'Wants a table closer to the stage',s:'Upgrade to Backstage?',them:()=>'Any chance of moving closer to the stage? Happy to spend more.',us:c=>'Let me check for you, '+c.f+'. Backstage starts at '+c.minBS+' minimum. Shall I ask the manager to hold one?',back:['Yes please!']},
  split:{w:()=>'Wants to split the bill',s:'Splitting the bill',them:()=>'Can we split the bill per person on the night?',us:()=>'Yes, your host can split the bill at the table on the night.',back:['🙏']},
  age:{w:()=>'Asking about the age limit',s:'Age policy',them:()=>'Can my 18 year old come with us?',us:c=>'Sorry '+c.f+', Ushuaïa is 21 and over and IDs are checked at the door.',back:['Ok understood, thanks']},
  transfer:{w:()=>'Wants to transfer a ticket',s:'Ticket transfer',them:()=>'I can’t make it anymore 😞 Can I give my ticket to a friend?',us:()=>'Yes, open your ticket link and tap Transfer. Your friend gets their own QR code.',back:['Thank you!']},
  upg:{w:()=>'Has tickets, wants a table',s:'A table for our group',them:c=>'We have tickets for '+c.short+' but would love a table. Anything left?',us:c=>'We do, '+c.f+'! Here are the tables still free. Pick one and it’s held for two hours:',link:'tables',back:['Booked 🙌','Picked one, thanks!']},
  leadP:{w:()=>'New enquiry: a table for 6',s:'Table for 6',them:c=>'Hi 👋 How much is a table for 6 for '+c.short+'?',us:c=>'Hi '+c.f+'! Tables for 6 start at '+c.minLo+' minimum spend, all credited on drinks. Here are the ones still free:',link:'tables',back:['Booked 🙌','Thanks, checking with my friends']},
  leadB:{w:()=>'New enquiry: Backstage',s:'Backstage',them:c=>'Do you still have Backstage tables for '+c.short+'? 🔥',us:c=>'We have a few left, '+c.f+'. Backstage starts at '+c.minBS+' and goes to the manager for approval. Shall I put your request in?',back:['Yes please, 8 of us']},
  leadC:{w:()=>'Corporate group of 20',s:'Corporate group',them:c=>'Hello, we’re looking to host around 20 clients at '+c.short+'. Do you have a package for groups?',us:c=>'Thank you '+c.f+'. For 20 we’d suggest two connected tables in VIP Right with bottles and a canapé menu. I’ll send a proposal today.',back:['Great, looking forward to it']},
  leadT:{w:()=>'Looking for tickets',s:'Tickets',them:c=>'Is '+c.short+' sold out? Can’t find tickets 😩',us:c=>'Not yet, '+c.f+'! Second wave tickets are still on sale. Here’s the link:',link:'custom',back:['Got them, thanks!']},
  late:{w:()=>'Running late',them:()=>'Running 20 min late, please hold our table 🙏',us:c=>'No problem '+c.f+', '+c.tn+' is held for you. Come through Gate 3.',back:['🙏🙏']},
  gate:{w:()=>'At the entrance, looking for their table',them:()=>'We’re at the entrance, where do we go for tables?',us:c=>'Welcome! Gate 3, on the right as you come in. '+c.hostF+' will meet you there.',back:['Found it 👍']},
  friend:{w:()=>'Friend stuck at Gate 1',them:c=>'My friend '+c.n2+' is stuck at Gate 1, the name on her ticket doesn’t match her ID',us:c=>'Thanks '+c.f+', I’ve told the door team. Ask her to wait at the Gate 1 desk, someone is coming now.',back:['She’s in, thank you!!'],tell:'door'},
  ice:{w:c=>'Ice and water at '+c.tn,them:c=>'Hi! Can we get more ice and some water at '+c.tn+'?',us:()=>'On its way 🙌',back:['Thank you!'],tell:'sec'},
  spark:{w:()=>'Sparklers for a birthday',them:c=>'It’s '+c.n2+'’s birthday! Can you bring sparklers now? 🎆',us:c=>'Yes! Sparklers on their way to '+c.tn+' in five minutes.',back:['You’re the best 🥳'],tell:'bar'},
  more:{w:()=>'Wants another bottle',them:()=>'Can we get another bottle of Don Julio 1942?',us:c=>'Of course! Coming to '+c.tn+' now.',back:['🔥🔥'],tell:'sec'},
  bill:{w:()=>'Wants the bill',them:()=>'Can we get the bill please?',us:c=>c.hostF+' is coming with the terminal now.',back:['Thanks!'],tell:'sec'},
  thanks:{w:()=>'Thank-you, asking about the next event',s:'Last night',them:()=>'Best night ever!! When’s the next one? 🔥',us:c=>'Thank you '+c.f+'! Next is '+c.ne+' on '+c.neDay+'. You get first pick, here’s your link:',link:'thanks',back:['Booked!! 🙌']},
  lost:{w:()=>'Lost a phone',s:'Lost phone',them:c=>'Hi, I think I left my phone near '+c.tn+' last night. Black iPhone, no case.',us:c=>'Sorry to hear that, '+c.f+'. Lost and found has three phones from last night. What’s on the lock screen?',back:['A beach at sunset, thank you so much']},
  charge:{w:()=>'Thinks they were charged twice',s:'Charged twice?',them:()=>'I think I was charged twice for our table. Can you check?',us:c=>'Thanks '+c.f+'. There’s one payment for '+c.tn+' and a pre-authorisation that drops off in 3 to 5 days. Nothing more to pay.',back:['Ah ok, thanks for checking']},
  invoice:{w:()=>'Needs a VAT invoice',s:'VAT invoice',them:()=>'Could you send a VAT invoice for our table, in the company name?',us:()=>'Of course. Which company name and TRN should go on it?',back:['Sending them now']},
  photo:{w:()=>'Asking for photos',s:'Photos',them:c=>'Do you have photos from last night? We were at '+c.tn+' 📸',us:()=>'Yes! The gallery goes up today at 12:00. I’ll send you the link.',back:['Can’t wait!!']}
};
const glink=(gi,c)=>gi?(typeof gi.link==='function'?gi.link(c):gi.link||null):null;
const gback=(gi,c)=>typeof gi.back==='function'?gi.back(c):gi.back||['Thank you!'];
const LDONE={invite:'Opened the invitation',claim:'Claimed a spot',deposit:'Paid the deposit',preorder:'Placed the pre-order',arrival:'Opened arrival details',ticket:'Saved the ticket',thanks:'Took first pick',custom:'Opened the link',tables:'Picked a table'};
/* who looks after this guest: their promoter's team, their host, the manager, or reservations */
function asgOf(gi,b){const tx=b?null:W.tix.find(x=>x.g===gi)||null,r=respFor({b,tx}),p=r.p;let per,via='';
  if(p.team)per=STAFF.lina;else if(p.key==='mgr')per=STAFF.roland;else if(p.key.indexOf('host:')===0)per=personOf(p.name);else{per=STAFF.lina;via=p.name;}
  return {p:per,why:r.why,via};}

/* ---------- the inbox, seeded from tonight's bookings ---------- */
function gchSeed(){if(W._gch)return W._gch;const R=rng(h32(W.ev.id+':inbox')),D=W.D,C=W.C,out=[],hs=ROLES.host.sec,L=W.wa||(W.wa=[]);let n=0;
  const anchor=clamp(Date.now(),W.ON+5*DAY,D-3*HOUR);
  const pickCh=()=>{const r=R();return r<.7?'wa':r<.88?'ig':'mail';};
  const mk=o=>{let th=out.find(x=>x.g===o.g&&x.ch===o.ch);if(th){if(o.b&&!th.b){th.b=o.b;const a=asgOf(th.g,bk(o.b));th.as=a.p;th.why=a.why;th.via=a.via;th.sec=bk(o.b).sec;}return th;}
    const b=o.b?bk(o.b):null,a=asgOf(o.g,b);th=Object.assign({id:'q'+(n++),msgs:[],doneAt:0,n2:R.pick(FIRST),rel:R.pick(['wife','husband','best friend','sister','brother','girlfriend']),as:a.p,why:a.why,via:a.via,sec:b?b.sec:null},o);
    if(th.ch==='mail')th.subj=(GI[th.k].s||'Booking')+' · '+W.ev.short;out.push(th);return th;};
  const conv=(th,at,o,k)=>{o=o||{};k=k||th.k;const gi=GI[k],c=gc(th,at);th.msgs.push({at:Math.round(at),who:'them',m:gi.them(c),k});if(o.reply==null)return th;
    const ra=Math.round(at+o.reply),lt=glink(gi,c),rd=Math.round(ra+(2+R()*38)*MIN);let end=ra,rec=null;
    const um={at:ra,who:'us',by:o.by||th.as,m:gi.us(c),dAt:ra+20000,rAt:rd};th.msgs.push(um);
    if(lt&&th.g>=0){const b=th.b?bk(th.b):null,from=respFor({b,tx:b?null:W.tix.find(x=>x.g===th.g)||null}).p,url=linkFor(lt,th.g);
      rec={id:'S'+th.id+'_'+th.msgs.length,gi:th.g,b,type:lt,from,url,text:um.m+'\n'+url,at:ra,via:'api',ch:th.ch,by:um.by.n,seed:1,sAt:ra+800,dAt:ra+20000,rAt:rd};
      if(R()<.86)rec.oAt=Math.round(rd+(1+R()*8)*MIN);if(rec.oAt&&lt!=='custom'&&R()<.72)rec.cAt=Math.round(rec.oAt+(2+R()*45)*MIN);L.push(rec);um.link=rec.id;end=rec.cAt||rec.oAt||rd;}
    if(o.back!==false&&(rec?(rec.cAt||R()<.35):R()<.75)){const bt=Math.round(Math.max(end,rd)+(1+R()*14)*MIN);th.msgs.push({at:bt,who:'them',m:R.pick(gback(gi,c)),k,ack:1});end=bt;}
    if(o.done)th.doneAt=Math.round(end+(1+R()*20)*MIN);return th;};
  const say=(g,b,ch,k,at,o)=>{const th=mk({g,b:b?b.id:null,ch,k});th.k=k;return conv(th,at,o,k);};
  const firstAr=b=>{let a=Infinity;b.seats.forEach(x=>{if(x.ar&&x.ar<a)a=x.ar;});return a<Infinity?a:0;};
  /* before the night: questions from people who booked */
  W.bookings.filter(b=>!b.walk&&!b.cancelAt&&!b.comp).forEach(b=>{if(!R.chance(b.sec===hs?.5:.1))return;
    const ks=['add','bday','dress','park','time','split','age'];if(b.depPct)ks.push('dep','dep');if(!b.pre.length)ks.push('pre');if(b.grp!=='bs')ks.push('move');
    const lo=b.at+HOUR,hi=D-5*HOUR;if(hi<=lo)return;say(b.booker,b,pickCh(),R.pick(ks),lo+Math.pow(R(),.55)*(hi-lo),{reply:(5+Math.pow(R(),2)*230)*MIN,done:R.chance(.55)});});
  /* ticket holders */
  const tx=W.tix.filter(x=>x.g>=0&&x.at<D-2*DAY);for(let i=0;i<6&&tx.length;i++){const x=tx[Math.floor(R()*tx.length)],lo=x.at+HOUR,hi=D-6*HOUR;if(hi<=lo)continue;
    say(x.g,null,R.chance(.6)?'wa':'mail',R.chance(.5)?'transfer':'upg',lo+R()*(hi-lo),{reply:(8+R()*180)*MIN,done:R.chance(.5)});}
  /* new enquiries from people not on file yet */
  const lead=(k,ch,at,o)=>{const nm=R.pick(FIRST)+' '+R.pick(LAST),ph=ch==='wa'||ch==='sms'||R.chance(.5)?'+971 5'+R.int(0,8)+R.int(0,9)+' '+R.int(100,999)+' '+R.int(1000,9999):'';
    const gst={i:W.guests.length,n:nm,ph,crm:0,v:0,res:true,idv:0,idvAt:0,age:null,mk:true,pc:false,ltv:0,prefs:null,notes:null,lead:1};if(ch==='ig')gst.ig=gIG(gst);if(ch==='mail')gst.em=gEM(gst);W.guests.push(gst);
    const th=mk({g:gst.i,b:null,ch,k,lead:1});return conv(th,at,o,k);};
  for(let i=0;i<7;i++){const k=R.pick(['leadP','leadP','leadB','leadT','leadC']),ch=k==='leadC'?'mail':R.chance(.7)?'ig':'wa';lead(k,ch,W.ON+2*DAY+R()*(D-W.ON-3*DAY),{reply:(10+R()*200)*MIN,done:R.chance(.5)});}
  /* right now: a few still waiting for someone */
  const vb=W.bookings.filter(b=>!b.walk&&!b.cancelAt&&b.at<anchor-HOUR),pickB=f=>{const a=vb.filter(f);return a.length?a[Math.floor(R()*a.length)]:null;};
  const b1=pickB(b=>b.sec===hs&&b.party>=4)||pickB(b=>b.party>=4);if(b1)say(b1.booker,b1,'wa','add',anchor-4*MIN,{reply:62*MIN});
  lead('leadP','ig',anchor-13*MIN,{reply:80*MIN});
  const b2=pickB(b=>b!==b1&&(b.vip||G(b.booker).crm===2)&&b.grp!=='bs');if(b2)say(b2.booker,b2,'wa','move',anchor-27*MIN,{reply:105*MIN,by:STAFF.roland});
  const b3=pickB(b=>b!==b1&&b!==b2&&b.depPct&&!(b.depAt&&b.depAt<=anchor));if(b3)say(b3.booker,b3,'wa','dep',anchor-49*MIN,{reply:120*MIN});
  lead('leadC','mail',anchor-96*MIN,{reply:190*MIN});
  /* the night */
  const arr=W.bookings.filter(b=>!b.walk&&firstAr(b)),pickA=f=>{const a=arr.filter(f);return a.length?a[Math.floor(R()*a.length)]:null;};
  arr.forEach(b=>{if(!R.chance(b.sec===hs?.6:.06))return;const f=firstAr(b),r=R();let k,at;
    if(r<.18&&f>b.arriveBy-10*MIN){k='late';at=b.arriveBy-25*MIN;}else if(r<.32){k='gate';at=f-4*MIN;}else if(r<.42){k='friend';at=f+(10+R()*40)*MIN;}
    else{k=R.pick(['ice','spark','more','bill','ice','more']);at=k==='bill'?C-(25+R()*30)*MIN:f+(30+R()*Math.max(10,(C-f)/MIN-60))*MIN;}
    if(at<D-HOUR||at>C)return;say(b.booker,b,'wa',k,at,{reply:(1+R()*6)*MIN,done:R.chance(.6)});});
  [[128,'more',32],[168,'ice',28]].forEach(([m,k,rp])=>{const t0=D+m*MIN,b=pickA(x=>x.sec===hs&&firstAr(x)<t0-20*MIN)||pickA(x=>firstAr(x)<t0-20*MIN);if(b)say(b.booker,b,'wa',k,t0,{reply:rp*MIN,done:true});});
  /* after close: thank-yous, lost property, billing */
  [['thanks','ig',40,null],['photo','ig',70,30],['thanks','wa',95,null],['lost','mail',130,40],['charge','mail',250,null],['invoice','mail',330,null]].forEach(([k,ch,m,rep])=>{const b=pickA(x=>!x.comp);if(!b)return;
    say(b.booker,b,ch,k,C+m*MIN,rep!=null?{reply:rep*MIN,by:STAFF.hana,back:R.chance(.6)}:{});});
  out.forEach(th=>th.msgs.sort((a,b)=>a.at-b.at));W._gch=out;return out;}

/* ---------- what each channel allows right now ----------
   WhatsApp: free replies for 24 hours after the guest's last message,
   then only approved templates. Instagram: a person can reply for 7 days
   after the guest's last message, and can never write first. Email: any time. */
function chWin(gi,ch,t){t=t==null?now():t;if(ch==='mail')return {open:true,mail:1};let lt=0;
  gchSeed().forEach(th=>{if(th.g!==gi||th.ch!==ch)return;for(const m of th.msgs){if(m.at>t)break;if(m.who==='them'&&m.at>lt)lt=m.at;}});
  const span=ch==='ig'?7*DAY:DAY;return {open:!!lt&&t-lt<span,until:lt?lt+span:0,last:lt,never:!lt};}
const gWin=(th,t)=>chWin(th.g,th.ch,t);
function gPh(th,t){const c=CH[th.ch];if(!chOn(th.ch))return c.l+' is switched off';const w=gWin(th,t);if(w.open)return 'Reply on '+c.l;
  return th.ch==='wa'?'Templates only after 24h':'They need to message first';}

/* ---------- reading the inbox at any point on the clock ---------- */
const gth=id=>gchSeed().find(x=>x.id===id);
function gVis(th){if(!isOn(CH[th.ch].int))return false;if(UI.role==='owner')return true;if(UI.role!=='host')return false;return th.sec===ROLES.host.sec||(th.as&&th.as.n===ROLES.host.who);}
const gLast=(th,t)=>{const i=uptoAt(th.msgs,t);return i?th.msgs[i-1]:null;};
const gMsgs=(th,t)=>th.msgs.slice(0,uptoAt(th.msgs,t));
function gThreads(t){return gchSeed().filter(th=>th.msgs.length&&th.msgs[0].at<=t&&gVis(th)).sort((a,b)=>gLast(b,t).at-gLast(a,t).at);}
function gK(th,t){const ms=gMsgs(th,t);for(let i=ms.length-1;i>=0;i--)if(ms[i].who==='them'&&ms[i].k)return ms[i].k;return th.k;}
function gDone(th,t){const l=gLast(th,t);return !!(th.doneAt&&th.doneAt<=t&&l&&l.at<=th.doneAt);}
function gNeeds(th,t){const l=gLast(th,t);return !!l&&l.who==='them'&&!l.ack&&!gDone(th,t);}
function gWait(th,t){const ms=gMsgs(th,t);let i=ms.length-1;if(i<0||ms[i].who!=='them'||ms[i].ack)return 0;while(i>0&&ms[i-1].who==='them'&&!ms[i-1].ack)i--;return t-ms[i].at;}
function gReadPtr(th,t){let p=(UI.gRead||{})[th.id]||0;for(const m of th.msgs){if(m.at>t)break;if(m.who==='us'&&m.at>p)p=m.at;}if(th.doneAt&&th.doneAt<=t&&th.doneAt>p)p=th.doneAt;return p;}
function gUnread(th,t){const p=gReadPtr(th,t);let c=0;for(const m of th.msgs){if(m.at>t)break;if(m.who==='them'&&m.at>p&&!(m.ack&&t-m.at>3*HOUR))c++;}return c;}
function gUnreadAll(t){if(!canGuestChat())return 0;let c=0;gThreads(t).forEach(th=>{if(!(Chat.open==='G:'+th.id&&Chat.visible()))c+=gUnread(th,t);});return c;}
function gMarkRead(th,t){if(!th)return;const r=UI.gRead||(UI.gRead={});r[th.id]=Math.max(r[th.id]||0,t);}
function gLinks(th,t){return gMsgs(th,t).filter(m=>m.link).map(m=>waRec(m.link)).filter(Boolean);}
function gSearch(th,t){const g=G(th.g),b=th.b&&bk(th.b);return (g.n+' '+(b?W.T[tableAt(b,t)].name:'')+' '+CH[th.ch].l+' '+(th.subj||'')+' '+gMsgs(th,t).map(m=>m.m||'').join(' ')).toLowerCase();}
function gPush(th,m){th.msgs.splice(uptoAt(th.msgs,m.at),0,m);}
function gThreadFor(gi,ch,create){const mine=gchSeed().filter(x=>x.g===gi&&(!ch||x.ch===ch));let th=mine.sort((a,b)=>(b.msgs.length?b.msgs[b.msgs.length-1].at:0)-(a.msgs.length?a.msgs[a.msgs.length-1].at:0))[0]||null;
  if(!th&&create){const r=guestRecs(gi,now()),b=r.seats.length?r.seats[0].b:null,a=asgOf(gi,b);ch=ch||'wa';th={id:'n'+gi+ch,g:gi,ch,b:b?b.id:null,k:'',msgs:[],doneAt:0,as:a.p,why:a.why,via:a.via,sec:b?b.sec:null};if(ch==='mail')th.subj='Your booking · '+W.ev.short;gchSeed().push(th);}return th;}

/* ---------- the list row ---------- */
function gTag(th,t){const b=th.b&&bk(th.b);return (b?W.T[tableAt(b,t)].name+' · '+b.party+' guests':th.lead?'New enquiry':'Ticket holder')+' · '+th.as.n.split(' ')[0];}
function gRowHTML(th,t,on){const gs=G(th.g),l=gLast(th,t),u=gUnread(th,t),nd=gNeeds(th,t),dn=gDone(th,t),me=myName(),ty=Chat.typing['G:'+th.id];let pv;
  if(ty&&Date.now()<ty.until)pv='<em class="ch-ty">typing…</em>';else if(l.who==='them')pv=esc(l.m);
  else{const lk=l.link&&waRec(l.link);pv=(l.by&&l.by.n===me?'You: ':l.by?esc(l.by.n.split(' ')[0])+': ':'')+(lk?I('link',12)+' '+esc(LT[lk.type].l):esc(l.m));}
  const w=nd?gWait(th,t):0;
  return '<button class="ch-r g'+(on?' on':'')+(u?' unr':'')+'" data-act="chOpen" data-g="G:'+th.id+'">'+avHTML(gs.n,{ch:th.ch})+
    '<span class="ch-rt"><span class="ch-r1"><b>'+(gs.crm===2?'<i class="ch-vip">'+I('star',11)+'</i>':'')+esc(gs.n)+'</b><em class="n'+(nd&&w>10*MIN?' warn':'')+'">'+(nd&&w>=MIN?fWait(w):rowTime(l.at,t))+'</em></span>'+
    '<span class="ch-r2"><span class="pv">'+(th.ch==='mail'&&th.subj?'<b class="sj">'+esc(th.subj.split(' · ')[0])+'</b> · ':'')+pv+'</span>'+(u?'<i class="ch-ub n">'+u+'</i>':dn?'<i class="ch-dn" aria-label="Done">'+I('check',12)+'</i>':nd?'<i class="ch-nd" aria-label="Needs a reply"></i>':'')+'</span>'+
    '<span class="ch-r3">'+esc(gTag(th,t))+'</span></span></button>';}

/* ---------- the conversation ---------- */
function gSubHTML(th){const ty=Chat.typing['G:'+th.id];if(ty&&Date.now()<ty.until)return '<em class="ch-ty">typing…</em>';return chGlyph(th.ch,11)+' '+esc(CH[th.ch].l+' · '+gContact(th.g,th.ch));}
function gThreadHTML(th){if(!th)return '';const t=now(),gs=G(th.g);gMarkRead(th,t);const on=chOn(th.ch);
  return '<div class="ch-thd">'+(UI.device!=='atlas'?'<button class="ch-bk" data-act="chBack" aria-label="All chats">'+backI()+'</button>':'')+
    '<button class="ch-hd" data-act="chInfo" aria-label="Guest details">'+avHTML(gs.n,{cls:'md',ch:th.ch,chz:10})+'<span class="ch-tt"><b>'+esc(gs.n)+'</b><span id="chSub">'+gSubHTML(th)+'</span></span></button>'+
    '<button class="ch-sumb" data-act="chSum" aria-label="Summarise this chat">'+bublMark()+'<span>Summary</span></button></div>'+
    '<div id="chCtx">'+gCtxHTML(th,t)+'</div>'+
    '<div class="ch-msgs" id="chMsgs">'+gMsgsHTML(th)+'</div>'+
    '<div class="ch-comp"><div id="chDr">'+gDraftsHTML(th,t)+'</div>'+
    '<div class="ch-in"><button class="ch-plus" data-act="gLink" aria-label="Send a custom link">'+I('link',19)+'</button><input id="chQ" type="text" placeholder="'+esc(gPh(th,t))+'" enterkeyhint="send" autocomplete="off" aria-label="Reply"'+(on&&gWin(th,t).open?'':' disabled')+'><button class="ch-send" data-act="chSend" aria-label="Send">'+I('send',19)+'</button></div></div>';}
function gCtxHTML(th,t){const gs=G(th.g),b=th.b&&bk(th.b),dn=gDone(th,t);let l2;
  if(b){const m=money(b,t),sc=seatCounts(b,t),T=W.T[tableAt(b,t)],ph=phase();l2=T.name+' · '+b.party+' guests · '+aedK(b.min)+' min'+(ph==='pre'?(m.depDue?' · deposit due':m.dep?' · deposit paid':''):ph==='live'?' · '+sc.present+' in':'');}
  else l2=th.lead?'New enquiry · not booked yet':'Ticket holder · no table';
  return '<div class="ch-ctx"><button class="ch-ctxm" data-act="chInfo"><span class="c1">'+(gs.crm===2?I('star',12):'')+esc(crmLabel(gs))+(gs.v?' · '+gs.v+(gs.v===1?' visit':' visits'):'')+' · '+esc(th.as.n)+'</span><span class="c2">'+esc(l2)+'</span></button>'+
    (b&&canTables()?'<button class="ch-cb" data-act="chTable" data-id="'+tableAt(b,t)+'" aria-label="Open the table">'+I('floor',17)+'</button>':'')+
    '<button class="ch-cb'+(dn?' on':'')+'" data-act="gDone" aria-label="'+(dn?'Reopen':'Mark done')+'">'+I('check',17)+'</button></div>';}
function gBanner(th,t){const c=CH[th.ch];if(!chOn(th.ch))return '<div class="ch-sys bad"><span>'+chGlyph(th.ch,12)+' '+c.l+' is switched off in Integrations. Nothing is sent or received.</span></div>';
  let s,cl='';const w=gWin(th,t),un=x=>(x-t>12*HOUR?dayLabel(x,t)+', ':'')+fT(x);
  if(th.ch==='wa'){s=w.never?'WhatsApp Business · they haven’t written yet, so messages go as approved templates':w.open?'WhatsApp Business · free replies until '+un(w.until):'WhatsApp Business · 24-hour window closed, only approved templates can go';if(!w.open)cl=' warn';}
  else if(th.ch==='ig'){s=w.open?'Instagram · @ushuaiadubaiharbour · you can reply until '+un(w.until):'Instagram · reply window closed. They need to message again, or reach them on WhatsApp';if(!w.open)cl=' warn';}
  else s='Email · '+gContact(th.g,'mail')+' to reservations@';
  return '<div class="ch-sys ch-chn'+cl+'"><span>'+chGlyph(th.ch,12)+' '+esc(s)+'</span></div>';}
function gTicks(ch,o,t){if(o.fail)return '<i class="tk bad">!</i>';if(ch==='wa')return o.rAt&&o.rAt<=t?'<i class="tk rd">✓✓</i>':o.dAt&&o.dAt<=t?'<i class="tk">✓✓</i>':'<i class="tk">✓</i>';
  if(ch==='ig')return o.rAt&&o.rAt<=t?'<em class="tkw">Seen</em>':'';return '<em class="tkw">Sent</em>';}
function gTickSig(th,t){return gMsgs(th,t).filter(m=>m.who==='us').map(m=>{const o=(m.link&&waRec(m.link))||m;return (o.dAt&&o.dAt<=t?1:0)+(o.rAt&&o.rAt<=t?2:0);}).join('');}
function lkSteps(m){const ch=m.ch||'wa',a=[];if(m.via==='api'){if(ch==='wa')a.push(['Delivered',m.dAt],['Read',m.rAt]);else if(ch==='sms')a.push(['Delivered',m.dAt]);else if(ch==='ig')a.push(['Seen',m.rAt]);else a.push(['Sent',m.sAt]);}
  else a.push([m.via==='copy'?'Copied':m.via==='share'?'Shared':'Sent from WhatsApp',m.at]);
  a.push(['Opened',m.oAt]);if(m.type!=='custom')a.push([m.type==='claim'&&m.b&&m.b.booker===m.gi?'Shared with the table':LDONE[m.type],m.cAt]);return a;}
function lkCardHTML(m,t){const st=lkSteps(m);
  return '<div class="lkc"><span class="lkth">'+waThumb()+'</span><span class="lkt"><b>'+esc(LT[m.type].l)+(m.type==='custom'?'':' · '+esc(W.ev.short))+'</b><span>From '+esc(m.from.name)+'</span><em>'+esc(String(m.url).replace(/^https?:\/\//,''))+'</em></span></div>'+
    '<div class="lkp">'+st.map(s=>{const on=s[1]&&s[1]<=t;return '<span class="'+(on?'on':'')+'"><i></i>'+esc(s[0])+(on?' <em class="n">'+fT(s[1])+'</em>':'')+'</span>';}).join('')+'</div>'+
    (LT[m.type].pv?'<button class="lkpv" data-act="waPv" data-id="'+m.id+'">'+I('star',13)+'Preview what they see</button>':'');}
function gMsgsHTML(th){if(!th)return '';const t=now(),ms=gMsgs(th,t),me=myName();let h=gBanner(th,t),pd='';
  if(!ms.length)h+='<div class="ch-hello">'+avHTML(G(th.g).n,{cls:'lg',ch:th.ch,chz:13})+'<b>'+esc(G(th.g).n)+'</b><span>'+esc(gContact(th.g,th.ch))+'</span><p>Write a message, or tap the link button to send a custom link.</p></div>';
  ms.forEach((m,i)=>{const d=fD(m.at);if(d!==pd){h+='<div class="ch-day"><span>'+dayLabel(m.at,t)+'</span></div>';pd=d;}
    const nx=ms[i+1],last=!nx||nx.who!==m.who||fD(nx.at)!==d;
    if(m.who==='them'){h+='<div class="gm them'+(last?' last':'')+'"><div class="gb">'+(i===0&&th.subj&&th.ch==='mail'?'<b class="gsj">'+esc(th.subj)+'</b>':'')+'<p>'+esc(m.m)+'<span class="ch-meta"><span class="n">'+fT(m.at)+'</span></span></p></div></div>';return;}
    const lk=m.link&&waRec(m.link);
    h+='<div class="gm us'+(last?' last':'')+'"><div class="gb'+(lk?' lk':'')+'">'+(m.m?'<p>'+esc(m.m)+'</p>':'')+(lk?lkCardHTML(lk,t):'')+'<span class="gft">'+(m.by?'<span class="gby">'+esc(m.by.n===me?'You':m.by.n.split(' ')[0])+'</span>':'')+'<span class="n">'+fT(m.at)+'</span>'+gTicks(th.ch,lk||m,t)+'</span></div></div>';});
  if(gDone(th,t))h+='<div class="ch-sys ok"><span>'+I('check',12)+' Marked done · '+fT(th.doneAt)+'</span></div>';
  const ty=Chat.typing['G:'+th.id];if(ty&&Date.now()<ty.until)h+='<div class="gm them last"><div class="gb ch-typ"><i></i><i></i><i></i></div></div>';
  return h;}
/* BUBL drafts: the answer the team would give, with the right link attached */
function gDrafts(th,t){const k=gK(th,t),gi=GI[k];const c=gc(th,t),D=[];if(gi){const lt=glink(gi,c);D.push({txt:gi.us(c),link:lt&&th.g>=0?lt:null});}
  D.push({txt:'Thank you'+(c.f?' '+c.f:'')+', leave it with me. I’ll come back to you in a few minutes.'});return D;}
function gDraftsHTML(th,t){if(!th||!gNeeds(th,t)||!chOn(th.ch)||!gWin(th,t).open)return '';const D=gDrafts(th,t);
  return '<div class="ch-drs">'+D.map((d,i)=>'<div class="ch-dr"><button class="ch-drt" data-act="gDraft" data-i="'+i+'"><b>'+bublMark()+'BUBL draft'+(d.link?' · '+esc(LT[d.link].l.toLowerCase()):'')+'</b><span>'+esc(d.txt)+'</span></button>'+(d.link?'<button class="btn xs pri" data-act="gDraftL" data-i="'+i+'">'+I('link',13)+'Send with the link</button>':'')+'</div>').join('')+'</div>';}
function gPaintBits(th,host,force){if(!th||!host)return;const t=now(),pp=(id,h)=>{const el=$(id,host);if(el&&(force||el._h!==h)){el.innerHTML=h;el._h=h;}};
  pp('#chCtx',gCtxHTML(th,t));pp('#chDr',gDraftsHTML(th,t));pp('#chSub',gSubHTML(th));
  const q=$('#chQ',host);if(q){q.disabled=!(chOn(th.ch)&&gWin(th,t).open);q.placeholder=gPh(th,t);}}

/* ---------- replying, and the guest answering back ---------- */
function gSend(th,txt){if(!th)return;if(!chOn(th.ch)){toast(CH[th.ch].l+' is switched off in Integrations. Nothing was sent.');return;}if(!gWin(th,now()).open){toast(th.ch==='wa'?'The 24-hour window is closed. Send an approved template from the link button.':'Instagram only allows replies within 7 days of their last message.');return;}const t=now(),me=myName(),h=h32(txt+t);
  const m={at:t,who:'us',by:{n:me,r:ROLES[UI.role].label},m:txt,live:1,dAt:t+1200,rAt:h%10<8?t+3500+h%9000:0};gPush(th,m);gMarkRead(th,t);if(th.doneAt&&th.doneAt<=t)th.doneAt=0;
  log('Guest message sent',G(th.g).n+' · '+CH[th.ch].l);Chat._stick=true;Chat.repaint();haptic(8);gReply(th,txt,m);
  [1300,(m.rAt||0)-t+100].forEach(d=>{if(d>0)setTimeout(()=>{if(Chat.visible())Chat.update();},d);});}
function gReply(th,txt,m){const h=h32(txt+m.at);if(h%10>=6)return;const id='G:'+th.id,d1=2400+h%2000,d2=2400+(h>>5)%3000;if(!m.rAt)m.rAt=m.at+d1-300;
  setTimeout(()=>{Chat.typing[id]={n:G(th.g).n,until:Date.now()+d2+500};if(Chat.visible())Chat.update();},d1);
  setTimeout(()=>{delete Chat.typing[id];const ans=/\?\s*$/.test(txt)?['Yes please 🙏','Yes, that works','Sure!'][h%3]:/link/i.test(txt)?['Got it, thank you!','Perfect, opening it now'][h%2]:['Thank you!','Perfect 🙏','Amazing, see you then','👍','Great, thanks'][h%5];
    gPush(th,{at:now(),who:'them',m:ans,live:1,ack:1});if(Chat.visible()&&Chat.open===id){gMarkRead(th,now());Chat._stick=true;Chat.update();}else{Chat.badge();Chat.banner(id,avHTML(G(th.g).n,{cls:'sm',ch:th.ch,chz:9}),G(th.g).n,ans);}},d1+d2);}
/* a link sent through a channel's API lands in that guest's conversation */
function gPostLink(m,thId){let th=thId&&gth(thId);if(!th||th.g!==m.gi||th.ch!==m.ch)th=gThreadFor(m.gi,m.ch,true);
  gPush(th,{at:m.at,who:'us',by:{n:m.by,r:ROLES[UI.role].label},m:noteOf(m.text,m.url),link:m.id,live:1});gMarkRead(th,m.at);if(th.doneAt)th.doneAt=0;
  if(m.cAt){const id='G:'+th.id;setTimeout(()=>{const ans=['Done ✅ thank you!','All set, thanks 🙌','Perfect, done!'][h32(m.id)%3];gPush(th,{at:now(),who:'them',m:ans,live:1,ack:1});
    if(Chat.visible()&&Chat.open===id){gMarkRead(th,now());Chat._stick=true;Chat.update();}else{Chat.badge();Chat.banner(id,avHTML(G(th.g).n,{cls:'sm',ch:th.ch,chz:9}),G(th.g).n,ans);}},Math.max(0,m.cAt-m.at)+4000);}
  if(Chat.visible())Chat.repaint();return th;}
function gTellTo(th,gid){const t=now(),b=th.b&&bk(th.b),l=gMsgs(th,t).filter(m=>m.who==='them').pop(),gg=chatG(gid);if(!gg){toast('That room isn’t open to your role.');return;}
  Chat.post(gid,{n:myName(),r:ROLES[UI.role].label},'',{k:'guest',tone:'neu',ic:'msg',title:'Guest message · {g:'+th.g+'}',sub:(b?'{t:'+tableAt(b,t)+'} · ':'')+CH[th.ch].l+(l?' · “'+l.m+'”':''),act:b?{k:'table',v:tableAt(b,t)}:null});
  toast('Shared with '+esc(gg.n)+'.');log('Guest chat shared',G(th.g).n+' to '+gg.n);}
function gTellGid(th){const b=th.b&&bk(th.b),k=gK(th,now()),tl=GI[k]&&GI[k].tell;if(tl==='door'&&chatG('door'))return 'door';if(tl==='bar'&&chatG('bar'))return 'bar';
  return b&&b.sec===ROLES.host.sec&&chatG('sec')?'sec':chatG('hosts')?'hosts':'all';}
function gOpenLink(th,type,txt){const b=th.b?bk(th.b):null;openCompose({gi:th.g,b,ch:th.ch,th:th.id,type:type||gLinkType(th),text:txt});}
function gLinkType(th){const k=gK(th,now());return glink(GI[k],gc(th))||null;}
const curG=()=>Chat.isG()?gth(Chat.open.slice(2)):null;
ON.gDraft=el=>{const th=curG(),d=th&&gDrafts(th,now())[+el.dataset.i],i=$('#chQ');if(!d||!i)return;i.value=d.txt;i.focus();};
ON.gDraftL=el=>{const th=curG(),d=th&&gDrafts(th,now())[+el.dataset.i];if(d)gOpenLink(th,d.link,d.txt);};
ON.gLink=()=>{const th=curG();if(!th)return;if(!canTables()&&UI.role!=='door'){toast('Links are sent by hosts and managers.');return;}gOpenLink(th);};
ON.gDone=()=>{const th=curG();if(!th)return;const t=now();if(gDone(th,t)){th.doneAt=0;toast('Reopened.');}else{th.doneAt=t;gMarkRead(th,t);toast('Marked done.');}log(th.doneAt?'Guest chat done':'Guest chat reopened',G(th.g).n);
  Chat.repaint();const o=Sheet.stack.find(x=>x.chi);if(o){o._b=null;Sheet.paint(o);}};
ON.gTell=()=>{const th=curG();if(th)gTellTo(th,gTellGid(th));};
ON.gChat=el=>{const gi=+el.dataset.g;if(!canGuestChat()){openWA(gi,'Hi '+G(gi).n.split(' ')[0]+', ');return;}const th=gThreadFor(gi,null,false)||gThreadFor(gi,waDigits(gi)?'wa':'mail',true);chatGoTo('G:'+th.id);};
ON.chNewG=()=>{Sheet.close();Sheet.open({tall:true,static:true,title:'Message a guest',sub:'Their chat opens on the channel they last used, or WhatsApp',
  body:()=>'<label class="srch">'+I('search',18)+'<input id="gNq" placeholder="Guest name or ticket" autocomplete="off" autocapitalize="none"></label><div id="gNr" class="rows"></div>',
  onOpen:el=>{const inp=$('#gNq',el),res=$('#gNr',el);const paint=()=>{const v=inp.value.trim().toLowerCase();let h='';
      if(v.length>=2){const seen={};searchAll(v,24).forEach(r=>{const gi=r.type==='seat'?r.s.g:r.type==='tix'?r.x.g:null;if(gi==null||gi<0||seen[gi])return;seen[gi]=1;h+=row('user','',esc(gName(gi)),esc(crmLabel(G(gi)))+(G(gi).ph?' · '+esc(G(gi).ph):''),'',' data-act="gChat" data-g="'+gi+'"');});}
      res.innerHTML=h||'<p class="note">Type at least two letters of a guest’s name.</p>';};inp.addEventListener('input',paint);paint();setTimeout(()=>inp.focus(),80);}});};

/* ---------- guest details: the side panel or sheet ---------- */
function gInfoHTML(th){if(!th)return '';const t=now(),gs=G(th.g),b=th.b&&bk(th.b),links=(W.wa||[]).filter(m=>m.gi===th.g&&m.at<=t).slice(-5).reverse();let kv;
  if(b){const m=money(b,t),sc=seatCounts(b,t),T=W.T[tableAt(b,t)];kv='<div class="kv"><span>Table</span><b>'+esc(T.name)+'</b><span>Party</span><b class="n">'+b.party+'</b><span>Minimum</span><b class="n">'+aed(b.min)+'</b><span>Deposit</span><b>'+(m.dep?'Paid · '+N(aed(m.dep)):m.depDue?'<span class="warn">Due · '+N(aed(m.depDue))+'</span>':b.comp?'Comped':'None')+'</b><span>Seats named</span><b class="n">'+sc.claimed+' of '+b.party+'</b>'+
    (b.pre.length?'<span>Pre-orders</span><b>'+esc(b.pre.map(p=>p.nm).join(', '))+'</b>':'')+'<span>Arrive by</span><b class="n">'+fT(b.arriveBy)+'</b>'+(phase()!=='pre'?'<span>Through the gates</span><b class="n">'+sc.present+' of '+b.party+'</b>':'')+'</div>';}
  else kv='<p class="note">'+(th.lead?'New enquiry, not booked yet. A table picker link lets them choose a table and holds it for two hours.':'Ticket holder without a table.')+'</p>';
  return '<div class="ci-top">'+avHTML(gs.n,{cls:'xl',ch:th.ch,chz:15})+'<b>'+esc(gs.n)+'</b><span>'+chGlyph(th.ch,12)+' '+esc(CH[th.ch].l+' · '+gContact(th.g,th.ch))+'</span><div class="ci-tags"><span class="tag'+(gs.crm===2?' gold':'')+'">'+esc(crmLabel(gs))+'</span>'+(gs.v?'<span class="tag">'+gs.v+(gs.v===1?' visit':' visits')+'</span>':'')+(th.lead?'<span class="tag">New enquiry</span>':'')+'</div></div>'+
    '<button class="ci-sum" data-act="chSum">'+bublMark()+'<span><b>Summarise this chat</b><em>What they want, where it stands, what to do next</em></span>'+I('right',16)+'</button>'+
    '<div class="ci-acts"><button class="btn sm pri" data-act="gLink">'+I('link',15)+'Custom link</button><button class="btn sm" data-act="guest" data-g="'+th.g+'">'+I('user',15)+'Profile</button>'+(b&&canTables()?'<button class="btn sm" data-act="chTable" data-id="'+tableAt(b,t)+'">'+I('floor',15)+'Table</button>':'')+
      '<button class="btn sm" data-act="gTell">'+I('users',15)+'Tell the team</button>'+(th.ch==='wa'&&waDigits(th.g)?'<button class="btn sm" data-act="gWa" data-g="'+th.g+'">'+I('msg',15)+'WhatsApp app</button>':'')+'<button class="btn sm" data-act="gDone">'+I('check',15)+(gDone(th,t)?'Reopen':'Mark done')+'</button></div>'+
    '<div class="grp"><div class="lbl">'+(b?'Booking':'Status')+'</div>'+kv+'</div>'+
    '<div class="grp"><div class="lbl">Looked after by</div><div class="ci-ml"><div class="ci-m">'+avHTML(th.as.n,{cls:'md'})+'<span class="ci-mt"><b>'+esc(th.as.n)+'</b><span>'+esc(th.as.r||'')+'</span></span></div></div><p class="note">'+esc((th.why||'')+(th.via&&!(th.why||'').includes(th.via)?'. Booked through '+th.via:'')).replace(/\.?$/,'.')+'</p></div>'+
    (gs.prefs?'<div class="grp"><div class="lbl">Preferences</div><div class="chips" style="flex-wrap:wrap">'+gs.prefs.map(p=>'<span class="chip">'+esc(p)+'</span>').join('')+'</div></div>':'')+
    (links.length?'<div class="grp"><div class="lbl">Links sent</div><div class="rows">'+links.map(waRow).join('')+'</div></div>':'');}

/* ---------- where guest chats show up: home, Needs you, Integrations ---------- */
function chatGoGuests(){const t=now();Chat.mode='guests';Chat.f=gThreads(t).some(th=>gNeeds(th,t))?'need':'all';Chat.q='';Chat.open=null;Chat.side=null;Sheet.close(true);
  if(UI.device==='atlas'){UI.atlas='chat';Atlas.render();}else if(UI.tab==='chat')Chat.render($('#view'));else setTab('chat');}
ON.chGoG=()=>chatGoGuests();
M.inbox={t:'Guest messages',go:()=>chatGoGuests(),
  tile:s=>{const t=s.t,T=gThreads(t),nr=T.filter(th=>gNeeds(th,t)),u=sum(T,th=>gUnread(th,t)),by=CHK.map(k=>[k,T.filter(th=>th.ch===k).length]).filter(x=>x[1]);
    return tile('inbox','Guest messages',nr.length?nr.length+'<small>need a reply</small>':T.length+'<small>'+pl(T.length,'chat')+'</small>',
      nr.length?'Longest wait '+N(fWait(Math.max(...nr.map(th=>gWait(th,t)))))+(u?' · '+N(u)+' unread':''):u?N(u)+' unread':'Every guest has an answer',
      '<span class="ibx">'+by.map(x=>'<i class="ch-'+x[0]+'">'+chGlyph(x[0],11)+'<b class="n">'+x[1]+'</b></i>').join('')+'</span>',{dot:nr.length?'warn':null});},
  panel:s=>{const t=s.t,T=gThreads(t),nr=T.filter(th=>gNeeds(th,t));return '<div class="ph"><h4>Guest messages</h4><span>'+(nr.length?N(nr.length)+' waiting for a reply':'WhatsApp, Instagram and email')+'</span></div>'+
    (T.length?'<div class="ch-mini">'+(nr.length?nr:T).slice(0,5).map(th=>gRowHTML(th,t,false)).join('')+'</div>':empty('No guest messages yet.'))+'<button class="btn sm full" data-act="chGoG" style="margin-top:8px">'+I('msg',16)+'Open guest chats</button>';}};
(function(){const ins=(a,after,id)=>{if(!a||a.includes(id))return;const i=a.indexOf(after);a.splice(i<0?a.length:i+1,0,id);};
  ins(HOME.pre.owner,'needs','inbox');ins(HOME.pre.host,'needs','inbox');ins(HOME.live.owner,'needs','inbox');ins(HOME.live.host,'needs','inbox');ins(HOME.post.owner,'agent','inbox');ins(HOME.post.host,'agent','inbox');
  ins(ASETS.command.pre,'needs','inbox');ins(ASETS.command.live,'needs','inbox');ins(ASETS.command.post,'agent','inbox');SPAN.inbox='c4';
  const item=s=>{if(!canGuestChat()||gapFor('inbox').full.length)return null;const t=s.t,T=gThreads(t).filter(th=>{const w=gWait(th,t);return gNeeds(th,t)&&w>10*MIN&&w<DAY;}).sort((a,b)=>gWait(b,t)-gWait(a,t));
    return T.length?{id:'inbox',tone:'warn',ic:'msg',title:N(T.length)+' '+pl(T.length,'guest')+' waiting for a reply',sub:esc(T.slice(0,3).map(th=>G(th.g).n.split(' ')[0]+' on '+CH[th.ch].l+' · '+fWait(gWait(th,t))).join(', '))}:null;};
  const p0=needsPre;needsPre=function(s){const o=p0(s),x=item(s);if(x)o.push(x);return o;};
  const l0=needsLive;needsLive=function(s){const o=l0(s),x=s.ph==='pre'?null:item(s);if(x)o.push(x);return o;};
  const ii=integIndex;integIndex=function(){const by=ii.apply(this,arguments);if(by&&!by._g){by._g=1;gchSeed().forEach(th=>th.msgs.forEach(m=>{if(m.live)return;const k=CH[th.ch].int;(by[k]=by[k]||[]).push({at:m.at,src:k,txt:(m.who==='them'?'Guest message in':'Reply sent')+' · '+CH[th.ch].l});}));
    Object.keys(by).forEach(k=>{if(Array.isArray(by[k]))by[k].sort((a,b)=>a.at-b.at);});}return by;};})();
