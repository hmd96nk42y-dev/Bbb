'use strict';
/* ============================================================
   93 · CUSTOM LINKS TO GUESTS
   Every link is personal to the guest and the event and opens the
   booking web app. It goes out through a channel's API (WhatsApp,
   Instagram or email) and lands in that guest's conversation, where
   its progress shows: delivered, read, opened, done. Outside
   WhatsApp's 24-hour window it can only go as an approved template,
   with the link on the template's button; marketing templates need
   the guest's opt-in. It comes from the venue's own number or account,
   signed by the person responsible for that client: their promoter,
   their host, the manager, or the reservation team.
   ============================================================ */
const UBIRD={"b": "M273 904C276 904 280 884 282 862C283 845 286 822 289 810C290 805 292 792 294 780C297 758 300 748 306 732C309 726 312 717 313 712C315 706 317 699 319 696C327 680 332 671 334 664C336 660 340 653 343 648C346 643 351 635 353 632C355 628 359 622 362 618C366 614 370 609 372 607C374 605 378 599 381 595C387 588 395 579 406 565C409 561 418 551 425 544C445 525 459 508 466 498C470 493 474 486 477 482C480 479 484 473 487 468C489 464 493 457 496 454C499 450 503 442 505 438C507 433 511 426 513 422C516 418 520 411 523 405C532 388 542 379 567 367C575 364 581 360 585 357C589 354 594 350 598 348C601 346 607 342 612 339C616 336 627 331 635 327C644 323 653 318 657 315C667 309 695 296 701 295C705 294 712 293 718 293C731 293 749 292 755 290C768 287 762 277 742 269C734 265 708 251 700 246C691 239 670 224 664 220C658 214 654 212 635 205C622 201 622 201 610 201C592 202 556 212 538 221C533 223 523 227 515 231C507 234 498 237 496 239C487 243 481 245 460 249C449 251 437 255 432 256C414 263 405 261 386 248L378 242L368 249L357 256L312 337C288 381 267 418 267 418C265 419 265 421 265 425C265 429 264 434 262 441C260 446 258 456 257 462C255 476 246 518 242 536C236 561 235 584 237 687C238 725 238 735 240 750C241 759 243 771 243 777C244 783 247 798 249 812C251 825 253 842 254 850C257 887 263 907 271 904C272 904 273 904 273 904ZM608 268C602 266 600 255 604 249C612 237 634 250 626 262C623 268 615 271 608 268Z", "w": "M278 467C290 464 301 462 301 461C301 461 323 422 349 375L396 290L422 271C436 261 447 252 447 252C446 252 440 254 433 256C411 263 401 261 378 241C374 239 368 234 364 231C360 228 350 219 342 211C333 203 324 195 322 193C319 191 313 187 310 184C306 181 300 177 298 175C295 173 287 166 280 159C263 143 258 139 246 134C241 131 233 127 228 124C224 121 215 117 210 115C204 113 196 109 192 107C187 105 177 101 169 98C159 95 152 92 145 88C140 84 131 80 126 78C121 76 112 71 107 68C102 65 94 61 89 59C70 50 52 37 30 17C22 11 20 9 16 11C9 13 8 28 14 40C17 49 21 60 26 74C39 115 45 129 53 138C59 144 60 146 65 159C71 172 81 189 90 199C93 204 99 211 102 216C104 221 109 228 111 231C116 237 118 242 124 254C128 265 138 280 148 291C156 299 157 301 160 312C162 320 167 328 171 331C177 335 185 345 190 351C197 361 202 366 211 371C223 378 225 381 234 391C241 400 242 401 250 405C266 413 268 420 262 440C259 449 255 472 255 472C256 472 266 470 278 467Z"};
const TEAM_P={key:'team',name:'The reservation team',first:'The team',ini:'U',role:'Ushuaïa Dubai Harbour',team:true};
const MGR_P={key:'mgr',name:'Roland Keyali',first:'Roland',ini:'RK',role:'Manager, Ushuaïa Dubai Harbour'};
const hostP=(n,sec)=>({key:'host:'+n,name:n,first:n.split(' ')[0],ini:initials(n),role:'Your host, '+SECTIONS[sec].label});
const promoP=so=>{const person=/^[A-Z][a-z]+ [A-Z]\.$/.test(so.label);return {key:'promo:'+so.id,name:so.label,first:person?so.label.split(' ')[0]:so.label,org:!person,ini:initials(so.label),role:person?'Your promoter at Ushuaïa':'Promoter for Ushuaïa Dubai Harbour'};};
function meP(){const w=ROLES[UI.role].who;return {key:'me',name:w,first:w.split(' ')[0],ini:initials(w),role:UI.role==='owner'?'Manager, Ushuaïa Dubai Harbour':UI.role==='host'?'Your host, '+SECTIONS[ROLES.host.sec].label:ROLES[UI.role].label+', Ushuaïa'};}
function respFor(ctx){const b=ctx.b,tx=ctx.tx;
  if(b){const so=SRC[b.src]||{};
    if(so.grp==='promoter')return {p:promoP(so),why:'Booked through '+so.label};
    if(TIERS[b.tier].req)return {p:MGR_P,why:'Backstage requests are approved by the manager'};
    if(b.comp||b.src==='art')return {p:MGR_P,why:b.comp?'Comped by the manager':'Artist and label list'};
    if(b.vip||G(b.booker).crm===2)return {p:hostP(b.host,b.sec),why:'Backstage List guest, looked after by their section host'};
    if(so.grp==='partner')return {p:TEAM_P,why:'Booked through '+so.label};
    return {p:TEAM_P,why:so.id==='host'?'Booked through the host desk':'Booked online'};}
  if(tx){const so=SRC[tx.s]||{};if(so.grp==='promoter')return {p:promoP(so),why:'Ticket sold by '+so.label};return {p:TEAM_P,why:'Ticket bought directly'};}
  return {p:TEAM_P,why:'New enquiry, handled by reservations'};}
