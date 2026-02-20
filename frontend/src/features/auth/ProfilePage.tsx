import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient, useSession } from "../../lib/auth-client";
import { useStore } from "../../stores/store";

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const projects = useStore((s) => s.projects);

  async function handleLogout() {
    await authClient.signOut();
    navigate({ to: "/login" });
  }

  useEffect(() => {
    if (!isPending && !session?.user) navigate({ to: "/login" });
  }, [isPending, session, navigate]);

  if (isPending) {
    return (
      <div style={styles.page}>
        <div style={styles.sidebar} />
        <div style={styles.content}>
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const userProjects = projects.filter((p) => (p as any).user_id === user.id);

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <div style={styles.brand}>IFCore</div>
        <p style={styles.tagline}>Building Compliance Platform</p>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Profile</h2>

          <div style={styles.field}>
            <span style={styles.fieldLabel}>Name</span>
            <span style={styles.fieldValue}>{user.name || "—"}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.fieldLabel}>Email</span>
            <span style={styles.fieldValue}>{user.email}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.fieldLabel}>Team</span>
            <span style={styles.fieldValue}>{(user as any).team || "—"}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.fieldLabel}>Projects</span>
            <span style={styles.fieldValue}>{userProjects.length}</span>
          </div>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  } as const,
  sidebar: {
    width: 240,
    background: "linear-gradient(180deg, #1a3a8f 0%, #0d1f5c 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  } as const,
  brand: {
    color: "#fff",
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  } as const,
  tagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.8rem",
    textAlign: "center" as const,
    marginTop: "0.5rem",
  } as const,
  content: {
    flex: 1,
    background: "#f5f7fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const,
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "2.5rem",
    width: 400,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  } as const,
  heading: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0d1f5c",
  } as const,
  field: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem 0",
    borderBottom: "1px solid #f3f4f6",
  } as const,
  fieldLabel: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#6b7280",
  } as const,
  fieldValue: {
    fontSize: "0.875rem",
    color: "#111827",
  } as const,
  logoutBtn: {
    marginTop: "0.5rem",
    padding: "0.625rem",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  } as const,
};
