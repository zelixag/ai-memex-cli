# Query Workflow

Use this reference when the user asks what the memex knows or asks for synthesis from existing wiki knowledge.

## Goal

Answer from the durable wiki with citations. Do not write files unless the user asks to save or archive the answer.

## Steps

1. Convert the user question into search terms.
2. Run search when useful:
   ```bash
   memex search "<question or topic>"
   ```
3. Read the most relevant wiki pages.
4. Follow wikilinks when needed to understand context.
5. Answer with citations to wiki files.
6. Distinguish:
   - known facts from the wiki
   - source-backed synthesis
   - inference
   - unknown or missing knowledge

## Answer Style

Use concise synthesis first. Then cite the supporting pages.

Good pattern:

```markdown
Short answer...

Sources: `wiki/research/concepts/example.md`, `wiki/research/sources/source-a.md`
```

If the wiki lacks enough evidence, say that and suggest capture or ingest.

## When To Write Files

Do not write during normal query.

Write only when the user asks to:

- save this answer
- archive this synthesis
- turn this into a summary page
- update the wiki based on this discussion

If writing, switch to the ingest or distill workflow as appropriate.

## Do Not

- answer from memory when the wiki should be consulted
- invent citations
- overstate confidence when pages disagree
- silently update wiki pages during query

## Completion

Finish with:

- answer
- cited wiki pages
- missing knowledge or recommended next capture, if relevant

