# UniMate — AI-Powered University Life & Academic OS

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://web-gamma-ten-40.vercel.app)

**UniMate** is an all-in-one student management operating system built with an Apple-inspired SaaS aesthetic. It unifies academic scheduling, assignment tracking, exam countdowns, GPA calculations, expense management, and AI-powered study assistance into a single platform.

🌐 **Live Production Deployment**: [https://web-gamma-ten-40.vercel.app](https://web-gamma-ten-40.vercel.app)

---

## ✨ Features

- **🎓 Courses Management**: Track course credits, professors, locations, syllabus notes, and color-coded academic subjects.
- **📅 Interactive Timetable**: Weekly schedule organizer with conflict and overlap detection.
- **📝 Assignments & Deadlines**: Priority-driven assignment tracker with urgency badges, due-date filters, and completion status.
- **⏳ Exam Countdown**: Real-time exam schedules, room designations, focus notes, and study preparation progress bars.
- **📊 Academic Analytics**: Weighted GPA calculations, grading breakdown, and real-time attendance percentage tracking with low-attendance warnings.
- **💰 Student Expenses**: Budget tracker categorized by student life (Food, Books, Tuition, Transport, Living) with PKR currency formatting, category breakdowns, and monthly trends.
- **🤖 AI Study Buddy**: Academic assistant powered by Google Gemini with verified context integration for personalized study schedules, revision plans, and exam tips.
- **🔔 Real Notifications**: Automated notification engine alerting students to upcoming deadlines, overdue tasks, upcoming exams, and critical attendance thresholds.
- **🌓 Light / Dark / System Theme**: Flash-free, production-grade theme switcher powered by `next-themes` and CSS variables.
- **⚙️ Profile & Settings**: Dedicated user settings view with security session status and appearance controls.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Server Components & Server Actions)
- **UI Library**: [React 19](https://react.dev)
- **Styling**: Tailwind CSS with CSS Variables for semantic light/dark themes
- **Icons**: [Lucide React](https://lucide.dev)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org) via [Prisma ORM](https://www.prisma.io) (Hosted on Neon)
- **Authentication**: Encrypted stateless JWT sessions (`jose`), salted password hashing (`bcryptjs`)
- **AI Engine**: Google Gemini API via official `@google/genai` SDK
- **Theme Management**: `next-themes`

---

## 🔒 Security & Architecture Highlights

- **Multi-Tenant Data Isolation**: Every database operation and Server Action explicitly scopes records by `userId` derived from cryptographically verified session cookies.
- **Strict Input Validation**: Centralized validation schemas across all entity mutations with comprehensive error messaging.
- **Zero Client Secret Leakage**: All sensitive database operations, API tokens, and AI calls are isolated strictly within Server Components and Server Actions.
- **OWASP-Hardened Middleware**: Route guard proxy enforcing session checks on all `/dashboard/*` paths.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ installed
- PostgreSQL database instance (local or Neon/Supabase)

### 1. Clone the Repository

```bash
git clone https://github.com/ranatalhamajid1/unimate.git
cd unimate
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/unimate?schema=public"

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-32-byte-base64-secret"

# Google Gemini API
AI_API_KEY="your-gemini-api-key"
AI_MODEL="gemini-2.5-flash"
```

### 4. Setup Database Schema

```bash
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Verification & Quality Checks

Run the verification suite:

```bash
# Type-check with zero emit
npx tsc --noEmit

# Run ESLint
npm run lint

# Build production bundle with Turbopack
npm run build
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
