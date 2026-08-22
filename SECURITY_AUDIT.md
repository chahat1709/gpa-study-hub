# Security Audit

## Protected artifacts

The repository must not publish `.env`, `.env.local`, `server/.env`, SQLite database files, Android `local.properties`, Android keystores, saved Playwright authentication state, dependency directories, or generated build output. Ignore rules now cover these local artifacts, but tracked-file history must still be reviewed before a public release.

## Authentication and authorization

The application contains custom student/faculty/admin role handling, session persistence, JWT-backed backend authentication, PIN/password hashing, rate limiting, and permission checks. A staging review should verify that every administrative API path enforces server-side role checks and that frontend visibility is never treated as the only authorization boundary.

## Data protection

The project includes client-side Web Crypto functionality for protected message handling and server-side security middleware. Review encryption key lifecycle, message metadata exposure, backup protection, and database file permissions before storing real student records. Do not treat local client encryption as a substitute for server authorization or secure transport.

## Deployment

Run the server behind HTTPS or a trusted secure tunnel. Set a strong production JWT secret, restrict CORS to the deployed frontend origin, disable development diagnostics, protect upload directories, and confirm that health/metrics endpoints do not expose secrets or personally identifiable information.

## Operational controls

Create a scheduled database backup, test restoration, rotate credentials on every production handoff, retain audit logs according to institutional policy, and define a process for handling account recovery, abuse reports, AI-provider errors, and lost devices.

## Pre-publication commands

Run `git status --short`, inspect `git ls-files` for secrets and generated artifacts, run `npm run check`, `npm run build`, `npm test`, and the appropriate end-to-end tests. Review the final archive contents independently before distribution.
