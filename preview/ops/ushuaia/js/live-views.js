'use strict';
/* ============================================================
   LIVE VIEWS · loaded in test and live mode only
   A few of Sk's screens mix real figures with ones the demo models
   (a forecast, a share of "potential", a plan by the hour). Here the
   same screens are drawn with the same pieces and only what BUBL
   really holds; where a figure has no source it is simply not drawn.
   Each is reached by one line at the top of Sk's own function:
   "if(LIVE)return live…".
   ============================================================ */

/* Financial position: deposits and tickets really charged, minimums committed and not yet collected, and the
   manager's breakeven once somebody has entered it. No projected profit and no "sold at breakeven": those were models. */
function livePositionHero(s,live){const f=s.fin,be=f.breakeven,set=f.beSet,past=set&&f.collected>=be;
  const headline=!set?'No breakeven entered for this night yet.':past?'Breakeven passed. '+AK(f.collected-be)+' clear so far.':P(f.collected,be)+' of breakeven collected. '+(f.gross>=be?'Committed balances take it past.':AK(be-f.gross)+' still to sell.');
  const max=Math.max(f.gross,be,1)*1.07,w=v=>(Math.max(0,v)/max*100).toFixed(2)+'%',bp=be/max*100;
  const segs='<i class="dep" style="width:'+w(f.dep)+'"></i><i class="tix" style="width:'+w(f.tix)+'"></i><i class="com" style="width:'+w(f.committed)+'"></i>';
  const bar='<div class="pos"><div class="pos-bar"><div class="pos-l">'+segs+'</div>'+(set?'<div class="pos-l au" style="clip-path:inset(0 0 0 '+bp.toFixed(2)+'%)">'+segs+'</div><div class="pos-be '+(bp>76?'r':bp<24?'l':'')+'" style="left:'+bp.toFixed(2)+'%"><b>Breakeven '+N(aedK(be))+'</b></div>':'')+'</div>'+
    '<div class="pos-ax"><span class="n">0</span><span class="n">'+aedK(max/2)+'</span><span class="n">'+aedK(max)+'</span></div></div>';
  const leg='<div class="leg"><span><i class="sw-dep"></i>Deposits '+AK(f.dep)+'</span><span><i class="sw-tix"></i>Tickets '+AK(f.tix)+'</span><span><i class="sw-com"></i>Committed, not collected '+AK(f.committed)+'</span>'+(past?'<span><i class="sw-au"></i>Past breakeven '+AK(f.collected-be)+'</span>':'')+'</div>';
  return '<div class="hud hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="lbl">Financial position</span><button class="btn xs" data-act="mod" data-id="cost">Breakeven</button></div>'+
    '<div class="big n" style="margin-top:10px">'+aedK(f.collected).replace('AED ','<small style="margin:0 6px 0 0">AED</small>')+'<small>collected</small></div><p class="sub" style="margin-top:6px;color:var(--t2)">'+headline+'</p>'+bar+leg+
    '<div class="stat3"><div><b>'+aedK(f.held||0)+'</b><span>held on cards, not charged</span></div><div><b>'+aedK(f.committed)+'</b><span>minimums still to collect</span></div><div><button data-act="mod" data-id="cost" style="display:block"><b class="gold" style="font-family:var(--body);font-size:14px;font-weight:700;letter-spacing:0">Breakeven</b><span>'+(set?'set by '+esc(String(W.be.by).split(' ')[0]):'not entered yet')+'</span></button></div></div></div>';}

