// VEPA v3 — Lineage Tracker
// Tracks parent→offspring relationships and evolutionary genealogy.

class LineageTracker {
  constructor(eventBus) {
    this.bus = eventBus;
    this.entries = [];
    this._nextId = 0;
  }

  /**
   * Record a birth event.
   */
  recordBirth(parentIds, childIndex, speciesId, mutationDelta = 0) {
    const entry = {
      id: this._nextId++,
      tick: 0, // Set externally
      parentIds,
      childIndex,
      speciesId,
      mutationDelta,
    };
    this.entries.push(entry);
    this.bus.emit('lineage:birth', entry);
    return entry;
  }

  /**
   * Record an extinction event (last of a species dies).
   */
  recordExtinction(speciesId, lastTick) {
    const entry = {
      id: this._nextId++,
      tick: lastTick,
      type: 'extinction',
      speciesId,
    };
    this.entries.push(entry);
    this.bus.emit('lineage:extinction', entry);
  }

  getAncestors(particleIndex) {
    return this.entries.filter(e => e.childIndex === particleIndex);
  }

  getDescendants(speciesId) {
    return this.entries.filter(e => e.speciesId === speciesId);
  }

  getAll() { return this.entries; }
  clear() { this.entries = []; }
}

export default LineageTracker;
