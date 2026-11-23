/* The staff sign-in (test and live mode only; Sk, 20 Nov 2026: "add one, in OPS's style").
   Sk's OPS build has no sign-in: the role is picked with four buttons. Here the role comes from the person's staff
   account, so nobody sees anything until they have signed in with their mobile number and the six-digit code, and the
   back end has said they are on this venue's team and what their role is.
   The screen is made only of pieces the build already has: its sheet, its input, its buttons, its number pad.
   Nothing about a venue is written here. */
(function (root) {
  'use strict';
  var B = root.BUBL = root.BUBL || {};
  var el = null;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function frame(title, sub, body, foot) {
    if (!el) {
      el = document.createElement('div'); el.id = 'opsSignIn';
      el.style.cssText = 'position:fixed;inset:0;z-index:900;background:#000;display:flex;align-items:flex-end;justify-content:center';
      document.body.appendChild(el);
    }
    el.innerHTML = '<div class="sheet on" style="position:relative;width:100%;max-width:520px;max-height:100%;transform:none">'
      + '<div class="sh-hd" style="padding-top:22px"><div class="t"><h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p></div></div>'
      + '<div class="sh-body" style="padding:6px 16px 16px;overflow:auto">' + body + '</div>'
      + '<div class="sh-foot" style="padding:0 16px calc(18px + env(safe-area-inset-bottom,0px))">' + (foot || '') + '</div></div>';
    return el;
  }
  function note(text, bad) { var n = el && el.querySelector('#siNote'); if (n) { n.textContent = text || ''; n.style.color = bad ? 'var(--bad,#ff6b6b)' : ''; } }
  function busy(on) { var b = el && el.querySelector('#siGo'); if (b) b.disabled = !!on; }

  /** Step 1: the mobile number. */
  function askNumber(done, said) {
    frame('Sign in to BUBL OPS', 'Your mobile number, as your manager added it.',
      '<div class="grp"><div class="lbl">Mobile number</div><input class="inp" id="siPhone" inputmode="tel" autocomplete="tel" placeholder="+971 5…" maxlength="20"></div>'
      + '<p class="note" id="siNote" role="status" style="margin-top:10px">' + esc(said || 'We text you a six-digit code.') + '</p>',
      '<button class="btn pri" id="siGo" style="width:100%">Send my code</button>');
    var input = el.querySelector('#siPhone'); if (said) note(said, true);
    var go = async function () {
      var p = B.phone.parse(input.value, '971');
      if (!p.ok) { note('Enter your full mobile number, with the country code.', true); return; }
      busy(true); note('Sending…');
      var r = await B.auth.sendCode(p.e164);
      busy(false);
      if (!r.ok) { note(r.reason || 'The code could not be sent. Try again.', true); return; }
      askCode(p.e164, done);
    };
    el.querySelector('#siGo').addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    setTimeout(function () { try { input.focus(); } catch (_) {} }, 50);
  }

  /** Step 2: the six digits, on the build's own number pad. */
  function askCode(e164, done) {
    var v = '';
    var paint = function () {
      var d = el.querySelector('#siDots'); if (!d) return;
      d.innerHTML = [0, 1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i < v.length ? 'on' : '') + '"></i>'; }).join('');
    };
    frame('Enter your code', 'Sent to ' + B.phone.pretty(e164) + '.',
      '<div class="pin-dots" id="siDots"></div><p class="note" id="siNote" role="status" style="text-align:center;min-height:18px"></p>'
      + '<div class="pin-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (d) { return '<button data-k="' + d + '">' + d + '</button>'; }).join('')
      + '<button data-k="back" aria-label="Use another number" style="font:600 12px var(--body)">Change</button><button data-k="0">0</button><button data-k="del" aria-label="Delete">⌫</button></div>');
    paint();
    var checking = false;
    el.querySelector('.pin-pad').addEventListener('click', async function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b || checking) return;
      var k = b.dataset.k;
      if (k === 'back') { askNumber(done); return; }
      if (k === 'del') v = v.slice(0, -1); else if (v.length < 6) v += k;
      paint();
      if (v.length < 6) return;
      checking = true; note('Checking…');
      var r = await B.auth.verify(e164, v);
      if (!r.ok) { checking = false; v = ''; paint(); el.querySelector('#siDots').classList.add('err'); note(r.reason || 'That code is not right.', true); return; }
      enter(done);
    });
  }

  /** Signed in: is this number on the venue's team, and as what? Then their night. */
  async function enter(done) {
    frame('BUBL OPS', 'Opening your night…', '<p class="note" id="siNote" role="status"></p>');
    var me = await B.ops('me');
    if (!me.ok) {
      if (me.code === 'not_staff') {
        frame('Not on the team yet', 'This number is not on this venue’s team.',
          '<p class="note">Ask your manager to add your mobile number in BUBL, then sign in again.</p>',
          '<button class="btn" id="siOut" style="width:100%">Use another number</button>');
        el.querySelector('#siOut').addEventListener('click', async function () { await B.auth.signOut(); askNumber(done); });
        return;
      }
      if (me.code === 'sign_in_needed') { await B.auth.signOut(); askNumber(done, 'Please sign in again.'); return; }
      note(me.reason || 'Can’t reach BUBL just now. Trying again…', true);
      setTimeout(function () { enter(done); }, 3000); return;
    }
    var night = await B.opsNight(B.opsServiceId || null);
    if (!night.ok) { note(night.reason || 'Can’t reach BUBL just now. Trying again…', true); setTimeout(function () { enter(done); }, 3000); return; }
    if (!night.events || !night.events.length) {
      frame('No nights yet', 'This venue has no events in BUBL yet.', '<p class="note">Once a night is added it opens here.</p>',
        '<button class="btn" id="siOut" style="width:100%">Sign out</button>');
      el.querySelector('#siOut').addEventListener('click', async function () { await B.auth.signOut(); askNumber(done); });
      return;
    }
    B.staff = me; B.night = night;
    if (el) { el.remove(); el = null; }
    done();
  }

  /** Signs the person out and shows the sign-in again (the page is reloaded so nothing of their night stays on screen). */
  B.opsSignOut = async function () { await B.auth.signOut(); root.location.reload(); };

  B.opsSignIn = async function (done) {
    var phone = null;
    try { phone = await B.auth.phone(); } catch (_) {}
    if (phone) enter(done); else askNumber(done);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
