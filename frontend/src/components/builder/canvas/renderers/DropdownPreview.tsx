"use client";

/**
 * DropdownPreview.tsx — Inline dropdown editor on canvas
 *
 * Supports:
 *   - Dropdown preview mockup
 *   - Inline editing choices directly on the canvas
 *   - Add choice control
 *   - Remove choice control
 *   - Alphabetical sorting indicator
 */

import React from "react";
import { ChevronDown, Plus, Trash2, ArrowDownAZ } from "lucide-react";
import { Question, QuestionOption } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function DropdownPreview({ question, onUpdate }: RendererProps) {
  const options = question.properties.options || [];
  const isAlphabetical = !!question.properties.alphabetical;

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

  return (
    <div className="w-full max-w-xl space-y-3">
      {/* Visual Dropdown Trigger Mockup */}
      <div className="w-full p-3 rounded-xl border border-[#D4D4D4] bg-white flex items-center justify-between text-sm text-[#A3A3A3] shadow-2xs">
        <span>Select an option...</span>
        <ChevronDown className="w-4 h-4 text-[#A3A3A3]" />
      </div>

      {/* Alphabetical Badge */}
      {isAlphabetical && (
        <div className="flex items-center gap-1.5 text-[11px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 w-fit">
          <ArrowDownAZ className="w-3 h-3" />
          <span>Sorted alphabetically</span>
        </div>
      )}

      {/* Inline Choices Management List */}
      <div className="pt-2 space-y-1.5">
        <div className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider px-1">
          Choices list ({options.length})
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className="group flex items-center gap-2 p-2 rounded-lg border border-[#E5E5E5] bg-[#FBFBFC] hover:bg-white hover:border-[#262627] transition-all"
            >
              <span className="w-5 text-[11px] font-mono font-semibold text-[#8C8C8C] text-center shrink-0">
                {idx + 1}
              </span>

              <input
                type="text"
                value={opt.label}
                onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                placeholder={`Choice ${idx + 1}`}
                className="flex-1 bg-transparent text-xs font-medium text-[#262627] focus:outline-none placeholder:text-[#A3A3A3]"
              />

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
          ))}
        </div>

        {/* Add Choice Control */}
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#D4D4D4] hover:border-[#262627] bg-white text-xs font-semibold text-[#262627] hover:text-black hover:bg-[#FBFBFC] transition-all cursor-pointer shadow-2xs mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add choice</span>
        </button>
      </div>
    </div>
  );
}
