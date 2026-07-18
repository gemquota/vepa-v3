// VEPA v3 — Per-Frame Sprite Update
// Synchronizes particle buffer data → PixiJS sprite visuals.

import { PARTICLE_STRIDE, STRIDE_INDEXES } from '../constants.js';
import { computeColor, computeRadius, computeAlpha } from './phenoType.js';

/**
 * Update all sprites from the particle buffer.
 * @param {Float32Array} buffer - Shared particle buffer
 * @param {number} count - Number of active particles
 * @param {Array<PIXI.Graphics>} sprites - Sprite pool
 * @param {number} worldSize - World size for coordinate transform
 * @param {number} offsetX - Camera/viewport offset X
 * @param {number} offsetY - Camera/viewport offset Y
 * @param {number} zoom - Camera zoom level
 */
export function updateSprites(buffer, count, sprites, worldSize, offsetX = 0, offsetY = 0, zoom = 1, rotation = 0, screenW = 800, screenH = 600) {
  const s = STRIDE_INDEXES;
  const maxVisible = Math.min(count, sprites.length);
  const cosR = Math.cos(-rotation);
  const sinR = Math.sin(-rotation);
  const halfWorld = worldSize / 2;
  const screenCX = screenW / 2;
  const screenCY = screenH / 2;

  for (let i = 0; i < maxVisible; i++) {
    const base = i * PARTICLE_STRIDE;
    const sprite = sprites[i];

    // World position to camera-relative (toroidal shortest path)
    let wx = buffer[base + s.POS_X] - offsetX;
    let wy = buffer[base + s.POS_Y] - offsetY;

    // Toroidal wrap: pick the shortest path around the torus
    if (wx > halfWorld) wx -= worldSize;
    else if (wx < -halfWorld) wx += worldSize;
    if (wy > halfWorld) wy -= worldSize;
    else if (wy < -halfWorld) wy += worldSize;

    // Rotate around screen center
    const rx = wx * cosR - wy * sinR;
    const ry = wx * sinR + wy * cosR;

    // Zoom + center on screen
    const sx = rx * zoom + screenCX;
    const sy = ry * zoom + screenCY;

    sprite.position.set(sx, sy);

    // Color
    const color = computeColor(buffer, base, buffer[base + s.SPECIES_ID]);
    sprite.tint = (Math.round(color.r * 255) << 16) |
                  (Math.round(color.g * 255) << 8) |
                   Math.round(color.b * 255);

    // Alpha
    sprite.alpha = computeAlpha(buffer, base);

    // Radius (scaled by zoom)
    const r = Math.max(1, computeRadius(buffer, base) * zoom);
    // Redraw graphic if size changed
    if (sprite._currentRadius === undefined || Math.abs(sprite._currentRadius - r) > 0.5) {
      sprite.clear();
      sprite.beginFill(0xffffff);
      sprite.drawCircle(0, 0, r);
      sprite.endFill();
      sprite._currentRadius = r;
    }

    // Visibility
    sprite.visible = buffer[base + s.DEAD] < 1;

    // Flash brighter on signal
    const signal = buffer[base + s.SIGNAL] || 0;
    if (signal > 0.1) {
      sprite.alpha = Math.min(1, computeAlpha(buffer, base) + signal * 0.3);
    }
  }

  // Hide excess sprites
  for (let i = maxVisible; i < sprites.length; i++) {
    sprites[i].visible = false;
  }
}
