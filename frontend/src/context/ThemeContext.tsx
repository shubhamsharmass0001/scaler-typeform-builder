"use client";

/**
 * context/ThemeContext.tsx — Creator App Dark Mode Store & Provider
 *
 * Implements:
 *   - Three modes: "light" | "dark" | "system"
 *   - Default mode = "system" (follows prefers-color-scheme)
 *   - Listens dynamically for OS color-scheme changes when in system mode
 *   - Persists selection to localStorage under "theme-mode"
 *   - Coordinates with anti-FOUC script in root layout <head>
 *   - Provides useTheme() hook for ThemeToggle components
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to system
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      const initialMode: ThemeMode =
        stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

      const resolved =
        initialMode === "system" ? getSystemPreference() : initialMode;

      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      queueMicrotask(() => {
        setModeState(initialMode);
        setResolvedTheme(resolved);
        setMounted(true);
      });
    } catch {
      queueMicrotask(() => {
        setMounted(true);
      });
    }
  }, []);

  // Listen for OS theme changes when in 'system' mode
  useEffect(() => {
    if (!mounted || mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      if (newResolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [mode, mounted]);

  // Set mode handler
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore localStorage errors
    }

    const resolved = newMode === "system" ? getSystemPreference() : newMode;
    setResolvedTheme(resolved);

    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
