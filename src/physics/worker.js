// VEPA v3 — Physics Web Worker
// Owns the SharedArrayBuffer, runs physics tick loop.
// Communicates with main thread via postMessage.

import SpatialGrid from './spatialGrid.js';
import { PARTICLE_STRIDE, MAX_PARTICLES, MAX_SUBSTEPS, MAX_INTERACTIONS, MAX_FORCE, STRIDE_INDEXES } from '../constants.js';

let particleBuffer = null;
let speciesBuffer = null;
let lawFlags = { low: 0, high: 0 };
let config = {
  worldSize: 800,
  dt: 0.016,
  seed: Date.now(),
};
let grid = null;
let running = false;
let tickCount = 0;

// Message handler
self.onmessage = function (msg) {
  const { type, data } = msg.data;
  switch (type) {
    case 'init':
      handleInit(data);
      break;
    case 'config':
      handleConfig(data);
      break;
    case 'tick':
      handleTick();
      break;
    case 'getState':
      handleGetState();
      break;
    case 'setState':
      handleSetState(data);
      break;
    case 'start':
      running = true;
      break;
    case 'stop':
      running = false;
      break;
    case 'reset':
      handleReset(data);
      break;
    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

function handleInit(data) {
  const { particleBuffer: pb, speciesBuffer: sb, worldSize, seed } = data;
  particleBuffer = new Float32Array(pb);
  if (sb) speciesBuffer = new Uint16Array(sb);
  config.worldSize = worldSize || config.worldSize;
  config.seed = seed || config.seed;
  grid = new SpatialGrid(config.worldSize);
  running = true;
  self.postMessage({ type: 'init-complete', data: { tick: 0 } });
}

function handleConfig(data) {
  if (data.lawFlags) {
    lawFlags.low = data.lawFlags.low;
    lawFlags.high = data.lawFlags.high;
  }
  if (data.worldSize !== undefined) {
    config.worldSize = data.worldSize;
    if (grid) grid.setWorldSize(data.worldSize);
  }
  if (data.dt !== undefined) config.dt = data.dt;
  if (data.speciesBuffer) speciesBuffer = new Uint16Array(data.speciesBuffer);
}

function handleTick() {
  if (!running || !particleBuffer) {
    self.postMessage({ type: 'tick-complete', data: { tick: tickCount, dt: 0 } });
    return;
  }

  const startTime = performance.now();
  const subSteps = Math.min(MAX_SUBSTEPS, Math.ceil(1 / config.dt));
  const subDt = config.dt / subSteps;

  for (let step = 0; step < subSteps; step++) {
    // Rebuild spatial grid
    grid.clear();
    const count = particleBuffer.length / PARTICLE_STRIDE;
    for (let i = 0; i < count; i++) {
      if (particleBuffer[i * PARTICLE_STRIDE + STRIDE_INDEXES.DEAD] >= 1) continue;
      grid.insert(i, particleBuffer, PARTICLE_STRIDE);
    }

    // Compute physics
    for (let i = 0; i < count; i++) {
      const base = i * PARTICLE_STRIDE;
      if (particleBuffer[base + STRIDE_INDEXES.DEAD] >= 1) continue;

      const neighbors = grid.getNeighborsForParticle(i, particleBuffer, PARTICLE_STRIDE);
      const maxN = Math.min(neighbors.count, MAX_INTERACTIONS);

      let fx = 0, fy = 0, fz = 0;

      for (let j = 0; j < maxN; j++) {
        const ni = neighbors.indices[j];
        if (ni === i) continue;
        const nb = ni * PARTICLE_STRIDE;

        // Basic gravitational attraction
        const dx = particleBuffer[nb] - particleBuffer[base];
        const dy = particleBuffer[nb + 1] - particleBuffer[base + 1];
        const dz = particleBuffer[nb + 2] - particleBuffer[base + 2];
        const distSq = dx * dx + dy * dy + dz * dz + 0.01;
        const dist = Math.sqrt(distSq);
        const massProduct = particleBuffer[base + STRIDE_INDEXES.MASS] * particleBuffer[nb + STRIDE_INDEXES.MASS];
        const force = massProduct / distSq;

        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
        fz += (dz / dist) * force;
      }

      // Clamp forces
      fx = clamp(fx, -MAX_FORCE, MAX_FORCE);
      fy = clamp(fy, -MAX_FORCE, MAX_FORCE);
      fz = clamp(fz, -MAX_FORCE, MAX_FORCE);

      // Validate for NaN
      if (!isFinite(fx)) fx = 0;
      if (!isFinite(fy)) fy = 0;
      if (!isFinite(fz)) fz = 0;

      // Integrate velocity
      particleBuffer[base + STRIDE_INDEXES.VEL_X] += fx * subDt;
      particleBuffer[base + STRIDE_INDEXES.VEL_Y] += fy * subDt;
      particleBuffer[base + STRIDE_INDEXES.VEL_Z] += fz * subDt;

      // Integrate position (toroidal)
      const stride = PARTICLE_STRIDE;
      particleBuffer[base + STRIDE_INDEXES.POS_X] = toroidal(
        particleBuffer[base + STRIDE_INDEXES.POS_X] + particleBuffer[base + STRIDE_INDEXES.VEL_X] * subDt,
        config.worldSize
      );
      particleBuffer[base + STRIDE_INDEXES.POS_Y] = toroidal(
        particleBuffer[base + STRIDE_INDEXES.POS_Y] + particleBuffer[base + STRIDE_INDEXES.VEL_Y] * subDt,
        config.worldSize
      );
      particleBuffer[base + STRIDE_INDEXES.POS_Z] = toroidal(
        particleBuffer[base + STRIDE_INDEXES.POS_Z] + particleBuffer[base + STRIDE_INDEXES.VEL_Z] * subDt,
        config.worldSize
      );

      // Validate positions
      if (!isFinite(particleBuffer[base + STRIDE_INDEXES.POS_X])) particleBuffer[base + STRIDE_INDEXES.POS_X] = 0;
      if (!isFinite(particleBuffer[base + STRIDE_INDEXES.POS_Y])) particleBuffer[base + STRIDE_INDEXES.POS_Y] = 0;
      if (!isFinite(particleBuffer[base + STRIDE_INDEXES.POS_Z])) particleBuffer[base + STRIDE_INDEXES.POS_Z] = 0;

      // Age
      particleBuffer[base + STRIDE_INDEXES.AGE] += subDt;
    }
  }

  tickCount++;
  const elapsed = performance.now() - startTime;
  self.postMessage({
    type: 'tick-complete',
    data: { tick: tickCount, dt: elapsed },
  });
}

function handleGetState() {
  self.postMessage({
    type: 'state',
    data: {
      particleBuffer: particleBuffer ? particleBuffer.buffer : null,
      speciesBuffer: speciesBuffer ? speciesBuffer.buffer : null,
      tick: tickCount,
      config: { ...config },
    },
  }, particleBuffer ? [particleBuffer.buffer] : []);
}

function handleSetState(data) {
  if (data.particleBuffer) {
    if (!particleBuffer || particleBuffer.length !== data.particleBuffer.length) {
      particleBuffer = new Float32Array(data.particleBuffer);
    } else {
      particleBuffer.set(data.particleBuffer);
    }
  }
  if (data.tick !== undefined) tickCount = data.tick;
  if (data.config) Object.assign(config, data.config);
}

function handleReset(data) {
  tickCount = 0;
  if (data) handleInit(data);
}

// Helpers
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function toroidal(v, size) {
  v = v % size;
  return v < 0 ? v + size : v;
}

export { }; // HMR safety
