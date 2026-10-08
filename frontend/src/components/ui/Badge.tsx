"use client";

/**
 * components/ui/Badge.tsx — Status badge indicator
 */

import React from "react";
import clsx from "clsx";
import { FormStatus } from "@/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: FormStatus;
  variant?: "default" | "success" | "neutral" | "warning";
}

export function Badge({
  status,
  variant,
  className,
  children,
  ...props
}: BadgeProps) {
  // If status is passed, derive styling automatically
  const isPublished = status === "published" || variant === "success";
  const isDraft = status === "draft" || variant === "neutral";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full shrink-0",
        isPublished && "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
        isDraft && "bg-neutral-100 text-neutral-600 border border-neutral-200/60",
        !status && !variant && "bg-neutral-100 text-neutral-700 border border-neutral-200",
        className
      )}
      {...props}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full shrink-0",
          isPublished && "bg-emerald-500",
          isDraft && "bg-neutral-400"
        )}
      />
      {children || (status === "published" ? "Published" : "Draft")}
    </span>
  );
}
