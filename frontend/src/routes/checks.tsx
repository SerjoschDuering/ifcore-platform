import { createFileRoute } from "@tanstack/react-router";
import { ResultsTable } from "../features/checks/ResultsTable";
import { useStore } from "../stores/store";

export const Route = createFileRoute("/checks")({
  beforeLoad: () => {
    useStore.getState().setViewerVisible(false);
  },
  component: () => (
    <div >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Check Results</h1>
      <ResultsTable />
    </div>
  ),
});
