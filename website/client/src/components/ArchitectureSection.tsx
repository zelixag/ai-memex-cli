/*
 * Design: Knowledge Cartography — Architecture diagram with layered visual
 */
import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

const ARCH_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/architecture-diagram_37155211.png";

const LAYER_STYLES = [
  { color: "bg-terracotta/10 border-terracotta/30", textColor: "text-terracotta" },
  { color: "bg-sage-light/60 border-sage/30", textColor: "text-sage" },
  { color: "bg-gold-light/60 border-gold/30", textColor: "text-gold" },
] as const;

export default function ArchitectureSection() {
  const { messages } = useI18n();
  const a = messages.architecture;

  return (
    <section id="architecture" className="py-24 bg-ivory">
      <div className="container">
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9670;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {a.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {a.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-xl overflow-hidden shadow-xl border border-border/60 mb-8">
              <img
                src={ARCH_IMG}
                alt={a.diagramAlt}
                className="w-full h-auto"
              />
            </div>

            <div className="space-y-3">
              {a.layers.map((layer, i) => {
                const style = LAYER_STYLES[i]!;
                return (
                  <motion.div
                    key={layer.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={`rounded-lg border p-4 ${style.color}`}
                  >
                    <div
                      className={`text-sm font-bold ${style.textColor} font-[var(--font-display)] mb-1`}
                    >
                      {layer.label}
                    </div>
                    <div className="text-xs text-foreground/60 font-[var(--font-body)]">
                      {layer.desc}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-foreground/40 font-[var(--font-mono)]">
              <span>{a.flowLeft}</span>
              <span className="text-border">|</span>
              <span>{a.flowRight}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h3 className="font-[var(--font-display)] text-2xl font-bold text-ink mb-2">
              {a.vaultTitle}
            </h3>
            <p className="text-sm text-foreground/60 mb-6 font-[var(--font-body)]">
              {a.vaultIntro}
            </p>

            <div className="code-block text-[13px] leading-relaxed">
              {a.vaultTree.map((item, i) => (
                <div key={i} style={{ paddingLeft: `${item.indent * 1.25}rem` }}>
                  {item.highlight ? (
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
                  {item.note && (
                    <span className="comment">
                      {"  "}# {item.note}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-lg bg-terracotta/5 border border-terracotta/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-terracotta font-[var(--font-display)] text-sm font-bold">
                    !
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink mb-1 font-[var(--font-display)]">
                    {a.principleTitle}
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed font-[var(--font-body)]">
                    {a.principleLead}
                    <strong className="text-ink">{a.principleStrong}</strong>
                    {a.principleTail}
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
