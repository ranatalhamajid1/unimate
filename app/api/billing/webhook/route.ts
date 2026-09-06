import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getBillingProvider } from "@/app/lib/billing/adapter";

export async function POST(req: NextRequest) {
  const provider = getBillingProvider();

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (error) {
    return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
  }

  const headersMap: Record<string, string> = {};
  req.headers.forEach((val, key) => {
    headersMap[key.toLowerCase()] = val;
  });

  let eventResult;
  try {
    eventResult = await provider.verifyAndParseWebhook(rawBody, headersMap);
  } catch (sigError: any) {
    console.error("Webhook signature verification failed:", sigError?.message);
    return NextResponse.json(
      { error: sigError?.message || "Invalid webhook signature." },
      { status: 400 }
    );
  }

  if (!eventResult || !eventResult.handled) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    let targetUserId = eventResult.userId;

    // If userId not present directly in event metadata, lookup existing by providerCustomerId
    if (!targetUserId && eventResult.providerCustomerId) {
      const existing = await prisma.subscription.findFirst({
        where: {
          providerCustomerId: eventResult.providerCustomerId,
        },
        select: { userId: true },
      });
      if (existing) {
        targetUserId = existing.userId;
      }
    }

    if (!targetUserId) {
      console.warn("Webhook event received without associated userId. Ignored safely.");
      return NextResponse.json({ received: true, unmapped: true });
    }

    // Idempotent atomic upsert
    await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: eventResult.plan || "PRO",
        status: eventResult.status || "ACTIVE",
        provider: provider.name,
        providerCustomerId: eventResult.providerCustomerId || null,
        providerSubscriptionId: eventResult.providerSubscriptionId || null,
        currentPeriodStart: eventResult.currentPeriodStart || new Date(),
        currentPeriodEnd: eventResult.currentPeriodEnd || null,
        cancelAtPeriodEnd: Boolean(eventResult.cancelAtPeriodEnd),
      },
      update: {
        plan: eventResult.plan || "PRO",
        status: eventResult.status || "ACTIVE",
        provider: provider.name,
        providerCustomerId: eventResult.providerCustomerId || undefined,
        providerSubscriptionId: eventResult.providerSubscriptionId || undefined,
        currentPeriodStart: eventResult.currentPeriodStart || undefined,
        currentPeriodEnd: eventResult.currentPeriodEnd || undefined,
        cancelAtPeriodEnd: Boolean(eventResult.cancelAtPeriodEnd),
      },
    });

    return NextResponse.json({
      received: true,
      event: eventResult.eventType,
      userId: targetUserId,
    });
  } catch (dbError: any) {
    console.error("Database error processing webhook event:", dbError);
    return NextResponse.json(
      { error: "Internal error updating subscription state." },
      { status: 500 }
    );
  }
}
