// VEPA v3 — VepaEngine Orchestrator
// Main entry point: boot sequence, render loop, worker coordination.

import EventBus from './core/eventBus.js';
import UI from './ui/ui.js';
import SplitMix32 from './core/prng.js';
import Renderer from './render/renderer.js';
import { updateSprites } from './render/spriteUpdater.js';
import { expressPhenotype } from './render/phenoType.js';
import SpeciesManager from './species/speciesManager.js';
import LawManager from './physics/laws.js';
import SpatialGrid from './physics/spatialGrid.js';
import {
  PARTICLE_STRIDE, MAX_PARTICLES, STRIDE_INDEXES, DNA_RANGES,
  LAW_INDEXES, DEFAULT_SPECIES, LAW_CATEGORIES,
} from './constants.js';

class VepaEngine {
  constructor(config = {}) {
    this.config = {
      worldSize: config.worldSize || 800,
      particleCount: config.particleCount || 500,
      initialCount: config.initialCount || 500,
      seed: config.seed || Date.now(),
      container: config.container || document.getElementById('canvas-container'),
      // World parameters
      gravityStrength: config.gravityStrength || 50000,
      dragCoeff: config.dragCoeff || 0.001,
      collisionStiffness: config.collisionStiffness || 0.5,
      signalScale: config.signalScale || 0.5,
      temperature: config.temperature || 0.5,
      pressure: config.pressure || 0.5,
      entropy: config.entropy || 0.1,
      timeScale: config.timeScale || 1.0,
      // V2-compatible world params
      globalViscosity: config.globalViscosity || 0.98,
      spawnRate: config.spawnRate || 0,
      shape: config.shape || 0.5,
      spreadX: config.spreadX || 0.8,
      spreadY: config.spreadY || 0.8,
      spreadZ: config.spreadZ || 0.5,
      order: config.order || 0.5,
      centerDensity: config.centerDensity || 0,
      densityRadius: config.densityRadius || 0.25,
      densityMultiplier: config.densityMultiplier || 2.0,
      baseSize: config.baseSize || 4.0,
      dimX: config.dimX || 800,
      dimY: config.dimY || 800,
      dimZ: config.dimZ || 400,
      windX: config.windX || 0,
      windY: config.windY || 0,
      windZ: config.windZ || 0,
      distributionType: config.distributionType || 'Grid',
      distributionCenterX: config.distributionCenterX || 0.5,
      distributionCenterY: config.distributionCenterY || 0.5,
      distributionCenterZ: config.distributionCenterZ || 0.5,
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
    this._spawnParticles(this.config.initialCount || this.config.particleCount);

    // 4. Use PixiJS ticker (like vepa2) — removes need for custom render loop
    this.appTicker = () => this._frame();
    this.renderer.app.ticker.add(this.appTicker);
    console.log('[VEPA] PixiJS ticker started');

    // 5. Emit ready
    this.bus.emit('engine:ready', { particleCount: this.particleCount });
  }

  _spawnParticles(count) {
    const s = STRIDE_INDEXES;
    const speciesList = this.speciesManager.getAllSpecies();
    if (speciesList.length === 0) return;
    const cfg = this.config;
    const ws = cfg.worldSize;
    const half = ws / 2;
    const spreadX = cfg.spreadX || 1.0;
    const spreadY = cfg.spreadY || 1.0;
    const spreadZ = cfg.spreadZ || 1.0;
    const distType = cfg.distributionType || 'Grid';

    for (let i = 0; i < Math.min(count, MAX_PARTICLES); i++) {
      const base = i * PARTICLE_STRIDE;
      let px = 0, py = 0, pz = 0;

      // Position based on distribution type (centered coords like vepa2: -half to +half)
      if (distType === 'Soup') {
        px = (this.prng.nextFloat() - 0.5) * ws * spreadX;
        py = (this.prng.nextFloat() - 0.5) * ws * spreadY;
        pz = (this.prng.nextFloat() - 0.5) * ws * spreadZ;
      } else if (distType === 'Big Bang') {
        const angle = this.prng.nextFloat() * Math.PI * 2;
        const radius = this.prng.nextFloat() * half * 0.4;
        px = Math.cos(angle) * radius;
        py = Math.sin(angle) * radius;
        pz = (this.prng.nextFloat() - 0.5) * ws * 0.1 * spreadZ;
      } else if (distType === 'Bipolar') {
        const pole = this.prng.nextFloat() > 0.5 ? 1 : -1;
        px = pole * half * 0.4 * spreadX + (this.prng.nextFloat() - 0.5) * 50;
        py = (this.prng.nextFloat() - 0.5) * ws * spreadY;
        pz = (this.prng.nextFloat() - 0.5) * ws * spreadZ;
      } else if (distType === 'Galaxy') {
        const angle = this.prng.nextFloat() * Math.PI * 2;
        const r = Math.sqrt(this.prng.nextFloat()) * half * 0.5 * spreadX;
        px = Math.cos(angle) * r;
        py = Math.sin(angle) * r;
        pz = (this.prng.nextFloat() - 0.5) * ws * 0.1 * spreadZ;
      } else { // Grid (default)
        const side = Math.ceil(Math.cbrt(count));
        const gx = i % side;
        const gy = Math.floor(i / side) % side;
        const gz = Math.floor(i / (side * side));
        const spacing = ws / side;
        px = (gx - (side - 1) / 2) * spacing;
        py = (gy - (side - 1) / 2) * spacing;
        pz = (gz - (side - 1) / 2) * spacing;
      }

      bufferSet(this.particleBuffer, base + s.POS_X, px);
      bufferSet(this.particleBuffer, base + s.POS_Y, py);
      bufferSet(this.particleBuffer, base + s.POS_Z, pz);

      // Small random velocity
      bufferSet(this.particleBuffer, base + s.VEL_X, (this.prng.nextFloat() - 0.5) * 2);
      bufferSet(this.particleBuffer, base + s.VEL_Y, (this.prng.nextFloat() - 0.5) * 2);
      bufferSet(this.particleBuffer, base + s.VEL_Z, (this.prng.nextFloat() - 0.5) * 2);

      // Assign species round-robin
      const species = speciesList[i % speciesList.length];
      bufferSet(this.particleBuffer, base + s.SPECIES_ID, species.id);
      bufferSet(this.particleBuffer, base + s.MASS, 1.0 + this.prng.nextFloat());

      // Life
      bufferSet(this.particleBuffer, base + s.ENERGY, 100);
      bufferSet(this.particleBuffer, base + s.AGE, 0);
      bufferSet(this.particleBuffer, base + s.DEAD, 0);

      // Cache DNA in particle buffer (unpack from Uint16 to float)
      for (let d = 0; d < 42; d++) {
        const raw = species.dna ? species.dna[d] : 0;
        const range = DNA_RANGES[d];
        const val = range ? range.min + (raw / 65535) * (range.max - range.min) : raw;
        bufferSet(this.particleBuffer, base + s.DNA_CACHE_START + d, val);
      }

      // Phenotype
      expressPhenotype(this.particleBuffer, i, species.id);
    }
    this.particleCount = Math.min(count, MAX_PARTICLES);
  }

  _frame() {
    // Run physics with default dt
    this._tickPhysics(1/60);

    // Camera transform (vepa2-compatible)
    const cam = this.renderer ? this.renderer.getTransform() : { panX: 0, panY: 0, panZ: 0, zoom: 1, rotX: 0, rotY: 0, focalLength: 400 };

    // Update sprites from buffer with camera transform
    this.renderer.ensurePool(this.particleCount);
    updateSprites(
      this.particleBuffer,
      this.particleCount,
      this.renderer.sprites,
      this.config.worldSize,
      cam.panX,
      cam.panY,
      cam.panZ,
      cam.zoom,
      cam.rotX,
      cam.rotY,
      cam.focalLength,
      this.renderer.width,
      this.renderer.height
    );

    // Render stage (PixiJS 8 ticker does not auto-render)
    this.renderer.render();
  }

  _tickPhysics(dt) {
    const startTime = performance.now();
    const s = STRIDE_INDEXES;
    const cfg = this.config;

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

      const mass = Math.max(bufferGet(this.particleBuffer, base + s.MASS), 0.1);
      const invMass = 1 / mass;
      const dtScaled = dt * cfg.timeScale;

      const neighbors = this.grid.getNeighborsForParticle(i, this.particleBuffer, PARTICLE_STRIDE);
      const maxN = Math.min(neighbors.count, 500);

      let fx = 0, fy = 0, fz = 0;

      for (let j = 0; j < maxN; j++) {
        const ni = neighbors.indices[j];
        if (ni === i) continue;
        const nb = ni * PARTICLE_STRIDE;

        const dx = bufferGet(this.particleBuffer, nb + s.POS_X) - bufferGet(this.particleBuffer, base + s.POS_X);
        const dy = bufferGet(this.particleBuffer, nb + s.POS_Y) - bufferGet(this.particleBuffer, base + s.POS_Y);
        const dz = bufferGet(this.particleBuffer, nb + s.POS_Z) - bufferGet(this.particleBuffer, base + s.POS_Z);
        const distSq = dx * dx + dy * dy + dz * dz + 0.01;
        const dist = Math.sqrt(distSq);

        // ── GRAVITY ──
        if (this.lawManager.isLaw(LAW_INDEXES.GRAV)) {
          const massProduct = mass * bufferGet(this.particleBuffer, nb + s.MASS);
          const force = cfg.gravityStrength * massProduct / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
          fz += (dz / dist) * force;
        }

        // ── COLLISION ──
        if (this.lawManager.isLaw(LAW_INDEXES.COLL)) {
          const rA = bufferGet(this.particleBuffer, base + s.RADIUS);
          const rB = bufferGet(this.particleBuffer, nb + s.RADIUS);
          const colDistSq = dx * dx + dy * dy + dz * dz;
          if (colDistSq < (rA + rB) * (rA + rB) && colDistSq > 0.01) {
            const colDist = Math.sqrt(colDistSq);
            const overlap = (rA + rB) - colDist;
            const force = overlap * cfg.collisionStiffness;
            fx -= (dx / colDist) * force;
            fy -= (dy / colDist) * force;
            fz -= (dz / colDist) * force;
          }
        }

        // ── AFFINITY (social attraction/repulsion) ──
        if (this.lawManager.isLaw(LAW_INDEXES.AFFINITY)) {
          const spA = bufferGet(this.particleBuffer, base + s.SPECIES_ID);
          const spB = bufferGet(this.particleBuffer, nb + s.SPECIES_ID);
          if (spA === spB) {
            // Same species: attract
            const force = cfg.gravityStrength * 0.1 / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
            fz += (dz / dist) * force;
          }
        }

        // ── PREDATION ──
        if (this.lawManager.isLaw(LAW_INDEXES.PREDATION)) {
          const massA = mass;
          const massB = bufferGet(this.particleBuffer, nb + s.MASS);
          // Predator (higher mass) chases prey (lower mass)
          if (massA > massB * 1.5) {
            const force = cfg.gravityStrength * 0.3 / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
            fz += (dz / dist) * force;
          }
        }

        // ── BOND ──
        if (this.lawManager.isLaw(LAW_INDEXES.BOND)) {
          const rA = bufferGet(this.particleBuffer, base + s.RADIUS);
          const rB = bufferGet(this.particleBuffer, nb + s.RADIUS);
          const bondDist = (rA + rB) * 1.5;
          if (dist < bondDist) {
            const springForce = (bondDist - dist) * 0.05;
            fx += (dx / dist) * springForce;
            fy += (dy / dist) * springForce;
            fz += (dz / dist) * springForce;
          }
        }

        // ── ELECTRIC (polarity-based) ──
        if (this.lawManager.isLaw(LAW_INDEXES.ELEC)) {
          // Assumes POLARITY DNA param expressed in a range; use cached signal as proxy
          const sigA = bufferGet(this.particleBuffer, base + s.SIGNAL) || 0;
          const sigB = bufferGet(this.particleBuffer, nb + s.SIGNAL) || 0;
          const chargeProduct = sigA * sigB;
          if (Math.abs(chargeProduct) > 0.01) {
            const force = chargeProduct * 50 / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
            fz += (dz / dist) * force;
          }
        }
      }

      // ── DRAG (velocity damping) ──
      if (this.lawManager.isLaw(LAW_INDEXES.DRAG)) {
        fx -= bufferGet(this.particleBuffer, base + s.VEL_X) * cfg.dragCoeff;
        fy -= bufferGet(this.particleBuffer, base + s.VEL_Y) * cfg.dragCoeff;
        fz -= bufferGet(this.particleBuffer, base + s.VEL_Z) * cfg.dragCoeff;
      }

      // ── ENTROPY (thermal jitter) ──
      if (this.lawManager.isLaw(LAW_INDEXES.ENTR)) {
        const jitter = cfg.entropy * 10;
        fx += (this.prng.nextFloat() - 0.5) * jitter;
        fy += (this.prng.nextFloat() - 0.5) * jitter;
        fz += (this.prng.nextFloat() - 0.5) * jitter;
      }

      // ── JITTER (Brownian motion, scaled by temperature) ──
      if (this.lawManager.isLaw(LAW_INDEXES.JITTER_LAW)) {
        const jit = cfg.temperature * 5;
        fx += (this.prng.nextFloat() - 0.5) * jit;
        fy += (this.prng.nextFloat() - 0.5) * jit;
        fz += (this.prng.nextFloat() - 0.5) * jit;
      }

      // ── WIND (global flow) ──
      fx += cfg.windX || 0;
      fy += cfg.windY || 0;
      fz += cfg.windZ || 0;

      // ── GLOBAL VISCOSITY (velocity scaling) ──
      if (cfg.globalViscosity < 1.0) {
        const vScale = 1 - (1 - cfg.globalViscosity) * 0.1;
        bufferSet(this.particleBuffer, base + s.VEL_X, bufferGet(this.particleBuffer, base + s.VEL_X) * vScale);
        bufferSet(this.particleBuffer, base + s.VEL_Y, bufferGet(this.particleBuffer, base + s.VEL_Y) * vScale);
        bufferSet(this.particleBuffer, base + s.VEL_Z, bufferGet(this.particleBuffer, base + s.VEL_Z) * vScale);
      }

      // ── TORQUE (vorticity) ──
      if (this.lawManager.isLaw(LAW_INDEXES.TORQUE_LAW)) {
        // Simple rotational bias
        fx += -fy * 0.01;
        fy += fx * 0.01;
      }

      // ── GLOW (signal emission) ──
      if (this.lawManager.isLaw(LAW_INDEXES.GLOW)) {
        // Signal proportional to temperature + energy
        const energy = bufferGet(this.particleBuffer, base + s.ENERGY) || 0;
        const sig = (cfg.temperature * 0.5 + energy / 200) * 0.5;
        bufferSet(this.particleBuffer, base + s.SIGNAL, Math.min(1, sig));
      }

      // ── LIFE (energy drain / aging) ──
      if (this.lawManager.isLaw(LAW_INDEXES.LIFE)) {
        const energy = bufferGet(this.particleBuffer, base + s.ENERGY);
        const drain = 0.01 * dtScaled;
        bufferSet(this.particleBuffer, base + s.ENERGY, Math.max(0, energy - drain));
        if (energy <= 0) {
          bufferSet(this.particleBuffer, base + s.DEAD, 1);
        }
      }

      // ── SENESCENCE (accelerated aging) ──
      if (this.lawManager.isLaw(LAW_INDEXES.SENESCENCE)) {
        const age = bufferGet(this.particleBuffer, base + s.AGE);
        if (age > 100) {
          // Older particles take more damage
          const dmg = (age - 100) * 0.001 * dtScaled;
          const energy = bufferGet(this.particleBuffer, base + s.ENERGY);
          bufferSet(this.particleBuffer, base + s.ENERGY, Math.max(0, energy - dmg));
        }
      }

      // ── TIME (time dilation by mass) ──
      if (this.lawManager.isLaw(LAW_INDEXES.TIME)) {
        // High mass = slower time (reduce velocity integration)
        const dilation = 1 / (1 + mass * 0.01);
        fx *= dilation;
        fy *= dilation;
        fz *= dilation;
      }

      // Clamp forces
      fx = clamp(fx, -MAX_FORCE, MAX_FORCE);
      fy = clamp(fy, -MAX_FORCE, MAX_FORCE);
      fz = clamp(fz, -MAX_FORCE, MAX_FORCE);
      if (!isFinite(fx)) fx = 0;
      if (!isFinite(fy)) fy = 0;
      if (!isFinite(fz)) fz = 0;

      // Integrate velocity (vepa2-style: accumulate F/m, position uses dt)
      addTo(this.particleBuffer, base + s.VEL_X, fx * invMass);
      addTo(this.particleBuffer, base + s.VEL_Y, fy * invMass);
      addTo(this.particleBuffer, base + s.VEL_Z, fz * invMass);

      // Integrate position (toroidal)
      this._toroidalAdd(base + s.POS_X, bufferGet(this.particleBuffer, base + s.VEL_X) * dtScaled);
      this._toroidalAdd(base + s.POS_Y, bufferGet(this.particleBuffer, base + s.VEL_Y) * dtScaled);
      this._toroidalAdd(base + s.POS_Z, bufferGet(this.particleBuffer, base + s.VEL_Z) * dtScaled);

      // Validate
      for (const off of [s.POS_X, s.POS_Y, s.POS_Z, s.VEL_X, s.VEL_Y, s.VEL_Z]) {
        const v = bufferGet(this.particleBuffer, base + off);
        if (!isFinite(v)) bufferSet(this.particleBuffer, base + off, 0);
      }

      // Age
      addTo(this.particleBuffer, base + s.AGE, dtScaled);
    }

    this.tickTime = performance.now() - startTime;
  }

