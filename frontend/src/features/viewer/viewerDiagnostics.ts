export type ViewerPhase =
  | "idle"
  | "init-engine"
  | "init-loader"
  | "fetch-ifc"
  | "process-ifc"
  | "render-model"
  | "apply-colors"
  | "ready"
  | "error";

export type ViewerErrorCategory =
  | "wasm"
  | "ifc-fetch"
  | "ifc-payload"
  | "fragments"
  | "render"
  | "unknown";

export type ViewerDiagnostics = {
  phase: ViewerPhase;
  modelId: string | null;
  bboxRadius: number | null;
  wasmUrl: string | null;
  wasmMtUrl: string | null;
  loadDurationMs: number | null;
  lastUpdateMs: number | null;
  errorCategory: ViewerErrorCategory | null;
  errorMessage: string | null;
};

export const initialViewerDiagnostics: ViewerDiagnostics = {
  phase: "idle",
  modelId: null,
  bboxRadius: null,
  wasmUrl: null,
  wasmMtUrl: null,
  loadDurationMs: null,
  lastUpdateMs: null,
  errorCategory: null,
  errorMessage: null,
};

export function classifyViewerError(err: unknown): ViewerErrorCategory {
  const msg = String(err ?? "");
  if (/wasm|webassembly/i.test(msg)) return "wasm";
  if (/html instead of ifc|doctype|ifc payload/i.test(msg)) return "ifc-payload";
  if (/failed to fetch ifc|api\s\d{3}|fetch/i.test(msg)) return "ifc-fetch";
  if (/fragments|worker/i.test(msg)) return "fragments";
  if (/camera|render|scene|three/i.test(msg)) return "render";
  return "unknown";
}

export function userFacingViewerError(category: ViewerErrorCategory): string {
  if (category === "wasm") return "Failed to initialize WebAssembly for IFC processing.";
  if (category === "ifc-fetch") return "Failed to download IFC file from project storage.";
  if (category === "ifc-payload") return "IFC file response is invalid (received non-binary payload).";
  if (category === "fragments") return "Failed to process IFC fragments in the worker.";
  if (category === "render") return "Model loaded but rendering/camera setup failed.";
  return "Failed to load IFC model.";
}

export function isViewerDebugEnabled(): boolean {
  try {
    return globalThis.localStorage?.getItem("viewerDebug") === "1";
  } catch {
    return false;
  }
}
