# Compliance Report — `/report` Feature

## Overview

The **Compliance Report** page provides a cascading, three-level drill-down view of all IFC
check results grouped by **building-regulation category** rather than by raw team name.
It is accessible from the top navbar at `/report`.

---

## Data Source

The page reads two arrays from the global **Zustand** store (no additional API calls):

| Store field | Type | Description |
|---|---|---|
| `checkResults` | `CheckResult[]` | One entry per check function that ran — contains `check_name`, `team`, `status`, `summary` |
| `elementResults` | `ElementResult[]` | One entry per IFC element examined — linked to a `CheckResult` via `check_result_id` |

These arrays are populated when a user **runs checks** on a project (via `CheckRunner` on
the project detail page). The data persists in memory for the session and is available on
any route.

### `CheckResult` shape

```typescript
{
  id: string;             // UUID
  job_id: string;
  project_id: string;
  check_name: string;     // e.g. "check_solar_production"
  team: string;           // e.g. "lux-ai"
  status: "running" | "pass" | "fail" | "unknown" | "error";
  summary: string;        // e.g. "3 elements: 2 pass, 1 blocked"
  has_elements: 0 | 1;
  created_at: number;     // epoch ms
}
```

### `ElementResult` shape

```typescript
{
  id: string;                  // UUID
  check_result_id: string;     // FK → CheckResult.id
  element_id: string | null;   // IFC GlobalId
  element_type: string | null; // e.g. "IfcRoof"
  element_name: string | null;
  element_name_long: string | null;
  check_status: "pass" | "fail" | "warning" | "blocked" | "log";
  actual_value: string | null;
  required_value: string | null;
  comment: string | null;
  log: string | null;
}
```

---

## Three-Level Cascade

```
Level 1  ─  Category Folder   (click to expand/collapse)
│
├── Level 2  ─  Check Name    (click to expand/collapse)
│   │
│   ├── Level 3  ─  Element   (leaf row — no further expansion)
│   ├── Level 3  ─  Element
│   └── ...
│
├── Level 2  ─  Check Name
│   └── ...
└── ...
```

### Level 1 — Category Folder

Each category maps to one team. The folder header shows:

- Chevron (▶ / rotated when open)
- Icon + category label
- Aggregate `StatusBadge` (worst status across all checks)
- Counts: total checks, pass, fail, error, unknown

| Category | Icon | Team | Checks |
|---|---|---|---|
| Habitability | 🏠 | Mastodonte | dwelling area, living area height, living room compliance, bedroom occupancy, service spaces min height |
| Energy Consumption | ⚡ | lux-ai | building areas, leed score, location, roof geometry, solar production |
| Fire Compliance | 🔥 | team-d | sector size compliance, special risk boundary doors, special risk rooms, fire rating, si6 compliance |
| Structure | 🏗️ | structures | beam depth, beam width, column min dimension, bearing beam section, floor capacity, foundation dimensions, foundation slab thickness, slab thickness, wall external uvalue, wall thickness, wall uvalue |
| Lighting & Facade | 💡 | team-e | daylight glazing ratio, room depth, shading presence, shgc, wwr |

Teams **not** in this mapping (e.g. `demo` or future teams) are rendered at the bottom
with a generic 📦 icon and their team name as the label.

### Level 2 — Check Name

Clicking a category folder reveals a list of individual checks. Each row shows:

- Chevron (if the check has element results)
- Check name (with `check_` prefix stripped, underscores replaced by spaces)
- `StatusBadge` (pass / fail / error / unknown)
- Summary string (e.g. "14 elements: 14 pass")

### Level 3 — Element Detail

Clicking a check row expands to show one row per IFC element:

- Colored status dot
- Element name (prefers `element_name_long`, falls back to `element_name`, then `element_type`)
- `StatusBadge` (pass / fail / warning / blocked / log)
- Value column: `actual_value / required_value`, or `comment` if values are absent

---

## Summary Cards

Above the cascade, five stat cards provide an at-a-glance overview:

| Card | Metric | Color |
|---|---|---|
| Total Checks | count of all `checkResults` | white |
| Passed | checks with `status === "pass"` | green |
| Failed | checks with `status === "fail"` | red |
| Errors | checks with `status === "error"` | red |
| Other | everything else (unknown, running, blocked) | muted |

---

## File Structure

```
frontend/src/
├── routes/
│   └── report.tsx                          ← /report route (auto-discovered by TanStack Router)
├── features/
│   └── report/
│       └── TeamReportPanel.tsx             ← CategoryFolder, CheckRow, ElementRow components
└── components/
    ├── Navbar.tsx                           ← "Report" link added to nav
    └── StatusBadge.tsx                      ← reused for all status badges
```

---

## How It Works — Step by Step

1. **User uploads an IFC file** → creates a project at `/projects/:id`
2. **User clicks "Run Checks"** → orchestrator discovers all `check_*` functions across all teams, runs them on the model, stores results in D1 (Cloudflare) and hydrates Zustand
3. **User navigates to `/report`** → the `ReportPage` component reads `checkResults` and `elementResults` from Zustand
4. **Grouping** — `checkResults` are bucketed into a `Map<team, CheckResult[]>`, then each team is matched to its category from the `CATEGORIES` constant
5. **Rendering** — categories render as `CategoryFolder` components in the order defined in `CATEGORIES`; unmapped teams render afterwards alphabetically
6. **Interaction** — clicking a category expands its check list; clicking a check expands its element rows; all state is local React `useState` (no store writes)

---

## Status Aggregation Logic

### Category level (Level 1)

The overall status of a category is determined by the worst status among its checks:

```
error  > fail  > unknown  > pass
```

If a category has zero checks it shows `blocked`.

### Check level (Level 2)

Status comes directly from `CheckResult.status` as computed by the backend orchestrator:

- **pass** — all elements passed
- **fail** — at least one element failed
- **warning** — at least one warning, no failures
- **unknown** — could not determine
- **error** — the check function itself threw an exception

### Element level (Level 3)

Status comes from `ElementResult.check_status`:

- **pass** — element meets the requirement
- **fail** — element does not meet the requirement
- **warning** — close to threshold / advisory
- **blocked** — prerequisite data missing (e.g. no IfcSite coordinates)
- **log** — informational only

---

## Styling

The page follows the platform's existing dark-theme conventions:

- CSS custom properties from `globals.css` (e.g. `--bg`, `--surface`, `--border`, `--success`, `--danger`)
- `.card` and `.container` CSS classes
- `StatusBadge` component for colored status pills
- All layout via inline styles (consistent with the rest of the frontend)
- No external CSS frameworks — pure React + CSS variables

---

## Adding a New Category

To add a new team/category, edit the `CATEGORIES` array in `TeamReportPanel.tsx`:

```tsx
export const CATEGORIES = [
  { label: "Habitability",        icon: "🏠", team: "Mastodonte" },
  { label: "Energy Consumption",  icon: "⚡", team: "lux-ai" },
  { label: "Fire Compliance",     icon: "🔥", team: "team-d" },
  { label: "Structure",           icon: "🏗️", team: "structures" },
  { label: "Lighting & Facade",   icon: "💡", team: "team-e" },
  // Add new categories here:
  { label: "Acoustics",           icon: "🔊", team: "team-f" },
];
```

No other changes needed — the page automatically groups checks by team name.
