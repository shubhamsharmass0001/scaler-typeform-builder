"use client";

/**
 * components/builder/BuilderTopBar.tsx — Top bar of the Form Builder
 *
 * Includes:
 *   - Back link to dashboard
 *   - Inline-editable form title
 *   - Mode tabs: [Create | Share | Results]
 *   - Autosave status indicator (Saving... / Saved / Error with retry)
 *   - Preview button
 *   - Publish / Unpublish button
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Globe,
  Share2,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "./BuilderContext";
import { publishForm, unpublishForm } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface BuilderTopBarProps {
  onSaveNow: () => void;
  onOpenPreview?: () => void;
}

export function BuilderTopBar({ onSaveNow, onOpenPreview }: BuilderTopBarProps) {
  const { state, updateFormMeta } = useBuilderStore();
  const { form, saveStatus, isDirty, errorMessage } = state;

  const [titleInput, setTitleInput] = useState(form?.title || "Untitled form");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (form?.title) {
      setTitleInput(form.title);
    }
  }, [form?.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    updateFormMeta({ title: val.trim() || "Untitled form" });
  };

  const handlePublishToggle = async () => {
    if (!form) return;

    try {
      setIsPublishing(true);
      if (form.status === "published") {
        const updated = await unpublishForm(form.id);
        updateFormMeta({ status: updated.status });
        toast.info("Form reverted to draft");
      } else {
        const res = await publishForm(form.id);
        updateFormMeta({ status: res.status, slug: res.slug });
        toast.success("Form published live!", {
          description: `Public URL: /forms/${res.slug}`,
          action: {
            label: "Copy Link",
            onClick: () => {
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              navigator.clipboard.writeText(`${origin}/forms/${res.slug}`);
              toast.success("Copied to clipboard!");
            },
          },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle status";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const isPublished = form?.status === "published";

  return (
    <header className="h-14 bg-white border-b border-[#ECECEC] px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Left: Back button & Inline-editable title */}
      <div className="flex items-center gap-3 min-w-0 flex-1 max-w-sm sm:max-w-md">
        <Link
          href="/"
          className="p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors shrink-0"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={titleInput}
            onChange={handleTitleChange}
            placeholder="Untitled form"
            className="w-full font-semibold text-sm text-[#262627] bg-transparent hover:bg-[#F5F5F5] focus:bg-white rounded-md px-2 py-1 border border-transparent focus:border-[#D4D4D4] focus:outline-none transition-colors truncate"
          />
        </div>
      </div>

      {/* Center: [Create | Share | Results] Mode Tabs */}
      <nav className="hidden md:flex items-center bg-[#F5F5F5] p-1 rounded-xl border border-[#EBEBEB]">
        <button
          type="button"
          className="px-3.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#262627] shadow-2xs transition-all cursor-pointer"
        >
          Create
        </button>

        <button
          type="button"
          onClick={() => {
            if (form?.slug) {
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              navigator.clipboard.writeText(`${origin}/forms/${form.slug}`);
              toast.success("Public link copied to clipboard!");
            } else {
              toast.info("Publish the form to share the public link");
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium text-[#737373] hover:text-[#262627] rounded-lg transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <Link
          href={form ? `/#responses` : "#"}
          onClick={() => {
            if (form) {
              toast.info(`Responses collected: ${form.questions?.length || 0} questions configured`);
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium text-[#737373] hover:text-[#262627] rounded-lg transition-colors cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Results</span>
        </Link>
      </nav>

      {/* Right: Autosave status indicator & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Autosave status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-[#737373]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#737373]" />
              <span>Saving…</span>
            </span>
          )}

          {saveStatus === "saved" && !isDirty && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}

          {isDirty && saveStatus !== "saving" && saveStatus !== "error" && (
            <span className="flex items-center gap-1.5 text-[#A3A3A3]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Unsaved</span>
            </span>
          )}

          {saveStatus === "error" && (
            <button
              onClick={onSaveNow}
              className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
              title={errorMessage || "Click to retry"}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Retry save</span>
            </button>
          )}
        </div>

        {/* Preview Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenPreview}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Preview
        </Button>

        {/* Publish / Unpublish Button */}
        {isPublished ? (
          <div className="flex items-center gap-1.5">
            {form?.slug && (
              <a
                href={`/forms/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1 text-xs text-[#059669] hover:underline px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200/60"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Live</span>
              </a>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePublishToggle}
              isLoading={isPublishing}
              className="text-[#525252]"
            >
              Unpublish
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublishToggle}
            isLoading={isPublishing}
            leftIcon={<Globe className="w-3.5 h-3.5" />}
          >
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}
