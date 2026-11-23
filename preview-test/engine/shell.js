/* The phone shell every venue's guest page sits in.
   It shows the page full-screen on a phone (and as a phone-width column on a wider screen), keeps a spinner up while
   the page loads, hands the phone's notch height to the page, and fits the page to the real screen when the app is
   opened from the home screen. Nothing here belongs to one venue: the venue's page says which file to load. */
(function () {
  var cfg = window.BUBL_SHELL || {};
  var frame = document.getElementById('screen'), loader = document.getElementById('loader');
  var current = null;

  function loadApp(src) {
    if (!src || src === current) return; current = src;
    document.documentElement.style.setProperty('--acc', 'var(' + (cfg.accent || '--c-guest') + ')');
    document.body.style.background = cfg.background || '#000000';
    frame.classList.remove('ready'); loader.classList.add('on');
    requestAnimationFrame(function () {
      frame.src = src; var n = 0;
      var iv = setInterval(function () {
        n++; var ok = false;
        try { var d = frame.contentDocument; ok = !!(d && d.readyState !== 'loading' && d.getElementById('app')); } catch (_) { ok = n > 20; }
        if (ok || n > 40) { clearInterval(iv); loader.classList.remove('on'); frame.classList.add('ready'); }
      }, 150);
    });
  }

  frame.addEventListener('load', function () {
    if (!current) return; loader.classList.remove('on'); frame.classList.add('ready');
    /* hand the real notch inset to the page (iframes read env() as 0 on iOS) */
    try {
      var p = document.createElement('div'); p.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px)';
      document.body.appendChild(p); var v = getComputedStyle(p).paddingTop || '0px'; p.remove();
      frame.contentDocument.documentElement.style.setProperty('--sat-host', v);
    } catch (_) {}
  });

  /* Home-screen launch ONLY: drive the page's height from a live measurement so it fills the true screen.
     In a normal Safari tab this whole block is skipped and the default inset:0/100% is used. */
  (function () {
    var isStandalone = (window.navigator.standalone === true) || (window.matchMedia && window.matchMedia('(display-mode:standalone)').matches);
    if (!isStandalone) return;
    document.body.classList.add('pwa');
    function setPH() {
      var h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0, (window.visualViewport && window.visualViewport.height) || 0);
      if (h > 200) { document.documentElement.style.setProperty('--ph', h + 'px'); }
    }
    setPH();
    [50, 200, 500, 1000].forEach(function (t) { setTimeout(setPH, t); });
    window.addEventListener('resize', setPH);
    window.addEventListener('orientationchange', function () { setTimeout(setPH, 150); setTimeout(setPH, 500); });
    window.addEventListener('pageshow', setPH);
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', setPH); }
  })();

  /* Which kind of data this page is showing, said on the page itself (BUILD_SPEC sections 2 and 15, CLAUDE.md rule 4).
     DEMO: everything on the page is simulated. TEST: real venue data, test bookings and test payments. A live venue shows nothing. */
  (function () {
    var mode = String(cfg.mode || '').toLowerCase(); if (mode !== 'demo' && mode !== 'test') return;
    var r = document.createElement('div'); r.id = 'bublMode'; r.textContent = mode.toUpperCase(); r.setAttribute('role', 'note');
    r.setAttribute('aria-label', mode === 'demo' ? 'Demo: everything on this page is simulated' : 'Test mode: test bookings and test payments');
    r.style.cssText = 'position:fixed;z-index:950;top:calc(env(safe-area-inset-top,0px) + 6px);left:50%;transform:translateX(-50%);pointer-events:none;'
      + 'font:700 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:.16em;padding:4px 8px 4px 9px;border-radius:999px;'
      + 'color:#fff;background:rgba(255,255,255,.16);box-shadow:0 0 0 1px rgba(255,255,255,.22) inset;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)';
    document.body.appendChild(r);
  })();

  /* a link someone was sent (…/?i=<token>) is handed on to the page */
  loadApp(cfg.app + (location.search || ''));
})();
