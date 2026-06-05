import webpush from 'web-push';

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const SUBS_KEY    = 'glowtris-push-subs';
const NOTIFY_HOUR = 12; // local noon

webpush.setVapidDetails(
  'mailto:seonqwer@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function redis(path, body) {
  const opts = { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } };
  if (body) { opts.method = 'POST'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(`${REDIS_URL}/${path}`, opts);
  return res.json();
}

function localHour(utcMinutes, tzOffset) {
  // tzOffset = getTimezoneOffset() — positive means behind UTC (EST=300), negative means ahead (KST=-540)
  return Math.floor(((utcMinutes - tzOffset) % 1440 + 1440) % 1440 / 60);
}

function localDateStr(utcNow, tzOffset) {
  return new Date(utcNow.getTime() - tzOffset * 60000).toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (!REDIS_URL || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'missing env vars' });
  }

  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const hashData = await redis(`hgetall/${SUBS_KEY}`);
  const raw = hashData.result;
  if (!raw || raw.length === 0) return res.status(200).json({ sent: 0, total: 0 });

  // hgetall returns [field, value, field, value, ...]
  const subs = [];
  for (let i = 0; i < raw.length; i += 2) {
    try { subs.push({ field: raw[i], ...JSON.parse(raw[i + 1]) }); } catch {}
  }

  let sent = 0;
  const toDelete = [];

  for (const sub of subs) {
    const tz = sub.tzOffset || 0;
    if (localHour(utcMinutes, tz) !== NOTIFY_HOUR) continue;

    // Dedup: only send once per local day
    const localDate = localDateStr(now, tz);
    const dedupKey  = encodeURIComponent(`glowtris-notif:${localDate}:${sub.field}`);
    const nx = await redis(`set/${dedupKey}/1/ex/90000/nx`);
    if (!nx.result) continue;

    const displayDate = new Date(now.getTime() - tz * 60000)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({
          title: '🏆 Daily Challenge',
          body: `${displayDate} challenge is live — can you top the leaderboard?`,
          url: '/?mode=daily',
        })
      );
      sent++;
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) toDelete.push(sub.field);
    }
  }

  // Remove expired subscriptions
  if (toDelete.length) {
    await redis(`hdel/${SUBS_KEY}`, toDelete);
  }

  return res.status(200).json({ sent, total: subs.length, deleted: toDelete.length });
}
