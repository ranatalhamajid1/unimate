"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Moon,
  ShieldCheck,
  LogOut,
  Sparkles,
  CreditCard,
  ArrowRight,
  GraduationCap,
  Building2,
  Tag,
  Link as LinkIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logout } from "@/app/actions/auth";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { UniversityCombobox, UniversityOption } from "@/components/ui/university-combobox";
import { ProfileCompletionWidget } from "@/components/ui/profile-completion-widget";

interface SettingsClientProps {
  name: string;
  email: string;
  plan?: string;
  isPro?: boolean;
  initialProfile?: any;
}

export function SettingsClient({
  name: initialName,
  email,
  plan = "FREE",
  isPro = false,
  initialProfile,
}: SettingsClientProps) {
  const [profile, setProfile] = useState<any>(initialProfile || {});

  // Form Fields
  const [fullName, setFullName] = useState(profile.name || initialName || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [country, setCountry] = useState(profile.country || "Pakistan");
  const [city, setCity] = useState(profile.city || "");
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(
    profile.university || null
  );
  const [campusId, setCampusId] = useState(profile.campus?.id || profile.campusId || "");
  const [departmentId, setDepartmentId] = useState(
    profile.department?.id || profile.departmentId || ""
  );
  const [degreeProgram, setDegreeProgram] = useState(profile.degreeProgram || "");
  const [currentSemester, setCurrentSemester] = useState(profile.currentSemester || "Semester 1");
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear || 2027);

  // Arrays
  const [skillsStr, setSkillsStr] = useState((profile.skills || []).join(", "));
  const [interestsStr, setInterestsStr] = useState((profile.interests || []).join(", "));
  const [languagesStr, setLanguagesStr] = useState((profile.languages || []).join(", "));

  // Links
  const [githubLink, setGithubLink] = useState(profile.socialLinks?.github || "");
  const [linkedinLink, setLinkedinLink] = useState(profile.socialLinks?.linkedin || "");
  const [portfolioLink, setPortfolioLink] = useState(profile.socialLinks?.portfolio || "");

  // Privacy
  const [isPublicProfile, setIsPublicProfile] = useState(Boolean(profile.isPublicProfile));

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const payload: Record<string, any> = {
        name: fullName.trim(),
        username: username.trim() || null,
        bio: bio.trim() || null,
        country: country.trim() || null,
        city: city.trim() || null,
        universityId: selectedUniversity?.id || null,
        campusId: campusId || null,
        departmentId: departmentId || null,
        degreeProgram: degreeProgram.trim() || null,
        currentSemester: currentSemester.trim() || null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        skills: skillsStr.split(",").map((s: string) => s.trim()).filter(Boolean),
        interests: interestsStr.split(",").map((s: string) => s.trim()).filter(Boolean),
        languages: languagesStr.split(",").map((s: string) => s.trim()).filter(Boolean),
        socialLinks: {
          github: githubLink.trim() || undefined,
          linkedin: linkedinLink.trim() || undefined,
          portfolio: portfolioLink.trim() || undefined,
        },
        isPublicProfile,
      };

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setProfile(data.profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-2)]">
          Manage your personal academic identity, university affiliation, preferences, and security.
        </p>
      </div>

      {/* Profile Completion Meter */}
      <ProfileCompletionWidget
        percentage={profile.profileCompletionPercentage || 0}
        className="w-full"
      />

      {/* Form: Student Profile & University */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* SECTION A: PERSONAL IDENTITY */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                Student Profile & Identity
              </h2>
              <p className="text-xs text-[var(--color-text-3)]">
                Your visual avatar, display name, and unique student handle
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Avatar Uploader */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Profile Avatar
              </label>
              <div className="mt-3">
                <AvatarUploader
                  currentAvatarUrl={profile.avatarUrl}
                  userName={fullName || "Student"}
                  onAvatarUpdated={(url) => setProfile((prev: any) => ({ ...prev, avatarUrl: url }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Unique Student Handle (@username)
                </label>
                <div className="mt-1.5 flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  <span className="text-[var(--color-text-3)] font-semibold mr-1">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="student_handle"
                    className="w-full bg-transparent text-sm text-[var(--color-text)] outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Short Bio (280 max)
              </label>
              <textarea
                rows={2}
                maxLength={280}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Software Engineering sophomore interested in distributed systems..."
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION B: ACADEMIC IDENTITY */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                Academic Affiliation
              </h2>
              <p className="text-xs text-[var(--color-text-3)]">
                Your university, campus branch, and academic program
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCountry(next);
                    if (selectedUniversity) {
                      const code = selectedUniversity.countryCode?.toLowerCase();
                      const name = selectedUniversity.country?.toLowerCase();
                      const norm = next.trim().toLowerCase();
                      if (code !== norm && name !== norm) {
                        setSelectedUniversity(null);
                        setCampusId("");
                        setDepartmentId("");
                      }
                    }
                  }}
                  placeholder="e.g. Pakistan"
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Islamabad"
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                University Directory
              </label>
              <div className="mt-1.5">
                <UniversityCombobox
                  value={selectedUniversity?.id || null}
                  selectedUniversityName={selectedUniversity?.name || null}
                  countryFilter={country}
                  onChange={(univ) => {
                    setSelectedUniversity(univ);
                    setCampusId("");
                    setDepartmentId("");
                  }}
                />
              </div>
            </div>

            {selectedUniversity?.campuses && selectedUniversity.campuses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    Campus Branch
                  </label>
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  >
                    <option value="">Select Campus</option>
                    {selectedUniversity.campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.isMain ? "(Main)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUniversity.departments && selectedUniversity.departments.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                      Faculty / Department
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {selectedUniversity.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Degree / Program
                </label>
                <input
                  type="text"
                  value={degreeProgram}
                  onChange={(e) => setDegreeProgram(e.target.value)}
                  placeholder="e.g. BS Software Eng"
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Current Semester
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                    <option key={s} value={`Semester ${s}`}>
                      Semester {s}
                    </option>
                  ))}
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={graduationYear}
                  min={1970}
                  max={2035}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION C: INTERESTS & TAGS */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                Skills & Academic Interests
              </h2>
              <p className="text-xs text-[var(--color-text-3)]">
                Comma-separated tags for your academic portfolio
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Python, React, Machine Learning, Calculus"
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Interests & Research (comma-separated)
              </label>
              <input
                type="text"
                value={interestsStr}
                onChange={(e) => setInterestsStr(e.target.value)}
                placeholder="Artificial Intelligence, Robotics, Quantum Computing"
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Languages Spoken (comma-separated)
              </label>
              <input
                type="text"
                value={languagesStr}
                onChange={(e) => setLanguagesStr(e.target.value)}
                placeholder="English, Urdu, German"
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION D: SOCIAL & PROFILE LINKS */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <LinkIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                Social & Portfolio Links
              </h2>
              <p className="text-xs text-[var(--color-text-3)]">
                Optional links to showcase your projects and profiles
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                GitHub Username / URL
              </label>
              <input
                type="text"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/username"
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                LinkedIn Profile URL
              </label>
              <input
                type="text"
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                Personal Portfolio URL
              </label>
              <input
                type="text"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION E: PRIVACY CONTROLS */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                Privacy Controls
              </h2>
              <p className="text-xs text-[var(--color-text-3)]">
                Control your profile visibility and privacy guarantees
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
              <div className="pr-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Public Student Profile
                </p>
                <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                  When disabled (default), your profile and academic affiliation are strictly private and hidden from search.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublicProfile}
                onClick={() => setIsPublicProfile(!isPublicProfile)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isPublicProfile ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isPublicProfile ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-xs text-[var(--color-text-2)]">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Strict Privacy Guarantee:</span>{" "}
              Even if public profile is enabled, your GPA, grades, exam scores, attendance percentages, expenses, and private assignments are <span className="font-bold">NEVER</span> exposed.
            </div>
          </div>
        </section>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Profile and academic identity updated successfully!</span>
          </div>
        )}

        {/* Save CTA */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>

      {/* Subscription & Plan Section (Preserved) */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Subscription & Plan
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Your active subscription and plan privileges
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[var(--color-text)]">{plan}</span>
              {isPro ? (
                <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                  Active Pro
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Free Tier
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-2)] mt-0.5">
              {isPro
                ? "Full access to AI study tools, unlimited planning, and advanced academic intelligence."
                : "Basic academic tools and free student identity hub."}
            </p>
          </div>

          <Link
            href="/dashboard/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            {isPro ? "Manage Subscription" : "Upgrade to Pro"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Appearance Section (Preserved) */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Appearance & Theme
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Customize how UniMate looks on your device
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Interface Theme</p>
            <p className="text-xs text-[var(--color-text-2)] mt-0.5">
              Select Light, Dark, or sync automatically with your system settings.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <ThemeToggle variant="segmented" />
          </div>
        </div>
      </section>

      {/* Security & Session (Preserved) */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Security & Session
            </h2>
            <p className="text-xs text-[var(--color-text-3)]">
              Session management and data protection
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Active Session</p>
              <p className="text-xs text-[var(--color-text-2)] mt-0.5">
                Encrypted JWT session with HTTP-only cookie protection.
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between px-2 text-xs text-[var(--color-text-3)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span>UniMate Personal Academic OS & Student Identity Hub</span>
        </div>
        <p>Private &bull; Encrypted</p>
      </div>
    </div>
  );
}
