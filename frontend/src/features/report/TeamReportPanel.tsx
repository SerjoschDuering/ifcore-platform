import React, { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type { CheckResult, ElementResult } from "../../lib/types";

/* ───────────────────────────────────────────────────────────────────────────
   Category → team mapping.
   Each top-level folder groups one team's checks under a human-readable title.
   ─────────────────────────────────────────────────────────────────────────── */
export const CATEGORIES: { label: string; icon: string; team: string }[] = [
  { label: "Habitability",        icon: "🏠", team: "Mastodonte" },
  { label: "Energy Consumption",  icon: "⚡", team: "lux-ai" },
  { label: "Fire Compliance",     icon: "🔥", team: "team-d" },
  { label: "Structure",           icon: "🏗️", team: "structures" },
  { label: "Lighting & Facade",   icon: "💡", team: "team-e" },
];

type Props = {
  checks: CheckResult[];
  elementResults: ElementResult[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   Top-level: Category folder  (Level 1)
   ═══════════════════════════════════════════════════════════════════════════ */
export function CategoryFolder({
  label,
  icon,
  checks,
  elementResults,
}: { label: string; icon: string } & Props) {
  const [open, setOpen] = useState(false);

  const total   = checks.length;
  const passed  = checks.filter((c) => c.status === "pass").length;
  const failed  = checks.filter((c) => c.status === "fail").length;
  const errors  = checks.filter((c) => c.status === "error").length;
  const unknown = checks.filter((c) => c.status === "unknown").length;

  const overallStatus =
    total === 0 ? "blocked" :
    errors > 0  ? "error" :
    failed > 0  ? "fail" :
    unknown > 0 ? "unknown" :
    "pass";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Category header — Level 1 */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0.9rem 1.25rem",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Chevron open={open} />
          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>{label}</span>
          <StatusBadge status={overallStatus} />
        </div>
        <div style={{ display: "flex", gap: "0.85rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          <span>{total} checks</span>
          {passed  > 0 && <span style={{ color: "var(--success)" }}>{passed} pass</span>}
          {failed  > 0 && <span style={{ color: "var(--danger)"  }}>{failed} fail</span>}
          {errors  > 0 && <span style={{ color: "var(--danger)"  }}>{errors} error</span>}
          {unknown > 0 && <span style={{ color: "var(--text-muted)" }}>{unknown} unknown</span>}
        </div>
      </button>

      {/* Expanded: check rows — Level 2 */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {checks.length === 0 ? (
            <p style={{ padding: "0.75rem 1.25rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No checks registered for this category.
            </p>
          ) : (
            checks.map((cr) => (
              <CheckRow
                key={cr.id}
                check={cr}
                elements={elementResults.filter((e) => e.check_result_id === cr.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mid-level: individual check  (Level 2)
   ═══════════════════════════════════════════════════════════════════════════ */
function CheckRow({ check, elements }: { check: CheckResult; elements: ElementResult[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasElements = elements.length > 0;

  return (
    <>
      <button
        onClick={() => hasElements && setExpanded(!expanded)}
        style={{
          all: "unset",
          display: "grid",
          gridTemplateColumns: "1.5rem 1fr auto auto",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
          padding: "0.55rem 1.25rem 0.55rem 2.25rem",
          borderBottom: "1px solid var(--border)",
          cursor: hasElements ? "pointer" : "default",
          background: "var(--surface)",
          boxSizing: "border-box",
        }}
      >
        <span style={{ visibility: hasElements ? "visible" : "hidden" }}>
          <Chevron open={expanded} size={10} />
        </span>
        <span style={{ fontSize: "0.9rem", textTransform: "capitalize" }}>
          {check.check_name.replace("check_", "").replace(/_/g, " ")}
        </span>
        <StatusBadge status={check.status} />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 150, textAlign: "right" }}>
          {check.summary}
        </span>
      </button>

      {/* Element rows — Level 3 */}
      {expanded &&
        elements.map((el) => (
          <ElementRow key={el.id} el={el} />
        ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Bottom-level: individual element  (Level 3)
   ═══════════════════════════════════════════════════════════════════════════ */
function ElementRow({ el }: { el: ElementResult }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5rem 6px 1fr auto auto",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.3rem 1.25rem 0.3rem 3.75rem",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        fontSize: "0.8rem",
      }}
    >
      <span />
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dotColor(el.check_status),
          display: "inline-block",
        }}
      />
      <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {el.element_name_long || el.element_name || el.element_type || "—"}
      </span>
      <StatusBadge status={el.check_status} />
      <span
        style={{
          color: "var(--text-muted)",
          maxWidth: 320,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "right",
        }}
      >
        {el.actual_value && el.required_value
          ? `${el.actual_value} / ${el.required_value}`
          : el.comment || el.actual_value || el.required_value || ""}
      </span>
    </div>
  );
}

/* ── tiny helpers ────────────────────────────────────────────────────────── */

function Chevron({ open, size = 12 }: { open: boolean; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: `${size}px`,
        lineHeight: 1,
        color: "var(--text-muted)",
        transition: "transform 150ms ease",
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
      }}
    >
      ▶
    </span>
  );
}

function dotColor(status: string): string {
  const map: Record<string, string> = {
    pass: "var(--success)",
    fail: "var(--danger)",
    warning: "var(--warning)",
    blocked: "var(--text-muted)",
    log: "var(--accent)",
    error: "var(--danger)",
  };
  return map[status] || "var(--text-muted)";
}
