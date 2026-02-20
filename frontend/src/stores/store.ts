import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createProjectsSlice } from "./slices/projectsSlice";
import { createChecksSlice } from "./slices/checksSlice";
import { createJobsSlice } from "./slices/jobsSlice";
import { createViewerSlice } from "./slices/viewerSlice";
import { createFilterSlice } from "./slices/filterSlice";
import type { AppStore } from "./types";

export type { AppStore };

export const useStore = create<AppStore>()(
  devtools((...a) => ({
    ...createProjectsSlice(...a),
    ...createChecksSlice(...a),
    ...createJobsSlice(...a),
    ...createViewerSlice(...a),
    ...createFilterSlice(...a),
  }))
);
