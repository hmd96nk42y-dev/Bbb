// The showcase studio's page: simulated phones, drawn in Sk's own frame.
//
// In plain words: each phone on this page shows exactly the messages bubl's
// engine wrote, in the format Meta delivers them. What you type or tap here is
// sent to the same engine through the same door a real WhatsApp message uses.
// You can play several people: the host, and the friends the host forwards
// bubl's message to. A forwarded message arrives in the friend's chat with the
// host, as it does in WhatsApp; its In and Out links open the friend's own chat
// with bubl with the answer already written.
//
//   test mode   a signed-in studio operator speaks for simulated people on the
//               staging back end. Nothing here can reach a real phone.
//   demo mode   no back end at all. The page plays demo/opening.json: the
//               engine's own answers, recorded by the tests, and says DEMO.
//
// The page draws messages; it decides nothing. Every word, date and amount on
// a phone comes from the engine (or its recording), never from this file.
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
  forwarded: () => icon('M9 3l5 5-5 5M14 8H6a4 4 0 00-4 4', { w: 11, stroke: '#8696A0' }),
  forward: () => icon('M9 3l5 5-5 5M14 8H6a4 4 0 00-4 4', { w: 15, stroke: '#E9EDEF' }),
  ticks: (read) => icon('M1 6l3 3 6-7M6 9l1 1 6-8', { box: '0 0 16 11', w: 15, h: 11, sw: '1.5', stroke: read ? '#53BDEB' : '#8BA39A' }),
  mic: () => icon([{ rect: { x: 6, y: 2, width: 4, height: 8, rx: 2, fill: '#0B141A' } }, { d: 'M4 8a4 4 0 008 0M8 12v2', stroke: '#0B141A' }], { w: 16, sw: '1.5' }),
  send: () => icon('M3 8h9M8 4l4 4-4 4', { w: 16, sw: '1.8', stroke: '#0B141A' }),
  back: () => icon('M10 3L5 8l5 5', { w: 18, sw: '1.8', stroke: '#E9EDEF' }),
};

/** Only a public https address is ever opened or shown as a picture. */
const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) && !u.startsWith('https://demo.invalid') ? u : typeof u === 'string' && /^(media|\.\.?)\//.test(u) ? u : null);
/** A picture: a published one, or one the back end made and handed over whole (the entry QR, as a PNG). */
const pictureUrl = (u) => (typeof u === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(u) ? u : safeUrl(u));
/** A "text bubl" link: https://wa.me/<number>?text=…  A "share" link has no number: WhatsApp then asks who to send it to. */
function waLink(u) {
  let url;
  try { url = new URL(u); } catch { return null; }
  if (url.origin !== 'https://wa.me') return null;
  const text = url.searchParams.get('text');
  return text === null ? null : { share: url.pathname === '/' || url.pathname === '', text };
}

