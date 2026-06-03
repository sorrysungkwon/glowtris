const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({ ok: false, error: 'missing env' });
  }
  try {
    const r = await fetch(`${REDIS_URL}/ping`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const body = await r.json();
    return res.status(200).json({ ok: true, redis: body });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
