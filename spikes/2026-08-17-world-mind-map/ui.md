# UI — world-mind-map

## Screens

### World map
**Purpose:** see what the world is made of, one level at a time, and say what
belongs to what by moving it there.

**Contains:**
- The **focused card** — a large circle at the middle of the screen. The world
  to begin with; whatever you last clicked into after that.
- **Its ring** — what belongs to the focused card, standing around it and joined
  to it by a thin line. Nothing deeper is drawn.
- **Loose cards** — events and objects that belong to nothing yet, sitting
  wherever they were left. Dashed border, slightly dimmed. Visible at every
  depth, because there has to be somewhere to drag them from.
- **Breadcrumb**, top centre — `Aetheria › Events › Siege of Ravenhold`. Every
  crumb is a way back.
- **Toolbar**, top left — the map's name, the rules of the gesture, `+ Event`,
  `+ Object`, and what is still unplaced.
- **Canvas controls**, bottom left — zoom in, zoom out, fit.

**Reached from:** it is the whole app.
**Leads to:** itself, one level down.

## Navigation

One screen. Movement is inward and outward, not sideways: click a card to make
it the middle, click a breadcrumb to come back out. The canvas pans and zooms,
and re-frames itself when the depth changes.

## Decomposition

**More than one of a kind and they stop being cards.** Two or more events
belonging to the same thing are drawn as a single stacked circle labelled
**Events**, with the count on it. One event is drawn as itself, named.

A stack is a **way of drawing, not a thing that exists**. Its identity is just
the card it hangs off and the kind it gathers, so nothing about grouping is
stored: change what belongs to what and the stacks re-form by themselves. Take
an event away from a world that had two and the stack dissolves back into a
single named card, with nothing to clean up.

A stack in the ring carries its count. **The same stack in the middle does
not** — you are already inside it, and the ring around it is the count.

Clicking a stack takes you inside it, where the cards are shown as themselves
and never re-stacked. From there, clicking one of them takes you inside *it*,
where its own events and objects are — the Siege of Ravenhold owning the Salt
Ledger, and so on down.

The consequence to watch: at the top level, a large world reads as two abstract
stacks — `Events (34)` and `Objects (12)` — and none of its actual contents. The
world becomes a filing cabinet at exactly the point where it becomes worth
looking at.

## The gesture

One gesture, read two ways:

- **Drag a card onto another card** → it belongs to that card. The target
  brightens and swells while you hold something over it, so the drop is
  committed to before the mouse is released.
- **Drag a card onto empty canvas** → it belongs to nothing, and stays exactly
  where it fell.

Dropping onto a **stack** means dropping onto the card the stack hangs off —
drop an event on `Events` and it belongs to the world, which is where those
events belong. Dropping an *object* on `Events` also attaches it to the world;
it then appears in the Objects stack rather than the Events one, because the
stack you aimed at was never a container.

Consequences, all deliberate:

- There is no second way to relate two things, and no second way to unrelate
  them. No menu, no unlink button, no drawing a wire between two ports.
- Cards in a ring cannot be positioned by hand. The ring decides. Dragging one
  sideways and letting go on empty canvas takes it out of the ring entirely.
- Nothing can be dropped inside itself or anything below it.
- Clicking is navigation, so **rename is a click on the middle card** — the one
  place a click has nowhere further to go. A drag that ends on top of the card
  being dragged does not count as a click.

## Look and feel

- **Dark, warm-lit.** Near-black blue-grey ground with a soft glow behind the
  centre, so the middle reads as the light source and the eye starts there.
- **Serif for names, sans for chrome.** Names are the writer's own words and get
  a book face; labels, counts and buttons stay quiet in a UI sans.
- **Colour carries kind, not status.** Gold is the world, blue is an event,
  green is an object. A stack takes the colour of what it gathers.
- **Belonging is carried by border, not colour** — dashed and dimmed means
  loose, solid and shadowed means placed.
- **A stack is drawn as a stack** — two dimmer circles offset behind the front
  one, lifting slightly on hover.
- **Circles throughout.** A spider diagram wants one shape; the kind tag above
  the name does the distinguishing.

## Open questions

- **The top level goes abstract.** A world of any size shows two stacks and
  nothing else. Whether the first ring should stay literal for longer, or split
  by something other than kind, is the live question.
- **Two is a low bar.** The threshold for stacking is `GROUP_AT = 2` in
  `grouping.ts`, one number, trivially raised.
- **Kind is the only thing stacks are made of.** Regions, arcs, factions,
  chapters — none of them can group anything, because grouping is hardcoded to
  event-versus-object.
- **Are loose cards adrift or in a tray?** They float wherever they were
  dropped, at every depth, which will scatter as the world grows.
- **What is a relationship between two objects?** The map only expresses
  belonging. "The Ember Crown was lost at the Siege" and "the Crown belongs to
  the Siege" are not the same claim, and only the second can be drawn.
- **Nothing is saved.** Reload and the world resets to Aetheria.
