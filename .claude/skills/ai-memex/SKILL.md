---
name: ai-memex
description: >-
  Maintain an agent-native LLM wiki / AI memex using raw sources, durable
  Markdown wiki pages, citations, two-layer lint (mechanical + semantic),
  session distillation, and the memex CLI toolbox. Use when the user asks to
  capture sources, ingest material into raw/ or wiki/, query "what do I know
  about...", distill conversations, lint or health-check a wiki, or work with
  Karpathy-style LLM wiki / agent memory / compounding knowledge workflows.
  Also use when the user invokes memex slash prompts such as /memex:capture,
  /memex:ingest, /memex:query, /memex:distill, /memex:lint, or /memex:status.
---

# ai-memex

Core rule: preserve source truth and make knowledge compound. Never blur raw source material, citations, contradictions, or operation history.

This skill makes the agent the main interface for maintaining an LLM wiki. Use the `memex` CLI as a deterministic toolbox, not as the source of semantic judgment.

## Workflow Selector

| User intent | Workflow | Reference |
| --- | --- | --- |
| Save a URL, file, text, or search result | Capture | `references/capture-workflow.md` |
| Turn raw material into wiki pages | Ingest | `references/ingest-workflow.md` |
| Ask what the wiki knows | Query | `references/query-workflow.md` |
| Save a useful conversation or debugging session | Distill | `references/distill-workflow.md` |
| Health-check the wiki, fix or surface semantic issues | Lint | `references/lint-workflow.md` |
| Unsure about vault layout or page format | Protocol | `references/vault-protocol.md` |
| Any destructive, ambiguous, or broad rewrite | Safety | `references/safety-rules.md` |

## Default Loop

1. Identify the user's workflow from the selector.
2. Run `memex status` when the vault location or current state is unclear.
3. Load only the reference files needed for the workflow.
4. Use CLI commands for deterministic operations: `status`, `fetch`, `search`, `lint`, `link-check`, and mechanical `distill`.
5. Use agent judgment for semantic work: merging knowledge, writing wiki pages, preserving citations, handling contradictions, and updating `index.md` / `log.md`.
6. Run or recommend `memex lint` after substantial wiki edits.

## CLI Use Policy

Allowed without extra confirmation:

- `memex status`
- `memex search <query>`
- `memex lint`
- `memex link-check`
- `memex fetch <url|query>` for user-requested capture
- `memex distill` for user-requested session capture

Avoid unless the user explicitly asks:

- `memex watch --daemon --heal`
- broad install/update/config changes
- commands that overwrite generated agent instructions

## Safety Gates

Ask before:

- deleting wiki or raw files
- rewriting large existing wiki sections
- merging pages when the match is uncertain
- auto-fixing factual contradictions
- enabling background automation
- modifying agent configuration outside the vault

Do not ask before:

- reading files
- running status/search/lint/link-check
- creating a new raw source from user-provided material
- adding a log entry for an operation just performed

## Pre-Delivery Checklist

Before finishing a workflow, verify:

- source claims cite raw files or existing wiki pages
- `raw/` material remains traceable and is not silently rewritten
- wiki page frontmatter matches the vault protocol when files were edited
- `index.md` and `log.md` are updated after semantic wiki changes
- lint or link-check findings are reported when they remain unresolved
- destructive or ambiguous changes were confirmed by the user
