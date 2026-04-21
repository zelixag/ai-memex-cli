/*
 * Design: Knowledge Cartography — Feature cards with warm illustrations
 */
import { motion } from "framer-motion";
import {
  Globe, Beaker, Compass,
  Search, ShieldCheck, Terminal,
  Activity, Layers,
} from "lucide-react";
import { useI18n } from "@/i18n";

const FETCH_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/feature-fetch_04bfb222.png";
const DISTILL_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/feature-distill_92e3b3c8.png";
const AGENTS_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663089592650/8gUpxoXV9ibnL63toqcSZM/feature-agents_c5f61fb1.png";

const BLOCK_ICONS = [Globe, Beaker, Compass] as const;
const SMALL_ICONS = [Search, ShieldCheck, Terminal] as const;
const ADVANCED_ICONS = [Activity, Layers] as const;

function FeatureBlock({
  title,
  subtitle,
  description,
  code,
  image,
  index,
  Icon,
}: {
  title: string;
  subtitle: string;
  description: string;
  code: string;
  image: string;
  index: number;
  Icon: (typeof BLOCK_ICONS)[number];
}) {
  const isReversed = index % 2 === 1;

  return (
    <div
      className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-16 items-center`}
    >
      <motion.div
        initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-5/12 shrink-0"
      >
        <div className="relative rounded-xl overflow-hidden shadow-xl border border-border/60">
          <img src={image} alt={title} className="w-full h-auto" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent" />
        </div>
      </motion.div>

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
            {subtitle}
          </span>
        </div>
        <h3 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-ink mb-4">
          {title}
        </h3>
        <p className="text-base text-foreground/70 leading-relaxed mb-6 font-[var(--font-body)]">
          {description}
        </p>
        <div className="code-block text-sm">
          {code.split("\n").map((line, i) => (
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
  const { messages } = useI18n();
  const f = messages.features;
  const blockImages = [FETCH_IMG, DISTILL_IMG, AGENTS_IMG];

  return (
    <section id="features" className="py-24 bg-parchment parchment-bg">
      <div className="container relative z-10">
        <div className="text-center mb-20">
          <div className="ornament-divider justify-center mb-6">
            <span className="ornament-symbol">&#10022;</span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink mb-4">
            {f.sectionTitle}
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
            {f.sectionSubtitle}
          </p>
        </div>

        <div className="space-y-24 mb-24">
          {f.blocks.map((block, i) => (
            <FeatureBlock
              key={block.title}
              title={block.title}
              subtitle={block.subtitle}
              description={block.description}
              code={block.code}
              image={blockImages[i]!}
              index={i}
              Icon={BLOCK_ICONS[i]!}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {f.small.map((item, i) => {
            const Icon = SMALL_ICONS[i]!;
            return (
              <motion.div
                key={item.title}
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
                  {item.title}
                </h4>
                <p className="text-sm text-foreground/60 leading-relaxed font-[var(--font-body)]">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-border/60 pt-16">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-sage uppercase tracking-widest font-[var(--font-body)]">
              {f.advanced.kicker}
            </span>
            <h3 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-ink mt-3 mb-3">
              {f.advanced.title}
            </h3>
            <p className="text-base text-foreground/60 max-w-2xl mx-auto font-[var(--font-body)]">
              {f.advanced.subtitleBefore}
              <strong className="text-ink">{f.advanced.subtitleStrong}</strong>
              {f.advanced.subtitleAfter}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {f.advanced.cards.map((card, i) => {
              const Icon = ADVANCED_ICONS[i]!;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-ivory/80 rounded-xl p-6 border border-border/60 hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-terracotta" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-sage uppercase tracking-widest font-[var(--font-body)]">
                        {card.label}
                      </div>
                      <h4 className="font-[var(--font-mono)] text-base font-bold text-ink truncate">
                        {card.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed mb-4 font-[var(--font-body)]">
                    {card.description}
                  </p>
                  <div className="code-block text-xs mt-auto">
                    {card.code.split("\n").map((line, j) => (
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
