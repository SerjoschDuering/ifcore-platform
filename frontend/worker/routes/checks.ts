import { Hono } from "hono";
import type { Bindings } from "../types";
import { insertJob, updateJob, getJob, insertCheckResults } from "../lib/db";

const app = new Hono<{ Bindings: Bindings }>();

// Read file from R2 and encode as base64
async function readR2AsBase64(storage: R2Bucket, key: string): Promise<string> {
  const obj = await storage.get(key);
  if (!obj) throw new Error(`R2 object not found: ${key}`);
  const bytes = await obj.arrayBuffer();
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  return btoa(binary);
}

app.post("/run", async (c) => {
  const { project_id, file_url } = await c.req.json<{ project_id: string; file_url: string }>();
  const jobId = crypto.randomUUID();
  await insertJob(c.env.DB, { id: jobId, project_id });

  // Read IFC from R2 and encode as base64 — avoids HF DNS issues with workers.dev
  const r2Key = file_url.replace("r2://", "");
  let ifc_b64: string;
  try {
    ifc_b64 = await readR2AsBase64(c.env.STORAGE, r2Key);
  } catch {
    await updateJob(c.env.DB, jobId, { status: "error", completed_at: Date.now() });
    return c.json({ job_id: jobId, status: "error", error: "Failed to read file from storage" }, 500);
  }

  // Trigger HF check with base64 payload (no callback URL needed)
  let hfJobId: string;
  try {
    const resp = await fetch(`${c.env.HF_SPACE_URL}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ifc_b64, project_id }),
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      await updateJob(c.env.DB, jobId, { status: "error", completed_at: Date.now() });
      return c.json({ job_id: jobId, status: "error", error: `HF returned ${resp.status}` }, 502);
    }
    const data: any = await resp.json();
    hfJobId = data.job_id;
  } catch {
    await updateJob(c.env.DB, jobId, { status: "error", completed_at: Date.now() });
    return c.json({ job_id: jobId, status: "error", error: "HF Space unreachable" }, 502);
  }

  // Store hf_job_id so we can poll HF later
  await updateJob(c.env.DB, jobId, { status: "running", hf_job_id: hfJobId });
  return c.json({ job_id: jobId, status: "running" });
});

app.get("/jobs/:id", async (c) => {
  const job = await getJob(c.env.DB, c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);

  // Lazy-poll HF: if still running, check HF and update D1 in this request
  if (job.status === "running" && (job as any).hf_job_id) {
    try {
      const hfResp = await fetch(`${c.env.HF_SPACE_URL}/jobs/${(job as any).hf_job_id}`,
        { signal: AbortSignal.timeout(8000) });
      if (hfResp.ok) {
        const hfData: any = await hfResp.json();
        if (hfData.status === "done") {
          await insertCheckResults(c.env.DB, hfData.check_results || [], hfData.element_results || []);
          await updateJob(c.env.DB, job.id, { status: "done", completed_at: Date.now() });
          (job as any).status = "done";
        } else if (hfData.status === "error") {
          await updateJob(c.env.DB, job.id, { status: "error", completed_at: Date.now() });
          (job as any).status = "error";
        }
      }
    } catch {
      // transient HF error — return current status, frontend will retry
    }
  }

  const checks = await c.env.DB.prepare("SELECT * FROM check_results WHERE job_id = ?").bind(job.id).all();
  const elementIds = checks.results?.map((cr: any) => cr.id) || [];
  let elements = { results: [] as any[] };
  if (elementIds.length > 0) {
    const placeholders = elementIds.map(() => "?").join(",");
    elements = await c.env.DB.prepare(`SELECT * FROM element_results WHERE check_result_id IN (${placeholders})`).bind(...elementIds).all();
  }

  return c.json({ ...job, check_results: checks.results, element_results: elements.results });
});

export default app;
