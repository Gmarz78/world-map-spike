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

## 2026-08-17 — Nothing floats any more

**Tried:** removing unplaced cards entirely, and making `+ Event` put its card
inside whatever is in the middle rather than adrift on the canvas.
**Happened:** the staging area went, and with it the second half of the drag
gesture. Dropping on empty canvas used to mean "belongs to nothing"; it now
means "back to the top of the world", so a card can be taken out of something
without being taken out of everything. Adding also navigates: the map goes to
the category that now holds the new card and puts its name in edit, because
otherwise a card added at world level would be invisible behind a badge.
**Means:** the model is simpler — everything in a world belongs somewhere in it
— but it exposes how little the canvas has left to do at the top. With no ring
and nothing adrift, **the world screen has nothing draggable on it at all**;
dragging now only exists inside a category. For a spike about arranging things
by hand, that is the finding to sit with.
**Confidence:** proven that it builds and the rules hold; assumed for how it
plays.

**Followed by:** a category screen now carries a dashed `+ New event` card, so
once you are inside a category, making a card happens on the canvas rather than
from a button in the corner. That gives the world screen a reason to be only a
way in, since everything you make is made one level down.

It began as the last place in the ring, and moved out to stand on its own to
the left. In the ring it took a position that implied it was already a member,
and had a line drawn to the parent for something that does not belong to it
yet. Off to one side, unjoined, same size and colour as the members it would
join, it reads as a card waiting to be made. It is not a thing in the world
either way: it exists only in the drawing, is never a drop target, and cannot
be dragged.

## 2026-08-17 — A card is named before it exists

**Tried:** moving creation from the press to the naming — the slot becomes a
field where it stands, and only a typed name brings a card into being — then
showing it travel into the ring.
**Happened:** the order of operations got honest. Before, pressing made a card
called "New event" and then asked you to fix the name, which meant a blank
press left litter in the world and an Escape had nothing sensible to do. Now
Escape and an empty field both make nothing, because nothing was made yet.
**How the animation works:** the card is built at the slot's own position with a
transition class on every node, and released to its real place one frame later,
so the browser animates the difference. The ring re-spaces at the same time and
the view eases out with it, all on the same 480ms curve. The transition is
**only** applied during an arrival — a permanent one would put easing on
dragging, where the card must track the pointer exactly.
**Means:** movement now means one thing in this interface: something happened
that you did not do with your own hand.
**Confidence:** proven that it builds; assumed for the timing, which has not
been watched (still no frames in the pane).

## 2026-08-17 — A second view, in the same language

**Tried:** a timeline of the world's events beside the map, sharing its colours,
its ground and — literally — its cards.
**Happened:** the two views cost almost nothing to hold together because the
timeline reuses the map's card markup and CSS classes rather than restating
them, so an event looks identical in both. What it did force was lifting the
world out of the map component: `items`, `parents` and `trail` now live one
level up and are passed down, since two views cannot each own the world.
Switching views costs nothing but the pan and zoom.

The join between them is `trailTo`: given any card it works out the path down
to it — `Aetheria › Events › Siege of Ravenhold` — so clicking an event on the
timeline opens it in the map at exactly the depth it lives, rather than dumping
you at the top.

**Means:** the map's hierarchy and the timeline's sequence are two readings of
one set of relationships, with no second model behind the second view. The cost
is that the timeline can only *draw* an order: sequence is the order things were
written down, and there is no gesture for changing it.
**Confidence:** proven for `trailTo` (three assertions, including a card two
levels down); assumed for everything visual.

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
  evenly at 360°/n, clockwise from midnight. A pair is turned a quarter so it
  reads horizontally; every other count takes its angles straight.
- **Clicking a badge does not select the card under it.** The click stops there.
- **The middle card's sub-heading names its parent** — `An event of Aetheria` —
  which the breadcrumb also says. The duplication is deliberate: the breadcrumb
  is a path, the sub-heading is a sentence about the thing you are looking at.
- **A category's sub-heading takes its owner's name plainly**, so it reads
  `Objects of Siege of Ravenhold` rather than `of the Siege`. No articles are
  inserted into the writer's own words.
- **Dropping an object on the `Events` category** attaches it to the world and
  it appears under Objects. A category was never a container, only a view.
- **Adding while a category is in the middle** attaches to that category's
  owner, so `+ Object` pressed inside `Events` makes an object of the world's
  and jumps to `Objects`.
- **Dropping on empty canvas detaches.** Attach and detach are the same gesture
  read two ways, which means there is no second way to break a relationship —
  no menu, no delete key, no unlink button.
- **Cards can nest.** An object dropped on an event belongs to the event, not to
  the world, and a card cannot be dropped onto its own descendant.
- **Seed world:** Aetheria, holding four events and two objects, with the Salt
  Ledger one level down under the Siege of Ravenhold so that drilling has
  somewhere to go. Nothing is adrift.
