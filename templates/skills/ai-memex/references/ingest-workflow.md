# Ingest Workflow

Use this reference when converting raw material into durable wiki pages.

## Goal

Integrate source material into `wiki/` so knowledge compounds across sessions. Preserve citations and contradictions.

## Inputs

- raw files under `raw/`
- existing wiki pages
- `AGENTS.md` schema rules
- `index.md`
- `log.md`

## Steps

1. Identify target material:
   - user-provided path, scene, or natural language target
   - if unclear, inspect `memex status` and ask only if needed
2. Read the relevant raw material.
3. Search for existing related pages:
   ```bash
   memex search "<topic>"
   ```
4. Decide for each knowledge unit:
   - update an existing page
   - create a new entity, concept, source, or summary page
   - record a contradiction or unresolved question
5. Write wiki updates with citations to raw files or source pages.
6. Update `index.md` for navigation changes.
7. Append a short dated entry to `log.md`.
8. Run or recommend:
   ```bash
   memex lint
   ```

## Create Vs Update

Create a new page when:

- no existing page covers the concept/entity
- the source introduces a durable new topic
- the topic will likely be queried again

Update an existing page when:

- the source expands known information
- the page already represents the same concept/entity
- a summary needs a new comparison or caveat

Ask before merging when:

- names are similar but identity is uncertain
- two pages conflict on core meaning
- merging would remove useful distinctions

## Citation Rules

- Every new factual claim should trace to a raw file or existing wiki page.
- If a claim is synthesized from multiple sources, cite all important sources.
- If sources conflict, preserve the conflict instead of flattening it.
- If a statement is an inference, label it as an inference.

## Page Update Rules

- Preserve useful existing content.
- Prefer small, targeted edits over full rewrites.
- Keep page titles stable unless the user approves a rename.
- Do not delete old claims just because a newer source disagrees; mark the relationship.
- Update `updated` frontmatter when the page materially changes.

## Log Entry

Use a short factual entry:

```markdown
- 2026-04-24: Ingested `raw/research/example.md`; updated [[Example Concept]] and added [[Example Source]].
```

## Completion

Report:

- raw files consumed
- wiki pages created or updated
- unresolved contradictions or questions
- lint/link-check status if run

