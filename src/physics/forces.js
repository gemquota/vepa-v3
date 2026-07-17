// VEPA v3 — Force Computation
// All force types organized by law. Each force function takes particle data
// and returns force deltas.

import { STRIDE_INDEXES, PARTICLE_STRIDE, MAX_FORCE, LAW_INDEXES } from '../constants.js';
import LawManager from './laws.js';

// ── Gravity (grav) ────────────────────────────────────────────────
export function computeGravity(pA, pB, config) {
  const dx = pB.posX - pA.posX;
  const dy = pB.posY - pA.posY;
  const dz = pB.posZ - pA.posZ;
  const distSq = dx * dx + dy * dy + dz * dz + 0.01;
  const dist = Math.sqrt(distSq);
  const massProduct = pA.mass * pB.mass;
  const f = massProduct / distSq;
  return { fx: (dx / dist) * f, fy: (dy / dist) * f, fz: (dz / dist) * f };
}

// ── Drag (drag) ───────────────────────────────────────────────────
export function computeDrag(pA, pB, config) {
  // Velocity-dependent drag: opposing force proportional to relative velocity
  const dvx = pB.velX - pA.velX;
  const dvy = pB.velY - pA.velY;
  const dvz = pB.velZ - pA.velZ;
  const dragCoeff = 0.01 * (pA.viscosity + pB.viscosity) * 0.5;
  return { fx: -dvx * dragCoeff, fy: -dvy * dragCoeff, fz: -dvz * dragCoeff };
}

// ── Polarity (electromagnetic) ────────────────────────────────────
export function computePolarity(pA, pB, config) {
  const dx = pB.posX - pA.posX;
  const dy = pB.posY - pA.posY;
  const dz = pB.posZ - pA.posZ;
  const distSq = dx * dx + dy * dy + dz * dz + 0.01;
  const dist = Math.sqrt(distSq);
  const chargeProduct = pA.polarity * pB.polarity;
  const f = chargeProduct / distSq;
  return { fx: (dx / dist) * f, fy: (dy / dist) * f, fz: (dz / dist) * f };
}

// ── Collision (coll) ──────────────────────────────────────────────
export function computeCollision(pA, pB, config) {
  const dx = pB.posX - pA.posX;
  const dy = pB.posY - pA.posY;
  const dz = pB.posZ - pA.posZ;
  const distSq = dx * dx + dy * dy + dz * dz;
  const minDist = (pA.radius + pB.radius) * 0.8;

  if (distSq >= minDist * minDist || distSq < 0.001) {
    return { fx: 0, fy: 0, fz: 0 };
  }

  const dist = Math.sqrt(distSq);
  const overlap = minDist - dist;
  const stiffness = (pA.stiffness + pB.stiffness) * 0.5 * 0.5;
  const force = overlap * stiffness;

  // Elasticity
  const elasticity = (pA.elasticity + pB.elasticity) * 0.5;
  const dvx = pB.velX - pA.velX;
  const dvy = pB.velY - pA.velY;
  const dvz = pB.velZ - pA.velZ;
  const relVel = (dvx * dx + dvy * dy + dvz * dz) / dist;
  const damping = relVel * (1 - elasticity) * 0.3;

  return {
    fx: (dx / dist) * (force - damping),
    fy: (dy / dist) * (force - damping),
    fz: (dz / dist) * (force - damping),
  };
}

// ── Predation Bias (predation) ────────────────────────────────────
export function computePredation(pA, pB, config) {
  // Predator (positive bias) moves toward lower-mass particles
  // Prey (negative bias) moves away from higher-mass
  if (pA.predationBias === 0 && pB.predationBias === 0) {
    return { fx: 0, fy: 0, fz: 0 };
  }

  const dx = pB.posX - pA.posX;
  const dy = pB.posY - pA.posY;
  const dz = pB.posZ - pA.posZ;
  const distSq = dx * dx + dy * dy + dz * dz + 0.01;
  const dist = Math.sqrt(distSq);

  // A's predation toward B
  const aBias = pA.predationBias * (pB.mass < pA.mass ? 1 : -0.3);
  // B's predation toward A
  const bBias = pB.predationBias * (pA.mass < pB.mass ? 1 : -0.3);

  const net = aBias - bBias;
  const f = net * 0.5 / distSq;

  return { fx: (dx / dist) * f, fy: (dy / dist) * f, fz: (dz / dist) * f };
}

// ── Signal Propagation (glow) ─────────────────────────────────────
export function computeSignal(pA, pB, config) {
  const dx = pB.posX - pA.posX;
  const dy = pB.posY - pA.posY;
  const dz = pB.posZ - pA.posZ;
  const distSq = dx * dx + dy * dy + dz * dz;
  const maxDist = (pA.neighborhoodRadius + pB.neighborhoodRadius) * 0.5;

  if (distSq > maxDist * maxDist || distSq < 0.01) {
    return { fx: 0, fy: 0, fz: 0 };
  }

  const signalStrength = pA.signalStrength * pB.signalResponse;
  const decay = Math.exp(-Math.sqrt(distSq) / maxDist);
  const force = signalStrength * decay * 0.1;

  return { fx: dx * force, fy: dy * force, fz: dz * force };
}

