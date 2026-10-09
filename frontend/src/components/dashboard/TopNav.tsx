"use client";

/**
 * components/dashboard/TopNav.tsx — Top Navigation Bar matching Typeform workspace
 */

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutGrid,
  Briefcase,
  HelpCircle,
  Menu,
  Settings,
  Users,
  CreditCard,
  Code,
  Check,
} from "lucide-react";
import { BASE_URL } from "@/lib/api";

interface TopNavProps {
  onToggleMobileSidebar?: () => void;
  username?: string;
  userEmail?: string;
}

export function TopNav({
  onToggleMobileSidebar,
  username = "Shubham",
  userEmail = "sshubham3_be23@thapar.edu",
}: TopNavProps) {
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        orgMenuRef.current &&
        !orgMenuRef.current.contains(event.target as Node)
      ) {
        setIsOrgMenuOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface border-b border-default px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left side: Logo mark, user account switcher */}
      <div className="flex items-center gap-2.5">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand visual black pill mark matching Typeform */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-2.5 h-6 rounded-full bg-primary" />
        </Link>

        {/* Org / Account Avatar & Selector (Screenshot 1 & 2) */}
        <div ref={orgMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer select-none"
          >
            {/* Orange/brown squircle avatar with 'S' */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-600 to-amber-800 text-white font-semibold text-xs flex items-center justify-center shadow-2xs">
              S
            </div>
            <span className="font-medium text-xs sm:text-sm text-primary tracking-tight">
              {username}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted transition-transform duration-150 ${isOrgMenuOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Organization Switcher Dropdown (Screenshot 2) */}
          {isOrgMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-card shadow-dropdown border border-default p-2 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                Organization
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsOrgMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-secondary" />
                  <span>Admin settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrgMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                >
                  <Users className="w-4 h-4 text-secondary" />
                  <span>Org members</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrgMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-secondary" />
                  <span>Plan & billing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrgMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                >
                  <Code className="w-4 h-4 text-secondary" />
                  <span>Developer apps</span>
                </button>
              </div>

              <div className="my-1.5 border-t border-default" />

              <div className="px-2.5 py-1 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                All organizations
              </div>

              {/* Current Org Card */}
              <div className="mt-1 p-2 rounded-xl bg-surface border border-default flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#b86a34] text-white font-medium text-xs flex items-center justify-center shrink-0">
                    S
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[13px] text-primary truncate max-w-[105px]">
                        {username}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-secondary font-medium border border-default">
                        Owner
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary truncate font-medium">
                      Free Plan &bull; 1 member
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Integrations, Brand kit, View plans, Help, Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <a
          href={`${BASE_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary py-1.5 px-2.5 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <LayoutGrid className="w-4 h-4 text-muted" />
          <span>Integrations</span>
        </a>

        <button
          type="button"
          onClick={() => alert("Brand kit settings")}
          className="hidden md:flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary py-1.5 px-2.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <Briefcase className="w-4 h-4 text-muted" />
          <span>Brand kit</span>
        </button>

        {/* "View plans" solid dark teal button matching Screenshot 2 */}
        <button
          type="button"
          onClick={() => alert("Free tier: 10 responses/month")}
          className="bg-brand-plan hover:bg-brand-plan-hover text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          View plans
        </button>

        <button
          type="button"
          className="p-1.5 rounded-full text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          title="Help & Support"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile Circle Avatar with 'S' and dropdown card */}
        <div ref={profileMenuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-avatar text-avatar font-semibold text-xs flex items-center justify-center border border-default shadow-2xs select-none hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title={`Signed in as ${username} (${userEmail})`}
            aria-label="User account menu"
          >
            S
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-card shadow-dropdown border border-default p-3 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Card Header matching screenshot */}
              <div className="flex items-center gap-3 pb-3 border-b border-default">
                <div className="w-9 h-9 rounded-full bg-avatar text-avatar font-bold text-xs flex items-center justify-center border border-default shrink-0 select-none">
                  S
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-[13px] text-primary truncate">
                    Shubham
                  </div>
                  <div className="text-[11px] text-secondary truncate font-medium">
                    sshubham3_be23@thapar.edu
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="pt-2 space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-secondary" />
                  <span>Account settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-secondary" />
                  <span>Billing & plans</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
