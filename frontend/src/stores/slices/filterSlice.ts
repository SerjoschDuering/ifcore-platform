import type { StateCreator } from "zustand";
import type { AppStore } from "../types";

/**
 * Filter state for Team D's category feature
 * 
 * Manages which category is currently selected for filtering check results
 * and highlighting in the 3D viewer. Shared between CategoryCards, 
 * FilteredResultsTable, and useCategoryColors hook.
 */
export type FilterSlice = {
  // Currently selected category ID (e.g. "fire-safety", "energy")
  // null = show all results (no filter active)
  selectedCategory: string | null;
  
  // Set the active category filter
  setSelectedCategory: (categoryId: string | null) => void;
  
  // Highlight color overrides for the 3D viewer
  // Maps element GlobalId → hex color (e.g. {"2ZaB4N3HvBYPZ$hFYwl7Hm": "#ef4444"})
  // Applied on top of base colorMap — highlights always win
  highlightColorMap: Record<string, string>;
  
  // Update highlight colors (called by useCategoryColors hook)
  setHighlightColorMap: (map: Record<string, string>) => void;
  
  // Clear all highlights (restores default viewer colors)
  clearHighlights: () => void;
  
  // Currently selected check result ID (for future check-row isolation feature)
  // null = no specific check selected
  selectedCheckId: string | null;
  
  // Select a specific check result (highlights only its elements)
  setSelectedCheckId: (id: string | null) => void;
};

export const createFilterSlice: StateCreator<AppStore, [], [], FilterSlice> = (set) => ({
  selectedCategory: null,
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  
  highlightColorMap: {},
  setHighlightColorMap: (map) => set({ highlightColorMap: map }),
  
  clearHighlights: () => set({ highlightColorMap: {} }),
  
  selectedCheckId: null,
  setSelectedCheckId: (id) => set({ selectedCheckId: id }),
});
