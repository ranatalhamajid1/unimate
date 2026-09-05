import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { generateStudyBuddyResponse, ChatMessage } from "@/app/lib/ai";

export async function POST(req: NextRequest) {
  try {
    // 1. Session check - strictly server-side authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message, history } = body;

    // Reject missing or non-string message
    if (typeof message !== "string") {
      return NextResponse.json(
        { error: "Message must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Impose reasonable MVP length limit (1000 chars)
    if (trimmed.length > 1000) {
      return NextResponse.json(
        { error: "Message exceeds maximum allowed length of 1,000 characters" },
        { status: 400 }
      );
    }

    // Sanitize optional history (max 6 items, valid role/content)
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

    // 3. Generate response using authenticated session userId
    const response = await generateStudyBuddyResponse(
      session.userId,
      trimmed,
      sanitizedHistory,
      session.name
    );

    return NextResponse.json({ response });
  } catch (error: unknown) {
    console.error("API error in /api/ai/study-buddy:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
