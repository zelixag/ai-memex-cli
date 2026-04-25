import type { AppMessages } from "./zh-CN";

/** English copy. CLI examples stay English for copy-paste. */
export const enUS = {
  meta: {
    title: "ai-memex-cli — agent-native LLM wiki workflow",
    description:
      "An agent-native workflow built from Karpathy's LLM Wiki idea, powered by the memex CLI toolbox underneath.",
  },
  ui: {
    switchToZh: "中文",
    switchToEn: "English",
    languageToggleAria: "Switch site language",
    themeToggleAria: "Switch site theme",
    themeDefault: "Default",
    themeMono: "Mono",
    themeTech: "Tech",
  },
  navbar: {
    links: [
      { label: "Features", href: "#features" },
      { label: "Scenarios", href: "#scenarios" },
      { label: "Architecture", href: "#architecture" },
      { label: "Commands", href: "#commands" },
      { label: "Comparison", href: "#comparison" },
      { label: "Quick Start", href: "#quickstart" },
    ],
    github: "GitHub",
    getStarted: "Get Started",
  },
  scenarios: {
    sectionTitle: "Five agent-first knowledge workflows",
    sectionSubtitle:
      "Use memex from inside the agent conversation. You tell the agent what to capture, query, distill, or repair; the CLI runs underneath as the mechanical toolbox.",
    readArticle: "Read scenario",
    backToScenarios: "Back to scenarios",
    runIt: "Say this to the agent",
    articles: [
      {
        slug: "long-term-research",
        eyebrow: "Long-Term Research",
        title: "Research a topic through a living wiki",
        summary:
          "Study agent memory, LLM wiki, RAG, Claude Code, OpenSpec, or any long-running theme in one Git-backed knowledge base instead of one-off chats.",
        command: `You: /memex:capture https://example.com/agent-memory-paper --scene research
You: /memex:ingest new research sources and update the agent memory overview
You: /memex:query "what do we know about agent memory vs RAG?"`,
        body: [
          {
            heading: "How you use it",
            text:
              "You stay in the agent conversation. When you find an article, paper, repo, issue, or experiment note, ask the agent to capture it into raw sources. After a small batch, ask the agent to ingest the material into source, concept, entity, and summary pages.",
            steps: [
              "Keep the topic in the main user or company knowledge repo, usually under a research scene or tag.",
              "Ask the agent to capture sources before drawing conclusions, so raw evidence remains traceable.",
              "Ask the agent to ingest every few sources and merge findings into existing pages when possible.",
              "Ask it to update index.md and log.md with what changed, what was resolved, and what remains open.",
            ],
            code: `You: /memex:capture "agent memory design tradeoffs" --scene research
Agent: saves raw sources and records where they came from.
You: /memex:ingest them into source, concept, and summary pages.`,
          },
          {
            heading: "Recommended rhythm",
            text:
              "The loop is conversational: ask what the wiki already knows, read new material with that context, then ask the agent to fold durable conclusions back into the wiki. The user does not have to remember which low-level command to run.",
            steps: [
              "Start by asking the agent what the wiki already knows about the question.",
              "Capture new sources only when they add evidence, disagreement, or useful examples.",
              "Refresh an overview summary weekly instead of creating isolated summaries.",
              "When new evidence changes a judgment, keep the old and new sources visible.",
            ],
            code: `You: /memex:query "agent memory RAG tradeoff"
Agent: answers from the wiki and points out source gaps.
You: Capture these two new papers, then update the overview summary.`,
          },
          {
            heading: "What the wiki maintains",
            text:
              "The result is not a folder of saved links. The agent maintains a linked Markdown map with concepts, representative projects, source pages, current judgments, and open questions.",
            steps: [
              "concepts/agent-memory.md explains definitions, boundaries, and common implementations.",
              "summaries/agent-memory-vs-rag.md holds the current comparison and tradeoffs.",
              "sources/* records each source's origin, claims, evidence, and limits.",
              "index.md becomes a real map of the topic, not just a file listing.",
            ],
            code: `Agent maintains: wiki/research/concepts/agent-memory.md
Agent maintains: wiki/research/summaries/agent-memory-vs-rag.md
Agent maintains: index.md and log.md`,
          },
        ],
      },
      {
        slug: "long-term-project",
        eyebrow: "Long-Lived Project",
        title: "Maintain a project through shared memory",
        summary:
          "A project like ai-memex-cli should not require each new agent to rediscover architecture, command boundaries, pitfalls, feedback, and roadmap decisions.",
        command: `You: Scan this repo and draft project memory from the current code. Do not copy the whole codebase.
You: /memex:ingest this code-reading pass, existing docs, issues, and distilled conversations.
You: Before future edits, /memex:query project memory; after important work, /memex:distill.`,
        body: [
          {
            heading: "How you use it",
            text:
              "The canonical knowledge base is the main user or company repo. A project repo connects to it through installed agent context and relevant scenes. The code repository remains the live source of truth; memex stores durable project knowledge the agent extracts from code, docs, issues, PRs, user feedback, and sessions.",
            steps: [
              "Use onboard or install commands once so each selected agent knows where the main memex vault lives.",
              "When first connecting a project, ask the agent to read the current README, docs, config, entrypoints, and core modules, then draft project memory.",
              "At the start of daily work, ask the agent to query project memory, then read the latest source files as needed.",
              "After meaningful implementation, debugging, or positioning work, ask the agent to distill the session and ingest stable conclusions back into project pages.",
            ],
            code: `You: Connect this repo to my main memex knowledge base.
Agent: installs project/user context and records the relevant scenes.
You: Read the current code and docs, then draft architecture, command-design, and testing-contracts pages.`,
          },
          {
            heading: "Where project knowledge comes from",
            text:
              "Do not copy the whole codebase into raw. The Git repo is already the source of truth and the agent reads it live. raw is better for external material, issue/PR summaries, user feedback, session distillation, and code-reading notes that cite paths and commits. wiki stores durable understanding, not a mirror of source code.",
            steps: [
              "Current code: the agent reads the latest files during the task and cites file paths, modules, and commits in the wiki instead of copying source.",
              "Project docs: README, docs, ADRs, and release notes can be captured or summarized into raw/source material.",
              "Collaboration material: issues, PRs, user feedback, and roadmap discussions can become raw sources before ingest.",
              "Session distillation: important design choices, debugging paths, tradeoffs, and next actions enter raw/sessions through distill.",
            ],
            code: `You: Read src/commands, src/core, and tests, then create a project structure map.
Agent: reads the live code and writes a path-cited code-reading source.
You: Ingest that source into the wiki without copying full source files.`,
          },
          {
            heading: "Recommended pages",
            text:
              "The agent should maintain pages that explain why the system is shaped the way it is, how current code is organized, and which contracts must stay intact. The goal is not a transcript archive or a source mirror; it is a small set of reliable pages the next session reads before checking live code.",
            steps: [
              "architecture-decisions: why CLI plus agent was chosen and why the CLI avoids semantic writing.",
              "command-design: each command's boundary, input, output, and flow.",
              "code-map: core directories, entrypoints, module relationships, and test locations, with paths but without copied code.",
              "known-pitfalls: Windows paths, sandbox behavior, and fallback when agent commands are missing.",
              "testing-contracts: behavior that command changes must preserve.",
            ],
            code: `You: /memex:ingest the current code-reading source and session conclusions into project architecture notes.
Agent: updates existing decision, code-map, and command-design pages.
You: Also log the user feedback that changed the roadmap.`,
          },
          {
            heading: "What you get",
            text:
              "Project memory moves out of scattered chats and commits into durable Markdown. Days later, the agent can recover why a design exists, which paths were rejected, and which tests must not be broken.",
            steps: [
              "A new agent starts by querying the current task's memory before editing source code.",
              "The agent can explain existing design reasons instead of re-deriving history.",
              "Feedback and roadmap items are linked, not buried in chat.",
              "log.md shows recent iterations and decisions.",
            ],
            code: `You: /memex:query "continue ai-memex-cli website and CLI docs work"
Agent: returns the relevant project pages and recent handoff notes.
You: Continue from those notes and update the wiki when done.`,
          },
        ],
      },
      {
        slug: "cross-agent-continuity",
        eyebrow: "Cross-Session Continuity",
        title: "Carry context across agents and sessions",
        summary:
          "Claude may start something today, Codex may continue tomorrow, Cursor may inspect it later. The continuity lives in the wiki, not in one vendor's chat history.",
        command: `You: /memex:distill this Codex session as a handoff
You: /memex:ingest the handoff into project memory
You: /memex:query "resume the unfinished website scenario rewrite"`,
        body: [
          {
            heading: "How you use it",
            text:
              "Once selected agents are onboarded, memex knows their session stores. Inside whichever agent you are using, ask it to distill the current session, ingest the durable parts, and write a handoff that another agent can pick up.",
            steps: [
              "Before ending a long session, ask the current agent to distill the conversation.",
              "Ask it to ingest the distilled source into project summaries and log.md.",
              "Make it write next actions: where to continue, which files changed, and what validation remains.",
              "If work stopped midstream, record blockers and assumptions.",
            ],
            code: `You: /memex:distill this session with next actions and blockers.
Agent: finds the current agent session, writes a raw session source, and summarizes it.
You: Ingest that handoff into the project memory.`,
          },
          {
            heading: "How it works across agents",
            text:
              "Claude, Codex, OpenCode, Cursor, and Gemini do not need to share one chat window. They share raw/, wiki/, index.md, and log.md. One agent writes knowledge in; another reads it back out.",
            steps: [
              "Onboard all agents the user wants to use so their prompts and session directories are configured.",
              "The ending agent distills and ingests the session into the shared knowledge repo.",
              "The next agent starts with a query or context request for the current task.",
              "lint and link-check keep the shared wiki usable after multiple agents edit it.",
            ],
            code: `You: Onboard Claude Code, Codex, and Cursor for this memex vault.
Agent: installs each supported slash prompt or skill and records session directories.
You: /memex:query "resume interrupted work"`,
          },
          {
            heading: "What you get",
            text:
              "Continuity no longer depends on a single vendor's chat history. You can change agent, change model, or come back days later and still recover task state from the same durable wiki.",
            steps: [
              "Every handoff appears in log.md.",
              "Unfinished work has concrete next actions.",
              "The next agent can cite existing wiki pages in its first response.",
              "Switching tools or waiting several days does not drop context.",
            ],
            code: `You: /memex:query "next actions blocker handoff"
Agent: shows the latest handoff pages and unresolved work.
You: Continue from the listed next action.`,
          },
        ],
      },
      {
        slug: "distill-good-conclusions",
        eyebrow: "Distill Conclusions",
        title: "Preserve the conclusions that happen inside chat",
        summary:
          "When a conversation clarifies positioning, design, tradeoffs, or a bug root cause, ask the agent to distill it and merge the stable conclusions into the wiki.",
        command: `You: /memex:distill this conversation because we clarified product positioning
You: /memex:ingest only the durable conclusions into existing pages
You: /memex:query "positioning tradeoff rejected alternatives"`,
        body: [
          {
            heading: "How you use it",
            text:
              "When a chat produces a real conclusion, stay in the chat and ask the agent to preserve it. The session becomes traceable source material first; only stable conclusions get merged into concept, summary, or project pages.",
            steps: [
              "Ask the agent to distill the current conversation while the context is still fresh.",
              "Have it read that session source and extract only reusable, stable conclusions.",
              "Merge conclusions into existing pages instead of always creating new pages.",
              "Keep the session source link so future readers can trace why the judgment was made.",
            ],
            code: `You: /memex:distill this discussion as product-positioning source material.
Agent: saves the session with context, decisions, and unresolved questions.
You: Ingest it, but merge into existing positioning pages if they already exist.`,
          },
          {
            heading: "What deserves distillation",
            text:
              "Product positioning, architecture boundaries, rejected alternatives, root-cause analysis, testing contracts, user feedback interpretation, command naming, and website copy strategy are all worth preserving.",
            steps: [
              "Positioning: how to describe the product and which phrasing to avoid.",
              "Architecture boundary: why the CLI stays mechanical and agents own semantics.",
              "Bug root cause: investigation path, actual cause, and regression test.",
              "User feedback: what felt wrong and how the feature or website should change.",
            ],
            code: `You: /memex:query "positioning architecture tradeoff bug root cause"
Agent: finds existing pages before writing.
You: Add today's conclusion without duplicating those pages.`,
          },
          {
            heading: "What you get",
            text:
              "Chat stops being disposable. Important reasoning becomes a traceable source first, then structured wiki knowledge. Later queries can find both the conclusion and why it was reached.",
            steps: [
              "Conclusions are readable in summary/concept pages, not hidden in a transcript.",
              "Source pages keep the original session material.",
              "Important tradeoffs include rejected alternatives.",
              "When a judgment changes later, the wiki records why and from which new source.",
            ],
            code: `You: /memex:query "rejected alternatives"
Agent: answers from the maintained wiki and cites source pages.
You: Update the page if today's conclusion changes the old judgment.`,
          },
        ],
      },
      {
        slug: "ai-maintained-structured-knowledge",
        eyebrow: "Structured Maintenance",
        title: "Let AI maintain structured knowledge, not just answer once",
        summary:
          "The goal is not one question and one answer. The agent maintains entities, concepts, sources, summaries, index, and log so knowledge gets updated, linked, merged, and checked.",
        command: `You: /memex:status
You: /memex:repair fix broken links and stale frontmatter, ask before semantic merges
You: /memex:query "open questions stale pages duplicate concepts"`,
        body: [
          {
            heading: "How you use it",
            text:
              "Treat the agent as a wiki maintainer, not only an answer engine. You ask for capture, ingest, query, distill, repair, and status in natural language or slash prompts; the agent decides which memex primitives to call.",
            steps: [
              "When a source arrives, the agent updates its source page and links related concepts/entities.",
              "When a concept clarifies, it updates definition, boundary, and examples.",
              "When several sources support a judgment, it updates a summary page.",
              "Important maintenance actions are logged so future agents can trace changes.",
            ],
            code: `You: Add Karpathy's LLM Wiki gist to the knowledge base.
Agent: captures the source, creates or updates the relevant concept page, and logs the change.
You: Show me what changed and what still needs review.`,
          },
          {
            heading: "CLI and agent boundary",
            text:
              "The CLI owns mechanical correctness: paths, frontmatter, broken links, search, templates, status, and session parsing. The agent owns semantic correctness: which pages to update, which concepts to link, which contradictions to preserve, and which summaries to rewrite.",
            steps: [
              "The CLI handles deterministic file and validation work.",
              "The agent decides what to write, link, merge, and preserve as contradiction.",
              "The user sets schema and quality standards, such as which page types require sources.",
              "For complex repair, the agent should show the plan before broad semantic edits.",
            ],
            code: `You: /memex:repair the wiki structure.
Agent: runs lint/link checks, proposes semantic fixes, and asks before risky merges.
You: Apply the mechanical fixes and leave uncertain claims for review.`,
          },
          {
            heading: "What you get",
            text:
              "The wiki becomes a maintained structured system, not an archive. Every time the agent uses it, it can also improve it; every repair pass keeps it readable, linkable, and traceable.",
            steps: [
              "New sources cause existing concepts and summaries to update.",
              "Duplicate pages are merged or marked.",
              "Orphans and broken links are found regularly.",
              "index.md works as a real navigation surface.",
            ],
            code: `You: /memex:status
Agent: reports vault health, recent sources, stale pages, and next maintenance actions.
You: Do the safe repairs and summarize the remaining risks.`,
          },
        ],
      },
    ],
  },
  hero: {
    imgAlt: "Knowledge cartography desk",
    badge: "Karpathy LLM Wiki × agent-native",
    titleLine1: "Let agents build and use",
    titleLine2: "your LLM wiki",
    subtitle:
      "Built from Karpathy's LLM Wiki idea, but designed so your AI agent is the daily interface: the skill decides when to capture, ingest, query, distill, or repair; the memex CLI provides the underlying infrastructure for raw sources, search, lint, link checks, session parsing, and setup.",
    copyTitle: "Copy to clipboard",
    copy: "Copy",
    quickStart: "Quick Start Guide",
    viewGithub: "View on GitHub",
  },
  features: {
    sectionTitle: "Core pipeline",
    sectionSubtitle:
      "The agent manages and uses the knowledge base; the CLI supplies stable, scriptable, auditable mechanical primitives underneath.",
    blocks: [
      {
        title: "Build the wiki",
        subtitle: "Karpathy's idea, engineered for daily use",
        description:
          "memex fetch drops raw sources into raw/ (URLs, sitemaps, DuckDuckGo keyword search, or agent-delegated fetching). memex ingest then hands raw/ to your agent and has it integrate new material into wiki/ — updating entity / concept pages, the index, and the log in one pass. Cross-references are already there.",
        code: `memex fetch "react hooks best practices" --top 5
memex fetch https://nextjs.org/sitemap.xml --sitemap
memex ingest`,
      },
      {
        title: "Distill sessions",
        subtitle: "Turn useful sessions into raw material",
        description:
          '"Good answers can be filed back into the wiki as new pages." memex distill batch-converts every agent session you have had into structured Markdown under raw/<scene>/sessions/, ready to be re-ingested. This is the mechanism that makes debugging a tough bug yesterday inform tomorrow\'s question.',
        code: `memex distill
memex distill --scene personal
memex distill --no-llm`,
      },
      {
        title: "One CLI, every agent",
        subtitle: "CLI as infrastructure — agent as interface",
        description:
          "Works with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev, and generic CLI agents. memex itself makes zero API calls — it stages the right files and prompts; your local agent's session handles the LLM work. The wiki is plain Markdown you can git diff / blame.",
        code: `memex onboard
memex install-hooks --agent cursor
memex ingest --agent codex`,
      },
    ],
    small: [
      {
        title: "Query on demand",
        description:
          "memex search runs keyword / BM25 scoring across the full vault. memex inject pulls the relevant wiki pages into your agent prompt when the session needs them.",
      },
      {
        title: "Health you can lint",
        description:
          "memex lint / memex link-check flag orphans, broken [[wikilinks]], missing frontmatter, and suspicious cross-references; nuanced repairs stay agent-reviewed.",
      },
      {
        title: "Schema you own",
        description:
          "AGENTS.md is your wiki's constitution, co-evolved between you and the LLM. memex init gives a working default; edit it until it fits your domain.",
      },
    ],
    advanced: {
      kicker: "Advanced automation — opinionated, opt-in",
      title: "Advanced workflows",
      subtitleBefore: "These layer on top of the core pipeline and are ",
      subtitleStrong: "off by default",
      subtitleAfter:
        ". Useful, but they trade simplicity for automation — skim first, enable small.",
      cards: [
        {
          title: "memex watch --daemon --heal",
          label: "Advanced · opt-in",
          description:
            "Long-lived background loop: ingest → lint → ingest until the wiki reaches zero issues. Convenient, but it burns agent tokens autonomously. Try memex watch --once in the foreground first.",
          code: `memex watch --once
memex watch --daemon --heal`,
        },
        {
          title: "memex context install",
          label: "Advanced · opt-in",
          description:
            'Writes a marker-delimited "vault digest" block into the current agent file (CLAUDE.md, AGENTS.md, GEMINI.md, or .cursor/rules/memex.mdc), so every new agent session opens with the wiki location and a scene summary already in context.',
          code: `memex context install
memex context refresh
memex context status`,
        },
      ],
    },
  },
  architecture: {
    sectionTitle: "Architecture",
    sectionSubtitle:
      "Three clean layers. The CLI never calls an LLM — it constructs context and hands it to your agent.",
    diagramAlt: "ai-memex-cli architecture diagram",
    layers: [
      {
        label: "Layer 3 — AI Agent",
        desc: "Claude Code, Codex, Cursor, OpenCode, Gemini CLI, Aider, Continue.dev, Generic",
      },
      {
        label: "Layer 2 — ai-memex-cli",
        desc:
          "Stateless primitives: onboard · init · fetch · ingest · distill · watch · context · glob · inject · search · lint · link-check · config · update",
      },
      {
        label: "Layer 1 — Vault (filesystem)",
        desc: "~/.llmwiki/ (personal) + .llmwiki/local/ (project)",
      },
    ],
    flowLeft: "↕ shell + prompts",
    flowRight: "↕ filesystem",
    vaultTitle: "Vault Structure",
    vaultIntro:
      "A dual-vault system: Global for long-lived knowledge, Local for project-specific context.",
    vaultTree: [
      { indent: 0, text: "~/.llmwiki/", highlight: true },
      { indent: 1, text: "AGENTS.md", note: "Agent instructions (wiki constitution)" },
      { indent: 1, text: "index.md", note: "Wiki index" },
      { indent: 1, text: "log.md", note: "Chronological log" },
      { indent: 1, text: "config.json", note: "Vault configuration" },
      { indent: 1, text: "raw/", highlight: true },
      { indent: 2, text: "research/", note: "Fetched docs, articles" },
      { indent: 2, text: "personal/", note: "Personal notes" },
      { indent: 2, text: "reading/", note: "Reading material" },
      { indent: 2, text: "team/", note: "Team-shared knowledge" },
      { indent: 3, text: "sessions/", note: "Structured session md (distill default)" },
      { indent: 1, text: "wiki/", highlight: true },
      { indent: 2, text: "research/" },
      { indent: 3, text: "entities/", note: "People, tools, orgs" },
      { indent: 3, text: "concepts/", note: "Ideas, patterns" },
      { indent: 3, text: "sources/", note: "Reference citations" },
      { indent: 3, text: "summaries/", note: "Synthesized overviews" },
    ],
    principleTitle: "Core Design Principle",
    principleLead: "The CLI makes ",
    principleStrong: "zero LLM API calls",
    principleTail:
      ". It handles mechanical correctness (file structure, frontmatter, linting, fetching), while your AI Agent handles semantic correctness (reading, synthesizing, linking).",
  },
  commands: {
    sectionTitle: "Command Reference",
    sectionSubtitle:
      "18 commands covering the full lifecycle — from fetching and ingesting raw sources to distilling sessions, linting wiki health, and installing slash commands in your agent.",
    coreTab: (n: number) => `Core Commands (${n})`,
    utilTab: (n: number) => `Utility Commands (${n})`,
    options: "Options",
    core: {
      onboard: {
        desc: "Interactive setup wizard — select agent, detect session dir, init vault, install hooks.",
        usage: "memex onboard\nmemex onboard --agent claude-code -y",
        flags: [
          "--agent <name>  Specify agent (skip selection)",
          "-y  Non-interactive mode",
        ],
      },
      fetch: {
        desc: "Fetch URL, crawl sitemap, or search by keywords — saves clean Markdown to raw/.",
        usage:
          'memex fetch https://react.dev/reference/react/hooks\nmemex fetch "react hooks best practices" --top 5\nmemex fetch https://nextjs.org/sitemap.xml --sitemap',
        flags: [
          "--depth <n>     Recursive crawl depth",
          "--sitemap       Crawl via sitemap.xml",
          "--max-pages <n> Limit pages to crawl",
          "--top <n>       Limit keyword search results",
          "--yes           Auto-fetch all results",
          "--agent <name>  Delegate to agent",
          "--scene <name>  Target scene folder",
        ],
      },
      ingest: {
        desc: "Orchestrate your agent to process raw sources into structured wiki pages.",
        usage: "memex ingest\nmemex ingest raw/personal\nmemex ingest --agent codex --dry-run",
        flags: ["--agent <name>  Use specific agent", "--dry-run       Preview prompt only"],
      },
      distill: {
        desc: "Batch-convert every agent session into structured Markdown under raw/<scene>/sessions/, ready to be re-ingested.",
        usage:
          "memex distill\nmemex distill --scene personal\nmemex distill --no-llm\nmemex distill ./chat-log.jsonl",
        flags: [
          "--scene <name>  Target scene folder (default: team)",
          "--agent <name>  Use specific agent's sessions",
          "--no-llm        Skip optional LLM summarization pass",
          "--dry-run       Preview prompt only",
        ],
      },
      watch: {
        desc: "Background self-healing loop: ingest → lint → ingest. Triggered by raw/ changes and/or periodic health checks. Opinionated and agent-token-hungry.",
        usage:
          "memex watch --once\nmemex watch --daemon --heal\nmemex watch --follow\nmemex watch --status",
        flags: [
          "--once           One-shot ingest + lint, then exit",
          "--daemon         Detach into background",
          "--heal           Periodic lint-driven healing",
          "--heal-interval  How often to re-lint in ms (default 60000)",
          "--max-iter <n>   Cap loop iterations (0 = unlimited)",
          "--force          Bypass the \"no-change\" guard",
          "--follow / -f    Tail .llmwiki/watch.log",
          "--status         Read live snapshot (watch.status.json)",
        ],
      },
      glob: {
        desc: "Project relevant global wiki pages into a local project vault.",
        usage: "memex glob --project ./my-app\nmemex glob --keywords react,hooks --max 20",
        flags: [
          "--project <dir>  Target project directory",
          "--keywords <kw>  Comma-separated keywords",
          "--max <n>        Max pages to project",
        ],
      },
      inject: {
        desc: "Output concatenated wiki context for agent consumption.",
        usage: 'memex inject --task "implement authentication"\nmemex inject --format json',
        flags: [
          "--task <text>    Task description for relevance",
          "--keywords <kw>  Comma-separated keywords",
          "--format <fmt>   Output format (md/json)",
          "--max-tokens <n> Token budget",
        ],
      },
      search: {
        desc: "Full-text search across wiki and raw files with relevance scoring.",
        usage: 'memex search "authentication"\nmemex search "react hooks" --limit 10 --json',
        flags: [
          "--scene <name>       Filter by scene",
          "--type <type>        Filter by page type",
          "--engine <engine>    ripgrep, qmd, or hybrid",
          "--json              Output JSON",
          "--limit <n>          Max results",
          "--no-include-raw     Search wiki/ only",
        ],
      },
      lint: {
        desc: "Scan wiki health — orphans, broken links, missing frontmatter.",
        usage: "memex lint\nmemex lint --json\nmemex lint --check frontmatter,links",
        flags: [
          "--scene <name>   Filter by scene",
          "--check <list>   Comma-separated checks",
          "--json           Output JSON",
        ],
      },
    },
    util: {
      init: {
        desc: "Initialize a new vault manually.",
        usage: "memex init\nmemex init --scope local --scene research,team\nmemex init --agent codex",
        flags: [
          "--scope <scope>  global or local",
          "--scene <list>   Comma-separated scenes",
          "--agent <id>     Schema filename agent for global vaults",
        ],
      },
      new: {
        desc: "Scaffold a new wiki page from a template.",
        usage: 'memex new concept "React Hooks"\nmemex new entity "Anthropic"',
        flags: ["<type>  entity | concept | source | summary", "<name>  Page name"],
      },
      log: {
        desc: "Append a formatted entry to the chronological log.md.",
        usage: 'memex log decision --target auth --note "Chose PKCE"',
        flags: [
          "--target <name>  Target page or topic",
          "--note <text>    Note text",
        ],
      },
      status: {
        desc: "View vault overview and statistics.",
        usage: "memex status\nmemex status --vault ~/.llmwiki",
        flags: ["--vault <path>  Vault path"],
      },
      "link-check": {
        desc: "Validate [[wikilinks]] across all pages.",
        usage: "memex link-check\nmemex link-check --fix",
        flags: [
          "--fix           Suggest fixes",
          "--vault <path>  Vault path",
        ],
      },
      context: {
        desc: 'Write a marker-delimited vault digest (L0) into the agent host file so every new agent session opens with the wiki location + scene summary already in context.',
        usage:
          "memex context install\nmemex context install --agent claude-code,codex\nmemex context refresh --all\nmemex context status\nmemex context uninstall",
        flags: [
          "install         Insert L0 digest into agent files",
          "refresh         Re-generate digest (all registered projects)",
          "status          Show registered projects + last refresh",
          "uninstall       Remove L0 block",
          "--scene <list>  Bind wiki scenes",
          "--mode <mode>   minimal or digest",
        ],
      },
      "install-hooks": {
        desc: "Generate native /memex:* slash commands or agent rules for supported agents (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, generic).",
        usage:
          "memex install-hooks\nmemex install-hooks --agent codex --scope user\nmemex install-hooks --agent cursor --no-context",
        flags: [
          "--agent <name>  Target agent (skip detection)",
          "--scope <scope> project or user",
          "--project <dir> Project directory",
          "--no-context    Don't install L0 context block",
          "--context-mode  minimal or digest",
          "--dry-run       Preview files only",
        ],
      },
      config: {
        desc: "Manage CLI configuration and default agent.",
        usage: "memex config list\nmemex config set agent codex\nmemex config agents",
        flags: [
          "set <key> <val>  Set a config value",
          "get <key>        Get a config value",
          "list             Show all config",
          "agents           List supported agents",
        ],
      },
      update: {
        desc: "Self-update to the latest version.",
        usage: "memex update\nmemex update --check\nmemex update --source github",
        flags: [
          "--check          Only check for updates",
          "--source <src>   Force npm or github",
        ],
      },
    },
  },
  comparison: {
    sectionTitle: "How We Compare",
    sectionSubtitle:
      "Aligned with the README table: stateless CLI, universal agents, zero API cost from memex, and native integration.",
    colFeature: "Feature",
    colThisProject: "This project",
    thisProjectBadge: "★ This project",
    rows: [
      {
        feature: "Architecture",
        values: [
          "Stateless CLI + Agent Prompts",
          "Standalone CLI (calls LLM API)",
          "Claude Code Plugin",
          "Pure Markdown Prompts",
          "TypeScript MCP Server",
        ],
      },
      {
        feature: "Agent Support",
        values: [
          "Universal (8+ agents)",
          "Anthropic API only",
          "Claude Code only",
          "Claude Code only",
          "MCP-compatible only",
        ],
      },
      {
        feature: "Web Fetching",
        values: [
          "Built-in crawler + keyword search",
          "Single URL ingest",
          "No",
          "No",
          "No",
        ],
      },
      {
        feature: "Session Distillation",
        values: [
          "Yes (batch, structured MD)",
          "No",
          "No",
          "No",
          "Yes (background)",
        ],
      },
      {
        feature: "Slash Commands",
        values: [
          "Auto-generated for all agents",
          "No",
          "Built-in (plugin)",
          "Manual setup",
          "N/A",
        ],
      },
      {
        feature: "Interactive Onboarding",
        values: ["Yes (wizard)", "No", "No", "No", "No"],
      },
      {
        feature: "Self-Update",
        values: ["Yes (memex update)", "No", "No", "No", "No"],
      },
      {
        feature: "Cost",
        values: [
          "Free (uses agent session)",
          "Requires API Key",
          "Free (uses Claude session)",
          "Free",
          "Requires API Key",
        ],
      },
    ],
    footnote:
      "Comparison based on publicly available documentation as of April 2026. atomicmemory/llm-wiki-compiler, ussumant/llm-wiki-compiler, SamurAIGPT/llm-wiki-agent, rohitg00/agentmemory.",
  },
  quickStart: {
    sectionTitle: "Quick Start",
    sectionSubtitle: "From zero to a working knowledge base in under 5 minutes.",
    steps: [
      {
        number: "01",
        title: "Install",
        description:
          "Install globally via npm. The CLI provides two aliases: memex and ai-memex.",
        code: `npm install -g ai-memex-cli\nmemex --version`,
      },
      {
        number: "02",
        title: "Onboard",
        description:
          "Run the interactive wizard. It detects your AI agent, initializes the vault, and installs slash commands.",
        code: `memex onboard\n# → Choose agent: Claude Code\n# → Session dir: ~/.claude/projects/\n# → Vault initialized at ~/.llmwiki/\n# → Slash commands installed`,
      },
      {
        number: "03",
        title: "Fetch Knowledge",
        description:
          "Grab documentation from URLs or search by keywords. Everything is saved as clean Markdown under raw/.",
        code: `memex fetch https://react.dev/reference/react/hooks\nmemex fetch "typescript generics tutorial" --top 3`,
      },
      {
        number: "04",
        title: "Ingest & Distill",
        description:
          "Distill every session into structured Markdown under raw/<scene>/sessions/, then run ingest so your agent integrates raw/ into wiki/. Consider watch/context only after you trust the loop.",
        code: `memex distill\nmemex ingest\n# optional: memex watch --once`,
      },
      {
        number: "05",
        title: "Search & Use",
        description:
          "Search your knowledge base, lint for health, and inject wiki context into agent sessions on demand.",
        code: `memex search "authentication patterns"\nmemex lint\nmemex inject`,
      },
    ],
    cta: "View Full Documentation on GitHub",
  },
  footer: {
    tagline:
      "An agent-native workflow built from Karpathy's LLM Wiki idea: the CLI provides infrastructure, the agent manages and uses the knowledge base.",
    navTitle: "Navigation",
    agentsTitle: "Supported Agents",
    resourcesTitle: "Resources",
    githubRepo: "GitHub Repository",
    npmPackage: "npm Package",
    karpathyGist: "Karpathy's LLM Wiki idea",
    license: "MIT License © 2026. Built with care for the AI agent ecosystem.",
    version: "v0.2.0",
  },
  notFound: {
    title: "Page Not Found",
    body: "Sorry, the page you are looking for doesn't exist.",
    body2: "It may have been moved or deleted.",
    goHome: "Go Home",
  },
  manusDialog: {
    description: "Please login with Manus to continue",
    login: "Login with Manus",
  },
} satisfies AppMessages;
