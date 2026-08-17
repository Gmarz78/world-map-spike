# world-map-spike

A spike: **a writer's world as a mind map you build by dropping things onto it.**

```bash
npm install && npm run dev
```

Then <http://localhost:5173>. Nothing is saved — reload and it starts over.

The world is the circle in the middle, and it stays there. Press a badge on its
rim and that category unfolds as a branch; press a card to fold away what it has
open. Events and objects become part of something by being dragged onto it, and
that gesture is what the spike is for.

There is a second view of the same world — a **timeline**, where an event is a
bar with a start and an end, overlaps stack into lanes, and the axis can be read
as pages, chapters or dates. Reached from the pill at the top right. Same cards,
same colours, one set of relationships read two ways.

Narrative structure — acts, chapters, story time — is deliberately not here.
That question belongs to the timeline spike.

## Picking it up again

Read in this order:

1. **[findings.md](spikes/2026-08-17-world-mind-map/findings.md)** — what was
   tried, what was learned, and the **handoff at the end**: what is settled,
   what is still open, and what looks finished but is not.
2. **[ui.md](spikes/2026-08-17-world-mind-map/ui.md)** — the interface as built,
   the rules behind it, and its open questions.

The next phase is **Derive**: nothing has been written down as entities and
fields yet, and no real data has been near any of it.

## Where the thinking lives

Two modules have no React in them, which is deliberate — they hold the rules,
and they can be exercised straight from Node without a browser:

- `code/grouping.ts` — what belongs to what, categories, badges, folding.
- `code/axis.ts` — spans, lanes, scales, dragging arithmetic.

The rest (`WorldMap.tsx`, `Timeline.tsx`, `CircleNode.tsx`, `layout.ts`) is
drawing and pointer handling.

Those rules are held to account by 75 assertions in
[checks/](spikes/2026-08-17-world-mind-map/checks/) — `node check-grouping.ts`,
`node check-axis.ts`, no runner and no build step. Not a test suite; see the
README there for why it exists and why it lives outside `code/`.

## Stack

React 19 + TypeScript + Vite, with [React Flow](https://reactflow.dev)
(`@xyflow/react`) doing the canvas: panning, zoom, edges and node dragging. The
drop-to-relate gesture is hand-written on top of it, because React Flow has no
such thing — its native way to make a relationship is to drag a wire between
two ports, which is not what this is. Inter is bundled, not fetched, so it runs
with no network.

## If the page comes up blank

Vite's HMR can hold a broken module graph after an export is removed while
another file still imports it, and a plain reload will not clear it. Restart the
dev server, and hard-reload the tab:

```bash
rm -rf node_modules/.vite && npm run dev
```
