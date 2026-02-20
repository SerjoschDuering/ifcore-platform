// Shared source of truth — status colors & team categories
// Phase A: local values. Phase B: captain merges shared file across all teams.

export const STATUS_COLORS: Record<string, string> = {
  pass: "#22c55e",
  fail: "#ef4444",
  warning: "#f59e0b",
  blocked: "#6b7280",
  log: "#3b82f6",
  running: "#3b82f6",
  error: "#ef4444",
  pending: "#6b7280",
  done: "#22c55e",
  unknown: "#6b7280",
};

export function statusToHex(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
}

export type Category = {
  id: string;
  label: string;
  color: string;
  icon: string;
  team: string;
};

export const CATEGORIES: Category[] = [
  { id: "habitability", label: "Habitability", color: "#8b5cf6", icon: "🏠", team: "Mastodonte" },
  { id: "energy", label: "Energy", color: "#f59e0b", icon: "⚡", team: "lux-ai" },
  { id: "fire", label: "Fire Compliance", color: "#ef4444", icon: "🔥", team: "team-d" },
  { id: "structure", label: "Structure", color: "#06b6d4", icon: "🏗️", team: "structures" },
  { id: "lighting", label: "Lighting & Facade", color: "#3b82f6", icon: "💡", team: "team-e" },
];

export function getCategory(team: string): Category | undefined {
  return CATEGORIES.find((c) => c.team === team);
}
