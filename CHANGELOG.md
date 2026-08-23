# Changelog — GPA Study Hub

All notable changes follow [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-08-22

### Added

- GTU 2024-25 academic seed: 48 subjects, 180 units, 647 syllabus, 3193 questions, 974 PYQs, 275 notes, 108 labs, 25 projects (idempotent runner)
- Academic REST API `/api/academic/*` (meta, subjects, units, questions, pyqs, notes, labs, projects, dashboard) + frontend wiring with offline fallback
- CI pipeline `.github/workflows/ci.yml` (check, 155 tests, build, audit, health)
- PM2 `ecosystem.config.js`, `scripts/validate-env.js`, `scripts/backup.js` (VACUUM INTO), `scripts/healthcheck.js`
- EditorConfig, Prettier, Husky pre-commit (`lint-staged` + `tsc --noEmit`)
- Professional `start-server.bat` / `deploy.bat` with health polling, PM2, log files

### Changed

- Auth: `hashPin` SHA256+static salt → `bcrypt 12` with legacy SHA256 transparent migration (`server/server.js:997`)
- JWT `30d` → `7d` + issuer validation
- Validation: `zod` schemas for `signup`/`login`/`faculty-signup`
- DB: deduped academic schema (duplicate `CREATE TABLE` → indexes only), `last_login_at` migration
- `sanitize()` encodes `<>` instead of stripping; forgot-pin enumeration leak fixed
- Metrics: fixed `lastMinuteRequests` no-op and `p95` in-place sort
- `Dockerfile` non-root, `healthcheck` via `scripts/healthcheck.js`; `docker-compose.yml` SQLite default, Postgres/Redis via `saas` profile with `*:?` required vars
- `package.json` version `0.0.0` → `1.0.0`

### Fixed

- `authMiddleware` `users.is_active` missing column (500 on all authed routes)
- `GET /api/academic/dashboard` ambiguous `semester` column
- Oversized logo / responsive utility failure + dashboard hierarchy (Ink & Highlight redesign)

### Security

- Rate limiting, Helmet, HPP, CSRF double-submit, input sanitization retained
- `k8s/secrets.yaml` placeholders only, `.env` gitignored, `server/.env.example` templates

## [0.9.0] - 2026-07-21

- Initial near-beta: React+T S frontend, Express+SQLite backend, Firebase optional, 155 Vitest tests, Playwright e2e, Capacitor Android (`com.gpashub.app`)
