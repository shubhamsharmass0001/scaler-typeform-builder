"use client";

/**
 * components/dashboard/SuggestionBanner.tsx — AI/Template suggestion card
 */

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";

interface SuggestionBannerProps {
  onCreateForm: () => void;
  isLoading?: boolean;
}

export function SuggestionBanner({
  onCreateForm,
  isLoading = false,
}: SuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-white rounded-xl border border-[#ECECEC] p-4 flex items-start justify-between gap-4 shadow-2xs mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm text-[#262627] font-medium leading-normal mb-2.5">
            Capture attendee opinions and suggestions to enhance upcoming events and programs.
          </p>
          <button
            type="button"
            onClick={onCreateForm}
            disabled={isLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D4D4D4] bg-white text-[#262627] hover:bg-[#F5F5F5] transition-colors cursor-pointer disabled:opacity-50"
          >
            Create form
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md text-[#A3A3A3] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss suggestion"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
