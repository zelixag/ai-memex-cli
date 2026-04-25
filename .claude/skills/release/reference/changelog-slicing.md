# CHANGELOG.md slicing

Phase 10 (`10-github-release.mjs`) feeds the GitHub Release a `--notes-file`. The notes come from a single section of `CHANGELOG.md`, sliced out by `_shared/changelog.mjs`.

## The contract with `CHANGELOG.md`

The slicer expects:

1. Each released version is a **`## vX.Y.Z`** heading at the top level of the document.
   - Match regex: `^## v<exact-version>\s*$` on its own line.
   - The exact-version match is literal — `0.3.0-beta.1` won't match `0.3.0`.
2. The body of a section is **everything between its `## v...` heading and the next `## v...` heading** (or EOF).
3. Sub-headings (`### 🚀 Enhancements`, `### 🩹 Fixes`, etc.) are kept verbatim in the slice.

## What the agent (phase 2) must produce

When phase 2 runs, the agent receives the target `newVersion` and is told to add (or convert) a `## v<newVersion>` section at the top of `CHANGELOG.md`. Phase 10 then reads that exact heading.

If the slicer can't find the heading, phase 10 aborts with:

> no `## v0.3.0` section in CHANGELOG.md — agent should have added one in phase 2

Recovery: edit `CHANGELOG.md` to add the missing section, then re-run phase 10 standalone.

## Example

Given `CHANGELOG.md`:

```markdown
# Changelog

## v0.3.0

### 🚀 Enhancements

- Added `memex onboard` command. (abc1234)

### 🩹 Fixes

- Fixed Windows path normalization in `glob`. (def5678)

## v0.2.0

### 🚀 Enhancements
...
```

`readChangelogSection("CHANGELOG.md", "0.3.0")` returns:

```markdown
### 🚀 Enhancements

- Added `memex onboard` command. (abc1234)

### 🩹 Fixes

- Fixed Windows path normalization in `glob`. (def5678)
```

(The `## v0.3.0` heading itself is excluded — `gh release create --title v0.3.0` already provides the title.)

## Edge cases

| Situation                                | Behavior                                           |
|------------------------------------------|----------------------------------------------------|
| Heading missing                          | Phase 10 aborts                                    |
| Heading exists, body empty               | Phase 10 creates a release with empty notes        |
| Heading not at top (e.g. below another)  | Slicer still finds it (regex is anchored to ^/$ only) |
| Trailing whitespace after the heading    | OK — `\s*$` tolerates it                           |
| Pre-release versions (`0.3.0-beta.1`)    | Phase 10 is skipped for beta; not a slicer issue   |

## Why we don't auto-generate from git log

`changelogen` (and similar) read commit messages and group by conventional-commits prefix. That works when commits are disciplined; for this repo we prefer the agent in phase 2 to author the section, because it can summarise effects (not just commit subjects) and keep the bilingual tone consistent with the rest of `CHANGELOG.md`.