function fromOptions(ctx){const r=respFor(ctx).p,o=[r,TEAM_P,MGR_P];const b=ctx.b;
  if(b){o.push(hostP(b.host,b.sec));const so=SRC[b.src];if(so&&so.grp==='promoter')o.push(promoP(so));}
  o.push(meP());const seen={},out=[];o.forEach(p=>{if(!seen[p.name]){seen[p.name]=1;out.push(p);}});return out;}

/* ---------- what can be sent ---------- */
const LT={
  invite:{l:'Invitation',ic:'star',c:'i',pv:1,tpl:'u',tn:'table_invitation',tb:'Open your invitation'},claim:{l:'Seat claim',ic:'users',c:'c',pv:1,tpl:'u',tn:'seat_claim',tb:'Claim your seat'},deposit:{l:'Deposit reminder',ic:'card',c:'i',pv:1,tpl:'u',tn:'deposit_reminder',tb:'Open your invitation'},
  preorder:{l:'Pre-order',ic:'glass',c:'m',tpl:'m',tn:'preorder_offer',tb:'Pre-order'},arrival:{l:'Arrival details',ic:'gate',c:'a',tpl:'u',tn:'arrival_details',tb:'Arrival details'},ticket:{l:'Ticket',ic:'scan',c:'t',tpl:'u',tn:'your_ticket',tb:'Show my ticket'},
  tables:{l:'Table picker',ic:'floor',c:'b',tpl:'m',tn:'tables_available',tb:'See the tables'},thanks:{l:'Thank-you',ic:'msg',c:'r',tpl:'m',tn:'thank_you_first_pick',tb:'Get first pick'},custom:{l:'Custom link',ic:'link',c:'u'}};
/* how a link can reach this guest on this channel right now: freely, as an approved template, or not at all */
function waMode(gi,ch,type){const w=chWin(gi,ch),f=G(gi).n.split(' ')[0];if(ch==='mail')return {how:'free'};
  if(ch==='ig')return w.open?{how:'free'}:{how:'no',why:w.never?'Instagram only allows replies, and '+f+' hasn’t messaged the venue there':'Instagram’s 7-day reply window with '+f+' has closed'};
  if(w.open)return {how:'free'};const lt=LT[type];
  if(!lt.tpl)return {how:'no',why:'A custom link can only go while the 24-hour window is open. Outside it, WhatsApp only sends approved templates'};
  if(lt.tpl==='m'&&!G(gi).mk)return {how:'no',why:f+' hasn’t opted in to marketing, so this template can’t go outside the 24-hour window'};
  return {how:'tpl'};}
function guestCtx(gi,b0){const t=now(),r=guestRecs(gi,t),seat=b0?b0.seats.find(x=>x.g===gi):r.seats[0],b=b0||(seat&&seat.b)||null,tx=r.tix[0]||null;
  return {gi,b,seat,tx,isBooker:!!(b&&b.booker===gi)};}
