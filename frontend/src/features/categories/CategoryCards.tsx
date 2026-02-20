import { useMemo } from "react";
import { useStore } from "../../stores/store";
import { CATEGORIES, getCategory } from "../../lib/constants";
import type { CheckResult } from "../../lib/types";

type CategoryStats = { pass: number; fail: number; total: number; hasRunning: boolean };

function computeCategoryStats(checkResults: CheckResult[]): Map<string, CategoryStats> {
  const stats = new Map<string, CategoryStats>();
  for (const cat of CATEGORIES) stats.set(cat.id, { pass: 0, fail: 0, total: 0, hasRunning: false });
  for (const cr of checkResults) {
    const cat = getCategory(cr.team);
    if (!cat) continue;
    const s = stats.get(cat.id)!;
    s.total += 1;
    if (cr.status === "pass") s.pass += 1;
    else if (cr.status === "fail" || cr.status === "error") s.fail += 1;
    else if (cr.status === "running") s.hasRunning = true;
  }
  return stats;
}

export function CategoryCards() {
  const checkResults = useStore((s) => s.checkResults);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const stats = useMemo(() => computeCategoryStats(checkResults), [checkResults]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {CATEGORIES.map((cat) => {
        const s = stats.get(cat.id) ?? { pass: 0, fail: 0, total: 0, hasRunning: false };
        const isActive = selectedCategory === cat.id;
        const passRate = s.total > 0 ? s.pass / s.total : 0;

        let statusLabel = "";
        let statusColor = "";
        if (s.hasRunning) { statusLabel = "RUN"; statusColor = "#4f8dff"; }
        else if (s.fail > 0) { statusLabel = "FAIL"; statusColor = "#ef4444"; }
        else if (s.pass === s.total && s.total > 0) { statusLabel = "PASS"; statusColor = "#22c55e"; }

        return (
          <div
            key={cat.id}
            className="category-card"
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            style={{
              position: "relative",
              background: isActive ? "rgba(60, 90, 140, 0.35)" : "rgba(22, 32, 52, 0.38)",
              border: `1px solid ${isActive ? "var(--border-strong)" : "var(--border)"}`,
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              transition: "background 180ms ease, border-color 180ms ease, transform 180ms ease",
              boxShadow: isActive ? "0 4px 16px rgba(79,141,255,0.15)" : "0 2px 8px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            {/* Icon + label + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{cat.icon}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {cat.label}
              </span>
              {statusLabel && (
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                  background: `${statusColor}22`, color: statusColor,
                  border: `1px solid ${statusColor}44`,
                  padding: "1px 6px", borderRadius: 999, flexShrink: 0,
                }}>
                  {statusLabel}
                </span>
              )}
            </div>
            {/* Counts */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
              <span style={{ color: "#22c55e" }}>✓{s.pass}</span>
              <span style={{ color: "#ef4444" }}>✗{s.fail}</span>
              <span style={{ opacity: 0.5 }}>/{s.total}</span>
            </div>
            {/* Progress bar — subtle at bottom */}
            {s.total > 0 && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.04)" }}>
                <div style={{ height: "100%", width: `${passRate * 100}%`, background: "var(--accent)", opacity: 0.6, transition: "width 300ms ease-out" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
