"use client";

/**
 * app/page.tsx — Typeform Workspace Dashboard
 *
 * Pixel-accurate implementation of Typeform's workspace interface:
 *   - Header & Sub-navigation tabs (Forms, Contacts, Automations, Insights, Pages Beta)
 *   - Left sidebar with "+ Create form", search, workspaces navigation, responses meter & AI input
 *   - Promotional quota banner & suggestion recommendations
 *   - Workspace title with "... ", "+ Invite", diamond badge
 *   - Sort dropdown ("Date created", "Date updated", "Alphabetical")
 *   - Segmented List / Grid view switcher (List view default matching screenshot)
 *   - Forms table with squircle icons, responses, completed counts, updated dates, and context menu
 *   - Fully connected to real backend API with optimistic mutations, error handling, and toast feedback
 */

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoreHorizontal,
  UserPlus,
  Sparkles,
  Gem,
  Calendar,
  List as ListIcon,
  LayoutGrid,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Edit3,
  ArrowDownAZ,
} from "lucide-react";

import {
  getForms,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
} from "@/lib/api";
import { FormListItem } from "@/types";
import { TopNav } from "@/components/dashboard/TopNav";
import { TopTabs } from "@/components/dashboard/TopTabs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SuggestionBanner } from "@/components/dashboard/SuggestionBanner";
import { FormRow } from "@/components/dashboard/FormRow";
import { FormCard } from "@/components/dashboard/FormCard";
import { RenameModal } from "@/components/dashboard/RenameModal";
import { DeleteModal } from "@/components/dashboard/DeleteModal";
import { FormRowSkeleton, FormCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";

type SortOption = "created" | "updated" | "alphabetical";

export default function WorkspaceDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Local UI State
  const [workspaceName, setWorkspaceName] = useState("My workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list"); // List view is default in Typeform screenshot
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [formToRename, setFormToRename] = useState<FormListItem | null>(null);
  const [formToDelete, setFormToDelete] = useState<FormListItem | null>(null);

  React.useEffect(() => {
    document.title = "My workspace | Typeform";
  }, []);

  // ---------------------------------------------------------------------------
  // Data Queries
  // ---------------------------------------------------------------------------
  const {
    data: forms = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["forms"],
    queryFn: getForms,
  });

  // Calculate total responses collected across all forms
  const totalResponsesCollected = useMemo(() => {
    return forms.reduce((acc, f) => acc + (f.response_count || 0), 0);
  }, [forms]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: () => createForm({ title: "New form" }),
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("New form created!");
      router.push(`/forms/${newForm.id}/edit`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create form");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => duplicateForm(id),
    onSuccess: (duplicated) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success(`Duplicated "${duplicated.title}"`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to duplicate form");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateForm(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form renamed successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to rename form");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete form");
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers & Filtering
  // ---------------------------------------------------------------------------
  const handleCopyLink = (form: FormListItem) => {
    if (!form.slug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/f/${form.slug}`;
    navigator.clipboard.writeText(publicUrl);

    toast.success("Public link copied to clipboard!");
  };

  const processedForms = useMemo(() => {
    let result = [...forms];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "updated") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [forms, searchQuery, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    created: "Date created",
    updated: "Date updated",
    alphabetical: "Alphabetical",
  };

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col font-sans">
      {/* 1. Top Navbar */}
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

      {/* 2. Top Sub-Navigation Tabs */}
      <TopTabs />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          totalForms={forms.length}
          totalResponses={totalResponsesCollected}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onCreateForm={() => createMutation.mutate()}
          isCreating={createMutation.isPending}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Content Pane */}
        <main className="flex-1 min-w-0 px-6 sm:px-10 py-6 max-w-7xl mx-auto">
          {/* Workspace Title & Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Title & Actions */}
            <div className="flex items-center gap-2.5">
              <h1 className="text-[22px] font-semibold text-[#191919] tracking-tight">
                {workspaceName}
              </h1>

              {/* Workspace dots menu */}
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-[#65636d] hover:text-[#191919] hover:bg-[#f4f3f6] transition-colors cursor-pointer"
                    title="Workspace settings"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                }
                align="left"
                items={[
                  {
                    label: "Rename",
                    onClick: () => {
                      const newName = prompt("Rename workspace:", workspaceName);
                      if (newName && newName.trim()) {
                        setWorkspaceName(newName.trim());
                        toast.success("Workspace renamed");
                      }
                    },
                  },
                  {
                    label: "Leave",
                    onClick: () => toast.info("Left workspace"),
                  },
                  {
                    label: "Delete",
                    destructive: true,
                    onClick: () => toast.error("Cannot delete default workspace"),
                  },
                ]}
              />

              {/* + Invite button */}
              <button
                type="button"
                onClick={() => alert("Workspace collaboration invite modal")}
                className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d2b33] hover:bg-[#f4f3f6] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ml-0.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#65636d]" />
                <span>Invite</span>
              </button>

              {/* Diamond badge */}
              <div
                className="w-5 h-5 rounded-full border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/60 text-[#008775] flex items-center justify-center shrink-0 cursor-pointer"
                title="Upgrade to Pro"
              >
                <Gem className="w-3 h-3 text-[#008775]" strokeWidth={1.75} />
              </div>
            </div>

            {/* Right Controls: Sort Dropdown & List/Grid View Switcher */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* Sort By Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#2d2b33] bg-white border border-[#ecebf0] px-3 py-1.5 rounded-lg hover:bg-[#f4f3f6] transition-colors cursor-pointer shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#71717a]" />
                  <span>{sortLabels[sortBy]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-40 rounded-2xl bg-white shadow-dropdown border border-[#ecebf0] p-1 text-xs z-30 animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { key: "created", label: "Date created", icon: Calendar },
                      { key: "updated", label: "Last updated", icon: Edit3 },
                      { key: "alphabetical", label: "Alphabetical", icon: ArrowDownAZ },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.key as SortOption);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-[13px] ${
                            sortBy === opt.key
                              ? "bg-[#ecebf0] font-medium text-[#191919]"
                              : "text-[#65636d] hover:bg-[#f4f3f6] hover:text-[#191919]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Segmented Toggle: List / Grid */}
              <div className="flex items-center bg-white border border-[#ecebf0] p-0.5 rounded-lg shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[#ecebf0] text-[#191919]"
                      : "text-[#65636d] hover:text-[#191919]"
                  }`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#ecebf0] text-[#191919]"
                      : "text-[#65636d] hover:text-[#191919]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* List View Column Headers */}
          {viewMode === "list" && !isLoading && !isError && processedForms.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 text-[12px] font-normal text-[#65636d] mb-1">
              <div className="flex-1">
                {/* Title spacer */}
              </div>
              <div className="flex items-center gap-8 sm:gap-14 shrink-0">
                <div className="w-16 text-center hidden sm:block">Responses</div>
                <div className="w-16 text-center hidden sm:block">Completed</div>
                <div className="w-24 text-left hidden md:block">Updated</div>
                <div className="w-8 text-center hidden lg:block">Integrations</div>
                <div className="w-8"></div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              Forms List / Grid View Content
             ----------------------------------------------------------------- */}
          {isLoading ? (
            viewMode === "list" ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <FormRowSkeleton key={idx} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <FormCardSkeleton key={idx} />
                ))}
              </div>
            )
          ) : isError ? (
            <div className="bg-card rounded-2xl border border-red-500/20 p-8 text-center max-w-md mx-auto my-12">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-primary mb-1">
                Unable to load forms
              </h3>
              <p className="text-sm text-secondary mb-5 leading-relaxed">
                {(error as Error)?.message ||
                  "Check if the backend server is running on port 8000."}
              </p>
              <Button
                variant="secondary"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try again
              </Button>
            </div>
          ) : processedForms.length === 0 ? (
            searchQuery ? (
              <EmptyState
                title="No forms found"
                description={`No typeforms matching "${searchQuery}". Try a different keyword.`}
              />
            ) : (
              <EmptyState
                title="Create your first form"
                description="Craft interactive, conversational forms with rich question types, custom themes, and instant responses."
                actionLabel="Create typeform"
                onAction={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
              />
            )
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {processedForms.map((form) => (
                <FormRow
                  key={form.id}
                  form={form}
                  onRename={(f) => setFormToRename(f)}
                  onDuplicate={(f) => duplicateMutation.mutate(f.id)}
                  onDelete={(f) => setFormToDelete(f)}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {processedForms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  onRename={(f) => setFormToRename(f)}
                  onDuplicate={(f) => duplicateMutation.mutate(f.id)}
                  onDelete={(f) => setFormToDelete(f)}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Rename Modal */}
      <RenameModal
        form={formToRename}
        isOpen={Boolean(formToRename)}
        onClose={() => setFormToRename(null)}
        onRename={async (id, newTitle) => {
          await renameMutation.mutateAsync({ id, title: newTitle });
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        form={formToDelete}
        isOpen={Boolean(formToDelete)}
        onClose={() => setFormToDelete(null)}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
      />

      {/* Floating feedback tab on right edge matching Screenshot 2 */}
      <div
        className="fixed right-0 top-[72%] -translate-y-1/2 w-2.5 h-14 bg-[#005e5d] rounded-l-md shadow-xs z-30 cursor-pointer hidden md:block"
        title="Feedback"
      />
    </div>
  );
}
