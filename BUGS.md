# Glowtris Bug List
- Report bug here. Tell symptom, steps, cause, fix.
- Status: 🔲 Open · 🔧 Work · ✅ Fixed

---

## ✅ Fixed

### BUG-015: No push notify (VapidPkHashMismatch)
- When: 2026-06-06
- Where: All phone (Apple, Google)
- Bad: GitHub Actions run, no notify show. Apple say `VapidPkHashMismatch`.
- Why:
  1. Vercel timeout. Move to GitHub Actions.
  2. Redis `hset` wrong. Use REST path instead of JSON array. Sub not save.
  3. VAPID key rotate wrong. Secret not sync. Old subs break.
  4. Bad test data in Redis. Break script.
  5. Bad YAML merge. Duplicate `workflow_dispatch`.
- Fix:
  - Put old `VAPID_PUBLIC_KEY` back in `pwa.js`. Match old subs.
  - Sync GitHub Secrets to match Vercel.
  - Fix YAML duplicate keys.
  - Fix Upstash syntax.
- Result: 2 sub work. 1 bad test fail. 1 debug sub fail (need reinstall).
- Lesson: VAPID key in `pwa.js` MUST match Secret. Key rotate = kill all subs. Do not rotate for fun.

### BUG-014: Samsung / in-app browser button lag or double hit
- Where: Samsung Internet, Insta/Naver in-app (Android)
- Bad: Button need many tap. Or fire twice.
- Why: Browser wait 300ms for double-tap-zoom. Tap fire `touchend`, then `click` 300ms later. Double fire!
- Fix: Add `touch-action: manipulation`. Kill 300ms wait.
- PR: Push straight to preview.

### BUG-004: Piece go ghost after 5 game (Chrome/Win)
- When: 2026-05-31 (Find) | 2026-06-03 (Fix)
- Bad: Piece turn invisible.
- How: Chrome Windows. Play 5 game.
- Why: Canvas 2D state (globalAlpha, shadowBlur) leak in Chrome GPU. `clearRect` not clear state.
- Fix: Reset alpha and blur at top of `drawBoard()` every frame.

### BUG-013: JLSTZ piece spawn too far right
- When: 2026-06-03
- Who: Reddit u/DelayProfessional345
- Bad: Piece spawn 1 column right. I and O fine.
- Why: Math wrong. `Math.floor(COLS/2) - Math.floor(width/2)` make 4 for width 3.
- Fix: Change math. `Math.floor((COLS-width)/2)` make 3.

### BUG-012: iPad next/hold box size wrong
- When: 2026-06-03
- Where: iPad + Magic Keyboard
- Bad: Switch keyboard to touch, box size wrong.
- Why: `pointer:coarse` false when keyboard attached. Touch code not run.
- Fix: Use `any-pointer:coarse`. Add size fix in touch function. Bypass layout run early.

### BUG-011: 180 spin lift piece off floor
- When: 2026-06-02
- Bad: 180 spin make piece fly up. Spam spin, piece fly to moon.
- Why: Kick logic do vertical jump before horizontal slide. Wrong order.
- Fix: Rewrite kick. Horizontal first, then vertical last. One cell limit.

### BUG-010: D-pad too small, no slide
- When: 2026-06-02
- Bad: Button small. Thumb miss. Slide thumb not work. Must lift and tap.
- Fix: Make button big. Add slide logic. Track touch ID. Use grid location.

### BUG-009: Sound die when tab hide
- When: 2026-06-02
- Bad: Pause game, hide tab, come back, no sound. Mute toggle not fix.
- Why:
  1. Resume not await. Time read wrong.
  2. Mute only change volume, not wake sound.
  3. Wake event ignore if game paused.
  4. iOS use 'interrupted', not 'suspended'. Code not check.
  5. iOS kill sound completely ('closed'). Code not fix.
  6. iOS speaker trick only run once.
- Fix: Await resume. Check 'interrupted' and 'closed'. Recreate context if dead. Re-run speaker trick.

### BUG-008: Wall spin stuck
- When: 2026-06-02
- Bad: Piece hit wall, spin 90 fail. Only 180 work.
- Why:
  1. I-piece y-kick backwards. Push into floor.
  2. JLSTZ and I box change size on spin. Push piece away from wall.
- Fix: Flip I-piece y-sign. Make box standard size (3x3, 4x4). Fix T-spin check.

