import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "../types";
import { createAuthInstance } from "../lib/auth";

const route = new Hono<{ Bindings: Bindings }>();

// Mount Better Auth routes
route.all("/*", async (c) => {
  const auth = createAuthInstance(c.env);
  return auth.handler(c.req.raw);
});

export default route;
