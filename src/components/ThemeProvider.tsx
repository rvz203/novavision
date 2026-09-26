"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;

type ThemeContextValue = {
  theme: Theme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return isTheme(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function getInitialSystemTheme(): ResolvedTheme {
  return typeof window === "undefined" ? "light" : getSystemTheme();
}

function applyTheme(theme: Theme, systemTheme = getSystemTheme()) {
  const resolved = theme === "system" ? systemTheme : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getInitialSystemTheme);
  const themeRef = useRef<Theme>(theme);

  const setTheme = useCallback((nextTheme: Theme) => {
    themeRef.current = nextTheme;
    setThemeState(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_QUERY);
    applyTheme(themeRef.current, mediaQuery.matches ? "dark" : "light");

    const handleSystemChange = (event: MediaQueryListEvent) => {
      const nextSystemTheme: ResolvedTheme = event.matches ? "dark" : "light";
      setSystemTheme(nextSystemTheme);
      if (themeRef.current === "system") applyTheme("system", nextSystemTheme);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextTheme: Theme = isTheme(event.newValue) ? event.newValue : "system";
      themeRef.current = nextTheme;
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, systemTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
