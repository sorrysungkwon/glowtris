# Glowtris — Bug Tracker

> Report bugs here. Each entry: symptom, reproduction steps, root cause, fix.
> Status: 🔲 Open · 🔧 In Progress · ✅ Fixed

---

## ✅ Fixed

### BUG-015 — Push notifications not delivered: VapidPkHashMismatch
- **Reported:** 2026-06-06
- **Environment:** All platforms (Apple APNs, FCM)
- **Symptom:** GitHub Actions notification workflow ran (`Sent: 0-1, Total: 3`) but push notifications were not received on user devices. Apple APNs returned `{"reason":"VapidPkHashMismatch"}` (HTTP 400).
- **Root cause (multi-layer):**
  1. **Vercel Serverless timeout** — original `api/notify.js` was timing out on Vercel's 10s limit when iterating many subscriptions. Migrated to GitHub Actions (`scripts/notify.js` + `.github/workflows/notify-cron.yml`).
  2. **Redis `hset` syntax error** — `api/subscribe.js` used incorrect Upstash REST API syntax (`/hset/key/field/value` path format) instead of the correct JSON array body (`["hset", key, field, value]`). Subscriptions were not being saved.
  3. **VAPID key rotation gone wrong** — a previous session changed `pwa.js` from key `BI_rkhr...` to `BBu-74...` but GitHub Actions secrets were not updated in sync, causing all existing subscriptions (registered with `BBu-74...`) to fail with `VapidPkHashMismatch`. Further confusion occurred when a new key pair (`BLSk...`) was generated mid-debug without updating all 30k existing subscriptions.
  4. **Invalid test data in Redis** — a `test3` entry with `p256dh: "test3"` persisted in the Redis hash, causing a `p256dh value should be 65 bytes long` error on every run.
  5. **Corrupted workflow YAML** — `notify-cron.yml` had duplicate `workflow_dispatch:` keys and a misplaced `runs-on:` line due to a bad merge, preventing manual dispatch.
