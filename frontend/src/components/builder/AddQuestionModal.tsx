"use client";

/**
 * components/builder/AddQuestionModal.tsx — Popover/Modal to pick and add any of the 8 question types
 */

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { QUESTION_TYPE_LIST } from "@/lib/questionTypes";
import { QuestionType } from "@/types";
import { useBuilderStore } from "./BuilderContext";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddQuestionModal({ isOpen, onClose }: AddQuestionModalProps) {
  const { state, addQuestion } = useBuilderStore();
  const [search, setSearch] = useState("");

  const filteredTypes = useMemo(() => {
    if (!search.trim()) return QUESTION_TYPE_LIST;
    const q = search.toLowerCase();
    return QUESTION_TYPE_LIST.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (type: QuestionType) => {
    const afterId = state.selectedId;
    addQuestion(type, afterId);
    onClose();
    setSearch("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSearch("");
      }}
      title="Add question"
      description="Choose a question type to add to your form flow."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question types..."
            autoFocus
            className="w-full bg-[#FAFAFA] text-sm text-[#262627] placeholder:text-[#A3A3A3] pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:border-[#262627] focus:bg-white transition-colors"
          />
        </div>

        {/* 8 Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredTypes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                data-question-type={item.type}
                data-testid={`add-type-${item.type}`}
                onClick={() => handleSelect(item.type)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-[#ECECEC] hover:border-[#191919] bg-white hover:bg-[#FBFBFC] text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: item.badgeBg,
                    borderColor: `${item.color}30`,
                    color: item.color,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-[#262627] group-hover:text-black mb-0.5">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-[#737373] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
