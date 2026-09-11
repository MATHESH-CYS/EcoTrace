"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "ecotrace-theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}

let themeListeners: (() => void)[] = [];

function subscribeTheme(callback: () => void) {
  themeListeners.push(callback);
  if (typeof window === "undefined") return () => {};

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onMqChange = () => callback();
  mq.addEventListener("change", onMqChange);

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    themeListeners = themeListeners.filter((l) => l !== callback);
    mq.removeEventListener("change", onMqChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, t);
      applyTheme(t);
      themeListeners.forEach((l) => l());
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const currentAttr = typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") : null;
    const isDark = currentAttr ? currentAttr === "dark" : resolvedTheme === "dark";
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
  }, [resolvedTheme, setTheme]);


  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Inline script string injected before hydration to prevent a flash of the wrong theme.
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = (t === 'light' || t === 'dark') ? t : (dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

