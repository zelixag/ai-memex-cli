# AGENTS.md — Research Knowledge Base Schema

This file defines the structure, conventions, and workflows for this research knowledge base.
It is the operating manual for any LLM agent working with this wiki.

## Knowledge Base Identity

- **Name**: {{KB_NAME}}
- **Type**: Research
- **Created**: {{DATE}}
- **Purpose**: {{PURPOSE}}

## Directory Structure

```
.
├── AGENTS.md              # This file — schema and conventions
├── wiki/
│   ├── index.md           # Master index
│   ├── log.md             # Operation log
│   ├── papers/            # Paper summaries and notes
│   ├── concepts/          # Key concepts and definitions
│   ├── authors/           # Author profiles and research areas
│   └── syntheses/         # Cross-paper analyses and literature reviews
└── sources/               # Raw papers, PDFs converted to markdown
```

## Page Conventions

Every wiki page MUST begin with YAML frontmatter:

```yaml
---
title: "Page Title"
tags: [concept, paper, author, synthesis]
summary: "One-sentence summary"
sources: []
updated: "YYYY-MM-DD"
year: 2024          # for papers
venue: "NeurIPS"    # for papers
authors: []         # for papers
---
```

Use `[[Page Name]]` for internal wiki links.
Use `> **Key Finding**: ...` for important findings.
Use `> **Limitation**: ...` for limitations.
Use `> **Open Question**: ...` for unresolved questions.

## Ingest Workflow

When a new paper or article is added:
1. Write a summary page in `wiki/papers/`
2. Update or create concept pages for key ideas
3. Update author pages if applicable
4. Note agreements/disagreements with existing papers
5. Update `wiki/index.md` and append to `wiki/log.md`

## Query Workflow

When answering research questions:
1. Check `wiki/syntheses/` for existing analyses
2. Read relevant paper summaries and concept pages
3. Synthesize with proper citations: [[papers/paper-title]]
4. Save valuable syntheses as new pages

## Lint Checklist

- Papers with no links to concept pages
- Concepts mentioned in papers but lacking their own page
- Conflicting findings between papers (flag for human review)
- Missing author pages for frequently cited researchers
- Outdated syntheses that predate newer papers
