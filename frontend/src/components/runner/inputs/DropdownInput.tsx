"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { QuestionOption } from "@/types";
import { RUNNER_ANIMATION } from "../animationConstants";

interface DropdownInputProps {
  options?: QuestionOption[];
  value: unknown;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  accentColor?: string;
}

export function DropdownInput({
  options = [],
  value,
  onChange,
  onSubmit,
  placeholder = "Select an option...",
  accentColor,
}: DropdownInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(
    (opt) => (opt.id || opt.label) === value || opt.label === value
  );

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const handleSelect = (optionKey: string) => {
    onChange(optionKey);
    setIsOpen(false);
    setTimeout(() => {
      onSubmitRef.current();
    }, RUNNER_ANIMATION.singleSelectAutoAdvanceDelay);
  };

  // Auto-focus trigger button on transition into question
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerRef.current?.focus();
    }, 360);
    return () => clearTimeout(timer);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation when dropdown is open or closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions.length > 0 && highlightedIndex < filteredOptions.length) {
          const chosen = filteredOptions[highlightedIndex];
          handleSelect(chosen.id || chosen.label);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, highlightedIndex]);

  return (
    <div ref={containerRef} className="w-full max-w-md relative select-none">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        data-testid="runner-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-xl border border-current/20 bg-current/5 hover:bg-current/10 flex items-center justify-between text-left transition-colors cursor-pointer group"
      >
        <span
          className={`text-base sm:text-lg ${
            selectedOption ? "font-medium" : "opacity-40 font-light"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 opacity-60 transition-transform duration-200 group-hover:opacity-100 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-xl border border-default p-2 z-50 text-primary animate-in fade-in zoom-in-95 duration-150">
          {/* Search Field */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl mb-2">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-placeholder"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, i) => {
                const optKey = opt.id || opt.label;
                const isSelected =
                  (selectedOption?.id || selectedOption?.label) === optKey;
                const isHighlighted = i === highlightedIndex;

                return (
                  <div
                    key={opt.id || i}
                    data-testid={`runner-dropdown-opt-${i}`}
                    onClick={() => handleSelect(optKey)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      isHighlighted
                        ? "bg-surface-hover"
                        : "hover:bg-surface-hover"
                    } ${isSelected ? "font-bold text-primary" : "text-secondary"}`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check
                        className="w-4 h-4 text-neutral-900"
                        style={accentColor ? { color: accentColor } : undefined}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
