# UI — world-mind-map

## Screens

### World map
**Purpose:** see everything the world contains at once, and say what belongs to
what by moving it there.

**Contains:**
- The **world card** — a large circle in the middle, named, warm gold, fixed.
- **Placed cards** — events and objects that belong to something, drawn in a
  ring around their parent, joined to it by a thin line. Solid border.
- **Loose cards** — events and objects that belong to nothing yet, sitting
  wherever they were left. Dashed border, slightly dimmed.
- **Toolbar**, top left — the map's name, the one-line rule of the gesture,
  `+ Event`, `+ Object`, and a count of what is still unplaced.
- **Canvas controls**, bottom left — zoom in, zoom out, fit.

**Reached from:** it is the whole app; there is nothing else yet.
**Leads to:** nowhere yet. A card has no detail view, and a world has no picker.

## Navigation

One screen, no routes. The canvas pans and zooms; that is the only movement.

## The gesture

The whole interface is one gesture read two ways:

- **Drag a card onto another card** → it belongs to that card. The target
  brightens and swells while you hold something over it, so the drop is
  committed to before the mouse is released.
- **Drag a card onto empty canvas** → it belongs to nothing, and stays exactly
  where it fell.

Consequences, all deliberate:

- There is no second way to relate two things, and no second way to unrelate
  them. No menu, no unlink button, no drawing a wire between two ports.
- A placed card cannot be positioned by hand. The ring decides. Trying to nudge
  a placed card sideways will detach it and leave it loose, which is either the
  right honesty about what "placed" means or the first thing to hate about it.
- Nesting comes free: an object dropped on an event belongs to the event.
  Nothing prevents depth beyond a card not being droppable onto its own
  descendant.

Double-click renames, in place, on the card.

## Look and feel

- **Dark, warm-lit.** Near-black blue-grey ground with a soft glow behind the
  centre, so the world reads as the light source and the eye starts there.
- **Serif for names, sans for chrome.** Names are the writer's own words and get
  a book face; labels, counts and buttons stay quiet in a UI sans.
- **Colour carries kind, not status.** Gold is the world, blue is an event,
  green is an object. Nothing else is coloured.
- **Belonging is carried by border, not colour** — dashed and dimmed means
  loose, solid and shadowed means placed — so the two readings never compete.
- **Circles throughout,** including for events and objects. A spider diagram
  wants one shape; the kind tag above the name does the distinguishing.

## Open questions

- **Are loose cards adrift or in a tray?** Right now they float wherever they
  were dropped, which scatters as the world grows. A holding column down one
  side is the obvious alternative and changes what "unplaced" feels like.
- **Does everything really hang off the world?** Every card currently descends
  from the world or from something that does. A world with sixty events makes
  one enormous ring; grouping — regions, arcs, kinds — has no representation.
- **Should the ring resist you?** Placed cards snap to computed positions. A
  writer who wants two related events side by side has no way to say so.
- **What is a relationship between two objects?** The map only expresses
  belonging. "The Ember Crown was lost at the Siege" and "the Crown belongs to
  the Siege" are not the same claim, and only the second can be drawn.
- **Nothing is saved.** Reload and the world resets to Aetheria.
