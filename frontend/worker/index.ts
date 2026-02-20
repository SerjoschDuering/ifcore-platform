import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { createAuth } from "./lib/auth";
import health from "./routes/health";
import upload from "./routes/upload";
import checks from "./routes/checks";
import projects from "./routes/projects";
import files from "./routes/files";
import chat from "./routes/chat";
import stats from "./routes/stats";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return "https://ifcore-platform.tralala798.workers.dev";
      if (origin.startsWith("http://localhost:")) return origin;
      const allowed = [
        "https://ifcore-platform.pages.dev",
        "https://ifcore-platform.tralala798.workers.dev",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.all("/api/auth/*", async (c) => {
  try {
    const auth = createAuth(c.env);
    return await auth.handler(c.req.raw);
  } catch (e: any) {
    console.error("[AUTH ERROR]", e?.message);
    return c.json({ error: "Auth error", detail: e?.message }, 500);
  }
});

app.route("/api", health);
app.route("/api/upload", upload);
app.route("/api/checks", checks);
app.route("/api/projects", projects);
app.route("/api/files", files);
app.route("/api/chat", chat);
app.route("/api/stats", stats);

export default app;
