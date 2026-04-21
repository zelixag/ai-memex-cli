/*
 * Design: Knowledge Cartography — Architecture diagram with layered visual
 * Shows the 3-layer architecture and vault structure
 */
import { motion } from "framer-motion";

const ARCH_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/architecture-diagram_37155211.png";

const layers = [
  {
    label: "Layer 3 — AI Agent",
    desc: "Claude Code, Codex, Cursor, OpenCode, Gemini CLI, Aider, Continue.dev",
    color: "bg-terracotta/10 border-terracotta/30",
    textColor: "text-terracotta",
  },
  {
    label: "Layer 2 — ai-memex-cli",
    desc: "Stateless primitives: onboard · fetch · ingest · distill · glob · inject · lint · search · update",
    color: "bg-sage-light/60 border-sage/30",
    textColor: "text-sage",
  },
  {
    label: "Layer 1 — Vault (filesystem)",
    desc: "~/.llmwiki/global/ (personal) + .llmwiki/local/ (project)",
    color: "bg-gold-light/60 border-gold/30",
    textColor: "text-gold",
  },
];

const vaultTree = [
  { indent: 0, text: "~/.llmwiki/global/", highlight: true },
  { indent: 1, text: "AGENTS.md", note: "Agent instructions" },
  { indent: 1, text: "index.md", note: "Wiki index" },
  { indent: 1, text: "log.md", note: "Chronological log" },
  { indent: 1, text: "config.yaml", note: "Vault configuration" },
  { indent: 1, text: "raw/", highlight: true },
  { indent: 2, text: "research/", note: "Fetched docs, articles" },
  { indent: 2, text: "personal/", note: "Personal notes" },
  { indent: 2, text: "reading/", note: "Reading material" },
  { indent: 1, text: "wiki/", highlight: true },
  { indent: 2, text: "research/" },
  { indent: 3, text: "entities/", note: "People, tools, orgs" },
  { indent: 3, text: "concepts/", note: "Ideas, patterns" },
  { indent: 3, text: "sources/", note: "Reference citations" },
  { indent: 3, text: "summaries/", note: "Synthesized overviews" },
];

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="py-24 bg-ivory">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9670;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            Architecture
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            Three clean layers. The CLI never calls an LLM — it constructs context and hands it to your agent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Layered diagram */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Architecture image */}
            <div className="rounded-xl overflow-hidden shadow-xl border border-border/60 mb-8">
              <img
                src={ARCH_IMG}
                alt="ai-memex-cli architecture diagram"
                className="w-full h-auto"
              />
            </div>

            {/* Layer cards */}
            <div className="space-y-3">
              {layers.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`rounded-lg border p-4 ${layer.color}`}
                >
                  <div className={`text-sm font-bold ${layer.textColor} font-[var(--font-display)] mb-1`}>
                    {layer.label}
                  </div>
                  <div className="text-xs text-foreground/60 font-[var(--font-body)]">
                    {layer.desc}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Arrow annotations */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-foreground/40 font-[var(--font-mono)]">
              <span>↕ shell + prompts</span>
              <span className="text-border">|</span>
              <span>↕ filesystem</span>
            </div>
          </motion.div>

          {/* Right: Vault structure */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h3 className="font-[var(--font-display)] text-2xl font-bold text-ink mb-2">
              Vault Structure
            </h3>
            <p className="text-sm text-foreground/60 mb-6 font-[var(--font-body)]">
              A dual-vault system: <strong>Global</strong> for personal compounding knowledge, <strong>Local</strong> for project-specific context.
            </p>

            <div className="code-block text-[13px] leading-relaxed">
              {vaultTree.map((item, i) => (
                <div key={i} style={{ paddingLeft: `${item.indent * 1.25}rem` }}>
                  {item.highlight ? (
                    <span className="command">{item.indent > 0 ? "├── " : ""}{item.text}</span>
                  ) : (
                    <>
                      <span className="prompt">├── </span>
                      <span>{item.text}</span>
                    </>
                  )}
                  {item.note && (
                    <span className="comment"> {"  "}# {item.note}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Core principle callout */}
            <div className="mt-8 p-5 rounded-lg bg-terracotta/5 border border-terracotta/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-terracotta font-[var(--font-display)] text-sm font-bold">!</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink mb-1 font-[var(--font-display)]">
                    Core Design Principle
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed font-[var(--font-body)]">
                    The CLI makes <strong className="text-ink">zero LLM API calls</strong>. It handles mechanical correctness (file structure, frontmatter, linting, fetching), while your AI Agent handles semantic correctness (reading, synthesizing, linking).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
