const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_AVAILABLE = !!(REDIS_URL && REDIS_TOKEN);
const P = process.env.LEADERBOARD_PREFIX || '';
function safeClientDate(raw) {
  const utc = new Date().toISOString().slice(0, 10);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return utc;
  return Math.abs(new Date(raw) - new Date(utc)) <= 86400000 ? raw : utc;
}
const KEY_ALL   = `${P}glowtris-lb`;
const KEY_DAILY = (dateStr) => `${P}glowtris-daily-${dateStr}`;
const KEY_WEEKLY = () => {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return `${P}glowtris-weekly-${d.toISOString().slice(0,10)}`;
};
const KEY_CHALLENGE = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${P}daily:${today}`;
};
const KEY_CHALLENGE_ALLTIME = `${P}challenge:alltime`;

// Sprint keys — ascending leaderboard (lowest time = best)
const KEY_SPRINT     = `${P}glowtris-sprint`;
const KEY_SPRINT_DAILY  = (dateStr) => `${P}glowtris-sprint-daily-${dateStr}`;
const KEY_SPRINT_WEEKLY = () => {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return `${P}glowtris-sprint-weekly-${d.toISOString().slice(0,10)}`;
};

// Blitz keys — descending leaderboard (highest score = best)
const KEY_BLITZ      = `${P}glowtris-blitz`;
const KEY_BLITZ_DAILY  = (dateStr) => `${P}glowtris-blitz-daily-${dateStr}`;
const KEY_BLITZ_WEEKLY = () => {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return `${P}glowtris-blitz-weekly-${d.toISOString().slice(0,10)}`;
};

const TOP = 10;
const TOP_ALLTIME = 20;
const DAILY_TTL  = 60 * 60 * 52;
const WEEKLY_TTL = 60 * 60 * 24 * 8;

// Score bounds: 0 < score ≤ 99,999,999.
// Rejects obvious spoofed submissions without needing server-side game simulation.
const MAX_SCORE = 99_999_999;

// Sprint time bounds (milliseconds).
// 15s lower bound = physically impossible 40-line clear time.
// 1h upper bound = generous timeout.
const SPRINT_MIN_MS = 15_000;
const SPRINT_MAX_MS = 3_600_000;

// Rate limits per IP per 60s window.
// POST (score submit): 10 — fastest human play ~30s/game → max 2/min; 10 covers shared IPs.
// GET (leaderboard fetch): 30 — one per game start + occasional manual refresh.
const RATE_LIMIT_POST = 10;
const RATE_LIMIT_GET  = 30;
const RATE_WINDOW = 60; // seconds

async function redis(cmd) {
  const res = await fetch(`${REDIS_URL}/${cmd}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return res.json();
}

function parseMember(member) {
  const decoded = decodeURIComponent(member);
  const idx = decoded.lastIndexOf('#');
  return idx === -1 ? decoded : decoded.slice(0, idx);
}

// Marathon board: descending (highest score first)
async function getBoard(key, limit = TOP) {
  const data = await redis(`zrange/${key}/0/${limit - 1}/rev/withscores`);
  const raw = data.result || [];
  const board = [];
  for (let i = 0; i < raw.length; i += 2) {
    board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
  }
  return board;
}

// Full board ascending (lowest score first) — for target warmup sampling
async function getBoardAscending(key) {
  const data = await redis(`zrange/${key}/0/-1/withscores`);
  const raw = data.result || [];
  const board = [];
  for (let i = 0; i < raw.length; i += 2) {
    board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
  }
  return board;
}

// Sprint board: ascending (lowest time first = fastest wins)
async function getSprintBoard(key, limit = TOP) {
  const data = await redis(`zrange/${key}/0/${limit - 1}/withscores`);
  const raw = data.result || [];
  const board = [];
  for (let i = 0; i < raw.length; i += 2) {
    board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
  }
  return board;
}

// Returns true if the IP has exceeded the rate limit for the given method.
// Costs 1 Redis command on hot path (INCR), +1 EXPIRE on first hit in window.
async function checkRateLimit(ip, method) {
  const limit = method === 'GET' ? RATE_LIMIT_GET : RATE_LIMIT_POST;
  const key = `rl:${method}:${ip.replace(/[^a-fA-F0-9.:]/g, '_')}`;
  const incr = await redis(`incr/${key}`);
  const count = incr.result || 0;
  if (count === 1) {
    redis(`expire/${key}/${RATE_WINDOW}`);
  }
  return count > limit;
}

