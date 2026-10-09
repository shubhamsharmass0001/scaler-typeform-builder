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
    <div className="bg-card rounded-xl border border-default p-4 flex items-start justify-between gap-4 shadow-card mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm text-primary font-medium leading-normal mb-2.5">
            Gather immediate feedback on customer experience and service quality to improve satisfaction.
          </p>
          <button
            type="button"
            onClick={onCreateForm}
            disabled={isLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-default bg-surface text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            Create form
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss suggestion"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
