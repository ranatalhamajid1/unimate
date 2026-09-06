import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { getUserSubscription } from "@/app/lib/entitlements";
import { getBillingProvider } from "@/app/lib/billing/adapter";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const sub = await getUserSubscription(session.userId);
    const provider = getBillingProvider();

    const portal = await provider.createPortalSession(
      session.userId,
      sub.providerCustomerId
    );

    return NextResponse.json({
      portalUrl: portal.portalUrl,
      provider: provider.name,
    });
  } catch (error: any) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize billing portal." },
      { status: 500 }
    );
  }
}
