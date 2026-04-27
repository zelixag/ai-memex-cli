# memex capture

Capture URLs, files, pasted text, or search results into the memex raw layer.

## Usage

`/memex:capture <url|file|text|query>`

## Examples

- `/memex:capture https://react.dev/reference/react/hooks`
- `/memex:capture "agent memory design tradeoffs"`
- `/memex:capture ./notes/architecture.md`

## Instructions

Use the installed `ai-memex` skill.

- Workflow: Capture
- Reference: `references/capture-workflow.md`
- User arguments: `$ARGS`
- Current agent: `claude-code`
- CLI hint: Use `memex fetch` when the input is a URL, sitemap, or keyword query.

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call `memex` CLI primitives only when useful.
