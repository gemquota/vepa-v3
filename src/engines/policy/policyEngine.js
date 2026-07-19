import { bus } from "../../core/eventBus.js";

export class PolicyEngine {

  apply(derived) {
    let bias = 1.0;

    if (derived.stability < 0.3) bias = 0.95;
    if (derived.complexity < 0.3) bias = 1.05;
    if (derived.lifelike > 0.7) bias = 1.02;

    bus.emit("policy:updated", { bias });
  }

}

export const policyEngine = new PolicyEngine();
