import { useState } from "react";
import { startCheck } from "../../lib/api";
import { useStore } from "../../stores/store";
import { startPolling } from "../../lib/poller";
import { LoadingSpinner } from "../../components/LoadingSpinner";

type CheckRunnerProps = {
  projectId: string;
  fileUrl: string;
  variant?: "card" | "toolbar";
};

export function CheckRunner({ projectId, fileUrl, variant = "card" }: CheckRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeJobId = useStore((s) => s.activeJobId);
  const activeJob = useStore((s) => activeJobId ? s.jobs[activeJobId] : null);

  async function handleRun() {
    setIsRunning(true);
    setError(null);
    try {
      const { job_id } = await startCheck(projectId, fileUrl);
      useStore.getState().trackJob({ id: job_id, project_id: projectId, status: "running", started_at: Date.now(), completed_at: null });
      startPolling();
    } catch (err) {
      console.error("Check failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start check");
    } finally {
      setIsRunning(false);
    }
  }

  if (variant === "toolbar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          className="toolbar-btn toolbar-btn-primary"
          onClick={handleRun}
          disabled={isRunning || !fileUrl || activeJob?.status === "running"}
        >
          {isRunning ? "Starting…" : "▶ Run Checks"}
        </button>
        {activeJob?.status === "running" && (
          <span className="toolbar-btn" style={{ cursor: "default", gap: "0.3rem", color: "var(--accent)" }}>
            <LoadingSpinner size={10} /> Running
          </span>
        )}
        {activeJob?.status === "done" && (
          <span className="toolbar-btn" style={{ cursor: "default", color: "var(--success)" }}>✓ Done</span>
        )}
        {error && <span style={{ color: "var(--error)", fontSize: "0.72rem" }}>{error}</span>}
      </div>
    );
  }

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <button className="btn btn-primary" onClick={handleRun} disabled={isRunning || !fileUrl || activeJob?.status === "running"}>
        {isRunning ? "Starting…" : "Run Checks"}
      </button>
      {activeJob?.status === "running" && <><LoadingSpinner size={16} /><span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Checks running…</span></>}
      {activeJob?.status === "done" && <span style={{ color: "var(--success)", fontSize: "0.875rem" }}>Checks complete</span>}
      {error && <span style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</span>}
    </div>
  );
}
