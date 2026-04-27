# memex help

Show all available memex knowledge base commands.

## Action

```bash
memex --help
```

## Recommended agent-native workflows

- `/memex:capture` — capture sources into raw/
- `/memex:ingest` — compile raw material into wiki pages
- `/memex:query` — answer from the durable wiki
- `/memex:distill` — save useful conversations as raw session material
- `/memex:lint` — health-check the wiki (mechanical + semantic)
- `/memex:status` — inspect vault state

## Compatible CLI shortcuts

- `/memex:capture` — Capture URLs, files, pasted text, or search results into the memex raw layer.
- `/memex:ingest` — Ingest raw content into wiki pages. Delegates semantic processing to the AI agent.
- `/memex:fetch` — Fetch web content or documentation into the raw/ directory.
- `/memex:distill` — Distill the current or a past session into a structured raw wiki document.
- `/memex:search` — Search the wiki and raw knowledge base.
- `/memex:query` — Answer from the durable memex wiki using the ai-memex query workflow.
- `/memex:status` — Show vault overview: page count, scenes, recent activity.
- `/memex:new` — Scaffold a new wiki page with correct frontmatter.
- `/memex:lint` — Two-layer wiki health check: CLI mechanical pass (orphans, broken links, frontmatter) plus agent-driven semantic pass (contradictions, stale claims, missing cross-references, concepts without pages, data gaps, suggested next sources). Apply safe fixes directly, file unresolved findings as a wiki page.
- `/memex:inject` — Output relevant wiki context for the current task (saves tokens, improves precision).
- `/memex:log` — Append a log entry to the vault activity log.

## Quick start

```
/memex:status                                # see what's in the knowledge base
/memex:capture https://docs.example.com      # capture documentation
/memex:ingest                                # process raw files into wiki pages
/memex:query "topic"                         # answer from durable wiki knowledge
/memex:distill                               # distill useful session knowledge
/memex:lint                                  # health-check (mechanical + semantic)
```
