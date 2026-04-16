# ai-memex-cli

> CLI for building and maintaining persistent LLM wikis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Inspired by Karpathy's [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) pattern (Bush's Memex + LLM maintenance), `memex` provides **stateless primitives** that any agent (Claude Code, Codex, Cursor, etc.) can invoke to operate on a wiki.

---

## Why

1. **Persistent memory for AI agents** — a structured wiki that persists across sessions, no more starting from zero every conversation.
2. **Session distillation** — extract best practices, decisions, and insights from coding sessions into reusable knowledge.
3. **Precise context injection** — domain knowledge processed into compact, token-efficient context for every conversation.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Layer 3: Agent (Claude Code / any LLM agent)    │
│  - Ingest, write wiki pages, fix lint issues    │
│  - Update per-project AGENTS.md                 │
│  - Invoke memex commands via Bash               │
└─────────────────────────────────────────────────┘
                       ↕ (shell + JSON)
┌─────────────────────────────────────────────────┐
│ Layer 2: memex CLI                              │
│  - Stateless primitives: init / distill / glob  │
│    / ingest / watch / inject / lint / search    │
│    / new / log / install-hooks / status         │
│  - No LLM API calls (except claude -p in        │
│    distill and ingest orchestration)            │
└─────────────────────────────────────────────────┘
                       ↕ (fs)
┌─────────────────────────────────────────────────┐
│ Layer 1: Vault (filesystem)                     │
│  ~/.llmwiki/global/    ← CLI-managed source     │
│  <project>/.llmwiki/local/  ← agent projection  │
└─────────────────────────────────────────────────┘
```

**Key principle:** CLI manages mechanical correctness; agent manages semantic correctness.

---

## Install

```bash
npm install -g ai-memex-cli
```

Requires Node.js 20+.

---

## Quick Start

```bash
# 1. Initialize a global vault
memex init

# 2. Create wiki pages
memex new concept "React Hooks" --scene research
memex new entity "TypeScript" --scene research

# 3. Drop a source document and ingest it
cp my-notes.md ~/.llmwiki/global/raw/research/
memex ingest ~/.llmwiki/global/raw/research/my-notes.md

# 4. Check wiki health
memex lint --json

# 5. Search the wiki
memex search "hooks" --json

# 6. Project relevant pages into a local vault
memex glob --project . --keywords "react,typescript"

# 7. Output context for an agent
memex inject --keywords "react"

# 8. Install Claude Code hooks for automatic distill/glob
memex install-hooks --agent claude-code
```

---

## Commands

### Core Commands

| Command | Who Calls | Description |
|---------|-----------|-------------|
| `memex init [path] --scope global\|local` | **user** | Initialize vault + AGENTS.md template |
| `memex distill <session.jsonl> [--no-llm]` | **SessionEnd hook / user** | Distill session JSONL to raw markdown (calls `claude -p`) |
| `memex ingest <raw-file\|--all> [--dry-run]` | **user / hook / watch** | Orchestrate agent to ingest raw source into wiki |
| `memex watch [--daemon]` | **user / daemon** | Watch raw/ for changes and auto-ingest |
| `memex glob --project <dir> [--keywords]` | **SessionStart hook / user** | Project relevant global wiki pages into local vault |
| `memex inject [--keywords\|--task] [--format md\|json]` | **agent / user** | Output wiki context for agent consumption |
| `memex lint [--json] [--check orphans,broken-links,missing-frontmatter]` | **agent / periodic hook** | Scan wiki health and output structured report |
| `memex search <query> [--engine ripgrep\|qmd\|hybrid]` | **agent** | Search wiki pages |
| `memex new <type> <name> --scene` | **agent** | Scaffold a new wiki page from template |
| `memex log <action> [--target] [--note]` | **agent** | Append a formatted entry to log.md |
| `memex install-hooks [--agent claude-code]` | **user** | Install SessionStart/SessionEnd hooks |

### Utility Commands

| Command | Who Calls | Description |
|---------|-----------|-------------|
| `memex status` | **user** | Vault overview: pending raw, wiki count, orphans, breakdown by scene/type |
| `memex link-check [--fix]` | **agent / user** | Validate `[[links]]` and suggest fixes |

---

## Vault Structure

### Global Vault (`~/.llmwiki/global/`)

```
├── .llmwiki/
│   └── config.json
├── raw/
│   ├── personal/
│   ├── research/
│   ├── reading/
│   ├── team/
│   └── sessions/
├── wiki/
│   ├── personal/{entities,concepts,sources,summaries}/
│   ├── research/{entities,concepts,sources,summaries}/
│   ├── reading/{entities,concepts,sources,summaries}/
│   └── team/{entities,concepts,sources,summaries}/
├── AGENTS.md
├── index.md
└── log.md
```

### Local Vault (`<project>/.llmwiki/local/`)

```
├── wiki/          ← copied from global by `glob`
└── AGENTS.md      ← project-level schema with @includes
```

---

## Data Flow

```
agent session running
  │
  ▼ SessionEnd hook
memex distill <session.jsonl>  →  global/raw/sessions/session-YYYY-MM-DD.md
  │
  ▼ user trigger / watch / manual
memex ingest <raw-file>  →  (shells claude -p per AGENTS.md schema)
  → updates global/wiki/*.md, index.md, log.md
  │
  ▼ periodic / manual
memex lint --json  →  agent consumes report and fixes wiki
  │
  ▼ SessionStart hook
memex glob --project <cwd>  →  <project>/.llmwiki/local/wiki/
local AGENTS.md @includes local wiki pages
  │
  ▼ agent starts new session with precise context
```

---

## Page Format

All wiki pages use YAML frontmatter:

```yaml
---
name: React Hooks
description: Modern state management in React
type: concept
scene: research
tags: [react, frontend, hooks]
updated: 2026-04-16
related: [[react-state-management]]
sources: [react-docs-2026]
---
```

**Types:** `entity` | `concept` | `source` | `summary`

**Scenes:** `personal` | `research` | `reading` | `team`

**Links:** Use `[[page-name]]` for internal cross-references.

---

## Vault Resolution

Commands resolve the vault in this order:

1. `--vault <path>` argument
2. Nearest `.llmwiki/local` (upward traversal from cwd)
3. Nearest `.llmwiki/global` (upward traversal from cwd)
4. Fallback: `~/.llmwiki/global`

---

## @include Syntax (Local AGENTS.md)

```markdown
## @include ../global/wiki/frontend-engineering.md
## @include ./wiki/session-2026-04-15.md
## @include ./wiki/*.md
```

`memex inject` parses these lines, reads files, and concatenates the output.

---

## Claude Code Integration

### Setup (once)

```bash
# Initialize global vault
memex init

# Install hooks
memex install-hooks --agent claude-code

# This configures:
#   SessionStart → memex glob --project .
#   SessionEnd   → memex distill ~/.claude/sessions/last-session.jsonl
```

### Workflow

1. **SessionStart** → `memex glob` copies relevant wiki pages into `.llmwiki/local/`
2. **Agent reads** local AGENTS.md with `@include` directives for context
3. **Agent works** on the project, making decisions and writing code
4. **SessionEnd** → `memex distill` extracts key insights into `raw/sessions/`
5. **User triggers** `memex ingest` to process raw sessions into wiki pages
6. **Next session** starts with richer context

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.4+
- **CLI Framework:** cac
- **Testing:** vitest
- **Dependencies:** gray-matter, chokidar, picocolors

---

## Development

```bash
git clone https://github.com/zelixag/ai-memex-cli.git
cd ai-memex-cli
pnpm install
pnpm build
pnpm test:run
```

---

## License

MIT
