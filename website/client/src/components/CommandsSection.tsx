/*
 * Design: Knowledge Cartography — Command reference with tabbed interface
 * Warm code blocks, categorized commands
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Globe, FileInput, Beaker, Grid3x3, Syringe,
  Search, AlertTriangle, FolderPlus, FilePlus, ScrollText,
  BarChart3, Link2, Settings, RefreshCw, Rocket,
} from "lucide-react";

type Command = {
  name: string;
  icon: React.ElementType;
  desc: string;
  usage: string;
  flags?: string[];
};

const coreCommands: Command[] = [
  {
    name: "onboard",
    icon: Rocket,
    desc: "Interactive setup wizard — select agent, detect session dir, init vault, install hooks.",
    usage: "memex onboard\nmemex onboard --agent claude-code -y",
    flags: ["--agent <name>  Specify agent (skip selection)", "-y  Non-interactive mode"],
  },
  {
    name: "fetch",
    icon: Globe,
    desc: "Fetch URL, crawl sitemap, or search by keywords — saves clean Markdown to raw/.",
    usage: 'memex fetch https://react.dev/reference/react/hooks\nmemex fetch "react hooks best practices" --top 5\nmemex fetch https://nextjs.org/sitemap.xml --sitemap',
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
  {
    name: "ingest",
    icon: FileInput,
    desc: "Orchestrate your agent to process raw sources into structured wiki pages.",
    usage: "memex ingest\nmemex ingest raw/personal\nmemex ingest --agent codex --dry-run",
    flags: ["--agent <name>  Use specific agent", "--dry-run       Preview prompt only"],
  },
  {
    name: "distill",
    icon: Beaker,
    desc: "Extract role-based best practices from agent session logs.",
    usage: "memex distill --latest --role backend\nmemex distill ./session.jsonl --role tech-lead",
    flags: [
      "--latest        Use most recent session",
      "--role <role>   Filter by role",
      "--agent <name>  Use specific agent",
      "--dry-run       Preview prompt only",
    ],
  },
  {
    name: "glob",
    icon: Grid3x3,
    desc: "Project relevant global wiki pages into a local project vault.",
    usage: "memex glob --project ./my-app",
    flags: ["--project <dir>  Target project directory"],
  },
  {
    name: "inject",
    icon: Syringe,
    desc: "Output concatenated wiki context for agent consumption.",
    usage: "memex inject\nmemex inject --format json",
    flags: ["--format <fmt>  Output format (text/json)"],
  },
  {
    name: "search",
    icon: Search,
    desc: "Full-text search across wiki and raw files with relevance scoring.",
    usage: 'memex search "authentication"\nmemex search "react hooks" --limit 10',
    flags: ["--limit <n>  Max results"],
  },
  {
    name: "lint",
    icon: AlertTriangle,
    desc: "Scan wiki health — orphans, broken links, missing frontmatter.",
    usage: "memex lint\nmemex lint --fix",
    flags: ["--fix  Auto-fix simple issues"],
  },
];

const utilCommands: Command[] = [
  {
    name: "init",
    icon: FolderPlus,
    desc: "Initialize a new vault manually.",
    usage: "memex init\nmemex init --global",
    flags: ["--global  Initialize global vault"],
  },
  {
    name: "new",
    icon: FilePlus,
    desc: "Scaffold a new wiki page from a template.",
    usage: 'memex new concept "React Hooks"\nmemex new entity "Anthropic"',
    flags: ["<type>  entity | concept | source | summary", "<name>  Page name"],
  },
  {
    name: "log",
    icon: ScrollText,
    desc: "Append a formatted entry to the chronological log.md.",
    usage: 'memex log "Refactored auth module"',
  },
  {
    name: "status",
    icon: BarChart3,
    desc: "View vault overview and statistics.",
    usage: "memex status\nmemex status --json",
    flags: ["--json  Output as JSON"],
  },
  {
    name: "link-check",
    icon: Link2,
    desc: "Validate [[wikilinks]] across all pages.",
    usage: "memex link-check",
  },
  {
    name: "install-hooks",
    icon: Compass,
    desc: "Generate custom slash commands for your agent.",
    usage: "memex install-hooks\nmemex install-hooks --agent cursor",
    flags: ["--agent <name>  Target agent"],
  },
  {
    name: "config",
    icon: Settings,
    desc: "Manage CLI configuration and default agent.",
    usage: "memex config list\nmemex config set agent codex\nmemex config agents",
    flags: ["set <key> <val>  Set a config value", "get <key>        Get a config value", "list             Show all config", "agents           List supported agents"],
  },
  {
    name: "update",
    icon: RefreshCw,
    desc: "Self-update to the latest version.",
    usage: "memex update\nmemex update --check\nmemex update --source github",
    flags: ["--check          Only check for updates", "--source <src>   Force npm or github"],
  },
];

function CommandCard({ cmd, isActive, onClick }: { cmd: Command; isActive: boolean; onClick: () => void }) {
  const Icon = cmd.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
        isActive
          ? "bg-terracotta/10 border border-terracotta/30 shadow-sm"
          : "hover:bg-parchment border border-transparent"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-terracotta" : "text-foreground/40"}`} />
      <div>
        <span className={`text-sm font-[var(--font-mono)] font-semibold ${isActive ? "text-terracotta" : "text-ink"}`}>
          {cmd.name}
        </span>
      </div>
    </button>
  );
}

function CommandDetail({ cmd }: { cmd: Command }) {
  return (
    <motion.div
      key={cmd.name}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <cmd.icon className="w-5 h-5 text-terracotta" />
        <h4 className="font-[var(--font-mono)] text-xl font-bold text-ink">
          memex {cmd.name}
        </h4>
      </div>
      <p className="text-sm text-foreground/60 mb-5 font-[var(--font-body)] leading-relaxed">
        {cmd.desc}
      </p>

      <div className="code-block text-sm mb-5">
        {cmd.usage.split("\n").map((line, i) => (
          <div key={i}>
            <span className="prompt">$ </span>
            <span className="command">{line}</span>
          </div>
        ))}
      </div>

      {cmd.flags && cmd.flags.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-2 font-[var(--font-body)]">
            Options
          </div>
          <div className="space-y-1">
            {cmd.flags.map((flag, i) => (
              <div key={i} className="text-sm font-[var(--font-mono)] text-foreground/60">
                <span className="text-sage">{flag.split("  ")[0]}</span>
                {flag.includes("  ") && (
                  <span className="text-foreground/40 ml-2">{flag.split("  ").slice(1).join("  ")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CommandsSection() {
  const [tab, setTab] = useState<"core" | "utility">("core");
  const commands = tab === "core" ? coreCommands : utilCommands;
  const [activeCmd, setActiveCmd] = useState(commands[0].name);

  const currentCmd = commands.find((c) => c.name === activeCmd) || commands[0];

  const handleTabChange = (newTab: "core" | "utility") => {
    setTab(newTab);
    const cmds = newTab === "core" ? coreCommands : utilCommands;
    setActiveCmd(cmds[0].name);
  };

  return (
    <section id="commands" className="py-24 bg-parchment parchment-bg">
      <div className="container relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9674;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            Command Reference
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            16 commands covering the full lifecycle of knowledge management — from fetching to linting.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-ivory rounded-lg p-1 border border-border/60">
            <button
              onClick={() => handleTabChange("core")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === "core"
                  ? "bg-terracotta text-ivory shadow-sm"
                  : "text-foreground/60 hover:text-ink"
              }`}
            >
              Core Commands ({coreCommands.length})
            </button>
            <button
              onClick={() => handleTabChange("utility")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === "utility"
                  ? "bg-terracotta text-ivory shadow-sm"
                  : "text-foreground/60 hover:text-ink"
              }`}
            >
              Utility Commands ({utilCommands.length})
            </button>
          </div>
        </div>

        {/* Command browser */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Command list */}
          <div className="lg:col-span-4">
            <div className="bg-ivory/80 rounded-xl border border-border/60 p-3 space-y-1 max-h-[520px] overflow-y-auto">
              {commands.map((cmd) => (
                <CommandCard
                  key={cmd.name}
                  cmd={cmd}
                  isActive={activeCmd === cmd.name}
                  onClick={() => setActiveCmd(cmd.name)}
                />
              ))}
            </div>
          </div>

          {/* Command detail */}
          <div className="lg:col-span-8">
            <div className="bg-ivory/80 rounded-xl border border-border/60 p-6 min-h-[520px]">
              <AnimatePresence mode="wait">
                <CommandDetail cmd={currentCmd} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
