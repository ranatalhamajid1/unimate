import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { prisma } from "@/app/lib/prisma";
import {
  getUserProfile,
  validateUsername,
  validateAcademicHierarchy,
} from "@/app/lib/profile";

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    const profile = await getUserProfile(session.userId);
    if (!profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("Error in GET /api/mobile/user/profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await authenticateMobile(req);
    if (!session || !session.userId) {
      return unauthorizedResponse();
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    // 1. Name validation
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2 || name.length > 70) {
        return NextResponse.json(
          { success: false, error: "Name must be between 2 and 70 characters." },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    // 2. Username validation & uniqueness
    if (body.username !== undefined) {
      if (body.username === null || body.username === "") {
        updateData.username = null;
      } else {
        const usernameCheck = validateUsername(String(body.username));
        if (!usernameCheck.valid || !usernameCheck.normalized) {
          return NextResponse.json(
            { success: false, error: usernameCheck.error || "Invalid username." },
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
    }

    // 3. Bio validation
    if (body.bio !== undefined) {
      const bio = body.bio === null ? null : String(body.bio).trim();
      if (bio && bio.length > 280) {
        return NextResponse.json(
          { success: false, error: "Bio cannot exceed 280 characters." },
          { status: 400 }
        );
      }
      updateData.bio = bio;
    }

    // 4. Country & City with Cascading Hierarchy Reset
    const countryProvided = body.country !== undefined;
    const targetCountry = countryProvided ? (body.country ? String(body.country).trim() : null) : undefined;
    if (countryProvided) {
      updateData.country = targetCountry;
    }
    if (body.city !== undefined) {
      updateData.city = body.city ? String(body.city).trim() : null;
    }

    let targetUnivId = body.universityId !== undefined ? (body.universityId ? String(body.universityId) : null) : undefined;
    let targetCampusId = body.campusId !== undefined ? (body.campusId ? String(body.campusId) : null) : undefined;
    let targetDeptId = body.departmentId !== undefined ? (body.departmentId ? String(body.departmentId) : null) : undefined;

    if (countryProvided || targetUnivId !== undefined || targetCampusId !== undefined || targetDeptId !== undefined) {
      const current = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { country: true, universityId: true, campusId: true, departmentId: true },
      });

      const effectiveCountry = targetCountry !== undefined ? targetCountry : current?.country;
      const countryChanged = targetCountry !== undefined && (targetCountry || "").toLowerCase() !== (current?.country || "").toLowerCase();

      // If country changed, cascade clear stale universityId, campusId, departmentId unless new university explicitly provided
      if (countryChanged && targetUnivId === undefined) {
        targetUnivId = null;
        targetCampusId = null;
        targetDeptId = null;
      }

      // If university is changing or cleared, cascade clear campus and department if not explicitly set
      const universityChanged = targetUnivId !== undefined && targetUnivId !== current?.universityId;
      if ((targetUnivId === null || universityChanged) && targetCampusId === undefined) {
        targetCampusId = null;
      }
      if ((targetUnivId === null || universityChanged) && targetDeptId === undefined) {
        targetDeptId = null;
      }

      const effectiveUniv = targetUnivId !== undefined ? targetUnivId : current?.universityId;
      const effectiveCampus = targetCampusId !== undefined ? targetCampusId : current?.campusId;
      const effectiveDept = targetDeptId !== undefined ? targetDeptId : current?.departmentId;

      const hierarchyCheck = await validateAcademicHierarchy(effectiveUniv, effectiveCampus, effectiveDept, effectiveCountry);
      if (!hierarchyCheck.valid) {
        return NextResponse.json({ success: false, error: hierarchyCheck.error }, { status: 400 });
      }

      if (targetUnivId !== undefined) updateData.universityId = targetUnivId;
      if (targetCampusId !== undefined) updateData.campusId = targetCampusId;
      if (targetDeptId !== undefined) updateData.departmentId = targetDeptId;
    }

    // 5. Degree Program & Semester
    if (body.degreeProgram !== undefined) {
      updateData.degreeProgram = body.degreeProgram ? String(body.degreeProgram).trim() : null;
    }
    if (body.currentSemester !== undefined) {
      updateData.currentSemester = body.currentSemester ? String(body.currentSemester).trim() : null;
    }
    if (body.graduationYear !== undefined) {
      const gradYear = body.graduationYear ? Number(body.graduationYear) : null;
      if (gradYear !== null && (isNaN(gradYear) || gradYear < 1970 || gradYear > 2100)) {
        return NextResponse.json(
          { success: false, error: "Invalid graduation year." },
          { status: 400 }
        );
      }
      updateData.graduationYear = gradYear;
    }

    // 7. Arrays: Skills, Interests, Languages
    if (body.skills !== undefined && Array.isArray(body.skills)) {
      updateData.skills = body.skills.map((s: any) => String(s).trim()).filter(Boolean);
    }
    if (body.interests !== undefined && Array.isArray(body.interests)) {
      updateData.interests = body.interests.map((s: any) => String(s).trim()).filter(Boolean);
    }
    if (body.languages !== undefined && Array.isArray(body.languages)) {
      updateData.languages = body.languages.map((s: any) => String(s).trim()).filter(Boolean);
    }

    // 8. Social links
    if (body.socialLinks !== undefined) {
      if (body.socialLinks === null) {
        updateData.socialLinks = null;
      } else if (typeof body.socialLinks === "object") {
        updateData.socialLinks = body.socialLinks;
      }
    }

    // 9. Onboarding & Public Profile Flags
    if (typeof body.onboardingCompleted === "boolean") {
      updateData.onboardingCompleted = body.onboardingCompleted;
    }
    if (typeof body.isPublicProfile === "boolean") {
      updateData.isPublicProfile = body.isPublicProfile;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    const updatedProfile = await getUserProfile(session.userId);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/mobile/user/profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
