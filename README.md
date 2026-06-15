# Glowtris

A next-generation web puzzle platform featuring a 1000Hz independent tick engine and an asynchronous retention system. Built with ES modules and canvas.

**Live:** https://glowtris.com

| | |
|---|---|
| Production | https://glowtris.com |
| Staging | https://prevglow.vercel.app |

## Stack

- HTML, CSS, JavaScript (ES modules in `src/`, bundled via build script)
- Vercel serverless function (`api/leaderboard.js`)
- Upstash Redis (online leaderboard)
- No external frontend libraries

## Core Architecture & Features

- **10x40 Vanish Zone Architecture**: Internal 10x40 logic array with a 10x20 visual viewport, ensuring flawless Wall Kicks and preventing immediate lock-out bugs.
- **1000Hz Engine & 0ms ARR**: Independent 1000Hz fixed-tick physics engine bypassing 60Hz browser limits, featuring Discontinuous State Transition for zero-latency 0ms ARR.
- **Parity Preservation & 0-Finesse**: Precise 3-Corner Rule collision algorithms for T-Spins and Lossless Input Buffering for mathematical keystroke minimums.
- **Asynchronous Competition**: Serverless architecture (Vercel + Upstash Redis) with no real-time PvP, eliminating server maintenance costs while retaining competitive tension.
- **Target Overtake UI**: Replaces visual noise-inducing 'Ghost Pieces' with a 'Next Target Ranker' score and dynamic swipe animations for intense micro-motivation.
- **Duolingo-style Gamification**: Streak loops and a dynamic avatar system (Factory Pattern) to transition single-session arcade play into a daily habit.
- **Gestalt Psychology UX**: Clickable buttons secure 48dp+ touch targets with neon pop and drop shadows; non-clickable info areas use dimmed treatments. Features IDEAL framework micro-interactions (red vignetting, Z-axis scale suppression).
- **IP Mitigation & Branding**: Complete exclusion of trademarked terms. Uses a proprietary deep navy and neon color palette to prevent trade dress disputes.
- **Cross-Platform Adaptability**: Responsive layouts tailored for Mobile (Portrait) and PC (Landscape). PWA support with service worker offline caching and push notifications.
- **Rich Media & Audio**: Multi-track chiptune BGM via Web Audio API, dynamic color-shifting nebulae, low-latency SFX, and dynamic Edge OG images (`/api/og`).

## Version Revision (2026-06-14)

> Previously-shipped v1.0.x ~ v1.1.1 are **retroactively classified as pre-1.0 beta**. The engine did not yet meet competitive-standard quality at those releases. The version pipeline now restarts at **v0.2**, and **v1.0 is the engine-complete real release**. Git tags from the beta era remain in history for reference; the displayed version will be bumped back to v0.2.0 with the next engine release.
>
> See [`BUGS.md`](./BUGS.md) for the engine architecture gap analysis (ARCH-001~005) and feature gaps (FEAT-001~012) that gate the real 1.0 release.
>
> **Roadmap Optimization Note**: To guarantee a bulletproof core engine before public exposure, the 6 critical engine and UX tasks have been distributed across milestones **v0.6 to v1.0**. The Reacting Avatar (Duolingo-style) is planned as the final gate in **v1.0** due to its state machine complexity.
>
> **PixiJS WebGL2 Renderer Deprecated**: The experimental PixiJS WebGL2 integration staged for **v0.5** has been officially **abandoned** to resolve critical blank screen rendering regressions on iOS/Safari. Glowtris will proceed with and optimize its highly performant, custom-blitted **2D Canvas engine** instead.

## Growth Milestones

### Phase A — Engine Foundation (pre-1.0, no public launch)

