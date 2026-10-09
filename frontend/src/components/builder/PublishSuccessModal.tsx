"use client";

/**
 * components/builder/PublishSuccessModal.tsx — "Your form is live" modal
 *
 * Displays the published form public URL, copy link button with toast,
 * and external "Open form" link.
 */

import React from "react";
import { Check, Copy, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

export function PublishSuccessModal({ isOpen, onClose, slug }: PublishSuccessModalProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/f/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Your form is live!"
      description="Respondents can now access and complete your form via the public link."
      maxWidth="md"
    >
      <div className="space-y-5 pt-1">
        {/* Success Icon Header */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <Globe className="w-6 h-6 stroke-[2]" />
        </div>

        {/* Public Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary">
            Share link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              data-testid="publish-modal-url"
              value={publicUrl}
              className="flex-1 bg-muted text-xs font-mono text-primary px-3 py-2 rounded-xl border border-default focus:outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-testid="publish-modal-copy-btn"
              onClick={handleCopy}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-subtle">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>

          <a
            href={`/f/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="publish-modal-open-link"
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open form
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
}
