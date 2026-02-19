const colors: Record<string, string> = {
  pass: "var(--success)",
  fail: "var(--danger)",
  error: "var(--danger)",
  warning: "var(--warning)",
  blocked: "var(--text-muted)",
  log: "var(--accent)",
  running: "var(--accent)",
  pending: "var(--text-muted)",
  done: "var(--success)",
  unknown: "var(--text-muted)",
};

export function StatusBadge({ status }: { status: string }) {
  const color = colors[status] || "var(--text-muted)";
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600, background: `${color}22`, color, textTransform: "uppercase" }}>{status}</span>;
}
