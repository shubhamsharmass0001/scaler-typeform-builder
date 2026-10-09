"use client";

import React, { useEffect, useState, useRef } from "react";
import { Check } from "lucide-react";
import { QuestionOption } from "@/types";
import { RUNNER_ANIMATION } from "../animationConstants";

interface MultipleChoiceInputProps {
  options?: QuestionOption[];
  isMulti?: boolean;
  allowOther?: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit: () => void;
  accentColor?: string;
}

export function MultipleChoiceInput({
  options = [],
  isMulti = false,
  allowOther = false,
  value,
  onChange,
  onSubmit,
  accentColor,
}: MultipleChoiceInputProps) {
  const [otherText, setOtherText] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // Parse current value
  const selectedList: string[] = Array.isArray(value)
    ? value.map((v) => (typeof v === "object" && v !== null && "id" in v ? String(v.id) : String(v)))
    : typeof value === "string" || typeof value === "number"
    ? [String(value)]
    : [];

  const handleSelect = (optionId: string) => {
    if (isMulti) {
      if (selectedList.includes(optionId)) {
        const next = selectedList.filter((id) => id !== optionId);
        onChange(next);
      } else {
        const next = [...selectedList, optionId];
        onChange(next);
      }
    } else {
      // Single select: highlight immediately, then auto-advance after ~400ms
      onChange(optionId);
      setTimeout(() => {
        onSubmitRef.current();
      }, RUNNER_ANIMATION.singleSelectAutoAdvanceDelay);
    }
  };

  const handleSelectOther = () => {
    setShowOtherInput(true);
    if (!selectedList.includes("other")) {
      if (isMulti) {
        onChange([...selectedList, otherText || "other"]);
      } else {
        onChange(otherText || "other");
      }
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (isMulti) {
      const filtered = selectedList.filter((id) => id !== "other" && id !== otherText);
      onChange([...filtered, text]);
    } else {
      onChange(text);
    }
  };

  // Keyboard shortcut listener for A, B, C...
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
      if (key.length === 1 && key >= "A" && key <= "Z") {
        const charCode = key.charCodeAt(0) - 65; // A -> 0, B -> 1
        if (charCode >= 0 && charCode < options.length) {
          e.preventDefault();
          const targetOpt = options[charCode];
          handleSelect(targetOpt.id || targetOpt.label);
        } else if (allowOther && charCode === options.length) {
          e.preventDefault();
          handleSelectOther();
        }
      } else {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= options.length) {
          e.preventDefault();
          const targetOpt = options[num - 1];
          handleSelect(targetOpt.id || targetOpt.label);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, allowOther, selectedList, isMulti, handleSelect, handleSelectOther]);

  return (
    <div className="w-full space-y-2.5 max-w-lg">
      {/* Multi-select hint */}
      {isMulti && (
        <p className="text-xs font-medium opacity-60 mb-2">
          Choose as many as you like
        </p>
      )}

      {options.map((opt, index) => {
        const optKey = opt.id || opt.label;
        const letter = String.fromCharCode(65 + index);
        const isSelected = selectedList.includes(optKey) || selectedList.includes(opt.label);

        return (
          <div
            key={opt.id || index}
            data-testid={`runner-choice-opt-${index}`}
            onClick={() => handleSelect(optKey)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect(optKey);
              }
            }}
            className={`group relative flex items-center justify-between min-h-[48px] py-3 px-4 rounded-lg border transition-all duration-150 cursor-pointer select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${
              isSelected
                ? "bg-current/10 border-current font-semibold shadow-xs"
                : "bg-current/5 border-current/20 hover:bg-current/10 hover:border-current/40"
            }`}
            style={
              isSelected && accentColor
                ? { borderColor: accentColor, backgroundColor: `${accentColor}18` }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              {/* Key badge with letter A, B, C */}
              <span
                className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors shrink-0 ${
                  isSelected
                    ? "bg-current/20 border-current"
                    : "bg-current/5 border-current/30 group-hover:border-current/60"
                }`}
                style={
                  isSelected && accentColor
                    ? { borderColor: accentColor, color: accentColor }
                    : undefined
                }
              >
                {letter}
              </span>
              <span className="text-sm sm:text-base leading-snug break-words">{opt.label}</span>
            </div>

            {/* Checkmark indicator */}
            {isSelected && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ color: accentColor || "currentColor" }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </div>
        );
      })}

      {/* Allow Other option */}
      {allowOther && (
        <div className="space-y-2">
          <div
            onClick={handleSelectOther}
            className={`flex items-center justify-between min-h-[48px] py-3 px-4 rounded-lg border border-dashed transition-all cursor-pointer ${
              showOtherInput
                ? "bg-current/10 border-current font-semibold"
                : "bg-current/5 border-current/25 hover:bg-current/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs border bg-current/5 border-current/30 shrink-0">
                {String.fromCharCode(65 + options.length)}
              </span>
              <span className="text-sm sm:text-base italic opacity-80">Other...</span>
            </div>

            {showOtherInput && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ color: accentColor || "currentColor" }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </div>

          {showOtherInput && (
            <input
              type="text"
              autoFocus
              value={otherText}
              onChange={(e) => handleOtherTextChange(e.target.value)}
              placeholder="Please specify..."
              className="w-full bg-transparent border-0 border-b border-current/30 py-1.5 text-base sm:text-lg focus:outline-none focus:border-current transition-colors"
            />
          )}
        </div>
      )}
    </div>
  );
}
