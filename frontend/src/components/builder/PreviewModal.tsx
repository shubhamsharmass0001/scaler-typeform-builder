"use client";

/**
 * components/builder/PreviewModal.tsx — Live Preview Overlay
 *
 * Implements:
 *   - Full-screen modal overlay with desktop / mobile device toggle
 *   - Interactive Light Background selector (matching Image 1 Typeform signature & pastels)
 *   - Floating quick-switcher bar for fast live theme auditioning
 *   - Close button
 *   - Mobile phone device frame with speaker notch and rounded border
 *   - Embeds <FormRunner mode="preview" /> for read-only respondent simulation
 */

import React, { useState, useRef, useEffect } from "react";
import { X, Monitor, Smartphone, Sparkles, Check, ChevronDown } from "lucide-react";
import { Form, Question, FormTheme } from "@/types";
import { FormRunner } from "@/components/runner/FormRunner";
import { BUILTIN_LIGHT_BACKGROUNDS, LightBackgroundPreset, normalizeTheme } from "@/lib/themes";
import { useBuilderStore } from "./BuilderContext";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form | null;
  questions: Question[];
  onUpdateTheme?: (theme: Partial<FormTheme>) => void;
}

export function PreviewModal({ isOpen, onClose, form, questions, onUpdateTheme }: PreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isBgMenuOpen, setIsBgMenuOpen] = useState(false);
  const bgMenuRef = useRef<HTMLDivElement>(null);

  // Hook into builder store if available to persist theme changes
  const { updateFormMeta } = useBuilderStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isBgMenuOpen) {
          setIsBgMenuOpen(false);
        } else {
          onClose();
        }
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isBgMenuOpen]);

  // Click outside to close background menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bgMenuRef.current && !bgMenuRef.current.contains(e.target as Node)) {
        setIsBgMenuOpen(false);
      }
    }
    if (isBgMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBgMenuOpen]);

  if (!isOpen) return null;

  const currentTheme = form?.theme;

  const handleSelectBackground = (bg: LightBackgroundPreset) => {
    const updatedTheme: FormTheme = normalizeTheme({
      ...(currentTheme || {}),
      backgroundImageUrl: bg.dataUrl,
      backgroundColor: bg.backgroundColor,
      questionColor: bg.textColor,
      answerColor: bg.answerColor,
      buttonColor: bg.buttonColor,
      buttonTextColor: bg.buttonTextColor,
      preset: "custom",
    });

    if (onUpdateTheme) {
      onUpdateTheme(updatedTheme);
    } else if (updateFormMeta) {
      updateFormMeta({ theme: updatedTheme });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Form Preview"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
      data-testid="preview-overlay"
    >
      {/* Top Header Controls Bar */}
      <header className="h-14 bg-surface/95 border-b border-default px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs relative z-40">
        {/* Left: Title + Mode */}
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-xs text-primary truncate max-w-[200px]">
            {form?.title || "Form Preview"}
          </span>
          <span className="text-nano font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Preview
          </span>
        </div>

        {/* Center: Device Toggle & Light Background Options */}
        <div className="flex items-center gap-3">
          {/* Device Toggle (Desktop / Mobile) */}
          <div className="flex items-center bg-muted p-1 rounded-xl border border-default">
            <button
              type="button"
              data-testid="preview-device-desktop"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                device === "desktop"
                  ? "bg-surface text-primary shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              data-testid="preview-device-mobile"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                device === "mobile"
                  ? "bg-surface text-primary shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Light Background Switcher Dropdown */}
          <div className="relative" ref={bgMenuRef}>
            <button
              type="button"
              onClick={() => setIsBgMenuOpen(!isBgMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-default hover:border-focus bg-surface text-primary shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Background</span>
              <ChevronDown className={`w-3 h-3 text-secondary transition-transform ${isBgMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isBgMenuOpen && (
              <div className="absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 w-72 bg-card rounded-2xl border border-default shadow-dropdown p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-default mb-1.5 flex items-center justify-between">
                  <span className="text-micro font-bold text-primary">Light Color Backgrounds</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                    Typeform Style
                  </span>
                </div>

                <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                  {BUILTIN_LIGHT_BACKGROUNDS.map((bg) => {
                    const isSelected =
                      (bg.dataUrl && form?.theme?.backgroundImageUrl === bg.dataUrl) ||
                      (!bg.dataUrl && !form?.theme?.backgroundImageUrl && form?.theme?.backgroundColor?.toLowerCase() === bg.backgroundColor.toLowerCase());

                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => {
                          handleSelectBackground(bg);
                          setIsBgMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/10 text-primary font-bold border border-blue-500/30"
                            : "hover:bg-surface-hover text-secondary hover:text-primary"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Mini visual swatch */}
                          <div
                            style={{
                              background: bg.dataUrl ? `url("${bg.dataUrl}") center/cover no-repeat` : bg.css,
                            }}
                            className="w-7 h-7 rounded-lg border border-black/10 shrink-0 shadow-2xs"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-primary">{bg.name}</span>
                              {bg.isSignature && (
                                <span className="text-[9px] bg-blue-600 text-white font-bold px-1 rounded">
                                  Image 1
                                </span>
                              )}
                            </div>
                            <span className="text-nano text-secondary block truncate max-w-[170px]">
                              {bg.desc}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Close button */}
        <button
          type="button"
          data-testid="preview-close-btn"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-default hover:border-focus hover:bg-surface-hover text-xs font-semibold text-primary transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      {/* Main Viewport Container */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-3 sm:p-5 relative">
        {device === "mobile" ? (
          /* Mobile iPhone Frame Mockup with Responsive Height */
          <div className="w-[360px] sm:w-[375px] max-w-[92vw] h-[min(680px,calc(100vh-130px))] rounded-[44px] border-[10px] border-[#18181b] bg-transparent shadow-2xl relative overflow-hidden flex flex-col shrink-0">
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-[#18181b] z-30 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-[#27272a] mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
            </div>

            {/* Embedded FormRunner with safe-area spacing */}
            <div className="flex-1 w-full h-full overflow-hidden pt-7 pb-1">
              <FormRunner
                mode="preview"
                form={form}
                questions={questions}
                isMobilePreview={true}
              />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="h-4 bg-transparent flex items-center justify-center shrink-0 pointer-events-none">
              <div className="w-28 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>
          </div>
        ) : (
          /* Desktop Browser Frame View */
          <div className="max-w-4xl w-full h-[min(620px,calc(100vh-140px))] rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-700 overflow-hidden flex flex-col bg-transparent">
            <FormRunner
              mode="preview"
              form={form}
              questions={questions}
              isMobilePreview={false}
            />
          </div>
        )}

        {/* Quick Background Switcher Bar at the bottom for instant feedback */}
        <div className="mt-3 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 border border-default shadow-md backdrop-blur-md z-30">
          <span className="text-[11px] font-semibold text-secondary mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Light Background:
          </span>
          {BUILTIN_LIGHT_BACKGROUNDS.slice(0, 5).map((bg) => {
            const isSelected =
              (bg.dataUrl && form?.theme?.backgroundImageUrl === bg.dataUrl) ||
              (!bg.dataUrl && !form?.theme?.backgroundImageUrl && form?.theme?.backgroundColor?.toLowerCase() === bg.backgroundColor.toLowerCase());

            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => handleSelectBackground(bg)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-micro font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-secondary hover:text-primary hover:bg-surface-hover"
                }`}
              >
                <div
                  style={{
                    background: bg.dataUrl ? `url("${bg.dataUrl}") center/cover no-repeat` : bg.css,
                  }}
                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                />
                <span>{bg.name.replace("Geometric ", "").replace(" Curves", "").replace(" Arches", "")}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
