# LLM Wiki

A pattern for building personal knowledge bases using LLMs.

This is an idea file. It is designed to be copy-pasted to your own LLM agent, such as OpenAI Codex, Claude Code, OpenCode / Pi, or similar tools. Its goal is to communicate the high-level idea, while the agent builds out the specifics in collaboration with you.

## The core idea

Most people's experience with LLMs and documents looks like RAG: you upload a collection of files, the LLM retrieves relevant chunks at query time, and generates an answer. This works, but the LLM is rediscovering knowledge from scratch on every question. There is no accumulation. Ask a subtle question that requires synthesizing five documents, and the LLM has to find and piece together the relevant fragments every time. Nothing is built up. NotebookLM, ChatGPT file uploads, and most RAG systems work this way.

The idea here is different. Instead of just retrieving from raw documents at query time, the LLM incrementally builds and maintains a persistent wiki: a structured, interlinked collection of markdown files that sits between you and the raw sources. When you add a new source, the LLM does not just index it for later retrieval. It reads it, extracts the key information, and integrates it into the existing wiki by updating entity pages, revising topic summaries, noting where new data contradicts old claims, and strengthening or challenging the evolving synthesis. The knowledge is compiled once and then kept current, not re-derived on every query.

This is the key difference: the wiki is a persistent, compounding artifact. The cross-references are already there. The contradictions have already been flagged. The synthesis already reflects everything you have read. The wiki keeps getting richer with every source you add and every question you ask.

You never, or rarely, write the wiki yourself. The LLM writes and maintains all of it. You are in charge of sourcing, exploration, and asking the right questions. The LLM does the grunt work: summarizing, cross-referencing, filing, and bookkeeping. In practice, the pattern is to keep the LLM agent open on one side and Obsidian open on the other. The LLM makes edits based on the conversation, and the human browses the results in real time, following links, checking graph view, and reading updated pages. Obsidian is the IDE, the LLM is the programmer, and the wiki is the codebase.

This can apply in many contexts:

- Personal knowledge: goals, health, psychology, self-improvement, journal entries, articles, podcast notes.
- Research: reading papers, articles, and reports over time while building an evolving thesis.
- Reading a book: filing chapters, characters, themes, plot threads, and connections as you go.
- Business or team use: an internal wiki maintained from Slack threads, meeting transcripts, project docs, and customer calls.
- Competitive analysis, due diligence, trip planning, course notes, and hobby deep-dives.

## Architecture

There are three layers:

### 1. Raw sources

Your curated collection of source documents: articles, papers, images, and data files. These are immutable. The LLM reads from them but never modifies them. This is the source of truth.

### 2. The wiki

A directory of LLM-generated markdown files. Summaries, entity pages, concept pages, comparisons, overviews, and syntheses. The LLM owns this layer entirely. It creates pages, updates them when new sources arrive, maintains cross-references, and keeps everything consistent. You read it; the LLM writes it.

### 3. The schema

A document such as `CLAUDE.md` or `AGENTS.md` that tells the LLM how the wiki is structured, what conventions to follow, and which workflows to use when ingesting sources, answering questions, or maintaining the wiki. This turns the agent from a generic chatbot into a disciplined wiki maintainer. The user and the LLM co-evolve this schema over time.

## Operations

### Ingest

You drop a new source into the raw collection and tell the LLM to process it. One example flow:

- the LLM reads the source
- discusses key takeaways with you
- writes a summary page in the wiki
- updates the index
- updates relevant entity and concept pages
- appends an entry to the log

A single source might touch 10-15 wiki pages. One style is to ingest sources one at a time with active human involvement. Another is to batch-ingest many sources with less supervision. The exact workflow should be documented in the schema.

### Query

You ask questions against the wiki. The LLM searches for relevant pages, reads them, and synthesizes an answer with citations. Answers can take different forms depending on the question, such as:

- a markdown page
- a comparison table
- a slide deck in Marp
- a chart in matplotlib
- a canvas

The important insight is that good answers can be filed back into the wiki as new pages. Comparisons, analyses, and discovered connections are durable outputs and should not disappear into chat history.

### Lint

Periodically ask the LLM to health-check the wiki. Look for contradictions between pages, stale claims that newer sources have superseded, orphan pages with no inbound links, important concepts mentioned but lacking their own page, missing cross-references, and data gaps that could be filled with a web search. The LLM is also good at suggesting new questions to investigate and new sources to look for.

## Indexing and logging

Two special files help both the LLM and the human navigate the wiki.

### `index.md`

This file is content-oriented. It is a catalog of everything in the wiki, with each page listed alongside a link, a one-line summary, and optional metadata such as date or source count. The LLM updates it on every ingest. When answering a query, the LLM reads the index first to find relevant pages, then drills into them. At moderate scale, this can work surprisingly well without embedding-based RAG infrastructure.

### `log.md`

This file is chronological. It is an append-only record of what happened and when: ingests, queries, and lint passes. If each entry starts with a consistent prefix such as `## [2026-04-02] ingest | Article Title`, the log becomes parseable with simple shell tools. The log provides a timeline of the wiki's evolution and helps the LLM understand what has happened recently.

## Optional: CLI tools

At some point it may help to build small tools that let the LLM operate on the wiki more efficiently. The most obvious one is search. At small scale the index file may be enough, but at larger scale proper search becomes helpful. `qmd` is one option: a local search engine for markdown files with hybrid BM25/vector search and LLM re-ranking, all on-device. It has both a CLI and an MCP server. A simpler homemade script could also be enough.

## Tips and tricks

- Obsidian Web Clipper can convert web articles to markdown quickly.
- Download images locally so the LLM can inspect them later instead of relying on URLs.
- In Obsidian, graph view helps reveal the shape of the wiki.
- Marp can generate slide decks directly from markdown.
- Dataview can query page frontmatter to build tables and lists.
- The wiki is just a git repo of markdown files, which gives version history, branching, and collaboration.

## Why this works

The tedious part of maintaining a knowledge base is not the reading or the thinking. It is the bookkeeping: updating cross-references, keeping summaries current, noting contradictions, and maintaining consistency across many pages. Humans often abandon wikis because the maintenance burden grows faster than the value. LLMs are a good fit for this kind of repetitive maintenance because they do not get bored, can touch many files in one pass, and can keep the system coherent.

The human's job is to curate sources, direct the analysis, ask good questions, and think about what it all means. The LLM's job is everything else.

The idea is related in spirit to Vannevar Bush's Memex (1945): a personal, curated knowledge store with associative trails between documents. The missing piece in that vision was maintenance. The LLM provides that maintenance.

## Note

This document is intentionally abstract. It describes the pattern, not a single implementation. The exact directory structure, schema conventions, page formats, and tooling should vary by domain, preferences, and the chosen LLM. Everything here is optional and modular. The point is to communicate the pattern so the agent and the user can instantiate the version that fits their needs.
