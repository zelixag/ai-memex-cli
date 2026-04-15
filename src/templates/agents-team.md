# AGENTS.md — Team Knowledge Base Schema

This file defines the structure, conventions, and workflows for this team knowledge base.
It is the operating manual for any LLM agent working with this wiki.

## Knowledge Base Identity

- **Name**: {{KB_NAME}}
- **Type**: Team
- **Created**: {{DATE}}
- **Purpose**: {{PURPOSE}}

## Directory Structure

```
.
├── AGENTS.md              # This file — schema and conventions
├── wiki/
│   ├── index.md           # Master index
│   ├── log.md             # Operation log
│   ├── decisions/         # Team decisions and rationale
│   ├── processes/         # Team processes and workflows
│   ├── meetings/          # Meeting notes and action items
│   └── people/            # Team member profiles and expertise
└── sources/               # Raw meeting transcripts, Slack exports, docs
```

## Page Conventions

Every wiki page MUST begin with YAML frontmatter:

```yaml
---
title: "Page Title"
tags: [decision, process, meeting, people]
summary: "One-sentence summary"
sources: []
updated: "YYYY-MM-DD"
status: active | archived | draft
participants: []   # for meetings
owner: ""          # for processes
---
```

Use `[[Page Name]]` for internal wiki links.
Use `> **Decision**: ...` for team decisions.
Use `> **Action Item**: ...` for action items.
Use `> **Open Question**: ...` for unresolved questions.

## Ingest Workflow

When a new source is added (meeting notes, Slack thread, etc.):
1. Extract decisions, action items, and open questions
2. Update relevant process or decision pages
3. Write a meeting summary if applicable
4. Update people pages with new expertise/responsibilities
5. Update `wiki/index.md` and append to `wiki/log.md`

## Query Workflow

When answering team questions:
1. Check `wiki/decisions/` for relevant decisions
2. Check `wiki/processes/` for relevant workflows
3. Synthesize with citations to specific meeting notes
4. Note if information might be outdated

## Lint Checklist

- Decisions without clear rationale
- Action items without owners or deadlines
- Processes that reference deprecated tools
- Meeting notes older than 6 months that may be stale
- People pages that are out of date
