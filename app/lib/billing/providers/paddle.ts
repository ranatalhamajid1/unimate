import crypto from "crypto";
import {
  IPaymentProvider,
  CheckoutSessionParams,
  CheckoutSessionResult,
  CustomerPortalResult,
  WebhookEventResult,
} from "@/app/lib/billing/types";

export class PaddleBillingAdapter implements IPaymentProvider {
  public readonly name = "PADDLE";

  private apiKey: string;
  private webhookSecret: string;
  private proPriceId: string;
  private apiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.PADDLE_API_KEY || "";
    this.webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || "";
    this.proPriceId = process.env.PADDLE_PRO_PRICE_ID || "";

    const env = process.env.PADDLE_ENV || "sandbox";
    this.apiBaseUrl =
      env === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";
  }

  /**
   * Initializes a Paddle transaction for UniMate Pro subscription checkout.
   */
  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    if (!this.apiKey || !this.proPriceId) {
      // Safe fallback when Paddle keys are not yet configured in local environment
      console.warn(
        "PADDLE_API_KEY or PADDLE_PRO_PRICE_ID is not configured. Returning simulated sandbox checkout."
      );
      const simulatedId = `txn_sandbox_${params.userId}_${Date.now()}`;
      return {
        checkoutUrl: `/dashboard/billing?paddle_sandbox=true&session_id=${simulatedId}`,
        providerSessionId: simulatedId,
        mode: "redirect",
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ price_id: this.proPriceId, quantity: 1 }],
          customer: {
            email: params.userEmail,
            name: params.userName,
          },
          custom_data: {
            userId: params.userId,
          },
          checkout: {
            success_url: params.successUrl || "/dashboard/billing?success=true",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Paddle transaction creation failed: ${errorData}`);
      }

      const resJson = await response.json();
      const checkoutUrl =
        resJson.data?.checkout?.url ||
        resJson.data?.url ||
        `/dashboard/billing?session_id=${resJson.data?.id}`;

      return {
        checkoutUrl,
        providerSessionId: resJson.data?.id,
        mode: "redirect",
      };
    } catch (error) {
      console.error("Error creating Paddle checkout transaction:", error);
      throw error;
    }
  }

  /**
   * Creates a customer portal link for managing existing subscription and payment methods.
   */
  async createPortalSession(
    userId: string,
    customerId?: string | null
  ): Promise<CustomerPortalResult> {
    if (!customerId || !this.apiKey) {
      return {
        portalUrl: `/dashboard/billing?notice=portal_unavailable`,
      };
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/customers/${customerId}/portal-sessions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Paddle portal creation failed with status ${response.status}`);
      }

      const resJson = await response.json();
      return {
        portalUrl: resJson.data?.urls?.general?.overview || "/dashboard/billing",
      };
    } catch (error) {
      console.warn("Could not generate Paddle portal session URL:", error);
      return {
        portalUrl: "/dashboard/billing?notice=portal_direct",
      };
    }
  }

  /**
   * Cryptographically verifies and parses incoming Paddle webhook signatures.
   * Format of Paddle-Signature: "ts=1680000000;h1=abcdef..."
   */
  async verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventResult> {
    const sigHeader =
      (headers["paddle-signature"] as string) ||
      (headers["Paddle-Signature"] as string);

    if (!sigHeader) {
      throw new Error("Missing Paddle-Signature header.");
    }

    if (this.webhookSecret) {
      // Parse ts and h1 components
      const parts = sigHeader.split(";").reduce((acc, part) => {
        const [k, v] = part.split("=");
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {} as Record<string, string>);

      const ts = parts["ts"];
      const h1 = parts["h1"];

      if (!ts || !h1) {
        throw new Error("Malformed Paddle-Signature header components.");
      }

      const signedPayload = `${ts}:${rawBody}`;
      const expectedH1 = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedPayload)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(h1, "hex"),
          Buffer.from(expectedH1, "hex")
        )
      ) {
        throw new Error("Invalid Paddle webhook signature verification.");
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new Error("Malformed Paddle webhook body.");
    }

    const eventType = event.event_type || "";
    const data = event.data || {};

    const userId =
      data.custom_data?.userId ||
      data.custom_data?.user_id ||
      data.customer?.custom_data?.userId;

    const customerId = data.customer_id || data.customer?.id;
    const subscriptionId = data.id || data.subscription_id;

    let plan: "FREE" | "PRO" = "FREE";
    let status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "PAUSED" | "TRIALING" =
      "ACTIVE";

    switch (eventType) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
      case "transaction.completed":
        plan = "PRO";
        status =
          data.status === "past_due"
            ? "PAST_DUE"
            : data.status === "paused"
            ? "PAUSED"
            : "ACTIVE";
        break;

      case "subscription.canceled":
        plan = "FREE";
        status = "CANCELED";
        break;

      case "subscription.past_due":
        plan = "PRO";
        status = "PAST_DUE";
        break;
    }

    const periodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : undefined;

    const periodStart = data.current_billing_period?.starts_at
      ? new Date(data.current_billing_period.starts_at)
      : undefined;

    return {
      handled: true,
      eventType,
      userId,
      plan,
      status,
      providerCustomerId: customerId,
      providerSubscriptionId: subscriptionId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: Boolean(data.scheduled_change?.action === "cancel"),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.apiKey) return true;

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            effective_from: "next_billing_period",
          }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Failed to cancel Paddle subscription:", error);
      return false;
    }
  }
}
