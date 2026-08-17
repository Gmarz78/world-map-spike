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

**Check it:** `node check-grouping.ts` and `node check-axis.ts` in `checks/`.
Deliberately **not** in `code/` — they are not a test suite but the harness that
made the rules verifiable when the browser could not be driven, and the reason
`grouping.ts` and `axis.ts` have no React in them. See `checks/README.md`.

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

## 2026-08-17 — Extent, overlap, and what a number is called

**Tried:** giving every event a start and an end, drawing it as a rectangle
rather than a circle, stacking overlapping events into lanes, and letting the
world say whether the axis is pages, chapters or dates.
**Happened:** three things separated cleanly that could easily have tangled.

- **Shape follows what is being said.** A circle is an identity; a rectangle is
  an extent. The bar keeps the fill and border of the card of the same kind, so
  the views stay one language while saying different things about one event.
- **Lanes are derived, never stored.** Each event takes the first row already
  clear by the time it begins, and a lane is reused the moment it is free. Move
  an event and the rows re-form; there is nothing to keep in step.
- **The axis is plain numbers and the scale is only a reading of them.**
  Switching between pages, chapters and dates relabels everything and converts
  nothing. That is the cheap version and it is also the honest one: the story
  has one axis, and what it is called is a property of the world.

**Means:** the whole of it lives in one module, `axis.ts`, with no React in it —
so lane packing, the range, the tick positions and the three formatters were all
checked directly (18 assertions, including touching-counts-as-overlapping and a
lane being reused rather than abandoned).

**The invented parts, marked:** dates are days counted from an epoch of
1 January 1200, which is a placeholder rather than a decision; and a newly
written event is given a span just past everything already written, eight units
long, because it has to land somewhere and nothing asks.
**Confidence:** proven for the axis logic; assumed for how any of it looks.

## 2026-08-17 — Bars that can be moved and pulled

**Tried:** dragging a bar along the axis, and pulling either end to change
where an event starts or stops.
**Happened:** one problem was not obvious until it was written down. **The axis
is derived from what is on it**, so dragging a bar changes the range, which
changes the scale, which moves the bar — the ruler runs away from the thing
being measured, and the bar drifts out from under the pointer. The fix is to
freeze the range at the moment of taking hold and let it go on release. Worth
remembering for any view whose extent comes from its contents.

The arithmetic is all in `applyDrag`, pure and away from the pointer handling:
whole units only, never before the beginning of the story, and neither end may
pass the other, so an event can be shortened to a moment and opened out again
but not turned inside out. Fourteen further assertions cover it, including a
drag across a neighbour producing a second lane with nothing told to do so.

**Pointer events throughout, with capture** — no HTML5 drag API anywhere in
either view. Two drag mechanisms in one app would be one too many.
**Means:** the map arranges by belonging, the timeline arranges by position, and
both are one gesture with the hand. That is the first point in this spike where
the timeline is a tool rather than a picture.
**Confidence:** proven for the arithmetic; assumed for the feel — in particular
whether a bar changing lane mid-drag reads as honest or as the bar jumping out
from under you.

**Got it wrong once, the same way twice.** The first version asked "am I
dragging?" inside the click handler, and the answer was always no: the click
lands *after* the pointer is released, so the drag it was asking about had
already been cleared, and every drag opened the event it had just moved. The map
had solved this weeks-of-code earlier — a flag that outlives the release by one
timeout — and the timeline was written without reaching for it. **Any pointer
drag that ends over its own element needs an answer that outlives the release,**
not a question about the present.

## 2026-08-17 — Following one thing, with no new relationship

**Tried:** letting the timeline follow a single chosen object rather than the
whole world, showing only where that object touches the story.
**Happened:** the interesting part is what it did *not* need. An object turns
out to touch the story two ways that are already in the tree the map builds —
events can **belong to it** (the forging and the losing of a crown, which is the
crown's own history), and it can **belong to an event** (the Salt Ledger, taken
at Ravenhold). Reading both directions off the existing parent links answers
"where does this appear" without a second kind of relationship anywhere in the
model. The seed now shows both.
**Means:** it also settles what the two views are for. Every object drawn on the
axis at once is unreadable; one object at a time is a life. And picking the
subject is what closes the gap left when badges came off the bars — the timeline
can answer a question about an object again, by being about that object.

