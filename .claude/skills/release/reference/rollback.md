# Rollback / failure recovery

Each phase can fail in characteristic ways. This file is the runbook.

## Universal principle

**The first 7 phases are local-only.** If any of phases 1-7 fail, nothing is on a remote yet, and recovery is just `git reset` / `git tag -d` / fix the issue / re-run.

Once phase 8 (publish to npm) succeeds, you've crossed a one-way door. You cannot truly unpublish; you can only mitigate (deprecate, retract beta tag, ship a patched version).

## Phase 1 — preflight

| Failure                            | Fix                                                   |
|------------------------------------|-------------------------------------------------------|
| `pnpm` not in PATH                 | Install pnpm; restart shell                           |
| Not in a git repo                  | `cd` to repo root                                     |
| Wrong branch                       | `git switch main`                                     |
| Node < 20                          | Upgrade Node                                          |
| `claude` missing                   | Install Claude Code, or use `--manual-docs`           |
| `gh` missing / not authed          | Install gh, run `gh auth login` (only blocks phase 10)|
| `pnpm whoami` fails                | `pnpm login` (only blocks phase 8)                    |

Re-run from phase 1 once fixed.

## Phase 2 — sync-docs

| Failure                                  | Fix                                                                                |
|------------------------------------------|------------------------------------------------------------------------------------|
| `claude -p` exit code ≠ 0                | The temp prompt file is kept on disk. Re-run with `--manual-docs` and edit by hand.|
| Agent edits look wrong                   | `git restore <files>` to revert; re-run phase 2 (or `--manual-docs`)               |
| Agent missed bilingual parity            | Edit by hand; re-run from phase 3 (no need to re-run phase 2)                      |
| `--manual-docs` mode used                | Edit CHANGELOG/README/i18n/components by hand, then continue from phase 3          |

## Phase 3 — bump-version

| Failure                            | Fix                                                   |
|------------------------------------|-------------------------------------------------------|
| Invalid bump level                 | Check `--help`                                        |
| Cannot "release" — not prerelease  | Current version isn't a prerelease; use `--bump patch/minor/major` |
| Wrong version written              | Edit `package.json` by hand or re-run phase 3 with `--explicit X.Y.Z` |

## Phase 4 — build-all

| Failure                                  | Fix                                                                |
|------------------------------------------|--------------------------------------------------------------------|
| `tsc` errors                             | Fix the TypeScript errors, re-run phase 4                          |
| Windows `STATUS_STACK_BUFFER_OVERRUN`    | The pnpm-shim bypass should prevent this; see `windows-notes.md`   |
| `pnpm install --frozen-lockfile` mismatch in website/ | Update `website/pnpm-lock.yaml` separately and commit; re-run    |
| `vite build` errors                      | Fix the website source error, re-run phase 4 with `--rebuild-website force` |

## Phase 5 — test

| Failure                            | Fix                                                                  |
|------------------------------------|----------------------------------------------------------------------|
| Test fails                         | Fix the test or the code — do NOT release a regression               |
| Known platform-only failure        | Re-run with `--skip-tests` if you've already verified on another platform AND documented why in CHANGELOG |

## Phase 6 — pack-preview

| Failure                                  | Fix                                                              |
|------------------------------------------|------------------------------------------------------------------|
| `MISSING required file`                  | Update `package.json` `files` field to include the missing path  |
| `UNEXPECTED file leaked`                 | Either add it to `.npmignore` or remove it from the `files` glob |
| Tarball way bigger than expected         | Inspect the file list; usually means a directory was over-included |

## Phase 7 — git-finalize

| Failure                                  | Fix                                                              |
|------------------------------------------|------------------------------------------------------------------|
| Tag already exists locally               | `git tag -d vX.Y.Z` if you really mean to redo                   |
| Pre-commit hook rejects the commit       | Fix the issue, re-run phase 7 (this creates a NEW commit)        |

## Phase 8 — publish (the irreversible step)

### Failure modes

| Failure                                  | Fix                                                                          |
|------------------------------------------|------------------------------------------------------------------------------|
| `npm ERR! 401 Unauthorized`              | `pnpm login`, re-run phase 8                                                 |
| `npm ERR! 403 Forbidden`                 | The version may already exist on npm. Check `npm view <pkg> versions`        |
| `npm ERR! E409 Conflict`                 | Version published by someone else. Bump and retry from phase 3               |
| 2FA prompt loops                         | Make sure `pnpm` (not just `npm`) is logged in; some 2FA configs need OTP    |

### After publish succeeded

Once npm has the package, the next phases (push, gh release) MUST be completed somehow — even out of order:

```bash
# If push (phase 9) failed because of network
git push origin HEAD
git push origin vX.Y.Z

# If gh release (phase 10) failed
node .claude/skills/release/scripts/10-github-release.mjs --version X.Y.Z

# If verify (phase 11) failed
node .claude/skills/release/scripts/11-verify.mjs --version X.Y.Z
```

### Mitigating a bad publish

You **cannot** unpublish a public package after 72h, and you **should not** unpublish even within 72h if anyone might have installed it.

Instead:

```bash
# Deprecate with a clear message:
pnpm deprecate ai-memex-cli@X.Y.Z "Broken; use X.Y.Z+1"

# If it was a beta and you want to point the beta tag elsewhere:
pnpm dist-tag rm ai-memex-cli@X.Y.Z-beta.N beta
pnpm dist-tag add ai-memex-cli@X.Y.Z-beta.N+1 beta

# Ship a patched version (the proper fix):
# fix the bug, then `pnpm release --bump patch` to publish X.Y.Z+1
```

## Phase 9 — git-push

| Failure                                  | Fix                                                              |
|------------------------------------------|------------------------------------------------------------------|
| Auth failed                              | Re-authenticate with the remote                                  |
| Non-fast-forward push                    | Someone else pushed; pull/rebase, then re-run phase 9            |
| Network                                  | Re-run phase 9 alone                                             |

If you publish to npm but fail to push the tag, the package exists but git history doesn't show it — fix this before doing anything else.

## Phase 10 — github-release

| Failure                                  | Fix                                                              |
|------------------------------------------|------------------------------------------------------------------|
| `gh: not found`                          | Install gh                                                       |
| `gh auth status` not authenticated       | `gh auth login`                                                  |
| Tag not on remote                        | Run phase 9 first                                                |
| `## vX.Y.Z` not in CHANGELOG.md          | Edit CHANGELOG.md to add the section, re-run phase 10            |
| Release already exists                   | `gh release delete vX.Y.Z --yes` if you want to recreate         |

## Phase 11 — verify

If verify fails AFTER everything else succeeded:

| Failure                                  | Likely cause                                                     |
|------------------------------------------|------------------------------------------------------------------|
| `npm view ... version` doesn't match     | Registry replication lag — wait 30s, re-run                      |
| `dist-tags.latest` doesn't match         | Earlier tag manipulation; check `pnpm dist-tag ls <pkg>`         |
| `gh release view` not found              | Phase 10 didn't actually create it — re-run phase 10             |
