import crypto from "crypto";
import {
  IPaymentProvider,
  CheckoutSessionParams,
  CheckoutSessionResult,
  CustomerPortalResult,
  WebhookEventResult,
} from "@/app/lib/billing/types";

export class LemonSqueezyBillingAdapter implements IPaymentProvider {
  public readonly name = "LEMONSQUEEZY";

  private apiKey: string;
  private storeId: string;
  private variantId: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.LEMONSQUEEZY_API_KEY || "";
    this.storeId = process.env.LEMONSQUEEZY_STORE_ID || "";
    this.variantId = process.env.LEMONSQUEEZY_VARIANT_ID || "";
    this.webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
  }

  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    if (!this.apiKey || !this.storeId || !this.variantId) {
      console.warn(
        "Lemon Squeezy credentials not configured. Returning simulated sandbox checkout."
      );
      const simulatedId = `ls_sandbox_${params.userId}_${Date.now()}`;
      return {
        checkoutUrl: `/dashboard/billing?lemonsqueezy_sandbox=true&session_id=${simulatedId}`,
        providerSessionId: simulatedId,
        mode: "redirect",
      };
    }

    try {
      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: params.userEmail,
                name: params.userName,
                custom: {
                  userId: params.userId,
                },
              },
              product_options: {
                redirect_url: params.successUrl || "/dashboard/billing?success=true",
              },
            },
            relationships: {
              store: {
                data: { type: "stores", id: this.storeId },
              },
              variant: {
                data: { type: "variants", id: this.variantId },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Lemon Squeezy checkout failed: ${await response.text()}`);
      }

      const resJson = await response.json();
      return {
        checkoutUrl: resJson.data?.attributes?.url || "/dashboard/billing",
        providerSessionId: resJson.data?.id,
        mode: "redirect",
      };
    } catch (error) {
      console.error("Error creating Lemon Squeezy checkout:", error);
      throw error;
    }
  }

  async createPortalSession(
    userId: string,
    customerId?: string | null
  ): Promise<CustomerPortalResult> {
    return {
      portalUrl: "https://app.lemonsqueezy.com/my-orders",
    };
  }

  async verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventResult> {
    const signature =
      (headers["x-signature"] as string) || (headers["X-Signature"] as string);

    if (this.webhookSecret && signature) {
      const hmac = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature, "hex"),
          Buffer.from(hmac, "hex")
        )
      ) {
        throw new Error("Invalid Lemon Squeezy webhook signature.");
      }
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name || "";
    const customData = payload.meta?.custom_data || {};
    const attrs = payload.data?.attributes || {};

    const userId = customData.userId || customData.user_id;
    const customerId = String(attrs.customer_id || "");
    const subscriptionId = String(payload.data?.id || "");

    let plan: "FREE" | "PRO" = "FREE";
    let status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "PAUSED" | "TRIALING" =
      "ACTIVE";

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "order_created":
        plan = "PRO";
        status =
          attrs.status === "past_due"
            ? "PAST_DUE"
            : attrs.status === "paused"
            ? "PAUSED"
            : "ACTIVE";
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        plan = "FREE";
        status = "CANCELED";
        break;
    }

    return {
      handled: true,
      eventType: eventName,
      userId,
      plan,
      status,
      providerCustomerId: customerId,
      providerSubscriptionId: subscriptionId,
      currentPeriodStart: attrs.renews_at ? new Date(attrs.created_at) : undefined,
      currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : undefined,
      cancelAtPeriodEnd: Boolean(attrs.cancelled),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return true;
  }
}
