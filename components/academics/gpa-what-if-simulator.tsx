"use client";

import { useState } from "react";
import { Calculator, Sparkles, TrendingUp, AlertCircle, RefreshCw, Lock, Check } from "lucide-react";
import Link from "next/link";
import { GRADE_OPTIONS } from "@/app/lib/academic-definitions";

type CourseOption = {
  courseId: string;
  courseName: string;
  courseCode: string;
  creditHours: number;
  currentGrade: string | null;
  currentGradePoints: number | null;
};

type GpaWhatIfSimulatorProps = {
  initialCourses: CourseOption[];
  initialCurrentGpa: string;
  targetGpa: number | null;
  isPro: boolean;
};

export function GpaWhatIfSimulator({
  initialCourses,
  initialCurrentGpa,
  targetGpa,
  isPro,
}: GpaWhatIfSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGradeChange = (courseId: string, grade: string) => {
    setSelectedGrades((prev) => ({
      ...prev,
      [courseId]: grade,
    }));
  };

  const handleReset = () => {
    setSelectedGrades({});
    setSimulationResult(null);
    setError(null);
  };

  const handleRunSimulation = async () => {
    if (!isPro) return;
    setIsLoading(true);
    setError(null);

    try {
      const scenarios = Object.entries(selectedGrades)
        .filter(([_, grade]) => grade && grade !== "KEEP_EXISTING")
        .map(([courseId, simulatedGrade]) => ({
          courseId,
          simulatedGrade,
        }));

      const res = await fetch("/api/intelligence/gpa-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarios }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Simulation failed");
      }

      setSimulationResult(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to calculate simulation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-standard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              GPA What-If Simulator
            </h3>
            <p className="text-xs text-[var(--color-text-2)]">
              Simulate prospective grades without modifying official records
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] transition-micro"
        >
          {isOpen ? "Close Simulator" : "Open Simulator"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)]">
          {/* Pro Gate Check */}
          {!isPro ? (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
              <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                UniMate Pro Feature
              </h4>
              <p className="text-xs text-[var(--color-text-2)] max-w-md mx-auto mt-1 mb-3">
                GPA What-If Simulation lets you model grade scenarios, predict graduation honors, and calculate exact targets.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-micro"
              >
                <Sparkles className="w-3.5 h-3.5" /> Upgrade to Pro
              </Link>
            </div>
          ) : (
            <div>
              {/* Simulation Disclaimer */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 text-blue-700 dark:text-blue-300 border border-blue-500/15 text-xs mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Simulation mode is strictly non-mutating. Your actual transcript and grades remain untouched.
                </span>
              </div>

              {/* Course Selection Table */}
              <div className="space-y-2 mb-4">
                {initialCourses.map((c) => {
                  const currentSelected = selectedGrades[c.courseId] || "";

                  return (
                    <div
                      key={c.courseId}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--color-text)]">
                          {c.courseCode}
                        </span>
                        <span className="text-[var(--color-text-2)] ml-2">
                          {c.courseName}
                        </span>
                        <span className="text-[var(--color-text-3)] ml-2">
                          ({c.creditHours} cr)
                        </span>
                        <div className="text-[11px] text-[var(--color-text-2)] mt-0.5">
                          Current Grade: {c.currentGrade || "Not graded"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-[var(--color-text-2)] font-medium">
                          Simulate:
                        </label>
                        <select
                          value={currentSelected}
                          onChange={(e) => handleGradeChange(c.courseId, e.target.value)}
                          className="px-2.5 py-1.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                        >
                          <option value="">Keep current / none</option>
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleReset}
                  disabled={isLoading || Object.keys(selectedGrades).length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-2)] hover:text-[var(--color-text)] disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  Reset Inputs
                </button>

                <button
                  onClick={handleRunSimulation}
                  disabled={isLoading || Object.keys(selectedGrades).length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  Calculate Projection
                </button>
              </div>

              {/* Simulation Results Display */}
              {simulationResult && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <p className="text-[11px] text-[var(--color-text-2)]">Current GPA</p>
                      <p className="text-base font-bold text-[var(--color-text)] mt-0.5 kpi-numeric">
                        {simulationResult.currentGpaString}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Projected GPA</p>
                      <p className="text-base font-bold text-blue-700 dark:text-blue-300 mt-0.5 kpi-numeric">
                        {simulationResult.projectedGpaString}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <p className="text-[11px] text-[var(--color-text-2)]">GPA Delta</p>
                      <p
                        className={`text-base font-bold mt-0.5 kpi-numeric ${
                          simulationResult.delta > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : simulationResult.delta < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-[var(--color-text)]"
                        }`}
                      >
                        {simulationResult.deltaString}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <p className="text-[11px] text-[var(--color-text-2)]">Target Goal</p>
                      <p className="text-base font-bold text-[var(--color-text)] mt-0.5 kpi-numeric">
                        {simulationResult.targetGpaString || "None set"}
                      </p>
                    </div>
                  </div>

                  {simulationResult.targetFeasibility && (
                    <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--color-text)]">Target GPA Feasibility:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          simulationResult.targetFeasibility.status === "ALREADY_MET"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : simulationResult.targetFeasibility.status === "ACHIEVABLE"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : simulationResult.targetFeasibility.status === "CHALLENGING"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {simulationResult.targetFeasibility.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[var(--color-text-2)] leading-relaxed">
                        {simulationResult.targetFeasibility.explanation}
                      </p>
                    </div>
                  )}

                  {simulationResult.targetGpa && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                        simulationResult.targetMet
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      }`}
                    >
                      {simulationResult.targetMet ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>This scenario achieves your target GPA goal of {simulationResult.targetGpaString}!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>
                            This scenario is {(simulationResult.targetGpa - simulationResult.projectedGpa).toFixed(2)} points below your target goal of {simulationResult.targetGpaString}.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 text-rose-600 text-xs border border-rose-500/20">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
