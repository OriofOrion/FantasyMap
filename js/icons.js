// Hand-drawn vector icon glyphs for map points-of-interest.
// Every draw(ctx, size) assumes ctx is already translated to the icon's
// center and expects to draw within roughly [-size/2, size/2].
// No external image assets are used so the app has zero network dependencies.

const INK = '#3a2e22';

function withStyle(ctx, fill, stroke, lineWidth) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

const ICON_DEFS = {
  castle: {
    label: 'Castle',
    draw(ctx, s) {
      withStyle(ctx, '#c9c3b6', INK, s * 0.05);
      const w = s * 0.8, h = s * 0.5, top = -h * 0.3;
      ctx.beginPath();
      ctx.rect(-w / 2, top, w, h);
      ctx.fill(); ctx.stroke();
      // crenellations
      const teeth = 4, tw = w / teeth;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const x = -w / 2 + i * tw;
        if (i % 2 === 0) ctx.rect(x, top - tw * 0.5, tw, tw * 0.5);
      }
      ctx.fill(); ctx.stroke();
      // towers
      for (const tx of [-w / 2, w / 2]) {
        ctx.beginPath();
        ctx.rect(tx - tw * 0.35, top - tw * 0.9, tw * 0.7, h + tw * 0.9);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx - tw * 0.4, top - tw * 0.9);
        ctx.lineTo(tx, top - tw * 1.6);
        ctx.lineTo(tx + tw * 0.4, top - tw * 0.9);
        ctx.closePath();
        ctx.fillStyle = '#8a3b3b';
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c9c3b6';
      }
      // gate
      ctx.beginPath();
      ctx.rect(-tw * 0.25, top + h * 0.4, tw * 0.5, h * 0.6);
      ctx.fillStyle = INK;
      ctx.fill();
    },
  },
  city: {
    label: 'City',
    draw(ctx, s) {
      withStyle(ctx, '#d8c9a3', INK, s * 0.045);
      const positions = [-0.3, 0, 0.3];
      positions.forEach((p, i) => {
        const h = s * (0.35 + (i % 2 === 0 ? 0.1 : 0));
        ctx.beginPath();
        ctx.rect(p * s - s * 0.12, s * 0.25 - h, s * 0.24, h);
        ctx.fill(); ctx.stroke();
      });
      // circle wall marker beneath
      ctx.beginPath();
      ctx.ellipse(0, s * 0.3, s * 0.55, s * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  town: {
    label: 'Town',
    draw(ctx, s) {
      withStyle(ctx, '#e2c9a0', INK, s * 0.05);
      ctx.beginPath();
      ctx.rect(-s * 0.28, -s * 0.05, s * 0.56, s * 0.4);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, -s * 0.05);
      ctx.lineTo(0, -s * 0.4);
      ctx.lineTo(s * 0.34, -s * 0.05);
      ctx.closePath();
      ctx.fillStyle = '#8a3b3b';
      ctx.fill(); ctx.stroke();
    },
  },
  village: {
    label: 'Village',
    draw(ctx, s) {
      withStyle(ctx, '#e2c9a0', INK, s * 0.06);
      ctx.beginPath();
      ctx.rect(-s * 0.18, -s * 0.02, s * 0.36, s * 0.28);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.24, -s * 0.02);
      ctx.lineTo(0, -s * 0.3);
      ctx.lineTo(s * 0.24, -s * 0.02);
      ctx.closePath();
      ctx.fillStyle = '#8a5b3b';
      ctx.fill(); ctx.stroke();
    },
  },
  ruins: {
    label: 'Ruins',
    draw(ctx, s) {
      withStyle(ctx, '#a89e8c', INK, s * 0.05);
      const cols = [-0.3, -0.05, 0.28];
      const heights = [0.5, 0.25, 0.4];
      cols.forEach((cx, i) => {
        ctx.beginPath();
        ctx.rect(cx * s - s * 0.045, s * 0.3 - s * heights[i], s * 0.09, s * heights[i]);
        ctx.fill(); ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, s * 0.3);
      ctx.lineTo(s * 0.35, s * 0.3);
      ctx.stroke();
    },
  },
  tower: {
    label: 'Tower',
    draw(ctx, s) {
      withStyle(ctx, '#bdb4a1', INK, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, s * 0.35);
      ctx.lineTo(-s * 0.22, -s * 0.25);
      ctx.lineTo(s * 0.22, -s * 0.25);
      ctx.lineTo(s * 0.16, s * 0.35);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.rect(-s * 0.28, -s * 0.4, s * 0.56, s * 0.15);
      ctx.fill(); ctx.stroke();
    },
  },
  dungeon: {
    label: 'Cave / Dungeon',
    draw(ctx, s) {
      withStyle(ctx, '#5b5348', INK, s * 0.05);
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.35, Math.PI, 0);
      ctx.lineTo(s * 0.35, s * 0.3);
      ctx.lineTo(-s * 0.35, s * 0.3);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08, s * 0.14, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1611';
      ctx.fill();
    },
  },
  mine: {
    label: 'Mine',
    draw(ctx, s) {
      withStyle(ctx, '#7a6a55', INK, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.3);
      ctx.lineTo(0, -s * 0.15);
      ctx.lineTo(s * 0.3, s * 0.3);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.1, s * 0.12, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1611';
      ctx.fill();
      // crossed pickaxes
      ctx.strokeStyle = '#6b6b6b';
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, s * 0.5); ctx.lineTo(s * 0.15, s * 0.15);
      ctx.moveTo(s * 0.32, s * 0.5); ctx.lineTo(-s * 0.15, s * 0.15);
      ctx.stroke();
    },
  },
  port: {
    label: 'Port / Harbor',
    draw(ctx, s) {
      withStyle(ctx, '#3a6ea8', INK, s * 0.05);
      // anchor
      ctx.beginPath();
      ctx.arc(0, -s * 0.28, s * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.18); ctx.lineTo(0, s * 0.32);
      ctx.moveTo(-s * 0.28, s * 0.02); ctx.lineTo(s * 0.28, s * 0.02);
      ctx.moveTo(-s * 0.28, s * 0.32); ctx.quadraticCurveTo(0, s * 0.5, 0, s * 0.32);
      ctx.quadraticCurveTo(0, s * 0.5, s * 0.28, s * 0.32);
      ctx.lineWidth = s * 0.08;
      ctx.strokeStyle = INK;
      ctx.stroke();
    },
  },
  camp: {
    label: 'Camp',
    draw(ctx, s) {
      withStyle(ctx, '#c9a86a', INK, s * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.35);
      ctx.lineTo(-s * 0.3, s * 0.32);
      ctx.lineTo(s * 0.3, s * 0.32);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.35); ctx.lineTo(0, s * 0.32);
      ctx.stroke();
    },
  },
  temple: {
    label: 'Temple / Shrine',
    draw(ctx, s) {
      withStyle(ctx, '#d9d2bf', INK, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.05);
      ctx.lineTo(0, -s * 0.38);
      ctx.lineTo(s * 0.35, -s * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      for (const cx of [-0.24, -0.08, 0.08, 0.24]) {
        ctx.beginPath();
        ctx.rect(cx * s - s * 0.03, -s * 0.05, s * 0.06, s * 0.35);
        ctx.fill(); ctx.stroke();
      }
      ctx.beginPath();
      ctx.rect(-s * 0.35, s * 0.3, s * 0.7, s * 0.06);
      ctx.fill(); ctx.stroke();
    },
  },
  lighthouse: {
    label: 'Lighthouse',
    draw(ctx, s) {
      withStyle(ctx, '#e4ddc9', INK, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.14, s * 0.35);
      ctx.lineTo(-s * 0.2, -s * 0.28);
      ctx.lineTo(s * 0.2, -s * 0.28);
      ctx.lineTo(s * 0.14, s * 0.35);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a3b3b';
      ctx.beginPath();
      ctx.rect(-s * 0.17, -s * 0.1, s * 0.34, s * 0.12);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(-s * 0.24, -s * 0.4, s * 0.48, s * 0.14);
      ctx.fillStyle = '#e4ddc9';
      ctx.fill(); ctx.stroke();
    },
  },
  farm: {
    label: 'Farm',
    draw(ctx, s) {
      withStyle(ctx, '#c94f3d', INK, s * 0.05);
      ctx.beginPath();
      ctx.rect(-s * 0.28, -s * 0.05, s * 0.4, s * 0.3);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, -s * 0.05);
      ctx.lineTo(-s * 0.08, -s * 0.32);
      ctx.lineTo(s * 0.16, -s * 0.05);
      ctx.closePath();
      ctx.fillStyle = '#8a5b3b';
      ctx.fill(); ctx.stroke();
    },
  },
  windmill: {
    label: 'Windmill',
    draw(ctx, s) {
      withStyle(ctx, '#d9d2bf', INK, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.12, s * 0.35);
      ctx.lineTo(-s * 0.18, -s * 0.2);
      ctx.lineTo(s * 0.18, -s * 0.2);
      ctx.lineTo(s * 0.12, s * 0.35);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.translate(0, -s * 0.2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = s * 0.045;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(s * 0.3, -s * 0.08);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  battle: {
    label: 'Battle Site',
    draw(ctx, s) {
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = s * 0.08;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3);
      ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(-s * 0.3, s * 0.3);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-s * 0.3, -s * 0.3, s * 0.06, 0, Math.PI * 2);
      ctx.arc(s * 0.3, -s * 0.3, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  landmark: {
    label: 'Landmark',
    draw(ctx, s) {
      withStyle(ctx, '#d9b23c', INK, s * 0.04);
      const spikes = 5, outer = s * 0.36, inner = s * 0.15;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / spikes) * i - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    },
  },
  lair: {
    label: 'Monster Lair',
    draw(ctx, s) {
      withStyle(ctx, '#e4ddc9', INK, s * 0.045);
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.28, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.08, s * 0.05, 0, Math.PI * 2);
      ctx.arc(s * 0.1, -s * 0.08, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(-s * 0.14, s * 0.02, s * 0.06, s * 0.1);
      ctx.rect(-s * 0.02, s * 0.02, s * 0.06, s * 0.1);
      ctx.rect(s * 0.1, s * 0.02, s * 0.06, s * 0.1);
      ctx.fill();
    },
  },
};

const ICON_KEYS = Object.keys(ICON_DEFS);

function drawIconGlyph(ctx, key, x, y, size) {
  const def = ICON_DEFS[key];
  if (!def) return;
  ctx.save();
  ctx.translate(x, y);
  def.draw(ctx, size);
  ctx.restore();
}
