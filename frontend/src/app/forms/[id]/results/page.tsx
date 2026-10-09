"use client";

/**
 * app/forms/[id]/results/page.tsx — Results & Analytics Tab
 *
 * Implements:
 *   - Shared builder top bar ([Create | Share | Results])
 *   - Sub-tab switcher: Summary | Responses
 *   - Summary Tab:
 *     * Top stat cards: Total responses, Completion rate, Average completion time
 *     * Per-question cards: Choice/Dropdown horizontal bar charts, Rating averages & distributions,
 *       Number min/avg/max, Text/email recent 5 answers + "View all" link
 *     * Skeleton loading + friendly empty state
 *   - Responses Tab:
 *     * Table with checkbox, submitted date/time, completion status badge, dynamic question columns
 *     * Server-side pagination (newest first)
 *     * Row click opens slide-out drawer
 *     * "Download CSV" action
 *   - Response Detail Drawer:
 *     * Full answer inspection per question
 *     * Delete response button with confirm modal + toast, live updating stats
 */

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  BarChart2,
  Table,
} from "lucide-react";
import { toast } from "sonner";
import { getForm, getSummary, getResponses, deleteResponse } from "@/lib/api";
import { ResponseRecord } from "@/types";
import { SummaryTab } from "@/components/results/SummaryTab";
import { ResponsesTab } from "@/components/results/ResponsesTab";
import { ResponseDetailDrawer } from "@/components/results/ResponseDetailDrawer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function ResultsPageContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const formIdStr = params?.id as string;
  const formId = Number(formIdStr);

  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "completed" | "partial">("");
  const [selectedResponse, setSelectedResponse] = useState<ResponseRecord | null>(null);

  // 1. Fetch Form
  const {
    data: form,
    isLoading: isFormLoading,
    isError: isFormError,
    error: formError,
  } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => getForm(formId),
    enabled: !isNaN(formId),
  });

  React.useEffect(() => {
    if (form?.title) {
      document.title = `${form.title} | Results | FormCraft`;
    }
  }, [form?.title]);

  // 2. Fetch Summary Analytics
  const {
    data: summary,
    isLoading: isSummaryLoading,
  } = useQuery({
    queryKey: ["form_summary", formId],
    queryFn: () => getSummary(formId),
    enabled: !isNaN(formId),
  });

  // 3. Fetch Paginated Responses
  const {
    data: responsesData,
    isLoading: isResponsesLoading,
  } = useQuery({
    queryKey: ["form_responses", formId, page, statusFilter],
    queryFn: () => getResponses(formId, page, 20, statusFilter || undefined),
    enabled: !isNaN(formId),
  });

  // Calculate average completion time across completed responses
  const avgDurationFormatted = useMemo(() => {
    const items = responsesData?.items || [];
    const completed = items.filter(
      (r) => r.is_complete && r.started_at && r.submitted_at
    );

    if (completed.length === 0) return "—";

    let totalMs = 0;
    let validCount = 0;

    for (const r of completed) {
      const diff =
        new Date(r.submitted_at!).getTime() - new Date(r.started_at).getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        totalMs += diff;
        validCount += 1;
      }
    }

    if (validCount === 0) return "—";

    const avgMs = totalMs / validCount;
    const totalSecs = Math.round(avgMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;

    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }, [responsesData]);

  // Handle Response Deletion
  const handleDeleteResponse = async (responseId: number) => {
    try {
      await deleteResponse(formId, responseId);
      toast.success("Response deleted successfully");

      // Refetch both summary and responses lists
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["form_summary", formId] }),
        queryClient.invalidateQueries({ queryKey: ["form_responses", formId] }),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete response";
      toast.error(msg);
      throw err;
    }
  };

  // Navigation between responses in drawer (must be defined before conditional returns)
  const selectedResponseIndex = useMemo(() => {
    if (!selectedResponse || !responsesData?.items) return -1;
    return responsesData.items.findIndex((r) => r.id === selectedResponse.id);
  }, [selectedResponse, responsesData]);

  const hasPrevResponse = selectedResponseIndex > 0;
  const hasNextResponse =
    selectedResponseIndex !== -1 &&
    Boolean(responsesData?.items && selectedResponseIndex < responsesData.items.length - 1);

  const handleNavigatePrev = React.useCallback(() => {
    if (hasPrevResponse && responsesData?.items) {
      setSelectedResponse(responsesData.items[selectedResponseIndex - 1]);
    }
  }, [hasPrevResponse, responsesData, selectedResponseIndex]);

  const handleNavigateNext = React.useCallback(() => {
    if (hasNextResponse && responsesData?.items) {
      setSelectedResponse(responsesData.items[selectedResponseIndex + 1]);
    }
  }, [hasNextResponse, responsesData, selectedResponseIndex]);

  if (isNaN(formId)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-surface">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-primary">Invalid Form ID</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-3 px-4 py-2 text-xs font-semibold bg-muted rounded-xl text-primary"
        >
          Dashboard
        </button>
      </div>
    );
  }

  if (isFormLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface">
        <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
        <p className="text-xs font-medium text-secondary">Loading results...</p>
      </div>
    );
  }

  if (isFormError || !form) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-surface">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-primary">Failed to load form</h2>
        <p className="text-xs text-secondary mt-1 mb-4">
          {(formError as Error)?.message || "Form not found"}
        </p>
        <Link
          href="/"
          className="px-4 py-2 text-xs font-semibold bg-muted rounded-xl text-primary"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  const isPublished = form.status === "published" && !!form.slug;

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col select-none">
      {/* 1. Shared Builder Top Bar */}
      <header className="h-14 bg-surface border-b border-default px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/forms/${form.id}/edit`}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors shrink-0"
            title="Back to builder"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-sm text-primary truncate">
            {form.title}
          </span>
        </div>

        {/* Center: [Create | Share | Results] Tabs */}
        <nav className="hidden md:flex items-center bg-muted p-1 rounded-xl border border-default">
          <Link
            href={`/forms/${form.id}/edit`}
            className="px-3.5 py-1 text-xs font-medium text-secondary hover:text-primary rounded-lg transition-colors cursor-pointer"
          >
            Create
          </Link>

          <Link
            href={`/forms/${form.id}/share`}
            className="px-3.5 py-1 text-xs font-medium text-secondary hover:text-primary rounded-lg transition-colors cursor-pointer"
          >
            Share
          </Link>

          <button
            type="button"
            className="px-3.5 py-1 text-xs font-semibold rounded-lg bg-surface text-primary shadow-2xs transition-all cursor-pointer"
          >
            Results
          </button>
        </nav>

        {/* Right Status & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isPublished ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Published</span>
              </span>
              <a
                href={`/f/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:underline px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
              >
                <span>Live</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-muted px-2.5 py-1 rounded-lg border border-default">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Draft mode</span>
            </span>
          )}
        </div>
      </header>

      {/* 2. Main Body Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Results Header with Sub-tabs Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Results &amp; Analytics
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              View response trends, completion metrics, and individual submissions.
            </p>
          </div>

          {/* Sub-tabs: Summary vs Responses */}
          <div className="flex items-center bg-muted p-1 rounded-xl border border-default self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "summary"
                  ? "bg-surface text-primary shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("responses")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "responses"
                  ? "bg-surface text-primary shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Responses</span>
              {summary?.total_responses !== undefined && summary.total_responses > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-nano bg-surface text-secondary border border-default font-mono">
                  {summary.total_responses}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Summary Analytics */}
        {activeTab === "summary" && (
          <SummaryTab
            form={form}
            summary={summary ?? null}
            isLoading={isSummaryLoading}
            onSwitchToResponses={() => setActiveTab("responses")}
            avgDurationFormatted={avgDurationFormatted}
          />
        )}

        {/* Tab 2: Individual Responses Table */}
        {activeTab === "responses" && (
          <ResponsesTab
            form={form}
            responsesData={responsesData ?? null}
            isLoading={isResponsesLoading}
            page={page}
            onPageChange={setPage}
            onSelectResponse={(r) => setSelectedResponse(r)}
            statusFilter={statusFilter}
            onStatusFilterChange={(f) => {
              setStatusFilter(f);
              setPage(1);
            }}
          />
        )}
      </main>

      {/* Response Detail Right-Side Drawer with Next/Prev Navigation */}
      <ResponseDetailDrawer
        isOpen={Boolean(selectedResponse)}
        onClose={() => setSelectedResponse(null)}
        form={form}
        response={selectedResponse}
        onDeleteResponse={handleDeleteResponse}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        hasPrev={hasPrevResponse}
        hasNext={hasNextResponse}
        currentIndex={selectedResponseIndex !== -1 ? (page - 1) * 20 + selectedResponseIndex + 1 : undefined}
        totalCount={responsesData?.total || responsesData?.items?.length || 0}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
          <p className="text-xs font-medium text-secondary">Loading results...</p>
        </div>
      }
    >
      <ResultsPageContent />
    </React.Suspense>
  );
}
