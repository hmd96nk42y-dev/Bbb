/* ================= tickets · the season's door prices ================= */
const VENUE_WA='+971 50 000 0000';            /* Ushuaïa WhatsApp — replace with the venue line */
const tix={q:[0,0,0],done:null,edit:null,earned:0,party:null};
function earlyOk(){return true;}
function tixCalc(){let total=0,n=0;GA.forEach((g,i)=>{if(i===0&&!earlyOk())return;total+=tix.q[i]*g[2];n+=tix.q[i];});return {total,n};}

/* QR encoder (byte mode, ECC M, v1–10) — verified to scan */
/* Minimal QR encoder: byte mode, ECC level M, versions 1–10, penalty-scored mask. After Nayuki's reference design. */
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

const TIXB={name:'',phone:''};
function tixStep(){if(tix.edit)return tix.edit;return !S.date?'date':null;}
function syncPagePickers(){
  if(S.ev){$$('#dateRow .dcard').forEach(x=>x.classList.toggle('sel',x.dataset.k===S.date));setLbl('#pkDate',S.ev.short);}
  if(S.time){$$('.tpill').forEach(x=>x.classList.toggle('sel',x.textContent===S.time));setLbl('#pkTime',S.time);}
  if(tix.party){$$('.ppill').forEach(x=>x.classList.toggle('sel',x.textContent===String(tix.party)));}
}
function renderTixPick(step){
  const labels={date:'Choose your night',time:'Choose your arrival',party:'How many of you'};
  const dots=['date','time','party'].map(k=>`<i class="${k===step?'on':((k==='date'&&S.date)||(k==='time'&&S.time)||(k==='party'&&tix.party))?'done':''}"></i>`).join('');
  $('#tixHead').innerHTML=`<span class="tier vvip" style="color:var(--acc)"><i></i>Entry</span><h3>Tickets</h3><div class="tpk-dots">${dots}<span>${labels[step]}</span></div>`;
  let html='';
  if(step==='date'){html='<div class="tpk-grid">'+EVENTS.map(ev=>{const d=dOf(ev.k);return `<button class="dcard${S.date===ev.k?' sel':''}" data-v="${ev.k}" type="button" style="--ea:${ev.acc}"><span class="dow">${DOWS[d.getDay()]}</span><span class="dom">${d.getDate()}</span><span class="mon">${MONS[d.getMonth()].toUpperCase()}</span><span class="nm">${esc(ev.short)}</span></button>`;}).join('')+'</div>';}
  else if(step==='time'){html='<div class="tmrow">'+slotsFor(S.ev).map(t=>`<button class="tpill${S.time===t?' sel':''}" data-v="${t}" type="button">${t}</button>`).join('')+`</div><p class="pkhint" style="margin-top:10px">Doors ${S.ev.doors}.${LIVE?((S.ev.ga||[]).filter(t=>t.valid_until).map(t=>` ${esc(t.label)} is before ${esc(t.valid_until)}.`)[0]||''):' Early entry is before 22:00.'}</p>`;}
  else{html='<div class="prow">';for(let n=1;n<=12;n++)html+=`<button class="ppill${tix.party===n?' sel':''}" data-v="${n}" type="button">${n}</button>`;html+='</div>';}
  $('#tixBody').innerHTML=`<div class="tpk">${html}</div>`;
  $$('#tixBody [data-v]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.v;
    if(step==='date'){applyEvent(EVK[v]);}else if(step==='time')S.time=v;else tix.party=+v;
    b.classList.add('sel');syncPagePickers();afterPick();
    const order=['date','time','party'],ni=order.indexOf(step);
    tix.edit=tix.edit&&ni<2?order[ni+1]:null;
    setTimeout(renderTix,140);}));
}
function renderTix(){
  if(LIVE)return renderTixLive();   /* live: the venue's own tickets and prices, a real payment, a real QR (live-tickets.js) */
  const step=tixStep();if(step){renderTixPick(step);return;}
  const ev=S.ev,eo=earlyOk();
  if(!tix.q[0]&&!tix.q[1]&&!tix.q[2]){if(eo)tix.q[0]=1;else tix.q[1]=1;}
  if(!eo&&tix.q[0]){tix.q[1]+=tix.q[0];tix.q[0]=0;}
  const c=tixCalc();
  $('#tixHead').innerHTML=`<span class="tier vvip" style="color:var(--acc)"><i></i>Entry</span><h3>${esc(ev.short)}</h3><div class="dj-sub" style="margin-top:6px">${fmtD(dOf(S.date))}, doors ${ev.doors}${tix.done?'':' <button class="tpk-chg" id="tkChg" type="button">Change</button>'}</div>`;
  const chg=$('#tkChg');if(chg)chg.addEventListener('click',()=>{tix.edit='date';renderTix();});
  if(tix.done){
    const url=`https://bubl.app/ushuaia-dxb/t/${tix.done}`,share=`bubl.app/ushuaia-dxb/n/${S.date}?ref=${tix.done}`,n=c.n;
    const parts=GA.map((g,i)=>tix.q[i]?`${tix.q[i]} \u00d7 ${g[0]}`:'').filter(Boolean).join(', ');
    $('#tixBody').innerHTML=`
    <div class="tkt${tix.q[2]?' gild':''} done"><span class="grid"></span>
      <div class="tkt-main"><div class="tkt-top"><span class="tkt-ic">${tix.q[2]?'V':'GA'}</span><span class="tkt-name">Admit ${n}</span></div>
        <div class="dj-sub" style="margin-top:6px;color:rgba(255,255,255,.8)">${esc(ev.short)}, ${fmtD(dOf(S.date))}, doors ${ev.doors}</div>
        <span class="tk-qr">${QR.svg(url,150)}</span>
        <div class="tk-ref">REF ${tix.done}</div>
        <ul><li><i></i><span>${esc(parts)}.</span></li>
        <li><i></i><span>Show this at the door with your original Emirates ID or passport. 21+, no re-entry.</span></li></ul></div>
      <div class="tkt-stub"><span class="tkt-adm">USHUA\u00cfA</span><span class="tkt-adm">ENTRY</span></div>
    </div>
    <div class="tk-share"><b class="h">Share this night</b>
      <p>Send your link for ${esc(ev.short)}. Every ticket bought through it is a free drink for you.</p>
      <div class="lbox"><span class="lk">${share}</span><button class="lcpy" id="tkCopy" type="button" aria-label="Copy link"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="13" rx="1"/><path d="M5 16V5a2 2 0 012-2h9"/></svg></button></div>
      <div class="srow" style="grid-template-columns:1fr 1fr"><button class="sbtn pri" id="tkShare" type="button">Share link</button><button class="sbtn" id="tkWA" type="button">WhatsApp</button></div>
      <p class="tk-earn" id="tkEarn">${tix.earned?`${tix.earned} free drink${tix.earned===1?'':'s'} earned so far`:'No tickets through your link yet'}</p>
    </div>
    <button class="btn pri full" id="tkDone" type="button" style="margin-top:14px">Done</button>`;
    const cp=()=>{try{navigator.clipboard&&navigator.clipboard.writeText('https://'+share);}catch(_){}toast('Link copied');};
    $('#tkCopy').addEventListener('click',cp);
    $('#tkShare').addEventListener('click',()=>{if(navigator.share){navigator.share({title:'Ushua\u00efa',text:`${ev.short} at Ushua\u00efa, ${fmtD(dOf(S.date))}`,url:'https://'+share}).catch(()=>{});}else cp();});
    $('#tkWA').addEventListener('click',()=>toast('Opening WhatsApp'));
    $('#tkDone').addEventListener('click',()=>closeSheet());return;}
  const card=(i,cls,ic,lis,off)=>{const g=GA[i];return `<div class="tkt ${cls}"><span class="grid"></span>
    <div class="tkt-main">
      <div class="tkt-top"><span class="tkt-ic">${ic}</span><span class="tkt-name">${g[0]}</span></div>
      <div class="tkt-price"><b>${AED(g[2])}</b><span>${g[1]}</span></div>
      <ul>${lis.map(l=>`<li class="${off?'off':''}"><i></i><span>${l}</span></li>`).join('')}</ul>
      ${off?'<p class="tk-h">Your arrival is after 22:00, so this one is off.</p>':''}
    </div>
    <div class="tkt-stub"><span class="tkt-adm">ADMIT</span><div class="vstep tk-one"><button type="button" data-i="${i}" data-d="1" ${off||tix.q[i]?'disabled':''} aria-label="Choose this ticket">${tix.q[i]?'\u2713':'+'}</button><b>${tix.q[i]}</b></div></div>
  </div>`;};
  $('#tixBody').innerHTML=
    card(0,'','GA',['General admission, standing','Entry <b>before 22:00</b> only'],!eo)+
    card(1,'ember','GA',['General admission, standing','Entry any time from doors'],false)+
    card(2,'gild','V',['Standing in the VIP area','Entry any time from doors'],false)+
    `<div class="tk-sum"><b>${c.total?AED(c.total):'AED 0'}</b><span>One per person<br>21+, original ID</span></div><p class="tk-one-note">Friends buy their own with your link after you check out.</p>
    <button class="btn red full" id="tkBuy" type="button" ${c.n?'':'disabled'}>Buy tickets, ${AED(c.total)}</button>`;
  $$('#tixBody .vstep button').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.i;tix.q=[0,0,0];tix.q[i]=1;renderTix();}));   /* one ticket per person: choosing a type swaps it */
  $('#tkBuy').addEventListener('click',()=>openDetails({title:'Tickets',sub:`${ev.short}, ${fmtD(dOf(S.date))}, admit ${c.n}`,name:TIXB.name,phone:TIXB.phone,onDone:(nm,ph)=>{TIXB.name=nm;TIXB.phone=ph;openPay({amount:c.total,title:'Tickets',sub:`${nm.split(' ')[0]}, ${ev.short}, admit ${c.n}`,onDone:()=>{tix.done='US-'+String(h32(S.date+S.time+tix.q.join('.'))%9000+1000);tix.earned=0;flash();renderTix();
    const n=c.n;
    setTimeout(()=>{
      $('#smsLine').textContent=`Ushua\u00efa: your tickets are confirmed. ${ev.short}, ${fmtD(dOf(S.date))}, ${S.time}, admit ${n}.`;
      $('#confSumm').innerHTML=`Your ticket: <u>bubl.app/ushuaia-dxb/t/${tix.done}</u>`;
      window.__nbAction=()=>{if(openSheetEl!==$('#tixSheet'))openTix(true);};
      showSmsBanner();
    },1100);
    setTimeout(()=>{try{closeSheet();}catch(_){}showTixBlock(n);},1700);   /* back to the main screen, with the ticket holder's panel */
  }})}}));
}
function openTix(keep){
  tix.edit=null;
  if(!keep&&!LIVE)tix.done=null;renderTix();openSheet($('#tixSheet'));if(LIVE)tkRefresh().then(()=>{if(openSheetEl===$('#tixSheet'))renderTix();});   /* live: a ticket once bought stays; the prices are asked for again */
}
$('#buyTix').addEventListener('click',()=>{
  if(tix.done){const b=$('#tixBlock'),a=$('#app');if(b&&!b.hidden&&a)a.scrollTo({top:Math.max(0,b.offsetTop-70),behavior:'smooth'});toast(LIVE?'One ticket per person.':'One ticket per person. Share your link and friends buy their own.');return;}   /* you already have yours */
  S.tixMode=true;closePicker();openTix();          /* opens in place: the page doesn't move and the room pauses behind it */
});
/* WhatsApp: straight into a chat with the venue */
$('#waNum').textContent=VENUE_WA;
$('#waBox').addEventListener('click',e=>{e.preventDefault();const n=VENUE_WA.replace(/\D/g,'');try{window.open('https://wa.me/'+n,'_blank');}catch(_){}toast('Opening WhatsApp');});
/* invite card: the night so far, and a live countdown to arrival */
function arrivalAt(){const k=S.date||roomNight(),t=S.time||'23:30';const [h,m]=t.split(':').map(Number);const d=dOf(k);d.setHours(h,m,0,0);if(h<12)d.setDate(d.getDate()+1);return d;}
function fillIpInt(el){
  if(el.__on)return;el.__on=1;
  const k=S.date||roomNight(),n=120+h32(k)%380;
  const shown=INT_SEED.slice().sort((a,b)=>(h32(a+k)%100)-(h32(b+k)%100)).slice(0,8);
  el.innerHTML=`<div class="ip-thd"><b>Interested</b><span>${n} for ${fmtD(dOf(k))}</span></div>
  <div class="intr-wall" style="margin-top:10px">${shown.map(h=>`<span class="ih can"><i style="background:${AVC[h32(h)%AVC.length]}">${esc(h[0].toUpperCase())}</i>@${esc(h)}<button class="ihv" data-h="${esc(h)}" type="button">Invite</button></span>`).join('')}<span class="ih more">and ${n-shown.length} more</span></div>
  <p class="intr-foot">Invites from guests go to ${esc((S.guestName||'Sam').split(' ')[0])}, the host, to confirm.</p>`;
  el.querySelectorAll('.ihv').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;b.disabled=true;b.textContent='Waiting for host';b.classList.add('wait');toast('Waiting for the host\u2019s confirmation');}));
}
function fillIpNight(el){
  if(el.__on)return;el.__on=1;
  const k=S.date||roomNight(),st=nightStats(k,S.time||viewTime());
  el.innerHTML=`<div class="ipn-stats"><div><b>${st.pct}%</b><span>Tables booked</span></div>${st.floor==null?'':`<div><b>${st.floor}</b><span>On the floor</span></div><div><b>${st.intr}</b><span>Interested</span></div>`}</div>
  <div class="ipn-cd" role="timer" aria-live="off"><small>Your night starts in</small><div class="ipn-clock"><div><b data-u="h">00</b><i>days</i></div><em>:</em><div><b data-u="m">00</b><i>hours</i></div><em>:</em><div><b data-u="s">00</b><i>min</i></div></div><button type="button" class="ip-claimbtn"><span>Claim your seat</span></button></div>`;
  const H=el.querySelector('[data-u=h]'),Mi=el.querySelector('[data-u=m]'),Se=el.querySelector('[data-u=s]'),target=arrivalAt().getTime();
  const tick=()=>{if(!el.isConnected){clearInterval(iv);return;}let d=Math.max(0,Math.floor((target-Date.now())/1000));
    if(!d){el.querySelector('.ipn-cd small').textContent='Doors are open';}
    const dd=Math.floor(d/86400),hh=Math.floor(d%86400/3600),mm=Math.floor(d%3600/60);H.textContent=String(dd).padStart(2,'0');Mi.textContent=String(hh).padStart(2,'0');Se.textContent=String(mm).padStart(2,'0');};
  const iv=setInterval(tick,1000);tick();
}
