import { useEffect } from "react";
import { useStore } from "../../stores/store";

export function useViewer() {
  const elementResults = useStore((s) => s.elementResults);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const er of elementResults) {
      if (!er.element_id) continue;
      map[er.element_id] = er.check_status === "fail" ? "#e62020" : "#d0d3da";
    }

    // Only update if the map actually changed
    const prev = useStore.getState().colorMap;
    const keys = Object.keys(map);
    const prevKeys = Object.keys(prev);
    if (keys.length === prevKeys.length && keys.every((k) => prev[k] === map[k])) return;

    useStore.getState().setColorMap(map);
  }, [elementResults]);
}
