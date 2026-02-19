import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient, useSession } from "../../lib/auth-client";
import { useStore } from "../../stores/store";

type UserSettingsModalProps = {
  onClose: () => void;
};

export function UserSettingsModal({ onClose }: UserSettingsModalProps) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const projects = useStore((s) => s.projects);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const user = session?.user;
  const userProjects = user ? projects.filter((p) => (p as any).user_id === user.id) : [];

  async function handleLogout() {
    await authClient.signOut();
    onClose();
    navigate({ to: "/login" });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(4, 8, 16, 0.52)",
        backdropFilter: "blur(4px)",
        zIndex: 80,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "74px 14px 14px",
      }}
    >
      <div
        className="glass-panel-strong"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(30vw, 420px)",
          minWidth: 300,
          maxHeight: "calc(100vh - 110px)",
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>User Settings</h3>
          <button className="toolbar-btn" onClick={onClose} aria-label="Close settings">Close</button>
        </div>

        {!user ? (
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>No active user session.</p>
        ) : (
          <>
            <Field label="Name" value={user.name || "—"} />
            <Field label="Email" value={user.email || "—"} />
            <Field label="Team" value={(user as any).team || "—"} />
            <Field label="Projects" value={String(userProjects.length)} />

            <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" style={{ color: "#ff9f9f", borderColor: "rgba(255,120,120,0.35)" }} onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "0.55rem 0.1rem",
      borderBottom: "1px solid var(--border)",
      fontSize: "0.84rem",
    }}>
      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}
