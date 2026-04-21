/*
 * Design: Knowledge Cartography — Scholarly footer
 */
import { Terminal, Github, ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n";

export default function Footer() {
  const { messages } = useI18n();
  const f = messages.footer;
  const navLinks = messages.navbar.links;

  return (
    <footer className="bg-ink text-ivory/80 py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center">
                <Terminal className="w-5 h-5 text-ivory" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-[var(--font-display)] text-lg font-bold text-ivory tracking-tight">
                  ai-memex
                </span>
                <span className="text-[10px] font-[var(--font-mono)] text-ivory/40 tracking-widest uppercase">
                  cli
                </span>
              </div>
            </div>
            <p className="text-sm text-ivory/50 leading-relaxed font-[var(--font-body)]">
              {f.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-ivory/40 uppercase tracking-widest mb-4 font-[var(--font-body)]">
              {f.navTitle}
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-ivory/60 hover:text-terracotta-light transition-colors font-[var(--font-body)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-ivory/40 uppercase tracking-widest mb-4 font-[var(--font-body)]">
              {f.agentsTitle}
            </h4>
            <ul className="space-y-2">
              {[
                "Claude Code",
                "Codex",
                "OpenCode",
                "Cursor",
                "Gemini CLI",
                "Aider",
                "Continue.dev",
              ].map((agent) => (
                <li key={agent}>
                  <span className="text-sm text-ivory/50 font-[var(--font-body)]">{agent}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-ivory/40 uppercase tracking-widest mb-4 font-[var(--font-body)]">
              {f.resourcesTitle}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/zelixag/ai-memex-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ivory/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5 font-[var(--font-body)]"
                >
                  <Github className="w-3.5 h-3.5" />
                  {f.githubRepo}
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/ai-memex-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ivory/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5 font-[var(--font-body)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {f.npmPackage}
                </a>
              </li>
              <li>
                <a
                  href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ivory/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5 font-[var(--font-body)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {f.karpathyGist}
                </a>
              </li>
            </ul>

            <div className="mt-6 p-3 rounded-lg bg-ivory/5 border border-ivory/10">
              <code className="text-xs font-[var(--font-mono)] text-gold/80">
                $ npm install -g ai-memex-cli
              </code>
            </div>
          </div>
        </div>

        <div className="border-t border-ivory/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/30 font-[var(--font-body)]">{f.license}</p>
          <p className="text-xs text-ivory/20 font-[var(--font-mono)]">{f.version}</p>
        </div>
      </div>
    </footer>
  );
}
