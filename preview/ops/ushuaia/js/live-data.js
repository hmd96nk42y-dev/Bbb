'use strict';
/* ============================================================
   LIVE DATA · loaded in test and live mode only (in place of js/demo-data.js)
   The venue's own facts, as BUBL's back end holds them for the person
   signed in (BUBL.night, BUBL.staff), given the names Sk's build reads
   in "10 · venue + season configuration".
   What the venue has not supplied is simply empty here: no past
   seasons, no targets, no staff plan, no cost list, no menu, no made-up
   people. Nothing is filled in.
   ============================================================ */
/* Amounts arrive in minor units (fils). The build draws whole dirhams; this is for drawing only.
   Anything sent back to BUBL is sent in minor units again (js/live-actions.js). */
const fromMinor=m=>m==null?null:Number(m)/100,toMinor=a=>Math.round(Number(a)*100);
const OPS_LIVE=(function(){
  const N=BUBL.night,ME=BUBL.staff,V=N.venue,tz=V.timezone||'Asia/Dubai';
  const local=(iso,opt)=>new Intl.DateTimeFormat('en-CA',Object.assign({timeZone:tz,hour12:false},opt)).format(new Date(iso));
  /* how this skin draws each tier: its short name, its colour group and the size of its tables on the plan.
     The tier's name, capacity and price are the venue's own. */
  const LOOK={bsA:{short:'BS·A',grp:'bs',w:13,h:10},bsB:{short:'BS·B',grp:'bs',w:13,h:10},bsC:{short:'BS·C',grp:'bs',w:13,h:10},
    vip:{short:'VIP',grp:'vip',w:23,h:14},plat:{short:'PLAT',grp:'plat',w:23,h:14},gold:{short:'GOLD',grp:'gold',w:22,h:13},silver:{short:'SILV',grp:'silver',w:15,h:11}};
  const TIERS={};N.tiers.forEach(t=>{const l=LOOK[t.key]||{short:String(t.label).slice(0,4).toUpperCase(),grp:'silver',w:22,h:13};
    TIERS[t.key]={label:t.label,short:l.short,min:fromMinor(t.min_minor)||0,cap:t.cap||0,extra:fromMinor(t.extra_minor)||0,grp:l.grp,w:l.w,h:l.h,listed:t.min_minor!=null};if(t.request_only)TIERS[t.key].req=1;});
  const SECTIONS={};N.sections.forEach(s=>{const first=N.tables.find(t=>t.section===s.key);SECTIONS[s.key]={label:s.label,grp:first&&TIERS[first.tier]?TIERS[first.tier].grp:'silver',host:s.host||''};});
  /* the plan: the venue's own table positions. This skin draws the room as its operators face it, which is the
     guest plan left to right. */
  const TABLE_NAMES={},TABLE_DATA=N.tables.filter(t=>t.pos&&TIERS[t.tier]).map(t=>{TABLE_NAMES[t.key]=t.name;
    return {id:t.key,tier:t.tier,x:-Number(t.pos.x),z:Number(t.pos.z),o:t.pos.orient||'',sec:SECTIONS[t.section]?t.section:null,uuid:t.id,oos:!!t.oos,min:fromMinor(t.min_minor),cap:t.cap,req:!!t.request_only};});
  const EVENTS=N.events.map(e=>({id:e.key,sid:e.id,k:local(e.doors_at,{year:'numeric',month:'2-digit',day:'2-digit'}),short:e.title,head:e.title,tag:'',
    doorsT:local(e.doors_at,{hour:'2-digit',minute:'2-digit'}),doors:Date.parse(e.doors_at),close:Date.parse(e.ends_at),
    lineup:(e.lineup||[]).map(x=>typeof x==='string'?x:x.name),announced:true,status:e.status,ticketing:e.ticketing_on!==false}));
  const sold=k=>(N.tickets||[]).find(x=>x.type===k)||{};
  const GA=N.ticket_types.slice(0,3).map(t=>({id:t.key,label:t.label,sub:t.sub||'',price:null,alloc:sold(t.key).capacity||null}));
  const GATES=(V.gates||[]).map(g=>({id:g.id,label:g.label,sub:g.sub||'',cap:g.scans_per_min||0,lanes:g.lanes||0}));
  const SOURCES=[{id:'direct',label:V.name+' direct',grp:'direct',comm:0},{id:'host',label:'The team (host desk)',grp:'direct',comm:0}]
    .concat((N.agreements||[]).filter(a=>a.state!=='ended').map(a=>({id:a.key,label:a.label,grp:a.kind==='promoter'?'promoter':'partner',
      comm:Number((a.terms&&a.terms.rates&&a.terms.rates.tab)||0),agreement:a.id})));
  const r=ME.role,who=k=>k===r?ME.name:'';
  const tabs=['home','floor','scan'];   /* the Chat tab comes back when team chat is built for real (js/live-gates.js) */
  const ROLES={owner:{label:'Owner / Manager',who:who('owner'),tabs},host:{label:'Host',who:who('host'),sec:ME.section||null,tabs},
    door:{label:'Door staff',who:who('door'),gate:ME.gate||null,tabs},runner:{label:'Runner',who:who('runner'),tabs:['home','floor']}};
  const R=V.rules||{},H=R.hold||{},F=R.fees||{};
  return {
    VENUE:{name:V.name,season:V.season||'',capacity:Number(V.capacity)||0,minAge:null,graceMin:R.grace_minutes||0,arriveByMin:R.arrive_by_minutes||0,
      earlyCutMin:null,earlyUpgrade:null,doorPrice:null,preOff:0,depositPct:Number((R.deposit_options||[])[0])||0,extraMax:R.party_over_cap||0},
    EVENTS,PAST:[],TIERS,SECTIONS,FLOAT_HOSTS:[],RUNNERS:[],TABLE_DATA,TABLE_NAMES,GA,GATES,SOURCES,ROLES,MANAGERS:{},
    STAFF_PLAN:[],COST_DEFAULT:[],TARGET:null,STAFF_BUBL:[],CHECKLIST:[],MENU:{bottles:[],packs:[],small:[]},FIRST:[],LAST:[],PREFS:[],NOTE_POOL:[],
    /* the venue's own booking rules and BUBL's fees, as its profile has them: OPS words its agreements from these */
    RULES:{depOpts:(R.deposit_options||[]).map(x=>Math.round(Number(x)*100)),holdH:H.minutes?H.minutes/60:null,shortHoldH:H.close_minutes?H.close_minutes/60:null,shortHoldDays:H.close_within_days||null,
      cutoffMin:R.cutoff_minutes||0,splitFeePct:F.guest_fee_split_pct!=null?Number(F.guest_fee_split_pct)*100:null,bublPartnerSharePct:F.partner_commission_share!=null?Number(F.partner_commission_share)*100:null},
    /* a new agreement starts empty: every rate, floor and allocation is typed by the venue's team. No rate lives in code. */
    PA_RATES:{},PA_CONTACTS:[],PA_BLANK:{offersFloor:0,promoter:{cap:0,tix:{early:0,wave:0,vips:0},list:0,rates:{tix:0,tab:0,bar:0},payDays:0,release:0,settle:'dep',notice:0},
      exclusive:{cap:0,tix:{early:0,wave:0,vips:0},list:0,rates:{tix:0,tab:0,bar:0},payDays:0,release:0,settle:'dep',notice:0}},
    HOTELS:[],HT_BLANK:{role:'',tab:0,tix:0,guar:false,noShow:0,release:''},VIP_LINKS:[]};
})();
