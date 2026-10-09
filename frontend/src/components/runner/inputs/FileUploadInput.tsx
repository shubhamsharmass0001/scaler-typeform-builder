"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { BASE_URL } from "@/lib/api";

interface FileUploadInputProps {
  slug: string;
  questionId: number | string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  value: unknown;
  onChange: (val: unknown) => void;
  onSubmit?: () => void;
}

interface UploadedFileMeta {
  upload_id: number;
  name: string;
  size: number;
}

export function FileUploadInput({
  slug,
  questionId,
  maxSizeMB = 5,
  allowedTypes = ["image", "pdf", "doc"],
  value,
  onChange,
}: FileUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize current value
  const currentUpload: UploadedFileMeta | null = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === "object" && value !== null && "upload_id" in value) {
      const v = value as Record<string, unknown>;
      return {
        upload_id: Number(v.upload_id),
        name: String(v.name || v.filename || "Uploaded file"),
        size: Number(v.size || 0),
      };
    }
    if (typeof value === "number") {
      return {
        upload_id: value,
        name: "Uploaded file",
        size: 0,
      };
    }
    return null;
  }, [value]);

  // Determine accepted file extensions for <input accept="..." />
  const { acceptString, allowedExtensions } = React.useMemo(() => {
    const exts: string[] = [];
    for (const t of allowedTypes) {
      const low = t.toLowerCase();
      if (low === "image") {
        exts.push(".png", ".jpg", ".jpeg", ".gif", ".webp");
      } else if (low === "pdf") {
        exts.push(".pdf");
      } else if (low === "doc") {
        exts.push(".doc", ".docx", ".txt", ".csv");
      } else if (low.startsWith(".")) {
        exts.push(low);
      } else {
        exts.push(`.${low}`);
      }
    }
    const unique = Array.from(new Set(exts));
    return {
      acceptString: unique.join(","),
      allowedExtensions: unique,
    };
  }, [allowedTypes]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      // Client-side validation
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMessage(
          `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${maxSizeMB} MB.`
        );
        return;
      }

      const dotIdx = file.name.lastIndexOf(".");
      const ext = dotIdx !== -1 ? file.name.slice(dotIdx).toLowerCase() : "";
      if (!allowedExtensions.includes(ext)) {
        setErrorMessage(
          `File type "${ext || "unknown"}" is not permitted. Please upload ${allowedExtensions.join(", ")}.`
        );
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      if (questionId) {
        formData.append("question_id", String(questionId));
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/api/public/forms/${slug}/upload`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(Math.min(pct, 98));
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          try {
            const data = JSON.parse(xhr.responseText);
            const meta: UploadedFileMeta = {
              upload_id: data.upload_id,
              name: data.name,
              size: data.size,
            };
            onChange(meta);
          } catch {
            setErrorMessage("Failed to process upload response from server.");
          }
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            setErrorMessage(errJson.detail || `Upload failed (Status ${xhr.status})`);
          } catch {
            setErrorMessage(xhr.responseText || `Upload failed (Status ${xhr.status})`);
          }
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setErrorMessage("Network error during file upload. Please check your connection.");
      };

      xhr.send(formData);
    },
    [slug, questionId, maxSizeMB, allowedExtensions, onChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setErrorMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (ext === "pdf") {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    return <File className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* 1. Uploaded File State Card */}
      {currentUpload ? (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-default bg-card shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface border border-default flex items-center justify-center shrink-0">
                {getFileIcon(currentUpload.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary truncate max-w-[280px] sm:max-w-[340px]">
                  {currentUpload.name}
                </p>
                {currentUpload.size > 0 && (
                  <p className="text-xs text-secondary">
                    {formatFileSize(currentUpload.size)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 text-micro font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3" />
                <span>Uploaded</span>
              </span>
              <button
                type="button"
                onClick={handleRemove}
                title="Remove file"
                aria-label="Remove uploaded file"
                className="p-1.5 rounded-lg text-secondary hover:text-red-500 hover:bg-surface transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Drag & Drop Upload Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer select-none group ${
            isDragging
              ? "border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 scale-[1.01]"
              : "border-default hover:border-focus bg-surface/30 hover:bg-surface/50"
          }`}
        >
          {isUploading ? (
            <div className="w-full space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-cyan-600 dark:text-cyan-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm font-semibold">Uploading file...</span>
              </div>
              <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-secondary font-mono">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 stroke-[1.75]" />
              </div>

              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-primary">
                  Choose file or drag here
                </p>
                <p className="text-xs text-secondary">
                  Max size {maxSizeMB} MB • Supported: {allowedExtensions.join(", ")}
                </p>
              </div>

              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-default text-xs font-semibold text-secondary group-hover:text-primary shadow-2xs transition-colors">
                <span>Browse files</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. Inline Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-500 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-0.5 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
