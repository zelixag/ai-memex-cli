import type { AppMessages } from "./zh-CN";

/** English copy. CLI examples stay English for copy-paste. */
export const enUS = {
  meta: {
    title: "ai-memex-cli — Karpathy's LLM Wiki as a daily workflow",
    description:
      "Turn Karpathy's LLM Wiki pattern into a compounding Markdown knowledge base. Stateless CLI + local agent. Zero LLM API calls from memex itself.",
  },
  ui: {
    switchToZh: "中文",
    switchToEn: "English",
    languageToggleAria: "Switch site language",
  },
  navbar: {
    links: [
      { label: "Features", href: "#features" },
      { label: "Architecture", href: "#architecture" },
      { label: "Commands", href: "#commands" },
      { label: "Comparison", href: "#comparison" },
      { label: "Quick Start", href: "#quickstart" },
    ],
    github: "GitHub",
    getStarted: "Get Started",
  },
  hero: {
    imgAlt: "Knowledge cartography desk",
    badge: "Karpathy's LLM Wiki, mechanized",
    titleLine1: "Knowledge that",
    titleLine2: "compounds",
    subtitleBefore: "A small CLI that turns ",
    subtitleLink: "Karpathy's LLM Wiki pattern",
    subtitleAfter: ` into a daily workflow — have your agent build and maintain a persistent Markdown knowledge base that compounds, instead of being re-derived every session.`,
    quote: '"Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."',
    quoteAuthor: "— Andrej Karpathy",
    copyTitle: "Copy to clipboard",
    copy: "Copy",
    quickStart: "Quick Start Guide",
    viewGithub: "View on GitHub",
  },
  features: {
    sectionTitle: "Core pipeline",
    sectionSubtitle:
      "The mechanical primitives that make Karpathy's pattern easy to live in — fetch, distill, query, lint, and a schema you own.",
    blocks: [
      {
        title: "Build the wiki",
        subtitle: "Karpathy's pattern, mechanized",
        description:
          "memex fetch drops raw sources into raw/ (URLs, sitemaps, DuckDuckGo keyword search, or agent-delegated fetching). memex ingest then hands raw/ to your agent and has it integrate new material into wiki/ — updating entity / concept pages, the index, and the log in one pass. Cross-references are already there.",
        code: `memex fetch "react hooks best practices" --top 5
memex fetch https://nextjs.org/sitemap.xml --sitemap
memex ingest`,
      },
      {
        title: "Distill sessions",
        subtitle: "Explorations compound alongside reading",
        description:
          '"Good answers can be filed back into the wiki as new pages." memex distill batch-converts every agent session you have had into structured Markdown under raw/<scene>/sessions/, ready to be re-ingested. This is the mechanism that makes debugging a tough bug yesterday inform tomorrow\'s question.',
        code: `memex distill
memex distill --scene personal
memex distill --no-llm`,
      },
      {
        title: "One CLI, every agent",
        subtitle: "Zero LLM API calls — your agent does the thinking",
        description:
          "Works with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, and Continue.dev. memex itself makes zero API calls — it stages the right files and prompts; your local agent's session handles the LLM work. The wiki is plain Markdown you can git diff / blame.",
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
          "memex lint / memex link-check flag orphans, broken [[wikilinks]], missing frontmatter, and stale cross-references — the periodic health-check Karpathy describes.",
      },
      {
        title: "Schema you own",
        description:
          "AGENTS.md is your wiki's constitution, co-evolved between you and the LLM. memex init gives a working default; edit it until it fits your domain.",
      },
    ],
    advanced: {
      kicker: "Not in Karpathy's original — opinionated, opt-in",
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
            'Writes a marker-delimited "vault digest" block into CLAUDE.md / AGENTS.md / .cursor/rules/memex.mdc, so every new agent session opens with the wiki location and a scene summary already in context.',
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
        desc: "Claude Code, Codex, Cursor, OpenCode, Gemini CLI, Aider, Continue.dev",
      },
      {
        label: "Layer 2 — ai-memex-cli",
        desc:
          "Stateless primitives: onboard · fetch · ingest · distill · watch · context · glob · inject · lint · search · update",
      },
      {
        label: "Layer 1 — Vault (filesystem)",
        desc: "~/.llmwiki/global/ (personal) + .llmwiki/local/ (project)",
      },
    ],
    flowLeft: "↕ shell + prompts",
    flowRight: "↕ filesystem",
    vaultTitle: "Vault Structure",
    vaultIntro:
      "A dual-vault system: Global for personal compounding knowledge, Local for project-specific context.",
    vaultTree: [
      { indent: 0, text: "~/.llmwiki/global/", highlight: true },
      { indent: 1, text: "AGENTS.md", note: "Agent instructions (wiki constitution)" },
      { indent: 1, text: "index.md", note: "Wiki index" },
      { indent: 1, text: "log.md", note: "Chronological log" },
      { indent: 1, text: "config.yaml", note: "Vault configuration" },
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
          "--heal-interval  How often to re-lint (default 30m)",
          "--max-iter <n>   Cap loop iterations (0 = unlimited)",
          "--force          Bypass the \"no-change\" guard",
          "--follow / -f    Tail .llmwiki/watch.log",
          "--status         Read live snapshot (watch.status.json)",
        ],
      },
      glob: {
        desc: "Project relevant global wiki pages into a local project vault.",
        usage: "memex glob --project ./my-app",
        flags: ["--project <dir>  Target project directory"],
      },
      inject: {
        desc: "Output concatenated wiki context for agent consumption.",
        usage: "memex inject\nmemex inject --format json",
        flags: ["--format <fmt>  Output format (text/json)"],
      },
      search: {
        desc: "Full-text search across wiki and raw files with relevance scoring.",
        usage: 'memex search "authentication"\nmemex search "react hooks" --limit 10',
        flags: ["--limit <n>  Max results"],
      },
      lint: {
        desc: "Scan wiki health — orphans, broken links, missing frontmatter.",
        usage: "memex lint\nmemex lint --fix",
        flags: ["--fix  Auto-fix simple issues"],
      },
    },
    util: {
      init: {
        desc: "Initialize a new vault manually.",
        usage: "memex init\nmemex init --global",
        flags: ["--global  Initialize global vault"],
      },
      new: {
        desc: "Scaffold a new wiki page from a template.",
        usage: 'memex new concept "React Hooks"\nmemex new entity "Anthropic"',
        flags: ["<type>  entity | concept | source | summary", "<name>  Page name"],
      },
      log: {
        desc: "Append a formatted entry to the chronological log.md.",
        usage: 'memex log "Refactored auth module"',
        flags: [],
      },
      status: {
        desc: "View vault overview and statistics.",
        usage: "memex status\nmemex status --json",
        flags: ["--json  Output as JSON"],
      },
      "link-check": {
        desc: "Validate [[wikilinks]] across all pages.",
        usage: "memex link-check",
        flags: [],
      },
      context: {
        desc: 'Write a marker-delimited vault digest (L0) into CLAUDE.md / AGENTS.md / .cursor/rules so every new agent session opens with the wiki location + scene summary already in context.',
        usage:
          "memex context install\nmemex context refresh\nmemex context status\nmemex context uninstall",
        flags: [
          "install         Insert L0 digest into agent files",
          "refresh         Re-generate digest (all registered projects)",
          "status          Show registered projects + last refresh",
          "uninstall       Remove L0 block",
        ],
      },
      "install-hooks": {
        desc: "Generate native /memex:* slash commands for your agent (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev).",
        usage:
          "memex install-hooks\nmemex install-hooks --agent cursor\nmemex install-hooks --no-context",
        flags: [
          "--agent <name>  Target agent (skip detection)",
          "--no-context    Don't install L0 context block",
          "--context-mode  Control L0 insertion behavior",
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
        code: `memex onboard\n# → Choose agent: Claude Code\n# → Session dir: ~/.claude/projects/\n# → Vault initialized at ~/.llmwiki/global/\n# → Slash commands installed`,
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
      "Karpathy's LLM Wiki pattern as a daily workflow — a persistent Markdown knowledge base maintained by your agent.",
    navTitle: "Navigation",
    agentsTitle: "Supported Agents",
    resourcesTitle: "Resources",
    githubRepo: "GitHub Repository",
    npmPackage: "npm Package",
    karpathyGist: "Karpathy's LLM Wiki Gist",
    license: "MIT License © 2026. Built with care for the AI agent ecosystem.",
    version: "v0.1.5",
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
