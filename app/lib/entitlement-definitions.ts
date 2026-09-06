export type PlanType = "FREE" | "PRO";

export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "PAUSED"
  | "TRIALING";

export type BillingProviderType = "PADDLE" | "LEMONSQUEEZY" | "MOCK" | "NONE";

export type FeatureEntitlement =
  | "AI_BASIC"
  | "AI_HIGH_LIMIT"
  | "AI_STUDY_PLAN"
  | "SMART_COMMAND_CENTER"
  | "ADVANCED_INSIGHTS"
  | "ADVANCED_ANALYTICS";

/**
 * Centralized feature allocation per plan tier.
 * Adding future tiers (e.g. CAMPUS, TEAM) or new features only requires updating this definition.
 */
export const PLAN_FEATURES: Record<PlanType, FeatureEntitlement[]> = {
  FREE: ["AI_BASIC"],
  PRO: [
    "AI_BASIC",
    "AI_HIGH_LIMIT",
    "AI_STUDY_PLAN",
    "SMART_COMMAND_CENTER",
    "ADVANCED_INSIGHTS",
    "ADVANCED_ANALYTICS",
  ],
};

export type UserSubscriptionData = {
  id?: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  provider: BillingProviderType;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  isPro: boolean;
};

/**
 * Configurable pricing defaults.
 * $9.99 is provisional and can be overridden via PRO_PRICE_DISPLAY or PRO_PRICE_USD env vars.
 */
export const PRO_MONTHLY_PRICE_USD = 9.99;

export function getProPriceDisplay(): string {
  const custom = process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || process.env.PRO_PRICE_DISPLAY;
  if (custom && custom.trim().length > 0) return custom.trim();
  return `$${PRO_MONTHLY_PRICE_USD.toFixed(2)}`;
}
