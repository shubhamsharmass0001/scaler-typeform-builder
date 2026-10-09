"use client";

/**
 * components/builder/ConnectModal.tsx — Connect Tab / Modal with Coming Soon cards
 *
 * Provides placeholders for third-party integrations, sync, and webhooks.
 */

import React from "react";
import { X, Network, Webhook, Sheet, MessageSquare, Zap, Database } from "lucide-react";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTEGRATIONS = [
  {
    id: "sheets",
    name: "Google Sheets",
    icon: Sheet,
    color: "var(--color-success, #16a34a)",
    bg: "var(--badge-yesno-bg, #d1fae5)",
    desc: "Stream respondent submissions to a spreadsheet in real-time.",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    icon: Webhook,
    color: "var(--badge-dropdown-text, #4f46e5)",
    bg: "var(--badge-dropdown-bg, #e0e7ff)",
    desc: "Receive HTTP POST events to your endpoint upon every response.",
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    color: "var(--badge-choice-text, #7c3aed)",
    bg: "var(--badge-choice-bg, #ede9fe)",
    desc: "Get instant notifications in team channels when forms are submitted.",
  },
  {
    id: "zapier",
    name: "Zapier",
    icon: Zap,
    color: "var(--badge-number-text, #ea580c)",
    bg: "var(--badge-number-bg, #ffedd5)",
    desc: "Trigger automated workflows across 5,000+ connected applications.",
  },
  {
    id: "notion",
    name: "Notion",
    icon: Database,
    color: "var(--text-primary, #191919)",
    bg: "var(--bg-muted, #f3f3f5)",
    desc: "Sync entries directly to a Notion database table.",
  },
];

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Integrations & Webhooks"
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-backdrop backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="max-w-2xl w-full bg-modal text-primary rounded-2xl shadow-modal border border-default flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-sm text-primary">Integrations & Webhooks</h3>
          </div>
          <button
            type="button"
            data-testid="close-connect-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-muted">
            Connect your form to your favorite workflow tools to automatically sync responses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {INTEGRATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-default bg-card flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: item.bg,
                          borderColor: `${item.color}25`,
                          color: item.color,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-primary">{item.name}</h4>
                        <span className="text-nano font-semibold uppercase px-1.5 py-0.5 rounded-full bg-muted text-secondary">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-micro text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
