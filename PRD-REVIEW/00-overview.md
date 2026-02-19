# PRD Review — Master Overview

**Date:** 2026-02-19 | **Deadline:** Course ends Feb 20 (tomorrow)

## Teams at a Glance

| Branch | Team | Feature | Verdict | Risk |
|--------|------|---------|---------|------|
| `feature/team-B-adminpanel` | Team B | User Portal (auth) | NEEDS CHANGES | MEDIUM |
| `3dViewer/team-d-3dViewer` | Team D | 3D Viewer Categories | NEEDS CHANGES | LOW-MEDIUM |
| `feature/team-e-TechDashboard` | Team E (LlumAI) | Technical Dashboard | NEEDS CHANGES (minor) | LOW |
| `team/lux-ai/feature-energy` | Lux-AI | Cascading Report | NEEDS CHANGES | LOW |
| `structure-chatbot` | Structures | AI Chat Interface | REVERTED | **HIGH** |

## Cross-Team Verdict: COMPATIBLE WITH CAVEATS

All 5 plans are aligned IF the captain ships shared infrastructure first. No team-vs-team conflicts at runtime. Three caveats:

1. **colorMap auto-overwrite** — `useViewer.ts` rebuilds colorMap on every render. Teams D and Lux-AI must use `highlightColorMap` (not `colorMap`) for click/category highlights. Captain adds this to viewerSlice.
2. **CATEGORIES shape mismatch** — existing `TeamReportPanel.tsx` has `{label, icon, team}`. Proposed `constants.ts` uses `{id, label, color}`. Captain must reconcile to include ALL fields (`id`, `label`, `color`, `icon`, `team`).
3. **filterSlice doesn't exist yet** — Team D writes, Team E reads. Captain creates before teams branch.

---

## Captain Prerequisites (Do First — 30-60 min)

Before ANY team starts coding, push these to main:

| # | File | What | Blocks |
|---|------|------|--------|
| 1 | `frontend/src/lib/constants.ts` | STATUS_COLORS, CATEGORIES (all fields), CATEGORY_MAP, getCategory(), statusToHex() | Teams D, E, Lux-AI |
| 2 | `frontend/src/stores/slices/filterSlice.ts` | selectedCategory, selectedCheckId + setters | Teams D, E |
| 3 | Update `viewerSlice.ts` | Add highlightColorMap, setHighlightColorMap, clearHighlights | Teams D, Lux-AI |
| 4 | Update `store.ts` + `types.ts` | Wire filterSlice into combined store | Teams D, E |
| 5 | Update `BIMViewer.tsx` | Apply `{...colorMap, ...highlightColorMap}` | Teams D, Lux-AI |
| 6 | Update `TeamReportPanel.tsx` | Import CATEGORIES from shared constants | Lux-AI |
| 7 | Fix CORS in `worker/index.ts` | Replace `origin: "*"` with explicit origins + `credentials: true` | Team B (auth cookies need it) |

---

## Store Read/Write Matrix

| Feature | Reads | Writes | Conflicts |
|---------|-------|--------|-----------|
| Team B (Auth) | `projects` | None (Better Auth `useSession`) | None |
| Team D (Categories) | `checkResults`, `elementResults`, `selectedCategory` | `selectedCategory`, `selectedCheckId`, `highlightColorMap` | None (if using highlightColorMap) |
| Team E (Dashboard) | `checkResults`, `elementResults`, `selectedCategory`, `selectedCheckId` | None (read-only) | None |
| Lux-AI (Report) | `checkResults`, `elementResults` | `highlightColorMap`, `selectedIds`, `viewerVisible` | None (if using highlightColorMap) |
| Structures (Chat) | `checkResults`, `elementResults`, `activeProjectId` | None (local state) | None |

---

## Demo Day Plan

**Recommended order** (follows user journey):

1. **Team B** (2 min) — Log in. Show auth works. Sets the stage.
2. **Team D** (3 min) — Category cards. Click Fire Safety → viewer highlights, table filters.
3. **Team E** (3 min) — Dashboard with charts. Show real data from all 5 teams.
4. **Lux-AI** (3 min) — Report accordion. Click element → viewer highlights.
5. **Structures** (3 min) — Chat. Ask "what failed?" → get answer. The "wow" moment if LLM works.

**Narrative arc:** Welcome → Navigate → Analyze → Deep-dive → Understand

---

## Timeline

```
08:00  Captain: push constants.ts + filterSlice.ts + highlightColorMap to main
       Team B: start Better Auth setup (independent)
       Team E: start standalone HTML prototype (independent)
       Structures: start ChatPanel + chatHandler (independent)
       Lux-AI: start CSS tree-lines + hover states (independent)

09:00  Captain: done → teams pull main
       Team D: start CategoryCards.tsx

12:00  LUNCH — everyone should have core functionality working

14:00  All teams: PR to main, integration testing

15:00  Demo prep
```

**Teams that can start immediately (no blockers):** B, E (Phase A), Structures, Lux-AI (Steps 1-3)
**Teams blocked on captain:** D (fully), Lux-AI (Step 4 click-to-highlight only)

---

## Risk Assessment

| Team | Risk | Why | Fallback |
|------|------|-----|----------|
| Team B | MEDIUM | CF Worker quirks (CPU limits, PBKDF2) | Skip auth for demo |
| Team D | LOW-MED | Blocked on captain prep | Hardcode constants locally |
| Team E | LOW | Phase A is fully independent | Standalone HTML is the fallback |
| Lux-AI | LOW | 80% already built | Ship CSS polish without click-to-highlight |
| **Structures** | **HIGH** | Zero code, architecture pivot required | Keyword-only chat (skip LLM Phase 2) |

**Instructor action for Structures:** Check in first thing. Their AI agent handles React/TS — students describe product intent, agent writes code. If keyword chat is working by lunch, attempt Phase 2 (LLM). If not, ship keyword chat as the demo.

---

## Final Readiness (Validated Feb 19, 23:00)

All 5 feedback docs validated against real platform source, skill references, and cross-team compatibility. Code snippets verified against actual TypeScript types. Patches applied in-place.

| Team | Readiness | Key patches applied |
|------|-----------|-------------------|
| Team B | 4/5 | Auth route `/api/auth/*` (not `/auth/*`), CORS fix, Bindings type, .dev.vars, drizzle-orm dep, user table name mapping, CLI caveat |
| Team D | 4/5 | `getCategory(cr.team)` (not `cr.check_name`), ElementResult join via check_result_id, ResultsTable no-props warning, null guard on element_id |
| Team E | 5/5 | Phase B route file note (minor) |
| Lux-AI | 4/5 | CATEGORIES import moving to constants.ts, statusToHex import source |
| Structures | 3/5 | Null guards on ElementResult fields, Worker proxy warning, GEMINI_API_KEY note, skill invocation guidance, Gradio references removed |

**Remaining risks:**
- Team B: PBKDF2 hasher may hit edge cases on CF Workers free tier — instructor should watch for Error 1102
- Structures: Highest risk team. Fallback is keyword-only chat (skip Phase 2 LLM). AI agent handles the React/TS — students focus on product logic.

---

## Per-Team Feedback Docs

- [01 — Team B: User Portal](./01-team-b.md)
- [02 — Team D: 3D Viewer Categories](./02-team-d.md)
- [03 — Team E: Technical Dashboard](./03-team-e.md)
- [04 — Lux-AI: Cascading Report](./04-lux-ai.md)
- [05 — Structures: AI Chat](./05-structures.md)
