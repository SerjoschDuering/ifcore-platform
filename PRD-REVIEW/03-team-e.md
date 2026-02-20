# Team E (LlumAI) — Technical Dashboard

**Branch:** `feature/team-e-TechDashboard` | **Verdict:** NEEDS CHANGES (minor — coordinate colors + state)


**Shared State (Phase B):** Reads `checkResults`, `elementResults`, `selectedCategory`, `selectedCheckId`. Writes: none (read-only visualization).

**Best PRD of all five teams. A few small tweaks and you are ready to build.**

---

## What You Did Well

**1. Real data contracts with actual checker outputs.**
You did not guess what the data looks like -- you ran every team's checkers against the Duplex Apartment model and documented the exact output counts (21 elements for dwelling area, 113 for wall thickness, etc.). No other team did this. It means your dashboard will work with real data from day one, not just a best-case demo.

**2. Edge case table.**
You explicitly planned for: zero elements, all blocked, error status (Team D's contract issues), log-only rows, 113+ element scroll, and missing values. This is the kind of thinking that separates a prototype from a product. Keep this table -- it becomes your test plan.

**3. Clear scope boundaries.**
Your "We own / We don't own" table is exactly right. You know you own the bottom panel. You know you do not own the sidebar, the 3D viewer, or the upload. This keeps your work focused and avoids stepping on other teams.

**4. Prototype-first approach.**
Building a standalone `index.html` first, then converting to a platform component later, is the smartest strategy. It means you will have something working and demo-ready regardless of what happens with platform integration. Phase A is independent -- you need zero coordination with anyone to deliver it.

---

## Minor Adjustments

### 1. Status color hex values -- use shared constants

Your colors are close to everyone else's, but not identical:

| Status | Your PRD | Other teams | Platform (useViewer.ts) |
|--------|----------|-------------|-------------------------|
| pass   | `#4CAF50` | `#22c55e`  | `#d0d3da` (gray!)       |
| fail   | `#EF5350` | `#ef4444`  | `#e62020`               |
| warning| `#FFC107` | `#f59e0b`  | (not mapped)            |

This will be fixed globally: the captain will create a shared `constants.ts` on `main` that all teams import from. For your Phase A standalone prototype, pick any colors you like -- they will be swapped to the shared palette when you integrate in Phase B.

**Action:** No action needed right now. Just know that the final hex values will come from a shared file.

### 2. Integration pattern -- React component, not `mount()`

Your PRD shows a `mount(container)` pattern. The platform uses React components
rendered inside TanStack Router routes -- not imperative mounting.

What you wrote:
```javascript
export function mount(container) { ... }
```

What it actually looks like:
```tsx
// src/features/dashboard/TechnicalDashboard.tsx
export function TechnicalDashboard() {
  const checkResults = useStore(s => s.checkResults);
  const elementResults = useStore(s => s.elementResults);
  // ... render cards, charts, table using Recharts
}
```

Your AI agent builds this directly. Tell it: "Create a TechnicalDashboard
React component using the feature module pattern from the IFCore skill."

### 3. Charting library: Recharts

Your PRD mentions donut chart and bar chart but does not specify which library.
Use [Recharts](https://recharts.org/) -- it is React-native, composable, and
matches the platform stack. Install it:

```bash
cd frontend && npm install recharts
```

**Action:** Your AI agent has the IFCore skill. Tell it: "I need to build a
dashboard with Recharts that reads checkResults and elementResults from the
Zustand store. Use the feature module pattern." It will generate the components.

---

## Your 1-Day Game Plan

You are building **directly into the platform** -- a React component reading
real data from the Zustand store. Your AI coding agent handles React and
TypeScript. You focus on what the dashboard should show.

### Morning: Dashboard Component + Summary Cards (2.5 hours)

1. Create `src/features/dashboard/TechnicalDashboard.tsx`
2. Read `checkResults` and `elementResults` from `useStore()`
3. Build the summary cards row: Total, Pass, Fail, Warning, Blocked, Pass Rate %
4. Create `src/routes/dashboard.tsx` with `createFileRoute("/dashboard")`
5. Add a "Dashboard" link to the Navbar
6. Apply your dark theme CSS (Air Black `#111111` background -- great choice)

### Afternoon: Charts + Table (2.5 hours)

7. Add the donut chart (status breakdown) using Recharts `<PieChart>` / `<Pie>`
8. Add the bar chart (actual vs required) using Recharts `<BarChart>` / `<Bar>`
9. Add the scrollable element table with alternating row colors
10. Add a dropdown or tab bar to switch between checks (simulates Team D's sidebar click)
11. Handle edge cases: zero elements, all blocked, error status

### Polish (1 hour)

12. Number animations on summary cards (count up from 0)
13. Color the pass rate: green >80%, amber 50-80%, red <50%
14. "No data" empty state: "Select a check to view results"
15. Push to your feature branch

### What "done" looks like

Navigate to `/dashboard` in the platform. See summary cards with real data
from all 5 teams. Click "wall thickness" -- see 113 elements, 0% pass rate,
a red donut chart, and a scrollable table. Switch to "beam depth" -- 8
elements, 100% pass rate, green donut. Switch to a Team D error check -- see
a clean error state. That is your demo -- with **real data**, not mocks.

---

## How You Work with Team D

You and Team D are two halves of the same user flow:

| | Team D (Category Cards) | Team E (Dashboard) |
|---|---|---|
| **Location** | Left sidebar | Bottom panel |
| **Responsibility** | Show categories, let user click to select | Visualize the selected check's results |
| **Store writes** | Writes `selectedCategory`, `selectedCheckId` | None -- read only |
| **Store reads** | `checkResults` (to show status badges) | `checkResults`, `elementResults`, `selectedCategory`, `selectedCheckId` |

**The interaction:** User clicks "Structure" in Team D's sidebar. Team D writes `selectedCategory = "Structure"` to the store. Your dashboard reads that and shows the category overview (11 tools, 7 passing, 3 failing). User clicks "wall thickness" -- Team D writes `selectedCheckId`. Your dashboard reacts and renders the full tool detail view.

You are the visualizer. They are the navigator. Neither works without the other, but you can build and demo independently using your dropdown as a stand-in for Team D's sidebar.

---

## Quick Wins

Things you can do in 30 minutes that make a big difference:

- **Add a favicon and title** -- `<title>IFCore Dashboard</title>` and a simple colored square favicon. Small detail, big polish.
- **Add number animations** -- when switching tools, have the summary card numbers count up from 0. Chart.js has built-in animation. It makes demos look professional.
- **Add a "no data" empty state** -- a centered message saying "Select a check to view results" when nothing is selected. Prevents a blank panel.
- **Color the pass rate percentage** -- green above 80%, amber 50-80%, red below 50%. Instant visual feedback.
- **Test with Team D's error cases** -- your PRD already documents that several Team D tools return errors. Make sure your error state looks clean, not broken.

---

## Summary

This is the strongest PRD across all five teams. Your data contract documentation alone would be impressive in a professional setting -- you ran every team's real output and planned for it. The prototype-first strategy is exactly right. The scope is realistic for one day.

Build your standalone HTML prototype today. Make it look sharp. When the captain sets up the shared state infrastructure, plugging your dashboard into the platform will be straightforward -- your data contracts already match the platform schema perfectly.
