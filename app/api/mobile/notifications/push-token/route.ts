import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { registerDevicePushToken, revokeDevicePushToken } from "@/app/lib/push-tokens";

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const platform = typeof body.platform === "string" ? body.platform.trim() : "android";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Push token is required" },
        { status: 400 }
      );
    }

    await registerDevicePushToken(session.userId, token, platform);

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully.",
    });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    let token = req.nextUrl.searchParams.get("token") || "";
    if (!token) {
      try {
        const body = await req.json();
        token = typeof body.token === "string" ? body.token.trim() : "";
      } catch {
        // query param fallback
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Push token is required" },
        { status: 400 }
      );
    }

    await revokeDevicePushToken(session.userId, token);

    return NextResponse.json({
      success: true,
      message: "Push token revoked successfully.",
    });
  } catch (error) {
    console.error("Error revoking push token:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