- **Fix:**
  - Restored `pwa.js` `VAPID_PUBLIC_KEY` to the original value (`BBu-74...`) matching all existing user subscriptions.
  - Updated GitHub Actions secrets `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to the matching pair from Vercel env vars.
  - Fixed `notify-cron.yml` YAML syntax (removed duplicate `workflow_dispatch:`, fixed indentation).
  - Confirmed `api/subscribe.js` Upstash REST syntax is correct.
- **Result:** `Sent: 2, Total: 3, Deleted: 0` — 2 real subscriptions delivered successfully. Remaining failure: `test3` (invalid test data in Redis) and 1 device re-subscribed with a wrong key during debug (user's own phone — fixed by reinstalling PWA).
- **Key lesson:** VAPID public key in `pwa.js` and GitHub Actions secret `VAPID_PUBLIC_KEY` must ALWAYS match. When rotating VAPID keys, ALL existing push subscriptions become invalid — users must re-subscribe. Do NOT rotate VAPID keys casually.
- **PRs:** #45, #46, #47, #48, #49, #51, #52, #53, #54

---

## ✅ Fixed

### BUG-014 — Samsung Browser / in-app browser: buttons unresponsive or double-firing
- **Environment**: Samsung Internet, Instagram in-app browser, Naver in-app browser (Android)
- **Symptom**: Buttons require multiple taps to register; occasionally fire twice on a single tap
- **Root cause**: In-app browsers and Samsung Internet retain a 300ms tap delay for double-tap-zoom detection. Without `touch-action: manipulation`, each tap triggers `touchend` + a synthetic `click` 300ms later, causing double-fire or perceived lag.
- **Fix**: Added `touch-action: manipulation` to `.action-btn`, `.toggle-btn`, `.lb-tab`, `.mode-card` — eliminates the 300ms delay and suppresses double-tap zoom on all interactive overlay elements. Game canvas controls (`tbtn`) already had `touch-action: none`.
- **PR**: preview push (no separate PR)

---


## ✅ Fixed

### [BUG-004] Piece transparency after ~5 games (Chrome/Windows)
- **Reported:** 2026-05-31 | **Fixed:** 2026-06-03
- **Priority:** 🔴 Critical
- **Symptom:** Pieces gradually become transparent/invisible after playing ~5 games without refresh
- **Reproduce:** Chrome/Windows — play 5+ consecutive games
- **Root cause (suspected):** Canvas 2D state (globalAlpha, shadowBlur, lineDash) leaking across game resets in Chrome's GPU-accelerated canvas path. `gctx.clearRect()` clears pixels but not context state.
- **Fix:** Add explicit `gctx.globalAlpha=1; gctx.shadowBlur=0; gctx.setLineDash([])` reset at top of `drawBoard()` each frame.
- **Status:** ✅ Fixed (Added context reset in `drawBoard()`)
### [BUG-013] JLSTZ pieces spawn one column too far right
- **Reported:** 2026-06-03 | **Fixed:** 2026-06-03 | **Source:** Reddit u/DelayProfessional345 (r/vibecoding)
- **Symptom:** Every piece except I and O spawned one column to the right of the SRS guideline position.
- **Root cause:** `makePiece()` used `Math.floor(COLS/2) - Math.floor(width/2)` → gives 4 for 3-wide pieces. Correct: `Math.floor((COLS-width)/2)` → gives 3. I and O are even-width and were unaffected.
- **Fix:** `game.js` line 73 — changed spawn x formula to `Math.floor((COLS-d.shape[0].length)/2)`.

### [BUG-012] iPad: next/hold panel size inconsistent between kb mode and touch mode
- **Reported:** 2026-06-03 | **Fixed:** 2026-06-03 | **Device:** iPad with Magic Keyboard
- **Symptom:** Switching kb→touch on iPad left NEXT/HOLD panels at the wrong size.
- **Root cause:** `pointer:coarse` returns false on iPad with Magic Keyboard (trackpad is primary fine pointer), so `_applyTouchCELL()` was never called on that device. Also, `_applyTouchCELL()` did not size `ncD`/`hcD`.
- **Fix:** Switched to `any-pointer:coarse` (true when any device input is coarse, including touchscreen). Added ncD/hcD sizing in `_applyTouchCELL()` using `newCELL`. `_disableKbMode()` sets `gc.width=0` to bypass early-return before calling `initLayout()`.

### [BUG-011] 180° rotation lifts piece up to 2 cells from the floor
- **Reported:** 2026-06-02
- **Symptom:** Pressing 180° on a piece sitting on the floor lifts it up 1-2 cells. Multiple presses accumulate the lift.
- **Root cause:** The initial `KICKS_180` table tried vertical kicks (y=-1, then y=-2) before horizontal nudges, and went as far as 2 cells up. The competitive-standard pattern tries horizontal kicks first and caps vertical lift at 1 cell.
- **Fix:** Rewrote `KICKS_180` in the competitive-standard order — basic, then horizontal nudges, then ±1 vertical as last resort. Symmetric for 0↔2 (N↔S) and 1↔3 (E↔W) transitions.
- **Note:** A 1-cell net drift over a 180→180 press pair is *inherent* to SRS+ rules (the basic kick is always tried first, so 2>0 stays in place after 0>2 lifted the piece). This is standard competitive behavior.

### [BUG-010] D-pad buttons too small + no slide-between-buttons
- **Reported:** 2026-06-02
- **Symptom:** D-pad arrow buttons were 46×46 px (mobile) / 60×60 px (tablet) — too small for confident thumb taps. Also, sliding the finger from one D-pad button to another did nothing — players had to lift and re-tap to change direction.
- **Fix:**
  - Bumped D-pad button size: mobile 46→64 px, tablet 60→84 px (+ container width 340→380 px to fit)
  - Replaced per-button touch handlers on the D-pad with a single container-level slide handler (`makeDpadSlide`). The handler tracks the active touch by `identifier`, uses `elementFromPoint` on each `touchmove` to detect which D-pad cell the finger is currently over, and transitions the press/release events accordingly. Held-state goes through `KEYS[]` so the same tick-based DAS path used by the keyboard handles soft drop and L/R repeat.

### [BUG-009] Audio dead after backgrounding tab/app while paused
- **Reported:** 2026-06-02
- **Symptom:** Pause game → switch to another tab/app → come back → no sound. Toggling mute off/on doesn't recover audio either. (Persisted on iOS PWA even after the first round of fixes.)
- **Root causes:** Five compounding issues.
  1. `resumeBGM` called `audioCtx.resume()` without `await`, then immediately read `audioCtx.currentTime` while the context was still suspended → notes scheduled in the past, silent.
  2. `toggleMute` only changed `masterGain.gain.value`; never resumed a suspended context.
  3. `onPageShow` early-returned when the game was paused.
  4. **iOS 16+ uses `'interrupted'` as the backgrounded state**, not `'suspended'`. Our checks only looked for `'suspended'`, so iOS contexts sat in `'interrupted'` forever.
  5. **`'closed'` state was never recovered.** On long iOS backgrounding the browser can fully close the context — `resume()` does nothing on a closed context, so audio stays dead until page reload.
  6. **The iOS speaker-routing unlock only ran once** (silent-WAV hack, gated by `_speakerUnlocked` flag). Long backgrounding can lose the speaker routing, leaving Web Audio routed to the earpiece (inaudible without the phone held to your ear).
- **Fix:**
  - `resumeBGM` is `async` and awaits `audioCtx.resume()` (and bails if the state never reaches `'running'`).
  - `toggleMute`, `onPageShow`, and `getAudioCtx` all now handle BOTH `'suspended'` AND `'interrupted'`.
  - `getAudioCtx` and `toggleMute` detect `'closed'` and recreate the context.
  - `onPageShow` re-unlocks the speaker on every visibility return (resets `_speakerUnlocked` flag).

### [BUG-008] Wall-rotation fails for several pieces (had to use 180° to escape)
- **Reported:** 2026-06-02
- **Symptom:** Pieces against a wall in certain orientations could not rotate 90° CW/CCW — only 180° worked. First seen on I-piece, later reproduced on S-piece (and likely affects T/J/L/Z too).
- **Root causes (two layers):**
  1. **I-piece kick y-signs (initial fix).** `KICKS_I` had wiki (y-up) values copied straight in instead of being negated for canvas (y-down). Kicks intended to lift UP pushed DOWN into the obstacle, so no kick succeeded. Fixed `0>1`, `1>0`, `1>2`, `2>1`, `2>3`, `3>2`.
  2. **Non-SRS bounding boxes (real underlying bug).** `PIECES` stored JLSTZ as 2×3/3×2 and I as 1×4/4×1 — the bbox SIZE changed across rotations. The wiki SRS kick tables assume a fixed 3×3 (JLSTZ) or 4×4 (I) bbox, with the visible blocks positioned WITHIN that fixed bbox. Because our bbox shrank/grew with each rotation, the piece's "natural" position shifted by 1 cell relative to where SRS expects it. The result: against a wall, the basic (0,0) kick failed AND every kick attempt moved AWAY from the wall direction we needed.
- **Fix (both layers):**
  1. Negated I-piece kick y-signs (done in earlier commit).
  2. Padded `PIECES` to SRS-standard 3×3 for JLSTZ and 4×4 for I; rotation now operates on a stable bbox and the wiki kick tables work as designed.
  3. Updated T-spin detection to use `S.current.rot` directly (was inferring orientation from the 2-row/3-row shape, which no longer distinguishes them now that all bboxes are 3×3).

### [BUG-007] Leaderboard list starts from rank 3 / 9 instead of 1
- **Reported:** 2026-06-02
- **Symptom:** Start-screen leaderboard sometimes displays starting from rank 3 (🥉) or 9, with top entries cut off
- **Root cause:** `.lb-inner` carried inline `display:flex; align-items:center; justify-content:center;` styles from the LOADING placeholder. After data loaded, `renderLbTab` only replaced the inner HTML — the inline flex centering remained. The new `<table>` was rendered as a flex item, vertically centered, and the top rows were clipped because the table height exceeded the 180px max-height
- **Fix:** `renderLbTab` now calls `inner.removeAttribute('style')` before setting innerHTML, and resets `scrollTop=0` for tab switches

### [BUG-006] WASD keys blocked in text inputs
- **Reported:** 2026-05-31
- **Symptom:** Cannot type W, A, S, or D when entering a name in the leaderboard submission form. Focus jumps to other buttons instead.
- **Root cause:** The UI navigation logic (`handleUINavigation`) intercepted W/A/S/D key presses unconditionally, triggering `e.preventDefault()` and shifting focus, even when a text input was active.
- **Fix:** Added a guard in `handleUINavigation` to return `false` early (bypassing interception) for all keys except `Tab`, `Enter`, and `Escape` when the active element is a text input.

### [BUG-005] T-spin detection fails / T-piece can't rotate into slot
- **Reported:** 2026-05-31 | **Priority:** 🔴 Critical
- **Symptom:** T-piece cannot rotate into T-spin setups (piece doesn't kick into the slot)
- **Root cause:** Kick table was `[0,-1,1,-2,2]` with `dy=0` only — no vertical kick support. Standard T-spin setups require the piece to kick downward into the slot. Also missing CCW rotation entirely.
- **Fix:** Implemented full SRS kick tables (JLSTZ + I-piece, 8 rotation transitions each). Added CCW rotation (`rotateCCW`). Bound X for CW, Z/Ctrl for CCW. — PR #16

### [BUG-003] Keyboard screen shake on move keys
- **Reported:** 2026-05-31
- **Symptom:** Screen shakes/bounces left and right when pressing arrow keys or WASD to move pieces
- **Root cause:** `nudgeUI()` parallax effect was called on every ArrowLeft/A and ArrowRight/D keydown
- **Fix:** Removed `nudgeUI()` calls from keydown handler (`game.js`) — PR #15

---

### [BUG-002] Duplicate "BUY ME A COFFEE" button after score submission
- **Reported:** 2026-05-31
- **Symptom:** Two donation buttons appear on the game over screen after submitting a score
- **Root cause:** `_donationHTML()` rendered once statically in `screens.js` (outside `#lb-result`) and again inside `#lb-result.innerHTML` after submission in `leaderboard.js`
- **Fix:** Removed `+_donationHTML()` from the three `res.innerHTML` assignments in `leaderboard.js` — PR #14

