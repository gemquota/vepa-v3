import { DNA_META, DNA_RANGES, HELP_DB, DRONE_COMMENTS, STRIDE_INDEXES } from './constants.js';
import { bus } from "./core/eventBus.js";

let currentSpeciesIdx = 0;
let selectedSpeciesIndices = new Set([0]);
let selectionMode = false;
let selectedPresetName = null;
let selectedPresetCategories = new Set();
const narrativeHistory = [];

const WORLD_CATEGORIES = {
    "BASIC": { keys: ["initialCount", "count", "distributionType", "spreadX", "spreadY", "spreadZ", "order", "centerDensity", "densityRadius", "densityMultiplier", "shape", "entropy", "spawnRate", "G", "dt", "globalViscosity"], minLevel: 0 },
    "DIMENSIONS": { keys: ["dimX", "dimY", "dimZ", "baseSize"], minLevel: 0 },
    "PLANETARY": { keys: ["wind"], minLevel: 0 },
};
const DNA_CATEGORIES = {
    "BASIC": { keys: ["Force", "Viscosity", "Birth Rate", "Death Rate"], minLevel: 0 },
    "MOTION": { keys: ["Torque", "Jitter", "Tidal", "Stiffness", "Hidden Mass", "Inertia", "Friction", "Max Velocity"], minLevel: 0 },
    "SIGNALING": { keys: ["Signal Resp", "Pulse Rate", "Neighborhood Radius", "Signal Strength", "Signal Decay", "Propagation Speed", "Tuning Ch1", "Tuning Ch2", "Tuning Ch3", "Tuning Ch4"], minLevel: 0 },
    "ADVANCED": { keys: ["Mutation", "Fusion", "Fusion Momentum", "Fusion Time", "Base Radius", "Elasticity", "Bond Angle"], minLevel: 0 },
    "CORE TRAITS": { keys: ["C1 (Polarity)", "C2 (Alpha)", "C3 (Symmetry)", "Conductivity", "Magnetic Moment"], minLevel: 0 },
    "BIOLOGY": { keys: ["Energy Efficiency", "Sex Chance", "Predation Bias", "Species Affinity"], minLevel: 0 },
    "CHEMISTRY": { keys: ["Reaction Threshold", "Catalysis", "Heat Output", "Memory Decay"], minLevel: 0 }
};

class HelpPanel {
    constructor() { this.el = document.getElementById('help-panel'); this.state = { activeKey: null, level: 2 }; }
    open(key, level = 2) { this.state.activeKey = key; this.state.level = level; this.render(); this.el.classList.remove('hidden'); }
    close() { this.el.classList.add('hidden'); }
    render() {
        const data = HELP_DB[this.state.activeKey]; if (!data) return;
        const layers = [{ title: 'HINT', content: data.layers.hint }, { title: 'EXPLANATION', content: data.layers.explanation }, { title: 'SYSTEM', content: data.layers.system }, { title: 'ADVANCED', content: data.layers.advanced }];
        let html = `<div class="help-header">
            <span style="color:var(--warn); font-weight:bold; letter-spacing:1px;">${this.state.activeKey}</span>
            <div class="help-controls">
                <button class="help-btn-sq" title="CODEX" onclick="window.openCodex('${this.state.activeKey}')">📖</button>
                <button class="help-btn-sq close-x" onclick="window.closeHelp()">X</button>
            </div>
        </div>`;
        layers.slice(0, this.state.level).forEach(layer => { html += `<div class="help-layer"><div class="help-layer-title">${layer.title}</div><div class="help-layer-content">${layer.content}</div></div>`; });
        this.el.innerHTML = html;
    }
}

class Tooltip {
    constructor() { 
        this.el = document.getElementById('tooltip');
        this.drone = document.getElementById('help-drone');
        this.speechEl = document.getElementById('drone-speech');
        this.laserOverlay = document.getElementById('drone-laser-overlay');
        this.laserLine = document.getElementById('drone-laser');
        this.connectionLine = document.getElementById('drone-connection');
        this.currentTarget = null;
    }

    show(key, x, y, dynamicData = null, targetEl = null) {
        const data = dynamicData || HELP_DB[key]; 
        if (!data) return;
        
        this.currentTarget = targetEl;
        this.currentX = x;
        this.currentY = y;
        const title = dynamicData ? dynamicData.title : key;
        const hint = (dynamicData && dynamicData.hint) ? dynamicData.hint : (data.layers ? data.layers.hint : '');
        const helpKey = dynamicData ? (dynamicData.helpKey || key) : key;

        let html = `
            <div class="tooltip-header">
                <span class="tooltip-title">${title}</span>
                <div class="tooltip-controls">
                    <button class="tooltip-btn-sq" title="CODEX" onclick="window.openCodex('${helpKey}')">📖</button>
                    <button class="tooltip-btn-sq close-x" onclick="window.hideTooltip()">X</button>
                </div>
            </div>
            <div class="tooltip-content">${hint}</div>
        `;

        this.el.innerHTML = html;
        this.el.classList.remove('hidden');

        // Force reflow
        void this.el.offsetHeight;

        // Position: "centre upper half middle"
        // The user said: "centre upper half middle tooltip"
        // I'll interpret this as: middle of the screen horizontally, top 1/4 or 1/3 vertically.
        const rect = this.el.getBoundingClientRect();
        let finalX = (window.innerWidth - rect.width) / 2;
        let finalY = window.innerHeight * 0.2; // 20% from top

        this.el.style.left = finalX + 'px'; 
        this.el.style.top = finalY + 'px'; 

        // Visual Connections
        this.updateConnections();
    }

    updateConnections() {
        if (this.el.classList.contains('hidden')) {
            this.laserLine.classList.add('hidden');
            this.connectionLine.classList.add('hidden');
            return;
        }

        const targetRect = this.currentTarget ? this.currentTarget.getBoundingClientRect() : null;
        const tooltipRect = this.el.getBoundingClientRect();
        const droneRect = this.drone.getBoundingClientRect();

        const targetX = targetRect ? (targetRect.left + targetRect.width / 2) : this.currentX;
        const targetY = targetRect ? (targetRect.top + targetRect.height / 2) : this.currentY;

        const droneX = droneRect.left + droneRect.width / 2;
        const droneY = droneRect.top + droneRect.height / 2;

        const tooltipX = tooltipRect.left + tooltipRect.width / 2;
        const tooltipY = tooltipRect.top; // Connect to top of tooltip

        // Laser: Drone -> Target
        this.laserLine.setAttribute('x1', droneX);
        this.laserLine.setAttribute('y1', droneY);
        this.laserLine.setAttribute('x2', targetX);
        this.laserLine.setAttribute('y2', targetY);
        this.laserLine.classList.remove('hidden');

        // Connection: Target -> Tooltip
        this.connectionLine.setAttribute('x1', targetX);
        this.connectionLine.setAttribute('y1', targetY);
        this.connectionLine.setAttribute('x2', tooltipX);
        this.connectionLine.setAttribute('y2', tooltipY);
        this.connectionLine.classList.remove('hidden');

        // Neon Border
        document.querySelectorAll('.neon-border-target').forEach(el => el.classList.remove('neon-border-target'));
        if (this.currentTarget) this.currentTarget.classList.add('neon-border-target');
    }

    hide() { 
        this.el.classList.add('hidden'); 
        if (this.speechEl) this.speechEl.classList.add('hidden');
        if (this.drone) {
            this.drone.classList.remove('shaking');
            this.drone.style.transform = 'translate(-50%, -50%) rotate(0deg)';
        }
        if (this.laserLine) this.laserLine.classList.add('hidden');
        if (this.connectionLine) this.connectionLine.classList.add('hidden');
        document.querySelectorAll('.neon-border-target').forEach(el => el.classList.remove('neon-border-target'));
        this.currentTarget = null;
        bus.on("level:up", (data) => {
            this.drone.classList.add('victory-lap');
            this.say("LEVEL_UP", window.innerWidth / 2, window.innerHeight / 2);
            setTimeout(() => this.drone.classList.remove('victory-lap'), 3000);
        });

        bus.on("insight:discovered", (insight) => {
            if (insight.type === "discovery") {
                this.say(insight.id.toUpperCase(), window.innerWidth / 2, window.innerHeight / 2);
            }
        });
    }

    say(category, x, y) {
        if (!this.speechEl || !DRONE_COMMENTS[category]) return;
        const list = DRONE_COMMENTS[category];
        const text = list[Math.floor(Math.random() * list.length)];
        this.speechEl.innerText = text;
        this.speechEl.classList.remove('hidden');
        
        // Force reflow
        void this.speechEl.offsetHeight;

        const rect = this.speechEl.getBoundingClientRect();
        const tooltipVisible = !this.el.classList.contains('hidden');
        const tooltipRect = tooltipVisible ? this.el.getBoundingClientRect() : null;

        // Default position: above drone
        let finalX = x - rect.width / 2;
        let finalY = y - rect.height - 40;
        
        // Avoid Tooltip overlap
        if (tooltipRect) {
            const margin = 20;
            const overlapX = finalX < tooltipRect.right + margin && (finalX + rect.width) > tooltipRect.left - margin;
            const overlapY = finalY < tooltipRect.bottom + margin && (finalY + rect.height) > tooltipRect.top - margin;
            
            if (overlapX && overlapY) {
                // If overlapping, try below drone or to the sides
                if (y + rect.height + 40 < window.innerHeight - 10) {
                    finalY = y + 40;
                } else if (x + rect.width + 40 < window.innerWidth - 10) {
                    finalX = x + 40;
                    finalY = y - rect.height / 2;
                } else {
                    finalX = x - rect.width - 40;
                    finalY = y - rect.height / 2;
                }
            }
        }

        // Final Clamps (Keep on screen)
        const pad = 10;
        finalX = Math.max(pad, Math.min(finalX, window.innerWidth - rect.width - pad));
        finalY = Math.max(pad, Math.min(finalY, window.innerHeight - rect.height - pad));

        this.speechEl.style.left = finalX + 'px';
        this.speechEl.style.top = finalY + 'px';
        
        if (this._speechTimeout) clearTimeout(this._speechTimeout);
        this._speechTimeout = setTimeout(() => this.speechEl.classList.add('hidden'), 4000);
    }

    shake() {
        if (!this.drone) return;
        this.drone.classList.add('shaking');
        setTimeout(() => this.drone.classList.remove('shaking'), 300);
    }
    
    flyDrone(targetX, targetY) {
        if (!this.drone) return;
        
        const rect = this.drone.getBoundingClientRect();
        const currentX = rect.left + rect.width / 2;
        const dx = targetX - currentX;
        
        // Calculate lean angle based on horizontal direction
        const lean = Math.min(Math.max(dx * 0.1, -25), 25);
        
        this.drone.classList.remove('hidden', 'hovering', 'victory-lap', 'docked');
        this.drone.style.transform = `translate(-50%, -50%) rotate(${lean}deg)`;
        
        // Start updating lines while flying
        const updateInterval = setInterval(() => {
            if (this.currentTarget) this.updateConnections();
        }, 16);
        
        setTimeout(() => {
            this.drone.style.left = targetX + 'px';
            this.drone.style.top = targetY + 'px';
            
            setTimeout(() => {
                clearInterval(updateInterval);
                if (!this.drone.classList.contains('hidden')) {
                    this.drone.classList.add('hovering');
                    this.drone.style.transform = 'translate(-50%, -50%) rotate(0deg)';
                    this.updateConnections();
                }
            }, 800);
        }, 10);
    }
}


const helpPanel = new HelpPanel(); const tooltip = new Tooltip();

// UI EVENT BUS HELPERS
const emit = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
    
    // Broadcast to chaos grid iframes (including chaos commands in multiplex mode)
    const overlay = document.getElementById('chaos-grid-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        const container = document.getElementById('chaos-grid-container');
        if (container) {
            const iframes = container.querySelectorAll('iframe');
            iframes.forEach(f => {
                if (f.contentWindow && f.contentWindow.dispatchEvent) {
                    f.contentWindow.dispatchEvent(new CustomEvent(name, { detail }));
                }
            });
        }
    }
};

