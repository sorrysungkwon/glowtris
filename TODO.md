## PLAN FOR TRIBE
- Part A: Make engine strong. No show public. (v0.2 to v0.9)
- Part B: Release to world. Get many tribesmen. (v1.0 to v2.0)

## V0.6 DONE (MODES & METRICS)
- [x] Count APM and PPS. Show on screen.
- [x] Build 10x40 board. Eye see only 10x20. (Vanish Zone)
- [x] Fix 3-corner crash. Keep all button press. (Input Buffer & 3-Corner G-Spin Rule)
- [x] Add Blitz mode. Fast fight.

## V0.7 DONE (SOCIAL + MOBILE)
- [x] Smash ghost piece. Show who to beat next. (Target Overtake UI — desktop + mobile)
- [x] Make controller shake hand on drop. (Haptic vibration, settings toggle)
- [x] Mobile new head bar. Score left. VS right. (Mobile header redesign)
- [x] Next block and hold block on side. (NEXT/HOLD vertical side columns)
- [x] Mobile fight anim same as PC. (Overtake shatter + slide)
- [x] Real people from server. Not fake name. (Real-user warmup targets, 10-band log-scale random)
- [x] Each mode fight own people. (Mode-specific boards: blitz/daily)
- [x] Keep 500 people not 100. (API cap expanded)
- [ ] Make screen shake on big clear. (skipped)

## NEXT V0.8 (SOCIAL SIGNALS)
### v0.8.0
- [ ] Show rank percent. (Top X% — client-side math)
- [ ] Show score gap to #1. (N pts away)
### v0.8.1
- [ ] Share daily challenge result link. (seeded URL)
- [ ] Leaderboard UI polish.

## NEXT V0.9 (FEEL POLISH)
### v0.9.0
- [ ] Screen bleed red when blocks are high. (Danger vignette)
- [ ] Score number spring bounce on update. (HUD spring anim)
### v0.9.1
- [ ] Result screen redesign. (launch quality)
- [ ] Mode select UI cleanup.
### v0.9.5 — PRE-LAUNCH GATE
- [ ] Update Privacy Policy. (Firebase + Lemon Squeezy)
- [ ] Security audit all API endpoints.
- [ ] SEO audit. (Schema/OpenGraph check)
- [ ] PWA audit. (sw.js offline cache check)
- [ ] Write Reddit/HN/Product Hunt post drafts.
- [ ] Blog post draft done.
- [ ] Marketing copy done.

## NEXT V1.0 (OFFICIAL LAUNCH)
### v1.0.0 — Auth
- [ ] Firebase Auth setup. Google + email login.
- [ ] Server verify Firebase token on protected routes.
- [ ] Login modal in game. Non-blocking.
- [ ] "Save streak" nudge after game if not logged in.
- [ ] Link localStorage name to UID on first login.
- [ ] Cross-device sync: scores, stats, keybind preferences.
### v1.0.1 — Streak
- [ ] Redis: user:{uid}:streak + last_play. 24h UTC reset.
- [ ] Header flame 🔥 N when logged in.
- [ ] Streak block on result screen.
### v1.0.2 — Shield Free
- [ ] Redis: user:{uid}:shields. Cap 5.
- [ ] Weekly cron: grant 1 free shield Sunday UTC.
- [ ] Auto-consume on streak break. Show in UI.
### 🚀 LAUNCH
- [ ] Day 1: Reddit (r/webgames + r/Tetris + r/gamedev story angle)
- [ ] Day 2: Hacker News Show HN
- [ ] Day 7: Product Hunt (scheduled, testimonials collected)
- [ ] Short-form video (TikTok / YouTube Shorts / IG Reels)
- [ ] Blog post: "How I built a competitive Tetris clone" (draft before v0.9.5 gate)

## NEXT V1.1 (MONETIZATION & EXPANSION)
### v1.1.0 — Lemon Squeezy
- [ ] Lemon Squeezy product: shield pack (pricing TBD, e.g. 5 shields / $2.99).
- [ ] Webhook: verify HMAC sig → user:{uid}:shields += N.
- [ ] Update Privacy Policy with Lemon Squeezy as payment processor.
### v1.1.1 — Avatar + Push
- [ ] Avatar state machine. (idle/happy/sad/dead by streak)
- [ ] Push nudge when streak at risk. (VAPID reuse)

## NEXT V1.2 (BLITZ)
- [x] Play 2 minute. Fast end. (Done as Blitz)
- [x] Score big near end.
- [x] Count play days.

## NEXT V1.3 (TRAIN)
- [ ] Practice. Never die.
- [ ] Count stupid finger press.
- [ ] Show how fast.

## NEXT V1.4 (PRETTY)
- [ ] Change board look.
- [ ] Change block paint.
- [ ] Choose drum beats.

## NEXT V1.5 (EVENTS)
- [ ] Crazy rule every week.
- [ ] Month score board.

## NEXT V1.6 (GHOST)
- [ ] Save best game.
- [ ] Fight own ghost.
- [ ] Show others game tape.

## NEXT V1.7 (MATH)
- [ ] More number math.
- [ ] Draw line for past 10 games.
- [ ] Paper saying week score.

## NEXT V1.8 (RANK)
- [ ] Reset rank every moon.
- [ ] 7 shiny badges.
- [ ] Give loot at end.

## NEXT V1.9 (FRIENDS)
- [ ] Secret code for friend.
- [ ] Board only for friend.
- [ ] Fight friend.

## NEXT V2.0 (BIG WORLD)
- [ ] Put game on other cave wall.
- [ ] Give API.
- [ ] Get shiny rocks from sponsors.

## THINGS ME ALREADY SMASH (DONE)
- [x] Fix bad draw. Use old draw.
- [x] Fix push message.
- [x] Help bad eyes see color.
- [x] Game was slow. Now game fast.
- [x] New fight every sun.
- [x] Fix big bad apple screen stretch.
- [x] Board for all time.
- [x] Make new drum sounds. Very loud.
- [x] Add small T-spin.
- [x] Fix memory leak. Brain no explode.
- [x] Fix broken cloud build.
- [x] Stop spam score.
- [x] Buy name glowtris.com.
- [x] Add fast sprint mode.
- [x] Chop big code into small pieces.
- [x] Make install work.
- [x] Can play with no magic web.
- [x] 180 spin fix.