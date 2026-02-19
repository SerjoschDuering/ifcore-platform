import { Hono } from "hono";
import type { Bindings } from "../types";
import { insertProject } from "../lib/db";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "No file provided" }, 400);

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
  });

  return c.json({ project_id: projectId, file_url: fileUrl });
});

export default app;