export function setupUI(engine) {
    window.triggerSmartChaos = (options) => emit('cmd:chaos', options);

    window.openSelectiveChaos = () => {
        const overlay = document.getElementById('chaos-grid-overlay');
        const isMultiplex = overlay && !overlay.classList.contains('hidden');
        const indicator = document.getElementById('chaos-mode-indicator');
        if (indicator) {
            indicator.textContent = isMultiplex ? 'TARGET: ALL MULTIPLEX INSTANCES' : 'TARGET: Current World';
            indicator.style.color = isMultiplex ? '#ff8844' : '#88aacc';
        }
        document.getElementById('selective-chaos-dialog').classList.remove('hidden');
    };
    
    window.closeSelectiveChaos = () => {
        document.getElementById('selective-chaos-dialog').classList.add('hidden');
    };

    window.openChaosMenu = () => {
        document.getElementById('chaos-menu-dialog').classList.remove('hidden');
    };
    
    window.closeChaosMenu = () => {
        document.getElementById('chaos-menu-dialog').classList.add('hidden');
    };
    
    window.confirmChaosMenu = () => {
        const input = document.getElementById('chaos-sim-count-input');
        const gridStr = (input.value || '3x5').toLowerCase();
        window.closeChaosMenu();
        
        let cols = 3, rows = 5;
        if (gridStr.includes('x')) {
            const parts = gridStr.split('x');
            cols = parseInt(parts[0]) || 3;
            rows = parseInt(parts[1]) || 5;
        } else {
            cols = parseInt(gridStr) || 3;
            rows = 1;
        }

        const count = cols * rows;
        if (count > 20) {
            alert('Cannot run more than 20 simulations at once (WebGL context limits).');
            return;
        }

        // Save current state as _chaos_base
        window.engine.persistence.savePreset('_chaos_base', window.engine);

        const overlay = document.getElementById('chaos-grid-overlay');
        const container = document.getElementById('chaos-grid-container');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        for (let i = 0; i < count; i++) {
            const iframe = document.createElement('iframe');
            iframe.src = 'index.html?chaos=1&base=_chaos_base';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = '1px solid #333';
            iframe.style.background = '#000';
            container.appendChild(iframe);
        }

        overlay.classList.remove('hidden');
    };

    window.closeChaosGrid = () => {
        const overlay = document.getElementById('chaos-grid-overlay');
        const container = document.getElementById('chaos-grid-container');
        overlay.classList.add('hidden');
        container.innerHTML = ''; // Kill iframes
    };

    window.rerollChaosGrid = () => {
        const container = document.getElementById('chaos-grid-container');
        if (container) {
            const iframes = container.querySelectorAll('iframe');
            iframes.forEach(f => f.src = f.src);
        }
    };

    const chaosBtn = document.getElementById('chaos-btn');
    if (chaosBtn) {
        let chaosPressTimer;
        let isLongPress = false;

        const startChaosPress = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            isLongPress = false;
            chaosPressTimer = setTimeout(() => {
                isLongPress = true;
                chaosPressTimer = null;
                window.openChaosMenu();
            }, 500);
        };
        
        const endChaosPress = (e) => {
            if (chaosPressTimer) {
                clearTimeout(chaosPressTimer);
                chaosPressTimer = null;
                if (!isLongPress) {
                    window.openSelectiveChaos();
                }
            }
        };

        chaosBtn.addEventListener('mousedown', startChaosPress);
        chaosBtn.addEventListener('touchstart', startChaosPress, { passive: true });
        chaosBtn.addEventListener('mouseup', endChaosPress);
        chaosBtn.addEventListener('touchend', endChaosPress);
        chaosBtn.addEventListener('mouseleave', () => { 
            if (chaosPressTimer) { 
                clearTimeout(chaosPressTimer); 
                chaosPressTimer = null; 
            } 
        });
    }
    window.togglePause = () => emit('cmd:pause');
    window.restartSim = () => emit('cmd:restart');
    window.cycleDistType = (dir) => {
        const dists = ['Grid', 'Soup', 'Big Bang', 'Bipolar', 'Galaxy'];
        const cur = window.engine.worldConfig.distributionType || 'Grid';
        let idx = dists.indexOf(cur) + dir;
        if (idx < 0) idx = dists.length - 1;
        if (idx >= dists.length) idx = 0;
        window.engine.worldConfig.distributionType = dists[idx];
        const el = document.getElementById('world-val-distributionType');
        if (el) el.innerText = dists[idx].toUpperCase();
    };
    window.hardReset = () => { if(confirm("Hard reset?")) emit('cmd:hardReset'); };
    window.setPlaybackMode = (mode) => emit('cmd:playback', mode);
    window.toggleLaw = (k) => emit('cmd:toggleLaw', k);
    window.toggleCategory = (g) => { emit('cmd:toggleCategory', g); renderLawCodex(); };
    window.cycleLawUIScale = () => {
        window.engine.lawUIScale = (window.engine.lawUIScale + 1) % 4;
        const grid = document.querySelector('.icon-grid');
        const scaleBtn = document.getElementById('law-scale-btn');
        if (grid) {
            grid.classList.remove('scale-hidden', 'scale-micro', 'scale-standard', 'scale-giant');
            const modes = ['scale-hidden', 'scale-micro', 'scale-standard', 'scale-giant'];
            grid.classList.add(modes[window.engine.lawUIScale]);
        }
        if (scaleBtn) {
            const icons = ['∅', '▫', '□', '▣'];
            scaleBtn.innerText = icons[window.engine.lawUIScale];
        }
    };
    window.handleLawClick = (lawKey, helpKey, e) => {
        const descEl = document.getElementById('active-law-desc');
        const labelEl = document.getElementById('desc-category-label');
        const data = HELP_DB[helpKey];
        if (descEl && data) {
            descEl.innerText = `${helpKey.toUpperCase()}: ${data.layers.hint}`;
            if (labelEl && data.category) {
                labelEl.innerText = data.category.toUpperCase() + ':';
            }
        }

        if (document.body.classList.contains('help-mode-active')) {
            window.showTooltip(helpKey, e);
        } else {
            window.toggleLaw(lawKey);
        }
    };

    const renderToggleIcons = () => {
        Object.entries(LAW_ICONS).forEach(([k, icon]) => {
            const el = document.getElementById(`syn-${k}`);
            if (el) {
                const helpKey = el.getAttribute('title').toUpperCase();
                const data = HELP_DB[helpKey] || {};
                el.innerHTML = `
                    <div class="law-icon-wrapper" style="width:24px; height:24px; flex-shrink:0;">${icon}</div>
                    <div class="law-text-content">
                        <span class="law-label">${helpKey}</span>
                        <span class="law-desc">${data.layers?.hint || ''}</span>
                    </div>
                `;
            }
        });
    };

    window.toggleAllLaws = () => {
        const tab = document.getElementById('tab-world');
        const btn = document.getElementById('toggle-all-laws-btn');
        const arrow = document.getElementById('toggle-laws-arrow');
        const isMinimized = tab.classList.toggle('laws-minimized');
        
        btn.querySelector('span').innerText = isMinimized ? 'EXPAND ALL LAWS' : 'MINIMIZE ALL LAWS';
        arrow.innerText = isMinimized ? '▼' : '▲';
        arrow.style.transform = isMinimized ? 'rotate(0deg)' : 'rotate(0deg)'; // Arrow handles rotation via text change for now
    };

    window.toggleSelectionMode = (enabled) => {
        selectionMode = enabled;
        if (!enabled) {
            selectedSpeciesIndices.clear();
            selectedSpeciesIndices.add(currentSpeciesIdx);
        }
        renderSpeciesList(window.engine);
        renderDNAAccordion(window.engine);
    };

    window.selectAllSpecies = () => {
        const toggle = document.getElementById('selection-mode-toggle');
        if (toggle) {
            toggle.checked = true;
            selectionMode = true;
        }
        window.engine.species.forEach((_, idx) => selectedSpeciesIndices.add(idx));
        renderSpeciesList(window.engine);
        renderDNAAccordion(window.engine);
    };

    window.toggleSpeciesSelection = (idx, event) => {
        if (event) event.stopPropagation();
        if (selectedSpeciesIndices.has(idx)) {
            if (selectedSpeciesIndices.size > 1) selectedSpeciesIndices.delete(idx);
        } else {
            selectedSpeciesIndices.add(idx);
        }
        if (selectedSpeciesIndices.has(idx)) currentSpeciesIdx = idx;
        else if (selectedSpeciesIndices.size > 0) currentSpeciesIdx = Array.from(selectedSpeciesIndices)[0];
        
        renderSpeciesList(window.engine);
        renderDNAAccordion(window.engine);
    };

    window.trackSliderWithDrone = (el, key) => {
        if (!document.body.classList.contains('help-mode-active')) return;
        
        const rect = el.getBoundingClientRect();
        const thumbWidth = 10;
        const ratio = (el.value - el.min) / (el.max - el.min);
        const thumbX = rect.left + (rect.width * ratio);
        const thumbY = rect.top + rect.height / 2;

        tooltip.flyDrone(thumbX, thumbY - 40);
        // Throttle tooltip updates for performance if needed, but for now just show
        window.showTooltip(key, { clientX: thumbX, clientY: thumbY, target: el, stopPropagation: () => {} });
    };

    window.updateDNA = (sIdx, rIdx, val, dId, el, key) => {
        const value = parseFloat(val);
        if (el && key) window.trackSliderWithDrone(el, key);
        
        if (selectionMode && selectedSpeciesIndices.has(sIdx)) {
            selectedSpeciesIndices.forEach(idx => {
                emit('cmd:updateDNA', { sIdx: idx, rIdx, val: value });
                window.engine.species[idx].dna[rIdx] = value;
            });
        } else {
            emit('cmd:updateDNA', { sIdx, rIdx, val: value });
            if (window.engine.species[sIdx]) window.engine.species[sIdx].dna[rIdx] = value;
        }
        
        if (dId) {
            const elVal = document.getElementById(dId);
            if (elVal) elVal.innerText = value.toFixed(2);
            const row = elVal.closest('.slider-row');
            if (row) row.classList.toggle('zero-val', value === 0);
        }
    };

    window.handleDNAForceLog = (el, dnaIdx, dId) => {
        const pct = parseFloat(el.value);
        window.trackSliderWithDrone(el, 'Force');
        
        const minLog = Math.log(0.001), maxLog = Math.log(100);
        let val;
        if (pct === 50) val = 0;
        else if (pct > 50) {
            const p = (pct - 50) / 50;
            val = Math.exp(minLog + (maxLog - minLog) * p);
        } else {
            const p = (50 - pct) / 50;
            val = -Math.exp(minLog + (maxLog - minLog) * p);
        }
        
        window.updateDNA(currentSpeciesIdx, dnaIdx, val, dId, null, 'Force');
    };

    window.updateWorld = (key, val, dId, el) => {
        emit('cmd:updateWorld', { key, val });
        if (el) window.trackSliderWithDrone(el, key);
        if (dId) {
            const elVal = document.getElementById(dId);
            if (elVal) elVal.innerText = val;
            const row = elVal.closest('.slider-row');
            if (row) row.classList.toggle('zero-val', parseFloat(val) === 0);
        }
    };
    window.updatePhysics = (key, val, dId, el) => {
        emit('cmd:updatePhysics', { key, val });
        if (el) window.trackSliderWithDrone(el, key);
        if (dId) {
            const elVal = document.getElementById(dId);
            if (elVal) elVal.innerText = val;
            const row = elVal.closest('.slider-row');
            if (row) row.classList.toggle('zero-val', parseFloat(val) === 0);
        }
    };
    
    window.addEventListener('ui:helpRequested', (e) => {
        const { key, x, y } = e.detail;
        window.showTooltip(key, { clientX: x, clientY: y, stopPropagation: () => {} });
    });
    
    window.toggleTopBar = (force) => {
        const bar = document.getElementById('top-bar');
        const collapse = (force !== undefined) ? force : !bar.classList.contains('collapsed');
        bar.classList.toggle('collapsed', collapse);
        emit('ui:resized');
    };

    window.toggleMainPanel = (force) => {
        const panel = document.getElementById('main-panel');
        const hide = (force !== undefined) ? !force : !panel.classList.contains('hidden');
        panel.classList.toggle('hidden', hide);
        emit('ui:resized');
    };

    window.cycleGridScale = () => {
        const grid = document.getElementById('law-icon-grid');
        const row = document.querySelector('.grid-controls-row-condensed');
        if (!grid || !row) return;
        
        const scales = ['scale-hidden', 'scale-micro', 'scale-standard', 'scale-giant'];
        let currentIndex = scales.findIndex(s => grid.classList.contains(s));
        if (currentIndex === -1) currentIndex = 2; // Default to standard
        
        grid.classList.remove(...scales);
        let nextIndex = (currentIndex + 1) % scales.length;
        const nextScale = scales[nextIndex];
        grid.classList.add(nextScale);
        
        const btn = document.getElementById('grid-scale-btn');
        if (btn) {
            const icons = ['∅', '·', '□', '▣'];
            btn.querySelector('.scale-icon').innerText = icons[nextIndex];
        }

        // Condense the whole chunk if hidden
        const chunk = grid.closest('.menu-chunk');
        if (chunk) {
            chunk.style.marginBottom = (nextScale === 'scale-hidden') ? '5px' : '20px';
        }
        
        emit('ui:resized');
    };

    window.toggleCategoryFilter = (catClass, tabEl) => {
        const grid = document.getElementById('law-icon-grid');
        if (!grid) return;
        
        const isActive = tabEl.classList.toggle('active');
        const items = grid.querySelectorAll(`.${catClass}`);
        items.forEach(item => {
            item.style.display = isActive ? '' : 'none';
        });
        emit('ui:resized');
    };

    window.toggleInfoModule = () => {
        const mod = document.getElementById('info-module');
        const btn = document.getElementById('info-module-toggle');
        const active = !mod.classList.toggle('hidden');
        btn.classList.toggle('active', active);
        if (active) renderLawCodex();
        emit('ui:resized');
    };

    const LAW_ICONS = {
        grav: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3" fill="var(--red-bright)"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" opacity="0.5"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" stroke-dasharray="2 2"/></svg>`,
        drag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12h14M2 8h10M2 16h18M18 8l4 4-4 4"/></svg>`,
        jitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l3-4 4 8 3-8 4 8 3-8 3 4"/></svg>`,
        wrap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16v16H4z" stroke-dasharray="4 2"/><path d="M20 12h3M1 12h3M12 1v3M12 20v3" stroke-linecap="round"/></svg>`,
        coll: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M12 8v8" stroke-dasharray="2 2"/></svg>`,
        accr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M12 6v-4M12 22v-4M6 12h-4M22 12h-4" opacity="0.4"/><path d="M12 12L18 6M6 18L12 12" opacity="0.4"/><path d="M12 12L18 18M6 6L12 12" opacity="0.4"/><circle cx="12" cy="12" r="6" stroke-dasharray="3 3"/></svg>`,
        life: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z"/><path d="M12 12c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3z"/><path d="M19 12c0 3.866-3.134 7-7 7s-7-3.134-7-7" opacity="0.5"/></svg>`,
        glow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4" fill="var(--red-bright)" fill-opacity="0.3"/><circle cx="12" cy="12" r="8" stroke-dasharray="4 4"/></svg>`,
        affinity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--red-bright)" fill-opacity="0.2"/></svg>`,
        reproduction: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="4"/><circle cx="15" cy="15" r="4"/></svg>`,
        tracking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M12 8a4 4 0 100 8 4 4 0 000-8z" stroke-dasharray="2 1"/></svg>`,
        senescence: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M2 12h20" opacity="0.2"/><path d="M12 12l7 7M5 5l7 7" stroke-dasharray="4 4"/><circle cx="12" cy="12" r="8" opacity="0.5"/></svg>`,
        genotype: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3c0 4.418 3.582 8 8 8s8-3.582 8-8"/><path d="M0 21c0-4.418 3.582-8 8-8s8 3.582 8 8"/></svg>`,
        phenotype: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="4"/></svg>`,
        void: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10" stroke-dasharray="4 4"/><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" fill="currentColor"/></svg>`,
        bond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 7l10 10M7 17L17 7"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="7" r="3"/></svg>`,
        planetary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 21a9 9 0 000-18M3 12h18" opacity="0.4"/><circle cx="12" cy="12" r="3"/></svg>`,
        ener: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="var(--red-bright)" fill-opacity="0.3"/></svg>`,
        rad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" opacity="0.6"/></svg>`,
        cata: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
        solv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5L12 2 8 9.5c-2 1.6-3 3.5-3 5.5a7 7 0 007 7z"/></svg>`,
        acid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 3v12a4 4 0 01-4 4H9a4 4 0 01-4-4V3"/></svg>`,
        oxid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" stroke-dasharray="2 2"/></svg>`,
        redu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v10M12 22v-10M2 12h10M22 12H12" stroke-dasharray="2 2"/></svg>`,
        poly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 7l10 10M7 17L17 7"/></svg>`,
        isom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
        chir: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v5m-4 0V4a2 2 0 00-2-2v0a2 2 0 00-2 2v9"/></svg>`,
        crys: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l9 7-9 13-9-13 9-7z"/></svg>`,
        allo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke-dasharray="4 4"/><path d="M12 18a6 6 0 100-12 6 6 0 000 12z"/></svg>`,
        heat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c0 0-5 5-5 9a5 5 0 0010 0c0-4-5-9-5-9z"/></svg>`,
        cold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5"/></svg>`,
        conv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M2 12h20" stroke-dasharray="2 2"/></svg>`,
        radi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M12 7v-5M12 17v5M7 12H2M17 12h5" opacity="0.5"/></svg>`,
        subl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20c0-4 4-4 4-8s-4-4-4-8M12 20c0-4 4-4 4-8s-4-4-4-8"/></svg>`,
        melt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" stroke-dasharray="4 2"/></svg>`,
        boil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="12" r="3"/><circle cx="10" cy="18" r="2"/></svg>`,
        cond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v2m0 16v2M4 12H2m16 0h2M6 6L5 5m13 13l-1-1M6 18l-1 1M18 6l-1 1"/></svg>`,
        depo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3 3h-6l3-3zM12 22l-3-3h6l-3 3z"/></svg>`,
        exop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2 4 6 2-4 4 2 6-6-4-6 4 2-6-4-4 6-2 2-4z"/></svg>`,
        time: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
        dime: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>`,
        chao: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a10 10 0 1010 10c0-5.5-4.5-10-10-10zm0 14a4 4 0 110-8 4 4 0 010 8z" stroke-dasharray="2 2"/></svg>`,
        orde: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h18v18H3zM3 10h18M3 14h18M10 3v18M14 3v18"/></svg>`,
        fate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
        will: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21h6m-3-3v3m0-12a5 5 0 00-5 5c0 2.5 1.5 4.5 3 5l2 1 2-1c1.5-.5 3-2.5 3-5a5 5 0 00-5-5z"/></svg>`,
        soul: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a7 7 0 00-7 7v7s0 4 2 4 3-2 5-2 3 2 5 2 2-4 2-4V9a7 7 0 00-7-7z"/></svg>`,
        mind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        tele: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3l14 9-14 9V3z" stroke-dasharray="2 2"/></svg>`,
        clai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 17l-5-5 5-5 5 5-5 5z"/><path d="M2 12h20M12 2v20" opacity="0.3"/></svg>`,
        preo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`,
        astr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`
    };

    const renderLawCodex = () => {
        const container = document.getElementById('info-module');
        if (!container) return;
        
        const tabs = [
            { id: 'physics', label: 'PHYS', group: 'pure' },
            { id: 'biology', label: 'BIOL', group: 'biol' },
            { id: 'chemistry', label: 'CHEM', group: 'chem' },
            { id: 'thermo', label: 'THERM', group: 'thermo' },
            { id: 'meta', label: 'META', group: 'meta' }
        ];

        const activeTab = tabs.find(t => t.id === activeInfoTab) || tabs[0];
        const isCollapsed = window.engine.lawStateMemory[activeTab.group] !== null;

        const pureMap = [
            { key: 'grav', help: 'GRAV', name: 'GLOBAL GRAVITY', group: 'pure' },
            { key: 'drag', help: 'DRAG', name: 'MOTION DAMPING', group: 'pure' },
            { key: 'jitter', help: 'ENTR', name: 'ENTROPY (JITTER)', group: 'pure' },
            { key: 'wrap', help: 'WRAP', name: 'SCREEN WRAPPING', group: 'pure' },
            { key: 'coll', help: 'COLL', name: 'PHYSICAL COLLISIONS', group: 'pure' },
            { key: 'accr', help: 'ACCR', name: 'MASS ACCRETION', group: 'pure' },
            { key: 'planetary', help: 'PLANET', name: 'PLANETARY MODE', group: 'pure' },
            { key: 'void', help: 'VOID', name: 'VACUUM PRESSURE', group: 'pure' },
            { key: 'bond', help: 'BOND', name: 'MOLECULAR BOND', group: 'pure' }
        ];
        
        const biolMap = [
            { key: 'life', help: 'BIOL', name: 'BIOLOGICAL LIFECYCLE', group: 'biol' },
            { key: 'glow', help: 'GLOW', name: 'SIGNALING PULSES', group: 'biol' },
            { key: 'affinity', help: 'Species Affinity', name: 'SPECIES AFFINITY', group: 'biol' },
            { key: 'reproduction', help: 'Birth Rate', name: 'REPRODUCTION', group: 'biol' },
            { key: 'tracking', help: 'Signal Resp', name: 'TRACKING', group: 'biol' },
            { key: 'senescence', help: 'Death Rate', name: 'SENESCENCE', group: 'biol' },
            { key: 'genotype', help: 'Mutation', name: 'GENOTYPE', group: 'biol' },
            { key: 'phenotype', help: 'C2 (Alpha)', name: 'PHENOTYPE', group: 'biol' },
            { key: 'ener', help: 'ENER', name: 'ENERGY CONSERVATION', group: 'biol' },
            { key: 'rad', help: 'RAD', name: 'RADIATION EMISSION', group: 'biol' }
        ];

        const chemMap = [
            { key: 'cata', help: 'CATA', name: 'CATALYSIS', group: 'chem' },
            { key: 'solv', help: 'SOLV', name: 'SOLVATION', group: 'chem' },
            { key: 'acid', help: 'ACID', name: 'ACIDITY', group: 'chem' },
            { key: 'oxid', help: 'OXID', name: 'OXIDATION', group: 'chem' },
            { key: 'redu', help: 'REDU', name: 'REDUCTION', group: 'chem' },
            { key: 'poly', help: 'POLY', name: 'POLYMERIZATION', group: 'chem' },
            { key: 'isom', help: 'ISOM', name: 'ISOMERIZATION', group: 'chem' },
            { key: 'chir', help: 'CHIR', name: 'CHIRALITY', group: 'chem' },
            { key: 'crys', help: 'CRYS', name: 'CRYSTALLIZATION', group: 'chem' },
            { key: 'allo', help: 'ALLO', name: 'ALLOTROPY', group: 'chem' }
        ];

        const thermoMap = [
            { key: 'heat', help: 'HEAT', name: 'HEAT OUTPUT', group: 'thermo' },
            { key: 'cold', help: 'COLD', name: 'COLD SINK', group: 'thermo' },
            { key: 'conv', help: 'CONV', name: 'CONVECTION', group: 'thermo' },
            { key: 'radi', help: 'RADI', name: 'THERMAL RADIATION', group: 'thermo' },
            { key: 'subl', help: 'SUBL', name: 'SUBLIMATION', group: 'thermo' },
            { key: 'melt', help: 'MELT', name: 'MELTING POINT', group: 'thermo' },
            { key: 'boil', help: 'BOIL', name: 'BOILING', group: 'thermo' },
            { key: 'cond', help: 'COND', name: 'CONDENSATION', group: 'thermo' },
            { key: 'depo', help: 'DEPO', name: 'DEPOSITION', group: 'thermo' },
            { key: 'exop', help: 'EXOP', name: 'EXOTHERMIC', group: 'thermo' }
        ];

        const metaMap = [
            { key: 'time', help: 'TIME', name: 'TIME DILATION', group: 'meta' },
            { key: 'dime', help: 'DIME', name: 'DIMENSIONALITY', group: 'meta' },
            { key: 'chao', help: 'CHAO', name: 'CHAOS FACTOR', group: 'meta' },
            { key: 'orde', help: 'ORDE', name: 'TOTAL ORDER', group: 'meta' },
            { key: 'fate', help: 'FATE', name: 'DETERMINISM', group: 'meta' },
            { key: 'will', help: 'WILL', name: 'FREE WILL', group: 'meta' },
            { key: 'soul', help: 'SOUL', name: 'SOUL PERSISTENCE', group: 'meta' },
            { key: 'mind', help: 'MIND', name: 'HIVE MIND', group: 'meta' },
            { key: 'tele', help: 'TELE', name: 'TELEPORTATION', group: 'meta' },
            { key: 'clai', help: 'CLAI', name: 'CLAIRVOYANCE', group: 'meta' },
            { key: 'preo', help: 'PREO', name: 'PRECOGNITION', group: 'meta' },
            { key: 'astr', help: 'ASTR', name: 'ASTRAL PROJECTION', group: 'meta' }
        ];

        let currentMap = pureMap;
        if (activeInfoTab === 'biology') currentMap = biolMap;
        else if (activeInfoTab === 'chemistry') currentMap = chemMap;
        else if (activeInfoTab === 'thermo') currentMap = thermoMap;
        else if (activeInfoTab === 'meta') currentMap = metaMap;

        const renderGroup = (map) => {
            return map.map(l => {
                const data = HELP_DB[l.help];
                const isActive = window.engine.laws[l.group][l.key];
                const icon = LAW_ICONS[l.key] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>';
                const detail = data ? `
                    <div class="info-item-detail">
                        <p class="detail-exp">${data.layers.explanation}</p>
                        <p class="detail-sys">${data.layers.system || ''}</p>
                        <p class="detail-adv">${data.layers.advanced || ''}</p>
                        <button class="btn codex-link-integrated" onclick="window.openCodex('${l.help}')">
                            <span class="codex-btn-text">ENTRY:</span> ${l.help.toUpperCase()}
                        </button>
                    </div>
                ` : '';

                return `
                    <div class="info-item">
                        <div class="info-item-header">
                            <div class="info-item-identity">
                                <div class="law-icon">${icon}</div>
                                <span class="info-item-name">${l.name}</span>
                            </div>
                            <div id="info-sw-${l.key}" class="info-item-icon-switch ${isActive ? 'active' : ''}" onclick="window.toggleLaw('${l.key}')" title="Toggle Law">
                                ${isActive ? 'ACTIVE' : 'OFF'}
                            </div>
                        </div>
                        <div class="info-item-desc">${detail}</div>
                    </div>
                `;
            }).join('');
        };

        const tabHtml = `
            <div class="info-tabs">
                ${tabs.map(t => `<div class="info-tab ${activeInfoTab === t.id ? 'active' : ''}" onclick="window.switchInfoTab('${t.id}')">${t.label}</div>`).join('')}
                <div id="law-scale-btn" class="info-tab scale-cycle-btn" onclick="window.cycleLawUIScale()" title="Cycle Display Mode">
                    ${['∅', '▫', '□', '▣'][window.engine.lawUIScale]}
                </div>
            </div>
            <div class="category-master-toggle-row">
                <button class="btn full-width ${isCollapsed ? 'collapsed' : ''}" onclick="window.toggleCategory('${activeTab.group}')">
                    ${isCollapsed ? 'RESTORE CATEGORY' : 'COLLAPSE & DISABLE CATEGORY'}
                </button>
            </div>
        `;

        container.innerHTML = tabHtml + `<div class="info-scroll-area ${isCollapsed ? 'disabled-zone' : ''}">${renderGroup(currentMap)}</div>`;
    };

    window.switchInfoTab = (tab) => { activeInfoTab = tab; renderLawCodex(); };



    window.openTab = (event, tabId) => {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        if (event) event.currentTarget.classList.add('active');
        if (tabId === 'tab-log') renderNarrativeLog();
        if (tabId === 'tab-dna') { renderDNAAnalytics(window.engine); updateDNAGraphs(window.engine); }
        if (tabId === 'tab-settings') renderPresetsInline(window.engine);
        emit('ui:resized');
    };

    window.toggleAccSection = (id) => {
        const target = document.getElementById(id);
        target.classList.toggle('active');
        emit('ui:resized');
    };

    window.toggleHelpMode = () => {
        const active = document.body.classList.contains('help-mode-active');
        const nextActive = !active;
        document.body.classList.toggle('help-mode-active', nextActive);

        const btn = document.getElementById('help-toggle');
        const bay = document.getElementById('drone-bay');
        btn.classList.toggle('active', nextActive);
        
        const drone = document.getElementById('help-drone');
        const rect = btn.getBoundingClientRect();
        const bayCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

        if (nextActive) {
            // 1. Initial Docking (Internal)
            drone.classList.add('docked');
            drone.classList.remove('hovering', 'victory-lap');
            drone.style.left = bayCenter.x + 'px';
            drone.style.top = (bayCenter.y + 10) + 'px'; 
            void drone.offsetWidth; 
            
            // 2. Open Bay
            bay.classList.add('bay-open');
            
            // 3. Reveal Drone from inside (delayed)
            setTimeout(() => {
                if (document.body.classList.contains('help-mode-active')) {
                    drone.classList.remove('hidden');
                }
            }, 300);
            
            // 4. Launch Sequence
            setTimeout(() => {
                drone.classList.remove('docked');
                // Slide out
                const launchY = bayCenter.y - 10;
                drone.style.top = launchY + 'px';
                
                setTimeout(() => {
                    // 5. VICTORY LAP (Calibration Circle)
                    drone.classList.add('victory-lap');
                    tooltip.say('WELCOME', bayCenter.x, launchY);
                    
                    setTimeout(() => {
                        // 6. Hover BELOW button
                        const hoverY = bayCenter.y + 60;
                        drone.style.top = hoverY + 'px';
                        
                        setTimeout(() => {
                            if (document.body.classList.contains('help-mode-active')) {
                                drone.classList.add('hovering');
                                bay.classList.remove('bay-open');
                                window.showTooltip('WELCOME', { clientX: bayCenter.x, clientY: hoverY, stopPropagation: () => {} });
                            }
                        }, 800);
                    }, 800);
                }, 400);
            }, 600);
        } else {
            // Return Sequence
            bay.classList.add('bay-open');
            drone.classList.remove('hovering', 'victory-lap');
            
            setTimeout(() => {
                drone.style.left = bayCenter.x + 'px';
                drone.style.top = (bayCenter.y - 10) + 'px'; 
                
                setTimeout(() => {
                    drone.classList.add('docked');
                    void drone.offsetWidth; 
                    drone.style.top = (bayCenter.y + 10) + 'px';
                    
                    setTimeout(() => {
                        if (!document.body.classList.contains('help-mode-active')) {
                            bay.classList.remove('bay-open');
                            drone.classList.add('hidden');
                        }
                    }, 600);
                }, 800);
            }, 600);

            window.hideTooltip();
            window.closeHelp();
        }
    };

    window.showTooltip = (key, e) => { 
        if (e) e.stopPropagation(); 
        const target = e ? (e.target || e.currentTarget) : null;
        const x = e ? e.clientX : window.innerWidth / 2;
        const y = e ? e.clientY : window.innerHeight / 2;
        
        let dynamicData = null;
        if (target && target.classList.contains('q-preset-btn')) {
            const name = target.title;
            const presets = window.engine.persistence.getPresets();
            const p = presets[name];
            if (p) {
                dynamicData = { title: name, hint: p.description || 'System Preset', helpKey: 'QUICK_PRESET' };
            }
        }
        
        if (document.body.classList.contains('help-mode-active')) {
            // Emotive procedural movement: small jitter before flying
            tooltip.shake();
            setTimeout(() => {
                tooltip.flyDrone(x, y);
                setTimeout(() => {
                    tooltip.show(key, x, y, dynamicData, target);
                    const sayKey = DRONE_COMMENTS[key] ? key : 'SCAN';
                    tooltip.say(sayKey, x, y);
                }, 400);
            }, 100);
        } else {
            tooltip.show(key, x, y, dynamicData, target);
        }
    };
    window.openCodex = (key) => {
        const overlay = document.getElementById('codex-overlay');
        const iframe = document.getElementById('codex-iframe');
        if (!overlay || !iframe) return;

        // Construct URL with entry parameter
        const url = `./codex/index.html${key ? '?entry=' + encodeURIComponent(key) : ''}`;
        
        // If it's already the same URL, we just show the overlay
        // Otherwise we reload it
        if (iframe.src.indexOf(url) === -1) {
            iframe.src = url;
        }
        
        overlay.classList.remove('hidden');
        window.closeHelp();
        window.hideTooltip();
    };
    window.closeCodex = () => {
        const overlay = document.getElementById('codex-overlay');
        if (overlay) overlay.classList.add('hidden');
    };
    window.hideTooltip = () => {
        if (!tooltip.el.classList.contains('hidden')) {
            tooltip.hide();
            window._tooltipJustClosed = true;
            setTimeout(() => window._tooltipJustClosed = false, 200);
        }
    };

    window.notifyNewProposal = notifyNewProposal;
    window.renderEmergentSliders = renderEmergentSliders;

    document.addEventListener('click', (e) => {
        if (document.body.classList.contains('help-mode-active')) {
            const target = e.target;
            let helpKey = null;

            // ... (discovery logic)
            // 0. Check for data-help-key
            if (target.hasAttribute('data-help-key')) helpKey = target.getAttribute('data-help-key');
            else if (target.classList.contains('slider-label')) helpKey = target.innerText.replace(':', '').trim();
            else if (target.hasAttribute('onclick')) {
                const attr = target.getAttribute('onclick');
                const match = attr.match(/handleLawClick\(['"].*?['"],\s*['"](.*?)['"]/);
                if (match) helpKey = match[1];
            }
            if (!helpKey && target.hasAttribute('title')) {
                const title = target.getAttribute('title');
                if (HELP_DB[title]) helpKey = title;
            }
            if (!helpKey && target.innerText.length < 30) {
                const txt = target.innerText.trim();
                if (HELP_DB[txt]) helpKey = txt;
            }

            if (helpKey) {
                // If it's a UI-altering button (tabs, presets, accordions), check tap state
                const isUIButton = target.classList.contains('tab-link') || target.classList.contains('side-btn') || target.classList.contains('tier-1-header') || target.classList.contains('q-preset-btn');
                
                if (isUIButton && target.dataset.helpTapped === "true") {
                    // Second tap: let the original click happen (bubble up) but don't close tooltip
                    target.dataset.helpTapped = "false";
                    return; 
                }

                e.preventDefault();
                e.stopPropagation();
                
                if (isUIButton) {
                    // Mark as tapped
                    target.dataset.helpTapped = "true";
                    // Reset others
                    document.querySelectorAll('[data-help-tapped="true"]').forEach(el => { if(el !== target) el.dataset.helpTapped = "false"; });
                }

                // Add visual feedback
                target.classList.add('help-highlight');
                setTimeout(() => target.classList.remove('help-highlight'), 600);

                window.showTooltip(helpKey, e);
                return;
            }
        }
    }, true); // Use capture phase to intercept before other handlers

    document.addEventListener('mousedown', (e) => {
        // 1. Handle tooltip closing
        if (!tooltip.el.classList.contains('hidden')) {
            if (!tooltip.el.contains(e.target)) {
                window.hideTooltip();
                return; // Prioritize tooltip closing
            }
        }
        
        // 2. Handle help panel closing
        if (!helpPanel.el.classList.contains('hidden')) {
            if (!helpPanel.el.contains(e.target)) {
                window.closeHelp();
            }
        }

        if (window._tooltipJustClosed) return;

        // 3. Handle main panel closing
        const panel = document.getElementById('main-panel');
        if (panel && !panel.contains(e.target) && !panel.classList.contains('hidden')) {
            if (!e.target.closest('.squashed-drawer') && !e.target.closest('.tab-link') && !e.target.closest('.squashed-top-bar') && !e.target.closest('.playback-bar-container') && !e.target.closest('.tooltip-btn') && !e.target.closest('.help-panel')) {
                window.toggleMainPanel(false);
            }
        }
    });

    const handle = document.getElementById('drawer-resize-handle');
    let isResizing = false;
    const startResize = () => { isResizing = true; document.body.style.cursor = 'ns-resize'; };
    const doResize = (e) => {
        if (!isResizing) return;
        const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
        const vh = ((window.innerHeight - clientY) / window.innerHeight) * 100;
        const clamped = Math.max(20, Math.min(80, vh));
        document.documentElement.style.setProperty('--drawer-h', clamped + 'vh');
        emit('ui:resized');
    };
    const stopResize = () => { isResizing = false; document.body.style.cursor = 'default'; };

    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: true });
    window.addEventListener('mousemove', doResize);
    window.addEventListener('touchmove', doResize, { passive: false });
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchend', stopResize);

    window.handleLogSlider = (el, min, max, snapsStr, key, updateFn) => {
        const snaps = snapsStr.split(',').map(Number);
        const percent = parseFloat(el.value);
        const minLog = Math.log(min), maxLog = Math.log(max);
        let rawVal = Math.exp(minLog + (maxLog - minLog) * (percent / 100));
        let snapped = false;
        for (const snap of snaps) { if (rawVal > snap * 0.92 && rawVal < snap * 1.08) { rawVal = snap; snapped = true; el.value = ((Math.log(snap) - minLog) / (maxLog - minLog)) * 100; break; } }
        const finalVal = rawVal < 1 ? rawVal.toFixed(3) : (rawVal < 10 ? rawVal.toFixed(2) : Math.round(rawVal));
        if (updateFn === 'updatePhysics') emit('cmd:updatePhysics', { key, val: finalVal });
        else emit('cmd:updateWorld', { key, val: finalVal });
        const dId = (updateFn === 'updatePhysics' && (key === 'G' || key === 'dt')) ? `world-val-${key}` : `world-val-${key}`;
        const valEl = document.getElementById(dId); if (valEl) {
            valEl.innerText = finalVal;
            const row = valEl.closest('.slider-row');
            if (row) row.classList.toggle('zero-val', parseFloat(finalVal) === 0);
        }
    };

    setTimeout(() => { window.toggleTopBar(false); window.toggleMainPanel(false); }, 200);

    renderWorldAccordion(engine); renderSpeciesList(engine); renderDNAAccordion(engine); renderLawCodex(); renderToggleIcons();
    
    // Initial Scale Sync
    const grid = document.querySelector('.icon-grid');
    if (grid) {
        const modes = ['scale-hidden', 'scale-micro', 'scale-standard', 'scale-giant'];
        grid.classList.add(modes[engine.lawUIScale]);
    }
}

