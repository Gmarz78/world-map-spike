import {
  membersOf,
  foldAway,
  openBranches,
  parseGroup,
  resolveTarget,
  descendantsOf,
  groupId,
  labelOf,
  badgesFor,
  addSlotId,
  parseAddSlot,
  subtitleFor,
  trailTo,
  appearancesOf,
  type Items,
  type Parents,
} from '../code/grouping.ts';
import {
  badgeAngles,
  rimPercent,
} from '../code/layout.ts';

const item = (id: string, label: string, kind: 'world' | 'event' | 'object') => ({
  id,
  label,
  kind,
  x: 0,
  y: 0,
});

const items: Items = Object.fromEntries(
  [
    item('world', 'Aetheria', 'world'),
    item('e-sundering', 'The Sundering', 'event'),
    item('e-coronation', 'Coronation of Vela', 'event'),
    item('e-siege', 'Siege of Ravenhold', 'event'),
    item('o-crown', 'The Ember Crown', 'object'),
    item('o-ledger', 'The Salt Ledger', 'object'),
    item('e-winter', 'The Long Winter', 'event'),
    item('o-ring', "Vela's Ring", 'object'),
  ].map((i) => [i.id, i]),
);

const parents: Parents = {
  'e-sundering': 'world',
  'e-coronation': 'world',
  'e-siege': 'world',
  'o-crown': 'world',
  'o-ledger': 'e-siege',
};

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        expected ${e}\n        actual   ${a}`);
}

const branch = (owner: string, kind: 'event' | 'object', i = items, p = parents) =>
  membersOf(owner, kind, i, p).map((id) => i[id].label);

// A branch is what a card holds of one kind, in the order it was written down.
check('the events of the world', branch('world', 'event'), [
  'The Sundering',
  'Coronation of Vela',
  'Siege of Ravenhold',
]);
check('a branch of one', branch('e-siege', 'object'), ['The Salt Ledger']);
check('a branch of none', branch('o-ledger', 'event'), []);
check('kinds do not mix', branch('e-siege', 'event'), []);

// Group ids round-trip, and a drop on a stack means a drop on its owner.
check('parse group', parseGroup(groupId('e-siege', 'object')), {
  owner: 'e-siege',
  kind: 'object',
});
check('plain id is not a group', parseGroup('e-siege'), null);
check('drop on stack -> its owner', resolveTarget(groupId('world', 'event')), 'world');
check('drop on card -> that card', resolveTarget('e-siege'), 'e-siege');
check('stack label', labelOf(groupId('world', 'event'), items), 'Events');
check('card label', labelOf('e-siege', items), 'Siege of Ravenhold');

// Nothing may be dropped inside itself.
check('descendants of the Siege', [...descendantsOf('e-siege', parents)], ['e-siege', 'o-ledger']);
check('descendants of the world', [...descendantsOf('world', parents)].length, 6);

// Badges: what a card holds, worn on its rim.
const badge = (id: string, i = items, p = parents) =>
  badgesFor(id, i, p).map((b) => `${b.label}:${b.count}`);

check('Aetheria wears both categories', badge('world'), ['Events:3', 'Objects:1']);
check('the Siege wears one', badge('e-siege'), ['Objects:1']);
check('the Ledger wears none', badge('o-ledger'), []);
check('badges follow the relationships', badge('world', items, { ...parents, 'o-ring': 'world' }), [
  'Events:3',
  'Objects:2',
]);

// A badge is the way in: its id is the category it opens.
check(
  'a badge opens its category',
  badgesFor('world', items, parents).map((b) => b.id),
  [groupId('world', 'event'), groupId('world', 'object')],
);
check(
  'and that category names its members',
  membersOf('e-siege', badgesFor('e-siege', items, parents)[0].kind, items, parents),
  ['o-ledger'],
);

// Folding a branch takes everything that was only reachable through it.
const worldEvents = groupId('world', 'event');
const siegeObjects = groupId('e-siege', 'object');
const ledgerEvents = groupId('o-ledger', 'event');

const opened = new Set([worldEvents, siegeObjects, ledgerEvents]);

check(
  'folding the world takes the limb',
  [...foldAway([worldEvents], items, parents, opened, 'world')],
  [],
);
check(
  'folding a leaf leaves the rest',
  [...foldAway([ledgerEvents], items, parents, opened, 'world')].sort(),
  [siegeObjects, worldEvents].sort(),
);
check(
  'folding the middle takes what hung off it',
  [...foldAway([siegeObjects], items, parents, opened, 'world')],
  [worldEvents],
);
check(
  'a branch not reachable at all is dropped',
  [...foldAway([], items, parents, new Set([siegeObjects]), 'world')],
  [],
);

check(
  'what a card has open',
  openBranches('world', items, parents, opened).map((b) => b.id),
  [worldEvents],
);
check('a card with nothing open', openBranches('o-ring', items, parents, opened), []);

// Where a thing touches the story, read off the tree it already sits in.
const withCrownHistory: Parents = {
  ...parents,
  'e-forging': 'o-crown',
  'e-crownlost': 'o-crown',
};
const moreItems: Items = {
  ...items,
  'e-forging': item('e-forging', 'The Forging', 'event'),
  'e-crownlost': item('e-crownlost', 'The Crown is Lost', 'event'),
};

check(
  'events belonging to it are its history',
  appearancesOf('o-crown', moreItems, withCrownHistory),
  ['e-forging', 'e-crownlost'],
);
check('the event it belongs to counts too', appearancesOf('o-ledger', items, parents), ['e-siege']);
check('an object touching nothing', appearancesOf('o-ring', items, parents), []);
check(
  'both directions at once',
  appearancesOf('o-ledger', moreItems, { ...withCrownHistory, 'e-forging': 'o-ledger' }),
  ['e-siege', 'e-forging'],
);
check('belonging to the world is not an appearance', appearancesOf('o-crown', items, parents), []);

// Handing a card from one view to the other: the way down to it.
check('the world is its own trail', trailTo('world', items, parents), ['world']);
check('an event of the world', trailTo('e-siege', items, parents), [
  'world',
  groupId('world', 'event'),
  'e-siege',
]);
check('an object one level deeper', trailTo('o-ledger', items, parents), [
  'world',
  groupId('world', 'event'),
  'e-siege',
  groupId('e-siege', 'object'),
  'o-ledger',
]);

// The sub-heading says what the middle card is, and whose.
const sub = (id: string) => subtitleFor(id, items, parents);
check(
  'a world says what it is for',
  sub('world'),
  'A world — everything on the map belongs somewhere inside it',
);
check(
  'a category counts and explains',
  sub(groupId('world', 'event')),
  'Events of Aetheria — the 3 things that happen in it',
);
check(
  'one member reads as one',
  sub(groupId('e-siege', 'object')),
  'Objects of Siege of Ravenhold — the 1 thing that exists in it',
);
check('an event names its parent', sub('e-siege'), 'An event of Aetheria — something that happens there');
check(
  'an object names its parent',
  sub('o-ledger'),
  'An object of Siege of Ravenhold — something that exists there',
);

// The empty slot knows which category it would add to.
check('the slot names its category', parseAddSlot(addSlotId(groupId('world', 'event'))), {
  owner: 'world',
  kind: 'event',
});
check('a card is not a slot', parseAddSlot('e-siege'), null);
check('a category is not a slot', parseAddSlot(groupId('world', 'event')), null);
check(
  'the slot is not a thing in the world',
  membersOf('world', 'event', items, parents).some((id) => id.startsWith('add:')),
  false,
);

// Badges spread evenly around the rim, clockwise from midnight.
const clockDegrees = (n: number) =>
  badgeAngles(n).map((a) => Math.round(((a * 180) / Math.PI + 90 + 360) % 360) || 360);

check('one badge sits at midnight', clockDegrees(1), [360]);
check('two are opposite, and horizontal', clockDegrees(2), [90, 270]);
check('three are thirds', clockDegrees(3), [120, 240, 360]);
check('four are quarters', clockDegrees(4), [90, 180, 270, 360]);

const round = (p: { left: number; top: number }) => ({
  left: Math.round(p.left),
  top: Math.round(p.top),
});
check('midnight is the top of the rim', round(rimPercent(badgeAngles(1)[0])), { left: 50, top: 0 });
check('a pair sits right and left', badgeAngles(2).map((a) => round(rimPercent(a))), [
  { left: 100, top: 50 },
  { left: 0, top: 50 },
]);
check('180 is the bottom', round(rimPercent(badgeAngles(4)[1])), { left: 50, top: 100 });
check('90 is the right', round(rimPercent(badgeAngles(4)[0])), { left: 100, top: 50 });

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
