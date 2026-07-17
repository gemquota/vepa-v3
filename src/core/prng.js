// VEPA v3 — SplitMix32 PRNG
// Deterministic seeded PRNG for all simulation-critical randomness.
// Never use Math.random() in simulation paths.

class SplitMix32 {
  /**
   * @param {number} seed - Integer seed
   */
  constructor(seed = Date.now()) {
    this._state = seed | 0; // Force int32
  }

  /**
   * Returns a 32-bit integer (signed).
   * SplitMix32 algorithm.
   */
  nextInt() {
    let z = (this._state = (this._state + 0x9e3779b9) | 0);
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    z = (z ^ (z >>> 16)) | 0;
    return z;
  }

  /**
   * Returns a float in [0, 1).
   */
  nextFloat() {
    return (this.nextInt() >>> 0) / 4294967296;
  }

  /**
   * Returns a float in [min, max).
   * @param {number} min
   * @param {number} max
   */
  range(min, max) {
    return min + this.nextFloat() * (max - min);
  }

  /**
   * Returns an integer in [min, max] inclusive.
   */
  int(min, max) {
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /**
   * Fisher-Yates shuffle in-place.
   * @param {Array} arr
   */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Pick a random element from an array.
   */
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Current internal state (for serialization). */
  get state() { return this._state; }
  set state(val) { this._state = val | 0; }

  /** Clone this PRNG state. */
  clone() {
    const p = new SplitMix32(0);
    p._state = this._state;
    return p;
  }
}

export default SplitMix32;
