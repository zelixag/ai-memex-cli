# GitHub Release creation

Phase 10 uses the `gh` CLI to create a Release on GitHub.

## What gets created

```
Tag:       vX.Y.Z          (must already exist locally and on origin)
Title:     vX.Y.Z
Notes:     sliced from CHANGELOG.md `## vX.Y.Z` section
Type:      "Latest" by default; "Prerelease" if --prerelease passed
Target:    the commit pointed at by tag vX.Y.Z
```

## Prerequisites

Phase 10 will fail unless ALL of the following are true:

1. `gh` CLI installed (`gh --version`)
2. `gh auth status` returns success — otherwise run `gh auth login`
3. Tag `vX.Y.Z` is pushed to `origin` (phase 9 does this)
4. `## vX.Y.Z` section exists in `CHANGELOG.md` (phase 2 should add it)

Phase 1 (preflight) warns about (1) and (2). Phase 10 itself enforces (3) and (4).

## Why phase 10 is skipped for beta

The orchestrator skips phase 10 when `--beta` is set. See `reference/beta-flow.md` for the rationale. If you want a Release for a specific beta (rare), invoke phase 10 manually with `--prerelease`:

```bash
node .claude/skills/release/scripts/10-github-release.mjs \
    --version 0.3.0-beta.5 --prerelease
```

## Why we use `--notes-file`, not `--notes` or `--generate-notes`

| Option                       | Why not                                       |
|------------------------------|-----------------------------------------------|
| `--notes "<inline>"`         | Hits Windows command-line length limit (8192) |
| `--generate-notes`           | Generates from PRs/commits — duplicates what  |
|                              | we already wrote in CHANGELOG.md              |
| `--notes-from-tag`           | Reads from tag's annotated message; we use    |
|                              | lightweight tags                              |
| **`--notes-file <tmp.md>`** ✓| Bypasses cmdline limit, gives us full control |

The `tmp.md` path is created in the OS temp dir and removed after `gh` returns.

## Editing notes after the fact

If you realise the changelog slice was wrong:

```bash
gh release edit vX.Y.Z --notes-file path/to/corrected.md
```

This doesn't affect the npm package or any subscribers — the Release page just rerenders.

## Marking an existing Release as Latest / Prerelease

```bash
gh release edit vX.Y.Z --latest         # promote a prerelease to "Latest"
gh release edit vX.Y.Z --prerelease      # demote a stable Release
```

## Deleting a Release

If the Release was created in error (and you haven't announced it):

```bash
gh release delete vX.Y.Z --yes
git push origin --delete vX.Y.Z   # also remove the remote tag if needed
```

The npm package can't be unpublished the same way — see `reference/rollback.md`.
