# Agent-Native Iteration Plan

Date: 2026-04-24

## Decision

`ai-memex-cli` should move from a CLI-first product to an agent-native wiki workflow.

The CLI remains important, but it should no longer be the primary user interface. The primary interface should be an agent skill and slash commands that guide the user's AI assistant through the LLM wiki workflow.

## Why This Change

The core value of ai-memex is not that users can remember terminal commands. The value is that an AI agent can maintain a durable Markdown wiki instead of re-deriving knowledge from raw sources on every conversation.

That work is semantic:

- deciding whether a source creates a new concept or updates an existing page
- merging contradictory sources with attribution
- updating cross-links and summaries
- distilling useful conversations back into durable knowledge
- repairing wiki health issues without damaging meaning

Those decisions belong in an agent workflow, not inside a deterministic CLI.

The CLI should support the workflow with reliable primitives: initialize files, fetch sources, inspect vault state, search pages, validate links, and install or refresh agent instructions.

## Product Shape

The target product is:

> AI Memex is an agent-native LLM wiki workflow, powered by a CLI toolbox.

This is closer to OpenSpec than to a normal terminal utility:

- OpenSpec uses a CLI to install and update project artifacts.
- Users then work inside their agent through `/opsx:*` commands.
- The repository maintains a protocol, artifact structure, and assistant instructions.

ai-memex should follow the same shape:

- `memex` installs, updates, validates, fetches, and searches.
- The agent skill performs ingest, query, distill, and repair workflows.
- Slash commands expose common workflows inside Claude Code, Codex, Cursor, OpenCode, Gemini CLI, and similar tools.

## User Experience Target

The user should not need to remember the command graph.

Good target interactions:

```text
/memex:capture https://example.com/paper
```

```text
/memex:ingest the OAuth notes I collected today
```

```text
/memex:query what do I know about agent memory tradeoffs?
```

```text
/memex:distill this debugging session into the team wiki
```

```text
/memex:repair run wiki health checks and fix safe issues
```

The agent can call CLI primitives underneath, but the user's mental model should be: "I ask my agent to maintain my memex."

## Boundaries

### CLI Responsibilities

Keep these as deterministic, testable primitives:

- `memex init`: create vault structure and starter schema
- `memex onboard`: choose agent, initialize vault, install commands
- `memex update`: refresh generated instructions, slash commands, and templates
- `memex fetch`: collect web or file sources into `raw/`
- `memex search`: search existing wiki content
- `memex lint`: produce machine-readable wiki health reports
- `memex link-check`: validate links and references
- `memex status`: summarize vault state
- `memex config`: inspect and modify local/global configuration

These commands should avoid semantic authorship. They may create scaffolding and reports, but they should not decide what the wiki means.

### Skill Responsibilities

Move these to the agent skill as first-class workflows:

- decide what source material means
- choose whether to create, merge, or update wiki pages
- preserve source attribution and contradictions
- update index and log entries after semantic changes
- answer questions from the wiki with citations
- decide which lint findings are safe to auto-fix
- distill sessions into raw material and optionally ingest them
- guide users through ambiguous knowledge maintenance decisions

### Slash Command Responsibilities

Slash commands should be thin entry points into the skill. They should not duplicate all instructions.

Target first-version commands:

- `/memex:capture`
- `/memex:ingest`
- `/memex:query`
- `/memex:distill`
- `/memex:repair`
- `/memex:status`

## Non-Goals For This Iteration

- Do not remove existing CLI commands immediately.
- Do not introduce an MCP server.
- Do not call LLM provider APIs directly from the CLI.
- Do not make `watch --heal` the default workflow.
- Do not rewrite the website before the new product model is validated.
- Do not create a large framework before the first skill works in real agent sessions.

## Success Criteria

The iteration is successful when:

- A user can install or update ai-memex, then operate mainly from inside an agent.
- The skill clearly explains how to maintain `raw/`, `wiki/`, `index.md`, `log.md`, and `AGENTS.md`.
- The CLI is described as a toolbox, not the main workflow.
- At least one real vault can complete `capture -> ingest -> query -> repair` through agent commands.
- Existing CLI tests still pass for deterministic primitives.

## Risks

- The skill may duplicate too much of the CLI README and become bloated.
- Slash commands may diverge from the skill if they embed full workflow logic.
- Users may be confused if docs still present CLI-first quick starts.
- Existing commands like `ingest`, `distill`, `inject`, and `watch` blur the new boundary.
- Multi-agent support may make the first skill too broad if every agent is treated as a special case.

## Risk Controls

- Keep `SKILL.md` short and move detailed rules into `references/`.
- Treat slash commands as dispatchers into the skill, not separate documentation.
- Keep old CLI commands working during the transition.
- Update README positioning only after the first skill workflow exists.
- Validate first with Claude Code and Codex before broadening agent-specific polish.

