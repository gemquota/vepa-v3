import { bus } from "../../core/eventBus.js";
import { STRIDE_INDEXES } from "../../constants.js";

export class MetricsEngine {

  compute(particles, time = Date.now(), frame = 0) {
    const STRIDE = 64;
    const count = particles.length / STRIDE;

    if (count === 0) return;

    let totalVel = 0;
    let velocities = [];
    let totalMass = 0;
    let signalValues = [];

    for (let i = 0; i < count; i++) {
      const ptr = i * STRIDE;
      if (particles[ptr + STRIDE_INDEXES.DEAD] > 0) continue;

      const vx = particles[ptr + STRIDE_INDEXES.VEL_X];
      const vy = particles[ptr + STRIDE_INDEXES.VEL_Y];
      const vz = particles[ptr + STRIDE_INDEXES.VEL_Z];

      const speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
      velocities.push(speed);
      totalVel += speed;

      totalMass += particles[ptr + STRIDE_INDEXES.MASS];
      signalValues.push(particles[ptr + STRIDE_INDEXES.DNA_CACHE_START + 14] || 0); // Pulse Rate
    }

    const aliveCount = velocities.length;
    const avgVelocity = aliveCount > 0 ? totalVel / aliveCount : 0;

    const entropy = this.computeEntropy(velocities, 20);
    const coherence = this.computeCoherence(signalValues);
    const clusters = this.detectClusters(particles, STRIDE);

    const metrics = {
      particleCount: aliveCount,
      totalMass,
      avgVelocity,
      entropy,
      coherence,
      clusterCount: clusters.length,
      avgClusterSize: clusters.length > 0 ? clusters.reduce((acc, c) => acc + c.length, 0) / clusters.length : 0,
      clusters, 
      time,
      frame
    };

    bus.emit("metrics:updated", metrics);
  }

  computeEntropy(values, bins = 20) {
    if (values.length === 0) return 0;
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return 0;

    const hist = new Array(bins).fill(0);

    values.forEach(v => {
      const idx = Math.min(
        bins - 1,
        Math.floor(((v - min) / (max - min)) * bins)
      );
      hist[idx]++;
    });

    let entropy = 0;
    const total = values.length;

    for (let i = 0; i < bins; i++) {
      if (hist[i] === 0) continue;
      const p = hist[i] / total;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  computeCoherence(signals) {
    if (signals.length === 0) return 0;

    let mean = signals.reduce((a, b) => a + b, 0) / signals.length;

    let variance = signals.reduce((acc, s) => {
      return acc + Math.pow(s - mean, 2);
    }, 0) / signals.length;

    return 1 / (1 + variance);
  }

  detectClusters(particles, STRIDE) {
    const threshold = 20;
    const visited = new Set();
    let clusters = [];

    const count = particles.length / STRIDE;

    const getPos = (i) => {
      const ptr = i * STRIDE;
      return [
        particles[ptr + STRIDE_INDEXES.POS_X],
        particles[ptr + STRIDE_INDEXES.POS_Y],
        particles[ptr + STRIDE_INDEXES.POS_Z]
      ];
    };

    const dist = (a, b) => {
      const dx = a[0]-b[0];
      const dy = a[1]-b[1];
      const dz = a[2]-b[2];
      return Math.sqrt(dx*dx + dy*dy + dz*dz);
    };

    for (let i = 0; i < count; i++) {
      if (visited.has(i)) continue;
      // Skip dead particles
      if (particles[i * STRIDE + STRIDE_INDEXES.DEAD] > 0) continue;

      let stack = [i];
      let currentCluster = [];

      while (stack.length > 0) {
        const current = stack.pop();
        if (visited.has(current)) continue;

        visited.add(current);
        currentCluster.push(current);

        const posA = getPos(current);

        // Optimization: only check nearby particles?
        // For now, keep it simple but skip dead ones.
        for (let j = 0; j < count; j++) {
          if (visited.has(j)) continue;
          if (particles[j * STRIDE + STRIDE_INDEXES.DEAD] > 0) continue;

          const posB = getPos(j);

          if (dist(posA, posB) < threshold) {
            stack.push(j);
          }
        }
      }

      if (currentCluster.length > 1) { // Only count groups of 2+ as clusters
        clusters.push(currentCluster);
      }
    }

    return clusters;
  }

}

export const metricsEngine = new MetricsEngine();
