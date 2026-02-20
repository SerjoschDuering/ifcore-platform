import { Hono } from "hono";
import type { Bindings } from "../types";
import { getUserStats } from "../lib/db";
import { getSessionUser } from "../lib/auth";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const user = await getSessionUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const stats = await getUserStats(c.env.DB, user.id);
    return c.json(stats);
  } catch (e: any) {
    console.error("[stats] GET / error:", e);
    return c.json({ error: e.message || "Unknown error" }, 500);
  }
});

export default app;
