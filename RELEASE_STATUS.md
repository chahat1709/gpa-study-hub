# Release Status

## Current status

GPA Study Hub is in a **near-beta release state**. The frontend has a typed React implementation, an Express/Socket.IO backend, SQLite runtime persistence, Android/Capacitor packaging, academic seed data, and automated test coverage.

## Automated checks

| Check | Command | Expected status |
|---|---|---|
| TypeScript | `npm run check` | Must pass with zero errors |
| Frontend build | `npm run build` | Must complete successfully |
| Unit suite | `npm test` | Runs in one isolated worker with bounded timeouts |
| AI storage tests | `npm run test:ai` | Tests provider/key persistence without live network calls |
| Browser suite | `npm run test:e2e` | Requires the preview server and configured browser environment |

## Manual release checks

Before publishing, verify the required Firebase configuration and backend environment values in the deployment environment. Confirm that the backend can create or open its SQLite database, that the health endpoint responds, and that Socket.IO connections work through the intended tunnel or reverse proxy.

Test at least one student flow, one faculty flow, one administrator flow, one offline fallback, one attendance update, one quiz submission, one resource operation, and one chat message in a staging environment. Validate mobile layout on a real Android device after Capacitor synchronization.

## Known architecture boundary

The active backend runtime uses SQLite through `better-sqlite3` and the server's inline schema/bootstrap path. `server/config/database.js` is a reusable SQLite schema helper, while `server/config/init.sql` is a PostgreSQL-oriented reference schema. These are intentionally documented as separate tracks for this release; they should not be treated as interchangeable without a planned migration.

## Release blockers to resolve before public production

The deployment environment must have a secret-management process, a backup and restore procedure for the SQLite database, a tested tunnel or reverse-proxy configuration, and a controlled Android signing process. Any external AI provider should be configured separately from deterministic unit tests and monitored for quota, latency, and failure behavior.
