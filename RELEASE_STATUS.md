# Release Status — 1.0.0

## Current status

**1.0.0 professional release** — React 19 + TS frontend, Express + Socket.IO backend, SQLite (WAL) runtime, academic seed (48 subjects / 3193 questions), 155 Vitest tests, Playwright e2e, PM2 + Docker + K8s, CI green.

## Automated checks (CI enforces)

| Check         | Command                        | Gate                 |
| ------------- | ------------------------------ | -------------------- |
| Type          | `npm run check`                | 0 errors             |
| Format        | `npm run format:check`         | no diff              |
| Tests         | `npm test`                     | 155/155, single fork |
| Build         | `npm run build`                | success              |
| Audit         | `npm audit --audit-level=high` | no high (warn)       |
| Server health | `node scripts/healthcheck.js`  | 200 on /api/health   |

Pre-commit (Husky): `lint-staged` + `tsc --noEmit`.

## Manual release checklist

- [ ] `scripts/validate-env.js` passes (JWT_SECRET, ADMIN_CODE set, not placeholder)
- [ ] `curl http://localhost:3000/api/health` 200 and `Socket.IO` connects via tunnel/proxy
- [ ] Student → faculty → admin flow, offline fallback, attendance, quiz, resource, chat in staging
- [ ] `node scripts/backup.js` creates `backups/gpa_hub-YYYY-MM-DD.db` and rotation keeps 7
- [ ] Mobile layout on real Android after `npx cap sync`
- [ ] `firestore.rules` and `k8s/secrets.yaml` not containing real secrets

## Architecture

- **College PC default:** SQLite `server/gpa_hub.db` (WAL), single PM2 instance. No Postgres needed.
- **SaaS scale:** `docker-compose --profile saas up` enables Postgres + Redis; server reads `DATABASE_URL`/`REDIS_URL` when set.
- `server/config/database.js` is the reusable SQLite helper; `server/config/init.sql` is Postgres reference.

## How to release

1. Bump `package.json` version, update `CHANGELOG.md`
2. `npm run check && npm test && npm run build`
3. `git tag v1.0.0 && git push --tags`
4. Build artifacts: `dist/`, `android/app/build/outputs/apk/debug/app-debug.apk` (CI uploads), `release/` (electron)
5. Deploy via `start-server.bat` (college PC) or `docker-compose up` / `kubectl apply -f k8s/` (server) or Cloudflare Tunnel.

## Known limits

- SQLite single writer; for >10k concurrent writers move to Postgres (`saas` profile).
- BI/analytics not yet in Grafana — `monitoring/prometheus.yml` is scaffold.
