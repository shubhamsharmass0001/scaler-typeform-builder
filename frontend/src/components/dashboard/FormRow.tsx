"use client";

/**
 * components/dashboard/FormRow.tsx — List view row representing a form
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Pencil,
  Copy,
  ExternalLink,
  Trash2,
  FileText,
} from "lucide-react";
import { FormListItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { formatRelativeTime } from "@/lib/utils";

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
      className="group bg-white rounded-xl border border-[#E5E5E5] px-4 py-3.5 flex items-center justify-between gap-4 transition-all duration-150 hover:border-[#D4D4D4] hover:shadow-xs cursor-pointer"
    >
      {/* Left side: Icon, title, status */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] group-hover:bg-[#EBEBEB] text-[#525252] flex items-center justify-center shrink-0 transition-colors">
          <FileText className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-sm text-[#262627] truncate group-hover:text-black">
              {form.title}
            </h3>
            <Badge status={form.status} />
          </div>
          <p className="text-xs text-[#737373] mt-0.5 truncate">
            {form.description || "No description"}
          </p>
        </div>
      </div>

      {/* Right side metrics and actions */}
      <div className="flex items-center gap-6 sm:gap-8 shrink-0 text-xs text-[#737373]">
        <div className="hidden sm:block text-right">
          <p className="font-medium text-[#262627]">
            {form.response_count}
          </p>
          <p className="text-[11px] text-[#A3A3A3]">
            {form.response_count === 1 ? "response" : "responses"}
          </p>
        </div>

        <div className="hidden md:block text-right">
          <p className="font-medium text-[#262627]">
            {form.question_count}
          </p>
          <p className="text-[11px] text-[#A3A3A3]">
            {form.question_count === 1 ? "question" : "questions"}
          </p>
        </div>

        <div className="hidden lg:block text-right w-24">
          <p className="text-[#737373]">
            {formatRelativeTime(form.updated_at)}
          </p>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F0F0F0] transition-colors"
                aria-label="Actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>
    </div>
  );
}
