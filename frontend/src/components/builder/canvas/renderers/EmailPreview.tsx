"use client";

import React from "react";
import { Mail } from "lucide-react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function EmailPreview({ question }: RendererProps) {
  const placeholder = question.properties.placeholder || "name@example.com";

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="flex items-center gap-2.5 border-b-2 border-strong hover:border-text-placeholder transition-colors pb-2">
        <Mail className="w-5 h-5 text-placeholder shrink-0" />
        <input
          type="email"
          disabled
          placeholder={placeholder}
          className="w-full bg-transparent text-lg sm:text-xl text-primary placeholder:text-placeholder cursor-not-allowed focus:outline-none"
        />
      </div>
      <div className="text-micro text-muted">
        Validates email address format on submission
      </div>
    </div>
  );
}
