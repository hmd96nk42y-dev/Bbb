/* What this page does not offer yet in test and live mode.
   CLAUDE.md rule 5: the page only offers what BUBL really does. Each line below is a part of Sk's design whose back end
   is not wired yet. In test and live mode it is hidden, not faked. In demo mode nothing here applies: the page behaves
   exactly as the build does. As each part is wired, its line comes out of this file. */
const NOT_YET=LIVE?{
  menu:'#menuBtn,#tsMenu,#msPre,.hn-acts [data-go="menu"],#msNote',  /* the menu and pre-orders: Ushuaïa's menu is not in its profile (DECISIONS question 57) */
  interested:'.ip-int',                                    /* the Interested wall inside an invitation: its "Invite" needs messaging (step 11). The wall on the page is real */
  member:'#vPriv',                                         /* the Backstage List's privileges: nothing real feeds them yet. "Access your experience" itself is real */
  whatsapp:'#waBox',                                       /* the venue's WhatsApp line: the build's number is a placeholder */
  follow:'.soc-follow',                                    /* "Follow" only showed a message; it does nothing real yet */
  decisions:'#tabDec',                                     /* nudge the rest, arrival reminder: messaging is step 11 */
  sms:'#sSMS,#smsForm',                                    /* sending the invite by SMS from the page: messaging is step 11 */
  crowd:'#rsLocked',                                       /* "Your crowd": the matchmaking brain is not built */
  spent:'#minSpend>.sec-hd,#minSpend .ms-nums,#msBar,#msOver,#msNote,#msPre,#hostBlock .vp-stats>div:nth-child(3)'   /* spend toward the minimum: needs pre-orders or the POS; a nought is never shown in its place. The table votes in the same section are real */
}:null;
if(NOT_YET){const st=document.createElement('style');st.id='not-yet-css';st.textContent=Object.keys(NOT_YET).map(k=>NOT_YET[k]).join(',')+'{display:none!important}'
  +'.ip-preview .ip-claimbtn,.ip-preview .ip-claim{display:none!important}';   /* the host previewing their invitation has nothing to claim */
  document.head.appendChild(st);}
/* the same question, for code: is this part offered here? (always yes in demo) */
const offered=k=>!NOT_YET||!(k in NOT_YET);
