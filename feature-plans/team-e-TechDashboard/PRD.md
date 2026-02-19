# F1: IFCore Technical Dashboard

**Team:** LlumAI (team-e)
**Feature:** Technical Dashboard — bottom panel of the IFCore platform UI
**Branch:** `feature/team-e-TechDashboard`
**Date:** 2026-02-19

---

## What Are We Building?

A **technical dashboard panel** that sits at the bottom of the IFCore platform UI
(below the 3D viewer). The dashboard displays compliance results for **all teams'
check functions** — not just our own. When a user selects any category from the
left sidebar and clicks a specific tool, the dashboard renders that tool's results
with four visualization types: summary cards, a donut chart, a bar chart, and a
per-element results table.

The dashboard is **team-agnostic**: it reads `element_results` data from the shared
store and can visualize any `check_*` function output from any team, as long as it
follows the IFCore contract.

## User Journey

1. User uploads an IFC file (handled by the Upload module — not us).
2. Platform orchestrator runs all `check_*` functions from all 5 teams (backend — not us).
3. User clicks a **category** in the left sidebar (e.g. "Habitability", "Structure", "Lighting Facade").
4. The category expands to show its tools with pass/fail status badges.
5. User clicks a **specific tool** (e.g. "wall thickness", "daylight glazing ratio").
6. The bottom dashboard panel renders the results for that tool:
   - **Summary cards** — total elements, pass count, fail count, warning count, blocked count, pass rate %
   - **Donut chart** — visual breakdown of pass / fail / warning / blocked / log
   - **Bar chart** — actual vs required values per element (where numeric data is available)
   - **Element table** — scrollable list of every element result row with all fields

## What Does "Done" Look Like?

- [ ] Standalone HTML prototype works in browser with mock data from all teams
- [ ] Dashboard renders all 4 visualization types (cards, donut, bar, table)
- [ ] User can switch between tools — works for any team's check output
- [ ] Color palette matches the team brand (see Design section)
- [ ] Data format matches `element_results` contract (9 fields per row)
- [ ] Dashboard handles edge cases: 0 elements, all blocked, error status
- [ ] Dashboard is responsive — works at different widths in the bottom panel
- [ ] PRD.md and working prototype pushed to `feature/team-e-TechDashboard` branch

## Scope — What We Own vs. Don't Own

| We own (bottom dashboard panel) | We do NOT own |
|---|---|
| Summary cards (pass/fail/warning/blocked counts) | 3D Viewer |
| Donut chart (status breakdown) | Left sidebar category navigation |
| Bar chart (actual vs required per element) | File upload module |
| Scrollable element results table | Backend orchestrator |
| Internal tool selector (for prototype only) | Other teams' checker code |
| Error/empty state handling | Platform deployment |

## All Teams & Tools

The dashboard must handle results from all 5 teams across 5 categories.

### Habitability — Mastodonte (5 tools)

| Tool | Typical Output |
|---|---|
| dwelling area | 21 elements: 21 pass |
| living area height | 0 elements |
| living room compliance | 2 elements: 2 pass |
| bedroom occupancy | 4 elements: 4 pass |
| service spaces min height | 8 elements: 8 pass |

### Energy Consumption — lux-ai (5 tools)

| Tool | Typical Output |
|---|---|
| building areas | 3 elements: 2 pass, 1 blocked |
| leed score | 1 element: 1 fail |
| location | 1 element: 1 pass |
| roof geometry | 1 element: 1 pass |
| solar production | 1 element: 1 pass |

### Structure — structures (11 tools)

| Tool | Typical Output |
|---|---|
| beam depth | 8 elements: 8 pass |
| beam width | 8 elements: 8 pass |
| column min dimension | 0 elements |
| bearing beam section | 1 element: 1 blocked |
| floor capacity | 7 elements: 7 pass |
| foundation dimensions | 7 elements: 7 pass |
| foundation slab thickness | 7 elements: 7 pass |
| slab thickness | 21 elements: 20 fail, 1 blocked |
| wall external uvalue | 113 elements: 68 pass, 45 fail |
| wall thickness | 113 elements: 113 fail |
| wall uvalue | 113 elements: 113 blocked |

