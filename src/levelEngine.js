import { bus } from "./core/eventBus.js";

export class LevelEngine {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.thresholds = this.generateThresholds(50);
        
        bus.on("insight:discovered", (insight) => {
            this.addXP(insight.priority * 10);
        });
    }

    generateThresholds(max) {
        const list = [];
        for (let i = 1; i <= max; i++) {
            list[i] = Math.floor(100 * Math.pow(i, 1.5));
        }
        return list;
    }

    addXP(amount) {
        this.xp += amount;
        this.checkLevelUp();
        bus.emit("level:xp_updated", { xp: this.xp, level: this.level, nextThreshold: this.thresholds[this.level + 1] });
    }

    checkLevelUp() {
        while (this.xp >= this.thresholds[this.level + 1]) {
            this.level++;
            bus.emit("level:up", { level: this.level });
        }
    }
}
