"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Form, Question, ResponseRecord } from "@/types";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BASE_URL } from "@/lib/api";
import { formatDateWithRelative, formatDuration } from "@/lib/formatters";

interface ResponseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  response: ResponseRecord | null;
  onDeleteResponse: (responseId: number) => Promise<void>;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export function ResponseDetailDrawer({
  isOpen,
  onClose,
  form,
  response,
  onDeleteResponse,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
  currentIndex,
  totalCount,
}: ResponseDetailDrawerProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close on Escape, navigate on Arrow keys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onNavigatePrev?.();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onNavigateNext?.();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, onNavigatePrev, onNavigateNext]);

  if (!isOpen || !response) return null;

  // Build answer map: question_id -> value
  const answerMap = new Map<number | string, unknown>();
  for (const ans of response.answers || []) {
    answerMap.set(ans.question_id, ans.value);
  }

  // Date and duration calculations
  const dateInfo = formatDateWithRelative(response.submitted_at || response.started_at);
  const durationStr =
    response.is_complete && response.started_at && response.submitted_at
      ? formatDuration(
          Math.max(
            0,
            (new Date(response.submitted_at).getTime() - new Date(response.started_at).getTime()) / 1000
          )
        )
      : null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteResponse(response.id);
      setShowConfirmDelete(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const resolveOptionLabel = (item: unknown, q?: Question): string => {
    if (item === null || item === undefined) return "";
    if (typeof item === "object" && item !== null && "label" in item) {
      return String((item as { label: unknown }).label);
    }
    const strVal = String(item);
    const options = (q?.properties?.options || []) as Array<{ id: string; label: string }>;
    const match = options.find((o) => o.id === strVal || o.label === strVal);
    return match?.label || strVal;
  };

  const formatValue = (val: unknown, q?: Question): React.ReactNode => {
    if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
      return <span className="text-muted italic">Not answered</span>;
    }

    if (q?.type === "file_upload" || (typeof val === "object" && val !== null && "filename" in val)) {
      const filename =
        typeof val === "object" && val !== null && "filename" in val
          ? String((val as { filename: unknown }).filename)
          : String(val);
      const uploadId =
        typeof val === "object" && val !== null && "upload_id" in val
          ? (val as { upload_id: unknown }).upload_id
          : val;
      const downloadUrl = `${BASE_URL}/api/forms/${form.id}/uploads/${uploadId}`;

      return (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="font-semibold text-xs text-primary truncate max-w-[280px]">
            {filename}
          </span>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 text-xs font-semibold hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download file</span>
          </a>
        </div>
      );
    }

    if (q?.type === "yes_no" || typeof val === "boolean") {
      if (typeof val === "boolean") return val ? "Yes" : "No";
      const s = String(val).toLowerCase();
      if (s === "true" || s === "yes" || s === "1") return "Yes";
      if (s === "false" || s === "no" || s === "0") return "No";
      return String(val);
    }

    if (Array.isArray(val)) {
      return val
        .map((v) => resolveOptionLabel(v, q))
        .filter(Boolean)
        .join(", ");
    }

    if (["multiple_choice", "dropdown"].includes(q?.type || "")) {
      return resolveOptionLabel(val, q);
    }

    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }

    return String(val);
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Response details"
        className="fixed inset-0 z-50 overflow-hidden flex justify-end"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div className="relative w-full max-w-xl sm:max-w-2xl bg-drawer border-l border-default h-full shadow-drawer z-10 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="px-6 py-5 border-b border-default flex items-center justify-between shrink-0 bg-surface">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-lg text-primary">
                  Response #{response.id}
                </h2>
                {response.is_complete ? (
                  <span className="inline-flex items-center gap-1 text-micro font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-micro font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Partial</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-secondary flex-wrap">
                <div
                  className="flex items-center gap-1.5 cursor-help"
                  title={dateInfo.tooltip}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hover:underline decoration-dotted">{dateInfo.display}</span>
                </div>
                {durationStr && (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Time: {durationStr}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Header Navigation Controls */}
            <div className="flex items-center gap-1.5">
              {totalCount !== undefined && totalCount > 0 && (
                <span className="text-xs text-secondary font-medium mr-1.5 hidden sm:inline">
                  {currentIndex} of {totalCount}
                </span>
              )}
              <button
                type="button"
                onClick={onNavigatePrev}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg border border-default text-primary hover:bg-surface-hover disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Previous response (Left / Up arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNavigateNext}
                disabled={!hasNext}
                className="p-1.5 rounded-lg border border-default text-primary hover:bg-surface-hover disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Next response (Right / Down arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer ml-1"
                title="Close drawer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Questions & Answers List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              Submitted answers ({response.answers?.length || 0})
            </h3>

            {(form.questions || []).map((q, idx) => {
              const typeDef = QUESTION_TYPES[q.type];
              const Icon = typeDef?.icon || CheckCircle2;
              const val = answerMap.get(Number(q.id)) ?? answerMap.get(String(q.id));

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-default bg-surface space-y-2.5 transition-colors hover:border-focus"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary">
                      {idx + 1}.
                    </span>
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: typeDef?.badgeBg || "var(--bg-muted)",
                        color: typeDef?.color || "inherit",
                      }}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-primary leading-snug">
                      {q.title}
                    </span>
                  </div>

                  <div className="pl-6 text-sm text-primary font-medium leading-relaxed break-words bg-card p-3 rounded-lg border border-default">
                    {formatValue(val, q)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-default bg-surface flex items-center justify-between shrink-0">
            <span className="text-xs text-secondary font-mono">
              ID: #{response.id}
            </span>

            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setShowConfirmDelete(true)}
            >
              Delete response
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Delete this response?"
        description={`Are you sure you want to delete response #${response.id}? This action cannot be undone and will update your form summary analytics.`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>All recorded answers for this respondent will be permanently deleted.</span>
        </div>
      </Modal>
    </>
  );
}
