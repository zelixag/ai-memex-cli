# memex query

Answer from the durable memex wiki using the ai-memex query workflow.

## Usage

`/memex:query <question>`

## Examples

- `/memex:query "what do I know about agent memory tradeoffs?"`
- `/memex:query "how did we decide CLI vs skill boundaries?"`

## Instructions

Use the installed `ai-memex` skill.

- Workflow: Query
- Reference: `references/query-workflow.md`
- User arguments: `$ARGS`
- Current agent: `claude-code`
- CLI hint: Use `memex search` to narrow candidate wiki pages, then answer with citations.

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call `memex` CLI primitives only when useful.
