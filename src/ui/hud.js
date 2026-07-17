// VEPA v3 — HUD Display
// DOM-based overlay for FPS, particle count, tick stats.

class HUD {
  constructor(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'hud-display';
    this.el.style.cssText = 'position:fixed;bottom:10px;right:10px;color:#88aacc;font:12px/1.4 monospace;background:rgba(0,0,0,0.6);padding:8px 12px;border-radius:4px;pointer-events:none;z-index:1000;';
    this.container.appendChild(this.el);
  }

  update(stats) {
    this.el.innerHTML = [
      `FPS: ${stats.fps || 0}`,
      `Particles: ${stats.particleCount || 0}`,
      `Species: ${stats.speciesCount || 0}`,
      `Tick: ${(stats.tickTime || 0).toFixed(2)}ms`,
      `Laws: ${stats.activeLaws || 0}/64`,
    ].join('<br>');
  }

  destroy() {
    this.el.remove();
  }
}

export default HUD;
