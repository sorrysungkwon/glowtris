# Fusion Synthesis: Glowtris ROADMAP.md (v0.8 → v1.0)

## 1. Consensus & Core Issues
All panelists (Draft, Gemini Flash, Gemini Pro, Claude Sonnet) agree on the following critical flaws in the current ROADMAP.md:
- **Monetization Risk (v1.0.3):** Launching Lemon Squeezy (paid shields) concurrently with the v1.0 marketing push is highly risky. Technical failures with webhooks on day one or community backlash (Reddit/HN hate Day-1 microtransactions) could ruin the launch. **Resolution:** Move Lemon Squeezy to v1.1.
- **Scope Creep / Pacing:** v1.0 is overloaded (Auth, Streaks, Shields, Avatar, Payments). **Resolution:** Move the Avatar state machine (v1.0.4) to v1.1/v1.2. Pro suggests treating v0.9 as a "Soft Launch" for Auth/Streaks to battle-test the backend before the v1.0 marketing spike.
- **Missing SEO & Analytics:** SEO (Schema.org, OpenGraph, Canonical) and Telemetry (tracking streak_starts, drop-offs) are completely absent from the v0.9.5 pre-launch gate.
- **Missing PWA Polish:** PWA install prompts and offline caching are critical for the "Mobile first" habit loop but aren't audited in the pre-launch checklist.

## 2. Unique Insights & Deep Dives
- **Technical Bugs Found (Gemini Flash):** `sw.js` currently only caches `/index.html`, ignoring sub-pages (`sprint.html`, `unblocked.html`). It also unnecessarily fetches Google Fonts when Orbitron is already base64-inlined. There is also a direct conflict between `ROADMAP.md` (Paid shields) and `MONETIZATION.md` ("No ads. Ask for coffee money").
- **Launch Sequencing (Claude Sonnet & Draft):** The roadmap lists all launch channels (Reddit, HN, PH) simultaneously. These must be staggered (e.g., Reddit Day 1, HN Day 2, PH Day 7). The Draft highlighted that short-form video (TikTok, YouTube Shorts, IG Reels) is missing from the marketing strategy.
- **Auth Resilience (Claude Sonnet):** Ensure there is a documented fallback (degraded experience) if Firebase goes down during the launch traffic spike.
- **Cross-Platform Sync (Draft):** Firebase Auth must explicitly state that it syncs scores, stats, and keybind settings to fulfill the "Start on mobile, get serious on PC" promise.

## 3. Final Recommendations for ROADMAP.md
1. **Restructure Milestones:** 
   - Move Auth & Streaks to v0.9 (Soft Launch) or tightly scope v1.0 to just Auth + Free Shields.
   - Move Lemon Squeezy (v1.0.3) and Avatar (v1.0.4) to v1.1.
2. **Expand v0.9.5 Gate:** Add SEO Audit, PWA/Offline UX Audit (fixing the `sw.js` bugs), and an Analytics plan.
3. **Refine v1.0 Launch Plan:** Sequence the launch channels, add short-form video, and assign an owner/deadline to the blog post.
4. **Update Security/Tech Principles:** Add cross-platform sync and Auth fallback resilience.