let activeInfoTab = 'physics';

export function renderWorldAccordion(engine) {
    const container = document.getElementById('world-accordion'); if (!container) return; container.innerHTML = '';
    const level = engine.complexityLevel || 0;
    const allWorldParams = [
        { name: 'Initial Population', key: 'initialCount', min: 1, max: 5000, val: engine.worldConfig.initialCount || 500, type: 'world' },
        { name: 'Distribution', key: 'distributionType', type: 'stepper', options: ['Grid', 'Soup', 'Big Bang', 'Bipolar', 'Galaxy'], val: engine.worldConfig.distributionType || 'Grid' },
        { name: 'Particle Count', key: 'count', min: 10, max: 50000, val: engine.worldConfig.count, type: 'world', log: true, snaps: [10, 100, 500, 1000, 5000, 10000, 50000] },
        { name: 'Entropy', key: 'entropy', min: 0, max: 1, step: 0.05, val: engine.worldConfig.entropy, type: 'world' },
        { name: 'Global Viscosity', key: 'globalViscosity', min: 0.5, max: 1, step: 0.01, val: engine.worldConfig.globalViscosity, type: 'world' },
        { name: 'Spawn Rate', key: 'spawnRate', min: 1, max: 1000, val: engine.worldConfig.spawnRate || 10, type: 'world', log: true, snaps: [1, 10, 50, 100, 500, 1000] },
        { name: 'Shape', key: 'shape', min: 0, max: 1, step: 0.05, val: engine.worldConfig.shape, type: 'world' },
        { name: 'Spread X', key: 'spreadX', min: 0.1, max: 1.0, step: 0.05, val: engine.worldConfig.spreadX, type: 'world' },
        { name: 'Spread Y', key: 'spreadY', min: 0.1, max: 1.0, step: 0.05, val: engine.worldConfig.spreadY, type: 'world' },
        { name: 'Spread Z', key: 'spreadZ', min: 0.1, max: 1.0, step: 0.05, val: engine.worldConfig.spreadZ, type: 'world' },
        { name: 'Order', key: 'order', min: 0, max: 1, step: 0.05, val: engine.worldConfig.order !== undefined ? engine.worldConfig.order : 0.5, type: 'world' },
        { name: 'Center Density', key: 'centerDensity', min: 0, max: 1, step: 0.05, val: engine.worldConfig.centerDensity || 0, type: 'world' },
        { name: 'Density Radius', key: 'densityRadius', min: 0.05, max: 0.5, step: 0.05, val: engine.worldConfig.densityRadius || 0.25, type: 'world' },
        { name: 'Density Multiplier', key: 'densityMultiplier', min: 1.0, max: 5.0, step: 0.5, val: engine.worldConfig.densityMultiplier || 2.0, type: 'world' },
        { name: 'Global G', key: 'G', min: 0.001, max: 100, val: engine.laws.pure.G, type: 'phys', log: true, snaps: [0.01, 0.1, 1, 10, 50, 100] },
        { name: 'Sim Speed', key: 'dt', min: 0.1, max: 1000, val: engine.laws.pure.dt, type: 'phys', log: true, snaps: [1, 10, 100, 500, 1000] },
        { name: 'Perspective', key: 'focalLength', min: 500, max: 10000, step: 100, val: engine.focalLength, type: 'engine' },
        { name: 'Base Size', key: 'baseSize', min: 0.1, max: 10, step: 0.1, val: engine.worldConfig.baseSize, type: 'world' },
        { name: 'Map Width (X)', key: 'dimX', min: 100, max: 50000, val: engine.worldConfig.dimX, type: 'world', log: true, snaps: [100, 500, 1000, 5000, 10000, 20000, 50000] },
        { name: 'Map Height (Y)', key: 'dimY', min: 100, max: 50000, val: engine.worldConfig.dimY, type: 'world', log: true, snaps: [100, 500, 1000, 5000, 10000, 20000, 50000] },
        { name: 'Map Depth (Z)', key: 'dimZ', min: 100, max: 50000, val: engine.worldConfig.dimZ, type: 'world', log: true, snaps: [100, 500, 1000, 5000, 10000, 20000, 50000] },
        { name: 'Cam Mode', key: 'cameraMode', type: 'select', options: ['panning', 'orbital'], val: engine.worldConfig.cameraMode },
        { name: 'Cam Lock', key: 'cameraLocked', type: 'toggle', val: engine.worldConfig.cameraLocked },
        { name: 'Wind', key: 'wind', min: -5.0, max: 5.0, step: 0.1, val: engine.worldConfig.wind, type: 'world' }
    ];
    let sectionIdx = 0;
    Object.entries(WORLD_CATEGORIES).forEach(([catName, config]) => {
        if (level < config.minLevel) return;
        const sectionId = `world-cat-${sectionIdx++}`;
        const wrapper = document.createElement('div'); wrapper.className = 'acc-wrapper' + (sectionIdx === 1 ? ' active' : ''); wrapper.id = sectionId;
        const header = document.createElement('div'); header.className = 'tier-1-header'; header.innerText = catName; 
        header.setAttribute('data-help-key', catName in WORLD_CATEGORIES ? 'WORLD_LAWS' : 'BIOLOGY_LAWS');
        header.onclick = (e) => {
            if (document.body.classList.contains('help-mode-active')) {
                window.showTooltip(header.getAttribute('data-help-key'), e);
            } else {
                window.toggleAccSection(sectionId);
            }
        };
        wrapper.appendChild(header);
        const content = document.createElement('div'); content.className = 'tier-3-container';
        config.keys.forEach(k => {
            const it = allWorldParams.find(p => p.key === k); if (!it) return;
            const row = document.createElement('div'); row.className = 'slider-row'; 
            if (it.val === 0) row.classList.add('zero-val');
            const updateFn = it.type === 'phys' ? 'updatePhysics' : 'updateWorld';
            
            if (it.type === 'select') {
                row.innerHTML = `<span class="slider-label">${it.name}: </span>
                    <select class="preset-input" onchange="window.updateWorld('${it.key}', this.value)" style="width:100%; font-size: 8px;">
                        ${it.options.map(opt => `<option value="${opt}" ${it.val === opt ? 'selected' : ''}>${opt.toUpperCase()}</option>`).join('')}
                    </select>`;
            } else if (it.type === 'toggle') {
                row.innerHTML = `<span class="slider-label">${it.name}: </span>
                    <div id="world-sw-${it.key}" class="sq-toggle ${it.val ? 'active' : ''}" 
                        onclick="window.engine.worldConfig['${it.key}'] = !window.engine.worldConfig['${it.key}']; this.classList.toggle('active'); this.innerText = window.engine.worldConfig['${it.key}'] ? 'LOCKED' : 'FREE';" 
                        style="width: 100%; text-align: center; margin: 5px 0;">
                        ${it.val ? 'LOCKED' : 'FREE'}
                    </div>`;
            } else if (it.type === 'stepper') {
                const dists = it.options;
                row.innerHTML = '<span class="slider-label">' + it.name + ": </span>" +
                    '<div class="stepper-control" style="display:flex;align-items:center;gap:6px;width:100%;">' +
                    '<button class="sq-btn" style="flex:0 0 28px;padding:2px;" onclick="window.cycleDistType(-1)">\u25C0</button>' +
                    '<span id="world-val-distributionType" style="flex:1;text-align:center;font-size:10px;letter-spacing:0.5px;">' + dists[dists.indexOf(it.val)].toUpperCase() + '</span>' +
                    '<button class="sq-btn" style="flex:0 0 28px;padding:2px;" onclick="window.cycleDistType(1)">\u25B6</button>' +
                    '</div>';
            } else if (it.log) {
                const minLog = Math.log(it.min), maxLog = Math.log(it.max), valLog = Math.log(it.val), percent = ((valLog - minLog) / (maxLog - minLog)) * 100;
                let notchesHtml = '<div class="slider-notches">' + it.snaps.map(snap => { const snapPct = ((Math.log(snap) - minLog) / (maxLog - minLog)) * 100; return `<div class="notch" style="left: ${snapPct}%;" data-val="${snap}"></div>`; }).join('') + '</div>';
                row.innerHTML = `<span class="slider-label" onclick="window.showTooltip('${it.name}', event)">${it.name}: </span><span id="world-val-${it.key}">${it.val}</span><div class="log-slider-container"><input type="range" min="0" max="100" step="0.1" value="${percent}" style="width: 100%;" oninput="window.handleLogSlider(this, ${it.min}, ${it.max}, '${it.snaps.join(',')}', '${it.key}', '${updateFn}')">${notchesHtml}</div>`;
            } else {
                row.innerHTML = `<span class="slider-label" onclick="window.showTooltip('${it.name}', event)">${it.name}: </span><span id="world-val-${it.key}">${it.val}</span><input type="range" min="${it.min}" max="${it.max}" step="${it.step}" value="${it.val}" style="width: 100%;" oninput="window.${updateFn}('${it.key}', this.value, 'world-val-${it.key}', this)">`;
            }
            content.appendChild(row);
        });
        wrapper.appendChild(content); container.appendChild(wrapper);
    });
}

