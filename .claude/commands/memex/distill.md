# memex distill

Distill the current or a past session into a structured raw wiki document.

## Usage

`/memex:distill [input] [--role <role>]`

## Examples

- `/memex:distill                              # distill current session`
- `/memex:distill --role backend-engineer      # extract role-specific best practices`
- `/memex:distill session.jsonl                # distill a saved session file`

## Instructions

Use the installed `ai-memex` skill.

- Workflow: Distill
- Reference: `references/distill-workflow.md`
- User arguments: `$ARGS`
- Current agent: `claude-code`
- CLI hint: If no input is provided, use `memex distill --latest --agent <current-agent>` to capture the current agent session.

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call `memex` CLI primitives only when useful.
