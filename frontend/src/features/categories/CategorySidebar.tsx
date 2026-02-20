import { useStore } from "../../stores/store";
import { CategoryCards } from "./CategoryCards";
import { useCategoryColors } from "./useCategoryColors";
import { CheckRunner } from "../checks/CheckRunner";
import type { CheckResult } from "../../lib/types";

function computeSummary(checkResults: CheckResult[]) {
  let pass = 0, fail = 0, review = 0, running = 0;
  for (const cr of checkResults) {
    if (cr.status === "pass") pass++;
    else if (cr.status === "fail" || cr.status === "error") fail++;
    else if (cr.status === "unknown") review++;
    else if (cr.status === "running") running++;
  }
  return { pass, fail, review, running };
}

const QUAD_ITEMS = [
  { key: "pass" as const, label: "Pass", color: "#00c853" },
  { key: "fail" as const, label: "Fail", color: "#e53935" },
  { key: "review" as const, label: "Review", color: "#ff9800" },
  { key: "running" as const, label: "Run", color: "#1565c0" },
];

export function CategorySidebar() {
  useCategoryColors();
  const checkResults = useStore((s) => s.checkResults);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const activeProject = useStore((s) =>
    s.activeProjectId ? s.projects.find((p) => p.id === s.activeProjectId) : null
  );
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const summary = computeSummary(checkResults);

  return (
    <aside className="glass-panel-strong" style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Checks
          </span>
          {activeProjectId && (
            <CheckRunner
              projectId={activeProjectId}
              fileUrl={activeProject?.file_url || ""}
              variant="toolbar"
            />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", minHeight: 24 }}>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                fontSize: 9, fontWeight: 700, color: "var(--accent)",
                background: "none", border: "none", cursor: "pointer",
                padding: "1px 4px", letterSpacing: "0.04em", textTransform: "uppercase",
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        <CategoryCards />
      </div>

      {/* Summary quad — compact */}
      <div style={{
        borderTop: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        padding: "8px 6px",
        gap: 3,
      }}>
        {QUAD_ITEMS.map(({ key, label, color }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "2px 0" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color, lineHeight: 1 }}>{summary[key]}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
