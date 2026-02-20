# Product Requirement Document
# AI Chat Interface — IFCore Compliance Platform

**Document status:** Draft v0.2 — Architecture pivot applied (PRD-REVIEW/05-structures.md)
**Date:** 2026-02-20
**Branch:** `structure-chatbot`
**Deadline:** Demo Day Feb 20

---

## Changelog

| Version | Date | Change |
|---|---|---|
| v0.1 | 2026-02-19 | Initial draft — targeted Gradio frontend |
| v0.2 | 2026-02-20 | **Architecture pivot**: replaced Gradio/Python desktop with React + PydanticAI + Gemini. Cut scope to demo-day deliverable. |

---

## 1. Executive Summary

The IFCore platform performs automated IFC building-model compliance checks and shows results in a dashboard. Raw pass/fail tables are hard to interpret for non-engineers, and no tool currently explains *why* something failed, *which regulation* applies, or *how to fix it*.

This feature adds an **AI Chat Interface** — a React panel where users ask natural-language questions and receive intelligent, data-grounded answers from a PydanticAI agent backed by Gemini.

**The chat's unique value vs. other teams' features:**

| Feature | Who builds it |
|---|---|
| Visual dashboard (charts, tables, filters) | Team E |
| Compliance report (accordion, export) | Lux-AI |
| 3D viewer with element highlighting | Team D |
| **Natural-language Q&A, regulation explanations, remediation advice** | **Structures (this PRD)** |

---

## 2. Problem Statement

| Pain Point | Impact |
|---|---|
| Compliance results are raw tables | Engineers must manually scan hundreds of element-level results |
| No plain-language failure explanations | Non-technical stakeholders cannot read the output |
| Regulation references are code numbers only (Art. 69, EHE…) | Users must look up regulation text externally |
| No remediation guidance | Users know *what* failed, not *how* to fix it |

---

## 3. What We Are Building (Demo Day Scope)

### In Scope

| # | Deliverable | Time estimate |
|---|---|---|
| 1 | `/chat` FastAPI endpoint with PydanticAI + Gemini agent | ~2 hours |
| 2 | `ChatPanel.tsx` React component with message list + input | ~1.5 hours |
| 3 | Quick-action preset buttons | ~30 min |
| 4 | `/chat` route + Navbar link | ~30 min |
| 5 | Error states + polish | ~30 min |

**Total: ~5 hours**

### Explicitly Cut (post-course)

| Feature | Why cut |
|---|---|
| RAG / vector store for regulations | Too complex for demo day |
| Multi-provider support (Anthropic, OpenAI) | Use Gemini only — one provider, less config |
| Streaming responses | Return full text — simpler, still fast enough |
| Intent classification / entity extraction | Overkill — LLM handles intent implicitly |
| Element-to-3D-Viewer cross-linking | Stretch goal |
| Multi-turn conversation history | Each question is standalone for demo |
| Token monitoring / audit logging | Post-course |
| `tiktoken` dependency | Not needed |
| Summary table / filter-by-status UI | Other teams (D, E) already build this visually |

---

## 4. Target Users (Unchanged)

| User | Primary Need |
|---|---|
| Structural engineer | Find which elements failed and by how much |
| Architect | Understand accessibility compliance, get fix advice |
| Project manager | Plain-language summary to share with clients |
| Regulator / Inspector | Verify compliance claims in natural language |

---

## 5. User Stories (Demo Day Priority)

### Must Have (ship today)

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-01 | Engineer | Ask "which elements failed?" | I get a specific list with actual vs required values |
| US-02 | PM | Ask "what is the compliance score?" | I get a plain-language score summary |
| US-03 | Architect | Ask "how do I fix the wall failures?" | I get concrete remediation advice |
| US-04 | Architect | Ask "what does EHE require for beams?" | I get a regulation explanation |
| US-05 | Any user | Click a preset quick-action button | I get an instant useful answer without typing |
| US-06 | Any user | See a clear error if the backend is down | The UI doesn't silently break |

### Should Have (if time)

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-07 | PM | Ask "explain this to a non-technical client" | I get plain-language text I can copy |
| US-08 | Any user | See a prompt to run checks first if no data is loaded | I know what to do next |

### Deferred (post-course)

| ID | Story |
|---|---|
| US-09 | Click element reference → 3D viewer highlights it |
| US-10 | Multi-turn conversation with follow-up context |
| US-11 | Token usage display |

---

## 6. Functional Requirements

