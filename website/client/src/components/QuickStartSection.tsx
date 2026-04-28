/*
 * Design: Knowledge Cartography — Step-by-step quick start guide
 */
import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

export default function QuickStartSection() {
  const { messages } = useI18n();
  const q = messages.quickStart;

  return (
    <section id="quickstart" className="py-24 bg-parchment parchment-bg">
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#10148;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {q.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {q.sectionSubtitle}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {q.steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative pl-20 pb-12 last:pb-0"
            >
              {i < q.steps.length - 1 && (
                <div className="absolute left-[2.15rem] top-12 bottom-0 w-px bg-gradient-to-b from-terracotta/30 to-border/30" />
              )}

              <div className="absolute left-0 top-0 w-[4.3rem] flex justify-center">
                <div className="w-11 h-11 rounded-full bg-terracotta/10 border-2 border-terracotta/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-terracotta font-[var(--font-mono)]">
                    {step.number}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-[var(--font-display)] text-2xl font-bold text-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-foreground/60 mb-4 leading-relaxed font-[var(--font-body)]">
                  {step.description}
                </p>
                <div className="code-block text-sm">
                  {step.code.split("\n").map((line, j) => {
                    const isComment = line.startsWith("#");
                    const isAgent = /^(你：|You:)/.test(line);
                    if (isComment) {
                      return (
                        <div key={j}>
                          <span className="comment">{line}</span>
                        </div>
                      );
                    }
                    if (isAgent) {
                      return (
                        <div key={j}>
                          <span className="prompt text-terracotta">›</span>
                          <span className="command font-semibold">{" " + line}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={j}>
                        <span className="prompt">$ </span>
                        <span className="command">{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {q.cliFallback && (
          <div className="max-w-3xl mx-auto mt-12">
            <details className="rounded-lg border border-border/60 bg-ivory/40 p-5 group">
              <summary className="cursor-pointer font-semibold text-ink font-[var(--font-display)] text-base list-none flex items-center justify-between">
                <span>{q.cliFallback.title}</span>
                <span className="text-foreground/40 text-sm group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="text-sm text-foreground/60 mt-3 mb-4 leading-relaxed font-[var(--font-body)]">
                {q.cliFallback.description}
              </p>
              <div className="code-block text-sm">
                {q.cliFallback.code.split("\n").map((line, j) => (
                  <div key={j}>
                    {line.startsWith("#") ? (
                      <span className="comment">{line}</span>
                    ) : (
                      <>
                        <span className="prompt">$ </span>
                        <span className="command">{line}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <a
            href="https://github.com/zelixag/ai-memex-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-terracotta text-ivory font-semibold rounded-lg hover:bg-terracotta-light transition-all shadow-lg hover:shadow-xl text-base"
          >
            {q.cta}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
