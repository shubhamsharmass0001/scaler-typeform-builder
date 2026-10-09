"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error captured by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center select-none text-primary">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 sm:p-10 border border-default shadow-card space-y-6 flex flex-col items-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            Error Encountered
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            {error?.message || "An unexpected application error occurred. You can retry or return to the dashboard."}
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-default hover:bg-surface-hover text-primary text-xs font-semibold transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-muted" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
