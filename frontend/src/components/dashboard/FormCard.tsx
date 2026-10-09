"use client";

/**
 * components/dashboard/FormCard.tsx — Grid view card representing a form
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Inbox,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { FormListItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { formatRelativeTime } from "@/lib/utils";

interface FormCardProps {
  form: FormListItem;
  onRename: (form: FormListItem) => void;
  onDuplicate: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
  onCopyLink: (form: FormListItem) => void;
}

export function FormCard({
  form,
  onRename,
  onDuplicate,
  onDelete,
  onCopyLink,
}: FormCardProps) {
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

  return (
    <div
      onClick={() => router.push(`/forms/${form.id}/edit`)}
      className="group relative bg-card rounded-xl border border-default p-5 flex flex-col justify-between h-[220px] transition-all duration-200 shadow-card hover:border-strong cursor-pointer"
    >
      <div>
        {/* Top bar: preview thumbnail block & dropdown action */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Miniature Typeform-style card preview banner */}
          <div className="w-full h-16 rounded-lg bg-muted border border-default p-2.5 flex flex-col justify-center gap-1.5 transition-colors group-hover:bg-surface-hover overflow-hidden">
            <div className="w-1/2 h-2 rounded-full bg-border-strong opacity-80" />
            <div className="w-3/4 h-1.5 rounded-full bg-border-default" />
            <div className="flex items-center gap-1 pt-0.5">
              <span className="w-2.5 h-1.5 rounded-xs bg-purple-500/80" />
              <span className="w-8 h-1 rounded-xs bg-border-default" />
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 -mr-1 -mt-1"
          >
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                  aria-label="Form actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
              items={menuItems}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm text-primary line-clamp-1 mb-1.5">
          {form.title}
        </h3>

        {/* Metadata pills */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            {form.question_count} {form.question_count === 1 ? "question" : "questions"}
          </span>
          <span className="flex items-center gap-1">
            <Inbox className="w-3.5 h-3.5" />
            {form.response_count} {form.response_count === 1 ? "response" : "responses"}
          </span>
        </div>
      </div>

      {/* Footer: status badge and relative time */}
      <div className="flex items-center justify-between pt-3 border-t border-default text-xs text-muted">
        <Badge status={form.status} />
        <span>Updated {formatRelativeTime(form.updated_at)}</span>
      </div>
    </div>
  );
}
