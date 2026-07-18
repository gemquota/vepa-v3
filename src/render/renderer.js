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
    this.worldSize = Math.max(width, height); // World extent (not canvas size)
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
    this.app.canvas.style.touchAction = 'none';
    this.stage = this.app.stage;

    // Debug: add a text overlay to verify renderer is working
    this._debugText = new PIXI.Text('Debug: Renderer OK', {
      fill: 0xff4444,
      fontSize: 14,
      fontFamily: 'monospace',
    });
    this._debugText.x = 10;
    this._debugText.y = 10;
    this._debugText.zIndex = 9999;
    this.stage.addChild(this._debugText);

    // Test circles
    this._testCircle = new PIXI.Graphics();
    this._testCircle.beginFill(0xff4444);
    this._testCircle.drawCircle(0, 0, 20);
    this._testCircle.endFill();
    this._testCircle.x = 100;
    this._testCircle.y = 100;
    this.stage.addChild(this._testCircle);
    
    this._testParticle = new PIXI.Graphics();
    this._testParticle.beginFill(0x44ff44);
    this._testParticle.drawCircle(0, 0, 5);
    this._testParticle.endFill();
    this._testParticle.x = 200;
    this._testParticle.y = 200;
    this.stage.addChild(this._testParticle);

    // Create a pool of direct-rendered particle sprites
    this._directParticles = [];
    for (let i = 0; i < 50; i++) {
      const p = new PIXI.Graphics();
      p.beginFill(0x44aaff);
      p.drawCircle(0, 0, 4);
      p.endFill();
      p.visible = false;
      this.stage.addChild(p);
      this._directParticles.push(p);
    }

    // Camera state
    this.camera = {
      x: this.width / 2,
      y: this.height / 2,
      zoom: 1.0,
      rotation: 0,
    };
    // After first resize, center on world
    this._centerOnWorld = true;

    // Drag state
    this._isDragging = false;
    this._dragStart = { x: 0, y: 0 };
    this._camStart = { x: 0, y: 0 };

    this._bindMouseEvents();
  
    // Auto-resize to container
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.resize(width, height);
          if (this.camera && this._centerOnWorld) {
            // Center on world center (not canvas center — canvas may be small)
            this.camera.x = this.worldSize / 2;
            this.camera.y = this.worldSize / 2;
            // Auto-zoom to fit world in viewport (important for mobile)
            const zoomX = this.width / this.worldSize;
            const zoomY = this.height / this.worldSize;
            this.camera.zoom = Math.min(zoomX, zoomY, 2); // Don't zoom in more than 2x
            this._centerOnWorld = false;
          }
        }
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
      // Draw a visible initial circle so it shows even before first update
      sprite.beginFill(0xffffff);
      sprite.drawCircle(0, 0, 4);
      sprite.endFill();
      sprite.visible = false;
      sprite._currentRadius = -1; // Force redraw on first update
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

  /** Render a set of direct test particles from the buffer */
  renderTestParticles(buffer, count) {
    const s = { POS_X: 0, POS_Y: 1, POS_Z: 2, RADIUS: 80, ALPHA: 81, DEAD: 74, SPECIES_ID: 7 };
    const halfW = 400;
    for (let i = 0; i < Math.min(count, 50); i++) {
      const base = i * 100;
      const wx = buffer[base] - (this.camera?.x || 400);
      const wy = buffer[base + 1] - (this.camera?.y || 400);
      let sx = wx + halfW;
      let sy = wy + halfW;
      if (i < this._directParticles.length) {
        const p = this._directParticles[i];
        p.x = sx;
        p.y = sy;
        const dead = buffer[base + 74];
        p.visible = dead < 1;
      }
    }
  }

  /** Start the render loop (called by main loop). */
  render() {
    this.app.renderer.render(this.stage);
  }

  _bindMouseEvents() {
    const canvas = this.app.canvas;
    if (!canvas) return;

    // Pan with left-click drag
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this._isDragging = true;
        this._dragStart.x = e.clientX;
        this._dragStart.y = e.clientY;
        this._camStart.x = this.camera.x;
        this._camStart.y = this.camera.y;
        canvas.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this._isDragging) {
        const dx = (e.clientX - this._dragStart.x) / this.camera.zoom;
        const dy = (e.clientY - this._dragStart.y) / this.camera.zoom;
        const cos = Math.cos(this.camera.rotation);
        const sin = Math.sin(this.camera.rotation);
        this.camera.x = this._camStart.x - (dx * cos - dy * sin);
        this.camera.y = this._camStart.y - (dx * sin + dy * cos);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this._isDragging) {
        this._isDragging = false;
        canvas.style.cursor = 'default';
      }
    });

    // Zoom with scroll wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.camera.zoom = Math.max(0.1, Math.min(10, this.camera.zoom * delta));
    }, { passive: false });

    // Rotate with middle-click drag
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        this._isRotating = true;
        this._dragStart.x = e.clientX;
        this._dragStart.y = e.clientY;
        this._rotStart = this.camera.rotation;
        canvas.style.cursor = 'ew-resize';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this._isRotating) {
        const dx = e.clientX - this._dragStart.x;
        this.camera.rotation = this._rotStart + dx * 0.01;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this._isRotating) {
        this._isRotating = false;
        canvas.style.cursor = 'default';
      }
    });

    // Keyboard: R to reset camera
    this._keyHandler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.camera.x = this.width / 2;
        this.camera.y = this.height / 2;
        this.camera.zoom = 1.0;
        this.camera.rotation = 0;
      }
    };
    window.addEventListener('keydown', this._keyHandler);

    // Touch support
    this._setupTouchEvents(canvas);
  }

  _setupTouchEvents(canvas) {
    if (!canvas) return;
    let lastTouch = null;
    let lastDist = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this._camStart.x = this.camera.x;
        this._camStart.y = this.camera.y;
      } else if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && lastTouch) {
        const dx = (e.touches[0].clientX - lastTouch.x) / this.camera.zoom;
        const dy = (e.touches[0].clientY - lastTouch.y) / this.camera.zoom;
        this.camera.x = this._camStart.x - dx;
        this.camera.y = this._camStart.y - dy;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastDist > 0) {
          this.camera.zoom *= dist / lastDist;
          this.camera.zoom = Math.max(0.1, Math.min(10, this.camera.zoom));
        }
        lastDist = dist;
      }
    }, { passive: false });
  }

  /** Get camera transform for sprite rendering */
  getTransform() {
    return {
      offsetX: this.camera.x,
      offsetY: this.camera.y,
      zoom: this.camera.zoom,
      rotation: this.camera.rotation,
    };
  }

  /** Clean up. */
  destroy() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this.app.destroy(true);
    this.sprites = [];
    this.spriteCount = 0;
  }
}

export default Renderer;
