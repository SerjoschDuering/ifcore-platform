import type { StateCreator } from "zustand";
import type { AppStore } from "../types";

export type ViewerSlice = {
  ifcUrl: string | null;
  setIfcUrl: (url: string | null) => void;

  viewerVisible: boolean;
  setViewerVisible: (v: boolean) => void;

  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  selectedIds: Set<string>;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;

  colorMap: Record<string, string>;
  setColorMap: (map: Record<string, string>) => void;

  highlightColorMap: Record<string, string>;
  setHighlightColorMap: (map: Record<string, string>) => void;
  clearHighlights: () => void;

  hiddenIds: Set<string>;
  hideElements: (ids: string[]) => void;
  showElements: (ids: string[]) => void;
  showAll: () => void;

  isReady: boolean;
  setReady: (ready: boolean) => void;
};

export const createViewerSlice: StateCreator<AppStore, [], [], ViewerSlice> = (set) => ({
  ifcUrl: null,
  setIfcUrl: (url) => set({ ifcUrl: url }),

  viewerVisible: false,
  setViewerVisible: (v) => set({ viewerVisible: v }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  selectedIds: new Set(),
  selectElements: (ids) => set((s) => {
    if (ids.length === s.selectedIds.size && ids.every((id) => s.selectedIds.has(id))) return s;
    return { selectedIds: new Set(ids) };
  }),
  clearSelection: () => set((s) => (s.selectedIds.size === 0 ? s : { selectedIds: new Set() })),

  colorMap: {},
  setColorMap: (map) => set({ colorMap: map }),

  highlightColorMap: {},
  setHighlightColorMap: (map) => set({ highlightColorMap: map }),
  clearHighlights: () => set({ highlightColorMap: {} }),

  hiddenIds: new Set(),
  hideElements: (ids) => set((s) => {
    const next = new Set(s.hiddenIds);
    ids.forEach((id) => next.add(id));
    return { hiddenIds: next };
  }),
  showElements: (ids) => set((s) => {
    const next = new Set(s.hiddenIds);
    ids.forEach((id) => next.delete(id));
    return { hiddenIds: next };
  }),
  showAll: () => set((s) => (s.hiddenIds.size === 0 ? s : { hiddenIds: new Set() })),

  isReady: false,
  setReady: (ready) => set({ isReady: ready }),
});
