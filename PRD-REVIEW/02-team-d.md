# Team D — 3D Viewer Categories

**Branch:** `3dViewer/team-d-3dViewer` | **Verdict:** NEEDS CHANGES (scope cut + boundary fix)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Architecture Fit | 2/5 | Proposes editing platform-owned files — violates boundary rule |
| Scope Feasibility | 1/5 | 3-5 day estimate vs. ~6 hours available |
| Color Blending | 3/5 | RGB averaging produces muddy results with 3+ categories |
| Cross-Team Coordination | 2/5 | Doesn't mention Team E or Lux-AI overlap |

**Shared State:** Reads `checkResults`, `elementResults`, `selectedCategory`. Writes `setSelectedCategory`, `setSelectedCheckId`, `setHighlightColorMap`, `clearHighlights`.

---

Hey Team D! Thanks for putting together such a thorough PRD. You clearly thought
deeply about how category-based filtering should work, and the product thinking
is strong. Let's talk about what's great, what needs to change, and how to ship
this in the time we have left.

---

## What You Did Well

**1. The category concept is exactly what the platform needs.**
Grouping checks into Fire Safety, Habitability, Energy, Structure, and Lighting
is a real product insight. Without this, the results table is just a flat list
of 50+ rows. Your feature turns that into something architects can actually
navigate. This will be one of the most visible parts of the final demo.

**2. Your data flow diagram is spot on.**
The idea that category filtering is a *frontend-only* concern -- the backend
returns all results, the frontend decides what to show -- is the correct
architecture. You understood that and documented it clearly. That shows real
engineering judgment.

**3. The feasibility analysis was honest.**
You correctly identified that 80% of the viewer infrastructure already exists
(colorMap, highlight by GUID, hide/show/isolate). That saved you from proposing
to rebuild the viewer from scratch. Building on top of what exists is always
the right call.

---

## The Platform Boundary Rule

Here is the most important thing to understand before you start coding:

**Teams never edit platform-owned files directly.**

Your PRD proposes modifying these files:

| File | Owner | Why you cannot edit it |
|------|-------|-----------------------|
| `backend/orchestrator.py` | Platform (captains) | All teams' checks run through this. A bug here breaks everyone. |
| `frontend/src/stores/slices/checksSlice.ts` | Platform (captains) | Team E and Lux-AI also need changes here. Captain coordinates. |
| `frontend/src/features/viewer/useViewer.ts` | Platform (captains) | Core viewer hook -- shared across all features. |
| `frontend/src/features/viewer/BIMViewer.tsx` | Platform (captains) | The 3D renderer itself. Changes here risk breaking the viewer for everyone. |
| `frontend/src/features/checks/ResultsTable.tsx` | Platform (captains) | Other teams also extend the results table. |

**How it actually works:** You build NEW files inside your own feature module
(`frontend/src/features/categories/`). You import shared state from the store.
The captain creates shared utilities (like `constants.ts` and `filterSlice.ts`)
on main, and you import from those. If the platform needs a change to support
your feature, you ask the captain and they make it.

Think of it like an apartment building: you can renovate your unit however you
want, but you don't rewire the shared electrical panel yourself -- the building
manager does that.

---

## What Needs to Change

### 1. No backend changes -- CATEGORY_MAP belongs in the frontend

Your PRD adds a `CATEGORY_MAP` dictionary to `orchestrator.py`. This is
unnecessary. The mapping from check name to category is purely a display concern.
The backend does not need to know that `check_fire_rating` belongs to
"Fire Safety" -- it just runs the function and returns results.

**What to do instead:** The captain will create `frontend/src/lib/constants.ts`
with the `CATEGORY_MAP`, `CATEGORIES` array, and `getCategory()` helper.
You import and use it. Done.

### 2. Create your own feature module instead of editing existing files

Instead of modifying 5 platform files, create one new folder:

```
frontend/src/features/categories/
  CategoryCards.tsx          <-- your main UI component
  FilteredResultsTable.tsx   <-- wraps the existing ResultsTable with filtering
  useCategoryColors.ts       <-- hook that computes colorMap for the viewer
```

