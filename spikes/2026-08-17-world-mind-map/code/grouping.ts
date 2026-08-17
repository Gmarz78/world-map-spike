// What stands around the focused card, and what a click on it means.
//
// Groups are a way of drawing, not a thing that exists. A group id names the
// card it hangs off and the kind it gathers, so nothing about grouping is ever
// stored — change what belongs to what and the stacks re-form by themselves.

export type Kind = 'world' | 'event' | 'object';

export type Item = {
  id: string;
  label: string;
  kind: Kind;
  /** Where it sits when it belongs to nothing. Ignored once it is placed. */
  x: number;
  y: number;
};

export type Items = Record<string, Item>;
export type Parents = Record<string, string | null>;

export const groupId = (owner: string, kind: Kind) => `grp:${owner}:${kind}`;

export function parseGroup(id: string): { owner: string; kind: Kind } | null {
  if (!id.startsWith('grp:')) return null;
  const [, owner, kind] = id.split(':');
  return { owner, kind: kind as Kind };
}

export const groupLabel = (kind: Kind) => (kind === 'event' ? 'Events' : 'Objects');

/**
 * The empty place at the end of a category's ring. It is not a thing in the
 * world, only somewhere to press, so it has no entry anywhere else.
 */
export const addSlotId = (categoryId: string) => `add:${categoryId}`;

export function parseAddSlot(id: string): { owner: string; kind: Kind } | null {
  return id.startsWith('add:') ? parseGroup(id.slice(4)) : null;
}

export type Badge = { id: string; kind: Kind; label: string; count: number };

/**
 * What a card holds, by kind, worn on its rim — a card says what is inside it
 * without being opened. On the card in the middle these are the way in: each
 * badge is a whole category, and clicking one goes to it.
 */
export function badgesFor(id: string, items: Items, parents: Parents): Badge[] {
  // A stack holds one kind: itself. Its own badge would only repeat its name.
  const group = parseGroup(id);
  if (group) {
    const count = childrenOf(group.owner, parents).filter(
      (c) => items[c]?.kind === group.kind,
    ).length;
    return count
      ? [{ id, kind: group.kind, label: groupLabel(group.kind), count }]
      : [];
  }

  const kids = childrenOf(id, parents);
  const badges: Badge[] = [];
  for (const kind of ['event', 'object'] as Kind[]) {
    const count = kids.filter((c) => items[c]?.kind === kind).length;
    if (count) badges.push({ id: groupId(id, kind), kind, label: groupLabel(kind), count });
  }
  return badges;
}

/**
 * A stack in the middle wears no badge: you are already inside it, and the ring
 * around it is the count.
 */
export const showsBadges = (isGroup: boolean, role: string) => !(isGroup && role === 'centre');

/** Dropping onto a group means dropping onto the card the group hangs off. */
export const resolveTarget = (id: string) => parseGroup(id)?.owner ?? id;

export const childrenOf = (id: string, parents: Parents) =>
  Object.keys(parents).filter((c) => parents[c] === id);

export type RingEntry = {
  id: string;
  kind: Kind;
  label: string;
  isGroup: boolean;
  count: number;
};

/**
 * The map alternates. A **card** in the middle has no ring at all: what it
 * holds is worn on its rim as categories. A **category** in the middle has its
 * members standing around it.
 */
export function ringEntries(focus: string, items: Items, parents: Parents): RingEntry[] {
  const group = parseGroup(focus);
  if (!group) return [];

  return childrenOf(group.owner, parents)
    .filter((id) => items[id]?.kind === group.kind)
    .map((id) => ({ id, kind: items[id].kind, label: items[id].label, isGroup: false, count: 1 }));
}

export function labelOf(id: string, items: Items) {
  const group = parseGroup(id);
  return group ? groupLabel(group.kind) : (items[id]?.label ?? id);
}

/**
 * The line under the name on the card in the middle: what this thing is, and
 * whose. Only the middle carries it — in the ring a card is understood by the
 * company it is standing in.
 */
export function subtitleFor(id: string, items: Items, parents: Parents): string {
  const group = parseGroup(id);
  if (group) {
    const count = childrenOf(group.owner, parents).filter(
      (c) => items[c]?.kind === group.kind,
    ).length;
    const things = count === 1 ? 'thing' : 'things';
    const doing =
      group.kind === 'event'
        ? count === 1
          ? 'happens'
          : 'happen'
        : count === 1
          ? 'exists'
          : 'exist';
    return `${groupLabel(group.kind)} of ${labelOf(group.owner, items)} — the ${count} ${things} that ${doing} in it`;
  }

  const item = items[id];
  if (!item) return '';
  if (item.kind === 'world') {
    return 'A world — everything on the map belongs somewhere inside it';
  }

  const article = item.kind === 'event' ? 'An event' : 'An object';
  const doing = item.kind === 'event' ? 'happens' : 'exists';
  const parent = parents[id];
  return parent
    ? `${article} of ${labelOf(parent, items)} — something that ${doing} there`
    : `${article} — something that ${doing}`;
}

export const kindOf = (id: string, items: Items): Kind =>
  parseGroup(id)?.kind ?? items[id]?.kind ?? 'object';

/** Everything at or under `id`, so nothing can be dropped inside itself. */
export function descendantsOf(id: string, parents: Parents) {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [child, parent] of Object.entries(parents)) {
      if (parent && out.has(parent) && !out.has(child)) {
        out.add(child);
        grew = true;
      }
    }
  }
  return out;
}
