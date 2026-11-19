/* Money on the guest's phone.
   Every amount is whole minor units (fils for AED), exactly as the back end sends it. The phone never decides what
   anyone owes, and never works out a fee: the database states both. What is here only WRITES an amount out, and
   previews two sums before they are sent, giving the very figures the back end will give (tests/unit/web_money.test.ts). */
(function (root) {
  'use strict';
  /* how many decimals a currency has; AED and most others have two */
  var EXPONENT = { AED: 2, USD: 2, EUR: 2, GBP: 2, SAR: 2, QAR: 2, BHD: 3, KWD: 3, OMR: 3, JPY: 0 };
  function whole(n, what) { if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) throw new Error((what || 'An amount') + ' must be whole minor units, got ' + n); return n; }

  /** 750000 → "AED 7,500"; 114750 → "AED 1,147.50". Whole units show no decimals; anything else shows them all. */
  function fmt(minor, currency) {
    whole(minor); var cur = currency || 'AED', exp = EXPONENT[cur] == null ? 2 : EXPONENT[cur], unit = Math.pow(10, exp);
    var major = Math.floor(minor / unit), rest = minor % unit;
    var text = String(major).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return cur + ' ' + text + (rest ? '.' + String(rest).padStart(exp, '0') : '');
  }

  /** "Split deposit": even shares to the exact minor unit. The odd units go to the first seats, so the shares add up. */
  function evenShares(totalMinor, seats) {
    whole(totalMinor, 'The deposit'); if (!Number.isInteger(seats) || seats < 1) throw new Error('There must be at least one seat.');
    var base = Math.floor(totalMinor / seats), odd = totalMinor - base * seats, out = [];
    for (var i = 0; i < seats; i++) out.push(base + (i < odd ? 1 : 0));
    return out;
  }

  /** minimum × pct in whole minor units, half a unit rounding up: the back end's own rule (packages/core/deposits.ts). */
  function depositOf(minimumMinor, pct) {
    whole(minimumMinor, 'The minimum'); if (!(pct > 0 && pct <= 1)) throw new Error('The deposit percentage must be above 0% and at most 100%.');
    var tenThousandths = Math.round(pct * 10000);
    return Number((BigInt(minimumMinor) * BigInt(tenThousandths) * 2n + 10000n) / 20000n);
  }

  var api = { fmt: fmt, evenShares: evenShares, depositOf: depositOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.BUBL = root.BUBL || {}; root.BUBL.money = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
