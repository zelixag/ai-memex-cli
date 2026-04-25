/*
 * Design: Knowledge Cartography — long-form scenario article
 */
import { useMemo } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { useI18n } from "@/i18n";

export default function ScenarioArticle() {
  const { messages } = useI18n();
  const [, params] = useRoute("/scenarios/:slug");
  const slug = params?.slug;
  const article = useMemo(
    () => messages.scenarios.articles.find((item) => item.slug === slug),
    [messages.scenarios.articles, slug],
  );

  if (!article) return <NotFound />;

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />
      <main className="pt-28 pb-20">
        <article className="container max-w-4xl">
          <a
            href={`${import.meta.env.BASE_URL}#scenarios`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta hover:text-terracotta-light transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            {messages.scenarios.backToScenarios}
          </a>

          <div className="mb-10">
            <div className="text-xs font-semibold text-sage uppercase tracking-widest font-[var(--font-body)] mb-4">
              {article.eyebrow}
            </div>
            <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-ink leading-tight mb-5">
              {article.title}
            </h1>
            <p className="text-lg text-foreground/65 leading-relaxed font-[var(--font-body)] max-w-3xl">
              {article.summary}
            </p>
          </div>

          <div className="code-block text-sm mb-12">
            {article.command.split("\n").map((line, index) => (
              <div key={`${index}-${line}`}>
                <span className="command">{line}</span>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {article.body.map((section) => (
              <section
                key={section.heading}
                className="rounded-xl border border-border/60 bg-parchment/55 p-6"
              >
                <h2 className="font-[var(--font-display)] text-2xl font-bold text-ink mb-3">
                  {section.heading}
                </h2>
                <p className="text-base text-foreground/70 leading-relaxed font-[var(--font-body)] mb-5">
                  {section.text}
                </p>
                <ol className="space-y-3 mb-5">
                  {section.steps.map((step, index) => (
                    <li
                      key={step}
                      className="grid grid-cols-[2rem_1fr] gap-3 text-sm text-foreground/75 leading-relaxed"
                    >
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-terracotta text-ivory text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sage mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  {messages.scenarios.runIt}
                </div>
                <div className="code-block text-xs">
                  {section.code.split("\n").map((line, index) => (
                    <div key={`${index}-${line}`}>
                      <span className="command">{line}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
