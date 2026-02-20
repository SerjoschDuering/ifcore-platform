# Structures — AI Chat Interface

**Branch:** `structure-chatbot` (fresh start from main)

**Shared State:** Reads `checkResults`, `elementResults`, `activeProjectId`. Writes: none (chat state is local component state).

## What You Did Well

Your PRD is the most thorough document any team produced -- 871 lines across two
files, covering user stories, functional requirements, non-functional
requirements, architecture diagrams, implementation phases, error handling copy,
config tables, and success metrics. That level of professional documentation
shows real engineering thinking.

The core idea is strong: compliance results as raw tables are hard to read.
A chat interface that explains *why* something failed and *how to fix it* is
genuinely useful and something no other team is building. The user stories
(US-01 through US-13) are well-written and clearly scoped by priority.

---

## The Architecture Pivot

Here is the key issue: **the PRD targets Gradio, but the platform runs on
React 19 + Cloudflare Worker + HuggingFace Space FastAPI.**

Your PRD references:
- `gr.Chatbot`, `gr.Textbox`, `gr.Button` -- these are Gradio widgets
- `_current_project` global, `models.py::Project` -- these are from the student template app
- `app.py`, `config.py::THRESHOLDS` -- these files do not exist in the platform

The platform frontend is a React app with TypeScript. Features are built as
React components in `src/features/`, state lives in a Zustand store, and the
backend is a FastAPI server on HuggingFace Spaces. The Cloudflare Worker sits
in between as an API gateway.

**This is not a failure.** Your ideas are solid -- the implementation target
just needs to shift. Think of it like designing a great building on the wrong
plot of land. The design is good; we just need to move it to the right site.

### About the Revert

The PR that was merged contained only documentation (the PRD + feature spec),
no code. It was reverted to clear the runway so you can start fresh on the
correct architecture. No work was lost, because no code had been written yet.
The branch `structure-chatbot` still exists with your documents if you want
to reference them.

---

## The Stack: PydanticAI + React

Your chat feature has two halves:

| Layer | What | Tech |
|-------|------|------|
| **Backend** | PydanticAI agent answers questions about compliance results | Python, FastAPI, PydanticAI, Gemini |
| **Frontend** | React chat panel sends questions, displays answers | TypeScript, React, Zustand |

**PydanticAI is the brain.** It is not optional or Phase 2. It is the core of
your feature. Your AI coding agent has the **pydantic-ai skill** installed --
it knows exactly how to build this.

Your AI coding agent also has the **IFCore skill** for the React frontend
patterns. Between the two skills, your agent can build both halves.

---

## Your 1-Day Game Plan

### Step 1: Backend — PydanticAI Chat Agent (2 hours)

This is the most important part. Get the AI working first.

In `backend/main.py`, add a PydanticAI agent and a `/chat` endpoint:

```python
from pydantic_ai import Agent
from pydantic import BaseModel
import json

class ChatRequest(BaseModel):
    message: str
    check_results: list[dict]    # serialized CheckResult[]
    element_results: list[dict]  # serialized ElementResult[]

chat_agent = Agent(
    'google-gla:gemini-2.0-flash',
    instructions=(
        "You are a building compliance assistant for the IFCore platform. "
        "You receive IFC compliance check results and answer questions about them. "
        "Be specific: cite element names, actual vs required values, and what failed. "
        "When asked how to fix something, give actionable architectural advice. "
        "Keep answers concise but helpful. Use markdown formatting."
    ),
)

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # Build a context string from the real compliance data
    context_parts = []

    for cr in req.check_results:
        status = cr.get("status", "unknown")
        context_parts.append(f"Check '{cr.get('check_name')}' (team {cr.get('team')}): {status} — {cr.get('summary', '')}")

    fail_elements = [e for e in req.element_results if e.get("check_status") == "fail"]
    if fail_elements:
        context_parts.append(f"\n{len(fail_elements)} failing elements:")
        for e in fail_elements[:30]:  # cap at 30 to stay within token limits
            name = e.get("element_name") or e.get("element_type") or "Unknown"
            context_parts.append(
                f"  - {name}: actual={e.get('actual_value', 'N/A')}, "
                f"required={e.get('required_value', 'N/A')}, "
                f"comment={e.get('comment', '')}"
            )

    context = "\n".join(context_parts)
    prompt = f"Compliance data:\n{context}\n\nUser question: {req.message}"

    result = await chat_agent.run(prompt)
    return {"response": result.output}
```

**Test it immediately:**
```bash
cd backend
pip install 'pydantic-ai-slim[google]'
export GOOGLE_API_KEY=your_key_here
uvicorn main:app --port 7860
# Then in another terminal:
curl -X POST http://localhost:7860/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What failed?", "check_results": [{"check_name": "check_door_width", "team": "team-a", "status": "fail", "summary": "14 doors: 12 pass, 2 fail"}], "element_results": [{"element_name": "Door #3", "element_type": "IfcDoor", "check_status": "fail", "actual_value": "750 mm", "required_value": "800 mm", "comment": "Door is 50 mm too narrow"}]}'
```

