import { useState } from "react";
import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Navbar } from "../components/Navbar";
import { ViewerPanel } from "../features/viewer/ViewerPanel";
import { CategorySidebar } from "../features/categories/CategorySidebar";
import { ChatPanel } from "../features/chat/ChatPanel";
import { TechnicalDashboard } from "../features/dashboard/TechnicalDashboard";
import { UploadForm } from "../features/upload/UploadForm";
import { UserSettingsModal } from "../features/auth/UserSettingsModal";
import { useStore } from "../stores/store";
import { useSession } from "../lib/auth-client";

const WORKSPACE_PATHS = ["/projects/", "/checks", "/report"];

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isAuthView = pathname.startsWith("/login") || pathname.startsWith("/profile");
  const isWorkspace =
    WORKSPACE_PATHS.some((p) => pathname.startsWith(p)) &&
    !isExactProjectsList(pathname);

  if (!isWorkspace) {
    if (isAuthView) {
      return (
        <div style={{ minHeight: "100vh" }}>
          <Outlet />
        </div>
      );
    }
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "1.5rem" }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", position: "relative" }}>
      <WorkspaceToolbar onOpenSettings={() => setIsSettingsOpen(true)} />
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: isChatCollapsed
          ? "236px minmax(0, 1fr) 0px"
          : "236px minmax(0, 1fr) minmax(290px, 24vw)",
        minHeight: 0,
        overflow: "hidden",
        gap: isChatCollapsed ? 0 : 10,
        padding: "0 10px 10px",
      }}>
        {/* Sidebar — slide in from left */}
        <div style={{ animation: "slideInLeft 350ms ease-out" }}>
          <CategorySidebar />
        </div>

        {/* Center — fade in */}
        <div style={{ animation: "fadeIn 300ms ease-out" }}>
          <CenterStage />
        </div>

        {/* Chat — slide in from right */}
        {!isChatCollapsed && (
          <div style={{ animation: "slideInRight 300ms ease-out", minHeight: 0, display: "flex" }}>
            <ChatPanel onCollapse={() => setIsChatCollapsed(true)} />
          </div>
        )}
      </div>

      {isChatCollapsed && (
        <button
          className="glass-panel"
          onClick={() => setIsChatCollapsed(false)}
          style={{
            position: "absolute",
            right: 16,
            bottom: 14,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "1px solid var(--border-strong)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--text)",
            cursor: "pointer",
            zIndex: 40,
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(138, 188, 255, 0.2)",
          }}
          aria-label="Open chat assistant"
          title="Open chat assistant"
        >
          AI
        </button>
      )}

      {isSettingsOpen && (
        <UserSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

function CenterStage() {
  const hasResults = useStore((s) => s.checkResults.length > 0);
  const [dockMode, setDockMode] = useState<"collapsed" | "open" | "large">("collapsed");
  const [failHighlight, setFailHighlight] = useState(false);
  const elementResults = useStore((s) => s.elementResults);
  const selectedCheckId = useStore((s) => s.selectedCheckId);

  const failCount = elementResults.filter((er) => er.check_status === "fail" && er.element_id).length;

  function toggleFailHighlight() {
    const next = !failHighlight;
    setFailHighlight(next);
    if (next) {
      const failMap: Record<string, string> = {};
      for (const er of elementResults) {
        if (er.check_status !== "fail" || !er.element_id) continue;
        if (selectedCheckId && er.check_result_id !== selectedCheckId) continue;
        failMap[er.element_id] = "#e62020";
      }
      useStore.getState().setHighlightColorMap(failMap);
    } else {
      useStore.getState().clearHighlights();
    }
  }

  const isDockVisible = dockMode !== "collapsed";
  const isDockLarge = dockMode === "large";
  const dockHeight = isDockLarge ? "75%" : "34%";
  const dockMaxHeight = isDockLarge ? undefined : 280;
  const dockControlBottom =
    dockMode === "collapsed"
      ? 10
      : dockMode === "large"
      ? "calc(75% - 14px)"
      : "calc(min(34%, 280px) - 14px)";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "var(--radius-lg)" }}>
      {/* Viewer fills entire center area */}
      <ViewerPanel />

      {/* Dock controls */}
      <div
        style={{
          position: "absolute",
          bottom: dockControlBottom,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {failCount > 0 && (
          <button
            onClick={toggleFailHighlight}
            className="toolbar-btn"
            style={{
              background: failHighlight ? "rgba(230, 32, 32, 0.85)" : "rgba(14, 20, 34, 0.9)",
              color: failHighlight ? "#fff" : undefined,
              borderColor: failHighlight ? "rgba(255,100,100,0.5)" : undefined,
              boxShadow: failHighlight
                ? "0 4px 18px rgba(230, 32, 32, 0.5)"
                : "0 4px 14px rgba(0,0,0,0.4)",
              fontSize: "0.74rem",
              padding: "0.42rem 0.78rem",
              borderRadius: 999,
            }}
          >
            {failHighlight ? "Clear Highlights" : `Highlight Failures (${failCount})`}
          </button>
        )}
        <button
          onClick={() => setDockMode((m) => (m === "collapsed" ? "open" : "collapsed"))}
          className="toolbar-btn"
          style={{
            background: "rgba(14, 20, 34, 0.9)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            fontSize: "0.74rem",
            padding: "0.42rem 0.78rem",
            borderRadius: 999,
          }}
        >
          {dockMode === "collapsed" ? `Show Insights${hasResults ? " \u25cf" : ""}` : "Hide Insights"}
        </button>
        {isDockVisible && (
          <button
            onClick={() => setDockMode((m) => (m === "large" ? "open" : "large"))}
            className="toolbar-btn"
            style={{
              background: "rgba(14, 20, 34, 0.9)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              fontSize: "0.74rem",
              padding: "0.42rem 0.78rem",
              borderRadius: 999,
            }}
          >
            {isDockLarge ? "Open Mode" : "Large Mode"}
          </button>
        )}
      </div>

      {/* Floating glass dock — conditionally rendered */}
      {isDockVisible && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: dockHeight,
          maxHeight: dockMaxHeight,
          zIndex: 10,
          animation: "fadeIn 200ms ease-out",
          padding: "0 6px 6px",
        }}>
          <div
            className="glass-panel-strong"
            style={{ height: "100%", overflowY: "auto", overflowX: "hidden", padding: "0.5rem" }}
          >
            <TechnicalDashboard />
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceToolbar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const project = useStore((s) => s.activeProjectId ? s.projects.find((p) => p.id === s.activeProjectId) : null);
  const sessionQuery = useSession();
  const user = (sessionQuery as any)?.data?.user;

  return (
    <div className="glass-panel floating-toolbar" style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      flexWrap: "wrap",
      flexShrink: 0,
    }}>
      {/* Brand + nav */}
      <Link to="/projects" style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", textDecoration: "none", flexShrink: 0 }}>
        IFCore
      </Link>
      <Link to="/projects" className="toolbar-btn" style={{ textDecoration: "none", fontSize: "0.74rem" }}>
        Projects
      </Link>

      {project && (
        <>
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", flexShrink: 0 }}>/</span>
          <span className="glass-chip" style={{ color: "var(--text)", fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.name || "Project"}
          </span>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <UploadForm variant="toolbar" />
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />

      {/* User */}
      {user ? (
        <button className="toolbar-btn" style={{ textDecoration: "none", color: "var(--text)" }} onClick={onOpenSettings}>
          {user.name || user.email}
        </button>
      ) : (
        <Link to="/login" className="toolbar-btn" style={{ textDecoration: "none" }}>
          Log In
        </Link>
      )}
    </div>
  );
}

function isExactProjectsList(pathname: string) {
  const clean = pathname.replace(/\/+$/, "");
  return clean === "/projects" || clean === "";
}

export const Route = createRootRoute({ component: RootComponent });