/* Breakeven: the one figure a manager types, with who entered it, who approved it and when, and every earlier value. */
function liveCostSub(){return W.be.unset?'Not entered yet':'Set by '+esc(W.be.by)+' · '+fDT(W.be.at);}
function liveCostDetail(s){const f=s.fin,set=f.beSet,be=f.breakeven,past=set&&f.collected>=be,hist=(BUBL.night.breakeven_history||[]).slice(1);
  return '<p class="note">The breakeven is the manager’s number for this event: everything it costs to put on, in one figure. BUBL doesn’t see supplier invoices or payroll, so profit in BUBL means revenue above this line. Changing it needs a Manager PIN.</p>'+
    '<div class="grp"><div class="lbl">Breakeven for '+esc(W.ev.short)+'</div><label class="be-in"><span class="n">AED</span><input class="be-inp n" id="beAmt" inputmode="numeric" autocomplete="off" value="'+(set?n0(be):'')+'" placeholder="0" aria-label="Breakeven in AED"></label><input class="inp" id="beNote" placeholder="What it covers, optional: artist, production, staff, licences" value="'+esc(W.be.note||'')+'"></div>'+
    '<div class="hud" style="padding:14px"><div class="kv">'+(set?'<span>Set by</span><b>'+esc(W.be.by)+'</b><span>Approved by</span><b>'+esc(W.be.approvedBy||'')+'</b><span>Last changed</span><b class="n">'+fDT(W.be.at)+'</b>':'<span>Set by</span><b>Nobody yet</b>')+
      '<span>Collected so far</span><b>'+A(f.collected)+'</b>'+(set?'<span>'+(past?'Above breakeven':'Still to breakeven')+'</span><b class="'+(past?'gold':'')+'">'+A(Math.abs(f.collected-be))+'</b>':'')+'</div></div>'+
    (hist.length?'<div class="grp"><div class="lbl">Earlier values</div><div class="rows">'+hist.map(h=>'<div class="row"><div class="ri">'+I('note',16)+'</div><div class="rt"><b class="n">'+A(fromMinor(h.amount_minor))+'</b><span>'+esc(h.by)+(h.approved_by&&h.approved_by!==h.by?' · approved by '+esc(h.approved_by):'')+' · '+fDT(Date.parse(h.at))+(h.note?' · '+esc(h.note):'')+'</span></div></div>').join('')+'</div></div>':'');}

/* Sell-through: tickets really sold through BUBL, by type, and tables really booked. A share is only drawn where the
   venue has set how many there are; a ticket total that is a test value says so. */
function liveSellCap(){const sv=BUBL.night.service||{};return sv.ticket_capacity?{n:sv.ticket_capacity,test:(sv.test_values||[]).includes('ticket_capacity')}:null;}
M.sell.tile=s=>{const c=liveSellCap();return tile('sell','Sell-through',(c?pct(s.gaSold,c.n):n0(s.gaSold))+'<small>tickets</small>',N(pct(s.tb.booked,s.tb.total))+' of tables booked','<div class="meter"><i style="width:'+(c?pct(s.gaSold,c.n):'0%')+'"></i></div>');};
M.sell.detail=s=>{const c=liveSellCap();return '<div class="grp"><div class="lbl">Entry tickets</div>'+GA.map((x,i)=>hbar(x.label,x.alloc?s.tk.sold[i]/x.alloc:(c?s.tk.sold[i]/c.n:0),n0(s.tk.sold[i])+(x.alloc?' / '+n0(x.alloc):' sold'))).join('')+'</div>'+
    '<div class="grp"><div class="lbl">Tables</div>'+TIER_ORDER.map(k=>{const b=s.tb.byTier[k];return hbar(TIERS[k].label,b.booked/Math.max(1,b.total),b.booked+' / '+b.total,'',null,(b.held+b.pending)/Math.max(1,b.total));}).join('')+
    '<div class="leg"><span><i class="sw-au"></i>Booked</span><span><i class="sw-com"></i>Held or requested</span></div></div>'+
    '<div class="hud" style="padding:14px"><div class="kv"><span>Tickets sold</span><b class="n">'+n0(s.gaSold)+(c?' of '+n0(c.n)+(c.test?' (test value)':''):'')+'</b><span>Tables booked</span><b class="n">'+s.tb.booked+' of '+s.tb.total+'</b><span>Table minimums booked</span><b>'+A(s.tb.minSum)+'</b><span>Refunded tickets</span><b class="n">'+s.tk.refunded+'</b></div></div>';};

/* Team signed in: who has opened OPS for this night, by role. The venue's staff plan is not in BUBL, so there is no
   "of N" and nothing is flagged as short. */
M.staff.tile=s=>{if(!s.staff)return '';const inn=sum(s.staff,x=>x.in);return tile('staff','Team signed in',N(inn)+'',s.staff.length?esc(s.staff.map(x=>x.in+' '+x.sp.role.toLowerCase()).join(', ')):'Nobody yet');};
M.staff.detail=s=>(s.staff&&s.staff.length?s.staff.map(x=>hbar(x.sp.role,1,N(x.in)+' signed in')).join(''):empty('Nobody has opened OPS for this night yet.'))+
  '<p class="note">Everyone who signs in to BUBL OPS for this night is counted here, by role. The venue’s own staff plan is not in BUBL, so there is no target to compare with.</p>';
/* the note under "deposits to chase" names the venue's own card processor */
if(typeof NSRC!=='undefined'&&NSRC.chase)NSRC.chase=IG.pay.n+' · deposit on the invitation link, not paid yet';
if(typeof TVIZ!=='undefined')TVIZ.staff=s=>s.staff&&s.staff.length?gRows(s.staff.map(x=>({l:x.sp.role.split(' ')[0],v:1,t:String(x.in)})),{max:1}):'';
