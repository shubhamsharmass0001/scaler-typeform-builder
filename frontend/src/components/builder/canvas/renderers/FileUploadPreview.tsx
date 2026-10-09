"use client";

import React from "react";
import { Upload, FileText } from "lucide-react";
import { Question } from "@/types";

interface RendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export function FileUploadPreview({ question }: RendererProps) {
  const maxSizeMB = (question.properties.maxSizeMB as number) || 5;
  const rawTypes = (question.properties.allowedTypes as string[]) || ["image", "pdf", "doc"];
  
  const formatTypesDisplay = (types: string[]) => {
    return types
      .map((t) => {
        if (t === "image") return "Images (PNG, JPG, WebP)";
        if (t === "pdf") return "PDF";
        if (t === "doc") return "Documents (DOC, TXT)";
        return t.toUpperCase();
      })
      .join(", ");
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="relative border-2 border-dashed border-default hover:border-focus rounded-2xl p-8 sm:p-10 transition-colors bg-surface/30 flex flex-col items-center justify-center text-center gap-3 cursor-pointer select-none group">
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Upload className="w-6 h-6 stroke-[1.75]" />
        </div>

        <div className="space-y-1">
          <p className="text-sm sm:text-base font-semibold text-primary">
            Choose file or drag here
          </p>
          <p className="text-xs text-secondary">
            Size up to {maxSizeMB} MB • Supported: {formatTypesDisplay(rawTypes)}
          </p>
        </div>

        <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-card border border-default text-xs font-medium text-secondary shadow-2xs">
          <FileText className="w-3.5 h-3.5 opacity-70" />
          <span>Browse device</span>
        </div>
      </div>
    </div>
  );
}