---

### [BUG-001] Sprint timer continues running while paused
- **Reported:** 2026-05-31
- **Symptom:** In Sprint mode, the stopwatch keeps counting while the game is paused
- **Root cause:** `gameLoop` called `updateSprintTimer()` without a `!S.gamePaused` guard; `_sprintStartTime` was not offset for paused duration
- **Fix:** Added `!S.gamePaused` guard + `pauseGameTiming()` / `resumeGameTiming()` offset (`game.js`, `screens.js`)

---



## 🏛️ Engine Architecture (Competitive standard responsiveness)

> **Goal:** Match modern competitive-standard quality. Implementation paths are flexible — what matters is the measurable outcome.
> Reference: "Architectural Framework for Ultra-Responsive Tetris Engines Exceeding Benchmark Standards" (2026-06) describes one valid implementation; equivalent alternatives are acceptable.

### [ARCH-001] Decoupled fixed-timestep logic loop
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** Game loop is single-RAF; gravity, DAS, lock delay all evaluated once per render frame → 60Hz-bound jitter (16.7ms granularity).
- **Acceptance criteria:** Input-to-state latency ≤ 4 ms p99, independent of monitor refresh rate. Logic timers (gravity, DAS, ARR, lock delay) advance on a fixed tick decoupled from RAF.
- **Reference implementation:** Accumulator pattern at 1000 Hz (1 ms tick) per paper §3.1. A larger tick (e.g. 4 ms / 250 Hz) is acceptable if the criteria above hold.
- **Status:** ✅ Fixed — v0.2 (1000Hz fixed-timestep accumulator loop, RAF decoupled from logic)

