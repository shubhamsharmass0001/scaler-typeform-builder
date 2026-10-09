"use client";

import React, { useEffect, useRef } from "react";

interface LongTextInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  accentColor?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function LongTextInput({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Type your answer here...",
  accentColor,
  disabled = false,
  autoFocus = true,
}: LongTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 360);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Enter inserts normal newline, Shift+Enter inserts newline, OK button advances
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If Cmd/Ctrl + Enter is pressed, user can optionally submit
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full space-y-2.5">
      <textarea
        ref={textareaRef}
        rows={3}
        data-testid="runner-longtext-input"
        disabled={disabled}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-0 border-b border-current/25 pb-2 text-xl sm:text-2xl md:text-3xl font-light focus:outline-none placeholder:opacity-85 placeholder:text-placeholder transition-all duration-200 focus:border-b-2 resize-none leading-relaxed"
        style={{
          borderBottomColor: isFocused ? (accentColor || "var(--theme-answer, currentColor)") : undefined,
        }}
      />
      <p className="text-xs opacity-80 font-medium hidden sm:block">
        Shift ⇧ + Enter ↵ to make a line break
      </p>
    </div>
  );
}
