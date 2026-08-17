// The story's axis: how far along a thing sits, how long it runs, and what a
// position on it is called.
//
// The axis is plain numbers throughout. A world says what those numbers *mean*
// — pages, chapters, or days — and nothing but the labelling changes when it
// says something different. Moving an event never converts anything.

import type { Item, Items } from './grouping';

export type Scale = 'pages' | 'chapters' | 'dates';

export type Span = { id: string; start: number; end: number };

export const SCALES: { id: Scale; label: string; unit: string }[] = [
  { id: 'pages', label: 'Pages', unit: 'pages' },
  { id: 'chapters', label: 'Chapters', unit: 'chapters' },
  { id: 'dates', label: 'Dates', unit: 'days' },
];

/** An event with no span of its own is a moment at the very start. */
export const spanOf = (item: Item): { start: number; end: number } => ({
  start: item.start ?? 0,
  end: Math.max(item.end ?? item.start ?? 0, item.start ?? 0),
});

/** Where a newly written event lands: just after everything already written. */
export function nextSpan(items: Items) {
  const ends = Object.values(items)
    .filter((i) => i.kind === 'event')
    .map((i) => spanOf(i).end);
  const start = ends.length ? Math.max(...ends) + 4 : 0;
  return { start, end: start + 8 };
}

/** The whole story's extent, with a little air at each end. */
export function axisRange(spans: Span[]) {
  if (spans.length === 0) return { from: 0, to: 1 };
  const from = Math.min(...spans.map((s) => s.start));
  const to = Math.max(...spans.map((s) => s.end));
  const pad = Math.max((to - from) * 0.06, 1);
  return { from: from - pad, to: to + pad };
}

/**
 * Swim lanes. Two events that share any of the axis cannot share a row, so
 * each takes the first row that is already clear by the time it begins.
 * Overlap is what makes a second lane exist — nothing else does.
 */
export function assignLanes(spans: Span[]): Map<string, number> {
  const inOrder = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const lastEndPerLane: number[] = [];
  const lanes = new Map<string, number>();

  for (const span of inOrder) {
    let lane = lastEndPerLane.findIndex((end) => end < span.start);
    if (lane === -1) {
      lane = lastEndPerLane.length;
      lastEndPerLane.push(span.end);
    } else {
      lastEndPerLane[lane] = span.end;
    }
    lanes.set(span.id, lane);
  }
  return lanes;
}

export const laneCount = (lanes: Map<string, number>) =>
  lanes.size === 0 ? 0 : Math.max(...lanes.values()) + 1;

// Dates are days counted from a world epoch. Invented outright — it is the one
// place a bare number has to become something with a shape of its own.
const EPOCH = Date.UTC(1200, 0, 1);
const DAY = 86_400_000;

export function formatPosition(value: number, scale: Scale): string {
  const n = Math.round(value);
  if (scale === 'pages') return `p. ${n}`;
  if (scale === 'chapters') return `ch. ${n}`;
  return new Date(EPOCH + n * DAY).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Evenly spaced places to label along the axis. */
export function ticksFor(from: number, to: number, count = 6) {
  const step = (to - from) / (count - 1);
  return Array.from({ length: count }, (_, i) => from + step * i);
}

/** Where a position falls across the track, as a percentage. */
export const atPercent = (value: number, from: number, to: number) =>
  ((value - from) / (to - from)) * 100;
