// The showcase studio's page: one simulated phone, drawn in Sk's own frame.
//
// In plain words: the phone on this page shows exactly the messages bubl's
// engine wrote, in the format Meta delivers them. What you type or tap here is
// sent to the same engine through the same door a real WhatsApp message uses.
//
//   test mode   a signed-in studio operator speaks for a simulated person on
//               the staging back end. Nothing here can reach a real phone.
//   demo mode   no back end at all. The page plays demo/opening.json: the
//               engine's own answers, recorded by the tests, and says DEMO.
//
// The page draws messages; it decides nothing. Every word, date and amount on
// the phone comes from the engine (or its recording), never from this file.
const cfg = window.BUBL_CONFIG || {};
const LIVE = cfg.mode === 'test' && !!cfg.supabaseUrl && !!cfg.publishableKey;
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- the icons, as drawn in Sk's canvas ----------
function icon(d, o = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', o.box ?? '0 0 16 16');
  if (o.w) { s.setAttribute('width', o.w); s.setAttribute('height', o.h ?? o.w); }
  s.setAttribute('aria-hidden', 'true');
  for (const part of [].concat(d)) {
    const p = document.createElementNS(NS, part.rect ? 'rect' : 'path');
    if (part.rect) for (const [k, v] of Object.entries(part.rect)) p.setAttribute(k, v);
    else {
      p.setAttribute('d', part.d ?? part);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', part.stroke ?? o.stroke ?? '#53BDEB');
      p.setAttribute('stroke-width', o.sw ?? '1.6');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
    }
    s.appendChild(p);
  }
  return s;
}
const ICON = {
  reply: () => icon('M6 4L2 8l4 4M2 8h8a4 4 0 014 4'),
  list: () => icon('M2 4h12M2 8h12M2 12h12'),
  open: () => icon('M6 3H3v10h10v-3M9 2h5v5M14 2L7 9'),
  ticks: (read) => icon('M1 6l3 3 6-7M6 9l1 1 6-8', { box: '0 0 16 11', w: 15, h: 11, sw: '1.5', stroke: read ? '#53BDEB' : '#8BA39A' }),
  mic: () => icon([{ rect: { x: 6, y: 2, width: 4, height: 8, rx: 2, fill: '#0B141A' } }, { d: 'M4 8a4 4 0 008 0M8 12v2', stroke: '#0B141A' }], { w: 16, sw: '1.5' }),
  send: () => icon('M3 8h9M8 4l4 4-4 4', { w: 16, sw: '1.8', stroke: '#0B141A' }),
};

// ---------- WhatsApp's own text marks: *bold* _italic_ ~struck~ ----------
function rich(text) {
  const frag = document.createDocumentFragment();
  const re = /\*(\S(?:[^*\n]*\S)?)\*|_(\S(?:[^_\n]*\S)?)_|~(\S(?:[^~\n]*\S)?)~/g;
  let at = 0;
  for (let m; (m = re.exec(text)); ) {
    if (m.index > at) frag.append(text.slice(at, m.index));
    const n = el(m[1] !== undefined ? 'b' : m[2] !== undefined ? 'i' : 's', '', m[1] ?? m[2] ?? m[3]);
    if (m[1] !== undefined) n.style.fontWeight = '600';
    frag.append(n);
    at = m.index + m[0].length;
  }
  if (at < text.length) frag.append(text.slice(at));
  return frag;
}
const clock = (at) => new Date(at ?? Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
function stamp(at, ticks) {
  const t = el('span', 'tm', clock(at));
  if (ticks) t.append(ICON.ticks(ticks === 'read'));
  return t;
}
/** Only a public https address is ever opened or shown as a picture. */
const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) && !u.startsWith('https://demo.invalid') ? u : typeof u === 'string' && /^(media|\.\.?)\//.test(u) ? u : null);

// ---------- the thread ----------
const thread = $('thread');
let newestButtons = null;
function toBottom() { thread.scrollTop = thread.scrollHeight; }
function clearThread() {
  thread.replaceChildren(el('div', 'day', 'Today'));
  newestButtons = null;
  closeSheet();
}

