/* The entry QR code: a real one, that a scanner can read.
   Sk's build drew a pattern that only looked like a QR code. The squares now come from uqr (MIT, in ./vendor), and the
   picture keeps the build's two looks exactly: the white rounded tile on the booking, the plain square on the ticket.

   What the code says is BUBL's own short text and nothing personal:
     BUBL:S:<the seat's entry token>     a seat at a table
     BUBL:T:<the ticket's token>         a ticket
   BUBL Scan (OPS, step 7) reads it back with read(). */
(function (root) {
  'use strict';
  var uqr = (typeof module !== 'undefined' && module.exports) ? loadForNode() : root.uqr;
  function loadForNode() { var vm = require('vm'), fs = require('fs'), path = require('path'), box = {}; vm.createContext(box); vm.runInContext(fs.readFileSync(path.join(__dirname, 'vendor', 'uqr.js'), 'utf8'), box); return box.uqr; }
  var KIND = { seat: 'S', ticket: 'T' }, BACK = { S: 'seat', T: 'ticket' };

  function payload(kind, token) {
    if (!KIND[kind]) throw new Error('A code is for a seat or a ticket.');
    /* the database's own tokens: letters, digits, - and _ (capitals and small letters are different tokens) */
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) throw new Error('A code carries a token and nothing else.');
    return 'BUBL:' + KIND[kind] + ':' + token;
  }
  function read(text) {
    var m = /^BUBL:([ST]):([A-Za-z0-9_-]{16,64})$/.exec(String(text || ''));
    return m ? { kind: BACK[m[1]], token: m[2] } : null;
  }
  /** The squares, true = dark, with `border` light squares all round. */
  function matrix(text, border) { return uqr.encode(text, { ecc: 'M', border: border == null ? 4 : border }).data; }
  function squares(m, w, h) { var d = ''; for (var y = 0; y < m.length; y++) for (var x = 0; x < m.length; x++) if (m[y][x]) d += 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h-' + w + 'z'; return d; }

  /** The booking's tile, as in the build: white rounded square, near-black squares, a two-square edge. Tap it and it fills the screen. */
  function tile(text) {
    var m = matrix(text, 2), n = m.length;
    return '<svg class="hn-qr" viewBox="0 0 ' + n + ' ' + n + '" role="img" aria-label="Entry QR code"><rect width="' + n + '" height="' + n + '" rx="1.6" fill="#fff"/><path fill="#0a0a0a" d="' + squares(m, 1.02, 1.02) + '"/></svg>';
  }
  /** The ticket's code, as in the build: plain black on white, a four-square edge. */
  function plain(text, px) {
    var m = matrix(text, 4), n = m.length;
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" width="' + px + '" height="' + px + '" shape-rendering="crispEdges" role="img" aria-label="Ticket QR code"><rect width="' + n + '" height="' + n + '" fill="#fff"/><path d="' + squares(m, 1, 1) + '" fill="#000"/></svg>';
  }

  var api = { payload: payload, read: read, matrix: matrix, tile: tile, plain: plain };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.BUBL = root.BUBL || {}; root.BUBL.qr = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
