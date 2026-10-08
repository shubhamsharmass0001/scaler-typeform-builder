"use client";

/**
 * components/dashboard/PromoBanner.tsx — Dismissible response quota banner matching Typeform
 */

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#EBF7F0] border border-[#C5E8D4] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-[#064E3B] transition-all mb-6">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="p-1 rounded-full bg-white/70 text-[#04453B] shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span>
          You can collect <strong className="font-semibold text-[#04453B]">10 form responses</strong> this month for free.
        </span>
        <button
          type="button"
          onClick={() => alert("Free tier plan: 10 responses/month")}
          className="ml-1 sm:ml-2 bg-[#04453B] hover:bg-[#03342C] text-white font-medium text-xs px-3 py-1 rounded-md transition-colors cursor-pointer"
        >
          Get more responses
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md text-[#064E3B] hover:bg-emerald-100/60 transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
