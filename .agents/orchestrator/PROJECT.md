# Master Specification & Progress Tracker: GPA Study Hub UI/UX Audit & Optimization

## System Architecture & Theme Design System

### 1. Dark 3D Glassmorphism Theme System
- **Backdrop Palette**: Obsidian-Indigo gradient (`#0f0a1e` → `#1a1145` → `#0d1b2a` or `bg-gradient-to-br from-[#0f0a1e] via-[#1a1145] to-[#0d1b2a]`).
- **Atmospheric Glow Orbs**: Floating radial gradient spheres with `blur-3xl`, `opacity-30`, subtle pulse/float animations (`glow-orb-indigo`, `glow-orb-emerald`).
- **Translucent Glass Cards**:
  - `bg-white/[0.05]` or `bg-slate-900/60` with `backdrop-blur-xl` or `backdrop-blur-2xl`.
  - Border: `border border-white/10` or `border border-indigo-500/20`.
  - Highlight: 3D specular edge highlights, subtle inner shadows, hovering 3D transform (`hover:-translate-y-1 hover:shadow-indigo-500/20`).
- **Accent Colors**:
  - Primary Accent: Neon Green (`#10b981`, `emerald-500`) for active states, completion, success badges.
  - Secondary Accent: Electric Indigo (`#6366f1`, `indigo-500`) for headers, primary action buttons, brand glows.
- **Typography Standard**:
  - Headings & Body UI: Inter / system-ui (`font-sans`).
  - Metrics, Codes, Rubric Breakdown, Timers: JetBrains Mono (`font-mono`).

### 2. Mobile Touchscreen & Low-RAM Requirements
- **Touch Target Minimum**: All clickable buttons, tab headers, icons, input fields, and links must have a minimum interactive height/width of **44px** (`min-h-[44px]`, `min-w-[44px]`, or adequate padding `p-3`).
- **Fixed Dark Glass Bottom Bar**: Fixed to bottom on mobile breakpoints (`md:hidden`), `backdrop-blur-xl bg-[#0f0a1e]/80 border-t border-white/10`, with active tab indicated by neon glow dot/bar (`bg-[#10b981] shadow-[0_0_12px_#10b981]`).
- **Low-RAM Performance Optimization**: Avoid excessive nested CSS filter blurs; limit active atmospheric orb count; ensure responsive non-blocking rendering suitable for 2GB RAM devices.

---

## 11 Application Modules Inventory

| # | Module Name | Core Component(s) | Primary Purpose |
|---|-------------|------------------|-----------------|
| 1 | ExamHub | `ExamHubInterface.tsx`, `components/exam/*` | Timed Quizzes, GTU Past Papers, AI Answer Grader |
| 2 | Campus | `CampusHub.tsx` / Campus views | Campus events, notices, lost & found, peer posts |
| 3 | Tutor | `AITutor.tsx` / Tutor views | AI study assistant, prompt presets, interactive chat |
| 4 | Scanner/Homework | `HWScanner.tsx` | OCR assignment scanner, solution generator |
| 5 | Notes | `SmartNotes.tsx` | AI smart note generator, flashcards, summarizer |
| 6 | Social Chat | `SocialHub.tsx` | Peer messaging, study channels, community |
| 7 | Library | `ResourceLibrary.tsx` | Digital textbook vault, syllabus PDFs, notes store |
| 8 | Planner | `StudyPlanner.tsx` | Exam countdown, study schedule, habit tracker |
| 9 | Attendance | `AttendanceTracker.tsx` | Bunk calculator, target percentage tracker |
| 10 | Profile | `UserProfile.tsx` | Student stats, readiness score, settings |
| 11 | Admin Dashboard | `AdminDashboard.tsx` | Faculty management, gradebook, security rules |

---

## Milestone Decomposition & Tracking

| # | Milestone Name | Key Deliverables & Targets | Dependencies | Status |
|---|----------------|----------------------------|--------------|--------|
| M1 | UI/UX Visual Audit across 11 Modules | Inspect all 11 module components & app shell for theme consistency, color leaks, font usage, and glass card styling | None | IN_PROGRESS |
| M2 | Mobile Touchscreen & Low-RAM Audit | Audit touch targets (>= 44px), BottomNav styling, and performance on 2GB RAM devices | M1 | PLANNED |
| M3 | UI/UX & Type Remediation | Fix visual bugs, theme mismatches, small touch targets, and any TypeScript errors across all files | M1, M2 | PLANNED |
| M4 | Build Integrity & Forensic Audit | Run `npx tsc --noEmit` (0 errors), `npm run build` (< 15s), and Forensic Integrity Audit (CLEAN) | M3 | PLANNED |

---

## Code Layout & Conventions

- `App.tsx` — Main App Router & View Container
- `Sidebar.tsx` — Desktop Navigation Rail
- `BottomNav.tsx` — Mobile Navigation Bar
- `index.css` / Tailwind CSS — Theme definitions, glassmorphism utilities, glow orb keyframes
- `types.ts` — Central Data Models & AppMode enum
- `components/` — Module components for all 11 modules

---

## Verification Criteria
1. `npx tsc --noEmit` returns 0 errors.
2. `npm run build` succeeds in under 15 seconds.
3. All 11 modules render cleanly with dark 3D glassmorphism theme (#0f0a1e backdrop, translucent glass cards, neon green & indigo accents, Inter/JetBrains Mono fonts).
4. All interactive touch targets >= 44px min dimension.
5. Fixed dark glass bottom navigation bar with active neon glow indicators.
6. Forensic Integrity Audit reports CLEAN verdict.
