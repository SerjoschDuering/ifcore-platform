import type { StateCreator } from "zustand";
import type { AppStore } from "../types";

export type FilterSlice = {
  selectedCategory: string | null;
  selectedCheckId: string | null;
  setSelectedCategory: (category: string | null) => void;
  setSelectedCheckId: (checkId: string | null) => void;
};

export const createFilterSlice: StateCreator<AppStore, [], [], FilterSlice> = (set) => ({
  selectedCategory: null,
  selectedCheckId: null,
  setSelectedCategory: (category) => set({ selectedCategory: category, selectedCheckId: null }),
  setSelectedCheckId: (checkId) => set({ selectedCheckId: checkId }),
});
