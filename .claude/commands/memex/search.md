# memex search

Search the wiki and raw knowledge base.

## Usage

`/memex:search <query>`

## Examples

- `/memex:search "React hooks"`
- `/memex:search "deployment best practices" --scene team`

## Instructions

Current memex agent: `claude-code`

When calling a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Run the following shell command, substituting `$ARGS` with any arguments
the user provided after `/memex:search`:

```bash
memex search $ARGS
```

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
