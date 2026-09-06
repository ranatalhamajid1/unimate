import {
  IPaymentProvider,
  CheckoutSessionParams,
  CheckoutSessionResult,
  CustomerPortalResult,
  WebhookEventResult,
} from "@/app/lib/billing/types";

export class MockBillingAdapter implements IPaymentProvider {
  public readonly name = "MOCK";

  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const mockId = `mock_chk_${Date.now()}`;
    return {
      checkoutUrl: `/dashboard/billing?mock_checkout=true&session_id=${mockId}&plan=PRO`,
      providerSessionId: mockId,
      mode: "redirect",
    };
  }

  async createPortalSession(
    userId: string,
    customerId?: string | null
  ): Promise<CustomerPortalResult> {
    return {
      portalUrl: `/dashboard/billing?mock_portal=true&userId=${userId}`,
    };
  }

  async verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventResult> {
    const signature = headers["x-mock-signature"] || headers["X-Mock-Signature"];
    if (signature === "invalid") {
      throw new Error("Invalid mock webhook signature.");
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new Error("Malformed webhook JSON body.");
    }

    const eventType = parsed.event_type || parsed.type || "subscription.created";
    const data = parsed.data || parsed;

    return {
      handled: true,
      eventType,
      userId: data.userId || data.user_id,
      plan: (data.plan as any) || "PRO",
      status: (data.status as any) || "ACTIVE",
      providerCustomerId: data.customerId || "mock_cust_123",
      providerSubscriptionId: data.subscriptionId || "mock_sub_123",
      currentPeriodStart: data.currentPeriodStart ? new Date(data.currentPeriodStart) : new Date(),
      currentPeriodEnd: data.currentPeriodEnd
        ? new Date(data.currentPeriodEnd)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return true;
  }
}