/** The person's own message: what they typed, or the title of what they tapped. */
function drawMine(text, at, state) {
  const b = el('div', 'out');
  b.append(rich(text), stamp(at, state === 'pending' ? 'sent' : 'read'));
  thread.append(b);
  toBottom();
  return b;
}

/** One of bubl's messages, from Meta's own format. */
function drawBubl(row, onTap) {
  const m = row.message ?? {};
  if (m.type === 'text') {
    const b = el('div', 'in');
    b.dataset.what = row.what;
    b.append(rich(String(m.text?.body ?? '')), stamp(row.at));
    thread.append(b);
    return;
  }
  const i = m.interactive ?? {};
  const g = el('div', 'grp');
  g.dataset.what = row.what;
  const b = el('div', 'in');
  const picture = safeUrl(i.header?.image?.link);
  if (picture) {
    g.classList.add('pic');
    const img = el('img', 'img');
    img.alt = '';
    img.src = picture;
    img.addEventListener('load', toBottom);
    b.append(img);
  }
  b.append(rich(String(i.body?.text ?? '')));
  if (i.footer?.text) b.append(el('span', 'ft', i.footer.text));
  b.append(stamp(row.at));
  g.append(b);
  if (i.type === 'button') {
    for (const x of i.action?.buttons ?? []) {
      const btn = el('button', 'wbtn');
      btn.type = 'button';
      btn.append(ICON.reply(), x.reply.title);
      btn.addEventListener('click', () => onTap({ id: x.reply.id, title: x.reply.title, kind: 'button' }, g));
      g.append(btn);
    }
    newestButtons = g;
  } else if (i.type === 'list') {
    const btn = el('button', 'wbtn');
    btn.type = 'button';
    btn.append(ICON.list(), i.action?.button ?? '');
    const rows = (i.action?.sections ?? []).flatMap((s) => s.rows ?? []);
    btn.addEventListener('click', () => openSheet(i.action?.button ?? '', rows, (r) => onTap({ id: r.id, title: r.title, kind: 'list' }, g)));
    g.append(btn);
    newestButtons = g;
  } else if (i.type === 'cta_url') {
    const p = i.action?.parameters ?? {};
    const url = safeUrl(p.url);
    const a = el('a', 'wbtn');
    a.append(ICON.open(), p.display_text ?? '');
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    else { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', () => say('That page is not published beside this studio yet.')); }
    g.append(a);
  }
  thread.append(g);
}

function draw(rows, onTap) {
  for (const row of rows) {
    if (row.direction === 'in') {
      const m = row.message ?? {};
      drawMine(String(m.text?.body ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? ''), row.at, row.state);
    } else if (row.state === 'failed') {
      say(`One of bubl's answers could not be delivered${row.problem ? `: ${row.problem}` : '.'}`, true);
    } else drawBubl(row, onTap);
  }
  toBottom();
}

// ---------- WhatsApp's pick-list, over the chat ----------
function closeSheet() { for (const n of document.querySelectorAll('#scr > .shade, #scr > .sheet')) n.remove(); }
function openSheet(title, rows, onPick) {
  closeSheet();
  const shade = el('div', 'shade');
  shade.addEventListener('click', closeSheet);
  const sheet = el('div', 'sheet');
  sheet.setAttribute('role', 'dialog');
  sheet.append(el('div', 'grab'), el('div', 'sheet-title', title));
  let picked = null;
  const send = el('button', 'sheet-send', 'Send');
  send.type = 'button';
  send.disabled = true;
  for (const r of rows) {
    const row = el('div', 'srow');
    const text = el('div');
    text.style.flex = '1';
    text.append(r.title);
    if (r.description) text.append(el('small', '', r.description));
    const radio = el('div', 'radio');
    row.append(text, radio);
    row.addEventListener('click', () => {
      for (const x of sheet.querySelectorAll('.radio')) x.classList.remove('on');
      radio.classList.add('on');
      picked = r;
      send.disabled = false;
    });
    sheet.append(row);
  }
  send.addEventListener('click', () => { if (picked) { closeSheet(); onPick(picked); } });
  sheet.append(send);
  $('scr').append(shade, sheet);
}

// ---------- the studio's own line, outside the chat ----------
let noteTimer = null;
const wide = () => window.matchMedia('(min-width:601px)').matches;
let standing = '';
/** `stay`: the line that is shown whenever nothing else is being said (beside the phone; on a real phone it shows once). */
function say(text, bad = false, stay = false) {
  const n = $('note');
  clearTimeout(noteTimer);
  if (stay) standing = text;
  n.textContent = text;
  n.classList.toggle('bad', bad);
  if (!(stay && wide())) noteTimer = setTimeout(() => { n.textContent = wide() ? standing : ''; n.classList.remove('bad'); }, 6000);
}

// ---------- demo mode: the engine's recorded answers ----------
/** The same reading the engine gives a typed line: lower case, no accents, punctuation as spaces. */
const plain = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function demoSource() {
  const rec = await (await fetch('demo/opening.json', { cache: 'no-store' })).json();
  const web = (cfg.webBase || '').replace(/\/+$/, '');
  // the recording's stand-in addresses become this page's own
  const place = (m) => JSON.parse(JSON.stringify(m).split(rec.media_base).join('media').split(rec.web_base).join(web || rec.web_base));
  let at = rec.start;
  let n = 0;
  return {
    demo: true,
    person: rec.person,
    chat: rec.line_name,
    lines: rec.lines,
    recordedFor: rec.recorded_for,
    async start() { return []; },
    async act(input) {
      if (input.tap && input.stale) return { note: 'This is a recording, so only the newest message’s buttons answer here. On the real engine an old button answers with where things stand now.' };
      const edge = rec.nodes[at]?.[input.tap ? `tap:${input.tap.title}` : `text:${plain(input.text)}`];
      if (!edge) return { note: `This is a recording: it knows ${rec.lines.map((l) => `“${l}”`).join(', ')} and every button. Connect staging to type anything.`, keep: true };
      at = edge.to;
      await sleep(450);
      return { rows: edge.messages.map((i) => ({ ...place(rec.messages[i]), id: ++n, at: new Date().toISOString() })) };
    },
    async reset() { at = rec.start; },
  };
}

// ---------- test mode: the staging back end, for a signed-in studio operator ----------
function loadScript(src) {
  return new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => no(new Error('The sign-in code could not be loaded.'));
    document.head.append(s);
  });
}
async function liveSource() {
  await loadScript('vendor/supabase.js');
  const base = String(cfg.supabaseUrl).replace(/\/+$/, '');
  // its own sign-in, kept apart from the guest app's and OPS's on this address
  const sb = window.supabase.createClient(base, cfg.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'bubl.studio' } });
  async function call(route, body) {
    let token = null;
    try { token = (await sb.auth.getSession()).data.session?.access_token ?? null; } catch { /* signed out */ }
    if (!token) return { ok: false, status: 401, reason: 'Sign in first.' };
    let res;
    try {
      res = await fetch(`${base}/functions/v1/concierge/studio/${route}`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: cfg.publishableKey, authorization: `Bearer ${token}` }, body: JSON.stringify(body ?? {}) });
    } catch { return { ok: false, status: 0, reason: 'No connection just now. Check your signal and try again.' }; }
    let j = null;
    try { j = await res.json(); } catch { /* not JSON */ }
    return j && typeof j.ok === 'boolean' ? { ...j, status: res.status } : { ok: false, status: res.status, reason: 'That could not be done just now. Please try again in a moment.' };
  }
  let person = null;
  let last = 0;
  const fresh = (rows) => { for (const r of rows) last = Math.max(last, Number(r.id) || 0); return rows; };
  return {
    demo: false,
    sb,
    call,
    /** Who is signed in, and their simulated phone on the guests' line (made on first use). */
    async enter() {
      const s = await call('state');
      if (!s.ok) return s;
      const line = (s.lines ?? []).find((l) => l.key === 'bubl');
      person = (s.people ?? []).find((p) => p.line === 'bubl' && p.mine) ?? null;
      if (!person) {
        const made = await call('person', { line: 'bubl', name: s.operator });
        if (!made.ok) return made;
        person = { id: made.person.id, name: s.operator };
      }
      this.person = person.name;
      this.chat = line?.name ?? 'bubl';
      this.connected = !!line?.connected;
      return { ok: true };
    },
    async start() { last = 0; const f = await call('feed', { person: person.id }); return f.ok ? fresh(f.messages) : []; },
    async act(input) {
      const r = await call('say', { person: person.id, after: last, ...(input.tap ? { tap: { id: input.tap.id, title: input.tap.title, kind: input.tap.kind } } : { text: input.text }) });
      return r.ok ? { rows: fresh(r.messages) } : { note: r.reason, bad: true, keep: true };
    },
    /** Anything that arrived late (an answer that had to be tried again). */
    async more() { const f = await call('feed', { person: person.id, after: last }); return f.ok ? fresh(f.messages) : []; },
    async reset() { const r = await call('reset', { person: person.id }); if (!r.ok) throw new Error(r.reason); },
  };
}

