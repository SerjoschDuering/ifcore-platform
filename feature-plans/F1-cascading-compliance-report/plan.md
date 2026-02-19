# F1: Cascading Compliance Report with IFC Viewer Highlighting

**Team:** lux-ai  
**Captain:** Michele Cobelli  
**Branch:** `team/lux-ai/feature-energy`

## Problem

After running checks, users see a flat table of results with no visual hierarchy.
There is no way to understand which regulation category a check belongs to, drill
into element-level detail, or click a result row and see the corresponding element
light up in the 3D model. Teams and reviewers need a structured, scannable report
that connects compliance data to the building geometry.

## Solution

A new `/report` route that presents check results as a **3-level cascading accordion**
(Category → Check → Element) with dashed tree-lines showing depth. Clicking an
element highlights it in the IFC viewer in a color matching its status; clicking a
check name highlights **all** elements for that check. The viewer panel becomes
visible automatically when any item is selected from the report.

---

## Cascade Structure

### Level 1 — Category Folders

Top-level containers that group checks by team. Each has a color-coded icon and an
aggregated status badge (worst-status-wins).

| Category            | Icon | Team (backend `team` value) |
|---------------------|------|-----------------------------|
| Habitability        | 🏠   | Mastodonte                  |
| Energy Consumption  | ⚡   | lux-ai                     |
| Fire Compliance     | 🔥   | team-d                     |
| Structure           | 🏗️   | structures                 |
| Lighting & Facade   | 💡   | team-e                     |

### Level 2 — Check Rows (inside an expanded Category)

Each row shows:
- Check name (human-readable, derived from `check_name` by stripping `check_` prefix)
- Right-aligned status badge: **PASS**, **FAIL**, **UNKNOWN**, **ERROR**
- Element summary: e.g. "5 elements (4 pass, 1 fail)"

Expected checks per category:

**📂 Habitability**
| Check Name           | Example Element Summary            |
|----------------------|------------------------------------|
| dwelling area        | 4 elements (4 pass)                |
| living area height   | 3 elements (3 pass)                |
| living room compliance | 1 element (1 pass)              |
| bedroom occupancy    | 1 element (1 pass)                 |
| service spaces min height | 1 element (1 pass)            |

**📂 Energy Consumption**
| Check Name           | Example Element Summary            |
|----------------------|------------------------------------|
| building areas       | 3 elements (2 pass, 1 blocked)     |
| leed score           | 1 element (1 pass)                 |
| location             | 1 element (1 pass)                 |
| roof geometry        | 5 elements (5 pass)                |
| solar production     | 5 elements (4 pass, 1 fail)        |

**📂 Fire Compliance**
| Check Name           | Example Element Summary            |
|----------------------|------------------------------------|
| fire rating          | 28 elements (28 pass)              |
| sector size compliance | ERROR status                     |
| special risk rooms   | ERROR status                       |

**📂 Structure**
| Check Name           | Example Element Summary            |
|----------------------|------------------------------------|
| beam depth           | 0 elements (PASS)                  |
| slab thickness       | 2 elements (1 pass, 1 fail)        |
| wall thickness       | 7 elements (3 pass, 4 fail)        |

**📂 Lighting & Facade**
| Check Name           | Example Element Summary            |
|----------------------|------------------------------------|
| wwr                  | 4 elements (4 pass)                |
| shading presence     | 4 elements (1 fail)                |
| room depth           | 3 elements (3 blocked)             |

### Level 3 — Element Rows (inside an expanded Check)

Each row shows:
- Element name (from `element_name_long` or `element_name` or `element_type`)
- Colored status dot + status badge
- Actual value / required value (or comment)
- **Clickable** — highlights the element in the IFC viewer

---

## UI Interaction Design

### Visual Hierarchy — Dashed Tree Lines

Use **dashed vertical lines** on the left edge to indicate cascade depth, similar to
a file-system tree view:

```
📂 Energy Consumption                          FAIL    5 checks
┊  ├─ building areas          3 elements       PASS    2 pass, 1 blocked
┊  │   ├─ IfcBuilding #1      1200 m² / —      PASS
┊  │   ├─ IfcBuilding #2       800 m² / —      PASS
┊  │   └─ IfcBuilding #3       — / —           BLOCKED
┊  ├─ leed score              1 element        PASS
┊  ├─ location                1 element        PASS
┊  ├─ roof geometry           5 elements       PASS
┊  └─ solar production        5 elements       FAIL    4 pass, 1 fail
┊      ├─ Roof Panel A        4.2 kW / 3 kW    PASS
┊      ├─ Roof Panel B        3.1 kW / 3 kW    PASS
┊      └─ Roof Panel C        1.8 kW / 3 kW    FAIL
```

Implementation:
- Level 2 rows: left border `2px dashed var(--border)` with `margin-left` offset
- Level 3 rows: deeper offset, continuation of the dashed line
- Use `::before` pseudo-elements or inline border styling for the vertical connector

### Status Indicators

Right-aligned at every level for quick scanning:

