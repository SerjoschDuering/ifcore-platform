# Deploy Your Own IFCore Platform

Fork the platform, deploy it under your own accounts, and start adding checks.

**What you get:** A full IFC compliance checker with 3D viewer, dashboard, AI chat,
team report panel, and category filtering — all running on free-tier cloud services.

## Prerequisites

| Service | Why | Cost |
|---------|-----|------|
| [GitHub](https://github.com) | Host your fork | Free |
| [HuggingFace](https://huggingface.co) | Runs the Python backend (Docker Space) | Free |
| [Cloudflare](https://dash.cloudflare.com/sign-up) | Hosts the frontend + API + database + file storage | Free |
| [Node.js 18+](https://nodejs.org) | Build & deploy the frontend | — |
| [Python 3.10+](https://python.org) | Local backend testing | — |
| AI coding assistant (Claude Code, Cursor, Copilot) | Guided setup with skills | — |

## Architecture Overview

```
Browser ──► Cloudflare Worker (API gateway + React frontend)
               │  ├── D1 database (SQLite — results, auth)
               │  └── R2 bucket (IFC file storage)
               │
               └──► HuggingFace Space (Docker)
                       └── FastAPI + orchestrator
                           └── teams/*/tools/checker_*.py
```

The frontend (React + TypeScript) and API gateway (Hono on Cloudflare Worker) run on
Cloudflare (free). The Python backend (IFC parsing, check execution, AI chat) runs on
a HuggingFace Docker Space (free).

**Data flow:** Browser uploads IFC → stored in R2 → Worker reads file, encodes as base64 →
POSTs to HF Space `/check` → HF returns `job_id` immediately, runs checks in background →
Browser polls Worker `GET /api/checks/jobs/:id` → Worker lazy-polls HF → when done,
results stored in D1 → returned to frontend.

---

## Step-by-Step Setup

### 1. Fork the Repo

Fork `SerjoschDuering/ifcore-platform` on GitHub. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/ifcore-platform.git
cd ifcore-platform
```

### 2. Set Up HuggingFace Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. **Space name:** `ifcore-platform`
3. **SDK:** Docker
4. **Visibility:** Public (free tier requires public)
5. Note your HF username — your Space URL will be:
   `https://YOURUSERNAME-ifcore-platform.hf.space`
   (username is lowercased: `MyName` → `myname`)

### 3. Set Up Cloudflare Resources

Install the Wrangler CLI, then create the database and storage bucket:

```bash
cd frontend
npm install
npx wrangler login          # opens browser, authenticate once
npx wrangler d1 create ifcore-db
# ^^^ prints a database_id — copy it for the next step
npx wrangler r2 bucket create ifcore-files
```

### 4. Update Two Config Files

Only 2 files need editing. Everything else works as-is.

**`backend/deploy.sh` line 5** — your HF repo:
```bash
HF_REPO="YOUR_HF_USERNAME/ifcore-platform"
```

**`frontend/wrangler.jsonc`** — your D1 database ID + HF Space URL:
```jsonc
{
  "d1_databases": [{
    "database_id": "PASTE_YOUR_D1_ID_HERE"   // from step 3
  }],
  "vars": {
    "HF_SPACE_URL": "https://YOURUSERNAME-ifcore-platform.hf.space"
  }
}
```

### 5. Deploy the Backend

```bash
pip install huggingface_hub
huggingface-cli login        # paste your HF token
bash backend/deploy.sh       # pushes to your HF Space (~2 min build)
```

Verify: visit `https://YOURUSERNAME-ifcore-platform.hf.space/health`
— should return JSON like:
```json
{"status": "ok", "checks_discovered": 5, "checks": [{"team": "demo", "name": "check_door_count"}, ...]}
```

### 6. Deploy the Frontend

```bash
cd frontend
npm run db:migrate:remote    # creates tables in your D1 database
npm run deploy               # builds + deploys to Cloudflare
```

Your platform is now live at `https://ifcore-platform.YOUR_CF_SUBDOMAIN.workers.dev`.

---

## AI-Assisted Setup

Already using an AI coding assistant? Install the IFCore skill for guided help.

### Install the Skills

Clone and add these skills to your AI assistant:

```bash
# IFCore company skill — contracts, architecture, patterns
git clone https://github.com/SerjoschDuering/iaac-bimwise-skills.git

# Add to your AI assistant:
# - VS Code/Copilot: Chat → Add Agent Skill → select SKILL.md (User scope)
# - Cursor: Settings → Agent Skills → Add → point to cloned folder
# - Claude Code: install as plugin or add to ~/.claude/settings.json
```

### Sample Prompts

Copy-paste these into your AI assistant to get guided help at each step.

**Initial setup:**
```
I forked the ifcore-platform repo and want to deploy it under my own
HuggingFace and Cloudflare accounts. Walk me through:
1. Creating the HF Space (Docker SDK)
2. Creating Cloudflare D1 database and R2 bucket with wrangler
3. Updating the two config files (deploy.sh and wrangler.jsonc)
4. Deploying backend and frontend
My HF username is _____ and I already ran `npx wrangler login`.
```

**Adding your team's checks:**
```
I have check functions in my team repo under tools/checker_*.py.
Help me add my repo as a git submodule to the platform and redeploy:
1. Add submodule with -f flag to backend/teams/my-team
2. Run deploy.sh to push to HuggingFace
3. Verify the orchestrator discovers my check_* functions via /health
```

**Adding AI chat (optional):**
```
I want to enable the AI chat feature on my deployed platform.
The backend needs a GEMINI_API_KEY environment variable. Help me:
1. Get a free Gemini API key from Google AI Studio
2. Set it as a Space secret on my HuggingFace Space settings page
3. Test the chat by asking about check results in the UI
```

**Troubleshooting:**
```
My platform is deployed but checks aren't running. Help me debug:
1. Check if the HF Space is awake (GET /health)
2. Verify the HF_SPACE_URL in wrangler.jsonc matches my Space
3. Check the Cloudflare Worker logs for errors (wrangler tail)
4. Verify my checker_*.py files follow the check function contract
```

**Adding a new frontend feature:**
```
I have the ifcore-platform deployed and want to add a new feature.
The platform uses:
- Backend: FastAPI on HuggingFace Spaces (Python, ifcopenshell, PydanticAI)
- Frontend: React + TypeScript on Cloudflare (Hono Worker, D1, R2)
- State: Zustand store with slices
- 3D: That Open Engine (@thatopen/components)

I want to build: [DESCRIBE YOUR FEATURE]

Help me plan which files change and implement it step by step.
```

---

## What's Already Built

The platform ships with these features — all working out of the box.
The main workspace is `/projects/:id` — most features are panels within it.

| Feature | Where | What it does |
|---------|-------|-------------|
| Upload | `/projects` page | Upload IFC files, stored in R2 |
| Check Runner | project workspace | Runs all discovered team checks against an IFC model |
| 3D BIM Viewer | project workspace | Interactive viewer with element selection + highlighting |
| Category Cards | project sidebar | Filter results by category (structural, fire, accessibility) |
| Results Table | project workspace | Pass/fail/warning per element with detail expansion |
| Technical Dashboard | project panel | Recharts charts, KPI gauges, element breakdown |
| Team Report | project panel | Cascading report grouped by team with status rollup |
| AI Chat | project panel | Ask questions about results (needs Gemini API key on HF) |
| Auth | `/login` page | User authentication via Better Auth (email/password) |

**API endpoints** (Cloudflare Worker):

| Endpoint | Method | What it does |
|----------|--------|-------------|
| `/api/upload` | POST | Upload IFC file to R2, create project in D1 |
| `/api/checks/run` | POST | Read IFC from R2, base64-encode, send to HF `/check` |
| `/api/checks/jobs/:id` | GET | Poll job status, lazy-poll HF, return results from D1 |
| `/api/projects` | GET | List user's projects |
| `/api/chat` | POST | Proxy to HF Space `/chat` endpoint |
| `/api/files/*` | GET | Download files from R2 |
| `/api/auth/*` | ALL | Better Auth endpoints (login, register, session) |

**Backend endpoints** (HuggingFace Space):

| Endpoint | Method | What it does |
|----------|--------|-------------|
| `/health` | GET | Returns discovered checks and status |
| `/check` | POST | Accepts `{ifc_b64, project_id}`, returns `{job_id}`, runs checks async |
| `/jobs/{id}` | GET | Returns job status + results when done |
| `/chat` | POST | PydanticAI agent answers questions about check results |

---

## Feature Ideas to Explore

The platform is designed to be extended. Here are ideas with suggested difficulty:

### Quick Wins (1-2 hours)

- **Additional check functions** — Write new `checker_*.py` files in your team repo (structural, energy, accessibility)
- **Custom regulations** — Write checks against your local building code instead of the sample regulations
- **Custom status colors** — Edit `constants.ts` to match your brand or local standards
- **Export results to CSV** — Add a download button to the results table

### Medium Projects (half day)

- **Result comparison** — Compare check results between two IFC file versions side-by-side
- **Custom dashboard widgets** — Add Recharts visualizations for your domain (energy performance, accessibility scoring)
- **Persistent job history** — Replace the in-memory HF job store with disk-based storage so jobs survive Space restarts
- **Email notifications** — Send pass/fail summary when checks complete (Cloudflare Workers + Resend or Mailgun)
- **Webhook integrations** — POST results to Slack, Teams, or a custom endpoint when checks complete

### Ambitious Projects (1+ day)

- **RAG-powered chat** — Index your regulations as PDF/markdown, use PydanticAI + vector search for retrieval-augmented answers about why checks fail
- **Automated PDF reports** — Generate downloadable compliance reports from check results using a template engine
- **CI/CD pipeline** — GitHub Actions to auto-deploy on push: lint → test → deploy backend → deploy frontend
- **Multi-model comparison** — Upload multiple IFC files and compare compliance across design iterations
- **Role-based access** — Extend Better Auth with roles (admin, reviewer, viewer) and restrict features per role
- **IFC diff viewer** — Highlight geometry changes between model versions in the 3D viewer

---

## Gotchas

1. **Always use `npm run deploy`** (not `npx wrangler deploy`) — it runs the Vite build first. Without it you deploy stale code.
2. **HF Space sleeps after 48h** — first request after inactivity takes 10-60s to wake up
3. **In-memory jobs on HF** — if the Space restarts, pending jobs are lost (users must re-submit)
4. **HF can't resolve `*.workers.dev`** — never pass Worker URLs to the HF backend (that's why we base64-encode the IFC in the request body instead of sending a download URL)
5. **`git submodule add` needs `-f` flag** — `.gitignore` blocks `backend/teams/*/` by default; use `git submodule add -f <url> backend/teams/<name>`
6. **Windows users** — use Git Bash or WSL for `deploy.sh`; PowerShell doesn't support bash scripts
7. **Gemini API key for chat** — set `GEMINI_API_KEY` as an environment variable (locally: `export GEMINI_API_KEY=...`, on HF: Space Settings → Secrets)

---

## Related Skills

These Agent Skills provide deep guidance for specific parts of the stack.
Install them alongside the IFCore skill for the best AI-assisted development experience:

| Skill | What it covers |
|-------|---------------|
| **IFCore Skill** | Check function contracts, team integration, validation schema, issue reporting |
| **Cloudflare Skill** | Workers, D1, R2, Pages — deployment patterns, secrets, debugging |
| **HuggingFace Deploy Skill** | Docker Spaces, secrets, deploy scripts, monitoring |
| **PydanticAI Skill** | AI agents, tools, structured output, chat patterns, Gemini config |
