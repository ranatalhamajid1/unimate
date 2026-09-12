import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import {
  resolveStudentHierarchyContext,
  getCampusIntelligence,
} from "@/app/lib/discovery";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const ctx = await resolveStudentHierarchyContext(auth.userId);

    // Compute deterministic campus intelligence without consuming AI quota
    const intelligence = await getCampusIntelligence(ctx);

    return NextResponse.json({
      campusIntelligence: intelligence,
    });
  } catch (error: any) {
    console.error("GET /api/discovery/intelligence error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching campus intelligence." },
      { status: 500 }
    );
  }
}
