// VEPA v3 — Insight Engine
// Spatio-temporal cluster detection and pattern logging.

class InsightEngine {
  constructor(eventBus, config = {}) {
    this.bus = eventBus;
    this.config = {
      checkInterval: config.checkInterval || 60,  // Frames between scans
      clusterMinSize: config.clusterMinSize || 3,
      ...config
    };
    this.frameCount = 0;
    this.clusters = [];
    this.log = [];
  }

  /**
   * Called each frame. Runs cluster detection every N frames.
   * @param {Float32Array} particleBuffer
   * @param {number} particleCount
   * @param {number} stride
   * @param {number} worldSize
   */
  update(particleBuffer, particleCount, stride, worldSize) {
    this.frameCount++;
    if (this.frameCount % this.config.checkInterval !== 0) return;

    const clusters = this._detectClusters(particleBuffer, particleCount, stride, worldSize);
    if (clusters.length > 0) {
      this.clusters = clusters;
      for (const cluster of clusters) {
        this.log.push({
          tick: this.frameCount,
          type: 'cluster',
          data: cluster,
        });
      }
      this.bus.emit('insight:clusters', clusters);
    }
  }

  _detectClusters(buffer, count, stride, worldSize) {
    // Simple proximity-based clustering
    const visited = new Uint8Array(count);
    const clusters = [];
    const threshold = 30; // Max distance for cluster membership

    for (let i = 0; i < count; i++) {
      if (visited[i] || buffer[i * stride + 74] >= 1) continue; // DEAD
      const base = i * stride;
      const cx = buffer[base];
      const cy = buffer[base + 1];
      const speciesId = buffer[base + 7];

      const members = [i];
      visited[i] = 1;

      for (let j = i + 1; j < count; j++) {
        if (visited[j] || buffer[j * stride + 74] >= 1) continue;
        const nb = j * stride;
        if (buffer[nb + 7] !== speciesId) continue; // Same species only
        const dx = buffer[nb] - cx;
        const dy = buffer[nb + 1] - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold) {
          members.push(j);
          visited[j] = 1;
        }
      }

      if (members.length >= this.config.clusterMinSize) {
        clusters.push({
          speciesId,
          size: members.length,
          particles: members,
          avgX: cx,
          avgY: cy,
          tick: this.frameCount,
        });
      }
    }

    return clusters;
  }

  getLog() { return this.log; }
  getRecentClusters(n = 5) { return this.clusters.slice(-n); }
  clear() { this.log = []; this.clusters = []; }
}

export default InsightEngine;
