# Glowtris Rules
- All agents read file.
- Single source of truth.
- CLAUDE.md for Claude. AGENTS.md for Antigravity.

## Caveman Mode
- Caveman mode always on.
- Talk caveman. Short. No fluff.
- NO change code, commands, files, URLs, secrets. 
- Human docs (README, PRs, commits) stay normal English.

## Safety Rules
- NO auto merge/tag/destroy. Need user say "merge it".
- Keep branches safe. No rush master.
- No over-engineer. Build only asked.

## Security
- Secrets go CREDENTIALS.md ONLY.
- NO secrets in git files.
- Use placeholders `<TOKEN_NAME>`.
- Check `token=`, `password=` before commit.

## Project Context
- Name Glowtris. NOT Neon Tetris.
- Update TODO.md.
- No private brain folders. Use project root docs.
- Code in `src/`. `npm run build` makes `index.html`. NO edit `index.html`.
- NO touch `sw.js` cache hash.
- Code docs English. Private docs Korean OK.
- TODO.md for features only.
- BUGS.md for bugs.

## UI Rules
- NO UI exact top. Avoid safe-area top.
- Clear notch/island. Use `calc(env(safe-area-inset-top) + 12px)`.
- Bottom safe for install banner.

## Design Rules
- Read DESIGN_SYSTEM.md.
- NO hardcode color/size. Use tokens.
- Marathon: green (`--mode-marathon`).
- Flow: violet (`--mode-flow`).
- Sprint: cyan (`--mode-sprint`).
- Blitz: yellow (`--mode-blitz`).
- Daily: orange (`--mode-daily`).
- Tokens in `:root` (`style.css`) and `MODE_COLORS` (`shared.js`). Keep sync.

## Branches & Deploy
- `master`: Prod. glowtris.com.
- `preview`: Staging. prevglow.vercel.app.
- `hotfix/*`: Test branches.
- `feature/*`: Work branches.
- Flow: feature -> preview -> PR to master.
- NO PR to preview. Test on preview before PR to master.

## Vercel Info
- Team slug: `sgkwon-team`.
- Team ID: `team_pb1objuXoHlJIv67jumHZrg8`.
- Project ID: `prj_V1lhSONnxAM9K2hpk5VLtemldWnm`.
- Ignore Build Step: empty.
- Redis tokens in Vercel env.
- `VERCEL_TOKEN` in GitHub secrets.

## Push Notifications
- Runs on GitHub Actions.
- `api/subscribe.js` save Redis.
- `scripts/notify.js` send push.
- NEVER ROTATE VAPID KEYS.
- Keys in secrets.
- Test: `gh workflow run notify-cron.yml --ref master`.

## Deployment Limits
- 100 deploys per day limit!
- NO manual `vercel deploy`.
- NO micro-push preview.
- Batch work on feature branch.
- Test local. Merge preview once per feature.

## Vercel Mistakes to Avoid
- NO GitHub Deployment API in Actions. Use Commit Status.
- Limit counts all pushes and CLI deploys.
- NO `git diff HEAD^ HEAD` in build ignore.
- Use Team ID and Project ID. Not slug.
- Empty commits waste deploys.
- Limit reset midnight UTC.
- Disable requireVerifiedCommits via API if deploy blocked.

## Workflow Rules
- NO commit direct local master.
- Push feature branches. Not hide work.
- Review diff before mark done.
- Check settings persistence (localStorage).
- Check bug root cause.

## Strategy
- Correctness and Maintainability first.
- Rebuild engine competitive standard.
- v1.0 official launch.
- NO growth features yet.
- Record progress.

## API & Server
- Edge cache leaderboards.
- Rate limit score submit.
- Domain setup pending.

## Maintenance Banner
- Keys `maintenance:msg` (string), `maintenance:time` (unix ms) in Redis.
- Use REST API set/clear.

## Release Process
- NO push without user say.
- Accumulate doc commits. Push with code.
- Feature -> Preview -> PR -> Master.
- Tag releases. Sync preview.

## UI Aesthetic & Perf
- Glowing buttons. Touch support fixed.
- Auto Perf mode less sensitive. Manual toggle works.
- Next: v0.4 Back-to-Back, All-spin, 5-next queue.

## Docs Sync Protocol
- Run `/home/ubuntu/docs/sync-docs.sh`.
- Push `/home/ubuntu/docs` to `glowtris-docs` private repo.
- NO `CREDENTIALS.md` in docs.