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
| **v0.9.5** | **Pre-launch checklist** — Privacy Policy update (Firebase + Lemon Squeezy), security audit of all API endpoints, marketing copy written, Reddit/HN post drafts finalized | Non-code work, critical gate |

**Gate to v1.0:** v0.9.5 checklist 100% complete.

---

## v1.0 — Official Launch

**Goal:** Retention loop complete. Auth + streak + shield live. Ship to world.

### v1.0.0 — Firebase Auth

- Firebase Auth setup (Google OAuth + email/password)
- Server-side ID token verification on all protected endpoints
- Login UI inside game (modal, non-blocking)
- Non-logged-in play allowed — "Save your streak" nudge after game end
- On first login: link existing localStorage name to Firebase UID
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

### v1.0.3 — Lemon Squeezy (Paid Shields)

- Lemon Squeezy integration (no business registration required)
- Product: Shield Pack — pricing TBD (e.g. 5 shields / $2.99)
- Webhook: `order_created` → verify signature → `user:{uid}:shields += N`
- No card data touches our servers (Lemon Squeezy is Merchant of Record)
- Privacy Policy updated with payment processor details

### v1.0.4 — Avatar + Push Nudge

- Avatar state machine (Duolingo-style): idle / happy / sad / dead states
- State driven by: streak length, recent play, shield count
- Push notification fires when: user hasn't played and streak is at risk (uses existing VAPID infrastructure)
- Avatar shown on: home screen, result screen, leaderboard entry

### 🚀 v1.0 Launch

- [ ] Reddit: `r/webgames`, `r/Tetris`, `r/gamedev` (story angle)
- [ ] Hacker News: Show HN post
- [ ] Product Hunt: scheduled launch (story/ drafts ready)
- [ ] Blog post: "How I built a competitive Tetris clone in the browser"

---

## Security Principles (v1.0+)

- **Least privilege**: Only UID stored in Redis. Email stays in Firebase.
- **Token verification**: Every auth-required endpoint calls `verifyIdToken` server-side.
- **Payment isolation**: Lemon Squeezy handles all card data. We only store shield count delta.
- **No PII in logs**: Vercel logs must not contain emails, tokens, or card details.
- **Webhook verification**: All Lemon Squeezy webhooks verified with HMAC signature.
- **CORS**: Already restricted to glowtris.com + prevglow.vercel.app.

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
  └─ v1.0.3  Lemon Squeezy (paid shields)
  └─ v1.0.4  Avatar + push nudge
  └─ 🚀 LAUNCH
```
