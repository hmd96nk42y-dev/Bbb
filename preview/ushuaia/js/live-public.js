/* Public tables, for real (test and live mode): where the screens' facts come from.
   Sk's public-table sheets (public-tables.js) are drawn from one object, "the engine". In demo mode that is his
   BUBLSocial module, which makes everything up. Here is the same object with nothing made up: every fact in it is
   asked of BUBL's back end (supabase/functions/public-tables), and every button on the sheets is sent there.
     - the tables open tonight, best match first, with what is left to cover, the group's counts and the closing time;
     - my own request at each: waiting, accepted (card due), on the table, confirmed;
     - my own table when I am a host: its cover, its requests with each guest's ranges, match, offer and social link;
     - my bubl account, read back, so nobody is asked the questions twice.
   What a guest is never given, because the back end never sends it: another guest's offer, anyone's name before a
   seat is confirmed, anyone's exact age. */
const LP=(function(){
  const tz=()=>PAGE.venue.timezone||'UTC';
  const hm=iso=>{try{return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz()}).format(new Date(iso));}catch(_){return '';}};
  const minsTo=iso=>Math.max(0,Math.round((Date.parse(iso)-Date.now())/60000));
  const cap1=s=>s?s[0].toUpperCase()+s.slice(1):'';
  /* a group as the sheets draw it: one letter per person. Where the host has not said who is in their group, no letters. */
  const groupArr=g=>g&&g.men!=null&&g.women!=null?Array(g.men).fill('M').concat(Array(g.women).fill('F')):Array(g?g.size:0).fill('');
  const person=r=>r?{g:r.gender||'',band:r.age||'',age:null,ind:r.industry||'',nat:r.nationality||'',hob:r.hobbies||[],name:''}:{g:'',band:'',age:null,ind:'',nat:'',hob:[],name:''};
  const socialText=s=>s&&s.handle?`${cap1(s.network||'Instagram')} @${String(s.handle).replace(/^@/,'')}`:'';
  const KEY='bubl.public.asked';
  const asked=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(_){return [];}};
  const remember=id=>{try{const a=asked().filter(x=>x!==id);a.unshift(id);localStorage.setItem(KEY,JSON.stringify(a.slice(0,30)));}catch(_){}};
  const forget=id=>{try{localStorage.setItem(KEY,JSON.stringify(asked().filter(x=>x!==id)));}catch(_){}};

  let onChange=()=>{},timer=null,busy=false,night=null,signedIn=false;
  const eng={live:true,S:{acct:null,pubReq:{},requests:{}},data:{publics:[],bubls:[],myTable:null},booking:null,cfg:{closeOptions:[],demo:false},_me:null,ready:false,
    me(){return this._me;},
    tables(){return this.data.publics.map(p=>({table:p.table,type:'public'}));},
    glowFor(id){const M=this.data.myTable;return (M&&M.isPublic&&M.table===id)||this.data.publics.some(p=>p.table===id)?'public':null;},
    changed(){onChange();},setBooking(b){this.booking=b;},update(){},render(){},simulateRequests(){}};

  /* ---- my bubl account ---- */
  async function account(){
    const phone=await BUBL.auth.phone();signedIn=!!phone;
    if(!signedIn){eng.S.acct=null;eng._me=null;return null;}
    const r=await BUBL.social('my-profile',{});
    if(!r.ok||!r.account){eng.S.acct=null;eng._me=null;return null;}
    const a=r.account.answers;
    eng._me={g:a.gender,age:a.age,nat:a.nationality,ind:a.industry,hob:a.hobbies||[]};
    eng.S.acct={first:(S.guestName||'').split(' ')[0],social:socialText(r.account.social),verified:true,answers:a,socialRaw:r.account.social||null};
    return eng._me;
  }

  /* ---- one table, as a guest may see it ---- */
  function fromList(t){return {id:t.booking_id,table:t.table.key,host:Object.assign(person(t.host_ranges),{match:t.match||null}),min:t.minimum_minor,
    paid:t.minimum_minor-t.uncovered_minor>0?[t.minimum_minor-t.uncovered_minor]:[],group:groupArr(t.group),noGender:!t.group||t.group.men==null,
    cap:t.group?t.group.seats:0,closes:hm(t.cutoff_at),left:minsTo(t.cutoff_at),cutoffAt:t.cutoff_at,feePct:null,confirmed:false,members:null};}
  function applyView(p,v){
    p.min=v.minimum_minor;p.paid=v.minimum_minor-v.uncovered_minor>0?[v.minimum_minor-v.uncovered_minor]:[];
    if(v.group){p.group=groupArr(v.group);p.noGender=v.group.men==null;p.cap=v.group.seats;}
    p.closes=hm(v.cutoff_at);p.left=minsTo(v.cutoff_at);p.cutoffAt=v.cutoff_at;p.feePct=v.fee_pct;p.confirmed=v.public_state==='confirmed';
    if(v.host_ranges)Object.assign(p.host,person(v.host_ranges),{match:p.host.match});
    p.members=v.members||null;
    if(p.members){const h=p.members.find(m=>m.host);if(h)p.host.name=(h.full_name||'').split(' ')[0];}
    const r=v.my_request,st=r&&{pending:'pending',accepted:'acc',secured:p.confirmed?'charged':'in'}[r.state];
    if(st){eng.S.pubReq[p.id]={state:st,offer:r.offer_minor||0,exp:r.expires_at?Date.parse(r.expires_at):0,cardDue:r.card_due_at?Date.parse(r.card_due_at):0,id:r.request_id,seat:r.seat_no||null};
      if(r.match)p.host.match=r.match;}
    else{delete eng.S.pubReq[p.id];if(r)forget(p.id);}
  }
  /* ---- my own table, as its host ---- */
  function fromHost(v,tableKey){const b=v.booking,reqs=(v.requests||[]).filter(r=>r.kind==='seat');
    const offers=reqs.filter(r=>r.state==='secured'&&r.offer_minor>0).map(r=>r.offer_minor),own=Math.max(0,b.covered_minor-offers.reduce((a,x)=>a+x,0));
    const inG=reqs.filter(r=>r.state==='secured').map(r=>(r.ranges&&r.ranges.gender)||''),g=b.group||{size:b.seats_taken,seats:b.seat_limit,men:null,women:null};
    const ownMen=g.men==null?null:g.men-inG.filter(x=>x==='M').length,ownWomen=g.women==null?null:g.women-inG.filter(x=>x==='F').length;
    const ownArr=ownMen==null?Array(Math.max(1,g.size-inG.length)).fill(''):Array(ownMen).fill('M').concat(Array(ownWomen).fill('F'));
    return {table:tableKey,bookingId:b.id,min:b.minimum_minor,isPublic:b.public_state==='open'||b.public_state==='confirmed',confirmed:b.public_state==='confirmed',
      ownN:ownArr.length,ownPaid:own,paid:(own?[own]:[]).concat(offers),group:ownArr.concat(inG),noGender:g.men==null,cap:g.seats,spots:b.spots,
      closes:hm(b.cutoff_at),left:minsTo(b.cutoff_at),cutoffAt:b.cutoff_at,members:v.members||null,
      requests:reqs.map(r=>Object.assign(person(r.ranges),{id:r.request_id,state:{pending:'new',accepted:'acc',secured:'held'}[r.state],handle:socialText(r.social),
        name:r.full_name?r.full_name.split(' ')[0]:'',party:[(r.ranges&&r.ranges.gender)||''],offer:r.offer_minor||0,exp:r.expires_at?Date.parse(r.expires_at):0,match:r.match||null}))};}

  /* ---- everything, asked again ---- */
  async function refresh(){
    if(busy||!S.ev)return;busy=true;
    try{
      const ev=S.ev.id;if(night!==ev){night=ev;eng.data.publics=[];eng.S.pubReq={};eng.data.myTable=null;}
      await account();
      if(signedIn){
        const r=await BUBL.social('tables',{venue:BUBL.venueSlug,service:ev});if(S.ev.id!==ev)return;
        const list=r.ok?r.tables.map(fromList):eng.data.publics,known=new Set(list.map(p=>p.id));
        /* a table I asked at can have left the list (it filled up, or closed): it is still mine to see */
        const mine=asked().filter(id=>!known.has(id));
        const views=await Promise.all(list.map(p=>p.id).concat(mine).filter(id=>eng.S.pubReq[id]||asked().includes(id)).map(async id=>[id,await BUBL.social('view',{booking_id:id})]));
        if(S.ev.id!==ev)return;
        views.forEach(([id,v])=>{let p=list.find(x=>x.id===id);
          if(!v.ok){if(v.code==='not_public'||v.code==='not_found'){forget(id);delete eng.S.pubReq[id];}return;}
          if(!p){if(!T(v.table.key)||v.night!==S.ev.head&&v.night!==S.ev.short)return;p={id,table:v.table.key,host:person(v.host_ranges),min:0,paid:[],group:[],cap:0,closes:'',left:0};list.push(p);}
          applyView(p,v);});
        eng.data.publics=list.filter(p=>T(p.table));
        /* my own table */
        if(typeof MINE!=='undefined'&&MINE.id&&S.boothId){const h=await BUBL.social('host-view',{booking_id:MINE.id});
          eng.data.myTable=h.ok&&(h.booking.public_state==='open'||h.booking.public_state==='confirmed')?fromHost(h,S.boothId):null;}
        else eng.data.myTable=null;
      }else{eng.data.publics=[];eng.S.pubReq={};eng.data.myTable=null;}
      eng.ready=true;
    }finally{busy=false;}
    onChange();
  }
  function start(cb){onChange=cb;clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&signedIn)refresh();},10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});return eng;}

  /* ---- the link a host shares: this page's own address, at that table ---- */
  const shareUrl=id=>{const u=new URL('./',location.href);u.search='?t='+encodeURIComponent(id);u.hash='';return u.host+u.pathname+u.search;};
  const sharedId=()=>{try{const t=new URLSearchParams(location.search).get('t');return /^[0-9a-f-]{36}$/i.test(t||'')?t:null;}catch(_){return null;}};

  return {eng,start,refresh,account,remember,forget,shareUrl,sharedId,hm,socialText,signedIn:()=>signedIn};
})();
