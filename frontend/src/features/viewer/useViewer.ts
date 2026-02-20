import { useEffect } from "react";
import { useStore } from "../../stores/store";

export function useViewer() {
  const elementResults = useStore((s) => s.elementResults);

  useEffect(() => {
    const STATUS_HEX: Record<string, string> = {
      fail: "#e62020",
      warning: "#f59e0b",
      pass: "#22c55e",
      blocked: "#6b7280",
      log: "#9ca8c9",
    };
    const map: Record<string, string> = {};
    for (const er of elementResults) {
      if (!er.element_id) continue;
      const existing = map[er.element_id];
      const color = STATUS_HEX[er.check_status] || "#d0d3da";
      // Fail takes priority over other statuses for the same element
      if (!existing || er.check_status === "fail") map[er.element_id] = color;
    }

    // Only update if the map actually changed
    const prev = useStore.getState().colorMap;
    const keys = Object.keys(map);
    const prevKeys = Object.keys(prev);
    if (keys.length === prevKeys.length && keys.every((k) => prev[k] === map[k])) return;

    useStore.getState().setColorMap(map);
  }, [elementResults]);
}
