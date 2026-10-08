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
        "animate-pulse rounded-md bg-[#EBEBEB]",
        className
      )}
      {...props}
    />
  );
}

export function FormCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 flex flex-col justify-between h-[210px] shadow-xs">
      <div>
        {/* Thumbnail preview placeholder */}
        <div className="w-full h-20 rounded-lg bg-[#F5F5F5] mb-4 flex items-center justify-center p-3">
          <div className="w-full space-y-1.5 opacity-60">
            <Skeleton className="h-2 w-3/4" />
            <Skeleton className="h-1.5 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-4/5 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#F5F5F5]">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function FormRowSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3.5 flex-1">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1 max-w-md">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <div className="flex items-center gap-8">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}
