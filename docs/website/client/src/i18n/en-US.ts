import type { AppMessages } from "./zh-CN";

/**
 * English copy. CLI examples stay English for copy-paste.
 */
export const enUS = {
  meta: {
    title: "ai-memex-cli — Persistent Memory for AI Agents",
    description:
      "The universal CLI for building persistent LLM wikis. Works with Claude Code, Codex, OpenCode, Cursor, and more.",
  },
  ui: {
    switchToZh: "中文",
    switchToEn: "English",
    languageSwitcherAria: "Switch site language",
    styleTech: "Tech",
    styleClassic: "Classic",
    styleSegmentAria: "Switch visual style (tech / classic)",
    themeLightAria: "Switch to light mode",
    themeDarkAria: "Switch to dark mode",
    themeToggleAria: "Toggle light / dark mode",
    menuPreferences: "Preferences",
    menuStyle: "Style",
    menuLanguage: "Language",
    menuDark: "Dark mode",
    menuOpenSettings: "Open preferences",
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
    badge: "Inspired by Karpathy's LLM Wiki",
    titleLine1: "Persistent Memory",
    titleLine2: "for AI Agents",
    subtitle:
      "The universal CLI that builds structured knowledge wikis from raw documents and conversations. Works with Claude Code, Codex, Cursor, and 5+ more agents.",
    copyTitle: "Copy to clipboard",
    copy: "Copy",
    quickStart: "Quick Start Guide",
    viewGithub: "View on GitHub",
  },
  features: {
    sectionTitle: "Core Capabilities",
    sectionSubtitle:
      "Everything you need to build, maintain, and leverage persistent knowledge for your AI agents.",
    blocks: [
      {
        title: "Fetch & Crawl",
        subtitle: "Built-in Web Scraper",
        description:
          "Grab documentation from any URL, crawl entire doc sites via sitemap, or search by keywords — all saved as clean Markdown in your raw/ directory. No API key needed.",
        code: `memex fetch "react hooks best practices"\nmemex fetch https://docs.anthropic.com --depth 2\nmemex fetch https://nextjs.org/sitemap.xml --sitemap`,
      },
      {
        title: "Distill Sessions",
        subtitle: "Structured + Optional LLM Pass",
        description:
          "Run with no args and every Claude Code / Codex / OpenCode transcript is parsed into structured Markdown (timestamps, roles, collapsed tool calls) under raw/team/sessions/. Want role-based summaries? Just hand it to your agent. Original JSONL is never copied.",
        code: `memex distill                               # all sessions → raw/team/sessions/*.md\nmemex distill --scene personal              # route to the personal scene\nmemex distill --latest --role backend       # optional: agent-driven distillation`,
      },
      {
        title: "Universal Agent Support",
        subtitle: "One CLI, Every Agent",
        description:
          "Works with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev, and more. One onboard command sets up slash commands for your chosen agent.",
        code: `memex onboard\n# → Choose agent → Auto-detect sessions\n# → Init vault → Install /memex:* commands`,
      },
    ],
    small: [
      {
        title: "Smart Search",
        description:
          "Full-text search across wiki and raw files with keyword highlighting and relevance scoring.",
      },
      {
        title: "Structured Wiki",
        description:
          "Entities, concepts, sources, summaries — each with frontmatter schema validation and cross-linking.",
      },
      {
        title: "Progress & Preflight",
        description:
          "Long-running tasks (fetch / distill / ingest) now ship with progress bars and spinners. Missing vault or unconfigured agent? Every command fails fast with a friendly pointer to memex onboard.",
      },
    ],
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
        desc: "Stateless primitives: onboard · fetch · ingest · distill · glob · inject · lint · search · update",
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
      { indent: 1, text: "AGENTS.md", note: "Agent instructions" },
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
    principleBefore: "The CLI makes ",
    principleStrong: "zero LLM API calls",
    principleAfter:
      ". It handles mechanical correctness (file structure, frontmatter, linting, fetching), while your AI Agent handles semantic correctness (reading, synthesizing, linking).",
  },
  commands: {
    sectionTitle: "Command Reference",
    sectionSubtitle:
      "16 commands covering the full lifecycle of knowledge management — from fetching to linting.",
    coreTab: (n: number) => `Core Commands (${n})`,
    utilTab: (n: number) => `Utility Commands (${n})`,
    options: "Options",
    core: {
      onboard: {
        desc: "Interactive setup wizard — select agent, detect session dir, init vault, install hooks.",
        flags: [
          "--agent <name>  Specify agent (skip selection)",
          "-y  Non-interactive mode",
        ],
      },
      fetch: {
        desc: "Fetch URL, crawl sitemap, or search by keywords — saves clean Markdown to raw/.",
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
        flags: ["--agent <name>  Use specific agent", "--dry-run       Preview prompt only"],
      },
      distill: {
        desc: "No-arg: convert every native session into structured Markdown under raw/<scene>/sessions/ (default: team). Pass a path or --latest to invoke the agent for role-based distillation.",
        flags: [
          "--scene <name>  Target scene folder (default: team)",
          "--latest        Auto-discover the most recent session",
          "--role <role>   Filter by role (LLM-driven)",
          "--agent <name>  Use specific agent",
          "--no-llm        Mechanical conversion only",
          "--dry-run       Preview prompt only",
        ],
      },
      glob: {
        desc: "Project relevant global wiki pages into a local project vault.",
        flags: ["--project <dir>  Target project directory"],
      },
      inject: {
        desc: "Output concatenated wiki context for agent consumption.",
        flags: ["--format <fmt>  Output format (text/json)"],
      },
      search: {
        desc: "Full-text search across wiki and raw files with relevance scoring.",
        flags: ["--limit <n>  Max results"],
      },
      lint: {
        desc: "Scan wiki health — orphans, broken links, missing frontmatter.",
        flags: ["--fix  Auto-fix simple issues"],
      },
    },
    util: {
      init: {
        desc: "Initialize a new vault manually.",
        flags: ["--global  Initialize global vault"],
      },
      new: {
        desc: "Scaffold a new wiki page from a template.",
        flags: ["<type>  entity | concept | source | summary", "<name>  Page name"],
      },
      log: {
        desc: "Append a formatted entry to the chronological log.md.",
        flags: [],
      },
      status: {
        desc: "View vault overview and statistics.",
        flags: ["--json  Output as JSON"],
      },
      "link-check": {
        desc: "Validate [[wikilinks]] across all pages.",
        flags: [],
      },
      "install-hooks": {
        desc: "Generate custom slash commands for your agent.",
        flags: ["--agent <name>  Target agent"],
      },
      config: {
        desc: "Manage CLI configuration and default agent.",
        flags: [
          "set <key> <val>  Set a config value",
          "get <key>        Get a config value",
          "list             Show all config",
          "agents           List supported agents",
        ],
      },
      update: {
        desc: "Self-update to the latest version.",
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
      "A side-by-side look at the LLM wiki ecosystem. We focus on universality, zero cost, and agent-native integration.",
    colFeature: "Feature",
    colThisProject: "This project",
    thisProjectBadge: "★ This project",
    rows: [
      {
        feature: "Architecture",
        values: ["Stateless CLI", "CLI (calls LLM)", "Claude Plugin", "Markdown Prompts", "MCP Server"],
      },
      {
        feature: "Agent Support",
        values: ["8+ agents", "Anthropic only", "Claude only", "Claude only", "MCP-compatible"],
      },
      {
        feature: "Web Fetching",
        values: ["yes", "partial", "no", "no", "no"],
      },
      {
        feature: "Keyword Search",
        values: ["yes", "no", "no", "no", "no"],
      },
      {
        feature: "Session Distillation",
        values: ["yes", "no", "no", "no", "partial"],
      },
      {
        feature: "Slash Commands",
        values: ["yes", "no", "yes", "partial", "no"],
      },
      {
        feature: "Interactive Onboarding",
        values: ["yes", "no", "no", "no", "no"],
      },
      {
        feature: "Self-Update",
        values: ["yes", "no", "no", "no", "no"],
      },
      {
        feature: "Zero API Cost",
        values: ["yes", "no", "yes", "yes", "no"],
      },
      {
        feature: "Cross-Platform",
        values: ["yes", "partial", "partial", "partial", "yes"],
      },
    ],
    footnote:
      "Comparison based on publicly available documentation as of April 2026. atomicmemory = llm-wiki-compiler (508★), ussumant = llm-wiki-compiler (191★), SamurAIGPT = llm-wiki-agent (1900+★), rohitg00 = agentmemory (1600+★).",
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
          "Grab documentation from URLs or search by keywords. Everything is saved as clean Markdown.",
        code: `memex fetch https://react.dev/reference/react/hooks\nmemex fetch "typescript generics tutorial" --top 3`,
      },
      {
        number: "04",
        title: "Ingest & Distill",
        description:
          "Convert every transcript to structured markdown first, then let the agent ingest raw/ into the wiki. Drop a --role pass when you want role-based summaries.",
        code: `memex distill                 # all sessions → raw/team/sessions/*.md\nmemex ingest                  # agent turns raw/ into wiki/\nmemex distill --latest --role backend   # optional: role-based pass`,
      },
      {
        number: "05",
        title: "Search & Use",
        description:
          "Search your knowledge base, lint for health, and inject context into your agent sessions.",
        code: `memex search "authentication patterns"\nmemex lint\nmemex inject`,
      },
    ],
    cta: "View Full Documentation on GitHub",
  },
  footer: {
    tagline: "Persistent memory for AI agents. Inspired by Karpathy's LLM Wiki pattern.",
    navTitle: "Navigation",
    agentsTitle: "Supported Agents",
    resourcesTitle: "Resources",
    githubRepo: "GitHub Repository",
    npmPackage: "npm Package",
    karpathyGist: "Karpathy's LLM Wiki Gist",
    license: "MIT License © 2026. Built with care for the AI agent ecosystem.",
  },
  notFound: {
    title: "Page Not Found",
    body: "Sorry, the page you are looking for doesn't exist.",
    body2: "It may have been moved or deleted.",
    goHome: "Go Home",
  },
  errorBoundary: {
    title: "An unexpected error occurred.",
    reload: "Reload Page",
  },
  manusDialog: {
    description: "Please login with Manus to continue",
    login: "Login with Manus",
  },
} satisfies AppMessages;
