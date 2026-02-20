import { createFileRoute, Link } from "@tanstack/react-router";
import { UploadForm } from "../features/upload/UploadForm";
import { useStore } from "../stores/store";
import { getProjects } from "../lib/api";
import { stopPolling } from "../lib/poller";
import { useSession } from "../lib/auth-client";

const DEMO_NAMES = ["01_Duplex_Apartment", "Ifc4_SampleHouse"];

export const Route = createFileRoute("/projects/")({
  loader: async () => {
    stopPolling();
    useStore.getState().setViewerVisible(false);
    useStore.getState().setActiveProject(null);
    const projects = await getProjects();
    useStore.getState().setProjects(projects);
    return projects;
  },
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const sessionQuery = useSession();
  const user = (sessionQuery as any)?.data?.user;

  // Pick 2 demo models for non-logged-in view
  const demoProjects = DEMO_NAMES
    .map((n) => projects.find((p) => p.name === n))
    .filter(Boolean);
  // Fallback: first 2 if named ones not found
  const featured = demoProjects.length >= 2 ? demoProjects : projects.slice(0, 2);

  if (!user) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Demo badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "linear-gradient(135deg, rgba(79,141,255,0.15), rgba(40,205,255,0.1))",
          border: "1px solid rgba(79,141,255,0.3)",
          borderRadius: 999,
          padding: "0.4rem 1rem",
          marginBottom: "1.5rem",
          fontSize: "0.78rem",
          color: "var(--accent)",
          fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: "fadeIn 1.5s ease-in-out infinite alternate" }} />
          Demo Mode
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            — <Link to="/login" style={{ color: "var(--accent)" }}>Log in</Link> for full features
          </span>
        </div>

        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}>IFCore Platform</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          AI-powered building compliance checker. Upload IFC models, run automated regulation checks,
          and explore results in 3D.
        </p>

        <h2 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          Try a demo model
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
          {featured.map((p) => p && (
            <Link
              key={p.id}
              to="/projects/$id"
              params={{ id: p.id }}
              className="card category-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                textDecoration: "none",
                color: "inherit",
                padding: "1.25rem",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>
                {p.name.includes("Duplex") ? "\u{1F3E2}" : "\u{1F3E0}"}
              </div>
              <strong style={{ fontSize: "0.95rem" }}>{p.name.replace(/_/g, " ")}</strong>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                Click to view in 3D + run checks
              </span>
            </Link>
          ))}
        </div>

        {projects.length > 2 && (
          <>
            <h2 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
              All projects
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {projects.filter((p) => !featured.includes(p)).map((p) => (
                <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="card" style={{ display: "block", textDecoration: "none", color: "inherit", padding: "0.75rem 1rem" }}>
                  <strong>{p.name.replace(/_/g, " ")}</strong>
                  <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Logged-in view — full project list + upload
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
}
