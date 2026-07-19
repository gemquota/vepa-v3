export class PersonalityCore {
    constructor() {
        this.traits = {
            curiosity: 0.5,
            stability_preference: 0.5,
            chaos_tolerance: 0.5,
            structural_bias: 0.5,
            narrative_certainty: 0.5
        };

        this.memoryTrace = [];
        this.maxMemory = 100;
    }

    updateFromEvent(insights, goalSystem) {
        const field = goalSystem.inferDominantField();
        const signals = insights.map(i => i.id);

        this.memoryTrace.push({ time: Date.now(), insights: signals, field });
        if (this.memoryTrace.length > this.maxMemory) this.memoryTrace.shift();

        // CURIOUSITY
        if (insights.length > 3) {
            this.traits.curiosity += 0.001;
        }

        // STABILITY preference
        if (signals.some(s => s.includes("collapse"))) {
            this.traits.stability_preference += 0.01;
        }

        // CHAOS tolerance
        if (field.tension > 5) {
            this.traits.chaos_tolerance += 0.01;
        }

        // STRUCTURE bias
        if (signals.some(s => s.includes("proto_star"))) {
            this.traits.structural_bias += 0.02;
        }

        // NARRATIVE certainty
        if (field.tension > 6) {
            this.traits.narrative_certainty -= 0.01;
        } else {
            this.traits.narrative_certainty += 0.005;
        }

        this.clamp();
    }

    clamp() {
        Object.keys(this.traits).forEach(k => {
            this.traits[k] = Math.max(0, Math.min(1, this.traits[k]));
        });
    }

    decayAndDrift() {
        this.traits.curiosity *= 0.9999;
        this.traits.stability_preference *= 0.9999;
        this.traits.chaos_tolerance += 0.0001; // Chaos slowly accumulates in the soul
        this.clamp();
    }

    interpret(insight) {
        let weight = 1.0;
        // curious systems notice more things
        weight += this.traits.curiosity * 0.2;

        // stability-preferring systems downplay chaos
        if (insight.id.includes("chaos")) {
            weight -= this.traits.stability_preference * 0.5;
        }

        // chaos-tolerant systems amplify instability
        if (insight.id.includes("collapse")) {
            weight += this.traits.chaos_tolerance * 0.5;
        }

        return weight;
    }

    generateTone() {
        const t = this.traits;
        if (t.stability_preference > 0.7) return "measured analytical tone";
        if (t.chaos_tolerance > 0.7) return "fluid observational tone";
        if (t.structural_bias > 0.7) return "pattern-seeking architectural tone";
        return "neutral interpretive tone";
    }
}