// ---------- the page ----------
let source = null;
let busy = false;
const field = $('field');
const sendBtn = $('send');
function sendIcon() { sendBtn.replaceChildren(field.value.trim() ? ICON.send() : ICON.mic()); }
function typing(on) { $('chatSub').textContent = on ? 'typing…' : 'business account'; }

async function act(input, shown) {
  if (busy || !source) return;
  busy = true;
  const mine = drawMine(shown, undefined, 'pending');
  typing(true);
  try {
    const r = await source.act(input);
    mine.remove();
    if (r.note) {
      say(r.note, !!r.bad);
      if (r.keep && input.text) { field.value = input.text; sendIcon(); }
    }
    if (r.rows) draw(r.rows, onTap);
  } catch (e) {
    mine.remove();
    say(e.message || 'That could not be done just now.', true);
  } finally {
    typing(false);
    busy = false;
  }
}
function onTap(tap, group) { act({ tap, stale: group !== newestButtons }, tap.title); }

$('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = field.value.trim();
  if (!text) { field.focus(); return; }
  field.value = '';
  sendIcon();
  act({ text }, text);
});
field.addEventListener('input', sendIcon);
$('reset').addEventListener('click', async () => {
  if (busy || !source) return;
  busy = true;
  try { await source.reset(); clearThread(); say('Started again from an empty chat.'); } catch (e) { say(e.message || 'Reset did not work just now.', true); } finally { busy = false; }
});

