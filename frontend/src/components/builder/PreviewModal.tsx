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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#191919]/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
      data-testid="preview-overlay"
    >
      {/* Top Header Controls Bar */}
      <header className="h-14 bg-white/95 border-b border-[#ECECEC] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        {/* Left: Title + Mode */}
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-xs text-[#262627]">
            {form?.title || "Form Preview"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Preview
          </span>
        </div>

        {/* Center: Device Toggle (Desktop / Mobile) */}
        <div className="flex items-center bg-[#F5F5F5] p-1 rounded-xl border border-[#E5E5E5]">
          <button
            type="button"
            data-testid="preview-device-desktop"
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              device === "desktop"
                ? "bg-white text-[#262627] shadow-2xs"
                : "text-[#737373] hover:text-[#262627]"
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
                ? "bg-white text-[#262627] shadow-2xs"
                : "text-[#737373] hover:text-[#262627]"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5E5] hover:border-[#262627] hover:bg-neutral-100 text-xs font-semibold text-[#262627] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      {/* Main Viewport Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
        {device === "mobile" ? (
          /* Mobile iPhone Frame Mockup */
          <div className="w-[375px] h-[720px] rounded-[48px] border-[10px] border-[#191919] bg-white shadow-2xl relative overflow-hidden flex flex-col shrink-0">
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-[#191919] z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#262627] mr-2" />
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
