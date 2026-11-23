/* Starts a venue's page.
   In demo mode the page starts at once, on the simulated data written in its skin, exactly as Sk's build did.
   In test and live mode the venue's own facts are asked for first (its nights, tiers, tables and rules, as they stand
   in BUBL's database right now), and the page starts once they are here: BUBL.page holds them.
   Nothing about a venue is written in this file. */
(function (root) {
  'use strict';
  var B = root.BUBL = root.BUBL || {};

  /** Loads the skin's scripts together and runs them in the order given, as if they were written in the page. */
  function run(list) {
    list.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; document.body.appendChild(s); });
  }

  /** opts.skin: the skin's scripts, in order. */
  B.start = function (opts) {
    if (!B.live) { run(opts.skin); return; }
    var wait = 1500, note = null;
    function say(text) {
      if (!note) {
        note = document.createElement('p'); note.setAttribute('role', 'status');
        note.style.cssText = 'position:fixed;left:0;right:0;top:46%;margin:0;padding:0 28px;text-align:center;z-index:9999;color:rgba(255,255,255,.72);font:500 15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
        document.body.appendChild(note);
      }
      note.textContent = text;
    }
    (async function ask() {
      var r = await B.venue();
      if (r.ok && !(r.events || []).some(function (e) { return !e.over; }) && !(r.sessions || []).length) { say('No nights are on sale yet. Check back soon.'); return; }
      if (r.ok) { if (note) note.remove(); B.page = r; run(opts.skin); return; }
      /* no answer: say so quietly, and keep trying. The page never starts on made-up data. */
      say(r.code === 'not_found' ? 'This venue is not open on BUBL yet.' : 'Can’t reach BUBL just now. Trying again…');
      if (r.code === 'not_found') return;
      setTimeout(ask, wait); wait = Math.min(wait * 2, 12000);
    })();
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
