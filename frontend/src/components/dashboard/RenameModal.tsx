"use client";

/**
 * components/dashboard/RenameModal.tsx — Modal dialog to edit form title
 */

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormListItem } from "@/types";

interface RenameModalProps {
  form: FormListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (id: number, newTitle: string) => Promise<void>;
}

export function RenameModal({
  form,
  isOpen,
  onClose,
  onRename,
}: RenameModalProps) {
  const [prevFormId, setPrevFormId] = useState<number | null>(form?.id ?? null);
  const [title, setTitle] = useState(form?.title ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (form && form.id !== prevFormId) {
    setPrevFormId(form.id);
    setTitle(form.title);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onRename(form.id, trimmed);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename form";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename form"
      description="Enter a new title for this form."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!title.trim()}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Form Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error || undefined}
          placeholder="e.g. Customer Feedback Survey"
          autoFocus
        />
      </form>
    </Modal>
  );
}
