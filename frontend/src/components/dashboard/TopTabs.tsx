"use client";

/**
 * components/dashboard/TopTabs.tsx — Sub-navigation bar below header
 *
 * Matches Typeform's workspace tabs: Forms, Contacts, Automations, Insights, Pages (Beta), Research Flow
 */

import React from "react";
import {
  FileText,
  Users,
  GitFork,
  LineChart,
  Layout,
  Compass,
  Gem,
} from "lucide-react";
import clsx from "clsx";

export function TopTabs() {
  const tabs = [
    { label: "Forms", icon: FileText, active: true },
    { label: "Contacts", icon: Users, active: false },
    { label: "Automations", icon: GitFork, active: false },
    { label: "Insights", icon: LineChart, active: false, hasGem: true },
    { label: "Pages", icon: Layout, active: false, badge: "Beta" },
    { label: "Research Flow", icon: Compass, active: false },
  ];

  return (
    <div className="bg-surface border-b border-default px-4 sm:px-6 h-12 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide text-[13px]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            type="button"
            className={clsx(
              "relative flex items-center gap-2 py-1.5 px-3 rounded-lg font-medium text-[13px] whitespace-nowrap transition-colors cursor-pointer select-none",
              tab.active
                ? "bg-muted text-primary"
                : "text-secondary hover:text-primary hover:bg-surface-hover"
            )}
          >
            <Icon className="w-4 h-4 shrink-0 text-current" />
            <span>{tab.label}</span>

            {tab.hasGem && (
              <Gem className="w-3.5 h-3.5 text-[#008775] shrink-0" strokeWidth={1.75} />
            )}

            {tab.badge && (
              <span className="text-[11px] font-medium leading-none px-1.5 py-0.5 rounded-full bg-[#e6f4fe] dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-300 border border-[#bae6fd] dark:border-sky-800/60">
                {tab.badge}
              </span>
            )}

            {/* Active underline indicator spanning under the tab at bottom border */}
            {tab.active && (
              <span className="absolute -bottom-[9px] left-3 right-3 h-[2px] bg-[#191919] dark:bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
