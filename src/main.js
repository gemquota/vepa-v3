import * as PIXI from 'pixi.js';
import { bus } from "./core/eventBus.js";
import { DNA_META, DNA_RANGES, DNA_STRIDE, DNA_PACK_MAX, DNA_INDEXES, STRIDE_INDEXES, PARTICLE_STRIDE } from './constants.js';
import { setupUI, updateHUD, syncUI, renderInsights, renderSuggestions, renderNarrative, updateTimelineUI, notifyNewProposal, updatePlaybackUI, renderWorldAccordion, renderDNAAccordion, renderSpeciesList, renderDNAAnalytics, updateDNAGraphs } from './ui.js';
import { InsightEngine } from './insightEngine.js';
import { NarrativeEngine } from './narrativeEngine.js';
import { TimelineEngine } from './timelineEngine.js';
import { LineageTracker } from './lineageTracker.js';
import { EmergentParamEngine } from './emergentParamEngine.js';
import { PersistenceEngine } from './persistenceEngine.js';
import { GoalSystem } from './goalEngine.js';
import { NarrativeConsciousness } from './narrativeConsciousness.js';
import { PersonalityCore } from './personalityEngine.js';
import { wireSystem } from './system/integration.js';

const STRIDE = PARTICLE_STRIDE;

class VepaEngine {
    constructor() {
        wireSystem();
        this.app = new PIXI.Application();
        try {
            this.dnaBuffer = new SharedArrayBuffer(12 * DNA_STRIDE * 4);
        } catch (e) {
            console.warn("SharedArrayBuffer not supported, falling back to ArrayBuffer.");
            this.dnaBuffer = new ArrayBuffer(12 * DNA_STRIDE * 4);
        }
        this.dnaView = new Uint16Array(this.dnaBuffer);
        this.paused = false;
        this.laws = { 
            pure: { grav: true, drag: true, jitter: false, coll: true, accr: false, wrap: true, void: false, bond: false, planetary: false, G: 1.0, dt: 1.0 },
            biol: { life: true, glow: false, affinity: false, reproduction: true, tracking: false, senescence: false, genotype: false, phenotype: false, ener: false, rad: false },
            chem: { cata: false, solv: false, acid: false, oxid: false, redu: false, poly: false, isom: false, chir: false, crys: false, allo: false },
            thermo: { heat: false, cold: false, conv: false, radi: false, subl: false, melt: false, boil: false, cond: false, depo: false, exop: false },
            meta: { time: false, dime: false, chao: false, orde: false, fate: false, will: false, soul: false, mind: false, tele: false, clai: false, preo: false, astr: false }
        };
        this.worldConfig = { 
            count: 2000, initialCount: 500, dimX: 500, dimY: 500, dimZ: 500, 
            spreadX: 1.0, spreadY: 1.0, spreadZ: 1.0, 
            order: 0.5, centerDensity: 0, densityRadius: 0.25, densityMultiplier: 2.0,
            baseSize: 1.0, spawnRate: 10, entropy: 0.1, shape: 0.5, distributionType: 'Grid',
            groundHeight: 0.9, cameraMode: 'panning', cameraLocked: false,
            globalViscosity: 0.98, wind: 0.0
        };
        this.zoom = 1.0; this.pan = { x: 0, y: 0, z: 0 }; 
        this.rotation = { x: 0, y: 0 };
        this.particles = null;
        this.simVersion = 0;
        this.simStep = 0;
        this.history = {
            population: [], // Array of { timestamp, speciesCounts: [] }
            colors: [],      // Array of { timestamp, colorCounts: [] }
            maxPoints: 100
        };
        this.historyThrottle = 0;
        this.focalLength = 3000;
        this.workerBusy = false;
        this.simAge = 0;
        this.complexityLevel = 10; 

        this.lineageTracker = new LineageTracker();
        this.species = this.createDefaultSpecies();

        this.insightEngine = new InsightEngine(this);
        this.narrativeEngine = new NarrativeEngine();
        this.timelineEngine = new TimelineEngine(this, this.insightEngine);
        this.emergentEngine = new EmergentParamEngine(this);
        this.goalSystem = new GoalSystem(this);
        this.narrativeConsciousness = new NarrativeConsciousness(this);
        this.personality = new PersonalityCore();
        this.persistence = new PersistenceEngine();
        this.persistence.load(this);
        this.selectedParticleIndex = -1;
        this.lawStateMemory = { pure: null, biol: null, chem: null, thermo: null, meta: null };
        this.lawUIScale = 2; // 0: Hidden, 1: Micro, 2: Standard, 3: Giant

        const urlParams = new URLSearchParams(window.location.search);
        const isChaos = urlParams.get('chaos');
        const basePreset = urlParams.get('base');

        if (isChaos && basePreset) {
            this.isChaosMode = true;
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'sim-canvas';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            
            const resize = () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            // Relay all pointer interactions to parent for tap/long-press detection
            const _buildState = () => ({
                laws: JSON.parse(JSON.stringify(this.laws)),
                worldConfig: JSON.parse(JSON.stringify(this.worldConfig)),
                species: this.species.map(s => ({ 
                    name: s.name, dna: [...s.dna], rgb: [...s.rgb], color: s.color, id: s.id 
                }))
            });
            let chaosPointerId = 0;
            let chaosHoldTimer = null;
            const onPointerDown = (e) => {
                chaosPointerId = (e.pointerId || 0);
                try { window.parent.postMessage({ type: 'chaos:pointer-down', data: { pointerId: chaosPointerId } }, '*'); } catch(ex) {}
                // Start hold timer (400ms → fullscreen)
                chaosHoldTimer = setTimeout(() => {
                    chaosHoldTimer = null;
                    try { window.parent.postMessage({ type: 'chaos:hold-start', data: null }, '*'); } catch(ex) {}
                }, 400);
            };
            const onPointerUp = (e) => {
                if (chaosPointerId === (e.pointerId || 0)) {
                    if (chaosHoldTimer) {
                        clearTimeout(chaosHoldTimer);
                        chaosHoldTimer = null;
                    } else {
                        try { window.parent.postMessage({ type: 'chaos:hold-end', data: _buildState() }, '*'); } catch(ex) {}
                    }
                    try { window.parent.postMessage({ type: 'chaos:pointer-up', data: _buildState() }, '*'); } catch(ex) {}
                }
            };
            const onPointerCancel = () => {
                if (chaosHoldTimer) {
                    clearTimeout(chaosHoldTimer);
                    chaosHoldTimer = null;
                }
                try { window.parent.postMessage({ type: 'chaos:hold-end', data: null }, '*'); } catch(ex) {}
            };
            this.canvas.addEventListener('pointerdown', onPointerDown);
            this.canvas.addEventListener('pointerup', onPointerUp);
            this.canvas.addEventListener('pointercancel', onPointerCancel);
            this.canvas.addEventListener('pointerleave', onPointerCancel);

            // Listen for commands from parent
            window.addEventListener('message', (e) => {
                if (e.data && e.data.type === 'chaos:derive') {
                    this.receiveDerivedState(e.data.data);
                }
                if (e.data && e.data.type === 'chaos:request-state') {
                    try { window.parent.postMessage({ type: 'chaos:state-snapshot', data: {
                        laws: JSON.parse(JSON.stringify(this.laws)),
                        worldConfig: JSON.parse(JSON.stringify(this.worldConfig)),
                        species: this.species.map(s => ({ 
                            name: s.name, dna: [...s.dna], rgb: [...s.rgb], color: s.color, id: s.id 
                        }))
                    }}, '*'); } catch(ex) {}
                }
            });

            this.worker = new Worker(new URL('./worker/physics.worker.js', import.meta.url), { type: 'module' });
            this.worker.onmessage = (e) => this.handleWorkerMessage(e);
            
            // Fix categories for loadPreset
            const allCats = new Set(['laws_pure', 'laws_biol', 'laws_chem', 'laws_thermo', 'laws_meta', 'worldConfig']);
            for (let i = 0; i < 12; i++) allCats.add(`species_${i}`);
            this.persistence.loadPreset(basePreset, this, allCats);
            
            document.getElementById('ui-layer').style.display = 'none';
            const zh = document.getElementById('zoom-hud'); if (zh) zh.style.display = 'none';
            const drone = document.getElementById('help-drone'); if (drone) drone.style.display = 'none';
            const tp = document.getElementById('tooltip'); if (tp) tp.style.display = 'none';
            
            this.restartSim();
            this.triggerSmartChaos();
            
            const loop = () => {
                this.update();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
            
        } else {
            this.initPixi().then(() => {
                this.setupInteraction();
                this.worker = new Worker(new URL('./worker/physics.worker.js', import.meta.url), { type: 'module' });
                this.worker.onmessage = (e) => this.handleWorkerMessage(e);
                this.worker.onerror = (e) => { console.error("Worker error:", e.message, e.filename, e.lineno); this.workerBusy = false; };
                let frame = 0;
                this.restartSim();
                setupUI(this); syncUI(this.laws);
                import('./ui.js').then(ui => ui.renderQuickPresets(this));
                updatePlaybackUI(this.playbackMode || 'forward', this.paused);
                this.app.ticker.add(() => this.update());
            });
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const on = (name, fn) => window.addEventListener(name, (e) => fn(e.detail));
        const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
        on('cmd:chaos', (options) => this.triggerSmartChaos(options));
        on('cmd:pause', () => this.togglePause());
        on('cmd:restart', () => this.restartSim());
        on('cmd:hardReset', () => this.hardReset());
        on('cmd:playback', (mode) => this.setPlaybackMode(mode));
        on('cmd:toggleLaw', (k) => this.toggleLaw(k));
        on('cmd:toggleCategory', (g) => this.toggleCategory(g));
        on('cmd:updateDNA', ({ sIdx, rIdx, val }) => this.updateDNA(sIdx, rIdx, val));
        on('cmd:updateWorld', ({ key, val }) => this.updateWorld(key, val));
        on('cmd:updatePhysics', ({ key, val }) => this.updatePhysics(key, val));
        on('cmd:addSpecies', () => { this.addSpecies(); });
        on('ui:resized', () => this.recenter());

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const manager = document.getElementById('preset-manager');
                if (manager && !manager.classList.contains('hidden')) {
                    window.togglePresetManager();
                }
                const codex = document.getElementById('codex-overlay');
                if (codex && !codex.classList.contains('hidden')) {
                    window.closeCodex();
                }
            }
        });