| Milestone | Target Version | Focus |
|---|---|---|
| 🧱 Loop & Input Core | v0.2 ✅ | Decoupled fixed-timestep loop, ordered sub-frame input |
| 🎮 Movement Standard | v0.3 ✅ | 180°, custom keybinds, SDF/∞, lock-cap, IRS/IHS/DCD, instant ARR=0 |
| 🏆 Scoring Standard | v0.4 ✅ | B2B 1.5×, 3-piece queue, all-spin (SRS+), BUG-012/013 |
| 🖼 Renderer & Audio | v0.5 ✅ | Web Audio API low-latency audio, PixiJS WebGL2 renderer (Abandoned — kept lightweight 2D Canvas due to iOS regressions) |
| ⏱ Modes & Metrics | v0.6 ✅ | Vanish Zone (10×22 logic board), 3-Corner G-Spin Rule, Input Buffer (IMS), APM/PPS display, Drop Pillar |
| 👥 Social Ranking | v0.7 | Anonymous UUID, percentile calculations, score gap, challenge links, weekly tournaments |
| 🎨 Gameplay Feel | v0.8 | Target Overtake UI (no ghost pieces, next target ranker score display, swipe animation), haptic feedback, screen shake |
| ✨ Micro-interactions | v0.9 | Red danger vignette, active scale (0.95 scale) + spring-scale HUD animations |

### Phase B — Go-to-Market & Growth (Gated by Phase A)

> **Core Strategy:** Zero infrastructure cost through asynchronous competition. Growth driven by organic community launches (Reddit/Hacker News), targeted SEO, and virality hooks (Share Cards).

| Phase | DAU Goal | Key Actions & Go-to-Market Strategy |
|---|---|---|
| **Phase 1: Initial Viral Hook** | 0 → 500 | Launch on `r/webgames` and `r/Tetris`. Cross-post development story on `r/gamedev`. Focus on "100% Ad-Free, Neon Web App" positioning. Establish SEO foundations (JSON-LD, Search Console). |
| **Phase 2: Retention Loop** | 500 → 1,500 | Release Blitz Mode & Streak Counter. Launch on Hacker News & Product Hunt. Scale backlinks via Web Game Directories (CrazyGames, Kongregate). Upgrade Vercel infrastructure. |
| **Phase 3: Core Community** | 1,500 → 4,500 | Introduce Skins/Palettes & Weekly Event Challenges. Outreach to niche puzzle streamers. Target page-1 SEO for `neon tetris` and `daily tetris challenge`. |
| **Phase 4: Platform Pivot** | 4,500 → 15k+ | Weekly Tournaments, CRM Automation (email/push nudges), and a Viral Engine (Ghost Replays, Referral loops). Pivot to a community API and embeddable widgets. |

### SEO & Organic Acquisition
- **Phase 1**: Technical SEO (Meta, hreflang, JSON-LD) and niche blog content targeting low-competition keywords.
- **Phase 2**: Backlink building via free HTML5 game directories (itch.io, Newgrounds, etc).
- **Phase 3**: Ranking for specific niches (`neon tetris`, `daily tetris challenge`).
- **Phase 4**: Long-term domain authority building to target high-traffic generic keywords.

### Infrastructure Upgrade Triggers
| DAU | Upgrade |
|---:|---|
| > 700 | Upstash Free → Pay-as-you-go (~+$1/mo) ¹ |
| > 600 | Vercel Hobby → Pro (+$20/mo) |
| > 50,000 | Upstash Pro plan review |

¹ 60s edge cache is live — Upstash free ceiling extended from ~416 to ~700 DAU.

---

## Roadmap

### ✅ Completed

