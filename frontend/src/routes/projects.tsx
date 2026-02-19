import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  component: () => (
    <div className="container">
      <Outlet />
    </div>
  ),
});
