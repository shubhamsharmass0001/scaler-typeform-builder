"use client";

/**
 * app/forms/[id]/edit/page.tsx — Typeform Clone Form Builder
 *
 * Implements:
 *   - 3-pane layout matching Typeform: Top bar, Left question list (~260px),
 *     Center canvas, Right settings pane (~300px).
 *   - Real-time debounced 800ms autosave with save status indicator.
 *   - Add question modal supporting all 8 question types with search.
 *   - Seamless hydration and state management via BuilderProvider.
 */

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getForm } from "@/lib/api";
import {
  BuilderProvider,
  useBuilderStore,
} from "@/components/builder/BuilderContext";
import { useAutosave } from "@/components/builder/useAutosave";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { QuestionListPane } from "@/components/builder/QuestionListPane";
import { CanvasPane } from "@/components/builder/CanvasPane";
import { SettingsPane } from "@/components/builder/SettingsPane";
import { AddQuestionModal } from "@/components/builder/AddQuestionModal";
import { PreviewModal } from "@/components/builder/PreviewModal";
import { DesignDrawer } from "@/components/builder/DesignDrawer";
import { ConnectModal } from "@/components/builder/ConnectModal";
import { Button } from "@/components/ui/Button";

// Inner builder workspace component that has access to BuilderContext
function BuilderWorkspace() {
  const { saveNow } = useAutosave();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);
  const {
    state,
    undo,
    redo,
    duplicateQuestion,
    deleteQuestion,
    selectQuestion,
  } = useBuilderStore();

  React.useEffect(() => {
    if (state.form?.title) {
      document.title = `${state.form.title} | FormCraft Builder`;
    }
  }, [state.form?.title]);

  // Global Builder Keyboard Shortcuts
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // 1. Undo / Redo (Cmd+Z / Ctrl+Z, Cmd+Shift+Z / Cmd+Y)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // 2. Duplicate (Cmd+D / Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        if (
          state.selectedId &&
          state.selectedId !== "welcome" &&
          state.selectedId !== "thank_you"
        ) {
          e.preventDefault();
          duplicateQuestion(state.selectedId);
        }
        return;
      }

      // If active focus is in an input or modal is open, don't trigger selection or delete shortcuts
      if (isInput || isAddModalOpen || isPreviewOpen || isDesignOpen || isConnectOpen) {
        return;
      }

      // 3. Delete Question (Delete / Backspace)
      if (e.key === "Delete" || e.key === "Backspace") {
        if (
          state.selectedId &&
          state.selectedId !== "welcome" &&
          state.selectedId !== "thank_you"
        ) {
          e.preventDefault();
          deleteQuestion(state.selectedId);
        }
        return;
      }

      // 4. Arrow navigation (ArrowUp / ArrowDown)
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIdx = state.questions.findIndex(
          (q) => String(q.id) === String(state.selectedId)
        );
        if (state.selectedId === "thank_you") {
          if (state.questions.length > 0) {
            selectQuestion(state.questions[state.questions.length - 1].id);
          } else {
            selectQuestion("welcome");
          }
        } else if (currentIdx > 0) {
          selectQuestion(state.questions[currentIdx - 1].id);
        } else if (currentIdx === 0) {
          selectQuestion("welcome");
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIdx = state.questions.findIndex(
          (q) => String(q.id) === String(state.selectedId)
        );
        if (state.selectedId === "welcome") {
          if (state.questions.length > 0) {
            selectQuestion(state.questions[0].id);
          } else {
            selectQuestion("thank_you");
          }
        } else if (currentIdx >= 0 && currentIdx < state.questions.length - 1) {
          selectQuestion(state.questions[currentIdx + 1].id);
        } else if (currentIdx === state.questions.length - 1) {
          selectQuestion("thank_you");
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.selectedId,
    state.questions,
    undo,
    redo,
    duplicateQuestion,
    deleteQuestion,
    selectQuestion,
    isAddModalOpen,
    isPreviewOpen,
    isDesignOpen,
    isConnectOpen,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-app text-primary">
      {/* 1. Top Bar */}
      <BuilderTopBar
        onSaveNow={saveNow}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenDesign={() => setIsDesignOpen(true)}
        onOpenConnect={() => setIsConnectOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onToggleLeftPane={() => setIsMobileLeftOpen((prev) => !prev)}
        onToggleRightPane={() => setIsMobileRightOpen((prev) => !prev)}
        isLeftPaneOpen={isMobileLeftOpen}
        isRightPaneOpen={isMobileRightOpen}
      />

      {/* 2. 3-Pane Main Work Area (with mobile drawer support) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Pane (~260px): Ordered Question List */}
        <QuestionListPane
          onOpenAddModal={() => setIsAddModalOpen(true)}
          isOpenMobile={isMobileLeftOpen}
          onCloseMobile={() => setIsMobileLeftOpen(false)}
        />

        {/* Center Pane: Conversational Question Canvas */}
        <CanvasPane />

        {/* Right Pane (~300px): Properties & Settings */}
        <SettingsPane
          isOpenMobile={isMobileRightOpen}
          onCloseMobile={() => setIsMobileRightOpen(false)}
        />
      </div>

      {/* Add Question Popover / Modal */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Live Preview Full-Screen Modal with Device Frames */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        form={state.form}
        questions={state.questions}
      />

      {/* Design & Theme Drawer */}
      <DesignDrawer
        isOpen={isDesignOpen}
        onClose={() => setIsDesignOpen(false)}
      />

      {/* Connect & Integrations Modal */}
      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </div>
  );
}

function BuilderPageContent() {
  const params = useParams();
  const router = useRouter();
  const formIdStr = params?.id as string;
  const formId = Number(formIdStr);

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
    staleTime: 0,
  });

  if (isNaN(formId)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-app text-primary">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-primary">Invalid Form ID</h2>
        <p className="text-xs text-muted mt-1 mb-4">
          The requested form ID is not valid.
        </p>
        <Button onClick={() => router.push("/")} variant="secondary" size="sm">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-app text-primary">
        <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
        <p className="text-xs font-medium text-muted">
          Loading form builder...
        </p>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-app text-primary">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-primary">Failed to load form</h2>
        <p className="text-xs text-muted mt-1 mb-4 max-w-sm">
          {(error as Error)?.message || "Form not found or server error"}
        </p>
        <div className="flex gap-2.5">
          <Button onClick={() => refetch()} variant="secondary" size="sm">
            Try again
          </Button>
          <Link href="/">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BuilderProvider initialForm={form}>
      <BuilderWorkspace />
    </BuilderProvider>
  );
}

// Main page container wrapped in Suspense for App Router dynamic params prerender
export default function FormEditPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-app text-primary">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
          <p className="text-xs font-medium text-muted">Loading form builder...</p>
        </div>
      }
    >
      <BuilderPageContent />
    </React.Suspense>
  );
}