### Fire Compliance — team-d (7 tools)

| Tool | Typical Output |
|---|---|
| fire rating | 106 elements: 102 pass, 4 fail |
| sector size compliance | error (contract issue) |
| special risk boundary doors | error (contract issue) |
| special risk rooms | error (contract issue) |
| si6 compliance | error (contract issue) |
| sector size compliance (v2) | error (contract issue) |
| special risk rooms (v2) | error (contract issue) |

### Lighting Facade — team-e / LlumAI (5 tools)

| Tool | Typical Output |
|---|---|
| daylight glazing ratio | 21 elements: 6 pass, 2 fail, 13 blocked |
| room depth | 13 elements: 2 pass, 6 fail, 5 blocked |
| shading presence | 24 elements: 5 fail, 19 log |
| shgc | 24 elements: 24 warning |
| wwr | 4 elements: 4 pass |

### Demo (1 tool)

| Tool | Typical Output |
|---|---|
| door count | 14 elements: 14 pass |

## Data Contract

The dashboard consumes `list[dict]` from the shared Zustand store. Each dict
follows the `element_results` schema (IFCore contract):

```
element_id        : string | null   — IFC GlobalId
element_type      : string | null   — e.g. "IfcSpace", "IfcWindow", "Facade"
element_name      : string | null   — short name
element_name_long : string | null   — detailed name with context
check_status      : string          — "pass" | "fail" | "warning" | "blocked" | "log"
actual_value      : string | null   — what was found
required_value    : string | null   — what the regulation requires
comment           : string | null   — explanation
log               : string | null   — debug info
```

The dashboard also reads from `check_results` for the tool-level summary:

```
check_name  : string   — e.g. "check_door_width"
team        : string   — e.g. "team-e", "structures", "Mastodonte"
status      : string   — "pass" | "fail" | "warning" | "unknown" | "error"
summary     : string   — e.g. "21 elements: 6 pass, 2 fail, 13 blocked"
has_elements: integer  — 0 or 1
```

### Edge Cases the Dashboard Must Handle

| Case | Dashboard Behavior |
|---|---|
| 0 elements returned | Show "No elements" message, empty charts |
| All blocked | Donut shows 100% blocked, cards reflect it |
| Error status (team-d) | Show error message from summary, no charts |
| Only "log" status rows | Donut shows log segment, table shows all rows |
| Very large result set (113+ elements) | Table scrolls, charts aggregate properly |
| Missing actual_value or required_value | Bar chart skips that element, table shows "—" |

## Design

### Color Palette

| Name | Hex | Usage |
|---|---|---|
| Air Black | `#111111` | Dashboard background |
| Black Olive | `#3A3A3A` | Card backgrounds, table rows (alternating) |
| Dark Liver | `#4D4D4D` | Borders, dividers, hover states |
| Gray (X11) | `#B7BABB` | Secondary text, labels |
| Pastel Blue | `#B4C7CC` | Primary accent, headings, active tab highlight |

### Status Colors

| Status | Color | Hex |
|---|---|---|
| Pass | Green | `#4CAF50` |
| Fail | Red | `#EF5350` |
| Warning | Amber | `#FFC107` |
| Blocked | Gray | `#78909C` |
| Log | Muted blue | `#607D8B` |
| Error | Dark red | `#C62828` |

### Layout (from UI_Panels.png)

```
┌──────────────────────────────────────────────────────────┐
│  Left Panel           │       3D Viewer                  │
│                       │                                  │
│  [Fire Compliance]    │                                  │
│  [Habitability]       │                                  │
│  [Energy Consumption] ├──────────────────────────────────┤
│  [Structure]          │                                  │
│  [Lighting Facade]    │   TECHNICAL DASHBOARD (ours)     │
│    > Daylight         │                                  │
│    > Room Depth       │                                  │
│    > ...              │                                  │
└───────────────────────┴──────────────────────────────────┘
```

