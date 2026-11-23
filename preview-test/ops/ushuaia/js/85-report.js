'use strict';
/* ============================================================
   85 · post-event report
   One page model, two outputs: inline SVG for the preview and a
   hand-written vector PDF (A4, embedded Space Grotesk, Manrope and
   JetBrains Mono). No rasterising, no libraries, works offline.
   ============================================================ */
const RC={paper:'#FBF8F1',ink:'#17130C',ink2:'#3A3226',mut:'#6F6654',soft:'#A39A86',line:'#D9CFB6',brass:'#A8821F',gold:'#C9A227',card:'#F3EEE0',g2:'#6F6654',g3:'#A39A86',g4:'#D9CFB6',ok:'#1F8B5A',warn:'#A9690A',bad:'#C2413B'};
const WIN={0x20AC:128,0x2026:133,0x2018:145,0x2019:146,0x201C:147,0x201D:148,0x2022:149,0x2013:150,0x2014:151,0x2212:150,0x2122:153};
function winBytes(str){const out=[];for(const ch of String(str)){const c=ch.codePointAt(0);out.push(c<128||(c>=160&&c<256)?c:WIN[c]||63);}return out;}
function textW(str,font,size){const m=FONTS[font].m.w;let w=0;for(const b of winBytes(str))w+=m[b-32]||0;return w*size/1000;}
function RDoc(){this.pages=[];}
RDoc.prototype.page=function(){const p={ops:[]};this.pages.push(p);this.p=p;this.rect(0,0,595,842,{fill:RC.paper});return this;};
RDoc.prototype.rect=function(x,y,w,h,o){this.p.ops.push(['r',x,y,w,h,o||{}]);return this;};
RDoc.prototype.line=function(x1,y1,x2,y2,o){this.p.ops.push(['l',x1,y1,x2,y2,o||{}]);return this;};
RDoc.prototype.poly=function(pts,o){this.p.ops.push(['p',pts,o||{}]);return this;};
RDoc.prototype.text=function(x,y,s,o){o=Object.assign({font:'mr5',size:9.5,fill:RC.ink,align:'l'},o||{});this.p.ops.push(['t',x,y,String(s),o]);return this;};
RDoc.prototype.wedge=function(cx,cy,r0,r1,a0,a1,o){const pts=[],n=Math.max(4,Math.ceil((a1-a0)/.12));for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push([cx+r1*Math.cos(a),cy+r1*Math.sin(a)]);}for(let i=n;i>=0;i--){const a=a0+(a1-a0)*i/n;pts.push([cx+r0*Math.cos(a),cy+r0*Math.sin(a)]);}return this.poly(pts,Object.assign({close:1},o));};
RDoc.prototype.hatch=function(x,y,w,h,col){for(let d=-h;d<w;d+=4){const x1=Math.max(x,x+d),y1=y+h-(x1-x-d),x2=Math.min(x+w,x+d+h),y2=y+h-(x2-x-d);if(x2>x1)this.line(x1,Math.min(y+h,Math.max(y,y1)),x2,Math.min(y+h,Math.max(y,y2)),{stroke:col,lw:.8});}return this.rect(x,y,w,h,{stroke:col,lw:.5});};
/* layout helpers */
RDoc.prototype.h1=function(y,num,title){this.text(44,y,num,{font:'jb5',size:9,fill:RC.brass}).text(44,y+24,title,{font:'sg7',size:21});this.line(44,y+34,551,y+34,{stroke:RC.gold,lw:.7});return y+56;};
RDoc.prototype.h2=function(x,y,t){this.text(x,y,t,{font:'sg7',size:11.5});return y+16;};
RDoc.prototype.para=function(x,y,w,str,o){o=Object.assign({font:'mr5',size:9.5,fill:RC.ink2,lh:14},o||{});const words=String(str).split(' ');let ln='';words.forEach(wd=>{const t=ln?ln+' '+wd:wd;if(textW(t,o.font,o.size)>w&&ln){this.text(x,y,ln,o);y+=o.lh;ln=wd;}else ln=t;});if(ln){this.text(x,y,ln,o);y+=o.lh;}return y;};
RDoc.prototype.kv=function(x,y,w,rows){rows.forEach(r=>{this.text(x,y,r[0],{fill:RC.mut}).text(x+w,y,r[1],{font:'jb5',size:9.5,align:'r',fill:r[2]||RC.ink});this.line(x,y+5,x+w,y+5,{stroke:RC.line,lw:.4});y+=16;});return y+4;};
RDoc.prototype.stat=function(x,y,w,val,lab){this.rect(x,y,w,50,{fill:RC.card});this.line(x,y,x+10,y,{stroke:RC.brass,lw:1.2}).line(x,y,x,y+10,{stroke:RC.brass,lw:1.2}).line(x+w,y+50,x+w-10,y+50,{stroke:RC.brass,lw:1.2}).line(x+w,y+50,x+w,y+40,{stroke:RC.brass,lw:1.2});
  this.text(x+10,y+24,val,{font:'jb7',size:15}).text(x+10,y+40,lab,{size:8,fill:RC.mut});return this;};
