# Product Requirement Document
# AI Chat Interface — IFCore Compliance Platform

**Document status:** Draft v0.1
**Date:** 2026-02-19
**Author:** IFCore Team
**Reviewers:** TBD

---

## 1. Executive Summary

The IFCore platform currently performs automated IFC building-model compliance checks and displays results in a dashboard. Users must manually interpret raw pass/fail tables to understand what failed, why, and how to fix it.

This PRD defines the requirements for an **AI Chat Interface** — a conversational assistant embedded in the platform that lets users ask natural-language questions about compliance results, IFC model data, applicable regulations, and remediation steps.

---

## 2. Problem Statement

### 2.1 Current Pain Points

| Pain Point | Impact |
|---|---|
| Compliance results are displayed as raw tables | Engineers must manually interpret hundreds of element-level results |
| No plain-language explanations of failures | Non-technical stakeholders (PMs, clients) cannot read the output |
| Regulation references are code numbers only (Art. 69, EHE…) | Users must look up regulation text externally |
| No remediation guidance | Users know *what* failed but not *how* to fix it |
| No way to query the IFC model interactively | Property lookups require opening the model in separate software |

### 2.2 Opportunity

A conversational interface on top of the existing compliance data can:
- Turn hundreds of check results into a one-line summary on demand
- Answer specific questions ("which beams failed?") without manual filtering
- Explain regulations and suggest concrete fixes
- Make the platform accessible to non-engineers

---

## 3. Goals

### 3.1 Primary Goals

1. **Replace the stub** — The current "Agent Chat" tab returns a hardcoded 4-line summary. Replace it with a genuinely useful assistant.
2. **Data-grounded answers** — All responses must be grounded in the loaded project's actual check results and IFC data, not hallucinated.
3. **Regulation-aware** — The assistant must know Spanish and Catalan building code thresholds (EHE, CTE DB HE, DB SUA, Decree 141/2012) and reference them accurately.
4. **Graceful degradation** — If no LLM API key is configured, fall back to a smart rule-based mode that handles the most common queries.

### 3.2 Non-Goals (Out of Scope for v1)

- Real-time 3D model editing via chat
- Generating new IFC files from chat instructions
- Regulatory document retrieval (RAG) — planned for a future phase
- Multi-project history search
- Audit logging to a database

---

## 4. Target Users

| User | Primary Need |
|---|---|
| **Structural Engineer** | Quickly find which elements failed a specific structural check and by how much |
| **Architect** | Understand accessibility compliance and what needs to change in the design |
| **Project Manager** | Get a plain-language summary to share with clients or regulators |
| **Regulator / Inspector** | Verify specific compliance claims without interpreting raw data |

---

## 5. User Stories

### Core Stories (Must Have)

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-01 | Structural engineer | Ask "which beams failed the depth check?" | I see a filtered list with actual vs. required values |
| US-02 | Project manager | Ask "give me an overall compliance summary" | I get a score, counts, and team breakdown in one message |
| US-03 | Architect | Ask "how can I fix the failing wall thickness?" | I get a specific remediation suggestion referencing the regulation |
| US-04 | Any user | Ask a question before uploading a model | The assistant tells me to upload a model first |
| US-05 | Any user | Ask about a regulation | I get a plain-language explanation with the threshold value |
| US-06 | Engineer | Click a quick-action button like "Show failed elements" | The assistant responds without me having to type |

### Extended Stories (Should Have)

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-07 | Engineer | Ask follow-up questions in context | I don't have to repeat project name each time |
| US-08 | Architect | Ask "what materials are used in the slabs?" | I get an answer from the IFC model data |
| US-09 | PM | Ask "write a client-ready compliance statement" | I get formal text I can copy into a report |
| US-10 | Engineer | See the response appear word by word | I don't wait 8 seconds staring at a blank screen |

### Future Stories (Could Have — Phase 3+)

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-11 | Engineer | Click an element reference in chat | The 3D viewer highlights that element |
| US-12 | PM | See how many API tokens were used | I can monitor cost |
| US-13 | Regulator | See chat interactions in an audit log | I have a compliance trail |

---

## 6. Functional Requirements

### 6.1 Compliance Results Q&A

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-01 | Return overall compliance score (%) + pass/fail/warning counts on request | Must Have |
| FR-02 | Filter and return results by team (Walls, Beams, Columns, Slabs, etc.) | Must Have |
| FR-03 | Filter and return results by check_status (pass, fail, warning, blocked, log) | Must Have |
| FR-04 | Return element-level detail including actual vs. required values | Must Have |
| FR-05 | Rank failures by severity / deviation from required value | Should Have |
| FR-06 | Compare results across teams | Should Have |

