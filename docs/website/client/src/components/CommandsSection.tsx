/*
 * Design: Knowledge Cartography — Command reference with tabbed interface
 * Warm code blocks, categorized commands
 */
import { useI18n, type AppMessages } from "@/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Globe,
  FileInput,
  Beaker,
  Grid3x3,
  Syringe,
  Search,
  AlertTriangle,
  FolderPlus,
  FilePlus,
  ScrollText,
  BarChart3,
  Link2,
  Settings,
  RefreshCw,
  Rocket,
} from "lucide-react";

type Command = {
  name: string;
  icon: React.ElementType;
  desc: string;
  usage: string;
  flags?: string[];
};

function buildCoreCommands(t: AppMessages["commands"]): Command[] {
  const c = t.core;
  return [
    {
      name: "onboard",
      icon: Rocket,
      desc: c.onboard.desc,
      usage: "memex onboard\nmemex onboard --agent claude-code -y",
      flags: [...c.onboard.flags],
    },
    {
      name: "fetch",
      icon: Globe,
      desc: c.fetch.desc,
      usage:
        'memex fetch https://react.dev/reference/react/hooks\nmemex fetch "react hooks best practices" --top 5\nmemex fetch https://nextjs.org/sitemap.xml --sitemap',
      flags: [...c.fetch.flags],
    },
    {
      name: "ingest",
      icon: FileInput,
      desc: c.ingest.desc,
      usage: "memex ingest\nmemex ingest raw/personal\nmemex ingest --agent codex --dry-run",
      flags: [...c.ingest.flags],
    },
    {
      name: "distill",
      icon: Beaker,
      desc: c.distill.desc,
      usage:
        "memex distill\nmemex distill --scene personal\nmemex distill --latest --role backend\nmemex distill ./session.jsonl --no-llm",
      flags: [...c.distill.flags],
    },
    {
      name: "glob",
      icon: Grid3x3,
      desc: c.glob.desc,
      usage: "memex glob --project ./my-app",
      flags: [...c.glob.flags],
    },
    {
      name: "inject",
      icon: Syringe,
      desc: c.inject.desc,
      usage: "memex inject\nmemex inject --format json",
      flags: [...c.inject.flags],
    },
    {
      name: "search",
      icon: Search,
      desc: c.search.desc,
      usage:
        'memex search "authentication"\nmemex search "react hooks" --limit 10',
      flags: [...c.search.flags],
    },
    {
      name: "lint",
      icon: AlertTriangle,
      desc: c.lint.desc,
      usage: "memex lint\nmemex lint --fix",
      flags: [...c.lint.flags],
    },
  ];
}

function buildUtilCommands(t: AppMessages["commands"]): Command[] {
  const u = t.util;
  return [
    {
      name: "init",
      icon: FolderPlus,
      desc: u.init.desc,
      usage: "memex init\nmemex init --global",
      flags: [...u.init.flags],
    },
    {
      name: "new",
      icon: FilePlus,
      desc: u.new.desc,
      usage: 'memex new concept "React Hooks"\nmemex new entity "Anthropic"',
      flags: [...u.new.flags],
    },
    {
      name: "log",
      icon: ScrollText,
      desc: u.log.desc,
      usage: 'memex log "Refactored auth module"',
    },
    {
      name: "status",
      icon: BarChart3,
      desc: u.status.desc,
      usage: "memex status\nmemex status --json",
      flags: [...u.status.flags],
    },
    {
      name: "link-check",
      icon: Link2,
      desc: u["link-check"].desc,
      usage: "memex link-check",
    },
    {
      name: "install-hooks",
      icon: Compass,
      desc: u["install-hooks"].desc,
      usage: "memex install-hooks\nmemex install-hooks --agent cursor",
      flags: [...u["install-hooks"].flags],
    },
    {
      name: "config",
      icon: Settings,
      desc: u.config.desc,
      usage:
        "memex config list\nmemex config set agent codex\nmemex config agents",
      flags: [...u.config.flags],
    },
    {
      name: "update",
      icon: RefreshCw,
      desc: u.update.desc,
      usage: "memex update\nmemex update --check\nmemex update --source github",
      flags: [...u.update.flags],
    },
  ];
}

function CommandCard({
  cmd,
  isActive,
  onClick,
}: {
  cmd: Command;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = cmd.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
        isActive
          ? "bg-terracotta/10 border border-terracotta/30 shadow-sm"
          : "hover:bg-parchment border border-transparent"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${isActive ? "text-terracotta" : "text-foreground/40"}`}
      />
      <div>
        <span
          className={`text-sm font-[var(--font-mono)] font-semibold ${isActive ? "text-terracotta" : "text-ink"}`}
        >
          {cmd.name}
        </span>
      </div>
    </button>
  );
}

function CommandDetail({
  cmd,
  optionsLabel,
}: {
  cmd: Command;
  optionsLabel: string;
}) {
  const CmdIcon = cmd.icon;
  return (
    <motion.div
      key={cmd.name}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <CmdIcon className="w-5 h-5 text-terracotta" />
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
            {optionsLabel}
          </div>
          <div className="space-y-1">
            {cmd.flags.map((flag, i) => (
              <div
                key={i}
                className="text-sm font-[var(--font-mono)] text-foreground/60"
              >
                <span className="text-sage">{flag.split("  ")[0]}</span>
                {flag.includes("  ") && (
                  <span className="text-foreground/40 ml-2">
                    {flag.split("  ").slice(1).join("  ")}
                  </span>
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
  const { messages: m } = useI18n();
  const coreCommands = buildCoreCommands(m.commands);
  const utilCommands = buildUtilCommands(m.commands);

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
            {m.commands.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {m.commands.sectionSubtitle}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-background/90 rounded-md p-1 border border-border/50">
            <button
              type="button"
              onClick={() => handleTabChange("core")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === "core"
                  ? "bg-terracotta text-ivory shadow-sm"
                  : "text-foreground/60 hover:text-ink"
              }`}
            >
              {m.commands.coreTab(coreCommands.length)}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("utility")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === "utility"
                  ? "bg-terracotta text-ivory shadow-sm"
                  : "text-foreground/60 hover:text-ink"
              }`}
            >
              {m.commands.utilTab(utilCommands.length)}
            </button>
          </div>
        </div>

        {/* Command browser */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Command list */}
          <div className="lg:col-span-4">
            <div className="bg-background/90 rounded-lg border border-border/50 p-3 space-y-1 max-h-[520px] overflow-y-auto">
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
            <div className="bg-background/90 rounded-lg border border-border/50 p-6 min-h-[520px]">
              <AnimatePresence mode="wait">
                <CommandDetail
                  cmd={currentCmd}
                  optionsLabel={m.commands.options}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
