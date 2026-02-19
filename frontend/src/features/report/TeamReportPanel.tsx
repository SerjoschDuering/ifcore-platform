import React, { useState, useMemo } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { statusToHex } from "../../lib/constants";
import { useStore } from "../../stores/store";
import type { CheckResult, ElementResult } from "../../lib/types";

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

  const { passed, failed, errors, unknown } = useMemo(() => {
    let passed = 0, failed = 0, errors = 0, unknown = 0;
    for (const c of checks) {
      if (c.status === "pass") passed++;
      else if (c.status === "fail") failed++;
      else if (c.status === "error") errors++;
      else if (c.status === "unknown") unknown++;
    }
    return { passed, failed, errors, unknown };
  }, [checks]);

  const total = checks.length;

  // Pre-group elements by check ID — O(n) instead of O(n*m)
  const elementsByCheck = useMemo(() => {
    const map = new Map<string, ElementResult[]>();
    for (const el of elementResults) {
      const list = map.get(el.check_result_id);
      if (list) list.push(el);
      else map.set(el.check_result_id, [el]);
    }
    return map;
  }, [elementResults]);

  const overallStatus =
    total === 0 ? "blocked" :
    errors > 0  ? "error" :
    failed > 0  ? "fail" :
    unknown > 0 ? "unknown" :
    "pass";

  function handleToggle() {
    if (open) {
      useStore.getState().clearHighlights();
    }
    setOpen(!open);
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Category header — Level 1 */}
      <button
        onClick={handleToggle}
        style={folderHeaderStyle}
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
                elements={elementsByCheck.get(cr.id) || emptyElements}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

const emptyElements: ElementResult[] = [];

const folderHeaderStyle: React.CSSProperties = {
  all: "unset",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "0.9rem 1.25rem",
  cursor: "pointer",
  boxSizing: "border-box",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Mid-level: individual check  (Level 2)
   ═══════════════════════════════════════════════════════════════════════════ */
function CheckRow({ check, elements }: { check: CheckResult; elements: ElementResult[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasElements = elements.length > 0;

  const elementSummary = useMemo(() => {
    if (!hasElements) return check.summary;
    let pass = 0, fail = 0;
    for (const e of elements) {
      if (e.check_status === "pass") pass++;
      else if (e.check_status === "fail") fail++;
    }
    return `${elements.length} element${elements.length !== 1 ? "s" : ""} (${pass} pass, ${fail} fail)`;
  }, [elements, hasElements, check.summary]);

  function handleClick() {
    if (!hasElements) return;
    const { setHighlightColorMap, selectElements, setViewerVisible } = useStore.getState();
    const map: Record<string, string> = {};
    const ids: string[] = [];
    for (const el of elements) {
      if (!el.element_id) continue;
      map[el.element_id] = statusToHex(el.check_status);
      ids.push(el.element_id);
    }
    if (ids.length === 0) {
      setExpanded(!expanded);
      return;
    }
    setHighlightColorMap(map);
    selectElements(ids);
    setViewerVisible(true);
    setExpanded(!expanded);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="report-check-row"
        style={checkRowStyle}
      >
        <span style={{ visibility: hasElements ? "visible" : "hidden" }}>
          <Chevron open={expanded} size={10} />
        </span>
        <span style={{ fontSize: "0.9rem", textTransform: "capitalize" }}>
          {check.check_name.replace("check_", "").replace(/_/g, " ")}
        </span>
        <StatusBadge status={check.status} />
        <span className="report-value-mono" style={{ color: "var(--text-muted)", minWidth: 150, textAlign: "right" }}>
          {elementSummary}
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

const checkRowStyle: React.CSSProperties = {
  all: "unset",
  display: "grid",
  gridTemplateColumns: "1.5rem 1fr auto auto",
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
  padding: "0.55rem 1.25rem 0.55rem 2.25rem",
  borderBottom: "1px solid var(--border)",
  background: "var(--surface)",
  boxSizing: "border-box",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Bottom-level: individual element  (Level 3)
   ═══════════════════════════════════════════════════════════════════════════ */
function ElementRow({ el }: { el: ElementResult }) {
  function handleClick() {
    if (!el.element_id) return;
    const { highlightColorMap, setHighlightColorMap, selectElements, setViewerVisible } = useStore.getState();
    setHighlightColorMap({ ...highlightColorMap, [el.element_id]: statusToHex(el.check_status) });
    selectElements([el.element_id]);
    setViewerVisible(true);
  }

  return (
    <div
      onClick={handleClick}
      className="report-element-row"
      style={elementRowStyle}
    >
      <span />
      <span style={dotStyle(el.check_status)} />
      <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {el.element_name_long || el.element_name || el.element_type || "\u2014"}
      </span>
      <StatusBadge status={el.check_status} />
      <span
        className="report-value-mono"
        style={{ color: "var(--text-muted)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}
      >
        {el.actual_value && el.required_value
          ? `${el.actual_value} / ${el.required_value}`
          : el.comment || el.actual_value || el.required_value || ""}
      </span>
    </div>
  );
}

const elementRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5rem 6px 1fr auto auto",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.3rem 1.25rem 0.3rem 3.75rem",
  background: "var(--bg)",
  borderBottom: "1px solid var(--border)",
  fontSize: "0.8rem",
};

function dotStyle(status: string): React.CSSProperties {
  return { width: 6, height: 6, borderRadius: "50%", background: dotColor(status), display: "inline-block" };
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
