'use strict';
/* ============================================================
   75 · GUEST PAYMENTS + EXPANDED GUEST PROFILE
   Every guest at a table carries their own payment status for
   this event: the deposit before doors, the bill on the night
   and after close. A table either has one payer (everyone else
   is covered) or splits, in which case each guest pays a share.
   ============================================================ */
const bSplit=b=>!b.comp&&!b.walk&&b.depPct>0&&b.party>=4&&h32(b.id+':split')%100<42;
const payerSeat=b=>{const i=b.seats.findIndex(x=>x.g===b.booker);return i>=0?i:0;};
function payState(b,i,t,ph){const r=payState0(b,i,t,ph);if(b.comp)return r;
  if(ph==='pre'&&!isOn('pay'))return {k:'mut',ic:'cloudoff',l:'—',s:waiting('pay')?'Awaiting Adyen':'Payments off'};
  if(ph!=='pre'&&/^Tab/.test(r.l)&&!isOn('pos'))return {k:'mut',ic:'cloudoff',l:'—',s:waiting('pos')?'Awaiting POS':'POS off'};
  if(ph!=='pre'&&/^Check/.test(r.l)&&!isOn('pos'))return {k:'mut',ic:'cloudoff',l:'—',s:waiting('pos')?'Awaiting POS':'POS off'};
  return r;}
function payState0(b,i,t,ph){const x=b.seats[i],sp=bSplit(b),pi=payerSeat(b),pn=esc(gName(b.booker).split(' ')[0]),hh=k=>h32(b.id+':'+i+':'+k);
  if(b.comp)return {k:'mut',ic:null,l:'Comp',s:'Nothing to pay'};
  if(ph==='pre'){if(!b.depPct)return {k:'mut',ic:null,l:'No deposit',s:'Pays on the night'};
    const dep=Math.round(b.min*b.depPct);
    if(!sp){if(i!==pi)return {k:'mut',ic:null,l:'Covered',s:'by '+pn};
      return b.depAt&&b.depAt<=t?{k:'ok',ic:'check',l:'Paid '+kfmt(dep),s:'Deposit, '+fDS(b.depAt)}:{k:'warn',ic:'clock',l:'Due '+kfmt(dep),s:'On the invitation, sent '+fAgo(t-b.at)};}
    const sh=Math.round(dep/b.party),cl=x.cl&&x.cl<=t;
    if(b.depAt&&b.depAt<=t)return cl?{k:'ok',ic:'check',l:'Paid '+kfmt(sh),s:'Deposit share'}:{k:'mut',ic:null,l:'Covered',s:pn+' paid this share'};
    if(!cl)return {k:'mut',ic:null,l:'Share '+kfmt(sh),s:'Seat not claimed'};
    const pa=x.cl+(hh('d')%40)*HOUR;if(hh('p')%10<7&&pa<=t)return {k:'ok',ic:'check',l:'Paid '+kfmt(sh),s:'Deposit share, '+fDS(pa)};
    return {k:'warn',ic:'clock',l:'Due '+kfmt(sh),s:'Deposit share not paid'};}
  const m=money(b,t),came=!!(x.ar&&x.ar<=t),anyone=b.seats.some(s=>s.ar&&s.ar<=t);
  if(ph==='post'&&!anyone)return i===pi?{k:'mut',ic:null,l:m.dep?'Deposit kept':'No-show',s:m.dep?kfmt(m.dep)+' retained':'Nothing charged'}:{k:'mut',ic:null,l:'Did not come',s:''};
  const closed=b.payAt&&b.payAt<=t;
  if(i===pi){if(closed)return {k:'ok',ic:'check',l:'Check closed',s:'POS · '+fT(b.payAt)};if(ph==='post')return {k:'warn',ic:'clock',l:'Check open',s:kfmt(m.balance)+' still to settle'};return {k:'neu',ic:'glass',l:'Check '+kfmt(m.spend),s:'Open in the POS'};}
  if(sp){const sh=Math.round(Math.round(b.min*b.depPct)/b.party),cl=x.cl&&x.cl<=t,paidSh=b.depAt&&b.depAt<=t?cl:cl&&hh('p')%10<7&&x.cl+(hh('d')%40)*HOUR<=t;
    if(!came)return {k:'mut',ic:null,l:ph==='post'?'Did not come':'Not in yet',s:paidSh?'Deposit share paid':''};
    return paidSh?{k:'ok',ic:'check',l:'Share '+kfmt(sh)+' paid',s:'Deposit, on their link'}:{k:'mut',ic:null,l:'On the table check',s:'Share not paid'};}
  return {k:'mut',ic:null,l:came?'On the table check':ph==='post'?'Did not come':'Covered',s:came?'':'by '+pn};}
