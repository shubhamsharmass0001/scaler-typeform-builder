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
          "fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-60 lg:w-64 bg-white border-r border-[#ECECEC] flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto",
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-2 md:hidden border-b border-[#F5F5F5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Workspaces
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-[#737373] hover:text-[#262627]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary + Create form button */}
          <button
            type="button"
            onClick={onCreateForm}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#262627] hover:bg-[#191919] text-white font-medium text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "Creating..." : "Create form"}</span>
          </button>

          {/* Search box inside sidebar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search"
              className="w-full bg-[#FAFAFA] hover:bg-[#F5F5F5] focus:bg-white text-xs sm:text-sm text-[#262627] placeholder:text-[#A3A3A3] pl-9 pr-3 py-2 rounded-lg border border-transparent focus:border-[#262627] focus:outline-none transition-colors"
            />
          </div>

          {/* Workspaces Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-semibold text-[#737373] tracking-wide">
                Workspaces
              </span>
              <button
                type="button"
                className="p-1 rounded-md text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-[#737373] hover:text-[#262627] rounded-md transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F0F0F0] text-[#262627] font-medium text-xs sm:text-sm transition-colors text-left cursor-pointer"
                  >
                    <span className="truncate">My workspace</span>
                    <span className="text-xs text-[#737373] ml-2 shrink-0">
                      {totalForms}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: Responses meter & Ask AI Box */}
        <div className="pt-4 border-t border-[#F0F0F0] space-y-4">
          {/* Responses Collected Meter */}
          <div className="px-1 text-xs">
            <p className="text-[#5E5E60] font-medium mb-1.5">
              Responses collected
            </p>
            <p className="text-xs text-[#262627] font-semibold mb-2">
              {totalResponses} / {responseLimit}
            </p>
            <div className="w-full h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden mb-2">
              <div
                className="h-full bg-[#262627] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Response upgrade tiers coming soon")}
              className="text-[11px] font-medium text-[#737373] hover:text-[#262627] underline transition-colors cursor-pointer"
            >
              Increase response limit
            </button>
          </div>

          {/* Ask Typeform AI input pill */}
          <div className="relative rounded-xl border border-purple-200/80 bg-white p-1.5 shadow-2xs hover:border-purple-300 transition-colors">
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
                className="w-full text-xs text-[#262627] placeholder:text-[#A3A3A3] bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (aiPrompt.trim()) {
                    onCreateForm?.();
                    setAiPrompt("");
                  }
                }}
                className="w-5 h-5 rounded-md border border-neutral-200 text-[#737373] hover:text-[#262627] flex items-center justify-center shrink-0 cursor-pointer"
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