RDoc.prototype.bars=function(x,y,w,rows,o){o=o||{};const lw=o.lw||118,vw=o.vw||70,bw=w-lw-vw-12;rows.forEach(r=>{this.text(x,y+7,r[0],{size:9});this.rect(x+lw,y,bw,8,{fill:RC.card});this.rect(x+lw,y,Math.max(.5,bw*clamp(r[1],0,1)),8,{fill:r[3]||RC.brass});if(r[4]!=null)this.line(x+lw+bw*clamp(r[4],0,1),y-2,x+lw+bw*clamp(r[4],0,1),y+10,{stroke:RC.ink,lw:1});this.text(x+w,y+7,r[2],{font:'jb5',size:9,align:'r'});y+=17;});return y+4;};
RDoc.prototype.table=function(x,y,cols,rows){let cx=x;cols.forEach(c=>{this.text(c.r?cx+c.w:cx,y,c.t,{size:8,fill:RC.mut,align:c.r?'r':'l',font:'mr7'});cx+=c.w+8;});this.line(x,y+5,cx-8,y+5,{stroke:RC.ink,lw:.6});y+=18;
  rows.forEach(r=>{let c2=x;cols.forEach((c,i)=>{this.text(c.r?c2+c.w:c2,y,r[i],{size:9,font:c.r?'jb5':'mr5',align:c.r?'r':'l'});c2+=c.w+8;});this.line(x,y+5,cx-8,y+5,{stroke:RC.line,lw:.4});y+=16;});return y+6;};

