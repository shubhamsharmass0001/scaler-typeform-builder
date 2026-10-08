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
    color: "#0F9D58",
    bg: "#E6F4EA",
    desc: "Stream respondent submissions to a spreadsheet in real-time.",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    icon: Webhook,
    color: "#6366F1",
    bg: "#EEF2FF",
    desc: "Receive HTTP POST events to your endpoint upon every response.",
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    color: "#4A154B",
    bg: "#F4EDE4",
    desc: "Get instant notifications in team channels when forms are submitted.",
  },
  {
    id: "zapier",
    name: "Zapier",
    icon: Zap,
    color: "#FF4A00",
    bg: "#FFF0EB",
    desc: "Trigger automated workflows across 5,000+ connected applications.",
  },
  {
    id: "notion",
    name: "Notion",
    icon: Database,
    color: "#000000",
    bg: "#F5F5F5",
    desc: "Sync entries directly to a Notion database table.",
  },
];

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-[#ECECEC] flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#ECECEC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-sm text-[#262627]">Integrations & Webhooks</h3>
          </div>
          <button
            type="button"
            data-testid="close-connect-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-[#737373]">
            Connect your form to your favorite workflow tools to automatically sync responses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {INTEGRATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex flex-col justify-between space-y-3"
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
                        <h4 className="font-semibold text-xs text-[#262627]">{item.name}</h4>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#737373] leading-relaxed">
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
