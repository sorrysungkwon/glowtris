# Glowtris — Bug Tracker

> Report bugs here. Each entry: symptom, reproduction steps, root cause, fix.
> Status: 🔲 Open · 🔧 In Progress · ✅ Fixed

---

## 🔲 Open

### [BUG-004] Piece transparency after ~5 games (Chrome/Windows)
- **Reported:** 2026-05-31 | **Priority:** 🔴 Critical
- **Symptom:** Pieces gradually become transparent/invisible after playing ~5 games without refresh
- **Reproduce:** Chrome/Windows — play 5+ consecutive games
- **Root cause (suspected):** Canvas 2D state (globalAlpha, shadowBlur, lineDash) leaking across game resets in Chrome's GPU-accelerated canvas path. `gctx.clearRect()` clears pixels but not context state.
- **Fix:** Add explicit `gctx.globalAlpha=1; gctx.shadowBlur=0; gctx.setLineDash([])` reset at top of `drawBoard()` each frame.
- **Status:** Under investigation

---

## ✅ Fixed

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

## 🔲 Open

_No open bugs._

---

## 🏛️ Engine Architecture (Competitive standard responsiveness)

> **Goal:** Match modern competitive-standard quality. Implementation paths are flexible — what matters is the measurable outcome.
> Reference: "Architectural Framework for Ultra-Responsive Tetris Engines Exceeding Benchmark Standards" (2026-06) describes one valid implementation; equivalent alternatives are acceptable.

### [ARCH-001] Decoupled fixed-timestep logic loop
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** Game loop is single-RAF; gravity, DAS, lock delay all evaluated once per render frame → 60Hz-bound jitter (16.7ms granularity).
- **Acceptance criteria:** Input-to-state latency ≤ 4 ms p99, independent of monitor refresh rate. Logic timers (gravity, DAS, ARR, lock delay) advance on a fixed tick decoupled from RAF.
- **Reference implementation:** Accumulator pattern at 1000 Hz (1 ms tick) per paper §3.1. A larger tick (e.g. 4 ms / 250 Hz) is acceptable if the criteria above hold.
- **Status:** 🔲 Open

### [ARCH-002] Ordered sub-frame input handling
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** Inputs are processed at the moment of the keydown event; two inputs within one frame are not ordered by their actual sub-frame timing.
- **Acceptance criteria:** Two inputs arriving inside the same render frame are simulated in true chronological order, not in event-listener arrival order. No input is silently dropped or coalesced.
- **Reference implementation:** Input queue carrying `performance.now()` timestamps, drained per tick in ARCH-001 loop.
- **Status:** 🔲 Open (depends on ARCH-001)

### [ARCH-003] Instant ARR=0 transition
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** ARR is implemented with `setInterval` repeating `moveX(d)`; even ARR=0 requires CPU-bound iteration.
- **Acceptance criteria:** With ARR=0, holding a direction snaps the piece to the wall within one tick of ARCH-001.
- **Reference implementation:** Raycast to wall via `ΔX_max_to_wall` (paper §4.1). Equivalent loop-in-one-tick implementations are acceptable.
- **Status:** 🔲 Open

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
- **Status:** 🔲 Open

### [FEAT-002] Custom key bindings
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Key layout is hardcoded — no way to remap controls
- **Status:** 🔲 Open

### [FEAT-003] SDF (Soft Drop Factor) adjustment
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Soft drop speed is hardcoded; no separate SDF slider (distinct from ARR). Standard: configurable from 1× to instant.
- **Status:** 🔲 Open

### [FEAT-004] Back-to-Back (B2B) bonus
- **Reported:** 2026-06-01 | **Priority:** 🔴 Critical
- **Symptom:** No score multiplier for consecutive difficult clears (T-spin → T-spin, Tetris → Tetris, etc.)
- **Note:** Tetris guideline requires 1.5× bonus on back-to-back difficult clears. Currently `lockPiece()` scores each clear independently with no `S.b2b` state.
- **Status:** 🔲 Open

### [FEAT-005] Next queue: show 5 previews
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Only 1 next piece shown. Standard is 5–6 pieces from the upcoming bag.
- **Note:** `S.next` holds a single piece. Requires expanding to an array and rendering multiple mini-canvases or a single stacked preview.
- **Status:** 🔲 Open

### [FEAT-006] Lock delay reset cap (15-move limit)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** `cancelLock()` resets the lock timer unconditionally on every move/rotation. Players can stall a piece indefinitely.
- **Note:** Tetris guideline caps lock delay resets at 15 per piece. Requires a `lockResetCount` counter reset on `spawnPiece()`.
- **Status:** 🔲 Open

### [FEAT-007] IRS (Initial Rotation System)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Holding a rotation key while a piece is locking does not pre-rotate the next piece on spawn.
- **Note:** `spawnPiece()` ignores held key state. IRS is expected by competitive players for high-speed play continuity.
- **Status:** 🔲 Open

### [FEAT-008] IHS (Initial Hold System)
- **Reported:** 2026-06-01 | **Priority:** 🟡 Medium
- **Symptom:** Holding the hold key (C) while a piece is locking does not immediately hold the next piece on spawn.
- **Note:** Same as IRS — `spawnPiece()` ignores held key state.
- **Status:** 🔲 Open

### [FEAT-009] In-game APM / PPS stats
- **Reported:** 2026-06-01 | **Priority:** 🔵 Low
- **Symptom:** No real-time Actions Per Minute or Pieces Per Second display during play.
- **Note:** Standard metric in competitive clients. Important for self-improvement feedback.
- **Status:** 🔲 Open

### [FEAT-010] All-spin detection (SRS+)
- **Reported:** 2026-06-01 | **Priority:** 🔵 Low
- **Symptom:** Only T-piece spins are detected and rewarded. S/Z/J/L/I spins with kick are not recognized.
- **Note:** SRS+ treats any piece that uses a non-zero kick as a spin. Adds score bonus for creative play.
- **Status:** 🔲 Open

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
- **Status:** 🔲 Open
