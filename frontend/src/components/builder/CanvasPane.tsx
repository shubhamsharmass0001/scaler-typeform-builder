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
import { CornerDownLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { QUESTION_RENDERERS } from "./canvas/renderers";
import { getThemeStyles, ThemeFontLoader } from "@/lib/themes";
import { WelcomeIllustration } from "@/components/ui/WelcomeIllustration";

export function CanvasPane() {
  const { state, updateQuestion, updateFormMeta, selectedQuestion } = useBuilderStore();
  const { form, questions, selectedId } = state;

  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const welcomeTitleRef = useRef<HTMLInputElement>(null);
  const welcomeDescRef = useRef<HTMLTextAreaElement>(null);
  const thankYouTitleRef = useRef<HTMLInputElement>(null);
  const thankYouDescRef = useRef<HTMLTextAreaElement>(null);

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

  const themeStyles = getThemeStyles(form?.theme);

  const renderContent = () => {
    // ---------------------------------------------------------------------------
    // 1. Welcome Screen Canvas View (Faithful match to Screenshot 1)
    // ---------------------------------------------------------------------------
    if (selectedId === "welcome") {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-2xl text-center space-y-5 relative z-10 mx-auto py-4"
          >
            {/* Typeform Welcome Illustration matching Image 1 */}
            <div className="flex justify-center mb-1 text-current opacity-90">
              <WelcomeIllustration className="w-36 h-24 sm:w-44 sm:h-28" />
            </div>

            <input
              ref={welcomeTitleRef}
              type="text"
              value={form?.welcome_title || ""}
              onChange={(e) => updateFormMeta({ welcome_title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  welcomeDescRef.current?.focus();
                }
              }}
              placeholder="Welcome Your Internship Experience"
              style={{
                fontSize: "var(--theme-title-size, 1.75rem)",
                color: "var(--theme-question, var(--text-primary))",
              }}
              className="w-full text-center font-bold placeholder:text-placeholder bg-transparent border-b border-transparent hover:border-current/20 focus:border-[var(--theme-answer)] focus:outline-none py-1.5 transition-colors"
            />

            <textarea
              ref={welcomeDescRef}
              value={form?.welcome_description || ""}
              onChange={(e) => updateFormMeta({ welcome_description: e.target.value })}
              placeholder="Help us understand your internship experience. This short survey takes about 2 minutes."
              rows={2}
              style={{
                fontSize: "var(--theme-desc-size, 1rem)",
              }}
              className="w-full text-center text-secondary font-medium placeholder:text-placeholder bg-transparent border-b border-transparent hover:border-current/20 focus:border-[var(--theme-answer)] focus:outline-none py-1 resize-none leading-relaxed transition-colors max-w-lg mx-auto"
            />

            <div className="pt-2 flex flex-col items-center justify-center gap-2.5">
              <button
                type="button"
                style={{
                  backgroundColor: "var(--theme-btn-bg, var(--bg-btn-primary))",
                  color: "var(--theme-btn-text, var(--text-btn-primary))",
                  borderRadius: "var(--theme-btn-radius, 8px)",
                }}
                className="inline-flex items-center justify-center px-7 py-2.5 text-sm font-semibold shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{form?.welcome_button_text || "Start"}</span>
              </button>

              <div className="flex items-center gap-1.5 text-micro text-secondary font-medium opacity-85 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Takes 3 minutes</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    // ---------------------------------------------------------------------------
    // 2. Thank You Screen Canvas View (Faithful match to Screenshot 3 & 4)
    // ---------------------------------------------------------------------------
    if (selectedId === "thank_you") {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="thank_you"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-2xl text-center space-y-6 relative z-10 mx-auto py-8"
          >
            <input
              ref={thankYouTitleRef}
              type="text"
              value={form?.thank_you_title || ""}
              onChange={(e) => updateFormMeta({ thank_you_title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  thankYouDescRef.current?.focus();
                }
              }}
              placeholder="Thank you for sharing your feedback!"
              style={{
                fontSize: "var(--theme-title-size, 1.75rem)",
                color: "var(--theme-question, var(--text-primary))",
              }}
              className="w-full text-center font-bold placeholder:text-placeholder bg-transparent border-b border-transparent hover:border-current/20 focus:border-[var(--theme-answer)] focus:outline-none py-1.5 transition-colors"
            />

            <textarea
              ref={thankYouDescRef}
              value={form?.thank_you_message || ""}
              onChange={(e) => updateFormMeta({ thank_you_message: e.target.value })}
              placeholder="Your response has been recorded."
              rows={2}
              style={{
                fontSize: "var(--theme-desc-size, 1rem)",
              }}
              className="w-full text-center text-secondary font-medium placeholder:text-placeholder bg-transparent border-b border-transparent hover:border-current/20 focus:border-[var(--theme-answer)] focus:outline-none py-1 resize-none leading-relaxed transition-colors max-w-lg mx-auto"
            />

            {/* Social Share Icons (Screenshots 3 & 4) */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="w-7 h-7 rounded-md bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs shadow-2xs select-none">
                f
              </span>
              <span className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs shadow-2xs select-none">
                𝕏
              </span>
              <span className="w-7 h-7 rounded-md bg-[#0A66C2] text-white flex items-center justify-center font-bold text-xs shadow-2xs select-none">
                in
              </span>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                style={{
                  backgroundColor: "var(--theme-btn-bg, var(--bg-btn-primary))",
                  color: "var(--theme-btn-text, var(--text-btn-primary))",
                  borderRadius: "var(--theme-btn-radius, 8px)",
                }}
                className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Create a typeform</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    // ---------------------------------------------------------------------------
    // 3. Question Canvas View (Faithful match to Screenshot 2)
    // ---------------------------------------------------------------------------
    if (!selectedQuestion) {
      return (
        <div className="text-sm text-secondary font-medium text-center py-12">
          Select or add a question from the left sidebar
        </div>
      );
    }

    const typeDef = QUESTION_TYPES[selectedQuestion.type];
    const Renderer = QUESTION_RENDERERS[selectedQuestion.type];
    const isDescriptionVisible =
      selectedQuestion.properties.showDescription ?? (selectedQuestion.description !== null && selectedQuestion.description !== "");

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={String(selectedQuestion.id)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full max-w-xl space-y-6 relative z-10 mx-auto"
        >
          {/* Header: Question Number with Arrow, Type Badge & Required indicator */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold mb-2.5">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--theme-answer)" }}
              >
                {currentIndex + 1}
              </span>
              <span style={{ color: "var(--theme-answer)" }}>&rarr;</span>
              <span
                className="px-2 py-0.5 rounded-full border text-micro font-medium"
                style={{
                  backgroundColor: typeDef?.badgeBg,
                  borderColor: `${typeDef?.color}30`,
                  color: typeDef?.color,
                }}
              >
                {typeDef?.label}
              </span>
              {selectedQuestion.required && (
                <span className="text-rose-500 font-bold text-sm" title="Required question">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  descTextareaRef.current?.focus();
                }
              }}
              placeholder="Your question here"
              style={{
                fontSize: "var(--theme-title-size)",
                color: "var(--theme-question)",
              }}
              className="w-full font-bold placeholder:text-placeholder bg-transparent border-b border-transparent hover:border-current/20 focus:border-[var(--theme-answer)] focus:outline-none py-1 resize-none leading-snug transition-colors"
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
                style={{
                  fontSize: "var(--theme-desc-size)",
                }}
                className="w-full text-secondary font-medium placeholder:text-placeholder bg-transparent border-b border-transparent hover:border-current/20 focus:border-[var(--theme-answer)] focus:outline-none py-1 mt-1 resize-none leading-relaxed transition-colors"
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
              <div className="text-xs text-secondary font-medium">Preview not available</div>
            )}
          </div>

          {/* Action hint matching Screenshot 2 */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              style={{
                backgroundColor: "var(--theme-btn-bg)",
                color: "var(--theme-btn-text)",
                borderRadius: "var(--theme-btn-radius)",
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-default"
            >
              <span>OK</span>
              <CornerDownLeft className="w-3.5 h-3.5 opacity-80" />
            </button>
            <span className="text-micro text-secondary font-medium italic">
              Shift ⇧ + Enter ↵ to make a line break
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <main
      data-theme-isolated="true"
      className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-8 pb-20 overflow-y-auto select-none bg-app transition-colors duration-200"
    >
      {/* Single Dynamic Google Font Loader */}
      <ThemeFontLoader fontFamily={form?.theme?.fontFamily} />

      {/* Faithfully centered "device frame" preview card matching Screenshots 1, 2, 3 */}
      <div
        className="relative w-full max-w-4xl min-h-[520px] rounded-2xl shadow-card border border-default p-8 sm:p-14 flex flex-col justify-center items-center overflow-hidden transition-all duration-200"
        style={{
          ...themeStyles,
          backgroundColor: "var(--theme-bg, #ffffff)",
          backgroundImage: "var(--theme-bg-image)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          fontFamily: "var(--theme-font)",
          color: "var(--theme-question)",
        }}
      >
        {/* Background Overlay if theme has image */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: "var(--theme-bg-overlay)",
          }}
        />

        {renderContent()}
      </div>

      {/* Floating Bottom AI Pill (Matching Typeform Screenshot 1 & 2) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.info("AI assistant: Generating question variants...");
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-purple-200 hover:border-purple-300 shadow-md transition-all group focus-within:ring-2 focus-within:ring-purple-300 w-72 sm:w-80"
        >
          <button
            type="button"
            aria-label="Voice input"
            onClick={() => toast.info("Listening for voice prompt...")}
            className="text-secondary hover:text-purple-600 p-1 rounded-full transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Chat to create"
            className="flex-1 bg-transparent text-xs text-primary placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Submit AI prompt"
            className="text-placeholder group-hover:text-purple-600 hover:text-purple-600 p-1 rounded-full transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
