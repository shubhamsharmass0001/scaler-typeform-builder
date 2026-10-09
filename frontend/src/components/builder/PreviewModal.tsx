"use client";

/**
 * components/builder/PreviewModal.tsx — Live Preview Overlay
 *
 * Implements:
 *   - Full-screen modal overlay with desktop / mobile device toggle
 *   - Close button
 *   - Mobile phone device frame with speaker notch and rounded border
 *   - Embeds <FormRunner mode="preview" /> for read-only respondent simulation
 */

import React, { useState } from "react";
import { X, Monitor, Smartphone } from "lucide-react";
import { Form, Question } from "@/types";
import { FormRunner } from "@/components/runner/FormRunner";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form | null;
  questions: Question[];
}

export function PreviewModal({ isOpen, onClose, form, questions }: PreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Form Preview"
      className="fixed inset-0 z-50 bg-backdrop backdrop-blur-md flex flex-col animate-in fade-in duration-200"
      data-testid="preview-overlay"
    >
      {/* Top Header Controls Bar */}
      <header className="h-14 bg-surface/95 border-b border-default px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        {/* Left: Title + Mode */}
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-xs text-primary">
            {form?.title || "Form Preview"}
          </span>
          <span className="text-nano font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Preview
          </span>
        </div>

        {/* Center: Device Toggle (Desktop / Mobile) */}
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
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
        {device === "mobile" ? (
          /* Mobile iPhone Frame Mockup */
          <div className="w-[375px] h-[720px] rounded-[48px] border-[10px] border-primary bg-white shadow-2xl relative overflow-hidden flex flex-col shrink-0">
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-primary z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-secondary mr-2" />
            </div>

            {/* Embedded FormRunner */}
            <div className="flex-1 w-full h-full overflow-hidden pt-5">
              <FormRunner mode="preview" form={form} questions={questions} />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="h-4 bg-transparent flex items-center justify-center shrink-0">
              <div className="w-32 h-1 rounded-full bg-neutral-300" />
            </div>
          </div>
        ) : (
          /* Desktop Browser Frame View */
          <div className="max-w-4xl w-full h-[82vh] rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
            <FormRunner mode="preview" form={form} questions={questions} />
          </div>
        )}
      </div>
    </div>
  );
}
