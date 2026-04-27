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

Lint runs in two layers — the CLI does the mechanical pass, the agent does the semantic pass. Both are needed for a real wiki health check.

**Mechanical lint (CLI)** — `memex lint --json` emits a structured report covering:

- orphan pages (no inbound links)
- broken / unresolved `[[references]]`
- missing-frontmatter (required fields absent or invalid)

**Semantic lint (Agent)** — consume the JSON report above as a starting point, then scan the full wiki for:

1. **Contradictions between pages** — same entity / event / data point making conflicting claims across pages
2. **Stale claims** — older pages superseded by newer sources but not yet revised
3. **Missing cross-references** — semantically related pages that should `[[link]]` to each other but don't
4. **Concepts mentioned but lacking their own page** — terms cited frequently in body text without a dedicated `entity` or `concept` page
5. **Data gaps fillable by web search** — pages where a missing fact could be filled by fetching a new source
6. **Suggested new questions / sources** — directions the current wiki implies are worth ingesting next

Output of the semantic pass can be either direct repairs (edit affected pages) or a new task page filed back into the wiki (e.g. `summaries/lint-report-YYYY-MM-DD.md`). Treat lint as a wiki-improvement workflow, not just a validator.

## Page Format

Use frontmatter on all wiki pages. See templates for examples.

## Link Syntax

Use `[[page-name]]` for internal links.

## Naming Convention

- Files: kebab-case (e.g., `frontend-engineering-management.md`)
- Links: match filename without extension
