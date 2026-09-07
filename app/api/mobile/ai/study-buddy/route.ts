import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { generateStudyBuddyResponse, ChatMessage } from "@/app/lib/ai";
import { checkAndIncrementAiUsage } from "@/app/lib/ai-limits";

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { message, history } = body;

    if (typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json(
        { success: false, error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmed.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Message exceeds maximum allowed length of 1,000 characters" },
        { status: 400 }
      );
    }

    let sanitizedHistory: ChatMessage[] = [];
    if (Array.isArray(history)) {
      sanitizedHistory = history
        .filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "model") &&
            typeof item.content === "string" &&
            item.content.length <= 2000
        )
        .slice(-6) as ChatMessage[];
    }

    // Check daily quota
    const quota = await checkAndIncrementAiUsage(session.userId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `You've reached your daily AI limit (${quota.currentCount}/${quota.limit} requests today). Quota resets at midnight. Upgrade to Pro for 10x higher allowance!`,
          code: "QUOTA_EXCEEDED",
          currentCount: quota.currentCount,
          limit: quota.limit,
          remaining: quota.remaining,
        },
        { status: 429 }
      );
    }

    const response = await generateStudyBuddyResponse(
      session.userId,
      trimmed,
      sanitizedHistory,
      session.name
    );

    return NextResponse.json({
      success: true,
      response,
      quota: {
        currentCount: quota.currentCount,
        limit: quota.limit,
        remaining: quota.remaining,
      },
    });
  } catch (error: any) {
    console.error("Error in mobile AI Study Buddy:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
