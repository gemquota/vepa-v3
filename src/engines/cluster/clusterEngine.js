import { bus } from "../../core/eventBus.js";

export class ClusterEngine {
    constructor() {
        this.activeClusters = new Map(); // ID -> { members: Set, firstFrame: N, lastFrame: N, history: [] }
        this.nextId = 1;
        this.overlapThreshold = 0.4; // 40% overlap to consider same cluster
    }

    process(metrics) {
        const { clusters, frame, time } = metrics;
        if (!clusters) return;

        const currentFrameClusters = clusters.map(members => new Set(members));
        const matchedActiveIds = new Set();
        const newActiveClusters = new Map();

        // 1. Try to match current clusters to active ones
        for (const currentMembers of currentFrameClusters) {
            let bestMatchId = null;
            let maxOverlap = 0;

            for (const [id, cluster] of this.activeClusters) {
                const overlap = this.calculateOverlap(currentMembers, cluster.members);
                if (overlap > this.overlapThreshold && overlap > maxOverlap) {
                    maxOverlap = overlap;
                    bestMatchId = id;
                }
            }

            if (bestMatchId !== null) {
                // Persistent cluster
                const cluster = this.activeClusters.get(bestMatchId);
                cluster.members = currentMembers;
                cluster.lastFrame = frame;
                cluster.history.push({ frame, time, size: currentMembers.size });
                if (cluster.history.length > 100) cluster.history.shift();
                
                newActiveClusters.set(bestMatchId, cluster);
                matchedActiveIds.add(bestMatchId);
            } else {
                // New cluster
                const newId = this.nextId++;
                newActiveClusters.set(newId, {
                    members: currentMembers,
                    firstFrame: frame,
                    lastFrame: frame,
                    history: [{ frame, time, size: currentMembers.size }]
                });
            }
        }

        // 2. Cleanup: active clusters that didn't match (could be dead or just split)
        // We'll keep them for a few frames? No, for now just replace.
        this.activeClusters = newActiveClusters;

        // 3. Emit cluster status
        bus.emit("clusters:updated", {
            activeCount: this.activeClusters.size,
            identities: Array.from(this.activeClusters.entries()).map(([id, data]) => ({
                id,
                size: data.members.size,
                age: frame - data.firstFrame
            }))
        });
    }

    calculateOverlap(setA, setB) {
        let intersection = 0;
        for (const item of setA) {
            if (setB.has(item)) intersection++;
        }
        const union = setA.size + setB.size - intersection;
        return intersection / union;
    }
}

export const clusterEngine = new ClusterEngine();
