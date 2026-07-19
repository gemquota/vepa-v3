import { HELP_DB } from './constants.js';

export class EmergentParamEngine {
    constructor(engine) {
        this.engine = engine;
        this.metaParams = {};        // key → value
        this.definitions = {};       // key → schema
        this.patternBuffer = [];     // rolling history
        this.pending = [];           // proposals
        this.rejected = new Set();
        this.maxBuffer = 50;
    }

    ingest(insights) {
        const signals = insights.map(i => i.id);
        this.patternBuffer.push({
            time: Date.now(),
            signals
        });

        if (this.patternBuffer.length > this.maxBuffer) {
            this.patternBuffer.shift();
        }

        this.evaluateEmergence();
    }

    evaluateEmergence() {
        if ((this.engine.complexityLevel || 0) < 2) return;
        const freq = {};
        this.patternBuffer.forEach(frame => {
            frame.signals.forEach(s => {
                freq[s] = (freq[s] || 0) + 1;
            });
        });

        if (this.check(freq, "unexpected_stability", 5)) {
            this.proposeParam("Lattice Cohesion");
        }
        if (this.check(freq, "swarm_sync", 6)) {
            this.proposeParam("Collective Resonance");
        }
        if (this.check(freq, "thermal_chaos", 6)) {
            this.proposeParam("Entropy Dampening");
        }
    }

    check(freq, keyPart, threshold) {
        return Object.entries(freq)
            .filter(([k]) => k.includes(keyPart))
            .reduce((sum, [, v]) => sum + v, 0) >= threshold;
    }

    proposeParam(name) {
        const key = name.replace(/\s+/g, "_");
        if (this.definitions[key] || this.pending.find(p => p.key === key) || this.rejected.has(key)) return;

        const def = this.generateDefinition(name);
        this.pending.push({ key, name, def, time: Date.now() });
        
        // Notify UI via a custom event or direct call if available
        if (window.notifyNewProposal) window.notifyNewProposal(name);
    }

    generateDefinition(name) {
        const base = {
            "Lattice Cohesion": {
                default: 0.5,
                effect: (dna, value) => {
                    dna[1] += value * 0.1; // viscosity bias
                },
                description: "Controls stability of emergent lattice structures."
            },
            "Collective Resonance": {
                default: 0.5,
                effect: (dna, value) => {
                    dna[13] += value * 0.2; // signal response boost
                },
                description: "Amplifies synchronized swarm behavior."
            },
            "Entropy Dampening": {
                default: 0.5,
                effect: (dna, value) => {
                    dna[3] -= value * 0.1; // reduce jitter
                },
                description: "Reduces chaotic motion in high-noise systems."
            }
        };
        return base[name];
    }

    spawnAcceptedParam(p) {
        const { key, def, name } = p;
        this.definitions[key] = def;
        this.metaParams[key] = def.default;

        // Add interactions base
        if (!this.definitions[key].interactions) {
            this.definitions[key].interactions = {
                "Lattice_Cohesion": (dna, self, other) => { if(key === "Entropy_Dampening") dna[1] += self * other * 0.15; },
                "Collective_Resonance": (dna, self, other) => { if(key === "Entropy_Dampening") dna[13] += self * other * 0.2; }
            };
        }

        // Inject into HelpDB
        HELP_DB[name] = {
            layers: {
                hint: def.description,
                explanation: def.description,
                system: "This parameter emerged from repeated system behavior.",
                advanced: "Represents an abstracted control over emergent dynamics."
            },
            thresholds: { low: "Minimal", high: "Strong", extreme: "Dominates" },
            interactions: [],
            category: "Emergent"
        };

        if (window.renderEmergentSliders) window.renderEmergentSliders();
        if (this.engine.persistence) this.engine.persistence.save(this.engine);
    }

    applyMetaParams(dna) {
        const keys = Object.keys(this.metaParams);
        keys.forEach(key => {
            const def = this.definitions[key];
            if (def && def.effect) def.effect(dna, this.metaParams[key]);
        });

        // Interaction pass
        for (let i = 0; i < keys.length; i++) {
            for (let j = 0; j < keys.length; j++) {
                if (i === j) continue;
                const aKey = keys[i], bKey = keys[j];
                const fn = this.definitions[aKey].interactions?.[bKey];
                if (fn) fn(dna, this.metaParams[aKey], this.metaParams[bKey]);
            }
        }
    }
}
