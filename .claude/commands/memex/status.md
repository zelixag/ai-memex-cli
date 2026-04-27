# memex status

Show vault overview: page count, scenes, recent activity.

## Usage

`/memex:status`

## Examples

- `/memex:status`

## Instructions

Use the installed `ai-memex` skill.

- Workflow: Status
- Reference: `references/vault-protocol.md`
- User arguments: `$ARGS`
- Current agent: `claude-code`
- CLI hint: Run `memex status`, then summarize the vault state and likely next step.

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call `memex` CLI primitives only when useful.
