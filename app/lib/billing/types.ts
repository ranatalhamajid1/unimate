import { PlanType, SubscriptionStatus } from "@/app/lib/entitlement-definitions";

export type CheckoutSessionParams = {
  userId: string;
  userEmail: string;
  userName: string;
  plan: "PRO";
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSessionResult = {
  checkoutUrl: string;
  providerSessionId?: string;
  mode?: "redirect" | "overlay";
};

export type CustomerPortalResult = {
  portalUrl: string;
};

export type WebhookEventResult = {
  handled: boolean;
  eventType: string;
  userId?: string;
  plan?: PlanType;
  status?: SubscriptionStatus;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

export interface IPaymentProvider {
  readonly name: string;

  /**
   * Initializes a checkout session for upgrading to Pro.
   */
  createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult>;

  /**
   * Creates a self-serve customer billing portal link.
   */
  createPortalSession(
    userId: string,
    customerId?: string | null
  ): Promise<CustomerPortalResult>;

  /**
   * Cryptographically verifies and parses incoming provider webhooks.
   */
  verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventResult>;

  /**
   * Directly requests subscription cancellation from the provider.
   */
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}
