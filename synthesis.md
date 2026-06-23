# General Risks & Pre-Launch Review: Glowtris

## 1. Consensus & Highest Priority Risks
The AI Fusion panel identified several massive blind spots that transcend technical security and threaten the survival of the project on launch day:

- **Legal Trade Dress & "Tetris" Risk (Critical):** Do NOT use the phrase "Tetris clone" in the blog post, Reddit, or any marketing materials. The Tetris Company issues immediate C&D takedowns for games that use the `-tris` name or exact trade dress. **Resolution:** Scrub "Tetris" from all public documents. Consider renaming pieces to custom names (e.g., "Beam", "Box") to differentiate visually.
- **Infrastructure Meltdown via `vercel.json` (Critical):** A global `Cache-Control: no-cache` rule currently exists in `vercel.json`. This completely bypasses Vercel's Edge CDN for `index.html` and static assets. If the game hits the front page of Hacker News, the Vercel Hobby limits will be exhausted in minutes, resulting in an immediate 500 error. **Resolution:** Update `vercel.json` to use `s-maxage=3600, stale-while-revalidate` for the frontend.
- **Vercel TOS Violation (High):** Vercel Hobby strictly prohibits commercial revenue. Launching Lemon Squeezy (or even Ko-fi donations) on a Hobby tier risks an account ban. **Resolution:** Pre-upgrade to Vercel Pro ($20/mo) before the store opens.

## 2. Business & Monetization
- **"Pay to Win" Narrative:** Selling "Paid Shields" will cause a vicious backlash on Reddit. The community will perceive paid shields as a way to buy competitive advantage, even if it only protects streaks. **Resolution:** Reframe shields as a pure "habit protector" that does not influence the global leaderboard score, or pivot monetization entirely to cosmetic skins (board themes, glowing pieces).

## 3. UX & Core Loop
- **Mobile Controls Gap:** The current button-based approach will frustrate mobile players accustomed to swipe gestures (like in standard mobile block games). **Resolution:** Implement a swipe-gesture scheme as an option before v1.0.
- **The Streak Death Spiral:** Losing a 30-day streak will cause users to churn permanently if the streak resets to 0. **Resolution:** Add a "Best Streak" badge that never resets so players have a permanent trophy to look back on.
- **First-Run Onboarding:** New visitors from viral posts will land on the game without context. Add a dismissible single-screen onboarding explaining the modes and streak loop.

## 4. Operational Readiness
- **No Viral Runbook:** If traffic spikes to 20k concurrents, what happens? **Resolution:** Prepare a private `LAUNCH_RUNBOOK.md` detailing how to upgrade Upstash Redis plans, clear stale keys, and handle Vercel deploy limits (100 deploys/day limit will block emergency hotfixes!).
