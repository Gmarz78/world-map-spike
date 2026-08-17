// The world stays where it is. Nothing replaces it and nothing is navigated
// to — a category opens as a branch growing out of the badge that names it,
// in the direction that badge already points.

export const CENTRE_SIZE = 300;
export const ITEM_SIZE = 128;

/** Room for one card along an arc, including the air beside it. */
const ALONG_ARC = ITEM_SIZE + 34;
/** How far a branch stands off the card it grows from. */
const REACH = 128;

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

const polar = (radius: number, angle: number) => ({
  x: Math.cos(angle) * radius,
  y: Math.sin(angle) * radius,
});

/**
 * A branch: `count` cards on an arc centred on `direction`, standing clear of a
 * card of `fromSize`. It reaches further out rather than crowding — if the
 * cards will not fit inside the wedge allowed, the arc moves outwards until
 * they do.
 *
 * Returned relative to the card the branch grows from.
 */
export function branchLayout(
  count: number,
  fromSize: number,
  direction: number,
  maxWedge: number,
) {
  const clear = fromSize / 2 + ITEM_SIZE / 2 + REACH;
  const radius = Math.max(clear, (count * ALONG_ARC) / maxWedge);
  const step = ALONG_ARC / radius;
  const wedge = step * count;

  return Array.from({ length: count }, (_, i) =>
    polar(radius, direction - wedge / 2 + step * (i + 0.5)),
  );
}

/** How wide a branch may open. Deeper ones fan less, so they stay legible. */
export const wedgeAt = (depth: number, branches: number) =>
  depth === 0 ? Math.max(1.2, Math.min(2.3, (Math.PI * 2) / Math.max(branches, 1) - 0.6)) : 1.25;

/**
 * Badges on a card away from the middle point outwards, so a branch never
 * folds back over the map. On the world itself they keep their even spread
 * around the whole rim, since it has no outward.
 */
export function outwardBadgeAngles(count: number, outward: number, spread = 0.8) {
  return Array.from({ length: count }, (_, i) => outward + (i - (count - 1) / 2) * spread);
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
