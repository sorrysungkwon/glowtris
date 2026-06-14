# Claude Rules
* Read this first. Then `ROBOT.md`. Then `TODO.md`. Then `GROWTHPLAN.md`.
* NO SECRETS IN GIT.
* Secrets go in `CREDENTIALS.md` only.
* Use `<PLACEHOLDER>` in docs.
* See secret? Delete. Add placeholder. Commit fix.
* User say "sync"? You do:
  * Read `CLAUDE.md`, `ROBOT.md`, `TODO.md`, `GROWTHPLAN.md`.
  * Check `git log -10`.
  * Tell user: branch, commit, changes, next task.
  * Find bad doc info? Tell user.
* `ROBOT.md` hold shared rules.
* `README.md` for human. Not rules.
* Keep work in `TODO.md` and `WALKTHROUGH.md`.
* Local dev? Make `.env.local`. Do not commit.