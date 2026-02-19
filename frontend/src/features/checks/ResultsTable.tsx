import React, { useState } from "react";
import { useStore } from "../../stores/store";
import { StatusBadge } from "../../components/StatusBadge";

export function ResultsTable() {
  const checkResults = useStore((s) => s.checkResults);
  const elementResults = useStore((s) => s.elementResults);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (checkResults.length === 0) return null;

  return (
    <div style={{ marginTop: "1rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Check</th>
            <th style={{ padding: "0.5rem" }}>Team</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Summary</th>
          </tr>
        </thead>
        <tbody>
          {checkResults.map((cr) => {
            const elements = elementResults.filter((er) => er.check_result_id === cr.id);
            const isExpanded = expandedId === cr.id;
            return (
              <React.Fragment key={cr.id}>
                <tr onClick={() => setExpandedId(isExpanded ? null : cr.id)} style={{ borderBottom: "1px solid var(--border)", cursor: elements.length > 0 ? "pointer" : "default" }}>
                  <td style={{ padding: "0.5rem" }}>{cr.check_name.replace("check_", "").replace(/_/g, " ")}</td>
                  <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{cr.team}</td>
                  <td style={{ padding: "0.5rem" }}><StatusBadge status={cr.status} /></td>
                  <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{cr.summary}</td>
                </tr>
                {isExpanded && elements.map((el) => (
                  <tr key={el.id} style={{ background: "var(--bg)" }}>
                    <td style={{ padding: "0.25rem 0.5rem 0.25rem 2rem", fontSize: "0.875rem" }}>
                      {el.element_name_long || el.element_name}
                    </td>
                    <td style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>{el.element_type}</td>
                    <td style={{ padding: "0.25rem 0.5rem" }}><StatusBadge status={el.check_status} /></td>
                    <td style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {el.actual_value && el.required_value
                        ? `${el.actual_value} / ${el.required_value}`
                        : el.actual_value || el.required_value || ""}
                      {el.comment ? ` — ${el.comment}` : ""}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
