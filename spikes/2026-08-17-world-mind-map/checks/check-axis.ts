import {
  applyDrag,
  assignLanes,
  atPercent,
  axisRange,
  formatPosition,
  formatSpan,
  laneCount,
  nextSpan,
  pinLanes,
  pinPlace,
  spanOf,
  ticksFor,
  type Span,
} from '../code/axis.ts';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        expected ${e}\n        actual   ${a}`);
}

// The seed world: two pairs that overlap each other but not across the pairs.
const seed: Span[] = [
  { id: 'sundering', start: 1, end: 14 },
  { id: 'coronation', start: 10, end: 22 },
  { id: 'siege', start: 34, end: 68 },
  { id: 'winter', start: 46, end: 96 },
];

const laneList = (spans: Span[]) => {
  const lanes = assignLanes(spans);
  return spans.map((s) => `${s.id}:${lanes.get(s.id)}`);
};

check('overlap makes a second lane', laneList(seed), [
  'sundering:0',
  'coronation:1',
  'siege:0',
  'winter:1',
]);
check('two lanes in all', laneCount(assignLanes(seed)), 2);

// A lane is reused the moment it is clear, not abandoned.
check(
  'a lane is reused once clear',
  laneList([
    { id: 'a', start: 0, end: 10 },
    { id: 'b', start: 20, end: 30 },
    { id: 'c', start: 40, end: 50 },
  ]),
  ['a:0', 'b:0', 'c:0'],
);

check(
  'three at once need three lanes',
  laneList([
    { id: 'a', start: 0, end: 30 },
    { id: 'b', start: 5, end: 25 },
    { id: 'c', start: 10, end: 20 },
  ]),
  ['a:0', 'b:1', 'c:2'],
);

// Touching is overlapping: an event ending where another begins shares the axis.
check(
  'touching counts as overlapping',
  laneList([
    { id: 'a', start: 0, end: 10 },
    { id: 'b', start: 10, end: 20 },
  ]),
  ['a:0', 'b:1'],
);

check('nothing needs no lanes', laneCount(assignLanes([])), 0);

// An event with no span of its own is a moment at the very start.
check('no span is a moment at zero', spanOf({ id: 'x', label: '', kind: 'event', x: 0, y: 0 }), {
  start: 0,
  end: 0,
});
check(
  'an end before its start is pulled back',
  spanOf({ id: 'x', label: '', kind: 'event', x: 0, y: 0, start: 12, end: 4 }),
  { start: 12, end: 12 },
);

// The same numbers, read three ways. Nothing converts.
check('pages', formatPosition(12, 'pages'), 'p. 12');
check('chapters', formatPosition(12, 'chapters'), 'ch. 12');
check('dates', formatPosition(12, 'dates'), '13 Jan 1200');
// 1200 is a leap year, so day 400 falls on 4 February, not the 5th.
check('dates, further out', formatPosition(400, 'dates'), '4 Feb 1201');

// Pins collide by their own size on the screen, not by their spans.
const pinList = (spans: Span[], from: number, to: number) => {
  const lanes = pinLanes(spans, from, to);
  return spans.map((s) => {
    const { side, tier } = pinPlace(lanes.get(s.id) ?? 0);
    return `${s.id}:${side}${tier}`;
  });
};

// Two moments that do not overlap at all, but land a page apart.
check(
  'near neighbours are separated',
  pinList(
    [
      { id: 'a', start: 40, end: 40 },
      { id: 'b', start: 41, end: 41 },
    ],
    0,
    100,
  ),
  ['a:above0', 'b:below0'],
);

// Far apart, they share the top.
check(
  'distant ones both sit above',
  pinList(
    [
      { id: 'a', start: 5, end: 5 },
      { id: 'b', start: 80, end: 80 },
    ],
    0,
    100,
  ),
  ['a:above0', 'b:above0'],
);

// Four in a heap spread both ways before climbing.
check(
  'a heap spreads either way',
  pinList(
    [
      { id: 'a', start: 50, end: 50 },
      { id: 'b', start: 51, end: 51 },
      { id: 'c', start: 52, end: 52 },
      { id: 'd', start: 53, end: 53 },
    ],
    0,
    100,
  ),
  ['a:above0', 'b:below0', 'c:above1', 'd:below1'],
);

check('the first lane hangs above', pinPlace(0), { side: 'above', tier: 0 });
check('the second below', pinPlace(1), { side: 'below', tier: 0 });
check('the third higher above', pinPlace(2), { side: 'above', tier: 1 });

// A span said as briefly as it can be.
check('a page range says the unit once', formatSpan(62, 66, 'pages'), 'p. 62–66');
check('a chapter range too', formatSpan(2, 5, 'chapters'), 'ch. 2–5');
check('a moment is just a position', formatSpan(62, 62, 'pages'), 'p. 62');
check('so is a span under a whole unit', formatSpan(62.1, 62.4, 'pages'), 'p. 62');
// February has 29 days in 1200, so day 62 is 3 March rather than the 4th.
check('dates inside one month collapse', formatSpan(62, 66, 'dates'), '3–7 Mar 1200');
check('dates across months do not', formatSpan(20, 62, 'dates'), '21 Jan 1200 – 3 Mar 1200');

// The extent of the whole story, with a little air at each end.
const range = axisRange(seed);
check('the range clears both ends', [range.from < 1, range.to > 96], [true, true]);
check('a position lands where it should', Math.round(atPercent(range.from, range.from, range.to)), 0);
check('and the far end at a hundred', Math.round(atPercent(range.to, range.from, range.to)), 100);
check('ticks span the axis', ticksFor(0, 100, 6), [0, 20, 40, 60, 80, 100]);

// A newly written event lands after everything already written.
const items = Object.fromEntries(
  seed.map((s) => [s.id, { id: s.id, label: s.id, kind: 'event' as const, x: 0, y: 0, ...s }]),
);
check('a new event lands after the last', nextSpan(items), { start: 100, end: 108 });
check('the first event of all starts at zero', nextSpan({}), { start: 0, end: 8 });

// Dragging a bar: whole units, and never inside out.
const siege = { start: 34, end: 68 };

check('moving keeps its length', applyDrag(siege, 10, 'move'), { start: 44, end: 78 });
check('moving back keeps its length', applyDrag(siege, -10, 'move'), { start: 24, end: 58 });
check('fractions of a unit round', applyDrag(siege, 2.6, 'move'), { start: 37, end: 71 });
check('a nudge under half a unit does nothing', applyDrag(siege, 0.4, 'move'), siege);

// Nothing goes before the beginning of the story, and length survives the wall.
check('it stops at the beginning', applyDrag(siege, -500, 'move'), { start: 0, end: 34 });

check('pulling the start back', applyDrag(siege, -20, 'start'), { start: 14, end: 68 });
check('pulling the start forward', applyDrag(siege, 20, 'start'), { start: 54, end: 68 });
check('the start cannot pass the end', applyDrag(siege, 500, 'start'), { start: 68, end: 68 });
check('nor go before the beginning', applyDrag(siege, -500, 'start'), { start: 0, end: 68 });

check('pulling the end out', applyDrag(siege, 20, 'end'), { start: 34, end: 88 });
check('the end cannot pass the start', applyDrag(siege, -500, 'end'), { start: 34, end: 34 });

// A shortened event becomes a moment, and a moment can be opened out again.
const moment = applyDrag(siege, -500, 'end');
check('a moment can be opened out again', applyDrag(moment, 12, 'end'), { start: 34, end: 46 });

// Dragging is what makes the lanes re-form; nothing else has to be told.
const before: Span[] = [
  { id: 'a', start: 0, end: 10 },
  { id: 'b', start: 20, end: 30 },
];
check('clear of each other, one lane', laneCount(assignLanes(before)), 1);
const dragged = applyDrag({ start: 20, end: 30 }, -15, 'move');
check(
  'dragged across, two lanes',
  laneCount(assignLanes([before[0], { id: 'b', ...dragged }])),
  2,
);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
