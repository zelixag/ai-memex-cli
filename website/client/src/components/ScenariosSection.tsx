/*
 * Design: Knowledge Cartography — scenario article index
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Database, FileSearch, Hammer, NotebookText } from "lucide-react";
import { useI18n } from "@/i18n";

const ICONS = [Database, BookOpen, FileSearch, NotebookText, Hammer] as const;

export default function ScenariosSection() {
  const { messages } = useI18n();
  const s = messages.scenarios;

  return (
    <section id="scenarios" className="py-24 bg-ivory">
      <div className="container">
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9672;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {s.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {s.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {s.articles.map((article, i) => {
            const Icon = ICONS[i]!;
            return (
              <Link key={article.slug} href={`/scenarios/${article.slug}`}>
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="group rounded-xl border border-border/60 bg-parchment/70 p-5 hover:border-terracotta/40 hover:shadow-lg transition-all min-h-[310px] flex flex-col"
              >
                <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-terracotta" />
                </div>
                <div className="text-[10px] font-semibold text-sage uppercase tracking-widest font-[var(--font-body)] mb-2">
                  {article.eyebrow}
                </div>
                <h3 className="font-[var(--font-display)] text-xl font-bold text-ink leading-tight mb-3">
                  {article.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed font-[var(--font-body)] mb-5">
                  {article.summary}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-terracotta group-hover:gap-3 transition-all">
                  {s.readArticle}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
