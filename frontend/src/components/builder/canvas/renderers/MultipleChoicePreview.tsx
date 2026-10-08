"use client";

/**
 * MultipleChoicePreview.tsx — Inline multiple choice editor on canvas
 *
 * Supports:
 *   - Key badges (A, B, C...)
 *   - Inline editing option label
 *   - Removing options
 *   - "Add choice" button
 *   - "Add 'Other'" button & dismissible Other option
 */

import React from "react";
import { Plus, Trash2, Shuffle, CheckSquare, Sparkles } from "lucide-react";
import { Question, QuestionOption } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function MultipleChoicePreview({ question, onUpdate }: RendererProps) {
  const options = question.properties.options || [];
  const allowOther = !!question.properties.allowOther;
  const isMultiple = !!question.properties.multiple;
  const isRandomize = !!question.properties.randomize;

  const handleUpdateOption = (optId: string, newLabel: string) => {
    const updated = options.map((opt) =>
      opt.id === optId ? { ...opt, label: newLabel } : opt
    );
    onUpdate({
      properties: { ...question.properties, options: updated },
    });
  };

  const handleAddOption = () => {
    const newId = `opt_${Date.now()}`;
    const nextNumber = options.length + 1;
    const newOptions: QuestionOption[] = [
      ...options,
      { id: newId, label: `Choice ${nextNumber}` },
    ];
    onUpdate({
      properties: { ...question.properties, options: newOptions },
    });
  };

  const handleDeleteOption = (optId: string) => {
    if (options.length <= 1) return;
    const updated = options.filter((opt) => opt.id !== optId);
    onUpdate({
      properties: { ...question.properties, options: updated },
    });
  };

  const handleToggleOther = (enabled: boolean) => {
    onUpdate({
      properties: { ...question.properties, allowOther: enabled },
    });
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      {/* Configuration pills header */}
      <div className="flex items-center gap-2 text-[11px] text-[#737373] pb-1">
        {isMultiple && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckSquare className="w-3 h-3" />
            <span>Multiple selection</span>
          </span>
        )}
        {isRandomize && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Shuffle className="w-3 h-3" />
            <span>Randomized order</span>
          </span>
        )}
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          return (
            <div
              key={opt.id}
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#262627] hover:shadow-xs transition-all duration-150"
            >
              {/* Key Badge */}
              <span className="w-6 h-6 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] text-[#262627] font-semibold text-xs flex items-center justify-center font-mono shrink-0 shadow-2xs group-hover:bg-[#262627] group-hover:text-white group-hover:border-[#262627] transition-colors">
                {letter}
              </span>

              {/* Inline Editable Option Input */}
              <input
                type="text"
                value={opt.label}
                onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                placeholder={`Choice ${idx + 1}`}
                className="flex-1 bg-transparent text-sm font-medium text-[#262627] focus:outline-none placeholder:text-[#A3A3A3]"
              />

              {/* Remove Action */}
              <button
                type="button"
                onClick={() => handleDeleteOption(opt.id)}
                disabled={options.length <= 1}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#A3A3A3] hover:text-red-600 hover:bg-red-50 disabled:hidden transition-all cursor-pointer"
                title="Remove choice"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* 'Other' Choice (if enabled) */}
        {allowOther && (
          <div className="group flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-sm text-[#737373]">
            <span className="w-6 h-6 rounded-lg bg-white border border-[#E5E5E5] text-[#737373] font-semibold text-xs flex items-center justify-center font-mono shrink-0">
              {String.fromCharCode(65 + options.length)}
            </span>
            <span className="flex-1 italic">Other (free text input)</span>
            <button
              type="button"
              onClick={() => handleToggleOther(false)}
              className="p-1 rounded-md text-[#A3A3A3] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Remove 'Other' option"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Add Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          data-testid="btn-canvas-add-choice"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#D4D4D4] hover:border-[#262627] bg-white text-xs font-semibold text-[#262627] hover:text-black hover:bg-[#FBFBFC] transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add choice</span>
        </button>

        {!allowOther && (
          <button
            type="button"
            data-testid="btn-canvas-add-other"
            onClick={() => handleToggleOther(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#E5E5E5] hover:border-[#262627] bg-white text-xs font-medium text-[#737373] hover:text-[#262627] transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Add &quot;Other&quot;</span>
          </button>
        )}
      </div>
    </div>
  );
}
