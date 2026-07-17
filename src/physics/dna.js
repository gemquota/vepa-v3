// VEPA v3 — DNA Parameter Access Helpers
// Computed DNA_OFFSETS for direct particle buffer access.

import { PARTICLE_STRIDE, STRIDE_INDEXES, DNA_RANGES } from '../constants.js';

const DNA_COUNT = Object.keys(DNA_RANGES).filter(k => Number(k) < 42).length;

/**
 * Pre-computed DNA cache offsets within the particle stride.
 * Each maps a DNA index (0-41) to its buffer offset (STRIDE_INDEXES.DNA_CACHE_START + idx).
 */
export const DNA_OFFSETS = {};
(function buildOffsets() {
  for (let i = 0; i < 42; i++) {
    DNA_OFFSETS[i] = STRIDE_INDEXES.DNA_CACHE_START + i;
  }
})();

/**
 * Get a cached DNA value from a particle buffer.
 * @param {Float32Array} buffer - Particle buffer
 * @param {number} particleIndex
 * @param {number} dnaIndex - DNA parameter index (0-41)
 * @returns {number}
 */
export function getDNACached(buffer, particleIndex, dnaIndex) {
  return buffer[particleIndex * PARTICLE_STRIDE + DNA_OFFSETS[dnaIndex]];
}

/**
 * Set a cached DNA value in a particle buffer.
 */
export function setDNACached(buffer, particleIndex, dnaIndex, value) {
  buffer[particleIndex * PARTICLE_STRIDE + DNA_OFFSETS[dnaIndex]] = value;
}

/**
 * Cache DNA from species buffer into particle buffer.
 * @param {Float32Array} particleBuffer
 * @param {number} particleIndex
 * @param {Uint16Array} speciesBuffer
 * @param {number} speciesId
 */
export function cacheDNA(particleBuffer, particleIndex, speciesBuffer, speciesId) {
  const speciesBase = speciesId * 64;
  const particleBase = particleIndex * PARTICLE_STRIDE + STRIDE_INDEXES.DNA_CACHE_START;
  for (let i = 0; i < 42; i++) {
    const raw = speciesBuffer[speciesBase + i];
    const range = DNA_RANGES[i];
    if (range) {
      particleBuffer[particleBase + i] = range.min + (raw / 65535) * (range.max - range.min);
    }
  }
}

export { DNA_COUNT };