function buildReport(){const s=S(),p=postStats(W,s),ev=W.ev,t=s.t,f=s.fin,d=new RDoc(),ver=(W.reportV||0)+1,fmtP=v=>(v*100).toFixed(1)+'%',K=aedK,pc=(a,b)=>pct(a,b,1);
  const fname='Ushuaia_'+ev.short.replace(/[^A-Za-z0-9]/g,'')+'_'+ev.k+'_PostEventReport.pdf';
  /* cover */
  d.page();d.rect(0,0,595,842,{fill:'#F3EEE0'});d.rect(44,44,507,754,{stroke:RC.line,lw:.6});
  [[44,44,1,1],[551,798,-1,-1]].forEach(c=>{d.line(c[0],c[1],c[0]+26*c[2],c[1],{stroke:RC.brass,lw:2}).line(c[0],c[1],c[0],c[1]+26*c[3],{stroke:RC.brass,lw:2});});
  d.text(72,96,'BUBL OPS',{font:'sg7',size:11,fill:RC.brass}).text(523,96,'Ushuaïa Dubai Harbour',{size:10,fill:RC.mut,align:'r'});
  d.text(72,330,'Post-event report',{font:'mr7',size:13,fill:RC.brass});
  d.text(72,384,ev.head,{font:'sg7',size:ev.head.length>16?34:46}).text(72,414,ev.tag+' · '+VENUE.season,{size:13,fill:RC.ink2});
  d.line(72,438,523,438,{stroke:RC.gold,lw:1});
  d.text(72,462,fD(ev.doors)+' '+g(ev.doors).getUTCFullYear()+', doors '+ev.doorsT+' to '+fT(ev.close)+' GST',{font:'jb5',size:10.5,fill:RC.ink2});
  [[n0(p.inAll),'through the gates'],[K(p.gross),'revenue'],[K(p.profit),'profit'],[fmtP(p.showRate),'show rate']].forEach((a,i)=>d.stat(72+i*116,560,104,a[0],a[1]));
  d.text(72,744,'Version '+ver+' · data as of '+fDT(t)+' GST',{font:'jb5',size:8.5,fill:RC.mut}).text(72,760,'Prepared for the owner and duty managers. Figures are final unless marked open.',{size:8.5,fill:RC.mut});
  /* 1 executive summary */
  d.page();let y=d.h1(60,'01','Executive summary');
  [[n0(p.inAll),'attendance'],[fmtP(p.showRate),'show rate'],[n0(p.peak),'peak in venue, '+fT(p.peakAt)],[K(p.gross),'revenue'],[K(p.profit),'profit'],[K(s.cost.breakeven),'breakeven']].forEach((a,i)=>d.stat(44+(i%3)*172,y+Math.floor(i/3)*60,160,a[0],a[1]));y+=136;
  y=d.h2(44,y,'What happened');
  const worst=p.gates.slice().sort((a,b)=>b.top/b.g.cap-a.top/a.g.cap)[0],gap=s.staff.filter(x=>x.in/x.sp.plan<.92).map(x=>x.sp.role.toLowerCase());
  [n0(p.inAll)+' guests came through the gates, '+fmtP(p.showRate)+' of everyone holding a ticket or seat. Season 2 averaged '+fmtP(PAST[3].show)+'.',
   'Revenue closed at '+aed(p.gross)+', '+(p.gross>=p.fcGross?'above':'below')+' the forecast taken at doors by '+aed(Math.abs(p.gross-p.fcGross))+'. Profit is '+aed(p.profit)+' after '+aed(p.costs)+' of costs.',
   'Breakeven of '+aed(s.cost.breakeven)+' was covered by presale alone: tickets and table deposits stood at '+aed(f.dep+f.tix)+' before doors.',
   p.above.length+' tables finished above their minimum and '+p.below.length+' below. '+p.noshow.length+' booked tables did not arrive and '+aed(p.writeOff)+' of balances was written off.',
   'The busiest gate was '+worst.g.label+', scanning '+Math.round(worst.top)+' of '+worst.g.cap+' a minute around '+fT(worst.at)+', when Early entry closed. '+(gap.length?'Coverage was short in '+gap.join(' and ')+'.':'Every role was staffed to plan.'),
   n0(p.newG)+' new guests were captured by name, '+pc(p.mk,p.guests)+' opted in to marketing.'].forEach(b=>{d.rect(44,y-6,3,3,{fill:RC.brass});y=d.para(54,y,490,b)+4;});
  y+=8;y=d.h2(44,y,'Financial position at close');reportPos(d,44,y+14,507,f);
  /* 2 financials */
  d.page();y=d.h1(60,'02','Financials');y=d.h2(44,y,'Collected and committed');
  y=d.kv(44,y,240,[['Table deposits and pre-orders',aed(f.dep)],['Tickets, presale',aed(f.tix)],['Bars',aed(f.bar)],['Table checks closed in the POS',aed(f.settled)],['Door tickets',aed(f.door)],['Collected',aed(f.collected),RC.brass],['Balances still open',aed(f.committed)],['No-show balances written off',aed(p.writeOff)]]);
  let y2=d.h2(311,y-150,'Breakeven and profit');y2=d.kv(311,y2,240,[['Revenue',aed(p.gross)],['Breakeven, set by the manager',aed(p.costs),RC.brass],['Set by',String(W.be.by)],['No-show balances written off',aed(p.writeOff)],['Profit above breakeven',aed(p.profit),RC.brass]]);
  y=Math.max(y,y2)+10;y=d.h2(44,y,'Against the forecast at doors');
  y=d.table(44,y,[{t:'Line',w:190},{t:'Forecast',w:86,r:1},{t:'Actual',w:86,r:1},{t:'Variance',w:86,r:1}],p.recon.map(r=>[r[0],aed(r[1]),aed(r[2]),(r[2]>=r[1]?'+':'-')+n0(Math.abs(r[2]-r[1]))]).concat([['Total',aed(p.fcGross),aed(p.gross),(p.gross>=p.fcGross?'+':'-')+n0(Math.abs(p.gross-p.fcGross))]]));
  const mxh=Math.max.apply(null,s.hourly.concat(s.plan.hourly));y=d.h2(44,y+6,'On-site revenue by hour');
  s.hourly.forEach((v,i)=>{const bw=507/s.hourly.length,x=44+i*bw,h=v/mxh*90,ph=s.plan.hourly[i]/mxh*90;d.rect(x+8,y+100-ph,bw-16,ph,{stroke:RC.g3,lw:.6,dash:[2,2]});d.rect(x+14,y+100-h,bw-28,h,{fill:RC.brass});d.text(x+bw/2,y+114,fT(W.D+i*HOUR),{font:'jb5',size:8,align:'c',fill:RC.mut}).text(x+bw/2,y+96-Math.max(h,ph),kfmt(v),{font:'jb5',size:8,align:'c'});});
  /* 3 attendance */
  d.page();y=d.h1(60,'03','Attendance');y=d.h2(44,y,'Show rate by tier');y=d.bars(44,y,507,p.show.map(r=>[r[0],r[2]/Math.max(1,r[1]),pc(r[2],r[1])+'  '+n0(r[2])+' of '+n0(r[1])]),{vw:120});
  y=d.h2(44,y+4,'Show rate by source');y=d.bars(44,y,507,p.bySrc.map(r=>[r.label,r.in/Math.max(1,r.n),pc(r.in,r.n)+'  '+n0(r.in)+' of '+n0(r.n),RC.g2]),{vw:120});
  y=d.h2(44,y+4,'Arrival profile, guests per five minutes');const nb=Math.ceil((W.C-W.D)/(5*MIN)),bw=507/nb;let mxa=1;for(let i=0;i<nb;i++)mxa=Math.max(mxa,sum([0,1,2,3,4],k=>s.arr[k][i]));
  const cols=[RC.g2,RC.brass,RC.g3,RC.ink,RC.g4];for(let i=0;i<nb;i++){let acc=0;for(let k=0;k<5;k++){const v=s.arr[k][i];if(!v)continue;const h=v/mxa*110;d.rect(44+i*bw+.3,y+120-acc-h,bw-.6,h,{fill:cols[k]});acc+=h;}}
  for(let h=0;h<=7;h++)d.text(44+h*12*bw,y+134,fT(W.D+h*HOUR),{font:'jb5',size:8,align:'c',fill:RC.mut});d.line(44,y+120,551,y+120,{stroke:RC.ink,lw:.5});
  ARR_TYPES.forEach((a,i)=>{d.rect(44+i*102,y+146,8,8,{fill:cols[i]});d.text(56+i*102,y+153,a[1],{size:8,fill:RC.ink2});});y+=176;
  y=d.kv(44,y,240,[['Through the gates',n0(p.inAll)+', '+pc(p.inAll,VENUE.capacity)+' of the licence'],['Busiest five minutes',Math.round(s.peak)+'/min at '+fT(s.peakAt)],['Average arrival',fT(p.avgArr)],['Exits','Not counted']]);
  d.h2(311,y-72,'Gate throughput');d.table(311,y-56,[{t:'Gate',w:60},{t:'Scanned',w:50,r:1},{t:'Peak/min',w:50,r:1},{t:'At',w:40,r:1}],p.gates.map(x=>[x.g.label,n0(x.total),Math.round(x.top)+' of '+x.g.cap,fT(x.at)]));
  /* 4 tables */
  d.page();y=d.h1(60,'04','Tables');[[String(p.above.length),'above minimum'],[String(p.below.length),'below, charged minimum'],[String(p.noshow.length),'no-show tables'],[K(s.tb.spend),'table spend']].forEach((a,i)=>d.stat(44+i*129,y,117,a[0],a[1]));y+=72;
  y=d.h2(44,y,'Spend against minimum, by section (marker = 100%)');y=d.bars(44,y,507,SEC_ORDER.filter(k=>s.sec[k].min).map(k=>{const x=s.sec[k];return [SECTIONS[k].label,Math.min(1.5,x.spend/x.min)/1.5,pc(x.spend,x.min)+'  '+K(x.spend),RC.brass,1/1.5];}),{vw:110});
  y=d.h2(44,y+4,'Sell-through and outcome by tier');y=d.table(44,y,[{t:'Tier',w:110},{t:'Tables',w:50,r:1},{t:'Booked',w:50,r:1},{t:'Minimums',w:90,r:1},{t:'Spend',w:90,r:1},{t:'Of min',w:50,r:1}],TIER_ORDER.map(k=>{const b=s.tb.byTier[k];return [TIERS[k].label,b.total,b.booked,aed(b.min),aed(b.spend),pc(b.spend,b.min)];}));
  y=d.h2(44,y+4,'Furthest below minimum');d.table(44,y,[{t:'Table',w:110},{t:'Booker',w:150},{t:'Spend',w:80,r:1},{t:'Minimum',w:80,r:1}],p.below.slice().sort((a,b)=>a._m.spend/a._m.min-b._m.spend/b._m.min).slice(0,8).map(b=>[W.T[tableAt(b,t)].name,gName(b.booker),aed(b._m.spend),aed(b._m.min)]));
  /* 5 sources */
  d.page();y=d.h1(60,'05','Sources and promoters');const sl=srcSlices(s,'rev'),tot=sum(sl,x=>x.v)||1,sc=[RC.brass,RC.ink,RC.g2,RC.g4];let a0=-Math.PI/2;
  sl.forEach((x,i)=>{const a1=a0+x.v/tot*Math.PI*2;d.wedge(130,y+80,42,76,a0,a1,{fill:sc[i],stroke:RC.paper,lw:1.5});a0=a1;d.rect(250,y+34+i*24,10,10,{fill:sc[i]});d.text(268,y+43+i*24,x.label,{size:10}).text(551,y+43+i*24,pc(x.v,tot)+'   '+aed(x.v),{font:'jb5',size:9.5,align:'r'});});
  d.text(130,y+78,K(tot).replace('AED ',''),{font:'jb7',size:13,align:'c'}).text(130,y+92,'AED booked',{size:8,align:'c',fill:RC.mut});y+=186;
  y=d.h2(44,y,'Promoter and partner scorecard');y=d.table(44,y,[{t:'Source',w:150},{t:'Guests',w:46,r:1},{t:'Show',w:46,r:1},{t:'Revenue',w:86,r:1},{t:'Rate',w:34,r:1},{t:'Commission',w:86,r:1}],p.promo.map(o=>[o.x.label,n0(o.n),pc(o.show,1),aed(o.rev),(o.x.comm*100).toFixed(0)+'%',aed(o.comm)]).concat([['Total',n0(sum(p.promo,o=>o.n)),'',aed(sum(p.promo,o=>o.rev)),'',aed(sum(p.promo,o=>o.comm))]]));
  d.para(44,y+6,507,'Commission is paid on tickets sold and table minimums booked under each agreement. Sources showing under 80% are flagged for a smaller allocation at the next event.',{fill:RC.mut,size:8.5,lh:12});
  /* 6 guests */
  d.page();y=d.h1(60,'06','Guests');[[n0(p.guests),'named guests attended'],[n0(p.newG),'new to Ushuaïa'],[n0(p.bl),'Backstage List'],[pc(p.mk,p.guests),'opted in to marketing']].forEach((a,i)=>d.stat(44+i*129,y,117,a[0],a[1]));y+=72;
  y=d.kv(44,y,240,[['Returning guests',n0(p.known-p.bl)],['Opted in to marketing',pc(p.mk,p.guests)]]);
  y=d.h2(44,y+6,'Suggested for the Backstage List');y=d.table(44,y,[{t:'Guest',w:160},{t:'Table',w:110},{t:'Spend',w:90,r:1},{t:'Visits',w:50,r:1}],p.up.slice(0,10).map(b=>[gName(b.booker),W.T[tableAt(b,t)].name,aed(b._m.spend),G(b.booker).v+1]));
  y=d.h2(44,y+4,'Backstage List standing to review');y=d.table(44,y,[{t:'Guest',w:160},{t:'Table booked',w:110},{t:'Reason',w:200}],(p.down.length?p.down:[]).slice(0,6).map(b=>[gName(b.booker),W.T[b.table].name,'Booked and did not arrive']));
  d.para(44,y+4,507,'Tier changes are suggestions. A tier only changes when a manager confirms it on the guest card. ID is checked by sight at the gates and BUBL stores nothing from it.',{fill:RC.mut,size:8.5,lh:12});
  /* 7 operations */
  d.page();y=d.h1(60,'07','Operations');y=d.h2(44,y,'Signed in to BUBL OPS against plan');y=d.bars(44,y,507,s.staff.map(x=>[x.sp.role,x.in/x.sp.plan,x.in+' of '+x.sp.plan,x.in/x.sp.plan<.92?RC.warn:RC.ok]));
  y=d.h2(44,y+4,'Service and seating');y=d.kv(44,y,240,[['Order to table, median',p.delMed.toFixed(0)+' min'],['Deliveries over 15 minutes',p.delSlow+' of '+p.delN],['Gate to seat, median',p.seatMed.toFixed(0)+' min'],['Seated after 12 minutes or more',String(p.seatSlow)],['Parties moved',String(p.moves.length)],['Walk-in tables',String(p.walkins.length)]]);
  d.h2(311,y-116,'Tickets, fraud and refunds');d.kv(311,y-100,240,[['Duplicate codes stopped',String(p.alerts.filter(a=>a.type==='dup').length)],['Refunded tickets presented',String(p.alerts.filter(a=>a.type==='void').length)],['Tickets refunded before doors',String(s.tk.refunded)],['Refunds and disputes open',String(pendingQ(['refund','dispute']).length)],['Early entry after 22:00',String(s.lateEarly)]]);
  y=d.h2(44,y+6,'Incident log');y=d.table(44,y,[{t:'Time',w:40},{t:'Type',w:64},{t:'Where',w:100},{t:'Note',w:270}],W.incidents.filter(x=>x.at<=t).slice(0,14).map(x=>[fT(x.at),INC_T[x.type][0],x.zone,x.note.length>62?x.note.slice(0,60)+'…':x.note]));
  /* 8 follow-ups */
  d.page();y=d.h1(60,'08','Follow-ups and recommendations');y=d.h2(44,y,'Follow-up queue');y=d.table(44,y,[{t:'Message',w:150},{t:'Who',w:220},{t:'Guests',w:50,r:1},{t:'Status',w:50,r:1}],p.follow.map(x=>[x.l,x.d.length>48?x.d.slice(0,46)+'…':x.d,n0(x.n),p.sent[x.id]?'Sent':'To send']));
  y=d.h2(44,y+8,'For the next event');
  ['Split Early entry across both GA gates from 21:15 and add two scanners at '+worst.g.label+' until 22:15. The rush before the 22:00 cut-off is the only point the gates ran near throughput.',
   'Chase unclaimed seats 72 hours out. '+n0(s.tb.seats-s.tb.claimed)+' table seats had no name at doors and each one is a slow scan.',
   'Plan '+Math.max(2,gap.length*2)+' more runners. '+p.delSlow+' deliveries took over 15 minutes, most of them between 23:00 and 00:30.',
   'Review allocations for sources that showed under 80%, and move that stock to direct presale where the show rate was '+pc(p.bySrc[0].in,p.bySrc[0].n)+'.',
   'Offer the '+p.up.length+' guests suggested for the Backstage List first pick for the next event, 24 hours ahead of returning guests.'].forEach((b,i)=>{d.text(44,y,String(i+1),{font:'jb7',size:10,fill:RC.brass});y=d.para(62,y,484,b)+6;});
  /* 9 appendix */
  d.page();y=d.h1(60,'09','Appendix');y=d.h2(44,y,'Entry tickets');y=d.table(44,y,[{t:'Tier',w:130},{t:'Price',w:60,r:1},{t:'Allocated',w:60,r:1},{t:'Sold',w:60,r:1},{t:'Attended',w:60,r:1},{t:'Revenue',w:90,r:1}],GA.map((x,i)=>[x.label,aed(x.price),n0(x.alloc),n0(s.tk.sold[i]),n0(s.tk.in[i]),aed(s.tk.rev[i])]).concat([['Door tickets',aed(VENUE.doorPrice),'',n0(s.tk.sold[3]),n0(s.tk.in[3]),aed(s.tk.rev[3])]]));
  y=d.h2(44,y+6,'Definitions');
  [['Collected','Money in: table deposits, pre-orders, tickets, bars, table checks closed in the POS and door tickets.'],['Committed','Table checks still open: the minimum less what is already paid. Pre-orders count at full menu value.'],['Breakeven','The figure the venue manager sets for this event. Profit is revenue above it.'],['Show rate','Guests scanned in, divided by tickets and seats issued and not refunded.'],['Seated','Every guest who arrived at a table has been seated by the host. Partial means some are still at the gate or due.'],['No-show table','No guest scanned in by the arrive-by time plus the '+VENUE.graceMin+' minute hold.']].forEach(r=>{d.text(44,y,r[0],{font:'mr7',size:9.5});y=d.para(140,y,410,r[1])+3;});
  y=d.h2(44,y+8,'Method');y=d.para(44,y,507,'Times are Gulf Standard Time. Currency is AED. Attendance comes from gate scans; exits are not counted, so there is no time-in-venue figure. Bar and table spend come from the POS, read-only. Deposits and door tickets bought on a phone come from Adyen. Booker and attendee are recorded separately. Each export is a versioned snapshot of the data at the time shown in the footer.');
  /* footers */
  d.pages.forEach((pg,i)=>{if(!i)return;d.p=pg;d.line(44,800,551,800,{stroke:RC.gold,lw:.6});d.text(44,814,'Ushuaïa Dubai Harbour · '+ev.short+' · Post-event report v'+ver,{size:7.5,fill:RC.mut}).text(551,814,'Data as of '+fDT(t)+' GST   ·   '+(i+1)+' / '+d.pages.length,{font:'jb5',size:7.5,fill:RC.mut,align:'r'});});
  d.name=fname;d.ver=ver;return d;}
