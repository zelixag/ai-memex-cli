---
name: LLM Wiki
description: Personal/team knowledge base maintained by LLM agents
---

# LLM Wiki Schema

## Vault Structure

- `raw/` — immutable source documents
- `wiki/` — LLM-generated markdown pages
- `index.md` — catalog of all wiki pages
- `log.md` — append-only action log

## Scenes & Types

- **Scenes**: `personal` / `research` / `reading` / `team`
- **Types**: `entity` / `concept` / `source` / `summary`

## Workflows

### Ingest

When running `memex ingest <raw-file>`:

1. Read the raw source file
2. Identify the appropriate scene and type
3. Create or update entity/concept/source pages in `wiki/<scene>/`
4. If summary-worthy, create a `summary` page
5. Update `index.md` with new page entries
6. Append to `log.md`: `## [YYYY-MM-DD] ingest | <source-name>`
7. Do NOT modify `raw/` files

### Query

When answering questions:

1. Read `index.md` to find relevant pages
2. Drill into relevant pages
3. Synthesize answer with `[[page]]` citations
4. If answer is durable, file it as a new wiki page

### Lint

Run `memex lint --json`, then:

1. Review orphan pages (no inbound links)
2. Check for contradictions between pages
3. Flag stale claims superseded by newer sources
4. Find [[unresolved references]]
5. Suggest missing cross-references

## Page Format

Use frontmatter on all wiki pages. See templates for examples.

## Link Syntax

Use `[[page-name]]` for internal links.

## Naming Convention

- Files: kebab-case (e.g., `frontend-engineering-management.md`)
- Links: match filename without extension
