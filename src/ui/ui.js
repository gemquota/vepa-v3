// VEPA v3 — Main UI Builder
// Assembles all UI panels: law toggles, DNA sliders, environment, presets, HUD.

import {
  LAW_CATEGORIES, LAW_CATEGORY_COLORS, LAW_CATEGORY_RANGES,
  LAW_INDEXES, MULTI_STATE_LAWS, DNA_GROUPS, DNA_RANGES,
  DEFAULT_SPECIES,
} from '../constants.js';
import HUD from './hud.js';

class UI {
  constructor(engine) {
    this.engine = engine;
    this.container = document.getElementById('sidebar');
    this.hudContainer = document.getElementById('hud');
    this.panels = {};
    this._speciesLaws = {};
    this._speciesParams = {};
  }

  init() {
    this.hud = new HUD(this.hudContainer);
    this._buildSidebar();
    this._setupEventListeners();
  }

  _buildSidebar() {
    this._buildLawPanel();
    this._buildSpeciesPanel();
    this._buildEnvironmentPanel();
    this._buildPresetPanel();
    this._buildInfoPanel();
  }

  _buildLawPanel() {
    const panel = this._createPanel('Laws', 'law-panel', true);
    const categories = [
      { name: 'Physics', cat: LAW_CATEGORIES.PHYSICS, color: '#4488ff' },
      { name: 'Biology', cat: LAW_CATEGORIES.BIOLOGY, color: '#44cc44' },
      { name: 'Chemistry', cat: LAW_CATEGORIES.CHEMISTRY, color: '#cc44cc' },
      { name: 'Thermo', cat: LAW_CATEGORIES.THERMODYNAMICS, color: '#ff8844' },
      { name: 'Meta', cat: LAW_CATEGORIES.METAPHYSICS, color: '#ff4444' },
    ];

    for (const cat of categories) {
      const section = document.createElement('div');
      section.className = 'law-category';
      section.style.marginBottom = '8px';

      const header = document.createElement('div');
      header.className = 'law-category-header';
      header.style.cssText = `color:${cat.color};font:bold 11px/1.4 monospace;cursor:pointer;margin-bottom:4px;`;
      header.textContent = cat.name;
      section.appendChild(header);

      const body = document.createElement('div');
      body.className = 'law-category-body';
      body.style.display = 'none';

      const range = LAW_CATEGORY_RANGES[cat.cat];
      if (range) {
        const [start, count] = range;
        for (let i = start; i < start + count && i < 64; i++) {
          const toggle = this._createLawToggle(i, cat.color);
          body.appendChild(toggle);
        }
      }

      header.onclick = () => {
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      };

      section.appendChild(body);
      panel.content.appendChild(section);
    }
  }

  _createLawToggle(index, color) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:6px;font:11px/1.4 monospace;cursor:pointer;padding:2px 0;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.engine.lawManager.isLaw(index);
    checkbox.style.accentColor = color;

    const nameSpan = document.createElement('span');
    const lawName = Object.keys(LAW_INDEXES).find(k => LAW_INDEXES[k] === index) || `L${index}`;
    nameSpan.textContent = lawName.toLowerCase();

    // Multi-state selector
    const msl = MULTI_STATE_LAWS.find(m => m.index === index);
    let stateSel = null;
    if (msl) {
      stateSel = document.createElement('select');
      stateSel.style.cssText = 'font:10px monospace;margin-left:auto;';
      for (let s = 0; s <= msl.maxState; s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = msl.labels[s] || String(s);
        opt.selected = s === this.engine.lawManager.getLawState(index);
        stateSel.appendChild(opt);
      }
      stateSel.onchange = () => {
        this.engine.lawManager.setLawState(index, Number(stateSel.value));
        checkbox.checked = Number(stateSel.value) > 0;
        this._onLawChanged();
      };
    }

    checkbox.onchange = () => {
      if (msl) {
        this.engine.lawManager.setLaw(index, checkbox.checked);
        stateSel.value = checkbox.checked ? '1' : '0';
      } else {
        this.engine.lawManager.setLaw(index, checkbox.checked);
      }
      this._onLawChanged();
    };

