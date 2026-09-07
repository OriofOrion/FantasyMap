// Pointer-driven tool state machine: painting terrain, drawing paths
// (rivers/roads/borders), placing icons & labels, and select/move/delete.

class Tools {
  constructor(app, canvas, ui) {
    this.app = app;
    this.canvas = canvas;
    this.ui = ui; // { getTool, getTerrain, getBrushSize, getIcon, getLabelStyle, getBorderColor, editLabelText, isSetCompass, onCompassPlaced, endCompassMode }

    this.painting = false;
    this.lastPaintPoint = null;
    this.draftPath = null; // {type, points}
    this.dragging = null; // {kind:'object'|'point', obj, pointIndex, startX,startY, before}
    this.spacePan = false;
    this.middlePan = false;
    this.lastPanPos = null;

    this._bind();
  }

  _bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this.onDown(e));
    c.addEventListener('pointermove', (e) => this.onMove(e));
    window.addEventListener('pointerup', (e) => this.onUp(e));
    c.addEventListener('dblclick', (e) => this.onDblClick(e));
    c.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); this.finishDraftPath(); });
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => { if (e.code === 'Space') this.spacePan = false; });
  }

  _screenPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  onKeyDown(e) {
    if (e.code === 'Space') { this.spacePan = true; e.preventDefault(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.app.selectedId && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      this.app.removeObject(this.app.selectedId);
      this.app.requestRender();
    }
    if (e.key === 'Enter') this.finishDraftPath();
    if (e.key === 'Escape') this.cancelDraftPath();
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) this.app.redo(); else this.app.undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this.app.redo(); }
  }

  onWheel(e) {
    e.preventDefault();
    const p = this._screenPoint(e);
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.app.zoomBy(factor, p);
    this.app.requestRender();
  }

  onDown(e) {
    const p = this._screenPoint(e);
    if (e.button === 1 || this.spacePan) {
      this.middlePan = true;
      this.lastPanPos = p;
      return;
    }
    const world = this.app.screenToWorld(p.x, p.y);
    const tool = this.ui.getTool();

    if (this.ui.isSetCompass()) {
      this.app.state.settings.compass = { x: world.x, y: world.y };
      this.ui.endCompassMode();
      this.app.requestRender();
      this.app._notifyState();
      return;
    }

    if (tool === 'brush' || tool === 'eraser') {
      this.painting = true;
      this.app.beginTerrainStroke();
      const key = tool === 'eraser' ? 'blank' : this.ui.getTerrain();
      this.app.paintDab(world.x, world.y, this.ui.getBrushSize(), key);
      this.lastPaintPoint = world;
      this.app.requestRender();
      return;
    }

    if (tool === 'river' || tool === 'road' || tool === 'border') {
      if (!this.draftPath || this.draftPath.type !== tool) {
        this.draftPath = { type: tool, points: [] };
      }
      this.draftPath.points.push({ x: world.x, y: world.y });
      this.app.requestRender();
      this._renderDraft();
      return;
    }

    if (tool === 'icon') {
      const obj = {
        id: this.app.nextId(), type: 'icon', subtype: this.ui.getIcon(),
        x: world.x, y: world.y, size: 34, label: '',
      };
      this.app.addObject(obj);
      this.app.selectedId = obj.id;
      this.app._notifySelection();
      this.app.requestRender();
      return;
    }

    if (tool === 'label') {
      const style = this.ui.getLabelStyle();
      const sizeMap = { title: 44, city: 24, water: 22, note: 16 };
      const obj = {
        id: this.app.nextId(), type: 'label', text: 'New Label',
        x: world.x, y: world.y, style, size: sizeMap[style] || 20, rotation: 0,
      };
      this.app.addObject(obj);
      this.app.selectedId = obj.id;
      this.app._notifySelection();
      this.app.requestRender();
      this.ui.editLabelText(obj, true);
      return;
    }

    if (tool === 'select') {
      const hit = this.app.hitTest(world.x, world.y);
      if (hit) {
        this.app.selectedId = hit.id;
        this.app._notifySelection();
        if (hit.points) {
          const idx = hit.points.findIndex((pt) => Math.hypot(pt.x - world.x, pt.y - world.y) <= 8 / this.app.zoom);
          if (idx >= 0) {
            this.dragging = { kind: 'point', obj: hit, pointIndex: idx, before: JSON.parse(JSON.stringify(hit.points)) };
          } else {
            this.dragging = { kind: 'path', obj: hit, startWorld: world, before: JSON.parse(JSON.stringify(hit.points)) };
          }
        } else {
          this.dragging = { kind: 'object', obj: hit, before: { x: hit.x, y: hit.y } };
        }
      } else {
        this.app.selectedId = null;
        this.app._notifySelection();
      }
      this.app.requestRender();
      return;
    }
  }

  onMove(e) {
    const p = this._screenPoint(e);
    if (this.middlePan && this.lastPanPos) {
      this.app.pan(p.x - this.lastPanPos.x, p.y - this.lastPanPos.y);
      this.lastPanPos = p;
      this.app.requestRender();
      return;
    }
    const world = this.app.screenToWorld(p.x, p.y);

    if (this.painting) {
      const tool = this.ui.getTool();
      const key = tool === 'eraser' ? 'blank' : this.ui.getTerrain();
      const radius = this.ui.getBrushSize();
      if (this.lastPaintPoint) {
        const dist = Math.hypot(world.x - this.lastPaintPoint.x, world.y - this.lastPaintPoint.y);
        const step = Math.max(4, radius * 0.35);
        const n = Math.floor(dist / step);
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          this.app.paintDab(
            this.lastPaintPoint.x + (world.x - this.lastPaintPoint.x) * t,
            this.lastPaintPoint.y + (world.y - this.lastPaintPoint.y) * t,
            radius, key
          );
        }
      }
      this.lastPaintPoint = world;
      this.app.requestRender();
      return;
    }

    if (this.dragging) {
      if (this.dragging.kind === 'object') {
        this.dragging.obj.x = world.x;
        this.dragging.obj.y = world.y;
      } else if (this.dragging.kind === 'point') {
        this.dragging.obj.points[this.dragging.pointIndex] = { x: world.x, y: world.y };
      } else if (this.dragging.kind === 'path') {
        const dx = world.x - this.dragging.startWorld.x;
        const dy = world.y - this.dragging.startWorld.y;
        this.dragging.obj.points = this.dragging.before.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
      }
      this.app.requestRender();
      return;
    }

    if (this.draftPath) {
      this._hoverPoint = world;
      this.app.requestRender();
      this._renderDraft();
    }
  }

  onUp() {
    this.middlePan = false;
    if (this.painting) {
      this.painting = false;
      this.lastPaintPoint = null;
      this.app.endTerrainStroke();
    }
    if (this.dragging) {
      const d = this.dragging;
      if (d.kind === 'object') {
        this.app.commitObjectAction([{ op: 'update', id: d.obj.id, before: d.before, after: { x: d.obj.x, y: d.obj.y } }]);
      } else {
        this.app.commitObjectAction([{ op: 'update', id: d.obj.id, before: { points: d.before }, after: { points: d.obj.points } }]);
      }
      this.dragging = null;
    }
  }

  onDblClick(e) {
    const p = this._screenPoint(e);
    const world = this.app.screenToWorld(p.x, p.y);
    if (this.draftPath) { this.finishDraftPath(); return; }
    const hit = this.app.hitTest(world.x, world.y);
    if (hit && hit.type === 'label') this.ui.editLabelText(hit, false);
  }

  finishDraftPath() {
    if (!this.draftPath || this.draftPath.points.length < 2) { this.draftPath = null; this.app.requestRender(); return; }
    const t = this.draftPath.type;
    const obj = { id: this.app.nextId(), type: t, points: this.draftPath.points };
    if (t === 'river') obj.width = 10;
    if (t === 'road') obj.width = 5;
    if (t === 'border') { obj.color = this.ui.getBorderColor(); obj.closed = false; }
    this.app.addObject(obj);
    this.draftPath = null;
    this.app.selectedId = obj.id;
    this.app._notifySelection();
    this.app.requestRender();
  }

  cancelDraftPath() {
    this.draftPath = null;
    this.app.requestRender();
  }

  _renderDraft() {
    if (!this.draftPath) return;
    const ctx = this.app.viewCtx;
    ctx.save();
    ctx.translate(this.app.panX, this.app.panY);
    ctx.scale(this.app.zoom, this.app.zoom);
    ctx.strokeStyle = this.draftPath.type === 'river' ? '#3d6fa3' : this.draftPath.type === 'road' ? '#7a5a3a' : '#8a3b3b';
    ctx.lineWidth = 3 / this.app.zoom;
    ctx.setLineDash([8 / this.app.zoom, 5 / this.app.zoom]);
    ctx.beginPath();
    this.draftPath.points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    if (this._hoverPoint) ctx.lineTo(this._hoverPoint.x, this._hoverPoint.y);
    ctx.stroke();
    for (const pt of this.draftPath.points) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4 / this.app.zoom, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    ctx.restore();
  }
}
