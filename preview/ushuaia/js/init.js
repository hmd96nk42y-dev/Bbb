/* ================= init ================= */
(function(){const first=LIVE?EVENTS[0]:(EVENTS.find(e=>e.id==='bc')||EVENTS[0]);applyEvent(first);   /* demo: the app always opens on Black Coffee. live: on the next night */buildEvents();setLbl('#pkDate',first.short);})();
buildParty();renderRoom();if(LIVE)(async()=>{if(!(await openGuestLink()))restoreMine();})();   /* a guest coming back finds their table as they left it */
buildSocials();renderInterested();updateBasket();renderBudget();if(window.lcGlowExcl)window.lcGlowExcl();
/* the screen never scrolls itself (iOS keyboards and scroll-into-view can nudge overflow:hidden containers) */
(function(){const sc=document.getElementById('screen');if(sc)sc.addEventListener('scroll',()=>{if(sc.scrollTop||sc.scrollLeft){sc.scrollTop=0;sc.scrollLeft=0;}},{passive:true});})();