### [ARCH-002] Ordered sub-frame input handling
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** Inputs are processed at the moment of the keydown event; two inputs within one frame are not ordered by their actual sub-frame timing.
- **Acceptance criteria:** Two inputs arriving inside the same render frame are simulated in true chronological order, not in event-listener arrival order. No input is silently dropped or coalesced.
- **Reference implementation:** Input queue carrying `performance.now()` timestamps, drained per tick in ARCH-001 loop.
- **Status:** ✅ Fixed — v0.2 (input queue with performance.now() timestamps, drained per tick)

### [ARCH-003] Instant ARR=0 transition
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** ARR is implemented with `setInterval` repeating `moveX(d)`; even ARR=0 requires CPU-bound iteration.
- **Acceptance criteria:** With ARR=0, holding a direction snaps the piece to the wall within one tick of ARCH-001.
- **Reference implementation:** Raycast to wall via `ΔX_max_to_wall` (paper §4.1). Equivalent loop-in-one-tick implementations are acceptable.
- **Status:** ✅ Fixed — v0.3.0 (ARR=0 snaps piece to wall in one tick)

### [ARCH-004] WebGL2 renderer migration (via PixiJS)
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** Board, current piece, ghost, particles drawn via Canvas2D `fillRect`/`stroke*` each frame. Caps effective framerate at ~60fps regardless of monitor. Suspected source of [BUG-004] state leaks on Chrome. Neon/glow effects bounded by `shadowBlur` performance ceiling.
- **Acceptance criteria:** Render at the full monitor refresh rate (144Hz+ on capable displays). Particle systems sustain 1000+ active particles with no frame drops. No Canvas2D state-leak regressions. Mobile thermal/battery improvement measurable.
- **Approach: PixiJS** — chosen over raw WebGL2 because the maintainer is not a WebGL specialist. PixiJS gives WebGL2 acceleration with a Canvas2D-grade API, debuggable without GPU-level expertise. Bundle cost ~+400KB (acceptable in our domain).
- **Reference:** the leading competitive web-tetris client migrated to raw WebGL2 ~2024 for the same reasons (high-refresh monitors, high PPS rendering load, mobile PWA, signature shader effects). PixiJS achieves equivalent results with much lower maintenance burden.
- **Why Critical (not Low):** The "fanboy-grade" target shifted our user profile assumption — competitive players bias heavily toward 144Hz+ monitors. Glowtris's identity is neon/glow effects, which are bounded by Canvas2D `shadowBlur` performance. GPU rendering is needed for both ceiling and identity.
- **Staged rollout (planned across v0.5.0~v0.5.3):**
  - v0.5.0 — PixiJS Application set up; board + current piece + ghost migrated to PIXI.Graphics / sprite cache
  - v0.5.1 — particle system migrated (PIXI.ParticleContainer, instanced)
  - v0.5.2 — background nebula via PIXI.Filter (shader gradient)
  - v0.5.3 — line-clear / T-spin / Glowtris shader effects via PIXI.Filter (bloom, RGB split, distortion)
  - Render interpolation between 1ms ticks added in v0.5.0 (decoupled from logic)
  - Each substage keeps a Canvas2D fallback for WebGL-unsupported clients
