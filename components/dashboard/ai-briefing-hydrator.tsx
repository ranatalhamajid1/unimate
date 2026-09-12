"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface AiBriefingHydratorProps {
  initialStrategy?: string;
  initialHeadline?: string;
  initialAdvice?: string;
  isPro?: boolean;
}

export function AiBriefingHydrator({
  initialStrategy,
  initialHeadline,
  initialAdvice,
  isPro = false,
}: AiBriefingHydratorProps) {
  const [strategy, setStrategy] = useState(initialStrategy || "");
  const [headline, setHeadline] = useState(initialHeadline || "");
  const [advice, setAdvice] = useState(initialAdvice || "");
  const [isAiHydrated, setIsAiHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    // Constraint #2: Avoid duplicate requests during the same client session.
    // Check sessionStorage to prevent repeated calls across navigation/re-renders.
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    const cacheKey = "unimate_ai_briefing_session";
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Only use cache if it's less than 30 minutes old
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          if (parsed.strategy) setStrategy(parsed.strategy);
          if (parsed.headline) setHeadline(parsed.headline);
          if (parsed.advice) setAdvice(parsed.advice);
          setIsAiHydrated(parsed.isAi);
          return;
        }
      } catch {
        // ignore parse error and proceed
      }
    }

    // Attempt gentle AI hydration if not cached
    let isCancelled = false;
    async function hydrateAi() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/intelligence/briefing?ai=true", {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          // Graceful fallback to deterministic
          return;
        }

        const data = await res.json();
        if (isCancelled) return;

        if (data && data.strategy) {
          setStrategy(data.strategy);
          if (data.headline) setHeadline(data.headline);
          if (data.actionableAdvice) setAdvice(data.actionableAdvice);
          setIsAiHydrated(data.source === "ai");

          // Store in sessionStorage to respect quota and prevent navigation churn
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({
                strategy: data.strategy,
                headline: data.headline,
                advice: data.actionableAdvice,
                isAi: data.source === "ai",
                timestamp: Date.now(),
              })
            );
          } catch {
            // Storage quota or disabled; harmless
          }
        }
      } catch (err) {
        // Network or client error: fail silently and keep deterministic content
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    hydrateAi();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleManualRefresh() {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/intelligence/briefing?ai=true", {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (data && data.strategy) {
        setStrategy(data.strategy);
        if (data.headline) setHeadline(data.headline);
        if (data.actionableAdvice) setAdvice(data.actionableAdvice);
        setIsAiHydrated(data.source === "ai");

        const cacheKey = "unimate_ai_briefing_session";
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              strategy: data.strategy,
              headline: data.headline,
              advice: data.actionableAdvice,
              isAi: data.source === "ai",
              timestamp: Date.now(),
            })
          );
        } catch {}
      }
    } catch {
      setErrorNotice("Briefing update unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!strategy && !advice) {
    return null;
  }

  return (
    <div className="mt-3.5 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[var(--color-text-2)] min-w-0">
            <span className="font-semibold text-[var(--color-text)]">
              {isAiHydrated ? "AI Academic Advisory: " : "Daily Strategy: "}
            </span>
            <span>{strategy}</span>
            {advice && advice !== strategy && (
              <p className="mt-1 font-medium text-[var(--color-text)]">{advice}</p>
            )}
          </div>
        </div>

        {/* Subtle status or manual refresh icon */}
        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          title="Refresh AI briefing"
          className="p-1 rounded-md text-[var(--color-text-3)] hover:text-purple-600 dark:hover:text-purple-400 transition-micro disabled:opacity-40"
          aria-label="Refresh AI briefing"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-500" : ""}`} />
        </button>
      </div>

      {errorNotice && (
        <p className="mt-1 text-[10.5px] text-amber-600 dark:text-amber-400">
          {errorNotice}
        </p>
      )}
    </div>
  );
}
