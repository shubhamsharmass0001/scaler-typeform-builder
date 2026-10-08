"use client";

/**
 * components/builder/CanvasPane.tsx — Center interactive question preview canvas
 *
 * Implements:
 *   - Respondent-style view with question number, arrow ("1 →"), and required star
 *   - Auto-growing inline-editable question title (placeholder: "Your question here")
 *   - Inline-editable description (placeholder: "Description (optional)")
 *   - Modular per-type input renderers from registry (0 giant switch statement)
 *   - Framer-motion subtle fade transitions when switching questions
 */

import React, { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { QUESTION_RENDERERS } from "./canvas/renderers";

export function CanvasPane() {
  const { state, updateQuestion, updateFormMeta, selectedQuestion } = useBuilderStore();
  const { form, questions, selectedId } = state;

  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const currentIndex = selectedQuestion
    ? questions.findIndex((q) => String(q.id) === String(selectedQuestion.id))
    : -1;

  // Auto-resize title textarea to fit content height
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = "auto";
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [selectedQuestion?.title, selectedId]);

  // Auto-resize description textarea to fit content height
  useEffect(() => {
    if (descTextareaRef.current) {
      descTextareaRef.current.style.height = "auto";
      descTextareaRef.current.style.height = `${descTextareaRef.current.scrollHeight}px`;
    }
  }, [selectedQuestion?.description, selectedId]);

  // ---------------------------------------------------------------------------
  // 1. Welcome Screen Canvas View
  // ---------------------------------------------------------------------------
  if (selectedId === "welcome") {
    return (
      <main className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="max-w-xl w-full text-center sm:text-left space-y-5"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Sparkles className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={form?.welcome_title || ""}
              onChange={(e) => updateFormMeta({ welcome_title: e.target.value })}
              placeholder="Welcome to our form"
              className="w-full text-2xl sm:text-3xl font-bold text-[#191919] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 transition-colors"
            />

            <textarea
              value={form?.welcome_description || ""}
              onChange={(e) => updateFormMeta({ welcome_description: e.target.value })}
              placeholder="Add a friendly description to greet respondents..."
              rows={2}
              className="w-full text-sm sm:text-base text-[#5E5E60] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 resize-none transition-colors"
            />

            <div className="pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-[#262627] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-xs hover:bg-black transition-all cursor-pointer"
              >
                <span>{form?.welcome_button_text || "Start"}</span>
                <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Thank You Screen Canvas View
  // ---------------------------------------------------------------------------
  if (selectedId === "thank_you") {
    return (
      <main className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key="thank_you"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="max-w-xl w-full text-center sm:text-left space-y-5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={form?.thank_you_title || ""}
              onChange={(e) => updateFormMeta({ thank_you_title: e.target.value })}
              placeholder="Thank you for your response!"
              className="w-full text-2xl sm:text-3xl font-bold text-[#191919] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 transition-colors"
            />

            <textarea
              value={form?.thank_you_message || ""}
              onChange={(e) => updateFormMeta({ thank_you_message: e.target.value })}
              placeholder="Your answers have been recorded. Have a wonderful day!"
              rows={2}
              className="w-full text-sm sm:text-base text-[#5E5E60] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 resize-none transition-colors"
            />
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Question Canvas View
  // ---------------------------------------------------------------------------
  if (!selectedQuestion) {
    return (
      <main className="flex-1 bg-white flex items-center justify-center text-[#737373] text-sm">
        Select or add a question from the left sidebar
      </main>
    );
  }

  const typeDef = QUESTION_TYPES[selectedQuestion.type];
  const Renderer = QUESTION_RENDERERS[selectedQuestion.type];
  const isDescriptionVisible =
    selectedQuestion.properties.showDescription ?? (selectedQuestion.description !== null && selectedQuestion.description !== "");

  return (
    <main className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={String(selectedQuestion.id)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="max-w-xl w-full space-y-6"
        >
          {/* Header: Question Number with Arrow, Type Badge & Required indicator */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C8C8C] mb-2.5">
              <span className="text-sm font-bold text-[#262627]">
                {currentIndex + 1}
              </span>
              <span className="text-[#8C8C8C]">&rarr;</span>
              <span
                className="px-2 py-0.5 rounded-full border text-[11px] font-medium"
                style={{
                  backgroundColor: typeDef?.badgeBg,
                  borderColor: `${typeDef?.color}30`,
                  color: typeDef?.color,
                }}
              >
                {typeDef?.label}
              </span>
              {selectedQuestion.required && (
                <span className="text-red-500 font-bold text-sm" title="Required question">
                  *
                </span>
              )}
            </div>

            {/* Large auto-growing inline-editable Title */}
            <textarea
              ref={titleTextareaRef}
              rows={1}
              value={selectedQuestion.title}
              onChange={(e) => {
                updateQuestion(selectedQuestion.id, { title: e.target.value });
                if (titleTextareaRef.current) {
                  titleTextareaRef.current.style.height = "auto";
                  titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
                }
              }}
              placeholder="Your question here"
              className="w-full text-xl sm:text-2xl font-bold text-[#191919] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 resize-none leading-snug transition-colors"
            />

            {/* Inline-editable Description (controlled by showDescription toggle) */}
            {isDescriptionVisible && (
              <textarea
                ref={descTextareaRef}
                rows={1}
                value={selectedQuestion.description || ""}
                onChange={(e) => {
                  updateQuestion(selectedQuestion.id, { description: e.target.value });
                  if (descTextareaRef.current) {
                    descTextareaRef.current.style.height = "auto";
                    descTextareaRef.current.style.height = `${descTextareaRef.current.scrollHeight}px`;
                  }
                }}
                placeholder="Description (optional)"
                className="w-full text-xs sm:text-sm text-[#737373] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 mt-1 resize-none leading-relaxed transition-colors"
              />
            )}
          </div>

          {/* Per-Type Input Preview Renderer from Registry */}
          <div className="py-2">
            {Renderer ? (
              <Renderer
                question={selectedQuestion}
                onUpdate={(patch) => updateQuestion(selectedQuestion.id, patch)}
              />
            ) : (
              <div className="text-xs text-neutral-400">Preview not available</div>
            )}
          </div>

          {/* OK / Enter action button mockup */}
          <div className="pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#262627] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs hover:bg-black transition-all cursor-default"
            >
              <span>OK</span>
              <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400" />
            </button>
            <span className="ml-3 text-[11px] text-[#A3A3A3] italic">
              press <strong className="font-semibold text-[#737373]">Enter ↵</strong>
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
