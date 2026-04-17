/*
 * Design: Knowledge Cartography — Architecture diagram with layered visual
 * Shows the 3-layer architecture and vault structure
 */
import { useI18n } from "@/i18n";
import { motion } from "framer-motion";

const ARCH_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/architecture-diagram_37155211.png";

const LAYER_STYLES = [
  {
    color: "bg-terracotta/10 border-terracotta/30",
    textColor: "text-terracotta",
  },
  {
    color: "bg-sage-light/60 border-sage/30",
    textColor: "text-sage",
  },
  {
    color: "bg-gold-light/60 border-gold/30",
    textColor: "text-gold",
  },
] as const;

export default function ArchitectureSection() {
  const { messages: m } = useI18n();
  const layers = m.architecture.layers.map((layer, i) => ({
    ...layer,
    ...LAYER_STYLES[i]!,
  }));
  const vaultTree = m.architecture.vaultTree;

  return (
    <section id="architecture" className="py-24 bg-ivory">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9670;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {m.architecture.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {m.architecture.sectionSubtitle}
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
            <div className="rounded-lg overflow-hidden shadow-sm border border-border/50 ring-1 ring-black/[0.03] mb-8">
              <img
                src={ARCH_IMG}
                alt={m.architecture.diagramAlt}
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
                  <div
                    className={`text-sm font-bold ${layer.textColor} font-[var(--font-display)] mb-1`}
                  >
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
              <span>{m.architecture.flowLeft}</span>
              <span className="text-border">|</span>
              <span>{m.architecture.flowRight}</span>
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
              {m.architecture.vaultTitle}
            </h3>
            <p className="text-sm text-foreground/60 mb-6 font-[var(--font-body)]">
              {m.architecture.vaultIntro}
            </p>

            <div className="code-block text-[13px] leading-relaxed">
              {vaultTree.map((item, i) => (
                <div key={i} style={{ paddingLeft: `${item.indent * 1.25}rem` }}>
                  {"highlight" in item && item.highlight ? (
                    <span className="command">
                      {item.indent > 0 ? "├── " : ""}
                      {item.text}
                    </span>
                  ) : (
                    <>
                      <span className="prompt">├── </span>
                      <span>{item.text}</span>
                    </>
                  )}
                  {"note" in item && item.note ? (
                    <span className="comment"> {"  "}# {item.note}</span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Core principle callout */}
            <div className="mt-8 p-5 rounded-lg bg-terracotta/[0.06] border border-terracotta/20 backdrop-blur-[2px]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-terracotta font-[var(--font-display)] text-sm font-bold">
                    !
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink mb-1 font-[var(--font-display)]">
                    {m.architecture.principleTitle}
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed font-[var(--font-body)]">
                    {m.architecture.principleBefore}
                    <strong className="text-ink">{m.architecture.principleStrong}</strong>
                    {m.architecture.principleAfter}
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
