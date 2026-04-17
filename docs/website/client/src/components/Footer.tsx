/* Footer — palette from CSS variables (all theme combos) */
import { useI18n } from "@/i18n";
import { Terminal, Github, ExternalLink } from "lucide-react";

export default function Footer() {
  const { messages: m } = useI18n();
  const navLinks = m.navbar.links;

  return (
    <footer
      className="relative py-14 border-t border-[color:color-mix(in_oklch,var(--footer-text)_12%,transparent)]"
      style={{
        backgroundColor: "var(--footer-bg)",
        color: "var(--footer-text)",
      }}
    >
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-md bg-terracotta flex items-center justify-center ring-1 ring-white/15 shadow-sm">
                <Terminal className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-[var(--font-display)] text-lg font-bold tracking-tight text-[color:var(--footer-text)]">
                  ai-memex
                </span>
                <span
                  className="text-[10px] font-[var(--font-mono)] tracking-widest uppercase text-[color:var(--footer-text-muted)]"
                >
                  cli
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed font-[var(--font-body)] text-[color:var(--footer-text-muted)]">
              {m.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 font-[var(--font-body)] text-[color:var(--footer-text-muted)]">
              {m.footer.navTitle}
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors font-[var(--font-body)] text-[color:color-mix(in_oklch,var(--footer-text)_78%,transparent)] hover:text-[color:var(--footer-link-hover)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 font-[var(--font-body)] text-[color:var(--footer-text-muted)]">
              {m.footer.agentsTitle}
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
                  <span className="text-sm font-[var(--font-body)] text-[color:color-mix(in_oklch,var(--footer-text)_65%,transparent)]">
                    {agent}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 font-[var(--font-body)] text-[color:var(--footer-text-muted)]">
              {m.footer.resourcesTitle}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/zelixag/ai-memex-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors inline-flex items-center gap-1.5 font-[var(--font-body)] text-[color:color-mix(in_oklch,var(--footer-text)_78%,transparent)] hover:text-[color:var(--footer-link-hover)]"
                >
                  <Github className="w-3.5 h-3.5" />
                  {m.footer.githubRepo}
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/ai-memex-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors inline-flex items-center gap-1.5 font-[var(--font-body)] text-[color:color-mix(in_oklch,var(--footer-text)_78%,transparent)] hover:text-[color:var(--footer-link-hover)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {m.footer.npmPackage}
                </a>
              </li>
              <li>
                <a
                  href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors inline-flex items-center gap-1.5 font-[var(--font-body)] text-[color:color-mix(in_oklch,var(--footer-text)_78%,transparent)] hover:text-[color:var(--footer-link-hover)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {m.footer.karpathyGist}
                </a>
              </li>
            </ul>

            <div className="mt-6 p-3 rounded-md bg-black/25 border border-terracotta/25">
              <code className="text-xs font-[var(--font-mono)] text-terracotta">
                $ npm install -g ai-memex-cli
              </code>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:color-mix(in_oklch,var(--footer-text)_12%,transparent)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-[var(--font-body)] text-[color:color-mix(in_oklch,var(--footer-text)_45%,transparent)]">
            {m.footer.license}
          </p>
          <p className="text-xs font-[var(--font-mono)] text-[color:color-mix(in_oklch,var(--footer-text)_35%,transparent)]">
            v1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
