import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  PlanType,
  FeatureEntitlement,
  PLAN_FEATURES,
  UserSubscriptionData,
  SubscriptionStatus,
  BillingProviderType,
} from "@/app/lib/entitlement-definitions";

export class EntitlementError extends Error {
  public code: string;
  public feature: FeatureEntitlement;
  public requiredPlan: PlanType;

  constructor(feature: FeatureEntitlement, requiredPlan: PlanType = "PRO") {
    super(`Access denied. Feature '${feature}' requires ${requiredPlan} plan.`);
    this.name = "EntitlementError";
    this.code = "UPGRADE_REQUIRED";
    this.feature = feature;
    this.requiredPlan = requiredPlan;
  }
}

/**
 * Default fallback subscription when no record exists.
 */
function createDefaultFreeSubscription(userId: string): UserSubscriptionData {
  return {
    userId,
    plan: "FREE",
    status: "ACTIVE",
    provider: "NONE",
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    isPro: false,
  };
}

/**
 * Retrieves the current subscription state for a user from PostgreSQL.
 * Defaults to active FREE plan if no record exists or if expired.
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscriptionData> {
  if (!userId) {
    return createDefaultFreeSubscription("");
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) {
      return createDefaultFreeSubscription(userId);
    }

    const now = new Date();

    // Verify expiration if a currentPeriodEnd is present
    const isExpired = sub.currentPeriodEnd ? sub.currentPeriodEnd < now : false;
    const isPlanPro =
      sub.plan === "PRO" &&
      (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
      !isExpired;

    return {
      id: sub.id,
      userId: sub.userId,
      plan: isPlanPro ? "PRO" : "FREE",
      status: (sub.status as SubscriptionStatus) || "ACTIVE",
      provider: (sub.provider as BillingProviderType) || "NONE",
      providerCustomerId: sub.providerCustomerId,
      providerSubscriptionId: sub.providerSubscriptionId,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      isPro: isPlanPro,
    };
  } catch (error) {
    console.error("Database error in getUserSubscription:", error);
    return createDefaultFreeSubscription(userId);
  }
}

/**
 * Returns the effective plan tier for a user.
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const sub = await getUserSubscription(userId);
  return sub.plan;
}

/**
 * Convenience helper to determine if a user has active PRO status.
 */
export async function isPro(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  return sub.isPro;
}

/**
 * Verifies whether a user has access to a specific feature entitlement.
 * Completely provider-agnostic.
 */
export async function hasEntitlement(
  userId: string,
  feature: FeatureEntitlement
): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const allowedFeatures = PLAN_FEATURES[plan] || [];
  return allowedFeatures.includes(feature);
}

/**
 * Server-side guard function. Throws EntitlementError if the user lacks the requested feature.
 */
export async function requireEntitlement(
  userId: string,
  feature: FeatureEntitlement
): Promise<void> {
  const allowed = await hasEntitlement(userId, feature);
  if (!allowed) {
    throw new EntitlementError(feature, "PRO");
  }
}