function typesFor(ctx){const p=phase(),L=[];const b=ctx.b;
  if(b){L.push(ctx.isBooker?'invite':'claim');if(ctx.isBooker)L.push('claim');
    if(p==='pre'&&ctx.isBooker&&money(b,now()).depDue)L.push('deposit');if(p==='pre')L.push('preorder');}
  else if(ctx.tx){L.push('invite','ticket');if(p==='pre')L.push('tables');}
  else if(p!=='post')L.push('tables');
  if(p!=='post'){if(b||ctx.tx)L.push('arrival');}else L.push('thanks');L.push('custom');return [...new Set(L)];}
function defType(ctx){const p=phase(),ts=typesFor(ctx);if(p==='post')return 'thanks';if(p==='live'&&ts.includes('arrival'))return 'arrival';return ts[0];}
function linkFor(type,gi,custom){if(type==='deposit')type='invite';/* one link, sent once: the deposit lives on the invitation */const tok=(h32(W.ev.id+':'+gi+':'+type).toString(36).toUpperCase()+'0000000').slice(0,7);
  if(type==='custom')return custom&&custom.track===false?(custom.url||''):'https://bubl.app/u/'+tok;return 'https://bubl.app/ushuaia-dxb/'+LT[type].c+'/'+tok;}
function t12(ms){const hh=+fT(ms).slice(0,2),mm=+fT(ms).slice(3);return ((hh%12)||12)+(mm?':'+String(mm).padStart(2,'0'):'')+(hh<12?' am':' pm');}
function waText(type,gi,ctx,from,link){const g=G(gi),f=g.n.split(' ')[0],ev=W.ev,b=ctx.b,t=now(),day=fD(W.D),tn=b?W.T[tableAt(b,t)].name:'';
  const soon=W.D-t<DAY&&W.D>t?'tonight':W.D-t<2*DAY&&W.D>t?'tomorrow':'on '+day,hostF=b?gName(b.booker).split(' ')[0]:'',arr=b?fT(b.arriveBy):fT(W.D+2*HOUR);
  const intro=from.team?'Hi '+f+', the Ushuaïa reservation team here.':from.org?'Hi '+f+', '+from.name+' here.':from.key&&from.key.indexOf('promo:')===0?'Hi '+f+', it’s '+from.first+'.':'Hi '+f+', it’s '+from.first+' from Ushuaïa.';
  const tier=ctx.tx?KN[ctx.tx.k]:'',gate=b?'Gate 3':ctx.tx&&ctx.tx.gt?GATE[ctx.tx.gt].label:'Gate 1 or 2',ne=typeof nextEv==='function'?nextEv():null;
  const body={
    invite:b?'Your table for '+ev.short+' is ready: '+tn+', '+day+', doors '+ev.doorsT+'. Your invitation, with your table in the room, is here:':'You’re in for '+ev.short+' on '+day+'. Doors '+ev.doorsT+'. Your invitation and entry are here:',
    claim:ctx.isBooker?'Here’s the link for your guests to claim their spots at '+tn+' on '+day+'. Forward it to each of them:':hostF+' has saved you a spot at '+tn+' for '+ev.short+' on '+day+'. Claim it so the door knows you’re coming:',
    deposit:tn+' is held for you. The deposit of '+aed(b?money(b,t).depDue:0)+' is on your invitation, the same link as before:',
    preorder:'Pre-order for '+tn+' and save 10%. Everything counts toward your minimum:',
    arrival:'See you '+soon+' at Ushuaïa Dubai Harbour. Use '+gate+(b?' for tables':'')+' and arrive by '+arr+'. Directions and your entry pass:',
    ticket:'Here’s your '+tier+' ticket for '+ev.short+' on '+day+'. Show the QR at '+gate+':',
    tables:'Here are the tables still free for '+ev.short+' on '+day+'. Pick one and it’s held for you for two hours:',
    thanks:'Thank you for coming to '+ev.short+'. We’d love to have you back'+(ne?' for '+ne.short:'')+', here’s first pick:',
    custom:''}[type];
  return intro+(body?' '+body:'')+'\n'+link;}
