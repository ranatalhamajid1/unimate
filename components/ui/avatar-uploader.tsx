"use client";

import React, { useState, useRef } from "react";
import { Camera, Trash2, Loader2, UploadCloud, AlertCircle } from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarUpdated?: (newUrl: string | null) => void;
  className?: string;
  size?: "md" | "lg" | "xl";
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export function AvatarUploader({
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
  className = "",
  size = "lg",
}: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);

    // Client-side validation: Type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please choose a valid JPEG, PNG, or WebP image.");
      return;
    }

    // Client-side validation: Size (<= 2 MB)
    if (file.size > MAX_BYTES) {
      setErrorMsg("Image size exceeds 2 MB. Please choose a smaller image.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload avatar. Please try again.");
      }

      setAvatarUrl(data.avatarUrl);
      if (onAvatarUpdated) {
        onAvatarUpdated(data.avatarUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!avatarUrl || isUploading) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete avatar.");
      }

      setAvatarUrl(null);
      if (onAvatarUpdated) {
        onAvatarUpdated(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar Display & Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 transition-all duration-150 outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isDragging
              ? "border-blue-500 scale-102 bg-blue-500/5 shadow-md"
              : "border-[var(--color-border)] hover:border-[var(--color-border-subtle)]"
          }`}
          aria-label="Upload profile picture"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${userName}'s profile avatar`}
              className="h-20 w-20 sm:h-24 sm:w-24 object-cover"
            />
          ) : (
            <AvatarFallback name={userName} size={size === "xl" ? "xl" : "lg"} className="h-20 w-20 sm:h-24 sm:w-24" />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <Camera className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium tracking-wide uppercase">Change</span>
              </>
            )}
          </div>

          {/* Active Uploading Indicator */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        {/* Action Buttons & Guidance */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text)] shadow-xs transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Image
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={isUploading}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                aria-label="Remove avatar"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-3)] max-w-xs">
            JPEG, PNG, or WebP. Maximum size 2 MB. Square 1:1 image recommended.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
