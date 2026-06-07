# Instructions for Antigravity
> Read this file first, then `ROBOT.md`, then `TODO.md` before starting any task.

## 🔐 CREDENTIALS SECURITY (CRITICAL - READ FIRST)

**NEVER put credentials in GitHub-tracked files:**
- ❌ NO passwords, tokens, API keys, secrets in: README.md, ROBOT.md, AGENTS.md, CLAUDE.md, TODO.md, WALKTHROUGH.md, or source code
- ✅ USE CREDENTIALS.md ONLY (git-ignored, server-only backup)
- ✅ USE PLACEHOLDERS in docs: `<TOKEN>`, `<PASSWORD>` → reference "see CREDENTIALS.md"
- ✅ CHECK before commit: search for `password=`, `token=`, `secret=` in staged files

**If you see plaintext credentials in any file:**
1. IMMEDIATELY remove them
2. Replace with placeholder: `<CREDENTIAL_NAME>`
3. Add comment: "see CREDENTIALS.md"
4. Commit: "security: remove plaintext credentials"

---

## 🔄 SYNC — Mandatory Session Start Protocol

The user will say **"sync"** at the start of a session. When this happens (or at the start of any new session before any task):

1. **Read in this order**:
   - `AGENTS.md` (this file) — Antigravity-specific instructions
   - `ROBOT.md` — all shared project rules, deployment config, and workflow
   - `TODO.md` — active tasks and version pipeline
   - `WALKTHROUGH.md` — technical handoff notes from Claude (architecture decisions, implementation details, what to polish next)
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

## Antigravity-Specific Guidelines

- Always read `AGENTS.md` → `ROBOT.md` → `TODO.md` in that order before starting any task.
- `README.md` is human-facing — refer to it for feature context only, not for operational rules.
- **Unified Workspace**: Keep all technical specifications, tasks, and walkthrough reports inside the shared project directory (using `TODO.md` and `WALKTHROUGH.md`) to maintain 100% transparent and synchronized collaboration with Claude Code.