// ---------- WhatsApp's own text marks (*bold* _italic_ ~struck~) and links ----------
function rich(text, onLink, onWebLink) {
  const frag = document.createDocumentFragment();
  const re = /(https:\/\/[^\s]+)|\*(\S(?:[^*\n]*\S)?)\*|_(\S(?:[^_\n]*\S)?)_|~(\S(?:[^~\n]*\S)?)~/g;
  let at = 0;
  for (let m; (m = re.exec(text)); ) {
    let before = m.index > at ? text.slice(at, m.index) : '';
    if (m[1] !== undefined) {
      const wa = waLink(m[1]);
      const url = safeUrl(m[1]);
      // A link is drawn by what it does, not by its address (Sk, 24 Nov 2026: "hide raw links and the code"). "In:" and
      // "Out:" before a link that opens a chat become the link itself; a link to the venue's own page reads as what it
      // opens. On a real phone WhatsApp always shows a link's address in a forwarded text: the words here are the
      // studio's own drawing of it. Any other link is shown as it is.
      const lead = wa ? /(^|\n)([A-Za-z][A-Za-z ]{0,18}):[ \t]*$/.exec(before) : null;
      if (lead) before = before.slice(0, lead.index + lead[1].length);
      const label = lead ? lead[2] : url && onWeb(url) ? (/[?&]i=/.test(url) ? 'Open the invitation' : /[?&]v=/.test(url) ? 'See your table' : /[?&]e=/.test(url) ? 'See the night' : 'Open the page') : m[1];
      if (before) frag.append(before);
      const a = el('a', label === m[1] ? 'lnk' : 'lnk named', label);
      if (label !== m[1]) a.title = m[1];
      if (wa && onLink) { a.href = '#'; a.addEventListener('click', (e) => { e.preventDefault(); onLink(wa); }); }
      else if (url && onWebLink && onWeb(url)) { a.href = '#'; a.addEventListener('click', (e) => { e.preventDefault(); onWebLink(url); }); }
      else if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      frag.append(a);
    } else {
      if (before) frag.append(before);
      const n = el(m[2] !== undefined ? 'b' : m[3] !== undefined ? 'i' : 's', '', m[2] ?? m[3] ?? m[4]);
      if (m[2] !== undefined) n.style.fontWeight = '600';
      frag.append(n);
    }
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

// ---------- the studio's own line, outside the chat ----------
let noteTimer = null;
const wide = () => window.matchMedia('(min-width:601px)').matches;
let standing = '';
/** `stay`: the line shown whenever nothing else is being said (beside the phone; on a real phone it shows once). */
function say(text, bad = false, stay = false) {
  const n = $('note');
  clearTimeout(noteTimer);
  if (stay) standing = text;
  n.textContent = text;
  n.classList.toggle('bad', bad);
  if (!(stay && wide())) noteTimer = setTimeout(() => { n.textContent = wide() ? standing : ''; n.classList.remove('bad'); }, 6000);
}

// ---------- the people being played ----------
// A person: { id, name, line ('bubl': a guest's phone | 'partners': a partner's or the team's phone), number (the simulated
//             number, no phone can have it), rows (their chat with bubl), last, unread, busy, peers (chats with other
//             people: forwarded messages), view ('bubl' | 'list' | a peer's name), draft }
let source = null;
const people = [];
let current = null;
let beside = null;
const person = (id) => people.find((p) => p.id === id);
/** The chat this phone has with bubl, by the name it is saved under: bubl concierge for a guest, bubl partners for a partner. */
const chatName = (p) => source.chats?.[p.line] ?? source.chat;
const isPartner = (p) => p.line === 'partners';
function addPerson(p) {
  const made = { id: p.id, name: p.name, line: p.line ?? 'bubl', number: p.number ?? null, rows: [], last: 0, unread: 0, busy: false, peers: new Map(), view: 'bubl', draft: '' };
  people.push(made);
  return made;
}

// ---------- one phone ----------
class Phone {
  constructor() {
    this.root = $('phoneT').content.firstElementChild.cloneNode(true);
    const q = (s) => this.root.querySelector(s);
    this.scr = q('.scr'); this.thread = q('.wa-body'); this.field = q('.cfield'); this.send = q('.cmic');
    this.name = q('.wa-nm'); this.sub = q('.wa-sb'); this.av = q('.wa-av'); this.comp = q('.comp'); this.who = q('.dlab'); this.back = q('.wa-back');
    this.who_ = null;
    this.back.append(ICON.back());
    this.back.addEventListener('click', () => { if (this.who_) { this.who_.view = this.who_.view === 'list' ? 'bubl' : 'list'; this.draw(); } });
    this.comp.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = this.who_;
      const text = this.field.value.trim();
      if (!p || p.view !== 'bubl') return;
      if (!text) { this.field.focus(); return; }
      this.field.value = ''; p.draft = ''; this.sendIcon();
      act(p, { text }, text);
    });
    this.field.addEventListener('input', () => { if (this.who_) this.who_.draft = this.field.value; this.sendIcon(); });
  }
  sendIcon() { this.send.replaceChildren(this.field.value.trim() ? ICON.send() : ICON.mic()); }
  toBottom() { this.thread.scrollTop = this.thread.scrollHeight; }
  closeSheet() { for (const n of this.scr.querySelectorAll(':scope > .shade, :scope > .sheet')) n.remove(); }
  /** The venue's web app inside this phone, as this guest. "Chat" brings the chat back, with whatever bubl said meanwhile. */
  showWeb(p, r, tier, url) {
    this.closeWeb();
    const layer = el('div', 'web');
    const top = el('div', 'web-top');
    const back = el('button', 'web-back', 'Chat');
    back.type = 'button';
    back.prepend(ICON.back());
    back.addEventListener('click', async () => {
      this.closeWeb();
      try { take(p, await source.more(p)); } catch { /* shown at the next refresh */ }
    });
    const who = el('button', 'web-who', `${r.name || p.name} · +${r.number}`);
    who.type = 'button';
    who.title = 'Who the page is opened as. The page fills in this name and number by itself. Tap to copy the number.';
    who.addEventListener('click', async () => { try { await navigator.clipboard.writeText(`+${r.number}`); say('Number copied.'); } catch { say(`The number is +${r.number}`); } });
    top.append(back, who);
    if (tier) {
      // A table picked for the guest is only proposed (Sk, 23 Nov 2026): the page opens again with one table of this
      // kind selected and its own sheet open. The guest confirms it there with the page's own button, or closes
      // the sheet and taps another. Nothing is held until they do.
      const hold = el('button', 'web-hold', 'Pick one for me');
      hold.type = 'button';
      hold.title = 'The page selects a free table of this kind. Confirm it there, or tap another: nothing is held until you do.';
      hold.addEventListener('click', async () => {
        if (p.busy || hold.disabled) return;
        // one tap is enough: it says so at once, and cannot be tapped again while the page opens
        hold.disabled = true; hold.textContent = 'Picking…';
        const again = /[?&]pick=/.test(url) ? url : `${url}${url.includes('?') ? '&' : '?'}pick=1`;
        let next;
        try { next = await source.open(p, again); } catch { next = { ok: false, reason: '' }; }
        if (next.ok) return this.showWeb(p, next, tier, url);
        this.closeWeb();
        playWebStep(p, tier, url, next.reason);
      });
      top.append(hold);
      // The studio's own step, should the page not get there: a table of this kind is held for this simulated guest
      // by the same booking rules, and bubl hears of it as it does for a real guest (the "On the web" card).
      const here = el('button', 'web-here', 'Hold for me');
      here.type = 'button';
      here.title = 'Skip the page: the studio holds a free table of this kind for this guest, by the same booking rules.';
      here.addEventListener('click', () => { if (p.busy) return; this.closeWeb(); playWebStep(p, tier, url, ''); });
      top.append(here);
    }
    const frame = el('iframe', 'web-frame');
    frame.title = `The venue's web app, as ${r.name || p.name}`;
    frame.setAttribute('allow', 'clipboard-write; fullscreen');
    frame.src = r.url;
    layer.append(top, frame);
    this.scr.append(layer);
  }
  closeWeb() { for (const n of this.scr.querySelectorAll(':scope > .web')) n.remove(); }
  show(p) { if (this.who_ !== p) this.closeWeb(); this.who_ = p; this.root.hidden = !p; if (p) { p.unread = 0; this.draw(); } }

  /** Draws everything from the person's own state. */
  draw() {
    const p = this.who_;
    if (!p) return;
    this.closeSheet();
    this.who.replaceChildren(p.name, el('span', '', p.number ? `simulated phone · +${p.number}` : 'simulated phone'));
    this.thread.replaceChildren();
    this.newest = null;
    const chat = p.view === 'bubl';
    this.comp.hidden = !chat;
    this.back.style.visibility = p.peers.size ? 'visible' : 'hidden';
    this.av.replaceChildren();
    if (p.view === 'list') return this.drawList(p);
    if (!chat) return this.drawPeer(p, p.view);
    const img = el('img'); img.src = 'media/bubl-mark.svg'; img.alt = '';
    this.av.append(img);
    this.name.textContent = chatName(p);
    this.sub.textContent = p.busy ? 'typing…' : 'business account';
    this.field.value = p.draft; this.sendIcon();
    this.thread.append(el('div', 'day', 'Today'));
    for (const row of p.rows) this.drawRow(p, row);
    this.toBottom();
  }

  /** WhatsApp's list of chats: bubl, and anyone who forwarded this person a message. */
  drawList(p) {
    this.name.textContent = 'Chats';
    this.sub.textContent = p.name;
    const row = (title, last, open, mark) => {
      const r = el('div', 'crow');
      const a = el('div', 'wa-av');
      if (mark) { const i = el('img'); i.src = 'media/bubl-mark.svg'; i.alt = ''; a.append(i); } else a.append(el('span', 'ini', title.slice(0, 1).toUpperCase()));
      const t = el('div', 'ctext');
      t.append(el('b', '', title), el('small', '', last));
      r.append(a, t);
      r.addEventListener('click', () => { p.view = open; this.draw(); });
      this.thread.append(r);
    };
    const lastOf = (rows) => { const m = rows.at(-1)?.message; return m ? String(m.text?.body ?? m.image?.caption ?? m.interactive?.body?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? '').split('\n')[0] : 'business account'; };
    // the line under the chat is its newest message that is in the chat: never one that was not delivered
    row(chatName(p), lastOf(p.rows.filter(shown)), 'bubl', true);
    for (const [name, list] of p.peers) row(name, list.at(-1).text.split('\n')[0], name, false);
  }

  /** A chat with another person: the messages they forwarded. bubl is not in this chat and never sees it. */
  drawPeer(p, name) {
    this.name.textContent = name;
    this.sub.textContent = 'tap here for contact info';
    this.av.append(el('span', 'ini', name.slice(0, 1).toUpperCase()));
    this.thread.append(el('div', 'day', 'Today'));
    for (const m of p.peers.get(name) ?? []) {
      const b = el('div', 'in');
      const f = el('span', 'fwd'); f.append(ICON.forwarded(), 'Forwarded');
      if (m.image) {
        b.classList.add('pic');
        const img = el('img', 'img photo');
        img.alt = '';
        img.src = m.image;
        img.addEventListener('load', () => this.toBottom());
        f.style.marginBottom = '4px';
        b.append(f, img);
      } else b.append(f);
      // an In or Out link opens this person's own chat with bubl, with the answer already written; they press Send.
      // A link to the venue's web app (a table a partner sent them) opens the real page here, as this guest.
      b.append(rich(m.text, (wa) => { if (!wa.share) { p.view = 'bubl'; p.draft = wa.text; this.draw(); this.field.focus(); } }, isPartner(p) ? null : (url) => openWeb(this, p, url, null)), stamp(m.at));
      this.thread.append(b);
    }
    this.toBottom();
  }

  drawRow(p, row) {
    const m = row.message ?? {};
    const onLink = (wa) => (wa.share ? forward(p, { text: wa.text, image: null }) : (p.draft = wa.text, this.draw(), this.field.focus()));
    if (row.direction === 'in') {
      const b = el('div', 'out');
      b.append(rich(String(m.text?.body ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? '')), stamp(row.at, row.pending ? 'sent' : 'read'));
      this.thread.append(b);
      return;
    }
    if (row.state === 'failed') return;
    if (m.type === 'text' || m.type === 'image') {
      const words = String(m.type === 'image' ? (m.image?.caption ?? '') : (m.text?.body ?? ''));
      const picture = m.type === 'image' ? pictureUrl(m.image?.link) : null;
      const b = el('div', 'in');
      b.dataset.what = row.what;
      if (picture) {
        b.classList.add('pic');
        const img = el('img', 'img photo');
        img.alt = '';
        img.src = picture;
        img.addEventListener('load', () => this.toBottom());
        b.append(img);
      }
      b.append(rich(words, onLink), stamp(row.at));
      // the message bubl wrote to be forwarded gets WhatsApp's forward button beside it: "Send to…"
      // (the invitations bubl writes once a table is held are forwarded too: one for each share, or the table's own)
      if (row.what === 'invite' || row.what === 'nudge' || row.what === 'table_offer' || row.what === 'seat_invite') {
        const wrap = el('div', 'fwrap');
        const f = el('button', 'fbtn');
        f.type = 'button';
        f.setAttribute('aria-label', 'Forward');
        f.append(ICON.forward());
        // "For Omar: " is bubl's note to the host about whose invitation it is; the friend is sent the invitation itself
        f.addEventListener('click', () => forward(p, { text: row.what === 'seat_invite' ? words.replace(/^For [^:\n]{1,80}: /, '') : words, image: picture }));
        wrap.append(b, f);
        this.thread.append(wrap);
      } else this.thread.append(b);
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
      img.addEventListener('load', () => this.toBottom());
      b.append(img);
    }
    b.append(rich(String(i.body?.text ?? ''), onLink));
    if (i.footer?.text) b.append(el('span', 'ft', i.footer.text));
    b.append(stamp(row.at));
    g.append(b);
    const tap = (t) => act(p, { tap: t, stale: g !== this.newest }, t.title);
    if (i.type === 'button') {
      for (const x of i.action?.buttons ?? []) {
        const btn = el('button', 'wbtn');
        btn.type = 'button';
        btn.append(ICON.reply(), x.reply.title);
        btn.addEventListener('click', () => tap({ id: x.reply.id, title: x.reply.title, kind: 'button' }));
        g.append(btn);
      }
      this.newest = g;
    } else if (i.type === 'list') {
      const btn = el('button', 'wbtn');
      btn.type = 'button';
      btn.append(ICON.list(), i.action?.button ?? '');
      const rows = (i.action?.sections ?? []).flatMap((s) => s.rows ?? []);
      btn.addEventListener('click', () => this.openSheet(i.action?.button ?? '', rows, (r) => tap({ id: r.id, title: r.title, kind: 'list' })));
      g.append(btn);
      this.newest = g;
    } else if (i.type === 'cta_url') {
      const prm = i.action?.parameters ?? {};
      const wa = waLink(prm.url);
      const url = safeUrl(prm.url);
      const a = el('a', 'wbtn');
      a.append(ICON.open(), prm.display_text ?? '');
      const tier = webStep(url);
      if (wa) { a.href = '#'; a.addEventListener('click', (e) => { e.preventDefault(); onLink(wa); }); }
      else if (url && source && !source.demo && onWeb(url)) { a.href = url; a.addEventListener('click', (e) => { e.preventDefault(); openWeb(this, p, url, tier); }); }
      else if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      else { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', () => say('That page is not published beside this studio yet.')); }
      g.append(a);
    }
    this.thread.append(g);
  }

  /** WhatsApp's pick-list, over the chat. */
  openSheet(title, rows, onPick) {
    this.closeSheet();
    const shade = el('div', 'shade');
    shade.addEventListener('click', () => this.closeSheet());
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
    send.addEventListener('click', () => { if (picked) { this.closeSheet(); onPick(picked); } });
    sheet.append(send);
    this.scr.append(shade, sheet);
  }
}

const phones = [new Phone(), new Phone()];
/** Which phones are in view: the person being played and, on a wide screen, the one played before them. */
function layout() {
  const two = window.matchMedia('(min-width:1040px)').matches && beside && beside !== current;
  phones[0].show(two ? beside : current);
  phones[1].show(two ? current : null);
  drawPeople();
}
const phoneOf = (p) => phones.find((x) => x.who_ === p && !x.root.hidden);
function redraw(p) { const ph = phoneOf(p); if (ph) { p.unread = 0; ph.draw(); } drawPeople(); }
function select(p) { if (p === current) return; beside = current; current = p; layout(); hint(p); }
/** The line beside the phones, for the person now being played. */
function hint(p) {
  if (!source || source.demo || !p) return;
  if (!isPartner(p)) return say(STANDING, false, true);
  const known = p.rows.some((r) => r.direction === 'out' && r.what !== 'partners_unknown');
  say(known
    ? `${p.name} is on the ${chatName(p)} chat. A simulated guest is known by their own number: tap their name above, then their number to copy it.`
    : `${p.name} is on the ${chatName(p)} chat as +${p.number}. bubl knows this phone only by what a venue made of that number. A promoter: in OPS, add a promoter with this mobile, pick their tables and sign. The venue’s team: on GitHub, run “Add staff on staging” with this mobile. Then say hello here.`, false, true);
}
const STANDING = 'You are playing simulated phones on the real engine. To play a friend, tap the forward arrow beside the message bubl writes for your crew.';

function drawPeople() {
  const box = $('people');
  box.replaceChildren();
  if (!source || source.demo) { box.hidden = true; return; }
  box.hidden = false;
  // always in the same order (Sk, 27 Nov 2026): guests first, then partners, each in the order they were made (their
  // simulated numbers are given out in order), whatever order the back end lists them in and whoever is in view
  const made = (p) => { try { return BigInt(String(p.number ?? '').replace(/\D/g, '') || '0'); } catch { return 0n; } };
  const inOrder = [...people].sort((a, b) => (isPartner(a) - isPartner(b)) || (made(a) < made(b) ? -1 : made(a) > made(b) ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
  for (const p of inOrder) {
    const c = el('button', `chip${p === current ? ' on' : ''}`, isPartner(p) ? `${p.name} · partner` : p.name);
    c.type = 'button';
    if (p.unread && !phoneOf(p)) c.append(el('span', 'dot', String(p.unread)));
    c.addEventListener('click', () => select(p));
    box.append(c);
    // beside the name being played, that phone's number: what a promoter types to send this guest a table, and what
    // OPS is given to make a phone a promoter's. No phone can have it.
    if (p === current && p.number) {
      const num = el('button', 'chip num', `+${p.number}`);
      num.type = 'button';
      num.title = `${p.name}’s simulated number. Tap to copy.`;
      num.addEventListener('click', async () => { try { await navigator.clipboard.writeText(`+${p.number}`); say('Number copied.'); } catch { say(`The number is +${p.number}`); } });
      box.append(num);
    }
  }
  const plus = el('button', 'chip', '+ Friend');
  plus.type = 'button';
  plus.addEventListener('click', async () => { const p = await askName('A simulated friend', 'Their first name, as WhatsApp would show it.'); if (p) select(p); });
  box.append(plus);
  // A DEMO scene (Sk, 25 Nov 2026): bubl invites the guest in view to a bubl table. Its button opens the venue's own
  // build at that table. bubl tables are not built in the platform yet, so the message itself says DEMO.
  if (source.demoScene) {
    const demo = el('button', 'chip', 'bubl table · DEMO');
    demo.type = 'button';
    demo.title = 'bubl sends the guest in view an invitation to a bubl table (a demo scene: it opens the venue’s own build).';
    demo.addEventListener('click', async () => {
      const p = current;
      if (!p || p.line === 'partners' || p.busy) return say('Choose a guest’s phone first.');
      try { const r = await source.demoScene(p, 'bubl_table'); if (r.note) say(r.note, true); take(p, r.rows ?? []); redraw(p); } catch (e) { say(e.message || 'That could not be done just now.', true); }
    });
    box.append(demo);
  }
  // a phone on the other chat: a promoter, a concierge, someone on the venue's team
  if (source.chats?.partners) {
    const partner = el('button', 'chip', '+ Partner');
    partner.type = 'button';
    partner.addEventListener('click', async () => { const p = await askPartner(); if (p) select(p); });
    box.append(partner);
  }

}

/** Whether a message is in the person's chat: everything they wrote, and what bubl wrote that was delivered. */
const shown = (r) => r.direction === 'in' || r.state !== 'failed';
/** WhatsApp's 24-hour rule (bubl may only write to someone who wrote to it in the last day): how things stand, not a fault. */
const dayRule = (r) => /24 hours/i.test(String(r.problem ?? ''));

/** New messages for a person: drawn if their phone is in view, counted on their name if not. */
function take(p, rows) {
  // Two refreshes can overlap (the one every few seconds, and the one after something is sent): a message is drawn
  // once, whichever brings it (Sk, 24 Nov 2026: "Omar is in." was shown twice).
  const seen = new Set(p.rows.map((r) => r.id).filter((id) => id != null));
  rows = rows.filter((r) => r.id == null || !seen.has(r.id));
  if (!rows.length) return;
  for (const r of rows) {
    if (r.direction === 'out' && r.state === 'failed') say(`One of bubl's answers to ${p.name} could not be delivered${r.problem ? `: ${r.problem}` : '.'}`, !dayRule(r));
    p.rows.push(r);
  }
  const fromBubl = rows.filter((r) => r.direction === 'out' && r.state !== 'failed').length;
  // bubl wrote while this phone was showing a chat with a friend: the phone goes to bubl's chat, where the news is
  if (fromBubl && p.view !== 'bubl' && p.view !== 'list') p.view = 'bubl';
  if (phoneOf(p) && p.view === 'bubl') redraw(p); else { p.unread += fromBubl; redraw(p); }
}

async function act(p, input, shown) {
  if (p.busy || !source) return;
  p.busy = true;
  const mine = { direction: 'in', pending: true, message: { type: 'text', text: { body: shown } } };
  p.rows.push(mine);
  redraw(p);
  try {
    const r = await source.act(p, input);
    p.rows.splice(p.rows.indexOf(mine), 1);
    if (r.note) {
      say(r.note, !!r.bad);
      if (r.keep && input.text) p.draft = input.text;
    }
    p.busy = false;
    take(p, r.rows ?? []);
    redraw(p);
    // what this did may have reached someone else's chat (a friend answered: the host is told)
    if (!source.demo) await others(p);
  } catch (e) {
    p.rows.splice(p.rows.indexOf(mine), 1);
    say(e.message || 'That could not be done just now.', true);
  } finally {
    p.busy = false;
    redraw(p);
  }
}
async function others(except) {
  for (const p of people) {
    if (p === except || p.busy) continue;
    // an answer asked for before a Reset belongs to the chat that was emptied: it is not put back
    const was = resets;
    const rows = await source.more(p);
    if (was === resets) take(p, rows);
  }
}

// ---------- the web step, played by the studio for a simulated guest ----------

/** The kind of table an "Open the venue" link lights, if that is what this link is. */
function webStep(url) {
  try { return url ? new URL(url).searchParams.get('tier') : null; } catch { return null; }
}
/** Whether an address is one of the published web app's (the only pages the studio opens as a guest). */
const WEB_BASE = String(cfg.webBase || '').replace(/\/+$/, '');
const onWeb = (url) => !!WEB_BASE && typeof url === 'string' && url.startsWith(`${WEB_BASE}/`);

/**
 * A link to the venue's web app, tapped in a simulated guest's chat. The studio opens the real page inside the phone,
 * signed in as that guest, the way bubl's button does for a real guest: the page then shows where they stand (their
 * held table, their share). Where that is not switched on, the studio plays the step instead (below).
 */
async function openWeb(phone, p, url, tier) {
  if (p.busy) return;
  let r;
  try { r = await source.open(p, url); } catch { r = { ok: false, reason: '' }; }
  if (r.ok) return phone.showWeb(p, r, tier, url);
  if (tier) return playWebStep(p, tier, url, r.reason);
  // (never a plain new tab: opened there the page would not know this guest, and a simulated number cannot sign in)
  say(r.reason || 'The page could not be opened as this guest just now. Try again in a moment.', true);
}

/**
 * A real guest opens the venue here, signs in with a code sent to their phone and picks the table. A simulated person
 * is on a number no phone can have, so no code can reach them. The studio offers to hold a table of that kind for
 * them, through the same booking rules the web app uses; bubl then hears of it as it does for a real guest.
 */
function playWebStep(p, tier, url, why) {
  return overlay((card, close) => {
    card.append(
      el('h1', '', 'On the web'),
      el('p', '', `A real guest opens your web app here and picks the table. The studio can hold a table of this kind for ${p.name}, by the same booking rules.${why ? ` (${why})` : ''}`),
    );
    // the least every member of a table gives: a full name as on their ID, and their number (the simulated one)
    const name = el('input');
    name.type = 'text'; name.maxLength = 80; name.autocomplete = 'off'; name.value = p.fullName || p.name; name.setAttribute('aria-label', 'Full name, as on ID');
    card.append(el('p', 'lab', 'Full name, as on ID'), name);
    const go = el('button', 'go', 'Hold a table');
    go.type = 'submit';
    // (no plain link to the page from here: opened in a tab of its own it would not know this guest, and a simulated
    // number cannot sign in there)
    const err = el('p', 'err');
    card.append(go, err);
    card.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (p.busy) return;
      go.disabled = true;
      p.busy = true;
      try {
        if (!name.value.trim()) { name.focus(); go.disabled = false; p.busy = false; return; }
        p.fullName = name.value.trim();
        const r = await source.hold(p, tier, p.fullName);
        if (r.note) { err.textContent = r.note; go.disabled = false; return; }
        close(true);
        take(p, r.rows ?? []);
      } catch (x) {
        err.textContent = x.message || 'That could not be done just now.';
        go.disabled = false;
      } finally {
        p.busy = false;
        redraw(p);
      }
    });
  });
}

// ---------- forwarding bubl's message to a friend ----------
/** WhatsApp's "Send to…": pick a simulated friend, or make one. The message (its photo and its words) lands in their chat with the sender. */
async function forward(from, item) {
  if (source.demo) return say('This is a recording, so there are no friends to forward to. Connect staging to play your friends too.');
  const to = await chooser(from);
  if (!to) return;
  const list = to.peers.get(from.name) ?? [];
  list.push({ text: item.text, image: item.image, at: new Date().toISOString() });
  to.peers.set(from.name, list);
  to.view = from.name;
  select(to);
  redraw(to);
}
function overlay(build) {
  return new Promise((done) => {
    const wrap = el('div', 'veil');
    const card = el('form', 'card');
    const close = (v) => { wrap.remove(); done(v); };
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(null); });
    build(card, close);
    wrap.append(card);
    document.body.append(wrap);
  });
}
function nameForm(card, close, title, text, line = 'bubl') {
  card.append(el('h1', '', title), el('p', '', text));
  const input = el('input');
  input.type = 'text'; input.maxLength = 24; input.placeholder = 'Omar'; input.autocomplete = 'off';
  const go = el('button', 'go', 'Add');
  go.type = 'submit';
  const err = el('p', 'err');
  card.append(input, go, err);
  card.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return input.focus();
    go.disabled = true;
    try { close(addPerson(await source.newPerson(name, line))); } catch (x) { err.textContent = x.message || 'That could not be done just now.'; go.disabled = false; }
  });
  setTimeout(() => input.focus(), 0);
}
const askName = (title, text, line = 'bubl') => overlay((card, close) => nameForm(card, close, title, text, line));
/**
 * "+ Partner": a first name, and who they are. A ready-made promoter, manager, host, runner or door works at once
 * (the back end makes them that, on staging only); "Nobody yet" is a number bubl partners does not know, for showing
 * how a venue signs someone in OPS.
 */
