"use client";

import React from "react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function ShortTextPreview({ question }: RendererProps) {
  const placeholder = question.properties.placeholder || "Type your answer here...";
  const maxLength = question.properties.maxLength;

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="relative border-b-2 border-strong hover:border-focus transition-colors pb-2">
        <input
          type="text"
          disabled
          placeholder={placeholder}
          className="w-full bg-transparent text-lg sm:text-xl text-primary placeholder:text-placeholder cursor-not-allowed focus:outline-none"
        />
      </div>
      {maxLength && (
        <div className="text-micro text-muted text-right font-mono">
          Max {maxLength} characters
        </div>
      )}
    </div>
  );
}
