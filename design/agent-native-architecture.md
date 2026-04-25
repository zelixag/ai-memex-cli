# Agent-Native Architecture

Date: 2026-04-24

## Summary

ai-memex should be split into three layers:

```text
Agent Interface
  skill + slash commands

Workflow Protocol
  vault schema + wiki rules + operation contracts

CLI Toolbox
  deterministic commands and validation primitives
```

The agent interface is the user-facing workflow. The CLI toolbox is the implementation support layer. The workflow protocol is the stable contract between them.

## Layer 1: Agent Interface

This layer is what users interact with during normal work.

Artifacts:

- `templates/skills/ai-memex/SKILL.md` as the source template, installed into user agent environments by `memex init`, `memex onboard`, or `memex update`
- slash commands such as `/memex:ingest`
- agent-specific command wrappers for Claude Code, Codex, Cursor, OpenCode, Gemini CLI, Aider, and Continue.dev

Responsibilities:

- interpret user intent
- select the right memex workflow
- call CLI primitives when useful
- read and write wiki files through the agent's normal file tools
- ask the user before ambiguous or destructive changes

The skill should be the source of truth for semantic workflows. Slash commands should reference or invoke the same workflow instead of copying full instructions.

## Layer 2: Workflow Protocol

This layer defines what a valid memex workspace means.

Artifacts:

- vault directory structure
- wiki page templates
- frontmatter schemas
- index and log conventions
- raw source conventions
- lint report format
- operation contracts for capture, ingest, query, distill, and repair

Responsibilities:

- define durable file layout
- define what the agent may and may not change
- define citation and attribution rules
- define safe auto-fix boundaries
- keep CLI and skill behavior aligned

This layer should be documented independently from implementation details. It lets the same workflow survive across different agents and command systems.

## Layer 3: CLI Toolbox

This layer performs deterministic work.

Artifacts:

- `src/cli.ts`
- `src/commands/*`
- `src/core/*`
- `templates/*`
- tests

Responsibilities:

- initialize vaults and configs
- fetch source material
- parse and validate markdown/frontmatter
- search local wiki content
- report link and schema issues
- generate or refresh agent-specific command files
- inspect vault status

The CLI must continue to avoid direct LLM API calls and must not author semantic wiki content on its own.

## Command Classification

### Keep As Core CLI Primitives

These are good CLI commands because they are deterministic or mostly mechanical:

| Command | Role |
| --- | --- |
| `init` | Create vault files and starter schema |
| `onboard` | Configure agent, vault, and hooks |
| `update` | Refresh generated memex artifacts |
| `fetch` | Collect raw source material |
| `search` | Search existing wiki files |
| `lint` | Produce health reports |
| `link-check` | Validate markdown links |
| `status` | Summarize vault state |
| `config` | Manage settings |

### Reframe As Skill Workflows

These commands involve semantic workflow orchestration and should become secondary to the skill:

| Command | Future Role |
| --- | --- |
| `ingest` | Skill workflow that may call CLI helpers |
| `distill` | Skill workflow, with CLI parsing support |
| `inject` | Query/context workflow, possibly replaced by skill-guided search |
| `watch --heal` | Advanced automation, not default UX |
| `context install` | Optional integration, not core Karpathy wiki pattern |
| `glob` | Internal helper for context selection |

Do not remove these immediately. First make the skill path better, then decide whether to deprecate, rename, or keep them as advanced commands.

## First Skill Shape

Proposed skill structure:

```text
ai-memex/
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

`SKILL.md` should stay short:

- when the skill triggers
- core rule: preserve source truth and let knowledge compound
- workflow selection table
- short checklist for each operation
- instructions for when to load each reference

Detailed page schemas and examples belong in `references/`.

## First Slash Command Set

```text
/memex:capture <url|file|text|query>
/memex:ingest [target]
/memex:query <question>
/memex:distill [session|latest|current]
/memex:repair [--safe|--review]
/memex:status
```

Each command should:

- state the user intent
- load or activate the ai-memex skill
- provide minimal arguments
- avoid embedding full workflow rules

## Data Flow

```text
User in agent
  -> /memex:capture
  -> skill decides capture mode
  -> CLI fetches source when useful
  -> raw/ receives immutable material

User in agent
  -> /memex:ingest
  -> skill reads raw/ + wiki/index.md + relevant pages
  -> agent writes semantic wiki updates
  -> skill updates index.md and log.md
  -> CLI lint validates mechanical health

User in agent
  -> /memex:query
  -> CLI search can narrow candidates
  -> skill reads wiki pages
  -> agent answers with citations
```

## Compatibility Strategy

Do not force all agents to support the same mechanism internally. Normalize the user-facing behavior instead.

Claude Code may use slash commands. Codex may use installed skills and command prompts. Cursor may use rules or commands. The workflow protocol should stay identical even if installation paths differ.

## Documentation Strategy

Update docs in this order:

1. Internal design docs define the new model.
2. Skill files implement the new model.
3. Slash command docs point to the skill.
4. README changes from CLI-first to agent-first.
5. Website updates after the workflow stabilizes.
