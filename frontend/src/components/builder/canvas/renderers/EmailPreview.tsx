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
      <div className="flex items-center gap-2.5 border-b-2 border-[#D4D4D4] hover:border-[#A3A3A3] transition-colors pb-2">
        <Mail className="w-5 h-5 text-[#A3A3A3] shrink-0" />
        <input
          type="email"
          disabled
          placeholder={placeholder}
          className="w-full bg-transparent text-lg sm:text-xl text-[#262627] placeholder:text-[#A3A3A3] cursor-not-allowed focus:outline-none"
        />
      </div>
      <div className="text-[11px] text-[#8C8C8C]">
        Validates email address format on submission
      </div>
    </div>
  );
}
