import { useEffect, useState } from "react";
import { useStore } from "../../stores/store";
import { BIMViewer } from "./BIMViewer";

export function ViewerPanel() {
  const hasUrl = useStore((s) => !!s.ifcUrl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (hasUrl && !mounted) setMounted(true);
  }, [hasUrl, mounted]);

  if (mounted) return <BIMViewer />;

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "0.75rem",
      color: "var(--text-muted)", fontSize: "0.85rem",
    }}>
      <div style={{ fontSize: "2.5rem", opacity: 0.3 }}>&#9653;</div>
      <span>Upload an IFC file to view the 3D model</span>
    </div>
  );
}
