# Distill Workflow

Use this reference when the user wants to save a conversation, debugging session, planning session, or lesson learned into memex.

## Goal

Convert useful agent sessions into raw material under `raw/<scene>/sessions/`, then optionally ingest that material into wiki pages.

## Steps

1. Identify the session:
   - current conversation
   - latest session
   - explicit file path
   - agent-specific session store
2. Decide whether mechanical parsing is useful:
   ```bash
   memex distill --latest --agent <current-agent>
   memex distill --agent <current-agent>
   memex distill <path> --agent <current-agent>
   ```
   For slash prompts such as `/memex:distill`, prefer
   `memex distill --latest --agent <current-agent>` when no explicit input is
   provided so the current agent's own session store is used instead of the
   fallback agent.
3. Save distilled material under `raw/<scene>/sessions/`.
4. Preserve:
   - date
   - source agent when known
   - project or topic
   - decisions
   - durable lessons
   - unresolved follow-ups
5. Ask whether to ingest immediately when the session contains durable knowledge.

## What To Keep

Keep:

- decisions and rationale
- debugging findings
- architecture tradeoffs
- reusable procedures
- user preferences
- links to changed files or source material

Drop or compress:

- repetitive tool output
- transient mistakes that teach nothing
- long logs already available elsewhere
- social filler

## Raw Session Format

Use frontmatter like:

```yaml
---
title: Session Title
source-type: session
agent: codex
scene: team
captured: 2026-04-24
---
```

Suggested sections:

```markdown
# Session Title

## Context

## Decisions

## Durable Lessons

## Files Or Sources

## Follow-Ups
```

## Do Not

- ingest every session automatically
- preserve sensitive secrets
- treat speculative ideas as decisions
- overwrite an existing distilled session without confirmation

## Completion

Report:

- session source
- raw session path
- whether immediate ingest is recommended
- important follow-ups
