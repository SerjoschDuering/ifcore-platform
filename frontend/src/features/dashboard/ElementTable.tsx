import type { CheckResult, ElementResult } from "../../lib/types";
import { statusToHex } from "../../lib/constants";

type ElementTableProps = {
  elementResults: ElementResult[];
  checkResults: CheckResult[];
  selectedCheckId: string | null;
};

export function ElementTable({ elementResults, checkResults, selectedCheckId }: ElementTableProps) {
  const rows = selectedCheckId
    ? elementResults.filter((e) => e.check_result_id === selectedCheckId)
    : elementResults;

  const checkNameMap = new Map(checkResults.map((c) => [c.id, c.check_name]));
  const selectedCheck = selectedCheckId ? checkResults.find((c) => c.id === selectedCheckId) : null;

  if (rows.length === 0 && !selectedCheckId) return null;

  return (
    <div style={{
      background: "rgba(20, 28, 46, 0.42)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 6px 18px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 10px",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
          {selectedCheck ? selectedCheck.check_name : "Elements"}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{rows.length} rows</span>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>
          No element data for this check.
        </div>
      ) : (
        <div style={{ overflowY: "auto", maxHeight: 220 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {["Check", "Element", "Type", "Status", "Actual", "Required", "Comment"].map((h) => (
                  <th key={h} style={{
                    padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)",
                    background: "rgba(12, 18, 30, 0.5)", borderBottom: "1px solid var(--border)",
                    position: "sticky", top: 0, zIndex: 1,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const statusColor = statusToHex(row.check_status);
                return (
                  <tr key={row.id} style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    transition: "background 150ms ease",
                  }}>
                    <td style={{ ...td, color: "var(--text-muted)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {checkNameMap.get(row.check_result_id) ?? "—"}
                    </td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 10 }}>
                      {row.element_name ?? row.element_id ?? "—"}
                    </td>
                    <td style={{ ...td, color: "var(--text-muted)" }}>{row.element_type ?? "—"}</td>
                    <td style={td}>
                      <span style={{
                        background: `${statusColor}18`,
                        color: statusColor,
                        border: `1px solid ${statusColor}33`,
                        borderRadius: 6,
                        padding: "1px 6px",
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>
                        {row.check_status}
                      </span>
                    </td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 10 }}>{row.actual_value ?? "—"}</td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 10 }}>{row.required_value ?? "—"}</td>
                    <td style={{ ...td, color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.comment ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const td: React.CSSProperties = {
  padding: "5px 8px",
  color: "var(--text)",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  verticalAlign: "middle",
};
