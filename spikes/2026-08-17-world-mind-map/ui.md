# UI — world-mind-map

## Screens

Two views of one world, switched by a pill at the top right: **Map** and
**Timeline**. The world itself is held above both, so switching costs nothing
but the pan and zoom — the same cards, the same names, the same relationships,
read two ways.

### World map
**Purpose:** see what the world is made of, all at once or a limb at a time,
and say what belongs to what by moving it there.

**Contains:**
- The **world**, a big circle at the origin. It never moves and is never
  replaced. Under its name, a sub-heading — `A world — everything on the map
  belongs somewhere inside it`.
- **Category badges** on its rim — large labelled circles, `Events 4`,
  `Objects 2`, one per kind it holds.
- **Branches.** An open category grows out of its badge, in the direction that
  badge already points: its members on an arc, each joined to the world by a
  thin line.
- **Branches of branches.** A card out on a branch wears its own badges, small
  and count-only, pointing outwards — press one and its members grow further
  out again, in the same direction.
- **The new-card slot** — a dashed `+ New event` in the last place on every open
  arc, joined by a dashed line.
- **Toolbar**, top left — the world's name, the rules of the gesture,
  `+ Event`, `+ Object`, and how much of the world is showing.
- **Canvas controls**, bottom left — zoom in, zoom out, fit.

**Reached from:** it is the whole app.
**Leads to:** nowhere. There is nothing to navigate to.

### Timeline
**Purpose:** read the same world along its axis — what happens, where it falls,
and how long it runs.

