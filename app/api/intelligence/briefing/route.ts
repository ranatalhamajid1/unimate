import { NextRequest, NextResponse } from "next/server";
import { resolveAuth } from "@/app/lib/auth-resolver";
import { prisma } from "@/app/lib/prisma";
import { getStudentPriorities } from "@/app/lib/intelligence/priority-engine";
import { getStudentAttendanceIntelligence } from "@/app/lib/intelligence/attendance-intel";
import { getStudentExamReadiness } from "@/app/lib/intelligence/exam-readiness";
import { getStudentTodayScheduleGaps } from "@/app/lib/intelligence/schedule-gaps";
import { getUserSubscription } from "@/app/lib/entitlements";
import { getTodayTimetable } from "@/app/lib/timetable";

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentHour = now.getHours();
    const greeting = getGreeting(currentHour);

    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    // Parallel fetch of deterministic intelligence
    const [user, timetable, priorities, attendance, examReadiness, scheduleGaps, subscription] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: auth.userId },
          select: { name: true },
        }),
        getTodayTimetable(auth.userId, dayOfWeek),
        getStudentPriorities(auth.userId, 5, now),
        getStudentAttendanceIntelligence(auth.userId, 0.75),
        getStudentExamReadiness(auth.userId, now),
        getStudentTodayScheduleGaps(auth.userId, now),
        getUserSubscription(auth.userId),
      ]);

    const firstName = user?.name ? user.name.split(" ")[0] : "Student";
    const headline = `${greeting}, ${firstName}`;

    // Filter upcoming exams in next 7 days
    const upcomingExams = examReadiness.exams.filter((e) => e.daysRemaining <= 7);

    // At-risk or watch attendance courses
    const attendanceAlerts = attendance.courses.filter(
      (c) => c.status === "AT_RISK" || c.status === "WATCH"
    );

    // Deterministic state assessment
    let dayStatus: "CALM" | "MANAGEABLE" | "HEAVY" = "CALM";
    const totalLoad = timetable.length + priorities.length + upcomingExams.length;
    if (totalLoad > 5 || priorities.some((p) => p.urgencyTier === "OVERDUE" || p.urgencyTier === "CRITICAL")) {
      dayStatus = "HEAVY";
    } else if (totalLoad >= 2) {
      dayStatus = "MANAGEABLE";
    }

    // Compose concise explanation
    const statusMessages: string[] = [];
    if (timetable.length > 0) {
      statusMessages.push(`${timetable.length} class${timetable.length > 1 ? "es" : ""} scheduled`);
    } else {
      statusMessages.push("No classes today");
    }

    const overdueCount = priorities.filter((p) => p.urgencyTier === "OVERDUE").length;
    if (overdueCount > 0) {
      statusMessages.push(`${overdueCount} overdue assignment${overdueCount > 1 ? "s" : ""}`);
    } else if (priorities.length > 0) {
      statusMessages.push(`${priorities.length} active priority item${priorities.length > 1 ? "s" : ""}`);
    }

    if (upcomingExams.length > 0) {
      statusMessages.push(`${upcomingExams.length} exam${upcomingExams.length > 1 ? "s" : ""} this week`);
    }

    const summary = statusMessages.join(" • ");

    // Explainable "Why These Matter" deterministic synthesis
    let whyTheseMatter = "";
    if (priorities.length > 0) {
      const topTask = priorities[0];
      whyTheseMatter = `Focus on ${topTask.action} first. ${topTask.reason}.`;
      if (scheduleGaps.length > 0 && scheduleGaps[0].durationMinutes >= 60) {
        whyTheseMatter += ` You have a ${scheduleGaps[0].durationMinutes}-minute study window (${scheduleGaps[0].startTime} - ${scheduleGaps[0].endTime}) to make progress.`;
      }
    } else if (upcomingExams.length > 0) {
      const nearest = upcomingExams[0];
      whyTheseMatter = `Your assignments are caught up. Recommend dedicating focus to ${nearest.title} (${nearest.recommendation}).`;
    } else {
      whyTheseMatter = "Your academic slate is clean today. Maintain your momentum by reviewing upcoming lecture notes.";
    }

    // Optional AI-generated briefing hydration (only when ?ai=true is explicitly requested)
    const url = new URL(req.url);
    const requestAi = url.searchParams.get("ai") === "true";
    let aiBriefing = whyTheseMatter;
    let aiGenerated = false;
    let quotaExceeded = false;

    if (requestAi) {
      const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const { checkRateLimit } = await import("@/app/lib/ai");
          const { getDailyAiUsage, checkAndIncrementAiUsage } = await import("@/app/lib/ai-limits");

          if (checkRateLimit(auth.userId)) {
            // Check quota before incrementing
            const currentUsage = await getDailyAiUsage(auth.userId);
            if (!currentUsage.allowed || currentUsage.remaining <= 0) {
              quotaExceeded = true;
            } else {
              // Atomically increment quota for this attempted AI synthesis
              const incUsage = await checkAndIncrementAiUsage(auth.userId);
              if (!incUsage.allowed) {
                quotaExceeded = true;
              } else {
                const ai = new GoogleGenAI({ apiKey });
                const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

                const minimalContext = JSON.stringify({
                  classesTodayCount: timetable.length,
                  classes: timetable.map((t) => `${t.course?.code || ""} (${t.startTime}-${t.endTime})`),
                  topPriorities: priorities.slice(0, 3).map((p) => ({
                    action: p.action,
                    reason: p.reason,
                    urgency: p.urgencyTier,
                    deadline: p.deadlineLabel,
                  })),
                  upcomingExams: upcomingExams.slice(0, 2).map((e) => `${e.title} (${e.daysRemaining} days away)`),
                  attendanceAlertsCount: attendanceAlerts.length,
                });

                const prompt = `You are the executive academic advisor for UniMate.
Based strictly on this student's academic context:
${minimalContext}

Generate a calm, motivating, executive 2-sentence briefing for their day.
State what they should focus on first and why.
Do NOT use markdown headers or bullet points. Output plain text only.`;

                const response = await ai.models.generateContent({
                  model: modelName,
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                });

                const text = response.text ? response.text.trim() : "";
                if (text && text.length > 10) {
                  aiBriefing = text;
                  aiGenerated = true;
                }
              }
            }
          }
        } catch (aiErr) {
          // Graceful fallback: preserve deterministic briefing
          console.warn("AI briefing hydration skipped/failed, using deterministic fallback:", aiErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        headline,
        dayStatus,
        summary,
        whyTheseMatter,
        strategy: aiBriefing || whyTheseMatter,
        actionableAdvice: aiBriefing || whyTheseMatter,
        source: aiGenerated ? "ai" : "deterministic",
        aiBriefing,
        aiGenerated,
        quotaExceeded,
        todayClassesCount: timetable.length,
        todayClasses: timetable.map((t) => ({
          course: t.course?.name || "Class",
          courseCode: t.course?.code || "",
          startTime: t.startTime,
          endTime: t.endTime,
          room: t.room,
          type: t.type,
        })),
        topPriorities: priorities,
        upcomingExams: upcomingExams,
        attendanceAlerts: attendanceAlerts,
        scheduleGaps: scheduleGaps,
        isPro: subscription.isPro,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/intelligence/briefing:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
