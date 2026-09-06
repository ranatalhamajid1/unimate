import { IPaymentProvider } from "@/app/lib/billing/types";
import { PaddleBillingAdapter } from "@/app/lib/billing/providers/paddle";
import { LemonSqueezyBillingAdapter } from "@/app/lib/billing/providers/lemonsqueezy";
import { MockBillingAdapter } from "@/app/lib/billing/providers/mock";

let customProviderInstance: IPaymentProvider | null = null;

/**
 * Returns the currently active billing provider adapter.
 * Configured via BILLING_PROVIDER environment variable ("PADDLE" | "LEMONSQUEEZY" | "MOCK").
 * Defaults to PADDLE for production readiness.
 */
export function getBillingProvider(): IPaymentProvider {
  if (customProviderInstance) {
    return customProviderInstance;
  }

  const configured = (process.env.BILLING_PROVIDER || "PADDLE").toUpperCase().trim();

  switch (configured) {
    case "LEMONSQUEEZY":
      return new LemonSqueezyBillingAdapter();

    case "MOCK":
      return new MockBillingAdapter();

    case "PADDLE":
    default:
      return new PaddleBillingAdapter();
  }
}

/**
 * Overrides the active billing adapter for unit and integration testing.
 */
export function setTestBillingProvider(provider: IPaymentProvider | null): void {
  customProviderInstance = provider;
}
