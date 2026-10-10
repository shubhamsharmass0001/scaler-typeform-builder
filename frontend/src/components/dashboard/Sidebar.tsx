"use client";

/**
 * components/dashboard/Sidebar.tsx — Workspace left sidebar matching Typeform exactly
 */

import React, { useState } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Mic,
  ArrowUpRight,
  Send,
  X,
  LayoutGrid,
} from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  totalForms?: number;
  totalResponses?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onCreateForm?: () => void;
  isCreating?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function Sidebar({
  totalForms = 0,
  totalResponses = 0,
  isOpenMobile = false,
  onCloseMobile,
  onCreateForm,
  isCreating = false,
  searchQuery = "",
  onSearchChange,
}: SidebarProps) {
  const [isPrivateOpen, setIsPrivateOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");

  const responseLimit = 1000;
  const progressPercent = Math.min(
    Math.round((totalResponses / responseLimit) * 100),
    100
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          "fixed md:sticky top-[6.5rem] left-0 z-20 h-[calc(100vh-6.5rem)] w-60 lg:w-64 bg-surface border-r border-default flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto select-none",
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-2 md:hidden border-b border-default">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Workspaces
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-secondary hover:text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary + Create form button (Screenshot 4: rich dark aubergine) */}
          <button
            type="button"
            onClick={onCreateForm}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#30283b] dark:bg-[#383046] hover:bg-[#231d2c] dark:hover:bg-[#4a405d] dark:border dark:border-white/10 text-white font-medium text-[13px] tracking-tight transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>{isCreating ? "Creating..." : "Create form"}</span>
          </button>

          {/* Search box with subtle bottom divider line matching Screenshot 4 */}
          <div className="pt-0.5 pb-3 border-b border-default">
            <div className="relative">
              <Search className="w-4 h-4 text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent hover:bg-surface-hover focus:bg-card text-[13px] text-primary placeholder:text-placeholder pl-8 pr-3 py-1.5 rounded-lg border border-transparent focus:border-default focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Workspaces Section (Screenshot 4: 4-square icon, Workspaces label, white bordered + box) */}
          <div className="pt-0.5 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-primary">
                <LayoutGrid className="w-4 h-4 text-secondary shrink-0" />
                <span className="text-[13px] font-medium tracking-tight">
                  Workspaces
                </span>
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-card border border-default flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover shadow-2xs transition-colors cursor-pointer"
                title="Create new workspace"
                onClick={() => alert("Multi-workspace support is in development")}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>

            {/* Collapsible Private Category */}
            <div>
              <button
                type="button"
                onClick={() => setIsPrivateOpen(!isPrivateOpen)}
                className="w-full flex items-center justify-between px-1 py-1 text-[13px] font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span>Private</span>
                <span className="text-[9px] text-secondary">{isPrivateOpen ? "▲" : "▼"}</span>
              </button>

              {isPrivateOpen && (
                <div className="mt-1 space-y-0.5">
                  {/* Active "My workspace" Item with count badge */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted text-primary font-normal text-[13px] transition-colors text-left cursor-pointer"
                  >
                    <span className="truncate">My workspace</span>
                    <span className="text-[13px] text-secondary ml-2 shrink-0 font-medium">
                      {totalForms || 3}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: Responses meter & Ask AI Box */}
        <div className="pt-4 border-t border-default space-y-4">
          {/* Responses Collected Meter (Screenshot 4: label -> bar -> count -> button) */}
          <div className="px-1">
            <p className="text-[13px] font-medium text-primary mb-1.5">
              Responses collected
            </p>
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[13px] text-secondary mb-3">
              <span className="font-semibold text-primary text-[14px]">{(totalResponses || 0).toLocaleString()}</span> / {responseLimit.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={() => alert("Response upgrade tiers coming soon")}
              className="text-[12px] font-normal text-primary bg-card border border-default hover:bg-surface-hover px-2.5 py-1 rounded-md transition-colors shadow-2xs cursor-pointer inline-block"
            >
              Increase response limit
            </button>
          </div>

          {/* Ask Typeform AI input pill with purple double ring & vertical divider */}
          <div className="relative rounded-2xl border border-[#d6cdf5] dark:border-purple-800/60 ring-2 ring-[#efeafc] dark:ring-purple-950/40 bg-card p-2 shadow-2xs hover:border-[#c4b5fd] transition-colors">
            <div className="flex items-center px-0.5">
              <button
                type="button"
                className="text-secondary hover:text-purple-600 p-0.5 rounded cursor-pointer shrink-0"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-default mx-2 shrink-0" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiPrompt.trim()) {
                    onCreateForm?.();
                    setAiPrompt("");
                  }
                }}
                placeholder="Ask Typeform AI"
                className="w-full text-[13px] text-primary placeholder:text-placeholder bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (aiPrompt.trim()) {
                    onCreateForm?.();
                    setAiPrompt("");
                  }
                }}
                className="w-6 h-6 rounded-md border border-default text-secondary hover:text-primary flex items-center justify-center shrink-0 cursor-pointer"
                title="Submit prompt"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
