import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { prisma } from "@/app/lib/prisma";
import { validateUsername, validateAcademicHierarchy, getUserProfile } from "@/app/lib/profile";

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      onboardingCompleted: true,
    };

    // Step 1: Academic Identity
    const universityId = body.universityId ? String(body.universityId) : null;
    const campusId = body.campusId ? String(body.campusId) : null;
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    const country = body.country ? String(body.country).trim() : null;

    if (universityId || campusId || departmentId) {
      const hierarchy = await validateAcademicHierarchy(universityId, campusId, departmentId, country);
      if (!hierarchy.valid) {
        return NextResponse.json({ success: false, error: hierarchy.error }, { status: 400 });
      }
      updateData.universityId = universityId;
      updateData.campusId = campusId;
      updateData.departmentId = departmentId;
    }
    if (country) updateData.country = country;

    // Step 2: Degree & Timeline
    if (body.degreeProgram) updateData.degreeProgram = String(body.degreeProgram).trim();
    if (body.currentSemester) updateData.currentSemester = String(body.currentSemester).trim();
    if (body.graduationYear) {
      const gradYear = parseInt(body.graduationYear, 10);
      if (!isNaN(gradYear) && gradYear >= 1970 && gradYear <= 2100) {
        updateData.graduationYear = gradYear;
      }
    }

    // Step 3: Personal Identity
    if (body.username) {
      const usernameCheck = validateUsername(String(body.username));
      if (!usernameCheck.valid || !usernameCheck.normalized) {
        return NextResponse.json(
          { success: false, error: usernameCheck.error || "Invalid username" },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { username: usernameCheck.normalized },
        select: { id: true },
      });
      if (existing && existing.id !== session.userId) {
        return NextResponse.json(
          { success: false, error: "This username is already taken. Please choose another." },
          { status: 409 }
        );
      }
      updateData.username = usernameCheck.normalized;
    }

    if (body.bio !== undefined) {
      updateData.bio = body.bio ? String(body.bio).trim().slice(0, 280) : null;
    }

    if (body.primaryGoal) {
      const goalStr = String(body.primaryGoal).trim();
      if (goalStr.length > 0) {
        await prisma.studentGoal.create({
          data: {
            userId: session.userId,
            type: "TARGET_GPA",
            targetValue: 3.8,
            period: "SEMESTER",
            active: true,
          },
        }).catch(() => {});
      }
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    const profile = await getUserProfile(session.userId);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("Error in POST /api/mobile/user/onboarding:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete onboarding." },
      { status: 500 }
    );
  }
}
