"use client";

import React from "react";
import { Hash } from "lucide-react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function NumberPreview({ question }: RendererProps) {
  const min = question.properties.min;
  const max = question.properties.max;

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="flex items-center gap-2.5 border-b-2 border-strong hover:border-focus transition-colors pb-2">
        <Hash className="w-5 h-5 text-muted shrink-0" />
        <input
          type="text"
          disabled
          placeholder="0"
          className="w-full bg-transparent text-lg sm:text-xl text-primary placeholder:text-placeholder cursor-not-allowed focus:outline-none"
        />
      </div>
      {(min !== undefined || max !== undefined) && (
        <div className="flex items-center gap-3 text-micro text-muted font-mono">
          {min !== undefined && <span>Min: {min}</span>}
          {min !== undefined && max !== undefined && <span>•</span>}
          {max !== undefined && <span>Max: {max}</span>}
        </div>
      )}
    </div>
  );
}
