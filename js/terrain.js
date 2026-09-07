// Terrain type palette + the little stamped decorations (trees, peaks, dunes...)
// that give painted regions a hand-drawn fantasy-map feel instead of flat GIS fill.

const TERRAIN_TYPES = {
  blank:     { label: 'Unmapped',  color: '#e9dfc4', deco: null },
  ocean:     { label: 'Ocean',     color: '#3d6fa3', deco: 'wave' },
  shallows:  { label: 'Shallows',  color: '#6fa6c9', deco: 'wave' },
  plains:    { label: 'Plains',    color: '#cdc98f', deco: null },
  grassland: { label: 'Grassland', color: '#a7c07a', deco: 'tuft' },
  forest:    { label: 'Forest',    color: '#6f9457', deco: 'tree' },
  deepforest:{ label: 'Dense Forest', color: '#4f7a45', deco: 'tree-dark' },
  hills:     { label: 'Hills',     color: '#b9a769', deco: 'hill' },
  mountains: { label: 'Mountains', color: '#948674', deco: 'peak' },
  snowpeaks: { label: 'Snow Peaks', color: '#dfe6e9', deco: 'peak-snow' },
  swamp:     { label: 'Swamp',     color: '#6c7a52', deco: 'reed' },
  desert:    { label: 'Desert',    color: '#e1c98a', deco: 'dune' },
  tundra:    { label: 'Tundra',    color: '#cdd6c4', deco: null },
  badlands:  { label: 'Badlands',  color: '#8a6a58', deco: 'crack' },
};

const TERRAIN_KEYS = Object.keys(TERRAIN_TYPES);

// Rejection-sampling spacing + glyph size for each decoration type.
const DECO_PARAMS = {
  tree:       { spacing: 26, size: 20 },
  'tree-dark':{ spacing: 22, size: 18 },
  hill:       { spacing: 40, size: 30 },
  peak:       { spacing: 44, size: 34 },
  'peak-snow':{ spacing: 44, size: 34 },
  reed:       { spacing: 30, size: 16 },
  dune:       { spacing: 46, size: 30 },
  crack:      { spacing: 50, size: 26 },
  wave:       { spacing: 40, size: 22 },
  tuft:       { spacing: 24, size: 14 },
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
  switch (type) {
    case 'tree':
    case 'tree-dark': {
      const dark = type === 'tree-dark';
      ctx.fillStyle = dark ? '#2f4a2a' : '#3f6b34';
      ctx.strokeStyle = '#22331d';
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.55);
      ctx.lineTo(size * 0.4, size * 0.15);
      ctx.lineTo(-size * 0.4, size * 0.15);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a3324';
      ctx.fillRect(-size * 0.05, size * 0.12, size * 0.1, size * 0.25);
      break;
    }
    case 'hill': {
      ctx.strokeStyle = 'rgba(74,58,30,0.55)';
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.arc(0, size * 0.15, size * 0.4, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'peak':
    case 'peak-snow': {
      ctx.fillStyle = type === 'peak-snow' ? '#f4f7f8' : '#7d7364';
      ctx.strokeStyle = '#3a3226';
      ctx.lineWidth = size * 0.06;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.55);
      ctx.lineTo(size * 0.45, size * 0.35);
      ctx.lineTo(-size * 0.45, size * 0.35);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.55);
      ctx.lineTo(size * 0.16, -size * 0.2);
      ctx.lineTo(-size * 0.16, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'reed': {
      ctx.strokeStyle = '#3d4a2c';
      ctx.lineWidth = size * 0.08;
      for (const dx of [-0.2, 0, 0.2]) {
        ctx.beginPath();
        ctx.moveTo(dx * size, size * 0.3);
        ctx.quadraticCurveTo(dx * size + size * 0.15, 0, dx * size + size * 0.05, -size * 0.4);
        ctx.stroke();
      }
      break;
    }
    case 'dune': {
      ctx.strokeStyle = 'rgba(122,96,50,0.55)';
      ctx.lineWidth = size * 0.07;
      ctx.beginPath();
      ctx.arc(0, size * 0.2, size * 0.4, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      break;
    }
    case 'crack': {
      ctx.strokeStyle = 'rgba(58,38,26,0.6)';
      ctx.lineWidth = size * 0.06;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.3);
      ctx.lineTo(-size * 0.05, 0);
      ctx.lineTo(-size * 0.2, size * 0.35);
      ctx.moveTo(-size * 0.05, 0);
      ctx.lineTo(size * 0.3, size * 0.2);
      ctx.stroke();
      break;
    }
    case 'wave': {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = size * 0.09;
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
