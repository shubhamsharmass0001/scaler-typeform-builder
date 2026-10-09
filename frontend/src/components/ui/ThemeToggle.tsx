"use client";

/**
 * components/ui/ThemeToggle.tsx — Sun / Moon / Monitor Creator Theme Toggle
 *
 * Implements:
 *   - 3-option segmented control: Light (Sun), Dark (Moon), System (Monitor)
 *   - Visual indicator showing current active mode
 *   - High contrast accessibility (WCAG AA) with ARIA attributes and tooltips
 *   - Usable in Dashboard navigation, Builder top bar, Results, and Share headers
 */

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
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
    { id: "system", label: "System", icon: Monitor },
  ];

  const btnPadding = size === "sm" ? "p-1.5" : "px-2.5 py-1.5";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode switcher"
      data-testid="theme-toggle-group"
      className={`inline-flex items-center p-0.5 rounded-xl border border-default bg-muted/60 transition-colors select-none ${className}`}
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
            className={`flex items-center gap-1.5 ${btnPadding} rounded-lg text-xs font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
              isActive
                ? "bg-surface text-primary shadow-xs font-semibold border border-default/50"
                : "text-muted hover:text-primary hover:bg-surface/50"
            }`}
          >
            <Icon className={iconSize} />
            <span className="sr-only sm:not-sr-only text-micro font-medium hidden sm:inline">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
