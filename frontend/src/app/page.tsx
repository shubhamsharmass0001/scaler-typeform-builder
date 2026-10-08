"use client";

/**
 * app/page.tsx — Typeform-style Workspace Dashboard
 *
 * Implements:
 *   - Forms listing with React Query fetching and cache invalidation
 *   - Real-time search filtering
 *   - Grid and List view toggle
 *   - Form creation, duplication, renaming, deletion, and public link copying
 *   - Loading skeletons, empty states, and toast feedback on every mutation
 */

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  AlertCircle,
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
import { Sidebar } from "@/components/dashboard/Sidebar";
import { FormCard } from "@/components/dashboard/FormCard";
import { FormRow } from "@/components/dashboard/FormRow";
import { RenameModal } from "@/components/dashboard/RenameModal";
import { DeleteModal } from "@/components/dashboard/DeleteModal";
import { FormCardSkeleton, FormRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Local UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal State
  const [formToRename, setFormToRename] = useState<FormListItem | null>(null);
  const [formToDelete, setFormToDelete] = useState<FormListItem | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
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

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: () => createForm({ title: "Untitled form" }),
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
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCopyLink = (form: FormListItem) => {
    if (!form.slug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/forms/${form.slug}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public form link copied to clipboard!");
  };

  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const q = searchQuery.toLowerCase();
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [forms, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Top Header */}
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          totalForms={forms.length}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#262627] tracking-tight">
                My workspace
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] mt-1">
                {isLoading
                  ? "Loading forms..."
                  : `${forms.length} ${forms.length === 1 ? "typeform" : "typeforms"}`}
              </p>
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-sm font-medium"
            >
              Create typeform
            </Button>
          </div>

          {/* Search & View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search typeforms..."
                className="w-full bg-white text-sm text-[#262627] placeholder:text-[#A3A3A3] pl-10 pr-4 py-2 rounded-lg border border-[#E5E5E5] transition-all focus:outline-none focus:border-[#262627] focus:ring-1 focus:ring-[#262627]"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-white border border-[#E5E5E5] p-0.5 rounded-lg shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#F0F0F0] text-[#262627]"
                      : "text-[#737373] hover:text-[#262627]"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[#F0F0F0] text-[#262627]"
                      : "text-[#737373] hover:text-[#262627]"
                  }`}
                  aria-label="List view"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              Main Content Display: Loading, Error, Empty, or Form Cards
             ----------------------------------------------------------------- */}
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <FormCardSkeleton key={idx} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <FormRowSkeleton key={idx} />
                ))}
              </div>
            )
          ) : isError ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md mx-auto my-12">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#262627] mb-1">
                Unable to load forms
              </h3>
              <p className="text-sm text-[#737373] mb-5 leading-relaxed">
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
          ) : filteredForms.length === 0 ? (
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
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredForms.map((form) => (
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
          ) : (
            <div className="space-y-2.5">
              {filteredForms.map((form) => (
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
    </div>
  );
}
