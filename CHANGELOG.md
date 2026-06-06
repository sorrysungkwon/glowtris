# Glowtris Changelog

> **⚠️ Version Revision Notice (2026-06-01):**
> Previously-shipped versions **v1.0.x ~ v1.1.1** are retroactively classified as **pre-1.0 beta (v0.1.x)** because the engine did not yet meet competitive-standard quality.
> The version pipeline has been restarted at **v0.2** for engine rebuild work. **v1.0** will be the true official release once "Phase A: Engine Foundation" is fully completed.

---

## 🏗️ Phase A: Engine Foundation (Current Rebuild Pipeline)

### v0.5 Renderer & Audio (In Progress)
- **Renderer Rollback & Canvas2D Optimization**: Executed a full rollback of the experimental PixiJS (WebGL) renderer due to a critical blank-screen regression on Safari/iPad. Restored and optimized the stable Canvas2D renderer (Bundle size reduced from 745KB back to 256KB).
- **Lock-Delay UI Improvements**: Implemented a new floating fixed-width lock-delay timer bar that hovers cleanly above the active piece.

### v0.4 Scoring Standard
- **B2B (Back-to-Back) Bonus**: Introduced a 1.5x score multiplier for consecutive difficult clears.
- **Extended Next Queue**: Expanded the next piece preview queue up to 5 pieces.
- **All-Spin Detection (SRS+)**: Upgraded the spin detection system to recognize and reward all piece spins, not just T-Spins.

### v0.3 Movement Standard
- **Advanced Movement Mechanics**: Added 180° rotation and custom keybindings.
- **Professional Tuning**: Supported infinite Soft Drop Factor (SDF ∞) and implemented a strict 15-move cap for lock-delay resets to prevent infinite stalling.
- **Input Lag Elimination**: Implemented professional-standard input handling including IRS (Initial Rotation System), IHS (Initial Hold System), DCD (DAS Cut Delay), and instant ARR=0 support.

### v0.2 Loop & Input Core
- **Fixed-Timestep Loop**: Redesigned the core engine architecture to completely decouple game logic from rendering, ensuring consistent physics regardless of hardware framerate.
- **Sub-Frame Input Handling**: Processed user inputs between frames in precise chronological order to maximize input accuracy and responsiveness.

---

## ⏳ Pre-1.0 Beta (Formerly v1.0 ~ v1.1.1)
*These versions were previously shipped to production but are now retroactively classified as v0.1.x beta.*

### v1.1.x: Sprint Mode & UX Polish
- Added **Sprint 40L Mode** with a dedicated leaderboard for clearing 40 lines as fast as possible.
- Full hardware keyboard support for iPad, plus comprehensive keyboard navigation (WASD, Tab, Enter) for all dialogs and menus.

### v1.0.9.x: Daily Challenge & Achievement System
- Introduced the **Daily Challenge**: A date-seeded mode where all players get the exact same piece sequence (one attempt per day).
- Added a 20-milestone **Achievement System** with unlock toasts and a badge gallery.
- Added T-Spin Mini detection and implemented leaderboard score deduplication (keeps only personal bests).
- Upgraded the audio system with dynamic multi-track BGM that scales with the game level.

### v1.0.8.x: Performance & Accessibility
- **Auto Low-Perf Mode**: Continuously monitors FPS and automatically disables heavy neon/particle/background effects if frames drop.
- **Sprite Caching**: Pre-renders piece gradients to an offscreen canvas to drastically reduce GPU cost.
- **Accessibility**: Added a Colorblind mode (applies unique symbol overlays for all 7 tetrominoes) and an animation intensity toggle for motion-sensitive players.

### v1.0 ~ v1.0.7: Visuals & Social Features
- Implemented All-Clear bonuses, screen shake, and a dynamic particle system.
- Added automatic OG image generation (`/api/og` Edge Function) and Web Share API integration for sharing game-over results.
- Enabled PWA (Progressive Web App) offline support and laid the groundwork for iOS push notifications.
