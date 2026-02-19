import * as OBC from "@thatopen/components";
import * as THREE from "three";

export type ModelIdMap = Record<string, number[]>;

function dedupeGuids(guids: Iterable<string>): string[] {
  const out = new Set<string>();
  for (const guid of guids) {
    if (guid) out.add(guid);
  }
  return [...out];
}

export async function guidsToModelIdMap(
  components: OBC.Components,
  guids: Iterable<string>
): Promise<ModelIdMap> {
  const fragments = components.get(OBC.FragmentsManager);
  const clean = dedupeGuids(guids);
  if (clean.length === 0) return {};
  return fragments.guidsToModelIdMap(clean) as Promise<ModelIdMap>;
}

export async function resetHighlights(
  components: OBC.Components,
  map?: ModelIdMap
): Promise<void> {
  const fragments = components.get(OBC.FragmentsManager);
  await fragments.resetHighlight(map);
}

export async function highlightGuids(
  components: OBC.Components,
  guids: Iterable<string>,
  hex: string,
  opacity = 0.35
): Promise<ModelIdMap> {
  const fragments = components.get(OBC.FragmentsManager);
  const map = await guidsToModelIdMap(components, guids);
  if (Object.keys(map).length === 0) return map;
  const color = new THREE.Color(hex);
  await fragments.highlight(
    {
      r: Math.round(color.r * 255),
      g: Math.round(color.g * 255),
      b: Math.round(color.b * 255),
      opacity,
    },
    map
  );
  return map;
}

async function setVisibleByModelIdMap(
  components: OBC.Components,
  modelIdMap: ModelIdMap,
  visible: boolean
) {
  const fragments = components.get(OBC.FragmentsManager);
  const ops: Promise<void>[] = [];
  for (const [modelId, ids] of Object.entries(modelIdMap)) {
    const model = fragments.list.get(modelId);
    if (!model || ids.length === 0) continue;
    ops.push(model.setVisible(ids, visible));
  }
  await Promise.all(ops);
  await fragments.core.update(true);
}

export async function hideGuids(components: OBC.Components, guids: Iterable<string>) {
  const map = await guidsToModelIdMap(components, guids);
  if (Object.keys(map).length === 0) return;
  await setVisibleByModelIdMap(components, map, false);
}

export async function showGuids(components: OBC.Components, guids: Iterable<string>) {
  const map = await guidsToModelIdMap(components, guids);
  if (Object.keys(map).length === 0) return;
  await setVisibleByModelIdMap(components, map, true);
}

export async function isolateGuids(components: OBC.Components, guids: Iterable<string>) {
  const fragments = components.get(OBC.FragmentsManager);
  const visibleMap = await guidsToModelIdMap(components, guids);
  const hideOps: Promise<void>[] = [];
  for (const model of fragments.list.values()) {
    hideOps.push(model.setVisible(undefined, false));
  }
  await Promise.all(hideOps);
  await setVisibleByModelIdMap(components, visibleMap, true);
}
