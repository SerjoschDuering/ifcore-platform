import { useStore } from "../stores/store";
import { getJob } from "./api";

let timer: ReturnType<typeof setTimeout> | null = null;

export function startPolling() {
  if (timer) return;
  async function tick() {
    const { jobs, updateJob } = useStore.getState();
    const running = Object.values(jobs).filter((j) => j.status === "running" || j.status === "pending");
    for (const job of running) {
      try {
        const prev = jobs[job.id];
        const updated = await getJob(job.id);
        updateJob(updated.id, updated);
        if (updated.status === "done" && prev?.status !== "done") {
          const { setCheckResults, setElementResults } = useStore.getState();
          if (updated.check_results) setCheckResults(updated.check_results);
          if (updated.element_results) setElementResults(updated.element_results);
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