| Version | Features |
|---|---|
| ~~v0.7~~ ✅ | Audio mute toggle, T-spin detection & bonus, DAS/ARR tuning |
| ~~v0.8~~ ✅ | Multi-track BGM (speeds up with level), combo flash, Glowtris full-screen effect |
| ~~v0.8.1~~ ✅ | Desktop UI redesign, tablet touch controls fix |
| ~~v0.9~~ ✅ | Online leaderboard (Upstash Redis), result share (Web Share API) |
| ~~v0.9.1~~ ✅ | Code optimisation, refactor, bug fixes, desktop leaderboard overlay fix |
| ~~v0.9.2~~ ✅ | iOS speaker fix, audio resume, danger warning overlay, SFX node cleanup |
| ~~v1.0~~ ✅ | All-clear bonus, NEW BEST effect, daily leaderboard, PWA, OG image — **LAUNCHED** |
| ~~v1.0.1~~ ✅ | Rename to Glowtris, variable clean up, and **Premium Visual Upgrade** (Color-shifting nebulae, Glassmorphism 3D panels, landing shockwaves, keyboard press feedback, and level-up sweep). |
| ~~v1.0.2~~ ✅ | **Elegant Polish**: Removed hard-drop shockwaves to keep drops snappy, added sleek vertical alignment lasers, added drop spark trails, and polished pause menu buttons. |
| ~~v1.0.3~~ ✅ | **Retention & UX Polish**: Username persistence, personal best streak & max combo badges, How To Play collapsible panel. |
| ~~v1.0.4~~ ✅ | **Profile, UI, & Social Depth**: Full stats screen, personal record badges, UI enhancements (neon grid, floating text, optimized particles), Weekly leaderboard tab, persistent rank display, and canvas share image. |
| ~~v1.0.5~~ ✅ | **OG Image Redesign**: Logo lockup layout (3×3 block grid mark + GLOW/TRIS neon title), nebula background, neon corner brackets, gradient separator lines. |
| ~~v1.0.6~~ ✅ | **Settings, Accessibility & Polish**: Ghost piece on/off toggle, lock-delay tuning in pause menu. Privacy Policy + Terms of Service pages (Donation-supported & 100% Ad-Free). Automatic performance mode — monitors FPS and disables glow/particles/nebulae below 30 FPS. |
| ~~v1.0.7~~ ✅ | **Keyboard Parallax & iPad Fit**: Left/right key input nudges the entire UI 2px in the opposite direction with a snappy spring-back (0.18s cubic-bezier). Screen shake locked to X-axis only. `overscroll-behavior:none` prevents page scroll on iPad. Game board shrunk by 8px margin so content never clips on iPad. |
| ~~v1.0.6 post~~ ✅ | **Code Quality & Mobile Fixes**: Refactor/clean-code pass (CSS consolidation, function extraction, variable shadow fix, removed WHAT comments, −114 lines). Touch control button order swapped: HOLD / DROP / ROTATE. Fixed mobile controls clipping on iOS PWA — `env(safe-area-inset-*)` returns 0 during synchronous script execution; added `requestAnimationFrame` re-layout so safe-area values are read after the first paint. Fixed oversized bottom margin on iPhone WebView — corrected `frameH` formula to `max(0,8−safeTop) + max(0,8−safeBottom) + 16` so safe-area padding is not double-counted (saves up to 24px on iPhone). Removed non-functional "TAP TO RESUME" label from pause overlay (no tap handler existed). Mobile start screen now uses full-screen dark/blur overlay (`position:fixed`) matching desktop/iPad, with panel centred in the full viewport. **Robust touch layout via ResizeObserver** — `#game-row` now uses `flex:1 1 0` to fill remaining space; `ResizeObserver` reads its actual rendered height and sets CELL, replacing all hardcoded `headerH`/`ctrlH`/`frameH` arithmetic so future CSS changes never break the bottom margin. |
| ~~v1.0.8~~ ✅ | **Accessibility & Visual Polish**: Colorblind mode — 7 unique white symbol overlays per tetromino (I=══ O=○ T=△ S=/ Z=\ J=║ L=✕), rendered on board, active piece, and next/hold previews. Animation intensity cycle (Full / Low / Off) disables particles, screen shake, flash, combo overlay, and rainbow border for motion-sensitive players. Both settings persist to localStorage. |
| ~~v1.0.8.1~~ ✅ | **Performance & Visual Overhaul**: Cell sprite cache — pre-renders each piece color once into an offscreen canvas and blits via `drawImage` (GPU path), eliminating ~400 `createLinearGradient` calls/frame. Baked glow — `shadowBlur` rendered into sprite pixels so all placed blocks glow at zero per-frame cost. Glow threshold `glow > 1.2` removes per-cell shadowBlur from board cells (200 ops/frame saved). Nebula bounding-box clip reduces fill area ~50%. CSS border/boxShadow cached — only updates on piece color change. Perf mode tuned: requires 2 consecutive bad seconds + 3s startup holdoff; sprites pre-warmed at game start. Refined neon color palette (J: `#0055ff`→`#2979ff` brightest win). Ghost piece quieted, glow rebalanced. **Bug fix**: `#overlay` moved to `<body>` level with `display:none` default — fixes blank start screen on Chrome Mac. |
| ~~v1.0.8.2~~ ✅ | **Perf Mode: Full UI Effect Kill + Bug Fixes**: Low-perf mode now strips every non-gameplay effect — static `#000010` background (no stars/nebulae), all CSS animations off (title, scale-pop, pulse badges), `#screen-flash` hidden, `comboFlash`/`rainbowBorder`/`dangerPulse`/`levelUpScanline` all bypassed, screen shake skipped, `triggerLevelUpVisuals` no-ops. Button effects disabled: `action-btn` hover glow/scale/shimmer-sweep off, `.tbtn` backdrop-filter and press glow off, pause-menu toggle-btn glow off. **Bug fix**: `nc`/`hc` undefined in desktop `initLayout()` — split-canvas refactor left two bare references; renamed to `ncD`/`ncM`/`hcD`/`hcM`. |
| ~~v1.0.9~~ ✅ | **Daily Challenge + Achievement System**: Date-seeded daily challenge — all players share the same piece sequence; one attempt per day (localStorage gate); dedicated Redis leaderboard (score-based, TODAY only); 🏅 challenge badge + special share card on game over. Achievement system — 20 milestones (first Glowtris, T-spin Triple, All-clear, Combo 10+, reach Level 15, 1000-line lifetime, etc.); unlock toast + particle burst on earn; badge gallery in STATS overlay; persisted to localStorage. |
| ~~v1.0.9.1~~ ✅ | **iOS PWA Canvas Sizing Fix**: Resolved cold-start canvas oversizing caused by late-resolving CSS `env()` variables on iOS PWA. Option A (pure arithmetic) merged — safe area values are now estimated per-device in JS using `navigator.standalone` + `screen.height`: Dynamic Island (ph≥852→59px), large notch (ph≥844→47px), small notch (ph≥780→44px), no notch (<780→20px), Face ID iPad (ph≥1100→24px). Android PWA / desktop rely on CSS env() which works correctly on those platforms. |
| ~~v1.0.9.2~~ ✅ | **BGM Upgrade + Challenge Background + Flash Fix**: Full BGM system with 3 synthwave tracks, dynamic intensity layers, volume fade in/out; Challenge mode gets distinct crimson/dark-red starfield background; hold `<canvas>` flash on game-over fixed. |
| ~~v1.0.9.3~~ ✅ | **T-Spin Mini + Leaderboard Dedup + OG Image**: T-Spin Mini detection (1 front corner = mini, score 0/200/400×level; 2 front corners = full T-Spin); leaderboard deduplication — same username keeps only personal best across all 5 boards; `/api/og` Edge Function generates 1200×630 PNG for Twitter/KakaoTalk/Discord/Line previews; soft-drop DAS fix (holding ↓ properly accelerates, lock timer not reset while grounded). |
| ~~v1.0.9.4~~ ✅ | **Hotfix — Hold/Next Panel Overflow + PC Perf**: Fixed hold/next canvas overflowing panel container on desktop (box-sizing:border-box → panel widened 132→150px, canvas dims passed correctly to drawMiniPiece). PC background gradient caching (every 4 frames), auto low-perf mode for Intel iGPU (WEBGL_debug_renderer_info), static gradient background in low-perf mode. |
| ~~v1.1~~ ✅ | **Sprint Mode + iPad Keyboard**: Sprint 40L engine — clear 40 lines, stopwatch HUD, remaining-lines counter, mode selector card UI (Marathon / Sprint 40L / Daily Challenge), 3-2-1 animated countdown (per-number colours, scale animation, expanding rings, GO! flash). Sprint leaderboard ascending (lowest time = best), personal best tracking, shareable Sprint result card (time + LPM + rank). iPad external-keyboard mode — first keydown on coarse-pointer tablet shows desktop side panels (SCORE / LINES / LEVEL / NEXT / HOLD / KEYS), touch restores instantly; phones always keep touch UI. Keyboard nudge spring-back redesigned with `void offsetWidth` forced reflow + `cubic-bezier(0.15,2.8,0.5,0.82)` overshoot. API: `KEY_SPRINT` / `KEY_SPRINT_DAILY` / `KEY_SPRINT_WEEKLY` Redis keys, ascending `getSprintBoard()`, `deduplicateAndAddSprint()`. |
| ~~v1.1.1~~ ✅ | **UX/UI Polish & Keyboard Nav**: Gestalt visual grouping of overlays. Full keyboard navigation for all dialogs (WASD, Arrows, Tab, Enter). Intelligent Escape/Backspace bindings. Auto-focus management for modals to prevent trapping. Fixed touch controls bypassing game countdown. Duplicate modal prevention. Upgraded hover sound logic and UI interaction effects. |

