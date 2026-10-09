"use client";

import React from "react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function LongTextPreview({ question }: RendererProps) {
  const placeholder =
    question.properties.placeholder || "Type your detailed thoughts here...";
  const maxLength = question.properties.maxLength;

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="border-b-2 border-strong hover:border-text-placeholder transition-colors pb-1">
        <textarea
          disabled
          rows={3}
          placeholder={placeholder}
          className="w-full bg-transparent text-base sm:text-lg text-primary placeholder:text-placeholder cursor-not-allowed resize-none focus:outline-none leading-relaxed"
        />
      </div>
      <div className="flex items-center justify-between text-micro text-muted">
        <span className="italic">Shift ⇧ + Enter ↵ to make a line break</span>
        {maxLength && <span className="font-mono">Max {maxLength} characters</span>}
      </div>
    </div>
  );
}
