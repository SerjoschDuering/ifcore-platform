import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "../stores/store";
import { CategoryFolder } from "../features/report/TeamReportPanel";
import { CATEGORIES } from "../lib/constants";
import type { CheckResult } from "../lib/types";

export const Route = createFileRoute("/report")({
  beforeLoad: () => {
    useStore.getState().setViewerVisible(false);
    useStore.getState().clearHighlights();
  },
  component: ReportPage,
});

/* ═══════════════════════════════════════════════════════════════════════════
   /report — Cascading compliance report
   Level 1  →  Category folder  (Habitability, Energy, Fire, …)
   Level 2  →  Check name       (dwelling area, solar production, …)
   Level 3  →  Element detail    (pass / fail / warning / blocked)
   ═══════════════════════════════════════════════════════════════════════════ */

function ReportPage() {
  const checkResults   = useStore((s) => s.checkResults);
  const elementResults = useStore((s) => s.elementResults);

  if (checkResults.length === 0) {
    return (
      <div >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Compliance Report</h1>
        <p style={{ color: "var(--text-muted)" }}>
          No check results yet. Upload a file and run checks first.
        </p>
      </div>
    );
  }

  /* ── Build a lookup: team → checks ─────────────────────────── */
  const byTeam = new Map<string, CheckResult[]>();
  for (const cr of checkResults) {
    const list = byTeam.get(cr.team) || [];
    list.push(cr);
    byTeam.set(cr.team, list);
  }

  /* ── Global summary stats ──────────────────────────────────── */
  const total   = checkResults.length;
  const passed  = checkResults.filter((c) => c.status === "pass").length;
  const failed  = checkResults.filter((c) => c.status === "fail").length;
  const errors  = checkResults.filter((c) => c.status === "error").length;
  const running = checkResults.filter((c) => c.status === "running").length;
  const other   = total - passed - failed - errors - running;

  /* ── Teams not in the category list (demo, future teams, …) ─ */
  const mappedTeams = new Set(CATEGORIES.map((c) => c.team));
  const unmapped = [...byTeam.entries()]
    .filter(([team]) => !mappedTeams.has(team))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Compliance Report</h1>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard label="Total Checks" value={total}  color="var(--text)" />
        <StatCard label="Passed"       value={passed} color="var(--success)" />
        <StatCard label="Failed"       value={failed} color="var(--danger)" />
        <StatCard label="Errors"       value={errors} color="var(--warning)" />
        <StatCard label="Running"      value={running} color="var(--accent)" />
        <StatCard label="Other"        value={other}  color="var(--text-muted)" />
      </div>

      {/* Cascading category folders */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {CATEGORIES.map(({ label, icon, team }) => (
          <CategoryFolder
            key={team}
            label={label}
            icon={icon}
            checks={byTeam.get(team) || []}
            elementResults={elementResults}
          />
        ))}

        {/* Any teams not mapped to a named category */}
        {unmapped.map(([team, checks]) => (
          <CategoryFolder
            key={team}
            label={team}
            icon="📦"
            checks={checks}
            elementResults={elementResults}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Small stat card ────────────────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}
