import type { StateCreator } from "zustand";
import type { CheckResult, ElementResult } from "../../lib/types";
import type { AppStore } from "../types";

export type ChecksSlice = {
  checkResults: CheckResult[];
  elementResults: ElementResult[];
  setCheckResults: (results: CheckResult[]) => void;
  setElementResults: (results: ElementResult[]) => void;
};

export const createChecksSlice: StateCreator<AppStore, [], [], ChecksSlice> = (set) => ({
  checkResults: [],
  elementResults: [],
  setCheckResults: (results) => set({ checkResults: results }),
  setElementResults: (results) => set({ elementResults: results }),
});
