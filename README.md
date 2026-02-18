# IFCore Platform

Shared IFC compliance checker platform for IAAC AI Week 2026.

## Architecture

Monorepo with two deployments:

| Directory | Deploys to | What |
|-----------|-----------|------|
| `backend/` | HuggingFace Space (Docker) | FastAPI orchestrator — discovers and runs `check_*` functions from all teams |
| `frontend/` | Cloudflare Pages + Workers | Modular UI (upload, results, 3D viewer, dashboard) + API gateway |

## How It Works

```
Browser → Cloudflare Worker (API gateway) → HF Space (runs checks) → callback → D1 (results)
                                                                                    ↑
Browser polls Worker → reads D1 ─────────────────────────────────────────────────────┘
```

1. **Upload** — Browser uploads IFC to R2 via presigned URL
2. **Check** — Worker forwards to HF Space, gets `jobId` back immediately
3. **Poll** — Browser polls `GET /jobs/:id` every 2s
4. **Callback** — HF Space finishes checks, POSTs results to Worker → D1
5. **View** — Next poll returns completed results

## Repo Structure

```
ifcore-platform/
├── backend/                  → HuggingFace Space
│   ├── README.md             ← HF frontmatter (sdk: docker, app_port: 7860)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py               ← FastAPI: /health, POST /check, POST /jobs/:id/complete
│   ├── orchestrator.py       ← discovers check_* across teams/, runs them
│   ├── deploy.sh             ← pull submodules → flatten → push to HF
│   └── teams/                ← git submodules, flattened before HF deploy
│       ├── team-a/src/*.py
│       └── ...
│
├── frontend/                 → Cloudflare Pages + Worker
│   ├── public/index.html
│   ├── src/
│   │   ├── app.js            ← router, mounts modules
│   │   ├── api.js            ← all fetch() calls
│   │   ├── store.js          ← shared Zustand store
│   │   ├── poller.js         ← polls jobs, updates store
│   │   └── modules/
│   │       ├── upload/
│   │       ├── results/
│   │       ├── viewer-3d/
│   │       └── dashboard/
│   ├── functions/
│   │   └── api/[[route]].js  ← CF Pages Functions (API gateway)
│   ├── migrations/
│   │   └── 0001_create_jobs.sql
│   └── wrangler.toml         ← D1 + R2 bindings
│
└── feature-plans/            ← PRDs before building modules
```

## Team Integration

Teams work in their own repos (`ifcore-team-{a..e}`). Their code is pulled in as git submodules:

```bash
# Captain: pull latest from all teams and deploy
./backend/deploy.sh
```

The deploy script flattens submodules into real files before pushing to HF (HF doesn't reliably init submodules).

## Check Result Schema

Every check function returns results in this format:

```json
{
  "id":            "string",
  "project_id":    "string",
  "job_id":        "string",
  "check_name":    "string",
  "team":          "string",
  "status":        "running | pass | fail | unknown | error",
  "summary":       "string",
  "has_elements":  0 | 1,
  "created_at":    "integer (unix timestamp)"
}
```

## Adding a Backend Check

Drop a `check_*.py` file in your team's `src/` folder. The orchestrator auto-discovers it:

```python
def check_door_width(model) -> list[dict]:
    # model is an ifcopenshell.file object
    # return list of check results matching the schema above
    ...
```

## Adding a Frontend Module

1. Create `frontend/src/modules/<name>/index.js` with `mount(container)`
2. Register the route in `app.js`
3. Read shared state from the Zustand store

Modules never import from each other — they communicate through the store.

## Tech Stack

- **Backend:** Python, FastAPI, ifcopenshell, PydanticAI, Gemini
- **Frontend:** Vanilla JS, Zustand, Three.js (3D viewer)
- **Infra:** HuggingFace Spaces (Docker), Cloudflare Pages/Workers/D1/R2
