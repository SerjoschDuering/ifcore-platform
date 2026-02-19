# Lux-AI — Cascading Compliance Report

**Branch:** `team/lux-ai/feature-energy` | **Verdict:** NEEDS CHANGES (colorMap fix + acknowledge existing code)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Architecture Fit | 4/5 | Correct Zustand reads/writes, feature module pattern |
| Scope Feasibility | 4/5 | Most of the UI already exists on main |
| Shared State | 2/5 | colorMap writes will be immediately overwritten by useViewer.ts |
| Existing Code | 2/5 | PRD doesn't acknowledge 70-80% is already built |
| Edge Cases | 4/5 | Good handling of empty, error, missing states |

**Shared State:** Reads `checkResults`, `elementResults`. Writes `highlightColorMap`, `selectedIds`, `viewerVisible`.

---

## What You Did Well

Your PRD is one of the most thorough we received. A few highlights:

- **Deep understanding of the data model.** You correctly traced the path from
  `checkResults` and `elementResults` in the Zustand store through to the
  3-level accordion. The cascade structure (Category -> Check -> Element) is
  exactly right.

- **Correct Zustand read/write pattern.** You identified the right slices to
  read from (`checksSlice`) and the right actions to call (`setColorMap`,
  `selectElements`, `setViewerVisible`). That shows you understood the
  frontend architecture skill.

- **Thorough edge cases.** Empty states, unmapped teams, missing element names,
  error-status checks with no elements -- you thought about all of these.

- **Clear visual spec.** The ASCII tree-line mockup makes it immediately obvious
  what the finished UI should look like. That kind of visual spec saves hours
  of back-and-forth.

---

## Great News: You're ~80% Done

Here is the key thing: **most of what your PRD describes already exists on
`main`.** This is not a problem -- it means you planned the right thing and
the captains already built the foundation. Your job now is much smaller than
the PRD suggests.

### What's already built on `main`

| Feature | File | Status |
|---------|------|--------|
| 3-level accordion (Category / Check / Element) | `TeamReportPanel.tsx` | Done |
| `CATEGORIES` constant (same 5 categories + icons) | `TeamReportPanel.tsx` → moving to `constants.ts` | Done |
| Summary stat cards (Total / Passed / Failed / Errors / Other) | `report.tsx` | Done |
| Status badges on every level | `StatusBadge.tsx` | Done |
| Empty state ("No checks registered") | `TeamReportPanel.tsx` | Done |
| Unmapped team fallback (generic icon) | `report.tsx` | Done |
| Element name fallback chain (`element_name_long` -> `element_name` -> `element_type`) | `TeamReportPanel.tsx` | Done |
| Chevron expand/collapse animation | `TeamReportPanel.tsx` | Done |
| Colored status dots per element | `TeamReportPanel.tsx` | Done |
| Check name formatting (strip `check_` prefix, underscores to spaces) | `TeamReportPanel.tsx` | Done |

### What's actually new (your real work)

| New feature | Effort estimate |
|-------------|-----------------|
| Dashed tree-lines CSS (`::before` pseudo-elements on Level 2/3) | 1-2 hours |
| Hover states (subtle background + pointer cursor on rows) | 30 min |
| Click element row -> highlight in viewer | 1-2 hours |
| Click check row -> highlight ALL its elements | 1 hour |
| Element count summaries per check ("5 elements: 4 pass, 1 fail") | 1 hour |
| `setViewerVisible(true)` on any highlight click | One line |

**Total real work: about 5-6 hours.** Very doable in one day.

> **Action item:** Update your PRD's "Files Changed" section to say you are
> *extending* `TeamReportPanel.tsx`, not building from scratch. Acknowledge
> the existing code and describe only the delta.

---

## The One Blocking Issue: colorMap

This is the most important thing to understand before you start coding.

### The problem

Your PRD says: on element click, call `setColorMap({ [element_id]: hexColor })`.
That will not work. Here is why.

There is a hook called `useViewer.ts` that runs automatically whenever
`elementResults` changes:

```typescript
// frontend/src/features/viewer/useViewer.ts (on main today)
useEffect(() => {
  const map: Record<string, string> = {};
  for (const er of elementResults) {
    if (!er.element_id) continue;
    map[er.element_id] = er.check_status === "fail" ? "#e62020" : "#d0d3da";
  }
  setColorMap(map);
}, [elementResults, setColorMap]);
```

This effect rebuilds the **entire** `colorMap` from all element results on
every render cycle. If you call `setColorMap({ "some-guid": "#22c55e" })`,
it will be immediately overwritten by this effect with the full map. Your
single highlight disappears before the user ever sees it.

### The fix: `highlightColorMap`

The captain will add a **second** color map to `viewerSlice`:

```typescript
// viewerSlice.ts — captain adds this on main
highlightColorMap: Record<string, string>;
setHighlightColorMap: (map: Record<string, string>) => void;
clearHighlights: () => void;
```

The `BIMViewer` component will then apply colors as:
`{ ...colorMap, ...highlightColorMap }` -- highlights always win over base
colors.

**Your code writes to `highlightColorMap`, never to `colorMap`.**

This is a captain task. You do not need to make this change yourself -- but
you do need to wait for it before the click-to-highlight feature works.
Everything else (CSS, hover states, element counts) can proceed right now.

