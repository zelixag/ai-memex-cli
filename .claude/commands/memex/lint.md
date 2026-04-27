# memex lint

Two-layer wiki health check: CLI mechanical pass (orphans, broken links, frontmatter) plus agent-driven semantic pass (contradictions, stale claims, missing cross-references, concepts without pages, data gaps, suggested next sources). Apply safe fixes directly, file unresolved findings as a wiki page.

## Usage

`/memex:lint [--scene <scene>] [--json]`

## Examples

- `/memex:lint`
- `/memex:lint --scene team`
- `/memex:lint --json`

## Instructions

Use the installed `ai-memex` skill.

- Workflow: Lint
- Reference: `references/lint-workflow.md`
- User arguments: `$ARGS`
- Current agent: `claude-code`
- CLI hint: Start with `memex lint --json` for the mechanical baseline, then scan the wiki for the 6 semantic categories. File anything unresolved to `summaries/lint-report-YYYY-MM-DD.md` and append `log.md`.

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call `memex` CLI primitives only when useful.