const askPartner = () => overlay((card, close) => {
  card.append(el('h1', '', 'A simulated partner'), el('p', '', `This phone opens the ${source.chats.partners} chat.`));
  const input = el('input');
  input.type = 'text'; input.maxLength = 24; input.placeholder = 'Karim'; input.autocomplete = 'off'; input.setAttribute('aria-label', 'First name');
  card.append(el('p', 'lab', 'First name'), input, el('p', 'lab', 'Who are they?'));
  const list = el('div', 'roles');
  const options = [...(source.cast ?? []), { role: '', label: 'Nobody yet', note: 'A number bubl partners does not know. Sign it in OPS yourself.' }];
  options.forEach((c, i) => {
    const row = el('label', 'role');
    const radio = el('input');
    radio.type = 'radio'; radio.name = 'role'; radio.value = c.role; radio.checked = i === 0;
    const words = el('span', '');
    words.append(el('b', '', c.label), el('small', '', c.note));
    row.append(radio, words);
    list.append(row);
  });
  const go = el('button', 'go', 'Add');
  go.type = 'submit';
  const err = el('p', 'err');
  card.append(list, go, err);
  card.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return input.focus();
    const role = (list.querySelector('input:checked') || {}).value || '';
    go.disabled = true; go.textContent = role ? 'Setting them up…' : 'Adding…';
    try {
      const made = await source.newPerson(name, 'partners', role);
      close(addPerson(made));
      if (made.role === 'promoter') say(`${name} is a promoter with ${made.tables?.length ?? 0} tables held for the next night. Say hello from their phone.`);
      else if (made.role) say(`${name} is on the venue’s team as ${made.role}. Say hello from their phone.`);
    } catch (x) { err.textContent = x.message || 'That could not be done just now.'; go.disabled = false; go.textContent = 'Add'; }
  });
  setTimeout(() => input.focus(), 0);
});
const chooser = (from) => overlay((card, close) => {
  // a forwarded message goes to a guest's phone (a partner's phone is for its chat with bubl)
  const rest = people.filter((p) => p !== from && !isPartner(p));
  if (!rest.length) return nameForm(card, close, 'Send to…', `Who does ${from.name} forward it to? A simulated friend, by first name.`);
  card.append(el('h1', '', 'Send to…'), el('p', '', `Who does ${from.name} forward it to?`));
  for (const p of rest) {
    const b = el('button', 'pick', p.name);
    b.type = 'button';
    b.addEventListener('click', () => close(p));
    card.append(b);
  }
  const more = el('button', 'link', 'A new friend');
  more.type = 'button';
  more.addEventListener('click', () => { card.replaceChildren(); nameForm(card, close, 'Send to…', 'Their first name, as WhatsApp would show it.'); });
  card.append(more);
});

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
    chat: rec.line_name,
    lines: rec.lines,
    recordedFor: rec.recorded_for,
    async people() { return [{ id: 'demo', name: rec.person }]; },
    async start() { return []; },
    async act(_p, input) {
      if (input.tap && input.stale) return { note: 'This is a recording, so only the newest message’s buttons answer here. On the real engine an old button answers with where things stand now.' };
      const edge = rec.nodes[at]?.[input.tap ? `tap:${input.tap.title}` : `text:${plain(input.text)}`];
      if (!edge) return { note: `This is a recording: it knows ${rec.lines.map((l) => `“${l}”`).join(', ')} and every button. Connect staging to type anything.`, keep: true };
      at = edge.to;
      await sleep(450);
      return { rows: edge.messages.map((i) => ({ ...place(rec.messages[i]), id: ++n, at: new Date().toISOString() })) };
    },
    async more() { return []; },
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
  const fresh = (p, rows) => { for (const r of rows) p.last = Math.max(p.last, Number(r.id) || 0); return rows; };
  let mine = [];
  return {
    demo: false,
    sb,
    /** Who is signed in, and their simulated phones on the guests' line (the first is made on first use). */
    async enter() {
      const s = await call('state');
      if (!s.ok) return s;
      const line = (s.lines ?? []).find((l) => l.key === 'bubl');
      // the guests' phones first, then the partners' (a line that is switched off has no phones here)
      const on = (key) => (s.lines ?? []).some((l) => l.key === key && l.mode !== 'off');
      const own = (key) => (on(key) ? (s.people ?? []).filter((p) => p.line === key && p.mine).map((p) => ({ id: p.id, name: p.name, line: key, number: p.wa_id })) : []);
      mine = own('bubl');
      if (!mine.length) {
        const made = await call('person', { line: 'bubl', name: s.operator });
        if (!made.ok) return made;
        mine = [{ id: made.person.id, name: s.operator, line: 'bubl', number: made.person.wa_id }];
      }
      // (a partner's phone is not asked for by name at first use: it is made with "+ Partner")
      mine = [...mine, ...own('partners')];
      this.chats = Object.fromEntries((s.lines ?? []).filter((l) => l.mode !== 'off').map((l) => [l.key, l.name]));
      // the ready-made people "+ Partner" offers (a promoter, the venue's team)
      this.cast = Array.isArray(s.cast) ? s.cast : [];
      this.chat = line?.name ?? 'bubl';
      this.connected = !!line?.connected;
      return { ok: true };
    },
    async people() { return mine; },
    async newPerson(name, line = 'bubl', role = '') {
      const made = await call('person', { line, name, ...(role ? { role } : {}) });
      if (!made.ok) throw new Error(made.reason);
      return { id: made.person.id, name, line, number: made.person.wa_id, role: made.person.role ?? null, tables: made.person.tables ?? null };
    },
    async start(p) { p.last = 0; const f = await call('feed', { person: p.id }); return f.ok ? fresh(p, f.messages) : []; },
    async act(p, input) {
      // Each thing a simulated person does has a name of its own. Should the answer not arrive (the connection, or
      // the back end waking up), the very same thing is asked again, once: the back end keeps it as one message.
      const body = { person: p.id, after: p.last, key: crypto.randomUUID(), ...(input.tap ? { tap: { id: input.tap.id, title: input.tap.title, kind: input.tap.kind } } : { text: input.text }) };
      let r = await call('say', body);
      if (!r.ok && (r.status === 0 || r.status >= 500)) { await new Promise((done) => setTimeout(done, 1500)); r = await call('say', body); }
      return r.ok ? { rows: fresh(p, r.messages) } : { note: r.reason, bad: true, keep: true };
    },
    /** The studio holds a table of this kind for a simulated guest (the web step, played here). */
    async hold(p, tier, name) {
      const r = await call('hold', { person: p.id, tier, name, after: p.last });
      return r.ok ? { rows: fresh(p, r.messages) } : { note: r.reason };
    },
    /** The venue's web app, opened as this simulated guest: its address with a one-time sign-in (see the back end's "open"). */
    async open(p, url) { return call('open', { person: p.id, url }); },
    /** Anything that arrived since (the host being told, or an answer that had to be tried again). */
    async more(p) { const f = await call('feed', { person: p.id, after: p.last }); return f.ok ? fresh(p, f.messages) : []; },
    async reset(p) { const r = await call('reset', { person: p.id }); if (!r.ok) throw new Error(r.reason); },
    /** A DEMO scene sent to this simulated guest (the back end's "demo"). */
    async demoScene(p, what) { const r = await call('demo', { person: p.id, what, after: p.last }); return r.ok ? { rows: fresh(p, r.messages) } : { note: r.reason }; },
  };
}

