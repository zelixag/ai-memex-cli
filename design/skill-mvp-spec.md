# Skill MVP Spec

Date: 2026-04-24

## Purpose

Create the first `ai-memex` agent skill. The skill should make the agent the main interface for maintaining an LLM wiki while using the existing `memex` CLI as a toolbox.

The MVP should prove the workflow before any major CLI deprecation or README rewrite.

## Trigger Intent

The skill should trigger when the user asks to:

- add material to a memex or LLM wiki
- ingest sources into `raw/` and `wiki/`
- ask "what do I know about X?"
- query existing wiki knowledge
- distill a conversation into durable notes
- repair or lint a wiki
- mention Karpathy LLM wiki, agent memory, durable markdown knowledge, or compounding knowledge

## Core Rule

Preserve source truth and make knowledge compound.

The agent may synthesize wiki pages, but it must not blur raw source material, citations, contradictions, or operation history.

## Directory Target

Initial implementation:

```text
templates/skills/ai-memex/
  SKILL.md
  references/
    vault-protocol.md
    capture-workflow.md
    ingest-workflow.md
    query-workflow.md
    distill-workflow.md
    repair-workflow.md
    safety-rules.md
```

This path is the source template that `memex init`, `memex onboard`, or `memex update` can later install into a user's agent environment.

## SKILL.md Responsibilities

`SKILL.md` should stay compact and should not duplicate every schema detail.

It should include:

- one-sentence skill purpose
- core rule
- workflow selector
- short operational checklists
- when to call CLI commands
- when to load each reference file
- safety gates
- pre-delivery checklist

It should not include:

- full README copy
- long comparison sections
- detailed implementation history
- exhaustive multi-agent installation instructions
- large examples that belong in references

## References

### `vault-protocol.md`

Defines:

- vault root discovery
- `raw/` semantics
- `wiki/` semantics
- `index.md`
- `log.md`
- `AGENTS.md`
- page types and frontmatter
- citation rules

Load when:

- initializing a new vault manually
- writing or updating wiki files
- deciding whether a file path is valid

### `capture-workflow.md`

Defines:

- URL capture
- keyword capture
- pasted text capture
- file capture
- when to use `memex fetch`
- raw file naming
- source metadata

Load when:

- user provides a URL, file, or source text
- user asks to collect research material

### `ingest-workflow.md`

Defines:

- how to read raw sources
- how to choose create vs merge vs update
- source attribution
- contradiction handling
- index and log updates
- cascade updates

Load when:

- converting raw material into wiki pages
- updating existing knowledge pages

### `query-workflow.md`

Defines:

- how to use `memex search`
- how to read relevant wiki pages
- how to answer with citations
- when not to write files
- when to archive an answer

Load when:

- user asks what the wiki knows
- user asks for synthesis from existing knowledge

### `distill-workflow.md`

Defines:

- how to distill current or past agent sessions
- when to use `memex distill`
- what belongs in `raw/<scene>/sessions/`
- when to ingest distilled sessions

Load when:

- user asks to save a conversation
- user asks to capture lessons learned
- user asks to convert debug or planning work into wiki material

### `repair-workflow.md`

Defines:

- how to consume `memex lint` and `memex link-check`
- safe auto-fixes
- report-only findings
- when to ask the user before editing

Load when:

- user asks to lint, repair, clean up, or health-check the wiki

### `safety-rules.md`

Defines:

- raw immutability rules
- destructive edit gates
- source citation requirements
- ambiguous merge handling
- token-cost controls
- what never to automate silently

Load when:

- the workflow may overwrite, delete, merge, or rewrite existing knowledge

## Workflow Selector

| User intent | Workflow |
| --- | --- |
| "save this URL" | Capture |
| "ingest this" | Capture if needed, then Ingest |
| "what do I know about X?" | Query |
| "save this conversation" | Distill |
| "fix my wiki" | Repair |
| "show vault health" | Status via CLI |

## CLI Use Policy

The skill may call:

- `memex status` before substantial work
- `memex fetch` for URL, sitemap, or keyword capture
- `memex search` to narrow query candidates
- `memex lint` before repair
- `memex link-check` when link health is relevant
- `memex distill` when mechanical session parsing is useful

The skill should avoid calling:

- autonomous `watch --daemon --heal` unless the user explicitly asks
- broad update/install commands unless the user is changing setup
- commands that would overwrite generated agent instructions without confirmation

## Safety Gates

Ask before:

- deleting wiki or raw files
- rewriting large existing wiki sections
- merging two pages when the match is uncertain
- auto-fixing factual contradictions
- enabling background automation
- modifying agent configuration files outside the vault

Do not ask before:

- reading files
- running status/search/lint
- creating a new raw source file from user-provided material
- adding a log entry for an operation just performed

## MVP Acceptance Criteria

- `SKILL.md` is under 500 lines.
- The skill can guide capture, ingest, query, distill, and repair.
- The skill uses references progressively.
- The skill does not require users to know CLI command details.
- The skill preserves the current architecture rule: no direct LLM API calls from the CLI.
- The skill can be tested manually inside at least Claude Code and Codex.
