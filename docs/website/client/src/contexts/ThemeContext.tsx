import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark";
export type StylePreset = "tech" | "classic";

const STORAGE_THEME = "theme";
const STORAGE_PRESET = "memex-docs-preset";

interface ThemeContextType {
  theme: Theme;
  preset: StylePreset;
  setTheme: (t: Theme) => void;
  setPreset: (p: StylePreset) => void;
  toggleTheme: () => void;
  togglePreset: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_THEME);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function readStoredPreset(): StylePreset {
  try {
    const v = localStorage.getItem(STORAGE_PRESET);
    if (v === "tech" || v === "classic") return v;
  } catch {
    /* ignore */
  }
  return "tech";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPreset?: StylePreset;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  defaultPreset = "tech",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? defaultTheme);
  const [preset, setPresetState] = useState<StylePreset>(
    () => readStoredPreset() ?? defaultPreset,
  );

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_THEME, t);
    } catch {
      /* ignore */
    }
  }, []);

  const setPreset = useCallback((p: StylePreset) => {
    setPresetState(p);
    try {
      localStorage.setItem(STORAGE_PRESET, p);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_THEME, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const togglePreset = useCallback(() => {
    setPreset(preset === "tech" ? "classic" : "tech");
  }, [preset, setPreset]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("data-preset", preset);
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
  }, [theme, preset]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      preset,
      setTheme,
      setPreset,
      toggleTheme,
      togglePreset,
    }),
    [theme, preset, setTheme, setPreset, toggleTheme, togglePreset],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