### Phase A Status (Engine Foundation, pre-1.0 beta)

| Version | Theme | Status |
|---|---|---|
| v0.2 | **Loop & Input Core** — Decoupled fixed-timestep logic loop, ordered sub-frame input handling | ✅ Done |
| v0.3 | **Movement Standard** — 180° rotation, custom keybinds, SDF/∞, lock-cap (15 moves), IRS/IHS/DCD, instant ARR=0 | ✅ Done |
| v0.4 | **Scoring Standard** — B2B 1.5×, 5-piece next queue, all-spin detection (SRS+) | ✅ Done |
| v0.5 | **Renderer & Audio** — Web Audio API low-latency audio, render interpolation (PixiJS WebGL2 renderer Abandoned due to iOS regressions, keeping lightweight 2D Canvas engine) | ✅ Done |
| v0.6 | **Modes & Metrics** — Vanish Zone (10×22 logic board), 3-Corner G-Spin Rule, Input Buffer (IMS), APM/PPS display, Drop Pillar gradient | ✅ Done |
| v0.7 | **Social** — Anonymous UUID, percentile calculations, score gap, challenge links, weekly tournaments | 🔲 Planned |
| v0.8 | **Gameplay Feel** — Target Overtake UI (no ghost pieces, next target ranker score display, swipe animation), haptic feedback, screen shake | 🔲 Planned |
| v0.9 | **Micro-interactions** — Red danger vignette, active scale (0.95 scale) + spring-scale HUD animations | 🔲 Planned |

