# ai-memex-cli

> A universal, lightweight CLI for building and maintaining persistent LLM wikis. Stop re-deriving solutions and give your AI coding agents a long-term memory.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/ai-memex-cli.svg)](https://www.npmjs.com/package/ai-memex-cli)

Inspired by Andrej Karpathy's [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), `ai-memex-cli` provides the mechanical primitives needed to maintain a persistent, cross-referenced knowledge base. 

**The core philosophy:** The CLI handles mechanical correctness (file structure, frontmatter, linting, fetching), while your AI Agent handles semantic correctness (reading, synthesizing, linking).

---

## Why ai-memex-cli?

AI coding agents (like Claude Code, Codex, and Cursor) are incredibly powerful, but they suffer from amnesia. Every new session starts from scratch. 

While other tools attempt to solve this by running heavy background MCP servers or locking you into a single agent's ecosystem, `ai-memex-cli` takes a different approach:

1. **Universal Agent Support:** Works out-of-the-box with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, and more.
2. **Session Distillation:** Automatically parse your agent's recent session history and extract reusable best practices into your wiki.
3. **Terminal & Chat Integration:** Generate native slash commands (e.g., `/memex:ingest`) so you can trigger wiki updates directly from inside your agent's chat interface.
4. **Built-in Web Crawler + Keyword Search:** Fetch documentation sites by URL, crawl via sitemap, or simply search by keywords — all converted to clean Markdown in your `raw/` folder.
5. **Stateless & Secure:** The CLI itself makes **zero LLM API calls**. It simply constructs the right context and hands it off to your local agent process.

### How it compares to alternatives

| Feature | ai-memex-cli | atomicmemory/llm-wiki-compiler | ussumant/llm-wiki-compiler | SamurAIGPT/llm-wiki-agent | rohitg00/agentmemory |
|---------|--------------|--------------------------------|----------------------------|---------------------------|----------------------|
| **Architecture** | Stateless CLI + Agent Prompts | Standalone CLI (calls LLM API) | Claude Code Plugin | Pure Markdown Prompts | TypeScript MCP Server |
| **Agent Support** | **Universal (8+ agents)** | Anthropic API only | Claude Code only | Claude Code only | MCP-compatible only |
| **Web Fetching** | **Built-in crawler + Keyword search** | Single URL ingest | No | No | No |
| **Session Distillation**| **Yes (Role-based)** | No | No | No | Yes (Background) |
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

Run the onboarding wizard to select your preferred AI agent and initialize your global vault.

```bash
memex onboard
```

The wizard will walk you through 5 steps:
- **Step 1:** Choose your AI agent (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev, or Generic)
- **Step 2:** Auto-detect your agent's session directory (e.g., `~/.claude/projects/` for Claude Code)
- **Step 3:** Initialize the global vault at `~/.llmwiki/global/`
- **Step 4:** Install slash commands for your chosen agent
- **Step 5:** Save configuration to `~/.llmwiki/config.json`

For non-interactive environments (CI/scripts):

```bash
memex onboard --agent claude-code -y
```

### 2. Fetch Knowledge

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

### 3. Ingest into Wiki

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

### 4. Distill Your Sessions

Just finished a complex debugging session? Extract the best practices so you never have to solve it again.

```bash
# Distill the latest session from your configured agent
memex distill --latest --role backend

# Distill a specific session file
memex distill ./chat-log.jsonl --role "tech-lead"

# Distill with a specific agent
memex distill --latest --agent claude-code --role frontend

# Dry-run to preview
memex distill --latest --dry-run
```

The `--latest` flag automatically discovers the most recent session file from your agent's session directory (configured during onboard).

---

## Architecture & Data Flow

`ai-memex-cli` uses a dual-vault system: a **Global Vault** (`~/.llmwiki/global/`) for your personal, compounding knowledge, and a **Local Vault** (`.llmwiki/local/`) for project-specific context.

```text
┌─────────────────────────────────────────────────┐
│ Layer 3: Agent (Claude Code / Cursor / Codex)   │
│  - Reads raw docs, writes structured wiki pages │
│  - Synthesizes concepts and fixes lint issues   │
│  - Invokes memex commands via Bash/Slash cmds   │
└─────────────────────────────────────────────────┘
                       ↕ (shell + natural language prompts)
┌─────────────────────────────────────────────────┐
│ Layer 2: ai-memex-cli                           │
│  - Stateless primitives: onboard / fetch /      │
│    ingest / distill / glob / inject / lint /    │
│    search / update                              │
│  - Handles path resolution, web crawling, and   │
│    frontmatter validation                       │
└─────────────────────────────────────────────────┘
                       ↕ (fs)
┌─────────────────────────────────────────────────┐
│ Layer 1: Vault (filesystem)                     │
│  ~/.llmwiki/global/    ← CLI-managed source     │
│  <project>/.llmwiki/local/  ← agent projection  │
└─────────────────────────────────────────────────┘
```

### Vault Structure

```
~/.llmwiki/global/
├── AGENTS.md              # Agent instructions
├── index.md               # Wiki index
├── log.md                 # Chronological log
├── config.yaml            # Vault configuration
├── raw/                   # Unprocessed source material
│   ├── research/          # Fetched docs, articles
│   ├── personal/          # Personal notes
│   └── reading/           # Reading material
└── wiki/                  # Structured knowledge
    ├── research/
    │   ├── entities/      # People, tools, orgs
    │   ├── concepts/      # Ideas, patterns
    │   ├── sources/       # Reference citations
    │   └── summaries/     # Synthesized overviews
    └── personal/
        └── ...
```

---

## Command Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `memex onboard` | Interactive setup wizard — select agent, detect session dir, init vault, install hooks |
| `memex fetch <url\|keywords>` | Fetch URL, crawl sitemap, or search by keywords — saves clean Markdown to `raw/` |
| `memex ingest [target]` | Orchestrate your agent to process raw sources into structured wiki pages |
| `memex distill [session]` | Extract role-based best practices from agent session logs |
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
memex distill --latest                    # Latest session, auto-detect agent
memex distill --latest --role backend     # Filter by role
memex distill ./session.jsonl             # Specific file
memex distill --latest --agent claude-code # Use specific agent
memex distill --dry-run                   # Preview the prompt
```

#### `memex config`

```bash
memex config list              # Show all configuration
memex config get agent         # Get a specific key
memex config set agent codex   # Set default agent
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
/memex:distill --role frontend       # Distill session
/memex:search "authentication"       # Search knowledge base
/memex:lint                          # Health check
/memex:new concept "React Hooks"     # Create new page
```

### Supported Agents

| Agent | Command Format | Files Generated |
|-------|---------------|-----------------|
| Claude Code | `.claude/commands/memex-*.md` | 10 slash commands |
| Codex | `AGENTS.md` section | Embedded commands |
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

We use Vitest for testing. The test suite covers all commands, core modules, and edge cases (86 test cases, 100% pass rate).

---

## License

MIT License © 2026
