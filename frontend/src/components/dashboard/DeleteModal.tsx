"use client";

/**
 * components/dashboard/DeleteModal.tsx — Confirmation modal for form deletion
 */

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormListItem } from "@/types";

interface DeleteModalProps {
  form: FormListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
}

export function DeleteModal({
  form,
  isOpen,
  onClose,
  onDelete,
}: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    if (!form) return;
    try {
      setIsLoading(true);
      await onDelete(form.id);
      onClose();
    } catch {
      // Toast notification handled in parent mutation
    } finally {
      setIsLoading(false);
    }
  }

  if (!form) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete form"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            Delete permanently
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <p className="text-primary font-medium mb-1">
            Are you sure you want to delete &ldquo;{form.title}&rdquo;?
          </p>
          <p className="text-secondary leading-relaxed">
            This action cannot be undone. All{" "}
            <strong className="text-primary font-semibold">{form.question_count} questions</strong> and{" "}
            <strong className="text-primary font-semibold">{form.response_count} collected responses</strong>{" "}
            will be permanently removed.
          </p>
        </div>
      </div>
    </Modal>
  );
}
