import { bus } from "./core/eventBus.js";

class NarrativeIdentity {
    constructor(name, biasVector) {
        this.name = name;
        this.bias = biasVector; // how it interprets world
        this.weight = 1;
    }
}

export class NarrativeConsciousness {
    constructor(engine) {
        this.engine = engine;
        this.memory = [];
        this.identities = [
            new NarrativeIdentity("The Stabilizer", { stability: +1.0, entropy: -1.0 }),
            new NarrativeIdentity("The Diverger", { complexity: +1.0, entropy: +0.2 }),
            new NarrativeIdentity("The Observer", { stability: +0.1, complexity: +0.1, diversity: +0.1 }),
            new NarrativeIdentity("The Dissolver", { entropy: +1.0, stability: -0.5 })
        ];
        this.narrativeMode = "hybrid"; // observer | first_person | hybrid
        this.tone = "neutral interpretive tone";
        this.lastPerception = null;
        this.lastClusters = null;

        bus.on("perception:update", (p) => this.handlePerception(p));
        bus.on("clusters:updated", (c) => this.handleClusters(c));
    }

    handlePerception(p) {
        this.lastPerception = p;
        this.processNarrativeTrigger("perception");
    }

    handleClusters(c) {
        this.lastClusters = c;
        // Optionally trigger on significant cluster events (e.g. massive new cluster)
    }

    processNarrativeTrigger(source) {
        if (!this.engine || !this.engine.insightEngine) return;
        
        const { insights } = this.engine.insightEngine.evaluate();
        const goalSystem = this.engine.goalSystem;
        const personality = this.engine.personality;

        const narrative = this.generateNarrative(insights, goalSystem, personality);
        if (narrative) {
            import('./ui.js').then(ui => ui.renderNarrative(narrative));
        }
    }

    // ... (setTone, ingest, updateIdentityWeights remain same)

    generateNarrative(insights, goalSystem, personality = null) {
        const field = goalSystem.inferDominantField();
        
        const primaryVoices = this.identities
            .filter(i => i.weight > 0.25)
            .sort((a, b) => b.weight - a.weight);

        if (primaryVoices.length === 0) return "";

        const lines = primaryVoices.map(v => this.generateVoiceLine(v, insights, field));
        
        // Filter out empty lines
        const validLines = lines.filter(l => l !== null);
        if (validLines.length === 0) return "";

        let finalOutput = validLines.join("\n");
        // ... (perspective shift remains same)
        return finalOutput;
    }

    generateVoiceLine(identity, insights, field) {
        const prefix = identity.name + ":";
        
        let templates = {
            "The Stabilizer": [
                "System trends toward equilibrium formation.",
                "Structural coherence is reaching a stable phase.",
                "Observing a decrease in chaotic fluctuations."
            ],
            "The Diverger": [
                "Divergence patterns are accelerating.",
                "System is exploring new configuration spaces.",
                "I detect increasing complexity in agent interactions."
            ],
            "The Observer": [
                "System state remains within nominal interpretive bounds.",
                "Monitoring structural shifts across species boundaries.",
                "Data indicates a transition in global dynamics."
            ],
            "The Dissolver": [
                "Structural coherence is weakening.",
                "Entropy levels are beginning to dominate formation.",
                "Observing the breakdown of established patterns."
            ]
        };

        // PERCEPTION INJECTION
        if (this.lastPerception) {
            const { trends, oscillations } = this.lastPerception;
            
            if (identity.name === "The Stabilizer" && trends.stability === "increasing") {
                templates[identity.name].push("Positive stability trend detected. The system is settling into order.");
            }
            if (identity.name === "The Diverger" && trends.complexity === "increasing") {
                templates[identity.name].push("Complexity is on the rise. Novel structures are likely to emerge.");
            }
            if (identity.name === "The Dissolver" && trends.stability === "decreasing") {
                templates[identity.name].push("System decay confirmed. Established orders are collapsing.");
            }
            if (oscillations.type === "periodic") {
                templates["The Observer"].push(`Noting a rhythmic oscillation with a period of ${oscillations.period} frames.`);
            }
        }

        // CLUSTER INJECTION
        if (this.lastClusters && this.lastClusters.activeCount > 5) {
            if (identity.name === "The Observer") {
                templates[identity.name].push(`Monitoring ${this.lastClusters.activeCount} distinct identity clusters.`);
            }
        }

        const list = templates[identity.name] || ["Observing simulation state."];
        let line = list[Math.floor(Math.random() * list.length)];

        // Randomly skip lines to avoid chatter
        if (Math.random() > 0.3) return null;

        return `${prefix} ${line}`;
    }
}
