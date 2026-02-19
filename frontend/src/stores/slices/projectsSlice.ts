import type { StateCreator } from "zustand";
import type { Project } from "../../lib/types";
import type { AppStore } from "../types";

export type ProjectsSlice = {
  projects: Project[];
  activeProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
};

export const createProjectsSlice: StateCreator<AppStore, [], [], ProjectsSlice> = (set) => ({
  projects: [],
  activeProjectId: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (id) => set({ activeProjectId: id }),
});