// Marathon dedup: keep personal best (highest score).
// Returns true if the new score was written, false if equal/higher already exists.
async function deduplicateAndAdd(key, cleanName, newScore, newMember) {
  const data = await redis(`zrange/${key}/0/-1/withscores`);
  const raw = data.result || [];
  const oldMembers = [];
  let personalBest = -Infinity;
  for (let i = 0; i < raw.length; i += 2) {
    if (parseMember(raw[i]) === cleanName) {
      oldMembers.push(raw[i]);
      personalBest = Math.max(personalBest, parseInt(raw[i + 1], 10));
    }
  }
  if (personalBest >= newScore) return false;
  if (oldMembers.length > 0) {
    const encoded = oldMembers.map(m => encodeURIComponent(m)).join('/');
    await redis(`zrem/${key}/${encoded}`);
  }
  await redis(`zadd/${key}/${newScore}/${newMember}`);
  return true;
}

// Sprint dedup: keep personal best (lowest time).
// Returns true if the new time was written, false if equal/lower already exists.
async function deduplicateAndAddSprint(key, cleanName, newTime, newMember) {
  const data = await redis(`zrange/${key}/0/-1/withscores`);
  const raw = data.result || [];
  const oldMembers = [];
  let personalBest = Infinity;
  for (let i = 0; i < raw.length; i += 2) {
    if (parseMember(raw[i]) === cleanName) {
      oldMembers.push(raw[i]);
      personalBest = Math.min(personalBest, parseInt(raw[i + 1], 10));
    }
  }
  if (personalBest <= newTime) return false;
  if (oldMembers.length > 0) {
    const encoded = oldMembers.map(m => encodeURIComponent(m)).join('/');
    await redis(`zrem/${key}/${encoded}`);
  }
  await redis(`zadd/${key}/${newTime}/${newMember}`);
  return true;
}