function noteOf(text,link){return String(text).split(link).join('').replace(/[^.!?\n]*:\s*$/,'').replace(/\s+$/,'').trim()||String(text).split(link).join('').trim();}
const waDigits=gi=>String(G(gi).ph||'').replace(/\D/g,'');
/* the channels a guest can be reached on */
function waChans(gi){const g=G(gi),out=[];if(waDigits(gi))out.push('wa');gchSeed().forEach(th=>{if(th.g===gi&&!out.includes(th.ch))out.push(th.ch);});if(g.ig&&!out.includes('ig'))out.push('ig');if(g.em&&!out.includes('mail'))out.push('mail');return CHK.filter(k=>out.includes(k));}
const LDONE_S={invite:'Opened',claim:'Claimed',deposit:'Paid',preorder:'Ordered',arrival:'Opened',ticket:'Saved',thanks:'Picked',custom:'Opened',tables:'Picked'};
function linkSt(m,t){t=t==null?now():t;if(m.fail)return {k:'failed',l:'Not sent'};if(m.cAt&&m.cAt<=t)return {k:'done',l:m.type==='claim'&&m.b&&m.b.booker===m.gi?'Shared':LDONE_S[m.type]||'Done'};if(m.oAt&&m.oAt<=t)return {k:'opened',l:'Opened'};
  if(m.via!=='api')return {k:'manual',l:m.via==='copy'?'Copied':m.via==='share'?'Shared':'In WhatsApp'};
  if(m.ch!=='mail'&&m.rAt&&m.rAt<=t)return {k:'read',l:m.ch==='ig'?'Seen':'Read'};if((m.ch||'wa')==='wa'&&m.dAt&&m.dAt<=t)return {k:'delivered',l:'Delivered'};if(m.sAt&&m.sAt<=t||m.at<=t)return {k:'sent',l:'Sent'};return {k:'sending',l:'Sending'};}

/* ---------- copy, share, open ---------- */
async function copyText(t){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);return true;}}catch(_){}
  try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:0;top:0;opacity:0;font-size:16px';document.body.appendChild(ta);
    ta.select();ta.setSelectionRange(0,t.length);const ok=document.execCommand('copy');ta.remove();return ok;}catch(_){return false;}}
function openWA(gi,text){const d=waDigits(gi),u='https://wa.me/'+d+'?text='+encodeURIComponent(text),a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();}

/* ---------- the composer ---------- */
const WA={st:null};
function openCompose(o){let gis=o.gis||[o.gi];const b=o.b||null;
  const ctx0=guestCtx(gis[0],b),resp=respFor(ctx0),types=typesFor(ctx0),ch0=waChans(gis[0]),ch=o.ch&&(ch0.includes(o.ch)||gis.length>1)?o.ch:ch0[0]||'wa';
  WA.st={gis,sel:gis.slice(0,o.all?gis.length:1),b,type:o.type&&types.includes(o.type)?o.type:defType(ctx0),from:resp.p,why:resp.why,edited:o.text||null,custom:{url:'',track:true},ch,th:o.th||null};
  Sheet.open({wa:true,tall:true,static:true,title:'Send a link',sub:()=>WA.st.b?esc(W.T[tableAt(WA.st.b,now())].name)+' · '+esc(W.ev.short):esc(gName(WA.st.gis[0]))+' · '+esc(W.ev.short),
    body:()=>waBody(),foot:()=>waFoot(),onOpen:el=>{WA.el=el;waWire(el);},onClose:()=>setTimeout(()=>{const o=Sheet.top();if(o&&!o.wa)Sheet.refresh(true);},0)});}
function waRcpts(){const s=WA.st;return s.sel.length?s.sel:[s.gis[0]];}
function waLink(gi){return linkFor(WA.st.type,gi,WA.st.custom);}
function waMsg(gi){const s=WA.st,ctx=guestCtx(gi,s.b),link=waLink(gi);
  if(s.edited!=null&&waMode(gi,s.ch,s.type).how!=='tpl'){const g0=waRcpts()[0],f0=G(g0).n.split(' ')[0],l0=waLink(g0);let x=s.edited;if(gi!==g0){x=x.split(l0).join(link).split(f0).join(G(gi).n.split(' ')[0]);}return x.includes(link)?x:x.replace(/\s*$/,'')+'\n'+link;}
  return waText(s.type,gi,ctx,s.from,link);}
