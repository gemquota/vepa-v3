import { bus } from "../../core/eventBus.js";

export class DerivedMetricsEngine {

  constructor() {
    this.last = null;
  }

  compute(metrics) {
    if (!metrics) return;

    const { entropy, coherence, clusterCount, avgClusterSize, avgVelocity } = metrics;

    let stability =
      (1 - entropy / 5) * 0.5 +
      coherence * 0.3 +
      (avgClusterSize / (avgClusterSize + 10)) * 0.2;

    let complexity =
      (clusterCount / 50) * 0.4 +
      entropy / 5 * 0.4 +
      (1 - coherence) * 0.2;

    let lifelike =
      complexity * 0.5 +
      coherence * 0.3 +
      (1 - stability) * 0.2;

    let changeRate = 0;
    if (this.last) {
      changeRate = Math.abs(avgVelocity - this.last.avgVelocity);
    }

    this.last = metrics;

    bus.emit("metrics:derived", {
      stability: this.clamp(stability),
      complexity: this.clamp(complexity),
      lifelike: this.clamp(lifelike),
      changeRate,
      clusters: metrics.clusters,
      time: metrics.time,
      frame: metrics.frame
    });
  }

  clamp(v) {
    return Math.max(0, Math.min(1, v));
  }

}

export const derivedMetricsEngine = new DerivedMetricsEngine();
