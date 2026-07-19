import { bus } from "../../core/eventBus.js";

export class PredictionEngine {

  constructor() {
    this.lastPrediction = null;
  }

  predict(metrics) {
    this.lastPrediction = {
      expectedStability: metrics.stability * 1.05,
      expectedComplexity: metrics.complexity * 0.95
    };
  }

  evaluate(actual) {
    if (!this.lastPrediction) return;

    const error =
      Math.abs(actual.stability - this.lastPrediction.expectedStability) +
      Math.abs(actual.complexity - this.lastPrediction.expectedComplexity);

    bus.emit("prediction:evaluated", { error });
  }

}

export const predictionEngine = new PredictionEngine();
