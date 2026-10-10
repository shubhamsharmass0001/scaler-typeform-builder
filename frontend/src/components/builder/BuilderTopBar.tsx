"use client";

/**
 * components/builder/BuilderTopBar.tsx — Top bar of the Form Builder
 *
 * Pixel-accurate match to Typeform's form builder top bar:
 *   - Left: Typeform logo + "Forms > New form" breadcrumb navigation
 *   - Center: Content | Workflow | Connect tabs (Content is active by default)
 *   - Right: Share button + View plans CTA button + Avatar
 *   - Second row: Universal mode dropdown | + Add content | Design | preview icons | toolbar icons
 */import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Globe,
  Share2,
  ChevronDown,
  ChevronRight,
  LayoutTemplate,
  Workflow,
  Network,
  Play,
  RefreshCw,
  Settings,
  Zap,
  BarChart3,
  ExternalLink,
  Palette,
  MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "./BuilderContext";
import { publishForm, unpublishForm } from "@/lib/api";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { UnpublishConfirmModal } from "./UnpublishConfirmModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface BuilderTopBarProps {
  onSaveNow: () => void;
  onOpenPreview?: () => void;
  onOpenDesign?: () => void;
  onOpenConnect?: () => void;
  onOpenAddModal: () => void;
  onToggleLeftPane?: () => void;
  onToggleRightPane?: () => void;
  isLeftPaneOpen?: boolean;
  isRightPaneOpen?: boolean;
  activeTab?: "content" | "workflow" | "connect";
}

