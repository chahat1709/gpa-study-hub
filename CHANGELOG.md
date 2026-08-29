# Changelog — GPA Study Hub

All notable changes follow [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-08-29

### Added

- `POST /api/academic/subjects|units|notes|questions` (FACULTY/GTU_ADMIN + zod validation)
- DB unification: `DATABASE_URL` → pg Pool else SQLite (single source `server/src/db/index.js:1` + migrations `server/src/db/migrate.js:1`)
- Static SPA serve: `express.static(dist)` + SPA fallback (`server.js:2534`) — no nginx required
- Tenant scoping: `Host`/`x-tenant-id` → `req.tenantId` middleware (`server.js:256` + `middleware/tenant.js:42`)
- AI RAG: `POST /api/ai/ask` retrieval-augmented on `question_banks`+`notes` with tenant awareness
- Backup/restore verified (`scripts/backup.js:1` VACUUM INTO, 24 tables, 3193 questions)
- npm audit clean: 0 vulnerabilities (fixed 9 high `websocket-driver`, 1 moderate `uuid`)

### Changed

- Audit gate in CI: `npm audit --audit-level=high` now required (blocks merge on high)
- `playwright` tenant isolation job in CI
- `dependabot.yml` weekly for npm/docker/actions
- `k8s/secrets.yaml` header → example only + sealed-secrets instructions

### Fixed

- `health` endpoint working post-server restart
- `POST /api/academic/*` 403 on non-FACULTY, 201 on success
- `req.tenantId` populated from `Host`/`x-tenant-id` header

## [1.0.1] - 2026-08-29

### Added

- Process hardening: branch protection (verify+server required, 1 review), CODEOWNERS, PR template, CONTRIBUTING, dependabot weekly, sealed-secrets docs, k8s example

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