### 6.1 Backend — `/chat` Endpoint

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-01 | Accept `POST /chat` with `{ message, check_results, element_results }` | Must |
| FR-02 | Run the user message + compliance context through PydanticAI agent | Must |
| FR-03 | Return `{ response: string }` with markdown-formatted answer | Must |
| FR-04 | Cap injected failing elements at 30 to stay within token limits | Must |
| FR-05 | Include check-level summaries (team, status, summary) in context | Must |
| FR-06 | Return a helpful error message if the agent call fails | Must |
| FR-07 | Handle empty `check_results` (no model loaded) gracefully | Should |

### 6.2 Frontend — `ChatPanel.tsx`

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-08 | Display scrollable message history (user + assistant bubbles) | Must |
| FR-09 | Text input + send button; Enter key also sends | Must |
| FR-10 | "Thinking…" loading indicator while waiting for response | Must |
| FR-11 | Read `checkResults` and `elementResults` from Zustand store | Must |
| FR-12 | Keep chat messages in local component state (not Zustand) | Must |
| FR-13 | Clear input field after sending | Must |
| FR-14 | Show error message if fetch fails | Must |
| FR-15 | Render markdown in assistant responses (bold, lists, tables) | Should |
| FR-16 | Guard: if store has no check results, show prompt to run checks first | Should |

### 6.3 Quick-Action Buttons

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-17 | Display ≥4 preset buttons above the input | Must |
| FR-18 | Each button sets the input text and triggers send | Must |
| FR-19 | *(open)* Final button labels — see Open Questions §12 | Must |

### 6.4 Route + Navigation

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-20 | Create `/chat` route via TanStack Router `createFileRoute` | Must |
| FR-21 | Add "Chat" link to Navbar | Must |
| FR-22 | *(open)* Navbar position of Chat link — see Open Questions §12 | Should |

---

## 7. Non-Functional Requirements

| REQ-ID | Requirement | Target |
|---|---|---|
| NFR-01 | Backend response time (LLM) | < 5 seconds |
| NFR-02 | Frontend sends no raw IFC binary to the LLM | Required |
| NFR-03 | GOOGLE_API_KEY never exposed in frontend code or logs | Required |
| NFR-04 | Prompt injection in user input handled gracefully | Required |
| NFR-05 | HF Space cold-start (up to 60s) shows user-friendly message | Should |

---

## 8. Architecture

```
React Frontend (Cloudflare Worker SPA)
├── /chat route (TanStack Router)
│   └── ChatPanel.tsx
│       ├── Reads: checkResults, elementResults from Zustand store
│       ├── Keeps: messages[] in local useState (ephemeral)
│       └── POSTs to: https://serjd-ifcore-platform.hf.space/chat
│
│   Note: calls HF Space directly (bypasses CF Worker) — acceptable for demo.
│   CF Worker /api/chat proxy can be added post-demo if needed.
│
HuggingFace Space FastAPI (backend/main.py)
└── POST /chat
    ├── Input: { message, check_results[], element_results[] }
    ├── Context builder: serialise check + element data (cap at 30 fail elements)
    ├── PydanticAI Agent (google-gla:gemini-2.0-flash)
    │   └── System prompt: compliance expert, cite elements, give actionable advice
    └── Output: { response: string } (markdown)
```

### State contract (read-only, never written by chat)

```
Zustand store → ChatPanel reads:
  checkResults:   CheckResult[]     (from /api/checks/jobs/:id)
  elementResults: ElementResult[]   (from /api/checks/jobs/:id)
  activeProjectId: string | null
```

Chat state (`messages[]`) lives in local React state only. It is not persisted.

---

## 9. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| AI Agent | PydanticAI v1.x | `pydantic-ai-slim[google]` |
| LLM | Gemini 2.0 Flash | `google-gla:gemini-2.0-flash` |
| API key | `GOOGLE_API_KEY` | HF Space secret; local `.env` |
| Backend framework | FastAPI (existing) | Add `/chat` to `backend/main.py` |
| Frontend framework | React 19 + TypeScript | `src/features/chat/ChatPanel.tsx` |
| Router | TanStack Router | `src/routes/chat.tsx` |
| State management | Zustand (read-only) | Chat messages in local state |
| Markdown rendering | *(open)* | See Open Questions §12 |

### New dependencies

| Package | Where | Purpose |
|---|---|---|
| `pydantic-ai-slim[google]` | `backend/requirements.txt` | PydanticAI + Gemini provider |
| *(optional)* `react-markdown` | `frontend/package.json` | Markdown in chat bubbles |

---

## 10. System Prompt (Draft)

