// One ring at a time. Whatever is focused sits at the origin and its children
// stand around it; everything deeper is reached by clicking in, not by drawing
// it smaller.

// The middle of the map is much larger than its ring: big enough to carry
// labelled badges on its rim, and to read as the thing everything else is
// hanging off.
export const CENTRE_SIZE = 340;
export const ITEM_SIZE = 128;

const MIN_RADIUS = 380;
const SPACING = 50;

/**
 * Badges are spread evenly right around a card's rim, 360°/n apart, clockwise
 * from midnight — one at midnight, three at 120°, 240° and 360°, and so on.
 *
 * A pair is the exception: turned a quarter so it sits horizontally, at 90° and
 * 270°, because two badges stacked above and below the name read as a column
 * rather than as a pair.
 */
export function badgeAngles(count: number) {
  const turn = count === 2 ? -90 : 0;
  return Array.from({ length: count }, (_, i) => {
    const clockwiseFromMidnight = ((i + 1) * 360) / count + turn;
    // Screen angles run from 3 o'clock with y downwards, so midnight is -90°.
    return ((clockwiseFromMidnight - 90) * Math.PI) / 180;
  });
}

/** A point on the rim, as percentages, for placing a badge with CSS. */
export function rimPercent(angle: number) {
  return { left: 50 + 50 * Math.cos(angle), top: 50 + 50 * Math.sin(angle) };
}

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