// ---------- the page ----------
// Reset can be tapped only once the chats are loaded: tapped while they were still arriving, it emptied them and the
// load then put them back, so the first tap looked ignored (Sk, 26 Nov 2026). Until then the button is shown greyed.
let loaded = false;
let resetting = false;
let resets = 0;
function resetReady() { $('reset').disabled = !loaded || resetting; }
$('reset').addEventListener('click', async () => {
  if (!source || !loaded || resetting) return;
  // never a tap that does nothing: it says why
  if (people.some((p) => p.busy)) return say('bubl is still answering. Tap Reset again in a moment.');
  resetting = true; resetReady();
  try {
    for (const p of people) { await source.reset(p); resets++; p.rows = []; p.peers = new Map(); p.view = 'bubl'; p.draft = ''; p.unread = 0; }
    layout();
    say('Started again from empty chats.');
  } catch (e) { layout(); say(e.message || 'Reset did not work just now.', true); } finally { resetting = false; resetReady(); }
});

async function open(src) {
  source = src;
  $('gate').hidden = true;
  $('stage').hidden = false;
  resetReady();
  $('reset').hidden = false;
  for (const p of await src.people()) addPerson(p);
  current = people[0];
  for (const p of people) p.rows = await src.start(p);
  layout();
  loaded = true; resetReady();
  if (src.demo) {
    const strip = $('strip');
    strip.hidden = false;
    strip.replaceChildren('Try:');
    for (const line of src.lines) {
      const c = el('button', 'chip', line);
      c.type = 'button';
      c.addEventListener('click', () => { current.draft = line; redraw(current); phoneOf(current)?.field.focus(); });
      strip.append(c);
    }
    const day = new Date(src.recordedFor).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    say(`DEMO. These are bubl’s own answers, recorded from the engine on the test data of ${day}. Nothing is sent anywhere.`, false, true);
  } else {
    const meta = $('meta');
    meta.hidden = false;
    meta.textContent = src.connected ? 'Meta: connected' : 'Meta: not connected yet';
    meta.classList.toggle('off', !src.connected);
    say(STANDING, false, true);
    // anything that arrives later (the host being told, an answer tried again): look for it while the page is in view
    setInterval(() => { if (!document.hidden) others(null).catch(() => {}); }, 6000);
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
  // (out of the studio's own sign-in only: the same person's sign-in in OPS or the guest app is left alone)
  const out = async () => { try { await src.sb.auth.signOut({ scope: 'local' }); } catch { /* already out */ } location.reload(); };
  $('gateBack').addEventListener('click', () => { if (go.hidden) return out(); number = null; code.value = ''; step(1); });
  $('signout').addEventListener('click', out);
  return enter();
}

for (const ph of phones) { ph.root.hidden = true; $('phones').append(ph.root); }

// a real phone's keyboard changes how much of the page is in view; the chat follows it
if (window.visualViewport) {
  const fit = () => { document.documentElement.style.setProperty('--vvh', `${window.visualViewport.height}px`); for (const ph of phones) ph.toBottom(); };
  window.visualViewport.addEventListener('resize', fit);
  fit();
}
// On a laptop each phone is drawn at its true size, 360 x 760. If the window is too short to hold it, the whole
// phone is made smaller in proportion, so the chat and the message field are always in view.
function fitPhone() {
  const room = window.innerHeight - 52 - 40;
  document.documentElement.style.setProperty('--k', String(Math.min(1, Math.max(0.6, room / 760))));
  if (source) layout();
}
window.addEventListener('resize', fitPhone);
fitPhone();

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