```
You are a building compliance assistant for the IFCore platform.
You receive IFC compliance check results and answer questions about them.

Guidelines:
- Be specific: cite element names, actual vs required values, and what failed.
- When asked how to fix something, give actionable architectural advice.
- When asked about regulations, explain them in plain language with threshold values.
- Keep answers concise but helpful.
- Use markdown formatting (bold, bullet lists, tables where useful).
- If no compliance data is provided, ask the user to run a check first.

Regulation knowledge (Spanish / Catalan building codes):
- EHE (Structural Concrete): beams min depth 200mm, min width 150mm;
  columns min dimension 250mm; foundations min depth 200mm
- CTE DB HE (Energy Saving): walls max U-value 0.80 W/m²K;
  slabs thickness 150–200mm
- DB SUA (Accessibility): door width min 800mm; corridor width min 1100mm;
  ceiling height min 2200mm; railing height min 900mm
- Decree 141/2012 (Catalan Housing): regional accessibility requirements
- Art. 69 / Art. 128: structural article references
```

---

## 11. Error Handling

| Scenario | Backend behaviour | Frontend display |
|---|---|---|
| No compliance data sent | Return friendly message: "Please run a compliance check first…" | Show as assistant bubble |
| Gemini API error | Catch exception, return `{ response: "AI service unavailable…" }` | Show as assistant bubble |
| HF Space cold-start (10–60s) | Normal response, just slow | Show "Thinking…" spinner; no timeout for demo |
| Network error (fetch fails) | — | Show "Error: could not reach the AI backend." |
| Empty user input | — | Disable send button / do nothing |
| GOOGLE_API_KEY not set | Agent init fails → 500 | Show generic error bubble |

---

## 12. Open Questions (Need Answers Before Coding)

| # | Question | Why it matters |
|---|---|---|
| OQ-01 | **GOOGLE_API_KEY** — Do you already have a key from aistudio.google.com, or do you need to create one? | Backend won't run without it |
| OQ-02 | **Markdown rendering** — Should assistant responses render markdown (bold, lists, tables), or display as plain text? Requires adding `react-markdown` to the frontend. | Affects dependency and JSX |
| OQ-03 | **Quick-action button labels** — Which 4–6 preset prompts do you want? Suggestions: "What failed and why?", "How do I fix the failures?", "What's the compliance score?", "Explain to a non-technical client", "What does EHE say about beams?", "Which elements need urgent attention?" | FR-17/18 |
| OQ-04 | **Navbar position** — Where should the Chat link appear? Suggested: after "Report", before "Settings" | FR-22 |
| OQ-05 | **Empty state** — If no check results are loaded in the store, should the ChatPanel (a) show a message inside the chat saying "Run a check first", or (b) hide/disable the input entirely? | US-08, FR-16 |
| OQ-06 | **Initial greeting** — Should the chat open with a welcome message from the assistant (e.g. "Hi! I'm your compliance assistant. Ask me anything about the loaded model."), or start empty? | UX |
| OQ-07 | **CF Worker proxy** — The review says to call HF Space directly for the demo. Should we also add `/api/chat` to the CF Worker? Or strictly keep it direct-to-HF for now? | Architecture |
| OQ-08 | **Styling approach** — Plain inline styles (as in the review skeleton) or use the same CSS class approach as other components in the project? | FR-08 |

---

## 13. Implementation Steps (Ordered)

1. **Get GOOGLE_API_KEY** → set in HF Space secrets + local `.env`
2. **Backend** → add `/chat` endpoint + PydanticAI agent to `backend/main.py`
3. **Test backend** → `curl` the endpoint with sample data
4. **Frontend** → create `src/features/chat/ChatPanel.tsx`
5. **Route** → create `src/routes/chat.tsx`, wire into Navbar
6. **Quick-action buttons** → add preset rows above input
7. **Polish** → error states, loading indicator, empty-state guard
8. **Deploy** → `bash backend/deploy.sh` + `npm run deploy` in frontend

---

## 14. Demo Script (Chat's "Wow Moment")

Presenter flow at demo day:
1. Upload Duplex Apartment model → run checks
2. Navigate to Chat tab
3. Click **"What failed and why?"** → AI cites specific elements with values
4. Click **"How do I fix the failures?"** → AI gives architectural advice
5. Free-form: **"Are the doors wide enough for wheelchair access?"** → AI answers with DB SUA reference
6. Free-form: **"Explain this to a non-technical client"** → AI gives plain-language summary

---

## 15. Success Criteria (Demo Day)

| Criterion | Pass |
|---|---|
| `/chat` endpoint returns an intelligent answer in < 5s | ✅ |
| ChatPanel renders in the browser at `/chat` | ✅ |
| Quick-action buttons work without typing | ✅ |
| Specific element names + values cited in answers | ✅ |
| Error state shown if backend is unreachable | ✅ |
| No raw IFC binary sent to Gemini | ✅ |

---

*End of Document — Draft v0.2*
