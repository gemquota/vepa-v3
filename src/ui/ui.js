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
      header.style.cssText = `color:#88aacc;font:bold 11px monospace;margin-bottom:4px;`;
      header.textContent = species.name;
      section.appendChild(header);

      for (const group of DNA_GROUPS) {
        const groupDiv = document.createElement('div');
        groupDiv.style.cssText = 'padding-left:8px;margin-bottom:6px;';

        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = 'color:#667788;font:9px monospace;cursor:pointer;';
        groupHeader.textContent = group.name;
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
          groupBody.style.display = groupBody.style.display === 'none' ? 'block' : 'none';
        };

        groupDiv.appendChild(groupBody);
        section.appendChild(groupDiv);
      }

      this._speciesContainer.appendChild(section);
    }
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
    const panel = this._createPanel('Environment', 'env-panel', false);

    const addSlider = (label, min, max, step, value, onChange) => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:4px;font:10px monospace;padding:2px 0;';

      const lbl = document.createElement('span');
      lbl.style.cssText = 'width:60px;color:#8899aa;';
      lbl.textContent = label;
      div.appendChild(lbl);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.step = step;
      slider.value = value;
      slider.style.cssText = 'flex:1;height:3px;accent-color:#ff8844;';

      const display = document.createElement('span');
      display.style.cssText = 'width:30px;text-align:right;color:#aabbcc;';
      display.textContent = value;

      slider.oninput = () => {
        const val = Number(slider.value);
        display.textContent = val;
        onChange(val);
      };

      div.appendChild(slider);
      div.appendChild(display);
      return div;
    };

    panel.content.appendChild(
      addSlider('Particles', 10, 5000, 10, this.engine.config.particleCount, (v) => {
        this.engine.config.particleCount = v;
      })
    );

    panel.content.appendChild(
      addSlider('World Size', 200, 2000, 50, this.engine.config.worldSize, (v) => {
        this.engine.config.worldSize = v;
        this.engine.grid.setWorldSize(v);
      })
    );

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Sim';
    resetBtn.style.cssText = 'margin-top:8px;width:100%;padding:4px;font:11px monospace;background:#442222;color:#ff6666;border:1px solid #664444;border-radius:3px;cursor:pointer;';
    resetBtn.onclick = () => this.engine.bus.emit('ui:reset');
    panel.content.appendChild(resetBtn);
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
    panel.content.innerHTML = '<div style="font:10px/1.4 monospace;color:#667788">VEPA v3<br>Vector Emergent Physics Automata<br><br>Toggle laws to modify particle behavior. Adjust DNA sliders per species.</div>';
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
