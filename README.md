# ai-memex-cli

> A universal, lightweight CLI for building and maintaining persistent LLM wikis. Stop re-deriving solutions and give your AI coding agents a long-term memory.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/ai-memex-cli.svg)](https://www.npmjs.com/package/ai-memex-cli)

Inspired by Andrej Karpathy's [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), `ai-memex-cli` provides the mechanical primitives needed to maintain a persistent, cross-referenced knowledge base. 

**The core philosophy:** The CLI handles mechanical correctness (file structure, frontmatter, linting, fetching), while your AI Agent handles semantic correctness (reading, synthesizing, linking).

---

## 🌟 Why ai-memex-cli?

AI coding agents (like Claude Code, Codex, and Cursor) are incredibly powerful, but they suffer from amnesia. Every new session starts from scratch. 

While other tools attempt to solve this by running heavy background MCP servers or locking you into a single agent's ecosystem, `ai-memex-cli` takes a different approach:

1. **Universal Agent Support:** Works out-of-the-box with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, and more.
2. **Session Distillation:** Automatically parse your agent's recent session history and extract reusable best practices into your wiki.
3. **Terminal & Chat Integration:** Generate native slash commands (e.g., `/memex:ingest`) so you can trigger wiki updates directly from inside your agent's chat interface.
4. **Built-in Web Crawler:** Fetch documentation sites, convert them to clean Markdown, and drop them into your `raw/` folder automatically.
5. **Stateless & Secure:** The CLI itself makes **zero LLM API calls**. It simply constructs the right context and hands it off to your local agent process.

### How it compares to alternatives

| Feature | ai-memex-cli | SamurAIGPT/llm-wiki-agent | rohitg00/agentmemory | Pratiyush/llm-wiki |
|---------|--------------|---------------------------|----------------------|--------------------|
| **Architecture** | Node.js CLI + Agent Prompts | Pure Markdown Prompts | TypeScript MCP Server | Python Static Site Gen |
| **Agent Support** | **Universal (8+ agents)** | Claude Code only | MCP-compatible only | Universal (via adapters) |
| **Onboarding** | **Interactive Wizard** | Manual file copying | Complex server setup | CLI init command |
| **Session Distillation** | **Yes (Role-based)** | No | Yes (Background) | Yes (JSONL to Markdown) |
| **Web Fetching** | **Built-in crawler + Agent mode** | No | No | No |
| **Slash Commands** | **Auto-generated for all agents** | Manual setup | N/A | N/A |

---

## 🚀 Installation & Quick Start

```bash
# Install globally via npm
npm install -g ai-memex-cli

# Or use the alias
ai-memex --version
```

### 1. Interactive Onboarding

Run the onboarding wizard to select your preferred AI agent and initialize your global vault.

```bash
memex onboard
```
*This will auto-discover your agent's session directory, initialize `~/.llmwiki/global`, and install custom slash commands.*

### 2. Fetch & Ingest Knowledge

Grab some documentation from the web and tell your agent to process it into the wiki.

```bash
# Fetch a webpage and convert to clean Markdown
memex fetch https://react.dev/reference/react/hooks

# Tell your agent to read the raw files and update the wiki
memex ingest
```

### 3. Distill Your Sessions

Just finished a complex debugging session? Extract the best practices so you never have to solve it again.

```bash
# Distill the latest session from your configured agent
memex distill --latest --role backend
```

---

## 🏗️ Architecture & Data Flow

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
│  - Stateless primitives: init / distill / glob  │
│    / ingest / fetch / inject / lint / search    │
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

---

## 💻 Command Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `memex onboard` | Interactive setup wizard (select agent, init vault, install hooks) |
| `memex fetch <url>` | Crawl a URL/sitemap and save as clean Markdown in `raw/` |
| `memex ingest [target]` | Orchestrate your agent to process raw sources into structured wiki pages |
| `memex distill <session>` | Extract best practices from an agent session log |
| `memex glob --project <dir>` | Project relevant global wiki pages into a local project vault |
| `memex inject` | Output concatenated wiki context for agent consumption |
| `memex search <query>` | Search across your wiki and raw files |
| `memex lint` | Scan wiki health (orphans, broken links, missing frontmatter) |

### Utility Commands

| Command | Description |
|---------|-------------|
| `memex init` | Initialize a new vault manually |
| `memex new <type> <name>` | Scaffold a new wiki page from a template |
| `memex log <action>` | Append a formatted entry to the chronological `log.md` |
| `memex status` | View vault overview and statistics |
| `memex link-check` | Validate `[[wikilinks]]` across all pages |
| `memex install-hooks` | Generate custom slash commands for your agent |
| `memex config` | Manage CLI configuration and default agent |
| `memex update` | Self-update the CLI to the latest version |

---

## 🤖 Agent Slash Commands

If you ran `memex onboard` or `memex install-hooks`, you can trigger the CLI directly from your agent's chat interface. For example, in Claude Code:

*   `/memex:fetch https://docs.example.com`
*   `/memex:ingest raw/personal`
*   `/memex:distill --role frontend`
*   `/memex:search "authentication"`
*   `/memex:status`

---

## 📄 Page Format

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

---

## 🛠️ Development

```bash
git clone https://github.com/zelixag/ai-memex-cli.git
cd ai-memex-cli
pnpm install
pnpm build
pnpm test
```

We use Vitest for testing. The test suite covers all commands, core modules, and edge cases (100% pass rate across 84 test cases).

---

## 📝 License

MIT License © 2026
