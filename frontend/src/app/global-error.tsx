"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global uncaught error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-app text-primary flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-subtle shadow-sm text-center space-y-5">
          <h1 className="text-2xl font-bold text-primary">
            System Error
          </h1>
          <p className="text-sm text-secondary">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold cursor-pointer transition-colors"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
