import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "../components/Navbar";
import { ViewerPanel } from "../features/viewer/ViewerPanel";
import { ChatPanel } from "../features/chat/ChatPanel";

export const Route = createRootRoute({
  component: () => (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <main style={{ flex: "0 0 auto", padding: "1.5rem" }}>
          <Outlet />
        </main>
        <ViewerPanel />
      </div>
      <ChatPanel />
    </div>
  ),
});
