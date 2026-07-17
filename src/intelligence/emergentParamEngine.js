// VEPA v3 — Emergent Parameter Engine
// Discovers emergent parameter configurations by probing.

class EmergentParamEngine {
  constructor(eventBus, config = {}) {
    this.bus = eventBus;
    this.config = {
      probeInterval: config.probeInterval || 500,
      mutationAmount: config.mutationAmount || 0.1,
      ...config,
    };
    this.frameCount = 0;
    this.discoveries = [];
    this.baseline = null;
  }

  update(frameCount, speciesManager) {
    this.frameCount = frameCount;
    if (this.frameCount % this.config.probeInterval !== 0) return;

    // Record a "discovery" — a snapshot of current DNA configs
    const speciesList = speciesManager.getAllSpecies();
    const discovery = {
      tick: this.frameCount,
      species: speciesList.map(s => ({
        id: s.id,
        name: s.name,
        dna: Array.from(s.dna),
      })),
    };

    this.discoveries.push(discovery);
    if (this.discoveries.length > 20) this.discoveries.shift();

    this.bus.emit('emergent:discovery', discovery);
  }

  getDiscoveries() { return this.discoveries; }
  clear() { this.discoveries = []; }
}

export default EmergentParamEngine;
