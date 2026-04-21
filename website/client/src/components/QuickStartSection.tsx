/*
 * Design: Knowledge Cartography — Step-by-step quick start guide
 * Numbered steps with code blocks, warm scholarly feel
 */
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Install",
    description: "Install globally via npm. The CLI provides two aliases: memex and ai-memex.",
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
      "Tell your agent to process raw files into structured wiki pages. Distill your sessions into reusable best practices.",
    code: `memex ingest\nmemex distill --latest --role backend`,
  },
  {
    number: "05",
    title: "Search & Use",
    description:
      "Search your knowledge base, lint for health, and inject context into your agent sessions.",
    code: `memex search "authentication patterns"\nmemex lint\nmemex inject`,
  },
];

export default function QuickStartSection() {
  return (
    <section id="quickstart" className="py-24 bg-parchment parchment-bg">
      <div className="container relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#10148;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            Quick Start
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            From zero to a working knowledge base in under 5 minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative pl-20 pb-12 last:pb-0"
            >
              {/* Vertical line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[2.15rem] top-12 bottom-0 w-px bg-gradient-to-b from-terracotta/30 to-border/30" />
              )}

              {/* Step number */}
              <div className="absolute left-0 top-0 w-[4.3rem] flex justify-center">
                <div className="w-11 h-11 rounded-full bg-terracotta/10 border-2 border-terracotta/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-terracotta font-[var(--font-mono)]">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-[var(--font-display)] text-2xl font-bold text-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-foreground/60 mb-4 leading-relaxed font-[var(--font-body)]">
                  {step.description}
                </p>
                <div className="code-block text-sm">
                  {step.code.split("\n").map((line, j) => (
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
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
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
            View Full Documentation on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
