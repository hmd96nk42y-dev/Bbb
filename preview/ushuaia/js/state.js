/* ================= state ================= */
/* LIVE: the page is showing the venue's real data from BUBL's back end (test or live mode). PAGE is what the back end
   sent for this venue. In demo mode both are off and everything below runs on the build's own simulated data.
   UNIT: demo keeps the build's whole dirhams; live works in the back end's minor units (fils), so nothing is ever rounded. */
const LIVE=!!(window.BUBL&&BUBL.live&&BUBL.page),PAGE=LIVE?BUBL.page:null,UNIT=LIVE?100:1,CUR=LIVE?PAGE.venue.currency:'AED';
const S={ev:null,sec:null,date:null,time:null,party:null,boothId:null,pick:null,guests:[],openPicker:null,autoConfirmed:false,vip:false,view:null};
const basket={items:[],total:0,credit:0};
const PRE_OFF=.10;   /* pre-order: 10% off, counted at full menu value toward the minimum */
const VENUE_SRC='room.html';   /* the 3D venue, a page of its own */
const GAL=window.GAL={p1:'media/p1.jpg',p2:'media/p2.jpg',p3:'media/p3.jpg',p4:'media/p4.jpg',p5:'media/p5.jpg',p6:'media/p6.jpg',u1:'media/u1.jpg',u2:'media/u2.jpg',v1:'media/v1.webp',v2:'media/v2.webp',tIn:'media/tIn.jpg',tMenu:'media/tMenu.jpg'};
