/* Starts a venue's OPS page.
   In demo mode the page starts on the simulated night written in its skin, exactly as Sk's build did, and says DEMO.
   In test and live mode nobody sees anything until they have signed in as a member of the venue's staff; the page then
   starts on what BUBL's back end holds for that person's role, and nothing else (ops/engine/live.js).
   Nothing about a venue is written in this file. */
(function (root) {
  'use strict';
  var B = root.BUBL = root.BUBL || {};
  var cfg = root.BUBL_CONFIG || {};
  var mode = String(cfg.mode || 'demo').toLowerCase();
  B.mode = mode;
  B.opsLive = (mode === 'test' || mode === 'live') && !!cfg.supabaseUrl && !!cfg.publishableKey;

  /** Runs scripts in the order given, as if they were written in the page; then calls done. */
  function run(list, done) {
    var left = list.length; if (!left && done) done();
    list.forEach(function (src) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = s.onerror = function () { if (--left === 0 && done) done(); };
      document.body.appendChild(s);
    });
  }
  B.runScripts = run;
  /** Sk's page starts itself with boot(); it is handed over as OPS_START and called once every file has run. */
  function go() { if (typeof root.OPS_START === 'function') root.OPS_START(); }

  /* Which kind of data this page is showing, said on the page itself (BUILD_SPEC sections 2 and 15, CLAUDE.md rule 4).
     The same small label as the guest app. A live venue shows nothing. */
  function label() {
    if (mode !== 'demo' && mode !== 'test') return;
    var r = document.createElement('div'); r.id = 'bublMode'; r.textContent = mode.toUpperCase(); r.setAttribute('role', 'note');
    r.setAttribute('aria-label', mode === 'demo' ? 'Demo: everything on this page is simulated' : 'Test mode: real bookings, test payments');
    r.style.cssText = 'position:fixed;z-index:950;top:calc(env(safe-area-inset-top,0px) + 2px);left:50%;transform:translateX(-50%);pointer-events:none;'
      + 'font:700 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:.16em;padding:4px 8px 4px 9px;border-radius:999px;'
      + 'color:#fff;background:rgba(255,255,255,.16);box-shadow:0 0 0 1px rgba(255,255,255,.22) inset;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)';
    document.body.appendChild(r);
  }

  /** A page that used to be packed inside the build as text, read as the text it is. */
  function page(src) { return fetch(src).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; }); }

  /** opts.skin: the skin's scripts, in order. A plain name is loaded in every mode; { demo: name } only by a demo page
      (the simulated night and everything made up for it); { live: name } only by a test or live page (the real night). */
  B.startOps = function (opts) {
    label();
    var pick = function (m) { return opts.skin.map(function (x) { return typeof x === 'string' ? x : x[m]; }).filter(Boolean); };
    if (!B.opsLive) {
      /* demo: the invitation preview and the 3D venue it draws are read first, as they were inside the build */
      Promise.all([page('invitation.html'), page('room.html')]).then(function (p) {
        root.OPS_PAGES = { invitation: p[0], room: p[1] };
        run(pick('demo'), go);
      });
      return;
    }
    /* test and live: the shared pieces (sign-in, phone numbers, QR), then the OPS line to the back end, then sign-in.
       The page itself starts only once a member of the venue's staff is signed in and their night has arrived. */
    run(['../../engine/vendor/supabase.js', '../../engine/vendor/libphonenumber-mobile.js', '../../engine/vendor/uqr.js', '../../engine/money.js',
      '../../engine/phone.js', '../../engine/qr.js', '../../engine/api.js', '../engine/api.js', '../engine/sign-in.js'], function () {
      B.opsSignIn(function () { run(pick('live'), go); });
    });
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
