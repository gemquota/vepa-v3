// VEPA v3 — Phenotype Expression
// Converts DNA + particle state into visual properties (color, radius, alpha).

import { STRIDE_INDEXES, PARTICLE_STRIDE } from '../constants.js';
import { DNA_OFFSETS } from '../physics/dna.js'

/**
 * Compute display color from DNA cache and species identity.
 * @param {Float32Array} buffer - Particle buffer
 * @param {number} base - Particle base offset
 * @param {number} speciesId - Species index (for hue offset)
 * @returns {{r: number, g: number, b: number}}
 */
export function computeColor(buffer, base, speciesId) {
  const s = STRIDE_INDEXES;

  // Base hue from species ID
  const speciesHue = (speciesId / 64) * 360;
  const polarity = buffer[base + DNA_OFFSETS[4]] || 0; // POLARITY
  const hiddenMass = buffer[base + DNA_OFFSETS[7]] || 1; // HIDDEN_MASS

  // Color determined by polarity (blue/red shift) + species hue
  const hueShift = polarity * 60;
  const hue = (speciesHue + hueShift) % 360;

  // Saturation from hidden mass
  const sat = Math.max(0.3, Math.min(1.0, hiddenMass / 3));

  // Lightness from energy
  const energy = buffer[base + s.ENERGY] || 100;
  const light = 0.3 + (energy / 200) * 0.4;

  // Convert HSL to RGB
  return hslToRgb(hue / 360, sat, light);
}

/**
 * Compute display radius from DNA.
 * @returns {number} Radius in pixels
 */
export function computeRadius(buffer, base) {
  const baseRadius = buffer[base + DNA_OFFSETS[29]] || 4; // BASE_RADIUS
  const mass = buffer[base + STRIDE_INDEXES.MASS] || 1;
  return baseRadius * Math.pow(mass, 0.33);
}

/**
 * Compute display alpha from DNA and state.
 * @returns {number} Alpha 0.0-1.0
 */
export function computeAlpha(buffer, base) {
  const s = STRIDE_INDEXES;
  const alpha = buffer[base + DNA_OFFSETS[5]] || 0.8; // ALPHA DNA param
  const energy = buffer[base + s.ENERGY] || 100;
  const dead = buffer[base + s.DEAD] || 0;

  if (dead >= 1) return 0.1;
  if (dead >= 0.5) return 0.3; // Soul state

  const energyFactor = Math.min(1, energy / 100);
  return alpha * energyFactor;
}

/**
 * Update a particle's visual properties in the buffer.
 */
export function expressPhenotype(buffer, particleIndex, speciesId) {
  const base = particleIndex * PARTICLE_STRIDE;
  const s = STRIDE_INDEXES;
  const color = computeColor(buffer, base, speciesId);
  buffer[base + s.COLOR_R] = color.r;
  buffer[base + s.COLOR_G] = color.g;
  buffer[base + s.COLOR_B] = color.b;
  buffer[base + s.RADIUS] = computeRadius(buffer, base);
  buffer[base + s.ALPHA] = computeAlpha(buffer, base);
}

// HSL → RGB helper
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: clamp(r), g: clamp(g), b: clamp(b) };
}

function clamp(v) { return Math.max(0, Math.min(1, v)); }
