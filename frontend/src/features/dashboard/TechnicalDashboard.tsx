import { useMemo, useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "../../stores/store";
import { statusToHex, STATUS_COLORS, getCategory } from "../../lib/constants";
import type { CheckResult, ElementResult } from "../../lib/types";

/* ------------------------------------------------------------------ */
/*  Animated counter — numbers count up from 0                        */
/* ------------------------------------------------------------------ */
function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (to - from) * t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display}</>;
}

/* ------------------------------------------------------------------ */
/*  Pass-rate color helper (green > 80%, amber 50-80%, red < 50%)     */
/* ------------------------------------------------------------------ */
function passRateColor(rate: number): string {
  if (rate >= 80) return STATUS_COLORS.pass;
  if (rate >= 50) return STATUS_COLORS.warning;
  return STATUS_COLORS.fail;
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */
function SummaryCard({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 120,
        background: "#1a1d27",
        border: "1px solid #2a2d3a",
        borderRadius: 10,
        padding: "1.1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: "1.75rem", fontWeight: 700, color }}>
        <AnimatedNumber value={value} />
        {suffix ?? ""}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Recharts tooltip                                            */
/* ------------------------------------------------------------------ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1d27",
        border: "1px solid #2a2d3a",
        borderRadius: 6,
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
        color: "#e1e4ed",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label ?? payload[0]?.name}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} style={{ color: p.color ?? p.fill }}>
          {p.name ?? p.dataKey}: {p.value}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function TechnicalDashboard() {
  const checkResults = useStore((s) => s.checkResults);
  const elementResults = useStore((s) => s.elementResults);
  const selectedCheckId = useStore((s) => s.selectedCheckId);
  const setSelectedCheckId = useStore((s) => s.setSelectedCheckId);
  const selectedCategory = useStore((s) => s.selectedCategory);

  /* ---------- derived: filter checks by category (Team D integration) ---------- */
  const visibleChecks = useMemo(() => {
    if (!selectedCategory) return checkResults;
    return checkResults.filter((cr) => {
      const cat = getCategory(cr.team);
      return cat?.id === selectedCategory;
    });
  }, [checkResults, selectedCategory]);

  /* ---------- derived: check dropdown options ---------- */
  const checkOptions = useMemo(
    () =>
      visibleChecks.map((cr) => ({
        id: cr.id,
        label: cr.check_name.replace("check_", "").replace(/_/g, " "),
        team: cr.team,
        status: cr.status,
      })),
    [visibleChecks]
  );

  /* auto-select first visible check when data arrives or category changes */
  useEffect(() => {
    const currentStillVisible = visibleChecks.some((cr) => cr.id === selectedCheckId);
    if ((!selectedCheckId || !currentStillVisible) && visibleChecks.length > 0) {
      setSelectedCheckId(visibleChecks[0].id);
    }
  }, [visibleChecks, selectedCheckId, setSelectedCheckId]);

  /* ---------- derived: filtered elements for selected check ---------- */
  const activeCheck: CheckResult | undefined = useMemo(
    () => visibleChecks.find((cr) => cr.id === selectedCheckId),
    [visibleChecks, selectedCheckId]
  );

  const filteredElements: ElementResult[] = useMemo(
    () => (selectedCheckId ? elementResults.filter((er) => er.check_result_id === selectedCheckId) : elementResults),
    [elementResults, selectedCheckId]
  );

  /* ---------- derived: stats from filtered elements ---------- */
  const stats = useMemo(() => {
    const total = filteredElements.length;
    const pass = filteredElements.filter((e) => e.check_status === "pass").length;
    const fail = filteredElements.filter((e) => e.check_status === "fail").length;
    const warning = filteredElements.filter((e) => e.check_status === "warning").length;
    const blocked = filteredElements.filter((e) => e.check_status === "blocked").length;
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
    return { total, pass, fail, warning, blocked, passRate };
  }, [filteredElements]);

  /* ---------- derived: donut data ---------- */
  const donutData = useMemo(() => {
    const entries = [
      { name: "Pass", value: stats.pass, color: STATUS_COLORS.pass },
      { name: "Fail", value: stats.fail, color: STATUS_COLORS.fail },
      { name: "Warning", value: stats.warning, color: STATUS_COLORS.warning },
      { name: "Blocked", value: stats.blocked, color: STATUS_COLORS.blocked },
    ];
    return entries.filter((e) => e.value > 0);
  }, [stats]);

  /* ---------- derived: bar chart data (actual vs required, first 30 elements) ---------- */
  const barData = useMemo(() => {
    return filteredElements
      .filter((e) => e.actual_value != null && e.required_value != null)
      .slice(0, 30)
      .map((e) => ({
        name: e.element_name ?? e.element_id ?? "—",
        actual: parseFloat(e.actual_value!) || 0,
        required: parseFloat(e.required_value!) || 0,
        status: e.check_status,
      }));
  }, [filteredElements]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* Active category info for title accent */
  const activeCategoryInfo = selectedCategory
    ? getCategory(
        checkResults.find((cr) => {
          const cat = getCategory(cr.team);
          return cat?.id === selectedCategory;
        })?.team ?? ""
      )
    : undefined;

  /* Empty state — no checks at all */
  if (checkResults.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: "0.75rem",
        }}
      >
        <div style={{ fontSize: "2rem" }}>📊</div>
        <div style={{ color: "#8b8fa3", fontSize: "1rem" }}>Select a check to view results</div>
        <div style={{ color: "#555", fontSize: "0.8rem" }}>Run checks on a project first, then come back here.</div>
      </div>
    );
  }

  /* Empty state — category selected but no checks match */
  if (visibleChecks.length === 0 && selectedCategory) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: "0.75rem",
        }}
      >
        <div style={{ fontSize: "2rem" }}>🔍</div>
        <div style={{ color: "#8b8fa3", fontSize: "1rem" }}>No checks found for this category</div>
        <div style={{ color: "#555", fontSize: "0.8rem" }}>Try selecting a different category or clear the filter.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* -------- Page title with accent -------- */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: activeCategoryInfo?.color ?? "#3b82f6",
            flexShrink: 0,
          }}
        />
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#e1e4ed", margin: 0 }}>
          Technical Dashboard
          {activeCategoryInfo && (
            <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#8b8fa3", marginLeft: 10 }}>
              {activeCategoryInfo.icon} {activeCategoryInfo.label}
            </span>
          )}
        </h1>
      </div>
      {/* -------- Check selector dropdown -------- */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.85rem", color: "#8b8fa3" }}>Check:</label>
        <select
          value={selectedCheckId ?? ""}
          onChange={(e) => setSelectedCheckId(e.target.value || null)}
          style={{
            background: "#1a1d27",
            color: "#e1e4ed",
            border: "1px solid #2a2d3a",
            borderRadius: 6,
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            minWidth: 220,
          }}
        >
          {checkOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label} — {opt.team} ({opt.status})
            </option>
          ))}
        </select>
        {activeCheck && (
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontWeight: 600,
              background: `${statusToHex(activeCheck.status)}22`,
              color: statusToHex(activeCheck.status),
              textTransform: "uppercase",
            }}
          >
            {activeCheck.status}
          </span>
        )}
      </div>

      {/* -------- Summary cards row -------- */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <SummaryCard label="Total" value={stats.total} color="#e1e4ed" />
        <SummaryCard label="Pass" value={stats.pass} color={STATUS_COLORS.pass} />
        <SummaryCard label="Fail" value={stats.fail} color={STATUS_COLORS.fail} />
        <SummaryCard label="Warning" value={stats.warning} color={STATUS_COLORS.warning} />
        <SummaryCard label="Blocked" value={stats.blocked} color={STATUS_COLORS.blocked} />
        <SummaryCard label="Pass Rate" value={stats.passRate} color={passRateColor(stats.passRate)} suffix="%" />
      </div>

      {/* -------- Charts row -------- */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {/* Donut chart */}
        <div
          style={{
            flex: "1 1 340px",
            background: "#1a1d27",
            border: "1px solid #2a2d3a",
            borderRadius: 10,
            padding: "1rem",
            minHeight: 300,
          }}
        >
          <h3 style={{ fontSize: "0.85rem", color: "#8b8fa3", marginBottom: 8 }}>Status Breakdown</h3>
          {donutData.length === 0 ? (
            <div style={{ color: "#8b8fa3", textAlign: "center", paddingTop: 80 }}>No element data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string) => <span style={{ color: "#e1e4ed", fontSize: "0.8rem" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart — actual vs required */}
        <div
          style={{
            flex: "2 1 500px",
            background: "#1a1d27",
            border: "1px solid #2a2d3a",
            borderRadius: 10,
            padding: "1rem",
            minHeight: 300,
          }}
        >
          <h3 style={{ fontSize: "0.85rem", color: "#8b8fa3", marginBottom: 8 }}>Actual vs Required</h3>
          {barData.length === 0 ? (
            <div style={{ color: "#8b8fa3", textAlign: "center", paddingTop: 80 }}>
              No numeric actual/required values to chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8b8fa3", fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis tick={{ fill: "#8b8fa3", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="actual" name="Actual" fill={STATUS_COLORS.pass} radius={[4, 4, 0, 0]} />
                <Bar dataKey="required" name="Required" fill={STATUS_COLORS.warning} radius={[4, 4, 0, 0]} />
                <Legend
                  formatter={(value: string) => <span style={{ color: "#e1e4ed", fontSize: "0.8rem" }}>{value}</span>}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* -------- Scrollable element table -------- */}
      <div
        style={{
          background: "#1a1d27",
          border: "1px solid #2a2d3a",
          borderRadius: 10,
          padding: "1rem",
          maxHeight: 420,
          overflowY: "auto",
        }}
      >
        <h3 style={{ fontSize: "0.85rem", color: "#8b8fa3", marginBottom: 8 }}>
          Elements ({filteredElements.length})
        </h3>
        {filteredElements.length === 0 ? (
          <div style={{ color: "#8b8fa3", textAlign: "center", padding: "2rem 0" }}>No elements for this check</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2d3a", textAlign: "left" }}>
                <th style={thStyle}>Element</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actual</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {filteredElements.map((el, i) => (
                <tr
                  key={el.id}
                  style={{
                    background: i % 2 === 0 ? "transparent" : "#12141c",
                    borderBottom: "1px solid #22252f",
                  }}
                >
                  <td style={tdStyle}>{el.element_name_long ?? el.element_name ?? el.element_id ?? "—"}</td>
                  <td style={{ ...tdStyle, color: "#8b8fa3" }}>{el.element_type ?? "—"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background: `${statusToHex(el.check_status)}22`,
                        color: statusToHex(el.check_status),
                        textTransform: "uppercase",
                      }}
                    >
                      {el.check_status}
                    </span>
                  </td>
                  <td style={tdStyle}>{el.actual_value ?? "—"}</td>
                  <td style={tdStyle}>{el.required_value ?? "—"}</td>
                  <td style={{ ...tdStyle, color: "#8b8fa3", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {el.comment ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table style helpers                                                */
/* ------------------------------------------------------------------ */
const thStyle: React.CSSProperties = {
  padding: "0.5rem 0.6rem",
  fontWeight: 600,
  color: "#8b8fa3",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: "0.45rem 0.6rem",
  color: "#e1e4ed",
};
