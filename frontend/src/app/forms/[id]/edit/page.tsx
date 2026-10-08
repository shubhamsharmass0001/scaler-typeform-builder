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
  const { state } = useBuilderStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-[#262627]">
      {/* 1. Top Bar */}
      <BuilderTopBar
        onSaveNow={saveNow}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenDesign={() => setIsDesignOpen(true)}
        onOpenConnect={() => setIsConnectOpen(true)}
      />

      {/* 2. 3-Pane Main Work Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Pane (~260px): Ordered Question List */}
        <QuestionListPane onOpenAddModal={() => setIsAddModalOpen(true)} />

        {/* Center Pane: Conversational Question Canvas */}
        <CanvasPane />

        {/* Right Pane (~300px): Properties & Settings */}
        <SettingsPane />
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
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-[#262627]">Invalid Form ID</h2>
        <p className="text-xs text-[#737373] mt-1 mb-4">
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-7 h-7 text-[#262627] animate-spin mb-3" />
        <p className="text-xs font-medium text-[#737373]">
          Loading form builder...
        </p>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-white">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-[#262627]">Failed to load form</h2>
        <p className="text-xs text-[#737373] mt-1 mb-4 max-w-sm">
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
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="w-7 h-7 text-[#262627] animate-spin mb-3" />
          <p className="text-xs font-medium text-[#737373]">Loading form builder...</p>
        </div>
      }
    >
      <BuilderPageContent />
    </React.Suspense>
  );
}
