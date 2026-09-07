# Fantasy Map Builder

A freeform fantasy map editor for novels and tabletop RPG settings, inspired by the
hand-drawn maps in fantasy books. Paint continents and terrain, draw rivers and
roads, plant kingdoms' borders, drop in castles/towns/mines/ruins/dungeons and
more, and label everything — all offline, with no account, server, or install step.

## Running it

There's no build step and no dependencies. Just open `index.html` in a modern
desktop browser (Chrome, Firefox, Edge, Safari):

- Double-click `index.html`, **or**
- Serve the folder locally if your browser restricts `file://` access to canvas
  images (e.g. `python3 -m http.server` from this directory, then visit
  `http://localhost:8000`).

Everything runs client-side. Maps are saved to/loaded from `.json` files you
choose on your own machine — nothing is uploaded anywhere.

## Features

- **Freeform terrain painting** — soft brush across 13 terrain types (ocean,
  shallows, plains, grassland, forest, dense forest, hills, mountains, snow
  peaks, swamp, desert, tundra, badlands), each with its own hand-drawn
  decoration stamps (trees, peaks, dunes, reeds, waves...) instead of flat fill.
- **Rivers & roads** — click to lay down points, double-click/Enter to finish;
  rivers taper from source to mouth, roads are dashed trails.
- **Political borders** — dashed, colorable boundary lines for kingdoms/factions.
- **17 points-of-interest icons** — castle, city, town, village, ruins, tower,
  dungeon/cave, mine, port, camp, temple, lighthouse, farm, windmill, battle
  site, landmark, monster lair — all drawn as vector line-art, no image assets.
- **Labels** — kingdom titles, city names, water-feature names, and notes, each
  with their own typographic style.
- **Select & edit** — click to select, drag to move (including individual river
  points), inspector panel for size/width/color/text, Delete to remove.
- **Undo/redo**, pan (space+drag or middle-mouse) and zoom (scroll wheel).
- **Decorative frame border and compass rose.**
- **Save/Load** to a portable `.json` file, **Export** to a `.png` image.

## Tips

- Brush size is adjustable in the Terrain panel; painting one terrain over
  another clears and replaces any decorations underneath.
- Escape cancels an in-progress river/road/border; right-click also finishes it.
- Double-click a label to rename it.