function reportPos(d,x,y,w,f){const max=Math.max(f.gross,f.breakeven)*1.05,sx=v=>v/max*w,be=sx(f.breakeven);let cx=x;[[f.dep,RC.g2,'Deposits'],[f.tix,RC.g3,'Tickets'],[f.onsite,RC.ink,'On-site']].forEach(a=>{const ww=sx(a[0]),bx=Math.max(cx,x+be);d.rect(cx,y,ww,18,{fill:a[1]});if(cx+ww>bx)d.rect(bx,y,cx+ww-bx,18,{fill:RC.brass});cx+=ww;});
  if(f.committed>0)d.hatch(cx,y,sx(f.committed),18,RC.brass);d.line(x+be,y-8,x+be,y+26,{stroke:RC.ink,lw:1.2});d.text(x+be,y-12,'Breakeven '+aedK(f.breakeven),{font:'mr7',size:8.5,align:'c'});
  let lx=x;[[RC.g2,'Deposits '+aedK(f.dep)],[RC.g3,'Tickets '+aedK(f.tix)],[RC.ink,'On-site '+aedK(f.onsite)],[RC.brass,'Past breakeven '+aedK(Math.max(0,f.collected-f.breakeven))]].forEach(a=>{d.rect(lx,y+36,8,8,{fill:a[0]});d.text(lx+12,y+43,a[1],{size:8.5,fill:RC.ink2});lx+=128;});return y+60;}

