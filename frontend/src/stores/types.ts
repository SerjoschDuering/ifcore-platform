import type { ProjectsSlice } from "./slices/projectsSlice";
import type { ChecksSlice } from "./slices/checksSlice";
import type { JobsSlice } from "./slices/jobsSlice";
import type { ViewerSlice } from "./slices/viewerSlice";

export type AppStore = ProjectsSlice & ChecksSlice & JobsSlice & ViewerSlice;
