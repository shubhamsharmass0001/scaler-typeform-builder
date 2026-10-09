"use client";

import React, { useEffect, useRef } from "react";

interface TextInputProps {
  type?: "text" | "email" | "number";
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  onSubmit: () => void;
  placeholder?: string;
  accentColor?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TextInput({
  type = "text",
  value = "",
  onChange,
  onSubmit,
  placeholder = "Type your answer here...",
  accentColor,
  disabled = false,
  autoFocus = true,
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  useEffect(() => {
    if (autoFocus && !disabled) {
      // Focus after transition completes to prevent scroll jump during animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 360);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full relative group">
      <input
        ref={inputRef}
        type={type}
        data-testid={type === "email" ? "runner-email-input" : type === "number" ? "runner-number-input" : "runner-text-input"}
        disabled={disabled}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          if (type === "number") {
            const val = e.target.value;
            onChange(val === "" ? "" : Number(val));
          } else {
            onChange(e.target.value);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-0 border-b border-current/25 pb-2 text-2xl sm:text-3xl md:text-4xl font-light focus:outline-none placeholder:opacity-35 placeholder:font-light transition-all duration-200 focus:border-b-2"
        style={{
          borderBottomColor: isFocused ? (accentColor || "var(--theme-answer, currentColor)") : undefined,
        }}
      />
    </div>
  );
}
