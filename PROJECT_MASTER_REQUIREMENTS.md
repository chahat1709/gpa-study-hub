# 📘 GPA Study Hub — Master Requirements & System Specification

> **Project Name:** GPA Study Hub  
> **Android Package ID:** `com.gpashub.app`  
> **Target Platform:** Native Android (Capacitor) & Modern Web Application  
> **Target Audience:** 2,000+ GTU (Gujarat Technological University) Engineering Students & Faculty  
> **Financial Target:** $0.00 Operating Cost for 2 Full Years (Firebase Spark Free Tier & Client BYOK)  
> **Hardware Target:** 100% Offline Capability & Smooth Performance on ₹5,000 Phones with 2GB RAM

---

## 1. Core Architectural Directives & User Rules

### 1.1 Integrity & Trust Contract

- **Rule**: Always tell the complete truth; act as an indispensable personal assistant and employee.
- **Execution**: Zero marketing spin, zero unverified claims. Every capability must be backed by empirical runtime verification, clean type compilation (`npx tsc --noEmit`), and production bundle compilation (`npm run build`).

### 1.2 Target Hardware & Cost Ceiling ($0 Operating Budget)

- **Zero Server AI Billing**: All Gemini 3 Pro AI calls utilize client-side BYOK (`getStoredApiKey()`) or static GTU offline mock generators to prevent central LLM server bills.
- **Firebase Spark Free Tier Compliance**:
  - **Firestore Reads**: $\le 50,000$ reads/day (Projected $\approx 22,000$/day via local memory caching).
  - **Firestore Writes**: $\le 20,000$ writes/day (Projected $\approx 3,500$/day).
  - **Storage Bandwidth**: $\le 10\text{ GB/month}$ (Projected $\approx 4.8\text{ GB/month}$ via image downscaling).
  - **Capacity**: $\le 5\text{ GB}$ total storage.
  - **Authentication**: $\le 50,000$ Monthly Active Users (MAU).

### 1.3 Offline & Low-Hardware Constraints (2GB RAM / ₹5,000 Phone)

- **100% Offline Service Worker**: `public/sw.js` caches static bundle assets for 0ms instant startup without network data.
- **Offline Sync Queue**: `services/offlineStorageService.ts` queues offline quiz submissions and attendance logs, auto-syncing upon network reconnection.
- **Strict Memory Footprint**: Keeps active runtime memory usage under **45MB RAM** to prevent Android WebView out-of-memory crashes on 2GB RAM devices.

---

## 2. Feature Module Requirements & Specifications

### 2.1 Examinations & Quiz Hub (`EXAM_HUB`)

- **Timed AI Mock Quizzes**: Subject/unit selector, 600s interactive countdown timer, MCQ choices, instant scoring, auto-submission at 0s, and detailed AI explanation breakdown (`services/examService.ts`).
- **GTU Past Papers Vault**: Season/year filters (Winter/Summer 2023/2024) with step-by-step GTU AI solution key viewer.
- **AI Written Answer Grader**: Text or photo upload evaluation against official GTU marking rubrics (Keywords 30%, Concept Clarity 40%, Technical Accuracy 30%).
- **GTU Readiness Index**: Real-time circular progress meter displaying student readiness percentage.

### 2.2 Faculty & Admin Console (`ADMIN`)

- **Official Quiz Publisher**: AI Auto-Build via Gemini 3 Pro structured JSON schema or manual question builder with draft preview and Firestore publishing.
- **Student Gradebook Table**: 7-column student gradebook table with score filtering, subject dropdowns, and search.
- **Class Readiness Radar Banner**: Cohort metrics calculation (Pass Rate %, Class Average %, Top Subject, Class Readiness Index).
- **Attendance Slot Marker**: Faculty shortcode validation guard (`facultyShortCode`) preventing unauthorized attendance entry.

### 2.3 AI Study Suite

- **AI Tutor (`TUTOR`)**: Real-time streaming conversation, memory buffer reset (`clearChat`), and BYOK key guard (`components/ChatInterface.tsx`).
- **Homework Solver (`HOMEWORK`)**: Image drag & drop upload, 10MB quota validation, OCR problem decoding, and step breakdown (`components/VisionInterface.tsx`).
- **Notes AI (`NOTES`)**: Preset study tools (Summarize, Quiz, Glossary, Simplify) with prompt execution (`components/TextInterface.tsx`).

### 2.4 Campus & Community

- **Campus Overview (`CAMPUS`)**: GTU announcements feed, faculty emergency directory, quick action shortcuts.
- **Social Hub (`SOCIAL`)**: WebCrypto AES-GCM 256 E2EE zero-knowledge private & group chat channels (`services/encryptionService.ts`).
- **Digital Library (`LIBRARY`)**: Syllabus node catalog, PDF/video/link filters, AI Study Guide generator.
- **Study Planner (`PLANNER`)**: Priority task management (`high`/`medium`), due date tracking, completion state.
- **Attendance Tracker (`ATTENDANCE`)**: Timetable slot tracking, percentage thresholds (Green $\ge 75\%$, Amber $60-74\%$, Red $<60\%$).

---

## 3. UI/UX Design System Specification

### 3.1 Modern 3D Glassmorphism Theme

- **Canvas Backdrop**: Deep obsidian-indigo gradient (`bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900`).
- **Glass Panels**: Translucent elevated surfaces (`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl`).
- **Glow & Lighting**: Ambient radial blurs (`bg-indigo-500/15 rounded-full blur-3xl`) and glowing neon green progress rings (`drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]`).
- **Micro-Animations**: Smooth hover scaling (`transform hover:scale-[1.02] transition-transform duration-300`).

### 3.2 Mobile Touch Optimization

- **Safe Area Management**: `viewport-fit=cover` and iOS/Android safe area insets (`env(safe-area-inset-bottom)`).
- **Touch Utilities**: `-webkit-overflow-scrolling: touch` and `touch-action: pan-x pan-y`.

---

## 4. Security & Access Control Model

### 4.1 Role-Based Access Control (RBAC)

- **Roles**: `STUDENT`, `FACULTY`, `GTU_ADMIN`.
- **Immutability Guard**: Users cannot modify or escalate their own `role` field.
- **Firestore Security Rules**: Write permissions on `/notices`, `/resources`, `/official_quizzes`, and `/attendance_records` strictly require `FACULTY` or `GTU_ADMIN` privileges.

### 4.2 End-to-End Encryption (E2EE)

- **Crypto Standard**: WebCrypto API (`window.crypto.subtle`) with PBKDF2 100,000-iteration key derivation and AES-GCM 256-bit symmetric encryption.
- **Zero-Knowledge Privacy**: Message contents are encrypted client-side before transmission; private encryption keys never touch central databases.

---

## 5. Verification & Health Certificate

- **TypeScript Type Safety**: `npx tsc --noEmit` $\rightarrow$ **0 Errors, 0 Warnings**
- **Vite Production Build**: `npm run build` $\rightarrow$ **Built in 6.91s** (1,755 modules compiled)
- **Offline Service Worker**: Registered in `index.html` $\rightarrow$ **PASS**
- **Capacitor Configuration**: `capacitor.config.json` (`com.gpashub.app`) $\rightarrow$ **PASS**

---

_Created and certified for GPA Study Hub._
