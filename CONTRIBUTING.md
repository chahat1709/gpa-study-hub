# Contributing — GPA Study Hub

## Branching

- `master` is protected. No direct pushes.
- Create `feat/<scope>` / `fix/<scope>` from `master` → PR → 1 review → squash merge.

## Conventional Commits

`feat:`, `fix:`, `chore:`, `refactor:`, `docs:` — enforced by `ci` check.

## Local checks (must pass before PR)

```
npm ci
npm run check
npm run format:check
npm test
npm run build
npm --prefix server audit --audit-level=high
```

## Secrets

Never commit `.env`, `server/.env`, `*.db`, `*.jks`, `e2e/.auth/`. Use `.env.example` templates.

## Release

Bump `package.json` + `CHANGELOG.md`, `git tag vX.Y.Z && git push --tags` — `cd.yml` builds `ghcr.io`.
