export const STATUS_COLORS = {
  pass: "#00c853",
  fail: "#e53935",
  review: "#ff9800",
  analyzing: "#1565c0",
  blocked: "#6d4c41",
  warning: "#ff9800",
  unknown: "#6d4c41",
  error: "#e53935",
  running: "#1565c0",
  log: "#8a9bb0",
} as const;

export type Category = {
  id: string;
  label: string;
  color: string;
  icon: string;
  team: string;
};

export const CATEGORIES: Category[] = [
  { id: "habitability", label: "Habitability", color: "#00c853", icon: "\u{1F3E0}", team: "Mastodonte" },
  { id: "energy", label: "Energy Consumption", color: "#ff9800", icon: "\u26A1", team: "lux-ai" },
  { id: "fire", label: "Fire Compliance", color: "#e53935", icon: "\u{1F525}", team: "team-d" },
  { id: "structure", label: "Structure", color: "#1565c0", icon: "\u{1F3D7}\uFE0F", team: "structures" },
  { id: "lighting", label: "Lighting & Facade", color: "#f5a623", icon: "\u{1F4A1}", team: "team-e" },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.team, c]));

export function getCategory(team: string): Category | undefined {
  return CATEGORY_MAP.get(team);
}

export function statusToHex(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#8a9bb0";
}
