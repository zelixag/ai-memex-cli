/*
 * Design: Knowledge Cartography — Command reference with tabbed interface
 */
import { useState, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Globe, FileInput, Beaker, Grid3x3, Syringe,
  Search, AlertTriangle, FolderPlus, FilePlus, ScrollText,
  BarChart3, Link2, Settings, RefreshCw, Rocket,
  Activity, Layers,
} from "lucide-react";
import { useI18n } from "@/i18n";

const CORE_ORDER = [
  "onboard",
  "fetch",
  "ingest",
  "distill",
  "watch",
  "glob",
  "inject",
  "search",
  "lint",
] as const;

const UTIL_ORDER = [
  "init",
  "new",
  "log",
  "status",
  "link-check",
  "context",
  "install-hooks",
  "config",
  "update",
] as const;

type CoreKey = (typeof CORE_ORDER)[number];
type UtilKey = (typeof UTIL_ORDER)[number];

const CORE_ICONS: Record<CoreKey, ElementType> = {
  onboard: Rocket,
  fetch: Globe,
  ingest: FileInput,
  distill: Beaker,
  watch: Activity,
  glob: Grid3x3,
  inject: Syringe,
  search: Search,
  lint: AlertTriangle,
};

const UTIL_ICONS: Record<UtilKey, ElementType> = {
  init: FolderPlus,
  new: FilePlus,
  log: ScrollText,
  status: BarChart3,
  "link-check": Link2,
  context: Layers,
  "install-hooks": Compass,
  config: Settings,
  update: RefreshCw,
};

type CommandView = {
  name: string;
  icon: ElementType;
  desc: string;
  usage: string;
  flags?: string[];
};

function CommandCard({
  cmd,
  isActive,
  onClick,
}: {
  cmd: CommandView;
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
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-terracotta" : "text-foreground/40"}`} />
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

function CommandDetail({ cmd, optionsLabel }: { cmd: CommandView; optionsLabel: string }) {
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
            {optionsLabel}
          </div>
          <div className="space-y-1">
            {cmd.flags.map((flag, i) => (
              <div key={i} className="text-sm font-[var(--font-mono)] text-foreground/60">
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
  const { messages } = useI18n();
  const c = messages.commands;

  const coreCommands: CommandView[] = CORE_ORDER.map((key) => {
    const entry = c.core[key];
    return {
      name: key,
      icon: CORE_ICONS[key],
      desc: entry.desc,
      usage: entry.usage,
      flags: entry.flags,
    };
  });

  const utilCommands: CommandView[] = UTIL_ORDER.map((key) => {
    const entry = c.util[key];
    return {
      name: key,
      icon: UTIL_ICONS[key],
      desc: entry.desc,
      usage: entry.usage,
      flags: entry.flags,
    };
  });

  const [tab, setTab] = useState<"core" | "utility">("core");
  const commands = tab === "core" ? coreCommands : utilCommands;
  const [activeCmd, setActiveCmd] = useState(commands[0]!.name);

  const currentCmd = commands.find((x) => x.name === activeCmd) ?? commands[0]!;

  const handleTabChange = (newTab: "core" | "utility") => {
    setTab(newTab);
    const cmds = newTab === "core" ? coreCommands : utilCommands;
    setActiveCmd(cmds[0]!.name);
  };

  return (
    <section id="commands" className="py-24 bg-parchment parchment-bg">
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9674;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {c.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {c.sectionSubtitle}
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-ivory rounded-lg p-1 border border-border/60">
            <button
              type="button"
              onClick={() => handleTabChange("core")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === "core"
                  ? "bg-terracotta text-ivory shadow-sm"
                  : "text-foreground/60 hover:text-ink"
              }`}
            >
              {c.coreTab(coreCommands.length)}
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
              {c.utilTab(utilCommands.length)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

          <div className="lg:col-span-8">
            <div className="bg-ivory/80 rounded-xl border border-border/60 p-6 min-h-[520px]">
              <AnimatePresence mode="wait">
                <CommandDetail cmd={currentCmd} optionsLabel={c.options} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