These files import from the shared store but never modify the store's source code.

### 3. Cut multi-category color blending

Your RGB-averaging algorithm is clever, but in practice blending 3+ colors
produces muddy browns that are hard to distinguish. With only 6 hours, this is
the wrong complexity to take on.

**Single-category highlighting is the MVP.** User clicks "Fire Safety" --
all fire-related failures light up in red, everything else goes gray. That is
clear, useful, and shippable in a day. Multi-category overlay can be a v2
feature if there is time.

### 4. Cut check-row isolation in the viewer

The feature where clicking a specific check row fades all other elements to
10% opacity is a nice idea, but it requires changes to `useViewer.ts` and
`BIMViewer.tsx` (platform files). Skip it for now. Category-level filtering
gives you 80% of the value with 20% of the effort.

---

## Your 1-Day Game Plan

The captain will push `constants.ts` and `filterSlice.ts` to main before you
start. You just import from them.

### Hour 1-2: CategoryCards.tsx

Build the 5 clickable category cards that show pass/fail counts.

```tsx
// features/categories/CategoryCards.tsx
import { useStore } from "../../stores/store";
import { CATEGORIES, getCategory } from "../../lib/constants";

export function CategoryCards() {
  const checkResults = useStore((s) => s.checkResults);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);

  // Group checkResults by category using getCategory(cr.team)
  // NOTE: use cr.team (not cr.check_name) — getCategory maps team → category
  // Count pass/fail per category
  // Render 5 cards, highlight the selected one
}
```

Each card shows: category name, icon, pass count / total, and a colored border.
Clicking a card calls `setSelectedCategory(cat)`. Clicking it again clears the
selection.

### Hour 3-4: FilteredResultsTable.tsx

Wrap the existing `ResultsTable` with category filtering:

```tsx
// features/categories/FilteredResultsTable.tsx
import { useStore } from "../../stores/store";
import { getCategory } from "../../lib/constants";
import { ResultsTable } from "../checks/ResultsTable";

export function FilteredResultsTable() {
  const checkResults = useStore((s) => s.checkResults);
  const selectedCategory = useStore((s) => s.selectedCategory);

  const filtered = selectedCategory
    ? checkResults.filter((r) => getCategory(r.team)?.id === selectedCategory)
    : checkResults;

  // NOTE: ResultsTable currently accepts NO props — it reads from the store
  // directly. You have two options:
  // (a) Ask captain to add an optional `overrideResults` prop to ResultsTable
  // (b) Build your own simple table that renders the filtered array
  // Option (b) is faster and avoids editing a platform file:
  return <ResultsTable />;  // for now, use the store directly
}
```

**Important:** The existing `ResultsTable` reads `checkResults` from the
store — it does not accept a `results` prop. If you need filtered display,
build your own lightweight `CategoryTable.tsx` that renders the `filtered`
array directly, or ask the captain to add an optional override prop to
`ResultsTable`. Option (b) is faster and avoids platform file changes.

### Hour 5: Viewer color update via useCategoryColors

Write a hook that computes highlight colors based on the selected category.

**Important:** Use `setHighlightColorMap`, NOT `setColorMap`. The base `colorMap`
is auto-generated by `useViewer.ts` and would immediately overwrite your changes.
The captain will add `highlightColorMap` to `viewerSlice` — highlights overlay
on top of base colors, so yours always win.

