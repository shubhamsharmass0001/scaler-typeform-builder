"use client";

/**
 * components/builder/QuestionListPane.tsx — Left navigation pane of the Form Builder
 *
 * Pixel-accurate match to Typeform's form builder left pane:
 *   - "Pages" section header with numbered question items
 *   - "Endings" section at the bottom (Thank You screen)
 *   - Sortable with @dnd-kit/sortable (drag handle on hover)
 *   - DragOverlay for smooth visual feedback
 *   - Live updating question numbers
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
  GripVertical,
  ChevronRight,
  MoreHorizontal,
  Lightbulb,
  X,
  GitFork,
  AlertTriangle,
  MonitorSmartphone,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { Question } from "@/types";
import { hasQuestionLogic, getQuestionJumpTargets } from "@/lib/logic";

interface QuestionListPaneProps {
  onOpenAddModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}// Single Sortable Question Item Component matching Reference Image 2
function SortableQuestionItem({
  question,
  index,
  questions,
  showLogicOverview,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  question: Question;
  index: number;
  questions: Question[];
  showLogicOverview: boolean;
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
    isOver,
  } = useSortable({ id: String(question.id) });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    touchAction: "none",
  };

  const typeDef = QUESTION_TYPES[question.type];
  const Icon = typeDef?.icon || Sparkles;

  const itemBadgeLabel = String(index + 1);
  const hasLogic = hasQuestionLogic(question);
  const jumpTargets = showLogicOverview ? getQuestionJumpTargets(question, questions) : [];

  // When dragging, display the clean dashed drop target placeholder matching Image 2
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl min-h-[58px] w-full bg-neutral-100/50 dark:bg-neutral-800/20 transition-all my-0.5"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`question-item-${index}`}
      data-question-id={String(question.id)}
      onClick={onSelect}
      className={clsx(
        "group relative flex flex-col gap-1.5 p-3 rounded-2xl bg-white dark:bg-card border transition-all duration-150 select-none cursor-grab active:cursor-grabbing",
        isSelected
          ? "border-neutral-900 dark:border-white shadow-xs ring-1 ring-neutral-900/10 dark:ring-white/20"
          : "border-neutral-200/90 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs hover:shadow-xs",
        isOver && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      <div className="flex items-center justify-between gap-2.5 w-full">
        {/* Left: Pastel Badge + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Pastel badge matching Image 2 */}
          <div
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0 font-medium text-xs pointer-events-none shadow-2xs"
            style={{
              backgroundColor: typeDef?.badgeBg || "#d0f0fd",
              color: typeDef?.color || "#0284c7",
            }}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
            <span className="font-semibold text-xs">{itemBadgeLabel}</span>
          </div>

          {/* Question Title matching Image 2 */}
          <span className="flex-1 text-[13px] leading-snug font-normal text-neutral-700 dark:text-neutral-200 line-clamp-2 pointer-events-none">
            {question.title || "Your question here"}
          </span>

          {/* Branch Icon if question has logic */}
          {hasLogic && (
            <span
              title="Has conditional logic jumps"
              data-testid={`logic-badge-${index}`}
              className="text-secondary shrink-0 p-0.5 rounded pointer-events-none"
            >
              <GitFork className="w-3 h-3 text-secondary" />
            </span>
          )}
        </div>

        {/* Right: Actions revealed on hover */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(e);
            }}
            aria-label="Duplicate question"
            className="p-1 rounded-md text-secondary hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Duplicate question"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            aria-label="Delete question"
            className="p-1 rounded-md text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="Delete question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logic overview jump arrows */}
      {showLogicOverview && (
        <div className="flex flex-wrap items-center gap-1 pl-1 pt-1 text-nano border-t border-dashed border-neutral-200 dark:border-neutral-800">
          <span className="text-muted font-mono">↳</span>
          {hasLogic ? (
            jumpTargets.map((target, tIdx) => (
              <span
                key={tIdx}
                className={clsx(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium",
                  target.isInvalid
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : target.isEnd
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "bg-neutral-100 dark:bg-neutral-800 text-secondary"
                )}
              >
                {target.isInvalid && <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
                <span>→ {target.label}</span>
              </span>
            ))
          ) : (
            <span className="text-muted italic">Next</span>
          )}
        </div>
      )}
    </div>
  );
}

