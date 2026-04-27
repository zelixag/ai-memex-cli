# memex fetch

Fetch web content or documentation into the raw/ directory.

## Usage

`/memex:fetch <url> [options]`

## Examples

- `/memex:fetch https://react.dev/reference/react/hooks`
- `/memex:fetch https://docs.anthropic.com --depth 2`
- `/memex:fetch https://nextjs.org/sitemap.xml --sitemap`

## Instructions

Current memex agent: `claude-code`

When calling a memex CLI command that delegates semantic work to an agent, pass `--agent claude-code` unless the user already provided an explicit `--agent`.

Run the following shell command, substituting `$ARGS` with any arguments
the user provided after `/memex:fetch`:

```bash
memex fetch $ARGS
```

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
