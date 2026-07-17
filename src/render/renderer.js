// VEPA v3 — PixiJS Renderer Setup & Sprite Pool
// Manages the PixiJS application and a pool of particle sprites.

import * as PIXI from 'pixi.js';

class Renderer {
  /**
   * @param {HTMLElement} container - DOM element to mount canvas
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  constructor(container, width = 800, height = 600) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.sprites = [];
    this.spriteCount = 0;

    this.app = new PIXI.Application();
  }

  async init() {
    // Force WebGL (skip WebGPU which can hang on some systems)
    // Race against a timeout to prevent permanent hang
    const initPromise = this.app.init({
      width: this.width,
      height: this.height,
      background: 0x0a0a12,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgl',
    });
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PixiJS init timed out')), 5000)
    );
    await Promise.race([initPromise, timeout]);

    this.container.appendChild(this.app.canvas);
    this.stage = this.app.stage;
  
  // Auto-resize to container
  this._resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) this.resize(width, height);
    }
  });
  this._resizeObserver.observe(this.container);
  }

  /**
   * Ensure the sprite pool has at least `count` sprites.
   */
  ensurePool(count) {
    while (this.sprites.length < count) {
      const sprite = new PIXI.Graphics();
      sprite.beginFill(0xffffff);
      sprite.drawCircle(0, 0, 1);
      sprite.endFill();
      sprite.visible = false;
      this.stage.addChild(sprite);
      this.sprites.push(sprite);
    }
    this.spriteCount = count;
  }

  /**
   * Resize the canvas and stage.
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.app.renderer.resize(width, height);
  }

  /** Start the render loop (called by main loop). */
  render() {
    this.app.renderer.render(this.stage);
  }

  /** Clean up. */
  destroy() {
    this.app.destroy(true);
    this.sprites = [];
    this.spriteCount = 0;
  }
}

export default Renderer;
