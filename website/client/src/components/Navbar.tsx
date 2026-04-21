/*
 * Design: Knowledge Cartography — warm parchment + ink + terracotta
 * Navbar: Horizontal top bar with ornamental styling, scholarly feel
 */
import { useState } from "react";
import { Menu, X, Github, Terminal } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Commands", href: "#commands" },
  { label: "Comparison", href: "#comparison" },
  { label: "Quick Start", href: "#quickstart" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ivory/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Terminal className="w-5 h-5 text-ivory" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-[var(--font-display)] text-lg font-bold text-ink tracking-tight">
              ai-memex
            </span>
            <span className="text-[10px] font-[var(--font-mono)] text-muted-foreground tracking-widest uppercase">
              cli
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 hover:text-terracotta transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-terracotta after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/zelixag/ai-memex-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a
            href="#quickstart"
            className="px-4 py-2 bg-terracotta text-ivory text-sm font-semibold rounded-md hover:bg-terracotta-light transition-colors shadow-sm"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-ivory border-t border-border">
          <div className="container py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/70 hover:text-terracotta py-2 border-b border-border/50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/zelixag/ai-memex-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-foreground/70 py-2"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
