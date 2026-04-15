# AGENTS.md — Knowledge Base Schema

This file defines the structure, conventions, and workflows for this knowledge base.
It is the operating manual for any LLM agent working with this wiki.

## Knowledge Base Identity

- **Name**: {{KB_NAME}}
- **Type**: General
- **Created**: {{DATE}}
- **Purpose**: {{PURPOSE}}

## Directory Structure

```
.
├── AGENTS.md          # This file — schema and conventions
├── wiki/              # LLM-maintained wiki pages
│   ├── index.md       # Master index of all pages
│   ├── log.md         # Append-only operation log
│   ├── concepts/      # Concept and topic pages
│   ├── entities/      # People, organizations, products
│   └── syntheses/     # Cross-cutting analyses and comparisons
└── sources/           # Immutable raw source documents
```

## Page Conventions

Every wiki page MUST begin with YAML frontmatter:

```yaml
---
title: "Page Title"
tags: [tag1, tag2]
summary: "One-sentence summary for the index"
sources: [source-file-1.md, source-file-2.md]
updated: "YYYY-MM-DD"
---
```

Use `[[Page Name]]` for internal wiki links.

## Ingest Workflow

When a new source is added:
1. Read the source carefully
2. Extract key entities, concepts, and claims
3. Write or update entity/concept pages in `wiki/`
4. Update `wiki/index.md` with new/changed pages
5. Append an entry to `wiki/log.md`
6. Note any contradictions with existing pages

## Query Workflow

When answering a question:
1. Read `wiki/index.md` to identify relevant pages
2. Read the relevant pages
3. Synthesize an answer with `[[page]]` citations
4. If the answer is valuable, save it as a new wiki page

## Lint Checklist

During a lint pass, check for:
- Pages with no inbound `[[links]]` (orphans)
- Claims contradicted by newer sources
- Concepts mentioned but lacking their own page
- Stale summaries that no longer reflect page content
- Missing cross-references between related pages
