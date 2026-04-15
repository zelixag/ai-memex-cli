# memex

> A CLI tool for building LLM-powered persistent knowledge bases — giving AI agents like Claude Code a compounding, persistent memory.

[![npm version](https://badge.fury.io/js/memex-cli.svg)](https://badge.fury.io/js/memex-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

Most AI agents start every session from zero. They have no memory of past decisions, no accumulated knowledge of your codebase conventions, and no awareness of the best practices your team has developed. You end up re-explaining context in every conversation, wasting tokens and getting inconsistent results.

## The Solution

`memex` builds a **persistent, compounding wiki** that sits between you and your AI agents. Instead of re-deriving knowledge on every query, an LLM incrementally builds and maintains a structured collection of markdown files. Every source you ingest makes the knowledge base richer. Every session distills new best practices. Your AI agents always start with the full context.

This is inspired by [Vannevar Bush's Memex (1945)](https://en.wikipedia.org/wiki/Memex) — a personal knowledge store with associative trails. The missing piece in that vision was maintenance. LLMs provide that maintenance.

---

## Features

- **`memex init`** — Initialize a knowledge base (general, engineering, research, or team)
- **`memex ingest`** — Ingest files, URLs, or text; LLM automatically extracts and writes wiki pages
- **`memex query`** — Ask questions; LLM synthesizes answers from the wiki with citations
- **`memex lint`** — Health-check: find contradictions, orphan pages, stale claims
- **`memex context`** — Generate a distilled context snapshot for AI agents
- **`memex sync`** — Sync context to `CLAUDE.md`, `.cursorrules`, or Copilot instructions
- **`memex distill`** — Distill best practices from conversation logs by role
- **`memex list`** — Browse wiki pages with tags and metadata
- **`memex kb`** — Manage multiple knowledge bases
- **`memex config`** — Configure LLM provider, model, and API keys

---

## Installation

```bash
npm install -g memex-cli
```

Or run directly with npx:

```bash
npx memex-cli init my-kb
```

### Requirements

- Node.js 18+
- An OpenAI-compatible API key (OpenAI, Anthropic via proxy, Ollama, etc.)

---

## Quick Start

### 1. Initialize a knowledge base

```bash
# In your project directory
memex init my-engineering-kb --type engineering
```

This creates:
```
.
├── AGENTS.md          # Schema and conventions for LLM agents
├── wiki/              # LLM-maintained wiki pages
│   ├── index.md       # Master index
│   ├── log.md         # Append-only operation log
│   └── ...            # Subdirectories by type
└── sources/           # Immutable raw source documents
```

### 2. Configure your LLM

```bash
memex config setup
# or set environment variables:
export OPENAI_API_KEY=sk-...
export MEMEX_MODEL=gpt-4.1-mini  # optional, defaults to gpt-4.1-mini
```

### 3. Ingest knowledge

```bash
# Ingest a file
memex ingest ./docs/architecture.md

# Ingest a URL
memex ingest https://example.com/tech-blog-post

# Batch ingest (less interactive)
memex ingest ./meeting-notes.md --batch
```

The LLM reads the source, extracts key information, and writes/updates wiki pages automatically.

### 4. Query the knowledge base

```bash
memex query "What is our API authentication strategy?"
memex query "What are the database migration conventions?" --save
```

### 5. Generate context for AI agents

```bash
# Generate context for Claude Code
memex context --role backend-engineer --output CLAUDE.md

# Or use sync to write to multiple agent configs
memex sync --target claude,cursor --role backend-engineer
```

### 6. Distill best practices from sessions

```bash
# After a productive Claude Code session, distill the learnings
memex distill ./session-transcript.md --role backend-engineer
```

---

## Knowledge Base Types

| Type | Best For | Wiki Structure |
|------|----------|----------------|
| `general` | Personal knowledge, reading notes | concepts/, entities/, syntheses/ |
| `engineering` | Codebases, team wikis, ADRs | architecture/, best-practices/, decisions/, runbooks/ |
| `research` | Literature review, papers | papers/, concepts/, authors/, syntheses/ |
| `team` | Meeting notes, processes, decisions | decisions/, processes/, meetings/, people/ |

---

## Commands Reference

### `memex init [name]`

Initialize a new knowledge base.

```bash
memex init my-kb                          # Interactive setup
memex init my-kb --type engineering       # Engineering KB
memex init my-kb --type research          # Research KB
memex init my-kb --dir /path/to/dir       # Custom directory
```

### `memex ingest <source>`

Ingest a new knowledge source.

```bash
memex ingest ./document.md                # Local file
memex ingest https://example.com/article  # URL
memex ingest "Key insight: ..."           # Inline text
memex ingest ./doc.md --batch             # Batch mode (no discussion)
memex ingest ./doc.md --no-discuss        # Skip discussion step
memex ingest ./doc.md --kb my-other-kb   # Target specific KB
```

### `memex query "<question>"`

Query the knowledge base.

```bash
memex query "What are our API conventions?"
memex query "Compare approach A vs B" --format table
memex query "Summarize the architecture" --save    # Save answer as wiki page
```

### `memex lint`

Health-check the knowledge base.

```bash
memex lint                    # Full health check
memex lint --fix              # Attempt auto-fix
```

Checks for:
- Orphan pages (no inbound links)
- Missing frontmatter
- Contradictions between pages (LLM-powered)
- Stale claims
- Missing cross-references

### `memex context`

Generate distilled context for AI agents.

```bash
memex context                              # General context (stdout)
memex context --role backend-engineer      # Role-specific context
memex context --output CLAUDE.md           # Save to file
memex context --max-tokens 4000            # Limit token budget
```

Supported roles: `backend-engineer`, `frontend-engineer`, `tech-lead`, `devops`, `researcher`, `full-stack`

### `memex sync`

Sync context to AI agent config files.

```bash
memex sync                                 # Interactive target selection
memex sync --target claude                 # Sync to CLAUDE.md
memex sync --target claude,cursor          # Multiple targets
memex sync --role tech-lead --target claude
```

Supported targets:
- `claude` → `CLAUDE.md` (Claude Code)
- `cursor` → `.cursorrules` (Cursor)
- `copilot` → `.github/copilot-instructions.md` (GitHub Copilot)
- `aider` → `CONVENTIONS.md` (Aider)

### `memex distill <source>`

Distill best practices from conversation logs.

```bash
memex distill ./session.md --role backend-engineer
memex distill ./meeting-notes.txt --role tech-lead
```

### `memex list`

List wiki pages.

```bash
memex list                    # All pages
memex list --tag architecture # Filter by tag
memex list --orphans          # Show only orphan pages
```

### `memex kb`

Manage multiple knowledge bases.

```bash
memex kb list                 # List all KBs
memex kb switch my-other-kb   # Switch default KB
memex kb info my-kb           # Show KB details
memex kb delete old-kb        # Remove from registry
```

### `memex config`

Configure memex settings.

```bash
memex config list             # Show all settings
memex config setup            # Interactive setup
memex config set llm.model gpt-4o
memex config set llm.apiKey sk-...
memex config get llm.model
```

---

## Workflow: Claude Code Integration

The primary use case is giving Claude Code persistent memory across sessions.

### Setup (once per project)

```bash
# In your project root
memex init --type engineering

# Ingest your existing docs
memex ingest ./docs/architecture.md
memex ingest ./docs/api-conventions.md
memex ingest https://your-internal-wiki.com/decisions

# Generate and sync context
memex sync --target claude --role backend-engineer
```

### During development

After a productive Claude Code session where you made important decisions:

```bash
# Save the session transcript (Claude Code exports these)
memex distill ./session-2026-04-15.md --role backend-engineer

# Re-sync to update CLAUDE.md
memex sync --target claude --role backend-engineer
```

### Periodic maintenance

```bash
# Weekly health check
memex lint

# After adding new docs
memex ingest ./new-adr.md
memex sync --target claude
```

---

## Architecture

```
Knowledge Base
├── AGENTS.md              ← Schema: tells LLMs how to work with this KB
├── wiki/                  ← LLM-maintained (you read, LLM writes)
│   ├── index.md           ← Master catalog with summaries
│   ├── log.md             ← Append-only operation log
│   └── [type-dirs]/       ← Organized by KB type
└── sources/               ← Immutable raw sources (you add, LLM reads)
```

The three-layer architecture:
1. **Raw sources** — Immutable. LLM reads but never modifies.
2. **Wiki** — LLM-maintained markdown. You read; LLM writes.
3. **Schema (AGENTS.md)** — Conventions and workflows. You and LLM co-evolve.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API key for LLM provider | — |
| `OPENAI_BASE_URL` | Custom API base URL | OpenAI default |
| `MEMEX_MODEL` | Model name override | `gpt-4.1-mini` |
| `MEMEX_MOCK` | Set to `1` for mock mode (testing) | — |

---

## Tips

- Keep `AGENTS.md` updated as your conventions evolve — it's the LLM's operating manual
- Use `--batch` flag for ingesting many sources quickly
- Save valuable query answers with `--save` to build up syntheses
- Run `memex lint` weekly to keep the wiki healthy
- The wiki is just a git repo — commit it for version history and collaboration
- Use `memex context --role <role>` to generate role-specific context for different team members

---

## License

MIT
