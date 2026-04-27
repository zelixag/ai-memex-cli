# Vault Protocol

Use this reference when locating a vault, writing wiki files, checking page shape, or deciding whether a path belongs to ai-memex.

## Vault Roots

The default global vault is:

```text
~/.llmwiki/
```

A project may also have a local vault:

```text
<project>/.llmwiki/local/
```

When unsure, run:

```bash
memex status
```

## Global Vault Shape

```text
~/.llmwiki/
  raw/
    personal/
    research/
    reading/
    team/
    <scene>/sessions/
  wiki/
    <scene>/
      entities/
      concepts/
      sources/
      comparisons/
      overviews/
      syntheses/
  AGENTS.md
  index.md
  log.md
```

## Semantics

- `raw/`: source material. Treat as immutable evidence unless the user explicitly asks to normalize or remove it.
- `wiki/`: agent-authored knowledge pages compiled from raw sources and prior wiki pages.
- `AGENTS.md`: wiki constitution and local schema rules.
- `index.md`: navigable map of the wiki. Update after semantic page additions, removals, or major reorganizations.
- `log.md`: append-only operation history. Add entries after ingest, repair, distill, or major query archival.

## Page Types

| Type | Directory | Purpose |
| --- | --- | --- |
| `entity` | `entities/` | People, companies, tools, projects, institutions |
| `concept` | `concepts/` | Methods, principles, patterns, technical ideas |
| `source` | `sources/` | Articles, papers, docs, sessions, raw source summaries |
| `comparison` | `comparisons/` | Side-by-side analysis of 2+ entities or concepts |
| `overview` | `overviews/` | Broad survey of a topic, area, or vault state |
| `synthesis` | `syntheses/` | Derived insights, theses, non-trivial connections |

## Frontmatter Baseline

Use the local template if present. Otherwise use this baseline:

```yaml
---
title: Example Title
type: concept
scene: research
sources:
  - raw/research/example.md
updated: 2026-04-24
---
```

Rules:

- `type` must match the page directory.
- `sources` should point to raw files or source pages that support the claims.
- `updated` should use the current date when the page is materially changed.
- Do not invent citations. If a claim is inferred, say so explicitly in prose.

## Wikilinks

Use `[[Page Title]]` or the convention already present in the vault. Prefer linking existing pages over creating duplicate concepts.

Before creating a new page, search for related pages:

```bash
memex search "<topic>"
```

## Index And Log

Update `index.md` when:

- a new important page is created
- a page is renamed or moved
- a summary changes the navigation map

Update `log.md` when:

- raw material is captured
- raw material is ingested
- a session is distilled
- repair changes wiki structure or semantics

Log entries should be short, dated, and factual.

