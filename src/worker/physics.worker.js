import { DNA_RANGES, DNA_INDEXES, DNA_STRIDE, DNA_PACK_MAX, STRIDE_INDEXES } from "../constants.js";
const STRIDE = 64;
let particles;
let dnaView;
let radiationGrid;
const RAD_RES = 16; // Slightly reduced for performance
let frame = 0;

function getDNA(sIdx, traitIdx) {
    if (!dnaView) return DNA_RANGES[traitIdx].default;
    const offset = sIdx * (DNA_STRIDE * 2);
    const norm = dnaView[offset + traitIdx] / DNA_PACK_MAX;
    const range = DNA_RANGES[traitIdx];
    return norm * (range.max - range.min) + range.min;
}

const DNA_OFFSETS = {};
for (const key in DNA_INDEXES) {
    DNA_OFFSETS[key] = STRIDE_INDEXES.DNA_CACHE_START + DNA_INDEXES[key];
}

const GRID_SIZE = 10;
let spatialGrid = [];

self.onmessage = (e) => {
    const { type, data, config, version } = e.data;
    if (type === 'init') {
        particles = data.particles;
        if (data.dnaBuffer) dnaView = new Uint16Array(data.dnaBuffer);
        radiationGrid = new Float32Array(RAD_RES * RAD_RES * RAD_RES);
    } else if (type === 'step') {
        frame++;
        if (e.data.particles) particles = e.data.particles;
        if (!particles) return;
        
        const count = particles.length / STRIDE;
        const { laws, world } = config;
        const pure = laws.pure || {};
        const biol = laws.biol || {};
        const chem = laws.chem || {};
        const thermo = laws.thermo || {};
        const meta = laws.meta || {};

        const totalDt = pure.dt || 1.0;
        const G = pure.G || 0.15;
        const W = world.dimX, H = world.dimY, D = world.dimZ;
        const spawnRate = world.spawnRate || 10;
        const entropy = world.entropy || 0.1;

        // 0. Spatial Grid Construction
        spatialGrid = new Array(GRID_SIZE * GRID_SIZE * GRID_SIZE).fill(null).map(() => []);
        for (let i = 0; i < count; i++) {
            const ptr = i * STRIDE;
            if (particles[ptr + STRIDE_INDEXES.DEAD] > 0) continue;
            const gx = Math.floor(((particles[ptr + STRIDE_INDEXES.POS_X] / W) + 0.5) * (GRID_SIZE - 1));
            const gy = Math.floor(((particles[ptr + STRIDE_INDEXES.POS_Y] / H) + 0.5) * (GRID_SIZE - 1));
            const gz = Math.floor(((particles[ptr + STRIDE_INDEXES.POS_Z] / D) + 0.5) * (GRID_SIZE - 1));
            const gIdx = Math.max(0, Math.min(spatialGrid.length - 1, gx * GRID_SIZE * GRID_SIZE + gy * GRID_SIZE + gz));
            spatialGrid[gIdx].push(i);
        }

        // 0.1 Radiation Decay
        if (biol.rad) {
            for (let r = 0; r < radiationGrid.length; r++) {
                radiationGrid[r] *= 0.95;
            }
        }

        const numSubSteps = totalDt > 2.0 ? Math.min(20, Math.ceil(totalDt / 1.0)) : 1;
        let dt = totalDt / numSubSteps;

        for (let sub = 0; sub < numSubSteps; sub++) {
            const deadIndices = [];
            let aliveCount = 0;

            // 1. BIOLOGY & SPAWNING
            for (let i = 0; i < count; i++) {
                const ptr = i * STRIDE;
                if (particles[ptr + STRIDE_INDEXES.DEAD] > 0) {
                    deadIndices.push(i);
                    continue;
                }
                aliveCount++;

                const px = particles[ptr + STRIDE_INDEXES.POS_X];
                const py = particles[ptr + STRIDE_INDEXES.POS_Y];
                const pz = particles[ptr + STRIDE_INDEXES.POS_Z];

                if (biol.life) {
                    const energyEfficiency = particles[ptr + DNA_OFFSETS.ENERGY_EFFICIENCY] || 0.8;
                    const cost = (0.01 + particles[ptr + STRIDE_INDEXES.MASS] * 0.001) / energyEfficiency;
                    particles[ptr + STRIDE_INDEXES.ENERGY] -= cost * dt;
                    particles[ptr + STRIDE_INDEXES.AGE] += dt;

                    const deathRate = particles[ptr + DNA_OFFSETS.DEATH_RATE] || 0.1;
                    const deathProb = biol.senescence ? deathRate : 0;
                    if (particles[ptr + STRIDE_INDEXES.ENERGY] <= 0 || Math.random() < (deathProb * 0.001 * dt)) {
                        particles[ptr + STRIDE_INDEXES.DEAD] = 1;
                        aliveCount--;
                    }
                }

                if (biol.genotype && Math.random() < 0.001 * dt) {
                    // Genetic drift: slight DNA mutation over time
                    const trait = Math.floor(Math.random() * 42);
                    particles[ptr + STRIDE_INDEXES.DNA_CACHE_START + trait] += (Math.random() - 0.5) * 0.1;
                }

                if (biol.rad) {
                    const gx = Math.floor(((px / W) + 0.5) * (RAD_RES - 1));
                    const gy = Math.floor(((py / H) + 0.5) * (RAD_RES - 1));
                    const gz = Math.floor(((pz / D) + 0.5) * (RAD_RES - 1));
                    const rIdx = Math.max(0, Math.min(radiationGrid.length - 1, gx * RAD_RES * RAD_RES + gy * RAD_RES + gz));
                    
                    if (particles[ptr + STRIDE_INDEXES.MASS] > 2.0) {
                        radiationGrid[rIdx] += (particles[ptr + STRIDE_INDEXES.MASS] - 2.0) * 0.1 * dt;
                    }
                    
                    if (radiationGrid[rIdx] > 1.0) {
                        particles[ptr + STRIDE_INDEXES.ENERGY] -= (radiationGrid[rIdx] - 1.0) * 0.5 * dt;
                    }
                }

                if (biol.glow) {
                    const pulse = Math.sin(frame * (particles[ptr + DNA_OFFSETS.PULSE_RATE] || 0.1));
                    particles[ptr + STRIDE_INDEXES.ENERGY] += pulse * 0.1 * dt;
                }

                if (pure.void && particles[ptr + STRIDE_INDEXES.MASS] > 1.0) {
                    particles[ptr + STRIDE_INDEXES.MASS] -= 0.002 * dt;
                }

                if (chem.isom && Math.random() < (particles[ptr + DNA_OFFSETS.MUTATION] || 0.01) * 0.01 * dt) {
                    particles[ptr + STRIDE_INDEXES.SPECIES_ID] = Math.floor(Math.random() * 12);
                }

                if (chem.oxid && particles[ptr + STRIDE_INDEXES.MASS] > 1.5) {
                    particles[ptr + STRIDE_INDEXES.ENERGY] -= 0.05 * dt;
                }
            }

            // SPAWN LOGIC
            if (biol.reproduction && aliveCount < count && Math.random() < (spawnRate * 0.01 * dt)) {
                const spawnCount = Math.min(deadIndices.length, Math.ceil(spawnRate * dt));
                for (let s = 0; s < spawnCount; s++) {
                    const idx = deadIndices.pop();
                    const ptr = idx * STRIDE;
                    particles[ptr + STRIDE_INDEXES.POS_X] = (Math.random() - 0.5) * W;
                    particles[ptr + STRIDE_INDEXES.POS_Y] = (Math.random() - 0.5) * H;
                    particles[ptr + STRIDE_INDEXES.POS_Z] = (Math.random() - 0.5) * D;
                    particles[ptr + STRIDE_INDEXES.VEL_X] = (Math.random() - 0.5) * 2;
                    particles[ptr + STRIDE_INDEXES.VEL_Y] = (Math.random() - 0.5) * 2;
                    particles[ptr + STRIDE_INDEXES.VEL_Z] = (Math.random() - 0.5) * 2;
                    particles[ptr + STRIDE_INDEXES.MASS] = 1.0; 
                    particles[ptr + STRIDE_INDEXES.SPECIES_ID] = Math.floor(Math.random() * 12);
                    particles[ptr + STRIDE_INDEXES.DEAD] = 0;
                    particles[ptr + STRIDE_INDEXES.ENERGY] = 100.0;
                    particles[ptr + STRIDE_INDEXES.AGE] = 0;
                    aliveCount++;
                }
            }

            // 2. PHYSICS & FORCES
            for (let i = 0; i < count; i++) {
                const ptr = i * STRIDE;
                if (particles[ptr + STRIDE_INDEXES.DEAD] > 0) continue;
                let ax = 0, ay = 0, az = 0;

                let localDt = dt;
                if (meta.time) {
                    const d2c = Math.sqrt(particles[ptr]**2 + particles[ptr+1]**2 + particles[ptr+2]**2);
                    localDt *= Math.max(0.1, Math.min(1.0, d2c / 200));
                }

                if (thermo.heat) { ax += (Math.random()-0.5)*0.5; ay += (Math.random()-0.5)*0.5; az += (Math.random()-0.5)*0.5; }
                if (thermo.cold) { particles[ptr+3] *= 0.95; particles[ptr+4] *= 0.95; particles[ptr+5] *= 0.95; }
                if (thermo.radi) { particles[ptr + STRIDE_INDEXES.MASS] -= 0.001 * localDt; }

                if (thermo.subl && (entropy + (particles[ptr + DNA_OFFSETS.JITTER]||0)) > 2.0) {
                    particles[ptr + STRIDE_INDEXES.MASS] -= 0.005 * localDt;
                    particles[ptr + STRIDE_INDEXES.ENERGY] += 0.01 * localDt;
                }

                if (thermo.melt) {
                    const meltJitter = (particles[ptr + STRIDE_INDEXES.ENERGY] / 100) * 0.5;
                    ax += (Math.random()-0.5)*meltJitter; ay += (Math.random()-0.5)*meltJitter; az += (Math.random()-0.5)*meltJitter;
                }

                if (thermo.boil && particles[ptr + STRIDE_INDEXES.ENERGY] > 80) {
                    const boilJitter = 2.0;
                    ax += (Math.random()-0.5)*boilJitter; ay += (Math.random()-0.5)*boilJitter; az += (Math.random()-0.5)*boilJitter;
                    particles[ptr + STRIDE_INDEXES.MASS] -= 0.01 * localDt;
                }

                if (thermo.conv) {
                    const heatEffect = particles[ptr + DNA_OFFSETS.HEAT_OUTPUT] || 0.1;
                    ay -= heatEffect * 0.1 * localDt;
                }

                if (pure.jitter) {
                    const j = (entropy + (particles[ptr + DNA_OFFSETS.JITTER]||0)) * 0.5;
                    ax += (Math.random()-0.5)*j; ay += (Math.random()-0.5)*j; az += (Math.random()-0.5)*j;
                }

                if (pure.planetary) ay += 0.2;

                if (meta.chao && Math.random() < 0.01) {
                    ax += (Math.random()-0.5) * 5.0; ay += (Math.random()-0.5) * 5.0; az += (Math.random()-0.5) * 5.0;
                }

                const gx = Math.floor(((particles[ptr + STRIDE_INDEXES.POS_X] / W) + 0.5) * (GRID_SIZE - 1));
                const gy = Math.floor(((particles[ptr + STRIDE_INDEXES.POS_Y] / H) + 0.5) * (GRID_SIZE - 1));
                const gz = Math.floor(((particles[ptr + STRIDE_INDEXES.POS_Z] / D) + 0.5) * (GRID_SIZE - 1));

                for (let ox = -1; ox <= 1; ox++) {
                    for (let oy = -1; oy <= 1; oy++) {
                        for (let oz = -1; oz <= 1; oz++) {
                            let nx = gx + ox, ny = gy + oy, nz = gz + oz;
                            if (nx < 0) nx += GRID_SIZE; if (nx >= GRID_SIZE) nx -= GRID_SIZE;
                            if (ny < 0) ny += GRID_SIZE; if (ny >= GRID_SIZE) ny -= GRID_SIZE;
                            if (nz < 0) nz += GRID_SIZE; if (nz >= GRID_SIZE) nz -= GRID_SIZE;

                            const cell = spatialGrid[nx * GRID_SIZE * GRID_SIZE + ny * GRID_SIZE + nz];
                            if (!cell) continue;

                            for (const j of cell) {
                                if (i === j) continue;
                                const oPtr = j * STRIDE;
                                let dx = particles[oPtr + STRIDE_INDEXES.POS_X] - particles[ptr + STRIDE_INDEXES.POS_X];
                                let dy = particles[oPtr + STRIDE_INDEXES.POS_Y] - particles[ptr + STRIDE_INDEXES.POS_Y];
                                let dz = particles[oPtr + STRIDE_INDEXES.POS_Z] - particles[ptr + STRIDE_INDEXES.POS_Z];
                                
                                if (pure.wrap) {
                                    if (dx > W/2) dx -= W; else if (dx < -W/2) dx += W;
                                    if (dy > H/2) dy -= H; else if (dy < -H/2) dy += H;
                                    if (dz > D/2) dz -= D; else if (dz < -D/2) dz += D;
                                }

                                const d2 = dx*dx + dy*dy + dz*dz + 1.0;
                                const d = Math.sqrt(d2);

                                let phenoMultiplier = 1.0;
                                if (biol.phenotype) {
                                    phenoMultiplier = 1.0 + (particles[ptr + DNA_OFFSETS.ALPHA] || 0.5) * 0.5;
                                }

                                if (pure.grav) {
                                    const affinity = biol.affinity ? (particles[ptr + DNA_OFFSETS.SPECIES_AFFINITY] || 0) : 0;
                                    const sameSpecies = (particles[ptr + STRIDE_INDEXES.SPECIES_ID] === particles[oPtr + STRIDE_INDEXES.SPECIES_ID]);
                                    const multiplier = sameSpecies ? (1.0 + affinity) : (1.0 - affinity);
                                    
                                    // G * M1 * M2 / r^2
                                    const forceMag = (G * particles[ptr + STRIDE_INDEXES.MASS] * particles[oPtr + STRIDE_INDEXES.MASS] * (particles[ptr + DNA_OFFSETS.FORCE]||0) * multiplier * phenoMultiplier) / (d2 + 10.0);
                                    ax += (dx/d)*forceMag; ay += (dy/d)*forceMag; az += (dz/d)*forceMag;
                                }

                                if (chem.solv && particles[ptr + STRIDE_INDEXES.MASS] > 5.0 && d < 100 * phenoMultiplier) {
                                    const solvForce = 0.5 / d;
                                    ax += (dx/d)*solvForce; ay += (dy/d)*solvForce; az += (dz/d)*solvForce;
                                }

                                if (chem.poly && d < 25 * phenoMultiplier) {
                                    // Polymerization: Chains particles into long strings using Bond Angle as preferred axis.
                                    const bAngle = (particles[ptr + DNA_OFFSETS.BOND_ANGLE] || 0) * Math.PI / 180;
                                    const cAngle = Math.atan2(dy, dx);
                                    const alignment = Math.abs(Math.cos(cAngle - bAngle)); 
                                    const polyForce = 2.0 * alignment; // Removed m2 for stability
                                    ax += (dx/d)*polyForce; ay += (dy/d)*polyForce; az += (dz/d)*polyForce;
                                }

                                if (biol.tracking) {
                                    const predBias = particles[ptr + DNA_OFFSETS.PREDATION_BIAS] || 0;
                                    const massDiff = particles[ptr + STRIDE_INDEXES.MASS] - particles[oPtr + STRIDE_INDEXES.MASS];
                                    if (massDiff > 0.5) {
                                        const trackForce = (predBias * 0.1 * particles[oPtr + STRIDE_INDEXES.MASS]) / d;
                                        ax += (dx/d)*trackForce; ay += (dy/d)*trackForce; az += (dz/d)*trackForce;
                                    } else if (massDiff < -0.5) {
                                        const fleeForce = (particles[ptr + DNA_OFFSETS.JITTER] || 0.1) * 0.2 / d;
                                        ax -= (dx/d)*fleeForce; ay -= (dy/d)*fleeForce; az -= (dz/d)*fleeForce;
                                    }
                                }

                                if ((particles[ptr + DNA_OFFSETS.TORQUE]||0) !== 0 && d < 100) {
                                    const tMag = particles[ptr + DNA_OFFSETS.TORQUE] * 0.1 / d;
                                    ax += -dy * tMag; ay += dx * tMag;
                                }

                                if (pure.bond && d < 60 * phenoMultiplier) {
                                    const affinity = particles[ptr + DNA_OFFSETS.SPECIES_AFFINITY] || 0;
                                    const sameSpecies = (particles[ptr + STRIDE_INDEXES.SPECIES_ID] === particles[oPtr + STRIDE_INDEXES.SPECIES_ID]);
                                    
                                    if ((sameSpecies && affinity >= 0) || (!sameSpecies && affinity < 0)) {
                                        const targetD = (particles[ptr + DNA_OFFSETS.BASE_RADIUS] || 5) * 2.5;
                                        const k = (particles[ptr + DNA_OFFSETS.STIFFNESS] || 0.5) * 0.15;
                                        const stretch = d - targetD;
                                        // Fix: Bond sign must be positive for attraction (towards dx)
                                        const f = stretch * k; 
                                        ax += (dx / d) * f; ay += (dy / d) * f; az += (dz / d) * f;
                                    }
                                }

                                if (chem.crys && d < 30 * phenoMultiplier) {
                                    const targetAngle = (particles[ptr + DNA_OFFSETS.BOND_ANGLE] || 0) * Math.PI / 180;
                                    const currentAngle = Math.atan2(dy, dx);
                                    const diff = targetAngle - currentAngle;
                                    const crysForce = Math.sin(diff) * 0.05 * particles[oPtr + STRIDE_INDEXES.MASS];
                                    ax += -Math.sin(currentAngle) * crysForce;
                                    ay += Math.cos(currentAngle) * crysForce;
                                }

                                let reactionScale = 1.0;
                                if (chem.cata) {
                                    reactionScale = 1.0 + (particles[oPtr + DNA_OFFSETS.CATALYSIS] || 1.0) * 0.1;
                                }

                                if (chem.acid && d < 20) particles[oPtr + STRIDE_INDEXES.MASS] -= 0.005 * localDt * reactionScale;
                                if (chem.redu && d < 20) particles[ptr + STRIDE_INDEXES.MASS] += 0.005 * localDt * reactionScale;

                                if (biol.ener && d < 20) {
                                    const diff = (particles[ptr + STRIDE_INDEXES.ENERGY] - particles[oPtr + STRIDE_INDEXES.ENERGY]) * 0.1;
                                    particles[ptr + STRIDE_INDEXES.ENERGY] -= diff * localDt;
                                    particles[oPtr + STRIDE_INDEXES.ENERGY] += diff * localDt;
                                }

                                if (chem.allo && d < 10 && Math.random() < 0.01 * localDt) {
                                    particles[ptr + STRIDE_INDEXES.SPECIES_ID] = (particles[ptr + STRIDE_INDEXES.SPECIES_ID] + 1) % 12;
                                }

                                let phaseThrough = false;
                                if (meta.dime) {
                                    const symmetry = (particles[ptr + DNA_OFFSETS.SYMMETRY] || 0.5);
                                    if (Math.random() < symmetry * 0.5) phaseThrough = true;
                                }

                                if (thermo.exop && d < 25 && !phaseThrough) {
                                    const heat = (particles[ptr + DNA_OFFSETS.HEAT_OUTPUT] || 0.1) * 0.05 * reactionScale;
                                    ax += (Math.random()-0.5)*heat; ay += (Math.random()-0.5)*heat;
                                }

                                if ((pure.coll || pure.accr) && !phaseThrough) {
                                    const r1 = 1.0 + Math.sqrt(particles[ptr + STRIDE_INDEXES.MASS]), r2 = 1.0 + Math.sqrt(particles[oPtr + STRIDE_INDEXES.MASS]);
                                    if (d < r1 + r2) {
                                        if (pure.accr) {
                                            const m1 = particles[ptr + STRIDE_INDEXES.MASS];
                                            const m2 = particles[oPtr + STRIDE_INDEXES.MASS];
                                            const fusionEff = (particles[ptr + DNA_OFFSETS.FUSION]||0.5);
                                            const addedMass = m2 * fusionEff;
                                            
                                            // Intermediary Color Blending
                                            const ratio = addedMass / (m1 + addedMass);
                                            particles[ptr + STRIDE_INDEXES.COLOR_R] += (particles[oPtr + STRIDE_INDEXES.COLOR_R] - particles[ptr + STRIDE_INDEXES.COLOR_R]) * ratio;
                                            particles[ptr + STRIDE_INDEXES.COLOR_G] += (particles[oPtr + STRIDE_INDEXES.COLOR_G] - particles[ptr + STRIDE_INDEXES.COLOR_G]) * ratio;
                                            particles[ptr + STRIDE_INDEXES.COLOR_B] += (particles[oPtr + STRIDE_INDEXES.COLOR_B] - particles[ptr + STRIDE_INDEXES.COLOR_B]) * ratio;

                                            particles[ptr + STRIDE_INDEXES.MASS] += addedMass;
                                            particles[oPtr + STRIDE_INDEXES.DEAD] = 1;
                                        } else if (pure.coll) {
                                            const nx=dx/d, ny=dy/d, nz=dz/d;
                                            const relV = (particles[ptr+3]-particles[oPtr+3])*nx + (particles[ptr+4]-particles[oPtr+4])*ny + (particles[ptr+5]-particles[oPtr+5])*nz;
                                            if (relV < 0) {
                                                const imp = -(1.0 + (particles[ptr + DNA_OFFSETS.ELASTICITY]||0.5)) * relV / (1/particles[ptr + STRIDE_INDEXES.MASS] + 1/particles[oPtr + STRIDE_INDEXES.MASS]);
                                                particles[ptr+3] += (imp/particles[ptr + STRIDE_INDEXES.MASS])*nx; particles[ptr+4] += (imp/particles[ptr + STRIDE_INDEXES.MASS])*ny; particles[ptr+5] += (imp/particles[ptr + STRIDE_INDEXES.MASS])*nz;
                                                particles[oPtr+3] -= (imp/particles[oPtr + STRIDE_INDEXES.MASS])*nx; particles[oPtr+4] -= (imp/particles[oPtr + STRIDE_INDEXES.MASS])*ny; particles[oPtr+5] -= (imp/particles[oPtr + STRIDE_INDEXES.MASS])*nz;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Apply Mass-Normalized Acceleration (a = F/m)
                const mass = particles[ptr + STRIDE_INDEXES.MASS] || 1.0;
                const invMass = 1.0 / mass;
                
                const drag = pure.drag ? (1.0 - (particles[ptr + DNA_OFFSETS.FRICTION] || 0.02)) : 1.0;
                const totalViscosity = (particles[ptr + DNA_OFFSETS.VISCOSITY] || 0.98) * (world.globalViscosity || 0.98);

                // Update Velocity with Damping
                particles[ptr+3] = (particles[ptr+3] + ax * invMass) * drag * totalViscosity;
                particles[ptr+4] = (particles[ptr+4] + ay * invMass) * drag * totalViscosity;
                particles[ptr+5] = (particles[ptr+5] + az * invMass) * drag * totalViscosity;

                if (meta.orde) {
                    particles[ptr+3] *= 0.99; particles[ptr+4] *= 0.99; particles[ptr+5] *= 0.99;
                }

                if (meta.will) {
                    const energyNorm = Math.min(1.0, (particles[ptr + STRIDE_INDEXES.ENERGY] || 0) / 100);
                    const resistance = 1.0 - energyNorm * 0.2; 
                    particles[ptr+3] *= resistance; particles[ptr+4] *= resistance; particles[ptr+5] *= resistance;
                }

                const maxV = (particles[ptr + DNA_OFFSETS.MAX_VELOCITY] || 20);
                const speedSq = particles[ptr+3]**2 + particles[ptr+4]**2 + particles[ptr+5]**2;
                if (speedSq > maxV**2) {
                    const scale = maxV / Math.sqrt(speedSq);
                    particles[ptr+3] *= scale; particles[ptr+4] *= scale; particles[ptr+5] *= scale;
                }

                particles[ptr + STRIDE_INDEXES.POS_X] += particles[ptr + STRIDE_INDEXES.VEL_X] * localDt;
                particles[ptr + STRIDE_INDEXES.POS_Y] += particles[ptr + STRIDE_INDEXES.VEL_Y] * localDt;
                particles[ptr + STRIDE_INDEXES.POS_Z] += particles[ptr + STRIDE_INDEXES.VEL_Z] * localDt;

                if (pure.planetary) {
                    const floor = H / 2;
                    if (particles[ptr + STRIDE_INDEXES.POS_Y] > floor) {
                        particles[ptr + STRIDE_INDEXES.POS_Y] = floor;
                        particles[ptr + STRIDE_INDEXES.VEL_Y] *= -0.5;
                    }
                }

                if (pure.wrap) {
                    if (particles[ptr] < -W/2) particles[ptr] += W; if (particles[ptr] > W/2) particles[ptr] -= W;
                    if (particles[ptr+1] < -H/2) particles[ptr+1] += H; if (particles[ptr+1] > H/2) particles[ptr+1] -= H;
                    if (particles[ptr+2] < -D/2) particles[ptr+2] += D; if (particles[ptr+2] > D/2) particles[ptr+2] -= D;
                if (!pure.wrap) {
                    if (particles[ptr] < -W/2) { particles[ptr] = -W/2; particles[ptr+3] *= -0.5; }
                    if (particles[ptr] > W/2) { particles[ptr] = W/2; particles[ptr+3] *= -0.5; }
                    if (particles[ptr+1] < -H/2) { particles[ptr+1] = -H/2; particles[ptr+4] *= -0.5; }
                    if (particles[ptr+1] > H/2) { particles[ptr+1] = H/2; particles[ptr+4] *= -0.5; }
                    if (particles[ptr+2] < -D/2) { particles[ptr+2] = -D/2; particles[ptr+5] *= -0.5; }
                    if (particles[ptr+2] > D/2) { particles[ptr+2] = D/2; particles[ptr+5] *= -0.5; }
                }
                }
            }
        }
        self.postMessage({ type: 'update', particles, version });
    }
};