        // PRESETS
        on('cmd:savePreset', (name) => {
            this.persistence.savePreset(name, this);
            emit('ui:presetsUpdated');
        });
        on('cmd:loadPreset', ({ name, categories }) => {
            const catSet = new Set(categories);
            if (this.persistence.loadPreset(name, this, catSet)) {
                this.species.forEach(s => this.fixSpeciesDNA(s));
                this.restartSim();
                syncUI(this.laws);
                renderSpeciesList(this);
                renderDNAAccordion(this);
                renderWorldAccordion(this);
            }
        });
        on('cmd:deletePreset', (name) => {
            this.persistence.deletePreset(name);
            emit('ui:presetsUpdated');
        });
    }

    createDefaultSpecies() {
        const specs = [];
        
        // Species 1: Sol (Yellow) - High attraction, High fusion, stable
        const s1 = this.createSpecies();
        s1.name = "Sol";
        s1.dna[0] = 0.5;   // Force (attraction)
        s1.dna[9] = 0.8;   // Fusion
        s1.dna[10] = 0.05; // Birth Rate
        s1.rgb = [1, 1, 0];
        s1.color = "rgb(255, 255, 0)";
        specs.push(s1);

        // Species 2: Aether (Blue) - Fluid, cloud-like, responsive
        const s2 = this.createSpecies();
        s2.name = "Aether";
        s2.dna[1] = 0.99;  // Viscosity (slick)
        s2.dna[3] = 0.2;   // Jitter
        s2.dna[13] = 1.5;  // Signal Resp
        s2.rgb = [0, 0.5, 1];
        s2.color = "rgb(0, 127, 255)";
        specs.push(s2);

        // Species 3: Void (Red) - Repulsive, chaotic, high turnover
        const s3 = this.createSpecies();
        s3.name = "Void";
        s3.dna[0] = -0.5;  // Force (repulsion)
        s3.dna[12] = 0.2;  // Mutation
        s3.dna[11] = 0.08; // Death Rate
        s3.rgb = [1, 0, 0];
        s3.color = "rgb(255, 0, 0)";
        specs.push(s3);

        return specs;
    }

    createSpecies(parentId = null) {
        const dna = DNA_RANGES.map(r => r.default);
        const record = this.lineageTracker.createSpecies(dna, parentId);
        const s = { id: record.id, name: record.name, dna, color: null, rgb: null };
        this.fixSpeciesDNA(s);
        return s;
    }

    fixSpeciesDNA(spec) {
        if (!spec.dna) spec.dna = [];
        DNA_RANGES.forEach((range, i) => {
            if (spec.dna[i] === undefined || spec.dna[i] === null) {
                spec.dna[i] = range.default;
            }
        });
        if (!spec.rgb) {
            const r = Math.random(), g = Math.random(), b = Math.random();
            spec.rgb = [r, g, b];
            spec.color = `rgb(${Math.floor(r*255)}, ${Math.floor(g*255)}, ${Math.floor(b*255)})`;
        }
    }

    addSpecies() { if (this.species.length < 12) { const s = this.createSpecies(null); this.species.push(s); this.syncDNABuffer(this.species.length - 1); renderSpeciesList(this); } }

    syncDNABuffer(sIdx) {
        const spec = this.species[sIdx];
        if (!spec) return;
        const offset = sIdx * (DNA_STRIDE * 2);
        for (let i = 0; i < DNA_META.length; i++) {
            const range = DNA_RANGES[i];
            const val = spec.dna[i];
            // Normalize val to 0..1 based on range
            const norm = (val - range.min) / (range.max - range.min);
            this.dnaView[offset + i] = Math.max(0, Math.min(DNA_PACK_MAX, Math.round(norm * DNA_PACK_MAX)));
        }
    }

    async initPixi() {
        await this.app.init({ background: '#000', resizeTo: window });
        this.app.canvas.id = 'sim-canvas'; document.body.appendChild(this.app.canvas);
        this.world = new PIXI.Container();
        this.app.stage.addChild(this.world);
        this.envGraphics = new PIXI.Graphics();
        this.world.addChild(this.envGraphics);
        const g = new PIXI.Graphics(); g.circle(0, 0, 32).fill({ color: 0xffffff });
        this.texture = this.app.renderer.generateTexture(g);
        this.particleSprites = [];
        this.minimap = new PIXI.Graphics();
        this.minimap.x = 20; this.minimap.y = window.innerHeight - 120;
        this.minimap.eventMode = 'static';
        this.minimap.on('pointerdown', (e) => {
            if (document.body.classList.contains('help-mode-active')) {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('ui:helpRequested', { 
                    detail: { key: 'MINIMAP', x: e.global.x, y: e.global.y } 
                }));
            }
        });
        this.app.stage.addChild(this.minimap);
    }

    setupInteraction() {
        let activePointers = new Map(), initialDistance = 0, initialZoom = 1.0, initialPan = { x: 0, y: 0 };
        this.app.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.app.canvas.addEventListener('wheel', (e) => { 
            e.preventDefault();
            this.zoom *= Math.pow(0.999, e.deltaY); 
            this.applyLimits(); 
        }, { passive: false });

        this.app.canvas.addEventListener('pointerdown', e => { 
            e.preventDefault();
            activePointers.set(e.pointerId, { 
                lastX: e.clientX, lastY: e.clientY, 
                startX: e.clientX, startY: e.clientY, 
                startTime: Date.now(),
                button: e.button
            }); 
            if (activePointers.size === 2) {
                const pts = Array.from(activePointers.values());
                initialDistance = Math.hypot(pts[0].lastX - pts[1].lastX, pts[0].lastY - pts[1].lastY);
                initialZoom = this.zoom;
                initialPan = { x: this.pan.x, y: this.pan.y };
                // Also store initial center
                this.initialCenter = { x: (pts[0].lastX + pts[1].lastX)/2, y: (pts[0].lastY + pts[1].lastY)/2 };
            }
        });

        window.addEventListener('pointerup', e => { 
            const data = activePointers.get(e.pointerId);
            if (data && activePointers.size === 1) {
                const dx = e.clientX - data.startX;
                const dy = e.clientY - data.startY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const duration = Date.now() - data.startTime;
                if (dist < 5 && duration < 200) {
                    this.selectParticleAt(e.clientX, e.clientY);
                }
            }
            activePointers.delete(e.pointerId); 
            if (activePointers.size < 2) initialDistance = 0;
        });

        window.addEventListener('pointermove', e => {
            const p = activePointers.get(e.pointerId); if (!p) return;
            const dx = e.clientX - p.lastX, dy = e.clientY - p.lastY;
            p.lastX = e.clientX; p.lastY = e.clientY;

            const mode = this.worldConfig.cameraMode || 'panning';

            if (activePointers.size === 1) {
                if (mode === 'panning' || this.worldConfig.cameraLocked) {
                    // 1-FINGER PAN
                    const sensitivity = 1.0 / this.zoom;
                    this.pan.x += dx * sensitivity;
                    this.pan.y += dy * sensitivity;
                    
                    if (this.worldConfig.cameraLocked) {
                        this.rotation.x = 0;
                        this.rotation.y = 0;
                    }
                } else {
                    // 1-FINGER ROTATE (ORBITAL)
                    this.rotation.y += dx * 0.005;
                    this.rotation.x -= dy * 0.005;
                    this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
                }
            } else if (activePointers.size === 2) {
                const pts = Array.from(activePointers.values());
                const dist = Math.hypot(pts[0].lastX - pts[1].lastX, pts[0].lastY - pts[1].lastY);
                const center = { x: (pts[0].lastX + pts[1].lastX)/2, y: (pts[0].lastY + pts[1].lastY)/2 };
                
                // ZOOM (Always 2-finger)
                if (initialDistance > 0) this.zoom = initialZoom * (dist / initialDistance);

                if (mode === 'panning' && !this.worldConfig.cameraLocked) {
                    // 2-FINGER ROTATE
                    this.rotation.y += (dx * 0.005) / 2;
                    this.rotation.x -= (dy * 0.005) / 2;
                    this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
                } else {
                    // 2-FINGER PAN
                    if (this.initialCenter) {
                        const cDx = center.x - this.initialCenter.x;
                        const cDy = center.y - this.initialCenter.y;
                        const sensitivity = 1.0 / this.zoom;
                        this.pan.x = initialPan.x + cDx * sensitivity;
                        this.pan.y = initialPan.y + cDy * sensitivity;
                    }
                }
            }
            
            this.applyLimits(); 
        }, { passive: false });
    }

    applyLimits() { 
        const minZoom = 0.001; this.zoom = Math.max(minZoom, Math.min(1000, this.zoom));
    }

    restartSim() {
        this.simVersion++; this.workerBusy = false; this.simStep = 0;
        this.history.population = [];
        this.history.colors = [];
        this.historyThrottle = 0;
        const count = this.worldConfig.count;
        const initCount = this.worldConfig.initialCount || Math.min(count, 500);
        if (count > 20000) {
            bus.emit('narrative:entry', { text: `SYSTEM: Allocating high-density buffer (${count} particles). Expect temporary latency.`, time: new Date().toLocaleTimeString() });
        }
        this.particles = new Float32Array(count * STRIDE);
        this.visuals = new Float32Array(count * 5); // RGB (0-2), Energy (3), Age (4)

        if (!this.isChaosMode) {
            if (this.particleSprites) this.particleSprites.forEach(s => s.destroy());
            this.particleSprites = [];
        }

        const W = this.worldConfig.dimX, H = this.worldConfig.dimY, D = this.worldConfig.dimZ;
        const sx = this.worldConfig.spreadX || 1.0;        const sy = this.worldConfig.spreadY || 1.0;        const sz = this.worldConfig.spreadZ || 1.0;
        const distType = this.worldConfig.distributionType || 'Grid';

        const side = Math.ceil(Math.pow(count, 1/3));
        const spacingX = (W * sx) / side;
        const spacingY = (H * sy) / side;
        const spacingZ = (D * sz) / side;

        // Side based on active particles so grid fills evenly
        const activeCount = Math.max(initCount, Math.min(count, 2000));
        const gridSide = Math.ceil(Math.pow(activeCount, 1/3));
        const gSpacingX = W / Math.max(1, gridSide - 1);
        const gSpacingY = H / Math.max(1, gridSide - 1);
        const gSpacingZ = D / Math.max(1, gridSide - 1);

        // Step: spread alive particles evenly across all 3 axes
        const aliveStep = Math.max(1, Math.floor(count / Math.max(1, initCount)));
        let alivePlaced = 0;

        for (let i = 0; i < count; i++) {
            const ptr = i * STRIDE;
            const vPtr = i * 5;

            // Decide alive: step pattern for Grid, first N for others
            let isAlive;
            if (distType === 'Grid') {
                isAlive = (i % aliveStep === 0) && alivePlaced < initCount;
            } else {
                isAlive = alivePlaced < initCount;
            }
            if (isAlive) alivePlaced++;

            if (!isAlive) {
                this.particles[ptr + STRIDE_INDEXES.DEAD] = 1;
            }
            if (!this.isChaosMode && this.texture && this.world) {
                const sprite = new PIXI.Sprite(this.texture);
                sprite.anchor.set(0.5); this.world.addChild(sprite); this.particleSprites.push(sprite);
            }

            const spec = this.species[isAlive ? (alivePlaced - 1 + this.species.length) % this.species.length : i % this.species.length];

            let px = 0, py = 0, pz = 0, vx = 0, vy = 0, vz = 0;

            if (distType === 'Soup') {
                px = (Math.random() - 0.5) * W * sx;
                py = (Math.random() - 0.5) * H * sy;
                pz = (Math.random() - 0.5) * D * sz;
            } else if (distType === 'Big Bang') {
                px = (Math.random() - 0.5) * 10;
                py = (Math.random() - 0.5) * 10;
                pz = (Math.random() - 0.5) * 10;
                const mag = 5.0 + Math.random() * 10.0;
                const dir = { x: px, y: py, z: pz };
                const d = Math.hypot(dir.x, dir.y, dir.z) || 1;
                vx = (dir.x/d) * mag; vy = (dir.y/d) * mag; vz = (dir.z/d) * mag;
            } else if (distType === 'Bipolar') {
                const bipolar_side = Math.random() > 0.5 ? 1 : -1;
                px = bipolar_side * W * 0.4 * sx + (Math.random()-0.5) * 100;
                py = (Math.random()-0.5) * H * sy;
                pz = (Math.random()-0.5) * D * sz;
            } else if (distType === 'Galaxy') {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.pow(Math.random(), 0.5) * W * 0.5 * sx;
                px = Math.cos(angle) * r;
                py = Math.sin(angle) * r;
                pz = (Math.random() - 0.5) * D * 0.1 * sz;
                const vMag = 2.0;
                vx = -Math.sin(angle) * vMag; vy = Math.cos(angle) * vMag;
            } else if (distType === 'Grid') {
                const gx = i % gridSide;
                const gy = Math.floor(i / gridSide) % gridSide;
                const gz = Math.floor(i / (gridSide * gridSide));
                px = (gx - (gridSide-1)/2) * gSpacingX;
                py = (gy - (gridSide-1)/2) * gSpacingY;
                pz = (gz - (gridSide-1)/2) * gSpacingZ;
            } else { // legacy fallback
                const gx = i % gridSide;
                const gy = Math.floor(i / gridSide) % gridSide;
                const gz = Math.floor(i / (gridSide * gridSide));
                px = (gx - (gridSide-1)/2) * gSpacingX;
                py = (gy - (gridSide-1)/2) * gSpacingY;
                pz = (gz - (gridSide-1)/2) * gSpacingZ;
            }


            // Apply Order (uniform->random blend) and Center Density
            const order = this.worldConfig.order !== undefined ? this.worldConfig.order : 0.5;
            const centerDensity = this.worldConfig.centerDensity || 0;
            const densityRadius = this.worldConfig.densityRadius || 0.25;
            const densityMultiplier = this.worldConfig.densityMultiplier || 2.0;
            if (order < 1.0 && distType !== 'Grid') {
                const gxLocal = i % gridSide;
                const gyLocal = Math.floor(i / gridSide) % gridSide;
                const gzLocal = Math.floor(i / (gridSide * gridSide));
                const gridPx = (gxLocal - (gridSide-1)/2) * gSpacingX;
                const gridPy = (gyLocal - (gridSide-1)/2) * gSpacingY;
                const gridPz = (gzLocal - (gridSide-1)/2) * gSpacingZ;
                if (distType === 'Soup') {
                    px = px * (1 - order) + gridPx * order;
                    py = py * (1 - order) + gridPy * order;
                    pz = pz * (1 - order) + gridPz * order;
                }
            }
            if (centerDensity > 0) {
                const radius = Math.max(W, H, D) * densityRadius;
                const centerBias = centerDensity * (densityMultiplier - 1.0);
                if (Math.random() < centerBias / densityMultiplier) {
                    px *= Math.random() * 0.3;
                    py *= Math.random() * 0.3;
                    pz *= Math.random() * 0.3;
                }
            }
            this.particles[ptr + STRIDE_INDEXES.POS_X] = px; 
            this.particles[ptr + STRIDE_INDEXES.POS_Y] = py; 
            this.particles[ptr + STRIDE_INDEXES.POS_Z] = pz;
            this.particles[ptr + STRIDE_INDEXES.VEL_X] = vx; 
            this.particles[ptr + STRIDE_INDEXES.VEL_Y] = vy; 
            this.particles[ptr + STRIDE_INDEXES.VEL_Z] = vz;
            
            this.particles[ptr + STRIDE_INDEXES.MASS] = 1.0;
            this.particles[ptr + STRIDE_INDEXES.SPECIES_ID] = spec.id;
            this.particles[ptr + STRIDE_INDEXES.DEAD] = 0;
            this.particles[ptr + STRIDE_INDEXES.ENERGY] = 100.0;
            this.particles[ptr + STRIDE_INDEXES.AGE] = 0;
            this.particles[ptr + STRIDE_INDEXES.RADIUS] = 1.0;
            this.particles[ptr + STRIDE_INDEXES.SIGNAL] = 0;
            this.particles[ptr + STRIDE_INDEXES.BOND_COUNT] = 0;
            this.particles[ptr + STRIDE_INDEXES.MEMORY] = 0;
            this.particles[ptr + STRIDE_INDEXES.HUNGER] = 0;
            this.particles[ptr + STRIDE_INDEXES.ARMOR] = 0;

            // Cache DNA for worker
            for (let d = 0; d < 42; d++) {
                this.particles[ptr + STRIDE_INDEXES.DNA_CACHE_START + d] = spec.dna[d];
            }

            // DNA Cache Initialization (Phase 2 step 3)
            for (let d = 0; d < 16; d++) {
                this.particles[ptr + 8 + d] = spec.dna[d] || 0;
            }

            const rgb = spec.rgb || [0.5, 0.5, 0.5];
            this.particles[ptr + STRIDE_INDEXES.COLOR_R] = rgb[0];
            this.particles[ptr + STRIDE_INDEXES.COLOR_G] = rgb[1];
            this.particles[ptr + STRIDE_INDEXES.COLOR_B] = rgb[2];

            this.visuals[vPtr] = rgb[0]; this.visuals[vPtr+1] = rgb[1]; this.visuals[vPtr+2] = rgb[2];
            this.visuals[vPtr+3] = 100.0; // Energy
            this.visuals[vPtr+4] = 0; // Age
        }
        
        // Sync all species DNA to buffer
        this.species.forEach((s, idx) => this.syncDNABuffer(idx));

        this.worker.postMessage({ type: 'init', data: { particles: this.particles, dnaBuffer: this.dnaBuffer, visuals: this.visuals }, version: this.simVersion });
        
        // Refresh DNA tab if visible
        const dnaTab = document.getElementById('tab-dna');
        if (dnaTab && dnaTab.classList.contains('active')) {
            renderDNAAnalytics(this);
        }
    }

    handleWorkerMessage(e) { 
        if (e.data.version !== this.simVersion) return;
        if (e.data.type === 'update') { this.particles = e.data.particles; this.workerBusy = false; this.simStep++; }
        const particles = this.particles;
        const frame = this.simStep;
        bus.emit("physics:update", {
            particles,
            time: performance.now?.() ?? Date.now(),
            frame
        });
    }

    update() {
        if (!this.particles) return;
        if (!this.paused) {
            if (this.playbackMode === 'reverse' || this.playbackMode === 'rewind') {
                const slider = document.getElementById('timeline-slider');
                if (slider) {
                    const newVal = Math.max(0, parseInt(slider.value) - (this.playbackMode === 'rewind' ? 5 : 1));
                    slider.value = newVal; this.timelineEngine.restore(newVal, false);
                    if (newVal === 0) { this.paused = true; updatePlaybackUI(this.playbackMode, this.paused); }
                }
            } else {
                this.simAge++;
                if (!this.workerBusy) {
                    this.workerBusy = true;
                    this.worker.postMessage({ type: 'step', version: this.simVersion, config: { laws: this.laws, world: this.worldConfig }, particles: this.particles });
                } else if (this.simAge % 200 === 0) { this.workerBusy = false; }
            }
        }

        if (!this.paused && this.simAge % 60 === 0) {
            const { insights, suggestions } = this.insightEngine.evaluate();
            renderInsights(insights); renderSuggestions(suggestions);
            this.timelineEngine.capture();
        }

        // Capture history for graphs (Throttled)
        if (!this.paused) {
            this.historyThrottle++;
            if (this.historyThrottle >= 30) {
                this.historyThrottle = 0;
                this.captureHistory();
            }
        }

        this.syncChaosGridCameras();
        this.draw();
    }

    syncChaosGridCameras() {
        const overlay = document.getElementById('chaos-grid-overlay');
        if (overlay && !overlay.classList.contains('hidden')) {
            const container = document.getElementById('chaos-grid-container');
            if (container) {
                const iframes = container.querySelectorAll('iframe');
                iframes.forEach(f => {
                    if (f.contentWindow && f.contentWindow.engine) {
                        f.contentWindow.engine.pan.x = this.pan.x;
                        f.contentWindow.engine.pan.y = this.pan.y;
                        f.contentWindow.engine.pan.z = this.pan.z;
                        f.contentWindow.engine.zoom = this.zoom;
                        f.contentWindow.engine.rotation.x = this.rotation.x;
                        f.contentWindow.engine.rotation.y = this.rotation.y;
                    }
                });
            }
        }
    }

    captureHistory() {
        if (!this.particles) return;
        const counts = new Array(this.species.length).fill(0);
        const colorGroups = [];
        const THRESHOLD = 30;

        for (let i = 0; i < this.worldConfig.count; i++) {
            const ptr = i * STRIDE;
            if (this.particles[ptr + STRIDE_INDEXES.DEAD] === 0) {
                const sIdx = Math.floor(this.particles[ptr + STRIDE_INDEXES.SPECIES_ID]);
                if (counts[sIdx] !== undefined) counts[sIdx]++;

                const r = Math.round(this.particles[ptr + STRIDE_INDEXES.COLOR_R] * 255);
                const g = Math.round(this.particles[ptr + STRIDE_INDEXES.COLOR_G] * 255);
                const b = Math.round(this.particles[ptr + STRIDE_INDEXES.COLOR_B] * 255);
                
                let found = false;
                for (const group of colorGroups) {
                    const dist = Math.sqrt((r - group.r)**2 + (g - group.g)**2 + (b - group.b)**2);
                    if (dist < THRESHOLD) {
                        group.count++; found = true; break;
                    }
                }
                if (!found) colorGroups.push({ r, g, b, count: 1 });
            }
        }

        this.history.population.push({ step: this.simStep, counts });
        this.history.colors.push({ step: this.simStep, colorGroups: colorGroups.sort((a,b) => b.count-a.count).slice(0, 5) });

        if (this.history.population.length > this.history.maxPoints) {
            this.history.population.shift();
            this.history.colors.shift();
        }
        
        updateDNAGraphs(this);
    }

    selectParticleAt(screenX, screenY) {
        if (!this.particles) return;
        const cX = window.innerWidth / 2, cY = window.innerHeight / 2;
        let nearestIdx = -1, minDist = 40; 

        const cosX = Math.cos(this.rotation.x), sinX = Math.sin(this.rotation.x);
        const cosY = Math.cos(this.rotation.y), sinY = Math.sin(this.rotation.y);

        for (let i = 0; i < this.worldConfig.count; i++) {
            const ptr = i * STRIDE;
            if (this.particles[ptr + STRIDE_INDEXES.DEAD] > 0) continue; 

            const px = this.particles[ptr + STRIDE_INDEXES.POS_X], 
                  py = this.particles[ptr + STRIDE_INDEXES.POS_Y], 
                  pz = this.particles[ptr + STRIDE_INDEXES.POS_Z];
            
            // Rotate
            let x1 = px * cosY - pz * sinY;
            let z1 = px * sinY + pz * cosY;
            let y2 = py * cosX - z1 * sinX;
            let z2 = py * sinX + z1 * cosX;
            
            const x = x1 + this.pan.x, y = y2 + this.pan.y, z = z2 + this.pan.z;
            const depth = this.focalLength + z;
            if (depth <= 10) continue;
            
            const pScale = this.focalLength / depth;
            const screenPx = cX + x * pScale * this.zoom;
            const screenPy = cY + y * pScale * this.zoom;

            const dist = Math.hypot(screenX - screenPx, screenY - screenPy);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }

        this.selectedParticleIndex = nearestIdx;

        // If help mode is active, trigger the drone for the particle
        if (document.body.classList.contains('help-mode-active')) {
            window.dispatchEvent(new CustomEvent('ui:helpRequested', { 
                detail: { key: 'PARTICLE', x: screenX, y: screenY } 
            }));
            return;
        }

        const panel = document.getElementById('particle-info-panel');
        if (panel) {
            if (nearestIdx === -1) panel.classList.add('hidden');
            else panel.classList.remove('hidden');
        }
    }

    getParticleData(idx) {
        const ptr = idx * STRIDE;
        const speciesIdx = Math.floor(this.particles[ptr + STRIDE_INDEXES.SPECIES_ID]);
        const spec = this.species[speciesIdx] || { name: 'Unknown' };

        return {
            id: idx,
            species: spec.name,
            mass: this.particles[ptr + STRIDE_INDEXES.MASS].toFixed(2),
            energy: this.particles[ptr + STRIDE_INDEXES.ENERGY].toFixed(1),
            age: Math.floor(this.particles[ptr + STRIDE_INDEXES.AGE]),
            vel: Math.hypot(this.particles[ptr + STRIDE_INDEXES.VEL_X], this.particles[ptr + STRIDE_INDEXES.VEL_Y], this.particles[ptr + STRIDE_INDEXES.VEL_Z]).toFixed(2),
            pos: { 
                x: Math.round(this.particles[ptr + STRIDE_INDEXES.POS_X]), 
                y: Math.round(this.particles[ptr + STRIDE_INDEXES.POS_Y]), 
                z: Math.round(this.particles[ptr + STRIDE_INDEXES.POS_Z]) 
            }
        }; 
    }

    draw() {
        if (this.isChaosMode) {
            if (!this.ctx) return;
            const w = this.canvas.width; const h = this.canvas.height;
            const cX = w / 2; const cY = h / 2;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, w, h);
            
            const cosX = Math.cos(this.rotation.x), sinX = Math.sin(this.rotation.x);
            const cosY = Math.cos(this.rotation.y), sinY = Math.sin(this.rotation.y);
            
            for (let i = 0; i < this.worldConfig.count; i++) {
                const ptr = i * STRIDE;
                if (this.particles[ptr + STRIDE_INDEXES.DEAD] > 0) continue;
                
                const px = this.particles[ptr], py = this.particles[ptr+1], pz = this.particles[ptr+2];
                let x1 = px * cosY - pz * sinY;
                let z1 = px * sinY + pz * cosY;
                let y2 = py * cosX - z1 * sinX;
                let z2 = py * sinX + z1 * cosX;
                
                const x = x1 + this.pan.x, y = y2 + this.pan.y, z = z2 + this.pan.z;
                const depth = this.focalLength + z;
                if (depth <= 10) continue;
                
                const pScale = this.focalLength / depth;
                const sx = cX + x * pScale * this.zoom;
                const sy = cY + y * pScale * this.zoom;
                
                if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
                
                const r = Math.floor(this.particles[ptr + STRIDE_INDEXES.COLOR_R] * 255);
                const g = Math.floor(this.particles[ptr + STRIDE_INDEXES.COLOR_G] * 255);
                const b = Math.floor(this.particles[ptr + STRIDE_INDEXES.COLOR_B] * 255);
                
                const mass = this.particles[ptr + STRIDE_INDEXES.MASS];
                const size = Math.max(1, Math.sqrt(mass) * 2 * this.worldConfig.baseSize * pScale * this.zoom);
                
                this.ctx.fillStyle = `rgb(${r},${g},${b})`;
                this.ctx.fillRect(sx - size/2, sy - size/2, size, size);
            }
            return;
        }

        this.renderEnvironment();
        const cX = window.innerWidth/2, cY = window.innerHeight/2;
        const speciesMap = new Map(); this.species.forEach(s => speciesMap.set(s.id, s));
        this.minimap.clear().rect(0, 0, 100, 100).fill({ color: 0x000, alpha: 0.5 }).stroke({ color: 0x00ff41, width: 1 });
        
        const cosX = Math.cos(this.rotation.x), sinX = Math.sin(this.rotation.x);
        const cosY = Math.cos(this.rotation.y), sinY = Math.sin(this.rotation.y);

        for (let i = 0; i < this.particleSprites.length; i++) {
            const ptr = i * STRIDE, s = this.particleSprites[i];
            if (this.particles[ptr + STRIDE_INDEXES.DEAD] > 0) { s.visible = false; continue; }
            
            const px = this.particles[ptr + STRIDE_INDEXES.POS_X], 
                  py = this.particles[ptr + STRIDE_INDEXES.POS_Y], 
                  pz = this.particles[ptr + STRIDE_INDEXES.POS_Z];
            
            // Rotate
            let x1 = px * cosY - pz * sinY;
            let z1 = px * sinY + pz * cosY;
            let y2 = py * cosX - z1 * sinX;
            let z2 = py * sinX + z1 * cosX;

            const x = x1 + this.pan.x, y = y2 + this.pan.y, z = z2 + this.pan.z;
            const depth = this.focalLength + z;
            if (depth <= 10) { s.visible = false; continue; }
            
            s.visible = true;
            const pScale = this.focalLength / depth;
            s.x = cX + x * pScale * this.zoom; s.y = cY + y * pScale * this.zoom;
            
            const mass = this.particles[ptr + STRIDE_INDEXES.MASS];
            const size = Math.sqrt(mass) * 2 * this.worldConfig.baseSize * pScale * this.zoom;
            s.scale.set(size / 32);
            
            // Conductivity Visualization
            const conductivity = this.particles[ptr + STRIDE_INDEXES.DNA_CACHE_START + 32];
            if (conductivity > 0.5) {
                s.tint = 0x00FFFF; // Cyan glow for high conductivity
                s.alpha = 0.8 + Math.sin(Date.now() * 0.005) * 0.2; // Pulse effect
            } else {
                const r = Math.floor(this.particles[ptr + STRIDE_INDEXES.COLOR_R] * 255);
                const g = Math.floor(this.particles[ptr + STRIDE_INDEXES.COLOR_G] * 255);
                const b = Math.floor(this.particles[ptr + STRIDE_INDEXES.COLOR_B] * 255);
                s.tint = (r << 16) | (g << 8) | b;
                s.alpha = 1.0;
            }

            if (i === this.selectedParticleIndex) {
                s.alpha = 1.0;
                s.scale.set(s.scale.x * 1.5);
            }
            
            if (i % 20 === 0) this.minimap.rect(50 + px/(this.worldConfig.dimX/100), 50 + py/(this.worldConfig.dimY/100), 1, 1).fill(s.tint);
        }
        
        if (this.selectedParticleIndex !== -1) {
            import('./ui.js').then(ui => ui.updateParticleHUD(this.getParticleData(this.selectedParticleIndex)));
        }

        const aliveCount = this.particles ? (() => { let c = 0; for (let j = 0; j < this.worldConfig.count; j++) { if (this.particles[j * STRIDE + STRIDE_INDEXES.DEAD] === 0) c++; } return c; })() : 0;
        updateHUD(Math.round(this.app.ticker.FPS), aliveCount, this.worldConfig.count, this.simStep);
    }

    renderEnvironment() {
        const g = this.envGraphics; g.clear();
        const W = this.worldConfig.dimX, H = this.worldConfig.dimY, D = this.worldConfig.dimZ;
        const cX = window.innerWidth / 2, cY = window.innerHeight / 2;
        
        const cosX = Math.cos(this.rotation.x), sinX = Math.sin(this.rotation.x);
        const cosY = Math.cos(this.rotation.y), sinY = Math.sin(this.rotation.y);

        const project = (px, py, pz) => {
            // Rotate
            let x1 = px * cosY - pz * sinY;
            let z1 = px * sinY + pz * cosY;
            let y2 = py * cosX - z1 * sinX;
            let z2 = py * sinX + z1 * cosX;

            const x = x1 + this.pan.x, y = y2 + this.pan.y, z = z2 + this.pan.z;
            const depth = this.focalLength + z;
            const pScale = this.focalLength / depth;
            return { x: cX + x * pScale * this.zoom, y: cY + y * pScale * this.zoom, scale: pScale, visible: depth > 10 };
        };

        if (this.laws.pure.planetary) {
            const groundY = H / 2;
            const res = 10;
            const stepX = W / res, stepZ = D / res;
            
            for (let i = 0; i <= res; i++) {
                const z = -D/2 + i * stepZ;
                const p1 = project(-W/2, groundY, z);
                const p2 = project(W/2, groundY, z);
                if (p1.visible && p2.visible) {
                    g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ color: 0x224422, width: 1, alpha: 0.3 * p1.scale });
                }
            }
            for (let i = 0; i <= res; i++) {
                const x = -W/2 + i * stepX;
                const p1 = project(x, groundY, -D/2);
                const p2 = project(x, groundY, D/2);
                if (p1.visible && p2.visible) {
                    g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ color: 0x224422, width: 1, alpha: 0.3 * p1.scale });
                }
            }

            // Draw particle shadows
            if (this.particles) {
                for (let i = 0; i < this.worldConfig.count; i++) {
                    const ptr = i * STRIDE;
                    if (this.particles[ptr + STRIDE_INDEXES.DEAD] > 0) continue;
                    const px = this.particles[ptr], py = this.particles[ptr+1], pz = this.particles[ptr+2];
                    if (py >= groundY) continue; // Below ground

                    const shadow = project(px, groundY, pz);
                    if (shadow.visible) {
                        const mass = this.particles[ptr+11];
                        const distToGround = Math.max(1, groundY - py);
                        const shadowAlpha = Math.max(0, 0.4 * (1.0 - distToGround / 500));
                        const shadowSize = Math.sqrt(mass) * 1.5 * this.worldConfig.baseSize * shadow.scale * this.zoom;
                        g.circle(shadow.x, shadow.y, shadowSize).fill({ color: 0x000, alpha: shadowAlpha });
                    }
                }
            }
        }

        const corners = [];
        for (let i = 0; i < 8; i++) {
            corners.push(project((i & 1 ? 1 : -1) * W / 2, (i & 2 ? 1 : -1) * H / 2, (i & 4 ? 1 : -1) * D / 2));
        }
        const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
        edges.forEach(([a, b]) => {
            if (corners[a].visible && corners[b].visible) {
                g.moveTo(corners[a].x, corners[a].y).lineTo(corners[b].x, corners[b].y).stroke({ color: 0x444444, width: 1, alpha: 0.2 });
            }
        });
    }

    getFlattenedDNA(s) { 
        return { 
            force: s.dna[0],
            viscosity: s.dna[1],
            torque: s.dna[2],
            jitter: s.dna[3],
            birth: s.dna[10],
            death: s.dna[11],
            resp: s.dna[13],
            pulse: s.dna[14],
            tidal: s.dna[15],
            fusionMomentum: s.dna[16],
            fusionTime: s.dna[17],
            neighborhoodRadius: s.dna[18],
            strength: s.dna[19],
            decay: s.dna[20],
            speed: s.dna[21],
            tuning: [s.dna[22], s.dna[23], s.dna[24], s.dna[25]],
            inertia: s.dna[26],
            friction: s.dna[27],
            maxVelocity: s.dna[28],
            fusion: s.dna[9],
            baseRadius: s.dna[29] || 2.0,
            elasticity: s.dna[30] || 0.5,
            bondAngle: s.dna[31],
            conductivity: s.dna[32],
            magneticMoment: s.dna[33],
            efficiency: s.dna[34] || 0.8,
            sexChance: s.dna[35],
            predationBias: s.dna[36],
            reactionThreshold: s.dna[37],
            catalysis: s.dna[38],
            heatOutput: s.dna[39],
            memoryDecay: s.dna[40],
            affinity: s.dna[41] || 0.0
        }; 
    }
    setPlaybackMode(mode) { this.playbackMode = mode; this.paused = false; updatePlaybackUI(this.playbackMode, this.paused); }
    updateDNA(sIdx, rIdx, val) { 
        if(this.species[sIdx]) {
            this.species[sIdx].dna[rIdx] = parseFloat(val); 
            this.syncDNABuffer(sIdx);
        }
    }
    updateWorld(key, val) { 
        if (key === 'focalLength') this.focalLength = parseFloat(val);
        else if (key === 'initialCount') {
            const initVal = parseFloat(val);
            this.worldConfig.initialCount = initVal;
            if (this.worldConfig.count < initVal) {
                this.worldConfig.count = initVal;
            }
        } else if (key === 'count') {
            const countVal = parseFloat(val);
            const initVal = this.worldConfig.initialCount || 1;
            this.worldConfig.count = Math.max(countVal, initVal);
        }
        else if (key === 'distributionType') this.worldConfig.distributionType = val;
        else this.worldConfig[key] = parseFloat(val); 
    }
    updatePhysics(key, val) { 
        if (this.laws.pure[key] !== undefined) this.laws.pure[key] = parseFloat(val);
        else if (this.laws.biol[key] !== undefined) this.laws.biol[key] = parseFloat(val);
        else this.laws.pure[key] = parseFloat(val);
    }
    triggerSmartChaos(options = {}) { 
        const isTotal = !options || Object.keys(options).length === 0 || options.total;
        
        if (isTotal || options.dna) {
            this.species.forEach((s, idx) => { 
                s.dna = s.dna.map((v, i) => Math.random() * (DNA_RANGES[i].max - DNA_RANGES[i].min) + DNA_RANGES[i].min); 
                this.syncDNABuffer(idx);
            }); 
        } else if (options.biology) {
            const bioIndices = [10, 11, 12, 34, 35, 36, 41]; // Birth, Death, Mutation, Energy Efficiency, Sex Chance, Predation Bias, Affinity
            this.species.forEach((s, idx) => {
                bioIndices.forEach(i => {
                    s.dna[i] = Math.random() * (DNA_RANGES[i].max - DNA_RANGES[i].min) + DNA_RANGES[i].min;
                });
                this.syncDNABuffer(idx);
            });
        }

        if (isTotal || options.physics) {
            // Randomize global pure laws and worldConfig
            const targetLaws = ['G', 'dt', 'globalViscosity'];
            targetLaws.forEach(k => {
                const range = { min: 0.01, max: 0.5 };
                if (k === 'dt') { range.min = 0.5; range.max = 2.0; }
                if (k === 'globalViscosity') { range.min = 0.95; range.max = 1.0; }
                
                if (this.laws.pure[k] !== undefined) this.laws.pure[k] = Math.random() * (range.max - range.min) + range.min;
                else if (this.worldConfig[k] !== undefined) this.worldConfig[k] = Math.random() * (range.max - range.min) + range.min;
            });
            
            // Randomly toggle some laws
            const boolLaws = ['grav', 'drag', 'jitter', 'coll', 'accr'];
            boolLaws.forEach(k => {
                this.laws.pure[k] = Math.random() > 0.5;
            });
            
            this.worldConfig.entropy = Math.random() * 0.5;
            this.worldConfig.baseSize = Math.random() * 2 + 0.5;
            
            syncUI(this.laws);
            renderWorldAccordion(this);
        }

        if (isTotal || options.dna || options.biology) {
            renderDNAAccordion(this);
        }

        this.restartSim(); 
    }
    toggleLaw(k) { 
        if (this.laws.pure[k] !== undefined) this.laws.pure[k] = !this.laws.pure[k]; else if (this.laws.biol[k] !== undefined) this.laws.biol[k] = !this.laws.biol[k]; else if (this.laws.chem[k] !== undefined) this.laws.chem[k] = !this.laws.chem[k]; else if (this.laws.thermo[k] !== undefined) this.laws.thermo[k] = !this.laws.thermo[k]; else if (this.laws.meta[k] !== undefined) this.laws.meta[k] = !this.laws.meta[k];
        syncUI(this.laws); 
    }
    toggleCategory(g) {
        const group = this.laws[g];
        if (!group) return;
        
        const isCurrentlyCollapsed = this.lawStateMemory[g] !== null;
        
        if (isCurrentlyCollapsed) {
            // Restore state
            Object.assign(group, this.lawStateMemory[g]);
            this.lawStateMemory[g] = null;
        } else {
            // Save state and disable all
            this.lawStateMemory[g] = JSON.parse(JSON.stringify(group));
            Object.keys(group).forEach(k => {
                if (typeof group[k] === 'boolean') group[k] = false;
            });
        }
        syncUI(this.laws);
    }
    receiveDerivedState(state) {
        if (state.laws) {
            Object.keys(state.laws).forEach(cat => {
                if (this.laws[cat]) Object.assign(this.laws[cat], state.laws[cat]);
            });
        }
        if (state.worldConfig) Object.assign(this.worldConfig, state.worldConfig);
        if (state.species) {
            state.species.forEach((s, idx) => {
                if (this.species[idx]) {
                    this.species[idx].name = s.name;
                    this.species[idx].dna = s.dna.slice();
                    this.species[idx].rgb = s.rgb.slice();
                    this.species[idx].color = s.color;
                    this.syncDNABuffer(idx);
                }
            });
        }
        // In non-chaos mode, sync UI if functions available
        if (!this.isChaosMode && typeof syncUI !== 'undefined') {
            try { syncUI(this.laws); } catch(e) {}
        }
        this.restartSim();
    }
    togglePause() { this.paused = !this.paused; updatePlaybackUI(this.playbackMode, this.paused); }
    hardReset() { if(confirm("Hard reset?")) { localStorage.clear(); location.reload(); } }
    recenter() {
        const panel = document.getElementById('main-panel');
        let bottomOffset = 0; 
        if (panel && !panel.classList.contains('hidden')) bottomOffset = panel.offsetHeight;
        const targetCenterY = (window.innerHeight - bottomOffset) / 2;
        this.pan.y = (targetCenterY - (window.innerHeight / 2)) / this.zoom;
        this.pan.x = 0; this.pan.z = 0;
    }
}
const engine = new VepaEngine(); window.engine = engine;
