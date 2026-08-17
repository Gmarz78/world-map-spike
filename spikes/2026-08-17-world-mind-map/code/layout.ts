// One ring at a time. Whatever is focused sits at the origin and its children
// stand around it; everything deeper is reached by clicking in, not by drawing
// it smaller.

export const CENTRE_SIZE = 180;
export const ITEM_SIZE = 116;
export const GROUP_SIZE = 130;

const MIN_RADIUS = 300;
const SPACING = 46;

export function ringRadius(count: number) {
  return Math.max(MIN_RADIUS, (count * SPACING) / 1.6);
}

/** Centres for `count` cards, evenly spaced, first one at the top. */
export function ringPositions(count: number) {
  const radius = ringRadius(count);
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / count;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

/** React Flow positions from the top-left; the layout thinks in centres. */
export const toTopLeft = (centre: { x: number; y: number }, size: number) => ({
  x: centre.x - size / 2,
  y: centre.y - size / 2,
});

export const toCentre = (topLeft: { x: number; y: number }, size: number) => ({
  x: topLeft.x + size / 2,
  y: topLeft.y + size / 2,
});
