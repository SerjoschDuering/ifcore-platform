import { Hono } from "hono";
import type { Bindings } from "../types";
import { insertProject } from "../lib/db";
import { getSessionUser } from "../lib/auth";

const app = new Hono<{ Bindings: Bindings }>();

const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB

app.post("/", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "No file provided" }, 400);
  if (!file.name.toLowerCase().endsWith(".ifc")) return c.json({ error: "Only .ifc files are accepted" }, 400);
  if (file.size > MAX_FILE_SIZE) return c.json({ error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }, 413);

  const user = await getSessionUser(c.env, c.req.raw);
  const projectId = crypto.randomUUID();
  const key = `ifc/${projectId}/${file.name}`;

  await c.env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: "application/octet-stream" },
  });

  const fileUrl = `r2://${key}`;
  await insertProject(c.env.DB, {
    id: projectId,
    name: file.name.replace(/\.ifc$/i, ""),
    file_url: fileUrl,
    user_id: user?.id ?? null,
  });

  return c.json({ project_id: projectId, file_url: fileUrl });
});

export default app;
