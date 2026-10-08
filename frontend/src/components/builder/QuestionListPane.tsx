"use client";

/**
 * components/builder/QuestionListPane.tsx — Left navigation pane of the Form Builder
 *
 * Implements:
 *   - Sortable question list with @dnd-kit/sortable
 *   - Drag handle on hover with smooth animation
 *   - Floating DragOverlay showing active dragging item
 *   - Accessible PointerSensor & KeyboardSensor
 *   - Live updating question numbers
 *   - Fixed Welcome screen at top and Thank-you screen at bottom
 *   - Duplicate and Delete hover actions
 */

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Copy,
  Trash2,
  Sparkles,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import clsx from "clsx";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { Question } from "@/types";

interface QuestionListPaneProps {
  onOpenAddModal: () => void;
}

// Single Sortable Question Item Component
function SortableQuestionItem({
  question,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(question.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const typeDef = QUESTION_TYPES[question.type];
  const Icon = typeDef?.icon || Sparkles;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`question-item-${index}`}
      data-question-id={String(question.id)}
      onClick={onSelect}
      className={clsx(
        "group relative flex items-center justify-between gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer select-none",
        isSelected
          ? "bg-white border-[#262627] shadow-xs text-[#191919]"
          : "bg-transparent border-transparent hover:bg-white/70 text-[#5E5E60]"
      )}
    >
      {/* Left: Drag Handle (revealed on hover) + Number + Type Badge + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Grip Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#A3A3A3] hover:text-[#262627] cursor-grab active:cursor-grabbing transition-opacity shrink-0"
          title="Drag to reorder"
          data-testid={`drag-handle-${index}`}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Live Question Number */}
        <span className="w-4 text-[11px] font-semibold text-[#8C8C8C] shrink-0 text-center">
          {index + 1}
        </span>

        {/* Colored Icon Badge */}
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

        {/* Truncated Question Title */}
        <span className="truncate flex-1 font-medium text-[12px]">
          {question.title || "Untitled question"}
        </span>
      </div>

      {/* Right: Duplicate & Delete buttons (hover-revealed) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 rounded-md text-[#737373] hover:text-[#191919] hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Duplicate question"
        >
          <Copy className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-md text-[#737373] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete question"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Drag Overlay Item for smooth visual feedback
function DraggingItemOverlay({ question }: { question: Question }) {
  const typeDef = QUESTION_TYPES[question.type];
  const Icon = typeDef?.icon || Sparkles;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#262627] bg-white text-xs font-semibold text-[#191919] shadow-lg scale-102 opacity-95">
      <GripVertical className="w-3.5 h-3.5 text-[#262627]" />
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
        style={{
          backgroundColor: typeDef?.badgeBg || "#F5F5F5",
          borderColor: `${typeDef?.color || "#A3A3A3"}30`,
          color: typeDef?.color || "#262627",
        }}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="truncate max-w-[140px]">
        {question.title || "Untitled question"}
      </span>
    </div>
  );
}

export function QuestionListPane({ onOpenAddModal }: QuestionListPaneProps) {
  const {
    state,
    selectQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
  } = useBuilderStore();

  const { form, questions, selectedId } = state;
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  // Setup accessible sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDraggingId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraggingId(null);

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => String(q.id) === String(active.id));
      const newIndex = questions.findIndex((q) => String(q.id) === String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQuestions(oldIndex, newIndex);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDraggingId(null);
  };

  const activeQuestion = activeDraggingId
    ? questions.find((q) => String(q.id) === activeDraggingId)
    : null;

  return (
    <aside className="w-64 sm:w-72 bg-[#F9F9FB] border-r border-[#ECECEC] flex flex-col justify-between shrink-0 h-full overflow-hidden select-none">
      {/* Scrollable list of steps */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
        {/* Header Label */}
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider">
          <span>Form flow</span>
          <span>{questions.length + 2} steps</span>
        </div>

        {/* 1. Fixed Welcome Screen Step */}
        <div
          onClick={() => selectQuestion("welcome")}
          data-testid="step-welcome"
          className={clsx(
            "group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer",
            selectedId === "welcome"
              ? "bg-white border-[#262627] shadow-xs text-[#191919]"
              : "bg-transparent border-transparent hover:bg-white/70 text-[#5E5E60]"
          )}
        >
          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="truncate flex-1 font-semibold text-[12px]">
            {form?.welcome_title || "Welcome screen"}
          </span>
        </div>

        {/* Divider line */}
        <div className="my-1.5 border-t border-[#ECECEC]/60 px-2" />

        {/* 2. Sortable Questions List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={questions.map((q) => String(q.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {questions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  isSelected={String(selectedId) === String(question.id)}
                  onSelect={() => selectQuestion(question.id)}
                  onDuplicate={(e) => {
                    e.stopPropagation();
                    duplicateQuestion(question.id);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    deleteQuestion(question.id);
                  }}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeQuestion ? <DraggingItemOverlay question={activeQuestion} /> : null}
          </DragOverlay>
        </DndContext>

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

        {/* 4. Fixed Thank You Screen Step */}
        <div
          onClick={() => selectQuestion("thank_you")}
          data-testid="step-thank-you"
          className={clsx(
            "group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer",
            selectedId === "thank_you"
              ? "bg-white border-[#262627] shadow-xs text-[#191919]"
              : "bg-transparent border-transparent hover:bg-white/70 text-[#5E5E60]"
          )}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="truncate flex-1 font-semibold text-[12px]">
            {form?.thank_you_title || "Thank you screen"}
          </span>
        </div>
      </div>
    </aside>
  );
}
