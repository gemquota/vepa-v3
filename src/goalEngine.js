import { DNA_INDEXES } from "./constants.js";

export class Goal {
    constructor(name, value = 0) {
        this.name = name;
        this.value = value;        // current strength
        this.velocity = 0;         // trend
        this.conflicts = new Map(); // other goals → strength of conflict
    }

    update(delta) {
        this.velocity = delta;
        this.value = Math.max(0, Math.min(10, this.value + delta));
    }
}

const CONFLICTS = {
    stability: {
        entropy: 0.9,
        complexity: 0.6
    },
    complexity: {
        stability: 0.6,
        collapse_prevention: 0.4
    },
    entropy: {
        stability: 0.9
    }
};

export class GoalSystem {
    constructor(engine) {
        this.engine = engine;
        this.goals = new Map([
            ["stability", new Goal("stability")],
            ["complexity", new Goal("complexity")],
            ["diversity", new Goal("diversity")],
            ["entropy", new Goal("entropy")],
            ["collapse_prevention", new Goal("collapse_prevention")]
        ]);
        this.history = [];
    }

    evaluate(insights, personality = null) {
        const state = this.engine;
        let score = 0;

        // survival reward based on species health
        state.species.forEach(s => {
            score += 0.1; // Simple increment for each species extant
        });

        if (score > 0) this.goals.get("stability").update(score * 0.05);

        // Map insights to goal deltas
        insights.forEach(insight => {
            const weight = personality ? personality.interpret(insight) : 1.0;
            const id = insight.id;

            if (id.includes("proto_star")) {
                this.goals.get("complexity").update(0.5 * weight);
                this.goals.get("stability").update(0.2 * weight);
            }
            if (id.includes("unexpected_stability")) {
                this.goals.get("stability").update(0.4 * weight);
                this.goals.get("entropy").update(-0.3 * weight);
            }
            if (id.includes("thermal_chaos")) {
                this.goals.get("entropy").update(0.5 * weight);
                this.goals.get("stability").update(-0.4 * weight);
            }
            if (id.includes("swarm_sync")) {
                this.goals.get("complexity").update(0.3 * weight);
                this.goals.get("diversity").update(0.1 * weight);
            }
        });

        // Decay
        this.goals.forEach(g => g.update(-0.01));

        const dominant = this.inferDominantField();
        this.history.push({ time: Date.now(), dominant, tension: dominant.tension });
        if (this.history.length > 100) this.history.shift();

        return dominant;
    }

    applyBias(traits) {
        // Long-term personality traits bias the goal strengths
        if (traits.stability_preference > 0.7) {
            this.goals.get("stability").update(0.05);
            this.goals.get("entropy").update(-0.05);
        }
        if (traits.curiosity > 0.7) {
            this.goals.get("complexity").update(0.05);
        }
        if (traits.chaos_tolerance > 0.7) {
            this.goals.get("entropy").update(0.05);
        }
    }

    computeGoalTension() {
        let tension = 0;
        const goals = Array.from(this.goals.values());
        for (let i = 0; i < goals.length; i++) {
            for (let j = i + 1; j < goals.length; j++) {
                const a = goals[i];
                const b = goals[j];
                const conflict = CONFLICTS[a.name]?.[b.name] || CONFLICTS[b.name]?.[a.name] || 0;
                tension += conflict * a.value * b.value;
            }
        }
        return tension;
    }

    inferDominantField() {
        const sorted = [...this.goals.values()]
            .sort((a, b) => b.value - a.value);

        return {
            primary: sorted[0],
            secondary: sorted[1],
            tension: this.computeGoalTension()
        };
    }

    applyGoalInfluence() {
        if ((this.engine.complexityLevel || 0) < 2) return; 
        
        const { primary, tension } = this.inferDominantField();

        if (primary.name === "stability") {
            this.engine.laws.pure.dt = Math.max(0.5, this.engine.laws.pure.dt - 0.001);
            this.engine.worldConfig.globalViscosity = Math.max(0.9, Math.min(1.0, this.engine.worldConfig.globalViscosity + 0.0002));
        }
        if (primary.name === "entropy") {
            this.engine.laws.pure.dt = Math.min(2.0, this.engine.laws.pure.dt + 0.001);
            this.engine.worldConfig.globalViscosity = Math.max(0.5, this.engine.worldConfig.globalViscosity - 0.0002);
        }
        if (primary.name === "complexity") {
            this.engine.laws.pure.G = Math.min(0.5, this.engine.laws.pure.G + 0.0001);
        }

        if (tension > 4) {
            this.engine.species.forEach(s => {
                const dnaIdx = DNA_INDEXES.JITTER;
                s.dna[dnaIdx] = Math.min(0.5, s.dna[dnaIdx] + 0.001);
            });
        }

        if (primary.name === "stability" && tension < 2) {
            this.engine.species.forEach(s => {
                const dnaIdx = DNA_INDEXES.VISCOSITY;
                s.dna[dnaIdx] = Math.min(1.0, s.dna[dnaIdx] + 0.0005);
            });
        }
    }
}
