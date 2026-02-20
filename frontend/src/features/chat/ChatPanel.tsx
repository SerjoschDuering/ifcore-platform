import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useStore } from "../../stores/store";
import { sendChat } from "../../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  role: "user" | "assistant";
  content: string;
};

// ---------------------------------------------------------------------------
// Minimal markdown renderer (bold, code, links, bullets, line breaks)
// Content comes from our own AI model, so dangerouslySetInnerHTML is safe here.
// ---------------------------------------------------------------------------

function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    const isBullet = /^[-*•]\s+/.test(line);

    if (!isBullet && inList) {
      out.push("</ul>");
      inList = false;
    }

    // Escape HTML, then apply inline formatting
    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const inlined = escaped
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // `inline code`
      .replace(
        /`([^`]+)`/g,
        '<code style="background:#0f1117;padding:1px 5px;border-radius:3px;font-size:0.82em;font-family:monospace">$1</code>',
      )
      // [text](url) — only https? links to prevent XSS
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent);word-break:break-all">$1</a>',
      );

    if (isBullet) {
      if (!inList) {
        out.push('<ul style="margin:0.25rem 0 0.25rem 1.1rem;padding:0">');
        inList = true;
      }
      const content = inlined.replace(/^[-*•]\s+/, "");
      out.push(`<li style="margin-bottom:0.15rem">${content}</li>`);
    } else if (line.trim() === "") {
      out.push('<div style="height:0.4rem"></div>');
    } else {
      out.push(`<div>${inlined}</div>`);
    }
  }

  if (inList) out.push("</ul>");
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Quick action presets
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  "What failed and why?",
  "How do I fix the failures?",
  "What's the overall compliance score?",
  "Explain results to a non-technical client",
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const checkResults = useStore((s) => s.checkResults);
  const elementResults = useStore((s) => s.elementResults);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChat(trimmed, checkResults, elementResults);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `**Error:** ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  // ---------------------------------------------------------------------------
  // Floating toggle button (visible when panel is closed)
  // ---------------------------------------------------------------------------
  const toggleBtn = !open && (
    <button
      onClick={() => setOpen(true)}
      title="Open AI compliance chat"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--accent)",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontSize: "0.75rem",
        fontWeight: 700,
        zIndex: 200,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      AI
    </button>
  );

  // ---------------------------------------------------------------------------
  // Panel
  // ---------------------------------------------------------------------------
  const panel = open && (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 380,
        height: "100vh",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              background: "var(--accent)",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            AI
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Compliance Chat
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "1.2rem",
            lineHeight: 1,
            padding: "0 0.25rem",
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {/* Quick actions — shown only before first message */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Quick actions
            </p>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => submit(action)}
                disabled={loading}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                padding: "0.6rem 0.875rem",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: msg.role === "user" ? "var(--accent)" : "var(--bg)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                fontSize: "0.82rem",
                lineHeight: 1.55,
                color: "var(--text)",
              }}
            >
              {msg.role === "user" ? (
                <span>{msg.content}</span>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "0.6rem 0.875rem",
                borderRadius: "12px 12px 12px 2px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
              }}
            >
              Thinking…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          padding: "0.75rem",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your compliance results…"
          rows={2}
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: "0.82rem",
            padding: "0.5rem 0.625rem",
            resize: "none",
            fontFamily: "inherit",
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={() => submit(input)}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ alignSelf: "flex-end", padding: "0.5rem 0.875rem", fontSize: "0.82rem" }}
        >
          Send
        </button>
      </div>
    </div>
  );

  return (
    <>
      {toggleBtn}
      {panel}
    </>
  );
}
