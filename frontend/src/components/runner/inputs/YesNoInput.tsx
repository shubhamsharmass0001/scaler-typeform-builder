"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";
import { RUNNER_ANIMATION } from "../animationConstants";

interface YesNoInputProps {
  value: unknown;
  onChange: (value: boolean) => void;
  onSubmit: () => void;
  accentColor?: string;
}

export function YesNoInput({
  value,
  onChange,
  onSubmit,
  accentColor,
}: YesNoInputProps) {
  const isYes = value === true || value === "true" || value === "yes" || value === "y" || value === 1;
  const isNo = value === false || value === "false" || value === "no" || value === "n" || value === 0;

  const handleSelect = (val: boolean) => {
    onChange(val);
    setTimeout(() => {
      onSubmit();
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

      const key = e.key.toUpperCase();
      if (key === "Y") {
        e.preventDefault();
        handleSelect(true);
      } else if (key === "N") {
        e.preventDefault();
        handleSelect(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md">
      {/* Yes Button */}
      <button
        type="button"
        data-testid="runner-yes-btn"
        onClick={() => handleSelect(true)}
        className={`group flex items-center justify-between flex-1 py-3.5 px-4 rounded-lg border transition-all duration-150 cursor-pointer select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${
          isYes
            ? "bg-current/10 border-current font-semibold shadow-xs"
            : "bg-current/5 border-current/20 hover:bg-current/10 hover:border-current/40"
        }`}
        style={
          isYes && accentColor
            ? { borderColor: accentColor, backgroundColor: `${accentColor}18` }
            : undefined
        }
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors shrink-0 ${
              isYes
                ? "bg-current/20 border-current"
                : "bg-current/5 border-current/30 group-hover:border-current/60"
            }`}
            style={
              isYes && accentColor
                ? { borderColor: accentColor, color: accentColor }
                : undefined
            }
          >
            Y
          </span>
          <span className="text-base font-medium">Yes</span>
        </div>
        {isYes && <Check className="w-4 h-4 stroke-[3] ml-2" />}
      </button>

      {/* No Button */}
      <button
        type="button"
        data-testid="runner-no-btn"
        onClick={() => handleSelect(false)}
        className={`group flex items-center justify-between flex-1 py-3.5 px-4 rounded-lg border transition-all duration-150 cursor-pointer select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${
          isNo
            ? "bg-current/10 border-current font-semibold shadow-xs"
            : "bg-current/5 border-current/20 hover:bg-current/10 hover:border-current/40"
        }`}
        style={
          isNo && accentColor
            ? { borderColor: accentColor, backgroundColor: `${accentColor}18` }
            : undefined
        }
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors shrink-0 ${
              isNo
                ? "bg-current/20 border-current"
                : "bg-current/5 border-current/30 group-hover:border-current/60"
            }`}
            style={
              isNo && accentColor
                ? { borderColor: accentColor, color: accentColor }
                : undefined
            }
          >
            N
          </span>
          <span className="text-base font-medium">No</span>
        </div>
        {isNo && <Check className="w-4 h-4 stroke-[3] ml-2" />}
      </button>
    </div>
  );
}
