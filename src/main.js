// VEPA v3 — VepaEngine Orchestrator
// Main entry point: boot sequence, render loop, worker coordination.

import EventBus from './core/eventBus.js';
import UI from './ui/ui.js';
import SplitMix32 from './core/prng.js';
import Renderer from './render/renderer.js';
import RenderLoop from './render/renderLoop.js';
import { updateSprites } from './render/spriteUpdater.js';
import { expressPhenotype } from './render/phenoType.js';
import SpeciesManager from './species/speciesManager.js';
import LawManager from './physics/laws.js';
import SpatialGrid from './physics/spatialGrid.js';
import {
  PARTICLE_STRIDE, MAX_PARTICLES, STRIDE_INDEXES,
  LAW_INDEXES, DEFAULT_SPECIES, LAW_CATEGORIES,
} from './constants.js';

class VepaEngine {
  constructor(config = {}) {
    this.config = {
      worldSize: config.worldSize || 800,
      particleCount: config.particleCount || 500,
      seed: config.seed || Date.now(),
      container: config.container || document.getElementById('canvas-container'),
    };

    // Core systems
    this.bus = new EventBus();
    this.prng = new SplitMix32(this.config.seed);
    this.speciesManager = new SpeciesManager();
    this.lawManager = new LawManager();
    this.grid = new SpatialGrid(this.config.worldSize);

    // Particle buffer
    this.particleBuffer = new Float32Array(MAX_PARTICLES * PARTICLE_STRIDE);
    this.particleCount = 0;

    // Worker
    this.worker = null;
    this.workerReady = false;

    // Render
    this.renderer = null;
    this.renderLoop = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;

    // Stats
    this.tickTime = 0;
    this.fps = 0;
    this.lastTickTime = 0;

    // Bindings
    this._onTickComplete = this._onTickComplete.bind(this);
  }

  async init() {
    // 1. Load species defaults
    this.speciesManager.loadDefaultPreset();
    const speciesList = this.speciesManager.getAllSpecies();
    console.log('[VEPA] Species loaded:', speciesList.length);

    // 2. Init renderer
    this.renderer = new Renderer(
      this.config.container,
      this.config.worldSize,
      this.config.worldSize
    );
    await this.renderer.init();
    console.log('[VEPA] Renderer initialized');

    // 3. Spawn initial particles
    this._spawnParticles(this.config.particleCount);

    // 4. Init render loop
    this.renderLoop = new RenderLoop((dt) => this._frame(dt));
    this.renderLoop.start();
    console.log('[VEPA] Render loop started');

    // 5. Emit ready
    this.bus.emit('engine:ready', { particleCount: this.particleCount });
  }

  _spawnParticles(count) {
    const s = STRIDE_INDEXES;
    const speciesList = this.speciesManager.getAllSpecies();
    if (speciesList.length === 0) return;

    for (let i = 0; i < Math.min(count, MAX_PARTICLES); i++) {
      const base = i * PARTICLE_STRIDE;

      // Random position
      bufferSet(this.particleBuffer, base + s.POS_X, this.prng.range(0, this.config.worldSize));
      bufferSet(this.particleBuffer, base + s.POS_Y, this.prng.range(0, this.config.worldSize));
      bufferSet(this.particleBuffer, base + s.POS_Z, this.prng.range(0, this.config.worldSize));

      // Small random velocity
      bufferSet(this.particleBuffer, base + s.VEL_X, this.prng.range(-0.5, 0.5));
      bufferSet(this.particleBuffer, base + s.VEL_Y, this.prng.range(-0.5, 0.5));
      bufferSet(this.particleBuffer, base + s.VEL_Z, this.prng.range(-0.5, 0.5));

      // Assign species round-robin
      const species = speciesList[i % speciesList.length];
      bufferSet(this.particleBuffer, base + s.SPECIES_ID, species.id);
      bufferSet(this.particleBuffer, base + s.MASS, 1.0 + this.prng.nextFloat());

      // Life
      bufferSet(this.particleBuffer, base + s.ENERGY, 100);
      bufferSet(this.particleBuffer, base + s.AGE, 0);
      bufferSet(this.particleBuffer, base + s.DEAD, 0);

      // Phenotype
      expressPhenotype(this.particleBuffer, i, species.id);
    }

    this.particleCount = Math.min(count, MAX_PARTICLES);
  }

