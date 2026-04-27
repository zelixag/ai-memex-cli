# memex new

Scaffold a new wiki page with correct frontmatter.

## Usage

`/memex:new <type> <name> [--scene <scene>]`

## Examples

- `/memex:new concept "React Server Components" --scene research`
- `/memex:new entity "TypeScript" --scene personal`

## Instructions

Current memex agent: `claude-code`

When calling a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Run the following shell command, substituting `$ARGS` with any arguments
the user provided after `/memex:new`:

```bash
memex new $ARGS
```

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
