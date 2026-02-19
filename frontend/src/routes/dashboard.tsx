import { createFileRoute, redirect } from "@tanstack/react-router";
import { useStore } from "../stores/store";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const id = useStore.getState().activeProjectId;
    if (id) throw redirect({ to: "/projects/$id", params: { id } });
    throw redirect({ to: "/projects" });
  },
  component: () => null,
});
