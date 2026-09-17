// Vercel Web Analytics, plus the few events that turn the referral funnel from
// one number into something you can actually read.
//
// Why first-party: no cookies, no consent banner, no Google script on a page
// whose whole job is feeling like a note from a friend.
//
// The queue shim has to exist before script.js arrives, which is why this file
// loads normally and script.js is deferred. Calls made in between are buffered
// and replayed.
window.va =
  window.va ||
  function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

(function () {
  // The connector's slug, read the way both referral pages read it: off the
  // path first, because the Vercel rewrite is internal and the slug never
  // reaches the query string, then ?from= as the fallback older links used.
  function referrer() {
    var m = window.location.pathname.match(/^\/(?:r|refer)\/+([^\/]+)/);
    if (m) return decodeURIComponent(m[1]).trim().toLowerCase();
    try {
      var q = new URLSearchParams(window.location.search).get('from');
      return q ? q.trim().toLowerCase() : '';
    } catch (e) {
      return '';
    }
  }

  var ref = referrer();

  // Every event carries the slug when there is one, so each connector's funnel
  // reads on its own instead of only in aggregate. That is the whole reason
  // the slug lives in the URL path.
  //
  // Never throws. An analytics call that breaks a page is worse than no
  // analytics, and this runs inside click handlers that have real work to do.
  window.fjTrack = function (name, extra) {
    var data = extra || {};
    if (ref) data.ref = ref;
    try {
      window.va('event', { name: name, data: data });
    } catch (e) {
      /* ignore */
    }
  };
})();
