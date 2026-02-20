/**
 * Category definitions and mappings for Team D's category filter feature
 * 
 * Categories group check results by domain (Fire Safety, Energy, etc.)
 * Teams are mapped to categories based on their check focus areas
 */

export type Category = {
  id: string;
  name: string;
  color: string; // hex color for highlighting in 3D viewer
  description: string;
};

/**
 * Five core building compliance categories
 */
export const CATEGORIES: Category[] = [
  {
    id: "fire-safety",
    name: "Fire Safety",
    color: "#ef4444", // red-500
    description: "Fire ratings, exits, compartmentation, smoke detection",
  },
  {
    id: "habitability",
    name: "Habitability",
    color: "#3b82f6", // blue-500
    description: "Room sizes, ceiling heights, ventilation, door clearances",
  },
  {
    id: "energy",
    name: "Energy",
    color: "#10b981", // green-500
    description: "Solar potential, insulation, thermal performance, efficiency",
  },
  {
    id: "structure",
    name: "Structure",
    color: "#f59e0b", // amber-500
    description: "Load-bearing capacity, material integrity, structural safety",
  },
  {
    id: "lighting",
    name: "Lighting",
    color: "#8b5cf6", // violet-500
    description: "Natural light, daylight factors, artificial lighting levels",
  },
];

/**
 * Maps team names (from check_results.team) to category IDs
 * 
 * Teams develop check functions independently. This mapping groups their checks
 * into architectural/regulatory categories for the UI.
 * 
 * NOTE: Team names come from the backend orchestrator (repo folder names).
 * Update this map when new teams are added or team focus areas change.
 */
export const TEAM_CATEGORY_MAP: Record<string, string> = {
  // Demo team → general/habitability (doors, walls, windows)
  demo: "habitability",
  
  // Lux-AI team → solar analysis, energy production
  "lux-ai": "energy",
  
  // Team D → currently building the category feature (may add checks later)
  "team-d": "habitability",
  
  // Team E → dashboard/visualizations (may add checks later)
  "team-e": "habitability",
  
  // Mastodonte team → structural checks (assuming based on name)
  Mastodonte: "structure",
  
  // Add more teams here as they join:
  // "team-fire": "fire-safety",
  // "team-lighting": "lighting",
};

/**
 * Get the category for a given team name
 * @param teamName - The team identifier from check_results.team
 * @returns Category object or null if team is unmapped
 */
export function getCategory(teamName: string): Category | null {
  const categoryId = TEAM_CATEGORY_MAP[teamName];
  if (!categoryId) return null;
  return CATEGORIES.find((c) => c.id === categoryId) || null;
}

/**
 * Get hex color for a check status badge
 * Used in ResultsTable and StatusBadge components
 */
export function statusToHex(status: string): string {
  switch (status) {
    case "pass":
      return "#10b981"; // green-500
    case "fail":
      return "#ef4444"; // red-500
    case "warning":
      return "#f59e0b"; // amber-500
    case "blocked":
      return "#6b7280"; // gray-500
    case "log":
      return "#3b82f6"; // blue-500
    default:
      return "#9ca3af"; // gray-400
  }
}

/**
 * Muted gray for non-highlighted elements in category view
 */
export const MUTED_COLOR = "#d0d3da";