export function renderSpeciesList(engine) {
    const list = document.getElementById('species-list'); if (!list) return; list.innerHTML = '';
    engine.species.forEach((s, idx) => {
        const div = document.createElement('div'); 
        const isActive = (idx === currentSpeciesIdx);
        const isSelected = selectedSpeciesIndices.has(idx);
        div.className = `species-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`;
        
        let checkboxHtml = '';
        if (selectionMode) {
            checkboxHtml = `<input type="checkbox" class="species-card-checkbox" ${isSelected ? 'checked' : ''} onclick="window.toggleSpeciesSelection(${idx}, event)">`;
        }

        div.innerHTML = `${checkboxHtml}<span>${s.name}</span> <div style="width:10px; height:10px; background:${s.color}"></div>`;
        div.onclick = () => window.selectSpecies(idx); list.appendChild(div);
    });
}

export function renderDNAAccordion(engine) {
    const container = document.getElementById('dna-accordion'); if (!container) return; container.innerHTML = '';
    const spec = engine.species[currentSpeciesIdx]; if (!spec) return;
    const level = engine.complexityLevel || 0;
    let sectionIdx = 0;
    Object.entries(DNA_CATEGORIES).forEach(([catName, config], idx) => {
        if (level < config.minLevel) return;
        const sectionId = `dna-cat-${sectionIdx++}`;
        const wrapper = document.createElement('div'); wrapper.className = 'acc-wrapper' + (sectionIdx === 1 ? ' active' : ''); wrapper.id = sectionId;
        const header = document.createElement('div'); header.className = 'tier-1-header'; header.innerText = catName; 
        header.setAttribute('data-help-key', catName in WORLD_CATEGORIES ? 'WORLD_LAWS' : 'BIOLOGY_LAWS');
        header.onclick = (e) => {
            if (document.body.classList.contains('help-mode-active')) {
                window.showTooltip(header.getAttribute('data-help-key'), e);
            } else {
                window.toggleAccSection(sectionId);
            }
        };
        wrapper.appendChild(header);
        const content = document.createElement('div'); content.className = 'tier-3-container';
        config.keys.forEach(name => {
            const dnaIdx = DNA_META.indexOf(name); if (dnaIdx === -1) return;
            const val = spec.dna[dnaIdx]; const row = document.createElement('div'); row.className = 'slider-row';
            if (val === 0) row.classList.add('zero-val');
            
            if (name === 'Force') {
                const absVal = Math.abs(val) || 0.001;
                const minLog = Math.log(0.001), maxLog = Math.log(100);
                const percent = ((Math.log(absVal) - minLog) / (maxLog - minLog)) * 50;
                const totalPercent = val >= 0 ? 50 + percent : 50 - percent;
                
                row.innerHTML = `<span class="slider-label" onclick="window.showTooltip('${name}', event)">${name}: </span><span id="dna-val-${dnaIdx}">${val.toFixed(2)}</span>
                    <input type="range" min="0" max="100" step="0.1" value="${totalPercent}" style="width: 100%;" 
                    oninput="window.handleDNAForceLog(this, ${dnaIdx}, 'dna-val-${dnaIdx}')">`;
            } else {
                row.innerHTML = `<span class="slider-label" onclick="window.showTooltip('${name}', event)">${name}: </span><span id="dna-val-${dnaIdx}">${val.toFixed(2)}</span><input type="range" min="${DNA_RANGES[dnaIdx].min}" max="${DNA_RANGES[dnaIdx].max}" step="0.01" value="${val}" style="width: 100%;" oninput="window.updateDNA(${currentSpeciesIdx}, ${dnaIdx}, this.value, 'dna-val-${dnaIdx}', this, '${name}')">`;
            }
            content.appendChild(row);
        });
        wrapper.appendChild(content); container.appendChild(wrapper);
    });
}

