import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit } from "@/app/lib/ai";
import { getUserCourses } from "@/app/lib/courses";
import { getTodayTimetable } from "@/app/lib/timetable";
import { getUpcomingAssignments } from "@/app/lib/assignments";
import { getUpcomingExams } from "@/app/lib/exams";
import { getAcademicOverview } from "@/app/lib/academic";
import { getWeeklyStudyTotal } from "@/app/lib/study-sessions";
import { getUserGoals } from "@/app/lib/goals";
import { getAvailableStudyWindows } from "@/app/lib/study-availability";
import { getPKTDateParts } from "@/app/lib/timezone";
import { calculateDaysRemaining } from "@/app/lib/exam-definitions";
import { DraftStudyPlan, DraftPlanItem } from "@/app/lib/study-plan-definitions";
import { hasEntitlement } from "@/app/lib/entitlements";
import { checkAndIncrementAiUsage } from "@/app/lib/ai-limits";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict server-side authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Always use session.userId, ignore any client-supplied userId
    const userId = session.userId;

    // 2. Server-side Pro entitlement check
    const hasAccess = await hasEntitlement(userId, "AI_STUDY_PLAN");
    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "UniMate Pro is required to generate AI Study Plans.",
          code: "UPGRADE_REQUIRED",
          upgradeUrl: "/dashboard/billing",
        },
        { status: 403 }
      );
    }

    // 3. Durable daily AI quota check & increment
    const quota = await checkAndIncrementAiUsage(userId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI limit reached (${quota.currentCount}/${quota.limit} requests today). Quota resets at midnight.`,
          code: "QUOTA_EXCEEDED",
          currentCount: quota.currentCount,
          limit: quota.limit,
          upgradeUrl: "/dashboard/billing",
        },
        { status: 429 }
      );
    }

    // 4. Sliding-window rate limit check (burst protection)
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before requesting another plan." },
        { status: 429 }
      );
    }

    // 5. Parse and sanitize user request input
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const availableHours = Math.max(0.5, Math.min(12, Number(body.availableHours) || 3));
    const targetDateStr = body.targetDate || new Date().toISOString().split("T")[0];
    const targetDate = new Date(`${targetDateStr}T12:00:00`);
    const preferredStartTime = body.preferredStartTime || "18:00";
    const focusInstruction = typeof body.focusInstruction === "string" ? body.focusInstruction.slice(0, 300) : "";

    // 4. Gather real student academic context (STRICTLY EXCLUDING EXPENSES, PASSWORDS, SECRETS, INTERNAL DB IDs)
    const pkt = getPKTDateParts(targetDate);

    const [
      courses,
      timetable,
      assignments,
      exams,
      academics,
      weeklyStudy,
      goals,
      availability,
    ] = await Promise.all([
      getUserCourses(userId),
      getTodayTimetable(userId, pkt.dayOfWeek),
      getUpcomingAssignments(userId, 8),
      getUpcomingExams(userId),
      getAcademicOverview(userId),
      getWeeklyStudyTotal(userId, targetDate),
      getUserGoals(userId),
      getAvailableStudyWindows(userId, targetDate),
    ]);

    // Build courses map for matching courseCode back to courseId
    const courseCodeMap = new Map<string, string>();
    for (const c of courses) {
      courseCodeMap.set(c.code.toUpperCase(), c.id);
      courseCodeMap.set(c.name.toLowerCase(), c.id);
    }

    // Sanitize context prompt
    const contextPromptLines: string[] = [
      `STUDENT PROFILE:`,
      `Date: ${targetDateStr} (${pkt.dayOfWeek === 7 ? "Sunday" : "Weekday"})`,
      `Target Study Duration: ${availableHours} hours (${Math.round(availableHours * 60)} minutes)`,
      `Preferred Start Time: ${preferredStartTime}`,
      focusInstruction ? `Student Focus Request: "${focusInstruction}"` : `No special focus requested.`,
      `\nAVAILABLE FREE STUDY WINDOWS (avoiding classes):`,
      availability.windows.length > 0
        ? availability.windows.map((w) => `- ${w.startTime} to ${w.endTime} (${w.durationMinutes} min)`).join("\n")
        : `No open windows detected during standard hours. Use evening slots.`,
      `\nENROLLED COURSES:`,
      courses.map((c) => `- ${c.name} (Code: ${c.code})`).join("\n") || "No courses recorded.",
      `\nUPCOMING EXAMS:`,
      exams.map((e) => {
        const days = calculateDaysRemaining(e.examDate);
        return `- ${e.title} for ${e.course?.code || "Course"}: ${days} days remaining, prep: ${e.preparationProgress}%`;
      }).join("\n") || "No upcoming exams.",
      `\nUPCOMING ASSIGNMENTS:`,
      assignments.map((a) => `- ${a.title} for ${a.course?.code || "Course"} (${a.priority} priority, status: ${a.status})`).join("\n") || "No pending assignments.",
      `\nACADEMIC STANDING:`,
      `GPA: ${academics.gpaString}, Overall Attendance: ${academics.attendanceString}`,
    ];

    const contextPrompt = contextPromptLines.join("\n");

    // 5. Check for Gemini API key
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Deterministic local study-plan fallback (does not pretend to be AI)
      const localPlan = generateDeterministicPlan({
        courses,
        exams,
        assignments,
        targetDateStr,
        availableHours,
        preferredStartTime,
        windows: availability.windows,
        focusInstruction,
      });

      return NextResponse.json({
        plan: localPlan,
        isFallback: true,
      });
    }

    // 6. Call Google Gemini LLM with structured output prompt
    try {
      const ai = new GoogleGenAI({ apiKey });
      const modelName = process.env.AI_MODEL || "gemini-3.6-flash";

      const systemPrompt = `You are the UniMate AI Study Planner.
Your task is to generate a realistic, structured daily study plan for a university student based STRICTLY on their real courses, upcoming deadlines, exam preparation, and available time windows.

CRITICAL RULES:
1. Output ONLY valid JSON matching this exact structure:
{
  "title": "Plan title string",
  "summary": "Brief 1-2 sentence overview of why this plan was chosen",
  "items": [
    {
      "courseCode": "EXACT course code from context e.g. DLD, CS101, or GEN",
      "title": "Specific actionable revision/task topic",
      "duration": integer duration in minutes (e.g. 45),
      "reason": "Why this is prioritized based on context",
      "suggestedTime": "HH:MM format"
    }
  ]
}
2. The sum of item durations should approximate ${Math.round(availableHours * 60)} minutes.
3. Prioritize imminent exams (<7 days with <60% prep) and close assignments first.
4. Do NOT output markdown code blocks or arbitrary text outside the JSON.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n[STUDENT ACADEMIC CONTEXT]\n${contextPrompt}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 1200,
        },
      });

      const responseText = response.text?.trim() || "";

      // Clean markdown code blocks if wrapped by model
      const jsonStr = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(jsonStr);

      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error("Invalid AI study plan shape.");
      }

      // Map courseCode back to courseId safely
      const verifiedItems: DraftPlanItem[] = parsed.items.map((it: any) => {
        const code = (it.courseCode || "").toUpperCase().trim();
        const cid = courseCodeMap.get(code) || null;
        return {
          courseCode: code || "GEN",
          courseId: cid,
          title: String(it.title || "Study Session").slice(0, 150),
          duration: Math.max(15, Math.min(240, Number(it.duration) || 45)),
          reason: String(it.reason || "Scheduled priority revision").slice(0, 200),
          suggestedTime: it.suggestedTime || preferredStartTime,
        };
      });

      const draftPlan: DraftStudyPlan = {
        title: String(parsed.title || `Study Plan for ${targetDateStr}`).slice(0, 100),
        summary: String(parsed.summary || "Targeted study sessions aligned with your upcoming priorities.").slice(0, 300),
        targetDate: targetDateStr,
        items: verifiedItems,
        isLocalFallback: false,
      };

      return NextResponse.json({
        plan: draftPlan,
        isFallback: false,
      });
    } catch (aiError) {
      console.warn("Gemini generation failed, falling back to deterministic planner:", aiError);

      const localPlan = generateDeterministicPlan({
        courses,
        exams,
        assignments,
        targetDateStr,
        availableHours,
        preferredStartTime,
        windows: availability.windows,
        focusInstruction,
      });

      return NextResponse.json({
        plan: localPlan,
        isFallback: true,
      });
    }
  } catch (error) {
    console.error("Error in POST /api/ai/study-plan:", error);
    return NextResponse.json(
      { error: "Internal server error generating study plan." },
      { status: 500 }
    );
  }
}

