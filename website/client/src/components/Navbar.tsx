/*
 * Design: Knowledge Cartography — Navbar with language toggle
 */
import { useState } from "react";
import { Circle, Cpu, Github, Languages, Menu, Palette, Terminal, X } from "lucide-react";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useI18n, type Locale } from "@/i18n";

export default function Navbar() {
  const { locale, setLocale, messages } = useI18n();
  const { theme, setTheme, themes } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = messages.navbar.links;
  const ui = messages.ui;

  const toggleLocale = () => {
    setLocale(locale === "en-US" ? "zh-CN" : "en-US");
  };

  const otherLocale: Locale = locale === "en-US" ? "zh-CN" : "en-US";
  const otherLabel = otherLocale === "zh-CN" ? ui.switchToZh : ui.switchToEn;
  const themeLabels: Record<Theme, string> = {
    default: ui.themeDefault,
    mono: ui.themeMono,
    tech: ui.themeTech,
  };
  const themeIcons = {
    default: Palette,
    mono: Circle,
    tech: Cpu,
  } satisfies Record<Theme, typeof Palette>;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ivory/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
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

        <div className="hidden md:flex items-center gap-3">
          <div
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-parchment/60 p-1"
            aria-label={ui.themeToggleAria}
          >
            {themes.map((item) => {
              const Icon = themeIcons[item];
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTheme(item)}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-semibold transition-colors ${
                    theme === item
                      ? "bg-terracotta text-ivory"
                      : "text-foreground/65 hover:text-terracotta"
                  }`}
                  aria-label={themeLabels[item]}
                  title={themeLabels[item]}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/60 text-xs font-semibold text-foreground/70 hover:text-terracotta hover:border-terracotta/40 transition-colors"
            aria-label={ui.languageToggleAria}
            title={ui.languageToggleAria}
          >
            <Languages className="w-3.5 h-3.5" />
            {otherLabel}
          </button>
          <a
            href="https://github.com/zelixag/ai-memex-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            {messages.navbar.github}
          </a>
          <a
            href="#quickstart"
            className="px-4 py-2 bg-terracotta text-ivory text-sm font-semibold rounded-md hover:bg-terracotta-light transition-colors shadow-sm"
          >
            {messages.navbar.getStarted}
          </a>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

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
            <button
              type="button"
              onClick={() => {
                toggleLocale();
                setMobileOpen(false);
              }}
              className="text-left text-sm font-medium text-foreground/70 hover:text-terracotta py-2 flex items-center gap-2"
            >
              <Languages className="w-4 h-4" />
              {otherLabel}
            </button>
            <div className="grid grid-cols-3 gap-2 py-2">
              {themes.map((item) => {
                const Icon = themeIcons[item];
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTheme(item)}
                    className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
                      theme === item
                        ? "border-terracotta bg-terracotta text-ivory"
                        : "border-border/60 text-foreground/70"
                    }`}
                    aria-label={themeLabels[item]}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {themeLabels[item]}
                  </button>
                );
              })}
            </div>
            <a
              href="https://github.com/zelixag/ai-memex-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-foreground/70 py-2"
            >
              <Github className="w-4 h-4" />
              {messages.navbar.github}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
