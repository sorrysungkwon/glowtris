# GLOWTRIS - Project Sync & Roadmap

## 📝 Recent Fixes & Sync Notes (Last Session)
- **Top Safe Area / Dynamic Island**: UI elements placed at the top now strictly follow the `calc(env(safe-area-inset-top, 0px) + 12px)` rule to gracefully avoid notches and camera rings in their normal state. (Rule added to `ROBOT.md`)
- **PWA Bottom Safe Area (Home Indicator)**: Changed `body` background and `manifest.json` `theme_color` to `#070514` (Dark Neon Navy) instead of pitch black. This ensures the iOS bottom touch bar blends seamlessly with the game's glowing background.
- **Leaderboard States**: Beautified "NO RECORDS YET", "SUBMITTING...", "NETWORK ERROR", and "SAVED OFFLINE" messages. They now use a unified `lb-offline` flex layout with CSS animations (e.g., pulsing rockets).
- **Offline Sync Resumption**: 
  - The `LS_SCORE_QUEUE` is now automatically flushed when the app boots up (`navigator.onLine` check).
  - If a user is actively staring at the "SAVED OFFLINE" leaderboard screen and the network reconnects (`online` event), the app automatically triggers a click on the submit button. It transitions visually to "SUBMITTING..." and natively renders the leaderboard.
- **Push Notification Prompt**: 
  - Removed prompt from browser-based installs on iOS because iOS 16.4 Web Push only works when launched in standalone mode. 
  - `_askNotif()` now gracefully triggers exactly 1.5 seconds after launching the installed PWA from the home screen (`standalone` mode).
  - "NOT NOW" permanently snoozes the auto-prompt. A new `NOTIFICATIONS` toggle has been added to the **Settings Menu** so users can trigger the OS permission dialog later.

---

## 🚀 Future Roadmap & Suggestions (For Claude)
Here is a list of highly recommended features to improve Game Feel and Project Completeness:

### 1. Game Feel (Juiciness)
- **Haptic Feedback**: Implement `navigator.vibrate([15])` for Hard Drops, and `navigator.vibrate([30, 50, 30])` for line clears. This drastically improves mobile game feel.
- **Screen Shake**: Add a CSS class (e.g., `.shake`) to the game canvas or `#app` wrapper. Trigger it on Hard Drops or when clearing 4 lines (Tetris).

### 2. Core Tetris Mechanics
- **Hold System**: The game currently lacks a "Hold" piece feature. Needs UI (a small box next to NEXT) and logic (swap current piece with hold piece, disable hold until piece locks).
- **T-Spin Detection**: Implement 3-corner checks for T-Spins. Award massive bonus points and display a "T-SPIN!" visual text popup.

### 3. Server Security (Anti-Cheat)
- **Score Signing**: Currently, anyone can `fetch('/api/leaderboard', { score: 999999 })`. 
- **Fix**: The client should hash the keypress history or send an obfuscated token alongside the score to prevent trivial cheating.

### 4. Advanced PWA / Leaderboard Features
- **Local Stats / Growth Chart**: Save sprint times locally over time. Display a line chart (using a simple canvas or SVG) in the main menu showing the player's personal improvement.
- **Ghost Racing**: Fetch the replay data of the #1 player (or personal best) and render a faint, semi-transparent ghost piece on the board executing their moves during Sprint mode.
- **Pause Background Blur**: When the `visibilitychange` event pauses the game (moving to another tab/app), apply `filter: blur(10px)` to the game canvas for visual polish.
