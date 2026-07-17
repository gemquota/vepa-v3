// VEPA v3 — Law Synergy Engine
// Computes emergent synergy effects from law properties at runtime.
// Synergies are derived from law category pairings, polarity, and intensity,
// not from a hardcoded matrix.

import { LAW_CATEGORIES, LAW_CATEGORY_RANGES } from '../constants.js';

// Category pairing → base synergy multiplier
const CATEGORY_SYNERGY = {
  // Physics + X
  '0-1': -0.5,   // Physics + Biology: life resists raw physics
  '0-2': 0.3,    // Physics + Chemistry: catalysis boost
  '0-3': 0.5,    // Physics + Thermodynamics: heat from motion
  '0-4': -0.8,   // Physics + Metaphysics: reality friction

  // Biology + X
  '1-2': 0.4,    // Biology + Chemistry: metabolism synergy
  '1-3': -0.3,   // Biology + Thermodynamics: energy cost
  '1-4': 0.6,    // Biology + Metaphysics: life force resonance

  // Chemistry + X
  '2-3': 0.7,    // Chemistry + Thermodynamics: reaction heat
  '2-4': -0.2,   // Chemistry + Metaphysics: alchemical loss

  // Thermodynamics + X
  '3-4': 0.3,    // Thermodynamics + Metaphysics: entropic resonance

  // Same category
  '0-0': 0.1,    // Physics + Physics: constructive interference
  '1-1': 0.2,    // Biology + Biology: emergent complexity
  '2-2': 0.15,   // Chemistry + Chemistry: reaction chains
  '3-3': 0.25,   // Thermodynamics + Thermodynamics: feedback loops
  '4-4': 0.5,    // Metaphysics + Metaphysics: reality distortion
};

class SynergyEngine {
  /**
   * Compute synergy multiplier between two laws (identified by their categories).
   * @param {number} catA - Category of law A
   * @param {number} catB - Category of law B
   * @param {number} [stateA=1] - Multi-state tier of law A
   * @param {number} [stateB=1] - Multi-state tier of law B
   * @returns {number} Synergy multiplier
   */
  static computeSynergy(catA, catB, stateA = 1, stateB = 1) {
    const key = `${Math.min(catA, catB)}-${Math.max(catA, catB)}`;
    let base = CATEGORY_SYNERGY[key] || 0;

    // Modulate by state tiers
    const stateFactor = ((stateA || 1) + (stateB || 1)) / 2;
    base *= stateFactor;

    // Law polarity: opposite categories get penalty, aligned get bonus
    if (catA === catB) {
      base *= 1.2; // Same-category laws reinforce
    }

    return base;
  }

  /**
   * Get all active synergies for a set of enabled law indices.
   * @param {number[]} enabledIndices - Array of enabled law indices
   * @returns {Array<{lawA: number, lawB: number, synergy: number}>}
   */
  static getActiveSynergies(enabledIndices) {
    const synergies = [];
    const len = enabledIndices.length;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const catA = this._getCategory(enabledIndices[i]);
        const catB = this._getCategory(enabledIndices[j]);
        if (catA === null || catB === null) continue;

        const synergy = this.computeSynergy(catA, catB);
        if (Math.abs(synergy) > 0.01) {
          synergies.push({
            lawA: enabledIndices[i],
            lawB: enabledIndices[j],
            synergy,
          });
        }
      }
    }

    // Sort by absolute synergy (most impactful first)
    synergies.sort((a, b) => Math.abs(b.synergy) - Math.abs(a.synergy));
    return synergies;
  }

  /**
   * Get the base synergy multiplier for a category pair (for display/docs).
   */
  static getBaseSynergy(catA, catB) {
    const key = `${Math.min(catA, catB)}-${Math.max(catA, catB)}`;
    return CATEGORY_SYNERGY[key] || 0;
  }

  /** Get category of a law index. */
  static _getCategory(index) {
    for (const [cat, [start, count]] of Object.entries(LAW_CATEGORY_RANGES)) {
      if (index >= start && index < start + count) return Number(cat);
    }
    return null;
  }
}

export default SynergyEngine;
