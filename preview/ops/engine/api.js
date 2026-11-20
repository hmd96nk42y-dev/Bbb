/* OPS's line to BUBL's back end: the `ops` function (packages/core/ops_http.ts).
   The page says which venue it is and what it wants; who is asking is read from their staff sign-in by the back end.
   Built on the same client as the guest app (web/engine/api.js): one sign-in, one way of calling. */
(function (root) {
  'use strict';
  var B = root.BUBL = root.BUBL || {};
  var cfg = root.BUBL_CONFIG || {};
  /** POST …/ops/<door>. Always answers { ok:true, … } or { ok:false, code, reason }. Never throws. */
  B.ops = function (door, body) { return B.call('ops', door, Object.assign({ venue: cfg.venue }, body || {})); };
  /** The night as this person's role may see it. */
  B.opsNight = function (serviceId) { return B.ops('night', serviceId ? { service: serviceId } : {}); };
})(typeof globalThis !== 'undefined' ? globalThis : this);
