'use strict';
/* ============================================================
   LIVE GATES · loaded in test and live mode only
   Two things, both from CLAUDE.md:
   rule 4 (data truth): a tile whose source is not connected shows the
     build's own "Awaiting connection" tile. Which sources are connected
     is read from the venue's own records, never switched on the page.
   rule 5 (nothing BUBL cannot actually do): what the build offers and
     BUBL does not really do yet is not drawn. Every such thing is in
     the one list below, with why. None is faked.
   ============================================================ */

/* ---- 1. what is connected, as BUBL's back end says ---- */
const LIVE_SOURCES={pay:'payments',pos:'pos',wa:'whatsapp',ig:'instagram',mail:'email',scan:'scan'};
function liveIntegrations(){const N=BUBL.night,st=N.integrations||{},live=k=>st[k]==='live'||(N.venue.mode!=='live'&&st[k]==='test');
  INTEG.forEach(x=>{
    if(x.core){x.wait=0;if(x.id==='tix')x.wait=N.modules&&N.modules.ticketing===false?1:0;return;}
    if(LIVE_SOURCES[x.id])x.wait=live(LIVE_SOURCES[x.id])?0:1;
    else x.wait=1;   /* runner tasks (needs the POS and the venue's menu), past seasons (nothing imported yet), BUBL Intelligence (not connected yet) */
  });
  /* the card processor is the venue's own; in test mode BUBL's Stripe test account may stand in for it */
  const proc=N.money&&N.money.processor;if(proc)IG.pay.n=proc==='stripe'?'Stripe (BUBL test stand-in)':'Adyen';
  UI.integOff={};UI.demoOn={};}
liveIntegrations();

/* ---- 2. not drawn until BUBL really does it ---- */
const NOT_YET={
  /* staff chat and the guest inbox: nothing carries a message yet (messaging is step 11; team chat is DECISIONS question 75) */
  chat:'[data-act="tab"][data-t="chat"],[data-act="chOpen"],[data-act="gChat"],[data-act="gWa"],[data-act="gCall"],[data-act="callG"],[data-act="gLink"],[data-act="sendLink"],[data-act="sendLinks"],[data-act="waPreview"],[data-act="waPv"],[data-act="compOpen"]',
  /* WhatsApp nudges, reminders and briefs */
  messages:'[data-act="chase"],[data-act="nudge"],[data-act="nudgeAll"],[data-act="brief"],[data-act="follow"],[data-act="relOffer"],[data-act="offer"]',
  /* marking money as received by hand, comps, discounts, collecting a balance: BUBL only shows money it has really taken */
  money:'[data-act="depPaid"],[data-act="collect"],[data-act="cpGo"],[data-act="bkDisc"]',
  /* a booking typed in by staff for a guest: a guest gives their own details, so the team sends a VIP link instead (question 78) */
  manualBooking:'[data-act="bookOpen"]',
  /* guest notes and preferences: nothing keeps them yet */
  notes:'[data-act="addNote"],[data-act="addNoteT"],#gnote',
  /* drawing on the plan: adding, moving, merging and removing tables, templates and the lock. "Out of service" is real */
  layout:'[data-act="flEdit"],[data-act="flAdd"],[data-act="flTpl"],[data-act="flLock"],[data-act="tRemove"],[data-act="tMerge"],[data-act="flMoveX"]',
  /* the door: test tickets and the practice set. A sale on the venue's own terminal and the paid Early entry upgrade
     are real (questions 73 and 82, answered 20 and 22 Nov 2026). */
  door:'[data-act="testTickets"],[data-act="scPr"],[data-act="goPractice"],[data-act="alertAck"]',
  /* the simulation's own controls: the clock, switching feeds off, previewing made-up data, the offline test */
  simulation:'[data-act="speed"],[data-act="phaseOv"],[data-act="phaseAuto"],[data-act="tbNow"],[data-act="integSw"],[data-act="integDemo"],[data-act="integAllOn"],[data-act="offline"]',
  /* ticket transfers, refunds and disputes sent back through the card processor; presale windows edited from OPS */
  refunds:'[data-act="qOk"][data-type="refund"],[data-act="qOk"][data-type="dispute"],[data-act="qOk"][data-type="transfer"],[data-act="winT"]',
  /* the Manager agent, intelligence requests and the floor's "Ask" (BUBL Intelligence is not connected: question 71) */
  intelligence:'[data-act="faAsk"],[data-act="faGo"],[data-act="inAsk"],[data-act="inRun"],[data-act="inGo"],[data-act="agOpen"],#paAsk,[data-act="paAsk"],[data-act="paSug"]',
  /* Promoter access by section, and the exclusive kind (which is by section): a promoter sells through the bubl
     partners chat, and the chat can only offer tables the venue holds for them by name. A section given this way
     held nothing, and the promoter was told "no tables are held for you" (Sk, 24 Nov 2026). Until the chat can sell
     any open table of a section, access is given table by table; both choices come back with that. */
  promoterSections:'.seg:has(> [data-act="paTm"]),.pa-kind',
  /* partners: sending the access and the desk link, and the link itself (their own apps are step 8) */
  partnerApps:'[data-act="paResend"],[data-act="paCopy"],[data-act="htSendDesk"],[data-act="vlSend"]',
  /* the close-out PDF: built from POS and payment figures the venue has not connected */
  report:'[data-act="report"],[data-act="reportDl"]'
};
(function(){const st=document.createElement('style');st.id='not-yet-css';
  st.textContent=Object.keys(NOT_YET).map(k=>NOT_YET[k]).join(',')+'{display:none!important}'
    /* the time bar shows where the night is on the real clock; it is not a slider here */
    +'.tb-track{pointer-events:none}';
  document.head.appendChild(st);})();
const offered=k=>!(k in NOT_YET);

/* ---- 3. tiles that are not on a home until what feeds them exists ---- */
(function(){
  /* the waitlist: nothing lets a guest join one yet. Presale windows: read from real waves, shown inside Sell-through. */
  /* Presale windows: the build's windows are fixed days before doors. The venue's real waves are read in step 8's
     ticket screen; until then the tile is not on a home (Sell-through shows what has sold). */
  const drop=['waitlist','waitl','windows'];
  /* seat claims are BUBL's own records: they do not wait for WhatsApp (only the nudges do) */
  const book=FEEDS.find(f=>f.req.length===1&&f.req[0]==='book'&&f.mods&&f.mods.includes('holds'));if(book&&!book.mods.includes('claims'))book.mods.push('claims');
  Object.keys(HOME).forEach(p=>Object.keys(HOME[p]).forEach(r=>{HOME[p][r]=HOME[p][r].filter(id=>!drop.includes(id));}));
  Object.keys(ASETS).forEach(k=>{const v=ASETS[k];Object.keys(v).forEach(p=>{if(Array.isArray(v[p]))v[p]=v[p].filter(id=>!drop.includes(id));});});
  /* the tablet's Chats view goes with the Chat tab */
  if(typeof AV!=='undefined'){for(let i=AV.length-1;i>=0;i--)if(AV[i][0]==='chat'||AV[i][0]==='report')AV.splice(i,1);}
})();
