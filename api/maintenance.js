const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await res.json();
  return json.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const [time, msg] = await Promise.all([
      redisGet('maintenance:time'),
      redisGet('maintenance:msg'),
    ]);

    if (!time && !msg) return res.status(200).json(null);

    res.status(200).json({ time: time ? Number(time) : null, msg: msg || 'Scheduled maintenance' });
  } catch {
    res.status(200).json(null);
  }
}
