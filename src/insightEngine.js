import { bus } from "./core/eventBus.js";
import { DNA_INDEXES } from "./constants.js";

export class InsightEngine {
    constructor(engine) {
        this.engine = engine;
        this.cache = [];
        this.lastHash = null;
        this.latestMetrics = null;

        bus.on("metrics:updated", (m) => { this.latestMetrics = m; });
    }

    evaluate() {
        const snapshot = this.captureState();
        const hash = JSON.stringify(snapshot) + (this.latestMetrics ? this.latestMetrics.frame : '');

        if (hash === this.lastHash) return { insights: this.cache, suggestions: this.suggestions };

        this.lastHash = hash;

        const base = [
            ...this.detectFusionDynamics(snapshot),
            ...this.detectGravitationalCollapse(snapshot),
            ...this.detectSwarmBehavior(snapshot),
            ...this.detectThermalChaos(snapshot),
            ...this.detectLatticeLock(snapshot),
            ...this.detectPopulationDynamics(snapshot),
            ...this.detectMetricAnomalies()
        ];

        const chained = this.chainInsights(base);
        const all = [...base, ...chained];

        this.cache = this.rank(all);
        this.suggestions = this.generateSuggestions(snapshot, this.cache);
        
        return { insights: this.cache, suggestions: this.suggestions };
    }

    captureState() {
        const species = this.engine.species.map(s => ({ dna: s.dna }));

        return {
            species,
            laws: this.engine.laws,
            world: this.engine.worldConfig
        };
    }

