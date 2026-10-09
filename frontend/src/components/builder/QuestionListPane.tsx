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
}

// Single Sortable Question Item Component
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const typeDef = QUESTION_TYPES[question.type];
  const Icon = typeDef?.icon || Sparkles;

  // Question badge label: number or letter (e.g. A, B, C for multiple choices or 1, 2, 3)
  const itemBadgeLabel = String(index + 1);

  const hasLogic = hasQuestionLogic(question);
  const jumpTargets = showLogicOverview ? getQuestionJumpTargets(question, questions) : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`question-item-${index}`}
      data-question-id={String(question.id)}
      onClick={onSelect}
      className={clsx(
        "group relative flex flex-col gap-0.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer select-none",
        isSelected
          ? "bg-muted text-primary shadow-xs font-semibold border border-default"
          : "hover:bg-surface-hover text-secondary hover:text-primary",
        isOver && !isDragging && "border-t-2 border-primary"
      )}
    >
      <div className="flex items-center justify-between gap-1.5 w-full">
        {/* Left: Drag Handle + Type Badge with Letter/Number + Title */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Grip Handle - revealed on hover */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:text-primary cursor-grab active:cursor-grabbing transition-opacity shrink-0"
            title="Drag to reorder"
            aria-label="Drag to reorder"
            data-testid={`drag-handle-${index}`}
          >
            <GripVertical className="w-3 h-3" />
          </button>

          {/* Colored Icon Badge + Number (Typeform style badge) */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded shrink-0 text-micro font-bold"
            style={{
              backgroundColor: typeDef?.badgeBg || "var(--bg-muted)",
              color: typeDef?.color || "var(--text-primary)",
            }}
          >
            <Icon className="w-3 h-3 stroke-[2.2]" aria-hidden="true" />
            <span>{itemBadgeLabel}</span>
          </div>

          {/* Truncated Question Title */}
          <span className="truncate flex-1 text-caption leading-tight text-primary">
            {question.title || "Your question here"}
          </span>

          {/* Branch Icon if question has logic */}
          {hasLogic && (
            <span
              title="Has conditional logic jumps"
              data-testid={`logic-badge-${index}`}
              className="text-secondary shrink-0 p-0.5 rounded"
            >
              <GitFork className="w-3 h-3 text-secondary" />
            </span>
          )}
        </div>

        {/* Right: More menu or action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Actions revealed on hover */}
          <div className="hidden group-hover:flex items-center gap-0.5 transition-opacity">
            <button
              type="button"
              onClick={onDuplicate}
              aria-label="Duplicate question"
              className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              title="Duplicate question"
            >
              <Copy className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete question"
              className="p-1 rounded text-secondary hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete question"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Selected 3 dots button (matching screenshot) */}
          {isSelected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(e);
              }}
              aria-label="Question options"
              className="group-hover:hidden p-0.5 rounded text-secondary hover:text-primary"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Logic overview jump arrows */}
      {showLogicOverview && (
        <div className="flex flex-wrap items-center gap-1 pl-6 pt-0.5 text-nano">
          <span className="text-muted font-mono">↳</span>
          {hasLogic ? (
            jumpTargets.map((target, tIdx) => (
              <span
                key={tIdx}
                className={clsx(
                  "inline-flex items-center gap-0.5 px-1 py-0.2 rounded font-medium",
                  target.isInvalid
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : target.isEnd
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "bg-surface text-secondary border border-default"
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

// Drag Overlay Item for smooth visual feedback
function DraggingItemOverlay({ question, index }: { question: Question; index: number }) {
  const typeDef = QUESTION_TYPES[question.type];
  const Icon = typeDef?.icon || Sparkles;

  return (
    <div
      style={{
        backgroundColor: "var(--drag-overlay-bg)",
        borderColor: "var(--drag-overlay-border)",
        boxShadow: "var(--drag-overlay-shadow)",
      }}
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-primary border opacity-95 select-none"
    >
      <GripVertical className="w-3 h-3 text-muted shrink-0" />
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded shrink-0 text-micro font-bold"
        style={{
          backgroundColor: typeDef?.badgeBg || "var(--bg-muted)",
          color: typeDef?.color || "var(--text-primary)",
        }}
      >
        <Icon className="w-3 h-3 stroke-[2.2]" />
        <span>{index + 1}</span>
      </div>
      <span className="truncate max-w-[140px]">
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
    <aside className="w-60 md:w-56 lg:w-60 bg-surface-subtle border-r border-default flex flex-col shrink-0 h-full overflow-hidden select-none transition-colors">
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
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
        {/* ── 1. PAGES SECTION ─────────────────────────────────────────── */}
        <div>
          {/* Header */}
          <div className="px-1 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Pages</span>
            {/* Logic Overview Toggle */}
            <button
              type="button"
              onClick={() => setShowLogicOverview(!showLogicOverview)}
              className={clsx(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-micro font-medium transition-colors cursor-pointer",
                showLogicOverview
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted hover:text-primary hover:bg-surface-hover"
              )}
              title="Toggle logic jumps overview"
              data-testid="toggle-logic-overview-btn"
            >
              <GitFork className="w-3 h-3" />
              <span>Logic</span>
            </button>
          </div>

          {/* Card Container */}
          <div className="bg-surface rounded-xl border border-default p-1.5 shadow-card space-y-1">
            {/* 1. Welcome Screen Row at top of Pages (Screenshot 1) */}
            <div
              onClick={() => {
                selectQuestion("welcome");
                onCloseMobile?.();
              }}
              data-testid="step-welcome"
              className={clsx(
                "group flex items-center justify-between gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer select-none",
                selectedId === "welcome"
                  ? "bg-muted text-primary shadow-xs font-semibold border border-default"
                  : "hover:bg-surface-hover text-secondary hover:text-primary"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-secondary shrink-0">
                  <MonitorSmartphone className="w-3 h-3" />
                </div>
                <span className="truncate flex-1 text-caption leading-tight text-primary">
                  {form?.welcome_title || "Welcome Screen"}
                </span>
              </div>
            </div>

            {/* 2. Sortable Questions */}
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
                <div className="space-y-0.5">
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
              <DragOverlay>
                {activeQuestion ? (
                  <DraggingItemOverlay question={activeQuestion} index={activeQuestionIndex} />
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* + Add content button inside the card at bottom (Screenshot 2) */}
            <button
              type="button"
              onClick={onOpenAddModal}
              data-testid="add-content-btn"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors border-t border-default mt-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add content</span>
            </button>
          </div>
        </div>

        {/* ── 2. PERSONALIZE WITH BRANCHING CALLOUT (Screenshot 1 & 2) ─── */}
        <div
          onClick={() => setShowLogicOverview(!showLogicOverview)}
          className="rounded-xl border border-default p-2.5 flex items-center justify-between text-xs font-medium bg-surface hover:bg-surface-hover text-primary transition-all cursor-pointer shadow-card"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-primary truncate">Personalize with branching</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
        </div>

        {/* ── 3. HORIZONTAL SEPARATOR DASH ──────────────────────────── */}
        <div className="flex justify-center my-1" aria-hidden="true">
          <div className="w-8 h-0.5 bg-border-strong rounded-full" />
        </div>

        {/* ── 4. ENDINGS SECTION (Screenshot 1 & 2) ─────────────────── */}
        <div>
          <div className="px-1 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Endings</span>
            <button
              type="button"
              onClick={() => selectQuestion("thank_you")}
              title="Add ending"
              className="p-1 rounded text-muted hover:text-primary hover:bg-surface-hover cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-surface rounded-xl border border-default p-1.5 shadow-card">
            <div
              onClick={() => {
                selectQuestion("thank_you");
                onCloseMobile?.();
              }}
              data-testid="step-thank-you"
              className={clsx(
                "group flex items-center justify-between gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer select-none",
                selectedId === "thank_you"
                  ? "bg-muted text-primary shadow-xs font-semibold border border-default"
                  : "hover:bg-surface-hover text-secondary hover:text-primary"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded shrink-0 text-micro font-bold bg-neutral-200/70 dark:bg-neutral-800 text-secondary">
                  <span>A</span>
                </div>
                <span className="truncate flex-1 text-caption leading-tight text-primary">
                  {form?.thank_you_title || "Thank you for sharing your..."}
                </span>
              </div>
            </div>
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
