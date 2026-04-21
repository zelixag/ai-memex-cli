# Sync documentation for an ai-memex-cli release

Use this when preparing release notes and public docs so they match **current** CLI behaviour. The release script (`scripts/release.mjs`) may inject git log + diff into a temp prompt; this file is the **canonical rule set** when you work manually or review what the script asks Claude to do.

## Versions

- **Do not** edit `package.json` for the version bump during doc sync — `release.mjs` does that in a later step.
- Target version is provided by the maintainer or by the script context (`oldVersion` → `newVersion`).

## Files to keep in sync

### 1. `CHANGELOG.md`

- Add or extend `## v<newVersion>` above older versions.
- If `## Unreleased` exists with content, fold it into `v<newVersion>` and leave an empty `## Unreleased` at the top for future work.
- Group bullets: `### Features` / `### Bug Fixes` / `### Documentation` / `### Internal` (or project convention).
- One line per bullet; optional short commit SHA in parentheses when it adds traceability.

### 2. `README.md` and `README.zh-CN.md`

- **Parallel structure**: any section change in English must mirror in Chinese (and vice versa) unless the change is locale-specific (rare).
- Update command tables, flags, and “What memex gives you” only when `git diff` shows user-visible CLI changes.
- Do **not** rewrite Karpathy / Memex positioning unless the product story actually changed.

### 3. Documentation website source — `website/client/src/`

Canonical path is the **`website/`** package at repo root (Vite + React), **not** `docs/website/` (legacy path may still appear in older docs).

Allowed edits:

| Area | Path | Notes |
|------|------|--------|
| i18n | `website/client/src/i18n/en-US.ts`, `zh-CN.ts` | Hero, features, commands, architecture, comparison, quick start, footer, navbar, notFound. Keys and shape must stay **strictly parallel** between locales. |
| Sections | `website/client/src/components/*Section.tsx`, `Navbar.tsx`, `Footer.tsx` | Structure, anchors, icons, any copy still hardcoded in components. |
| Shell | `website/client/src/pages/Home.tsx`, `App.tsx` | Only if section order or routing changes. |

**Commands surface:** `CommandsSection.tsx` (or equivalent) must list **every** public command with correct `usage` / flags when CLI commands change — **i18n alone is not enough** if the component maps icons or command order locally.

### 4. GitHub Pages **built** output — `docs/`

- **Do not hand-edit** `docs/index.html`, `docs/assets/**` except via the sync script.
- After changing `website/client/src/`, run from repo root: `pnpm run docs:sync` (builds with `base=/ai-memex-cli/` and copies into `docs/`).
- Keep `docs/.nojekyll` (the sync script ensures it exists).

## Forbidden

- Any `package.json` (root or `website/`), `pnpm-lock.yaml`, `package-lock.json`
- `website/client/src/components/ui/**` — shadcn / generated UI primitives
- `website/dist/**`, `node_modules/`, `dist/` (CLI build output)
- `src/**` — doc sync is not a feature implementation pass
- Git commit / tag / push / `pnpm publish` — unless the user explicitly asked you to run those and they understand OTP / irreversibility

## Editing principles

1. **Conservative** — change a sentence only when the repo proves it is stale.
2. **Exhaustive inside scope** — for each user-visible change, update every surface: CHANGELOG + README (en/zh) + website i18n + any component that hardcodes that command or section.
3. **Internal-only refactors** — CHANGELOG `### Internal` only; skip README / website unless something user-visible leaked (e.g. new env var).

## Bilingual checklist (before merge)

- [ ] `README.md` ↔ `README.zh-CN.md` same sections and semantics
- [ ] `en-US.ts` ↔ `zh-CN.ts` same keys and order
- [ ] `pnpm run docs:sync` run if `website/client/src/` changed
- [ ] No edits under `components/ui/**`
