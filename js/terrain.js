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
  grassland: { label: 'Grassland', color: '#e2dbb9', deco: 'tuft' },
  forest:    { label: 'Forest',    color: '#dcdab8', deco: 'tree' },
  deepforest:{ label: 'Dense Forest', color: '#d3d2ae', deco: 'tree-dark' },
  hills:     { label: 'Hills',     color: '#e4d8b4', deco: 'hill' },
  mountains: { label: 'Mountains', color: '#ded5bf', deco: 'peak' },
  snowpeaks: { label: 'Snow Peaks', color: '#ede8db', deco: 'peak-snow' },
  swamp:     { label: 'Swamp',     color: '#d8d5b2', deco: 'reed' },
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

// Deco types backed by hand-drawn brush stamps (see brush-stamps.js) rather
// than procedural vector shapes, plus the ink color each is tinted with.
// All from the Janssonius 17th-century pack now, for one consistent style.
const DECO_STAMPS = {
  tree: { key: 'jans_tree', color: '#3f4a30' },
  'tree-dark': { key: 'jans_forest_mass', color: '#333d28' },
  hill: { key: 'jans_hill', color: 'rgba(58,46,24,0.6)' },
  peak: { key: 'jans_mountain_range', color: '#4a3f30' },
  'peak-snow': { key: 'jans_mountain_range', color: '#8f9499' },
  reed: { key: 'reed', color: '#3d4a2c' },
  dune: { key: 'dune', color: 'rgba(122,96,50,0.6)' },
  crack: { key: 'jans_rocks', color: 'rgba(58,38,26,0.65)' },
  wave: { key: 'jans_shallow_dots', color: 'rgba(255,255,255,0.55)' },
  tuft: { key: 'jans_field', color: 'rgba(60,58,30,0.5)' },
};

// Cheap deterministic pseudo-random so re-rendering the same deco point
// (e.g. after undo/redo) always looks identical without storing a seed.
function hashRand(x, y, salt) {
  let h = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function drawDeco(ctx, type, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const stamp = DECO_STAMPS[type];
  if (stamp) {
    drawStamp(ctx, stamp.key, size, stamp.color);
    ctx.restore();
    return;
  }
  ctx.restore();
}
