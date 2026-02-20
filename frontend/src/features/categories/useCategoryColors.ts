import { useEffect } from "react";
import { useStore } from "../../stores/store";
import { getCategory } from "../../lib/constants";

const GRAY_OUT = "#d0d3da";

export function useCategoryColors() {
  const elementResults = useStore((s) => s.elementResults);
  const checkResults = useStore((s) => s.checkResults);
  const selectedCategory = useStore((s) => s.selectedCategory);

  useEffect(() => {
    if (!selectedCategory) {
      // Clear if previously set
      if (Object.keys(useStore.getState().highlightColorMap).length > 0) {
        useStore.getState().clearHighlights();
      }
      return;
    }

    const checkById = new Map(checkResults.map((cr) => [cr.id, cr]));
    const map: Record<string, string> = {};

    for (const el of elementResults) {
      if (!el.element_id) continue;
      const cr = checkById.get(el.check_result_id);
      if (!cr) continue;
      const cat = getCategory(cr.team);
      if (cat?.id === selectedCategory && el.check_status === "fail") {
        map[el.element_id] = cat.color;
      } else {
        map[el.element_id] = GRAY_OUT;
      }
    }

    // Only update if actually changed
    const prev = useStore.getState().highlightColorMap;
    const keys = Object.keys(map);
    const prevKeys = Object.keys(prev);
    if (keys.length === prevKeys.length && keys.every((k) => prev[k] === map[k])) return;

    useStore.getState().setHighlightColorMap(map);

    return () => useStore.getState().clearHighlights();
  }, [elementResults, checkResults, selectedCategory]);
}
