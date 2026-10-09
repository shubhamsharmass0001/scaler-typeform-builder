"use client";

/**
 * components/ui/ThemeToggle.tsx — Light / Dark Segmented Theme Selector
 *
 * Implements:
 *   - 2-option segmented control: Light (Sun) and Dark (Moon)
 *   - Both options visible side-by-side inside a rounded pill segmented control
 *   - Active option highlighted with rounded pill background, subtle border & contrast text
 *   - Inactive option clearly visible with readable text and icon colors
 *   - System option completely removed from UI and selector logic
 *   - Responsive on desktop and mobile without clipping
 */

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className = "", size = "sm" }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();

  const options: { id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  const btnPadding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode switcher"
      data-testid="theme-toggle-group"
      className={`inline-flex items-center p-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/90 transition-colors select-none shrink-0 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = mode === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${opt.label} mode`}
            data-testid={`theme-toggle-${opt.id}`}
            title={`${opt.label} mode`}
            onClick={() => setMode(opt.id)}
            className={`flex items-center gap-1.5 ${btnPadding} rounded-full text-xs font-medium leading-none whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
              isActive
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold shadow-2xs border border-neutral-300/80 dark:border-neutral-700"
                : "border border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <Icon className={`${iconSize} shrink-0 stroke-[2]`} />
            <span className="text-xs font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
