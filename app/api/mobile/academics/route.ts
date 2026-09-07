import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { getAcademicOverview } from "@/app/lib/academic";

export async function GET(req: NextRequest) {
  const session = await authenticateMobile(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const overview = await getAcademicOverview(session.userId);
    return NextResponse.json({ success: true, academics: overview });
  } catch (error) {
    console.error("Error in GET /api/mobile/academics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch academic overview." },
      { status: 500 }
    );
  }
}