    label.appendChild(checkbox);
    label.appendChild(nameSpan);
    if (stateSel) label.appendChild(stateSel);
    return label;
  }

  _buildSpeciesPanel() {
    const panel = this._createPanel('Species DNA', 'species-panel', false);
    this._speciesContainer = panel.content;
    this._rebuildSpeciesUI();
  }

  _rebuildSpeciesUI() {
    this._speciesContainer.innerHTML = '';
    const speciesList = this.engine.speciesManager.getAllSpecies();

    if (speciesList.length === 0) {
      this._speciesContainer.textContent = 'No species loaded';
      return;
    }

    for (const species of speciesList) {
      const section = document.createElement('div');
      section.style.marginBottom = '12px';

      const header = document.createElement('div');
      header.style.cssText = `color:#88aacc;font:bold 11px monospace;margin-bottom:4px;display:flex;align-items:center;gap:6px;`;
      const colorDot = document.createElement('span');
      const col = species.color || { r: 0.5, g: 0.5, b: 0.5 };
      colorDot.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;background:rgb(${col.r*255|0},${col.g*255|0},${col.b*255|0});`;
      header.appendChild(colorDot);
      header.append(species.name + ' (#' + species.id + ')');
      section.appendChild(header);

      // ── Species Law Overrides ──
      const lawOverrideHeader = document.createElement('div');
      lawOverrideHeader.style.cssText = 'color:#ff8844;font:9px monospace;cursor:pointer;margin:2px 0;';
      lawOverrideHeader.textContent = 'Law Overrides [+]';
      section.appendChild(lawOverrideHeader);

      const lawOverrideBody = document.createElement('div');
      lawOverrideBody.style.display = 'none';
      lawOverrideBody.style.cssText = 'padding-left:4px;margin-bottom:6px;';

      // Show key law toggles for this species
      const keyLaws = ['GRAV','DRAG','COLL','PREDATION','LIFE','AFFINITY','GLOW','BOND'];
      for (const lawName of keyLaws) {
        const idx = LAW_INDEXES[lawName];
        if (idx === undefined) continue;
        const toggleDiv = document.createElement('label');
        toggleDiv.style.cssText = 'display:flex;align-items:center;gap:4px;font:9px monospace;cursor:pointer;padding:1px 0;';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = this._speciesLawOverride(species.id, idx, true);
        cb.style.accentColor = '#ff8844';
        cb.onchange = () => {
          // Store override in a map — speciesLaws[speciesId][lawIndex] = boolean
          if (!this._speciesLaws) this._speciesLaws = {};
          if (!this._speciesLaws[species.id]) this._speciesLaws[species.id] = {};
          this._speciesLaws[species.id][idx] = cb.checked;
          this.engine.bus.emit('species:lawChanged', { speciesId: species.id, lawIndex: idx, enabled: cb.checked });
        };

        const lbl = document.createElement('span');
        lbl.textContent = lawName.toLowerCase();
        toggleDiv.appendChild(cb);
        toggleDiv.appendChild(lbl);
        lawOverrideBody.appendChild(toggleDiv);
      }

      lawOverrideHeader.onclick = () => {
        const isOpen = lawOverrideBody.style.display !== 'none';
        lawOverrideBody.style.display = isOpen ? 'none' : 'block';
        lawOverrideHeader.textContent = 'Law Overrides [' + (isOpen ? '+' : '−') + ']';
      };

      section.appendChild(lawOverrideBody);

      // ── Species Parameters (extra per-species params beyond DNA) ──
      const speciesParamHeader = document.createElement('div');
      speciesParamHeader.style.cssText = 'color:#44cc44;font:9px monospace;cursor:pointer;margin:2px 0;';
      speciesParamHeader.textContent = 'Species Params [+]';
      section.appendChild(speciesParamHeader);

      const speciesParamBody = document.createElement('div');
      speciesParamBody.style.display = 'none';
      speciesParamBody.style.cssText = 'padding-left:4px;margin-bottom:6px;';

      // Species-level parameters (outside DNA)
      const speciesParams = [
        { key: 'populationCap', label: 'Pop Cap', min: 10, max: 5000, step: 10, default: 500 },
        { key: 'spawnRate', label: 'Spawn Rate', min: 0, max: 10, step: 0.1, default: 1 },
        { key: 'colorShift', label: 'Color Shift', min: -180, max: 180, step: 5, default: 0 },
        { key: 'aggroRange', label: 'Aggro Range', min: 0, max: 500, step: 10, default: 100 },
      ];

      for (const p of speciesParams) {
        if (!this._speciesParams) this._speciesParams = {};
        if (!this._speciesParams[species.id]) this._speciesParams[species.id] = {};
        const val = this._speciesParams[species.id][p.key] ?? p.default;

        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:4px;font:9px monospace;padding:1px 0;';

        const lbl = document.createElement('span');
        lbl.style.cssText = 'width:55px;overflow:hidden;text-overflow:ellipsis;color:#667788;';
        lbl.textContent = p.label;
        div.appendChild(lbl);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = p.min;
        slider.max = p.max;
        slider.step = p.step;
        slider.value = val;
        slider.style.cssText = 'flex:1;height:2px;accent-color:#44cc44;';

        const display = document.createElement('span');
        display.style.cssText = 'width:30px;text-align:right;color:#8899aa;';
        display.textContent = val;

        slider.oninput = () => {
          const v = Number(slider.value);
          this._speciesParams[species.id][p.key] = v;
          display.textContent = v;
          this.engine.bus.emit('species:paramChanged', { speciesId: species.id, key: p.key, value: v });
        };

        div.appendChild(slider);
        div.appendChild(display);
        speciesParamBody.appendChild(div);
      }

      speciesParamHeader.onclick = () => {
        const isOpen = speciesParamBody.style.display !== 'none';
        speciesParamBody.style.display = isOpen ? 'none' : 'block';
        speciesParamHeader.textContent = 'Species Params [' + (isOpen ? '+' : '−') + ']';
      };

      section.appendChild(speciesParamBody);

      // ── DNA Parameters ──
      for (const group of DNA_GROUPS) {
        const groupDiv = document.createElement('div');
        groupDiv.style.cssText = 'padding-left:4px;margin-bottom:4px;';

        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = 'color:#667788;font:9px monospace;cursor:pointer;';
        groupHeader.textContent = group.name + ' [+]';
        groupDiv.appendChild(groupHeader);

        const groupBody = document.createElement('div');
        groupBody.style.display = 'none';

        for (const idx of group.indexes) {
          const range = DNA_RANGES[idx];
          if (!range) continue;
          const slider = this._createDnaSlider(species.id, idx, range, species.dna[idx]);
          groupBody.appendChild(slider);
        }

        groupHeader.onclick = () => {
          const isOpen = groupBody.style.display !== 'none';
          groupBody.style.display = isOpen ? 'none' : 'block';
          groupHeader.textContent = group.name + ' [' + (isOpen ? '+' : '−') + ']';
        };

        groupDiv.appendChild(groupBody);
        section.appendChild(groupDiv);
      }

      this._speciesContainer.appendChild(section);
    }
  }

  /** Check species law override (falls back to global law state) */
  _speciesLawOverride(speciesId, lawIndex, globalDefault) {
    if (this._speciesLaws && this._speciesLaws[speciesId] && this._speciesLaws[speciesId][lawIndex] !== undefined) {
      return this._speciesLaws[speciesId][lawIndex];
    }
    return globalDefault;
  }

  _createDnaSlider(speciesId, paramIdx, range, currentValue) {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;align-items:center;gap:4px;padding:1px 0;font:9px monospace;';

    const label = document.createElement('span');
    label.style.cssText = 'width:70px;overflow:hidden;text-overflow:ellipsis;color:#8899aa;';
    label.textContent = range.label;
    container.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = range.min;
    slider.max = range.max;
    slider.step = range.step;
    slider.value = currentValue !== undefined ? currentValue : range.default;
    slider.style.cssText = 'flex:1;height:3px;accent-color:#4488ff;';
    container.appendChild(slider);

    const valueDisplay = document.createElement('span');
    valueDisplay.style.cssText = 'width:35px;text-align:right;color:#aabbcc;';
    valueDisplay.textContent = (currentValue !== undefined ? currentValue : range.default).toFixed(2);
    container.appendChild(valueDisplay);

    slider.oninput = () => {
      const val = Number(slider.value);
      valueDisplay.textContent = val.toFixed(2);
      this.engine.speciesManager.dnaBuffer.set(speciesId, paramIdx, val);
      this.engine.bus.emit('dna:changed', { speciesId, paramIdx, value: val });
    };

    return container;
  }

  _buildEnvironmentPanel() {
    const panel = this._createPanel('World', 'env-panel', true);

    const addSlider = (label, key, min, max, step, color = '#ff8844') => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:4px;font:10px monospace;padding:2px 0;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'width:55px;overflow:hidden;text-overflow:ellipsis;color:#8899aa;';
      lbl.textContent = label;
      div.appendChild(lbl);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.step = step;
      slider.value = this.engine.config[key] ?? 0;
      slider.style.cssText = `flex:1;height:3px;accent-color:${color};`;

      const display = document.createElement('span');
      display.style.cssText = 'width:30px;text-align:right;color:#aabbcc;';
      // Format display value
      const val = this.engine.config[key] ?? 0;
      display.textContent = val >= 100 ? Math.round(val).toString() : val.toFixed(val < 0.1 ? 4 : 2);

      slider.oninput = () => {
        const v = Number(slider.value);
        this.engine.config[key] = v;
        display.textContent = v >= 100 ? Math.round(v).toString() : v.toFixed(v < 0.1 ? 4 : 2);
        if (key === 'worldSize') this.engine.grid.setWorldSize(v);
        this.engine.bus.emit('world:paramChanged', { key, value: v });
      };

      div.appendChild(slider);
      div.appendChild(display);
      return div;
    };

    // World laws section
    const lawsHeader = document.createElement('div');
    lawsHeader.style.cssText = 'color:#ff8844;font:bold 10px/1.4 monospace;margin:4px 0 2px;';
    lawsHeader.textContent = 'World Laws';
    panel.content.appendChild(lawsHeader);

    panel.content.appendChild(addSlider('Gravity', 'gravityStrength', 0, 200000, 1000, '#4488ff'));
    panel.content.appendChild(addSlider('Drag', 'dragCoeff', 0, 0.1, 0.001, '#4488ff'));
    panel.content.appendChild(addSlider('Collision', 'collisionStiffness', 0, 2, 0.1, '#4488ff'));
    panel.content.appendChild(addSlider('Signal', 'signalScale', 0, 2, 0.1, '#44cc44'));

    const paramsHeader = document.createElement('div');
    paramsHeader.style.cssText = 'color:#ff8844;font:bold 10px/1.4 monospace;margin:6px 0 2px;';
    paramsHeader.textContent = 'World Parameters';
    panel.content.appendChild(paramsHeader);

    panel.content.appendChild(addSlider('Temperature', 'temperature', 0, 1, 0.01, '#ff8844'));
    panel.content.appendChild(addSlider('Pressure', 'pressure', 0, 1, 0.01, '#ff8844'));
    panel.content.appendChild(addSlider('Entropy', 'entropy', 0, 1, 0.01, '#ff4488'));
    panel.content.appendChild(addSlider('Time Scale', 'timeScale', 0, 5, 0.1, '#ff8844'));

    const spawnHeader = document.createElement('div');
    spawnHeader.style.cssText = 'color:#ff8844;font:bold 10px/1.4 monospace;margin:6px 0 2px;';
    spawnHeader.textContent = 'Spawn';
    panel.content.appendChild(spawnHeader);

    panel.content.appendChild(addSlider('Count', 'particleCount', 10, 5000, 10));
    panel.content.appendChild(addSlider('World Size', 'worldSize', 200, 2000, 50));

    // Reset + Camera Reset buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;margin-top:8px;';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Sim';
    resetBtn.style.cssText = 'flex:1;padding:4px;font:11px monospace;background:#442222;color:#ff6666;border:1px solid #664444;border-radius:3px;cursor:pointer;';
    resetBtn.onclick = () => this.engine.bus.emit('ui:reset');

    const camBtn = document.createElement('button');
    camBtn.textContent = 'Reset Camera';
    camBtn.style.cssText = 'flex:1;padding:4px;font:11px monospace;background:#222244;color:#6688ff;border:1px solid #444466;border-radius:3px;cursor:pointer;';
    camBtn.onclick = () => {
      if (this.engine.renderer) {
        this.engine.renderer.camera.x = this.engine.renderer.width / 2;
        this.engine.renderer.camera.y = this.engine.renderer.height / 2;
        this.engine.renderer.camera.zoom = 1;
        this.engine.renderer.camera.rotation = 0;
      }
    };

    btnRow.appendChild(resetBtn);
    btnRow.appendChild(camBtn);
    panel.content.appendChild(btnRow);
  }

  _buildPresetPanel() {
    const panel = this._createPanel('Presets', 'preset-panel', false);

    // Load defaults button
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load Defaults';
    loadBtn.style.cssText = 'width:100%;padding:4px;font:11px monospace;background:#224433;color:#66cc88;border:1px solid #336644;border-radius:3px;cursor:pointer;margin-bottom:4px;';
    loadBtn.onclick = () => {
      this.engine.speciesManager.loadDefaultPreset();
      this._rebuildSpeciesUI();
      this.engine.bus.emit('preset:loaded', 'default');
    };
    panel.content.appendChild(loadBtn);
  }

  _buildInfoPanel() {
    const panel = this._createPanel('Info', 'info-panel', false);
    panel.content.innerHTML = '<div style="font:10px/1.4 monospace;color:#667788">VEPA v3 — Vector Emergent Physics Automata<br><br>Drag to pan | Scroll to zoom<br>Middle-drag to rotate | R to reset camera' +
      '<br><br>Toggle laws to modify particle behavior.<br>World params control global physics.<br>Species params override behavior per species.';
  }

  _createPanel(title, id, startOpen) {
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.cssText = 'margin-bottom:1px;border-bottom:1px solid #1a1a2e;';

    const header = document.createElement('div');
    header.className = 'ui-panel-header';
    header.style.cssText = 'padding:8px 10px;font:bold 12px/1.4 monospace;color:#88aacc;cursor:pointer;background:#0d0d1a;user-select:none;display:flex;justify-content:space-between;';
    header.innerHTML = `${title} <span style="color:#445566">${startOpen ? '−' : '+'}</span>`;
    panel.appendChild(header);

    const content = document.createElement('div');
    content.className = 'ui-panel-content';
    content.style.cssText = `padding:6px 10px;display:${startOpen ? 'block' : 'none'};background:#0a0a14;`;
    panel.appendChild(content);

    header.onclick = () => {
      const isOpen = content.style.display !== 'none';
      content.style.display = isOpen ? 'none' : 'block';
      header.querySelector('span').textContent = isOpen ? '+' : '−';
    };

    this.container.appendChild(panel);
    return { header, content, panel };
  }

  _setupEventListeners() {
    this.engine.bus.on('engine:ready', () => {
      this._onLawChanged();
    });

    this.engine.bus.on('law:changed', () => this._onLawChanged());
    this.engine.bus.on('dna:changed', () => {});
  }

  _onLawChanged() {
    this.engine.bus.emit('ui:lawsChanged', this.engine.lawManager.getFlags());
  }

  updateHUD(stats) {
    this.hud.update(stats);
  }
}

export default UI;
