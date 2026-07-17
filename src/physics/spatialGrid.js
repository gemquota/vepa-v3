// VEPA v3 — Spatial Hash Grid (12×12×12)
// Optimizes O(N²) to local neighborhood queries.

import { GRID_SIZE, MAX_CELL_CAPACITY, TOTAL_CELLS } from '../constants.js';

class SpatialGrid {
  /**
   * @param {number} worldSize - World extent in pixels (toroidal)
   */
  constructor(worldSize = 800) {
    this.worldSize = worldSize;
    this.cellSize = worldSize / GRID_SIZE;
    this._cells = new Array(TOTAL_CELLS);
    this._cellCounts = new Int32Array(TOTAL_CELLS);
    this._particleIndices = new Int32Array(MAX_CELL_CAPACITY * TOTAL_CELLS);
    this._neighborCache = new Int32Array(27 * 200); // 27-cell × 200 particles
    this._neighborCounts = new Int32Array(27);
    this.clear();
  }

  /** Clear all cells (call at start of each sub-step). */
  clear() {
    this._cellCounts.fill(0);
    // Clear cells array references
    for (let i = 0; i < TOTAL_CELLS; i++) {
      this._cells[i] = null;
    }
  }

  /**
   * Convert world coordinate to grid cell index on one axis.
   * Toroidal wrapping.
   */
  _toCell(v) {
    let c = Math.floor(v / this.cellSize);
    if (c < 0) c += GRID_SIZE * Math.ceil(-c / GRID_SIZE);
    return ((c % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  }

  /**
   * Get linear cell index from 3D grid coordinates.
   */
  _cellIndex(cx, cy, cz) {
    return (cz * GRID_SIZE + cy) * GRID_SIZE + cx;
  }

  /**
   * Insert a particle into the grid.
   * @param {number} particleIndex
   * @param {Float32Array} buffer
   * @param {number} stride
   */
  insert(particleIndex, buffer, stride) {
    const base = particleIndex * stride;
    const x = buffer[base];
    const y = buffer[base + 1];
    const z = buffer[base + 2];

    const cx = this._toCell(x);
    const cy = this._toCell(y);
    const cz = this._toCell(z);
    const ci = this._cellIndex(cx, cy, cz);

    let count = this._cellCounts[ci];
    if (count >= MAX_CELL_CAPACITY) return; // Cell full

    const idx = ci * MAX_CELL_CAPACITY + count;
    this._particleIndices[idx] = particleIndex;
    this._cellCounts[ci] = count + 1;
  }

  /**
   * Get neighbor particle indices for a given grid cell (27-cell neighborhood).
   * Returns { indices: Int32Array, count: number }
   */
  getNeighbors(cx, cy, cz) {
    let total = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = ((cx + dx) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
          const ny = ((cy + dy) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
          const nz = ((cz + dz) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
          const ni = this._cellIndex(nx, ny, nz);
          const count = this._cellCounts[ni];
          if (count > 0) {
            const start = ni * MAX_CELL_CAPACITY;
            for (let i = 0; i < count; i++) {
              this._neighborCache[total++] = this._particleIndices[start + i];
            }
          }
        }
      }
    }
    return { indices: this._neighborCache, count: total };
  }

  /**
   * Get neighbors for a specific particle (by its position).
   */
  getNeighborsForParticle(particleIndex, buffer, stride) {
    const base = particleIndex * stride;
    const cx = this._toCell(buffer[base]);
    const cy = this._toCell(buffer[base + 1]);
    const cz = this._toCell(buffer[base + 2]);
    return this.getNeighbors(cx, cy, cz);
  }

  /** Update world size (recalculate cellSize). */
  setWorldSize(size) {
    this.worldSize = size;
    this.cellSize = size / GRID_SIZE;
  }
}

export default SpatialGrid;
