// POST /api/subscribe — the online group list.
//
// Why a server step at all: posting straight to Kit's public form endpoint
// gets most signups "quarantined" behind a reCAPTCHA page, so a visitor who
// typed their email and saw "you're on the list" was often never added. The
// Kit API with our own key skips that check. Without the key this answers 503
// and the page falls back to the public form, captcha and all.
//
// Body (JSON): { email, source, ref, company }
//   source  where they signed up, e.g. "home-banner" or "r-faq"
//   ref     the connector slug when they came through /r/<slug>
//   company honeypot. People never see it, bots fill it in.

const API = 'https://api.kit.com/v4';
const TAG_ID = 24800126; // online-group-list
const WELCOME_SEQUENCE_ID = 2936134; // "Food Jazz — online group list welcome"

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

async function kit(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': process.env.KIT_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(path + ' ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return res.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const email = clean(body.email, 254).toLowerCase();
  const source = clean(body.source, 40).replace(/[^a-z0-9-]/g, '');
  const ref = clean(body.ref, 60).replace(/[^a-z0-9-]/g, '');

  // A filled honeypot gets the same answer a person would, so the bot moves on.
  if (clean(body.company, 200)) return res.status(200).json({ status: 'success' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ status: 'invalid' });
  }

  if (!process.env.KIT_API_KEY) return res.status(503).json({ status: 'unavailable' });

  // Only set the fields we actually have, so a second signup never blanks out
  // who referred someone the first time.
  const fields = {};
  if (source) fields.source = source;
  if (ref) fields.referred_by = ref;

  try {
    await kit('/subscribers', { email_address: email, state: 'active', fields });
    await kit('/tags/' + TAG_ID + '/subscribers', { email_address: email });
  } catch (err) {
    console.error('[subscribe] kit failed:', err.message);
    return res.status(502).json({ status: 'error' });
  }

  // The welcome email is nice to have. The signup already landed, so a failure
  // here is logged and the visitor still hears they're on the list.
  try {
    await kit('/sequences/' + WELCOME_SEQUENCE_ID + '/subscribers', { email_address: email });
  } catch (err) {
    console.error('[subscribe] welcome sequence failed:', err.message);
  }

  return res.status(200).json({ status: 'success' });
};
