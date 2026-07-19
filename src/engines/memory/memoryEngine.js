import { bus } from "../../core/eventBus.js";

export class MemoryEngine {

  constructor() {
    this.history = [];
    this.maxHistory = 200;
  }

  record(snapshot) {
    this.history.push({
      ...snapshot,
      time: snapshot.time || Date.now(),
      frame: snapshot.frame || 0
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    bus.emit("memory:updated", this.history);
  }

}

export const memoryEngine = new MemoryEngine();
