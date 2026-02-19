import { Hono } from "hono";
import type { Bindings } from "../types";
import { getProjects, getProject, getJobsByProject } from "../lib/db";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const result = await getProjects(c.env.DB);
  return c.json(result.results || []);
});

app.get("/:id", async (c) => {
  const project = await getProject(c.env.DB, c.req.param("id"));
  if (!project) return c.json({ error: "Project not found" }, 404);
  const jobs = await getJobsByProject(c.env.DB, c.req.param("id"));
  return c.json({ ...project, jobs: jobs.results || [] });
});

export default app;
