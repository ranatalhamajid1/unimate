"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  PlayCircle,
  Clock,
  Timer,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  BellRing,
  Flame,
  BookOpen,
} from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const normX = Math.max(-1, Math.min(1, (px - 0.5) * 2));
    const normY = Math.max(-1, Math.min(1, (py - 0.5) * 2));

    // Subtle 2.5–3.5 degree rotation max
    setTilt({
      x: normX * 3.2,
      y: -normY * 2.6,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pb-20 pt-28 sm:pb-24 sm:pt-36 lg:pb-32 lg:pt-40">
      {/* ── Ambient Atmospheric Light Fields (Multi-layered diffuse depth) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden"
      >
        {/* Primary soft blue/indigo dome */}
        <div
          className="absolute left-1/2 top-[-10%] h-[560px] w-[860px] -translate-x-1/2 rounded-full opacity-60 dark:opacity-35"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.18) 0%, rgba(99,102,241,0.08) 45%, transparent 70%)",
            filter: "blur(64px)",
          }}
        />
        {/* Subtle violet atmospheric accent right */}
        <div
          className="absolute right-[-10%] top-[20%] h-[420px] w-[500px] rounded-full opacity-40 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(168,85,247,0.14) 0%, transparent 65%)",
            filter: "blur(72px)",
          }}
        />
        {/* Subtle cyan ambient glow left */}
        <div
          className="absolute left-[-10%] top-[30%] h-[380px] w-[460px] rounded-full opacity-35 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(14,165,233,0.12) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        {/* Micro spatial grid overlay (ultra-subtle texture) */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(var(--color-text) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 20%, black 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 20%, black 20%, transparent 80%)",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-10">
        {/* ── Left Column: Editorial & Conversion Copy (5 cols) ─────────── */}
        <div className="mx-auto max-w-xl text-center lg:col-span-5 lg:mx-0 lg:text-left">
          {/* Eyebrow badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/40 px-3.5 py-1.5 text-[11.5px] font-semibold tracking-wider text-blue-700 dark:text-blue-300 shadow-[0_1px_4px_rgba(37,99,235,0.08)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            </span>
            <span>BUILT FOR UNIVERSITY STUDENTS</span>
            <Sparkles className="h-3 w-3 text-blue-500 dark:text-blue-400" />
          </div>

          {/* Large display headline with negative tracking */}
          <h1 className="animate-fade-up delay-100 mt-6 text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.035em] text-[var(--color-text)] sm:text-5xl lg:text-[3.35rem]">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
              survive university.
            </span>
          </h1>

          {/* Supporting copy */}
          <p className="animate-fade-up delay-200 mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-[var(--color-text-2)] lg:mx-0">
            Manage your courses, assignments, exams, timetable, expenses and
            study plans — all in one place.
          </p>

          {/* Dual CTAs */}
          <div className="animate-fade-up delay-300 mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:items-start lg:justify-start">
            <a
              href="/signup"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 dark:bg-blue-600 px-6 py-3.5 text-[14.5px] font-medium text-white shadow-[0_4px_20px_rgba(15,23,42,0.18)] dark:shadow-[0_4px_24px_rgba(37,99,235,0.4)] transition-all duration-200 hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.985] sm:w-auto"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
              <span>Get Started — It&apos;s Free</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>

            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-[var(--color-surface)]/80 px-6 py-3.5 text-[14.5px] font-medium text-[var(--color-text-2)] shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:text-[var(--color-text)] active:scale-[0.985] sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Micro trust credentials */}
          <div className="animate-fade-up delay-400 mt-5 flex items-center justify-center gap-4 text-[12px] text-[var(--color-text-3)] lg:justify-start">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              No credit card required
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
            <span>Built for university workflows</span>
          </div>
        </div>

        {/* ── Right Column: Spatial 3D Product Visualization (7 cols) ──── */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative mx-auto w-full max-w-[540px] py-6 lg:col-span-7 lg:max-w-[560px] xl:max-w-[600px] lg:ml-auto lg:py-10"
          style={{
            perspective: "1400px",
          }}
        >
          {/* Spatial 3D Transform Stage */}
          <div
            className="relative transition-transform duration-300 ease-out"
            style={{
              transform: `rotateY(${tilt.x - 3}deg) rotateX(${tilt.y + 2.5}deg) translateZ(0)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Ambient diffuse drop glow behind the primary plane */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-70 dark:opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.16) 0%, rgba(99,102,241,0.08) 50%, transparent 75%)",
                filter: "blur(40px)",
                transform: "translateZ(-30px)",
              }}
            />

            {/* ── MAIN PRODUCT SURFACE (Center Operating Canvas) ──────── */}
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)] shadow-[0_25px_65px_-16px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.04),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_32px_75px_-18px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
              style={{
                transform: "translateZ(0px)",
              }}
            >
              {/* Window Chrome / Operating Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/80 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] shadow-[0_0_4px_rgba(255,95,87,0.4)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] shadow-[0_0_4px_rgba(255,189,46,0.4)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28C840] shadow-[0_0_4px_rgba(40,200,64,0.4)]" />
                </div>

                {/* Translucent omnibar */}
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-[var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-3)] shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono">app.unimate.io/dashboard</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--color-text-3)]">
                  <span className="rounded bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Internal Workspace Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 px-5 py-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
                      Good afternoon, Alex
                    </h2>
                    <span className="text-[14px]">👋</span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-2)]">
                      Sem 5 · CS
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[var(--color-text-3)]">
                    Thursday, Sep 4 · 3 classes scheduled · 1 exam in prep
                  </p>
                </div>

                <div className="hidden items-center gap-1.5 rounded-lg border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 sm:flex">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>5-Day Focus Streak</span>
                </div>
              </div>

              {/* Main Content Pane */}
              <div className="space-y-3.5 p-5">
                {/* Section: Today's Academic Schedule */}
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/60 p-3.5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Today&apos;s Class Timeline
                    </div>
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                      In Session
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        time: "10:00 AM",
                        code: "CS301",
                        name: "Digital Logic Design",
                        room: "Hall B",
                        active: true,
                        color: "bg-blue-500",
                      },
                      {
                        time: "12:00 PM",
                        code: "CS302",
                        name: "Web Engineering",
                        room: "Lab 3",
                        active: false,
                        color: "bg-indigo-500",
                      },
                      {
                        time: "02:00 PM",
                        code: "CS303",
                        name: "Theory of Automata",
                        room: "Room 108",
                        active: false,
                        color: "bg-purple-500",
                      },
                    ].map((item) => (
                      <div
                        key={item.code}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                          item.active
                            ? "border-blue-200/80 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                          <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            {item.code}
                          </span>
                          <span className="truncate text-[12.5px] font-medium text-[var(--color-text)]">
                            {item.name}
                          </span>
                          <span className="hidden text-[11px] text-[var(--color-text-3)] sm:inline">
                            · {item.room}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.active && (
                            <span className="rounded bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 text-[9.5px] font-semibold text-blue-700 dark:text-blue-300">
                              NOW
                            </span>
                          )}
                          <span className="font-mono text-[11px] tabular-nums text-[var(--color-text-3)]">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Split row: Priority assignment + Adaptive Study Queue */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 shadow-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                        Priority Due
                      </span>
                      <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Tomorrow
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-[var(--color-text)]">
                      DLD Lab 05: FSM Verilog
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-3)]">
                      3 components · Weight 5% of Grade
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 shadow-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                        Study Queue
                      </span>
                      <span className="rounded-md bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        AI Planned
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-[var(--color-text)]">
                      K-Map Simplification
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-3)]">
                      45m targeted practice after lab
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECONDARY FLOATING DEPTH LAYERS (Layered Spatial Surfaces) ── */}

            {/* FLOATING CARD 1: GPA Radial Score (Top Right - Z: +45px) */}
            <div
              className="absolute right-2 -top-6 sm:right-3 sm:-top-7 hidden w-[195px] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-[var(--color-surface)]/95 p-3 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.9)_inset] dark:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.1)_inset] backdrop-blur-xl transition-transform duration-300 ease-out sm:block"
              style={{
                transform: "translateZ(45px)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Academic GPA
                </span>
                <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +0.08
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2.5">
                {/* Circular SVG progress ring (3.50 / 4.00 = 87.5%) */}
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <svg className="h-11 w-11 -rotate-90" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      strokeWidth="3.5"
                      className="text-slate-100 dark:text-slate-800"
                      stroke="currentColor"
                      fill="none"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      strokeWidth="3.5"
                      strokeDasharray="100.5"
                      strokeDashoffset="12.5"
                      strokeLinecap="round"
                      className="text-emerald-500 transition-all duration-1000"
                      stroke="currentColor"
                      fill="none"
                    />
                  </svg>
                  <span className="absolute text-[10.5px] font-semibold text-[var(--color-text)]">
                    88%
                  </span>
                </div>

                <div>
                  <div className="font-mono text-[20px] font-bold leading-none tracking-tight text-[var(--color-text)]">
                    3.50
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--color-text-3)]">
                    Target: 3.65 Magna
                  </p>
                </div>
              </div>
            </div>

            {/* FLOATING CARD 2: Upcoming High-Stakes Exam (Bottom Left - Z: +55px) */}
            <div
              className="absolute -bottom-5 left-2 sm:-bottom-6 sm:left-3 hidden w-[220px] rounded-2xl border border-blue-200/90 dark:border-blue-900/80 bg-[var(--color-surface)]/95 p-3.5 shadow-[0_20px_48px_-12px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.9)_inset] dark:shadow-[0_24px_54px_-14px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.1)_inset] backdrop-blur-xl transition-transform duration-300 ease-out sm:block"
              style={{
                transform: "translateZ(55px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    High Stakes Exam
                  </span>
                </div>
                <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-700 dark:text-blue-300">
                  2 DAYS
                </span>
              </div>

              <div className="mt-2">
                <div className="text-[14px] font-semibold text-[var(--color-text)]">
                  DLD Final Exam
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[var(--color-text-3)]">
                  <Timer className="h-3 w-3 text-blue-500" />
                  <span>Room 301 · 09:00 AM</span>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] font-medium text-[var(--color-text-3)]">
                  <span>Preparedness</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">85%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                </div>
              </div>
            </div>

            {/* FLOATING CARD 3: Focus Session Active Tracker (Bottom Right - Z: +35px) */}
            <div
              className="absolute -bottom-5 right-2 sm:-bottom-5 sm:right-3 hidden w-[210px] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)]/95 p-3.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(255,255,255,0.9)_inset] dark:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-xl transition-transform duration-300 ease-out md:block"
              style={{
                transform: "translateZ(35px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  Focus Sprint
                </div>
                <span className="font-mono text-[10.5px] font-semibold text-purple-600 dark:text-purple-400">
                  25:00
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[var(--color-text)]">
                    Sequential Circuits
                  </p>
                  <p className="text-[10px] text-[var(--color-text-3)]">
                    CS301 · Deep Session
                  </p>
                </div>
              </div>
            </div>

            {/* FLOATING CARD 4: Attention Queue Alert Chip (Top Left - Z: +25px) */}
            <div
              className="absolute left-2 -top-5 sm:left-3 sm:-top-6 hidden items-center gap-2 rounded-full border border-slate-200/90 dark:border-slate-800/90 bg-[var(--color-surface)]/95 px-3 py-1.5 shadow-[0_12px_28px_-8px_rgba(15,23,42,0.18)] dark:shadow-[0_14px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-transform duration-300 ease-out md:flex"
              style={{
                transform: "translateZ(25px)",
              }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <BellRing className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-medium text-[var(--color-text)]">
                Next: Web Engineering in 45m
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
