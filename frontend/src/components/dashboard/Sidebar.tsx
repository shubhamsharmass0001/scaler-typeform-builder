"use client";

/**
 * components/dashboard/Sidebar.tsx — Workspace sidebar navigation
 */

import React from "react";
import { Folder, LayoutTemplate, Blocks, X, ShieldCheck } from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  totalForms?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  totalForms = 0,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
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
          "fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-[#E5E5E5] flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0",
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div>
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between pb-3 mb-2 md:hidden border-b border-[#F5F5F5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Navigation
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-[#737373] hover:text-[#262627]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4 px-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[#A3A3A3]">
              Workspaces
            </p>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F5F5] text-[#262627] font-medium text-sm transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-[#262627]" />
                <span>My workspace</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#525252] border border-[#E5E5E5]">
                {totalForms}
              </span>
            </button>

            <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#737373] hover:bg-[#FAFAFA] text-sm transition-colors opacity-75">
              <div className="flex items-center gap-2.5">
                <LayoutTemplate className="w-4 h-4 text-[#A3A3A3]" />
                <span>Templates</span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-500">
                Soon
              </span>
            </div>

            <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#737373] hover:bg-[#FAFAFA] text-sm transition-colors opacity-75">
              <div className="flex items-center gap-2.5">
                <Blocks className="w-4 h-4 text-[#A3A3A3]" />
                <span>Integrations</span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-500">
                Soon
              </span>
            </div>
          </nav>
        </div>

        {/* Footer info card */}
        <div className="pt-4 border-t border-[#F0F0F0] px-2">
          <div className="bg-[#FAF9F7] rounded-xl p-3 border border-[#EBEBEB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#262627] mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full-Stack Assignment</span>
            </div>
            <p className="text-[11px] text-[#737373] leading-relaxed">
              FastAPI + Next.js 14 + SQLite with foreign key enforcement and real-time response analytics.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
