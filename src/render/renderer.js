// VEPA v3 — PixiJS Renderer (vepa2-compatible Sprite-based rendering)
// Uses PIXI.Sprite with pre-generated texture instead of per-particle Graphics.

import * as PIXI from 'pixi.js';

class Renderer {
  constructor(container, width = 800, height = 600) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.worldSize = Math.max(width, height);
    this.sprites = [];
    this.spriteCount = 0;
    this.app = new PIXI.Application();
    this._centerOnWorld = true;
    // Camera state
    this.pan = { x: 0, y: 0, z: 0 };
    this.zoom = 1.0;
    this.rotation = { x: 0, y: 0 };
    this.focalLength = 400;
    // Interaction state
    this._activePointers = new Map();
    this._initialDist = 0;
    this._initialZoom = 1.0;
    this._initialPan = { x: 0, y: 0 };
  }

  async init() {
    const initPromise = this.app.init({
      width: this.width,
      height: this.height,
      background: '#0a0a12',
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
    this.app.canvas.style.touchAction = 'none';
    this.app.canvas.id = 'sim-canvas';
    this.stage = this.app.stage;

    this.world = new PIXI.Container();
    this.stage.addChild(this.world);
    this.envGraphics = new PIXI.Graphics();
    this.world.addChild(this.envGraphics);

    // Generate a single particle texture (like vepa2)
    const g = new PIXI.Graphics();
    g.circle(0, 0, 32).fill({ color: 0xffffff });
    this.texture = this.app.renderer.generateTexture(g);
    g.destroy();

    // Auto-resize
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.width = width;
          this.height = height;
          this.app.renderer.resize(width, height);
          if (this._centerOnWorld) {
            // Particles at centered coords (-half..+half), so camera at (0,0,0)
            this.pan.x = 0;
            this.pan.y = 0;
            this.pan.z = 0;
            // Auto-zoom to fit world in viewport (important for mobile)
            const zoomX = this.width / this.worldSize;
            const zoomY = this.height / this.worldSize;
            this.zoom = Math.min(zoomX, zoomY, 2);
            this._centerOnWorld = false;
          }
        }
      }
    });
    this._resizeObserver.observe(this.container);

    this.setupInteraction();
  }

  setupInteraction() {
    this.app.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.app.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom *= Math.pow(0.999, e.deltaY);
      this.zoom = Math.max(0.02, Math.min(20, this.zoom));
    }, { passive: false });

    this.app.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      this._activePointers.set(e.pointerId, {
        lastX: e.clientX, lastY: e.clientY,
        startX: e.clientX, startY: e.clientY,
        startTime: Date.now(),
        button: e.button
      });
      if (this._activePointers.size === 2) {
        const pts = Array.from(this._activePointers.values());
        this._initialDist = Math.hypot(pts[0].lastX - pts[1].lastX, pts[0].lastY - pts[1].lastY);
        this._initialZoom = this.zoom;
        this._initialPan = { x: this.pan.x, y: this.pan.y };
      }
    });

    window.addEventListener('pointerup', e => {
      this._activePointers.delete(e.pointerId);
      if (this._activePointers.size < 2) this._initialDist = 0;
    });

    window.addEventListener('pointermove', e => {
      const p = this._activePointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.lastX, dy = e.clientY - p.lastY;
      p.lastX = e.clientX; p.lastY = e.clientY;

      if (this._activePointers.size === 1) {
        const sens = 1.0 / this.zoom;
        this.pan.x -= dx * sens;
        this.pan.y -= dy * sens;
      } else if (this._activePointers.size === 2) {
        const pts = Array.from(this._activePointers.values());
        const dist = Math.hypot(pts[0].lastX - pts[1].lastX, pts[0].lastY - pts[1].lastY);
        if (this._initialDist > 0) {
          this.zoom = Math.max(0.02, Math.min(20, this._initialZoom * (dist / this._initialDist)));
        }
        // Two-finger pan
        const cx = (pts[0].lastX + pts[1].lastX) / 2;
        const cy = (pts[0].lastY + pts[1].lastY) / 2;
        const icx = (pts[0].startX + pts[1].startX) / 2;
        const icy = (pts[0].startY + pts[1].startY) / 2;
        const pdx = (cx - icx) / this.zoom;
        const pdy = (cy - icy) / this.zoom;
        this.pan.x = this._initialPan.x - pdx;
        this.pan.y = this._initialPan.y - pdy;
      }
    });

    // Keyboard: R to reset
    this._keyHandler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.pan.x = 0;
        this.pan.y = 0;
        this.pan.z = 0;
        this.zoom = 1.0;
        this.rotation.x = 0;
        this.rotation.y = 0;
        const zoomX = this.width / this.worldSize;
        const zoomY = this.height / this.worldSize;
        this.zoom = Math.min(zoomX, zoomY, 2);
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  ensurePool(count) {
    while (this.sprites.length < count) {
      const sprite = new PIXI.Sprite(this.texture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.world.addChild(sprite);
      this.sprites.push(sprite);
    }
    this.spriteCount = count;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.app.renderer.resize(width, height);
  }

  render() {
    this.app.renderer.render(this.stage);
  }

  getTransform() {
    return {
      panX: this.pan.x,
      panY: this.pan.y,
      panZ: this.pan.z,
      zoom: this.zoom,
      rotX: this.rotation.x,
      rotY: this.rotation.y,
      focalLength: this.focalLength,
    };
  }

  destroy() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this.texture) this.texture.destroy();
    this.app.destroy(true);
    this.sprites = [];
    this.spriteCount = 0;
  }
}

export default Renderer;
