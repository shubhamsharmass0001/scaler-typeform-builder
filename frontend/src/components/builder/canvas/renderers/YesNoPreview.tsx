"use client";

import React from "react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function YesNoPreview({ question: _question }: RendererProps) {
  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Yes Button */}
        <div className="flex-1 p-3.5 rounded-xl border border-default bg-surface hover:border-focus hover:shadow-xs flex items-center justify-between text-sm font-semibold text-primary cursor-pointer transition-all shadow-2xs">
          <span>Yes</span>
          <span className="w-5 h-5 rounded-md bg-muted border border-default text-micro font-mono text-secondary flex items-center justify-center font-bold">
            Y
          </span>
        </div>

        {/* No Button */}
        <div className="flex-1 p-3.5 rounded-xl border border-default bg-surface hover:border-focus hover:shadow-xs flex items-center justify-between text-sm font-semibold text-primary cursor-pointer transition-all shadow-2xs">
          <span>No</span>
          <span className="w-5 h-5 rounded-md bg-muted border border-default text-micro font-mono text-secondary flex items-center justify-center font-bold">
            N
          </span>
        </div>
      </div>
      <div className="text-micro text-muted">
        Respondents can click or press Y / N on keyboard to answer instantly
      </div>
    </div>
  );
}
