// VEPA v3 — Law Bitmask & State Management
// 64-law bitmask split into lowFlags (bits 0-31) and highFlags (bits 32-63).

import { LAW_INDEXES, MULTI_STATE_LAWS, LAW_CATEGORIES, LAW_CATEGORY_RANGES } from '../constants.js';

class LawManager {
  constructor() {
    this._laws = {};
    this._multiState = {};
    this.lowFlags = 0;
    this.highFlags = 0;

    // Initialize all laws to enabled (default)
    for (const key of Object.keys(LAW_INDEXES)) {
      const idx = LAW_INDEXES[key];
      if (typeof idx === 'number' && idx >= 0 && idx < 64) {
        this._laws[idx] = true;
      }
    }

    // Initialize multi-state laws
    for (const msl of MULTI_STATE_LAWS) {
      this._multiState[msl.index] = 0; // Start at state 0 (Off)
    }

    this._recomputeFlags();
  }

  /**
   * Enable or disable a law.
   * @param {number} index - Law index
   * @param {boolean} enabled
   */
  setLaw(index, enabled) {
    if (index >= 0 && index < 64) {
      this._laws[index] = !!enabled;
      this._recomputeFlags();
    }
  }

  /**
   * Check if a law is enabled.
   */
  isLaw(index) {
    return !!this._laws[index];
  }

  /**
   * Set multi-state law state (0 = off, 1+ = tiers).
   */
  setLawState(index, state) {
    if (this._multiState.hasOwnProperty(index)) {
      const msl = MULTI_STATE_LAWS.find(l => l.index === index);
      const maxState = msl ? msl.maxState : 0;
      this._multiState[index] = Math.max(0, Math.min(maxState, state));
      // Multi-state law is "enabled" when state > 0
      this._laws[index] = this._multiState[index] > 0;
      this._recomputeFlags();
    }
  }

  /**
   * Get multi-state law state.
   */
  getLawState(index) {
    return this._multiState.hasOwnProperty(index) ? this._multiState[index] : (this._laws[index] ? 1 : 0);
  }

  /**
   * Get all law states as a plain object.
   */
  getAllLaws() {
    const result = {};
    for (const key of Object.keys(LAW_INDEXES)) {
      const idx = LAW_INDEXES[key];
      if (typeof idx === 'number' && idx >= 0 && idx < 64) {
        result[key] = this._laws[idx];
      }
    }
    return result;
  }

  /**
   * Get the state of all laws as an array (index → boolean).
   */
  getLawArray() {
    const arr = new Array(64);
    for (let i = 0; i < 64; i++) {
      arr[i] = !!this._laws[i];
    }
    return arr;
  }

  /**
   * Recompute lowFlags and highFlags from current law states.
   */
  _recomputeFlags() {
    let low = 0;
    let high = 0;
    for (let i = 0; i < 32; i++) {
      if (this._laws[i]) low |= (1 << i);
    }
    for (let i = 32; i < 64; i++) {
      if (this._laws[i]) high |= (1 << (i - 32));
    }
    this.lowFlags = low >>> 0;
    this.highFlags = high >>> 0;
  }

  /**
   * Check if a specific law bit is set in the flags.
   * @param {number} index - Law index (0-63)
   * @param {number} low - Low 32-bit flags
   * @param {number} high - High 32-bit flags
   */
  static isSet(index, low, high) {
    if (index < 32) return (low & (1 << index)) !== 0;
    return (high & (1 << (index - 32))) !== 0;
  }

  /**
   * Get category for a law index.
   */
  static getCategory(index) {
    for (const [cat, [start, count]] of Object.entries(LAW_CATEGORY_RANGES)) {
      if (index >= start && index < start + count) return Number(cat);
    }
    return null;
  }

  /**
   * Get laws for a specific category.
   */
  getLawsByCategory(category) {
    const range = LAW_CATEGORY_RANGES[category];
    if (!range) return [];
    const [start, count] = range;
    const laws = [];
    for (let i = start; i < start + count; i++) {
      laws.push({ index: i, enabled: this._laws[i] });
    }
    return laws;
  }

  /** Serialize for persistence. */
  toJSON() {
    return {
      laws: { ...this._laws },
      multiState: { ...this._multiState },
      lowFlags: this.lowFlags,
      highFlags: this.highFlags,
    };
  }

  /** Restore from serialized state. */
  fromJSON(json) {
    if (json.laws) Object.assign(this._laws, json.laws);
    if (json.multiState) Object.assign(this._multiState, json.multiState);
    this._recomputeFlags();
  }

  /** Get current flags. */
  getFlags() {
    return { low: this.lowFlags, high: this.highFlags };
  }
}

export default LawManager;
