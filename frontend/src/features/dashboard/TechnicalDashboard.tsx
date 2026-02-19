import { useMemo } from "react";
import { useStore } from "../../stores/store";
import { STATUS_COLORS, CATEGORIES } from "../../lib/constants";
import { KpiGauge } from "./KpiGauge";
import { StatusChart } from "./StatusChart";
import { ElementTable } from "./ElementTable";

export function TechnicalDashboard() {
  const checkResults = useStore((s) => s.checkResults);
  const elementResults = useStore((s) => s.elementResults);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const selectedCheckId = useStore((s) => s.selectedCheckId);
  const setSelectedCheckId = useStore((s) => s.setSelectedCheckId);

  const filteredChecks = useMemo(() => {
    if (!selectedCategory) return checkResults;
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    return cat ? checkResults.filter((c) => c.team === cat.team) : checkResults;
  }, [checkResults, selectedCategory]);

  const { total, passed, failed, passRate } = useMemo(() => {
    const total = filteredChecks.length;
    let passed = 0, failed = 0;
    for (const c of filteredChecks) {
      if (c.status === "pass") passed++;
      else if (c.status === "fail") failed++;
    }
    return { total, passed, failed, passRate: total > 0 ? passed / total : 0 };
  }, [filteredChecks]);

  const passRateColor =
    passRate >= 0.8 ? STATUS_COLORS.pass
    : passRate >= 0.5 ? STATUS_COLORS.warning
    : STATUS_COLORS.fail;

  const selectedCat = selectedCategory
    ? CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0.25rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Dashboard
          </h2>
          {selectedCat && (
            <span style={{
              padding: "1px 8px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              background: selectedCat.color + "22",
              color: selectedCat.color,
            }}>
              {selectedCat.icon} {selectedCat.label}
            </span>
          )}
        </div>
        {total === 0 && (
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
            Run checks to see results here.
          </span>
        )}
      </div>

      {/* KPI Row — 4 compact gauges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <KpiGauge label="Pass Rate" value={Math.round(passRate * 100)} total={100} unit="%" color={passRateColor} size={64} />
        <KpiGauge label="Total" value={total} total={Math.max(total, 1)} color="#4fc3f7" size={64} />
        <KpiGauge label="Passed" value={passed} total={Math.max(total, 1)} color={STATUS_COLORS.pass} size={64} />
        <KpiGauge label="Failed" value={failed} total={Math.max(total, 1)} color={STATUS_COLORS.fail} size={64} />
      </div>

      {/* Charts */}
      <StatusChart filteredChecks={filteredChecks} allChecks={checkResults} />

      {/* Check selector */}
      {filteredChecks.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }} htmlFor="check-select">
            Drill into:
          </label>
          <select
            id="check-select"
            style={selectStyle}
            value={selectedCheckId ?? ""}
            onChange={(e) => setSelectedCheckId(e.target.value === "" ? null : e.target.value)}
          >
            <option value="">— All results —</option>
            {filteredChecks.map((c) => (
              <option key={c.id} value={c.id}>[{c.status.toUpperCase()}] {c.check_name}</option>
            ))}
          </select>
          {selectedCheckId && (
            <button className="btn btn-ghost" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => setSelectedCheckId(null)}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Element Table */}
      <ElementTable elementResults={elementResults} checkResults={checkResults} selectedCheckId={selectedCheckId} />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "rgba(20, 28, 44, 0.88)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 10,
  padding: "5px 8px",
  fontSize: 11,
  fontFamily: "inherit",
  flex: 1,
  maxWidth: 360,
  cursor: "pointer",
  outline: "none",
};
