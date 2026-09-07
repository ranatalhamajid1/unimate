import { NextResponse } from "next/server";

export async function POST() {
  // Mobile clients discard their Bearer token locally from secure storage.
  return NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
}