- **Complementary high-Hz ideas (under evaluation):** OffscreenCanvas + Worker (PixiJS supported), CSS transform for UI text elements, RAF priority hints.
- **Status:** 🔲 Open

### [ARCH-005] Low-latency audio dispatch
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Audio dispatch path not yet audited.
- **Acceptance criteria:** SFX trigger-to-output latency consistently under ~5 ms; no decoding cost on the hot path.
- **Reference implementation:** Pre-decoded `AudioBuffer` + `AudioBufferSourceNode` + `AudioContext.currentTime` scheduling. AudioWorklet upgrade only if measurements require it.
- **Status:** 🔲 Open (audit pending)

---

## 🔵 Feature Gaps

> Missing features that affect gameplay quality. Not regressions.

### [FEAT-001] 180° rotation
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** No way to flip a piece 180° in one action
- **Note:** Standard in modern Tetris guideline clients. Typically bound to a dedicated key.
- **Status:** ✅ Fixed — v0.3.0 (180° rotation with Tetr.io-standard kick table)

### [FEAT-002] Custom key bindings
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Key layout is hardcoded — no way to remap controls
- **Status:** ✅ Fixed — v0.3.0 (keybind settings panel)

### [FEAT-003] SDF (Soft Drop Factor) adjustment
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Soft drop speed is hardcoded; no separate SDF slider (distinct from ARR). Standard: configurable from 1× to instant.
- **Status:** ✅ Fixed — v0.3.0 (SDF slider in settings)