  _frame(dt) {
    // Run physics (inline for now — worker integration in Phase 2b)
    this._tickPhysics(dt);

    // Update sprites from buffer
    this.renderer.ensurePool(this.particleCount);
    updateSprites(
      this.particleBuffer,
      this.particleCount,
      this.renderer.sprites,
      this.config.worldSize,
      this.offsetX,
      this.offsetY,
      this.zoom
    );

    // Render
    this.renderer.render();

    // Update stats
    this.fps = this.renderLoop.fps;
  }

  _tickPhysics(dt) {
    const startTime = performance.now();
    const s = STRIDE_INDEXES;
    const lawFlags = this.lawManager.getFlags();

    // Rebuild grid
    this.grid.clear();
    for (let i = 0; i < this.particleCount; i++) {
      const base = i * PARTICLE_STRIDE;
      if (bufferGet(this.particleBuffer, base + s.DEAD) >= 1) continue;
      this.grid.insert(i, this.particleBuffer, PARTICLE_STRIDE);
    }

    // Compute forces and integrate
    for (let i = 0; i < this.particleCount; i++) {
      const base = i * PARTICLE_STRIDE;
      if (bufferGet(this.particleBuffer, base + s.DEAD) >= 1) continue;

      const neighbors = this.grid.getNeighborsForParticle(i, this.particleBuffer, PARTICLE_STRIDE);
      const maxN = Math.min(neighbors.count, 500); // MAX_INTERACTIONS

      let fx = 0, fy = 0, fz = 0;

      for (let j = 0; j < maxN; j++) {
        const ni = neighbors.indices[j];
        if (ni === i) continue;
        const nb = ni * PARTICLE_STRIDE;

        // Gravitational attraction
        if (this.lawManager.isLaw(LAW_INDEXES.GRAV)) {
          const dx = bufferGet(this.particleBuffer, nb + s.POS_X) - bufferGet(this.particleBuffer, base + s.POS_X);
          const dy = bufferGet(this.particleBuffer, nb + s.POS_Y) - bufferGet(this.particleBuffer, base + s.POS_Y);
          const dz = bufferGet(this.particleBuffer, nb + s.POS_Z) - bufferGet(this.particleBuffer, base + s.POS_Z);
          const distSq = dx * dx + dy * dy + dz * dz + 0.01;
          const dist = Math.sqrt(distSq);
          const massProduct = bufferGet(this.particleBuffer, base + s.MASS) * bufferGet(this.particleBuffer, nb + s.MASS);
          const force = massProduct / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
          fz += (dz / dist) * force;
        }

        // Collision
        if (this.lawManager.isLaw(LAW_INDEXES.COLL)) {
          const dx = bufferGet(this.particleBuffer, nb + s.POS_X) - bufferGet(this.particleBuffer, base + s.POS_X);
          const dy = bufferGet(this.particleBuffer, nb + s.POS_Y) - bufferGet(this.particleBuffer, base + s.POS_Y);
          const dz = bufferGet(this.particleBuffer, nb + s.POS_Z) - bufferGet(this.particleBuffer, base + s.POS_Z);
          const distSq = dx * dx + dy * dy + dz * dz;
          const rA = bufferGet(this.particleBuffer, base + s.RADIUS);
          const rB = bufferGet(this.particleBuffer, nb + s.RADIUS);
          if (distSq < (rA + rB) * (rA + rB) && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const overlap = (rA + rB) - dist;
            const force = overlap * 0.3;
            fx -= (dx / dist) * force;
            fy -= (dy / dist) * force;
            fz -= (dz / dist) * force;
          }
        }
      }

      // Clamp
      fx = clamp(fx, -50, 50);
      fy = clamp(fy, -50, 50);
      fz = clamp(fz, -50, 50);

      if (!isFinite(fx)) fx = 0;
      if (!isFinite(fy)) fy = 0;
      if (!isFinite(fz)) fz = 0;

      // Integrate velocity
      addTo(this.particleBuffer, base + s.VEL_X, fx * dt);
      addTo(this.particleBuffer, base + s.VEL_Y, fy * dt);
      addTo(this.particleBuffer, base + s.VEL_Z, fz * dt);

      // Integrate position (toroidal)
      this._toroidalAdd(base + s.POS_X, bufferGet(this.particleBuffer, base + s.VEL_X) * dt);
      this._toroidalAdd(base + s.POS_Y, bufferGet(this.particleBuffer, base + s.VEL_Y) * dt);
      this._toroidalAdd(base + s.POS_Z, bufferGet(this.particleBuffer, base + s.VEL_Z) * dt);

      // Validate
      for (const off of [s.POS_X, s.POS_Y, s.POS_Z, s.VEL_X, s.VEL_Y, s.VEL_Z]) {
        const v = bufferGet(this.particleBuffer, base + off);
        if (!isFinite(v)) bufferSet(this.particleBuffer, base + off, 0);
      }

      // Age
      addTo(this.particleBuffer, base + s.AGE, dt);
    }

    this.tickTime = performance.now() - startTime;
  }