### What your click handler should look like (after the fix)

```typescript
// Element row click
// Import statusToHex from the captain's shared constants:
// import { statusToHex } from "../../lib/constants";
const { setHighlightColorMap, selectElements, setViewerVisible } =
  useStore.getState();

function onElementClick(el: ElementResult) {
  if (!el.element_id) return;  // can't highlight without GlobalId
  setHighlightColorMap({ [el.element_id]: statusToHex(el.check_status) });
  selectElements([el.element_id]);
  setViewerVisible(true);
}

// Check row click — highlight all elements for this check
function onCheckClick(elements: ElementResult[]) {
  const map: Record<string, string> = {};
  const ids: string[] = [];
  for (const el of elements) {
    if (!el.element_id) continue;
    map[el.element_id] = statusToHex(el.check_status);
    ids.push(el.element_id);
  }
  if (ids.length === 0) return;
  setHighlightColorMap(map);
  selectElements(ids);
  setViewerVisible(true);
}
```

---

## Your 1-Day Game Plan

Focus only on the delta. Work in this order so each step builds on the last.

### Step 1: CSS tree-lines (1.5 hours)

Add dashed vertical connector lines to Level 2 and Level 3 rows using
`::before` pseudo-elements. This is purely visual -- no logic changes.

- Level 2 rows: add a left border or `::before` with `border-left: 2px dashed var(--border)`
- Level 3 rows: deeper indent, continuation of the dashed line
- Match the ASCII mockup from your PRD

**Tip:** Inline styles cannot use `::before`. You will need a small CSS class
in `globals.css` or a `<style>` tag in the component.

### Step 2: Hover states (30 min)

Add hover feedback to check rows (Level 2) and element rows (Level 3):

- `background: var(--surface-hover)` on hover
- `cursor: pointer` on clickable rows
- Subtle transition: `transition: background 120ms ease`

Again, this requires a CSS class -- inline styles do not support `:hover`.

### Step 3: Element count summaries (1 hour)

In `CheckRow`, compute a summary string from the elements array:

```typescript
const passCount = elements.filter(e => e.check_status === "pass").length;
const failCount = elements.filter(e => e.check_status === "fail").length;
// → "5 elements (4 pass, 1 fail)"
```

Display this next to or instead of the raw `check.summary` string.

### Step 4: Click-to-highlight (2 hours)

**Wait for the captain to land `highlightColorMap` on main.** Then:

- Add `onClick` to `ElementRow` -> calls `onElementClick(el)`
- Add `onClick` to `CheckRow` header -> calls `onCheckClick(elements)`
- Skip elements where `element_id` is null (can't highlight without a GlobalId)
- Call `setViewerVisible(true)` so the viewer panel appears

### Step 5: Test and polish (30 min)

- Test with real data from all 5 teams (not just your own)
- Verify error-status checks don't crash (they have no elements to highlight)
- Verify store updates are safe when no model is loaded yet
- Call `clearHighlights()` when the user collapses an accordion section or
  navigates away from the report page (prevents stale highlights persisting)

---

## Small Fixes

### 1. Use shared status colors

Your PRD defines its own hex colors (`#22c55e` for pass, `#ef4444` for fail).
Other teams defined different values. The existing code in `useViewer.ts` uses
yet another set (`#d0d3da` for pass, `#e62020` for fail).

The captain will provide a shared `STATUS_COLORS` constant in
`frontend/src/lib/constants.ts`. Import from there instead of hardcoding:

```typescript
import { STATUS_COLORS } from "../../lib/constants";
// STATUS_COLORS.pass, STATUS_COLORS.fail, etc.
```

This way all teams render consistent colors across the dashboard, report,
and 3D viewer.

### 2. Category mapping — import from `constants.ts`, not `TeamReportPanel.tsx`

Your PRD maps `team` string to category label (e.g., `"lux-ai"` ->
`"Energy Consumption"`). This works today because the `CATEGORIES` array in
`TeamReportPanel.tsx` already does exactly this.

**Important:** The captain is moving `CATEGORIES` from `TeamReportPanel.tsx` to
`frontend/src/lib/constants.ts` (shared with Teams D and E). After pulling
main, import from there:
```typescript
import { CATEGORIES, getCategory, statusToHex } from "../../lib/constants";
```

Be aware: if a team renames their repo or folder, the mapping breaks silently.
A more robust approach (for later) would be to read a `category` field from
`check_results` or use a `CATEGORY_MAP` keyed by `check_name`. For now, the
existing approach is fine -- just know that it is fragile.

---

## Summary

You planned something great, and most of it already exists. That is a
compliment to your design instincts -- you described exactly the right
feature. Now focus on the finishing touches: the visual polish (tree-lines,
hover states), the interaction layer (click-to-highlight), and the data
enrichment (element counts). One solid day of work and this feature ships.

**Your dependencies:**

| What | Who | Status |
|------|-----|--------|
| `highlightColorMap` in viewerSlice | Captain | Pending -- needed before Step 4 |
| `STATUS_COLORS` in constants.ts | Captain | Pending -- nice to have |
| Steps 1-3 (CSS, hover, counts) | You | Can start immediately |

Good luck -- you are closer to done than you think.
