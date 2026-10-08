"use client";

/**
 * components/builder/CanvasPane.tsx — Center interactive question preview canvas
 *
 * Simulates Typeform's signature one-question-at-a-time respondent presentation.
 */

import React from "react";
import { Star, CornerDownLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";

export function CanvasPane() {
  const { state, updateQuestion, updateFormMeta, selectedQuestion } = useBuilderStore();
  const { form, questions, selectedId } = state;

  const currentIndex = selectedQuestion
    ? questions.findIndex((q) => q.id === selectedQuestion.id)
    : -1;

  // ---------------------------------------------------------------------------
  // 1. Welcome Screen Canvas
  // ---------------------------------------------------------------------------
  if (selectedId === "welcome") {
    return (
      <main className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="max-w-xl w-full text-center sm:text-left space-y-5 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
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
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Thank You Screen Canvas
  // ---------------------------------------------------------------------------
  if (selectedId === "thank_you") {
    return (
      <main className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="max-w-xl w-full text-center sm:text-left space-y-5 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
        </div>
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

  return (
    <main className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      <div className="max-w-xl w-full space-y-6 animate-in fade-in duration-200">
        {/* Step Number + Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8C8C8C] mb-2">
            <span>{currentIndex + 1}</span>
            <span>&rarr;</span>
            <span
              className="px-2 py-0.5 rounded-full border text-[11px]"
              style={{
                backgroundColor: typeDef?.badgeBg,
                borderColor: `${typeDef?.color}30`,
                color: typeDef?.color,
              }}
            >
              {typeDef?.label}
            </span>
            {selectedQuestion.required && (
              <span className="text-red-500 font-bold">*</span>
            )}
          </div>

          <input
            type="text"
            value={selectedQuestion.title}
            onChange={(e) =>
              updateQuestion(selectedQuestion.id, { title: e.target.value })
            }
            placeholder="Type your question here..."
            className="w-full text-xl sm:text-2xl font-bold text-[#191919] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 transition-colors"
          />

          <input
            type="text"
            value={selectedQuestion.description || ""}
            onChange={(e) =>
              updateQuestion(selectedQuestion.id, { description: e.target.value })
            }
            placeholder="Description (optional)"
            className="w-full text-xs sm:text-sm text-[#737373] placeholder:text-[#A3A3A3] bg-transparent border-b border-transparent hover:border-[#E5E5E5] focus:border-[#191919] focus:outline-none py-1 mt-1 transition-colors"
          />
        </div>

        {/* Input Interactive Simulation */}
        <div className="py-2">
          {/* Short Text */}
          {selectedQuestion.type === "short_text" && (
            <div className="border-b-2 border-neutral-300 pb-2 text-neutral-400 text-base sm:text-lg">
              {selectedQuestion.properties.placeholder || "Type your answer here..."}
            </div>
          )}

          {/* Long Text */}
          {selectedQuestion.type === "long_text" && (
            <div className="border-b-2 border-neutral-300 pb-12 text-neutral-400 text-sm sm:text-base">
              {selectedQuestion.properties.placeholder || "Type your detailed thoughts here..."}
            </div>
          )}

          {/* Email */}
          {selectedQuestion.type === "email" && (
            <div className="border-b-2 border-neutral-300 pb-2 text-neutral-400 text-base sm:text-lg">
              name@example.com
            </div>
          )}

          {/* Number */}
          {selectedQuestion.type === "number" && (
            <div className="border-b-2 border-neutral-300 pb-2 text-neutral-400 text-base sm:text-lg">
              0
            </div>
          )}

          {/* Yes / No */}
          {selectedQuestion.type === "yes_no" && (
            <div className="flex gap-3">
              <div className="flex-1 max-w-[140px] py-3 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 font-semibold text-sm flex items-center justify-between shadow-2xs">
                <span>Yes</span>
                <span className="text-[10px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-500 font-mono">
                  Y
                </span>
              </div>
              <div className="flex-1 max-w-[140px] py-3 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 font-semibold text-sm flex items-center justify-between shadow-2xs">
                <span>No</span>
                <span className="text-[10px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-500 font-mono">
                  N
                </span>
              </div>
            </div>
          )}

          {/* Multiple Choice */}
          {selectedQuestion.type === "multiple_choice" && (
            <div className="space-y-2">
              {(selectedQuestion.properties.options || []).map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 max-w-sm text-sm font-medium text-neutral-800"
                  >
                    <span className="w-5 h-5 rounded-md bg-white border border-neutral-200 text-neutral-500 font-semibold text-xs flex items-center justify-center font-mono shrink-0">
                      {letter}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dropdown */}
          {selectedQuestion.type === "dropdown" && (
            <div className="p-3.5 rounded-xl border border-neutral-300 bg-white max-w-sm text-sm text-neutral-400 flex items-center justify-between shadow-2xs">
              <span>Select an option...</span>
              <span className="text-neutral-400">&darr;</span>
            </div>
          )}

          {/* Rating */}
          {selectedQuestion.type === "rating" && (
            <div className="flex items-center gap-2">
              {Array.from({ length: selectedQuestion.properties.steps || 5 }).map(
                (_, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center text-amber-500 hover:bg-amber-50 cursor-pointer transition-colors"
                  >
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* OK / Enter action button */}
        <div className="pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-[#262627] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
          >
            <span>OK</span>
            <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </div>
    </main>
  );
}
