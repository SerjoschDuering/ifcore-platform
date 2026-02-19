import { useEffect, useRef } from "react";

type KpiGaugeProps = {
  label: string;
  value: number;
  total?: number;
  unit?: string;
  color: string;
  size?: number;
};

export function KpiGauge({ label, value, total, unit = "", color, size = 56 }: KpiGaugeProps) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const percent = total && total > 0 ? value / total : 0;
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * percent;

  useEffect(() => {
    const el = displayRef.current;
    if (!el) return;
    let cancelled = false;
    const target = value;
    const duration = 700;
    const start = performance.now();
    function tick(now: number) {
      if (cancelled) return;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el!.textContent = Math.round(eased * target).toString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, [value]);

  return (
    <div style={gaugeContainer}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s ease-out" }}
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color }}>
          <span ref={displayRef}>0</span>{unit}
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

const gaugeContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(20, 28, 46, 0.88)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "6px 10px",
  flex: 1,
  minWidth: 110,
  boxShadow: "0 6px 18px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
};
