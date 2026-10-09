"use client";

import React, { useState, useEffect, useRef } from "react";
import { Star, Heart, ThumbsUp } from "lucide-react";
import { RUNNER_ANIMATION } from "../animationConstants";

interface RatingInputProps {
  steps?: number;
  shape?: "star" | "number" | "heart" | "thumbs" | "thumb";
  value: unknown;
  onChange: (value: number) => void;
  onSubmit: () => void;
  accentColor?: string;
}

export function RatingInput({
  steps = 5,
  shape = "star",
  value,
  onChange,
  onSubmit,
  accentColor,
}: RatingInputProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const selectedRating = typeof value === "number" ? value : Number(value) || 0;

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const handleSelect = (idx: number) => {
    onChange(idx);
    setTimeout(() => {
      onSubmitRef.current();
    }, RUNNER_ANIMATION.singleSelectAutoAdvanceDelay);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= steps) {
        e.preventDefault();
        handleSelect(num);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps]);

  const renderIcon = (active: boolean) => {
    if (shape === "heart") {
      return (
        <Heart
          className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-150 ${
            active ? "fill-rose-500 text-rose-500 scale-110" : "text-current/30"
          }`}
        />
      );
    }
    if (shape === "thumbs" || shape === "thumb") {
      return (
        <ThumbsUp
          className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-150 ${
            active ? "fill-amber-500 text-amber-500 scale-110" : "text-current/30"
          }`}
        />
      );
    }
    // Default star
    return (
      <Star
        className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-150 ${
          active ? "fill-amber-400 text-amber-400 scale-110" : "text-current/30"
        }`}
      />
    );
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {Array.from({ length: steps }).map((_, i) => {
          const ratingNum = i + 1;
          const isHighlighted =
            hoveredIndex !== null
              ? ratingNum <= hoveredIndex
              : ratingNum <= selectedRating;

          return (
            <button
              key={ratingNum}
              type="button"
              data-testid={`runner-rating-btn-${ratingNum}`}
              onClick={() => handleSelect(ratingNum)}
              onMouseEnter={() => setHoveredIndex(ratingNum)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex flex-col items-center justify-center min-h-[52px] min-w-[52px] sm:min-h-0 sm:min-w-0 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                isHighlighted
                  ? "border-current/50 bg-current/10 shadow-xs"
                  : "border-current/15 bg-current/5 hover:border-current/30 hover:bg-current/10"
              }`}
            >
              {shape === "number" ? (
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg transition-colors ${
                    isHighlighted
                      ? "bg-current text-white"
                      : "text-current"
                  }`}
                  style={
                    isHighlighted && accentColor
                      ? { backgroundColor: accentColor, color: "var(--text-primary-foreground, #ffffff)" }
                      : undefined
                  }
                >
                  {ratingNum}
                </div>
              ) : (
                renderIcon(isHighlighted)
              )}

              <span className="text-nano sm:text-xs font-semibold opacity-60 mt-1">
                {ratingNum}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs opacity-50 font-medium hidden sm:block">
        Press 1 to {steps} on your keyboard to select
      </p>
    </div>
  );
}