window.addSpecies = () => emit('cmd:addSpecies');
window.selectSpecies = (idx) => { 
    if (selectionMode) {
        window.toggleSpeciesSelection(idx);
    } else {
        currentSpeciesIdx = idx; 
        selectedSpeciesIndices.clear();
        selectedSpeciesIndices.add(idx);
        renderSpeciesList(window.engine); 
        renderDNAAccordion(window.engine); 
        emit('ui:resized');
    }
};

let lastLogRenderedCount = 0;
function renderNarrativeLog() {
    const container = document.getElementById('narrative-log'); if (!container) return;
    if (lastLogRenderedCount === 0) container.innerHTML = '<h3>System Log</h3>';
    const newEntries = narrativeHistory.slice(lastLogRenderedCount);
    newEntries.reverse().forEach(entry => {
        const div = document.createElement('div'); div.className = 'log-entry';
        div.innerHTML = `<span class="log-time">[${entry.time}]</span> <span>${entry.text}</span>`;
        const h3 = container.querySelector('h3'); if (h3 && h3.nextSibling) container.insertBefore(div, h3.nextSibling); else container.appendChild(div);
    });
    lastLogRenderedCount = narrativeHistory.length;
}

export function updateHUD(fps, aliveCount, maxCount, simStep = 0) {
    const fpsEl = document.getElementById('fps'), aliveEl = document.getElementById('p-alive'), maxEl = document.getElementById('p-max'), stepEl = document.getElementById('sim-step');
    if (aliveEl) aliveEl.innerText = isNaN(aliveCount) ? 0 : aliveCount;
    if (maxEl) maxEl.innerText = isNaN(maxCount) ? 0 : maxCount;
    if (stepEl) stepEl.innerText = isNaN(simStep) ? 0 : simStep;
}
export function updateParticleHUD(data) {
    const s = document.getElementById('p-info-species'), m = document.getElementById('p-info-mass'), a = document.getElementById('p-info-age'), e = document.getElementById('p-info-energy'), v = document.getElementById('p-info-vel'), p = document.getElementById('p-info-pos');
    if (s) s.innerText = data.species;
    if (m) m.innerText = data.mass;
    if (a) a.innerText = data.age;
    if (e) e.innerText = data.energy;
    if (v) v.innerText = data.vel;
    if (p) p.innerText = `${data.pos.x}, ${data.pos.y}, ${data.pos.z}`;
}

