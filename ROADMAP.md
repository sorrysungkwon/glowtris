# Glowtris Roadmap — v0.8 → v1.0 Launch

> Last updated: 2026-06-23  
> Current version: **v0.7** (shipped)  
> Launch target: **v1.0**

---

## Product Positioning

**"Start on mobile. Get serious on PC."**

Mobile = low-barrier entry channel (habit formation, daily check-in, streak).  
PC = skill depth + retention channel (keyboard speed, ranked progression).  
Duolingo cross-platform model: mobile builds the habit, PC is where real improvement happens.

---

## v0.8 — Social Signals

**Goal:** When a new user arrives, they immediately feel "this game has real people."

| Sub-version | Scope | Notes |
|---|---|---|
| v0.8.0 | Percentile display ("Top 12%"), score gap to #1 ("4,200 pts to #1") | Client-side, simple math |
| v0.8.1 | Daily challenge result share link, leaderboard UI polish | Share button with seeded URL |

**Gate to v0.9:** Both shipped and stable on production.

---

## v0.9 — Feel Polish

**Goal:** Game must feel *finished and premium* before launch. No rough edges.

| Sub-version | Scope | Notes |
|---|---|---|
| v0.9.0 | Danger vignette (red border glow when board is high), HUD spring animation on score update | Canvas + CSS |
| v0.9.1 | Result screen redesign (launch quality), mode select UI cleanup | Visual overhaul |
| **v0.9.5** | **Pre-launch checklist** — Privacy Policy update, security audit, marketing copy written. **Audits:** SEO (Schema/OpenGraph), PWA (sw.js offline cache), Analytics (streak telemetry). **Security:** HTTP Headers (CSP), Anti-Cheat MVP (session HMAC), XSS sanitization. | Critical gate |

**Gate to v1.0:** v0.9.5 checklist 100% complete.

---

## v1.0 — Official Launch

**Goal:** Retention loop complete. Auth + streak + shield live. Ship to world.

### v1.0.0 — Firebase Auth

- Firebase Auth setup (Google OAuth + email/password)
- Server-side ID token verification on all protected endpoints
- Login UI inside game (modal, non-blocking)
- Non-logged-in play allowed — "Save your streak" nudge after game end (with explicitly documented fallback/resilience if Auth fails)
- On first login: link existing localStorage name to Firebase UID
- **Cross-platform sync**: Sync scores, stats, and keybind preferences across devices
- Redis stores only UID — email/displayName never leaves Firebase

### v1.0.1 — Streak System

- Server-side streak tracking: `user:{uid}:streak`, `user:{uid}:last_play` in Redis
- 24h UTC reset — no play today = streak drops to 0
- Streak displayed in game header (🔥 N) when logged in
- Streak block on result screen (current streak, best streak)
- Streak resets are server-authoritative (no client manipulation)

### v1.0.2 — Streak Shield (Free)

- `user:{uid}:shields` in Redis
- 1 free shield auto-granted per week (cron job at UTC Sunday 00:00)
- Shield consumed automatically when streak would break
- Shield count shown in UI (header or result screen)
- Shield inventory cap: 5 (prevents hoarding)

*(Note: Paid monetization and advanced avatar features have been moved to v1.1 to de-risk the v1.0 launch window.)*

### 🚀 v1.0 Launch

- [ ] **Launch Sequencing**:
  - **Day 1**: Reddit (`r/webgames`, `r/Tetris`, `r/gamedev` — story angle)
  - **Day 2**: Hacker News (Show HN post)
  - **Day 7**: Product Hunt (Scheduled launch with collected testimonials)
- [ ] Short-form video marketing (TikTok, YouTube Shorts, IG Reels)
- [ ] Blog post: "How I built a competitive Tetris clone in the browser" (Draft assigned and completed before v0.9.5 gate)

---

## v1.1 — Monetization & Expansion

**Goal:** Once the core loop is stable, introduce monetization and deeper engagement features.

### v1.1.0 — Lemon Squeezy (Paid Shields)
- Lemon Squeezy integration
- Product: Shield Pack — pricing TBD (e.g. 5 shields / $2.99)
- Webhook: `order_created` → verify signature → `user:{uid}:shields += N`
- No card data touches our servers

### v1.1.1 — Avatar + Push Nudge
- Avatar state machine (Duolingo-style): idle / happy / sad / dead states
- Push notification fires when streak is at risk (uses existing VAPID infrastructure)

---

## Security Principles (v1.0+)

- **Anti-Cheat Validation**: Clients cannot dictate scores. Server issues a signed HMAC session token. Score API validates minimum elapsed time and plausibility.
- **Client State Encapsulation**: Game logic and state (e.g. score) must be enclosed in module closures, never exposed globally (`window.score`) to deter DevTools tampering.
- **XSS Prevention & CSP**: Strict input sanitization on all user-generated content (like `displayName`). Enforce Content-Security-Policy and X-Frame-Options in `vercel.json`.
- **Rate Limiting**: All edge functions (auth, score submission) are protected by Redis-backed IP/UID rate limiting to prevent DDoS and billing abuse.
- **Least privilege & Data Masking**: Only UID stored in Redis. Email stays in Firebase. Leaderboard API payloads must strip UIDs and only expose public names.
- **Token verification**: Every auth-required endpoint calls `verifyIdToken` server-side. Firebase Auth domains strictly restricted to `glowtris.com` and `prevglow.vercel.app`.
- **Payment isolation & Idempotency**: Lemon Squeezy handles card data. Webhooks verified with HMAC signature and use Redis `SETNX` on `event_id` to prevent double-crediting.
- **No PII in logs**: Vercel logs must not contain emails, tokens, or card details.
- **Strict CORS**: No wildcard `Access-Control-Allow-Origin: *` endpoints (including maintenance routes). Restricted to official domains.

---

## Milestone Summary

```
v0.7  ✅  Social + Mobile (shipped 2026-06-23)
v0.8  🔲  Social Signals
  └─ v0.8.0  Percentile + score gap
  └─ v0.8.1  Challenge share + LB polish
v0.9  🔲  Feel Polish
  └─ v0.9.0  Danger vignette + HUD anim
  └─ v0.9.1  Result screen + mode select redesign
  └─ v0.9.5  Pre-launch checklist ← GATE
v1.0  🔲  Official Launch
  └─ v1.0.0  Firebase Auth
  └─ v1.0.1  Streak system
  └─ v1.0.2  Shield (free weekly)
  └─ 🚀 LAUNCH
v1.1  🔲  Monetization & Expansion
  └─ v1.1.0  Lemon Squeezy (paid shields)
  └─ v1.1.1  Avatar + push nudge
```
