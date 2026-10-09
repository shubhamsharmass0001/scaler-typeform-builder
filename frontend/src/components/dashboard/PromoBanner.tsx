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
    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 transition-all mb-6">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="p-1 rounded-full bg-white/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span>
          You can collect <strong className="font-semibold text-emerald-950 dark:text-emerald-100">10 form responses</strong> this month for free.
        </span>
        <button
          type="button"
          onClick={() => alert("Free tier plan: 10 responses/month")}
          className="ml-1 sm:ml-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-emerald-950 font-medium text-xs px-3 py-1 rounded-md transition-colors cursor-pointer"
        >
          Get more responses
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
