import type { StateCreator } from "zustand";
import type { Job } from "../../lib/types";
import type { AppStore } from "../types";

export type JobsSlice = {
  jobs: Record<string, Job>;
  activeJobId: string | null;
  trackJob: (job: Job) => void;
  updateJob: (id: string, data: Partial<Job>) => void;
  setActiveJob: (id: string | null) => void;
};

export const createJobsSlice: StateCreator<AppStore, [], [], JobsSlice> = (set) => ({
  jobs: {},
  activeJobId: null,
  trackJob: (job) => set((s) => ({ jobs: { ...s.jobs, [job.id]: job }, activeJobId: job.id })),
  updateJob: (id, data) => set((s) => ({
    jobs: { ...s.jobs, [id]: { ...s.jobs[id], ...data } },
  })),
  setActiveJob: (id) => set({ activeJobId: id }),
});
