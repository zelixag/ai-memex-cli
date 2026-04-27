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

- **Scenes** (OPEN set, kebab-case): `personal` / `research` / `reading` / `team` are the seeded starters. Add any domain-specific scene as needed: `competitive-analysis`, `trip-planning`, `course-notes`, `hobby-photography`, etc. Just `mkdir wiki/<your-scene>/` and start filing pages with `scene: <your-scene>` in frontmatter. The CLI validates kebab-case format only — it does not gatekeep the value set.
- **Types** (each maps to its own directory under `wiki/<scene>/`):
  - `entity` — people, companies, tools, projects (`entities/`)
  - `concept` — methodologies, design patterns, abstractions (`concepts/`)
  - `source` — articles, papers, web pages, session distillations (`sources/`)
  - `comparison` — side-by-side analysis of 2+ entities/concepts (`comparisons/`)
  - `overview` — broad survey of a topic, area, or vault state (`overviews/`)
  - `synthesis` — derived insights, theses, or non-trivial connections (`syntheses/`)

The 3 synthetic types (comparison / overview / synthesis) replace the older single `summary` + `subtype` field. Each is a parallel first-class type with its own directory.

## Workflows

### Ingest

When running `memex ingest <raw-file>`:

1. Read the raw source file
2. **Discuss the key takeaways with the user before writing anything** — confirm what is worth integrating, what is duplicative, and what should be skipped. Ingest is collaborative, not auto-pilot.
3. Identify the appropriate scene and type
4. Create or update entity/concept/source pages in `wiki/<scene>/`. **A single source typically touches 10–15 wiki pages** (one source page plus updates to many existing entity/concept/summary pages); don't stop at writing a single source page.
5. **When new claims contradict existing wiki content, explicitly note the contradiction** (e.g. quote both sides, link the conflicting pages, mark which source is newer) rather than silently overwriting. Preserving contradictions is how the wiki compounds honestly over time.
6. If summary-worthy, create a `summary` page
7. Update `index.md` with new page entries
8. Append to `log.md`: `## [YYYY-MM-DD] ingest | <source-name>`
9. Do NOT modify `raw/` files

### Query

When answering questions:

1. Read `index.md` to find relevant pages
2. Drill into relevant pages
3. Synthesize answer with `[[page]]` citations. The answer is not limited to plain markdown — pick whichever shape best fits the question:
   - markdown page (default)
   - comparison table (when contrasting 2+ entities/concepts)
   - Marp slide deck (when the answer benefits from sequencing)
   - matplotlib / chart code (when the answer is quantitative)
   - canvas / diagram (when the answer is structural)
4. **File the answer back as a new wiki page when it is durable** — pick the right type and directory: comparisons → `comparisons/<topic>.md`, broad surveys → `overviews/<topic>.md`, derived insights/theses → `syntheses/<topic>.md`. Don't let durable Q&A pairs disappear into chat history.

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

Output of the semantic pass can be either direct repairs (edit affected pages) or a new task page filed back into the wiki (e.g. `overviews/lint-report-YYYY-MM-DD.md` with `type: overview`). Treat lint as a wiki-improvement workflow, not just a validator.

## Page Format

Use frontmatter on all wiki pages. See templates for examples.

## Link Syntax

Use `[[page-name]]` for internal links.

## Naming Convention

- Files: kebab-case (e.g., `frontend-engineering-management.md`)
- Links: match filename without extension