/* ---------- SVG backend (preview) ---------- */
const FAM={sg:'Space Grotesk',mr:'Manrope',jb:'JetBrains Mono'};
function pageSVG(pg){let h='';pg.ops.forEach(o=>{const k=o[0];
  if(k==='r'){const s=o[5];h+='<rect x="'+o[1].toFixed(1)+'" y="'+o[2].toFixed(1)+'" width="'+Math.max(0,o[3]).toFixed(1)+'" height="'+Math.max(0,o[4]).toFixed(1)+'" fill="'+(s.fill||'none')+'"'+(s.stroke?' stroke="'+s.stroke+'" stroke-width="'+(s.lw||1)+'"'+(s.dash?' stroke-dasharray="'+s.dash.join(' ')+'"':''):'')+'/>';}
  else if(k==='l'){const s=o[5];h+='<line x1="'+o[1].toFixed(1)+'" y1="'+o[2].toFixed(1)+'" x2="'+o[3].toFixed(1)+'" y2="'+o[4].toFixed(1)+'" stroke="'+s.stroke+'" stroke-width="'+(s.lw||1)+'"/>';}
  else if(k==='p'){const s=o[2];h+='<path d="'+o[1].map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('')+(s.close?'Z':'')+'" fill="'+(s.fill||'none')+'"'+(s.stroke?' stroke="'+s.stroke+'" stroke-width="'+(s.lw||1)+'"':'')+'/>';}
  else if(k==='t'){const s=o[4];h+='<text x="'+o[1].toFixed(1)+'" y="'+o[2].toFixed(1)+'" font-family="'+FAM[s.font.slice(0,2)]+'" font-weight="'+(s.font[2]*100)+'" font-size="'+s.size+'" fill="'+s.fill+'" text-anchor="'+({l:'start',r:'end',c:'middle'}[s.align])+'">'+esc(o[3])+'</text>';}});
  return '<svg viewBox="0 0 595 842" xmlns="http://www.w3.org/2000/svg">'+h+'</svg>';}