    rank(insights) {
        return insights
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5);
    }

    chainInsights(insights) {
        const out = [];
        const has = (idPart) => insights.some(i => i.id.includes(idPart));

        // Proto-star formation
        if (has("fusion_runaway") && has("grav_collapse")) {
            out.push({
                id: "proto_star",
                type: "discovery",
                message: "Proto-stellar formation detected. Matter is organizing into dominant bodies.",
                confidence: 0.92,
                priority: 11
            });
        }

        // Swarm intelligence escalation
        if (has("swarm_sync") && has("thermal_chaos")) {
            out.push({
                id: "chaotic_swarm",
                type: "info",
                message: "Swarm coherence under noise. Expect adaptive wave patterns.",
                confidence: 0.8,
                priority: 8
            });
        }

        return out;
    }

    generateSuggestions(state, insights) {
        const suggestions = [];
        const has = (id) => insights.some(i => i.id.includes(id));

        if (has("thermal_chaos")) {
            suggestions.push({
                label: "Stabilize System",
                action: { type: 'law', key: 'dt', delta: -0.2 },
                reason: "Reduce simulation speed to allow structures to settle."
            });
        }

        if (has("proto_star")) {
            suggestions.push({
                label: "Create Orbitals",
                action: { type: 'dna', key: 'Torque', delta: 0.3 },
                reason: "Introduce angular momentum for orbital systems."
            });
        }

        if (has("overpopulation")) {
            suggestions.push({
                label: "Balance Ecosystem",
                action: { type: 'dna', key: 'Death Rate', delta: 0.02 },
                reason: "Prevent system saturation by increasing decay."
            });
        }

        return suggestions;
    }

    detectFusionDynamics(state) {
        const out = [];
        state.species.forEach((s, i) => {
            const dna = s.dna;
            const fusion = dna[DNA_INDEXES.FUSION];
            const fTime = dna[DNA_INDEXES.FUSION_TIME];
            const momentum = dna[DNA_INDEXES.FUSION_MOMENTUM];

            if (fusion > 0.8 && fTime < 10) {
                out.push({
                    id: "fusion_runaway_" + i,
                    type: "warning",
                    message: `Species ${i+1}: Runaway accretion likely. Expect rapid mass dominance.`,
                    confidence: 0.9,
                    related: ["Fusion", "Fusion Time"],
                    priority: 9
                });
            }

            if (momentum > 30 && fusion > 0.5) {
                out.push({
                    id: "fusion_selective_" + i,
                    type: "info",
                    message: `Species ${i+1}: Fusion requires high-energy collisions. Growth will be selective.`,
                    confidence: 0.7,
                    related: ["Fusion Momentum"],
                    priority: 6
                });
            }
        });
        return out;
    }

    detectGravitationalCollapse(state) {
        const out = [];
        state.species.forEach((s, i) => {
            const dna = s.dna;
            const force = dna[DNA_INDEXES.FORCE];
            const mass = dna[DNA_INDEXES.HIDDEN_MASS];

            if (force > 1.2 && mass > 1) {
                out.push({
                    id: "grav_collapse_" + i,
                    type: "warning",
                    message: `Species ${i+1}: Strong gravitational clustering detected. Collapse structures may form.`,
                    confidence: 0.85,
                    related: ["Force", "Hidden Mass"],
                    priority: 8
                });
            }
        });
        return out;
    }

    detectSwarmBehavior(state) {
        const out = [];
        state.species.forEach((s, i) => {
            const dna = s.dna;
            const resp = dna[DNA_INDEXES.SIGNAL_RESP];
            const strength = dna[DNA_INDEXES.SIGNAL_STRENGTH];
            const decay = dna[DNA_INDEXES.SIGNAL_DECAY];

            if (resp > 1.2 && strength > 0.7 && decay > 0.9) {
                out.push({
                    id: "swarm_sync_" + i,
                    type: "discovery",
                    message: `Species ${i+1}: Synchronized swarm behavior emerging. Expect wave-like coordination.`,
                    confidence: 0.88,
                    related: ["Signal Resp", "Signal Strength"],
                    priority: 10
                });
            }
        });
        return out;
    }

    detectThermalChaos(state) {
        const out = [];
        state.species.forEach((s, i) => {
            const dna = s.dna;
            const jitter = dna[DNA_INDEXES.JITTER];
            const viscosity = dna[DNA_INDEXES.VISCOSITY];

            if (jitter > 0.3 && viscosity < 0.9) {
                out.push({
                    id: "thermal_chaos_" + i,
                    type: "warning",
                    message: `Species ${i+1}: High thermal noise detected. Structures may fail to stabilize.`,
                    confidence: 0.8,
                    related: ["Jitter", "Viscosity"],
                    priority: 7
                });
            }
        });
        return out;
    }

    detectLatticeLock(state) {
        const out = [];
        if (!this.latestMetrics) return out;

        state.species.forEach((s, i) => {
            const dna = s.dna;
            const stiffness = dna[DNA_INDEXES.STIFFNESS];
            const elasticity = dna[DNA_INDEXES.ELASTICITY];

            // Lattice Lock: High stiffness, high elasticity, and low relative velocity in metrics
            if (stiffness > 0.8 && elasticity > 0.7 && this.latestMetrics.avgVelocity < 5.0) {
                out.push({
                    id: "lattice_lock_" + i,
                    type: "discovery",
                    message: `Species ${i+1}: Crystalline optimization detected. Lattice Lock achieved.`,
                    confidence: 0.92,
                    related: ["Stiffness", "Elasticity"],
                    priority: 11
                });
            }
        });
        return out;
    }

    detectPopulationDynamics(state) {
        const out = [];
        state.species.forEach((s, i) => {
            const dna = s.dna;
            const birth = dna[DNA_INDEXES.BIRTH_RATE];
            const death = dna[DNA_INDEXES.DEATH_RATE];

            if (birth > 0.05 && death < 0.01) {
                out.push({
                    id: "overpopulation_" + i,
                    type: "warning",
                    message: `Species ${i+1}: Population explosion likely. System may saturate.`,
                    confidence: 0.9,
                    related: ["Birth Rate", "Death Rate"],
                    priority: 9
                });
            }

            if (death > birth * 2 && death > 0.02) {
                out.push({
                    id: "extinction_" + i,
                    type: "warning",
                    message: `Species ${i+1}: Population collapse likely. Species may die out.`,
                    confidence: 0.85,
                    related: ["Death Rate"],
                    priority: 8
                });
            }
        });
        return out;
    }

    detectMetricAnomalies() {
        const out = [];
        if (!this.latestMetrics) return out;

        if (this.latestMetrics.avgVelocity > 15) {
            out.push({
                id: "high_kinetic_energy",
                type: "warning",
                message: "System kinetic energy is critical. High-velocity collisions dominant.",
                confidence: 0.95,
                priority: 8
            });
        }

        if (this.latestMetrics.clusterCount > 10) {
            out.push({
                id: "high_clustering",
                type: "discovery",
                message: "Significant granular organization detected. Multiple persistent bodies forming.",
                confidence: 0.9,
                priority: 9
            });
        }

        return out;
    }
}
