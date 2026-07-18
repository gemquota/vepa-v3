// VEPA v3 — Main UI Builder
// Assembles all UI panels: law toggles, DNA sliders, environment, presets, HUD.

import {
  LAW_CATEGORIES, LAW_CATEGORY_COLORS, LAW_CATEGORY_RANGES,
  LAW_INDEXES, MULTI_STATE_LAWS, DNA_GROUPS, DNA_RANGES,
  DEFAULT_SPECIES,
  LAW_DISPLAY_NAMES, LAW_TOOLTIPS,
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

    // Add category tab bar
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;';
    const cats = [
      { key: 'all', label: 'All', color: '#888888' },
      { key: 'physics', label: 'Phys', color: '#4488ff' },
      { key: 'biology', label: 'Bio', color: '#44cc44' },
      { key: 'chemistry', label: 'Chem', color: '#cc44cc' },
      { key: 'thermo', label: 'Therm', color: '#ff8844' },
      { key: 'meta', label: 'Meta', color: '#ff4444' },
    ];
    let activeCat = 'all';

    const lawGrid = document.createElement('div');
    lawGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:2px;';

    // Tooltip element (absolute positioned)
    const tooltip = document.createElement('div');
    tooltip.style.cssText = 'display:none;position:fixed;z-index:9999;background:#111122;border:1px solid #334466;border-radius:4px;padding:6px 8px;font:10px/1.4 monospace;color:#aabbcc;max-width:220px;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,0.5);';

    const buildGrid = (category) => {
      lawGrid.innerHTML = '';

      const ranges = category === 'all'
        ? [LAW_CATEGORY_RANGES[0], LAW_CATEGORY_RANGES[1], LAW_CATEGORY_RANGES[2], LAW_CATEGORY_RANGES[3], LAW_CATEGORY_RANGES[4]]
        : [LAW_CATEGORY_RANGES[cats.findIndex(c => c.key === category) - 1]];

      for (const range of ranges) {
        if (!range) continue;
        const [start, count] = range;
        for (let i = start; i < start + count && i < 64; i++) {
          const tile = this._createLawTile(i, tooltip);
          lawGrid.appendChild(tile);
        }
      }
    };

    for (const cat of cats) {
      const tab = document.createElement('button');
      tab.textContent = cat.label;
      tab.dataset.cat = cat.key;
      tab.style.cssText = `padding:2px 6px;font:9px monospace;border:1px solid #334455;border-radius:3px;cursor:pointer;background:${cat.key === activeCat ? cat.color : 'transparent'};color:${cat.key === activeCat ? '#fff' : cat.color};`;
      tab.onclick = () => {
        activeCat = cat.key;
        // Update all tabs
        tabBar.querySelectorAll('button').forEach(t => {
          const c = cats.find(c => c.key === t.dataset.cat);
          t.style.background = t.dataset.cat === activeCat ? c.color : 'transparent';
          t.style.color = t.dataset.cat === activeCat ? '#fff' : c.color;
        });
        buildGrid(activeCat === 'all' ? 'all' : activeCat);
      };
      tabBar.appendChild(tab);
    }

    panel.content.appendChild(tabBar);
    panel.content.appendChild(lawGrid);
    document.body.appendChild(tooltip);
    buildGrid('all');
  }

  _createLawTile(index, tooltip) {
    const cat = this._getLawCategory(index);
    const catColors = ['#4488ff','#44cc44','#cc44cc','#ff8844','#ff4444'];
    const color = catColors[cat] || '#888888';
    const enabled = this.engine.lawManager.isLaw(index);
    const state = this.engine.lawManager.getLawState(index);
    const name = (LAW_DISPLAY_NAMES && LAW_DISPLAY_NAMES[index]) || ('L' + index);
    const tooltipText = (LAW_TOOLTIPS && LAW_TOOLTIPS[index]) || '';

    const tile = document.createElement('div');
    tile.style.cssText = [
      'display:flex;flex-direction:column;align-items:center;justify-content:center;',
      `padding:4px 2px;border-radius:4px;cursor:pointer;user-select:none;`,
      `background:${enabled ? color + '22' : '#0a0a14'};`,
      `border:1px solid ${enabled ? color : '#1a1a2e'};`,
      'transition:all 0.15s;',
      'min-height:36px;',
    ].join('');

    // Full law name
    const icon = document.createElement('div');
    icon.textContent = name;
    icon.style.cssText = `font:bold 8px/1.2 monospace;color:${enabled ? color : '#445566'};text-align:center;word-break:break-word;`;

    // State indicator for multi-state
    let stateDot = null;
    if (state > 0) {
      stateDot = document.createElement('div');
      stateDot.textContent = state > 1 ? '●'.repeat(Math.min(state, 3)) : '●';
      stateDot.style.cssText = `font:8px monospace;color:${color};margin-top:1px;`;
    }

    tile.appendChild(icon);
    if (stateDot) tile.appendChild(stateDot);

    // Toggle on click
    tile.onclick = (e) => {
      e.stopPropagation();
      const msl = MULTI_STATE_LAWS.find(m => m.index === index);
      if (msl) {
        const nextState = (this.engine.lawManager.getLawState(index) + 1) % (msl.maxState + 1);
        this.engine.lawManager.setLawState(index, nextState);
        tile.style.background = nextState > 0 ? color + '22' : '#0a0a14';
        tile.style.borderColor = nextState > 0 ? color : '#1a1a2e';
        icon.style.color = nextState > 0 ? color : '#445566';
        if (nextState > 0) {
          if (!stateDot) {
            const nd = document.createElement('div');
            nd.style.cssText = `font:8px monospace;color:${color};margin-top:1px;`;
            tile.appendChild(nd);
            stateDot = nd;
          }
          stateDot.textContent = '●'.repeat(Math.min(nextState, 3));
        } else if (stateDot) {
          stateDot.remove();
          stateDot = null;
        }
      } else {
        const next = !this.engine.lawManager.isLaw(index);
        this.engine.lawManager.setLaw(index, next);
        tile.style.background = next ? color + '22' : '#0a0a14';
        tile.style.borderColor = next ? color : '#1a1a2e';
        icon.style.color = next ? color : '#445566';
      }
      this._onLawChanged();
    };

    // Right-click for menu (show state cycle for multi-state)
    tile.oncontextmenu = (e) => {
      e.preventDefault();
      const msl = MULTI_STATE_LAWS.find(m => m.index === index);
      if (msl) {
        const nextState = (this.engine.lawManager.getLawState(index) + 1) % (msl.maxState + 1);
        this.engine.lawManager.setLawState(index, nextState);
        // Update UI same as click handler
        tile.onclick(e);
      }
    };

    // Tooltip on hover
    tile.onmouseenter = (e) => {
      if (!tooltipText) return;
      const lines = [`[${name}]`];
      lines.push(`State: ${state > 0 ? 'ON' : 'OFF'}${state > 1 ? ' (tier ' + state + ')' : ''}`);
      lines.push(`Index: ${index} | Category: ${['Physics','Biology','Chemistry','Thermo','Meta'][cat] || '?'}`);
      tooltip.innerHTML = lines.join('<br>') + '<br><br>' + tooltipText;
      tooltip.style.display = 'block';
      this._positionTooltip(e, tooltip);
    };

    tile.onmousemove = (e) => this._positionTooltip(e, tooltip);
    tile.onmouseleave = () => { tooltip.style.display = 'none'; };

    return tile;
  }

  _positionTooltip(e, tooltip) {
    const x = e.clientX + 12;
    const y = e.clientY + 12;
    const w = tooltip.offsetWidth;
    const h = tooltip.offsetHeight;
    const maxX = window.innerWidth - w - 10;
    const maxY = window.innerHeight - h - 10;
    tooltip.style.left = Math.min(x, maxX) + 'px';
    tooltip.style.top = Math.min(y, maxY) + 'px';
  }

  _getLawCategory(index) {
    for (const [cat, [start, count]] of Object.entries(LAW_CATEGORY_RANGES)) {
      if (index >= start && index < start + count) return Number(cat);
    }
    return 0;
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

    const addSlider = (label, key, min, max, step, color = '#ff8844', log = false) => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:4px;font:10px monospace;padding:2px 0;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'width:60px;overflow:hidden;text-overflow:ellipsis;color:#8899aa;';
      lbl.textContent = label;
      lbl.title = label;
      div.appendChild(lbl);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.step = step;
      slider.value = this.engine.config[key] ?? 0;
      slider.style.cssText = `flex:1;height:3px;accent-color:${color};`;

      const display = document.createElement('span');
      display.style.cssText = 'width:35px;text-align:right;color:#aabbcc;';
      const val = this.engine.config[key] ?? 0;
      display.textContent = log ? Math.round(val) : (val >= 100 ? Math.round(val).toString() : val.toFixed(val < 0.01 ? 4 : 2));

      slider.oninput = () => {
        const v = Number(slider.value);
        this.engine.config[key] = v;
        display.textContent = log ? Math.round(v) : (v >= 100 ? Math.round(v).toString() : v.toFixed(v < 0.01 ? 4 : 2));
        if (key === 'worldSize' || key === 'dimX' || key === 'dimY') this.engine.grid.setWorldSize(this.engine.config.worldSize || this.engine.config.dimX);
        this.engine.bus.emit('world:paramChanged', { key, value: v });
      };

      div.appendChild(slider);
      div.appendChild(display);
      return div;
    };

    // Physics section
    const addSection = (title, color) => {
      const h = document.createElement('div');
      h.style.cssText = `color:${color};font:bold 10px/1.4 monospace;margin:5px 0 2px;cursor:pointer;`;
      h.textContent = title + ' [+]';
      const body = document.createElement('div');
      body.style.display = 'none';
      h.onclick = () => {
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        h.textContent = title + (open ? ' [+]' : ' [−]');
      };
      panel.content.appendChild(h);
      panel.content.appendChild(body);
      return body;
    };

    const physicsSection = addSection('Physics', '#4488ff');
    physicsSection.appendChild(addSlider('Gravity', 'gravityStrength', 0, 200000, 1000, '#4488ff'));
    physicsSection.appendChild(addSlider('Drag', 'dragCoeff', 0, 0.1, 0.001, '#4488ff'));
    physicsSection.appendChild(addSlider('Collision', 'collisionStiffness', 0, 2, 0.1, '#4488ff'));
    physicsSection.appendChild(addSlider('Signal', 'signalScale', 0, 2, 0.1, '#44cc44'));
    physicsSection.appendChild(addSlider('Viscosity', 'globalViscosity', 0.5, 1.0, 0.01, '#4488ff'));
    physicsSection.appendChild(addSlider('Entropy', 'entropy', 0, 1, 0.01, '#ff4488'));
    physicsSection.appendChild(addSlider('Time Scale', 'timeScale', 0, 5, 0.1, '#ff8844'));

    const envSection = addSection('Environment', '#44cc44');
    envSection.appendChild(addSlider('Temperature', 'temperature', 0, 1, 0.01, '#ff8844'));
    envSection.appendChild(addSlider('Pressure', 'pressure', 0, 1, 0.01, '#ff8844'));
    envSection.appendChild(addSlider('Shape', 'shape', 0, 1, 0.05, '#44cc44'));
    envSection.appendChild(addSlider('Order', 'order', 0, 1, 0.05, '#44cc44'));
    envSection.appendChild(addSlider('Base Size', 'baseSize', 0.5, 20, 0.5, '#44cc44'));

    const windSection = addSection('Wind', '#cc44cc');
    windSection.appendChild(addSlider('Wind X', 'windX', -5, 5, 0.1, '#cc44cc'));
    windSection.appendChild(addSlider('Wind Y', 'windY', -5, 5, 0.1, '#cc44cc'));
    windSection.appendChild(addSlider('Wind Z', 'windZ', -5, 5, 0.1, '#cc44cc'));

    const spawnSection = addSection('Spawn', '#ff8844');
    spawnSection.appendChild(addSlider('Initial Pop', 'initialCount', 10, 5000, 10, '#ff8844'));
    spawnSection.appendChild(addSlider('Max Count', 'particleCount', 10, 50000, 10, '#ff8844', true));
    spawnSection.appendChild(addSlider('Spawn Rate', 'spawnRate', 0, 100, 1, '#ff8844'));
    spawnSection.appendChild(addSlider('Spread X', 'spreadX', 0.1, 1.0, 0.05, '#ff8844'));
    spawnSection.appendChild(addSlider('Spread Y', 'spreadY', 0.1, 1.0, 0.05, '#ff8844'));
    spawnSection.appendChild(addSlider('Spread Z', 'spreadZ', 0.1, 1.0, 0.05, '#ff8844'));

    const worldSection = addSection('World Size', '#888888');
    worldSection.appendChild(addSlider('Width (X)', 'dimX', 200, 2000, 50, '#888888'));
    worldSection.appendChild(addSlider('Height (Y)', 'dimY', 200, 2000, 50, '#888888'));
    worldSection.appendChild(addSlider('Depth (Z)', 'dimZ', 100, 2000, 50, '#888888'));

    // Distribution selector
    const distSection = addSection('Distribution', '#ff8844');
    const distRow = document.createElement('div');
    distRow.style.cssText = 'display:flex;gap:2px;flex-wrap:wrap;margin:4px 0;';
    const distTypes = ['Grid', 'Soup', 'Big Bang', 'Bipolar', 'Galaxy'];
    for (const d of distTypes) {
      const btn = document.createElement('button');
      btn.textContent = d;
      btn.style.cssText = `padding:2px 5px;font:9px monospace;border:1px solid #445566;border-radius:3px;cursor:pointer;background:${this.engine.config.distributionType === d ? '#ff8844' : 'transparent'};color:${this.engine.config.distributionType === d ? '#fff' : '#ff8844'};`;
      btn.onclick = () => {
        this.engine.config.distributionType = d;
        distRow.querySelectorAll('button').forEach(b => {
          b.style.background = b.textContent === d ? '#ff8844' : 'transparent';
          b.style.color = b.textContent === d ? '#fff' : '#ff8844';
        });
      };
      distRow.appendChild(btn);
    }
    distSection.appendChild(distRow);

    // Center density sliders
    distSection.appendChild(addSlider('Center Density', 'centerDensity', 0, 1, 0.05, '#ff8844'));
    distSection.appendChild(addSlider('Density Radius', 'densityRadius', 0.05, 0.5, 0.05, '#ff8844'));
    distSection.appendChild(addSlider('Density Mul', 'densityMultiplier', 1, 5, 0.5, '#ff8844'));

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
