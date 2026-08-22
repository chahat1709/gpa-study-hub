# GPA Study Hub

GPA Study Hub is a GTU-focused academic platform for students, faculty, and administrators. It combines a React and TypeScript frontend, an Express and Socket.IO backend, local SQLite persistence, optional Firebase integrations, AI study tools, offline/PWA support, and Capacitor Android packaging.

## Core capabilities

The application provides authentication and role-based access, campus notices and contacts, academic notes and resources, attendance and timetable tracking, task planning, social messaging, AI text and vision assistance, quizzes and examination workflows, faculty grading, administrative controls, and offline-friendly local fallbacks.

## Requirements

Use Node.js 20 or newer. The frontend uses Vite, React, TypeScript, and npm. The backend has its own dependencies under `server/` and uses `better-sqlite3` at runtime.

## Local setup

1. Copy `.env.example` to `.env.local` and supply the Firebase values required for your environment. Never commit `.env`, `.env.local`, server secrets, signing keys, or local database files.
2. Install frontend dependencies with `npm install`.
3. Start the frontend development server with `npm run dev`. It listens on port 3000.
4. Install backend dependencies with `cd server && npm install`.
5. Start the backend from the `server/` directory with `npm run dev`, or use the deployment scripts described in `DEPLOY.md`.

The frontend API base URL can be configured with `VITE_API_URL`. The application also supports Firebase configuration, user-provided AI keys, optional OpenCode Zen/custom OpenAI-compatible providers, and optional Redis settings for backend deployments.

## Verification commands

| Command | Purpose |
|---|---|
| `npm run check` | TypeScript type checking without emitting files |
| `npm run build` | Production frontend build |
| `npm test` | Deterministic single-worker unit test suite |
| `npm run test:unit` | Explicit unit-test command |
| `npm run test:ai` | AI-provider storage tests in an isolated process |
| `npm run test:e2e` | Playwright browser tests |
| `npm run preview` | Serve the production frontend locally |

AI network calls are not required for the unit suite. Provider credentials and network availability are required only for live AI behavior.

## Project layout

- `components/` contains the application shell and user-facing interfaces.
- `components/admin/` and `components/exam/` contain administrative and exam submodules.
- `features/library/` contains the academic library controller and view.
- `services/` contains API, authentication, academic, attendance, exam, social, AI, encryption, offline, and monitoring services.
- `server/` contains the Express runtime, SQLite database setup, Socket.IO behavior, seed data, and deployment dependencies.
- `android/` contains the Capacitor Android project.
- `__tests__/` contains Vitest tests, while `e2e/` contains Playwright tests.
- `public/` contains small public web assets and service-worker resources.

## Production and college-PC deployment

The documented deployment model runs the Express server and SQLite database on a college PC and exposes it through a secure tunnel. See `DEPLOY.md`, `Dockerfile`, `docker-compose.yml`, `start-server.bat`, `setup-college-pc.bat`, and `setup-college-server.bat` for deployment options.

The active runtime database is SQLite through `better-sqlite3` and the server's runtime schema bootstrap. `server/config/init.sql` is retained as a PostgreSQL-oriented schema reference and is not the active SQLite bootstrap path; use the runtime server schema as the source of truth until a deliberate database migration is performed.

## Android packaging

The Android package identifier is `com.gpashub.app`. Build and sync the native project through Capacitor after building the frontend. Local Android SDK paths belong in `android/local.properties` and should remain untracked. Signing keys must be managed outside the source repository.

## Release hygiene

Before publishing a release, confirm that environment files, local databases, Android keystores, generated authentication state, and dependency directories are excluded. Review `RELEASE_STATUS.md` and `SECURITY_AUDIT.md`, run `npm run check`, `npm run build`, `npm test`, and the appropriate Playwright tests, and record the resulting commit or release identifier.
