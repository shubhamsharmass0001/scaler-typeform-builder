"use client";

/**
 * components/builder/QuestionListPane.tsx — Left navigation pane of the Form Builder
 *
 * Displays:
 *   - Welcome screen item
 *   - Ordered questions with numbers, colored type icon badges, hover duplicate/delete actions
 *   - "+ Add question" trigger button
 *   - Thank you screen item
 */

import React from "react";
import {
  Plus,
  Copy,
  Trash2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";

interface QuestionListPaneProps {
  onOpenAddModal: () => void;
}

export function QuestionListPane({ onOpenAddModal }: QuestionListPaneProps) {
  const {
    state,
    selectQuestion,
    deleteQuestion,
    duplicateQuestion,
  } = useBuilderStore();

  const { form, questions, selectedId } = state;

  return (
    <aside className="w-64 sm:w-72 bg-[#F9F9FB] border-r border-[#ECECEC] flex flex-col justify-between shrink-0 h-full overflow-hidden select-none">
      {/* Scrollable list of steps */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
        {/* Header Label */}
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider">
          <span>Form flow</span>
          <span>{questions.length + 2} steps</span>
        </div>

        {/* 1. Welcome Screen Step */}
        <div
          onClick={() => selectQuestion("welcome")}
          className={clsx(
            "group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer",
            selectedId === "welcome"
              ? "bg-white border-[#D4D4D4] shadow-xs text-[#191919]"
              : "bg-transparent border-transparent hover:bg-white/60 text-[#5E5E60]"
          )}
        >
          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="truncate flex-1 font-semibold">
            {form?.welcome_title || "Welcome screen"}
          </span>
        </div>

        {/* Divider line */}
        <div className="my-1.5 border-t border-[#ECECEC]/60 px-2" />

        {/* 2. Questions List */}
        <div className="space-y-1">
          {questions.map((question, index) => {
            const isSelected = selectedId === question.id;
            const typeDef = QUESTION_TYPES[question.type];
            const Icon = typeDef?.icon || Sparkles;

            return (
              <div
                key={question.id}
                onClick={() => selectQuestion(question.id)}
                className={clsx(
                  "group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "bg-white border-[#D4D4D4] shadow-xs text-[#191919]"
                    : "bg-transparent border-transparent hover:bg-white/60 text-[#5E5E60]"
                )}
              >
                {/* Left: Step number + Type badge + Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-4 text-[11px] font-semibold text-[#8C8C8C] shrink-0 text-center">
                    {index + 1}
                  </span>

                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: typeDef?.badgeBg || "#F5F5F5",
                      borderColor: `${typeDef?.color || "#A3A3A3"}25`,
                      color: typeDef?.color || "#262627",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <span className="truncate flex-1 font-medium">
                    {question.title || "Untitled question"}
                  </span>
                </div>

                {/* Right: Hover-revealed Duplicate & Delete buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateQuestion(question.id);
                    }}
                    className="p-1 rounded-md text-[#737373] hover:text-[#191919] hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Duplicate question"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuestion(question.id);
                    }}
                    className="p-1 rounded-md text-[#737373] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. + Add Question Button */}
        <div className="pt-2">
          <button
            type="button"
            data-testid="add-question-btn"
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-[#D4D4D4] hover:border-[#191919] bg-white/50 hover:bg-white text-xs font-semibold text-[#262627] hover:text-black transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-current" />
            <span>Add question</span>
          </button>
        </div>

        {/* Divider line */}
        <div className="my-1.5 border-t border-[#ECECEC]/60 px-2" />

        {/* 4. Thank You Screen Step */}
        <div
          onClick={() => selectQuestion("thank_you")}
          className={clsx(
            "group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer",
            selectedId === "thank_you"
              ? "bg-white border-[#D4D4D4] shadow-xs text-[#191919]"
              : "bg-transparent border-transparent hover:bg-white/60 text-[#5E5E60]"
          )}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="truncate flex-1 font-semibold">
            {form?.thank_you_title || "Thank you screen"}
          </span>
        </div>
      </div>
    </aside>
  );
}
