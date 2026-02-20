# Better Auth MVP — Local Development Setup

## Quick Start

This guide helps you run the IFCore User Portal MVP locally with Better Auth.

### Prerequisites
- Node.js 18+
- Python 3.10+ (for backend, if running separately)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Create Local Dev Configuration

Create `frontend/.dev.vars`:

```bash
# This file is gitignored — contains local overrides for environment variables
HF_SPACE_URL=http://localhost:7860
BETTER_AUTH_SECRET=dev-secret-change-in-production-12345
BETTER_AUTH_URL=http://localhost:5173
```

### Step 3: Initialize D1 Database (Local)

```bash
cd frontend
npm run db:migrate
```

This runs all migrations in `migrations/` against your local SQLite database (stored in `.wrangler/state/`).

### Step 4: Start Local Dev Server

```bash
cd frontend
npm run dev
```

This runs Vite + Wrangler locally:
- Frontend: http://localhost:5173
- Worker API: http://localhost:8787

### Step 5: Test the Auth Flow

1. **Sign Up:**
   - Go to http://localhost:5173/auth/signup
   - Fill in name, email, password
   - Click "Sign Up"
   - You should be redirected to `/profile`

2. **View Profile:**
   - http://localhost:5173/profile shows your user info
   - Session is cookie-based (HTTP-only)

3. **Log Out:**
   - Click "Logout" button on profile page
   - Redirected to home; navbar shows "Sign In" / "Sign Up"

4. **Log In:**
   - Go to http://localhost:5173/auth/login
   - Enter your email + password
   - Redirected to `/profile`

### Step 6: Run Backend (HuggingFace Space Locally)

If you want to test the full platform:

```bash
# Terminal 2
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 7860
```

Then in `frontend/.dev.vars`, change:
```bash
HF_SPACE_URL=http://localhost:7860
```

## Architecture Notes

### Auth Flow (Local)

1. User submits email + password → Frontend calls `POST /api/auth/sign-in`
2. Worker receives request → Better Auth validates credentials (PBKDF2 hash)
3. Better Auth creates session in D1 (`session` table)
4. Session cookie set on response (HTTP-only, SameSite=Strict)
5. Browser polls `GET /api/auth/session` to restore session on page reload
6. `useSession()` hook returns `{ data: Session | null, isLoading, error }`

### Database

- **Local:** SQLite in `.wrangler/state/` (gitignored)
- **Remote:** D1 database `ifcore-db` in Cloudflare (ID: `bf5f1c75-8fea-4ec7-8033-c91a8e61b160`)

Tables auto-created by Better Auth:
- `user` — email, password_hash, name, role
- `session` — session tokens
- `account` — OAuth (not used in MVP)
- `verification` — email verification (not used in MVP)

### RBAC (Role-Based Access)

Currently simple:
- `role: "member"` (default)
- `role: "captain"` (admin)

Set in D1 during signup. Other teams can check `session.user.role` to gate features:

```tsx
const { data: session } = useSession();
if (session?.user.role === "captain") {
  // Show admin panel
}
```

## Troubleshooting

### Issue: "Cannot find module 'better-auth'"
```bash
npm install better-auth
```

### Issue: "D1 migration not found"
```bash
npm run db:migrate  # Uses local .wrangler/state
```

### Issue: "Session not persisting"
- Check browser cookies: DevTools → Application → Cookies
- Ensure `BETTER_AUTH_URL` in `.dev.vars` matches frontend URL (e.g., `http://localhost:5173`)

### Issue: "CORS error on auth requests"
- Ensure Worker has cors middleware: `app.use("/api/*", cors(...))` in `worker/index.ts` ✓

## Deploying to Production

### 1. Set Cloudflare Secrets

```bash
wrangler secret put BETTER_AUTH_SECRET
# Enter a strong random secret (e.g., openssl rand -hex 32)
```

### 2. Update wrangler.jsonc

For your domain/environment:
```jsonc
"vars": {
  "HF_SPACE_URL": "https://your-hf-space.hf.space",
  "BETTER_AUTH_URL": "https://your-ifcore-domain.workers.dev"
}
```

### 3. Run Migrations on Remote D1

```bash
npm run db:migrate:remote
```

### 4. Deploy

```bash
npm run deploy
```

This runs `npm run build` (Vite) then `wrangler deploy` (Worker + assets to Pages).

## Next Steps (Post-MVP)

- Email verification flow
- Password reset flow
- Stripe billing integration
- 2FA / TOTP
- Admin dashboard
- Team management

---

**Questions?** Check the [USER_PORTAL_PRD.md](../../feature-plans/USER_PORTAL_PRD.md) for scope and design.
