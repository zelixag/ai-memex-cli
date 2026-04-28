# Lint Workflow

Use this reference when the user asks to lint, health-check, repair, or clean up a memex wiki. Lint is the periodic wiki-improvement pass — both layers run inside the `memex lint --with-semantic` command; the outer agent should not redo semantic work in the user's session.

## Goal

Run the two-layer health check via `memex lint --with-semantic`, then summarize what changed and what is still open.

## Two layers — both handled by the CLI

The CLI runs both passes; you just invoke it.

**Mechanical pass (CLI, deterministic)**:

- orphan pages
- broken `[[wikilinks]]`
- missing or invalid frontmatter

**Semantic pass (sub-agent spawned by the CLI)** — the CLI spawns a sub-agent with `cwd = vault` and inlines the live `AGENTS.md` schema plus the mechanical report into its prompt. The sub-agent scans for:

1. Contradictions between pages
2. Stale claims superseded by newer sources
3. Missing cross-references between related pages
4. Concepts mentioned without their own page
5. Data gaps fillable by web search
6. Suggested new questions / sources
7. Cross-scene duplicate entities / concepts that should be consolidated

The sub-agent applies safe fixes directly and files unresolved findings as a wiki page (e.g. `overviews/lint-report-YYYY-MM-DD.md`, `type: overview`). It also appends to `log.md`.

## Why the sub-agent runs semantic, not you

The semantic pass needs the **live** vault schema to detect schema-bound issues (correct page types, scene rules, frontmatter requirements, cross-scene duplicate detection). Sub-agents launched by the CLI get that schema inlined automatically; the outer agent in the user's session does not. Running semantic in the outer agent risks acting on a stale schema snapshot. See the **Management vs Use** section of `SKILL.md`.

## Steps

1. Run the lint command:
   ```bash
   memex lint --with-semantic
   # add --scene <name> to scope, or --dry-run to preview the prompt
   ```
2. The CLI streams sub-agent output into your session. Watch for:
   - mechanical issue counts
   - "Semantic lint complete" line
   - any `lint-report-*.md` page filed
3. After it finishes, summarize for the user:
   - mechanical issues found / fixed
   - semantic findings handled by the sub-agent
   - the path of any `lint-report-*.md` filed (so the user can review)
   - whether any user decisions are pending
4. If the user wants to act on a pending finding, then read the lint report page and discuss in the current session — that is *use* work and belongs in the outer agent.

## When to use a different mode

- `memex lint` (no flag) — mechanical only, fast pre-flight check before a large operation.
- `memex lint --json` — mechanical JSON for tooling / scripts; semantic is skipped.
- `memex lint --with-semantic --dry-run` — print the semantic prompt without spawning the sub-agent (useful when debugging the prompt or schema).

## Completion checklist

- `memex lint --with-semantic` exited cleanly
- summarized mechanical + semantic findings to the user
- pointed the user at any `lint-report-*.md` filed by the sub-agent
- `log.md` updated (the sub-agent appends; verify if uncertain)