### Dashboard Internal Layout

When a tool is selected, the bottom panel shows:

```
┌──────────────────────────────────────────────────────────┐
│ Tool: "wall thickness"  Team: structures   Status: FAIL  │  header
├──────────┬───────────┬───────────┬──────────┬────────────┤
│ Total    │ Pass      │ Fail      │ Warning  │ Pass Rate  │  summary
│ 113      │ 0         │ 113       │ 0        │ 0%         │  cards
├──────────┴───────────┴───────────┴──────────┴────────────┤
│  ┌─────────────┐  ┌──────────────────────────────────┐   │
│  │  Donut Chart │  │  Bar Chart (actual vs required)  │   │  charts
│  │  (status %)  │  │                                  │   │
│  └─────────────┘  └──────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ Element | Type | Status | Actual | Required | Comment    │  table
│ ...     | ...  | ...    | ...    | ...      | ...        │  (scroll)
└──────────────────────────────────────────────────────────┘
```

When **no tool is selected** (category level), show an overview:

```
┌──────────────────────────────────────────────────────────┐
│ Category: "Structure"  (11 tools)                        │  header
├──────────┬──────────┬──────────┬─────────────────────────┤
│ Passing  │ Failing  │ Errors   │ Overall compliance      │  summary
│ 7        │ 3        │ 0        │ 63.6%                   │  cards
├──────────────────────────────────────────────────────────┤
│ Tool Name          │ Status │ Summary                    │
│ beam depth         │ pass   │ 8 elements: 8 pass         │  tool
│ slab thickness     │ fail   │ 21 elements: 20 fail, 1... │  list
│ wall thickness     │ fail   │ 113 elements: 113 fail     │
│ ...                │ ...    │ ...                        │
└──────────────────────────────────────────────────────────┘
```

## How It Works (Platform Integration)

**Prototype phase (now):** Standalone `index.html` with mock data baked in
from real checker outputs against `01_Duplex_Apartment.ifc` (all teams).
Opens in any browser, no server needed.

**Integration phase (later):** Convert to a `mount(container)` module at
`src/modules/dashboard/index.js`. Subscribe to the Zustand store, read
results per selected check, and render the same visualizations. Follow the
frontend architecture module pattern from the IFCore skill.

```javascript
// Future integration sketch
export function mount(container) {
  function render() {
    const { selectedCheck, selectedCategory } = useStore.getState();
    if (selectedCheck) {
      // Render tool-level view: cards, donut, bar, table
      const elements = useStore.getState().getElementResults(selectedCheck.id);
      renderToolDashboard(container, selectedCheck, elements);
    } else if (selectedCategory) {
      // Render category-level overview: tool list with status badges
      const checks = useStore.getState().getChecksByCategory(selectedCategory);
      renderCategoryOverview(container, selectedCategory, checks);
    }
  }
  render();
  useStore.subscribe(render);
}
```

## Phases

- **Phase A (this sprint):** PRD + standalone HTML prototype with mock data from all teams.
  Push to `feature/team-e-TechDashboard` for review.
- **Phase B (next sprint):** Integrate into platform frontend as a proper module.
  Connect to live Zustand store, replace mock data with real API responses.

## Inputs / Outputs

| Input | Output |
|---|---|
| User clicks a category in left panel | Dashboard shows category overview (tool list with statuses) |
| User clicks a specific tool | Dashboard renders that tool's full results |
| `check_results` from store | Category overview cards + tool list |
| `element_results` from store | Summary cards, donut chart, bar chart, element table |
| Tool with error status | Error message displayed, charts hidden |
| Tool with 0 elements | "No elements" empty state |
