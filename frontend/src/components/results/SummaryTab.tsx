"use client";

import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  Inbox,
  ExternalLink,
  Share2,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Form, FormSummary, Question } from "@/types";
import { QUESTION_TYPES } from "@/lib/questionTypes";
import { Button } from "@/components/ui/Button";
import { downloadCsv } from "@/lib/api";
import { formatDuration, formatPercentage } from "@/lib/formatters";

interface SummaryTabProps {
  form: Form;
  summary: FormSummary | null;
  isLoading: boolean;
  onSwitchToResponses: () => void;
  avgDurationFormatted: string;
}

export function SummaryTab({
  form,
  summary,
  isLoading,
  onSwitchToResponses,
  avgDurationFormatted,
}: SummaryTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const formUrl = form.slug ? `${origin}/f/${form.slug}` : `${origin}/f/${form.id}`;
    navigator.clipboard
      .writeText(formUrl)
      .then(() => {
        setCopiedLink(true);
        toast.success("Form link copied to clipboard", { duration: 3000 });
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const filename = await downloadCsv(form.id);
      toast.success(`Downloaded "${filename}"`, { duration: 3500 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed. Please try again.";
      toast.error(message, { duration: 5000 });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-default p-5 space-y-3">
              <div className="h-4 w-24 bg-skeleton rounded-md" />
              <div className="h-8 w-16 bg-skeleton rounded-lg" />
            </div>
          ))}
        </div>

        {/* Question Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-default p-6 space-y-3">
              <div className="h-4 w-48 bg-skeleton rounded-md" />
              <div className="h-3 w-full bg-skeleton rounded-full" />
              <div className="h-3 w-4/5 bg-skeleton rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const overall = summary?.overall;
  const startedCount = overall?.started ?? summary?.total_responses ?? 0;
  const completedCount = overall?.completed ?? summary?.completed_responses ?? 0;
  const partialCount = overall?.partial ?? Math.max(0, startedCount - completedCount);

  // Completion rate (percentage)
  const rawCompRate =
    overall?.completion_rate !== undefined
      ? overall.completion_rate <= 1.0
        ? overall.completion_rate * 100
        : overall.completion_rate
      : (summary?.completion_rate ?? 0);
  const compRateDisplay = formatPercentage(rawCompRate);

  // Average time formatted
  const formattedAvgTime = formatDuration(
    overall?.average_completion_seconds,
    avgDurationFormatted
  );

  // Friendly Empty State when there are no responses
  if (startedCount === 0) {
    return (
      <div className="bg-card rounded-3xl border border-default p-8 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-default text-secondary flex items-center justify-center mx-auto">
          <Inbox className="w-8 h-8 stroke-[1.75]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">
            No responses yet
          </h2>
          <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
            Once people start answering your form, your response summary analytics and charts will appear here live.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? "Link copied!" : "Copy form link"}
          </Button>
          <Link href={`/forms/${form.id}/share`}>
            <Button variant="outline" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5 text-secondary" />}>
              Share options
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
            {isExporting ? "Exporting..." : "Export CSV"}
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

  // Create lookup for form questions by ID
  const questionMap = new Map<number | string, Question>();
  for (const q of form.questions || []) {
    questionMap.set(Number(q.id), q);
    questionMap.set(String(q.id), q);
  }

  // Helper to map option IDs to labels
  const getOptionLabel = (questionId: number, rawOpt: string): string => {
    const q = questionMap.get(questionId);
    if (!q || !q.properties?.options) return rawOpt;
    const match = (q.properties.options as Array<{ id: string; label: string }>).find(
      (o) => o.id === rawOpt || o.label === rawOpt
    );
    return match?.label || rawOpt;
  };

  const dropoffList = summary?.dropoff || [];
  const maxReached = Math.max(...dropoffList.map((d) => d.reached_count), startedCount, 1);

  // Find question with highest drop-off rate among questions where drops > 0
  const maxDropoffPct = dropoffList.reduce(
    (max, item) =>
      item.dropped_here_count > 0 && item.dropoff_percent > max
        ? item.dropoff_percent
        : max,
    0
  );
  const highestDropoffQId = dropoffList.find(
    (item) => item.dropped_here_count > 0 && item.dropoff_percent === maxDropoffPct
  )?.question_id;

  return (
    <div className="space-y-6">
      {/* Top action header with Export CSV button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-default shadow-card">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-primary">Executive Summary</h2>
          <p className="text-xs text-secondary font-medium mt-0.5">Live overview of form performance, completion rates, and drop-off</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={isExporting}
          isLoading={isExporting}
          leftIcon={!isExporting ? <Download className="w-3.5 h-3.5 text-secondary" /> : undefined}
          className="text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* 1. Top Stat Cards (Responses started, Completed, Completion rate %, Avg time) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Responses started */}
        <div className="bg-card rounded-2xl border border-default p-5 sm:p-6 shadow-card space-y-2">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Responses started</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">
            {startedCount.toLocaleString()}
          </div>
          <p className="text-xs text-secondary">
            {partialCount.toLocaleString()} in-progress / abandoned
          </p>
        </div>

        {/* Completed */}
        <div className="bg-card rounded-2xl border border-default p-5 sm:p-6 shadow-card space-y-2">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">
            {completedCount.toLocaleString()}
          </div>
          <p className="text-xs text-secondary">
            Submissions finalized
          </p>
        </div>

        {/* Completion rate (%) */}
        <div className="bg-card rounded-2xl border border-default p-5 sm:p-6 shadow-card space-y-2">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">
            {compRateDisplay}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, rawCompRate)}%` }}
            />
          </div>
        </div>

        {/* Avg time ("1m 42s") */}
        <div className="bg-card rounded-2xl border border-default p-5 sm:p-6 shadow-card space-y-2">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg. completion time</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">
            {formattedAvgTime}
          </div>
          <p className="text-xs text-secondary">Start to final submit</p>
        </div>
      </div>

      {/* 2. Drop-off by question Card */}
      <div className="bg-card rounded-2xl border border-default p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-primary">Drop-off by question</h2>
              <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-muted text-secondary">
                Funnel
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Horizontal bars show respondents reached per step, highlighting where users abandon the form.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-secondary shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#4b4654] dark:bg-[#94a3b8]" />
              <span>Reached question</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
              <span>Highest drop-off</span>
            </div>
          </div>
        </div>

        {dropoffList.length === 0 ? (
          <p className="text-xs text-secondary italic py-4">No question steps defined yet.</p>
        ) : (
          <div className="space-y-3">
            {dropoffList.map((item, idx) => {
              const isHighestDrop = highestDropoffQId === item.question_id && item.dropped_here_count > 0;
              const reachedPercent = maxReached > 0 ? (item.reached_count / maxReached) * 100 : 0;

              return (
                <div
                  key={item.question_id}
                  className={`group relative rounded-xl p-3 transition-colors ${
                    isHighestDrop
                      ? "bg-rose-500/10 border border-rose-500/30"
                      : "hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  {/* Tooltip on hover with exact numbers */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-popover text-primary text-xs rounded-xl py-2 px-3 shadow-dropdown whitespace-nowrap border border-default">
                    <p className="font-semibold text-primary mb-1">
                      {idx + 1}. {item.title}
                    </p>
                    <div className="space-y-0.5 text-secondary text-micro">
                      <div className="flex items-center justify-between gap-4">
                        <span>Reached:</span>
                        <span className="font-medium text-primary">
                          {item.reached_count.toLocaleString()} respondents (
                          {startedCount > 0 ? Math.round((item.reached_count / startedCount) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Dropped here:</span>
                        <span className={`font-semibold ${item.dropped_here_count > 0 ? "text-rose-500" : "text-muted"}`}>
                          {item.dropped_here_count.toLocaleString()} ({item.dropoff_percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Completed past here:</span>
                        <span className="font-medium text-emerald-500">
                          {Math.max(0, item.reached_count - item.dropped_here_count).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header row: question title and aligned reached/dropped stats */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-secondary w-5 shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-primary truncate">
                        {item.title}
                      </span>
                      {isHighestDrop && (
                        <span className="inline-flex items-center gap-1 text-micro font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 shrink-0 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Highest drop-off
                        </span>
                      )}
                    </div>

                    {/* Aligned Right: reached count + dropped count on the same row */}
                    <div className="shrink-0 flex items-center gap-2 text-right text-xs">
                      <span className="font-medium text-secondary">
                        {item.reached_count.toLocaleString()} reached
                      </span>
                      <span className="text-muted">·</span>
                      {item.dropped_here_count > 0 ? (
                        <span
                          className={`font-semibold ${
                            isHighestDrop ? "text-rose-500 font-bold" : "text-secondary"
                          }`}
                        >
                          {item.dropped_here_count} dropped ({item.dropoff_percent.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="font-normal text-muted">
                          No drop-off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="flex items-center gap-3">
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHighestDrop ? "bg-rose-500" : "bg-[#4b4654] dark:bg-[#94a3b8]"
                        }`}
                        style={{
                          width: `${Math.max(reachedPercent, item.reached_count > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-secondary font-mono shrink-0 w-8 text-right">
                      {item.reached_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Per-Question Summary Cards */}
      <div className="space-y-4">
        {(summary?.questions || []).map((qSummary, index) => {
          const typeDef = QUESTION_TYPES[qSummary.type];
          const Icon = typeDef?.icon || Users;
          const originalQ = questionMap.get(qSummary.question_id);

          return (
            <div
              key={qSummary.question_id}
              className="bg-card rounded-2xl border border-default p-5 sm:p-6 shadow-card space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: typeDef?.badgeBg || "var(--bg-muted)",
                      color: typeDef?.color || "var(--text-primary)",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-primary truncate">
                    <span className="text-secondary mr-2">{index + 1}.</span>
                    {qSummary.title}
                  </h3>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface text-secondary border border-default shrink-0">
                  {qSummary.total_answered.toLocaleString()} answered
                </span>
              </div>

              {/* Question Analytics Breakdown */}
              <div className="pt-1">
                {/* A. Choice / Dropdown / Yes_No: Horizontal Bar Chart */}
                {["multiple_choice", "dropdown", "yes_no"].includes(qSummary.type) && (
                  <div className="space-y-3">
                    {!qSummary.options_breakdown || qSummary.options_breakdown.length === 0 ? (
                      <p className="text-xs text-secondary italic">No responses recorded yet.</p>
                    ) : (
                      qSummary.options_breakdown
                        .filter((item) => item.count > 0 || qSummary.total_answered === 0)
                        .map((item, optIdx) => (
                          <div key={optIdx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-primary">
                              <span className="truncate max-w-[70%]">
                                {getOptionLabel(qSummary.question_id, item.option)}
                              </span>
                              <span className="text-secondary text-xs shrink-0">
                                {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%`,
                                  backgroundColor: typeDef?.color || "var(--chart-bar-fill, #3b82f6)",
                                }}
                              />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* B. Rating: Big average number + distribution bars */}
                {qSummary.type === "rating" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-bold text-primary">
                        <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                        <span>
                          {qSummary.numeric_stats?.average !== null &&
                          qSummary.numeric_stats?.average !== undefined
                            ? qSummary.numeric_stats.average.toFixed(1)
                            : "—"}
                        </span>
                      </div>
                      <span className="text-xs text-secondary">
                        average rating out of {Number(originalQ?.properties?.steps || 5)}
                      </span>
                    </div>

                    {/* Distribution bars */}
                    <div className="space-y-2 pt-1">
                      {Array.from({ length: Number(originalQ?.properties?.steps || 5) })
                        .map((_, i) => i + 1)
                        .reverse()
                        .map((ratingVal) => {
                          const count =
                            qSummary.numeric_stats?.distribution?.[String(ratingVal)] || 0;
                          const pct =
                            qSummary.total_answered > 0
                              ? Math.round((count / qSummary.total_answered) * 100)
                              : 0;

                          return (
                            <div key={ratingVal} className="flex items-center gap-3 text-xs">
                              <span className="w-8 font-semibold text-secondary text-right">
                                {ratingVal} ★
                              </span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-14 text-secondary text-right font-mono">
                                {count.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* C. Number: Average, Min, Max */}
                {qSummary.type === "number" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-surface rounded-xl border border-default text-center space-y-1">
                      <span className="text-micro font-semibold text-secondary uppercase tracking-wider">
                        Average
                      </span>
                      <div className="text-lg sm:text-xl font-bold text-primary">
                        {qSummary.numeric_stats?.average !== null &&
                        qSummary.numeric_stats?.average !== undefined
                          ? qSummary.numeric_stats.average.toFixed(1)
                          : "—"}
                      </div>
                    </div>
                    <div className="p-3.5 bg-surface rounded-xl border border-default text-center space-y-1">
                      <span className="text-micro font-semibold text-secondary uppercase tracking-wider">
                        Min
                      </span>
                      <div className="text-lg sm:text-xl font-bold text-primary">
                        {qSummary.numeric_stats?.min !== null &&
                        qSummary.numeric_stats?.min !== undefined
                          ? qSummary.numeric_stats.min.toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div className="p-3.5 bg-surface rounded-xl border border-default text-center space-y-1">
                      <span className="text-micro font-semibold text-secondary uppercase tracking-wider">
                        Max
                      </span>
                      <div className="text-lg sm:text-xl font-bold text-primary">
                        {qSummary.numeric_stats?.max !== null &&
                        qSummary.numeric_stats?.max !== undefined
                          ? qSummary.numeric_stats.max.toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                )}

                {/* D. Text / Email: 5 most recent answers + View all link */}
                {["short_text", "long_text", "email"].includes(qSummary.type) && (
                  <div className="space-y-2">
                    {!qSummary.text_stats?.recent_answers ||
                    qSummary.text_stats.recent_answers.length === 0 ? (
                      <p className="text-xs text-secondary italic">No text answers submitted yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {qSummary.text_stats.recent_answers.slice(0, 5).map((ans, aIdx) => (
                            <div
                              key={aIdx}
                              className="p-3.5 bg-surface/80 hover:bg-surface rounded-xl border border-default text-xs sm:text-sm text-primary leading-relaxed flex items-start gap-2.5 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                              <span className="flex-1 break-words line-clamp-3">{ans}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={onSwitchToResponses}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
                          >
                            <span>View all {qSummary.total_answered.toLocaleString()} responses</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* E. File Upload: N files uploaded */}
                {qSummary.type === "file_upload" && (
                  <div className="space-y-3">
                    <div className="p-4 bg-surface rounded-xl border border-default flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center shrink-0">
                          <Upload className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-primary">
                            {qSummary.total_answered.toLocaleString()} {qSummary.total_answered === 1 ? "file" : "files"}
                          </div>
                          <p className="text-xs text-secondary">
                            uploaded by respondents
                          </p>
                        </div>
                      </div>

                      {qSummary.total_answered > 0 && (
                        <button
                          type="button"
                          onClick={onSwitchToResponses}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-default text-xs font-semibold text-primary hover:bg-surface transition-colors cursor-pointer"
                        >
                          <span>View in table</span>
                          <ArrowRight className="w-3.5 h-3.5 text-secondary" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
