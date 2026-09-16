// Terrain type palette + the little stamped decorations (trees, peaks, dunes...)
// that give painted regions a hand-drawn fantasy-map feel instead of flat GIS fill.

// Antique-chart palette: almost everything is the same aged parchment.
// Real 17th-century maps barely color-code terrain at all -- land is blank
// cream paper and *ink symbol density* (tree dots, mountain hachures, field
// hatching...) tells you what's there. Water is the one thing that gets a
// distinct (but still pale, desaturated) tone, because separating land from
// sea by color is load-bearing for actually using the map; every land type
// is now only a whisper of tint away from the base parchment color.
const TERRAIN_TYPES = {
  blank:     { label: 'Unmapped',  color: '#ece2c6', deco: null },
  ocean:     { label: 'Ocean',     color: '#c7d0d3', deco: 'wave' },
  shallows:  { label: 'Shallows',  color: '#d7dcd8', deco: 'wave' },
  plains:    { label: 'Plains',    color: '#e9dfc0', deco: null },
  grassland: { label: 'Grassland', color: '#c3cd9c', deco: 'tuft' },
  forest:    { label: 'Forest',    color: '#adbf8d', deco: 'tree' },
  deepforest:{ label: 'Dense Forest', color: '#93a878', deco: 'tree-dark' },
  hills:     { label: 'Hills',     color: '#e4d8b4', deco: 'hill' },
  mountains: { label: 'Mountains', color: '#ded5bf', deco: 'peak' },
  snowpeaks: { label: 'Snow Peaks', color: '#ede8db', deco: 'peak-snow' },
  swamp:     { label: 'Swamp',     color: '#a3ad82', deco: 'reed' },
  desert:    { label: 'Desert',    color: '#e8d8a8', deco: 'dune' },
  tundra:    { label: 'Tundra',    color: '#e2ddc9', deco: null },
  badlands:  { label: 'Badlands',  color: '#dccbab', deco: 'crack' },
};

const TERRAIN_KEYS = Object.keys(TERRAIN_TYPES);

// Rejection-sampling spacing + glyph size for each decoration type.
const DECO_PARAMS = {
  tree:       { spacing: 30, size: 26 },
  'tree-dark':{ spacing: 60, size: 70 },  // stamp already depicts a whole forest mass
  hill:       { spacing: 48, size: 55 },
  peak:       { spacing: 55, size: 65 },
  'peak-snow':{ spacing: 55, size: 65 },
  reed:       { spacing: 28, size: 20 },
  dune:       { spacing: 46, size: 34 },
  crack:      { spacing: 42, size: 26 },
  wave:       { spacing: 70, size: 28 },
  tuft:       { spacing: 60, size: 60 },
};

// Deco types backed by hand-drawn brush stamps (see brush-stamps.js /
// janssonius-stamps.js) rather than procedural vector shapes, plus the ink
// color each is tinted with. Each lists several visual variants -- one is
// picked per decoration instance (deterministically, from its position) so
// a painted forest or mountain range shows natural variety instead of one
// symbol stamped over and over.
const DECO_STAMPS = {
  tree: { keys: ['jans_tree', 'jans_tree_b', 'jans_tree_c', 'jans_tree_palm'], color: '#3f4a30' },
  'tree-dark': { keys: ['jans_forest_mass', 'jans_forest_b', 'jans_forest_c', 'jans_forest_d', 'jans_forest_e'], color: '#333d28' },
  hill: { keys: ['jans_hill', 'jans_hill_b', 'jans_hill_c', 'jans_hill_d', 'jans_hill_e'], color: 'rgba(58,46,24,0.6)' },
  peak: { keys: ['jans_mountain_range', 'jans_range_b', 'jans_range_c', 'jans_range_d', 'jans_range_e'], color: '#4a3f30' },
  'peak-snow': { keys: ['jans_mountain_range', 'jans_range_b', 'jans_range_c', 'jans_range_d', 'jans_range_e'], color: '#8f9499' },
  reed: { keys: ['reed'], color: '#3d4a2c' },
  dune: { keys: ['dune'], color: 'rgba(122,96,50,0.6)' },
  crack: { keys: ['jans_rocks', 'jans_rocks_b', 'jans_rocks_c', 'jans_rocks_d'], color: 'rgba(58,38,26,0.65)' },
  wave: { keys: ['jans_shallow_dots', 'jans_shallow_b', 'jans_shallow_c', 'jans_shallow_d'], color: 'rgba(255,255,255,0.55)' },
  tuft: { keys: ['jans_field', 'jans_field_b', 'jans_field_c'], color: 'rgba(60,58,30,0.5)' },
};

// Cheap deterministic pseudo-random so re-rendering the same deco point
// (e.g. after undo/redo) always looks identical without storing a seed.
function hashRand(x, y, salt) {
  let h = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function pickVariant(keys, x, y) {
  if (keys.length <= 1) return keys[0];
  const idx = Math.floor(hashRand(x, y, 999) * keys.length);
  return keys[Math.min(idx, keys.length - 1)];
}

function drawDeco(ctx, type, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const stamp = DECO_STAMPS[type];
  if (stamp) {
    const key = pickVariant(stamp.keys, x, y);
    drawStamp(ctx, key, size, stamp.color);
    ctx.restore();
    return;
  }
  ctx.restore();
}
