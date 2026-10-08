"use client";

/**
 * components/runner/FormRunner.tsx — Respondent flow runner
 *
 * TODO: Full respondent flow implementation will be built in the next prompt (7A / 7B).
 *
 * In "preview" mode, this component provides an authentic respondent preview
 * within Desktop/Mobile frames without persisting or writing anything to the database.
 */

import React, { useState } from "react";
import { CornerDownLeft, ChevronUp, ChevronDown, Check, Star } from "lucide-react";
import { Form, Question } from "@/types";

interface FormRunnerProps {
  mode?: "preview" | "live";
  form: Form | null;
  questions?: Question[];
}

export function FormRunner({ mode = "preview", form, questions = [] }: FormRunnerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const theme = form?.theme || {};

  // Steps array: [Welcome, ...Questions, Thank You]
  const hasWelcome = !!(form?.welcome_title || form?.welcome_description);
  const totalSteps = (hasWelcome ? 1 : 0) + questions.length + 1; // +1 for thank you

  const isWelcomeStep = hasWelcome && currentStepIndex === 0;
  const isThankYouStep = currentStepIndex === totalSteps - 1;
  const questionIndex = hasWelcome ? currentStepIndex - 1 : currentStepIndex;
  const currentQuestion = questions[questionIndex];

  const bgColor = theme.backgroundColor || "#FFFFFF";
  const textColor = theme.textColor || "#191919";
  const buttonColor = theme.buttonColor || "#262627";
  const fontFamily = theme.fontFamily || "Inter";

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col justify-between p-6 sm:p-12 relative select-none overflow-y-auto"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: fontFamily,
      }}
    >
      {/* Mode Badge (Preview notice) */}
      {mode === "preview" && (
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/10 text-neutral-600 border border-black/10">
            Preview Mode — Responses are not saved
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="max-w-xl w-full space-y-6">
          {/* 1. Welcome Screen */}
          {isWelcomeStep && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
                {form?.welcome_title || "Welcome to our form"}
              </h1>
              {form?.welcome_description && (
                <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                  {form.welcome_description}
                </p>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  style={{ backgroundColor: buttonColor }}
                  className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>{form?.welcome_button_text || "Start"}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Question View */}
          {!isWelcomeStep && !isThankYouStep && currentQuestion && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question Header */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold opacity-60 mb-2">
                  <span>{questionIndex + 1}</span>
                  <span>&rarr;</span>
                  {currentQuestion.required && (
                    <span className="text-red-500 font-bold">*</span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                  {currentQuestion.title || "Untitled question"}
                </h2>
                {currentQuestion.description && (
                  <p className="text-xs sm:text-sm opacity-70 mt-1">
                    {currentQuestion.description}
                  </p>
                )}
              </div>

              {/* Input Simulation based on type */}
              <div className="py-2">
                {currentQuestion.type === "short_text" && (
                  <input
                    type="text"
                    disabled
                    placeholder={currentQuestion.properties.placeholder || "Type your answer..."}
                    className="w-full bg-transparent border-b-2 border-current/30 pb-2 text-base sm:text-lg focus:outline-none opacity-80"
                  />
                )}

                {currentQuestion.type === "long_text" && (
                  <textarea
                    rows={3}
                    disabled
                    placeholder={currentQuestion.properties.placeholder || "Type your detailed thoughts..."}
                    className="w-full bg-transparent border-b-2 border-current/30 pb-2 text-sm sm:text-base focus:outline-none opacity-80 resize-none"
                  />
                )}

                {currentQuestion.type === "email" && (
                  <input
                    type="email"
                    disabled
                    placeholder="name@example.com"
                    className="w-full bg-transparent border-b-2 border-current/30 pb-2 text-base sm:text-lg focus:outline-none opacity-80"
                  />
                )}

                {currentQuestion.type === "number" && (
                  <input
                    type="text"
                    disabled
                    placeholder="0"
                    className="w-full bg-transparent border-b-2 border-current/30 pb-2 text-base sm:text-lg focus:outline-none opacity-80"
                  />
                )}

                {currentQuestion.type === "yes_no" && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-3 px-4 rounded-xl border border-current/20 bg-current/5 hover:bg-current/10 font-semibold text-sm flex items-center justify-between"
                    >
                      <span>Yes</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-current/30 font-mono">
                        Y
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-3 px-4 rounded-xl border border-current/20 bg-current/5 hover:bg-current/10 font-semibold text-sm flex items-center justify-between"
                    >
                      <span>No</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-current/30 font-mono">
                        N
                      </span>
                    </button>
                  </div>
                )}

                {currentQuestion.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {(currentQuestion.properties.options || []).map((opt, i) => (
                      <div
                        key={opt.id}
                        onClick={handleNext}
                        className="flex items-center gap-3 p-3 rounded-xl border border-current/20 bg-current/5 hover:bg-current/10 text-sm font-medium cursor-pointer transition-colors"
                      >
                        <span className="w-5 h-5 rounded-md border border-current/30 text-xs flex items-center justify-center font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                    ))}
                    {currentQuestion.properties.allowOther && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-current/30 text-sm font-medium opacity-70">
                        <span className="w-5 h-5 rounded-md border border-current/30 text-xs flex items-center justify-center font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + (currentQuestion.properties.options?.length || 0))}
                        </span>
                        <span className="italic">Other...</span>
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion.type === "dropdown" && (
                  <div className="p-3.5 rounded-xl border border-current/30 bg-current/5 text-sm flex items-center justify-between">
                    <span>Select an option...</span>
                    <span>&darr;</span>
                  </div>
                )}

                {currentQuestion.type === "rating" && (
                  <div className="flex items-center gap-2">
                    {Array.from({ length: currentQuestion.properties.steps || 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        onClick={handleNext}
                        className="w-10 h-10 rounded-xl border border-current/20 bg-current/5 hover:bg-current/15 flex items-center justify-center cursor-pointer"
                      >
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  style={{ backgroundColor: buttonColor }}
                  className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>{questionIndex === questions.length - 1 ? "Submit" : "OK"}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Thank You Screen */}
          {isThankYouStep && (
            <div className="space-y-4 text-center sm:text-left animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {form?.thank_you_title || "Thank you for your response!"}
              </h1>
              <p className="text-sm opacity-80 leading-relaxed">
                {form?.thank_you_message || "Your answers have been recorded."}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(0)}
                  className="text-xs font-semibold underline opacity-70 hover:opacity-100 cursor-pointer"
                >
                  Restart preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls: Arrows at bottom right */}
      <div className="flex items-center justify-between pt-4 border-t border-current/10 text-xs">
        <span className="opacity-60 text-[11px]">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg border border-current/20 hover:bg-current/10 disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Previous step"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIndex === totalSteps - 1}
            className="p-1.5 rounded-lg border border-current/20 hover:bg-current/10 disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Next step"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
