/* The first look at a name and an email, on the guest's phone.
   BUBL's server makes the real checks (packages/core/name_check.ts and email.ts) and quietly flags borderline names
   for the door. This only mirrors the OBVIOUS blocks, so a guest hears about a mistake before the form is sent.
   It must never refuse a name the server would let in (tests/unit/web_checks.test.ts): when in doubt, it says ok. */
(function (root) {
  'use strict';
  var NAME_BLOCKED = 'Please enter your full name exactly as it appears on your ID.';
  var OBVIOUS = /^(test|testing|guest|none|null|na|n a|xxx+|asdf\w*|qwer\w*|john doe|jane doe|mickey mouse|donald duck|elon musk|santa claus|batman|spider ?man|no name|anonymous|unknown)$/;

  /** 'ok' or 'blocked'. The rules are the ones in Sk's build, unchanged. */
  function nameCheck(n) {
    n = String(n || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
    var k = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!/\p{L}/u.test(n)) return 'blocked';
    if (/[\p{N}]/u.test(n) || /[^\p{L}\p{M}\s'\-.·,()]/u.test(n)) return 'blocked';
    var L = Array.from(k.replace(/[^\p{L}]/gu, ''));
    if (L.length < 2 || L.every(function (c) { return c === L[0]; }) || /(.)\1{3,}/u.test(k)) return 'blocked';
    if (OBVIOUS.test(k)) return 'blocked';
    return 'ok';
  }
  function emailOk(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }

  var api = { nameCheck: nameCheck, emailOk: emailOk, NAME_BLOCKED: NAME_BLOCKED };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.BUBL = root.BUBL || {}; root.BUBL.checks = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