  _toroidalAdd(offset, delta) {
    const v = bufferGet(this.particleBuffer, offset) + delta;
    const size = this.config.worldSize;
    const half = size / 2;
    // Wrap to centered coordinate range [-half, +half)
    let wrapped = ((v % size) + size) % size;
    if (wrapped >= half) wrapped -= size;
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
          const cam = engine.renderer ? engine.renderer.getTransform() : {};
          ui.updateHUD({
            fps: engine.fps,
            particleCount: engine.particleCount,
            speciesCount: speciesList.length,
            tickTime: engine.tickTime,
            activeLaws: Object.values(engine.lawManager.getAllLaws()).filter(Boolean).length,
            camX: cam.offsetX || 0,
            camY: cam.offsetY || 0,
            camZoom: cam.zoom || 1,
            gravity: engine.config.gravityStrength || 0,
            entropy: engine.config.entropy || 0,
            windX: engine.config.windX || 0,
            windY: engine.config.windY || 0,
          });
        } catch (e) { /* silently skip HUD update errors */ }
      }, 250);

      // Wire reset
      engine.bus.on('ui:reset', () => {
        engine.reset();
        engine._spawnParticles(engine.config.initialCount || engine.config.particleCount);
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
      // Build detailed error message
      const detail = err.stack || err.message || String(err);
      // Show error on loading screen with tap-to-copy
      if (loading) {
        loading.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0a12;color:#ff4444;font:12px/1.5 monospace;padding:20px;z-index:9999;cursor:pointer;text-align:left;overflow:auto;';
        loading.innerHTML = '<div style="color:#ff6666;font-weight:bold;margin-bottom:8px;">⚠ VEPA v3 — Error</div>' +
          '<div style="color:#cc8888;font-size:11px;margin-bottom:12px;max-width:600px;word-break:break-all;">' +
          err.message + '</div>' +
          '<pre style="color:#8899aa;font-size:10px;max-width:600px;overflow:auto;white-space:pre-wrap;">' +
          (err.stack || 'No stack trace') + '</pre>' +
          '<div style="color:#667788;font-size:10px;margin-top:12px;">tap to copy error details</div>';
        loading.onclick = () => {
          const text = 'VEPA v3 Error:\n' + err.message + '\n\n' + (err.stack || '');
          navigator.clipboard.writeText(text).then(() => {
            const msg = loading.querySelector('div:last-child');
            if (msg) msg.textContent = '✓ copied to clipboard';
          }).catch(() => {
            // Fallback: select text manually
            const range = document.createRange();
            range.selectNodeContents(loading);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          });
        };
      }
      // Still hide after showing error (longer for reading)
      setTimeout(() => { if (loading) loading.classList.add('hidden'); }, 15000);
    }
  });
}
