// VEPA v3 — Species Manager
// CRUD for species profiles. Default presets ship built-in.

import DnaBuffer from './dnaBuffer.js';
import { DEFAULT_SPECIES, DNA_INDEXES, MAX_SPECIES } from '../constants.js';

const DEFAULT_COLORS = [
  { r: 1.0, g: 0.2, b: 0.2 },  // Red
  { r: 1.0, g: 0.9, b: 0.3 },  // Yellow
  { r: 0.2, g: 1.0, b: 0.3 },  // Green
  { r: 0.2, g: 0.8, b: 1.0 },  // Cyan
  { r: 0.5, g: 0.2, b: 0.8 },  // Purple
  { r: 1.0, g: 0.5, b: 0.0 },  // Orange
  { r: 0.8, g: 0.2, b: 0.5 },  // Pink
  { r: 0.3, g: 0.3, b: 0.3 },  // Gray
];

class SpeciesManager {
  constructor() {
    this.dnaBuffer = new DnaBuffer();
    this._species = new Map();
    this._nextId = 0;
  }

  addSpecies(name, dnaValues = {}, color) {
    if (this._species.size >= MAX_SPECIES) return -1;
    const id = this._nextId++;
    this._species.set(id, {
      name,
      color: color || DEFAULT_COLORS[id % DEFAULT_COLORS.length],
    });
    this.dnaBuffer.setAll(id, dnaValues);
    return id;
  }

  removeSpecies(id) {
    this._species.delete(id);
    for (const key of Object.keys(DNA_INDEXES)) {
      const idx = DNA_INDEXES[key];
      if (typeof idx === 'number' && idx < 42) {
        this.dnaBuffer.set(id, idx, 0);
      }
    }
  }

  getSpecies(id) {
    return this._species.get(id) || null;
  }

  getAllSpecies() {
    return Array.from(this._species.entries()).map(([id, info]) => ({
      id,
      ...info,
      dna: this.dnaBuffer.getAll(id),
    }));
  }

  get count() { return this._species.size; }

  loadDefaultPreset() {
    this.clear();
    const ids = [];
    for (const [key, def] of Object.entries(DEFAULT_SPECIES)) {
      const id = this.addSpecies(def.name, def.dna, def.color);
      ids.push(id);
    }
    return ids;
  }

  clear() {
    this._species.clear();
    this._nextId = 0;
  }

  toJSON() {
    return {
      species: Array.from(this._species.entries()).map(([id, info]) => ({
        id,
        name: info.name,
        color: info.color,
        dna: Array.from({ length: 42 }, (_, i) => this.dnaBuffer.get(id, i)),
      })),
      nextId: this._nextId,
    };
  }

  fromJSON(json) {
    this.clear();
    for (const s of json.species) {
      this._species.set(s.id, { name: s.name, color: s.color });
      if (s.dna) {
        for (let i = 0; i < Math.min(s.dna.length, 42); i++) {
          this.dnaBuffer.set(s.id, i, s.dna[i]);
        }
      }
      if (s.id >= this._nextId) this._nextId = s.id + 1;
    }
  }
}

export default SpeciesManager;
