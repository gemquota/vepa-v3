import { bus } from "../core/eventBus.js";
import { metricsEngine } from "../engines/metrics/metricsEngine.js";
import { derivedMetricsEngine } from "../engines/metrics/derivedMetrics.js";
import { memoryEngine } from "../engines/memory/memoryEngine.js";
import { predictionEngine } from "../engines/prediction/predictionEngine.js";
import { policyEngine } from "../engines/policy/policyEngine.js";
import { clusterEngine } from "../engines/cluster/clusterEngine.js";
import { analysisEngine } from "../engines/analysis/analysisEngine.js";

export function wireSystem() {

  bus.on("physics:update", (event) => {
    metricsEngine.compute(event.particles, event.time, event.frame);
  });

  bus.on("metrics:updated", (metrics) => {
    derivedMetricsEngine.compute(metrics);
  });

  bus.on("metrics:derived", (derived) => {
    clusterEngine.process(derived);
    memoryEngine.record(derived);
    predictionEngine.evaluate(derived);
    predictionEngine.predict(derived);
    policyEngine.apply(derived);
  });

  bus.on("memory:updated", (history) => {
    analysisEngine.process(history);
  });

}