### [FEAT-004] Back-to-Back (B2B) bonus
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** No score multiplier for consecutive difficult clears (T-spin → T-spin, Tetris → Tetris, etc.)
- **Note:** Tetris guideline requires 1.5× bonus on back-to-back difficult clears. Currently `lockPiece()` scores each clear independently with no `S.b2b` state.
- **Status:** ✅ Fixed — v0.4 (S.b2b state, isDifficult check, 1.5× multiplier in lockPiece)

### [FEAT-005] Next queue: show 3 previews
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Only 1 next piece shown. Standard is 5–6 pieces from the upcoming bag.
- **Note:** `S.next` holds a single piece. Requires expanding to an array and rendering multiple mini-canvases or a single stacked preview.
- **Status:** ✅ Fixed — v0.4 (S.next=[] array, 3-piece queue, _drawQueue renderer)

### [FEAT-006] Lock delay reset cap (15-move limit)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** `cancelLock()` resets the lock timer unconditionally on every move/rotation. Players can stall a piece indefinitely.
- **Note:** Tetris guideline caps lock delay resets at 15 per piece. Requires a `lockResetCount` counter reset on `spawnPiece()`.
- **Status:** ✅ Fixed — v0.3.0 (15-move lock delay reset cap)

### [FEAT-007] IRS (Initial Rotation System)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Holding a rotation key while a piece is locking does not pre-rotate the next piece on spawn.
- **Note:** `spawnPiece()` ignores held key state. IRS is expected by competitive players for high-speed play continuity.
- **Status:** ✅ Fixed — v0.3.0 (IRS implemented in spawnPiece())

### [FEAT-008] IHS (Initial Hold System)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Holding the hold key (C) while a piece is locking does not immediately hold the next piece on spawn.
- **Note:** Same as IRS — `spawnPiece()` ignores held key state.
- **Status:** ✅ Fixed — v0.3.0 (IHS implemented in spawnPiece())

### [FEAT-009] In-game APM / PPS stats
- **Reported:** 2026-06-01 | **Priority:** 🔵 Low
- **Symptom:** No real-time Actions Per Minute or Pieces Per Second display during play.
- **Note:** Standard metric in competitive clients. Important for self-improvement feedback.
- **Status:** 🔲 Open

### [FEAT-010] All-spin detection (SRS+)
- **Reported:** 2026-06-01 | **Priority:** 🔵 Low
- **Symptom:** Only T-piece spins are detected and rewarded. S/Z/J/L/I spins with kick are not recognized.
- **Note:** SRS+ treats any piece that uses a non-zero kick as a spin. Adds score bonus for creative play.
- **Status:** ✅ Fixed — v0.4 (lastKickNonZero tracked in _tryRotate, checkAllSpin() wraps checkTSpin)

### [FEAT-011] Ultra / Blitz mode (2-minute timed)
- **Reported:** 2026-06-01 | **Priority:** 🔵 Low
- **Symptom:** No timed score-attack mode. Current modes: Marathon, Sprint 40L, Daily.
- **Note:** Ultra (2-minute max score) is a standard competitive format alongside Sprint.
- **Status:** 🔲 Open

### [FEAT-012] DCD (Dash Cancellation Delay)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** When the player presses rotate or hold while moving (DAS active), the DAS charge state is not explicitly preserved with a configurable decay window.
- **Required:** Add a `dcd` parameter (ms) — during DCD window, DAS charge persists through rotation/hold inputs to prevent unintended movement stalls.
- **Note:** Standard parameter in modern competitive clients. Required to feel correct at high speeds.
- **Status:** ✅ Fixed — v0.3.0 (DCD implemented in input handling)
