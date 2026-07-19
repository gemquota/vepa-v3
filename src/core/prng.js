/**
 * SplitMix32 PRNG (Integer-only)
 * Deterministic pseudo-random number generator for absolute reproducibility across engines.
 */
export class SplitMix32 {
    constructor(seed = Date.now()) {
        this.state = seed >>> 0;
    }

    next() {
        this.state |= 0;
        this.state = (this.state + 0x9e3779b9) | 0;
        let t = this.state ^ (this.state >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
    }

    randomRange(min, max) {
        return this.next() * (max - min) + min;
    }
}