// Drag Overlay Item for smooth visual feedback matching Image 2
function DraggingItemOverlay({ question, index }: { question: Question; index: number }) {
  const typeDef = QUESTION_TYPES[question.type];
  const Icon = typeDef?.icon || Sparkles;

  return (
    <div
      style={{
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
      className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-card border border-blue-500/40 shadow-2xl scale-[1.03] rotate-1 select-none cursor-grabbing w-[230px]"
    >
      <div
        className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0 text-xs font-semibold shadow-2xs"
        style={{
          backgroundColor: typeDef?.badgeBg || "#d0f0fd",
          color: typeDef?.color || "#0284c7",
        }}
      >
        <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
        <span>{index + 1}</span>
      </div>
      <span className="text-[13px] leading-snug font-normal text-neutral-800 dark:text-neutral-200 line-clamp-2 flex-1">
        {question.title || "Untitled question"}
      </span>
    </div>
  );
}

export function QuestionListPane({
  onOpenAddModal,
  isOpenMobile = false,
  onCloseMobile,
}: QuestionListPaneProps) {
  const {
    state,
    selectQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
  } = useBuilderStore();

  const { form, questions, selectedId } = state;
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [showLogicOverview, setShowLogicOverview] = useState(false);

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

  const activeQuestionIndex = activeDraggingId
    ? questions.findIndex((q) => String(q.id) === activeDraggingId)
    : -1;
  const activeQuestion = activeQuestionIndex !== -1 ? questions[activeQuestionIndex] : null;

  const content = (
    <aside className="w-64 md:w-60 lg:w-64 bg-surface-subtle border-r border-default flex flex-col shrink-0 h-full overflow-hidden select-none transition-colors">
      {/* Mobile Close Bar (when drawer is open on mobile) */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-default bg-surface">
        <span className="text-xs font-bold text-primary">Pages & Structure</span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close pages panel"
          className="p-1 rounded-md text-muted hover:text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3.5">
        {/* ── 1. PAGES SECTION ─────────────────────────────────────────── */}
        <div className="space-y-2">
          {/* Header */}
          <div className="px-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Pages</span>
            {/* Logic Overview Toggle */}
            <button
              type="button"
              onClick={() => setShowLogicOverview(!showLogicOverview)}
              className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-lg text-micro font-medium transition-colors cursor-pointer",
                showLogicOverview
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted hover:text-primary hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
              )}
              title="Toggle logic jumps overview"
              data-testid="toggle-logic-overview-btn"
            >
              <GitFork className="w-3 h-3" />
              <span>Logic</span>
            </button>
          </div>

          {/* 1. Welcome Screen Card */}
          <div
            onClick={() => {
              selectQuestion("welcome");
              onCloseMobile?.();
            }}
            data-testid="step-welcome"
            className={clsx(
              "group flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-card border transition-all duration-150 cursor-pointer select-none",
              selectedId === "welcome"
                ? "border-neutral-900 dark:border-white shadow-xs ring-1 ring-neutral-900/10 dark:ring-white/20"
                : "border-neutral-200/90 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs hover:shadow-xs"
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
              <MonitorSmartphone className="w-4 h-4" />
            </div>
            <span className="text-[13px] leading-snug font-normal text-neutral-700 dark:text-neutral-200 line-clamp-2 flex-1">
              {form?.welcome_title || "Welcome Screen"}
            </span>
          </div>

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
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    index={index}
                    questions={questions}
                    showLogicOverview={showLogicOverview}
                    isSelected={String(selectedId) === String(question.id)}
                    onSelect={() => {
                      selectQuestion(question.id);
                      onCloseMobile?.();
                    }}
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
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeQuestion ? (
                <DraggingItemOverlay question={activeQuestion} index={activeQuestionIndex} />
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* + Add content button styled as clean dashed drop card matching Image 2 */}
          <button
            type="button"
            onClick={onOpenAddModal}
            data-testid="add-content-btn"
            className="w-full flex items-center justify-center gap-2 py-3 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white border-2 border-dashed border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 rounded-2xl transition-all cursor-pointer bg-neutral-50/40 hover:bg-neutral-100/50 dark:bg-neutral-900/20"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add content</span>
          </button>
        </div>

        {/* ── 2. PERSONALIZE WITH BRANCHING CALLOUT ─────────────────── */}
        <div
          onClick={() => setShowLogicOverview(!showLogicOverview)}
          className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-3 flex items-center justify-between text-xs font-medium bg-white dark:bg-card hover:border-neutral-300 dark:hover:border-neutral-700 text-primary transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-primary truncate">Personalize with branching</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
        </div>

        {/* ── 3. HORIZONTAL SEPARATOR DASH ──────────────────────────── */}
        <div className="flex justify-center my-0.5" aria-hidden="true">
          <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* ── 4. ENDINGS SECTION ─────────────────────────────────── */}
        <div className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Endings</span>
            <button
              type="button"
              onClick={() => selectQuestion("thank_you")}
              title="Add ending"
              className="p-1 rounded text-muted hover:text-primary hover:bg-neutral-200/50 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => {
              selectQuestion("thank_you");
              onCloseMobile?.();
            }}
            data-testid="step-thank-you"
            className={clsx(
              "group flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-card border transition-all duration-150 cursor-pointer select-none",
              selectedId === "thank_you"
                ? "border-neutral-900 dark:border-white shadow-xs ring-1 ring-neutral-900/10 dark:ring-white/20"
                : "border-neutral-200/90 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs hover:shadow-xs"
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs shrink-0">
              A
            </div>
            <span className="text-[13px] leading-snug font-normal text-neutral-700 dark:text-neutral-200 line-clamp-2 flex-1">
              {form?.thank_you_title || "Thank you screen"}
            </span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Responses collected meter ─────────────────────── */}
      <div className="border-t border-default p-3 bg-surface">
        <p className="text-nano text-muted font-medium">Responses collected</p>
        <div className="mt-1 bg-muted rounded-full h-1 overflow-hidden">
          <div className="bg-primary h-1 rounded-full transition-all duration-300" style={{ width: "0%" }} />
        </div>
        <p className="text-nano text-muted mt-1">0 / 10</p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop view (always visible on md+) */}
      <div className="hidden md:block h-full shrink-0">
        {content}
      </div>

      {/* Mobile drawer with backdrop (active when isOpenMobile) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full max-w-[280px] w-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
