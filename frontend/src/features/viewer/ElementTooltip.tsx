import { useStore } from "../../stores/store";

const STATUS_COLORS: Record<string, string> = {
  pass: "#22c55e",
  fail: "#ef4444",
  warning: "#f59e0b",
  blocked: "#6b7280",
  log: "#9ca8c9",
};

export function ElementTooltip() {
  const selectedIds = useStore((s) => s.selectedIds);
  const elementResults = useStore((s) => s.elementResults);
  const clearSelection = useStore((s) => s.clearSelection);

  if (selectedIds.size === 0) return null;

  const guid = [...selectedIds][0];
  const matches = elementResults.filter((er) => er.element_id === guid);

  return (
    <div
      className="glass-panel-strong"
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        maxWidth: 340,
        maxHeight: "60%",
        overflowY: "auto",
        padding: "0.75rem",
        fontSize: "0.8rem",
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
          {matches[0]?.element_name || matches[0]?.element_type || "Element"}
        </span>
        <button
          onClick={clearSelection}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "1rem",
            lineHeight: 1,
            padding: "0 0.25rem",
          }}
        >
          x
        </button>
      </div>

      {matches.length === 0 && (
        <div style={{ color: "var(--text-muted)" }}>
          <div style={{ marginBottom: "0.25rem" }}>{guid}</div>
          <div>No check results for this element.</div>
        </div>
      )}

      {matches.map((er, i) => (
        <div
          key={i}
          style={{
            padding: "0.5rem",
            marginBottom: i < matches.length - 1 ? "0.4rem" : 0,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: STATUS_COLORS[er.check_status] || "#6b7280",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.03em" }}>
              {er.check_status}
            </span>
          </div>

          {er.element_name_long && (
            <Row label="Name" value={er.element_name_long} />
          )}
          {er.actual_value && (
            <Row label="Actual" value={er.actual_value} />
          )}
          {er.required_value && (
            <Row label="Required" value={er.required_value} />
          )}
          {er.comment && (
            <div style={{ marginTop: "0.25rem", color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 1.4 }}>
              {er.comment}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.76rem", lineHeight: 1.4 }}>
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{label}:</span>
      <span className="report-value-mono" style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}