export function syncUI(laws) {
    const groups = ['pure', 'biol', 'chem', 'thermo', 'meta'];
    groups.forEach(g => {
        if (!laws[g]) return;
        Object.keys(laws[g]).forEach(k => {
            const val = laws[g][k];
            const el = document.getElementById(`syn-${k}`); 
            if(el) el.classList.toggle('active', !!val); 

            const infoSw = document.getElementById(`info-sw-${k}`);
            if(infoSw) {
                infoSw.classList.toggle('active', !!val);
                infoSw.innerText = val ? 'ACTIVE' : 'OFF';
            }
        });
    });
}

let lastInsightsHash = "";
export function renderInsights(insights) {
    const el = document.getElementById('insight-panel'); if (!el) return;
    const currentHash = insights.map(i => i.id).join("|"); if (currentHash === lastInsightsHash) return; lastInsightsHash = currentHash;
    el.innerHTML = insights.map(i => `<div class="insight ${i.type} menu-chunk"><div class="bolt t-l"></div><div class="bolt t-r"></div><div class="bolt b-l"></div><div class="bolt b-r"></div><div class="chunk-inner"><strong>${i.type.toUpperCase()}</strong> ${i.message}</div></div>`).join('');
}

export function renderSuggestions(suggestions) {
    const el = document.getElementById('suggestions-panel'); if (!el) return;
    el.innerHTML = suggestions.map(s => `<div class="suggestion-card menu-chunk"><div class="bolt t-l"></div><div class="bolt t-r"></div><div class="bolt b-l"></div><div class="bolt b-r"></div><div class="chunk-inner"><h4>${s.label}</h4><p>${s.reason}</p><button class="suggestion-btn" onclick='window.applySuggestion(${JSON.stringify(s.action)})'>✅</button></div></div>`).join('');
}

window.applySuggestion = (action) => {
    if (action.type === 'law') { const current = window.engine.laws[action.key]; emit('cmd:updatePhysics', { key: action.key, val: current + action.delta }); }
    else if (action.type === 'dna') { const dnaIdx = DNA_META.indexOf(action.key); if (dnaIdx !== -1) { window.engine.species.forEach((s, sIdx) => { const current = s.dna[dnaIdx]; emit('cmd:updateDNA', { sIdx, rIdx: dnaIdx, val: current + action.delta }); }); } }
    window.selectSpecies(currentSpeciesIdx);
    const el = document.getElementById('suggestions-panel'); if (el) el.innerHTML = '';
};

export function renderNarrative(text) {
    const el = document.getElementById('narrative-panel'); if (!el) return;
    el.innerText = text; el.classList.remove('fading');
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (narrativeHistory.length === 0 || narrativeHistory[narrativeHistory.length-1].text !== text) { narrativeHistory.push({ time, text }); if (narrativeHistory.length > 100) narrativeHistory.shift(); }
    if (window._narrativeTimer) clearTimeout(window._narrativeTimer); window._narrativeTimer = setTimeout(() => el.classList.add('fading'), 4000);
}

export function updateTimelineUI(max) {
    const slider = document.getElementById('timeline-slider'); if (!slider) return; slider.max = max;
    if (slider.value == max - 1 || max == 1) { slider.value = max; document.getElementById('timeline-label').innerText = 'LIVE'; }
}

window.onTimelineScrub = (e) => { 
    const val = parseInt(e.target.value), max = parseInt(e.target.max), label = document.getElementById('timeline-label'); 
    if (val === max) label.innerText = 'LIVE'; 
    else { 
        label.innerText = 'REPLAY: ' + val; 
        window.engine.timelineEngine.restore(val, false); 
    } 
};

window.onTimelineScrubEnd = (e) => {
    const val = parseInt(e.target.value), max = parseInt(e.target.max);
    if (val < max) {
        window.engine.timelineEngine.restore(val, true); // Sync worker when scrub ends
    }
};

setTimeout(() => { 
    const slider = document.getElementById('timeline-slider'); 
    if (slider) {
        slider.oninput = window.onTimelineScrub;
        slider.onchange = window.onTimelineScrubEnd;
    }
}, 100);

export function notifyNewProposal(name) {
    const el = document.getElementById('proposal-panel'); const p = window.engine.emergentEngine.pending[0]; if (!p) return;
    el.innerHTML = `<div class="menu-chunk"><div class="bolt t-l"></div><div class="bolt t-r"></div><div class="bolt b-l"></div><div class="bolt b-r"></div><div class="chunk-inner"><h3>NEW LAW DETECTED</h3><p><strong>${p.name}</strong></p><p style="font-size: 8px;">${p.def.description}</p><div class="proposal-actions"><button class="accept" onclick="window.acceptParam('${p.key}')" title="Accept">✅</button><button class="reject" onclick="window.rejectParam('${p.key}')" title="Reject">❌</button></div></div></div>`;
    el.classList.remove('hidden');
}

window.acceptParam = (key) => {
    const p = window.engine.emergentEngine.pending.find(x => x.key === key);
    if (p) { window.engine.emergentEngine.spawnAcceptedParam(p); window.engine.emergentEngine.pending = window.engine.emergentEngine.pending.filter(x => x.key !== key); renderNarrative('New law accepted: ' + p.name); }
    document.getElementById('proposal-panel').classList.add('hidden');
};

window.rejectParam = (key) => { window.engine.emergentEngine.rejected.add(key); window.engine.emergentEngine.pending = window.engine.emergentEngine.pending.filter(x => x.key !== key); document.getElementById('proposal-panel').classList.add('hidden'); };

export function renderEmergentSliders() {
    const settingsTab = document.getElementById('tab-settings'); let container = document.getElementById('emergent-sliders');
    if (!container) { container = document.createElement('div'); container.id = 'emergent-sliders'; container.className = 'settings-group'; settingsTab.appendChild(container); }
    container.innerHTML = '<h3>EMERGENT_LAWS</h3>';
    Object.entries(window.engine.emergentEngine.metaParams).forEach(([key, val]) => {
        const row = document.createElement('div'); row.className = 'slider-row'; const displayName = key.replace(/_/g, ' ');
        row.innerHTML = `<span class="slider-label" onclick="window.showTooltip('${displayName}', event)">${displayName}: </span><span id="meta-val-${key}">${val.toFixed(2)}</span><input type="range" min="0" max="1" step="0.01" value="${val}" style="width: 100%;" oninput="window.updateMetaParam('${key}', this.value)">`;
        container.appendChild(row);
    });
}

window.updateMetaParam = (key, val) => { window.engine.emergentEngine.metaParams[key] = parseFloat(val); document.getElementById(`meta-val-${key}`).innerText = val; };

export function updatePlaybackUI(mode, paused) {
    const btn = document.getElementById('play-pause-btn'); if (btn) btn.innerText = paused ? '▶' : '⏸';
    document.querySelectorAll('.play-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.play-btn'); btns.forEach(b => { if (b.title.toLowerCase().includes(mode)) b.classList.add('active'); if (mode === 'forward' && b.title === 'Play') b.classList.add('active'); });
}

