import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { getBillingProvider } from "@/app/lib/billing/adapter";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict server-side authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upgrade." },
        { status: 401 }
      );
    }

    // Never trust client-supplied userId; derive strictly from authenticated session
    const userId = session.userId;
    const userEmail = session.email;
    const userName = session.name || "Student";

    // 2. Delegate to active billing provider adapter
    const provider = getBillingProvider();
    const result = await provider.createCheckoutSession({
      userId,
      userEmail,
      userName,
      plan: "PRO",
      successUrl: "/dashboard/billing?success=true",
      cancelUrl: "/dashboard/billing?canceled=true",
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      provider: provider.name,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize checkout session." },
      { status: 500 }
    );
  }
}
