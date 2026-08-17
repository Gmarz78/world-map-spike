# UI — world-mind-map

## Screens

Two views of one world, switched by a pill at the top right: **Map** and
**Timeline**. The world itself is held above both, so switching costs nothing
but the pan and zoom — the same cards, the same names, the same relationships,
read two ways.

### World map
**Purpose:** see what the world is made of, one level at a time, and say what
belongs to what by moving it there.

**Contains:**
- The **focused card** — a big circle at the middle of the screen, near three
  times the width of anything around it. The world to begin with; whatever you
  last opened after that. Under its name, a **sub-heading** naming what it is,
  whose it is, and what that means:
  - `A world — everything on the map belongs somewhere inside it`
  - `Events of Aetheria — the 4 things that happen in it`
  - `An event of Aetheria — something that happens there`
  - `An object of Siege of Ravenhold — something that exists there`
- **Its category badges** — large labelled circles on its rim, `Events 3`,
  `Objects 1`, one per kind it holds. These are the way in.
- **Its ring** — only when a *category* is in the middle: its members, standing
  around it and joined by a thin line.
- **The new-card slot** — on a category screen, a dashed circle reading
  `+ New event`, standing off to the left, clear of the ring and joined to
  nothing. The same size and colour as the members it would join, so it reads
  as one of them, but plainly not one of them yet.
- **Breadcrumb**, top centre — `Aetheria › Events › Siege of Ravenhold`. Every
  crumb is a way back.
- **Toolbar**, top left — the map's name, the rules of the gesture, `+ Event`,
  `+ Object`, and how much is in the world.
- **Canvas controls**, bottom left — zoom in, zoom out, fit.

**Reached from:** it is the whole app.
**Leads to:** itself, one level down.

### Timeline
**Purpose:** read the same world along its axis — what happens, where it falls,
and how long it runs.

