// Wires the DOM (toolbar, panels, dialogs) to the MapApp + Tools engine.
// Waits on every brush-pack "ready" promise so the first render never races
// the stamp images (all embedded data: URIs, so this resolves near-instantly).

Promise.all([stampsReady, janssoniusReady]).then(function () {
  const viewCanvas = document.getElementById('view-canvas');
  const app = new MapApp(viewCanvas);
  window.__mapApp = app; // handy for console debugging

  let currentTool = 'brush';
  let currentTerrain = 'plains';
  let currentIcon = 'castle';
  let currentLabelStyle = 'city';
  let compassMode = false;

  const ui = {
    getTool: () => currentTool,
    getTerrain: () => currentTerrain,
    getBrushSize: () => parseInt(brushSizeInput.value, 10),
    getIcon: () => currentIcon,
    getLabelStyle: () => currentLabelStyle,
    getBorderColor: () => borderColorInput.value,
    isSetCompass: () => compassMode,
    endCompassMode: () => { compassMode = false; compassBtn.classList.remove('active'); },
    editLabelText: (obj, isNew) => openLabelEditor(obj, isNew),
  };

  const tools = new Tools(app, viewCanvas, ui);

  // ---------- resize ----------
  function resize() { app.resize(); }
  window.addEventListener('resize', resize);
  requestAnimationFrame(resize);

  // ---------- tool tabs / panels ----------
  const tabs = Array.from(document.querySelectorAll('.tool-tab'));
  const panels = {
    terrain: document.getElementById('panel-terrain'),
    water: document.getElementById('panel-water'),
    icons: document.getElementById('panel-icons'),
    labels: document.getElementById('panel-labels'),
    select: document.getElementById('panel-select'),
  };
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      Object.entries(panels).forEach(([key, el]) => el.classList.toggle('hidden', key !== tab.dataset.panel));
      const panelKey = tab.dataset.panel;
      if (panelKey === 'select') {
        currentTool = 'select';
      } else if (panelKey === 'terrain') {
        currentTool = 'brush';
        highlightTerrainSwatch();
      } else if (panelKey === 'water') {
        const active = panels.water.querySelector('.tool-choice.active') || panels.water.querySelector('.tool-choice');
        if (active) { currentTool = active.dataset.tool; active.classList.add('active'); }
      } else if (panelKey === 'icons') {
        currentTool = 'icon';
      } else if (panelKey === 'labels') {
        const active = panels.labels.querySelector('.tool-choice.active');
        if (active) { currentTool = 'label'; currentLabelStyle = active.dataset.labelStyle; }
      }
    });
  });

  // ---------- terrain swatches ----------
  const terrainSwatchContainer = document.getElementById('terrain-swatches');
  const eraserBtn = document.getElementById('btn-eraser');
  function buildTerrainSwatches() {
    TERRAIN_KEYS.filter((k) => k !== 'blank').forEach((key) => {
      const t = TERRAIN_TYPES[key];
      const btn = document.createElement('button');
      btn.className = 'swatch';
      btn.dataset.key = key;
      btn.innerHTML = `<span class="swatch-color" style="background:${t.color}"></span>${t.label}`;
      btn.addEventListener('click', () => {
        currentTerrain = key;
        currentTool = 'brush';
        highlightTerrainSwatch();
      });
      terrainSwatchContainer.appendChild(btn);
    });
  }
  function highlightTerrainSwatch() {
    Array.from(terrainSwatchContainer.children).forEach((el) => el.classList.toggle('active', el.dataset.key === currentTerrain && currentTool === 'brush'));
    eraserBtn.classList.toggle('active', currentTool === 'eraser');
  }
  eraserBtn.addEventListener('click', () => { currentTool = 'eraser'; highlightTerrainSwatch(); });
  buildTerrainSwatches();
  highlightTerrainSwatch();

  const brushSizeInput = document.getElementById('brush-size');

  // ---------- water & roads panel ----------
  const waterButtons = Array.from(document.querySelectorAll('#panel-water .tool-choice'));
  waterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTool = btn.dataset.tool;
      waterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });
  const borderColorInput = document.getElementById('border-color');

  // ---------- icons panel ----------
  const iconSwatchContainer = document.getElementById('icon-swatches');
  function buildIconSwatches() {
    ICON_KEYS.forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'swatch';
      btn.dataset.key = key;
      const canvas = document.createElement('canvas');
      canvas.width = 26; canvas.height = 26;
      canvas.className = 'swatch-icon-canvas';
      const ctx = canvas.getContext('2d');
      drawIconGlyph(ctx, key, 13, 13, 20);
      btn.appendChild(canvas);
      const span = document.createElement('span');
      span.textContent = ICON_DEFS[key].label;
      btn.appendChild(span);
      btn.addEventListener('click', () => {
        currentIcon = key;
        currentTool = 'icon';
        Array.from(iconSwatchContainer.children).forEach((el) => el.classList.toggle('active', el === btn));
      });
      iconSwatchContainer.appendChild(btn);
    });
  }
  buildIconSwatches();

  // ---------- labels panel ----------
  const labelButtons = Array.from(document.querySelectorAll('#panel-labels .tool-choice'));
  labelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTool = 'label';
      currentLabelStyle = btn.dataset.labelStyle;
      labelButtons.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });

  // ---------- label inline editor ----------
  const labelEditor = document.getElementById('label-editor');
  const labelEditorInput = document.getElementById('label-editor-input');
  let editingLabel = null;
  let editingIsNew = false;
  function openLabelEditor(obj, isNew) {
    editingLabel = obj;
    editingIsNew = isNew;
    const p = app.worldToScreen(obj.x, obj.y);
    labelEditor.style.left = p.x + 'px';
    labelEditor.style.top = (p.y - 14) + 'px';
    labelEditor.style.transform = 'translate(-50%,-50%)';
    labelEditorInput.value = obj.text;
    labelEditor.classList.remove('hidden');
    // Deferred: a same-tick focus() loses to the browser's default
    // mousedown-focus behavior, which would refocus the canvas and
    // immediately blur (and close) the editor we just opened.
    setTimeout(() => { labelEditorInput.focus(); labelEditorInput.select(); }, 0);
  }
  function closeLabelEditor(commit) {
    if (!editingLabel) return;
    const before = { text: editingLabel.text };
    const val = labelEditorInput.value.trim();
    if (commit && val) {
      editingLabel.text = val;
      if (!editingIsNew) app.commitObjectAction([{ op: 'update', id: editingLabel.id, before, after: { text: val } }]);
      else app.commitObjectAction([{ op: 'update', id: editingLabel.id, before: { text: 'New Label' }, after: { text: val } }]);
    } else if (editingIsNew) {
      app.removeObject(editingLabel.id);
    }
    editingLabel = null;
    labelEditor.classList.add('hidden');
    app.requestRender();
    renderInspector();
  }
  labelEditorInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') closeLabelEditor(true);
    if (e.key === 'Escape') closeLabelEditor(false);
  });
  labelEditorInput.addEventListener('blur', () => closeLabelEditor(true));

  // ---------- inspector ----------
  const inspector = document.getElementById('inspector');
  function renderInspector() {
    const obj = app.selectedId ? app.getObject(app.selectedId) : null;
    inspector.innerHTML = '';
    if (!obj) { inspector.innerHTML = '<div class="empty">Nothing selected.</div>'; return; }

    if (obj.type === 'icon') {
      addField('Name label', textInput(obj.label || '', (v) => app.updateObject(obj.id, { label: obj.label }, { label: v })));
      addField('Size', rangeInput(10, 90, obj.size, (v) => app.updateObject(obj.id, { size: obj.size }, { size: v })));
    } else if (obj.type === 'label') {
      addField('Text', textInput(obj.text, (v) => { if (v.trim()) app.updateObject(obj.id, { text: obj.text }, { text: v.trim() }); }));
      addField('Size', rangeInput(10, 80, obj.size, (v) => app.updateObject(obj.id, { size: obj.size }, { size: v })));
    } else if (obj.type === 'river' || obj.type === 'road') {
      addField('Width', rangeInput(2, 30, obj.width, (v) => app.updateObject(obj.id, { width: obj.width }, { width: v })));
    } else if (obj.type === 'border') {
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = '<label>Color</label>';
      const input = document.createElement('input');
      input.type = 'color';
      input.value = obj.color;
      input.addEventListener('input', () => app.updateObject(obj.id, { color: obj.color }, { color: input.value }));
      field.appendChild(input);
      inspector.appendChild(field);
    }

    const del = document.createElement('button');
    del.className = 'danger wide-btn';
    del.textContent = 'Delete';
    del.addEventListener('click', () => { app.removeObject(obj.id); app.requestRender(); });
    inspector.appendChild(del);

    function addField(labelText, inputEl) {
      const field = document.createElement('div');
      field.className = 'field';
      const label = document.createElement('label');
      label.textContent = labelText;
      field.appendChild(label);
      field.appendChild(inputEl);
      inspector.appendChild(field);
    }
    function textInput(value, onChange) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = value;
      input.addEventListener('change', () => { onChange(input.value); app.requestRender(); });
      return input;
    }
    function rangeInput(min, max, value, onChange) {
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min; input.max = max; input.value = value;
      input.addEventListener('input', () => { onChange(parseFloat(input.value)); app.requestRender(); });
      input.addEventListener('change', () => { onChange(parseFloat(input.value)); app.requestRender(); });
      return input;
    }
  }
  app.onSelectionChange = renderInspector;
  app.onStateChange = () => { renderInspector(); };
  renderInspector();

  // ---------- undo/redo ----------
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  app.onHistoryChange = (canUndo, canRedo) => { undoBtn.disabled = !canUndo; redoBtn.disabled = !canRedo; };
  undoBtn.addEventListener('click', () => app.undo());
  redoBtn.addEventListener('click', () => app.redo());

  // ---------- zoom ----------
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    app.zoomBy(1.2, { x: viewCanvas.clientWidth / 2, y: viewCanvas.clientHeight / 2 });
    app.requestRender();
  });
  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    app.zoomBy(0.8, { x: viewCanvas.clientWidth / 2, y: viewCanvas.clientHeight / 2 });
    app.requestRender();
  });
  document.getElementById('btn-zoom-fit').addEventListener('click', () => { app.fitToView(); app.requestRender(); });

  // ---------- grid / frame / compass ----------
  const gridChk = document.getElementById('chk-grid');
  const frameChk = document.getElementById('chk-frame');
  gridChk.addEventListener('change', () => { app.state.settings.showGrid = gridChk.checked; app.requestRender(); });
  frameChk.addEventListener('change', () => { app.state.settings.showFrame = frameChk.checked; app.requestRender(); });
  const compassBtn = document.getElementById('btn-compass');
  compassBtn.addEventListener('click', () => {
    compassMode = !compassMode;
    compassBtn.classList.toggle('active', compassMode);
  });

  // ---------- new map modal ----------
  const modalOverlay = document.getElementById('modal-overlay');
  const mapNameDisplay = document.getElementById('map-name-display');
  document.getElementById('btn-new').addEventListener('click', () => modalOverlay.classList.remove('hidden'));
  document.getElementById('btn-new-cancel').addEventListener('click', () => modalOverlay.classList.add('hidden'));
  document.getElementById('btn-new-create').addEventListener('click', () => {
    const name = document.getElementById('new-map-name').value.trim() || 'Untitled Map';
    const size = document.querySelector('input[name="size"]:checked').value;
    app.newMap(name, size);
    mapNameDisplay.textContent = name;
    gridChk.checked = app.state.settings.showGrid;
    frameChk.checked = app.state.settings.showFrame;
    modalOverlay.classList.add('hidden');
    app.resize();
  });

  // ---------- save / load / export ----------
  function download(filename, dataUrlOrText, isText) {
    const a = document.createElement('a');
    a.href = isText ? URL.createObjectURL(new Blob([dataUrlOrText], { type: 'application/json' })) : dataUrlOrText;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  document.getElementById('btn-save').addEventListener('click', () => {
    const safe = (app.state.name || 'map').replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'map';
    download(`${safe}.fantasymap.json`, app.toJSON(), true);
  });
  const fileInput = document.getElementById('file-input');
  document.getElementById('btn-load').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      app.loadJSON(reader.result, () => {
        mapNameDisplay.textContent = app.state.name;
        gridChk.checked = app.state.settings.showGrid;
        frameChk.checked = app.state.settings.showFrame;
      });
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
  document.getElementById('btn-export').addEventListener('click', () => {
    const safe = (app.state.name || 'map').replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'map';
    download(`${safe}.png`, app.exportPNG(), false);
  });

  mapNameDisplay.textContent = app.state.name;
});