### 6.2 IFC Model Exploration

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-07 | Count elements by IFC entity type | Should Have |
| FR-08 | Look up a specific property of a named element | Should Have |
| FR-09 | Return the IFC schema version of the loaded model | Should Have |
| FR-10 | List materials used in a given element category | Could Have |
| FR-11 | Filter elements by IfcBuildingStorey | Could Have |

### 6.3 Regulation Guidance

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-12 | Explain what a named regulation (Art. 69, EHE, DB SUA…) requires | Must Have |
| FR-13 | Return specific threshold values with regulation reference | Must Have |
| FR-14 | Suggest concrete remediation steps for failing elements | Must Have |
| FR-15 | Clarify jurisdiction (Spain / Catalonia / Metropolitan) on request | Should Have |

### 6.4 Contextual Awareness

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-16 | Assistant is automatically aware of the currently loaded project | Must Have |
| FR-17 | Assistant has access to all CheckResult and ElementResult data | Must Have |
| FR-18 | Session memory — follow-up questions reference prior context | Must Have |
| FR-19 | Guard: if no model is loaded, prompt user to upload first | Must Have |
| FR-20 | If checks errored, explain what went wrong | Should Have |

### 6.5 Quick Actions

| REQ-ID | Requirement | Priority |
|---|---|---|
| FR-21 | Display clickable quick-action buttons with pre-built prompts | Must Have |
| FR-22 | Buttons organised by category: Summary, Failures, Regulations, Remediation | Should Have |
| FR-23 | Quick-action suggestions update based on loaded results | Could Have |

---

## 7. Non-Functional Requirements

| REQ-ID | Requirement | Target |
|---|---|---|
| NFR-01 | Response time — rule-based / data lookup | < 1 second |
| NFR-02 | Response time — LLM response (first token) | < 3 seconds |
| NFR-03 | Response accuracy for compliance data queries | > 90% factually correct |
| NFR-04 | Fallback coverage — rule-based mode handles common queries | > 70% without LLM |
| NFR-05 | Unhandled error rate | < 2% of queries |
| NFR-06 | API keys never logged or exposed in the UI | Required |
| NFR-07 | IFC model binary data never sent to external LLM | Required |
| NFR-08 | Input sanitisation against prompt injection | Required |

---

## 8. LLM Backend Requirements

### 8.1 Provider Support

The system must support at least two providers, selectable via environment variables:

| Provider | Model | Config Key |
|---|---|---|
| Anthropic | claude-opus-4-6 (default) | `ANTHROPIC_API_KEY` |
| OpenAI | gpt-4o | `OPENAI_API_KEY` |
| Fallback | Rule-based (no key needed) | — |

Provider selection: auto-detect based on which key is present in the environment. If both are set, prefer the value of `CHAT_PROVIDER`.

### 8.2 System Prompt Requirements

The system prompt must include:
- Role definition: structural compliance expert for IFCore
- Regulation reference table: EHE, CTE DB HE, DB SUA, Decree 141/2012, Art. 69/128
- Threshold values from `config.py::THRESHOLDS`
- Response format guidance (markdown, tables, status labels)
- 3–5 few-shot Q&A examples

### 8.3 Context Injection

For each request, the assistant must receive:
- Project name, file, schema version, region
- Overall score + check counts
- Team breakdown (summary_by_team)
- Failed / warning element details (up to `CHAT_MAX_CONTEXT_ELEMENTS`, default 200)
- Check names and regulation references

Large models (> 200 elements) must be summarised by team/status rather than listing every element, to stay within the context window.

---

## 9. Configuration

All settings live in `config.py` and can be overridden via environment variables:

| Setting | Description | Default |
|---|---|---|
| `CHAT_ENABLED` | Enable / disable the chat tab | `True` |
| `CHAT_PROVIDER` | Provider: `auto` \| `anthropic` \| `openai` \| `fallback` | `auto` |
| `CHAT_MODEL_ANTHROPIC` | Anthropic model ID | `claude-opus-4-6` |
| `CHAT_MODEL_OPENAI` | OpenAI model ID | `gpt-4o` |
| `CHAT_TEMPERATURE` | LLM temperature | `0.2` |
| `CHAT_MAX_TOKENS` | Max response tokens | `2048` |
| `CHAT_MAX_CONTEXT_ELEMENTS` | Max elements included in LLM context | `200` |
| `CHAT_FALLBACK_MODE` | Use rule-based fallback when no API key | `True` |

---

## 10. UI Requirements

### 10.1 Chat Widget

- Streaming output — responses appear token by token
- Markdown rendering (bold, lists, tables, code blocks)
- Scrollable history within the session
- Clear Chat button — resets conversation, keeps project loaded
- Status badge showing which LLM provider is active (or "Basic Mode")

### 10.2 Quick Action Buttons

Pre-built prompts displayed below the chat input, grouped by category:

