// VEPA v3 — Goal Engine
// Auto-tunes world constraints toward stability/complexity targets.

class GoalEngine {
  constructor(eventBus, config = {}) {
    this.bus = eventBus;
    this.config = {
      evalInterval: config.evalInterval || 300,
      targetSpecies: config.targetSpecies || 5,
      targetDiversity: config.targetDiversity || 0.7,
      ...config,
    };
    this.frameCount = 0;
    this.goals = {
      stability: 0.5,
      complexity: 0.5,
      chaos: 0.0,
    };
    this.adjustments = [];
  }

  update(frameCount, particleCount, speciesCount, tickTime) {
    this.frameCount = frameCount;
    if (this.frameCount % this.config.evalInterval !== 0) return;

    // Evaluate current state
    const stability = 1 - Math.min(1, tickTime / 16); // Lower tick time = more stable
    const complexity = Math.min(1, speciesCount / this.config.targetSpecies);
    const chaos = particleCount > 0
      ? Math.min(1, speciesCount / Math.max(1, particleCount)) * 2
      : 0;

    this.goals.stability = stability;
    this.goals.complexity = complexity;
    this.goals.chaos = Math.min(1, chaos);

    this.bus.emit('goal:update', { ...this.goals });
  }

  getGoals() { return { ...this.goals }; }
}

export default GoalEngine;
