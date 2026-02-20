import { Link } from "@tanstack/react-router";
import { useStore } from "../stores/store";
import { useSession } from "../lib/auth-client";

const links = [
  { to: "/projects", label: "Projects" },
  { to: "/checks", label: "Checks" },
  { to: "/report", label: "Report" },
] as const;

const linkBase = { fontWeight: 500, fontSize: "0.875rem" } as const;

export function Navbar() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const project = useStore((s) =>
    s.activeProjectId ? s.projects.find((p) => p.id === s.activeProjectId) : null
  );
  const sessionQuery = useSession();
  const user = sessionQuery?.data?.user;

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "2rem", padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>IFCore</Link>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {links.map((l) => (
          <Link key={l.to} to={l.to}
            activeOptions={{ exact: l.to === "/projects" }}
            style={{ ...linkBase, color: "var(--text-muted)" }}
            activeProps={{ style: { ...linkBase, color: "var(--accent)" } }}
          >
            {l.label}
          </Link>
        ))}
        {activeProjectId && project && (
          <>
            <span style={{ color: "var(--border)" }}>/</span>
            <Link
              to="/projects/$id"
              params={{ id: activeProjectId }}
              style={{ ...linkBase, color: "var(--accent)" }}
            >
              {project.name || "Project"}
            </Link>
          </>
        )}
      </div>
      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <Link to="/profile" style={{ ...linkBase, color: "var(--accent)" }}>
            {user.name || user.email}
          </Link>
        ) : (
          <Link to="/login" style={{ ...linkBase, color: "var(--text-muted)" }}>
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}