function waBody(){const s=WA.st,ctx=guestCtx(waRcpts()[0],s.b),types=typesFor(ctx),g0=waRcpts()[0],txt=waMsg(g0),link=waLink(g0),rp=respFor(ctx).p,chs=waChans(g0);
  if(!types.includes(s.type))s.type=types[0];
  const many=s.gis.length>3;
  let h='<div class="grp"><div class="lbl" style="display:flex;justify-content:space-between">To'+(many?'<button class="lnk" data-act="waAll">'+(s.sel.length===s.gis.length?'Booker only':'Everyone at the table')+'</button>':'')+'</div><div class="wa-to'+(many?' many':'')+'">'+s.gis.map(gi=>{const on=s.sel.includes(gi),gs=G(gi),bk_=s.b&&s.b.booker===gi;
    return many?'<button class="wa-rcs'+(on?' on':'')+'" data-act="waRc" data-g="'+gi+'"><span class="wa-av">'+esc(initials(gs.n))+'</span>'+esc(gs.n.split(' ')[0])+(bk_?'<em>booker</em>':'')+'</button>'
      :'<button class="wa-rc'+(on?' on':'')+'" data-act="waRc" data-g="'+gi+'"><span class="wa-av">'+esc(initials(gs.n))+'</span><span><b>'+esc(gs.n)+'</b><em class="n">'+esc(gContact(gi,s.ch))+(bk_?' · booker':'')+'</em></span>'+(on?I('check',16):'')+'</button>';}).join('')+'</div>'+
    (s.gis.length>1?'<p class="note">'+s.sel.length+' of '+s.gis.length+' selected. Each guest gets their own link and message.</p>':'')+'</div>';
  const md=waMode(g0,s.ch,s.type);
  h+='<div class="grp"><div class="lbl">Send by</div><div class="chips wa-by">'+CHK.map(k=>{const av=chs.includes(k)||s.gis.length>1&&k==='wa';return '<button class="chip ch-'+k+(s.ch===k?' on':'')+'" data-act="waBy" data-k="'+k+'"'+(av?'':' disabled')+'>'+chGlyph(k,14)+CH[k].l+(chOn(k)?'':' · off')+'</button>';}).join('')+'</div>'+
    (md.how==='no'?'<div class="banner warn">'+I('alert',16)+'<span>'+esc(md.why)+'.'+(s.ch!=='mail'&&waChans(g0).includes('mail')?' Email still works.':'')+'</span></div>'
      :md.how==='tpl'?'<div class="banner neu wa-tpl">'+I('check',16)+'<span><b>Approved template · '+esc(LT[s.type].tn)+'</b>The 24-hour window is closed, so WhatsApp only takes this template. The wording is fixed and the link sits on its button.'+(LT[s.type].tpl==='m'?' Marketing: '+esc(G(g0).n.split(' ')[0])+' opted in on their invitation.':'')+'</span></div>'
      :'<p class="note">'+(s.th?'Goes into '+esc(G(g0).n.split(' ')[0])+'’s '+CH[s.ch].l+' chat, where you’ll see it '+(s.ch==='wa'?'delivered, read, opened and used.':s.ch==='ig'?'seen, opened and used.':'opened and used. Email has no read receipts.'):'Lands in the guest’s '+CH[s.ch].l+' chat in Chats, with its progress.')+'</p>')+'</div>';
  h+='<div class="grp"><div class="lbl">Link</div><div class="chips wa-ty">'+types.map(k=>'<button class="chip'+(s.type===k?' on':'')+'" data-act="waTy" data-k="'+k+'">'+I(LT[k].ic,14)+LT[k].l+'</button>').join('')+'</div>'+
    (s.type==='custom'?'<div class="wa-cu"><input class="inp" id="waUrl" type="url" inputmode="url" placeholder="https://" value="'+esc(s.custom.url)+'" autocomplete="off" autocapitalize="none"><button class="wa-tg'+(s.custom.track?' on':'')+'" data-act="waTrack"><i></i>Track opens with a BUBL link</button></div>':'')+'</div>';
  h+='<div class="grp"><div class="lbl">From</div><div class="chips wa-fr">'+fromOptions(ctx).map(p=>'<button class="chip'+(s.from.name===p.name?' on':'')+'" data-act="waFr" data-n="'+esc(p.name)+'">'+esc(p.key==='me'?p.name+' (you)':p.name)+(p.name===rp.name?'<em class="wa-rp">responsible</em>':'')+'</button>').join('')+'</div>'+
    '<p class="note">'+esc(respFor(ctx).why)+'. It comes from the venue’s '+(s.ch==='wa'?'WhatsApp number':s.ch==='ig'?'Instagram account':'reservations email')+', signed by '+esc(s.from.team?'the team':s.from.first)+', and the page it opens shows it’s from '+esc(s.from.team?'the reservation team':s.from.name)+'.</p></div>';
  h+=md.how==='tpl'?'<div class="grp"><div class="lbl">Message · template wording</div><textarea class="inp wa-ta" id="waTa" rows="4" readonly>'+esc(noteOf(txt,link))+'</textarea></div>'
    :'<div class="grp"><div class="lbl" style="display:flex;justify-content:space-between">Message'+(s.edited!=null?'<button class="lnk" data-act="waReset">Reset</button>':'')+'</div><textarea class="inp wa-ta" id="waTa" rows="5">'+esc(txt)+'</textarea></div>';
  h+='<div class="grp"><div class="lbl">How '+esc(G(g0).n.split(' ')[0])+' sees it</div><div class="wa-ph ph-'+s.ch+'" id="waPh">'+waBubble(g0,txt,link)+'</div>'+
    '<div class="wa-lk"><span class="n">'+esc(link||'Add a link')+'</span><button class="btn xs" data-act="waCopyL">'+I('link',14)+'Copy link</button></div></div>';
  const hist=(W.wa||[]).filter(m=>s.gis.includes(m.gi)&&m.at<=now()).slice(-4).reverse();
  if(hist.length)h+='<div class="grp"><div class="lbl">Already sent</div><div class="rows">'+hist.map(waRow).join('')+'</div></div>';
  return h;}
