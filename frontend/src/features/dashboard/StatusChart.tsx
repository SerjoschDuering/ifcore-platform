import { useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { CheckResult } from "../../lib/types";
import { CATEGORIES, statusToHex } from "../../lib/constants";

type StatusChartProps = {
  filteredChecks: CheckResult[];
  allChecks: CheckResult[];
};

export function StatusChart({ filteredChecks, allChecks }: StatusChartProps) {
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filteredChecks) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusToHex(status),
    }));
  }, [filteredChecks]);

  const catData = useMemo(() =>
    CATEGORIES.map((cat) => {
      let pass = 0, fail = 0;
      for (const c of allChecks) {
        if (c.team !== cat.team) continue;
        if (c.status === "pass") pass++;
        else if (c.status === "fail") fail++;
      }
      return {
        name: cat.label.length > 10 ? cat.label.slice(0, 10) + "\u2026" : cat.label,
        pass,
        fail,
      };
    }).filter((d) => d.pass + d.fail > 0),
  [allChecks]);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <div style={chartCard}>
        <h4 style={chartTitle}>Status</h4>
        {donutData.length === 0 ? (
          <div style={empty}>No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2} dataKey="value">
                {donutData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tipStyle} formatter={(val, name) => [val, name]} />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={chartCard}>
        <h4 style={chartTitle}>By Category</h4>
        {catData.length === 0 ? (
          <div style={empty}>No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={catData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(100, 140, 220, 0.1)" }} />
              <Bar dataKey="pass" name="Pass" fill="#00c853" radius={[2, 2, 0, 0]} />
              <Bar dataKey="fail" name="Fail" fill="#e53935" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const tipStyle = {
  backgroundColor: "rgba(16, 22, 36, 0.94)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 11,
};

const chartCard: React.CSSProperties = {
  flex: 1,
  minWidth: 180,
  background: "rgba(20, 28, 46, 0.88)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "8px 10px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const chartTitle: React.CSSProperties = {
  margin: "0 0 4px 0",
  fontSize: 9,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
};

const empty: React.CSSProperties = {
  height: 130,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
  fontSize: 11,
};
