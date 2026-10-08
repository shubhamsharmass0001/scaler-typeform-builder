"use client";

/**
 * components/dashboard/TopNav.tsx — Top header bar
 */

import React from "react";
import Link from "next/link";
import { Sparkles, Menu } from "lucide-react";

interface TopNavProps {
  onToggleMobileSidebar?: () => void;
}

export function TopNav({ onToggleMobileSidebar }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E5E5E5] px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#262627] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="font-bold text-xs tracking-wider">F</span>
          </div>
          <span className="font-semibold text-base text-[#262627] tracking-tight">
            Formly
          </span>
        </Link>

        <span className="hidden sm:inline-block text-[#D4D4D4] font-light">/</span>
        <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-[#F5F5F5] text-[#525252]">
          Workspace
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Link to API Docs */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#262627] py-1 px-2.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          API Docs
        </a>

        {/* User avatar circle */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#F0F0F0]">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#262627] font-semibold text-xs flex items-center justify-center border border-white shadow-xs">
              DC
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-[#262627] leading-tight">
              Demo Creator
            </p>
            <p className="text-[10px] text-[#737373] leading-tight">
              Free plan
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
