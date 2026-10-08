"use client";

/**
 * components/dashboard/TopNav.tsx — Top Navigation Bar matching Typeform workspace
 */

import React from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutGrid,
  Palette,
  HelpCircle,
  Menu,
} from "lucide-react";

interface TopNavProps {
  onToggleMobileSidebar?: () => void;
  username?: string;
}

export function TopNav({
  onToggleMobileSidebar,
  username = "shubhamsharmass0001",
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#ECECEC] px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Logo mark, user account switcher */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#5E5E60] hover:text-[#262627] hover:bg-[#F5F5F5] cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand visual pill mark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-2.5 h-6 rounded-full bg-[#191919]" />
          
          {/* Org / Account Avatar & Selector */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
            <div className="w-6 h-6 rounded-md bg-[#C2410C] text-white font-semibold text-xs flex items-center justify-center">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-xs sm:text-sm text-[#262627] tracking-tight">
              {username}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
          </div>
        </Link>
      </div>

      {/* Right side: Integrations, Brand kit, Help, User Avatar */}
      <div className="flex items-center gap-1 sm:gap-2">
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs font-medium text-[#5E5E60] hover:text-[#262627] py-1.5 px-2.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
        >
          <LayoutGrid className="w-4 h-4 text-[#737373]" />
          <span>Integrations</span>
        </a>

        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 text-xs font-medium text-[#5E5E60] hover:text-[#262627] py-1.5 px-2.5 rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer"
        >
          <Palette className="w-4 h-4 text-[#737373]" />
          <span>Brand kit</span>
        </button>

        <button
          type="button"
          className="p-1.5 rounded-full text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          title="Help & Support"
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </button>

        {/* Profile Circle Avatar with 'SS' */}
        <div className="ml-1 flex items-center justify-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EBD8BE] text-[#422006] font-semibold text-xs flex items-center justify-center border border-[#DECAAE] shadow-2xs select-none">
            SS
          </div>
        </div>
      </div>
    </header>
  );
}
