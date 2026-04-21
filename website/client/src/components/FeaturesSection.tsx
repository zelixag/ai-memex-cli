/*
 * Design: Knowledge Cartography — Feature cards with warm illustrations
 * Asymmetric layout, alternating image/text sides
 */
import { motion } from "framer-motion";
import { Globe, Beaker, Compass, Search, FileText, Shield } from "lucide-react";

const FETCH_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/feature-fetch_04bfb222.png";
const DISTILL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/feature-distill_92e3b3c8.png";
const AGENTS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/feature-agents_c5f61fb1.png";

const features = [
  {
    title: "Fetch & Crawl",
    subtitle: "Built-in Web Scraper",
    description:
      "Grab documentation from any URL, crawl entire doc sites via sitemap, or search by keywords — all saved as clean Markdown in your raw/ directory. No API key needed.",
    image: FETCH_IMG,
    icon: Globe,
    code: `memex fetch "react hooks best practices"\nmemex fetch https://docs.anthropic.com --depth 2\nmemex fetch https://nextjs.org/sitemap.xml --sitemap`,
  },
  {
    title: "Distill Sessions",
    subtitle: "Role-Based Best Practices",
    description:
      "Extract structured best practices from your AI agent conversations. Automatically discovers session files, distills them by role (backend, frontend, devops), and builds your team's knowledge base.",
    image: DISTILL_IMG,
    icon: Beaker,
    code: `memex distill --latest --role backend\nmemex distill ./chat-log.jsonl --role "tech-lead"\nmemex distill --latest --agent claude-code`,
  },
  {
    title: "Universal Agent Support",
    subtitle: "One CLI, Every Agent",
    description:
      "Works with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev, and more. One onboard command sets up slash commands for your chosen agent.",
    image: AGENTS_IMG,
    icon: Compass,
    code: `memex onboard\n# → Choose agent → Auto-detect sessions\n# → Init vault → Install /memex:* commands`,
  },
];

const smallFeatures = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Full-text search across wiki and raw files with keyword highlighting and relevance scoring.",
  },
  {
    icon: FileText,
    title: "Structured Wiki",
    description: "Entities, concepts, sources, summaries — each with frontmatter schema validation and cross-linking.",
  },
  {
    icon: Shield,
    title: "Health Checks",
    description: "Lint for broken links, orphan pages, missing frontmatter. Keep your knowledge base clean and connected.",
  },
];

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const isReversed = index % 2 === 1;
  const Icon = feature.icon;

  return (
    <div
      className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-16 items-center`}
    >
      {/* Image */}
      <motion.div
        initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-5/12 shrink-0"
      >
        <div className="relative rounded-xl overflow-hidden shadow-xl border border-border/60">
          <img
            src={feature.image}
            alt={feature.title}
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent" />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full lg:w-7/12"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-terracotta" />
          </div>
          <span className="text-xs font-semibold text-sage uppercase tracking-widest font-[var(--font-body)]">
            {feature.subtitle}
          </span>
        </div>
        <h3 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-ink mb-4">
          {feature.title}
        </h3>
        <p className="text-base text-foreground/70 leading-relaxed mb-6 font-[var(--font-body)]">
          {feature.description}
        </p>
        <div className="code-block text-sm">
          {feature.code.split("\n").map((line, i) => (
            <div key={i}>
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
      </motion.div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-parchment parchment-bg">
      <div className="container relative z-10">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#10022;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            Core Capabilities
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            Everything you need to build, maintain, and leverage persistent knowledge for your AI agents.
          </p>
        </div>

        {/* Main features */}
        <div className="space-y-24 mb-24">
          {features.map((feature, i) => (
            <FeatureBlock key={feature.title} feature={feature} index={i} />
          ))}
        </div>

        {/* Small features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {smallFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-ivory/80 rounded-xl p-6 border border-border/60 hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-gold-light/60 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <h4 className="font-[var(--font-display)] text-xl font-bold text-ink mb-2">
                  {f.title}
                </h4>
                <p className="text-sm text-foreground/60 leading-relaxed font-[var(--font-body)]">
                  {f.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
