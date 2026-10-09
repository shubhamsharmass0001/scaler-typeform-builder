"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Download,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Share2,
  ExternalLink,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Form, PaginatedResponses, ResponseRecord } from "@/types";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { Button } from "@/components/ui/Button";
import { downloadCsv, BASE_URL } from "@/lib/api";
import { formatDateWithRelative } from "@/lib/formatters";

interface ResponsesTabProps {
  form: Form;
  responsesData: PaginatedResponses | null;
  isLoading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
  onSelectResponse: (response: ResponseRecord) => void;
  statusFilter?: "" | "completed" | "partial";
  onStatusFilterChange?: (newFilter: "" | "completed" | "partial") => void;
}

export function ResponsesTab({
  form,
  responsesData,
  isLoading,
  page,
  onPageChange,
  onSelectResponse,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
}: ResponsesTabProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [internalFilter, setInternalFilter] = useState<"" | "completed" | "partial">("");
  const statusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : internalFilter;
  const setStatus = (f: "" | "completed" | "partial") => {
    if (onStatusFilterChange) {
      onStatusFilterChange(f);
    } else {
      setInternalFilter(f);
    }
    setSelectedIds([]);
  };

  const [isExporting, setIsExporting] = useState(false);

  // Column visibility state
  const questions = form.questions || [];
  const [visibleColumnMap, setVisibleColumnMap] = useState<Record<string | number, boolean>>(() => {
    const initial: Record<string | number, boolean> = {};
    for (const q of questions) {
      initial[q.id] = true;
    }
    return initial;
  });

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Close column picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setIsColumnPickerOpen(false);
      }
    }
    if (isColumnPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnPickerOpen]);

  const toggleColumnVisibility = (qId: string | number) => {
    setVisibleColumnMap((prev) => ({
      ...prev,
      [qId]: prev[qId] === false ? true : false,
    }));
  };

  const showAllColumns = () => {
    const all: Record<string | number, boolean> = {};
    for (const q of questions) all[q.id] = true;
    setVisibleColumnMap(all);
  };

  const hideAllColumns = () => {
    const none: Record<string | number, boolean> = {};
    for (const q of questions) none[q.id] = false;
    setVisibleColumnMap(none);
  };

  const visibleQuestions = questions.filter((q) => visibleColumnMap[q.id] !== false);
  const visibleCount = visibleQuestions.length;

  const handleExportCsv = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const filename = await downloadCsv(form.id, statusFilter || undefined);
      toast.success(`Downloaded "${filename}"`, { duration: 3500 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed. Please try again.";
      toast.error(message, { duration: 5000 });
    } finally {
      setIsExporting(false);
    }
  }, [form.id, isExporting, statusFilter]);

  const items = responsesData?.items || [];
  const total = responsesData?.total || 0;
  const totalPages = responsesData?.total_pages || 1;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) {
      if (val.length === 0) return "—";
      return val
        .map((v) =>
          typeof v === "object" && v !== null && "label" in v
            ? String(v.label)
            : String(v)
        )
        .join(", ");
    }
    if (typeof val === "object" && val !== null) {
      if ("filename" in val) {
        return String((val as { filename: unknown }).filename);
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-default p-12 text-center animate-pulse space-y-4">
        <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto opacity-40" />
        <p className="text-xs text-secondary">Loading responses...</p>
      </div>
    );
  }

  // Friendly Empty State when there are no responses at all
  if (total === 0 && statusFilter === "") {
    return (
      <div className="bg-surface rounded-3xl border border-default p-8 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-2xs">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-subtle text-secondary flex items-center justify-center mx-auto">
          <Inbox className="w-8 h-8 stroke-[1.75]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">
            No responses collected yet
          </h2>
          <p className="text-sm text-secondary leading-relaxed max-w-sm mx-auto">
            Once people submit answers to your form, every submission will appear in this table in real-time.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/forms/${form.id}/share`}>
            <Button variant="primary" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />}>
              Share form link
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            isLoading={isExporting}
            leftIcon={!isExporting ? <Download className="w-3.5 h-3.5 text-secondary" /> : undefined}
          >
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
          {form.slug && (
            <a
              href={`/f/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-hover rounded-xl border border-default transition-colors"
            >
              <span>View live form</span>
              <ExternalLink className="w-3.5 h-3.5 text-secondary" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-default shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-base text-primary">
            {total} {total === 1 ? "Response" : "Responses"}
          </span>
          {statusFilter && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-secondary font-medium capitalize border border-default">
              {statusFilter}
            </span>
          )}
          {selectedIds.length > 0 && (
            <span className="text-xs text-secondary font-medium">
              ({selectedIds.length} selected)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Segmented Control */}
          <div
            role="group"
            aria-label="Filter responses by status"
            className="flex items-center bg-muted p-0.5 rounded-xl border border-default text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => setStatus("")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === ""
                  ? "bg-surface text-primary font-semibold shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatus("completed")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-surface text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setStatus("partial")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "partial"
                  ? "bg-surface text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Partial
            </button>
          </div>

          {/* Column Visibility Dropdown Toggle */}
          <div className="relative" ref={columnPickerRef}>
            <button
              type="button"
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-default text-xs font-semibold text-primary hover:bg-surface-hover bg-surface transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-secondary" />
              <span>Columns ({visibleCount}/{questions.length})</span>
            </button>

            {isColumnPickerOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl border border-default shadow-dropdown z-40 p-2 space-y-2 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-default px-1 text-xs text-secondary">
                  <span className="font-semibold text-primary">Toggle Columns</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={showAllColumns}
                      className="text-nano hover:text-primary underline cursor-pointer"
                    >
                      Show all
                    </button>
                    <button
                      type="button"
                      onClick={hideAllColumns}
                      className="text-nano hover:text-primary underline cursor-pointer"
                    >
                      Hide all
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {questions.map((q, qIdx) => {
                    const isVisible = visibleColumnMap[q.id] !== false;
                    const typeDef = QUESTION_TYPES[q.type];
                    const Icon = typeDef?.icon || Clock;

                    return (
                      <label
                        key={q.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-xs cursor-pointer select-none transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumnVisibility(q.id)}
                          className="rounded border-default text-primary focus:ring-0 cursor-pointer"
                        />
                        <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate flex-1 font-medium text-primary">
                          {qIdx + 1}. {q.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Download CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            isLoading={isExporting}
            leftIcon={!isExporting ? <Download className="w-3.5 h-3.5 text-secondary" /> : undefined}
            className="text-xs font-semibold"
          >
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
        </div>
      </div>

      {/* 2. Responses Data Table with Sticky First Columns */}
      <div className="bg-card rounded-2xl border border-default shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-default bg-surface text-micro font-semibold text-secondary uppercase tracking-wider select-none h-11">
                {/* 1. Sticky Checkbox column */}
                <th className="py-3 px-3 w-11 min-w-[44px] text-center sticky left-0 bg-surface z-20">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-default text-primary focus:ring-0 cursor-pointer"
                  />
                </th>

                {/* 2. Sticky Response ID */}
                <th className="py-3 px-3 w-14 min-w-[56px] sticky left-[44px] bg-surface z-20">
                  #
                </th>

                {/* 3. Sticky Submitted Date */}
                <th className="py-3 px-4 w-44 min-w-[176px] sticky left-[100px] bg-surface z-20">
                  Submitted
                </th>

                {/* 4. Sticky Status Badge with right border divider */}
                <th className="py-3 px-4 w-30 min-w-[120px] sticky left-[276px] bg-surface z-20 border-r border-default shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                  Status
                </th>

                {/* Dynamic Visible Question Columns */}
                {visibleQuestions.map((q) => {
                  const typeDef = QUESTION_TYPES[q.type];
                  const Icon = typeDef?.icon || Clock;

                  return (
                    <th
                      key={q.id}
                      className="py-3 px-4 min-w-[180px] max-w-[260px] truncate"
                      title={q.title}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: typeDef?.color }}
                        />
                        <span className="truncate">{q.title}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-default text-xs text-primary">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + visibleQuestions.length}
                    className="py-12 px-4 text-center text-xs text-secondary"
                  >
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-sm text-primary">
                        No {statusFilter || ""} responses found
                      </p>
                      <p className="text-xs text-secondary">
                        There are no responses matching this filter.
                      </p>
                      {statusFilter && (
                        <button
                          type="button"
                          onClick={() => setStatus("")}
                          className="mt-2 text-xs font-semibold text-blue-500 hover:text-blue-400 underline cursor-pointer"
                        >
                          View all responses
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const answerMap = new Map<number | string, unknown>();
                  for (const ans of row.answers || []) {
                    answerMap.set(ans.question_id, ans.value);
                  }

                  const isChecked = selectedIds.includes(row.id);
                  const dateInfo = formatDateWithRelative(row.submitted_at || row.started_at);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelectResponse(row)}
                      className="hover:bg-surface-hover transition-colors cursor-pointer group h-12"
                    >
                      {/* 1. Sticky Checkbox */}
                      <td
                        className="py-3 px-3 text-center sticky left-0 bg-card group-hover:bg-surface-hover transition-colors z-10"
                        onClick={(e) => handleSelectRow(row.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-default text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* 2. Sticky ID */}
                      <td className="py-3 px-3 font-semibold text-secondary sticky left-[44px] bg-card group-hover:bg-surface-hover transition-colors z-10">
                        #{row.id}
                      </td>

                      {/* 3. Sticky Submitted Date with relative tooltip */}
                      <td className="py-3 px-4 font-medium text-primary whitespace-nowrap sticky left-[100px] bg-card group-hover:bg-surface-hover transition-colors z-10">
                        <span
                          title={dateInfo.tooltip}
                          className="cursor-help hover:underline decoration-dotted decoration-default"
                        >
                          {row.submitted_at ? (
                            dateInfo.display
                          ) : (
                            <span className="text-secondary italic">In progress</span>
                          )}
                        </span>
                      </td>

                      {/* 4. Sticky Status Badge with divider */}
                      <td className="py-3 px-4 whitespace-nowrap sticky left-[276px] bg-card group-hover:bg-surface-hover transition-colors z-10 border-r border-default shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        {row.is_complete ? (
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
                      </td>

                      {/* Dynamic Question Cells */}
                      {visibleQuestions.map((q) => {
                        const val = answerMap.get(Number(q.id)) ?? answerMap.get(String(q.id));

                        if (q.type === "file_upload" && val) {
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
                            <td
                              key={q.id}
                              className="py-3 px-4 max-w-[260px] truncate font-normal leading-relaxed text-primary"
                            >
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline truncate max-w-[220px]"
                                title={`Download ${filename}`}
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{filename}</span>
                              </a>
                            </td>
                          );
                        }

                        const formatted = formatCellValue(val);

                        return (
                          <td
                            key={q.id}
                            className="py-3 px-4 max-w-[260px] truncate font-normal leading-relaxed text-primary"
                            title={formatted}
                          >
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Server-side Pagination Bar */}
        <div className="px-5 py-3.5 border-t border-default bg-surface/50 flex items-center justify-between text-xs text-secondary">
          <div>
            Showing <span className="font-semibold text-primary">{total > 0 ? (page - 1) * 20 + 1 : 0}</span> to{" "}
            <span className="font-semibold text-primary">{Math.min(page * 20, total)}</span> of{" "}
            <span className="font-semibold text-primary">{total}</span> responses
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-default hover:bg-surface-hover text-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-semibold text-primary">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-default hover:bg-surface-hover text-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
