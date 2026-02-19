import { createFileRoute } from "@tanstack/react-router";
import { ResultsTable } from "../features/checks/ResultsTable";
import { CheckRunner } from "../features/checks/CheckRunner";
import { useStore } from "../stores/store";
import { getProject, getJob } from "../lib/api";
import type { Job } from "../lib/types";

export const Route = createFileRoute("/projects/$id")({
  loader: async ({ params }) => {
    const store = useStore.getState();

    // Clear stale results from previous project
    store.setCheckResults([]);
    store.setElementResults([]);
    store.setActiveJob(null);
    store.showAll(); // clear hidden elements from previous project

    // Set active project for viewer
    store.setActiveProjectId(params.id);

    const data = await getProject(params.id);
    const { projects, setProjects } = useStore.getState();
    const idx = projects.findIndex((p) => p.id === data.id);
    if (idx >= 0) {
      setProjects(projects.map((p, i) => (i === idx ? { ...p, ...data } : p)));
    } else {
      setProjects([...projects, data]);
    }

    // Set IFC URL and show the viewer
    if (data.file_url) {
      const ifcUrl = data.file_url.startsWith("r2://")
        ? `/api/files/${data.file_url.replace("r2://", "")}`
        : data.file_url;
      useStore.getState().setIfcUrl(ifcUrl);
      useStore.getState().setViewerVisible(true);
    } else {
      useStore.getState().setIfcUrl(null);
      useStore.getState().setViewerVisible(false);
    }

    // Hydrate results for completed jobs
    const lastDone = data.jobs?.find((j: Job) => j.status === "done");
    if (lastDone) {
      const fullJob = await getJob(lastDone.id);
      if (fullJob.check_results) useStore.getState().setCheckResults(fullJob.check_results);
      if (fullJob.element_results) useStore.getState().setElementResults(fullJob.element_results);
      useStore.getState().trackJob({ ...lastDone, ...fullJob });
    }

    return data;
  },
  component: () => {
    const { id } = Route.useParams();
    const data = Route.useLoaderData();
    const project = useStore((s) => s.projects.find((p) => p.id === id)) ?? data;
    return (
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{project?.name || "Project"}</h1>
        <CheckRunner projectId={id} fileUrl={project?.file_url || ""} />
        <ResultsTable />
      </div>
    );
  },
});
