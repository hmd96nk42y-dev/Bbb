'use strict';
/* ============================================================
   LIVE STUBS · loaded in test and live mode only
   Staff chat, the guest inbox, chat summaries, links sent to guests and
   the invitation preview are demo-only for now (js/92-chats.js,
   92b, 92c, 93-links.js, 94-invitation-preview.js): nothing carries a
   message yet (messaging is step 11, team chat is DECISIONS question
   75), and those files hold the demo's staff and its made-up
   conversations. They are not loaded here at all.
   A few other screens call into them. These are what those calls find.
   ============================================================ */
const Chat={render(){},update(){},tick(){}};
const STAFF={};
const canGuestChat=()=>false;
const chatUnreadAll=()=>0;
const gchSeed=()=>[];
const myName=()=>ROLES[UI.role].who;
const waDigits=()=>'';
const waRow=()=>'';
const openWA=()=>{};
const openCompose=()=>{};
const openInvite=()=>{};
/* copying a link to the clipboard is the same as in the build */
async function copyText(t){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);return true;}}catch(_){}
  try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:0;top:0;opacity:0;font-size:16px';document.body.appendChild(ta);
    ta.select();ta.setSelectionRange(0,t.length);const ok=document.execCommand('copy');ta.remove();return ok;}catch(_){return false;}}