function waBubble(gi,txt,link){const t=now(),s=WA.st,ch=s.ch||'wa',tpl=ch==='wa'&&waMode(gi,ch,s.type).how==='tpl',body=tpl?esc(noteOf(txt,link)):esc(txt).replace(esc(link),'<span class="wa-u">'+esc(link)+'</span>');
  const card=link?'<div class="wa-card"><span class="wa-th">'+waThumb()+'</span><span class="wa-ct"><b>'+esc(s.type==='custom'?'Ushuaïa Dubai Harbour':LT[s.type].l+' · '+W.ev.short)+'</b><span>'+esc(s.type==='invite'||s.type==='claim'?'From '+s.from.name:'Ushuaïa Dubai Harbour')+'</span><em>bubl.app</em></span></div>':'';
  if(ch==='mail')return '<div class="wa-hd mail">'+chGlyph('mail',16)+'<b>'+esc(LT[s.type].l+' · '+W.ev.short)+'</b><span>Email</span></div><div class="wa-mail"><div class="wm-h"><span>From</span><b>'+esc(s.from.name)+' · Ushuaïa Dubai Harbour</b><span>To</span><b>'+esc(gContact(gi,'mail'))+'</b></div><p>'+body+'</p>'+(link?'<span class="wm-btn">Open your '+esc(LT[s.type].l.toLowerCase())+'</span>':'')+'</div>';
  return '<div class="wa-hd '+ch+'"><span class="wa-av">'+esc(initials(G(gi).n))+'</span><b>'+esc(G(gi).n)+'</b><span>'+CH[ch].l+'</span></div><div class="wa-wall '+ch+'"><div class="wa-bub '+ch+'">'+card+
    '<p>'+body+'</p><em class="wa-tm"><span class="n">'+fT(t)+'</span>'+(ch==='wa'?waTicks('read'):ch==='ig'?'Seen':'Delivered')+'</em>'+(tpl&&link?'<span class="wa-btn">'+I('link',13)+esc(LT[s.type].tb)+'</span>':'')+'</div></div>';}
function waThumb(){return '<svg viewBox="-60 -60 880 1018" aria-hidden="true"><path fill="#FF4A2B" fill-rule="evenodd" d="'+UBIRD.b+'"/><path fill="#FF4A2B" fill-rule="evenodd" d="'+UBIRD.w+'"/></svg>';}
function waTicks(st){return st==='queued'||st==='sending'?I('clock',13):st==='sent'?'<i class="wa-tk">✓</i>':st==='failed'?'<i class="wa-tk bad">!</i>':'<i class="wa-tk'+(st==='read'||st==='opened'||st==='done'?' rd':'')+'">✓✓</i>';}
function waRow(m){const st=linkSt(m),ch=m.ch||'wa';return '<div class="row"><div class="ri '+(st.k==='done'||st.k==='opened'?'ok':st.k==='failed'?'bad':'')+'">'+I(LT[m.type].ic,16)+'</div><div class="rt"><b>'+esc(LT[m.type].l)+' · '+esc(gName(m.gi))+'</b><span>From '+esc(m.from.name)+' · '+(m.via==='api'?CH[ch].l+(m.tpl?' template':''):m.via==='copy'?'Copied':m.via==='share'?'Shared':'WhatsApp app')+' · '+N(fT(m.at))+'</span></div><div class="ra wa-ra">'+
  '<span class="wa-st '+st.k+'">'+(m.via==='api'&&ch==='wa'&&st.k!=='failed'?waTicks(st.k):'')+esc(st.l)+'</span>'+
  (LT[m.type].pv?'<button class="btn xs" data-act="waPv" data-id="'+m.id+'">Preview</button>':'')+'</div></div>';}