export function renderDNAAnalytics(engine) {
    const container = document.getElementById('dna-analytics-container');
    if (!container) return;
    
    const counts = new Array(engine.species.length).fill(0);
    const colorGroups = []; // Array of { r, g, b, count }
    const COLOR_THRESHOLD = 30; // Max distance to group colors
    let totalAlive = 0;

    const STRIDE = 64; 
    if (engine.particles) {
        for (let i = 0; i < engine.worldConfig.count; i++) {
            const ptr = i * STRIDE;
            if (engine.particles[ptr + STRIDE_INDEXES.DEAD] === 0) {
                totalAlive++;
                const sIdx = Math.floor(engine.particles[ptr + STRIDE_INDEXES.SPECIES_ID]);
                if (counts[sIdx] !== undefined) counts[sIdx]++;

                // Track colors from visuals buffer if available, or species defaults
                const spec = engine.species[sIdx];
                if (spec && spec.rgb) {
                    const [r, g, b] = spec.rgb.map(v => Math.round(v * 255));
                    let found = false;
                    for (const group of colorGroups) {
                        const dist = Math.sqrt((r - group.r)**2 + (g - group.g)**2 + (b - group.b)**2);
                        if (dist < COLOR_THRESHOLD) {
                            group.count++;
                            found = true;
                            break;
                        }
                    }
                    if (!found) colorGroups.push({ r, g, b, count: 1 });
                }
            }
        }
    }

    if (totalAlive === 0) totalAlive = 1;

    let html = `<h3>GENETIC_DRIFT</h3>`;
    engine.species.forEach((s, idx) => {
        const pct = ((counts[idx] / totalAlive) * 100).toFixed(1);
        html += `
            <div class="dna-stat-row">
                <div class="dna-stat-label">
                    <span style="color:${s.color}">■</span> ${s.name}
                </div>
                <div class="dna-stat-bar-bg">
                    <div class="dna-stat-bar" style="width:${pct}%; background:${s.color}"></div>
                </div>
                <div class="dna-stat-val">${counts[idx]} (${pct}%)</div>
            </div>
        `;
    });

    html += `<h3 style="margin-top:25px;">COLOUR_DIVERSITY</h3>`;
    
    // Sort color groups by count descending
    const sortedColors = colorGroups.sort((a, b) => b.count - a.count).slice(0, 12); // Show top 12
    
    sortedColors.forEach((group) => {
        const pct = ((group.count / totalAlive) * 100).toFixed(1);
        const rgbStr = `${group.r},${group.g},${group.b}`;
        const color = `rgb(${rgbStr})`;
        html += `
            <div class="dna-stat-row">
                <div class="dna-stat-label" style="font-family:monospace; font-size:8px;">
                    <span style="color:${color}">■</span> ${rgbStr}
                </div>
                <div class="dna-stat-bar-bg">
                    <div class="dna-stat-bar" style="width:${pct}%; background:${color}"></div>
                </div>
                <div class="dna-stat-val">${group.count} (${pct}%)</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

export function updateDNAGraphs(engine) {
    const tab = document.getElementById('tab-dna');
    if (!tab || !tab.classList.contains('active')) return;
    drawPopulationGraph(engine);
    drawScatterPlot(engine);
}

function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return null;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    return { ctx, width: rect.width, height: rect.height };
}

function drawPopulationGraph(engine) {
    const canvas = document.getElementById('pop-line-graph');
    if (!canvas || engine.history.population.length < 2) return;
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const history = engine.history.population;
    const maxPoints = engine.history.maxPoints;
    const pad = 10;

    
    // Find max value for scaling
    let maxVal = 0;
    history.forEach(h => h.counts.forEach(c => { if (c > maxVal) maxVal = c; }));
    if (maxVal === 0) maxVal = 1;

    engine.species.forEach((s, sIdx) => {
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        
        history.forEach((h, i) => {
            const x = pad + (i / (maxPoints - 1)) * (width - pad * 2);
            const y = height - pad - (h.counts[sIdx] / maxVal) * (height - pad * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad); ctx.lineTo(pad, height - pad); ctx.lineTo(width - pad, height - pad);
    ctx.stroke();
}

function drawScatterPlot(engine) {
    const canvas = document.getElementById('mass-nrg-scatter');
    if (!canvas || !engine.particles) return;
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    
    const STRIDE = 64;
    const pad = 15;
    
    // Limits for normalization
    let maxMass = 50, maxNrg = 100;

    for (let i = 0; i < engine.worldConfig.count; i++) {
        const ptr = i * STRIDE;
        if (engine.particles[ptr + STRIDE_INDEXES.DEAD] === 0) {
            const mass = engine.particles[ptr + STRIDE_INDEXES.MASS];
            const nrg = engine.particles[ptr + STRIDE_INDEXES.ENERGY];
            const sIdx = Math.floor(engine.particles[ptr + STRIDE_INDEXES.SPECIES_ID]);
            const species = engine.species[sIdx] || { color: '#fff' };

            const x = pad + (Math.min(mass, maxMass) / maxMass) * (width - pad * 2);
            const y = height - pad - (Math.min(nrg, maxNrg) / maxNrg) * (height - pad * 2);

            ctx.fillStyle = species.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;

    // Draw axes labels
    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.fillText('MASS →', width - 40, height - 5);
    ctx.save();
    ctx.translate(10, 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('NRG →', 0, 0);
    ctx.restore();
}

// --- PRESETS UI ---

export function renderPresetsInline(engine) {
    const container = document.getElementById('presets-list-inline');
    if (!container) return;
    const presets = engine.persistence.getPresets();
    const names = Object.keys(presets);
    if (names.length === 0) {
        container.innerHTML = '<div style="padding:15px; opacity:0.3; font-style:italic; font-size:9px; letter-spacing:1px;">NO_DATA_FOUND</div>';
        return;
    }
    let html = '';
    names.forEach(name => {
        html += `
            <div class="preset-item" style="border:none; background:rgba(255,255,255,0.03); margin-bottom:2px;">
                <span style="letter-spacing:1px;">${name.toUpperCase()}</span>
                <button class="btn tiny-btn" style="color:var(--red-bright); border-color:#333;" onclick="window.deletePreset('${name}')">X</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.openSavePresetDialog = () => {
    const dialog = document.getElementById('preset-save-dialog');
    const input = document.getElementById('preset-name-input');
    if (dialog) dialog.classList.remove('hidden');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
    }
};

window.closeSavePresetDialog = () => {
    const dialog = document.getElementById('preset-save-dialog');
    if (dialog) dialog.classList.add('hidden');
};

window.confirmSavePreset = () => {
    const input = document.getElementById('preset-name-input');
    const name = input ? input.value.trim() : "";
    if (!name) return;
    emit('cmd:savePreset', name);
    window.closeSavePresetDialog();
};

window.deletePreset = (name) => {
    if (confirm(`PERMANENTLY DELETE PRESET "${name}"?`)) {
        emit('cmd:deletePreset', name);
    }
};

window.openLoadPresetDialog = () => {
    const dialog = document.getElementById('preset-load-dialog');
    if (dialog) {
        renderLoadPresetList(window.engine);
        dialog.classList.remove('hidden');
    }
};

window.closeLoadPresetDialog = () => {
    const dialog = document.getElementById('preset-load-dialog');
    if (dialog) dialog.classList.add('hidden');
};

function renderLoadPresetList(engine) {
    const container = document.getElementById('load-preset-list');
    if (!container) return;
    const presets = engine.persistence.getPresets();
    const names = Object.keys(presets);
    let html = '';
    names.forEach(name => {
        const sel = selectedPresetName === name ? 'selected' : '';
        html += `<div class="preset-item ${sel}" onclick="window.selectPresetForLoad('${name}')">${name.toUpperCase()}</div>`;
    });
    container.innerHTML = html || '<div style="padding:40px; text-align:center; opacity:0.3; font-size:9px;">[EMPTY_ARCHIVE]</div>';
}

window.selectPresetForLoad = (name) => {
    selectedPresetName = name;
    renderLoadPresetList(window.engine);
    renderCategoryGrid(window.engine, name);
};

function renderCategoryGrid(engine, presetName) {
    const container = document.getElementById('category-selection-grid');
    if (!container) return;
    const presets = engine.persistence.getPresets();
    const preset = presets[presetName];
    if (!preset) {
        container.innerHTML = '';
        return;
    }

    const categories = [
        { id: 'laws_pure', label: 'CORE_PHYSICS' },
        { id: 'laws_biol', label: 'BIOLOGY_SYS' },
        { id: 'worldConfig', label: 'WORLD_CONFIG' }
    ];
    
    preset.species.forEach((s, idx) => {
        categories.push({ id: `species_${idx}`, label: `SPEC: ${s.name.toUpperCase()}` });
    });

    if (selectedPresetCategories.size === 0) {
        categories.forEach(c => selectedPresetCategories.add(c.id));
    }

    let html = '';
    categories.forEach(cat => {
        const sel = selectedPresetCategories.has(cat.id) ? 'selected' : '';
        html += `<div class="category-item ${sel}" onclick="window.handleCategoryClick('${cat.id}', event)">${cat.label}</div>`;
    });
    container.innerHTML = html;
}

let lastCategoryClick = { id: null, time: 0, count: 0 };

window.handleCategoryClick = (id, event) => {
    const now = Date.now();
    if (lastCategoryClick.id === id && (now - lastCategoryClick.time) < 400) {
        lastCategoryClick.count++;
    } else {
        lastCategoryClick.id = id;
        lastCategoryClick.count = 1;
    }
    lastCategoryClick.time = now;

    if (lastCategoryClick.count >= 2) {
        selectedPresetCategories.clear();
        selectedPresetCategories.add(id);
    } else {
        if (selectedPresetCategories.has(id)) {
            selectedPresetCategories.delete(id);
        } else {
            selectedPresetCategories.add(id);
        }
    }
    renderCategoryGrid(window.engine, selectedPresetName);
};

window.selectAllPresetCategories = () => {
    const presets = window.engine.persistence.getPresets();
    const preset = presets[selectedPresetName];
    if (!preset) return;

    selectedPresetCategories.add('laws_pure');
    selectedPresetCategories.add('laws_biol');
    selectedPresetCategories.add('worldConfig');
    preset.species.forEach((_, idx) => selectedPresetCategories.add(`species_${idx}`));
    renderCategoryGrid(window.engine, selectedPresetName);
};

window.confirmLoadPreset = () => {
    if (!selectedPresetName) return;
    emit('cmd:loadPreset', { name: selectedPresetName, categories: Array.from(selectedPresetCategories) });
    window.closeLoadPresetDialog();
    
    // Also close the fullscreen archive if it's open
    const manager = document.getElementById('preset-manager');
    if (manager && !manager.classList.contains('hidden')) {
        window.togglePresetManager();
    }
};

window.addEventListener('ui:presetsUpdated', () => {
    renderPresetsInline(window.engine);
    const loadDialog = document.getElementById('preset-load-dialog');
    if (loadDialog && !loadDialog.classList.contains('hidden')) {
        renderLoadPresetList(window.engine);
    }
});

// --- ADVANCED PRESET MANAGER & PREVIEW ENGINE ---

class PreviewEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 600;
        this.particles = null;
        this.laws = null;
        this.worldConfig = null;
        this.species = null;
        this.active = false;
        this.frame = 0;
    }

    start(preset) {
        this.laws = preset.laws_pure; // We use laws_pure as the base for preview
        this.worldConfig = preset.worldConfig;
        this.species = preset.species;
        
        // Simplified particle set for preview (500 particles)
        const count = Math.min(500, this.worldConfig.count);
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const spec = this.species[i % this.species.length];
            this.particles.push({
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                vx: 0, vy: 0,
                color: spec.color || '#fff'
            });
        }
        this.active = true;
        this.loop();
    }

    stop() {
        this.active = false;
        if (this.ctx) this.ctx.clearRect(0, 0, 600, 600);
    }

    loop() {
        if (!this.active) return;
        
        // 10x SPEED LOOP (10 steps per frame)
        for (let s = 0; s < 10; s++) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        if (!this.particles) return;
        const G = 0.5; // Fixed high gravity for preview drama
        const friction = 0.98;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Basic Centripetal Force (Simulating some "life")
            const distSq = p1.x * p1.x + p1.y * p1.y;
            const dist = Math.sqrt(distSq) || 1;
            p1.vx -= (p1.x / dist) * 0.1;
            p1.vy -= (p1.y / dist) * 0.1;

            p1.x += p1.vx;
            p1.y += p1.vy;
            p1.vx *= friction;
            p1.vy *= friction;

            // Boundary wrap
            if (p1.x > 300) p1.x = -300;
            if (p1.x < -300) p1.x = 300;
            if (p1.y > 300) p1.y = -300;
            if (p1.y < -300) p1.y = 300;
        }
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(0, 0, 600, 600);
        
        this.ctx.save();
        this.ctx.translate(300, 300);
        
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 2, 2);
        });
        this.ctx.restore();
    }
}

let previewEngine = null;

window.togglePresetManager = () => {
    const manager = document.getElementById('preset-manager');
    const isHidden = manager.classList.toggle('hidden');
    
    if (!isHidden) {
        document.body.classList.add('overlay-active');
        if (!previewEngine) previewEngine = new PreviewEngine('preview-canvas');
        renderArchiveList(window.engine);
    } else {
        document.body.classList.remove('overlay-active');
        if (previewEngine) previewEngine.stop();
    }
};

