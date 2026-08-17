# UI — world-mind-map

## Screens

### World map
**Purpose:** see what the world is made of, one level at a time, and say what
belongs to what by moving it there.

**Contains:**
- The **focused card** — a big circle at the middle of the screen, near three
  times the width of anything around it. The world to begin with; whatever you
  last opened after that.
- **Its category badges** — large labelled circles on its rim, `Events 3`,
  `Objects 1`, one per kind it holds. These are the way in.
- **Its ring** — only when a *category* is in the middle: its members, standing
  around it and joined by a thin line, and at the end of them an **empty slot**
  — a dashed circle reading `+ New event` — for making another.
- **Breadcrumb**, top centre — `Aetheria › Events › Siege of Ravenhold`. Every
  crumb is a way back.
- **Toolbar**, top left — the map's name, the rules of the gesture, `+ Event`,
  `+ Object`, and how much is in the world.
- **Canvas controls**, bottom left — zoom in, zoom out, fit.

**Reached from:** it is the whole app.
**Leads to:** itself, one level down.

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
- **A category's ring ends in an empty slot.** Inside `Events`, the last place
  in the ring is a dashed `+ New event`. Pressing it makes the card where it
  will stand, rather than from a button in the corner — so once you are inside
  a category, adding is part of the picture rather than part of the chrome. The
  toolbar buttons still work and mean the same thing.
- **Dropping on empty canvas sends a card back to the top of the world**, rather
  than orphaning it. It is the way out of something, not the way out of
  everything.

After an add, the map goes to the category that now holds the new card and puts
its name in edit — so you see the thing you just made rather than a badge count
going up somewhere.

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
- **The empty slot is somewhere to press, never somewhere to land.** It is not
  a drop target and cannot be dragged, and its line to the middle is dashed.
- **At world level there is nothing to drag.** A card in the middle has no ring
  and nothing floats, so the only things on the canvas are the world and its
  badges. Dragging — and making things — both live inside a category.

## Look and feel

- **Dark, warm-lit.** Near-black blue-grey ground with a soft glow behind the
  centre, so the middle reads as the light source and the eye starts there.
- **Serif for names, sans for chrome.** Names are the writer's own words and get
  a book face; labels, counts and buttons stay quiet in a UI sans.
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
- **Nothing is saved.** Reload and the world resets to Aetheria.
