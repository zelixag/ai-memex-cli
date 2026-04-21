/*
 * Design: Knowledge Cartography — Competitive comparison table
 */
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { useI18n } from "@/i18n";

type CellValue = "yes" | "no" | "partial" | string;

const competitors = [
  { name: "ai-memex-cli", highlight: true },
  { name: "atomicmemory" },
  { name: "ussumant" },
  { name: "SamurAIGPT" },
  { name: "rohitg00" },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sage/15">
        <Check className="w-3.5 h-3.5 text-sage" />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10">
        <X className="w-3.5 h-3.5 text-destructive/60" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold/15">
        <Minus className="w-3.5 h-3.5 text-gold" />
      </span>
    );
  }
  return <span className="text-xs text-foreground/60 font-[var(--font-body)] leading-snug">{value}</span>;
}

export default function ComparisonSection() {
  const { messages } = useI18n();
  const cmp = messages.comparison;

  return (
    <section id="comparison" className="py-24 bg-ivory">
      <div className="container">
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9733;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {cmp.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {cmp.sectionSubtitle}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-foreground/40 uppercase tracking-widest font-[var(--font-body)] border-b-2 border-border">
                  {cmp.colFeature}
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    className={`py-4 px-3 text-center text-sm font-bold tracking-wide border-b-2 ${
                      c.highlight
                        ? "text-terracotta border-terracotta/40 bg-terracotta/5 font-[var(--font-display)]"
                        : "text-foreground/50 border-border font-[var(--font-body)]"
                    }`}
                  >
                    {c.highlight ? (
                      <div>
                        <div className="text-base">{c.name}</div>
                        <div className="text-[10px] font-normal text-terracotta/60 mt-0.5">
                          {cmp.thisProjectBadge}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs">{c.name}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cmp.rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 0 ? "bg-parchment/40" : "bg-transparent"}
                >
                  <td className="py-3 px-4 text-sm font-medium text-ink font-[var(--font-body)] border-b border-border/50 max-w-[140px]">
                    {row.feature}
                  </td>
                  {row.values.map((val, j) => (
                    <td
                      key={j}
                      className={`py-3 px-2 text-center border-b border-border/50 align-middle ${
                        competitors[j]!.highlight ? "bg-terracotta/[0.03]" : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        <CellContent value={val as CellValue} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-6 text-center">
          <p className="text-xs text-foreground/40 font-[var(--font-body)] max-w-4xl mx-auto leading-relaxed">
            {cmp.footnote}
          </p>
        </div>
      </div>
    </section>
  );
}
