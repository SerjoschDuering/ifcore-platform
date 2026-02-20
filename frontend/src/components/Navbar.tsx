import { Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "../stores/store";
import { useSession, authClient } from "../lib/auth-client";
import { useState } from "react";

const links = [
  { to: "/projects", label: "Projects" },
  { to: "/checks", label: "Checks" },
] as const;

const linkBase = { fontWeight: 500, fontSize: "0.875rem" } as const;

export function Navbar() {
  const navigate = useNavigate();
  const activeProjectId = useStore((s) => s.activeProjectId);
  const project = useStore((s) =>
    s.activeProjectId ? s.projects.find((p) => p.id === s.activeProjectId) : null
  );
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "2rem", padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
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
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {session ? (
          <>
            <Link
              to="/profile"
              style={{ ...linkBase, color: "var(--text-muted)" }}
              activeProps={{ style: { ...linkBase, color: "var(--accent)" } }}
            >
              {session.user.name || session.user.email || "Profile"}
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                ...linkBase,
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: isLoggingOut ? "not-allowed" : "pointer",
                opacity: isLoggingOut ? 0.5 : 1,
              }}
            >
              {isLoggingOut ? "..." : "Logout"}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth/login"
              style={{ ...linkBase, color: "var(--text-muted)" }}
              activeProps={{ style: { ...linkBase, color: "var(--accent)" } }}
            >
              Sign In
            </Link>
            <Link
              to="/auth/signup"
              style={{
                ...linkBase,
                color: "white",
                background: "var(--accent)",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