**The limit it exposes rather than hides:** an object has exactly one parent, so
"appears at" is its own events plus *one* event it belongs to. A crown carried
through four battles cannot say so. That is a many-to-many relationship and a
decision about the model, not the view, and it has not been taken.
**Confidence:** proven for `appearancesOf` (five assertions, including both
directions at once and belonging-to-the-world not counting); assumed for the
picker.

**Followed by — the drawing changes with the question.** Following an object was
at first drawn with the same blue event bars, which said the wrong thing twice
over: the colour belonged to events when the subject was an object, and the
bars carried names when the name was already overhead in big letters. Its
appearances are now **green pins** — the object's own colour, matching its
circle on the map — sitting above the line with a chevron pointing at it, and
carrying only where they fall. A pin can be dragged along the line but has no
ends to pull: a pin is a place, and extent is edited where extent is drawn.

One thing lost, worth knowing: the label a pin dropped was the *event's* name,
not the object's — "The Forging" rather than "The Ember Crown" — so which
appearance is which now lives only in the hover title. Whether that matters
shows up the moment an object has five of them.

**Then the pins became circles**, which is what closed the last of the visual
gap between the views: a card is a circle everywhere, and the only rectangle in
the whole thing is a timeline bar, which earns it by being the one drawing that
has to say how long something lasted. The pin is literally the map's card
markup at 88px, so nothing about its look is stated twice.

Hanging them off the line took a second kind of lane. **A pin is a fixed size on
the screen however short the moment it marks**, so what collides is the drawing
and not the span — two moments a page apart never overlap but their circles
certainly do. Each pin is treated as taking up a tenth of the visible axis
around its middle and the existing packing does the rest, which means the same
eight lines of code sort both bars and pins. Lanes then alternate above and
below the line, so a heap opens outwards rather than climbing.

## 2026-08-17 — Greys, and one typeface

**Tried:** replacing every warm colour with a grey, and the serif with a modern
sans.
**Happened:** it turned out to be a rule rather than a repaint. With the golds
and the beige off-white gone, **the only colour left in the whole thing is
colour that means something** — blue for an event, green for an object. Nothing
else is tinted, so a coloured thing is always a kind of thing, and the greys
carry structure instead of competing with it. The palette now lives in eight
custom properties at the top of the stylesheet rather than being written out
thirty times.

Inter is **bundled** (`@fontsource-variable/inter`) rather than pulled from a
CDN, so the spike still runs with no network — worth the one dependency, since
"a more modern font" answered by a system stack is really "whatever this
machine happens to have". Being variable, weight does the work the serif used to
do: names at 550–600 with slightly negative tracking, chrome lighter and
smaller. Numbers are tabular wherever they are read against each other, so a
digit never shifts width as a bar is dragged.
**Means:** the earlier "serif for names, sans for chrome" idea is gone. It said
*manuscript*, and the thing being built is an instrument.
**Confidence:** proven that it builds and both suites still pass; assumed for
how it looks.

## 2026-08-17 — The world stops moving, and the map unfolds instead

**Tried:** keeping the world in the middle permanently and growing an open
category out of it as a branch, rather than replacing the middle card and
navigating a level down.
**Happened:** the spike came back round to the spider diagram it started as, but
with everything learned since. Three things collapsed into one rule.

- **There is no navigation left.** No screens below the map, no path back, no
  breadcrumb — the whole of it is one canvas with the world always on it, and
  what changes is how much is unfolded. `trailTo` survives only as the thing
  that translates a timeline click into "grow these branches".
- **Press a card, fold what it has open. Press a card with nothing open, rename
  it.** Pressing the world putting the whole map away falls *out* of that rule
  rather than being a special case, which is why it is worth stating that way.
- **A branch grows in the direction its badge already points.** Events at 90°
  fan right, Objects at 270° fan left, and out on a limb a card's badges are
  turned outwards so a sub-branch never folds back over the middle. The badge
  being the root of the limb is what keeps the picture legible with no lines
  crossing.

