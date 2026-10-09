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

  const responseLimit = 10;
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
          "fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-60 lg:w-64 bg-surface border-r border-default flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto select-none",
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-2 md:hidden border-b border-default">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Workspaces
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-muted hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary + Create form button (Screenshot 1) */}
          <button
            type="button"
            onClick={onCreateForm}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-btn-primary hover:bg-btn-primary-hover text-btn-primary font-medium text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "Creating..." : "Create form"}</span>
          </button>

          {/* Search box inside sidebar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search"
              className="w-full bg-muted hover:bg-surface-hover focus:bg-surface text-xs sm:text-sm text-primary placeholder:text-muted pl-9 pr-3 py-2 rounded-lg border border-transparent focus:border-default focus:outline-none transition-colors"
            />
          </div>

          {/* Workspaces Section (Screenshot 1: Four-squares icon + Workspaces + Plus) */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-muted shrink-0" />
                <span className="text-xs font-semibold text-muted tracking-wide">
                  Workspaces
                </span>
              </div>
              <button
                type="button"
                className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                title="Create new workspace"
                onClick={() => alert("Multi-workspace support is in development")}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Collapsible Private Category */}
            <div>
              <button
                type="button"
                onClick={() => setIsPrivateOpen(!isPrivateOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-muted hover:text-primary rounded-md transition-colors cursor-pointer"
              >
                <span>Private</span>
                {isPrivateOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isPrivateOpen && (
                <div className="mt-1 space-y-0.5">
                  {/* Active "My workspace" Item */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted text-primary font-medium text-xs sm:text-sm transition-colors text-left cursor-pointer"
                  >
                    <span className="truncate">My workspace</span>
                    <span className="text-xs text-muted ml-2 shrink-0">
                      {totalForms}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: Responses meter & Ask AI Box */}
        <div className="pt-4 border-t border-default space-y-4">
          {/* Responses Collected Meter */}
          <div className="px-1 text-xs">
            <p className="text-secondary font-medium mb-1.5">
              Responses collected
            </p>
            <p className="text-xs text-primary font-semibold mb-2">
              {totalResponses} / {responseLimit}
            </p>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Response upgrade tiers coming soon")}
              className="text-micro font-medium text-muted hover:text-primary underline transition-colors cursor-pointer"
            >
              Increase response limit
            </button>
          </div>

          {/* Ask Typeform AI input pill */}
          <div className="relative rounded-xl border border-default bg-surface p-1.5 shadow-card hover:border-purple-400 transition-colors">
            <div className="flex items-center gap-2 px-1.5">
              <button
                type="button"
                className="text-purple-600 hover:text-purple-700 p-0.5 rounded cursor-pointer shrink-0"
                title="Voice input"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
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
                className="w-full text-xs text-primary placeholder:text-muted bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (aiPrompt.trim()) {
                    onCreateForm?.();
                    setAiPrompt("");
                  }
                }}
                className="w-5 h-5 rounded-md border border-default text-muted hover:text-primary flex items-center justify-center shrink-0 cursor-pointer"
                title="Submit prompt"
              >
                <Send className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
