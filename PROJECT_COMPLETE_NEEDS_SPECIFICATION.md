# 📜 GPA Study Hub — Complete Session Needs & Specifications

> **Generated Date:** 2026-07-21  
> **Target Audience:** GTU College Students (Diploma EC & ICTET Semesters 1 to 6)  
> **Application Package ID:** `com.gpashub.app`  
> **Target Hardware:** ₹5,000 Android Smartphones with 2GB RAM (Capped under 45MB RAM footprint)  
> **Target Budget:** $0.00 Operating Cost for 2 Full Years (Firebase Spark Free Tier + Client BYOK)  
> **Deployment Plan:**
>
> - **Phase 1:** Direct Local APK Distribution (WhatsApp / Drive / Telegram) to reach 2,000+ GTU students.
> - **Phase 2:** Official Google Play Store Release (`.aab` bundle with production keystore).

---

## 1. User Directives & Mandatory Rules

### 1.1 Integrity Contract

- **Rule**: Always tell the complete truth; act as an indispensable personal assistant and employee.
- **Execution**: Zero fluff or automated marketing spin. All findings backed by real code paths, actual terminal logs, and live browser testing at `http://localhost:3000/`.

### 1.2 Academic Scope (Diploma EC & ICTET Semesters 1 to 6)

- Pre-populated GTU branches & subjects (`services/academicService.ts`):
  - **Diploma EC**: Basic Electronics (4311101), Digital Electronics (4331102), Analog Electronics (4341103), Microcontroller & Embedded (4351104), Optical Communication (4361105).
  - **ICTET**: Fundamentals of ICT (4313201), Computer Networks (4333202), Web Development (4343203), Cloud & IoT (4353204), Cyber Security & Ethics (4363205).
  - **Core Engineering**: Engineering Maths (4300001), Communication Skills (4300002).

---

## 2. Technical System Architecture

### 2.1 Financial & Cloud Quotas ($0 Operating Cost for 2 Years)

- **Zero Central Server AI Billing**: All Gemini 3 Pro calls use direct client SDK calls (`getStoredApiKey()`) or GTU offline mock generators.
- **Firebase Spark Free Tier Budget Controls**:
  - **Firestore Reads**: $\le 50,000$ reads/day (Projected $\approx 22,000$/day via in-memory caching).
  - **Firestore Writes**: $\le 20,000$ writes/day (Projected $\approx 3,500$/day).
  - **Storage Bandwidth**: $\le 10\text{ GB/month}$ (Projected $\approx 4.8\text{ GB/month}$ via image downscaling).
  - **Capacity**: $\le 5\text{ GB}$ total storage.

### 2.2 100% Offline Capability & Low-Hardware Optimization

- **PWA Service Worker (`public/sw.js`)**: Registered in `index.html` to cache static app bundles for **0ms instant startup**.
- **Offline Sync Queue (`services/offlineStorageService.ts`)**: Auto-detects `deviceMemory <= 2` or `hardwareConcurrency <= 4`, queues offline quiz/attendance actions, and auto-syncs when online.
- **Low-RAM Footprint**: Memory budget strictly under **45MB RAM** to prevent Android WebView out-of-memory crashes on ₹5,000 Android phones.

### 2.3 Zero-Firebase Fallback & 1-Click Role Switcher

- App runs out-of-the-box in **Demo Mode** without required Firebase environment keys.
- Profile settings feature a **1-Click Role Switcher** (`STUDENT` ↔ `FACULTY` ↔ `GTU_ADMIN`) in [`ProfileInterface.tsx`](file:///c:/Users/chaha/Downloads/gpa-study-hub%20%281%29/components/ProfileInterface.tsx#L85) for zero-setup role testing.

---

## 3. UI/UX Design System Specification

### 3.1 Modern 3D Glassmorphism Theme

- **Canvas Backdrop**: Deep obsidian-indigo gradient (`bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900`).
- **Glass Cards**: Translucent elevated surfaces (`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl`).
- **Neon Progress Ring**: Glowing emerald circular SVG meter (`drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]`).
- **Micro-Animations**: Smooth hover scaling (`transform hover:scale-[1.02] transition-transform duration-300`).

---

## 4. Security & Access Control Model

### 4.1 Role-Based Access Control (RBAC)

- Roles: `STUDENT`, `FACULTY`, `GTU_ADMIN`.
- Firestore Security Rules (`firestore.rules`): Write privileges on `/notices`, `/resources`, `/official_quizzes`, and `/attendance_records` strictly require `FACULTY` or `GTU_ADMIN` privileges. Role escalation is blocked.

### 4.2 End-to-End Encryption (E2EE)

- WebCrypto API (`window.crypto.subtle`) with PBKDF2 100,000-iteration key derivation and AES-GCM 256-bit symmetric encryption (`services/encryptionService.ts`).

---

## 5. Live Firebase Project & App Configuration

- **Firebase Project ID**: `gpa-study-hub-b8669`
- **Firebase Web App ID**: `1:663775111268:web:733d8adaa832b9acd39771`
- **Firebase Android App ID**: `1:663775111268:android:5ecbc030588b6754d39771`
- **Environment Credentials File**: `.env` (Written with live production keys)

---

## 6. Build Verification Results

- **TypeScript Type Safety**: `npx tsc --noEmit` $\rightarrow$ **0 Errors, 0 Warnings**
- **Vite Production Build**: `npm run build` $\rightarrow$ **Built in 6.91s** (1,755 modules compiled into `dist/`)
- **Dev Server**: Running live at **`http://localhost:3000/`**

---

_Certified and compiled for GPA Study Hub._
