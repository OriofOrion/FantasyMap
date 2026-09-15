// Core map state, rendering and editing logic. No framework, no build step.

const SIZE_PRESETS = {
  small:  { width: 1600, height: 1000 },
  medium: { width: 2800, height: 1800 },
  large:  { width: 4200, height: 2700 },
};

class MapApp {
  constructor(viewCanvas) {
    this.viewCanvas = viewCanvas;
    this.viewCtx = viewCanvas.getContext('2d');
    this.worldCanvas = document.createElement('canvas');
    this.worldCtx = this.worldCanvas.getContext('2d');

    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;

    this.undoStack = [];
    this.redoStack = [];

    this.selectedId = null;
    this.onSelectionChange = null;
    this.onHistoryChange = null;
    this.onStateChange = null;

    this.decoGrid = new Map();
    this.decoCellSize = 48;

    this._strokeBefore = null;
    this._strokeOps = [];

    this.newMap('Untitled Map', 'medium');
  }

  // ---------- setup / state ----------

  newMap(name, presetKey) {
    const preset = SIZE_PRESETS[presetKey] || SIZE_PRESETS.medium;
    this.state = {
      version: 1,
      name,
      width: preset.width,
      height: preset.height,
      objects: [],
      settings: { showGrid: false, showFrame: true, compass: { x: preset.width - 140, y: 140 } },
      nextId: 1,
    };
    this.worldCanvas.width = preset.width;
    this.worldCanvas.height = preset.height;
    this.worldCtx.fillStyle = TERRAIN_TYPES.blank.color;
    this.worldCtx.fillRect(0, 0, preset.width, preset.height);
    this.decoGrid.clear();
    this.undoStack = [];
    this.redoStack = [];
    this.selectedId = null;
    this.fitToView();
    this._notifyHistory();
    this._notifyState();
  }

  nextId() {
    return 'o' + this.state.nextId++;
  }

  // ---------- view transform ----------

  fitToView() {
    const vw = this.viewCanvas.clientWidth || 800;
    const vh = this.viewCanvas.clientHeight || 600;
    const scale = Math.min(vw / this.state.width, vh / this.state.height) * 0.92;
    this.zoom = scale;
    this.panX = (vw - this.state.width * scale) / 2;
    this.panY = (vh - this.state.height * scale) / 2;
  }

  worldToScreen(x, y) {
    return { x: x * this.zoom + this.panX, y: y * this.zoom + this.panY };
  }

  screenToWorld(x, y) {
    return { x: (x - this.panX) / this.zoom, y: (y - this.panY) / this.zoom };
  }

  zoomBy(factor, centerScreen) {
    const before = this.screenToWorld(centerScreen.x, centerScreen.y);
    this.zoom = Math.min(8, Math.max(0.1, this.zoom * factor));
    const after = this.worldToScreen(before.x, before.y);
    this.panX -= after.x - centerScreen.x;
    this.panY -= after.y - centerScreen.y;
  }