/**
 * Deterministic local plan generator when AI service is unavailable.
 * Strictly based on real student deadlines.
 */
function generateDeterministicPlan(data: {
  courses: Array<{ id: string; name: string; code: string }>;
  exams: any[];
  assignments: any[];
  targetDateStr: string;
  availableHours: number;
  preferredStartTime: string;
  windows: Array<{ startTime: string; endTime: string; durationMinutes: number }>;
  focusInstruction?: string;
}): DraftStudyPlan {
  const totalTargetMins = Math.round(data.availableHours * 60);
  const items: DraftPlanItem[] = [];
  let allocatedMins = 0;

  // 1. Check nearest exam
  if (data.exams.length > 0 && allocatedMins < totalTargetMins) {
    const exam = data.exams[0];
    const days = calculateDaysRemaining(exam.examDate);
    const dur = Math.min(60, totalTargetMins - allocatedMins);
    items.push({
      courseCode: exam.course?.code || "EXAM",
      courseId: exam.courseId || null,
      title: `${exam.title} Core Revision`,
      duration: dur,
      reason: `Exam in ${days} days · Current prep: ${exam.preparationProgress}%`,
      suggestedTime: data.preferredStartTime,
    });
    allocatedMins += dur;
  }

  // 2. Check nearest pending assignment
  if (data.assignments.length > 0 && allocatedMins < totalTargetMins) {
    const asgn = data.assignments[0];
    const dur = Math.min(45, totalTargetMins - allocatedMins);
    items.push({
      courseCode: asgn.course?.code || "ASGN",
      courseId: asgn.courseId || null,
      title: `${asgn.title} Progress`,
      duration: dur,
      reason: `Upcoming assignment with ${asgn.priority} priority`,
      suggestedTime: "20:00",
    });
    allocatedMins += dur;
  }

  // 3. Fill remaining time with course study or active recall
  if (allocatedMins < totalTargetMins && data.courses.length > 0) {
    const remaining = totalTargetMins - allocatedMins;
    const course = data.courses[data.courses.length - 1];
    items.push({
      courseCode: course.code,
      courseId: course.id,
      title: `${course.name} Practice & Review`,
      duration: remaining,
      reason: "Course syllabus reinforcement and problem solving",
      suggestedTime: "21:00",
    });
  } else if (items.length === 0) {
    items.push({
      courseCode: "GEN",
      courseId: null,
      title: "Focused Deep Work & Reading",
      duration: totalTargetMins,
      reason: "Open study time for personal revision and note synthesis",
      suggestedTime: data.preferredStartTime,
    });
  }

  return {
    title: `Study Plan for ${data.targetDateStr}`,
    summary: `Structured ${data.availableHours}h session generated from your upcoming academic deadlines.`,
    targetDate: data.targetDateStr,
    items,
    isLocalFallback: true,
  };
}
