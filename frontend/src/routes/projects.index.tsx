import { createFileRoute, Link } from "@tanstack/react-router";
import { UploadForm } from "../features/upload/UploadForm";
import { useStore } from "../stores/store";
import { getProjects } from "../lib/api";
import { stopPolling } from "../lib/poller";
import { StatusBadge } from "../components/StatusBadge";

export const Route = createFileRoute("/projects/")({
  loader: async () => {
    stopPolling();
    useStore.getState().setViewerVisible(false);
    useStore.getState().setActiveProject(null);
    const projects = await getProjects();
    useStore.getState().setProjects(projects);
    return projects;
  },
  component: () => {
    const projects = useStore((s) => s.projects);
    return (
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Projects</h1>
        <UploadForm />
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {projects.map((p) => (
            <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <strong>{p.name}</strong>
              <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                {new Date(p.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  },
});
