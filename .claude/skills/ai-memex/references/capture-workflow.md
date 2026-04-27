# Capture Workflow

Use this reference when the user wants to save a URL, search query, file, pasted text, or other source material into the memex raw layer.

## Goal

Capture source material into `raw/` with enough metadata for later ingest. Do not compile it into wiki pages unless the user also asks to ingest.

## Steps

1. Determine input type:
   - URL
   - sitemap
   - keyword query
   - local file
   - pasted text
2. Determine scene:
   - use the user's explicit scene if provided
   - otherwise default to `research`
3. Capture the source:
   - for URLs, sitemaps, and keyword queries, prefer `memex fetch`
   - for local files or pasted text, create a raw markdown file if no CLI primitive fits
4. Preserve provenance:
   - original URL or path
   - capture date
   - source title when known
   - user-provided context
5. Report where the raw material was saved.

## CLI Commands

URL:

```bash
memex fetch <url> --scene <scene>
```

Sitemap:

```bash
memex fetch <sitemap-url> --sitemap --scene <scene>
```

Keyword query:

```bash
memex fetch "<query>" --scene <scene>
```

Use `--yes` only when the user explicitly wants automatic selection.

## Raw File Metadata

For manually created raw files, use frontmatter like:

```yaml
---
title: Source Title
source-type: note
source-url: https://example.com
captured: 2026-04-24
scene: research
---
```

Use `source-type` values such as:

- `web`
- `sitemap`
- `search-result`
- `file`
- `note`
- `session`

## Do Not

- rewrite source claims during capture
- summarize away important details unless the user asked for a note rather than a source
- ingest automatically unless requested
- hide failed fetches
- overwrite existing raw files without confirmation

## Output

Finish with:

- captured source count
- raw path or paths
- whether ingest is the recommended next step