| Status    | Color               | CSS Variable      |
|-----------|---------------------|--------------------|
| PASS      | Green               | `var(--success)`   |
| FAIL      | Red                 | `var(--danger)`    |
| WARNING   | Amber               | `var(--warning)`   |
| BLOCKED   | Grey                | `var(--text-muted)`|
| ERROR     | Red                 | `var(--danger)`    |
| UNKNOWN   | Grey                | `var(--text-muted)`|
| LOG       | Blue                | `var(--accent)`    |

### Hover State

- Check rows: subtle `background: var(--surface-hover)` on hover + `cursor: pointer`
- Element rows: same hover treatment
- Visual affordance that the row is interactive (pointer cursor, slight brightness shift)

### Click → IFC Viewer Highlight

This is the core interaction that connects the report to the 3D model.

**Element click (Level 3):**
1. Read `element_id` (IFC GlobalId) from the `ElementResult`
2. Compute color from `check_status` → status-to-hex map
3. Call `useStore.getState().setColorMap({ [element_id]: hexColor })`
4. Call `useStore.getState().selectElements([element_id])`
5. Call `useStore.getState().setViewerVisible(true)` — viewer panel slides open
6. Viewer's `BIMViewer` component reacts via existing `useEffect` hooks

**Check click (Level 2):**
1. Collect all `element_id` values from that check's `ElementResult[]`
2. Build a `colorMap` keyed by each element's `check_status` color
3. Call `setColorMap(map)` + `selectElements(allIds)` + `setViewerVisible(true)`
4. All related elements light up in their respective status colors

**Status → Hex color mapping for viewer:**

| Status  | Hex       |
|---------|-----------|
| pass    | `#22c55e` |
| fail    | `#ef4444` |
| warning | `#f59e0b` |
| blocked | `#6b7280` |
| log     | `#3b82f6` |
| error   | `#ef4444` |

---

## Done When

- [ ] `/report` route renders the 3-level cascading accordion
- [ ] Dashed tree-lines show visual depth at Level 2 and Level 3
- [ ] Status badges (PASS/FAIL/ERROR/UNKNOWN/BLOCKED) are right-aligned at every level
- [ ] Level 1 shows aggregated element summary per category
- [ ] Level 2 shows element count summary per check (e.g. "5 elements (4 pass, 1 fail)")
- [ ] Level 2 check names match the expected list above (human-readable, no `check_` prefix)
- [ ] Hover state highlights rows with a subtle background shift
- [ ] Clicking an **element row** highlights that single element in the IFC viewer in its status color
- [ ] Clicking a **check name row** highlights all elements for that check in the viewer
- [ ] Viewer panel becomes visible (`setViewerVisible(true)`) on any click-to-highlight action
- [ ] Categories with no results show "No checks registered" placeholder
- [ ] Unmapped teams (not in the 5 categories) render with a generic 📦 icon
- [ ] Summary stat cards at top: Total Checks, Passed, Failed, Errors, Other
- [ ] PR reviewed and merged

## API Changes

| Layer | Change |
|-------|--------|
| HF Space endpoint | **None** — reads existing `check_results` + `element_results` |
| Worker route | **None** — uses existing `GET /api/checks/*` endpoints |
| D1 table | **None** — reads existing tables |
| Zustand slice | **Reads:** `checksSlice.checkResults`, `checksSlice.elementResults`. **Writes:** `viewerSlice.colorMap`, `viewerSlice.selectedIds`, `viewerSlice.viewerVisible` |
| React route | `src/routes/report.tsx` (already created, needs update) |

## Shared State

**Reads:**
- `store.checkResults` — array of `CheckResult` (one per `check_*` function run)
- `store.elementResults` — array of `ElementResult` (one per element per check)

**Writes:**
- `store.colorMap` — `Record<string, string>` mapping GlobalId → hex color (for viewer highlighting)
- `store.selectedIds` — `Set<string>` of currently selected GlobalIds
- `store.viewerVisible` — `boolean`, set to `true` when user clicks an element/check to highlight

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/features/report/TeamReportPanel.tsx` | **Update** | Add dashed tree-lines, hover states, click-to-highlight handlers, element count summaries |
| `frontend/src/routes/report.tsx` | **Update** | Wire viewer visibility on highlight, pass store actions to components |
| `frontend/src/components/Navbar.tsx` | **Existing** | Already has "Report" link |

## Dependencies

- **viewerSlice** must support `selectElements()`, `setColorMap()`, `setViewerVisible()` — all already exist
- `BIMViewer.tsx` must react to `colorMap` changes — already wired via `useViewer.ts`
- An IFC model must be loaded (i.e. user visited a project first) for viewer highlighting to work. If no model is loaded, the click still updates store state — highlighting applies when a model is eventually loaded.

## Open Questions

- Should clicking a Category (Level 1) highlight ALL elements across ALL its checks? (Currently: no — only Level 2 and Level 3 trigger highlights)
- Should the viewer camera auto-zoom to the selected element(s)? (Requires `controls.fitToSphere()` — not wired yet)
- Should there be a "Clear highlights" button to reset the viewer to neutral colors?