function renderArchiveList(engine) {
    const container = document.getElementById('archive-list');
    if (!container) return;
    const presets = engine.persistence.getPresets();
    const names = Object.keys(presets);
    const defaultNames = Object.keys(engine.persistence.getDefaultPresets());
    
    let html = '';
    names.forEach(name => {
        const sel = selectedPresetName === name ? 'selected' : '';
        const isDefault = defaultNames.includes(name);
        html += `
            <div class="preset-item ${sel}" onclick="window.selectPresetForArchive('${name}')">
                <div style="display:flex; flex-direction:column;">
                    <span style="letter-spacing:1px;">${name.toUpperCase()}</span>
                    <span style="font-size:7px; color:#444;">ID: ${btoa(name).slice(0,8)}</span>
                </div>
                ${isDefault ? '' : `<button class="btn tiny-btn" onclick="event.stopPropagation(); window.deletePreset('${name}'); renderArchiveList(window.engine);">DEL</button>`}
            </div>
        `;
    });
    container.innerHTML = html || '<div style="padding:40px; text-align:center; opacity:0.3; font-size:9px;">[EMPTY_ARCHIVE]</div>';
}

window.selectPresetForArchive = (name) => {
    selectedPresetName = name;
    renderArchiveList(window.engine);
    
    const presets = window.engine.persistence.getPresets();
    const preset = presets[name];
    if (preset) {
        renderComplexDetails(preset);
        renderArchiveCategoryGrid(window.engine, name);
        if (previewEngine) {
            previewEngine.stop();
            previewEngine.start(preset);
        }
    }
};

function renderComplexDetails(preset) {
    const container = document.getElementById('archive-details'); 
    if (!container) return;

    let html = `<div class="pane-header">CONFIG_DECRYPTION // ${preset.name?.toUpperCase() || 'UNTITLED'}</div>`;
    html += `<div class="details-grid" style="padding: 20px;">`;
    
    // LAWS
    html += `<div class="details-section">
        <div class="details-section-title">PHYSICAL_LAWS</div>`;
    Object.entries(preset.laws_pure).forEach(([k, v]) => {
        html += `<div class="details-item">${k.toUpperCase()} <span>${v ? 'ACTIVE' : 'OFF'}</span></div>`;
    });
    html += `</div>`;

    // WORLD
    html += `<div class="details-section">
        <div class="details-section-title">WORLD_CONSTANTS</div>`;
    Object.entries(preset.worldConfig).forEach(([k, v]) => {
        html += `<div class="details-item">${k.toUpperCase()} <span>${v}</span></div>`;
    });
    html += `</div>`;

    // SPECIES
    html += `<div class="details-section">
        <div class="details-section-title">BIOLOGICAL_BUFFER (${preset.species.length})</div>`;
    preset.species.forEach((s, idx) => {
        html += `<div class="details-item">UNIT_${idx} (DNA_SUM) <span>${s.dna.reduce((a,b)=>a+Math.abs(b),0).toFixed(1)}</span></div>`;
    });
    html += `</div></div>`;

    container.innerHTML = html;
}

function renderArchiveCategoryGrid(engine, presetName) {
    const container = document.getElementById('archive-category-grid');
    if (!container) return;
    const presets = engine.persistence.getPresets();
    const preset = presets[presetName];
    if (!preset) return;

    const categories = [
        { id: 'laws_pure', label: 'PHYSICS' },
        { id: 'laws_biol', label: 'BIOLOGY' },
        { id: 'worldConfig', label: 'WORLD' }
    ];
    preset.species.forEach((s, idx) => {
        categories.push({ id: `species_${idx}`, label: s.name.toUpperCase() });
    });

    if (selectedPresetCategories.size === 0) {
        categories.forEach(c => selectedPresetCategories.add(c.id));
    }

    let html = '';
    categories.forEach(cat => {
        const sel = selectedPresetCategories.has(cat.id) ? 'selected' : '';
        html += `<div class="category-item ${sel}" onclick="window.handleCategoryClick('${cat.id}', event); renderArchiveCategoryGrid(window.engine, '${presetName}');">${cat.label}</div>`;
    });
    container.innerHTML = html;
}

// Intercept existing load to close manager
const originalConfirmLoad = window.confirmLoadPreset;
window.confirmLoadPreset = () => {
    originalConfirmLoad();
    window.togglePresetManager();
};

// --- QUICK PRESETS & REFINED MANAGER LOGIC ---

window.toggleQuickPresets = () => {
    const container = document.getElementById('quick-presets-container');
    const arrow = document.getElementById('side-bar-arrow');
    const isHidden = container.classList.toggle('hidden');
    arrow.innerText = isHidden ? '▼' : '▲';
    if (!isHidden) renderQuickPresets(window.engine);
};

export function renderQuickPresets(engine) {
    const container = document.getElementById('quick-presets-container');
    if (!container) return;
    const presets = engine.persistence.getPresets();
    const names = Object.keys(presets).slice(0, 9); // 0 (PRIME) + 8 Synthesis/New ones
    
    let html = '';
    names.forEach((name, idx) => {
        const p = presets[name];
        html += `<button class="q-preset-btn" 
            onclick="window.quickLoadPreset('${name}')" 
            onmouseenter="window.showPresetTooltip('${name}', event)"
            onmouseleave="window.hidePresetTooltip()"
            data-help-key="QUICK_PRESET"
            title="${name}">${idx}</button>`;
    });
    container.innerHTML = html;
}

window.showPresetTooltip = (name, e) => {
    // If help mode is active, we let the click handler deal with it
    if (document.body.classList.contains('help-mode-active')) return;

    const presets = window.engine.persistence.getPresets();
    const p = presets[name];
    if (!p) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    tooltip.show(name, x, y, {
        title: name,
        hint: p.description || 'System Preset',
        helpKey: 'QUICK_PRESET'
    });
};

window.hidePresetTooltip = () => {
    // Only hide if not in help mode (where tooltips are persistent)
    if (!document.body.classList.contains('help-mode-active')) {
        tooltip.hide();
    }
};

window.quickLoadPreset = (name) => {
    // Quick load loads EVERYTHING by default
    const presets = window.engine.persistence.getPresets();
    const preset = presets[name];
    if (!preset) return;
    
    const categories = new Set(['laws_pure', 'laws_biol', 'laws_chem', 'laws_thermo', 'laws_meta', 'worldConfig']);
    preset.species.forEach((_, idx) => categories.add(`species_${idx}`));
    
    emit('cmd:loadPreset', { name, categories: Array.from(categories) });
    
    // Refresh UI components that might have changed
    renderWorldAccordion(window.engine);
    renderDNAAccordion(window.engine);
    renderSpeciesList(window.engine);
    syncUI(window.engine.laws);

    // Visual feedback
    const btn = Array.from(document.querySelectorAll('.q-preset-btn')).find(b => b.title === name);
    if (btn) {
        btn.style.borderColor = 'var(--red-bright)';
        setTimeout(() => btn.style.borderColor = '', 500);
    }
};

// ─── Chaos Derivation Drawer ───
let _derivationSelectedState = null;
let _derivationSelectedIndex = -1;

window.openChaosDerivationDrawer = () => {
    const drawer = document.getElementById('chaos-derivation-drawer');
    if (!drawer) return;
    if (!_derivationSelectedState) {
        alert('Long-press a world in the grid first to select it as the source.');
        return;
    }
    drawer.classList.remove('hidden');
};

window.closeChaosDerivationDrawer = () => {
    const drawer = document.getElementById('chaos-derivation-drawer');
    if (drawer) drawer.classList.add('hidden');
};

// Slider live updates
document.addEventListener('input', (e) => {
    if (e.target.id === 'derivation-dna-slider') {
        document.getElementById('derivation-dna-val').textContent = e.target.value + '%';
    } else if (e.target.id === 'derivation-law-slider') {
        document.getElementById('derivation-law-val').textContent = e.target.value + '%';
    } else if (e.target.id === 'derivation-world-slider') {
        document.getElementById('derivation-world-val').textContent = e.target.value + '%';
    }
});

// Method button toggling
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.derive-method-btn');
    if (btn) {
        document.querySelectorAll('.derive-method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
});

// Parent-side listener: receive chaos:select from child iframes
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'chaos:select') {
        _derivationSelectedState = e.data.data;
        // Try to determine which iframe index sent it
        const container = document.getElementById('chaos-grid-container');
        if (container) {
            const iframes = container.querySelectorAll('iframe');
            for (let i = 0; i < iframes.length; i++) {
                if (iframes[i].contentWindow === e.source) {
                    _derivationSelectedIndex = i;
                    break;
                }
            }
        }
        // Update source display
        const display = document.getElementById('derivation-source-display');
        if (display) {
            const nLaws = _derivationSelectedState.laws ? 
                Object.values(_derivationSelectedState.laws).reduce((sum, cat) => 
                    sum + Object.values(cat).filter(v => v === true).length, 0) : 0;
            display.textContent = `World #${_derivationSelectedIndex + 1} selected (${_derivationSelectedState.species?.length || 0} species, ${nLaws} active laws)`;
            display.style.borderColor = '#4488ff';
        }
    }
});

window.applyChaosDerivation = () => {
    if (!_derivationSelectedState) {
        alert('No source world selected. Long-press a world first.');
        return;
    }

    const dnaVar = parseInt(document.getElementById('derivation-dna-slider').value) / 100;
    const lawVar = parseInt(document.getElementById('derivation-law-slider').value) / 100;
    const worldVar = parseInt(document.getElementById('derivation-world-slider').value) / 100;
    const deriveDNA = document.getElementById('derive-dna').checked;
    const deriveLaws = document.getElementById('derive-laws').checked;
    const deriveWorld = document.getElementById('derive-world').checked;
    const method = document.querySelector('.derive-method-btn.active')?.dataset.method || 'additive';

    const container = document.getElementById('chaos-grid-container');
    if (!container) return;
    const iframes = container.querySelectorAll('iframe');

    iframes.forEach((iframe, idx) => {
        if (idx === _derivationSelectedIndex) return; // Keep source unchanged
        if (!iframe.contentWindow) return;

        // Deep clone the selected state
        const derived = JSON.parse(JSON.stringify(_derivationSelectedState));

        // Apply variance
        if (deriveDNA && derived.species) {
            derived.species.forEach((s) => {
                if (!s.dna) return;
                s.dna = s.dna.map((v, i) => {
                    const range = window?.engine?.constructor?.DNA_RANGES ? 
                        window.engine.constructor.DNA_RANGES[i] : { min: 0, max: 1 };
                    const rMin = range?.min ?? 0;
                    const rMax = range?.max ?? 1;
                    const spread = (rMax - rMin) * dnaVar;
                    let noise;
                    if (method === 'additive') {
                        noise = (Math.random() - 0.5) * 2 * spread;
                    } else if (method === 'multiplicative') {
                        noise = v * (Math.random() - 0.5) * 2 * dnaVar;
                    } else { // gaussian
                        const u1 = Math.random(), u2 = Math.random();
                        noise = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2) * spread * 0.5;
                    }
                    return Math.max(rMin, Math.min(rMax, v + noise));
                });
            });
        }

        if (deriveLaws && derived.laws) {
            Object.keys(derived.laws).forEach(cat => {
                const group = derived.laws[cat];
                if (!group) return;
                Object.keys(group).forEach(k => {
                    if (typeof group[k] === 'boolean') {
                        // Flip with probability proportional to lawVar
                        if (Math.random() < lawVar * 0.5) {
                            group[k] = !group[k];
                        }
                    } else if (typeof group[k] === 'number') {
                        const noise = (Math.random() - 0.5) * 2 * lawVar * (group[k] || 0.5);
                        group[k] = Math.max(0, Math.min(2, group[k] + noise));
                    }
                });
            });
        }

        if (deriveWorld && derived.worldConfig) {
            Object.keys(derived.worldConfig).forEach(k => {
                const v = derived.worldConfig[k];
                if (typeof v === 'number' && k !== 'count') {
                    const noise = (Math.random() - 0.5) * 2 * worldVar * (Math.abs(v) || 1);
                    derived.worldConfig[k] = v + noise;
                }
            });
        }

        // Send derived state to this iframe
        try {
            iframe.contentWindow.postMessage({ type: 'chaos:derive', data: derived }, '*');
        } catch(e) {
            console.warn('Failed to send derived state to iframe', idx, e);
        }
    });

    window.closeChaosDerivationDrawer();
};

// ─── End Chaos Derivation Drawer ───

// Auto-render quick presets on update
window.addEventListener('ui:presetsUpdated', () => {
    renderQuickPresets(window.engine);
    renderArchiveList(window.engine);
});

// Initialize quick presets on setup
const originalSetupUI = setupUI;
export function setupUI_v2(engine) {
    originalSetupUI(engine);
    renderQuickPresets(engine);
}
// We don't want to redefine setupUI, we just call it in main.js
// Actually, I'll just add a listener or call it in main.js
