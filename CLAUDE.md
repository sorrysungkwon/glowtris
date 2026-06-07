# Instructions for Claude Code
> Read this file first, then `ROBOT.md`, then `TODO.md`, then `GROWTHPLAN.md` before starting any task.

## 🔐 CREDENTIALS SECURITY (CRITICAL - READ FIRST)

**NEVER put credentials in GitHub:**
- ❌ NO passwords, tokens, API keys, secrets in README, TODO, CLAUDE, AGENTS, ROBOT, WALKTHROUGH, code
- ✅ CREDENTIALS.md ONLY (git-ignored, server backup)
- ✅ USE PLACEHOLDERS: `<API_TOKEN>`, `<PASSWORD>` with "see CREDENTIALS.md"
- ✅ PRE-COMMIT CHECK: before `git add`, search files for `password=`, `token=`, `secret=`

If you find plaintext credentials:
1. Delete immediately
2. Replace with placeholder
3. Commit: "security: remove plaintext credentials"
4. Note: CREDENTIALS.md has server backup

---

## 🔄 SYNC — Mandatory Session Start Protocol

The user will say **"sync"** at the start of a session. When this happens (or at the start of any new session before any task):

1. **Read in this order**:
   - `CLAUDE.md` (this file) — Claude-specific instructions
   - `ROBOT.md` — all shared project rules, deployment config, and workflow
   - `TODO.md` — active tasks and version pipeline
   - `GROWTHPLAN.md` — marketing strategy, DAU targets, channel plans (local only, never commit)
   - `README.md` — optional, for high-level feature/roadmap context only
2. **Check recent changes**: `git log --oneline -10`
3. **Report to the user**:
   - Current branch and latest commit
   - What changed since the last session (docs, features, fixes)
   - Any open PRs or pending release actions
   - What the next task is (first `🔲 Next` item in TODO.md)
4. **Flag any inconsistencies** between documents before starting work

> Shared rules (Safety Harness, Vercel config, Deployment Discipline, Release Workflow) are in `ROBOT.md` — that is the source of truth for all shared operational rules.

---

## Claude-Specific Guidelines

- Always read `CLAUDE.md` → `ROBOT.md` → `TODO.md` → `GROWTHPLAN.md` in that order before starting any task.
- `README.md` is human-facing — refer to it for feature context only, not for operational rules.
- **Unified Workspace**: Keep all technical specifications, tasks, and walkthrough reports inside the shared project directory (using `TODO.md` and `WALKTHROUGH.md`) to maintain 100% transparent and synchronized collaboration with Antigravity.

### Local Development

> For local development, create a `.env.local` file (never commit it) with the Upstash Redis credentials.
