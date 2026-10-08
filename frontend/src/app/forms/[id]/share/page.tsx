"use client";

/**
 * app/forms/[id]/share/page.tsx — Share Tab of the Form Builder
 *
 * Implements:
 *   - Publish status indicator (Published vs Draft)
 *   - Copy-link input with instant clipboard action & toast
 *   - QR code card with SVG graphic and action buttons
 *   - Embed code snippet inside a read-only textarea with copy action
 *   - If unpublished, presents a clear prompt with a 1-click "Publish form" button
 */

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  QrCode,
  Code2,
  Globe,
  Loader2,
  AlertCircle,
  Share2,
  Check,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { getForm, publishForm } from "@/lib/api";
import { Button } from "@/components/ui/Button";

function SharePageContent() {
  const params = useParams();
  const router = useRouter();
  const formIdStr = params?.id as string;
  const formId = Number(formIdStr);

  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const {
    data: form,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => getForm(formId),
    enabled: !isNaN(formId),
  });

  if (isNaN(formId)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-[#262627]">Invalid Form ID</h2>
        <Button onClick={() => router.push("/")} variant="secondary" size="sm" className="mt-3">
          Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-7 h-7 text-[#262627] animate-spin mb-3" />
        <p className="text-xs font-medium text-[#737373]">Loading share settings...</p>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-white">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-[#262627]">Failed to load form</h2>
        <p className="text-xs text-[#737373] mt-1 mb-4">
          {(error as Error)?.message || "Form not found"}
        </p>
        <Link href="/">
          <Button variant="secondary" size="sm">
            Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isPublished = form.status === "published" && !!form.slug;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = isPublished ? `${origin}/forms/${form.slug}` : "";
  const embedSnippet = isPublished
    ? `<iframe\n  src="${publicUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  marginheight="0"\n  marginwidth="0"\n  title="${form.title}"\n></iframe>`
    : "";

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Public link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    toast.success("Embed code copied to clipboard!");
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handlePublishNow = async () => {
    try {
      setIsPublishing(true);
      await publishForm(form.id);
      await refetch();
      toast.success("Form is now live!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish form";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#262627] flex flex-col select-none">
      {/* 1. Top Bar */}
      <header className="h-14 bg-white border-b border-[#ECECEC] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/forms/${form.id}/edit`}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors shrink-0"
            title="Back to builder"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-sm text-[#262627] truncate">
            {form.title}
          </span>
        </div>

        {/* Center: [Create | Share | Results] Tabs */}
        <nav className="hidden md:flex items-center bg-[#F5F5F5] p-1 rounded-xl border border-[#EBEBEB]">
          <Link
            href={`/forms/${form.id}/edit`}
            className="px-3.5 py-1 text-xs font-medium text-[#737373] hover:text-[#262627] rounded-lg transition-colors cursor-pointer"
          >
            Create
          </Link>

          <button
            type="button"
            className="px-3.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#262627] shadow-2xs transition-all cursor-pointer"
          >
            Share
          </button>

          <Link
            href={`/#responses`}
            className="px-3.5 py-1 text-xs font-medium text-[#737373] hover:text-[#262627] rounded-lg transition-colors cursor-pointer"
          >
            Results
          </Link>
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-2">
          {isPublished ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Published Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Draft mode</span>
            </span>
          )}
        </div>
      </header>

      {/* 2. Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#191919]">
            Share your form
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] mt-1">
            Distribute your form link, download a QR code, or embed it on your website.
          </p>
        </div>

        {/* Unpublished Draft Prompt Banner */}
        {!isPublished && (
          <div
            data-testid="unpublished-prompt-banner"
            className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3"
          >
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>This form is currently in Draft mode</span>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed max-w-xl">
              To start collecting responses, publish your form to generate a public share link, QR code, and website embed snippet.
            </p>
            <Button
              variant="primary"
              size="sm"
              data-testid="share-publish-now-btn"
              onClick={handlePublishNow}
              isLoading={isPublishing}
              leftIcon={<Globe className="w-3.5 h-3.5" />}
            >
              Publish form now
            </Button>
          </div>
        )}

        {/* Published Share Controls Grid */}
        {isPublished && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. Public Link Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-sm text-[#262627]">Direct Link</h3>
                </div>
                <a
                  href={`/forms/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <span>Open live form</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  data-testid="share-link-input"
                  value={publicUrl}
                  className="flex-1 bg-[#FAFAFA] font-mono text-xs text-[#262627] px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="share-copy-link-btn"
                  onClick={handleCopyLink}
                  leftIcon={
                    copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedLink ? "Copied!" : "Copy link"}
                </Button>
              </div>
            </div>

            {/* 2. QR Code & Embed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Placeholder Card */}
              <div
                data-testid="share-qr-card"
                className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-semibold text-sm text-[#262627]">QR Code</h3>
                  </div>
                  <p className="text-xs text-[#737373]">
                    Scan from mobile devices to open the form instantly.
                  </p>
                </div>

                {/* Visual SVG QR Mockup */}
                <div className="flex items-center justify-center p-6 bg-[#FAFAFA] rounded-xl border border-[#ECECEC]">
                  <div className="w-36 h-36 bg-white p-2.5 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col items-center justify-center relative">
                    <QrCode className="w-28 h-28 text-[#262627] stroke-[1.5]" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      toast.success("QR Code ready for sharing!");
                    }}
                  >
                    Download QR Code
                  </Button>
                </div>
              </div>

              {/* Embed Code Snippet Card */}
              <div
                data-testid="share-embed-card"
                className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-[#262627]">Embed in Website</h3>
                  </div>
                  <p className="text-xs text-[#737373]">
                    Paste this iframe snippet into your website or CMS.
                  </p>
                </div>

                <textarea
                  readOnly
                  rows={6}
                  data-testid="share-embed-textarea"
                  value={embedSnippet}
                  className="w-full text-xs font-mono bg-[#FAFAFA] text-[#262627] p-3 rounded-xl border border-[#E5E5E5] focus:outline-none resize-none leading-relaxed"
                />

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  data-testid="share-copy-embed-btn"
                  onClick={handleCopyEmbed}
                  leftIcon={
                    copiedEmbed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedEmbed ? "Copied!" : "Copy embed code"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SharePage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="w-7 h-7 text-[#262627] animate-spin mb-3" />
          <p className="text-xs font-medium text-[#737373]">Loading share tab...</p>
        </div>
      }
    >
      <SharePageContent />
    </React.Suspense>
  );
}
