import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getUserPlan } from "@/app/lib/entitlements";
import { PlanType } from "@/app/lib/entitlement-definitions";
import { getPKTDateParts } from "@/app/lib/timezone";

export const FREE_DAILY_AI_LIMIT = 5;
export const PRO_DAILY_AI_LIMIT = 50;

/**
 * Generates an Asia/Karachi (PKT) calendar date key: YYYY-MM-DD
 */
export function getPKTDateKey(now: Date = new Date()): string {
  const pkt = getPKTDateParts(now);
  const m = String(pkt.month + 1).padStart(2, "0");
  const d = String(pkt.day).padStart(2, "0");
  return `${pkt.year}-${m}-${d}`;
}

export type AiUsageStatus = {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  plan: PlanType;
  dateKey: string;
};

/**
 * Checks current daily AI usage for a user without incrementing.
 */
export async function getDailyAiUsage(
  userId: string,
  now: Date = new Date()
): Promise<AiUsageStatus> {
  const plan = await getUserPlan(userId);
  const limit = plan === "PRO" ? PRO_DAILY_AI_LIMIT : FREE_DAILY_AI_LIMIT;
  const dateKey = getPKTDateKey(now);

  try {
    const record = await prisma.aIUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateKey,
        },
      },
    });

    const currentCount = record?.requestCount || 0;
    const remaining = Math.max(0, limit - currentCount);

    return {
      allowed: currentCount < limit,
      currentCount,
      limit,
      remaining,
      plan,
      dateKey,
    };
  } catch (error) {
    console.error("Database error in getDailyAiUsage:", error);
    return {
      allowed: true,
      currentCount: 0,
      limit,
      remaining: limit,
      plan,
      dateKey,
    };
  }
}

/**
 * Checks and atomically increments AI request count for today.
 * Returns allowed: false if quota has been reached.
 */
export async function checkAndIncrementAiUsage(
  userId: string,
  now: Date = new Date()
): Promise<AiUsageStatus> {
  const plan = await getUserPlan(userId);
  const limit = plan === "PRO" ? PRO_DAILY_AI_LIMIT : FREE_DAILY_AI_LIMIT;
  const dateKey = getPKTDateKey(now);

  try {
    const usage = await prisma.aIUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: dateKey,
        },
      },
      create: {
        userId,
        date: dateKey,
        requestCount: 1,
      },
      update: {
        requestCount: {
          increment: 1,
        },
      },
    });

    const isWithinLimit = usage.requestCount <= limit;
    const remaining = Math.max(0, limit - usage.requestCount);

    return {
      allowed: isWithinLimit,
      currentCount: usage.requestCount,
      limit,
      remaining,
      plan,
      dateKey,
    };
  } catch (error) {
    console.error("Database error in checkAndIncrementAiUsage:", error);
    // Graceful fallback to allow request if tracking database has temporary issue
    return {
      allowed: true,
      currentCount: 1,
      limit,
      remaining: limit - 1,
      plan,
      dateKey,
    };
  }
}
