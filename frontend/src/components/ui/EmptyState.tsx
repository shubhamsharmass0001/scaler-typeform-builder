"use client";

/**
 * components/ui/EmptyState.tsx — Empty search/content display with call-to-action
 */

import React from "react";
import { FileQuestion, Plus } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  isLoading = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card rounded-2xl border border-dashed border-default max-w-xl mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center text-secondary mb-4 shadow-xs">
        <FileQuestion className="w-7 h-7" />
      </div>

      <h3 className="text-base font-semibold text-primary mb-1.5">{title}</h3>
      <p className="text-sm text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          isLoading={isLoading}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
