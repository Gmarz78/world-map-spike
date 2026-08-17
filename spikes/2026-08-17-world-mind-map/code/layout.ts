// Radial mind-map layout. Attached nodes have no position of their own —
// where they sit falls out of who their parent is and how many siblings
// they have, the same way a chapter's number falls out of what precedes it.

export const WORLD_SIZE = 176;
export const ITEM_SIZE = 116;

export const RING_1 = 320;
export const RING_2 = 215;

type Placeable = { id: string; parentId: string | null; isWorld: boolean };

/** Centre points, keyed by node id. Loose nodes are absent — they keep theirs. */
export function radialLayout(items: Placeable[]): Record<string, { x: number; y: number }> {
  const children: Record<string, string[]> = {};
  for (const item of items) {
    if (item.parentId) (children[item.parentId] ??= []).push(item.id);
  }

  const centres: Record<string, { x: number; y: number }> = {};
  const world = items.find((i) => i.isWorld);
  if (!world) return centres;

  centres[world.id] = { x: 0, y: 0 };
  place(world.id, 0, 0, -Math.PI / 2, Math.PI * 2, 1);

  function place(id: string, cx: number, cy: number, from: number, span: number, depth: number) {
    const kids = children[id] ?? [];
    if (kids.length === 0) return;

    const radius = depth === 1 ? RING_1 : RING_2;
    const step = span / kids.length;

    kids.forEach((kid, i) => {
      const angle = from + step * (i + 0.5);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      centres[kid] = { x, y };
      // Grandchildren fan outward from the parent's own direction, never back
      // over the middle of the map.
      place(kid, x, y, angle - Math.min(step, 1.5) / 2, Math.min(step, 1.5), depth + 1);
    });
  }

  return centres;
}

export const sizeOf = (isWorld: boolean) => (isWorld ? WORLD_SIZE : ITEM_SIZE);

/** React Flow positions from the top-left; the layout thinks in centres. */
export const toTopLeft = (centre: { x: number; y: number }, isWorld: boolean) => ({
  x: centre.x - sizeOf(isWorld) / 2,
  y: centre.y - sizeOf(isWorld) / 2,
});

export const toCentre = (topLeft: { x: number; y: number }, isWorld: boolean) => ({
  x: topLeft.x + sizeOf(isWorld) / 2,
  y: topLeft.y + sizeOf(isWorld) / 2,
});
