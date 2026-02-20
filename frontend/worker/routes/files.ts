import { Hono } from "hono";
import type { Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/*", async (c) => {
  const key = c.req.path.replace("/api/files/", "");
  if (!key || key.includes("..")) return c.json({ error: "Invalid path" }, 400);

  const object = await c.env.STORAGE.get(key);
  if (!object) return c.json({ error: "Not found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=3600");

  return new Response(object.body, { headers });
});

export default app;
