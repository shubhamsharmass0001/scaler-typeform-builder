"use client";

/**
 * components/dashboard/FormRow.tsx — Table row representing a form in List View
 *
 * Matches Typeform's workspace table columns:
 * Thumbnail + Title | Responses | Completed | Updated | Integrations | ...
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { FormListItem } from "@/types";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { formatDate } from "@/lib/utils";

interface FormRowProps {
  form: FormListItem;
  onRename: (form: FormListItem) => void;
  onDuplicate: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
  onCopyLink: (form: FormListItem) => void;
}

export function FormRow({
  form,
  onRename,
  onDuplicate,
  onDelete,
  onCopyLink,
}: FormRowProps) {
  const router = useRouter();

  const menuItems: DropdownMenuItem[] = [
    {
      label: "Copy link",
      onClick: () => onCopyLink(form),
    },
    {
      label: "Content",
      dividerBefore: true,
      onClick: () => router.push(`/forms/${form.id}/edit`),
    },
    {
      label: "Workflow",
      onClick: () => router.push(`/forms/${form.id}/edit`),
    },
    {
      label: "Connect",
      onClick: () => router.push(`/forms/${form.id}/edit`),
    },
    {
      label: "Share",
      onClick: () => router.push(`/forms/${form.id}/share`),
    },
    {
      label: "Results",
      onClick: () => router.push(`/forms/${form.id}/results`),
    },
    {
      label: "Rename",
      dividerBefore: true,
      onClick: () => onRename(form),
    },
    {
      label: "Duplicate",
      onClick: () => onDuplicate(form),
    },
    {
      label: "Copy to",
      rightIcon: <ChevronRight className="w-3.5 h-3.5" />,
      onClick: () => alert("Move/Copy to other workspace"),
    },
    {
      label: "Move to",
      rightIcon: <ChevronRight className="w-3.5 h-3.5" />,
      onClick: () => alert("Move/Copy to other workspace"),
    },
    {
      label: "Delete",
      destructive: true,
      dividerBefore: true,
      onClick: () => onDelete(form),
    },
  ];

  // Calculate completed count estimation (or display '-' if 0)
  const hasResponses = form.response_count > 0;
  // Estimate ~80% completion for seeded/calculated values, or show dash
  const completedCount = hasResponses
    ? Math.max(1, Math.round(form.response_count * 0.8))
    : "-";

  // Check if form should have blue squircle (e.g. templates or specific id) vs amber squircle
  const isBlueThumbnail =
    form.title.toLowerCase().includes("template") ||
    form.title.toLowerCase().includes("employee") ||
    form.id === 1;

  return (
    <div
      onClick={() => router.push(`/forms/${form.id}/edit`)}
      className="group bg-white rounded-xl border border-[#ecebf0] px-4 py-3 flex items-center justify-between gap-4 transition-all duration-150 hover:border-[#dcdbe0] hover:bg-[#fafafc] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer select-none"
    >
      {/* Title & Thumbnail Squircle */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Squircle Thumbnail matching Typeform's icon style */}
        <div
          className={`w-8 h-8 rounded-lg ${
            isBlueThumbnail
              ? "bg-[#67b0f0]"
              : "bg-[#b86a34]"
          } shadow-2xs flex items-center justify-center shrink-0`}
        >
          <div className="grid grid-cols-2 gap-0.5 p-1">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>

        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="font-normal sm:font-medium text-[13px] text-[#2d2b33] truncate group-hover:text-[#191919]">
            {form.title}
          </span>
        </div>
      </div>

      {/* Middle & Right columns: Responses | Completed | Updated | Integrations | Actions */}
      <div className="flex items-center gap-8 sm:gap-14 text-[13px] text-[#65636d] shrink-0">
        {/* Responses */}
        <div className="w-16 text-center hidden sm:block">
          <span className="text-[#65636d] font-normal">
            {hasResponses ? form.response_count : "-"}
          </span>
        </div>

        {/* Completed */}
        <div className="w-16 text-center hidden sm:block">
          <span className="text-[#65636d] font-normal">
            {completedCount}
          </span>
        </div>

        {/* Updated Date */}
        <div className="w-24 text-left hidden md:block">
          <span className="text-[#65636d] whitespace-nowrap font-normal">
            {formatDate(form.updated_at)}
          </span>
        </div>

        {/* Integrations icon with small plus badge */}
        <div className="hidden lg:flex items-center justify-center w-8">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              alert("Integrations modal");
            }}
            className="p-1 rounded-md text-gray-500 hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer relative"
            title="Integrations"
          >
            <div className="relative inline-flex items-center justify-center">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 text-[8px] font-bold leading-none">+</span>
            </div>
          </button>
        </div>

        {/* Three-dots menu */}
        <div onClick={(e) => e.stopPropagation()} className="w-8 flex justify-end">
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>
    </div>
  );
}
