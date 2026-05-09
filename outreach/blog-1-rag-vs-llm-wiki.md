---
title: "Why RAG Systems Forget Everything (And How Karpathy's LLM Wiki Pattern Fixes It)"
excerpt: "Most AI agent setups use RAG — and RAG throws knowledge away after every query. Here's the insight that changed how I think about AI memory."
published: false
target_platform: dev.to
target_submolt: codinghelp
tags: [AI, LLM, knowledge-base, Claude, RAG]
---

# Why RAG Systems Forget Everything (And How Karpathy's LLM Wiki Pattern Fixes It)

Here's what happens in most AI agent workflows today:

1. You upload documents to a vector store
2. You ask a question
3. The system retrieves relevant chunks, synthesizes an answer, and throws it away
4. Next question? Start from scratch. Nothing accumulated.

The LLM is **re-discovering knowledge from scratch on every single query**. Nothing compounds.

This is the problem Andrej Karpathy described in his 2025 LLM Wiki essay. And it's the reason I built [ai-memex-cli](https://github.com/zelixag/ai-memex-cli).

## The Core Insight

Instead of retrieving raw chunks at query time, the LLM should **incrementally build and maintain a persistent wiki** — a structured, interlinked collection of Markdown files that sits between you and the raw sources.

When you add a new source, the LLM doesn't just index it for later retrieval. It:
- Reads it fully
- Extracts key information
- Updates entity pages, revises topic summaries
- Notes where new data contradicts old claims
- Strengthens or challenges the evolving synthesis

The knowledge is compiled **once** and then kept current — not re-derived on every query.

## "Obsidian is the IDE, the LLM is the Programmer, the Wiki is the Codebase"

That line from Karpathy's essay became the tagline for the project. The workflow he describes:

1. Keep raw sources immutable — the LLM reads them but never modifies them
2. The LLM owns a wiki layer entirely — creates pages, updates them, maintains cross-references
3. A schema (AGENTS.md) tells the LLM how to behave — when to ingest, how to organize, how to lint

Over time: cross-references are already there, contradictions are flagged, synthesis already reflects everything you've read. The wiki gets richer with every source and every question.

## What I Built: ai-memex-cli

The tool implements Karpathy's pattern with a few twists:

- **Zero LLM API calls from CLI** — your existing Claude Code / Codex / Cursor session does all the semantic work
- **Git-backed vault** — `~/.llmwiki/` is just a directory of Markdown files. You can read, edit, diff, blame it
- **Session distillation** — converts agent transcripts into immutable raw material
- **Works with 8+ agents** — Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Aider, Continue.dev
- **Two-layer lint** — mechanical (orphaned pages, broken links) + semantic (contradiction detection via sub-agent)

## Why LLMs Fix the Maintenance Problem

The boring part of a knowledge base isn't reading or thinking. It's **bookkeeping**: updating cross-references, keeping summaries current, noting contradictions, maintaining consistency across many pages.

Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored, can touch 15 files in one pass, and can keep the system coherent while you focus on sourcing and asking good questions.

---

Would love to hear from others who've tried Karpathy's pattern. What approaches have worked for giving your agent real long-term memory?