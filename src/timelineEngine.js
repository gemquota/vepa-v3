export class TimelineEngine {
    constructor(engine, insightEngine) {
        this.engine = engine;
        this.insightEngine = insightEngine;
        this.frames = [];
        this.maxFrames = 300; // ~5 mins @ 1fps sampling
    }

    capture() {
        const state = this.snapshot();
        if (!state) return;
        // Skip insight evaluation during capture if it's too frequent, 
        // but here we just need the state. Insights are already evaluated in main.js
        
        this.frames.push({
            t: performance.now(),
            state
        });

        if (this.frames.length > this.maxFrames) {
            this.frames.shift();
        }
    }

    snapshot() {
        if (!this.engine.particles) return null;
        return {
            particles: new Float32Array(this.engine.particles),
            species: this.engine.species.map(s => ({
                dna: [...s.dna],
                color: s.color,
                rgb: s.rgb,
                id: s.id,
                name: s.name
            })),
            laws: { ...this.engine.laws },
            world: { ...this.engine.worldConfig }
        };
    }

    getTimeline() {
        return this.frames;
    }

    restore(frameIndex, syncWorker = true) {
        const frame = this.frames[frameIndex];
        if (!frame) return;

        this.engine.species = frame.state.species.map(s => ({
            ...s
        }));
        this.engine.laws = { ...frame.state.laws };
        this.engine.worldConfig = { ...frame.state.world };
        this.engine.particles = new Float32Array(frame.state.particles);
        
        // Sync worker with restored particles
        if (syncWorker) {
            this.engine.worker.postMessage({ 
                type: 'init', 
                data: { particles: this.engine.particles }, 
                version: this.engine.simVersion 
            });
        }
    }
}
