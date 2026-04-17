/*
 * Hero — overlays follow tech vs classic preset; install bar uses code tokens
 */
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowDown, Terminal, Sparkles } from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/hero-map_439eb193.png";

export default function HeroSection() {
  const { messages: m } = useI18n();
  const { preset } = useTheme();
  const isClassic = preset === "classic";

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden border-b border-border/40">
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt={m.hero.imgAlt}
          className={cn(
            "w-full h-full object-cover",
            isClassic ? "opacity-45 saturate-75" : "opacity-35 saturate-[0.65] contrast-[1.05]",
          )}
        />
        <div
          className={cn(
            "absolute inset-0",
            isClassic
              ? "bg-gradient-to-r from-background/95 via-background/88 to-background/55"
              : "bg-gradient-to-br from-background via-background/92 to-terracotta/[0.07]",
          )}
        />
        <div
          className={cn(
            "absolute inset-0",
            isClassic
              ? "bg-gradient-to-t from-background via-transparent to-background/25"
              : "bg-gradient-to-b from-transparent via-transparent to-background",
          )}
        />
      </div>

      <div className="container relative z-10 pt-24 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border mb-8",
              isClassic
                ? "bg-sage-light/80 border-sage/30"
                : "bg-terracotta/8 border-terracotta/25",
            )}
          >
            <Sparkles
              className={cn("w-3.5 h-3.5", isClassic ? "text-sage" : "text-terracotta")}
            />
            <span
              className={cn(
                "text-[11px] font-semibold tracking-[0.12em] uppercase font-[var(--font-mono)]",
                isClassic ? "text-sage" : "text-terracotta/90",
              )}
            >
              {m.hero.badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl font-bold text-ink leading-[1.08] mb-6 tracking-tight"
          >
            {m.hero.titleLine1}
            <br />
            <span
              className={cn(
                "font-semibold",
                isClassic ? "text-terracotta italic" : "text-terracotta",
              )}
            >
              {m.hero.titleLine2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="text-base sm:text-lg text-foreground/65 leading-relaxed mb-8 max-w-xl font-[var(--font-body)]"
          >
            {m.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mb-8"
          >
            <div
              className="inline-flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg"
              style={{
                background: "var(--code-bg)",
                color: "var(--code-fg)",
                borderColor: "var(--code-border)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in oklch, var(--palette-terracotta) 12%, transparent), 0 12px 40px -12px rgb(0 0 0 / 0.35)",
              }}
            >
              <Terminal className="w-4 h-4 text-terracotta shrink-0" />
              <code
                className="text-sm sm:text-[0.9375rem] font-[var(--font-mono)]"
                style={{ color: "var(--code-fg)" }}
              >
                <span className="text-terracotta/80">$</span>{" "}
                npm install -g ai-memex-cli
              </code>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText("npm install -g ai-memex-cli")
                }
                className="ml-1 text-xs font-[var(--font-mono)] transition-colors opacity-50 hover:opacity-100"
                style={{ color: "var(--code-fg)" }}
                title={m.hero.copyTitle}
              >
                {m.hero.copy}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="flex flex-wrap gap-3"
          >
            <a
              href="#quickstart"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-terracotta text-primary-foreground text-sm font-semibold rounded-md hover:brightness-110 transition-all shadow-sm ring-1 ring-terracotta/30"
            >
              {m.hero.quickStart}
            </a>
            <a
              href="https://github.com/zelixag/ai-memex-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-ink text-sm font-semibold rounded-md border border-border bg-background/60 hover:border-terracotta/40 hover:text-terracotta transition-colors backdrop-blur-sm"
            >
              {m.hero.viewGithub}
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <ArrowDown className="w-5 h-5 text-terracotta/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