```tsx
// features/categories/useCategoryColors.ts
import { useEffect } from "react";
import { useStore } from "../../stores/store";
import { CATEGORIES, getCategory, statusToHex } from "../../lib/constants";

export function useCategoryColors() {
  const elementResults = useStore((s) => s.elementResults);
  const checkResults = useStore((s) => s.checkResults);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setHighlightColorMap = useStore((s) => s.setHighlightColorMap);
  const clearHighlights = useStore((s) => s.clearHighlights);

  useEffect(() => {
    if (!selectedCategory) {
      clearHighlights(); // deselect → remove all highlights
      return;
    }

    // Build check_result_id → CheckResult lookup
    // (ElementResult has NO check_name — must join via checkResults)
    const checkById = new Map(checkResults.map((cr) => [cr.id, cr]));

    const map: Record<string, string> = {};
    for (const el of elementResults) {
      if (!el.element_id) continue; // null guard — can't highlight without GlobalId
      const cr = checkById.get(el.check_result_id);
      if (!cr) continue;
      const cat = getCategory(cr.team); // getCategory maps team → category
      if (cat?.id === selectedCategory && el.check_status === "fail") {
        map[el.element_id] = cat.color;
      } else {
        map[el.element_id] = "#d0d3da"; // muted gray
      }
    }
    setHighlightColorMap(map);
  }, [elementResults, checkResults, selectedCategory]);
}
```

The viewer applies `{...colorMap, ...highlightColorMap}` — your highlights
always win over the auto-generated base colors. When the user deselects a
category, `clearHighlights()` removes the overlay and the base colors show.

### Hour 6: Polish and integration

- Add your `CategoryCards` component to the project detail page layout
- Style the cards (active state border, hover effect, pass/fail colors)
- Add a "Clear filter" button that calls `setSelectedCategory(null)`
- Test with the Duplex Apartment model (14 doors, 57 walls, 24 windows)
- Make sure deselecting a category restores the default "all failures" view

---

## What to Cut (and Why That's OK)

| Cut this | Why it's OK |
|----------|-------------|
| Multi-category overlay + color blending | Single-category is clearer and ships in a day. V2 if time allows. |
| Backend `orchestrator.py` changes | Category mapping is a frontend concern. No backend needed. |
| Check-row isolation in viewer | Requires editing platform files. Category filtering gives most of the value. |
| Performance testing with 1000+ elements | The Duplex model has ~120 elements. Not a concern today. |
| Success metrics tracking | Good for a real product. Not needed for a course demo. |
| Phase 5 polish (icons, animations, tooltips) | Nice-to-have. Focus on working functionality first. |

Cutting scope is not failure -- it is the most important engineering skill.
A polished, working category filter that you can demo is worth more than an
ambitious plan that is half-finished.

---

## How Your Feature Works with Team E

You may have noticed that Team E's dashboard PRD also talks about categories
and filtering. Here is how the two features complement each other:

| Aspect | Team D (you) | Team E (dashboard) |
|--------|-------------|-------------------|
| **What you build** | Category cards + filtered results + viewer highlighting | Charts, stats, summary dashboard |
| **User action** | Click a category card to filter the view | View aggregated compliance data |
| **Where it lives** | Project detail page (next to the 3D viewer) | Dashboard route (`/dashboard`) |
| **Shared state** | Reads/writes `selectedCategory` via `filterSlice` | Also reads `selectedCategory` to sync views |

You are not competing -- you are complementary. Team D selects the category,
Team E visualizes the details. The captain is creating shared `constants.ts`
and `filterSlice.ts` that both teams import from, so there are no merge
conflicts.

Think of it as: **you build the filter controls, they build the charts.**
When a user clicks "Fire Safety" on your cards, Team E's dashboard can
also react to that selection and show fire safety stats. That is the power
of shared state through Zustand.

---

## Quick Checklist Before You Start

- [ ] Pull latest `main` (captain will have pushed `constants.ts` and `filterSlice.ts`)
- [ ] Create your feature branch from main: `git checkout -b feature/team-d-categories`
- [ ] Create `frontend/src/features/categories/` folder
- [ ] Build `CategoryCards.tsx` first -- it is the core of your feature
- [ ] Build `FilteredResultsTable.tsx` -- straightforward filter wrapper
- [ ] Build `useCategoryColors.ts` -- connects your feature to the 3D viewer
- [ ] Wire it all into the project detail page
- [ ] Test with the demo model
- [ ] Open a PR to main when ready

Your category concept is exactly what the platform needs. Now let's ship it.
Good luck!
