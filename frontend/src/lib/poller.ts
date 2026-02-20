import { useStore } from "../stores/store";
import { getJob } from "./api";

let timer: ReturnType<typeof setTimeout> | null = null;

export function startPolling() {
  if (timer) return;
  async function tick() {
    const running = Object.values(useStore.getState().jobs)
      .filter((j) => j.status === "running" || j.status === "pending");
    for (const job of running) {
      try {
        const prev = useStore.getState().jobs[job.id];
        const updated = await getJob(job.id);

        // Skip update if nothing changed
        if (prev && prev.status === updated.status && prev.progress === updated.progress) continue;

        if (updated.status === "done" && prev?.status !== "done") {
          // Batch all updates into a single store set to avoid cascading re-renders
          useStore.setState((s) => ({
            jobs: { ...s.jobs, [updated.id]: { ...s.jobs[updated.id], ...updated } },
            ...(updated.check_results ? { checkResults: updated.check_results } : {}),
            ...(updated.element_results ? { elementResults: updated.element_results } : {}),
          }));
        } else {
          useStore.getState().updateJob(updated.id, updated);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[poller] job fetch failed:", err);
      }
    }
    const stillRunning = Object.values(useStore.getState().jobs)
      .filter((j) => j.status === "running" || j.status === "pending");
    if (stillRunning.length > 0) {
      timer = setTimeout(tick, 2000);
    } else {
      timer = null;
    }
  }
  tick();
}

export function stopPolling() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
