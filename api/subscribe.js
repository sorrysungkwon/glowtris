const crypto = require('crypto');

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const SUBS_KEY    = 'glowtris-push-subs';

async function redis(path, body) {
  const opts = { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } };
  if (body) { opts.method = 'POST'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(`${REDIS_URL}/${path}`, opts);
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription, tzOffset } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys) {
    return res.status(400).json({ error: 'invalid subscription' });
  }

  const field = crypto.createHash('sha256').update(subscription.endpoint).digest('hex').slice(0, 16);
  const value = JSON.stringify({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    tzOffset: parseInt(tzOffset) || 0,
  });

  const r = await redis(`hset/${SUBS_KEY}`, [field, value]);
  return res.status(200).json({ ok: true, r });
}