const ALLOWED_ORIGINS = ['https://glowtris.com', 'https://www.glowtris.com', 'https://prevglow.vercel.app'];
const RESERVED_NAMES = ['admin', 'glowtris', 'moderator', 'mod', 'operator', 'system', 'bot'];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url ? new URL(req.url, 'http://localhost') : null;
  const rawDate = (req.query && req.query.date) || (url && url.searchParams.get('date')) || (req.body && req.body.date);
  const clientDate = safeClientDate(rawDate);

  const daily  = KEY_DAILY(clientDate);
  const weekly = KEY_WEEKLY();

  if (!REDIS_AVAILABLE) {
    if (req.method === 'GET') {
      return res.status(200).json({ board: [], dailyBoard: [], weeklyBoard: [], challengeBoard: [], challengeAlltimeBoard: [], sprintBoard: [], sprintDailyBoard: [], sprintWeeklyBoard: [] });
    }
    return res.status(503).json({ error: 'leaderboard unavailable' });
  }

  if (req.method === 'GET') {
    const getIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    if (await checkRateLimit(getIp, 'GET')) {
      return res.status(429).json({ error: 'too many requests' });
    }

    // Cache GET responses at the Vercel edge for 60s.
    // Cuts Redis reads ~50% at zero cost — extends Upstash free tier from ~416 to ~700 DAU.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const mode = (req.query && req.query.mode) || (url && url.searchParams.get('mode')) || '';

    if (mode === 'daily') {
      const [challengeBoard, challengeAlltimeBoard, dailyTargetBoard, challengeTodayCount, challengeAlltimeCount] = await Promise.all([
        getBoard(KEY_CHALLENGE()),
        getBoard(KEY_CHALLENGE_ALLTIME, TOP_ALLTIME),
        getBoardAscending(KEY_CHALLENGE_ALLTIME),
        redis(`zcard/${KEY_CHALLENGE()}`),
        redis(`zcard/${KEY_CHALLENGE_ALLTIME}`),
      ]);
      return res.status(200).json({
        challengeBoard, challengeAlltimeBoard, dailyTargetBoard,
        challengeTodayCount: challengeTodayCount.result || 0,
        challengeAlltimeCount: challengeAlltimeCount.result || 0,
      });
    }

    if (mode === 'sprint') {
      const sprintDaily = KEY_SPRINT_DAILY(clientDate);
      const sprintWeekly = KEY_SPRINT_WEEKLY();
      const [sprintBoard, sprintDailyBoard, sprintWeeklyBoard, sprintTotalCount] = await Promise.all([
        getSprintBoard(KEY_SPRINT, TOP_ALLTIME),
        getSprintBoard(sprintDaily),
        getSprintBoard(sprintWeekly),
        redis(`zcard/${KEY_SPRINT}`),
      ]);
      return res.status(200).json({ sprintBoard, sprintDailyBoard, sprintWeeklyBoard, sprintTotalCount: sprintTotalCount.result || 0 });
    }

    if (mode === 'blitz') {
      const blitzDaily = KEY_BLITZ_DAILY(clientDate);
      const blitzWeekly = KEY_BLITZ_WEEKLY();
      const [blitzBoard, blitzDailyBoard, blitzWeeklyBoard, blitzTargetBoard, blitzTotalCount] = await Promise.all([
        getBoard(KEY_BLITZ, TOP_ALLTIME),
        getBoard(blitzDaily),
        getBoard(blitzWeekly),
        getBoardAscending(KEY_BLITZ),
        redis(`zcard/${KEY_BLITZ}`),
      ]);
      return res.status(200).json({ blitzBoard, blitzDailyBoard, blitzWeeklyBoard, blitzTargetBoard, blitzTotalCount: blitzTotalCount.result || 0 });
    }

    const [board, dailyBoard, weeklyBoard, targetBoard, totalCount, dailyTotalCount] = await Promise.all([
      getBoard(KEY_ALL, TOP_ALLTIME),
      getBoard(daily),
      getBoard(weekly),
      getBoardAscending(KEY_ALL),
      redis(`zcard/${KEY_ALL}`),
      redis(`zcard/${daily}`),
    ]);
    return res.status(200).json({ board, dailyBoard, weeklyBoard, targetBoard, totalCount: totalCount.result || 0, dailyTotalCount: dailyTotalCount.result || 0 });
  }

  if (req.method === 'POST') {
    // --- Rate limiting ---
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    if (await checkRateLimit(ip, 'POST')) {
      return res.status(429).json({ error: 'too many requests' });
    }

    const { name, score, mode } = req.body;

    // --- Input validation ---
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'name and score required' });
    }
    const clean = String(name).trim().slice(0, 12).replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s\-_.]/g, '').trim();
    if (!clean) return res.status(400).json({ error: 'invalid name' });
    if (RESERVED_NAMES.includes(clean.toLowerCase())) return res.status(400).json({ error: 'reserved name' });

    const member = encodeURIComponent(`${clean}#${Date.now()}`);
    const isChallenge = mode === 'daily' || req.body.challenge === 1;
    const isSprint = mode === 'sprint';
    const isBlitz = mode === 'blitz';

    // ── Sprint mode ────────────────────────────────────────────────────────────
    if (isSprint) {
      if (!Number.isInteger(score) || score < SPRINT_MIN_MS || score > SPRINT_MAX_MS) {
        return res.status(400).json({ error: 'sprint time out of range' });
      }
      const sprintTime = score; // score field reused for time (ms)
      const sprintDaily = KEY_SPRINT_DAILY(clientDate);
      const sprintWeekly = KEY_SPRINT_WEEKLY();

      await Promise.all([
        deduplicateAndAddSprint(KEY_SPRINT, clean, sprintTime, member),
        deduplicateAndAddSprint(sprintDaily, clean, sprintTime, member),
        deduplicateAndAddSprint(sprintWeekly, clean, sprintTime, member),
      ]);

      await Promise.all([
        redis(`zremrangebyrank/${KEY_SPRINT}/${TOP_ALLTIME}/-1`), // keep top 20 fastest
        redis(`expire/${sprintDaily}/${DAILY_TTL}`),
        redis(`expire/${sprintWeekly}/${WEEKLY_TTL}`),
      ]);

      const [sprintBoard, sprintDailyBoard, sprintWeeklyBoard] = await Promise.all([
        getSprintBoard(KEY_SPRINT, TOP_ALLTIME),
        getSprintBoard(sprintDaily),
        getSprintBoard(sprintWeekly),
      ]);

      const [allRankData, dailyRankData, weeklyRankData] = await Promise.all([
        redis(`zcount/${KEY_SPRINT}/-inf/${sprintTime - 1}`),
        redis(`zcount/${sprintDaily}/-inf/${sprintTime - 1}`),
        redis(`zcount/${sprintWeekly}/-inf/${sprintTime - 1}`),
      ]);
      const sprintRank       = (allRankData.result    || 0) + 1;
      const sprintDailyRank  = (dailyRankData.result  || 0) + 1;
      const sprintWeeklyRank = (weeklyRankData.result || 0) + 1;

      return res.status(200).json({ sprintBoard, sprintDailyBoard, sprintWeeklyBoard, sprintRank, sprintDailyRank, sprintWeeklyRank });
    }

    // ── Blitz mode ─────────────────────────────────────────────────────────────
    if (isBlitz) {
      if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
        return res.status(400).json({ error: 'score out of range' });
      }
      const blitzDaily = KEY_BLITZ_DAILY(clientDate);
      const blitzWeekly = KEY_BLITZ_WEEKLY();

      await Promise.all([
        deduplicateAndAdd(KEY_BLITZ, clean, score, member),
        deduplicateAndAdd(blitzDaily, clean, score, member),
        deduplicateAndAdd(blitzWeekly, clean, score, member),
      ]);

      await Promise.all([
        redis(`zremrangebyrank/${KEY_BLITZ}/0/-501`),
        redis(`expire/${blitzDaily}/${DAILY_TTL}`),
        redis(`expire/${blitzWeekly}/${WEEKLY_TTL}`),
      ]);

      const [blitzBoard, blitzDailyBoard, blitzWeeklyBoard] = await Promise.all([
        getBoard(KEY_BLITZ, TOP_ALLTIME),
        getBoard(blitzDaily),
        getBoard(blitzWeekly),
      ]);

      const [allRankData, dailyRankData, weeklyRankData] = await Promise.all([
        redis(`zcount/${KEY_BLITZ}/${score + 1}/+inf`),
        redis(`zcount/${blitzDaily}/${score + 1}/+inf`),
        redis(`zcount/${blitzWeekly}/${score + 1}/+inf`),
      ]);
      const blitzRank       = (allRankData.result    || 0) + 1;
      const blitzDailyRank  = (dailyRankData.result  || 0) + 1;
      const blitzWeeklyRank = (weeklyRankData.result || 0) + 1;

      return res.status(200).json({ blitzBoard, blitzDailyBoard, blitzWeeklyBoard, blitzRank, blitzDailyRank, blitzWeeklyRank });
    }

    // ── Daily Challenge mode ───────────────────────────────────────────────────
    if (isChallenge) {
      if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
        return res.status(400).json({ error: 'score out of range' });
      }
      const key = KEY_CHALLENGE();
      await Promise.all([
        deduplicateAndAdd(key, clean, score, member),
        deduplicateAndAdd(KEY_CHALLENGE_ALLTIME, clean, score, member),
      ]);
      await Promise.all([
        redis(`expire/${key}/${DAILY_TTL}`),
        redis(`zremrangebyrank/${KEY_CHALLENGE_ALLTIME}/0/-501`),
      ]);

      const [challengeBoard, challengeAlltimeBoard] = await Promise.all([
        getBoard(key),
        getBoard(KEY_CHALLENGE_ALLTIME, TOP_ALLTIME),
      ]);
      const rankData = await redis(`zcount/${key}/${score + 1}/+inf`);
      const challengeRank = (rankData.result || 0) + 1;
      const alltimeRankData = await redis(`zcount/${KEY_CHALLENGE_ALLTIME}/${score + 1}/+inf`);
      const challengeAlltimeRank = (alltimeRankData.result || 0) + 1;

      return res.status(200).json({ challengeBoard, challengeRank, challengeAlltimeBoard, challengeAlltimeRank });
    }

    // ── Marathon mode ──────────────────────────────────────────────────────────
    if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
      return res.status(400).json({ error: 'score out of range' });
    }

    await Promise.all([
      deduplicateAndAdd(KEY_ALL, clean, score, member),
      deduplicateAndAdd(daily, clean, score, member),
      deduplicateAndAdd(weekly, clean, score, member),
    ]);

    await Promise.all([
      redis(`zremrangebyrank/${KEY_ALL}/0/-501`),
      redis(`expire/${daily}/${DAILY_TTL}`),
      redis(`expire/${weekly}/${WEEKLY_TTL}`),
    ]);

    const [board, dailyBoard, weeklyBoard] = await Promise.all([
      getBoard(KEY_ALL, TOP_ALLTIME),
      getBoard(daily),
      getBoard(weekly),
    ]);

    const [rankData, dailyRankData, weeklyRankData, totalCountData] = await Promise.all([
      redis(`zcount/${KEY_ALL}/${score + 1}/+inf`),
      redis(`zcount/${daily}/${score + 1}/+inf`),
      redis(`zcount/${weekly}/${score + 1}/+inf`),
      redis(`zcard/${KEY_ALL}`),
    ]);
    const rank = (rankData.result || 0) + 1;
    const dailyRank = (dailyRankData.result || 0) + 1;
    const weeklyRank = (weeklyRankData.result || 0) + 1;
    const totalCount = totalCountData.result || 0;

    return res.status(200).json({ board, dailyBoard, weeklyBoard, rank, dailyRank, weeklyRank, totalCount });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
