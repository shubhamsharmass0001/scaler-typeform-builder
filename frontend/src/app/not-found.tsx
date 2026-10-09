import React from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center select-none text-primary">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 sm:p-10 border border-default shadow-card space-y-6 flex flex-col items-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-default text-secondary flex items-center justify-center">
          <FileQuestion className="w-8 h-8 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted bg-muted px-2.5 py-1 rounded-full border border-default">
            404 Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved to a new URL.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
