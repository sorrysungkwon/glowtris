const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisMGet(keys) {
  const res = await fetch(`${REDIS_URL}/mget/${keys.join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await res.json();
  return json.result; // Returns an array of values
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Cache at the edge for 60 seconds, serve stale while revalidating for up to 10 minutes
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=600');

  try {
    const [time, msg] = await redisMGet(['maintenance:time', 'maintenance:msg']);

    if (!time && !msg) return res.status(200).json(null);

    res.status(200).json({ time: time ? Number(time) : null, msg: msg || 'Scheduled maintenance' });
  } catch {
    res.status(200).json(null);
  }
}