You should get back an intelligent answer about Door #3 being too narrow.

**Environment setup:**
- Add `pydantic-ai-slim[google]` to `backend/requirements.txt`
- The `GOOGLE_API_KEY` env var must be set. On the HF Space, add it as a secret.
  Get your key from [aistudio.google.com](https://aistudio.google.com/).

### Step 2: Frontend — ChatPanel.tsx (1.5 hours)

Create `src/features/chat/ChatPanel.tsx`:
- A message list: `{role: "user" | "assistant", text: string}[]`
- A text input + send button
- Messages in local React state (not Zustand -- chat is ephemeral)
- On send: POST to the backend with the current `checkResults` and `elementResults`

```typescript
// src/features/chat/ChatPanel.tsx — skeleton
import { useState } from "react";
import { useStore } from "../../stores/store";

type Message = { role: "user" | "assistant"; text: string };

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const checkResults = useStore((s) => s.checkResults);
  const elementResults = useStore((s) => s.elementResults);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call the HF Space backend directly for the demo
      const res = await fetch(
        "https://serjd-ifcore-platform.hf.space/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: input,
            check_results: checkResults,
            element_results: elementResults,
          }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: could not reach the AI backend." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "0.75rem" }}>
            <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.text}
          </div>
        ))}
        {loading && <div><em>Thinking...</em></div>}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", padding: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about compliance results..."
          style={{ flex: 1 }}
        />
        <button onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}
```

**Note:** The frontend calls the HF Space backend directly
(`https://serjd-ifcore-platform.hf.space/chat`). This bypasses the CF Worker
proxy but works perfectly for the demo. If the captain adds an `/api/chat`
proxy route to the Worker later, just change the URL.

### Step 3: Quick-Action Buttons (30 min)

Add preset buttons above the input:
- "What's the overall compliance score?"
- "What failed and why?"
- "How do I fix the failures?"
- "Explain results to a non-technical client"

Each button sets the input and triggers `send()`. These make the demo smooth
-- the presenter clicks a button instead of typing.

### Step 4: Route + Navbar (30 min)

Create `src/routes/chat.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "../features/chat/ChatPanel";

export const Route = createFileRoute("/chat")({
  component: ChatPanel,
});
```

Add a "Chat" link to the Navbar. Done.

### Step 5: Test and Polish (30 min)

- Upload the Duplex Apartment model, run checks, go to `/chat`
- Click "What failed?" — the AI should cite specific elements
- Click "How do I fix?" — the AI should give actionable advice
- Try free-form: "Are the doors wide enough for wheelchair access?"
- Make sure error states look clean (backend down, empty results)

**Total: ~5 hours for a working AI-powered chat.**

---

## Your Chat's Unique Value

Look at what other teams are building:

| Feature | Who builds it |
|---------|--------------|
| Visual compliance dashboard (charts, tables, filters) | Team E |
| Compliance report (accordion, export) | Lux-AI |
| 3D viewer with element highlighting | Team D |

None of them can do what chat can do:
- **"What does Article 69 require for foundations?"** -- regulation explanations
- **"How do I fix the failing wall thickness?"** -- remediation suggestions
- **"Explain this failure to a client in simple terms"** -- translation to plain language

This is your unique value. Do not spend time rebuilding the summary table or
the filter-by-status feature -- other teams already handle that visually.
Focus on the things only a conversational interface can do well.

---

## What to Cut

| Feature | Status |
|---------|--------|
| PydanticAI agent + React chat panel | **BUILD THIS TODAY** |
| Quick-action buttons | **BUILD THIS TODAY** |
| RAG / vector store | Cut -- post-course |
| Multi-provider support (Anthropic + OpenAI + Gemini) | Cut -- use Gemini only |
| Token monitoring | Cut |
| Streaming responses | Cut -- return full text |
| Intent classification / entity extraction | Cut |
| Element-to-viewer cross-linking (US-11) | Cut -- stretch goal |
| Audit logging | Cut |
| `tiktoken` dependency | Cut -- not needed |
| Multi-turn conversation history | Cut -- each question is standalone |

---

## Tell Your AI Agent

Start your session by saying:

> "I have the **pydantic-ai skill** and the **IFCore skill** installed. I need
> to build a chat feature for the IFCore platform. The backend is a PydanticAI
> agent with Gemini on FastAPI (backend/main.py on HuggingFace Spaces). The
> frontend is a React ChatPanel component using the feature module pattern.
> Read both skills and help me build this."

Your agent knows both patterns. It will write the code. You focus on the
product: what questions matter to architects checking building compliance?

---

## Summary

You wrote a genuinely thorough spec -- now channel that energy into shipping
code. The PydanticAI agent is the core of your feature and the "wow" moment
for the demo. Your AI coding agent handles both the Python backend and the
React frontend -- you focus on the product: what questions matter to
architects? What answers are actually helpful?

Get the backend working first (Step 1). Once you can curl the `/chat`
endpoint and get intelligent answers, the frontend is just a UI wrapper.

Good luck -- we are looking forward to seeing it work!
