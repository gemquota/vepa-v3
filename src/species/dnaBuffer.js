// VEPA v3 — Species DNA Buffer
// Uint16Array [64 species × 64 params] packed 0-65535.

import { DNA_STRIDE, MAX_SPECIES, DNA_RANGES } from '../constants.js';

// Use regular ArrayBuffer (no SharedArrayBuffer needed for inline physics)

class DnaBuffer {
  /**
   * @param {ArrayBuffer} [buffer] - Optional backing buffer
   */
  constructor(buffer) {
    const byteLength = MAX_SPECIES * DNA_STRIDE * 2; // 64×64×2 bytes
    if (buffer) {
      this.buffer = buffer;
    } else {
      this.buffer = new ArrayBuffer(byteLength);
    }
    this.data = new Uint16Array(this.buffer);
  }

  /**
   * Get raw packed value (0-65535) for a species DNA parameter.
   */
  getRaw(speciesId, paramIndex) {
    return this.data[speciesId * DNA_STRIDE + paramIndex];
  }

  /**
   * Set raw packed value.
   */
  setRaw(speciesId, paramIndex, value) {
    this.data[speciesId * DNA_STRIDE + paramIndex] = Math.max(0, Math.min(65535, Math.round(value)));
  }

  /**
   * Get unpacked float value for a species DNA parameter.
   * Maps from packed 0-65535 to the parameter's min-max range.
   */
  get(speciesId, paramIndex) {
    const range = DNA_RANGES[paramIndex];
    if (!range) return 0;
    const raw = this.getRaw(speciesId, paramIndex);
    return range.min + (raw / 65535) * (range.max - range.min);
  }

  /**
   * Set a DNA parameter from a float value.
   * Maps from float range to packed 0-65535.
   */
  set(speciesId, paramIndex, value) {
    const range = DNA_RANGES[paramIndex];
    if (!range) return;
    const clamped = Math.max(range.min, Math.min(range.max, value));
    const packed = Math.round(((clamped - range.min) / (range.max - range.min)) * 65535);
    this.setRaw(speciesId, paramIndex, packed);
  }

  /**
   * Get all DNA values for a species as a Float32Array (42 params).
   */
  getAll(speciesId) {
    const values = new Float32Array(42);
    const rangeKeys = Object.keys(DNA_RANGES).map(Number);
    for (const key of rangeKeys) {
      if (key < 42) values[key] = this.get(speciesId, key);
    }
    return values;
  }

  /**
   * Set all DNA values for a species from an object/array.
   * @param {number} speciesId
   * @param {Object|Array} values - {paramIndex: value} or array
   */
  setAll(speciesId, values) {
    if (Array.isArray(values)) {
      for (let i = 0; i < Math.min(values.length, 42); i++) {
        if (values[i] !== undefined) this.set(speciesId, i, values[i]);
      }
    } else {
      for (const [key, value] of Object.entries(values)) {
        this.set(speciesId, Number(key), value);
      }
    }
  }

  /**
   * Mutate a species' DNA randomly based on mutation rate.
   * @param {number} speciesId
   * @param {number} rate - 0.0-1.0 mutation probability
   * @param {Function} randomFn - () => [0,1) random function
   */
  mutate(speciesId, rate, randomFn = Math.random) {
    const rangeKeys = Object.keys(DNA_RANGES).map(Number);
    for (const key of rangeKeys) {
      if (key >= 42) break;
      if (randomFn() < rate) {
        const range = DNA_RANGES[key];
        const raw = this.getRaw(speciesId, key);
        const delta = Math.floor((randomFn() - 0.5) * 0.2 * 65535);
        const newRaw = Math.max(0, Math.min(65535, raw + delta));
        this.setRaw(speciesId, key, newRaw);
      }
    }
  }

  /**
   * Create a child DNA profile by combining two parents with mutation.
   * @param {number} parentAId
   * @param {number} parentBId
   * @param {number} mutationRate
   * @param {Function} randomFn
   * @returns {Float32Array} Child DNA values
   */
  crossover(parentAId, parentBId, mutationRate = 0.05, randomFn = Math.random) {
    const child = new Float32Array(42);
    const rangeKeys = Object.keys(DNA_RANGES).map(Number);
    for (const key of rangeKeys) {
      if (key >= 42) break;
      // Mix from both parents with random bias
      const a = this.get(parentAId, key);
      const b = this.get(parentBId, key);
      const blend = randomFn();
      let value = a * blend + b * (1 - blend);
      // Apply mutation
      if (randomFn() < mutationRate) {
        const range = DNA_RANGES[key];
        const mutation = (randomFn() - 0.5) * (range.max - range.min) * 0.2;
        value = Math.max(range.min, Math.min(range.max, value + mutation));
      }
      child[key] = value;
    }
    return child;
  }

  /** Create a copy of this buffer. */
  clone() {
    const newBuf = new DnaBuffer();
    newBuf.data.set(this.data);
    return newBuf;
  }
}

export default DnaBuffer;
