---
name: release-ai-memex-cli
description: >-
  Run or guide an npm release for ai-memex-cli: doc sync (Claude), version bump,
  build, tests, git tag, publish. Use when the user says release, ship, cut a
  version, publish to npm, sync docs site, or GH Pages.
---

# Release ai-memex-cli (skill + script)

This skill **orchestrates** the same pipeline as `scripts/release.mjs`. The script owns deterministic steps (bump, build, test, tag, publish); **you** (the agent) use `Read` on `reference/sync-docs-for-release.md` when the user wants a **manual** doc pass without running the full release, or to understand boundaries before `pnpm release`.

## When to use

- User wants to **cut a release** (patch / minor / major) or **dry-run** it.
- User wants **CHANGELOG + README (en/zh) + marketing site** aligned with `src/commands/**`.
- User wants **only** the documentation site rebuilt and copied to `docs/` for GitHub Pages.

## Hard rules

1. **Never** edit `package.json` version or run `npm publish` / `pnpm publish` unless the user explicitly confirms (2FA OTP on their machine).
2. **Prefer** the repo script over improvising: from repository root run `node scripts/release.mjs` (or `pnpm release` / `pnpm release:dry`).
3. Doc-sync **allowed** paths and **forbidden** paths live in `reference/sync-docs-for-release.md` — follow that file exactly.
4. After changing **website** source, sync GitHub Pages artifacts: `pnpm run docs:sync` at repo root (runs `website` `build:gh-pages` and copies into `docs/`).

## Commands (repository root)

| Intent | Command |
|--------|---------|
| Full interactive release (patch) | `pnpm release` |
| Minor / major | `pnpm release:minor` / `pnpm release:major` |
| Preview only | `pnpm release:dry` |
| Skip Claude doc stage | `pnpm release:no-agent` |
| Help | `node scripts/release.mjs --help` |
| Rebuild site + copy to `docs/` | `pnpm run docs:sync` |

## If the user runs doc sync **outside** `release.mjs`

1. `Read` `reference/sync-docs-for-release.md`.
2. Gather `git log` / `git diff` since last tag (same inputs as `release.mjs` would inject).
3. Apply edits conservatively; keep **bilingual parity** (README.md ↔ README.zh-CN.md; website i18n en ↔ zh).
4. Finish with a **short list of touched files** — do not dump full file contents.

## Reference layout

- `reference/sync-docs-for-release.md` — full doc-sync contract (scopes, i18n, components, forbidden paths).
- `scripts/sync-gh-pages.mjs` — build `website/` with base `/ai-memex-cli/` and copy `website/dist/public/` → `docs/`.

Maintainer-facing narrative: [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) (paths relative to this file: repo root `CONTRIBUTING.md`).
