/* ═════════ PARTY BLACKOUT — venue drops the lights, the whole room goes pitch black ═════════
   Host-only: reads the venue's live party envelope (same-origin) and blacks out everything
   except the venue rectangle, so its party lights are the only source of light. The blackout
   tracks the party's own energy curve, so it fades in and out exactly with the lights, then
   the booking UI returns to normal. The 3D venue itself is never touched. */
(function(){
  var st=document.createElement('style');st.id='party-blackout-css';
  st.textContent='#partyBlackout{position:fixed;z-index:9990;border-radius:14px;pointer-events:none;opacity:0;'
    +'will-change:opacity,box-shadow,left,top,width,height;box-shadow:0 0 0 0 rgba(0,0,0,0);}'
    +'@media (prefers-reduced-motion:reduce){#partyBlackout{transition:opacity .12s linear;}}';
  document.head.appendChild(st);

  var bo=null, raf=0, started=0;
  function el(){ if(bo) return bo; bo=document.createElement('div'); bo.id='partyBlackout'; document.body.appendChild(bo); return bo; }
  function venueRect(){ var c=document.getElementById('roomCanvas'); return c?c.getBoundingClientRect():null; }
  function cw(){ try{ var f=document.querySelector('#roomCanvas iframe'); return f&&f.contentWindow; }catch(_){ return null; } }

  function frame(){
    var w=cw(), party=null, e=0, p=0, active=false;
    try{ party=(window.__hostParty&&window.__hostParty.active)?window.__hostParty:null; if(party){ active=!!party.active; e=+party.energy||0; p=+party.pulse||0; } }catch(_){ }
    var k=Math.max(0,Math.min(1,e*1.14));                 // darkness tracks the party light envelope
    if(active || k>0.002){
      var b=el(), r=venueRect();
      if(r){ b.style.left=r.left+'px'; b.style.top=r.top+'px'; b.style.width=r.width+'px'; b.style.height=r.height+'px'; }
      b.style.boxShadow='0 0 0 130vmax rgba(0,0,0,1)';   // pure black, no border/halo
      b.style.opacity=k.toFixed(3);
      var rc=document.getElementById('roomCanvas'); if(rc) rc.style.background='rgba(0,0,0,'+k.toFixed(3)+')';
      if(performance.now()-started>4000){ done(); return; } // failsafe
      raf=requestAnimationFrame(frame);
    } else { done(); }
  }
  function done(){ if(raf){cancelAnimationFrame(raf);raf=0;} if(bo){bo.style.opacity='0';} var rc=document.getElementById('roomCanvas'); if(rc) rc.style.background=''; }

  setInterval(function(){
    if(raf) return;
    var w=cw(), active=false;
    try{ active=!!(window.__hostParty&&window.__hostParty.active); }catch(_){ }
    if(active){ started=performance.now(); raf=requestAnimationFrame(frame); }
  },110);
})();