function seatStatus(b,x,t,ph){const late=t>b.arriveBy+VENUE.graceMin*MIN;if(ph!=='pre'&&!isOn('scan'))return {c:x.cl?'cl':'un',l:'Arrival unknown'};
  if(ph==='pre')return x.cl&&x.cl<=t?{c:'cl',l:'Claimed'}:{c:'un',l:'Not claimed'};
  if(x.st&&x.st<=t)return {c:'se',l:'Seated '+fT(x.st)};if(x.ar&&x.ar<=t)return {c:'ar',l:'At the gate '+fT(x.ar)};
  if(late||ph==='post')return {c:'ns',l:ph==='post'?'Did not come':'No-show'};return {c:x.cl?'cl':'un',l:'Not arrived'};}
function payTag(ps){return '<span class="pay"><span class="pill '+ps.k+'">'+(ps.ic?I(ps.ic,12):'')+ps.l+'</span>'+(ps.s?'<em>'+ps.s+'</em>':'')+'</span>';}

/* past nights, from Season 2 records (seeded for this build) */
function guestHistory(gi){const g=W.guests[gi],h=k=>h32('hist'+gi+':'+k);if(!g.v)return {rows:[],s2:0,earlier:0,spend:0};
  const nights=[PAST[1],PAST[0],PAST[2]],s2=Math.min(9,g.crm===2?Math.max(1,Math.round(g.v*.55)):Math.min(g.v,1+h('c')%3)),rows=[];
  nights.forEach((e,i)=>{if(rows.length>=Math.min(3,s2)||h('n'+i)%10>=(g.crm===2?9:6))return;const tbl=g.crm===2||h('t'+i)%10<5,k=tbl?(g.crm===2?['vip','bsA','plat'][h('k'+i)%3]:['gold','silver','plat'][h('k'+i)%3]):null;
    rows.push({e,what:tbl?TIERS[k].label+' table':['Early entry','Second wave','VIP standing'][h('k'+i)%3],spend:tbl?Math.round(TIERS[k].min*(.95+(h('s'+i)%75)/100)/100)*100:[300,450,950][h('k'+i)%3],booked:tbl&&h('b'+i)%10<6});});
  const avg=rows.length?sum(rows,r=>r.spend)/rows.length:0;return {rows,s2,earlier:Math.max(0,g.v-s2),spend:Math.round(avg*s2/100)*100};}

