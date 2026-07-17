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
export function updateSprites(buffer, count, sprites, worldSize, offsetX = 0, offsetY = 0, zoom = 1) {
  const s = STRIDE_INDEXES;
  const maxVisible = Math.min(count, sprites.length);

  for (let i = 0; i < maxVisible; i++) {
    const base = i * PARTICLE_STRIDE;
    const sprite = sprites[i];

    // World to screen coordinates with camera
    let sx = (buffer[base + s.POS_X] - offsetX) * zoom;
    let sy = (buffer[base + s.POS_Y] - offsetY) * zoom;

    // Toroidal centering: wrap visually if needed
    // (handled by main loop if camera follows center of mass)

    sprite.position.set(sx, sy);

    // Color
    const color = computeColor(buffer, base, buffer[base + s.SPECIES_ID]);
    sprite.tint = (Math.round(color.r * 255) << 16) |
                  (Math.round(color.g * 255) << 8) |
                   Math.round(color.b * 255);

    // Alpha
    sprite.alpha = computeAlpha(buffer, base);

    // Radius (scaled by zoom)
    const r = computeRadius(buffer, base) * zoom;
    // Rebuild graphic if size changed significantly
    if (Math.abs(sprite._currentRadius - r) > 0.5) {
      sprite.clear();
      sprite.beginFill(0xffffff);
      sprite.drawCircle(0, 0, Math.max(1, r));
      sprite.endFill();
      sprite._currentRadius = r;
    }

    // Visibility
    sprite.visible = buffer[base + s.DEAD] < 1;

    // Scale flash on signal
    const signal = buffer[base + s.SIGNAL] || 0;
    if (signal > 0.1) {
      sprite.scale.set(1 + signal * 0.3);
    } else {
      sprite.scale.set(1);
    }
  }

  // Hide excess sprites
  for (let i = maxVisible; i < sprites.length; i++) {
    sprites[i].visible = false;
  }
}
