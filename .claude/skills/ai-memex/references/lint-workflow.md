# Lint Workflow

Use this reference when the user asks to lint, health-check, repair, or clean up a memex wiki. Lint is the periodic wiki-improvement pass — diagnose problems, apply safe mechanical fixes, surface semantic findings for review, and file unresolved work back into the wiki so the system keeps compounding.

## Goal

Run a two-layer health check (mechanical first, semantic second), apply safe fixes, ask before risky ones, and turn anything left over into a durable wiki page so it can be addressed on the next ingest cycle.

## Two layers

**Mechanical (CLI)** — deterministic, fast, no judgment required:

```bash
memex lint --json          # orphan / broken-link / missing-frontmatter
memex link-check           # detailed [[ref]] resolution
```

The JSON report is the input to the semantic pass.

**Semantic (Agent)** — needs reading and judgment. After ingesting the mechanical report, scan the wiki for:

1. **Contradictions between pages** — same entity / event / data point making conflicting claims
2. **Stale claims** — older pages superseded by newer sources but not yet revised
3. **Missing cross-references** — semantically related pages that should `[[link]]` to each other but don't
4. **Concepts mentioned but lacking their own page** — terms cited frequently in body text without a dedicated `entity` or `concept` page
5. **Data gaps fillable by web search** — pages where a missing fact could be filled by fetching a new source (`memex fetch`)
6. **Suggested new questions / sources** — directions the current wiki implies are worth ingesting next

## Steps

1. Run `memex lint --json` and (when link health matters) `memex link-check`. Read the structured report.
2. Read `index.md` plus a representative sample of pages relevant to the user's scope (or the whole wiki for periodic full passes).
3. Classify findings into three buckets: safe mechanical fix, requires review, report only.
4. Apply safe mechanical fixes directly.
5. Ask the user before applying anything in "requires review".
6. File anything in "report only" — and any unresolved findings — into a new page: `summaries/lint-report-YYYY-MM-DD.md` with durable observations and suggested actions. Treat lint output as compounding wiki content, not as throwaway shell output.
7. Re-run `memex lint` after edits to confirm the mechanical layer is clean.
8. Append a `log.md` entry summarizing what changed and what remains open (`## [YYYY-MM-DD] lint | <scope>` is a good prefix).

## Safe Mechanical Fixes

Usually OK to apply directly:

- add missing required frontmatter when values are obvious from filename / path / content
- fix broken `[[wikilinks]]` caused by clear filename or title drift
- update the `updated` date after a page edit
- add missing `index.md` entries for existing pages
- normalize obvious path separators in `sources` lists

Still verify with a re-run of `memex lint` after editing.

## Requires Review

Ask the user before:

- deleting orphan pages
- merging duplicate-looking pages
- resolving contradictory claims
- rewriting large summaries
- changing a page's `type` or `subtype`
- moving pages across scenes
- adding cross-references that imply a non-trivial conceptual claim

## Report Only

File as a finding without editing when:

- a needed source is missing from `raw/`
- a claim lacks evidence and no source is currently available
- a contradiction needs domain judgment beyond the wiki
- a page appears stale but no newer source is present
- a concept needs its own page but the writeup requires further input from the user

## Treat lint as a workflow, not a validator

The point is not just to find problems — it is to compound the wiki:

- Direct edits when safe → wiki gets healthier in place
- A `lint-report-*` page when not safe → next ingest cycle has clear work to do
- A `log.md` entry → timeline of what got fixed when

## Completion checklist

- mechanical lint clean (or remaining issues filed)
- safe fixes applied
- semantic findings either fixed or filed
- `log.md` entry appended
- user told what is still open