async function open(src) {
  source = src;
  $('gate').hidden = true;
  $('stage').hidden = false;
  $('reset').hidden = false;
  $('chatName').textContent = src.chat;
  $('who').replaceChildren(src.person, el('span', '', 'simulated phone'));
  clearThread();
  draw(await src.start(), onTap);
  if (src.demo) {
    const strip = $('strip');
    strip.hidden = false;
    strip.replaceChildren('Try:');
    for (const line of src.lines) {
      const c = el('button', 'chip', line);
      c.type = 'button';
      c.addEventListener('click', () => { field.value = line; sendIcon(); field.focus(); });
      strip.append(c);
    }
    const day = new Date(src.recordedFor).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    say(`DEMO. These are bubl’s own answers, recorded from the engine on the test data of ${day}. Nothing is sent anywhere.`, false, true);
  } else {
    const meta = $('meta');
    meta.hidden = false;
    meta.textContent = src.connected ? 'Meta: connected' : 'Meta: not connected yet';
    meta.classList.toggle('off', !src.connected);
    // an answer that had to be tried again arrives a little later; look for it while the page is in view
    setInterval(async () => { if (!document.hidden && !busy) draw(await src.more(), onTap); }, 6000);
  }
}

// test mode: the gate
function gate(src) {
  const phone = $('phone');
  const code = $('code');
  const go = $('gateGo');
  const err = $('gateErr');
  let number = null;
  const step = (n) => {
    $('gatePhone').hidden = n !== 1;
    $('gateCode').hidden = n !== 2;
    $('gateBack').hidden = n === 1;
    go.hidden = n === 3;
    go.textContent = n === 1 ? 'Send code' : 'Sign in';
    err.textContent = '';
  };
  const says = (e) => {
    const m = String(e?.message ?? '');
    if (/rate limit|only request this after|too many/i.test(m) || e?.status === 429) return 'Too many tries. Wait a minute, then ask for a new code.';
    if (/expired|invalid/i.test(m)) return 'That code does not match. Check it, or ask for a new one.';
    return 'That could not be done just now. Please try again in a moment.';
  };
  async function enter() {
    const r = await src.enter();
    if (r.ok) return open(src);
    $('gate').hidden = false;
    $('stage').hidden = true;
    $('signout').hidden = r.status === 401;
    if (r.status === 401) return step(1);
    step(3);
    $('gateText').textContent = r.status === 403
      ? 'This number is signed in, but it is not a studio operator yet. On GitHub, run “Connect concierge (staging)” with this number, then open this page again.'
      : r.status === 404
        ? 'The studio is not switched on for this back end yet. On GitHub, run “Deploy staging functions” and then “Connect concierge (staging)”.'
        : r.reason;
  }
  $('gateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    go.disabled = true;
    err.textContent = '';
    try {
      if (!number) {
        const typed = phone.value.replace(/[\s()-]/g, '');
        if (!/^\+\d{8,15}$/.test(typed)) { err.textContent = 'Type the number with its country code, starting with +.'; return; }
        const r = await src.sb.auth.signInWithOtp({ phone: typed, options: { channel: 'sms' } });
        if (r.error) { err.textContent = says(r.error); return; }
        number = typed;
        step(2);
        code.focus();
      } else {
        const r = await src.sb.auth.verifyOtp({ phone: number, token: code.value.trim(), type: 'sms' });
        if (r.error) { err.textContent = says(r.error); return; }
        await enter();
      }
    } catch (x) { err.textContent = says(x); } finally { go.disabled = false; }
  });
  const out = async () => { try { await src.sb.auth.signOut(); } catch { /* already out */ } location.reload(); };
  $('gateBack').addEventListener('click', () => { if (go.hidden) return out(); number = null; code.value = ''; step(1); });
  $('signout').addEventListener('click', out);
  return enter();
}

// a real phone's keyboard changes how much of the page is in view; the chat follows it
if (window.visualViewport) {
  const fit = () => { document.documentElement.style.setProperty('--vvh', `${window.visualViewport.height}px`); toBottom(); };
  window.visualViewport.addEventListener('resize', fit);
  fit();
}
// On a laptop the phone is drawn at its true size, 360 x 760. If the window is too short to hold it, the whole
// phone is made smaller in proportion, so the chat and the message field are always in view.
function fitPhone() {
  const room = window.innerHeight - 52 - 40;
  document.documentElement.style.setProperty('--k', String(Math.min(1, Math.max(0.6, room / 760))));
}
window.addEventListener('resize', fitPhone);
fitPhone();

sendIcon();
const mode = $('mode');
if (LIVE) {
  $('modeShort').textContent = 'TEST';
  $('modeMore').textContent = ' · staging, test data';
  liveSource().then(gate).catch((e) => { $('gate').hidden = false; $('gateErr').textContent = e.message; });
} else {
  $('modeShort').textContent = 'DEMO';
  $('modeMore').textContent = ' · recorded answers';
  mode.classList.add('demo');
  demoSource().then(open).catch(() => { $('stage').hidden = false; say('The recording could not be loaded.', true, true); });
}
