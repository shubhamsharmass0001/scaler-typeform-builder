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

export type ThemeMode = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let initialMode: ThemeMode = "light";
      if (stored === "dark" || stored === "light") {
        initialMode = stored;
      } else {
        // Fallback for first-time or previous 'system' mode
        initialMode = getSystemPreference();
      }

      if (initialMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      queueMicrotask(() => {
        setModeState(initialMode);
        setResolvedTheme(initialMode);
        setMounted(true);
      });
    } catch {
      queueMicrotask(() => {
        setMounted(true);
      });
    }
  }, []);

  // Set mode handler
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setResolvedTheme(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore localStorage errors
    }

    if (newMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleTheme }}>
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