  pan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
  }

  // ---------- spatial grid for decorations ----------

  _cellKey(x, y) {
    return Math.floor(x / this.decoCellSize) + ',' + Math.floor(y / this.decoCellSize);
  }

  _gridAdd(obj) {
    const key = this._cellKey(obj.x, obj.y);
    let set = this.decoGrid.get(key);
    if (!set) { set = new Set(); this.decoGrid.set(key, set); }
    set.add(obj.id);
  }

  _gridRemove(obj) {
    const key = this._cellKey(obj.x, obj.y);
    const set = this.decoGrid.get(key);
    if (set) set.delete(obj.id);
  }

  _queryRadius(x, y, r) {
    const results = [];
    const c0x = Math.floor((x - r) / this.decoCellSize);
    const c1x = Math.floor((x + r) / this.decoCellSize);
    const c0y = Math.floor((y - r) / this.decoCellSize);
    const c1y = Math.floor((y + r) / this.decoCellSize);
    for (let cx = c0x; cx <= c1x; cx++) {
      for (let cy = c0y; cy <= c1y; cy++) {
        const set = this.decoGrid.get(cx + ',' + cy);
        if (!set) continue;
        for (const id of set) {
          const obj = this.getObject(id);
          if (!obj) continue;
          const dx = obj.x - x, dy = obj.y - y;
          if (dx * dx + dy * dy <= r * r) results.push(obj);
        }
      }
    }
    return results;
  }

  getObject(id) {
    return this.state.objects.find((o) => o.id === id) || null;
  }

  // ---------- undo/redo plumbing ----------

  beginTerrainStroke() {
    this._strokeBefore = this.worldCanvas.toDataURL('image/png');
    this._strokeOps = [];
  }

  _pushOp(op) {
    this._strokeOps.push(op);
  }

  endTerrainStroke() {
    const after = this.worldCanvas.toDataURL('image/png');
    const action = { terrain: { before: this._strokeBefore, after }, ops: this._strokeOps };
    this._strokeBefore = null;
    this._strokeOps = [];
    this.undoStack.push(action);
    if (this.undoStack.length > 25) this.undoStack.shift();
    this.redoStack = [];
    this._notifyHistory();
    this._notifyState();
  }

  commitObjectAction(ops) {
    if (!ops.length) return;
    this.undoStack.push({ terrain: null, ops });
    if (this.undoStack.length > 25) this.undoStack.shift();
    this.redoStack = [];
    this._notifyHistory();
    this._notifyState();
  }

  _applyOp(op, direction) {
    // direction: 'redo' (do the op forward) or 'undo' (reverse it)
    if (op.op === 'add') {
      if (direction === 'redo') { this.state.objects.push(op.obj); if (op.obj.type === 'deco') this._gridAdd(op.obj); }
      else { this.state.objects = this.state.objects.filter((o) => o.id !== op.obj.id); if (op.obj.type === 'deco') this._gridRemove(op.obj); }
    } else if (op.op === 'remove') {
      if (direction === 'redo') { this.state.objects = this.state.objects.filter((o) => o.id !== op.obj.id); if (op.obj.type === 'deco') this._gridRemove(op.obj); }
      else { this.state.objects.push(op.obj); if (op.obj.type === 'deco') this._gridAdd(op.obj); }
    } else if (op.op === 'update') {
      const obj = this.getObject(op.id);
      if (obj) Object.assign(obj, direction === 'redo' ? op.after : op.before);
    }
  }

  undo() {
    const action = this.undoStack.pop();
    if (!action) return;
    for (let i = action.ops.length - 1; i >= 0; i--) this._applyOp(action.ops[i], 'undo');
    if (action.terrain) this._loadTerrainImage(action.terrain.before);
    this.redoStack.push(action);
    this.selectedId = null;
    this._notifyHistory();
    this._notifySelection();
    this._notifyState();
    this.requestRender();
  }

  redo() {
    const action = this.redoStack.pop();
    if (!action) return;
    for (const op of action.ops) this._applyOp(op, 'redo');
    if (action.terrain) this._loadTerrainImage(action.terrain.after);
    this.undoStack.push(action);
    this.selectedId = null;
    this._notifyHistory();
    this._notifySelection();
    this._notifyState();
    this.requestRender();
  }

  _loadTerrainImage(dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.worldCtx.clearRect(0, 0, this.worldCanvas.width, this.worldCanvas.height);
      this.worldCtx.drawImage(img, 0, 0);
      this.requestRender();
    };
    img.src = dataUrl;
  }

  _notifyHistory() {
    if (this.onHistoryChange) this.onHistoryChange(this.undoStack.length > 0, this.redoStack.length > 0);
  }
  _notifySelection() {
    if (this.onSelectionChange) this.onSelectionChange(this.selectedId ? this.getObject(this.selectedId) : null);
  }
  _notifyState() {
    if (this.onStateChange) this.onStateChange();
  }

  // ---------- terrain painting ----------

  paintDab(wx, wy, radius, terrainKey) {
    const type = TERRAIN_TYPES[terrainKey];
    if (!type) return;
    const ctx = this.worldCtx;
    const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, radius);
    grad.addColorStop(0, type.color);
    grad.addColorStop(0.75, type.color);
    // Fade to a *transparent version of the same color*, not transparent
    // black -- fading toward black leaves a visible dark ring at each dab's
    // edge once many overlapping dabs are composited along a stroke.
    grad.addColorStop(1, hexToRgba(type.color, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(wx, wy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Clear existing decorations under the dab, then scatter new ones.
    const cleared = this._queryRadius(wx, wy, radius);
    for (const obj of cleared) {
      this._gridRemove(obj);
      this.state.objects = this.state.objects.filter((o) => o.id !== obj.id);
      this._pushOp({ op: 'remove', obj });
    }

    if (type.deco) {
      const params = DECO_PARAMS[type.deco];
      const area = Math.PI * radius * radius;
      const attempts = Math.max(3, Math.floor((area / (params.spacing * params.spacing)) * 1.3));
      for (let i = 0; i < attempts; i++) {
        const seed = (wx * 13.13 + wy * 7.77 + i * 91.7 + this.state.nextId * 3.3);
        const rr = Math.sqrt(hashRand(seed, i, 1)) * radius;
        const ang = hashRand(seed, i, 2) * Math.PI * 2;
        const px = wx + Math.cos(ang) * rr;
        const py = wy + Math.sin(ang) * rr;
        if (px < 0 || py < 0 || px > this.state.width || py > this.state.height) continue;
        const neighbors = this._queryRadius(px, py, params.spacing);
        if (neighbors.length > 0) continue;
        const obj = {
          id: this.nextId(), type: 'deco', decoType: type.deco,
          x: px, y: py,
          size: params.size * (0.75 + hashRand(seed, i, 3) * 0.5),
          rot: hashRand(seed, i, 4) * Math.PI * 2,
        };
        this.state.objects.push(obj);
        this._gridAdd(obj);
        this._pushOp({ op: 'add', obj });
      }
    }
  }

  // ---------- generic object helpers (rivers, roads, borders, icons, labels) ----------

  addObject(obj) {
    this.state.objects.push(obj);
    this.commitObjectAction([{ op: 'add', obj }]);
    return obj;
  }

  removeObject(id) {
    const obj = this.getObject(id);
    if (!obj) return;
    this.state.objects = this.state.objects.filter((o) => o.id !== id);
    if (this.selectedId === id) { this.selectedId = null; this._notifySelection(); }
    this.commitObjectAction([{ op: 'remove', obj }]);
  }

  updateObject(id, beforeFields, afterFields) {
    const obj = this.getObject(id);
    if (!obj) return;
    Object.assign(obj, afterFields);
    this.commitObjectAction([{ op: 'update', id, before: beforeFields, after: afterFields }]);
  }

  // ---------- hit testing ----------

  hitTest(wx, wy) {
    const order = [...this.state.objects].filter((o) => o.type === 'icon' || o.type === 'label');
    for (let i = order.length - 1; i >= 0; i--) {
      const o = order[i];
      const r = (o.type === 'icon' ? o.size : o.size * 1.2) / 2 + 6 / this.zoom;
      const dx = o.x - wx, dy = o.y - wy;
      if (dx * dx + dy * dy <= r * r) return o;
    }
    const paths = this.state.objects.filter((o) => o.type === 'river' || o.type === 'road' || o.type === 'border');
    const threshold = 10 / this.zoom;
    for (let i = paths.length - 1; i >= 0; i--) {
      const o = paths[i];
      for (let j = 0; j < o.points.length - 1; j++) {
        if (distToSegment(wx, wy, o.points[j], o.points[j + 1]) <= threshold) return o;
      }
    }
    return null;
  }

  // ---------- rendering ----------

  requestRender() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = null; this.render(); });
  }

  resize() {
    const rect = this.viewCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.viewCanvas.width = rect.width * dpr;
    this.viewCanvas.height = rect.height * dpr;
    this.viewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  render() {
    const ctx = this.viewCtx;
    const vw = this.viewCanvas.clientWidth;
    const vh = this.viewCanvas.clientHeight;
    ctx.fillStyle = '#2b2620';
    ctx.fillRect(0, 0, vw, vh);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    ctx.drawImage(this.worldCanvas, 0, 0);

    // decorations
    for (const o of this.state.objects) {
      if (o.type !== 'deco') continue;
      drawDeco(ctx, o.decoType, o.x, o.y, o.size, o.rot);
    }

    if (this.state.settings.showGrid) this._drawGrid(ctx);

    // borders (political) under roads/rivers
    for (const o of this.state.objects) if (o.type === 'border') this._drawPath(ctx, o);
    for (const o of this.state.objects) if (o.type === 'road') this._drawPath(ctx, o);
    for (const o of this.state.objects) if (o.type === 'river') this._drawPath(ctx, o);
    for (const o of this.state.objects) if (o.type === 'icon') this._drawIcon(ctx, o);
    for (const o of this.state.objects) if (o.type === 'label') this._drawLabel(ctx, o);

    if (this.state.settings.showFrame) this._drawFrame(ctx);
    if (this.state.settings.compass) this._drawCompass(ctx, this.state.settings.compass);

    if (this.selectedId) this._drawSelection(ctx, this.getObject(this.selectedId));

    ctx.restore();
  }

  _drawGrid(ctx) {
    const step = 100;
    ctx.strokeStyle = 'rgba(60,45,25,0.12)';
    ctx.lineWidth = 1 / this.zoom;
    ctx.beginPath();
    for (let x = 0; x <= this.state.width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, this.state.height); }
    for (let y = 0; y <= this.state.height; y += step) { ctx.moveTo(0, y); ctx.lineTo(this.state.width, y); }
    ctx.stroke();
  }

  _drawFrame(ctx) {
    const w = this.state.width, h = this.state.height, m = Math.max(14, Math.min(w, h) * 0.012);
    ctx.strokeStyle = '#3a2e22';
    ctx.lineWidth = m * 0.35;
    ctx.strokeRect(m / 2, m / 2, w - m, h - m);
    ctx.lineWidth = m * 0.1;
    ctx.strokeRect(m * 1.1, m * 1.1, w - m * 2.2, h - m * 2.2);
  }

  _drawCompass(ctx, pos) {
    const s = Math.max(60, Math.min(this.state.width, this.state.height) * 0.07);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    drawStamp(ctx, 'compass', s, '#3a2e22');
    ctx.fillStyle = '#3a2e22';
    ctx.font = `${s * 0.14}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -s * 0.6);
    ctx.restore();
  }

  _drawPath(ctx, o) {
    if (o.points.length < 2) return;
    ctx.save();
    if (o.type === 'river') {
      ctx.strokeStyle = '#3d6fa3';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const n = o.points.length;
      for (let i = 0; i < n - 1; i++) {
        const w = (o.width || 8) * (0.4 + (i / (n - 1)) * 0.8);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(o.points[i].x, o.points[i].y);
        ctx.lineTo(o.points[i + 1].x, o.points[i + 1].y);
        ctx.stroke();
      }
    } else if (o.type === 'road') {
      ctx.strokeStyle = '#7a5a3a';
      ctx.lineWidth = o.width || 5;
      ctx.setLineDash([o.width * 1.6 || 9, o.width * 1.4 || 7]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      o.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    } else if (o.type === 'border') {
      ctx.strokeStyle = o.color || '#8a3b3b';
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 8]);
      ctx.beginPath();
      o.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (o.closed) ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawIcon(ctx, o) {
    drawIconGlyph(ctx, o.subtype, o.x, o.y, o.size);
    if (o.label) {
      ctx.save();
      ctx.font = `${o.size * 0.32}px Georgia, serif`;
      ctx.fillStyle = '#2b2118';
      ctx.textAlign = 'center';
      ctx.fillText(o.label, o.x, o.y + o.size * 0.55 + o.size * 0.28);
      ctx.restore();
    }
  }

  _drawLabel(ctx, o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rotation || 0);
    const styleMap = {
      title: { font: `italic ${o.size}px Georgia, serif`, color: '#2b2118', spacing: true },
      city: { font: `bold ${o.size}px Georgia, serif`, color: '#2b2118' },
      water: { font: `italic ${o.size}px Georgia, serif`, color: '#274a6b' },
      note: { font: `${o.size}px Georgia, serif`, color: '#4a3a2a' },
    };
    const s = styleMap[o.style] || styleMap.note;
    ctx.font = s.font;
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (s.spacing) {
      const letters = o.text.split('');
      const widths = letters.map((c) => ctx.measureText(c).width + o.size * 0.15);
      const total = widths.reduce((a, b) => a + b, 0);
      let x = -total / 2;
      for (let i = 0; i < letters.length; i++) {
        ctx.fillText(letters[i], x + widths[i] / 2, 0);
        x += widths[i];
      }
    } else {
      ctx.fillText(o.text, 0, 0);
    }
    ctx.restore();
  }

  _drawSelection(ctx, o) {
    if (!o) return;
    ctx.save();
    ctx.strokeStyle = '#d9782b';
    ctx.lineWidth = 2 / this.zoom;
    ctx.setLineDash([6 / this.zoom, 4 / this.zoom]);
    if (o.type === 'icon') {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (o.type === 'label') {
      const w = ctx.measureText ? o.size * (o.text.length * 0.55) : 60;
      ctx.strokeRect(o.x - w / 2, o.y - o.size / 2, w, o.size);
    } else if (o.points) {
      for (const p of o.points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 / this.zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#d9782b';
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- save / load / export ----------

  toJSON() {
    return JSON.stringify({
      version: this.state.version,
      name: this.state.name,
      width: this.state.width,
      height: this.state.height,
      terrain: this.worldCanvas.toDataURL('image/png'),
      objects: this.state.objects,
      settings: this.state.settings,
      nextId: this.state.nextId,
    });
  }

  loadJSON(json, cb) {
    const data = JSON.parse(json);
    this.state = {
      version: data.version || 1,
      name: data.name || 'Untitled Map',
      width: data.width,
      height: data.height,
      objects: data.objects || [],
      settings: Object.assign({ showGrid: false, showFrame: true, compass: null }, data.settings || {}),
      nextId: data.nextId || 1,
    };
    this.worldCanvas.width = data.width;
    this.worldCanvas.height = data.height;
    this.decoGrid.clear();
    for (const o of this.state.objects) if (o.type === 'deco') this._gridAdd(o);
    this.undoStack = [];
    this.redoStack = [];
    this.selectedId = null;
    const img = new Image();
    img.onload = () => {
      this.worldCtx.drawImage(img, 0, 0);
      this.fitToView();
      this._notifyHistory();
      this._notifySelection();
      this._notifyState();
      this.requestRender();
      if (cb) cb();
    };
    img.src = data.terrain;
  }

  exportPNG() {
    const canvas = document.createElement('canvas');
    canvas.width = this.state.width;
    canvas.height = this.state.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.worldCanvas, 0, 0);
    for (const o of this.state.objects) if (o.type === 'deco') drawDeco(ctx, o.decoType, o.x, o.y, o.size, o.rot);
    for (const o of this.state.objects) if (o.type === 'border') this._drawPath(ctx, o);
    for (const o of this.state.objects) if (o.type === 'road') this._drawPath(ctx, o);
    for (const o of this.state.objects) if (o.type === 'river') this._drawPath(ctx, o);
    for (const o of this.state.objects) if (o.type === 'icon') this._drawIcon(ctx, o);
    for (const o of this.state.objects) if (o.type === 'label') this._drawLabel(ctx, o);
    if (this.state.settings.showFrame) this._drawFrame(ctx);
    if (this.state.settings.compass) this._drawCompass(ctx, this.state.settings.compass);
    return canvas.toDataURL('image/png');
  }
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function distToSegment(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx, cy = a.y + t * dy;
  return Math.hypot(px - cx, py - cy);
}