function openGuest(gi){const gst=W.guests[gi];if(!gst)return;
  Sheet.open({gp:true,title:'Guest profile',sub:()=>esc(W.ev.short)+' · '+esc(VENUE.season),tall:true,
    body:()=>{const t=now(),ph=phase(),r=guestRecs(gi,t),full=canTables(),seat=r.seats[0],b=seat&&seat.b,si=b?b.seats.indexOf(seat):-1,hist=guestHistory(gi),rules=W.rules.filter(x=>x.a===gi||x.b===gi),with_=[];
      r.seats.forEach(s=>s.b.seats.forEach(o=>{if(o.g>=0&&o.g!==gi&&with_.length<8)with_.push(o.g);}));
      const visits=gst.v+(r.seats.length||r.tix.length?1:0),ssp=gst.ltv+hist.spend;
      let h='<div class="gp-hero"><div class="gp-av'+(gst.crm===2?' bl':'')+'">'+esc(initials(gst.n))+(gst.crm===2?'<i>'+I('star',11)+'</i>':'')+'</div><div class="gp-id"><h2>'+esc(gst.n)+'</h2>'+
        '<div class="gp-tags">'+tag(gst.crm===2?'neu':'mut',gst.crm===2?'star':null,crmLabel(gst))+tag('mut',null,gst.res?'UAE number':'International number')+'</div><span class="gp-ph n">'+esc(gst.ph||'No phone on file')+'</span></div></div>';
      h+='<div class="gp-stats"><div><b class="n">'+N(visits)+'</b><span>Visits</span></div>'+(full?'<div><b class="n">'+aedK(ssp)+'</b><span>Spent, two seasons</span></div><div><b class="n">'+(visits?aedK(ssp/Math.max(1,visits)):'—')+'</b><span>Per visit</span></div>':'<div><b class="n">'+N(hist.s2)+'</b><span>Last season</span></div><div><b>'+(gst.mk?'Yes':'No')+'</b><span>Opted in</span></div>')+'</div>';
      /* tonight */
      if(b){const T=W.T[tableAt(b,t)],ss=seatStatus(b,seat,t,ph),ps=full?payState(b,si,t,ph):null,steps=[['Claimed',seat.cl],['Through the gate',seat.ar],['Seated',seat.st]];
        h+='<div class="grp"><div class="lbl">'+(ph==='post'?'This event':'Tonight')+'</div><div class="gp-card hud"><div class="gp-tt">'+(full?'<button class="gold" data-act="table" data-id="'+T.id+'">'+esc(T.name)+'</button>':'<b>'+esc(T.name)+'</b>')+'<span>Seat '+N(seat.n)+' · '+(b.booker===gi?'Booker':'Guest of '+esc(gName(b.booker)))+' · host '+esc(b.host)+'</span></div>'+
          '<div class="gp-steps">'+steps.map(st=>'<div class="'+(st[1]&&st[1]<=t?'on':'')+'"><i></i><b>'+st[0]+'</b><span class="n">'+(st[1]&&st[1]<=t?(st[0]==='Claimed'?fDS(st[1]):fT(st[1])):'—')+'</span></div>').join('')+'</div>'+
          (ps?'<div class="gp-pay"><span>'+(ph==='pre'?'Deposit':'Bill')+'</span>'+payTag(ps)+'</div>':'')+'</div>';
        if(ph==='live'){const acts=[];if(ss.c==='ar'&&can('seat'))acts.push('<button class="btn ok" data-act="seatOne" data-r="'+seat.ref+'">'+I('check',16)+'Seat now</button>');else if((ss.c==='cl'||ss.c==='un')&&seat.g>=0&&can('seat'))acts.push('<button class="btn" data-act="seatOne" data-r="'+seat.ref+'">'+I('check',16)+'Arrived, seat now</button>');
          if(acts.length)h+='<div class="btnrow">'+acts.join('')+'</div>';}
        if(full&&UI.flags.posSeat&&ph!=='pre'){const od=b.orders.filter(o=>o.seat===si&&o.at<=t);if(od.length)h+='<div class="rows">'+od.slice(-5).reverse().map(o=>row('glass','',esc(o.nm),N(fT(o.at))+(o.del&&o.del<=t?' · delivered':' · on its way'),'<b class="n">'+(o.comp?'0':kfmt(o.amt))+'</b>')).join('')+'</div>';}
        h+='</div>';}
      else if(r.tix.length){const x=r.tix[0];h+='<div class="grp"><div class="lbl">Tonight</div><div class="gp-card hud"><div class="gp-tt"><b>'+['Early entry','Second wave','VIP standing','Door ticket','Guest list','Promoter list'][x.k]+'</b><span class="n">'+esc(x.ref)+' · '+esc(SRC[x.s].label)+'</span></div><div class="gp-pay"><span>Entry</span>'+(x.sc&&x.sc<=t?tag('ok','check','In at '+fT(x.sc)):tag('mut',null,ph==='post'?'Did not come':'Not in yet'))+'</div></div></div>';}
      if(gst.prefs)h+='<div class="grp"><div class="lbl">Preferences</div>'+gst.prefs.map(p=>'<div class="banner neu">'+I('star',16)+'<span>'+esc(p)+'</span></div>').join('')+'</div>';
      if(rules.length)h+='<div class="grp"><div class="lbl">Seating rules</div>'+rules.map(x=>'<div class="banner '+(x.kind==='apart'?'warn':'ok')+'">'+I(x.kind==='apart'?'alert':'users',16)+'<span><b>'+(x.kind==='apart'?'Keep apart from ':'Seat near ')+esc(gName(x.a===gi?x.b:x.a))+'</b><br>'+esc(x.why)+'</span></div>').join('')+'</div>';
      if(with_.length)h+='<div class="grp"><div class="lbl">At the table with</div><div class="gp-with">'+with_.map(i=>'<button data-act="guest" data-g="'+i+'"><span class="gp-mini">'+esc(initials(W.guests[i].n))+'</span>'+esc(W.guests[i].n.split(' ')[0])+'</button>').join('')+'</div></div>';
      h+='<div class="grp"><div class="lbl">History</div>'+(!isOn('hist')?'<p class="note">Past visits show once past season records are imported.</p>':hist.rows.length?'<div class="rows">'+hist.rows.map(x=>row(x.what.includes('table')?'floor':'scan','',esc(x.e.name),esc(x.e.date)+' · '+esc(x.what)+(x.booked?' · booker':''),full?'<b class="n">'+aedK(x.spend)+'</b>':'')).join('')+'</div>'+
        '<p class="note">'+N(hist.s2)+' '+pl(hist.s2,'night')+' in past seasons'+(hist.earlier?', '+N(hist.earlier)+' before that':'')+'. From past season records.</p>':'<p class="note">First time at Ushuaïa Dubai Harbour.</p>')+'</div>';
      {gchSeed();const ws=(W.wa||[]).filter(m=>m.gi===gi&&m.at<=now()).slice(-5).reverse();if(ws.length)h+='<div class="grp"><div class="lbl">Links sent</div><div class="rows">'+ws.map(waRow).join('')+'</div></div>';}
      h+='<div class="grp"><div class="lbl">Host notes</div>'+((gst.notes||[]).map(nt=>'<div class="banner"><span>'+esc(nt.txt)+'<br><span class="mut">'+esc(nt.by)+', '+N(fDT(nt.at))+'</span></span></div>').join('')||'<p class="note">No notes yet.</p>')+
        '<div style="display:flex;gap:8px"><input class="inp" id="gnote" placeholder="Add a note for next time"><button class="btn pri" data-act="addNote" data-g="'+gi+'" aria-label="Save note">'+I('check',18)+'</button></div></div>';
      h+='<div class="gp-cons">'+(gst.mk?tag('mut','check','Opted in to marketing on their invitation'):tag('mut','x','No marketing opt-in: booking messages only'))+'</div>';
      return h;},
    foot:()=>(canTables()||UI.role==='door'?'<button class="btn pri full" data-act="sendLink" data-g="'+gi+'">'+I('send',18)+'Send a link</button>':'')+'<div class="btnrow">'+(canGuestChat()?'<button class="btn sm" data-act="gChat" data-g="'+gi+'">'+I('msg',16)+'Message</button>':'<button class="btn sm" data-act="gWa" data-g="'+gi+'">'+I('msg',16)+'WhatsApp</button>')+'<button class="btn sm" data-act="gCall" data-g="'+gi+'">'+I('phone',16)+'Call</button></div>'});}
