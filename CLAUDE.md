# IFCore Platform — Claude Instructions

**ALWAYS read `AGENTS.md` first.** It is the source of truth for local dev, deployment, and the check function contract.

## Quick orientation

| Component | Where | Command |
|-----------|-------|---------|
| Backend (FastAPI) | `backend/` | `uvicorn main:app --port 7860` |
| Frontend (CF Worker + React) | `frontend/` | `npm run dev` |
| Local DB init | `frontend/` | `npm run db:migrate` (once) |
| HF deploy | `backend/` | `bash deploy.sh` |
| CF deploy | `frontend/` | `npm run deploy` (runs vite build first!) |

For local E2E: create `frontend/.dev.vars` with `HF_SPACE_URL=http://localhost:7860`.

## Owner config (serJD)

- HF Space: `serJD/ifcore-platform` → `https://serjd-ifcore-platform.hf.space`
- CF Worker: `https://ifcore-platform.tralala798.workers.dev`
- D1 database ID: `bf5f1c75-8fea-4ec7-8033-c91a8e61b160`

## Files that change per owner

Only 2 files need editing when forking for a new owner:
1. `backend/deploy.sh` line 5: `HF_REPO=`
2. `frontend/wrangler.jsonc`: `database_id` + `HF_SPACE_URL`

## Critical: CF Worker Build

**ALWAYS use `npm run deploy` (not `npx wrangler deploy`) for deployments.**
The Worker is compiled by Vite via `@cloudflare/vite-plugin`, not wrangler's esbuild.
`npm run deploy = npm run build && wrangler deploy`
If you run `npx wrangler deploy` alone, it deploys the last cached build and ignores code changes.

## Architecture: Polling (not callback)

HF Spaces **cannot resolve `*.workers.dev` DNS** — it's a Cloudflare-internal routing issue.
We use polling instead of callbacks:

```
Browser → CF Worker POST /api/checks/run
            → reads IFC from R2, encodes as base64
            → POST {ifc_b64, project_id} to HF Space /check
            → HF returns {job_id} immediately, runs check in background
            → CF stores hf_job_id in D1
Browser polls CF Worker GET /api/checks/jobs/:id every 2s
            → CF lazy-polls HF GET /jobs/{hf_job_id}
            → when HF returns done: remap job_id, insert to D1, return results
```

Key design decisions:
- **Base64 IFC in request body**: avoids HF DNS issues entirely (no outbound download)
- **Lazy polling**: CF polls HF only on frontend poll requests (no background tasks)
- **job_id remapping**: HF generates its own job UUIDs; must remap to CF job UUID before D1 insert (FK constraint)

## Security / Sharing with Students

Audited Feb 19 2026 — safe to add students as collaborators on the GitHub repo.

- **No API keys, tokens, or passwords are committed** (or exist anywhere in the repo)
- `frontend/wrangler.jsonc` contains the Cloudflare D1 `database_id` — identifier, not a secret
- `frontend/.wrangler/state/` (local dev SQLite/R2 blobs) is gitignored — never pushed
- `.dev.vars` (local HF_SPACE_URL override) is gitignored — never pushed

## Confirmed working (Feb 19 2026)

- HF Space `serJD/ifcore-platform` RUNNING ✅
- CF Worker deployed at `ifcore-platform.tralala798.workers.dev` ✅
- D1 database `ifcore-db` provisioned + migrations applied ✅
- R2 bucket `ifcore-files` provisioned ✅
- Full E2E: upload IFC → CF reads from R2 → base64 → HF → check_door_count → 14 doors pass → CF lazy-poll → D1 → frontend in ~5s ✅
- Backend `/health` returns discovered checks ✅
- Backend `/jobs/{job_id}` polling endpoint ✅
- Backend in-memory job store (ephemeral — resets on Space restart) ✅

## Known Gotchas

1. **HF Space restart**: in-memory `_jobs` dict is cleared → pending jobs stuck "running" in D1. Users must re-submit. For production: persist to disk or HF Hub dataset.
2. **HF cold start**: after 48h inactivity, Space sleeps. First request takes 10-60s.
3. **`*.workers.dev` DNS**: HF Spaces cannot resolve Cloudflare Workers subdomains. Never send Workers URLs as callback/download targets to HF.
4. **`npm run deploy` vs `npx wrangler deploy`**: always use the npm script to include the Vite build step.
5. **job_id mismatch**: HF generates its own job UUIDs. Always remap `check_result.job_id = cf_job_id` before D1 insert.
