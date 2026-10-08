"use client";

/**
 * components/dashboard/FormCard.tsx — Grid view card representing a form
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Pencil,
  Copy,
  ExternalLink,
  Trash2,
  Inbox,
  HelpCircle,
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
      label: "Rename",
      icon: <Pencil className="w-4 h-4" />,
      onClick: () => onRename(form),
    },
    {
      label: "Duplicate",
      icon: <Copy className="w-4 h-4" />,
      onClick: () => onDuplicate(form),
    },
  ];

  if (form.status === "published" && form.slug) {
    menuItems.push({
      label: "Copy public link",
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => onCopyLink(form),
    });
  }

  menuItems.push({
    label: "Delete",
    icon: <Trash2 className="w-4 h-4" />,
    destructive: true,
    dividerBefore: true,
    onClick: () => onDelete(form),
  });

  return (
    <div
      onClick={() => router.push(`/forms/${form.id}/edit`)}
      className="group relative bg-white rounded-xl border border-[#E5E5E5] p-5 flex flex-col justify-between h-[220px] transition-all duration-200 hover:shadow-md hover:border-[#D4D4D4] cursor-pointer"
    >
      <div>
        {/* Top bar: preview thumbnail block & dropdown action */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Miniature Typeform-style card preview banner */}
          <div className="w-full h-16 rounded-lg bg-neutral-50 border border-neutral-100 p-2.5 flex flex-col justify-center gap-1.5 transition-colors group-hover:bg-neutral-100/60 overflow-hidden">
            <div className="w-1/2 h-2 rounded-full bg-neutral-300/80" />
            <div className="w-3/4 h-1.5 rounded-full bg-neutral-200" />
            <div className="flex items-center gap-1 pt-0.5">
              <span className="w-2.5 h-1.5 rounded-xs bg-blue-600/70" />
              <span className="w-8 h-1 rounded-xs bg-neutral-200" />
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
                  className="p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F0F0F0] transition-colors"
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
        <h3 className="font-semibold text-sm text-[#262627] line-clamp-1 group-hover:text-black mb-1.5">
          {form.title}
        </h3>

        {/* Metadata pills */}
        <div className="flex items-center gap-3 text-xs text-[#737373]">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#A3A3A3]" />
            {form.question_count} {form.question_count === 1 ? "question" : "questions"}
          </span>
          <span className="flex items-center gap-1">
            <Inbox className="w-3.5 h-3.5 text-[#A3A3A3]" />
            {form.response_count} {form.response_count === 1 ? "response" : "responses"}
          </span>
        </div>
      </div>

      {/* Footer: status badge and relative time */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F5F5F5] text-xs text-[#A3A3A3]">
        <Badge status={form.status} />
        <span>Updated {formatRelativeTime(form.updated_at)}</span>
      </div>
    </div>
  );
}
