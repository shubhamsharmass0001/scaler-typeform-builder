"use client";

/**
 * components/builder/UnpublishConfirmModal.tsx — Unpublish Confirmation Modal
 */

import React from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface UnpublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function UnpublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: UnpublishConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unpublish this form?"
      description="Respondents will no longer be able to access the public link or submit answers. You can republish at any time."
      maxWidth="sm"
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>The current public URL will return a 404 until you publish again.</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            data-testid="confirm-unpublish-btn"
            onClick={onConfirm}
            isLoading={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            Unpublish form
          </Button>
        </div>
      </div>
    </Modal>
  );
}
