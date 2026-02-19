import { useState, useRef, useEffect } from "react";
import { useStore } from "../../stores/store";

type Message = { role: "user" | "assistant"; text: string };

const QUICK_ACTIONS = [
  "What failed and why?",
  "How do I fix the failures?",
  "What's the overall compliance score?",
  "Explain results to a non-technical client",
];

const HF_CHAT_URL = import.meta.env.VITE_HF_CHAT_URL || "/api/chat";

type ChatPanelProps = {
  onCollapse?: () => void;
};

export function ChatPanel({ onCollapse }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(HF_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          check_results: useStore.getState().checkResults,
          element_results: useStore.getState().elementResults.slice(0, 200).map((e) => ({
            element_id: e.element_id,
            element_name: e.element_name,
            check_status: e.check_status,
            actual_value: e.actual_value,
            required_value: e.required_value,
            comment: e.comment,
          })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: could not reach the AI backend. Make sure the HF Space is running." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <aside
      className="glass-panel-strong"
      style={{
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto auto",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "0.72rem 0.85rem", borderBottom: "1px solid var(--border)", background: "rgba(12, 18, 31, 0.44)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(50, 79, 130, 0.44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#9bd8ff", fontWeight: 700, flexShrink: 0 }}>
            AI
          </div>
          <div style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--text)" }}>Compliance Assistant</div>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7cd5ff", flexShrink: 0, boxShadow: "0 0 12px rgba(124, 213, 255, 0.85)" }} />
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="toolbar-btn"
              style={{ marginLeft: "auto", fontSize: "0.72rem", padding: "0.2rem 0.55rem" }}
              aria-label="Collapse chat assistant"
              title="Collapse chat assistant"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      {/* Message list */}
      <div
        className="chat-messages"
        style={{
          minHeight: 0,
          overflowY: "auto",
          padding: "1.12rem",
          background: "rgba(8, 12, 22, 0.55)",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
        }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              className="glass-panel"
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
                maxWidth: 260,
                lineHeight: 1.45,
                padding: "0.95rem",
              }}
            >
              Ask a question about your compliance results, or use a quick action below.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} message={m} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <div style={{ padding: "0.625rem 0.875rem", background: "rgba(38, 48, 73, 0.56)", borderRadius: "14px 14px 14px 6px", color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic", border: "1px solid var(--border)" }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div
        style={{
          padding: "0.56rem 0.7rem",
          background: "rgba(13, 18, 31, 0.56)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexWrap: "nowrap",
          gap: "0.35rem",
          overflowX: "auto",
        }}
      >
        {QUICK_ACTIONS.map((q) => (
          <QuickActionButton key={q} label={q} onClick={() => send(q)} disabled={loading} />
        ))}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: "0.65rem 0.7rem",
          background: "rgba(13, 19, 32, 0.62)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: "0.5rem",
          alignItems: "stretch",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about compliance results..."
          rows={1}
          disabled={loading}
          style={{
            flex: 1,
            background: "rgba(31, 43, 67, 0.44)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "0.625rem 0.875rem",
            color: "var(--text)",
            fontSize: "0.875rem",
            minHeight: 42,
            maxHeight: 88,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim()
              ? "rgba(80, 97, 130, 0.62)"
              : "linear-gradient(145deg, rgba(88, 149, 255, 0.96), rgba(56, 106, 247, 0.92))",
            color: "white",
            border: "1px solid rgba(183, 214, 255, 0.5)",
            borderRadius: 999,
            padding: "0.625rem 1rem",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            transition: "background 180ms ease-out, transform 180ms ease-out",
            boxShadow: loading || !input.trim() ? "none" : "0 10px 24px rgba(62, 121, 255, 0.35)",
            minHeight: 42,
            minWidth: 78,
            alignSelf: "stretch",
          }}
        >
          Send
        </button>
      </div>
    </aside>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", animation: "chatIn 250ms ease-out" }}>
        <div style={{
          maxWidth: "75%",
          padding: "0.625rem 1rem",
          background: "linear-gradient(145deg, rgba(89, 151, 255, 0.95), rgba(60, 109, 250, 0.92))",
          border: "1px solid rgba(190, 220, 255, 0.52)",
          color: "white",
          borderRadius: "18px 18px 8px 18px",
          fontSize: "0.875rem",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", animation: "chatIn 250ms ease-out" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(53, 78, 127, 0.45)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#9bd8ff", fontWeight: 700 }}>
        AI
      </div>
      <div style={{
        maxWidth: "80%",
        padding: "0.625rem 0.875rem",
        background: "rgba(37, 50, 74, 0.56)",
        border: "1px solid var(--border)",
        borderRadius: "8px 14px 14px 14px",
        fontSize: "0.875rem",
        lineHeight: 1.6,
        color: "var(--text)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        <MarkdownText text={message.text} />
      </div>
    </div>
  );
}

function QuickActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="quick-action-btn"
    >
      {label}
    </button>
  );
}

// Minimal markdown renderer: bold, inline code, line breaks
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          <InlineParsed text={line} />
        </span>
      ))}
    </>
  );
}

function InlineParsed({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} style={{ background: "rgba(35, 49, 74, 0.7)", color: "#9fd6ff", padding: "1px 5px", borderRadius: 6, fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid var(--border)" }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
