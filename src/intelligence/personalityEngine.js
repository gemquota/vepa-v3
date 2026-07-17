// VEPA v3 — Personality Engine
// Three-axis systemic bias driving narrative voice selection and goal tuning.

class PersonalityEngine {
  constructor(config = {}) {
    this.axes = {
      curiosity: config.curiosity ?? 0.5,
      stability: config.stability ?? 0.5,
      chaos: config.chaos ?? 0.3,
    };
  }

  setAxis(axis, value) {
    if (this.axes.hasOwnProperty(axis)) {
      this.axes[axis] = Math.max(0, Math.min(1, value));
    }
  }

  get(axis) { return this.axes[axis] || 0; }

  getAll() { return { ...this.axes }; }

  /**
   * Get narrative voice weights modulated by personality axes.
   */
  getVoiceWeights() {
    return {
      stabilizer: this.axes.stability * 0.5,
      diverger: this.axes.curiosity * 0.5,
      observer: (1 - this.axes.chaos) * 0.4,
      dissolver: this.axes.chaos * 0.5,
    };
  }

  toJSON() { return { ...this.axes }; }
  fromJSON(json) { Object.assign(this.axes, json); }
}

export default PersonalityEngine;
