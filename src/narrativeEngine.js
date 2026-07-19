export class NarrativeEngine {
    constructor() {
        this.history = [];
    }

    update(insights) {
        const keyEvents = insights
            .filter(i => i.type !== "info")
            .map(i => i.id)
            .sort()
            .join("|");

        if (this.history.length > 0 && this.history[this.history.length - 1].key === keyEvents) {
            return null;
        }

        const narrative = this.generateNarrative(insights);
        this.history.push({ key: keyEvents, text: narrative, time: Date.now() });
        
        if (this.history.length > 50) this.history.shift();

        return narrative;
    }

    generateNarrative(insights) {
        if (insights.some(i => i.id === "proto_star")) {
            return "Matter is collapsing into dense cores. A proto-stellar structure is emerging.";
        }

        const hasOverpop = insights.some(i => i.id.includes("overpopulation"));
        const hasExtinct = insights.some(i => i.id.includes("extinction"));

        if (hasOverpop && hasExtinct) {
            return "Extreme population volatility detected. Species are rising and falling in rapid cycles.";
        }

        if (hasOverpop) {
            return "Population is surging. The system strains under exponential growth.";
        }

        if (hasExtinct) {
            return "The system is thinning. A mass extinction or stabilization is imminent.";
        }

        if (insights.some(i => i.id.includes("swarm_sync"))) {
            return "Coordinated waves are rippling through the swarm. Collective intelligence is rising.";
        }

        if (insights.some(i => i.id.includes("thermal_chaos"))) {
            return "Entropy is dominating. Structured formations are struggling to maintain cohesion.";
        }

        return "The system evolves without dominant large-scale structure.";
    }
}
