"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  MapPin,
  Compass,
} from "lucide-react";
import { UniversityCombobox, UniversityOption } from "@/components/ui/university-combobox";
import { AvatarUploader } from "@/components/ui/avatar-uploader";

const POPULAR_COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "United Arab Emirates",
  "Saudi Arabia",
  "Singapore",
  "Malaysia",
  "India",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  // Step 2 State
  const [degreeProgram, setDegreeProgram] = useState("");
  const [currentSemester, setCurrentSemester] = useState("Semester 1");
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear() + 4);

  // Step 3 State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");

  // Load current profile on mount
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success && data.profile) {
          const p = data.profile;
          setName(p.name || "");
          if (p.country) setCountry(p.country);
          if (p.username) setUsername(p.username);
          if (p.bio) setBio(p.bio);
          if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
          if (p.degreeProgram) setDegreeProgram(p.degreeProgram);
          if (p.currentSemester) setCurrentSemester(p.currentSemester);
          if (p.graduationYear) setGraduationYear(p.graduationYear);
          if (p.university) {
            setSelectedUniversity(p.university);
            if (p.campus?.id) setSelectedCampusId(p.campus.id);
            if (p.department?.id) setSelectedDepartmentId(p.department.id);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleNext = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!selectedUniversity) {
        setErrorMessage("Please select your university or college to continue.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!degreeProgram.trim()) {
        setErrorMessage("Please enter your degree or program of study.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleFinish = async () => {
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const payload = {
        country,
        universityId: selectedUniversity?.id || null,
        campusId: selectedCampusId || null,
        departmentId: selectedDepartmentId || null,
        degreeProgram: degreeProgram.trim(),
        currentSemester,
        graduationYear: Number(graduationYear),
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        primaryGoal: primaryGoal.trim() || undefined,
      };

      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save onboarding selections.");
      }

      // Successful completion: redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Welcome to UniMate
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-2)]">
            Let&apos;s personalize your academic workspace in 3 quick steps.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="mt-8 flex items-center justify-between px-2">
          {[
            { step: 1, label: "University", icon: Building2 },
            { step: 2, label: "Degree", icon: GraduationCap },
            { step: 3, label: "Profile", icon: User },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs transition-colors ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isCurrent
                        ? "border-2 border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-3)]"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                  </div>
                  <span
                    className={`mt-1 text-[11px] font-semibold ${
                      isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-[var(--color-text-3)]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {item.step < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      isCompleted ? "bg-blue-600" : "bg-[var(--color-border)]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Container Card */}
        <div className="mt-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xl transition-all">
          {/* STEP 1: ACADEMIC IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Where do you study?
                </h2>
                <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                  Connect your profile to your campus and academic department.
                </p>
              </div>

              {/* Country Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setSelectedUniversity(null);
                    setSelectedCampusId("");
                    setSelectedDepartmentId("");
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                >
                  {POPULAR_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* University Combobox */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  University or Institution *
                </label>
                <div className="mt-1.5">
                  <UniversityCombobox
                    value={selectedUniversity?.id || null}
                    selectedUniversityName={selectedUniversity?.name || null}
                    countryFilter={country}
                    onChange={(univ) => {
                      setSelectedUniversity(univ);
                      setSelectedCampusId("");
                      setSelectedDepartmentId("");
                    }}
                  />
                </div>
              </div>

              {/* Campus Selector (if university has campuses) */}
              {selectedUniversity?.campuses && selectedUniversity.campuses.length > 0 && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    Campus / Branch
                  </label>
                  <select
                    value={selectedCampusId}
                    onChange={(e) => setSelectedCampusId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  >
                    <option value="">Select a campus (Optional)</option>
                    {selectedUniversity.campuses.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name} {camp.isMain ? "(Main Campus)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department Selector */}
              {selectedUniversity?.departments && selectedUniversity.departments.length > 0 && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    Faculty / Department
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  >
                    <option value="">Select a department (Optional)</option>
                    {selectedUniversity.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DEGREE & TIMELINE */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Academic Degree & Timeline
                </h2>
                <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                  Helps calculate your semester progress and study schedules.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Degree / Program of Study *
                </label>
                <input
                  type="text"
                  required
                  value={degreeProgram}
                  onChange={(e) => setDegreeProgram(e.target.value)}
                  placeholder="e.g. B.S. Computer Science, BBA, MBBS"
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    Current Semester / Year
                  </label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={`Semester ${num}`}>
                        Semester {num}
                      </option>
                    ))}
                    <option value="Freshman Year">Freshman Year</option>
                    <option value="Sophomore Year">Sophomore Year</option>
                    <option value="Junior Year">Junior Year</option>
                    <option value="Senior Year">Senior Year</option>
                    <option value="Graduate / Masters">Graduate / Masters</option>
                    <option value="PhD Candidate">PhD Candidate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    Expected Graduation
                  </label>
                  <input
                    type="number"
                    value={graduationYear}
                    min={2020}
                    max={2035}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PERSONAL IDENTITY */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Personalize Your Profile
                </h2>
                <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                  Set up your avatar and unique student handle.
                </p>
              </div>

              {/* Avatar Uploader */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Profile Picture
                </label>
                <div className="mt-2">
                  <AvatarUploader
                    currentAvatarUrl={avatarUrl}
                    userName={name || "Student"}
                    onAvatarUpdated={(url) => setAvatarUrl(url)}
                  />
                </div>
              </div>

              {/* Unique Handle */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Unique Student Handle (@username)
                </label>
                <div className="mt-1.5 flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm">
                  <span className="text-[var(--color-text-3)] font-semibold mr-1">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="talha_m"
                    className="w-full bg-transparent text-sm text-[var(--color-text)] outline-hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-3)]">
                  3–30 characters. Letters, numbers, single dots or underscores.
                </p>
              </div>

              {/* Short Bio */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  maxLength={280}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your classmates about your academic interests or hobbies..."
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Study Goal */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Primary Study Goal (Optional)
                </label>
                <input
                  type="text"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  placeholder="e.g. Maintain a 3.8 GPA this semester"
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
