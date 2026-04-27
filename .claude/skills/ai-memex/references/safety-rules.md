# Safety Rules

Use this reference for destructive, ambiguous, broad, or automation-heavy memex workflows.

## Hard Rules

- Do not delete raw source material without explicit user confirmation.
- Do not delete wiki pages without explicit user confirmation.
- Do not silently rewrite large wiki sections.
- Do not flatten contradictions into a single "correct" answer without evidence.
- Do not invent citations.
- Do not enable background automation unless the user explicitly asks.
- Do not modify agent configuration files outside the vault without confirmation.

## Source Truth

`raw/` is evidence. Treat it as append-only by default.

Allowed without confirmation:

- create new raw files from user-provided material
- read raw files
- cite raw files

Requires confirmation:

- edit raw files
- delete raw files
- replace raw files
- normalize fetched raw content in a way that removes detail

## Semantic Edits

Prefer targeted edits:

- add a section
- add a citation
- mark a contradiction
- update a stale paragraph
- add a summary with explicit source links

Avoid broad rewrites unless the page is small or the user asked for consolidation.

## Contradictions

When sources disagree:

1. Keep both claims.
2. Cite both sources.
3. Note date, context, or scope differences.
4. Mark unresolved uncertainty if needed.

Do not choose a winner unless the evidence clearly supports it or the user decides.

## Automation

Background or repeated workflows can burn agent time and make broad changes.

Ask before:

- `memex watch --daemon --heal`
- repeated ingest/repair loops
- bulk page rewrites
- generated instruction overwrite

## Sensitive Data

Before distilling sessions or capturing local files:

- avoid copying secrets, tokens, credentials, private keys, or personal data
- summarize sensitive context instead of storing raw values
- ask if the user explicitly provided material that looks confidential

## Confirmation Wording

When asking, be concrete:

```text
This will merge `wiki/research/concepts/a.md` into `wiki/research/concepts/b.md` and remove the old page. Should I proceed?
```

Avoid vague confirmations like "Should I clean it up?"

