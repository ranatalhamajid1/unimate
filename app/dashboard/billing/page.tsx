import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/app/lib/entitlements";
import { getDailyAiUsage } from "@/app/lib/ai-limits";
import { getProPriceDisplay } from "@/app/lib/entitlement-definitions";
import { BillingView } from "@/components/billing/billing-view";

export const metadata = {
  title: "Billing & Subscription — UniMate",
  description: "Manage your UniMate plan, AI allowances, and payment settings.",
};

export default async function BillingPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login?next=/dashboard/billing");
  }

  const [subscription, aiUsage] = await Promise.all([
    getUserSubscription(session.userId),
    getDailyAiUsage(session.userId),
  ]);

  const proPriceDisplay = getProPriceDisplay();

  return (
    <div className="p-6 sm:p-8">
      <BillingView
        subscription={subscription}
        aiUsage={aiUsage}
        proPriceDisplay={proPriceDisplay}
      />
    </div>
  );
}
