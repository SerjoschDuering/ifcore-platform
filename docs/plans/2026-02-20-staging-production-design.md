# Design: Staging + Production Environments

**Date:** 2026-02-20
**Status:** Approved

## Goal

Split ifcore-platform into staging and production environments so students
can safely test changes before they hit production. Protect the `main` branch.

## Architecture

```
feature branches
    |
    v
staging branch --push--> GitHub Actions --> HF Space (staging) + CF Worker (staging)
    |
    | (PR to main, 1 review required)
    v
main branch ---push--> GitHub Actions --> HF Space (prod) + CF Worker (prod)
```

## Resource Map

| Resource | Staging (new) | Production (existing) |
|---|---|---|
| HF Space | `serJD/ifcore-platform-staging` | `serJD/ifcore-platform` |
| CF Worker | `ifcore-platform-staging.tralala798.workers.dev` | `ifcore-platform.tralala798.workers.dev` |
| D1 Database | `ifcore-db-staging` | `ifcore-db` |
| R2 Bucket | `ifcore-files-staging` | `ifcore-files` |
| Branch | `staging` | `main` (protected) |

## Key Decision: CF Worker Naming

Top-level wrangler config = production (keeps existing URL unchanged).
Only `env.staging` is a named environment. This avoids breaking the current prod URL.

## Key Decision: Vite Plugin Environments

The project uses `@cloudflare/vite-plugin`. Environments are baked at build time
via `CLOUDFLARE_ENV` env var, NOT via `wrangler deploy --env`. When `CLOUDFLARE_ENV`
is unset, top-level config (prod) is used.

## Files Changed

1. `backend/deploy.sh` -- accept staging/prod argument
2. `frontend/wrangler.jsonc` -- add env.staging section
3. `frontend/package.json` -- add env-specific scripts
4. `.github/workflows/deploy.yml` -- trigger on main + staging branches

## Branch Protection

- PRs required to merge into main (no direct push)
- 1 approving review
- enforce_admins: false (instructor bypass)

## Documentation

New files in company-skills/IFCore-skill/references/:
- `deployment-cicd.md` -- pipeline explained for students
- `post-course-guide.md` -- fork and own the platform after the course