### 🔮 Planned — Phase B (Public Launch & Growth, post-1.0)

| Version | Theme | Features | DAU Goal |
|---|---|---|---:|
| **v1.0** | **Launch & Avatar** | Reacting Duolingo-style Avatar state machine. Official public launch. | **700** |
| v1.2 | **Blitz Mode** | Play 2-minute mode, score big near end, play days counter. | 1,200 |
| v1.3 | **Training & Finesse** | Practice mode (no game over, no timer). Finesse counter — tracks wasted keypresses vs optimal. Speed metrics. | 1,800 |
| v1.4 | **Visual Customization** | Board skin selector (Neon / Midnight / Pastel / Classic). Piece colour palette presets. Custom drum beats. | 2,500 |
| v1.5 | **Weekly Events** | Weekly special challenge (rotating rule modifiers: invisible pieces, 20-line board, etc.) with 7-day Redis TTL leaderboard. Monthly event leaderboard. | 3,500 |
| v1.6 | **Ghost & Replay** | Best-run ghost stored in Redis (serialised input log). Ghost race mode — race against your own personal best. Shareable replay link via short code. | 4,500 |
| v1.7 | **Advanced Stats** | Expanded STATS overlay: G-spin %, all-clear %, average combo. Session graph (score over last 10 games). Weekly personal report card. | 6,000 |
| v1.8 | **Season & Rank** | Monthly season resets leaderboard. 7-tier rank system (Bronze → Radiant) based on season score. Season-exclusive title badges and board borders unlock at each tier. | 8,000 |
| v1.9 | **Friends Layer** | Friend code system (6-char code → follow mutual). Friend-only leaderboard tab. Async challenge — share a seeded run; recipient plays same sequence, results compared on a shared card. | 10,000 |
| v2.0 | **Platform Pivot** | Embeddable widget, community API, rival system, percentile badge, brand/creator hooks. No real-time multiplayer — async social competition provides equivalent engagement at zero WebSocket cost. | **15,000+** |

## Infrastructure

| Item | Value |
|---|---|
| Hosting | Vercel (Hobby) |
| Leaderboard DB | Upstash Redis (REST API) |
| OG Image | `/api/og` Edge Function (`@vercel/og`) |
| CI | GitHub Actions |

### Environment Variables

| Variable | Env | Description |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Production, Preview | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview | Upstash Redis auth token |
| `LEADERBOARD_PREFIX` | Preview only | Redis key namespace prefix (e.g. `preview:`) — isolates preview data from production |

Set in Vercel Dashboard → Settings → Environment Variables.

## Contributing

- ES modules architecture — source code lives in `src/`. Run `npm run build` to generate `index.html`
- No external frontend libraries
- API routes in `api/` (Vercel serverless functions)
