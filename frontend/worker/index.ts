import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import health from "./routes/health";
import upload from "./routes/upload";
import checks from "./routes/checks";
import projects from "./routes/projects";
import files from "./routes/files";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "https://ifcore-platform.pages.dev"],
    credentials: true,
  })
);
app.route("/api", health);
app.route("/api/upload", upload);
app.route("/api/checks", checks);
app.route("/api/projects", projects);
app.route("/api/files", files);

export default app;