// ── Bond Forces (bond) ────────────────────────────────────────────
export function computeBond(pA, pB, config) {
  // If they're bond partners, apply spring force
  if (pA.bondPartners.has(pB.index) || pB.bondPartners.has(pA.index)) {
    const dx = pB.posX - pA.posX;
    const dy = pB.posY - pA.posY;
    const dz = pB.posZ - pA.posZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.01);
    const restLen = (pA.radius + pB.radius) * 1.5;
    const displacement = dist - restLen;
    const k = (pA.stiffness + pB.stiffness) * 0.5 * 0.1;
    const f = -displacement * k;
    return { fx: (dx / dist) * f, fy: (dy / dist) * f, fz: (dz / dist) * f };
  }
  return { fx: 0, fy: 0, fz: 0 };
}

// ── Accretion/Fusion (accr) ───────────────────────────────────────
export function computeAccretion(pA, pB, config) {
  if (pA.fusion <= 0 || pB.fusion <= 0) return { fx: 0, fy: 0, fz: 0 };
  const dx = pB.posX - pA.posX;
  const dy = pB.posY - pA.posY;
  const dz = pB.posZ - pA.posZ;
  const distSq = dx * dx + dy * dy + dz * dz + 0.01;
  const dist = Math.sqrt(distSq);
  const minDist = (pA.radius + pB.radius) * 0.5;
  if (dist > minDist * 3) return { fx: 0, fy: 0, fz: 0 };
  const f = (pA.fusion + pB.fusion) * 0.1 / distSq;
  return { fx: (dx / dist) * f, fy: (dy / dist) * f, fz: (dz / dist) * f };
}

// ── Force Selector ────────────────────────────────────────────────
// Maps buffer data to structured particle objects for force computation.

export function extractParticle(buffer, index, speciesDna) {
  const base = index * PARTICLE_STRIDE;
  const s = STRIDE_INDEXES;
  const speciesId = buffer[base + s.SPECIES_ID];
  const dna = speciesDna[speciesId] || {};

  return {
    index,
    posX: buffer[base + s.POS_X],
    posY: buffer[base + s.POS_Y],
    posZ: buffer[base + s.POS_Z],
    velX: buffer[base + s.VEL_X],
    velY: buffer[base + s.VEL_Y],
    velZ: buffer[base + s.VEL_Z],
    mass: buffer[base + s.MASS],
    radius: buffer[base + s.RADIUS],
    polarity: dna.polarity || 0,
    viscosity: dna.viscosity || 0.5,
    stiffness: dna.stiffness || 0.5,
    elasticity: dna.elasticity || 0.5,
    fusion: dna.fusion || 0,
    predationBias: dna.predationBias || 0,
    signalStrength: dna.signalStrength || 0,
    signalResponse: dna.signalResponse || 0.5,
    neighborhoodRadius: dna.neighborhoodRadius || 50,
    dead: buffer[base + s.DEAD],
    bondPartners: new Set(
      [s.BOND_PARTNER_1, s.BOND_PARTNER_2, s.BOND_PARTNER_3,
       s.BOND_PARTNER_4, s.BOND_PARTNER_5, s.BOND_PARTNER_6]
        .map(offset => buffer[base + offset])
        .filter(v => v >= 0)
    ),
  };
}

/**
 * Compute all applicable forces between two particles based on active laws.
 * @returns {{fx, fy, fz}}
 */
export function computeForces(pA, pB, lawFlags, config) {
  let fx = 0, fy = 0, fz = 0;

  if (LawManager.isSet(LAW_INDEXES.GRAV, lawFlags.low, lawFlags.high)) {
    const g = computeGravity(pA, pB, config);
    fx += g.fx; fy += g.fy; fz += g.fz;
  }

  if (pA.dead >= 1 || pB.dead >= 1) return { fx, fy, fz };

  if (LawManager.isSet(LAW_INDEXES.DRAG, lawFlags.low, lawFlags.high)) {
    const d = computeDrag(pA, pB, config);
    fx += d.fx; fy += d.fy; fz += d.fz;
  }

  if (LawManager.isSet(LAW_INDEXES.COLL, lawFlags.low, lawFlags.high)) {
    const c = computeCollision(pA, pB, config);
    fx += c.fx; fy += c.fy; fz += c.fz;
  }

  if (LawManager.isSet(LAW_INDEXES.PREDATION, lawFlags.low, lawFlags.high)) {
    const p = computePredation(pA, pB, config);
    fx += p.fx; fy += p.fy; fz += p.fz;
  }

  // Signal always applies if either particle has signal strength
  if (pA.signalStrength > 0 || pB.signalStrength > 0) {
    const s = computeSignal(pA, pB, config);
    fx += s.fx; fy += s.fy; fz += s.fz;
  }

  if (LawManager.isSet(LAW_INDEXES.BOND, lawFlags.low, lawFlags.high)) {
    const b = computeBond(pA, pB, config);
    fx += b.fx; fy += b.fy; fz += b.fz;
  }

  if (LawManager.isSet(LAW_INDEXES.ACCR, lawFlags.low, lawFlags.high)) {
    const a = computeAccretion(pA, pB, config);
    fx += a.fx; fy += a.fy; fz += a.fz;
  }

  return { fx, fy, fz };
}
