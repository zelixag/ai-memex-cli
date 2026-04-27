# memex ingest

Ingest raw content into wiki pages. Delegates semantic processing to the AI agent.

## Usage

`/memex:ingest [target]`

## Examples

- `/memex:ingest                        # ingest all raw/ files`
- `/memex:ingest raw/personal           # ingest personal scene only`
- `/memex:ingest "notes about React"    # natural language target`

## Instructions

Use the installed `ai-memex` skill.

- Workflow: Ingest
- Reference: `references/ingest-workflow.md`
- User arguments: `$ARGS`
- Current agent: `claude-code`
- CLI hint: Use `memex search` to find related pages and `memex lint` after substantial edits.

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call `memex` CLI primitives only when useful.
