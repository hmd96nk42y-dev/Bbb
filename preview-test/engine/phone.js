/* A mobile number, checked for the country it belongs to.
   Sk's build only counted digits (7 to 12). This asks libphonenumber-js (MIT, in ./vendor) what a mobile number looks
   like in that country, so a number that cannot receive a login code is caught before a code is asked for.
   It is a first look: the real proof that a phone is the guest's is the code itself. */
(function (root) {
  'use strict';
  var lib = (typeof module !== 'undefined' && module.exports) ? require('./vendor/libphonenumber-mobile.js') : root.libphonenumber;
  var no = function (reason) { return { ok: false, reason: reason }; };

  /**
   * text: what the guest typed. dial: the country code chosen beside the field ("971" or "+971"), when the form has one.
   * → { ok:true, e164:"+971501234567", country:"AE" } or { ok:false, reason:"a sentence for the guest" }
   */
  function parse(text, dial) {
    var raw = String(text == null ? '' : text).trim();
    if (!/\d/.test(raw)) return no('Enter your mobile number.');
    if (/[a-z]/i.test(raw)) return no('Enter your mobile number, digits only.');
    if (/^00/.test(raw)) raw = '+' + raw.slice(2);                       /* 00971… is the same as +971… */
    var code = String(dial == null ? '' : dial).replace(/\D/g, '');
    if (raw.charAt(0) !== '+' && !code) return no('Start with your country code, for example +971.');
    var opts = raw.charAt(0) === '+' ? undefined : { defaultCallingCode: code };
    var n; try { n = lib.parsePhoneNumberFromString(raw, opts); } catch (_) { n = null; }
    var length = lib.validatePhoneNumberLength(raw, opts);                /* undefined when the length is right */
    if (length === 'TOO_SHORT') return no('That number is too short' + where(n) + '.');
    if (length === 'TOO_LONG') return no('That number is too long' + where(n) + '.');
    if (length === 'INVALID_COUNTRY') return no('That country code is not one we know. Check the start of your number.');
    if (!n || length) return no('That does not look like a mobile number. Check it and try again.');
    if (!n.isValid()) return no('That is not a complete mobile number' + where(n) + '. Your login code can only go to a mobile.');
    return { ok: true, e164: n.number, country: n.country || null };
  }
  function where(n) {
    try { var c = n && n.country; return c ? ' for ' + new Intl.DisplayNames(['en'], { type: 'region' }).of(c) : ''; } catch (_) { return ''; }
  }

  /** "+971501234567" → "+971 50 123 4567" */
  function pretty(e164) { try { var n = lib.parsePhoneNumberFromString(String(e164)); return n ? n.formatInternational() : String(e164); } catch (_) { return String(e164); } }

  var api = { parse: parse, pretty: pretty };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.BUBL = root.BUBL || {}; root.BUBL.phone = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
