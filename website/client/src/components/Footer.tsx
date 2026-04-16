/*
 * Design: Knowledge Cartography — Scholarly footer with ornamental styling
 */
import { Terminal, Github, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink text-ivory/80 py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
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
              Persistent memory for AI agents. Inspired by Karpathy's LLM Wiki pattern.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-ivory/40 uppercase tracking-widest mb-4 font-[var(--font-body)]">
              Navigation
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Features", href: "#features" },
                { label: "Architecture", href: "#architecture" },
                { label: "Commands", href: "#commands" },
                { label: "Comparison", href: "#comparison" },
                { label: "Quick Start", href: "#quickstart" },
              ].map((link) => (
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

          {/* Supported Agents */}
          <div>
            <h4 className="text-xs font-bold text-ivory/40 uppercase tracking-widest mb-4 font-[var(--font-body)]">
              Supported Agents
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

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold text-ivory/40 uppercase tracking-widest mb-4 font-[var(--font-body)]">
              Resources
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
                  GitHub Repository
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
                  npm Package
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
                  Karpathy's LLM Wiki Gist
                </a>
              </li>
            </ul>

            {/* Install command */}
            <div className="mt-6 p-3 rounded-lg bg-ivory/5 border border-ivory/10">
              <code className="text-xs font-[var(--font-mono)] text-gold/80">
                $ npm install -g ai-memex-cli
              </code>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ivory/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/30 font-[var(--font-body)]">
            MIT License &copy; 2026. Built with care for the AI agent ecosystem.
          </p>
          <p className="text-xs text-ivory/20 font-[var(--font-mono)]">
            v1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
