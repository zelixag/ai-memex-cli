/*
 * Design: Knowledge Cartography — Hero with cartographer's desk background
 */
import { motion } from "framer-motion";
import { ArrowDown, Terminal, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";

const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/hero-map_439eb193.png";
const KARPATHY_GIST =
  "https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f";

export default function HeroSection() {
  const { messages } = useI18n();
  const h = messages.hero;

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt={h.imgAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/85 to-ivory/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory via-transparent to-ivory/30" />
      </div>

      <div className="container relative z-10 pt-24 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-light/80 border border-sage/30 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-sage" />
            <span className="text-xs font-semibold text-sage tracking-wide uppercase font-[var(--font-body)]">
              {h.badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl font-bold text-ink leading-[1.1] mb-6"
          >
            {h.titleLine1}
            <br />
            <span className="text-terracotta italic">{h.titleLine2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-foreground/70 leading-relaxed mb-6 max-w-xl font-[var(--font-body)]"
          >
            {h.subtitleBefore}
            <a
              href={KARPATHY_GIST}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-terracotta/40 hover:decoration-terracotta"
            >
              {h.subtitleLink}
            </a>
            {h.subtitleAfter}
          </motion.p>

          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="border-l-2 border-terracotta/40 pl-4 mb-8 max-w-xl"
          >
            <p className="text-sm text-foreground/60 italic font-[var(--font-body)] leading-relaxed">
              {h.quote}
            </p>
            <cite className="text-xs text-foreground/40 not-italic font-[var(--font-body)]">
              {h.quoteAuthor}
            </cite>
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-ink rounded-lg shadow-lg border border-ink/80">
              <Terminal className="w-4 h-4 text-gold shrink-0" />
              <code className="text-sm sm:text-base font-[var(--font-mono)] text-ivory/90">
                <span className="text-gold/60">$</span>{" "}
                npm install -g ai-memex-cli
              </code>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText("npm install -g ai-memex-cli")
                }
                className="ml-2 text-ivory/40 hover:text-ivory/80 transition-colors text-xs"
                title={h.copyTitle}
              >
                {h.copy}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#quickstart"
              className="px-6 py-3 bg-terracotta text-ivory font-semibold rounded-md hover:bg-terracotta-light transition-all shadow-md hover:shadow-lg text-sm"
            >
              {h.quickStart}
            </a>
            <a
              href="https://github.com/zelixag/ai-memex-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-transparent text-ink font-semibold rounded-md border-2 border-ink/20 hover:border-terracotta hover:text-terracotta transition-all text-sm"
            >
              {h.viewGithub}
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ArrowDown className="w-5 h-5 text-terracotta/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