function waFoot(){const s=WA.st,on=chOn(s.ch),rc=waRcpts(),ok=rc.filter(gi=>waMode(gi,s.ch,s.type).how!=='no'),n=ok.length,tp=rc.some(gi=>waMode(gi,s.ch,s.type).how==='tpl'),pv=LT[s.type].pv,bad=s.type==='custom'&&!s.custom.track&&!/^https?:\/\/\S+\.\S+/.test(s.custom.url),c=CH[s.ch].l;
  return '<button class="btn pri full" data-act="waSend"'+(on&&!bad&&n?'':' disabled')+'>'+I('send',18)+(!on?(waiting(CH[s.ch].int)?c+' awaiting connection':c+' is switched off'):!n?'Can’t send this on '+c+' now':(tp?'Send template':'Send')+(n>1?' to '+n:'')+' on '+c)+'</button>'+
    '<div class="btnrow">'+(pv?'<button class="btn sm" data-act="waPreview">'+I('star',16)+'Preview</button>':'')+'<button class="btn sm" data-act="waCopy">'+I('doc',16)+'Copy</button>'+
    (navigator.share?'<button class="btn sm" data-act="waShare">'+I('share',16)+'Share</button>':'')+(waDigits(waRcpts()[0])?'<button class="btn sm" data-act="waApp">'+I('msg',16)+'WhatsApp app</button>':'')+'</div>';}
function waRepaint(){const o=Sheet.stack.find(x=>x.wa);if(!o)return;const b=$('.sh-body',o.el),st=b.scrollTop;b.innerHTML=waBody();o._b=null;b.scrollTop=st;$('.sh-foot',o.el).innerHTML=waFoot();o._f=null;waWire(o.el);}
function waWire(el){const ta=$('#waTa',el);if(ta)ta.addEventListener('input',()=>{WA.st.edited=ta.value;const g0=waRcpts()[0],ph=$('#waPh',el);if(ph)ph.innerHTML=waBubble(g0,waMsg(g0),waLink(g0));});
  const u=$('#waUrl',el);if(u)u.addEventListener('input',()=>{WA.st.custom.url=u.value.trim();const g0=waRcpts()[0],ph=$('#waPh',el);if(ph)ph.innerHTML=waBubble(g0,waMsg(g0),waLink(g0));$('.sh-foot',el).innerHTML=waFoot();});}