**The part that needed care:** folding a branch has to take everything that was
only reachable through it, or the open set fills with categories hanging off
cards that are no longer drawn. That is `foldAway`, pure and in `grouping.ts` so
it could be checked: fold the world's events with the Siege's objects and the
Ledger's events open beneath, and all three go at once.

**Means:** adding is contextual for free — every open branch ends in its own
`+ New event`, so which branch you press is which branch it joins, with no mode
anywhere. The toolbar buttons remain as the way in when everything is folded.
**Confidence:** proven for the folding rules (six assertions) and the branch
membership; assumed for the whole look of it, which is the largest visual change
in the spike so far and has not been seen.

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

---

## Handoff — 2026-08-17

Everything below runs. `npm run dev` in `C:\Dev\world-map-spike`, then
<http://localhost:5173>. Nothing is saved: reload and the world resets to
Aetheria.

### Promoted
- Nothing. No slice has been promoted, and there is no host application to
  promote into — this repo exists for the spike, so its first promotion will
  be into a real `src/` alongside it.

### Spec-ready
- **The map's gesture**, in `ui.md` — drop a card on another to make it belong
  there, drop on empty canvas to send it back to the world. One gesture, two
  readings, no menus.
- **Unfolding rather than navigating**, in `ui.md` — the world never moves, a
  category grows out of the badge that names it, pressing a card folds what it
  has open, and pressing a card with nothing open renames it. Folding takes
  everything only reachable through what was folded (`foldAway`).
- **Categories as a way of drawing** — a category has no identity beyond the
  card it hangs off and the kind it gathers, so nothing about grouping is
  stored and every count and stack re-forms from the relationships.
- **Making a card by naming it** — nothing exists until it has a name, and it
  travels from the slot into its place on the branch.
- **The timeline's model** — an event holds a start and an end as plain
  numbers; lanes come from overlap alone; the scale (pages, chapters, dates) is
  a property of the world that relabels and converts nothing.
- **Following one thing** — never every object at once; pick one and see only
  where it touches the story, drawn as pins in that object's own colour.
- **The visual rules** — circles for identity, rectangles for extent, colour
  only where colour means something, and movement only for what happened
  without your hand.

All of this is `proven` as behaviour and `assumed` as design: it has been
checked, and used, but never used by anyone but the person who asked for it.

### Still open
- **Derive has never run.** There is no `data-model.md` and no `interfaces.md`.
  The shape is legible in `grouping.ts` and `axis.ts`, but it has not been
  written down as entities and fields, and nothing has been marked `observed`
  against real data. This is the obvious next phase.
- **Kind is the only thing categories are made of.** Characters, locations,
  factions, regions, arcs — none of them can gather anything, because the split
  is hardcoded to event-versus-object in `grouping.ts`.
- **A branch reaches rather than crowds**, so a category with thirty members
  ends a long way from the middle, and two deep limbs can grow into each other.
  Nothing checks for that.
- **The two views never show both things at once.** The map is belonging, the
  timeline is position. "What was the Crown present at, and when?" needs both.
- **A category of one still costs a press.**
- **No characters, no locations, no profiles, no prose, no persistence, no
  accounts.** None of it has been touched.

### Must be re-specified
- **Everything is `invented`.** No real data has been near this. Every field in
  every fixture was made up.
- **Dates are days from an epoch of 1 January 1200.** A placeholder chosen to
  make the scale switch demonstrable, not a decision about how time works.
- **The scales are not really interchangeable.** The same number is a page, a
  chapter and a day, so a story 96 units long is 96 pages, 96 chapters or three
  months depending on a switch. Real chapters want a coarser axis than pages,
  and that is not modelled.
- **A new event's span is guessed** — just past everything already written,
  eight units long. Nothing asks, and nothing shows it happened.
- **Order is insertion order.** The timeline's sequence and every branch's order
  come from the order things were written down. There is no stored ordering and
  no way to reorder anything except by moving it on the axis.
- **Ids are `n-1`, `n-2`.** A module-level counter, reset on reload.
- **The `loose` card state is dead code.** Nothing can be parentless any more,
  but the role and its dashed styling are still in the tree, kept in case
  floating cards come back.
