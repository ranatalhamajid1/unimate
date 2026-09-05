"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#FCFCFB] p-4 text-center font-sans antialiased">
        <div className="mx-auto max-w-md space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-xs">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              Application Error
            </h1>
            <p className="text-[14px] text-slate-500">
              A critical error occurred. Please refresh the page to reload UniMate.
            </p>
          </div>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
