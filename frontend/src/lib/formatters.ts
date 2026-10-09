/**
 * lib/formatters.ts
 *
 * Consistent formatting helpers for dates, durations, and percentages
 * matching Typeform results requirements.
 */

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffSec = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

export function formatDateWithRelative(dateStr: string | null | undefined): {
  display: string;
  relative: string;
  tooltip: string;
} {
  if (!dateStr) {
    return { display: "—", relative: "—", tooltip: "" };
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { display: "—", relative: "—", tooltip: "" };
  }

  const display = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const relative = formatRelativeTime(d);
  const tooltip = `${relative} • ${d.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  })}`;

  return { display, relative, tooltip };
}

export function formatDuration(seconds: number | null | undefined, fallback = "—"): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return fallback;
  const s = Math.round(seconds);
  if (s < 0) return "0s";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remainingSec = s % 60;
  return `${m}m ${remainingSec}s`;
}

export function formatPercentage(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0%";
  const num = Number(val);
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  return `${formatted}%`;
}
