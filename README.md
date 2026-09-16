# Fantasy Map Builder

A freeform fantasy map editor for novels and tabletop RPG settings, inspired by the
hand-drawn maps in fantasy books. Paint continents and terrain, draw rivers and
roads, plant kingdoms' borders, drop in castles/towns/mines/ruins/dungeons and
more, and label everything — all offline, with no account, server, or install step.

## Running it

There's no build step and no dependencies. Just double-click `index.html` to
open it in a modern desktop browser (Chrome, Firefox, Edge, Safari) — no local
server needed. All artwork (including the hand-drawn brush stamps below) is
embedded directly in the JS files as data, so opening the file directly never
runs into the canvas/`file://` restrictions that plain `<img src="...">` local
image files can trigger.

Everything runs client-side. Maps are saved to/loaded from `.json` files you
choose on your own machine — nothing is uploaded anywhere.

## Features

- **Freeform terrain painting** — soft brush across 13 terrain types (ocean,
  shallows, plains, grassland, forest, dense forest, hills, mountains, snow
  peaks, swamp, desert, tundra, badlands), each scattering its own decoration
  stamps (trees, peaks, dunes, reeds, cracks...) instead of flat fill. Several
  of these — trees, mountain peaks, hills, dunes, reeds, badland cracks — are
  real hand-drawn brush art extracted from a Photoshop cartography brush set.
- **Rivers & roads** — click to lay down points, double-click/Enter to finish;
  rivers taper from source to mouth, roads are dashed trails.
- **Political borders** — dashed, colorable boundary lines for kingdoms/factions.
- **22 points-of-interest icons** — castle, city, town, village, ruins, tower,
  dungeon/cave, mine, port, camp, temple (two styles), lighthouse, farm,
  windmill, battle site, landmark, monster lair, island, shield/heraldry, map
  pin, and a flagged castle — a mix of vector line-art and hand-drawn stamps.
- **Labels** — kingdom titles, city names, water-feature names, and notes, each
  with their own typographic style.
- **Select & edit** — click to select, drag to move (including individual river
  points), inspector panel for size/width/color/text, Delete to remove.
- **Undo/redo**, pan (space+drag or middle-mouse) and zoom (scroll wheel).
- **Decorative frame border and a hand-drawn compass rose.**
- **Save/Load** to a portable `.json` file, **Export** to a `.png` image.

## Tips

- Brush size is adjustable in the Terrain panel; painting one terrain over
  another clears and replaces any decorations underneath.
- Escape cancels an in-progress river/road/border; right-click also finishes it.
- Double-click a label to rename it.