**Contains:**
- The **world's name**, and a line beneath it: `Everything that happens, in
  order — 4 across 2 lanes, measured in pages`.
- The **scale switch** — `Pages`, `Chapters`, `Dates`.
- The **axis**, six labelled marks across the story's extent.
- **One bar per event**, positioned and sized by where it starts and ends,
  carrying its name and its span — `p. 34 – p. 68` — and its object badges
  riding the far end.
- **Lanes**, as many as the overlaps demand.

**Reached from:** the view switch.
**Leads to:** the map. Clicking a bar opens that event there, at exactly the
depth it lives — `Aetheria › Events › Siege of Ravenhold`, worked out from what
it belongs to.

## Rectangles, lanes, and what the numbers are called

**An event is a rectangle here, not a circle**, because on this view it has an
extent: it starts somewhere and ends somewhere. It keeps the fill and border of
the card of the same kind, squared off — the map's blue, the map's green — so
the two views stay one language while saying different things about the same
event. Circles for identity, rectangles for extent.

**Lanes come from overlap and nothing else.** Two events that share any of the
axis cannot share a row, so each takes the first row that is already clear by
the time it begins. A lane is reused the moment it is free rather than
abandoned, so the picture stays as short as it honestly can be. Touching counts
as overlapping: an event ending exactly where another begins takes the next
lane down. Nothing about lanes is stored — move an event and the rows re-form.

**The axis is plain numbers, and the world says what they are called.** An event
holds a start and an end; whether 34 is a page, a chapter or a day is a property
of the world, not of the event. Switching scale relabels the axis and every
bar's caption, and **converts nothing** — the same story read three ways.

Dates are the one place a bare number has to take a shape of its own: they are
counted as days from an invented epoch of 1 January 1200. That epoch is a
placeholder, not a decision.

## Navigation

One screen. Movement is inward and outward, not sideways: click a badge to open
that category, a card to go into it, a breadcrumb to come back out. The canvas
pans and zooms, and re-frames itself when the depth changes.

## Decomposition — the map alternates

Two kinds of thing take the middle, turn about:

- **A card** — the world, an event, an object. It has **no ring at all**. What
  it holds is worn on its rim as categories: `Events 3`, `Objects 1`.
- **A category** — `Events`, `Objects`. Its **members stand around it** in a
  ring, drawn as themselves.

So the way down is: Aetheria → click `Events 3` → the three events in a ring →
click Siege of Ravenhold → the Siege in the middle, wearing `Objects 1` →
click that → the Salt Ledger. Cards and categories, alternating.

A category is a **way of drawing, not a thing that exists**. Its identity is
just the card it hangs off and the kind it gathers, so nothing about grouping is
stored: change what belongs to what and the categories re-form by themselves.
Move the last event away and the `Events` badge simply stops being worn — there
is nothing to delete.

The consequence to watch: at every card level, the middle is a lone circle with
badges and nothing else on the canvas. The spider diagram now exists only
*inside* a category. A world of any size opens the same way, which is the point,
but the top level is no longer a picture of the world so much as a way in to it.

## Badges

**A card says what is inside it without being opened**, in coloured circles on
its rim — blue for events, green for objects, always in that order.

They are spread **evenly right around the rim**, 360°/n apart, clockwise from
midnight: one sits at midnight, three at 120°, 240° and 360°, four at the
quarters. The spacing is a division of the whole circle, not a fan across one
arc, so adding a kind re-spaces the lot rather than crowding a side.

A **pair is turned a quarter** so it sits horizontally, at 90° and 270° —
still opposite, but flanking the name rather than stacked above and below it.

They are read two ways depending on where the card is standing:

- **In the middle** they are large, carry the category name and the count, and
  are **clickable** — this is the way in. `Events` over `3`.
- **In the ring, or adrift** they are small and carry the count alone, saying
  what is one level further down than the ring actually draws.

A card holding nothing wears nothing, so a bare rim means a leaf. **A category
in the middle wears nothing either** — you are already inside it, and the ring
around it is the count.

## Nothing floats

**Everything in a world belongs somewhere in it.** There are no unplaced cards,
no staging area, and nothing adrift on the canvas at any depth.

Two rules keep it that way:

- **A new card belongs to whatever is in the middle.** `+ Event` while looking
  at Aetheria makes an event of Aetheria's; while looking at the Siege of
  Ravenhold, one of the Siege's. Pressed while a category is in the middle, it
  belongs to the card that category hangs off, so the kind you press decides
  which category it lands in, not where you happen to be standing.
- **A category screen carries its own new-card slot.** Inside `Events`, a
  dashed `+ New event` stands off to the left of the ring — so once you are
  inside a category, adding is part of the picture rather than part of the
  chrome. The toolbar buttons take you to the right category and open a draft
  there, so a card is always named in the place it will stand.

  It sits **outside the ring rather than in it**: a place in the ring implied
  it was already one of the members, and drew a line to the parent for
  something that does not belong to it yet. Off to one side, unjoined, it reads
  as a card waiting to be made.

## Making a card

Nothing is created by pressing. **A card comes into being when it is named.**

1. Press the slot. The `+` gives way to a field reading `Name the event`, in
   place, off to the left where the slot stands. Nothing exists yet.
2. Type, and press Enter. Only now is the card made and given to the parent.
3. It **travels from the slot into its place in the ring** while the ring
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
- Cards in a ring cannot be positioned by hand. The ring decides.
- Nothing can be dropped inside itself or anything below it.
- Clicking is navigation, so **rename is a click on the middle card** — the one
  place a click has nowhere further to go. A drag that ends on top of the card
  being dragged does not count as a click.
- **The new-card slot is somewhere to press, never somewhere to land.** It is
  not a drop target, cannot be dragged, and has no line to anything.
- **At world level there is nothing to drag.** A card in the middle has no ring
  and nothing floats, so the only things on the canvas are the world and its
  badges. Dragging — and making things — both live inside a category.

## Look and feel

- **Dark, warm-lit.** Near-black blue-grey ground with a soft glow behind the
  centre, so the middle reads as the light source and the eye starts there.
- **Serif for names, sans for chrome.** Names are the writer's own words and get
  a book face; labels, counts and buttons stay quiet in a UI sans.
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
- **Colour carries kind, not status.** Gold is the world, blue is an event,
  green is an object. A category takes the colour of what it gathers.
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
- **Circles throughout.** A spider diagram wants one shape; the kind tag above
  the name does the distinguishing.

## Open questions

- **Every card level is a lone circle.** With categories on the rim and no ring,
  the middle card has nothing around it but its own badges and whatever is
  adrift. The picture is now only ever drawn one layer at a time, and the world
  screen is a way in rather than a view.
- **A category of one still costs a click.** `Objects 1` opens onto a single
  card. Whether one member should just be shown, and only pairs upward gather,
  is the same threshold question that was there before, now moved.
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
- **A span cannot be changed.** Bars are drawn from numbers nothing can edit:
  no dragging a bar along the axis, no pulling its ends. For a spike about
  arranging things by hand, that is the next thing to try, and the lanes
  re-forming under a dragged bar is the thing worth seeing.
- **A new event is guessed onto the end.** Writing one in the map gives it a
  span just past everything already written, eight units long. It has to land
  somewhere, but nothing was asked and nothing is shown about it there.
- **Objects are not on the axis at all.** They reach the story only by belonging
  to an event, which is why they appear as badges on a bar and never as bars.
  Whether an object should have a life of its own along the axis is open.
- **The scales are not really interchangeable.** The same number is a page, a
  chapter and a day, so a story 96 units long is 96 pages, 96 chapters or three
  months depending on a switch. Real chapters would want a coarser axis than
  pages, and that is not modelled.
- **Nesting shows only in a caption.** An event belonging to another event is a
  bar like any other, with `· during Siege of Ravenhold` in its span line.
  Whether nesting should show as containment, indentation, or not at all is
  open.
- **Nothing is saved.** Reload and the world resets to Aetheria.
