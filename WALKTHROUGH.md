# WALKTHROUGH.md (Compressed)

## 1. Backend (api/leaderboard.js)
- Separated Redis keys for Daily Challenge (`daily:YYYYMMDD`).
- Handled `mode=daily` routing on GET/POST requests.

## 2. Frontend (index.html)
- **Seeded RNG:** Introduced Mulberry32. Date-based PRNG ensures identical global block sequences.
- **Daily Gate:** LocalStorage check. Restricted to one play per day with a midnight countdown.
- **Achievement System:** 20 milestones. Renders gold popup upon unlock. Persisted in `glowTrisAchievements`.
- **Share Card:** Added exclusive canvas capture for Daily Challenge sharing.

## 3. Bug Fixes & Optimization
- **iOS PWA Canvas Sizing:** Applied `Option A` (static math calculation). Removed ResizeObserver and RAF. Synchronous size calculation on cold start.
- **Memory Leaks:** Resolved un-disconnected AudioNodes, BGM scheduler background cascade, and WebGL context leaks.
- **Performance:** Intel iGPU detection forces static gradient background. Fixed panel overflow by enforcing `box-sizing: border-box`.

## 4. Engine Rebuild (Phase A: v0.2 ~ v0.4)
- **1000Hz Loop:** Decoupled rendering from the physics engine.
- **Input:** Guaranteed sub-frame input queue ordering.
- **Movement:** 180-degree rotation, SDF (Soft Drop Factor), IRS (Initial Rotation System), IHS (Initial Hold System), DCD, instant ARR=0 teleport.
- **Scoring:** B2B (Back-to-Back) 1.5x multiplier, 3-piece next queue, All-spin detection added.

## 6. v0.7 — Social + Mobile (2026-06-23)
- **Target Overtake UI:** Left panel split into 2-panel column (Score+Target top, Stats bottom). Gold border target-box with competitor name, score (Orbitron), `target-shatter` flash + `slideOutUp`/`slideInUp` animations on overtake. Desktop + mobile (header VS block).
- **Mobile Redesign:** Fixed inline `display:flex` overriding media query. New mobile header: SCORE (left) | LV·L·★ (center) | VS·RANK (right). NEXT/HOLD as vertical side columns flanking canvas. Next pieces rendered vertically (44×108 canvas).
- **Haptic Feedback:** `navigator.vibrate()` on hard drop (15ms), line clear (20ms), Tetris/T-spin ([30,50,40]ms). Toggle in Settings → `📳 HAPTIC ON/OFF`, persisted to localStorage.
- **Real-User Warmup Targets:** `targetBoard` API field (ascending all users). Frontend preprocessing: dedup by name (keep highest score), filter score>50, 10 log-scale bands, random pick per band each game session. Result: ~6-10 real opponents before top-20 leaderboard. Mode-specific: Blitz uses `blitzTargetBoard`, Daily uses `dailyTargetBoard`.
- **API Cap Expanded:** Marathon + Blitz + Daily Challenge alltime all raised to 500 entries (was 100/20/100). Deeper warmup pool; fills naturally as playerbase grows.
- **True #1 Target Tracking:** Target board now merges alltime + daily boards per mode (dedup by name, keep highest score). Targets reach the real all-time #1 (not just today's top). After beating everyone: crown state — `👑 #1` title, player's own name, live score tick. `updateTargetUI()` handles crown state each frame.
- **BGM/SFX Volume Sliders:** Split `masterGain` into `bgmGain` + `sfxGain`. Settings panel shows two 0–100% sliders. Mute-all button (HUD) still controls `masterGain`. Values persisted to localStorage (`glowTrisBgmVol`, `glowTrisSfxVol`). Default BGM 80%, SFX 100%.
- **Speed Curve Extended:** 3-phase gravity: Lv 1→10 (800→170ms, step 70ms), Lv 10→20 (170→50ms, step 12ms), Lv 20→32 (50→16ms, step 3ms). Cap at 16ms (~60fps). Previously capped at 80ms at Lv 12 (~200k score); now extends to ~Lv 32 (multi-million score range).
- **iOS Safe-Area Fix:** `padding-top: max(8px, var(--safe-top))` → `max(12px, env(safe-area-inset-top, 0px))` — CSS variable intermediary caused `env()` to resolve as 0 on some Safari versions, clipping the mobile header under the status bar.
- **Score Cap Raised:** MAX_SCORE 10,000,000 → 99,999,999 across all modes.
- **External Music Preserved:** Removed `unlockSpeaker()` — the silent `<audio>` trick that routed iOS Web Audio to speaker also took over the media session on all platforms, pausing Spotify/YouTube on page load.

## 7. v1.0 Plan — Auth + Streak + Free Shield (scheduled for official launch)

**Product Positioning:** "Start on mobile, get serious on PC." Mobile = low-barrier entry + habit formation. PC = skill depth + retention. Duolingo cross-platform model.

- **v1.0.0 Firebase Auth:** Optional login (Google + Email). Non-logged-in play always allowed. "Save your streak" nudge after game end. On first login, existing localStorage name linked to Firebase UID. Cross-device sync (scores, stats, keybinds). Redis stores only UID — email never leaves Firebase.
- **v1.0.1 Streak System:** Server-side per user (`user:{uid}:streak`, `user:{uid}:last_play` in Redis). 24h UTC reset. Shown in header (🔥 N) + result screen. Server-authoritative (no client manipulation).
- **v1.0.2 Shield (Free):** `user:{uid}:shields` in Redis, cap 5. 1 free shield auto-granted every Sunday UTC via cron. Auto-consumed when streak would break.
- **Launch sequence:** Reddit Day 1 (`r/webgames`, `r/Tetris`, `r/gamedev`) → HN Show HN Day 2 → Product Hunt Day 7 (scheduled, testimonials collected). Short-form video (TikTok/YT Shorts/IG Reels). Blog post draft completed before v0.9.5 gate.

## 8. v1.1 Plan — Monetization & Expansion (post-launch)

- **v1.1.0 Lemon Squeezy:** Paid shield packs (no business registration required — Merchant of Record model). Webhook `order_created` → HMAC verification → `user:{uid}:shields += N`. Zero card data touches our servers. Pricing TBD (e.g. 5 shields / $2.99).
- **v1.1.1 Avatar + Push Nudge:** Avatar state machine (idle/happy/sad/dead by streak length). Push notification fires when streak at risk — reuses existing VAPID infrastructure.

## 5. UI & Social Features
- **Design:** Exclusive challenge background (dark crimson, rapid nebulae, diagonal meteors, amber pulse).
- **Social:** T-Spin Mini detection, leaderboard score deduplication (keeps personal best), Vercel Edge `/api/og` dynamic image generation. 4-track BGM overhaul (melody, harmony, bass, drums).