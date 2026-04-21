/*
 * Design: Knowledge Cartography — Competitive comparison table
 * Warm tones, scholarly table styling
 */
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellValue = "yes" | "no" | "partial" | string;

const competitors = [
  { name: "ai-memex-cli", highlight: true },
  { name: "atomicmemory" },
  { name: "ussumant" },
  { name: "SamurAIGPT" },
  { name: "rohitg00" },
];

const rows: { feature: string; values: CellValue[] }[] = [
  {
    feature: "Architecture",
    values: ["Stateless CLI", "CLI (calls LLM)", "Claude Plugin", "Markdown Prompts", "MCP Server"],
  },
  {
    feature: "Agent Support",
    values: ["8+ agents", "Anthropic only", "Claude only", "Claude only", "MCP-compatible"],
  },
  {
    feature: "Web Fetching",
    values: ["yes", "partial", "no", "no", "no"],
  },
  {
    feature: "Keyword Search",
    values: ["yes", "no", "no", "no", "no"],
  },
  {
    feature: "Session Distillation",
    values: ["yes", "no", "no", "no", "partial"],
  },
  {
    feature: "Slash Commands",
    values: ["yes", "no", "yes", "partial", "no"],
  },
  {
    feature: "Interactive Onboarding",
    values: ["yes", "no", "no", "no", "no"],
  },
  {
    feature: "Self-Update",
    values: ["yes", "no", "no", "no", "no"],
  },
  {
    feature: "Zero API Cost",
    values: ["yes", "no", "yes", "yes", "no"],
  },
  {
    feature: "Cross-Platform",
    values: ["yes", "partial", "partial", "partial", "yes"],
  },
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
  return <span className="text-xs text-foreground/60 font-[var(--font-body)]">{value}</span>;
}

export default function ComparisonSection() {
  return (
    <section id="comparison" className="py-24 bg-ivory">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#9733;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            How We Compare
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            A side-by-side look at the LLM wiki ecosystem. We focus on universality, zero cost, and agent-native integration.
          </p>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-foreground/40 uppercase tracking-widest font-[var(--font-body)] border-b-2 border-border">
                  Feature
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    className={`py-4 px-4 text-center text-sm font-bold tracking-wide border-b-2 ${
                      c.highlight
                        ? "text-terracotta border-terracotta/40 bg-terracotta/5 font-[var(--font-display)]"
                        : "text-foreground/50 border-border font-[var(--font-body)]"
                    }`}
                  >
                    {c.highlight ? (
                      <div>
                        <div className="text-base">{c.name}</div>
                        <div className="text-[10px] font-normal text-terracotta/60 mt-0.5">★ This project</div>
                      </div>
                    ) : (
                      <span className="text-xs">{c.name}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 0 ? "bg-parchment/40" : "bg-transparent"}
                >
                  <td className="py-3 px-4 text-sm font-medium text-ink font-[var(--font-body)] border-b border-border/50">
                    {row.feature}
                  </td>
                  {row.values.map((val, j) => (
                    <td
                      key={j}
                      className={`py-3 px-4 text-center border-b border-border/50 ${
                        competitors[j].highlight ? "bg-terracotta/[0.03]" : ""
                      }`}
                    >
                      <CellContent value={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Footnote */}
        <div className="mt-6 text-center">
          <p className="text-xs text-foreground/40 font-[var(--font-body)]">
            Comparison based on publicly available documentation as of April 2026.
            atomicmemory = llm-wiki-compiler (508★), ussumant = llm-wiki-compiler (191★),
            SamurAIGPT = llm-wiki-agent (1900+★), rohitg00 = agentmemory (1600+★).
          </p>
        </div>
      </div>
    </section>
  );
}
