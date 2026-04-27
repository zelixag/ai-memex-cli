# memex inject

Output relevant wiki context for the current task (saves tokens, improves precision).

## Usage

`/memex:inject [--task <description>] [--keywords <kw>]`

## Examples

- `/memex:inject --task "implement authentication"`
- `/memex:inject --keywords "react,typescript,hooks"`

## Instructions

Current memex agent: `claude-code`

When calling a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Run the following shell command, substituting `$ARGS` with any arguments
the user provided after `/memex:inject`:

```bash
memex inject $ARGS
```

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
