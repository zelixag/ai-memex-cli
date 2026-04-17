/* 顶栏：固定高度 + 右侧仅 GitHub / 偏好 / 开始 /（移动）菜单，避免控件换行导致跳动 */
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Github, Menu, Settings2, Terminal, X } from "lucide-react";
import type { StylePreset } from "@/contexts/ThemeContext";

export default function Navbar() {
  const { locale, setLocale, messages } = useI18n();
  const { theme, preset, setPreset, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = messages.navbar.links;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-full max-w-[1280px] items-center justify-between gap-3">
        <a href="#" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="size-9 shrink-0 rounded-md bg-terracotta flex items-center justify-center shadow-sm ring-1 ring-terracotta/25">
            <Terminal className="size-5 text-primary-foreground" />
          </div>
          <div className="min-w-[7.25rem] leading-tight">
            <span className="block truncate font-[var(--font-display)] text-base font-bold text-ink tracking-tight md:text-[1.05rem]">
              ai-memex
            </span>
            <span className="block font-[var(--font-mono)] text-[10px] text-muted-foreground tracking-[0.18em] uppercase">
              cli
            </span>
          </div>
        </a>

        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
          <div className="flex max-w-full items-center gap-5 lg:gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="shrink-0 text-sm font-medium text-foreground/65 transition-colors hover:text-terracotta"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href="https://github.com/zelixag/ai-memex-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border/50 text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="size-4" />
          </a>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0 border-border/50"
                aria-label={messages.ui.menuOpenSettings}
              >
                <Settings2 className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" collisionPadding={12}>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {messages.ui.menuPreferences}
              </DropdownMenuLabel>
              <DropdownMenuLabel className="pt-1 text-[11px] uppercase tracking-wider text-muted-foreground/80">
                {messages.ui.menuStyle}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={preset}
                onValueChange={(v) => setPreset(v as StylePreset)}
              >
                <DropdownMenuRadioItem value="tech">
                  {messages.ui.styleTech}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="classic">
                  {messages.ui.styleClassic}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                {messages.ui.menuLanguage}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(v) => setLocale(v as Locale)}
              >
                <DropdownMenuRadioItem value="zh-CN">
                  {messages.ui.switchToZh}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en-US">
                  {messages.ui.switchToEn}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={theme === "dark"}
                onCheckedChange={(c) => setTheme(c ? "dark" : "light")}
              >
                {messages.ui.menuDark}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            href="#quickstart"
            className="hidden h-9 shrink-0 items-center rounded-md bg-terracotta px-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-terracotta/25 transition-all hover:brightness-110 sm:inline-flex"
          >
            {messages.navbar.getStarted}
          </a>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border/50 text-foreground md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-md md:hidden">
          <div className="container flex max-w-[1280px] flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-terracotta"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#quickstart"
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-terracotta text-sm font-semibold text-primary-foreground ring-1 ring-terracotta/25"
              onClick={() => setMobileOpen(false)}
            >
              {messages.navbar.getStarted}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
