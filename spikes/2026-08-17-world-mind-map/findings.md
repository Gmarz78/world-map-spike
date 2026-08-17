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

## 2026-08-17 — Decomposition: one ring at a time

**Tried:** collapsing two or more children of the same kind into a single
`Events` / `Objects` card that you click into, instead of drawing the whole
tree at once.
**Happened:** the map went from a recursive spider diagram to one ring at a
time, with a breadcrumb for the way back. The change that made it cheap: a
stack has no identity of its own, only `grp:<owner>:<kind>`, so nothing about
grouping is stored and the stacks re-form from whatever the relationships
currently are. Taking an event away from a world that had two dissolves the
stack back into a named card with nothing to clean up.
**Means:** the whole grouping rule lives in one small module (`grouping.ts`)
with no React in it, so it can be exercised without a browser — which is how it
was checked (14 assertions covering stacking, dissolving, drilling in,
resolving a drop on a stack to its owner, and the descendant guard).
**Confidence:** proven for the rules, assumed for how it feels.

## 2026-08-17 — Clicking now means two things, and one of them had to move

**Tried:** click-a-card-to-go-into-it, alongside the existing drag gesture.
**Happened:** rename could no longer be a double-click, since the first click
would already have drilled in. It moved to a **single click on the middle
card** — the one card where a click has nowhere further to go. A separate trap
came with it: a drag that finishes on top of the card being dragged also fires a
DOM `click`, which read as "go into this" the instant you placed something. It
is suppressed with a flag cleared on a timeout after the drag, since the click
always arrives in the same task as the pointer-up.
**Means:** navigation and arrangement now share the pointer, and the seam
between them is the one thing most likely to feel wrong in use.
**Confidence:** assumed — the flag is written and builds, but has not been
driven (no frames; see above).

## 2026-08-17 — Counts moved to the rim

**Tried:** replacing the count printed under a stack's name with small
kind-coloured badges worn on the rim of every card.
**Happened:** the meaning generalised on the way. A count under a name could
only ever describe a stack; a badge on a rim describes any card — Aetheria wears
a blue 3 and a green 1, the Siege of Ravenhold wears a green 1 for the Ledger it
holds, the Ledger wears nothing. So a bare rim now means a leaf, and you can see
one level further down than the ring actually draws.
**Means:** the card face is only ever the name, and what a thing holds is read
from its edge. The exception kept from the previous round: a stack in the middle
wears nothing, because the ring around it is already the count.
**Confidence:** proven for the counts (10 further assertions, including badges
re-forming when a relationship changes), assumed for the look.

**Followed by:** the stacked shoulders behind a group card came off. Once a
badge says how many, drawing offset circles behind the card says it a second
time. A stack is now marked by its name and its badge alone, and looks like
every other card — which is a claim about what a stack *is*, and worth
watching: nothing but the plural label distinguishes a place you can go into
from a thing that is already there.

## 2026-08-17 — The badges became the hierarchy

**Tried:** making the middle card much bigger so its badges could carry a word,
and putting the categories on it — `Events 3`, `Objects 1` — instead of
orbiting it.
**Happened:** the shape of the map changed rather than its decoration. Once a
category is a badge on the card, it is no longer in the ring, and a card in the
middle has no ring at all. The map now **alternates**: a card wears its
categories, a category rings its members, a member becomes a card wearing its
own categories. The count threshold went with it — there is no longer any point
at which two of a kind start behaving differently from one, so `GROUP_AT` was
deleted.
**Means:** the top level is a way in rather than a view. A world of any size
opens identically, which was the goal, but the spider diagram now only exists
inside a category, and every card level is a lone circle with badges. That is
the thing to look at hardest.
**Confidence:** proven for the rules (23 assertions, rewritten for the
alternation), assumed for whether it reads as a map at all any more.

## 2026-08-17 — Choices made without being asked

Details that came up and were decided in passing, all cheap to change:

- **The focused card cannot be dragged.** It is the middle of the map; panning
  moves the canvas instead.
- **Attached cards have no position of their own.** Where a card sits falls out
  of whose child it is and how many siblings it has, so dropping something on
  the world rearranges the ring rather than leaving it where the hand let go.
- **Events come before objects**, always, so the shape does not jump about as
  things are added.
- **A category badge is 104px on a 340px card**, and badges divide the rim
  evenly, clockwise from midnight, with the last always at the top. Two
  therefore sit at bottom and top, not side by side.
- **Clicking a badge does not select the card under it.** The click stops there.
- **Loose cards are visible at every depth**, not only at the top, or there
  would be nowhere to drag them from once you had gone inside something.
- **Dropping an object on the `Events` stack** attaches it to the world and it
  appears under Objects. The stack was never a container, only a view.
- **Dropping on empty canvas detaches.** Attach and detach are the same gesture
  read two ways, which means there is no second way to break a relationship —
  no menu, no delete key, no unlink button.
- **Cards can nest.** An object dropped on an event belongs to the event, not to
  the world, and a card cannot be dropped onto its own descendant.
- **Seed world:** Aetheria, holding three events and one object, with the Salt
  Ledger one level down under the Siege of Ravenhold so that drilling has
  somewhere to go, and two cards left loose so the difference between placed and
  unplaced is visible before anything is touched.
