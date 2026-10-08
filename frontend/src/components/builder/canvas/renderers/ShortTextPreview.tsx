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
      <div className="relative border-b-2 border-[#D4D4D4] hover:border-[#A3A3A3] transition-colors pb-2">
        <input
          type="text"
          disabled
          placeholder={placeholder}
          className="w-full bg-transparent text-lg sm:text-xl text-[#262627] placeholder:text-[#A3A3A3] cursor-not-allowed focus:outline-none"
        />
      </div>
      {maxLength && (
        <div className="text-[11px] text-[#8C8C8C] text-right font-mono">
          Max {maxLength} characters
        </div>
      )}
    </div>
  );
}
