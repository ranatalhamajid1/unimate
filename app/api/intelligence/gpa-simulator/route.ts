import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { hasEntitlement } from "@/app/lib/entitlements";
import { runStudentGpaSimulation, CourseSimulationInput } from "@/app/lib/intelligence/gpa-simulator";
import { GRADE_POINTS } from "@/app/lib/academic-definitions";

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Entitlement verification
    const allowed = await hasEntitlement(auth.userId, "ADVANCED_INSIGHTS");
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "GPA What-If Simulation requires UniMate Pro.",
          code: "UPGRADE_REQUIRED",
          feature: "ADVANCED_INSIGHTS",
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // 2. Parse and validate body
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.scenarios)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload. Expected { scenarios: Array<{ courseId, simulatedGrade }> }" },
        { status: 400 }
      );
    }

    // Validate scenario items
    const validScenarios: CourseSimulationInput[] = [];
    for (const item of body.scenarios) {
      if (
        item &&
        typeof item.courseId === "string" &&
        typeof item.simulatedGrade === "string" &&
        GRADE_POINTS[item.simulatedGrade] !== undefined
      ) {
        validScenarios.push({
          courseId: item.courseId,
          simulatedGrade: item.simulatedGrade,
        });
      }
    }

    // Parse optional targetGpa override
    const targetGpa = typeof body.targetGpa === "number" && !isNaN(body.targetGpa) ? body.targetGpa : undefined;

    // 3. Execute pure in-memory simulation (strictly read-only)
    const simulationResult = await runStudentGpaSimulation(auth.userId, validScenarios, targetGpa);

    return NextResponse.json({
      success: true,
      data: simulationResult,
    });
  } catch (error) {
    console.error("Error in POST /api/intelligence/gpa-simulator:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
