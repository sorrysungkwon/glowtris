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

## 6. v0.7 — Gameplay Feel (2026-06-23)
- **Target Overtake UI:** Left panel split into 2-panel column (Score+Target top, Stats bottom). Gold border target-box with competitor name, score (Orbitron), `target-shatter` flash + `slideOutUp`/`slideInUp` animations on overtake. Desktop + mobile (header VS block).
- **Mobile Redesign:** Fixed inline `display:flex` overriding media query. New mobile header: SCORE (left) | LV·L·★ (center) | VS·RANK (right). NEXT/HOLD as vertical side columns flanking canvas. Next pieces rendered vertically (44×108 canvas).
- **Haptic Feedback:** `navigator.vibrate()` on hard drop (15ms), line clear (20ms), Tetris/T-spin ([30,50,40]ms). Toggle in Settings → `📳 HAPTIC ON/OFF`, persisted to localStorage.

## 5. UI & Social Features
- **Design:** Exclusive challenge background (dark crimson, rapid nebulae, diagonal meteors, amber pulse).
- **Social:** T-Spin Mini detection, leaderboard score deduplication (keeps personal best), Vercel Edge `/api/og` dynamic image generation. 4-track BGM overhaul (melody, harmony, bass, drums).