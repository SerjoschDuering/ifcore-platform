# IFCore Platform — Claude Instructions

**ALWAYS read `AGENTS.md` first.** It is the source of truth for local dev, deployment, and the check function contract.

## Quick orientation

| Component | Where | Command |
|-----------|-------|---------|
| Backend (FastAPI) | `backend/` | `uvicorn main:app --port 7860` |
| Frontend (CF Worker + React) | `frontend/` | `npm run dev` |
| Local DB init | `frontend/` | `npm run db:migrate` (once) |
| HF deploy | repo root | `bash backend/deploy.sh` |
| CF deploy | `frontend/` | `npm run deploy` |

For local E2E: create `frontend/.dev.vars` with `HF_SPACE_URL=http://localhost:7860`.

## Owner config (serJD)

- HF Space: `serJD/ifcore-platform` → `https://serjd-ifcore-platform.hf.space`
- `frontend/wrangler.jsonc` still has `TODO_REPLACE_WITH_REAL_ID` — must run `wrangler d1 create ifcore-db` and fill it in before CF deploy

## Files that change per owner

Only 2 files need editing when forking for a new owner:
1. `backend/deploy.sh` line 5: `HF_REPO=`
2. `frontend/wrangler.jsonc`: `database_id` + `HF_SPACE_URL`

## Security / Sharing with Students

Audited Feb 19 2026 — safe to add students as collaborators on the GitHub repo.

- **No API keys, tokens, or passwords are committed** (or exist anywhere in the repo)
- `frontend/wrangler.jsonc` contains the Cloudflare D1 `database_id` — this is an identifier, not a secret; students can't do anything with it without a CF API token
- `frontend/.wrangler/state/` (local dev SQLite/R2 blobs) is gitignored — never pushed
- `.dev.vars` (local HF_SPACE_URL override) is gitignored — never pushed
- The git repo currently tracks only stub `.gitkeep` files; no source code committed yet

**Before committing source code:** confirm `.wrangler/`, `.dev.vars`, and `node_modules/` stay gitignored (they are already in `.gitignore`).

## Confirmed working (Feb 19 2026)

- Python 3.9 compat patch in `main.py` (`Optional[str]`) ✅
- HF URL fixed in `wrangler.jsonc` → `https://serjd-ifcore-platform.hf.space` ✅
- Backend `/health` returns discovered checks ✅
- Orchestrator: `check_door_count` on Duplex Apartment → 14 doors pass ✅
