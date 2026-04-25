---
name: release
description: Release ai-memex-cli to npm. Bumps version, syncs bilingual READMEs and the website docs/, runs tests, publishes, tags, and creates a GitHub Release. Supports beta channel and dry-run. Trigger when the user says 发版 / release / publish / 发新版本 / "上传新包".
---

# Release ai-memex-cli

This skill drives the full publish pipeline for `ai-memex-cli`. It is invoked by the user (never proactively): npm publish is irreversible after 72h, GitHub Releases are public, and git tags propagate fast.

## When to use
- User explicitly asks to release / publish / cut a new version
- Triggers (zh): "发版"、"发个新版本"、"上传新包"、"发布到 npm"、"打 tag"
- Triggers (en): "release", "publish", "ship a new version", "cut v0.3.0"

**Do NOT trigger** for: "ready to release?", "what's left before release?" — those are status questions, not commands.

## Architecture

11 independent phase scripts under `scripts/`, each a Node `.mjs` runnable on its own. An orchestrator (`scripts/orchestrator.mjs`) chains them with confirmation prompts. `pnpm release` invokes the orchestrator.

Each phase prints a trailing line `::summary:: <json>` on stdout — both the orchestrator and a driving agent can parse it to make decisions.

```
scripts/
├── orchestrator.mjs       # pnpm release entry
├── 01-preflight.mjs       # read-only checks
├── 02-sync-docs.mjs       # invokes `claude -p` to update CHANGELOG/README/website
├── 03-bump-version.mjs    # writes package.json
├── 04-build-all.mjs       # pnpm build + (conditional) website → docs/
├── 05-test.mjs            # pnpm test:run
├── 06-pack-preview.mjs    # pnpm pack --dry-run + content audit
├── 07-git-finalize.mjs    # commit + tag, local only
├── 08-publish.mjs         # pnpm publish [--tag beta]
├── 09-git-push.mjs        # push HEAD + tag
├── 10-github-release.mjs  # gh release create (skipped for beta)
├── 11-verify.mjs          # npm view + gh release view
└── _shared/               # log / shell / pkg / changelog helpers
```

## Quick reference

| Goal                   | Command                                       |
|------------------------|-----------------------------------------------|
| patch stable           | `pnpm release`                                |
| minor stable           | `pnpm release --bump minor`                   |
| major stable           | `pnpm release --bump major`                   |
| start a beta cycle     | `pnpm release --bump prepatch --beta`         |
| beta continuation      | `pnpm release --beta`                         |
| graduate beta → stable | `pnpm release --bump release`                 |
| dry-run preview        | `pnpm release --dry-run`                      |
| docs already match     | `pnpm release --manual-docs`                  |
| CI / unattended        | `pnpm release --yes --push`                   |

## Workflow

| #  | Phase           | Writes? | dry-run            | Pause after? |
|----|-----------------|---------|--------------------|--------------|
| 1  | preflight       | no      | runs               | no           |
| 2  | sync-docs       | yes     | runs (real edits)  | **yes** — review agent diff |
| 3  | bump-version    | yes     | computes only      | no           |
| 4  | build-all       | yes     | skipped            | no           |
| 5  | test            | no      | runs unless --skip | no           |
| 6  | pack-preview    | no      | skipped            | **yes** — review tarball |
| 7  | git-finalize    | yes     | skipped            | **yes** before — final review |
| 8  | publish         | yes     | `--dry-run` flag   | no           |
| 9  | git-push        | yes     | skipped            | yes (unless `--push`) |
| 10 | github-release  | yes     | skipped            | no           |
| 11 | verify          | no      | skipped            | no           |

## Decision points (when an agent drives this manually)

When you (the agent) drive the release without `pnpm release`, you MUST stop and ask the user at these checkpoints:

1. **Before phase 1** — bump level (patch / minor / major / beta?), dry-run vs live
2. **After phase 2** — show `git status --porcelain`, confirm agent's doc edits look right
3. **After phase 6** — show tarball file list, confirm no missing / no leaked files
4. **Before phase 7** — final `git status` review before writing git history
5. **Before phase 9** — confirm push (unless user said `--push` upfront)

Skip a checkpoint only if the user explicitly said `--yes` or equivalent.

## Beta channel semantics

- Version: `0.3.0-beta.0` → `0.3.0-beta.1` → ... → `0.3.0`
- npm tag: `--tag beta` (so `npm i ai-memex-cli` keeps pointing at the latest stable)
- Git tag: yes, `v0.3.0-beta.1` (preserves history)
- GitHub Release: **skipped** (avoid clutter; the git tag is enough)

See `reference/beta-flow.md` for the full state machine and examples.

## Failure recovery

Things that can go wrong and how to recover are catalogued in `reference/rollback.md`. Common cases:
- preflight fails → fix env, re-run from phase 1
- sync-docs fails → `--manual-docs` and re-run
- publish fails after tag → `git tag -d v...` locally, retry phase 8 only
- publish succeeds but push fails → re-run phase 9 + 10 individually

## Reference files

- [`reference/workflow.md`](reference/workflow.md) — full timing diagram
- [`reference/beta-flow.md`](reference/beta-flow.md) — beta state machine + examples
- [`reference/changelog-slicing.md`](reference/changelog-slicing.md) — how `## v0.3.0` is extracted for release notes
- [`reference/github-release.md`](reference/github-release.md) — `gh release create` rules
- [`reference/rollback.md`](reference/rollback.md) — per-phase failure recovery
- [`reference/windows-notes.md`](reference/windows-notes.md) — pnpm shim bypass + Claude Code TUI quirks

## Direct invocation cheat sheet

If an agent wants to run one phase in isolation (e.g. retry only phase 8 after a publish failure):

```bash
node .claude/skills/release/scripts/01-preflight.mjs
node .claude/skills/release/scripts/02-sync-docs.mjs --new-version 0.3.0
node .claude/skills/release/scripts/03-bump-version.mjs --bump minor
node .claude/skills/release/scripts/04-build-all.mjs
node .claude/skills/release/scripts/05-test.mjs
node .claude/skills/release/scripts/06-pack-preview.mjs
node .claude/skills/release/scripts/07-git-finalize.mjs --version 0.3.0
node .claude/skills/release/scripts/08-publish.mjs            # add --beta for prerelease
node .claude/skills/release/scripts/09-git-push.mjs --version 0.3.0
node .claude/skills/release/scripts/10-github-release.mjs --version 0.3.0
node .claude/skills/release/scripts/11-verify.mjs --version 0.3.0
```

Each script also accepts `--help`.
