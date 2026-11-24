/* The guest page's line to BUBL's back end.
   One place that knows how to sign a phone in and how to call the back end's doors (supabase/functions/README.md).
   The page says which venue it is and what it wants; this adds who is asking, from their sign-in.

   Three things the page never sends, because the back end will not take them from a phone:
     - WHO is acting (it is read from the sign-in),
     - WHEN (the back end's own clock is used),
     - what is OWED (the database says; the only amounts a guest chooses are a price point and a public-table offer).

   In demo mode there is no back end at all: `live` is false and nothing here is called. */
(function (root) {
  'use strict';
  var cfg = root.BUBL_CONFIG || {};
  var live = (cfg.mode === 'test' || cfg.mode === 'live') && !!cfg.supabaseUrl && !!cfg.publishableKey;
  var base = String(cfg.supabaseUrl || '').replace(/\/+$/, '');
  var client = null, simGuest = false;
  function sb() {
    if (!client) client = root.supabase.createClient(base, cfg.publishableKey, { auth: simGuest
      ? { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false }
      : { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'bubl.signin' } });
    return client;
  }
  var no = function (code, reason) { return { ok: false, code: code, reason: reason }; };
  var OFFLINE = 'No connection just now. Check your signal and try again.';
  var LATER = 'That could not be done just now. Please try again in a moment.';

  /** POST <back end>/functions/v1/<fn>/<route>. Always answers { ok:true, … } or { ok:false, code, reason }. Never throws. */
  async function call(fn, route, body) {
    if (!live) return no('demo', 'This page is a demo: nothing is sent.');
    var token = null;
    try { var s = await sb().auth.getSession(); token = s && s.data && s.data.session ? s.data.session.access_token : null; } catch (_) {}
    var res;
    try {
      res = await fetch(base + '/functions/v1/' + fn + '/' + route, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: cfg.publishableKey, authorization: 'Bearer ' + (token || cfg.publishableKey) },
        body: JSON.stringify(body || {}),
      });
    } catch (_) { return no('offline', OFFLINE); }
    var j = null; try { j = await res.json(); } catch (_) {}
    if (j && typeof j === 'object' && typeof j.ok === 'boolean') return j;
    return no(res.status === 401 ? 'sign_in_needed' : 'unavailable', res.status === 401 ? 'Please sign in first.' : LATER);
  }

  /* ---- the phone is the login: a code is sent, the guest types it in ---- */
  function authSays(error) {
    var m = String((error && error.message) || ''), status = error && error.status;
    if (/rate limit|only request this after|too many/i.test(m) || status === 429) return no('slow_down', 'Too many tries. Wait a minute, then ask for a new code.');
    if (/expired|invalid/i.test(m)) return no('code_wrong', "That code doesn't match. Check the message we just sent, or ask for a new one.");
    if (/phone/i.test(m) && /invalid|format/i.test(m)) return no('phone_invalid', 'That number could not be reached. Check it and try again.');
    if (/fetch|network/i.test(m)) return no('offline', OFFLINE);
    return no('unavailable', LATER);
  }
  /* A one-time key from one of bubl concierge's buttons (after the "#"): taken out of the address the moment the page
     starts, before anything else loads, so it is never left where it could be copied or shared. */
  var chatKey = null;
  if (live) {
    try {
      var host = root.parent, hash = host.location.hash || '', found = /(?:^#|&)k=([A-Za-z0-9_-]{43})(?:&|$)/.exec(hash);
      /* opened by the showcase studio as a simulated guest: this page keeps its sign-in in memory only, so whoever is
         signed in on this browser is neither used nor replaced */
      simGuest = /(?:^#|&)sim=1(?:&|$)/.test(hash);
      if (found) chatKey = found[1];
      if (found || simGuest) host.history.replaceState(null, '', host.location.pathname + host.location.search);
    } catch (_) {}
  }
  var auth = {
    /** Sends the login code. channel: 'sms' until BUBL's WhatsApp sender exists (docs/runbooks/phone-sign-in.md). */
    async sendCode(e164, channel) {
      if (!live) return no('demo', 'This page is a demo: nothing is sent.');
      try { var r = await sb().auth.signInWithOtp({ phone: e164, options: { channel: channel || 'sms' } }); return r.error ? authSays(r.error) : { ok: true }; } catch (e) { return authSays(e); }
    },
    async verify(e164, code) {
      if (!live) return no('demo', 'This page is a demo: nothing is sent.');
      try { var r = await sb().auth.verifyOtp({ phone: e164, token: String(code), type: 'sms' }); return r.error ? authSays(r.error) : { ok: true }; } catch (e) { return authSays(e); }
    },
    /** The phone number signed in on this device (as +971…), or null. */
    async phone() {
      if (!live) return null;
      try { var s = await sb().auth.getSession(), u = s.data.session && s.data.session.user; return u && u.phone ? '+' + String(u.phone).replace(/^\+/, '') : null; } catch (_) { return null; }
    },
    /* Out of THIS page's own sign-in only. Supabase's sign-out ends every sign-in of the account everywhere unless told
       otherwise, and the guest app, OPS and the studio can all be open on one browser as the same person (Sk, 24 Nov
       2026: signing in to OPS signed the studio out). */
    async signOut() { if (live) { try { await sb().auth.signOut({ scope: 'local' }); } catch (_) {} } },
    /** The key bubl's button carried, once. */
    takeChatKey() { var k = chatKey; chatKey = null; return k; },
    /** A sign-in handed over by bubl concierge, for the guest whose own chat the link came from (js/live-concierge.js). */
    async enter(session) {
      if (!live || !session || !session.access_token || !session.refresh_token) return false;
      try { var r = await sb().auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }); return !r.error; } catch (_) { return false; }
    },
  };

  /* ---- which tables are taken, kept up to date while the page is open ---- */
  /** Calls onChange(set of taken table keys) now, then whenever it changes. Returns a function that stops it. */
  function watchTables(service, night, onChange) {
    var taken = new Set(), stopped = false, timer = null, channel = null;
    var body = { venue: cfg.venue, service: service }; if (night) body.night = night;
    async function refresh() {
      if (stopped) return; var r = await call('guest', 'availability', body);
      if (stopped || !r.ok) return; taken = new Set(r.taken || []); onChange(taken);
    }
    function wake() { if (!document.hidden) refresh(); }
    refresh(); timer = setInterval(refresh, 20000); document.addEventListener('visibilitychange', wake);
    /* the back end also says so the moment a table is taken or freed; the 20-second check is the safety net */
    try {
      channel = sb().channel('availability:' + cfg.venue + ':' + service + (night ? ':' + night : ''));
      channel.on('broadcast', { event: 'table' }, function (m) {
        var p = m && m.payload; if (!p || typeof p.table !== 'string') return;
        if (p.taken) taken.add(p.table); else taken.delete(p.table); onChange(new Set(taken));
      }).subscribe();
    } catch (_) { channel = null; }
    return function stop() { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', wake); try { if (channel) sb().removeChannel(channel); } catch (_) {} };
  }

  var guest = function (route) { return function (body) { return call('guest', route, body); }; };
  var withVenue = function (route) { return function (body) { return call('guest', route, Object.assign({ venue: cfg.venue }, body || {})); }; };
  var api = {
    live: live, mode: cfg.mode || 'demo', venueSlug: cfg.venue || null, call: call, auth: auth, watchTables: watchTables,
    /* reading */
    venue: withVenue('venue'), availability: withVenue('availability'), link: guest('link'), me: withVenue('me'),
    /* the guest's own record, holding a table, joining a link */
    signUp: guest('sign-up'), hold: withVenue('hold'), join: guest('join'),
    /* the host's side of the deposit */
    hostView: guest('host-view'), depositOption: guest('deposit-option'), split: guest('split'), pricePoint: guest('price-point'), pricePointChange: guest('price-point-change'), pricePointRemove: guest('price-point-remove'),
    cover: guest('cover'), payItAll: guest('pay-it-all'), seatAmount: guest('seat-amount'), coverSeat: guest('cover-seat'), answerAmount: guest('answer-amount'), reminders: guest('reminders'),
    /* the card step (supabase/functions/payments) */
    pay: function (b) { return call('payments', 'pay', b); }, payRefresh: function (b) { return call('payments', 'refresh', b); }, reset: function (b) { return call('payments', 'reset', b); },
    payNow: function (b) { return call('payments', 'pay-now', Object.assign({ venue: cfg.venue }, b || {})); }, abandon: function (b) { return call('payments', 'abandon', b); }, payPublic: function (b) { return call('payments', 'pay-public', b); },
    payTicket: function (b) { return call('payments', 'pay-ticket', Object.assign({ venue: cfg.venue }, b || {})); },
    /* public tables (supabase/functions/public-tables) */
    social: function (route, b) { return call('public-tables', route, b); },
  };
  root.BUBL = root.BUBL || {}; Object.assign(root.BUBL, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
