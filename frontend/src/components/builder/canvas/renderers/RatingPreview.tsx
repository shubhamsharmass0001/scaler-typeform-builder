"use client";

import React, { useState } from "react";
import { Star, Heart, ThumbsUp } from "lucide-react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function RatingPreview({ question }: RendererProps) {
  const steps = question.properties.steps || 5;
  const shape = question.properties.shape || "star";
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const renderIcon = (idx: number, isHovered: boolean) => {
    switch (shape) {
      case "heart":
        return (
          <Heart
            className={`w-5 h-5 transition-transform ${
              isHovered
                ? "fill-red-500 text-red-500 scale-110"
                : "text-[#D4D4D4]"
            }`}
          />
        );
      case "thumbs":
      case "thumb":
        return (
          <ThumbsUp
            className={`w-5 h-5 transition-transform ${
              isHovered
                ? "fill-blue-500 text-blue-500 scale-110"
                : "text-[#D4D4D4]"
            }`}
          />
        );
      case "number":
        return (
          <span
            className={`text-sm font-bold font-mono transition-colors ${
              isHovered ? "text-amber-600" : "text-[#737373]"
            }`}
          >
            {idx + 1}
          </span>
        );
      case "star":
      default:
        return (
          <Star
            className={`w-5 h-5 transition-transform ${
              isHovered
                ? "fill-amber-400 text-amber-400 scale-110"
                : "text-[#D4D4D4]"
            }`}
          />
        );
    }
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: steps }).map((_, idx) => {
          const isHighlighted = hoveredIdx !== null && idx <= hoveredIdx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                isHighlighted
                  ? "bg-amber-50/50 border-amber-300"
                  : "bg-white border-[#E5E5E5] hover:border-[#262627]"
              }`}
            >
              {renderIcon(idx, isHighlighted)}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#8C8C8C]">
        <span>1 = Low</span>
        <span>{steps} = High</span>
      </div>
    </div>
  );
}
