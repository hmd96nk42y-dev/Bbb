'use strict';
/* ============================================================
   10 · venue + season configuration
   Mirrors the guest app's price sheet and floor geometry exactly,
   so one booking means the same thing on both sides.
   ============================================================ */
/* Which data this page runs on. Demo: the made-up venue sheet and people in js/demo-data.js. Test and live: the
   venue's own facts from BUBL's back end (js/live-data.js). Each name below is filled from one or the other. */
const LIVE=typeof OPS_LIVE!=='undefined',CFG=LIVE?OPS_LIVE:OPS_DEMO;
const VENUE=CFG.VENUE;

function mkEvent(id,k,short,head,tag,doors,lineup){const [y,m,d]=k.split('-').map(Number),[hh,mm]=doors.split(':').map(Number);
  const t0=gstAt(y,m,d,hh,mm);return {id,k,short,head,tag,doorsT:doors,doors:t0,close:gstAt(y,m,d+1,3,0),lineup,announced:true};}
const EVENTS=LIVE?CFG.EVENTS:CFG.EVENTS.map(a=>mkEvent(a[0],a[1],a[2],a[3],a[4],a[5],a[6]));
if(!LIVE)CFG.EVENTS_TO_COME.forEach((k,i)=>{
  const e=mkEvent('tba'+(i+1),k,'To be announced','To be announced','Season 3','20:00',[]);e.announced=false;EVENTS.push(e);});
const EVK={};EVENTS.forEach(e=>EVK[e.id]=e);

/* past events: the baseline for pace, no-show prediction and comparison. Only ever from imported history. */
const PAST=CFG.PAST;

/* ---- tables: same sheet as the guest app (all nights the same price) ---- */
const TIERS=CFG.TIERS;
const TIER_ORDER=['bsC','bsB','bsA','vip','plat','gold','silver'].filter(k=>TIERS[k]);
const GROUPS=[['bs','Backstage'],['vip','VIP'],['plat','Platinum'],['gold','Gold'],['silver','Silver']];
const SECTIONS=CFG.SECTIONS;
const SEC_ORDER=['bsL','bsC','bsR','vipL','vipR','plL','plR','gdL','gdR','slL','slR'].filter(k=>SECTIONS[k]);
const HOSTS=SEC_ORDER.map(s=>SECTIONS[s].host).filter(Boolean).concat(CFG.FLOAT_HOSTS);
const RUNNERS=CFG.RUNNERS;
const TABLE_DATA=LIVE?CFG.TABLE_DATA:CFG.TABLE_DATA.split(';').map(r=>{const a=r.split(',');return {id:a[0],tier:a[1],x:+a[2],z:+a[3],o:a[4]||''};});
function secOf(t){if(t.sec)return t.sec;const L=t.x<0,T=TIERS[t.tier];if(T.grp==='bs')return Math.abs(t.x)<=75?'bsC':(L?'bsL':'bsR');return {vip:'vip',plat:'pl',gold:'gd',silver:'sl'}[T.grp]+(L?'L':'R');}
function tableName(id){if(LIVE&&CFG.TABLE_NAMES[id])return CFG.TABLE_NAMES[id];const m=id.match(/^([A-Z]+?)(\d+)$/);if(!m)return id;const p=m[1],n=+m[2];
  if(p==='BA'||p==='BB'||p==='BC')return 'Backstage '+p[1]+' '+n;if(p[0]==='V')return 'VIP '+p[1]+n;
  return ({P:'Platinum',G:'Gold',S:'Silver'}[p[0]])+' '+p[1]+n;}

/* ---- entry tickets (guest app GA sheet) + operator-side allocations ---- */
const GA=CFG.GA;
const TK={early:0,wave:1,vips:2,door:3,comp:4,plist:5};
const ARR_TYPES=[['ticket','Presold ticket'],['table','Table guest'],['plist','Promoter list'],['comp','Guest list / comp'],['door','Door purchase']];

const GATES=CFG.GATES;
const GATE={};GATES.forEach(x=>GATE[x.id]=x);

const SOURCES=CFG.SOURCES;
const SRC={};SOURCES.forEach((s,i)=>{s.i=i;SRC[s.id]=s;});
const SRC_GROUPS=[['direct','Direct'],['promoter','Promoters'],['partner','Partners'],['other','Other']];

const ROLES=CFG.ROLES;
const MANAGERS=CFG.MANAGERS;   /* demo: the build's demo PINs. Test and live: none here; each manager's own PIN is checked by the back end */

const STAFF_PLAN=CFG.STAFF_PLAN;

const COST_DEFAULT=CFG.COST_DEFAULT;
const TARGET=CFG.TARGET;
const STAFF_BUBL=CFG.STAFF_BUBL;

const CHECKLIST=CFG.CHECKLIST;

const MENU=CFG.MENU;

const FIRST=CFG.FIRST;
const LAST=CFG.LAST;
const PREFS=CFG.PREFS;
const NOTE_POOL=CFG.NOTE_POOL;
const CRM=[{id:'new',label:'New'},{id:'ret',label:'Returning'},{id:'bl',label:'Backstage List'}];
