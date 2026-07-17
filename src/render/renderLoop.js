// VEPA v3 — Render Loop
// Main animation loop: requestAnimationFrame orchestration.

class RenderLoop {
  /**
   * @param {Function} tickFn - Called each frame: (dt) => void
   */
  constructor(tickFn) {
    this.tickFn = tickFn;
    this.running = false;
    this._lastTime = 0;
    this._frameId = null;
    this.fps = 0;
    this._frameCount = 0;
    this._fpsTimer = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTime = performance.now();
    this._frameId = requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }

  _loop(time) {
    if (!this.running) return;
    const dt = Math.min((time - this._lastTime) / 1000, 0.05); // Cap at 50ms
    this._lastTime = time;

    // FPS counter
    this._frameCount++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= 1.0) {
      this.fps = this._frameCount;
      this._frameCount = 0;
      this._fpsTimer -= 1.0;
    }

    try {
      this.tickFn(dt);
    } catch (e) {
      console.error('[RenderLoop] Error:', e);
    }

    this._frameId = requestAnimationFrame((t) => this._loop(t));
  }
}

export default RenderLoop;
