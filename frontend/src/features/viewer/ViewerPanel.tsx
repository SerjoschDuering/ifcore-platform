import { useEffect, useState } from "react";
import { useStore } from "../../stores/store";
import { BIMViewer } from "./BIMViewer";

export function ViewerPanel() {
  const viewerVisible = useStore((s) => s.viewerVisible);
  const hasUrl = useStore((s) => !!s.ifcUrl);
  const [mounted, setMounted] = useState(false);

  // Lazy-mount: only create the engine once we have a URL and are visible
  useEffect(() => {
    if (hasUrl && viewerVisible && !mounted) setMounted(true);
  }, [hasUrl, viewerVisible, mounted]);

  return (
    <div
      style={viewerVisible ? {
        padding: "0 1.5rem 1.5rem",
      } : {
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {mounted && <BIMViewer />}
    </div>
  );
}
