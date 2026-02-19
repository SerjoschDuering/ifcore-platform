# IFCore Platform

Two deployments: FastAPI on HuggingFace Spaces + React/Worker on Cloudflare Pages.

```
Browser → Cloudflare Worker (API gateway, D1, R2)
                ↓ POST /check
        HuggingFace Space (FastAPI, runs check_* functions)
                ↓ callback
        D1 → Browser polls → results
```

---

## Local Dev

Needs Python 3.10+ and Node 18+. Two terminals:

```bash
# Terminal 1
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 7860

# Terminal 2
cd frontend && npm install && npm run db:migrate
echo "HF_SPACE_URL=http://localhost:7860" > .dev.vars
npm run dev                        # → http://localhost:5173
```

`@cloudflare/vite-plugin` emulates D1/R2 locally. No cloud accounts needed.

---

## Deploy — Owner (serJD)

HF Space `serJD/ifcore-platform` already exists.

```bash
# Backend → HF (~2 min build)
pip install huggingface_hub && huggingface-cli login
bash backend/deploy.sh

# Frontend → Cloudflare (one-time resource creation)
cd frontend
wrangler d1 create ifcore-db        # copy the database_id into wrangler.jsonc
wrangler r2 bucket create ifcore-files
npm run db:migrate:remote
npm run deploy
```

⚠️ `wrangler.jsonc` still has `TODO_REPLACE_WITH_REAL_ID` — fill in after `d1 create`.

---

## Deploy — New Owner (fork)

**Accounts needed:** GitHub · HuggingFace (free) · Cloudflare (free tier)

1. Fork `SerjoschDuering/ifcore-platform` on GitHub
2. Create HF Space: `hf.co/new-space` → SDK: Docker → name: `ifcore-platform`
3. Edit **2 files**:
   - `backend/deploy.sh` line 5: `HF_REPO="YOURHFNAME/ifcore-platform"`
   - `frontend/wrangler.jsonc`: `database_id` (from step 4) + `HF_SPACE_URL: "https://YOURHFNAME-ifcore-platform.hf.space"`
4. `wrangler d1 create ifcore-db` → paste ID into wrangler.jsonc
5. `wrangler r2 bucket create ifcore-files`
6. `bash backend/deploy.sh`
7. `cd frontend && npm run db:migrate:remote && npm run deploy`

> HF URL pattern: username is lowercased. `MyName` → `myname-ifcore-platform.hf.space`

---

## Adding a Team Repo (captains)

```bash
git submodule add https://github.com/ORG/team-repo backend/teams/team-name
git commit -m "add team-name"
bash backend/deploy.sh
```

Orchestrator auto-discovers all `check_*` functions in `teams/*/tools/checker_*.py`. No platform code changes needed.

---

## Check Function Contract

File: `tools/checker_<topic>.py` in the team repo. Function prefix: `check_`.
First arg: `model` (ifcopenshell.file). Returns: `list[dict]`.

Required dict keys: `element_id`, `element_type`, `element_name`, `element_name_long`,
`check_status` (`pass`/`fail`/`warning`/`blocked`/`log`), `actual_value`, `required_value`, `comment`, `log`.

Working example: `backend/teams/demo/tools/checker_demo.py`.

---

## Key Files

| File | What |
|------|------|
| `backend/main.py` | FastAPI: `/health`, `POST /check` |
| `backend/orchestrator.py` | Discovers + runs `check_*` functions |
| `backend/deploy.sh` | **Change `HF_REPO`** · flatten submodules → push to HF |
| `frontend/wrangler.jsonc` | **Change `database_id` + `HF_SPACE_URL`** for new owner |
| `frontend/migrations/0001_init.sql` | D1 schema |
| `frontend/.dev.vars` | Local env overrides — gitignored, never commit |
