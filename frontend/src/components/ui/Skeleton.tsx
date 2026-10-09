"use client";

/**
 * components/ui/Skeleton.tsx — Animated loading placeholders
 */

import React from "react";
import clsx from "clsx";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-skeleton",
        className
      )}
      {...props}
    />
  );
}

export function FormCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-default p-5 flex flex-col justify-between h-[210px] shadow-card">
      <div>
        {/* Thumbnail preview placeholder */}
        <div className="w-full h-20 rounded-lg bg-muted mb-4 flex items-center justify-center p-3">
          <div className="w-full space-y-1.5 opacity-60">
            <Skeleton className="h-2 w-3/4" />
            <Skeleton className="h-1.5 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-4/5 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-default">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function FormRowSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-default px-4 py-3.5 flex items-center justify-between gap-4 shadow-card">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1 max-w-xs">
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
      <div className="flex items-center gap-8 sm:gap-14 shrink-0">
        <div className="w-16 flex justify-center hidden sm:flex">
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="w-16 flex justify-center hidden sm:flex">
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="w-24 hidden md:block">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="w-8 justify-center hidden lg:flex">
          <Skeleton className="w-4 h-4 rounded" />
        </div>
        <div className="w-8 flex justify-end">
          <Skeleton className="w-4 h-4 rounded" />
        </div>
      </div>
    </div>
  );
}
