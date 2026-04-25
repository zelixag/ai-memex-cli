# ai-memex-cli

**English** · [简体中文](./README.zh-CN.md)

> **Your AI agents, finally with a memory that compounds.**
>
> AI Memex turns chats, documents, research, and project decisions into a living Markdown knowledge base, maintained by agents and versioned in Git.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/ai-memex-cli.svg)](https://www.npmjs.com/package/ai-memex-cli)

## Why this exists

Most RAG systems rediscover knowledge from scratch on every question — retrieve raw chunks, synthesize, throw it away. **Nothing compounds.** Karpathy's pattern proposes a different shape: the LLM incrementally builds and maintains a structured, interlinked Markdown wiki that sits *between* you and the raw sources. Cross-references are already there. Contradictions have already been flagged. The synthesis already reflects everything you've read.

> **"Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."** — Karpathy

This is the oldest idea in information management — Vannevar Bush's 1945 **Memex**. Bush's vision had one gap: *who does the maintenance?* LLMs fill that gap — they don't get bored updating cross-references, and they can touch 15 pages in one pass.

**What ai-memex is:** a Git-backed Markdown knowledge base maintained by your AI agents. The installed `ai-memex` skill decides when to capture, ingest, query, distill, or repair knowledge. The `memex` CLI stays underneath as the mechanical toolbox: fetch sources, search the wiki, validate links/frontmatter, initialize vaults, install agent commands/skills, and parse sessions.

**What it isn't:** a RAG system, an MCP memory server, or a black-box vector store. The CLI makes **zero LLM API calls**. Your local agent (Claude Code, Cursor, Codex, Gemini, …) does the semantic work through the skill. The wiki itself is plain Markdown in a git repo — you can read it, edit it, diff it, blame it.

### Intellectual lineage

This project is explicitly built from [Andrej Karpathy's LLM Wiki idea](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): keep immutable raw sources, have the LLM maintain a structured Markdown wiki, and let knowledge compound through ingest, query, and lint cycles.

ai-memex adds an implementation layer around that pattern:

- an installable `ai-memex` agent skill
- `/memex:*` agent workflows
- a CLI toolbox for fetch/search/lint/status/setup
- multi-agent installation support
- session distillation back into raw material

---

## What `memex` gives you

### Agent-first workflows

Normal use happens inside your agent:

1. **Capture** — `/memex:capture` saves URLs, files, pasted text, or search results into `raw/`.
2. **Ingest** — `/memex:ingest` has the agent compile raw material into durable entity / concept / source / summary pages.
3. **Query** — `/memex:query` answers from your existing wiki with citations instead of re-deriving from scratch.
4. **Distill** — `/memex:distill` turns useful debugging, planning, or research conversations into raw session material.
5. **Repair** — `/memex:repair` runs health checks and lets the agent fix safe wiki issues without flattening contradictions.
6. **Status** — `/memex:status` shows the current vault state and likely next step.

The CLI commands still exist, but they are the toolbox the skill calls when useful:

- `memex fetch`: deterministic web/source capture
- `memex search`: local wiki search
- `memex lint` / `memex link-check`: mechanical health checks
- `memex init` / `memex onboard` / `memex install-hooks`: setup and installation
- `memex distill`: mechanical session discovery/parsing
- `memex status`: vault overview

### Advanced / experimental (not in Karpathy's original)

These layer on top of the core pipeline and are **off by default**. Useful, but opinionated — treat them as experiments and start small.

- **`memex watch --daemon --heal`** — long-lived background loop that runs `ingest → lint → ingest` until the wiki reaches zero issues. Convenient, but it burns agent tokens autonomously; try `memex watch --once` in the foreground first and only daemonize once you trust the loop on your vault.
- **`memex context install`** — writes a marker-delimited "vault digest" block into your project's `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/memex.mdc` so every new agent session opens with the wiki location and a scene summary already in context. This is agent-memory territory rather than Karpathy's pattern; before installing, decide whether it overlaps usefully with Cursor skills / CLAUDE.md you already maintain by hand.
- **Cross-agent prompt layer** — eight agents covered via prompt templates rather than MCP. Works well on Claude Code / Codex / OpenCode; coverage quality varies by agent.

### How it compares to alternatives

| Feature | ai-memex-cli | atomicmemory/llm-wiki-compiler | ussumant/llm-wiki-compiler | SamurAIGPT/llm-wiki-agent | rohitg00/agentmemory |
|---------|--------------|--------------------------------|----------------------------|---------------------------|----------------------|
| **Architecture** | Agent skill + CLI toolbox | Standalone CLI (calls LLM API) | Claude Code Plugin | Pure Markdown Prompts | TypeScript MCP Server |
| **Agent Support** | **Universal (8+ agents)** | Anthropic API only | Claude Code only | Claude Code only | MCP-compatible only |
| **Web Fetching** | **Built-in crawler + Keyword search** | Single URL ingest | No | No | No |
| **Session Distillation**| **Yes (batch, structured MD)** | No | No | No | Yes (Background) |
| **Slash Commands** | **Auto-generated for all agents** | No | Built-in (plugin) | Manual setup | N/A |
| **Interactive Onboarding** | **Yes (wizard)** | No | No | No | No |
| **Self-Update** | **Yes (`memex update`)** | No | No | No | No |
| **Cost** | **Free (uses Agent's session)** | Requires API Key | Free (uses Claude session) | Free | Requires API Key |

---

## Installation & Quick Start

```bash
# Install globally via npm
npm install -g ai-memex-cli

# Or install from GitHub directly
npm install -g github:zelixag/ai-memex-cli

# Verify installation
memex --version
```

### 1. Interactive Onboarding

Run the onboarding wizard to select your preferred AI agent, initialize your default vault, and install the agent-facing memex workflow.

```bash
memex onboard
```

The wizard will walk you through 5 steps:
- **Step 1:** Choose your AI agent (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev, or Generic)
- **Step 2:** Record session directories for every selected agent with a known session store (Claude Code, Codex, OpenCode, Gemini CLI, Aider; custom path for others)
- **Step 3:** Initialize your default wiki vault at `~/.llmwiki/`
- **Step 4:** Install slash commands and, where supported, the `ai-memex` skill. You can install at project scope or user scope.
- **Step 5:** Save configuration to `~/.llmwiki/config.json`

For non-interactive environments (CI/scripts):

```bash
memex onboard --agent claude-code -y
```

### 2. Work From Your Agent

After onboarding, use memex from inside your agent:

```text
/memex:status
/memex:capture https://react.dev/reference/react/hooks
/memex:ingest
/memex:query "what do I know about React hooks tradeoffs?"
/memex:distill this debugging session
/memex:repair
```

For Claude Code, `memex onboard` / `memex install-hooks` installs both:

```text
.claude/commands/memex/*.md
.claude/skills/ai-memex/
```

Project scope pins the workflow to the current repo. User scope installs it under your home agent config for use across projects:

```bash
memex install-hooks --agent claude-code --scope project
memex install-hooks --agent claude-code --scope user
```

### 3. CLI Toolbox

The commands below are still useful as deterministic primitives, especially for scripts or manual inspection.

#### Fetch Knowledge

Grab documentation from the web — by URL or by keyword search.

```bash
# Fetch a specific URL
memex fetch https://react.dev/reference/react/hooks

# Crawl an entire doc site via sitemap
memex fetch https://nextjs.org/sitemap.xml --sitemap --max-pages 50

# Recursive crawl with depth control
memex fetch https://docs.anthropic.com --depth 2 --max-pages 30

# Search by keywords (no URL needed!)
memex fetch "react hooks best practices" --top 5

# Chinese keyword search works too
memex fetch "Kubernetes 部署最佳实践" --top 3 --yes

# Delegate to your agent for complex scenarios (JS rendering, login required)
memex fetch "OAuth2 PKCE flow" --agent claude-code
```

When using keyword search, the CLI searches via DuckDuckGo (no API key needed), presents results interactively, and lets you choose which pages to fetch.

#### Ingest into Wiki

Tell your agent to process raw files into structured wiki pages.

```bash
# Ingest all files in the default raw/ directory
memex ingest

# Ingest a specific directory or file (fuzzy paths supported)
memex ingest raw/personal
memex ingest ~/docs/architecture.md

# Use a specific agent
memex ingest --agent codex

# Dry-run to preview the prompt without executing
memex ingest --dry-run
```

The `ingest` command accepts **fuzzy paths** — your agent will search and resolve the actual files. You don't need to provide exact paths.

#### Distill Your Sessions

Just finished a complex debugging session? Convert every session file your agent has ever produced into structured Markdown, ready to be ingested.

```bash
# No-arg: batch-convert ALL sessions from your configured agent
memex distill

# Pick the scene the sessions land in (default: team → raw/team/sessions/)
memex distill --scene personal

# Skip the optional LLM summarization pass (pure structural conversion)
memex distill --no-llm

# Convert a specific file
memex distill ./chat-log.jsonl

# Dry-run to preview
memex distill --dry-run
```

Output goes to `raw/<scene>/sessions/*.md` with `source-type: session` frontmatter; each file is treated as one source document by `memex ingest`.

That's the core loop. Everything past this point is **optional and opinionated** — added on top of Karpathy's pattern to solve specific pain points, but they trade simplicity for automation. Skim first, enable later.

---

## Advanced Workflows (optional, opinionated)

These two capabilities are **not part of Karpathy's original pattern**. They address real pain points (unattended maintenance, session-start context) but introduce new trade-offs — autonomous token burn, overlap with existing agent rules. Read before enabling.

### Continuous self-healing (`memex watch`)

`memex watch` can run an `ingest → lint → ingest` loop in the background, triggered by `raw/` changes *and/or* periodic health checks. Useful once you trust how the agent behaves on your vault; expensive if you don't (the daemon drives real agent calls autonomously).

```bash
# Foreground watcher (one-shot ingest + lint)
memex watch --once

# Daemonized self-healing loop (unlimited iterations, periodic health checks)
memex watch --daemon --heal

# Observe the live state (phase, iteration, current files, remaining issues)
memex watch --status

# Tail the daemon log in real time (like `tail -f`)
memex watch --follow

# Stop the daemon
memex watch --stop

# Keep looping even when the agent appears stuck (bypass the no-progress guard)
memex watch --daemon --force
```

The daemon records status to `.llmwiki/watch.status.json` and streams every ingest command + prompt head + agent stdout/stderr into `.llmwiki/watch.log`. Recommended first-run path: `memex watch --once` (foreground, single cycle) → inspect the log → only then consider `--daemon --heal`.

### Session-start context bootstrap (`memex context`)

`memex context install` writes a marker-delimited block into your project root's agent file so the vault location and a per-scene digest are in context from turn zero. This overlaps with what Cursor skills / a hand-maintained `CLAUDE.md` can already do — decide whether you want memex to own that region or leave it to you.

```bash
# Install the bootstrap block for the current project (auto-detects agent)
memex context install

# Refresh blocks across every project that has one registered
memex context refresh --all

# See where blocks are installed
memex context status

# Remove the block from the current project
memex context uninstall
```

Target files depend on the agent (`CLAUDE.md` for Claude Code, `AGENTS.md` for Codex/OpenCode, `.cursor/rules/memex.mdc` for Cursor, `GEMINI.md` for Gemini CLI, etc.). The block is idempotent — only the marker-wrapped region is rewritten, your surrounding prose is preserved. `memex onboard` and `memex install-hooks` offer to install it automatically.

---

## Architecture & Data Flow

`ai-memex-cli` uses a dual-vault system: a **default wiki vault** at `~/.llmwiki/` for your personal, compounding knowledge, and a **Local Vault** at `<project>/.llmwiki/local/` for project-specific context. Older installs may still use `~/.llmwiki/global/`; the CLI keeps resolving that path until you migrate.

```text
┌────────────────────────────────────────────────────┐
│ Layer 3: Agent Interface                           │
│  - ai-memex skill + /memex:* workflows             │
│  - Decides capture / ingest / query / distill      │
│  - Writes semantic wiki updates with citations     │
└────────────────────────────────────────────────────┘
                         ↕ (calls CLI when useful)
┌────────────────────────────────────────────────────┐
│ Layer 2: CLI Toolbox                               │
│  - Deterministic primitives: onboard / install /   │
│    fetch / search / lint / link-check / status     │
│  - Optional automation: distill parsing, context,  │
│    watch                                           │
│  - Handles paths, crawling, validation, setup      │
└────────────────────────────────────────────────────┘
                         ↕ (filesystem)
┌────────────────────────────────────────────────────┐
│ Layer 1: Vault Protocol                            │
│  ~/.llmwiki/                ← durable wiki root    │
│  <project>/.llmwiki/local/  ← project projection   │
│  raw/ · wiki/ · index.md · log.md · AGENTS.md      │
└────────────────────────────────────────────────────┘
```

### Vault Structure

```
~/.llmwiki/
├── AGENTS.md              # Schema + workflow rules for the agent
├── index.md               # Wiki index (maintained by agent during ingest)
├── log.md                 # Append-only action log
├── raw/                   # Immutable source material (agent never writes here)
│   ├── personal/          # Personal notes
│   ├── research/          # Fetched docs, articles (default for `memex fetch`)
│   ├── reading/           # Reading material
│   └── team/
│       └── sessions/      # Distilled agent transcripts (default for `memex distill`)
├── wiki/                  # Agent-maintained knowledge pages
│   ├── personal/
│   ├── research/
│   ├── reading/
│   └── team/
│       ├── entities/      # People, tools, orgs (one per real-world object)
│       ├── concepts/      # Ideas, patterns, methodologies
│       ├── sources/       # One page per external document (URL, PDF…)
│       └── summaries/     # Cross-page synthesis (subtype: overview/comparison/synthesis)
└── .llmwiki/
    ├── config.json        # Per-vault configuration (gitignored)
    ├── watch.pid          # `memex watch --daemon` process id
    ├── watch.log          # Self-healing daemon log (ingest cmd + prompt + agent stream)
    └── watch.status.json  # Live status snapshot read by `memex watch --status`
```

Two orthogonal dimensions classify every wiki page: **scene** (`personal` / `research` / `reading` / `team`) × **type** (`entity` / `concept` / `source` / `summary`). Physical path = `wiki/<scene>/<type>s/<slug>.md`; the `type:` frontmatter field uses the singular form.

---

## Command Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `memex onboard` | Interactive setup wizard — select agents, record each known session dir, init vault, install hooks, install L0 context block |
| `memex fetch <url\|keywords>` | Fetch URL, crawl sitemap, or search by keywords — saves clean Markdown to `raw/` |
| `memex ingest [target]` | Orchestrate your agent to process raw sources into structured wiki pages (accepts a lint report to drive self-healing) |
| `memex distill [session]` | Batch-convert agent session files into structured Markdown under `raw/<scene>/sessions/` |
| `memex watch` | Self-healing daemon: react to `raw/` changes + periodic health checks, drive `ingest ↔ lint` loop until converged |
| `memex context <sub>` | Manage the session-start context block (`install` / `refresh` / `uninstall` / `status`) — L0 bootstrap for agent sessions |
| `memex glob --project <dir>` | Project relevant global wiki pages into a local project vault |
| `memex inject` | Output concatenated wiki context for agent consumption |
| `memex search <query>` | Full-text search across wiki and raw files with relevance scoring |
| `memex lint` | Scan wiki health (orphans, broken links, missing frontmatter) |

### Utility Commands

| Command | Description |
|---------|-------------|
| `memex init` | Initialize a new vault manually |
| `memex new <type> <name>` | Scaffold a new wiki page from a template (entity, concept, source, summary) |
| `memex log <action>` | Append a formatted entry to the chronological `log.md` |
| `memex status` | View vault overview and statistics (supports `--json`) |
| `memex link-check` | Validate `[[wikilinks]]` across all pages |
| `memex install-hooks` | Generate custom slash commands for your agent |
| `memex config <sub>` | Manage CLI configuration (`set`, `get`, `list`, `agents`) |
| `memex update` | Self-update to the latest version (auto-detects npm or git install) |

### Command Details

#### `memex fetch`

```bash
# By URL
memex fetch <url>                          # Single page
memex fetch <url> --depth 2 --max-pages 30 # Recursive crawl
memex fetch <url> --sitemap --max-pages 50 # Sitemap crawl
memex fetch <url> --include "/docs/"       # Filter by path pattern

# By keyword search (DuckDuckGo, no API key)
memex fetch "<keywords>"                   # Interactive selection
memex fetch "<keywords>" --top 5           # Limit results
memex fetch "<keywords>" --yes             # Auto-fetch all results
memex fetch "<keywords>" --agent claude-code # Delegate to agent

# Common options
--scene <scene>     # Target scene folder (research/personal/reading)
--out <filename>    # Custom output filename
--dry-run           # Preview without fetching
```

#### `memex ingest`

```bash
memex ingest                    # Default: ingest all files in raw/
memex ingest raw/personal       # Fuzzy path — agent resolves it
memex ingest ~/docs/notes.md    # Specific file
memex ingest --agent codex      # Use a specific agent
memex ingest --dry-run          # Preview the prompt
```

#### `memex distill`

```bash
memex distill                        # Batch-convert ALL sessions from configured agent
memex distill --scene personal       # Land sessions under raw/personal/sessions/
memex distill --no-llm               # Skip the optional LLM summary pass
memex distill ./session.jsonl        # Convert a specific file
memex distill --agent claude-code    # Override agent (path auto-detected)
memex distill --dry-run              # Preview the prompt without writing
```

Each session becomes a Markdown file with YAML frontmatter (`source-type: session`, `started`, `ended`, `turns`, `sources`) plus per-turn `## 👤 User` / `## 🤖 Assistant` blocks. JSONL is **never** copied into the vault — the CLI reads from the agent's source dir and writes only the rendered Markdown.

#### `memex watch`

```bash
# Trigger modes
memex watch --once                     # Single ingest + lint then exit
memex watch                            # Foreground continuous loop
memex watch --daemon                   # Detached background daemon

# Self-healing controls
memex watch --daemon --max-iter 0      # Unlimited iterations (∞) — default
memex watch --daemon --max-iter 5      # Cap per-batch at 5 loops
memex watch --daemon --force           # Bypass the "no progress" guard
memex watch --daemon --heal            # Also run periodic health checks
memex watch --daemon --heal-interval 300000   # Health check every 5 min
memex watch --daemon --no-heal-on-start       # Skip the startup health check

# Observability
memex watch --status                   # Structured snapshot: phase, iter, files, issues, stats
memex watch --follow                   # tail -f the daemon log
memex watch --stop                     # Kill the running daemon
```

The daemon writes `.llmwiki/watch.{pid,log,status.json}`. Every ingest round logs the full command line, prompt head, and agent's stdout/stderr stream; every lint round logs the structured issue list so `watch --follow` is a complete audit trail.

#### `memex context`

```bash
memex context install                  # Write L0 block into project root (auto-detect agent)
memex context install --agent cursor   # Target a specific agent's file
memex context install --mode minimal   # Skip the wiki digest (vault location only)
memex context refresh --all            # Rewrite blocks for every registered project
memex context uninstall                # Remove the block from this project
memex context status                   # List all registered projects + liveness check
```

The installed block is delimited by `<!-- memex:context:start -->` / `<!-- memex:context:end -->` — only the region between those markers is rewritten by `refresh`, preserving any surrounding prose. Registry lives at `~/.llmwiki/contexts.json`; `memex watch` / `memex ingest` silently call `refresh --all` after every clean lint pass so the digest stays current.

#### `memex config`

```bash
memex config list              # Show all configuration
memex config get agent         # Get a specific key
memex config set agent codex   # Set fallback agent
memex config agents            # List all supported agents
```

#### `memex update`

```bash
memex update                   # Auto-update (detects npm or git)
memex update --check           # Only check for updates
memex update --source github   # Force update from GitHub
memex update --source npm      # Force update from npm
```

---

## Agent Slash Commands

If you ran `memex onboard` or `memex install-hooks`, you can trigger the CLI directly from your agent's chat interface.

### Claude Code

```
/memex:help                          # List all commands
/memex:status                        # View vault overview
/memex:fetch https://docs.example.com # Fetch documentation
/memex:fetch "react hooks tutorial"  # Search and fetch by keywords
/memex:ingest raw/personal           # Process raw files
/memex:distill                       # Batch-convert all sessions
/memex:search "authentication"       # Search knowledge base
/memex:lint                          # Health check
/memex:watch --daemon --heal         # Start self-healing daemon
/memex:new concept "React Hooks"     # Create new page
```

### Supported Agents

| Agent | Command Format | Files Generated |
|-------|---------------|-----------------|
| Claude Code | `.claude/commands/memex/*.md` + `.claude/skills/ai-memex/` | Slash commands + skill |
| Codex | `~/.codex/prompts/memex/*.md` + `AGENTS.md` section + `.codex/skills/ai-memex/` | `/memex:*` custom slash prompts + skill |
| OpenCode | `.opencode/commands/memex-*.md` | 10 slash commands |
| Gemini CLI | `.gemini/commands/memex-*.md` | 10 slash commands |
| Cursor | `.cursor/rules/memex.mdc` | Rule file |
| Aider | `.aider/commands/memex-*.md` | 10 slash commands |
| Continue.dev | `.continue/commands/memex-*.md` | 10 slash commands |

---

## Page Format

All wiki pages use YAML frontmatter for metadata and `[[wikilinks]]` for cross-referencing:

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

# React Hooks
...
```

Page types: `entity` (people, tools, orgs), `concept` (ideas, patterns), `source` (reference citations), `summary` (synthesized overviews).

---

## Cross-Platform Support

`ai-memex-cli` works on **Windows**, **macOS**, and **Linux**. All paths are automatically normalized:

- `~` is expanded to your home directory on all platforms
- Windows backslash paths (`~\.llmwiki\global\raw`) are handled correctly
- Vault resolution works from any directory (inside or outside `.llmwiki/`)

---

## Development

```bash
git clone https://github.com/zelixag/ai-memex-cli.git
cd ai-memex-cli
pnpm install
pnpm build
pnpm test
```

We use Vitest for testing. The suite covers all commands, core modules, and edge cases — including a dedicated TDD spec for the wiki self-healing loop (`tests/core/ingest-lint-loop.test.ts`) that locks in 12 behavioral contracts (clean convergence, `lintReport` propagation across iterations, the no-progress guard, `--force` bypass, `stopSignal`, `skipFirstIngest`, reporter event ordering, unlimited iterations, and ingest-error resilience).

Maintainers cutting a new npm release should read [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## License

MIT License © 2026
