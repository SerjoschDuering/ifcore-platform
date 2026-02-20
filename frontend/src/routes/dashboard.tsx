import { createFileRoute } from "@tanstack/react-router";
import { TechnicalDashboard } from "../features/dashboard/TechnicalDashboard";

export const Route = createFileRoute("/dashboard")({
  component: TechnicalDashboard,
});
