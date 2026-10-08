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
  Sparkles,
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
    <div className="bg-white border-b border-[#ECECEC] px-4 sm:px-6 flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-hide text-xs sm:text-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            type="button"
            className={clsx(
              "relative flex items-center gap-2 py-3 px-2 sm:px-3 font-medium whitespace-nowrap transition-colors cursor-pointer select-none",
              tab.active
                ? "text-[#191919]"
                : "text-[#5E5E60] hover:text-[#191919]"
            )}
          >
            <Icon className="w-4 h-4 shrink-0 text-current" />
            <span>{tab.label}</span>

            {tab.hasGem && (
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
            )}

            {tab.badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-sm bg-blue-50 text-blue-600 border border-blue-100">
                {tab.badge}
              </span>
            )}

            {/* Active underline indicator */}
            {tab.active && (
              <span className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-0.5 bg-[#191919] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