ON.gWa=el=>{const gi=+el.dataset.g;if(!waDigits(gi)){toast('No WhatsApp number on file.');return;}openWA(gi,'Hi '+G(gi).n.split(' ')[0]+', ');};
ON.gMsg=el=>toast('Opens WhatsApp to '+esc(W.guests[+el.dataset.g].n)+'. Messages are logged to the guest.');
ON.gCall=el=>toast('Calls '+esc(W.guests[+el.dataset.g].n)+' through the venue line.');

/* 78 · QR encoder, shared with the guest app (byte mode, ECC M, v1-10) */
const QR=(function(){
  const ECC=[0,10,16,26,18,24,16,18,22,22,26],BLK=[0,1,1,1,2,2,4,4,4,5,5];
  function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x;}return z&255;}
  function rsDiv(d){const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<d;j++){r[j]=mul(r[j],root);if(j+1<d)r[j]^=r[j+1];}root=mul(root,2);}return r;}
  function rsRem(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=mul(c,f);});}return r;}
  function rawMods(v){let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36;}return r;}
  function dataCw(v){return Math.floor(rawMods(v)/8)-ECC[v]*BLK[v];}
  function alignPos(v,size){if(v===1)return[];const n=Math.floor(v/7)+2,step=Math.ceil((v*4+4)/(n*2-2))*2,res=[6];for(let p=size-7;res.length<n;p-=step)res.splice(1,0,p);return res;}
  function encode(text){
    const bytes=Array.from(new TextEncoder().encode(text));
    let v=1;for(;v<=10;v++){const cc=v<10?8:16;if(4+cc+bytes.length*8<=dataCw(v)*8)break;}
    if(v>10)throw new Error('too long');
    const cc=v<10?8:16,bits=[];const push=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1);};
    push(4,4);push(bytes.length,cc);bytes.forEach(b=>push(b,8));
    const cap=dataCw(v)*8;push(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
    for(let pad=0xEC;bits.length<cap;pad^=0xEC^0x11)push(pad,8);
    const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b);}
    /* ecc + interleave */
    const nb=BLK[v],el=ECC[v],raw=Math.floor(rawMods(v)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb),div=rsDiv(el),blocks=[];
    for(let i=0,k=0;i<nb;i++){const dat=data.slice(k,k+shortLen-el+(i<nShort?0:1));k+=dat.length;const e=rsRem(dat,div);if(i<nShort)dat.push(0);blocks.push(dat.concat(e));}
    const cw=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-el||j>=nShort)cw.push(b[i]);});
    const size=v*4+17,M=[],F=[];for(let y=0;y<size;y++){M.push(new Array(size).fill(false));F.push(new Array(size).fill(false));}
    const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true;};
    for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
    const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!==2&&d!==4);}};
    finder(3,3);finder(size-4,3);finder(3,size-4);
    const ap=alignPos(v,size),na=ap.length;
    for(let i=0;i<na;i++)for(let j=0;j<na;j++){if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);}
    const fmt=(mask)=>{const d=(0<<3)|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412,g=i=>((b>>>i)&1)===1;
      for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
      for(let i=0;i<8;i++)set(size-1-i,8,g(i));for(let i=8;i<15;i++)set(8,size-15+i,g(i));set(8,size-8,true);};
    fmt(0);
    if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(v<<12)|r;for(let i=0;i<18;i++){const bit=((b>>>i)&1)===1,a=size-11+i%3,c=Math.floor(i/3);set(a,c,bit);set(c,a,bit);}}
    /* codewords */
    let i=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;if(!F[y][x]&&i<cw.length*8){M[y][x]=((cw[i>>>3]>>>(7-(i&7)))&1)===1;i++;}}}
    const maskFn=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
    const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&maskFn[m](x,y))M[y][x]=!M[y][x];};
    const penalty=()=>{let p=0,dark=0;
      for(let y=0;y<size;y++){let run=1;for(let x=1;x<=size;x++){if(x<size&&M[y][x]===M[y][x-1])run++;else{if(run>=5)p+=run-2;run=1;}}}
      for(let x=0;x<size;x++){let run=1;for(let y=1;y<=size;y++){if(y<size&&M[y][x]===M[y-1][x])run++;else{if(run>=5)p+=run-2;run=1;}}}
      for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3;}
      for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(M[y][x])dark++;
      p+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;return p;};
    let best=0,bp=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const pp=penalty();if(pp<bp){bp=pp;best=m;}apply(m);}
    apply(best);fmt(best);
    return {size,M};
  }
  function svg(text,px){const {size,M}=encode(text),q=4,n=size+q*2;let d='';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(M[y][x])d+=`M${x+q} ${y+q}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n} ${n}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="Ticket QR code"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;}
  return {encode,svg};
})();
