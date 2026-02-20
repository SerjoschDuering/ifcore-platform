import { Hono } from "hono";
import type { Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings }>();

// Proxy POST /api/chat → HF Space /chat
// The CF Worker passes the full request body through unchanged.
// The HF Space handles the PydanticAI agent and returns { response: string }.
app.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  try {
    const resp = await fetch(`${c.env.HF_SPACE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return c.json({ error: `AI backend returned ${resp.status}: ${text}` }, 502);
    }

    const data = await resp.json();
    return c.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return c.json({ error: "AI model timed out. Please try again." }, 504);
    }
    return c.json({ error: "AI backend unreachable." }, 502);
  }
});

export default app;
