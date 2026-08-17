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

/** More than one of a kind and they stop being cards; they become a place to go into. */
export const GROUP_AT = 2;

export const groupId = (owner: string, kind: Kind) => `grp:${owner}:${kind}`;

export function parseGroup(id: string): { owner: string; kind: Kind } | null {
  if (!id.startsWith('grp:')) return null;
  const [, owner, kind] = id.split(':');
  return { owner, kind: kind as Kind };
}

export const groupLabel = (kind: Kind) => (kind === 'event' ? 'Events' : 'Objects');

/**
 * A stack in the ring says how many it holds. The same stack in the middle
 * does not — you are already inside it, and the ring around it is the count.
 */
export const showsCount = (isGroup: boolean, role: string) => isGroup && role !== 'centre';

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

export function ringEntries(focus: string, items: Items, parents: Parents): RingEntry[] {
  const group = parseGroup(focus);

  // Inside a stack: the cards themselves, never re-stacked.
  if (group) {
    return childrenOf(group.owner, parents)
      .filter((id) => items[id]?.kind === group.kind)
      .map((id) => ({ id, kind: items[id].kind, label: items[id].label, isGroup: false, count: 1 }));
  }

  const kids = childrenOf(focus, parents);
  const entries: RingEntry[] = [];

  for (const kind of ['event', 'object'] as Kind[]) {
    const ofKind = kids.filter((id) => items[id]?.kind === kind);
    if (ofKind.length >= GROUP_AT) {
      entries.push({
        id: groupId(focus, kind),
        kind,
        label: groupLabel(kind),
        isGroup: true,
        count: ofKind.length,
      });
    } else if (ofKind.length === 1) {
      const id = ofKind[0];
      entries.push({ id, kind, label: items[id].label, isGroup: false, count: 1 });
    }
  }

  return entries;
}

export function labelOf(id: string, items: Items) {
  const group = parseGroup(id);
  return group ? groupLabel(group.kind) : (items[id]?.label ?? id);
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
