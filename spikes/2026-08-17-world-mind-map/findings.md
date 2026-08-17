# Spike — world-mind-map

**Started:** 2026-08-17
**Exploring:** whether a writer can see and build their world as a mind map —
one circular card for the world in the middle, and events and objects becoming
part of it by being dragged onto it. Narrative structure is deliberately out of
scope for now; the timeline spike already holds that question.

**Dev-only entry:** `src/App.tsx` — the single import of
`spikes/2026-08-17-world-mind-map/code/WorldMap`. Nothing else in the host app
touches `spikes/`.

**Run it:** `npm run dev` in `C:\Dev\world-map-spike`, then
<http://localhost:5173>.

---

## 2026-08-17 — Stack: React Flow, unchallenged

**Tried:** searched for the current state of React Flow and its rivals before
scaffolding, per the stack challenge.
**Happened:** `@xyflow/react` is at 12.11.3, published four days ago, with
React 19 support. The alternatives that surfaced — JsPlumb, JointJS, GoJS — are
commercial products marketing against it, not evidence of a problem. One real
caveat is documented rather than hidden: React Flow is DOM-based and its own
maintainers say it is not built for very large graphs. A world of a few hundred
cards is comfortably inside that.
**Means:** no challenge raised. React Flow gives us panning, zoom, edge
rendering and node dragging on day one, which is the part of a canvas that is
tedious rather than interesting.
**Confidence:** proven (the version and its publish date), indicative (the
performance ceiling — read, not measured).

## 2026-08-17 — React Flow does not have this gesture

**Tried:** building "drop a card on another card to relate them" on top of
React Flow.
**Happened:** React Flow's native way to make a relationship is to drag a wire
out of a handle on one node into a handle on another. There is no built-in
drop-onto-a-node. Handles are off entirely here — both are invisible and sit at
the centre of the circle purely so an edge has somewhere to attach — and the
gesture is hand-written on `onNodeDrag` / `onNodeDragStop` with a nearest-centre
hit test.
**Means:** the library is doing the canvas, not the interaction. That is the
right split for this spike: the gesture is the thing being explored, so it
should not be inherited from a library. It also means React Flow is a thinner
dependency than it looks, and less would be lost by dropping it later.
**Confidence:** assumed — written, not yet driven (see below).

## 2026-08-17 — The map is not yet verified by hand

**Tried:** driving the running app in the in-app Browser pane to confirm that
dragging a card onto the world attaches it.
**Happened:** the page renders and its content is correct in the accessibility
tree, but every node stayed `visibility: hidden` and no drag could be tested. A
probe in the page showed the cause: `ResizeObserver` and `requestAnimationFrame`
both never fire, because the Browser pane is not displayed and a page that is
not compositing frames does not run either. React Flow measures its nodes
through a `ResizeObserver`, so with no frames it never learns how big anything
is and keeps everything hidden.
**Means:** this is an artefact of the pane being closed, not a fault in the
spike — a barebones two-node React Flow example fails identically in the same
conditions. It cost about twenty minutes chasing a phantom sizing bug first, so
it is written down: **before concluding anything about a canvas library here,
check that `requestAnimationFrame` fires.** The map's actual behaviour is
unverified until it is opened in a visible window.
**Confidence:** proven (the cause), assumed (that the map behaves as intended
once frames run).

## 2026-08-17 — Choices made without being asked

Details that came up and were decided in passing, all cheap to change:

- **The world cannot be dragged.** It is the centre of the map and the layout
  puts it at the origin; panning moves the canvas instead.
- **Attached cards have no position of their own.** Where a card sits falls out
  of whose child it is and how many siblings it has, so dropping something on
  the world rearranges the ring rather than leaving it where the hand let go.
- **Dropping on empty canvas detaches.** Attach and detach are the same gesture
  read two ways, which means there is no second way to break a relationship —
  no menu, no delete key, no unlink button.
- **Cards can nest.** An object dropped on an event belongs to the event, not to
  the world. The seed data does not show this, but the layout and the hit test
  both handle it, and a card cannot be dropped onto its own descendant.
- **Seed world:** Aetheria, with two things already placed and five loose, so
  the difference between placed and unplaced is visible before anything is
  touched.