  _toroidalAdd(offset, delta) {
    const v = bufferGet(this.particleBuffer, offset) + delta;
    const size = this.config.worldSize;
    const wrapped = ((v % size) + size) % size;
    bufferSet(this.particleBuffer, offset, wrapped);
  }

  _onTickComplete(data) {
    this.lastTickTime = data.dt;
    this.bus.emit('physics:tick', data);
  }

  /** Set law state. */
  setLaw(index, enabled) {
    this.lawManager.setLaw(index, enabled);
    this.bus.emit('law:changed', { index, enabled });
  }

  /** Reset simulation. */
  reset() {
    this.particleBuffer.fill(0);
    this.particleCount = 0;
    this.bus.emit('engine:reset');
  }
}

// Buffer helpers
function bufferGet(buf, offset) { return buf[offset]; }
function bufferSet(buf, offset, val) { buf[offset] = val; }
function addTo(buf, offset, val) { buf[offset] += val; }
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

export default VepaEngine;

// Auto-boot if this is the main module
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const setLoading = (msg) => { if (loading) loading.textContent = msg; };

    // Safety timeout — hide loading after 5s no matter what
    const safetyTimeout = setTimeout(() => {
      if (loading) loading.classList.add('hidden');
    }, 5000);

    try {

      const engine = new VepaEngine();
      window.vepa = engine;

      setLoading('VEPA v3 — Initializing UI...');

      // Init UI
      const ui = new UI(engine);
      engine.ui = ui;
      ui.init();

      // Wire HUD updates (before init so they're ready)
      setInterval(() => {
        try {
          const speciesList = engine.speciesManager.getAllSpecies();
          ui.updateHUD({
            fps: engine.fps,
            particleCount: engine.particleCount,
            speciesCount: speciesList.length,
            tickTime: engine.tickTime,
            activeLaws: Object.values(engine.lawManager.getAllLaws()).filter(Boolean).length,
          });
        } catch (e) { /* silently skip HUD update errors */ }
      }, 250);

      // Wire reset
      engine.bus.on('ui:reset', () => {
        engine.reset();
        engine._spawnParticles(engine.config.particleCount);
        ui._rebuildSpeciesUI();
      });

      setLoading('VEPA v3 — Starting simulation...');

      await engine.init();

      // Hide loading on ready
      engine.bus.on('engine:ready', () => {
        clearTimeout(safetyTimeout);
        if (loading) loading.classList.add('hidden');
      });

      // Also hide if we somehow missed the event
      setTimeout(() => {
        if (loading) loading.classList.add('hidden');
      }, 2000);

    } catch (err) {
      console.error('[VEPA] Boot failed:', err);
      setLoading('VEPA v3 — Error: ' + (err.message || 'Unknown error'));
      // Still hide loading after showing error
      setTimeout(() => { if (loading) loading.classList.add('hidden'); }, 4000);
    }
  });
}
