# IFCore Platform

Shared IFC compliance checker platform — upload a building model, run automated checks, view results in 3D.

> **Want to deploy your own?** See **[docs/DEPLOY-YOUR-OWN.md](docs/DEPLOY-YOUR-OWN.md)** — step-by-step guide with AI-assisted setup prompts, feature ideas, and Agent Skills integration.

## Architecture

Monorepo with two deployments:

| Directory | Deploys to | What |
|-----------|-----------|------|
| `backend/` | HuggingFace Space (Docker) | FastAPI orchestrator — discovers and runs `check_*` functions from all teams |
| `frontend/` | Cloudflare Worker | React UI + Hono API gateway (D1 database, R2 file storage) |

```
Browser ──► Cloudflare Worker (React + API gateway)
               │  ├── D1 (results, auth)
               │  └── R2 (IFC files)
               └──► HuggingFace Space (Docker)
                       └── FastAPI orchestrator → teams/*/tools/checker_*.py
```

**Data flow (polling, not callbacks):**
1. Upload IFC → stored in R2
2. Worker reads from R2, base64-encodes, POSTs to HF `/check`
3. HF returns `job_id` immediately, runs checks in background
4. Browser polls `GET /api/checks/jobs/:id` every 2s
5. Worker lazy-polls HF — when done, stores results in D1, returns to frontend

## Quick Start (local dev)

Two terminals. Python 3.10+, Node 18+.

```bash
# Terminal 1 — backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 7860

# Terminal 2 — frontend
cd frontend && npm install && npm run db:migrate
echo "HF_SPACE_URL=http://localhost:7860" > .dev.vars
npm run dev                        # → http://localhost:5173
```

`@cloudflare/vite-plugin` emulates D1/R2 locally. No cloud accounts needed for dev.

## Deploy

> **Full guide with AI-assisted prompts:** [docs/DEPLOY-YOUR-OWN.md](docs/DEPLOY-YOUR-OWN.md)

**Short version** — only 2 files need editing for a new owner:

1. `backend/deploy.sh` line 5: `HF_REPO="YOURHFNAME/ifcore-platform"`
2. `frontend/wrangler.jsonc`: `database_id` + `HF_SPACE_URL`

```bash
# Backend → HF Space
bash backend/deploy.sh

# Frontend → Cloudflare
cd frontend && npm run db:migrate:remote && npm run deploy
```

## Team Integration

Teams work in their own repos. Their code is pulled in as git submodules:

```bash
git submodule add -f https://github.com/ORG/team-repo backend/teams/team-name
bash backend/deploy.sh          # flatten submodules → push to HF
```

The orchestrator auto-discovers all `check_*` functions in `teams/*/tools/checker_*.py`.

## Check Function Contract

```python
# File: tools/checker_<topic>.py (inside team repo)
# Function: check_<name>(model, **kwargs) -> list[dict]

def check_door_count(model, min_doors=2):
    doors = model.by_type("IfcDoor")
    return [{
        "element_id":       door.GlobalId,
        "element_type":     "IfcDoor",
        "element_name":     door.Name or f"Door #{door.id()}",
        "element_name_long": None,
        "check_status":     "pass",
        "actual_value":     "Present",
        "required_value":   f">= {min_doors} doors total",
        "comment":          None,
        "log":              None,
    } for door in doors]
```

Full contract + examples: `backend/teams/demo/tools/checker_demo.py`

## Tech Stack

- **Backend:** Python, FastAPI, ifcopenshell, PydanticAI, Gemini
- **Frontend:** React, TypeScript, Zustand, Recharts, That Open Engine (@thatopen/components)
- **API:** Hono on Cloudflare Worker, Better Auth
- **Infra:** HuggingFace Spaces (Docker), Cloudflare Workers/D1/R2