### BUG-007: Leaderboard start at 3 or 9
- When: 2026-06-02
- Bad: Top score hide. List start at rank 3 or 9.
- Why: Flex center style stick around from loading screen. Table get centered and cut off top.
- Fix: Remove style before show list. Scroll to top.

### BUG-006: WASD key break text type
- When: 2026-05-31
- Bad: Type name in leaderboard, WASD make box jump. No type W/A/S/D.
- Why: Key logic steal WASD always.
- Fix: Ignore WASD if typing in box.

### BUG-005: T-spin stuck in hole
- When: 2026-05-31
- Bad: T-piece no kick down into hole.
- Why: Kick logic missing down move. Missing CCW spin.
- Fix: Add SRS kick table. Add CCW spin on Z/Ctrl. PR #16.

### BUG-003: Keyboard shake screen
- When: 2026-05-31
- Bad: Press arrow key, screen shake left/right.
- Why: Parallax move trigger on key press.
- Fix: Remove parallax from key press. PR #15.

### BUG-002: Double Coffee Button
- When: 2026-05-31
- Bad: Two donate button on game over screen.
- Why: Code add button twice in two place.
- Fix: Remove second button add. PR #14.

### BUG-001: Sprint timer no stop on pause
- When: 2026-05-31
- Bad: Pause game, timer still run.
- Why: Loop update time, no check pause.
- Fix: Add pause check. Offset time when resume.

---

## 🏛️ Engine Architecture

### ARCH-001: Separate logic loop
- When: 2026-06-01
- Bad: Game tied to 60Hz screen draw. Frame drop = lag.
- Fix: ✅ v0.2. Run logic 1000 times a second. Draw separate.

### ARCH-002: Sort fast input
- When: 2026-06-01
- Bad: Fast keys in one frame not sorted right.
- Fix: ✅ v0.2. Save key time. Sort keys before apply.

### ARCH-003: Fast snap to wall
- When: 2026-06-01
- Bad: Fast move (ARR=0) use heavy loop.
- Fix: ✅ v0.3.0. Calculate wall distance. Move instant.

### ARCH-004: WebGL2 PixiJS make game fast
- When: 2026-06-01
- Bad: Canvas 2D slow. Stuck at 60fps. Glow effect too heavy.
- Plan: Move to PixiJS. Use GPU. Fast frame, good glow, save battery.
- Status: 🔲 Open

### ARCH-005: Fast sound play
- When: 2026-06-01
- Bad: Sound maybe slow.
- Plan: Pre-load sound. Play fast under 5ms.
- Status: 🔲 Open

---

## 🔵 Missing Things

### FEAT-001: 180 Spin
- Bad: No fast flip.
- Fix: ✅ v0.3.0. Add 180 spin key.

### FEAT-002: Custom Key
- Bad: Key stuck, no change.
- Fix: ✅ v0.3.0. Add key setting.

### FEAT-003: Soft Drop Speed Change
- Bad: Down arrow speed locked.
- Fix: ✅ v0.3.0. Add speed slider.

### FEAT-004: Back-to-Back Bonus
- Bad: Hard clear many time, no extra score.
- Fix: ✅ v0.4. Add 1.5x score jump.

### FEAT-005: 3 Next Piece
- Bad: Show only 1 next piece. Need 3.
- Fix: ✅ v0.4. Make array, show 3.

### FEAT-006: Lock Delay Limit
- Bad: Player spin piece forever, game no end.
- Fix: ✅ v0.3.0. Stop reset after 15 move.

### FEAT-007: Hold Spin Early (IRS)
- Bad: Hold spin key before spawn, piece not spin.
- Fix: ✅ v0.3.0. Check key on spawn.

### FEAT-008: Hold Swap Early (IHS)
- Bad: Hold swap key before spawn, piece not swap.
- Fix: ✅ v0.3.0. Swap on spawn.

### FEAT-009: Show Speed Stat
- Bad: No APM (Action Per Minute) or PPS (Piece Per Second) show.
- Status: 🔲 Open

### FEAT-010: All Spin Bonus
- Bad: Only T-piece give spin score.
- Fix: ✅ v0.4. Give score for any piece spin kick.

### FEAT-011: 2 Minute Mode
- Bad: No fast 2 minute time attack mode.
- Status: 🔲 Open

### FEAT-012: Move Keep After Spin (DCD)
- Bad: Spin piece, move delay reset. Feel clunky.
- Fix: ✅ v0.3.0. Keep move charge alive during spin.