/* ---------- PDF backend ---------- */
function b64bytes(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
function pdfBytes(doc){const rgb=h=>{const n=parseInt(h.slice(1),16);return ((n>>16&255)/255).toFixed(3)+' '+((n>>8&255)/255).toFixed(3)+' '+((n&255)/255).toFixed(3);},Y=y=>(842-y).toFixed(2),used={};
  const streams=doc.pages.map(pg=>{let c='';pg.ops.forEach(o=>{const k=o[0];
    if(k==='r'){const s=o[5];if(s.fill)c+=rgb(s.fill)+' rg '+o[1].toFixed(2)+' '+Y(o[2]+o[4])+' '+o[3].toFixed(2)+' '+o[4].toFixed(2)+' re f\n';if(s.stroke)c+=rgb(s.stroke)+' RG '+(s.lw||1)+' w '+(s.dash?'['+s.dash.join(' ')+'] 0 d ':'[] 0 d ')+o[1].toFixed(2)+' '+Y(o[2]+o[4])+' '+o[3].toFixed(2)+' '+o[4].toFixed(2)+' re S\n';}
    else if(k==='l'){const s=o[5];c+=rgb(s.stroke)+' RG '+(s.lw||1)+' w [] 0 d '+o[1].toFixed(2)+' '+Y(o[2])+' m '+o[3].toFixed(2)+' '+Y(o[4])+' l S\n';}
    else if(k==='p'){const s=o[2];if(s.fill)c+=rgb(s.fill)+' rg ';if(s.stroke)c+=rgb(s.stroke)+' RG '+(s.lw||1)+' w [] 0 d ';c+=o[1].map((p,i)=>p[0].toFixed(2)+' '+Y(p[1])+(i?' l':' m')).join(' ')+(s.close?' h':'')+(s.fill&&s.stroke?' B':s.fill?' f':' S')+'\n';}
    else if(k==='t'){const s=o[4];used[s.font]=1;const w=s.align==='l'?0:textW(o[3],s.font,s.size),x=o[1]-(s.align==='r'?w:s.align==='c'?w/2:0);let str='';for(const b of winBytes(o[3])){str+=b===40||b===41||b===92?'\\'+String.fromCharCode(b):b<127?String.fromCharCode(b):'\\'+b.toString(8).padStart(3,'0');}
      c+='BT /'+s.font+' '+s.size+' Tf '+rgb(s.fill)+' rg '+x.toFixed(2)+' '+Y(o[2])+' Td ('+str+') Tj ET\n';}});return c;});
  const parts=[],off=[];let pos=0;const enc=new TextEncoder(),push=d=>{const u=typeof d==='string'?enc.encode(d):d;parts.push(u);pos+=u.length;},fonts=Object.keys(used),objs=[];
  /* object numbers: 1 catalog, 2 pages, then 3 per font, then 2 per page */
  const fObj=i=>3+i*3,pObj=i=>3+fonts.length*3+i*2,total=2+fonts.length*3+doc.pages.length*2;
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');const obj=(n,body)=>{off[n]=pos;push(n+' 0 obj\n');body();push('\nendobj\n');};
  obj(1,()=>push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2,()=>push('<< /Type /Pages /Count '+doc.pages.length+' /Kids ['+doc.pages.map((_,i)=>pObj(i)+' 0 R').join(' ')+'] >>'));
  fonts.forEach((k,i)=>{const F=FONTS[k],m=F.m,bytes=b64bytes(F.b64),nm='BUBL'+k.toUpperCase();
    obj(fObj(i),()=>push('<< /Type /Font /Subtype /TrueType /BaseFont /'+nm+' /FirstChar 32 /LastChar 255 /Widths ['+m.w.join(' ')+'] /Encoding /WinAnsiEncoding /FontDescriptor '+(fObj(i)+1)+' 0 R >>'));
    obj(fObj(i)+1,()=>push('<< /Type /FontDescriptor /FontName /'+nm+' /Flags '+(m.mono?33:32)+' /FontBBox ['+m.bbox.join(' ')+'] /ItalicAngle 0 /Ascent '+m.asc+' /Descent '+m.desc+' /CapHeight '+m.cap+' /StemV '+(m.wght>600?120:80)+' /FontFile2 '+(fObj(i)+2)+' 0 R >>'));
    obj(fObj(i)+2,()=>{push('<< /Length '+bytes.length+' /Length1 '+bytes.length+' >>\nstream\n');push(bytes);push('\nendstream');});});
  const res='<< /Font << '+fonts.map((k,i)=>'/'+k+' '+fObj(i)+' 0 R').join(' ')+' >> >>';
  doc.pages.forEach((_,i)=>{const body=enc.encode(streams[i]);obj(pObj(i),()=>push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources '+res+' /Contents '+(pObj(i)+1)+' 0 R >>'));obj(pObj(i)+1,()=>{push('<< /Length '+body.length+' >>\nstream\n');push(body);push('\nendstream');});});
  const xref=pos;push('xref\n0 '+(total+1)+'\n0000000000 65535 f \n');for(let n=1;n<=total;n++)push(String(off[n]).padStart(10,'0')+' 00000 n \n');
  push('trailer\n<< /Size '+(total+1)+' /Root 1 0 R /Info << /Title ('+doc.name.replace(/[()\\]/g,'')+') /Producer (BUBL OPS) >> >>\nstartxref\n'+xref+'\n%%EOF');
  const out=new Uint8Array(pos);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length;});return out;}

/* ---------- viewer + export ---------- */
let _rep=null;
ON.report=()=>{if(S().ph==='pre'){toast('The report is available once doors have opened.');return;}if(!(isOn('pay')&&isOn('pos')&&isOn('hist'))){toast('The event report builds once Adyen, the POS and past season records are connected.');return;}_rep=buildReport();
  Sheet.open({title:'Post-event report',sub:()=>N(_rep.pages.length)+' pages · A4 · version '+N(_rep.ver),tall:true,static:true,body:()=>'<div class="rp-pages">'+_rep.pages.map(pageSVG).join('')+'</div>',
    foot:()=>'<button class="btn pri full" data-act="reportDl">'+I('share',18)+'Download and share PDF</button><p class="note n" style="text-align:center">'+esc(_rep.name)+'</p>'});};
ON.reportDl=async()=>{const doc=_rep||buildReport(),bytes=pdfBytes(doc),blob=new Blob([bytes],{type:'application/pdf'});W.reportV=doc.ver;log('Report exported',doc.name+', version '+doc.ver+', '+Math.round(bytes.length/1024)+' KB');
  try{const file=new File([blob],doc.name,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:doc.name});toast('Report shared. Version '+N(doc.ver)+' saved.');return;}}catch(e){if(e&&e.name==='AbortError')return;}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=doc.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);toast('Saved '+esc(doc.name)+' · '+N(Math.round(bytes.length/1024))+' KB');}catch(_){toast('This preview blocks downloads. Open the app outside the preview to save the PDF.');}};