ON.waRc=el=>{const s=WA.st,gi=+el.dataset.g,i=s.sel.indexOf(gi);if(i>=0){if(s.sel.length>1)s.sel.splice(i,1);}else s.sel.push(gi);s.sel.sort((a,b)=>s.gis.indexOf(a)-s.gis.indexOf(b));waRepaint();};
ON.waAll=()=>{const s=WA.st;s.sel=s.sel.length===s.gis.length?[s.gis[0]]:s.gis.slice();waRepaint();};
ON.waBy=el=>{WA.st.ch=el.dataset.k;waRepaint();};
ON.waTy=el=>{WA.st.type=el.dataset.k;WA.st.edited=null;waRepaint();};
ON.waFr=el=>{const ctx=guestCtx(waRcpts()[0],WA.st.b),p=fromOptions(ctx).find(x=>x.name===el.dataset.n);if(p){WA.st.from=p;WA.st.edited=null;waRepaint();}};
ON.waReset=()=>{WA.st.edited=null;waRepaint();};
ON.waTrack=()=>{WA.st.custom.track=!WA.st.custom.track;waRepaint();};
ON.waCopyL=async()=>{const ok=await copyText(waLink(waRcpts()[0]));toast(ok?'Link copied.':'Copy didn’t work here. Press and hold the link to copy it.');};
ON.waCopy=async()=>{const r=waRcpts(),txt=r.map(gi=>waMsg(gi)).join('\n\n');const ok=await copyText(txt);if(ok){waRecord('copy');toast(r.length>1?'Copied '+r.length+' messages. Paste them into '+CH[WA.st.ch].l+'.':'Message copied. Paste it into '+CH[WA.st.ch].l+'.');}else toast('Copy didn’t work here. Press and hold the message to copy it.');};
ON.waShare=async()=>{const gi=waRcpts()[0];try{await navigator.share({text:waMsg(gi)});waRecord('share',[gi]);}catch(_){}};
ON.waApp=()=>{const gi=waRcpts()[0];if(!waDigits(gi)){toast('No WhatsApp number on file for '+esc(gName(gi))+'.');return;}openWA(gi,waMsg(gi));waRecord('app',[gi]);};
ON.waPreview=()=>{const s=WA.st,gi=waRcpts()[0],ctx=guestCtx(gi,s.b),link=waLink(gi);openInvite({gi,b:ctx.b,tx:ctx.tx,kind:s.type==='claim'?'claim':'invite',forBooker:s.type==='claim'&&ctx.isBooker,from:s.from,note:noteOf(waMsg(gi),link)});};
ON.waPv=el=>{const m=waRec(el.dataset.id);if(!m)return;const ctx=guestCtx(m.gi,m.b);openInvite({gi:m.gi,b:ctx.b,tx:ctx.tx,kind:m.type==='claim'?'claim':'invite',forBooker:m.type==='claim'&&ctx.isBooker,from:m.from,note:noteOf(m.text,m.url)});};
ON.waSend=()=>{const s=WA.st;if(!chOn(s.ch)){toast(CH[s.ch].l+' is switched off in Integrations.');return;}const fromTh=!!s.th;waRecord('api');if(fromTh){Sheet.close();}};
function waRecord(via,only){const s=WA.st,list=only||waRcpts(),L=W.wa||(W.wa=[]),me=myName(),recs=[],ch=via==='app'?'wa':s.ch;
  list.forEach((gi,ix)=>{const at=now(),id='M'+Date.now().toString(36)+ix+Math.random().toString(36).slice(2,5),h=h32(id),md=via==='api'?waMode(gi,ch,s.type):{how:'free'},reach=via!=='api'||waChans(gi).includes(ch)&&(ch!=='wa'||!!waDigits(gi))&&md.how!=='no';
    const m={id,gi,b:s.b||guestCtx(gi,null).b,type:s.type,from:s.from,url:waLink(gi),text:waMsg(gi),at,via,ch,by:me,sAt:at+500,tpl:md.how==='tpl'?LT[s.type].tn:null};
    if(!reach){m.fail=1;m.why=md.why||'No '+CH[ch].l+' contact on file';}else{if(via==='api'&&ch==='wa'){m.dAt=at+1600;if(h%10<8)m.rAt=at+4500+h%8000;}else if(via==='api'&&ch==='ig'&&h%10<8)m.rAt=at+5200+h%8000;const base=m.rAt||at+12000;
      if(base&&(h>>4)%10<8&&(s.type!=='custom'||s.custom.track))m.oAt=base+2500+(h>>8)%5000;if(m.oAt&&s.type!=='custom'&&(h>>12)%10<6)m.cAt=m.oAt+5000+(h>>16)%8000;}
    L.push(m);recs.push(m);if(via==='api'&&reach)gPostLink(m,s.th);
    [600,1700,(m.rAt||0)-at+100,(m.oAt||0)-at+100,(m.cAt||0)-at+100].forEach(d=>{if(d>0)setTimeout(waStatus,d);});});
  const names=list.map(gName),bT=s.b?W.T[tableAt(s.b,now())]:null,fail=recs.filter(m=>m.fail).length;
  log('Guest link '+(via==='api'?'sent on '+CH[ch].l:via==='copy'?'copied':via==='share'?'shared':'opened in WhatsApp'),LT[s.type].l+' to '+names.join(', ')+', from '+s.from.name);bump();
  if(via==='api'||via==='app')Chat.post('res',{n:me,r:ROLES[UI.role].label},'',{k:'link',tone:'neu',ic:'msg',title:LT[s.type].l+' sent · '+list.map(gi=>'{g:'+gi+'}').join(', '),sub:(bT?'{t:'+bT.id+'} · ':'')+'from '+s.from.name+' · '+(via==='api'?CH[ch].l:'WhatsApp app'),act:bT?{k:'table',v:bT.id}:null});
  if(via==='api'){haptic(15);const f0=recs.find(m=>m.fail);toast(fail?(fail===list.length?'Not sent. '+esc(f0.why)+'.':(list.length-fail)+' sent. '+fail+' not sent: '+esc(f0.why).toLowerCase()+'.'):(list.length>1?'Sending '+list.length+(recs.some(m=>m.tpl)?' templates':'')+' on '+CH[ch].l+'.':(recs.some(m=>m.tpl)?'Template sent to ':'Sent to ')+esc(names[0])+' on '+CH[ch].l+'.'));}
  waRepaint();return recs;}
function waStatus(){waRepaint();const o=Sheet.top();if(o&&(o.gp||o.chi||o.chs))Sheet.refresh(true);if(typeof Chat!=='undefined'&&Chat.visible())Chat.update();}
ON.sendLink=el=>{const gi=+el.dataset.g;openCompose({gi});};
ON.sendLinks=el=>{const b=bk(el.dataset.b),t=now(),gis=[b.booker].concat(b.seats.filter(x=>x.g>=0&&x.g!==b.booker&&x.cl&&x.cl<=t).map(x=>x.g));openCompose({gis:[...new Set(gis)],b});};
