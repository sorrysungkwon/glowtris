const crypto = require('crypto');

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const SUBS_KEY    = 'glowtris-push-subs';

const ALLOWED_ORIGINS = ['https://glowtris.com', 'https://www.glowtris.com', 'https://prevglow.vercel.app'];

// Push endpoints must come from real browser push services (https).
const MAX_ENDPOINT_LEN = 1024;
const MAX_VALUE_LEN = 4096;

// Rate limit: max 5 subscriptions per IP per 60s window.
const RATE_LIMIT = 5;
const RATE_WINDOW = 60;

async function redis(path, body) {
  const opts = { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } };
  if (body) { opts.method = 'POST'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(`${REDIS_URL}/${path}`, opts);
  return res.json();
}

async function checkRateLimit(ip) {
  const key = `rl:sub:${ip.replace(/[^a-fA-F0-9.:]/g, '_')}`;
  const incr = await redis(`incr/${key}`);
  const count = incr.result || 0;
  if (count === 1) {
    redis(`expire/${key}/${RATE_WINDOW}`);
  }
  return count > RATE_LIMIT;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: 'unavailable' });
  }

  const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (await checkRateLimit(ip)) {
    return res.status(429).json({ error: 'too many requests' });
  }

  const { subscription, tzOffset } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys) {
    return res.status(400).json({ error: 'invalid subscription' });
  }

  // Validate endpoint: must be a well-formed https URL
  const endpoint = String(subscription.endpoint);
  if (endpoint.length > MAX_ENDPOINT_LEN) {
    return res.status(400).json({ error: 'endpoint too long' });
  }
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return res.status(400).json({ error: 'invalid endpoint' });
  }
  if (url.protocol !== 'https:') {
    return res.status(400).json({ error: 'endpoint must be https' });
  }

  const value = JSON.stringify({
    endpoint,
    keys: subscription.keys,
    tzOffset: parseInt(tzOffset) || 0,
  });
  if (value.length > MAX_VALUE_LEN) {
    return res.status(400).json({ error: 'subscription too large' });
  }

  const field = crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
  await redis('', ["hset", SUBS_KEY, field, value]);
  return res.status(200).json({ ok: true });
}
