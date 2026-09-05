"use client";

import { Sparkles, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import { FormattedMarkdown } from "./markdown-renderer";

export type MessageItem = {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
};

export function ChatMessageBubble({
  message,
  studentName = "You",
}: {
  message: MessageItem;
  studentName?: string;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const timeStr = message.timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 sm:gap-3">
        <div className="flex max-w-[85%] sm:max-w-[75%] flex-col items-end">
          <div className="rounded-2xl rounded-tr-xs bg-blue-600 px-4 py-3 text-[14px] leading-relaxed text-white shadow-xs">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <span className="mt-1 px-1 text-[11px] text-slate-400">
            {timeStr}
          </span>
        </div>
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-700">
          <User className="h-4 w-4 text-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 group">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="flex max-w-[90%] sm:max-w-[85%] flex-col">
        <div className="relative rounded-2xl rounded-tl-xs border border-slate-200/90 bg-white p-4 shadow-xs">
          {/* Header info */}
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-semibold text-slate-900">
                AI Study Buddy
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-medium text-blue-700">
                Verified UniMate Data
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy response"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Content */}
          <FormattedMarkdown content={message.content} />
        </div>

        <span className="mt-1 px-1 text-[11px] text-slate-400">
          {timeStr}
        </span>
      </div>
    </div>
  );
}
