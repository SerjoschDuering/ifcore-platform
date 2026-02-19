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

You also correctly identified the need for graceful degradation (rule-based
fallback when no API key is available) -- that's smart engineering.

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

## The Plan: React ChatPanel

Build a `ChatPanel.tsx` component inside the platform. It reads compliance data
from the shared Zustand store and answers questions directly.

**Why this works:**
- Your chat sees the same data as the 3D viewer and dashboard -- no syncing needed
- Users stay in one app instead of switching between tabs
- Quick-action buttons can trigger store actions (like filtering results)
- Other teams' features (dashboard, viewer) are right there alongside chat

Your AI coding agent knows React and TypeScript. You describe what you want,
it writes the code. You do not need to be a React expert -- the agent handles
the syntax. Focus on the product: what questions should the chat answer?

---

## Your 1-Day Game Plan

### Step 1: ChatPanel.tsx (2 hours)

Create `src/features/chat/ChatPanel.tsx` -- a simple component with:
- A message list (array of `{role: "user" | "assistant", text: string}`)
- A text input at the bottom
- A send button
- Messages stored in local React state (not Zustand -- chat is ephemeral)

Place it on the project detail page (`src/routes/projects.$id.tsx`) as a
collapsible side panel or bottom drawer. Or create a new route at `/chat`.

### Step 2: chatHandler.ts -- Keyword Matching (1.5 hours)

This is your Phase 1 brain. No LLM needed -- just pattern-match user queries
against the data already in the store.

Create `src/features/chat/chatHandler.ts`:

```typescript
import { CheckResult, ElementResult } from "../../lib/types";

export function handleQuery(
  query: string,
  checkResults: CheckResult[],
  elementResults: ElementResult[]
): string {
  const q = query.toLowerCase();

  if (q.includes("summary") || q.includes("overall") || q.includes("score")) {
    const total = checkResults.length;
    const passed = checkResults.filter(c => c.status === "pass").length;
    const failed = checkResults.filter(c => c.status === "fail").length;
    return `**Compliance Summary**\n\n` +
      `- Total checks: ${total}\n` +
      `- Passed: ${passed}\n` +
      `- Failed: ${failed}\n` +
      `- Score: ${total ? Math.round((passed / total) * 100) : 0}%`;
  }

  if (q.includes("fail") || q.includes("problem") || q.includes("issue")) {
    const failures = elementResults.filter(e => e.check_status === "fail");
    if (failures.length === 0) return "No failures found -- all checks passed!";
    const lines = failures.slice(0, 10).map(f =>
      `- **${f.element_name ?? "Unknown"}** (${f.element_type ?? "Unknown"}): ` +
      `actual ${f.actual_value ?? "N/A"}, required ${f.required_value ?? "N/A"}`
    );
    return `**Failed Elements** (showing ${Math.min(10, failures.length)} ` +
      `of ${failures.length}):\n\n${lines.join("\n")}`;
  }

  // Add more patterns: "wall", "door", "beam", "how to fix", etc.

  return "I can help with: **overall summary**, **failed elements**, " +
    "or questions about specific element types (walls, doors, beams). " +
    "Try asking!";
}
```

Your `ChatPanel` calls this function, reads `checkResults` and `elementResults`
from the Zustand store via `useStore()`, and displays the returned string.

### Step 3: Quick-Action Buttons (30 min)

Add 3-4 buttons above the text input:
- "Overall summary"
- "Show failures"
- "How to fix?"

Each button just sets the input text and submits it. Simple.

### Step 4: Route Integration (30 min)

Wire the ChatPanel into the app:
- Add it to `src/routes/projects.$id.tsx` as a collapsible panel, OR
- Create `src/routes/chat.tsx` as a standalone page
- Add a "Chat" link to the Navbar

**Total: ~4.5 hours for a working keyword-based chat.**

---

## Phase 2: Adding AI (If Time Permits)

Once keyword matching works, you can add real LLM responses. The good news:
**your AI coding agent already has the PydanticAI skill installed.** Ask it
to help you build this.

### Backend: Add a `/chat` endpoint to the HF Space

In `backend/main.py`, add:

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    context: str  # serialized check results

chat_agent = Agent(
    'google-gla:gemini-2.0-flash',
    instructions=(                    # use instructions, NOT system_prompt
        "You are a building compliance assistant for the IFCore platform. "
        "Answer questions about IFC compliance check results. "
        "Be specific: cite element names, actual vs required values, "
        "and regulation references. Keep answers concise."
    ),
)

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    result = await chat_agent.run(
        f"Context:\n{req.context}\n\nQuestion: {req.message}"
    )
    return {"response": result.output}
```

**Use `google-gla:gemini-2.0-flash`** -- that is the course LLM. Do not add
`anthropic` or `openai` packages. PydanticAI with Gemini is the stack.

### Frontend: Call the endpoint

From your `ChatPanel`, when keyword matching returns no good answer, fall back
to calling the `/chat` endpoint through the Cloudflare Worker proxy.

No streaming needed for the MVP. Just show a loading spinner and display the
full response when it arrives.

**Important: Worker proxy route.** The Worker (`index.ts`) only routes `/api/*`
to the backend. There is currently NO `/chat` proxy. You need to either:
- Ask the captain to add `app.route("/api/chat", chat)` to the Worker, or
- Call the HF Space backend directly (e.g., `fetch("https://serjd-ifcore-platform.hf.space/chat", ...)`)
The second option is simpler for a demo but skips the Worker proxy layer.

**Environment variable:** PydanticAI with the `google-gla` provider reads
`GEMINI_API_KEY` from the environment. Make sure it is set in the HF Space
secrets. Do NOT name it `GOOGLE_API_KEY` — that will silently fail.

**Dependency:** Add `pydantic-ai` to `backend/requirements.txt` before deploying.

**Tell your AI agent:** "I have the pydantic-ai skill AND the IFCore skill.
Help me build a chat feature using the feature module pattern from the IFCore
skill, with a PydanticAI agent on the backend using Gemini." It knows both
patterns.

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

Your PRD describes a 4-phase roadmap. For today, cut everything except Phase 1:

| Feature | Status |
|---------|--------|
| Keyword matching (Phase 1) | BUILD THIS TODAY |
| Quick-action buttons | BUILD THIS TODAY |
| LLM integration (Phase 2) | Only if Phase 1 is done |
| RAG / vector store | Cut -- post-course |
| Multi-provider support (Anthropic + OpenAI + Gemini) | Cut -- use Gemini only |
| Token monitoring | Cut |
| Streaming responses | Cut -- return full text |
| Intent classification / entity extraction | Cut |
| Element-to-viewer cross-linking (US-11) | Cut -- stretch goal |
| Audit logging | Cut |
| `tiktoken` dependency | Cut -- not needed |

**The pattern:** ship a working keyword chat first. If that is done and tested,
add the LLM layer on top. Everything else is future work.

---

## Summary

You wrote a genuinely thorough spec -- now channel that energy into shipping
code. The React chat panel with keyword matching is completely achievable in
one day. Your AI coding agent handles the React/TypeScript -- you focus on
the product: what questions matter to architects? What answers are actually
helpful? That product thinking is your strength.

If keyword matching is solid by lunch, add the LLM layer (Phase 2) for the
"wow" demo moment. Your AI agent has the PydanticAI skill and knows the
patterns. Focus on what makes chat unique: regulation explanations and fix
suggestions.

Good luck -- we are looking forward to seeing it work!
