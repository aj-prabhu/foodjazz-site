// The online group list: every <form data-online-list="<source>"> on a page.
//
// Sends to /api/subscribe, which adds them in Kit with our key. If that isn't
// set up (no key yet) it falls back to Kit's public form, and when Kit wants
// its robot check we hand the visitor the link instead of pretending it worked.
//
// The form's own markup holds the copy. This file only flips data-state:
//   sending, done, check (needs Kit's robot check), error, invalid
(function () {
  var KIT_FORM = 'https://app.kit.com/forms/9931700/subscriptions';
  var STORE = 'fj-online-list';

  function remember(value) {
    try { localStorage.setItem(STORE, value); } catch (e) { /* private mode */ }
  }

  function referrer() {
    var m = window.location.pathname.match(/^\/r\/+([^\/]+)/);
    if (!m) return '';
    try { return decodeURIComponent(m[1]).toLowerCase(); } catch (e) { return ''; }
  }

  function track(name, source) {
    if (typeof window.fjTrack === 'function') window.fjTrack(name, { source: source });
  }

  function viaKitForm(email, source, ref) {
    var body = new URLSearchParams({ email_address: email, 'fields[source]': source });
    if (ref) body.append('fields[referred_by]', ref);
    return fetch(KIT_FORM, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    }).then(function (r) { return r.json(); });
  }

  function setState(form, state, checkUrl) {
    form.setAttribute('data-state', state);
    var link = form.querySelector('[data-check-link]');
    if (link && checkUrl) link.href = checkUrl;
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = state === 'sending';
  }

  document.querySelectorAll('form[data-online-list]').forEach(function (form) {
    var source = form.getAttribute('data-online-list');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.getAttribute('data-state') === 'sending') return;
      var input = form.querySelector('input[type="email"]');
      var trap = form.querySelector('input[name="company"]');
      var email = (input.value || '').trim();
      if (!input.checkValidity() || !email) { setState(form, 'invalid'); input.focus(); return; }

      var ref = referrer();
      setState(form, 'sending');

      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: source, ref: ref, company: trap ? trap.value : '' })
      })
        .then(function (r) {
          if (r.status === 503) return viaKitForm(email, source, ref);
          return r.json();
        })
        .then(function (data) {
          var status = data && data.status;
          if (status === 'success') {
            setState(form, 'done');
            remember('joined');
            track('online_list_join', source);
          } else if (status === 'quarantined' && data.url) {
            setState(form, 'check', data.url);
            track('online_list_check', source);
          } else if (status === 'invalid') {
            setState(form, 'invalid');
            input.focus();
          } else {
            setState(form, 'error');
          }
        })
        .catch(function () { setState(form, 'error'); });
    });
  });

  // Homepage banner: closes for good once they close it or join.
  var banner = document.getElementById('onlineBanner');
  if (!banner) return;
  var seen = '';
  try { seen = localStorage.getItem(STORE) || ''; } catch (e) { /* ignore */ }
  if (seen) return;
  banner.hidden = false;

  var open = banner.querySelector('[data-banner-open]');
  var close = banner.querySelector('[data-banner-close]');
  if (open) open.addEventListener('click', function () {
    banner.setAttribute('data-open', '');
    var input = banner.querySelector('input[type="email"]');
    if (input) input.focus();
  });
  if (close) close.addEventListener('click', function () {
    banner.hidden = true;
    remember('closed');
  });
})();
