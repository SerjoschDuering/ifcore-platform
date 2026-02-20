import { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as THREE from "three";
import { useStore } from "../../stores/store";
import { useViewer } from "./useViewer";
import { ElementTooltip } from "./ElementTooltip";
import webIfcWasmUrl from "web-ifc/web-ifc.wasm?url";
import webIfcMtWasmUrl from "web-ifc/web-ifc-mt.wasm?url";

// Force single-threaded web-ifc — MT WASM needs COOP/COEP headers
if (typeof globalThis !== "undefined" && !globalThis.crossOriginIsolated) {
  try {
    Object.defineProperty(globalThis, "crossOriginIsolated", { value: false, writable: false });
  } catch { /* already defined */ }
}

function resolveWasmUrl(fileName: string) {
  const normalized = fileName.split("?")[0].toLowerCase();
  const url = normalized.includes("mt") ? webIfcMtWasmUrl : webIfcWasmUrl;
  return new URL(url, window.location.origin).toString();
}

export function BIMViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const worldRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const guidMapRef = useRef(new Map<string, number>());
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const colorSeqRef = useRef(0);
  const cameraRafRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ifcUrl = useStore((s) => s.ifcUrl);
  const colorMap = useStore((s) => s.colorMap);
  const highlightColorMap = useStore((s) => s.highlightColorMap);
  const selectedIds = useStore((s) => s.selectedIds);
  // Sync check results → colorMap
  useViewer();

  // Resize renderer when container dimensions change (window resize, layout shift)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const world = worldRef.current;
      if (!world) return;
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;
      const renderer = world.renderer;
      if (renderer?.three) renderer.three.setSize(width, height);
      if (renderer?.resize) renderer.resize();
      world.camera?.controls?.update?.();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize ThatOpen engine (runs ONCE, never re-runs)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let components: OBC.Components | null = null;
    let world: any = null;
    let canvas: HTMLCanvasElement | null = null;
    let onCanvasClick: ((event: MouseEvent) => void) | null = null;
    let onCameraUpdate: (() => void) | null = null;

    try {
      components = new OBC.Components();
      const worlds = components.get(OBC.Worlds);
      world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBC.SimpleRenderer
      >();

      world.scene = new OBC.SimpleScene(components);
      world.scene.setup();
      world.renderer = new OBC.SimpleRenderer(components, el);
      world.camera = new OBC.OrthoPerspectiveCamera(components);

      const fragments = components.get(OBC.FragmentsManager);
      fragments.init("/fragments-worker.mjs");

      const ifcLoader = components.get(OBC.IfcLoader);
      ifcLoader.setup({
        wasm: { path: "/", absolute: true },
        autoSetWasm: false,
        customLocateFileHandler: resolveWasmUrl,
      });

      components.init();
      components.get(OBC.Grids).create(world);

      onCameraUpdate = () => {
        // Camera controls emit very frequently; coalesce to one GPU update per frame.
        if (cameraRafRef.current !== null) return;
        cameraRafRef.current = requestAnimationFrame(() => {
          cameraRafRef.current = null;
          fragments.core.update();
        });
      };
      world.camera.controls.addEventListener("update", onCameraUpdate);

      canvas = world.renderer.three.domElement as HTMLCanvasElement;
      onCanvasClick = async (event: MouseEvent) => {
        try {
          if (!componentsRef.current || !worldRef.current || !modelRef.current) return;
          const mouse = new THREE.Vector2(event.clientX, event.clientY);
          const frags = componentsRef.current.get(OBC.FragmentsManager);
          const hit = await frags.raycast({
            camera: worldRef.current.camera.three,
            mouse,
            dom: canvas,
          });
          if (!hit) { useStore.getState().clearSelection(); return; }
          const guids = await hit.fragments.getGuidsByLocalIds([hit.localId]);
          const guid = guids?.[0];
          if (guid) useStore.getState().selectElements([guid]);
          else useStore.getState().clearSelection();
        } catch {
          useStore.getState().clearSelection();
        }
      };
      canvas.addEventListener("click", onCanvasClick);

      componentsRef.current = components;
      worldRef.current = world;
      useStore.getState().setReady(true);
    } catch (err) {
      console.error("Failed to init 3D engine:", err);
      setError("Failed to initialize 3D viewer");
    }

    return () => {
      if (canvas && onCanvasClick) canvas.removeEventListener("click", onCanvasClick);
      if (world?.camera?.controls && onCameraUpdate) {
        world.camera.controls.removeEventListener("update", onCameraUpdate);
      }
      if (cameraRafRef.current !== null) {
        cancelAnimationFrame(cameraRafRef.current);
        cameraRafRef.current = null;
      }
      useStore.getState().setReady(false);
      const prev = componentsRef.current;
      componentsRef.current = null;
      worldRef.current = null;
      modelRef.current = null;
      try { prev?.dispose(); } catch (e) { console.warn("dispose failed", e); }
      useStore.getState().clearSelection();
    };
  }, []);

  // Load IFC when URL changes — with AbortController + loading mutex
  useEffect(() => {
    const components = componentsRef.current;
    const world = worldRef.current;
    if (!components || !world || !ifcUrl) return;
    const fragments = components.get(OBC.FragmentsManager);

    // Abort any in-flight load
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Wait for previous load to release mutex
    const startLoad = async () => {
      while (loadingRef.current) {
        await new Promise((r) => setTimeout(r, 50));
        if (controller.signal.aborted) return;
      }
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Dispose previous model
        if (modelRef.current) {
          const modelId = (modelRef.current as any).modelId ?? "ifc-model";
          try { await fragments.core.disposeModel(modelId); } catch { /* first load */ }
          modelRef.current = null;
          guidMapRef.current.clear();
          useStore.getState().clearSelection();
        }

        const ifcLoader = components.get(OBC.IfcLoader);
        const resp = await fetch(ifcUrl, { signal: controller.signal });
        if (!resp.ok) throw new Error(`Failed to fetch IFC: ${resp.status}`);

        const buffer = await resp.arrayBuffer();
        if (controller.signal.aborted) return;

        // Guard against HTML/error payloads
        const magic = new Uint8Array(buffer.slice(0, 4));
        if (magic[0] === 0x3c && magic[1] === 0x21 && magic[2] === 0x44 && magic[3] === 0x4f) {
          throw new Error("IFC URL returned HTML instead of IFC binary");
        }

        const model = await ifcLoader.load(new Uint8Array(buffer), true, "ifc-model", {
          processData: { raw: false },
        });
        if (controller.signal.aborted) return;

        const sceneObj = model.object ?? model;
        world.scene.three.add(sceneObj);
        modelRef.current = model;

        if (typeof (model as any).useCamera === "function") {
          (model as any).useCamera(world.camera.three);
        }
        await fragments.core.update(true);

        // Build GlobalId → expressID map
        try {
          const webIfc = (ifcLoader as any).webIfc;
          if (webIfc) {
            const modelID = (model as any).modelID ?? 0;
            const lines = webIfc.GetAllLines(modelID);
            for (let i = 0; i < lines.size(); i++) {
              const eid = lines.get(i);
              try {
                const props = webIfc.GetLine(modelID, eid);
                if (props?.GlobalId?.value) guidMapRef.current.set(props.GlobalId.value, eid);
              } catch { /* skip non-entity lines */ }
            }
          }
        } catch {
          const props = (model as any).properties;
          if (props && typeof props === "object") {
            for (const [key, val] of Object.entries(props)) {
              const p = val as any;
              if (p?.GlobalId?.value) guidMapRef.current.set(p.GlobalId.value, Number(key));
            }
          }
        }

        // Fit camera
        const box = new THREE.Box3().setFromObject(sceneObj);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        if (sphere.radius > 0) {
          await world.camera.controls.fitToSphere(sphere, true);
          await fragments.core.update(true);
        }

        if (!controller.signal.aborted) applyColors();
      } catch (err) {
        if (!controller.signal.aborted) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          console.error("Failed to load IFC:", err);
          setError("Failed to load IFC model");
        }
      } finally {
        loadingRef.current = false;
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    startLoad();
    return () => { controller.abort(); };
  }, [ifcUrl]);

  // Apply colors — with sequence guard to prevent interleaving
  function applyColors() {
    const components = componentsRef.current;
    const model = modelRef.current;
    if (!components || !model) return;

    const hlMap = useStore.getState().highlightColorMap;
    const currentColorMap = { ...useStore.getState().colorMap, ...hlMap };
    const isHighlightActive = Object.keys(hlMap).length > 0;
    if (Object.keys(currentColorMap).length === 0 && !isHighlightActive) return;

    const fragments = components.get(OBC.FragmentsManager);
    const seq = ++colorSeqRef.current;

    (async () => {
      try {
        const allGuids = [...guidMapRef.current.keys()];
        if (allGuids.length > 0) {
          const allMap = await fragments.guidsToModelIdMap(allGuids);
          if (seq !== colorSeqRef.current) return;
          await fragments.resetHighlight(allMap);
        }

        // Ghost pass: fade non-fail elements via setOpacity
        if (isHighlightActive) {
          const failGuids = [...Object.keys(hlMap)].filter(g => guidMapRef.current.has(g));
          const failMap: Record<string, Set<number>> = failGuids.length > 0
            ? await fragments.guidsToModelIdMap(failGuids)
            : {};
          if (seq !== colorSeqRef.current) return;
          for (const [modelId, fragModel] of fragments.list) {
            try {
              await fragModel.setOpacity(undefined, 0.08);
              const failIds = failMap[modelId];
              if (failIds && failIds.size > 0) {
                await fragModel.resetOpacity([...failIds]);
              }
            } catch { /* model may not support setOpacity */ }
          }
        } else {
          // Restore full opacity when highlight mode is off
          for (const fragModel of fragments.list.values()) {
            try { await fragModel.resetOpacity(undefined); } catch { /* skip */ }
          }
        }

        // When highlight active, only apply fail colors (skip base colorMap)
        const colorsToApply = isHighlightActive ? hlMap : currentColorMap;
        const byColor = new Map<string, string[]>();
        for (const [guid, hex] of Object.entries(colorsToApply)) {
          if (!guidMapRef.current.has(guid)) continue;
          const arr = byColor.get(hex) || [];
          arr.push(guid);
          byColor.set(hex, arr);
        }

        for (const [hex, guids] of byColor) {
          if (seq !== colorSeqRef.current) return;
          const map = await fragments.guidsToModelIdMap(guids);
          await fragments.highlight(
            { color: new THREE.Color(hex), renderedFaces: 1, opacity: 1, transparent: false } as any,
            map
          );
        }

        if (seq !== colorSeqRef.current) return;
        const selectedGuids = [...useStore.getState().selectedIds].filter((g) => guidMapRef.current.has(g));
        if (selectedGuids.length > 0) {
          const map = await fragments.guidsToModelIdMap(selectedGuids);
          await fragments.highlight(
            { color: new THREE.Color(0x2997ff), renderedFaces: 1, opacity: 1, transparent: false } as any,
            map
          );
        }

        await fragments.core.update(true);
      } catch {
        // Fallback: v2 fragment-level coloring
        try {
          const items = (model as any).items;
          if (!Array.isArray(items)) return;
          for (const frag of items) {
            if (typeof frag.resetColor === "function") frag.resetColor();
          }
          const byColor = new Map<string, number[]>();
          for (const [guid, hex] of Object.entries(currentColorMap)) {
            const eid = guidMapRef.current.get(guid);
            if (eid === undefined) continue;
            (byColor.get(hex) || (byColor.set(hex, []), byColor.get(hex)!)).push(eid);
          }
          for (const [hex, eids] of byColor) {
            const color = new THREE.Color(hex);
            for (const frag of items) {
              try { frag.setColor(color, eids); } catch { /* skip */ }
            }
          }
        } catch {
          console.warn("Could not apply color map");
        }
      }
    })();
  }

  // React to colorMap / selection changes
  useEffect(() => { applyColors(); }, [colorMap, highlightColorMap, selectedIds]);

  if (error) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "rgba(8, 12, 22, 0.85)" }}>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <div className="glass-panel" style={{ maxWidth: 360, padding: "1rem", textAlign: "center" }}>
            <h3 style={{ margin: 0, marginBottom: "0.4rem", fontSize: "1rem" }}>Model could not be loaded</h3>
            <p style={{ margin: 0, marginBottom: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {error}. Check file format and storage link, then retry upload.
            </p>
            <button className="btn btn-primary" onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "rgba(8, 12, 22, 0.85)", overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {isLoading && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(4, 8, 18, 0.45)", color: "white", fontSize: "0.875rem",
        }}>
          <span className="glass-chip" style={{ color: "var(--text)" }}>Loading IFC model...</span>
        </div>
      )}
      <ElementTooltip />
    </div>
  );
}