| Category | Example Button Label |
|---|---|
| Summary | "Overall compliance summary" |
| Failures | "Which elements failed and why?" |
| Team | "Show all wall check results" |
| Regulations | "What does EHE say about beams?" |
| Remediation | "How can I fix the failures?" |
| Report | "Write a client compliance statement" |

### 10.3 Error Messages (copy)

| Scenario | Message |
|---|---|
| No model loaded | "Please upload and run an IFC check first so I have data to reason about." |
| No API key | "AI chat requires an API key. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to your `.env` file. Running in basic mode." |
| API error | "I'm having trouble connecting to the AI service. Here's what I can tell you from the data directly…" (falls back to rule-based) |
| Rate limit | "API rate limit reached. Please wait a moment and try again." |
| Timeout | "The request timed out. Let me try a shorter answer…" (retry with reduced context) |
| Context too large | Auto-summarise; note "Some detail was omitted to fit the context window." |

---

## 11. Architecture Overview

```
Gradio UI (Agent Chat Tab)
├── gr.Chatbot (streaming, messages format)
├── gr.Textbox (user input)
└── Quick Action Buttons (gr.Button × N)
        │
        ▼
   chat_agent.py
   ├── build_project_context(project) → str
   │     Serialises Project + CheckResults + ElementResults
   │     Applies CHAT_MAX_CONTEXT_ELEMENTS truncation
   │
   ├── rule_based_response(message, project) → str
   │     Keyword-matching fallback (no API key required)
   │
   └── stream_response(message, history, project) → AsyncIterator[str]
         Provider selection:
         ├── AnthropicProvider  → anthropic SDK, claude-opus-4-6
         ├── OpenAIProvider     → openai SDK, gpt-4o
         └── FallbackProvider   → rule_based_response()
```

**Key constraint:** IFC binary data is never sent to the LLM. Only structured, text-format summaries derived from the already-parsed model are injected into the prompt.

---

## 12. Implementation Phases

### Phase 1 — Rule-Based Enhancement *(no LLM required)*
- Replace stub with keyword-matching handlers for: summary, team drill-down, element queries, status filter
- Add quick-action buttons to the UI
- Improve chat styling to match IFCore branding
- Add "no model loaded" guard

### Phase 2 — LLM Integration *(core AI)*
- `chat_agent.py` module: context builder, system prompt, provider abstraction
- Streaming responses via Gradio generator
- Fallback to Phase 1 mode when no API key
- Config additions in `config.py`
- Dependencies: `anthropic` and/or `openai` added to `requirements.txt`

### Phase 3 — Advanced Features
- Query classification (intent detection, entity extraction)
- Dynamic quick-action suggestions based on loaded results
- Inline status pills (PASS/FAIL/WARN) rendered in responses
- Element-to-3D-Viewer cross-linking
- Token usage display

### Phase 4 — RAG & Knowledge Base *(future)*
- Embed full regulation texts into a vector store
- Index IFC schema documentation
- Multi-project history search
- Audit logging

---

## 13. Dependencies

### New Packages Required

| Package | Purpose | Phase |
|---|---|---|
| `anthropic` | Anthropic Claude API client | 2 |
| `openai` | OpenAI GPT-4o client (alternative provider) | 2 |
| `tiktoken` | Token counting for context truncation | 2 |
| `python-dotenv` | Already installed — `.env` key management | — |

### Existing Components Used

| Component | File | Usage |
|---|---|---|
| `Project` dataclass | `models.py` | All compliance data |
| `CheckResult` / `ElementResult` | `models.py` | Element-level results |
| `run_compliance_check()` | `orchestrator.py` | Re-run checks if needed |
| `THRESHOLDS` / `REGIONS` | `config.py` | Regulation threshold values |
| `_current_project` global | `app.py` | Currently loaded project state |

---

## 14. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-01 | Primary LLM provider: Anthropic Claude or OpenAI GPT-4o? | Product | Open |
| OQ-02 | Use PydanticAI as provider abstraction layer, or direct SDK calls? | Engineering | Open |
| OQ-03 | Should the HF Space expose the chat API, or is it Gradio-only? | Architecture | Open |
| OQ-04 | Which quick-action buttons are shown before a model is loaded vs. after? | Design | Open |
| OQ-05 | Token budget per query — what is the cost ceiling per user session? | Product | Open |
| OQ-06 | Is audit logging (Phase 4) a regulatory requirement or a nice-to-have? | Legal / Product | Open |

---

## 15. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Response accuracy (compliance data) | > 90% correct | Manual eval on 50 test queries |
| LLM first-token time | < 3 seconds | Logged at handler level |
| Rule-based fallback coverage | > 70% of common queries | Test suite against query set |
| Unhandled error rate | < 2% | Error logs |
| User interaction rate | > 60% of sessions use chat after running checks | Gradio analytics |

---

*End of Document — Draft v0.1*
