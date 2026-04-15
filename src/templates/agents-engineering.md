# AGENTS.md — Engineering Knowledge Base Schema

This file defines the structure, conventions, and workflows for this engineering knowledge base.
It is the operating manual for AI agents (Claude Code, Cursor, etc.) working with this wiki.

## Knowledge Base Identity

- **Name**: {{KB_NAME}}
- **Type**: Engineering / Software Development
- **Created**: {{DATE}}
- **Purpose**: {{PURPOSE}}

## Directory Structure

```
.
├── AGENTS.md              # This file — schema and conventions
├── wiki/
│   ├── index.md           # Master index
│   ├── log.md             # Operation log
│   ├── architecture/      # System design, ADRs, diagrams
│   ├── best-practices/    # Role-specific best practices
│   ├── patterns/          # Design patterns and code patterns
│   ├── decisions/         # Architecture Decision Records (ADRs)
│   ├── runbooks/          # Operational runbooks and procedures
│   ├── tech-radar/        # Technology assessments
│   └── onboarding/        # Onboarding guides per role
└── sources/               # Raw docs: RFCs, meeting notes, PRs, etc.
```

## Page Conventions

Every wiki page MUST begin with YAML frontmatter:

```yaml
---
title: "Page Title"
tags: [backend, frontend, devops, architecture, pattern, decision]
role: [backend-engineer, frontend-engineer, tech-lead]
summary: "One-sentence summary"
sources: []
updated: "YYYY-MM-DD"
status: active | deprecated | draft
---
```

Use `[[Page Name]]` for internal wiki links.
Use `> **Decision**: ...` blockquotes for key decisions.
Use `> **Best Practice**: ...` blockquotes for best practices.

## Ingest Workflow

When a new source is added (RFC, meeting notes, PR description, etc.):
1. Identify the domain: architecture, pattern, decision, runbook, or best practice
2. Extract key decisions, patterns, and lessons learned
3. Write or update relevant pages
4. If it's a decision, create an ADR page in `wiki/decisions/`
5. Update role-specific best-practice pages if applicable
6. Update `wiki/index.md` and append to `wiki/log.md`

## Role-Based Context

This KB supports context generation for specific engineering roles:
- `backend-engineer`: Focus on API design, data models, service patterns, performance
- `frontend-engineer`: Focus on component patterns, state management, UX decisions
- `tech-lead`: Focus on architecture decisions, team conventions, ADRs
- `devops`: Focus on deployment, monitoring, incident runbooks
- `full-stack`: Comprehensive view across all domains

## Query Workflow

When answering engineering questions:
1. Read `wiki/index.md` to find relevant pages
2. Prioritize architecture and decision pages
3. Cite specific decisions with `[[decisions/ADR-XXX]]`
4. Include code examples where relevant

## Lint Checklist

- ADRs without a clear status (active/deprecated/superseded)
- Best-practice pages that contradict each other
- Runbooks referencing deprecated tools or services
- Patterns with no usage examples
- Onboarding guides that are out of date
