// VEPA v3 — Per-Frame Sprite Update (vepa2-compatible)
// Synchronizes particle buffer data → PIXI.Sprite visuals with 3D perspective.

import { PARTICLE_STRIDE, STRIDE_INDEXES } from '../constants.js';

const TEXTURE_SIZE = 32; // Radius of the generated texture

/**
 * Update all sprites from the particle buffer using 3D perspective projection.
 */
export function updateSprites(
  buffer, count, sprites, worldSize,
  panX = 400, panY = 400, panZ = 0,
  zoom = 1, rotX = 0, rotY = 0,
  focalLength = 400, screenW = 800, screenH = 600
) {
  const s = STRIDE_INDEXES;
  const maxVisible = Math.min(count, sprites.length);
  const cX = screenW / 2, cY = screenH / 2;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

  for (let i = 0; i < maxVisible; i++) {
    const base = i * PARTICLE_STRIDE;
    const sprite = sprites[i];

    // Skip dead particles
    if (buffer[base + s.DEAD] > 0) {
      sprite.visible = false;
      continue;
    }

    const px = buffer[base + s.POS_X];
    const py = buffer[base + s.POS_Y];
    const pz = buffer[base + s.POS_Z];

    // 3D rotation (Y then X)
    const x1 = px * cosY - pz * sinY;
    const z1 = px * sinY + pz * cosY;
    const y2 = py * cosX - z1 * sinX;
    const z2 = py * sinX + z1 * cosX;

    // Apply camera pan
    const wx = x1 + panX;
    const wy = y2 + panY;
    const wz = z2 + panZ;

    // Perspective projection
    const depth = focalLength + wz;
    if (depth <= 10) {
      sprite.visible = false;
      continue;
    }

    sprite.visible = true;
    const pScale = focalLength / depth;

    // Screen position
    sprite.x = cX + wx * pScale * zoom;
    sprite.y = cY + wy * pScale * zoom;

    // Scale based on mass + perspective + zoom
    const mass = buffer[base + s.MASS] || 1;
    const size = Math.sqrt(mass) * 2 * pScale * zoom;
    sprite.scale.set(size / TEXTURE_SIZE);

    // Tint from color
    const r = Math.floor((buffer[base + s.COLOR_R] || 0) * 255);
    const g = Math.floor((buffer[base + s.COLOR_G] || 0) * 255);
    const b = Math.floor((buffer[base + s.COLOR_B] || 0) * 255);
    sprite.tint = (r << 16) | (g << 8) | b;

    // Alpha
    sprite.alpha = buffer[base + s.ALPHA] || 0.8;
  }

  // Hide excess sprites
  for (let i = maxVisible; i < sprites.length; i++) {
    sprites[i].visible = false;
  }
}
