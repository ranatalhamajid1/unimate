import { NextRequest, NextResponse } from "next/server";
import { authenticateMobile, unauthorizedResponse } from "@/app/lib/mobile-auth";
import { findUserById } from "@/app/lib/users";
import { getUserSubscription } from "@/app/lib/entitlements";
import { getUserProfile } from "@/app/lib/profile";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate mobile request via Bearer token
    const session = await authenticateMobile(req);
    if (!session) {
      return unauthorizedResponse();
    }

    // 2. Fetch user profile from database
    const user = await findUserById(session.userId);
    if (!user) {
      return unauthorizedResponse("User account not found");
    }

    // 3. Fetch user subscription details
    const subscription = await getUserSubscription(session.userId);

    // 4. Fetch rich profile identity data
    const profile = await getUserProfile(session.userId);

    // 5. Return sanitized profile (strictly excluding passwordHash and secrets)
    // Preserves existing contract fields (id, name, email, createdAt, subscription)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        avatarUrl: profile?.avatarUrl || null,
        username: profile?.username || null,
        bio: profile?.bio || null,
        country: profile?.country || null,
        city: profile?.city || null,
        degreeProgram: profile?.degreeProgram || null,
        currentSemester: profile?.currentSemester || null,
        graduationYear: profile?.graduationYear || null,
        profileCompletionPercentage: profile?.profileCompletionPercentage || 0,
        onboardingCompleted: profile?.onboardingCompleted || false,
        university: profile?.university || null,
        campus: profile?.campus || null,
        department: profile?.department || null,
      },
      subscription: {
        plan: subscription.plan,
        isPro: subscription.isPro,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("Error in mobile /me API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}
