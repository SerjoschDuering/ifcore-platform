import { useEffect } from "react";
import { useStore } from "../../stores/store";

export function useViewer() {
  const elementResults = useStore((s) => s.elementResults);
  const setColorMap = useStore((s) => s.setColorMap);

  useEffect(() => {
    if (elementResults.length === 0) {
      setColorMap({});
      return;
    }

    const map: Record<string, string> = {};
    for (const er of elementResults) {
      if (!er.element_id) continue;
      map[er.element_id] =
        er.check_status === "fail" ? "#e62020" : "#d0d3da";
    }
    setColorMap(map);
  }, [elementResults, setColorMap]);
}
