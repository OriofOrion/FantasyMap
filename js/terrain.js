// Terrain type palette + the little stamped decorations (trees, peaks, dunes...)
// that give painted regions a hand-drawn fantasy-map feel instead of flat GIS fill.

// Muted, desaturated "aged paper" palette -- deliberately duller than a
// typical flat-fill map so painted terrain reads as toned parchment rather
// than bright cartoon color.
const TERRAIN_TYPES = {
  blank:     { label: 'Unmapped',  color: '#e6dcc3', deco: null },
  ocean:     { label: 'Ocean',     color: '#8a9fac', deco: 'wave' },
  shallows:  { label: 'Shallows',  color: '#a8b8bf', deco: 'wave' },
  plains:    { label: 'Plains',    color: '#c9c1a0', deco: null },
  grassland: { label: 'Grassland', color: '#a8ab84', deco: 'tuft' },
  forest:    { label: 'Forest',    color: '#7f8a6a', deco: 'tree' },
  deepforest:{ label: 'Dense Forest', color: '#636f54', deco: 'tree-dark' },
  hills:     { label: 'Hills',     color: '#b3a781', deco: 'hill' },
  mountains: { label: 'Mountains', color: '#928a7a', deco: 'peak' },
  snowpeaks: { label: 'Snow Peaks', color: '#d6d3c4', deco: 'peak-snow' },
  swamp:     { label: 'Swamp',     color: '#7c8168', deco: 'reed' },
  desert:    { label: 'Desert',    color: '#c9b989', deco: 'dune' },
  tundra:    { label: 'Tundra',    color: '#c4c3b3', deco: null },
  badlands:  { label: 'Badlands',  color: '#94826e', deco: 'crack' },
};

const TERRAIN_KEYS = Object.keys(TERRAIN_TYPES);

// Rejection-sampling spacing + glyph size for each decoration type.
const DECO_PARAMS = {
  tree:       { spacing: 28, size: 24 },
  'tree-dark':{ spacing: 46, size: 46 },  // stamp already depicts a small tree cluster
  hill:       { spacing: 48, size: 55 },
  peak:       { spacing: 55, size: 65 },
  'peak-snow':{ spacing: 55, size: 65 },
  reed:       { spacing: 28, size: 20 },
  dune:       { spacing: 46, size: 34 },
  crack:      { spacing: 42, size: 26 },
  wave:       { spacing: 95, size: 20 },
  tuft:       { spacing: 24, size: 14 },
};

// Deco types backed by hand-drawn brush stamps (see brush-stamps.js) rather
// than procedural vector shapes, plus the ink color each is tinted with.
const DECO_STAMPS = {
  tree: { key: 'tree_starburst', color: '#3f6b34' },
  'tree-dark': { key: 'tree_cluster', color: '#2f4a2a' },
  hill: { key: 'jans_hill', color: 'rgba(58,46,24,0.6)' },
  peak: { key: 'jans_mountain_range', color: '#4a3f30' },
  'peak-snow': { key: 'jans_mountain_range', color: '#8f9499' },
  reed: { key: 'reed', color: '#3d4a2c' },
  dune: { key: 'dune', color: 'rgba(122,96,50,0.6)' },
  crack: { key: 'jans_rocks', color: 'rgba(58,38,26,0.65)' },
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
  switch (type) {
    case 'wave': {
      ctx.strokeStyle = 'rgba(255,255,255,0.32)';
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, 0);
      ctx.quadraticCurveTo(-size * 0.2, -size * 0.22, 0, 0);
      ctx.quadraticCurveTo(size * 0.2, size * 0.22, size * 0.4, 0);
      ctx.stroke();
      break;
    }
    case 'tuft': {
      ctx.strokeStyle = 'rgba(70,90,40,0.5)';
      ctx.lineWidth = size * 0.07;
      for (const dx of [-0.15, 0, 0.15]) {
        ctx.beginPath();
        ctx.moveTo(dx * size, size * 0.15);
        ctx.lineTo(dx * size * 1.4, -size * 0.25);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}