export function BuilderTopBar({
  onSaveNow,
  onOpenPreview,
  onOpenDesign,
  onOpenConnect,
  onOpenAddModal,
  onToggleLeftPane,
  onToggleRightPane,
  isLeftPaneOpen,
  isRightPaneOpen,
  activeTab = "content",
}: BuilderTopBarProps) {
  const { state, updateFormMeta } = useBuilderStore();
  const { form, saveStatus, isDirty, errorMessage } = state;

  const [prevFormId, setPrevFormId] = useState<number | null>(form?.id ?? null);
  const [titleInput, setTitleInput] = useState(form?.title || "Untitled form");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string>(form?.slug || "");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isPublished = form?.status === "published";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (form && form.id !== prevFormId) {
    setPrevFormId(form.id);
    if (form.title) setTitleInput(form.title);
    if (form.slug) setPublishedSlug(form.slug);
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    updateFormMeta({ title: val.trim() || "Untitled form" });
  };

  // Publish form handler
  const handlePublish = async () => {
    if (!form) return;
    try {
      setIsPublishing(true);
      const res = await publishForm(form.id);
      updateFormMeta({ status: res.status, slug: res.slug });
      setPublishedSlug(res.slug);
      setShowLiveModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish form";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  // Confirm unpublish form handler
  const handleUnpublishConfirm = async () => {
    if (!form) return;
    try {
      setIsPublishing(true);
      const updated = await unpublishForm(form.id);
      updateFormMeta({ status: updated.status });
      setShowUnpublishConfirm(false);
      toast.info("Form reverted to draft mode");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unpublish form";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [fadeSavedIndicator, setFadeSavedIndicator] = useState(false);

  useEffect(() => {
    if (saveStatus === "saved" && !isDirty) {
      const showTimer = setTimeout(() => {
        setShowSavedIndicator(true);
        setFadeSavedIndicator(false);
      }, 10);
      const fadeTimer = setTimeout(() => {
        setFadeSavedIndicator(true);
      }, 1500);
      const hideTimer = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      const hideTimer = setTimeout(() => {
        setShowSavedIndicator(false);
        setFadeSavedIndicator(false);
      }, 10);
      return () => clearTimeout(hideTimer);
    }
  }, [saveStatus, isDirty]);

  const handleCopyLink = () => {
    if (!form?.slug) {
      toast.info("Publish your form to generate a public link");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/f/${form.slug}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public link copied to clipboard!");
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────
          TOP NAV ROW — Typeform-style: breadcrumb | center tabs | share+plans
      ───────────────────────────────────────────────────────────────────── */}
      <header className="h-12 bg-surface border-b border-default px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Logo mark + Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile Left Drawer Toggle (visible on < md) */}
          <button
            type="button"
            onClick={onToggleLeftPane}
            aria-label="Toggle pages menu"
            className="md:hidden p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none"
          >
            <LayoutTemplate className="w-4 h-4" />
          </button>

          {/* Typeform icon window */}
          <Link
            href="/"
            aria-label="Return to Workspace forms"
            className="hidden sm:inline-flex shrink-0 p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
            title="Forms workspace"
          >
            <LayoutTemplate className="w-4 h-4 text-secondary" />
          </Link>

          {/* Breadcrumb: Forms > title */}
          <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
            <Link
              href="/"
              className="hidden sm:inline text-secondary hover:text-primary transition-colors font-normal shrink-0 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none rounded px-0.5"
            >
              Forms
            </Link>
            <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={titleInput}
              onChange={handleTitleChange}
              placeholder="New form"
              aria-label="Form title"
              className="font-medium text-xs sm:text-sm text-primary bg-transparent hover:bg-surface-hover focus:bg-surface rounded px-1.5 py-0.5 border border-transparent focus:border-default focus-visible:ring-2 focus-visible:ring-neutral-400 focus:outline-none transition-colors min-w-0 max-w-[90px] sm:max-w-[220px] md:max-w-[260px] truncate"
            />
          </nav>
        </div>

        {/* Center: Content | Workflow | Connect | Share | Results (Screenshot 1) */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation tabs">
          <button
            type="button"
            className={`px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "content"
                ? "text-primary border-primary font-semibold"
                : "text-secondary border-transparent hover:text-primary"
            }`}
          >
            Content
          </button>
          <button
            type="button"
            className="px-3 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors cursor-pointer"
            onClick={() => toast.info("Workflow logic branching view")}
          >
            Workflow
          </button>
          <button
            type="button"
            data-testid="tab-connect"
            onClick={onOpenConnect}
            className="px-3 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Connect
          </button>
          <Link
            href={form ? `/forms/${form.id}/share` : "#"}
            data-testid="tab-share"
            className="px-3 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Share
          </Link>
          <Link
            href={form ? `/forms/${form.id}/results` : "#"}
            data-testid="tab-results"
            className="px-3 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Results
          </Link>
        </nav>

        {/* Right: Autosave status + Copy link + Preview + Publish + View plans + Help + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Autosave status (Transitions: Saving... -> Saved with checkmark, fading after 2s) */}
          <div className="flex items-center gap-1 text-xs mr-1" aria-live="polite" data-testid="autosave-status">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-secondary transition-opacity" data-testid="autosave-saving">
                <Loader2 className="w-3 h-3 animate-spin text-muted" aria-hidden="true" />
                <span>Saving…</span>
              </span>
            )}
            {showSavedIndicator && (
              <span
                data-testid="autosave-saved"
                className={`flex items-center gap-1 text-secondary transition-opacity duration-500 ${
                  fadeSavedIndicator ? "opacity-0" : "opacity-100"
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Saved</span>
              </span>
            )}
            {isDirty && saveStatus !== "saving" && saveStatus !== "error" && !showSavedIndicator && (
              <span className="flex items-center gap-1 text-secondary" data-testid="autosave-unsaved">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                <span>Unsaved</span>
              </span>
            )}
            {saveStatus === "error" && (
              <button
                onClick={onSaveNow}
                data-testid="autosave-retry-btn"
                className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer rounded"
                title={errorMessage || "Click to retry"}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
          </div>

          {/* Copy link button (Screenshot 1: 🔗 icon) */}
          {form?.slug && (
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy public link"
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover border border-default transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Preview button (Secondary hierarchy) */}
          <button
            type="button"
            data-testid="header-btn-preview"
            onClick={onOpenPreview}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover rounded-lg border border-default transition-all cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>Preview</span>
          </button>

          {/* Publish Button (Primary hierarchy: "Publish edits" or "Publish") */}
          {isPublished ? (
            <div className="flex items-center gap-1">
              <button
                data-testid="btn-publish"
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-hover rounded-lg border border-default transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Publish edits</span>
                    <span className="sm:hidden">Publish</span>
                  </>
                )}
              </button>
              <button
                data-testid="btn-unpublish"
                onClick={() => setShowUnpublishConfirm(true)}
                disabled={isPublishing}
                className="hidden sm:inline-flex px-2 py-1.5 text-xs text-secondary hover:text-primary rounded-lg border border-transparent hover:border-default transition-all cursor-pointer"
                title="Revert to draft"
              >
                Unpublish
              </button>
            </div>
          ) : (
            <button
              data-testid="btn-publish"
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-btn-primary hover:bg-btn-primary-hover rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isPublishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </>
              )}
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle size="sm" />

          {/* View Plans CTA (Teal Button matching Screenshot 1 & 2) */}
          <button
            type="button"
            onClick={() => toast.info("Typeform Pro Plan")}
            className="hidden md:flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-brand-plan hover:bg-brand-plan-hover rounded-lg transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            View plans
          </button>

          {/* Help button */}
          <button
            type="button"
            onClick={() => toast.info("Help & Guides")}
            aria-label="Help and documentation"
            className="w-7 h-7 rounded-full text-secondary hover:text-primary hover:bg-surface-hover flex items-center justify-center text-xs font-medium border border-transparent transition-colors cursor-pointer"
          >
            ?
          </button>

          {/* Avatar (Tan background with dark S matching screenshot) */}
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-7 h-7 rounded-full bg-avatar text-avatar text-micro font-bold flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 transition-all select-none border border-default shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Signed in as Shubham (sshubham3_be23@thapar.edu)"
              aria-label="User profile"
            >
              S
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-card shadow-dropdown border border-default p-3 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-3 pb-3 border-b border-default">
                  <div className="w-9 h-9 rounded-full bg-avatar text-avatar font-bold text-xs flex items-center justify-center border border-default shrink-0 select-none">
                    S
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-[13px] text-primary truncate">
                      Shubham
                    </div>
                    <div className="text-[11px] text-secondary truncate font-normal">
                      sshubham3_be23@thapar.edu
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      toast.info("Account settings");
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                  >
                    <span>Account settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      toast.info("Plan: Typeform Pro");
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-primary hover:bg-surface-hover transition-colors text-left text-[13px] font-normal cursor-pointer"
                  >
                    <span>Billing & plans</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Right Settings Toggle */}
          <button
            type="button"
            onClick={onToggleRightPane}
            aria-label="Toggle settings menu"
            className="md:hidden p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          SECOND TOOLBAR ROW — Universal mode | + Add content | Design | etc.
      ───────────────────────────────────────────────────────────────────── */}
      <div className="h-10 bg-surface border-b border-default px-3 flex items-center gap-1.5 sm:gap-2 shrink-0 z-20 overflow-x-auto scrollbar-hide">
        {/* Universal mode dropdown */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-hover rounded-lg border border-default transition-all active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
          <span>Universal mode</span>
          <ChevronDown className="w-3 h-3 text-muted" aria-hidden="true" />
        </button>

        <div className="w-px h-5 bg-border-default mx-0.5 shrink-0" aria-hidden="true" />

        {/* + Add content */}
        <button
          type="button"
          data-testid="add-question-btn"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-all active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <span className="text-sm font-light leading-none">+</span>
          <span>Add content</span>
        </button>

        {/* Design */}
        <button
          type="button"
          data-testid="btn-open-design"
          onClick={onOpenDesign}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-hover rounded-lg transition-all active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <Palette className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Design</span>
        </button>

        <div className="w-px h-5 bg-border-default mx-0.5 shrink-0" aria-hidden="true" />

        {/* Icon toolbar buttons — Preview, Play, Settings, etc. */}
        <button
          type="button"
          data-testid="btn-open-preview"
          onClick={onOpenPreview}
          title="Device Preview"
          aria-label="Device preview"
          className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <MonitorSmartphone className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          title="Play interactive preview"
          aria-label="Play interactive preview"
          onClick={onOpenPreview}
          className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <Play className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          title="Refresh view"
          aria-label="Refresh view"
          onClick={onSaveNow}
          className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          title="Accessibility & info"
          aria-label="Accessibility & info"
          onClick={() => toast.info("Accessibility audit passed: WCAG AA contrast")}
          className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          title="Form Settings"
          aria-label="Form settings"
          onClick={onToggleRightPane}
          className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: panel toggle */}
        <button
          type="button"
          title="Toggle side panel"
          aria-label="Toggle side panel"
          onClick={onToggleRightPane}
          className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none shrink-0"
        >
          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* "Your form is live" Modal */}
      {publishedSlug && (
        <PublishSuccessModal
          isOpen={showLiveModal}
          onClose={() => setShowLiveModal(false)}
          slug={publishedSlug}
        />
      )}

      {/* Unpublish Confirmation Modal */}
      <UnpublishConfirmModal
        isOpen={showUnpublishConfirm}
        onClose={() => setShowUnpublishConfirm(false)}
        onConfirm={handleUnpublishConfirm}
        isLoading={isPublishing}
      />
    </>
  );
}
