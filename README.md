# world-map-spike

A spike: **a writer's world as a mind map you build by dropping things onto it.**

```bash
npm install && npm run dev
```

Then <http://localhost:5173>. Nothing is saved — reload and it starts over.

The world is the circle in the middle. Events and objects become part of it by
being dragged onto it, and stop being part of it by being dragged off. That one
gesture is what the spike is for.

Everything else lives in `spikes/2026-08-17-world-mind-map/`:
[findings.md](spikes/2026-08-17-world-mind-map/findings.md) for what was learned
and what is still unverified, [ui.md](spikes/2026-08-17-world-mind-map/ui.md)
for the interface as built and the questions it leaves open.

Narrative structure — acts, chapters, story time — is deliberately not here.
That question belongs to the timeline spike.

## Stack

React 19 + TypeScript + Vite, with [React Flow](https://reactflow.dev)
(`@xyflow/react`) doing the canvas: panning, zoom, edges and node dragging. The
drop-to-relate gesture is hand-written on top of it, because React Flow has no
such thing — its native way to make a relationship is to drag a wire between
two ports, which is not what this is.
