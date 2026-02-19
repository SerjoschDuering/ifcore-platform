import { useState } from "react";
import { startCheck } from "../../lib/api";
import { useStore } from "../../stores/store";
import { startPolling } from "../../lib/poller";
import { LoadingSpinner } from "../../components/LoadingSpinner";

export function CheckRunner({ projectId, fileUrl }: { projectId: string; fileUrl: string }) {
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

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <button className="btn btn-primary" onClick={handleRun} disabled={isRunning || activeJob?.status === "running"}>
        {isRunning ? "Starting..." : "Run Checks"}
      </button>
      {activeJob?.status === "running" && <><LoadingSpinner size={16} /><span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Checks running...</span></>}
      {activeJob?.status === "done" && <span style={{ color: "var(--success)", fontSize: "0.875rem" }}>Checks complete</span>}
      {error && <span style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</span>}
    </div>
  );
}
