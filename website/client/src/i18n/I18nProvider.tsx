import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enUS } from "./en-US";
import { zhCN, type AppMessages } from "./zh-CN";

const STORAGE_KEY = "ai-memex-site-locale";

export type Locale = "zh-CN" | "en-US";

const MESSAGES: Record<Locale, AppMessages> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "zh-CN" || v === "en-US") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en-US";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const lang of langs) {
    const l = lang.toLowerCase();
    if (l.startsWith("zh")) return "zh-CN";
    if (l.startsWith("en")) return "en-US";
  }
  return "en-US";
}

function getInitialLocale(): Locale {
  return readStoredLocale() ?? detectBrowserLocale();
}

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: AppMessages;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const messages = useMemo(() => MESSAGES[locale], [locale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
    document.title = messages.meta.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", messages.meta.description);
    }
  }, [locale, messages]);

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, messages }),
    [locale, setLocale, messages],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
