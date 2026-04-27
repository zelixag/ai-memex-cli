# memex log

Append a log entry to the vault activity log.

## Usage

`/memex:log <action> [--note <text>]`

## Examples

- `/memex:log ingest --target "react-hooks" --note "added from docs"`
- `/memex:log decision --note "chose Zustand over Redux for simplicity"`

## Instructions

Current memex agent: `claude-code`

When calling a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Run the following shell command, substituting `$ARGS` with any arguments
the user provided after `/memex:log`:

```bash
memex log $ARGS
```

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