**Contains:**
- The **world's name**, and a line beneath it: `Everything that happens, in
  order — 4 across 2 lanes, measured in pages`.
- The **subject picker** — `Following: Everything in Aetheria`, or one named
  object.
- The **scale switch** — `Pages`, `Chapters`, `Dates`.
- The **axis**, six labelled marks across the story's extent.
- **One bar per event**, positioned and sized by where it starts and ends,
  carrying its name and its span — `p. 34 – p. 68` — and nothing else.
- **Lanes**, as many as the overlaps demand.

**Reached from:** the view switch.
**Leads to:** the map. Clicking a bar **grows every branch on the way down to
that event** — Aetheria's events, then the Crown's, and so on — so it is already
standing there when the map appears.

## Rectangles, lanes, and what the numbers are called

**An event is a rectangle here, not a circle**, because on this view it has an
extent: it starts somewhere and ends somewhere. It keeps the fill and border of
the card of the same kind, squared off — the map's blue, the map's green — so
the two views stay one language while saying different things about the same
event. Circles for identity, rectangles for extent.

**A bar carries no badges.** What an event holds is the map's question; here the
only questions are when it starts and when it stops. Badges would answer neither,
and with three or four kinds of relationship to show they would crowd the one
thing a bar is for.

## Following one thing

Instead of drawing every object on the axis — a picture nobody can read — **you
pick one and the timeline shows only where it touches the story.** The header
becomes that object's name, and the count becomes `Where it touches the story —
2 times`.

**The drawing changes with the question.** Following the world, an event is a
blue rectangle: it has an extent, and how long it runs is the point. Following
an object, its appearances are **circles — the map's own cards** in the object's
green, hung off the line by a thin stalk that starts a few pixels clear of the
circle and touches the line with a small dot. A pin carries only where it falls:
`p. 62–66`, `3–7 Mar 1200`. Nothing else, because the name is already overhead
in big letters and *when* is the only question left.

The unit is said once rather than twice, and a date range inside one month
collapses to `3–7 Mar 1200`.

**Crowding spreads either way.** A pin is a fixed size on the screen however
short the moment it marks, so what collides is the drawing, not the span: each
is treated as taking up a tenth of the visible axis around its middle, and the
same lane packing does the rest. The first lane hangs above the line, the second
below it with its stalk reaching up, the third higher above, and so on — so a
heap opens outwards from the line instead of climbing in one direction.

A pin can be dragged along the line to move that moment, but it has no ends to
pull: a pin is a place, and pulling at a place would be asking the wrong
question. Extent is edited where extent is drawn.

An object touches the story two ways, and both are already in the tree the map
builds. No second kind of relationship was needed to ask the question:

| How | Reads as | Example |
|---|---|---|
| Events **belong to it** | `· its own history` | the forging and the losing of a crown |
| It **belongs to an event** | `· it appears here` | the Salt Ledger, taken at Ravenhold |

Belonging directly to the world is not an appearance: a thing that merely exists
in a world has not yet happened anywhere.

Bars can still be dragged while following one object, and the axis still shows
the whole extent of what is on it — so following the Ember Crown draws exactly
its own life, from its forging to its loss, with the middle of the story absent.

**A bar is taken hold of in three places.** Anywhere along its middle moves it,
keeping its length; either end pulls that end alone. The ends are 14px grips
that light up on hover, never more than a third of a short bar, so a moment
never becomes all handle. A press that does not move opens the event on the map.

Two rules, and only two: **nothing goes before the beginning of the story**, and
**neither end can pass the other**. An event can be shortened to a moment and
opened out again, but not turned inside out. Positions are whole units — the
axis is places, not fractions of one — so a nudge under half a unit does nothing
at all.

A drag that ends on the bar it moved does **not** count as a click on it — the
same rule the map keeps for its cards. Only a press that never travelled opens
the event.

**The ruler is held still while you drag.** The axis is derived from what is on
it, so without this you would be moving the very thing you are measuring
against, and a bar would drift away from the pointer as its own movement
rescaled the view. It is frozen at the moment you take hold and lets go on
release.

**Lanes come from overlap and nothing else.** Two events that share any of the
axis cannot share a row, so each takes the first row that is already clear by
the time it begins. A lane is reused the moment it is free rather than
abandoned, so the picture stays as short as it honestly can be. Touching counts
as overlapping: an event ending exactly where another begins takes the next
lane down. Nothing about lanes is stored — drag an event across another and the
rows re-form beneath your hand, with nothing to keep in step.

**The axis is plain numbers, and the world says what they are called.** An event
holds a start and an end; whether 34 is a page, a chapter or a day is a property
of the world, not of the event. Switching scale relabels the axis and every
bar's caption, and **converts nothing** — the same story read three ways.

Dates are the one place a bare number has to take a shape of its own: they are
counted as days from an invented epoch of 1 January 1200. That epoch is a
placeholder, not a decision.

## Navigation — there isn't any

**Nothing is navigated to.** There are no screens below the map, no path back,
and no breadcrumb, because the world never leaves the middle of the canvas.
What changes is how much of it is unfolded.

- **Press a badge** → that category grows out of it as a branch, or folds away.
- **Press a card** → whatever it has open folds away.
- **Press a card with nothing open** → rename it, in place.

So pressing the world puts the whole map away and leaves one circle. That falls
out of the rule rather than being a special case, which is the point of writing
it that way.

Folding a branch folds **everything that was hanging off it**, because a branch
only exists while the card it grows from is on the map. Open Events, open the
Siege's Objects, open the Ledger's Events, then fold Events: the whole limb goes
at once, and nothing is left orphaned in the open set.

The canvas re-frames itself whenever a branch opens or closes.

## Branches

A category is a **way of drawing, not a thing that exists**. Its identity is
just the card it hangs off and the kind it gathers, so nothing about grouping is
stored: change what belongs to what and the branches re-form by themselves. Move
the last event away and the `Events` badge simply stops being worn — there is
nothing to delete.

**A branch grows in the direction its badge points.** The Events badge sits at
90° on the world's rim, so the events fan out to the right of it; Objects at
270°, so they fan left. The badge is the root of the limb, which makes the
picture legible without any lines having to cross.

Out on a branch, a card's own badges are turned to **point outwards** from the
card that grew it — so a sub-branch never folds back over the middle of the map.
On the world itself they keep their even spread around the whole rim, because
the world has no outward.

**A branch reaches rather than crowds.** Members are spaced a fixed distance
apart along their arc, and if they will not fit inside the wedge allowed, the
arc moves further out until they do. Deeper branches fan less widely than the
first, so a limb narrows as it goes.

## Badges

**A card says what is inside it without being opened**, in coloured circles on
its rim — blue for events, green for objects, always in that order.

They are spread **evenly right around the rim**, 360°/n apart, clockwise from
midnight: one sits at midnight, three at 120°, 240° and 360°, four at the
quarters. The spacing is a division of the whole circle, not a fan across one
arc, so adding a kind re-spaces the lot rather than crowding a side.

A **pair is turned a quarter** so it sits horizontally, at 90° and 270° —
still opposite, but flanking the name rather than stacked above and below it.

They are drawn two ways depending on where the card is standing, but **every one
of them opens a branch**:

- **On the world** they are large and carry the category name over the count —
  `Events` over `4`.
- **Out on a branch** they are small and carry the count alone, and they are
  fanned to point outwards rather than spread around the whole rim.

An open badge is brighter and wears a soft ring of its own colour, so a card
says at a glance which of its limbs are unfolded. A card holding nothing wears
nothing, so a bare rim means a leaf.

## Nothing floats

**Everything in a world belongs somewhere in it.** There are no unplaced cards,
no staging area, and nothing adrift on the canvas at any depth.

Two rules keep it that way:

- **Every open branch ends in a new-card slot.** The last place on each arc is a
  dashed `+ New event`, joined to its card by a dashed line — so a card is
  always made among the cards it will stand with, and every branch on the map
  can be added to without going anywhere. Which branch you press is which
  branch it joins: the context decides, not a mode.
- **The toolbar acts on the world.** `+ Event` opens the world's events branch
  if it is folded and puts a draft on it; `+ Object` the same. They are the way
  in when nothing is unfolded, and they still name the card where it will stand.

## Making a card

Nothing is created by pressing. **A card comes into being when it is named.**

1. Press the slot. The `+` gives way to a field reading `Name the event`, in
   place, at the end of the branch where the slot stands. Nothing exists yet.
2. Type, and press Enter. Only now is the card made and given to the parent.
3. It **travels from the slot into its place on the branch** while the arc
   re-spaces around it to make room, and the view eases out to keep the whole
   of it in frame — about half a second for all three.

Leaving it blank, or pressing Escape, makes nothing at all. There is no
half-made card called "New event" to tidy up afterwards, and the name is never
typed into a thing that already exists somewhere behind a badge.

Movement is only ever used for this. Dragging tracks the pointer exactly, with
no easing on it, so the one thing that glides is the one thing that happened
without you moving it.
- **Dropping on empty canvas sends a card back to the top of the world**, rather
  than orphaning it. It is the way out of something, not the way out of
  everything.

Because a card is named before it exists, you always watch it join something —
never a badge count going up somewhere out of sight.

## The gesture

- **Drag a card onto another card** → it belongs to that card. The target
  brightens and swells while you hold something over it, so the drop is
  committed to before the mouse is released.
- **Drag a card onto empty canvas** → back to the top of the world.

Dropping onto a **category** means dropping onto the card it hangs off — drop an
event on `Events` and it belongs to the world, which is where those events
belong. Dropping an *object* there also attaches it to the world; it then shows
under Objects, because the category you aimed at was never a container.

Consequences, all deliberate:

- There is no second way to relate two things. No menu, no unlink button, no
  drawing a wire between two ports.
- Cards on a branch cannot be positioned by hand. The arc decides.
- Nothing can be dropped inside itself or anything below it.
- **Rename is a press on a card with nothing open**, which is the same rule as
  folding — a card with nothing to fold has nothing else a press could mean. A
  drag that ends on top of the card being dragged does not count as a press.
- **The new-card slot is somewhere to press, never somewhere to land.** It is
  not a drop target and cannot be dragged.
- **Dragging needs a branch open.** With everything folded there is only the
  world on the canvas, so opening something is the first thing you do.

## Look and feel

- **Dark and neutral.** A near-black grey ground with a soft lift behind the
  centre, so the middle reads as the light source and the eye starts there. It
  was warm — gold, amber, a beige off-white, which read as parchment — and is
  now greys throughout. The point of the change: **the only colour left in the
  whole thing is colour that means something.** Blue is an event, green is an
  object, and nothing else is tinted, so a coloured thing is always a kind of
  thing.
- **One typeface, Inter, at several weights.** Bundled with the app rather than
  fetched, so the spike still runs with no network. Names take a medium or
  semibold with slightly negative tracking; chrome stays lighter and smaller.
  The serif went with the parchment — a book face said "manuscript" where the
  thing being built is an instrument.
- **Numbers are tabular** wherever they are read against each other — badges,
  axis labels, pins, spans — so a digit never shifts as a bar is dragged.
- **The middle card says what it is; the ring does not.** Only the focused card
  carries a sub-heading, and it drops the small uppercase kind tag that ring
  cards wear, since the sub-heading already says `An event of Aetheria`. In the
  ring a card is understood by the company it is standing in.
- **The sub-heading is a sentence, not a label.** It names the kind, names the
  parent, and then says plainly what that kind means — *something that happens
  there*, *something that exists there* — so the vocabulary of the model is
  taught by the interface rather than assumed. A category also carries its count
  in words there, which is where the bare number went when it left the middle.
- **Size carries depth.** The middle card is 340px against the ring's 128 —
  near three times the width, so what you are looking *at* is never confused
  with what is standing around it. It is also what makes a badge big enough to
  carry a word.
- **Colour carries kind, everywhere.** Gold is the world, blue is an event,
  green is an object — on a circle, on a rectangle, on a pin, in both views. A
  category takes the colour of what it gathers. Nothing is drawn in a colour
  that belongs to something else.
- **There is no unplaced state to draw.** The dashed, dimmed treatment for a
  card belonging to nothing is still in the stylesheet but nothing produces one
  any more.
- **A category looks like any other card.** It was drawn with two dimmer circles
  offset behind it, and that came off once the badges arrived: the badge already
  says how many, and the shoulders were saying it a second time. What marks a
  category now is its name — `Events` rather than an event.
- **Counts live on the rim, not in the face.** A card's name is the only thing
  inside it; what it holds is worn as badges on the edge, so the count and the
  name never compete for the middle of the circle.
- **Circles throughout, and one exception.** A card is a circle everywhere — on
  the map, and hung off the timeline as an appearance. The only rectangle in the
  whole thing is a timeline bar, which earns it: it is the one drawing that has
  to say how long something lasted.

## Open questions

- **A wide world may outgrow its wedge.** A branch reaches further out rather
  than crowding, so a category with thirty members ends up a long way from the
  middle. Whether it should wrap, scroll, or gather again at some size is open.
- **Two branches can grow into each other.** Their directions come from where
  their badges sit, and nothing checks whether a limb of one collides with a
  limb of another once both are several levels deep.
- **A category of one still costs a press.** `Objects 1` opens onto a single
  card. Whether one member should simply be drawn, and only pairs upward need
  unfolding, is the same threshold question that was there before, now moved.
- **Kind is the only thing categories are made of.** Regions, arcs, factions,
  chapters — none of them can gather anything, because the split is hardcoded to
  event-versus-object.
- **Only the pair is turned.** Three and up take their angles straight, so one
  badge always sits at the top; two flank the name instead. If a third kind
  arrives, the pair's horizontal reading is lost the moment it does.
- **There is no way to move something up one level.** Dropping on empty canvas
  goes all the way back to the world, and there is nothing to aim at in between
  — the breadcrumb is text, not a target.
- **What is a relationship between two objects?** The map only expresses
  belonging. "The Ember Crown was lost at the Siege" and "the Crown belongs to
  the Siege" are not the same claim, and only the second can be drawn.
- **A bar can be dragged past the end of the axis, and the axis follows.** The
  range is frozen during the drag and recomputes on release, so letting go
  outside the old extent re-fits everything at once. Whether that settling reads
  as helpful or as a jolt is the thing to watch.
- **Lanes re-form under your hand, and a bar can change lane mid-drag.** Its
  row is decided by overlap, so dragging across a neighbour drops it a lane
  while you are still holding it. That is honest but it may feel like the bar
  jumped out from under the pointer.
- **A new event is guessed onto the end.** Writing one in the map gives it a
  span just past everything already written, eight units long. It has to land
  somewhere, but nothing was asked and nothing is shown about it there.
- **An object still has one parent.** So "where it appears" is its own events
  plus the single event it belongs to. A crown carried through four battles
  cannot say so without a many-to-many relationship, which is a decision about
  the model rather than the view, and has not been taken.
- **Following one object hides the story around it.** The axis re-fits to just
  its appearances, so the Crown's life is drawn without the Siege it was lost
  during. Whether the rest of the story should stay as a ghost behind it is the
  live question.
- **Only objects can be followed.** When characters and locations arrive the
  picker will need grouping, and "everything" will need to mean something more
  careful than "every event in the world".
- **The scales are not really interchangeable.** The same number is a page, a
  chapter and a day, so a story 96 units long is 96 pages, 96 chapters or three
  months depending on a switch. Real chapters would want a coarser axis than
  pages, and that is not modelled.
- **Nesting shows only in a caption.** An event belonging to another event is a
  bar like any other, with `· during Siege of Ravenhold` in its span line.
  Whether nesting should show as containment, indentation, or not at all is
  open.
- **Nothing is saved.** Reload and the world resets to Aetheria.
