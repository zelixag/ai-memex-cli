# Outreach Content

## X/Twitter Post

I finally built the tool @karpathy described in his LLM Wiki essay.

Instead of RAG (retrieve → synthesize → throw away, nothing compounds), ai-memex-cli maintains a persistent, interlinked Markdown wiki between you and your sources.

Git-backed. Zero LLM API calls. Works with Claude Code, Cursor, Codex...

github.com/zelixag/ai-memex-cli

"Obsidian is the IDE, the LLM is the programmer, the wiki is the codebase."

#AI #LLM #knowledgebase #memex #ClaudeCode

---

## Reddit r/LocalLLaMA Post

Title: Implementing Karpathy's LLM Wiki pattern – my experience building a compounding knowledge base

I've been experimenting with Andrej Karpathy's LLM Wiki pattern (gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and built a CLI tool to make it work with any AI agent.

The core insight: instead of RAG where the LLM re-derives knowledge from scratch on every query, the wiki is a persistent artifact that compounds over time. Cross-references already exist. contradictions are flagged, synthesis is already done.

What I built: ai-memex-cli (github.com/zelixag/ai-memex-cli)

- Git-backed Markdown wiki
- Zero LLM API calls from the CLI (uses your agent's own context)
- Works with Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Aider, Continue.dev
- Session distillation: turns agent transcripts into source material
- Web fetch + crawl + lint all built in

The workflow is now: you talk to your agent, the agent decides when to capture/ingest/query/distill. You never run CLI commands directly.

Curious if others are building something similar. How do you handle knowledge compounding with LLMs?

---

## Hacker News Show HN Post

Title: Show HN: ai-memex-cli – Karpathy's LLM Wiki pattern as a production CLI tool

Hey HN,

I've been building tools around Andrej Karpathy's LLM Wiki pattern (the gist where he describes a persistent, compounding wiki between you and raw sources, rather than RAG).

The core idea: instead of retrieving raw chunks on every query and throwing knowledge away, the LLM incrementally builds a structured, interlinked Markdown wiki. Cross-references already exist. Contradictions are flagged. The synthesis already reflects everything you've read.

ai-memex-cli implements this pattern:

- Git-backed Markdown vault (default: ~/.llmwiki/)
- Session distillation: convert agent transcripts into immutable raw material
- Web fetch: crawl URLs, sitemaps, or keyword search into raw/
- Semantic lint: two-layer health check (mechanical orphan/broken links + agent-level contradiction detection)
- Multi-agent: install once, works with Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Aider, Continue.dev
- Self-healing watch daemon: runs ingest → lint loop on raw/ changes

What it isn't: a RAG system, an MCP memory server, or a vector store. The CLI makes zero LLM API calls. Your local agent does all the semantic work.

The workflow is agent-native: you talk to your agent, the installed ai-memex skill handles when to capture/ingest/query/distill.

Would love feedback from anyone who's tried Karpathy's pattern or has thoughts on the architecture.

Repo: github.com/zelixag/ai-memex-cli

---

## Reddit r/ClaudeAI Post

Title: Tired of RAG systems that forget everything after each query? I built a tool that gives your AI agent a compounding memory.

Most AI agent workflows today use RAG: you upload docs, the agent retrieves chunks, synthesizes, and throws it all away. On the next question, it starts from scratch. Nothing compounds.

I built ai-memex-cli (github.com/zelixag/ai-memex-cli) which implements Karpathy's LLM Wiki pattern: the agent incrementally builds a persistent, interlinked Markdown wiki. Over time the wiki accumulates knowledge with cross-references already made, contradictions flagged, and synthesis already done.

The key difference: it uses your existing Claude Code (or Codex/Cursor/etc.) session context for all LLM work—no extra API calls from the CLI. The wiki is just Markdown files in Git, so you can read, edit, diff, and version-control everything.

If you've tried to give your agent real long-term memory, I'd love to hear what approaches have worked for you.

---

## dev.to Blog Post Outline

Title: Building a Compounding Knowledge Base with Claude Code and ai-memex-cli

1. The problem with RAG: why knowledge doesn't compound
2. Karpathy's LLM Wiki pattern: the insight
3. How ai-memex-cli implements it
4. Real workflow demo: from conversation to organized wiki
5. Why this works: the maintenance problem solved by LLMs
6. Comparison with other approaches
7. Getting started

---

## Email to Karpathy

Subject: Built the LLM Wiki CLI you described – would love your thoughts

Hi Andrej,

I implemented the LLM Wiki pattern from your 2025 essay as a production CLI tool: ai-memex-cli (github.com/zelixag/ai-memex-cli).

The key design decisions I made:
- Zero LLM API calls from CLI – the tool uses your local agent's session for all semantic work
- Git-backed vault with two layers: mechanical (CLI) + semantic (agent)
- Works with Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Aider, Continue.dev
- Session distillation: auto-converts agent transcripts into immutable raw material

The "Obsidian is the IDE, the LLM is the programmer, the wiki is the codebase" line from your essay ended up as the project tagline.

Would love your thoughts on the architecture, and whether you'd be willing to give it a try.

Best,
zhenglinxiong