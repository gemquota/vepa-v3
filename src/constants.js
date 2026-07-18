// VEPA v3 — Constants, Indexes & Metadata
// Single source of truth for all simulation parameters.

// ── Core Dimensions ───────────────────────────────────────────────
export const PARTICLE_STRIDE = 100;       // Floats per particle
export const DNA_STRIDE = 64;             // Params per species (42 active)
export const MAX_SPECIES = 64;            // Hard species limit
export const MAX_PARTICLES = 50000;       // Absolute particle cap
export const MAX_LIFE_PARTICLES = 5000;   // Alive particle soft cap
export const LAW_COUNT = 64;              // Total laws (64-bit bitmask)

// ── Spatial Grid ──────────────────────────────────────────────────
export const GRID_SIZE = 12;              // Cells per axis (12×12×12)
export const MAX_CELL_CAPACITY = 100;     // Max particles per cell
export const TOTAL_CELLS = GRID_SIZE ** 3;

// ── Physics Stability ─────────────────────────────────────────────
export const MAX_INTERACTIONS = 500;      // Per particle per frame
export const MAX_SUBSTEPS = 10;           // Max sub-steps per frame
export const MAX_FORCE = 50.0;            // Force clamp magnitude
export const MIN_SUBSTEP_DT = 0.001;      // Minimum delta-time per sub-step
export const DEAD_PARTICLE_THRESHOLD = 0.5; // 0=alive, 1=dead, 0.5=soul

// ── Stride Indexes ────────────────────────────────────────────────
export const STRIDE_INDEXES = {
  POS_X: 0,
  POS_Y: 1,
  POS_Z: 2,
  VEL_X: 3,
  VEL_Y: 4,
  VEL_Z: 5,
  MASS: 6,
  SPECIES_ID: 7,
  DNA_CACHE_START: 8,   // 64 consecutive floats (8..71)
  ENERGY: 72,
  AGE: 73,
  DEAD: 74,             // 0=alive, 1=dead, 0.5=soul
  COLOR_R: 75,
  COLOR_G: 76,
  COLOR_B: 77,
  MEMORY: 78,
  SIGNAL: 79,
  RADIUS: 80,
  ALPHA: 81,
  MITOSIS_TIMER: 82,
  PARTNER_ID: 83,
  HUNGER: 84,
  ARMOR: 85,
  BOND_COUNT: 86,
  CHAIN_LENGTH: 87,
  BOND_PARTNER_1: 88,
  BOND_PARTNER_2: 89,
  BOND_PARTNER_3: 90,
  BOND_PARTNER_4: 91,
  BOND_PARTNER_5: 92,
  BOND_PARTNER_6: 93,
  SPECIES_CLASS: 94,
  COMBAT_STATE: 95,
  STIGMERGY_X: 96,
  STIGMERGY_Y: 97,
  STIGMERGY_Z: 98,
  RESERVED: 99,
};

// ── Law Indexes (64-bit bitmask) ─────────────────────────────────
// Physics (0–15): Blue
export const LAW_INDEXES = {
  // Physics 0-9
  GRAV: 0,        DRAG: 1,        ENTR: 2,
  WRAP: 3,        COLL: 4,        ACCR: 5,
  PLANET: 6,      VOID: 7,        BOND: 8,
  // Physics 9-15
  INERTIA_LAW: 9, FRICTION_LAW: 10, TIDAL_LAW: 11,
  TORQUE_LAW: 12, VISCOSITY_LAW: 13, JITTER_LAW: 14,
  BOIL: 15,

  // Biology (16–31): Green
  LIFE: 16,       GLOW: 17,       AFFINITY: 18,
  REPRODUCTION: 19, TRACKING: 20, SENESCENCE: 21,
  GENOTYPE: 22,   PHENOTYPE: 23,  ENER: 24,
  RAD: 25,        // Radiation biology
  PREDATION: 26,  HERBIVORY: 27,  SYMBIOSIS: 28,
  METAMORPH: 29,  SPORE: 30,      EXOP: 31,

  // Chemistry (32–47): Purple
  CATA: 32,       SOLV: 33,       ACID: 34,
  OXID: 35,       REDU: 36,       POLY: 37,
  ISOM: 38,       CHIR: 39,       CRYS: 40,
  ALLO: 41,
  // Chemistry 42-47 reserved
  ELEC: 42,       MAGN: 43,       PLAS: 44,
  GAS: 45,        LIQ: 46,        SOLID: 47,

  // Thermodynamics (48-... mapping shifted internally)
  // Using 48-57
  HEAT: 48,       COLD: 49,       CONV: 50,
  RADI: 51,       SUBL: 52,       MELT: 53,
  BOIL_THERMAL: 54, COND: 55,
  DEPO: 56,       EXOP_THERMAL: 57,

  // Metaphysics (58-63): Red
  TIME: 58,       DIME: 59,       HARMONY: 60,
  FATE: 61,       WILL: 62,       SOUL: 63,
  MIND: 64,       TELE: 65,       CLAI: 66,
  PREO: 67,       ASTR: 68,       CHRONOS: 69,
};

// Adjust: keep 64-bit total. Some indexes >63 for reference, but bitmask uses low 32 + high 32.
export const LAW_BITS = {
  LOW_COUNT: 32,
  HIGH_START: 32,
};

// ── Law Categories ───────────────────────────────────────────────
export const LAW_CATEGORIES = {
  PHYSICS: 0,
  BIOLOGY: 1,
  CHEMISTRY: 2,
  THERMODYNAMICS: 3,
  METAPHYSICS: 4,
};

export const LAW_CATEGORY_COLORS = {
  [LAW_CATEGORIES.PHYSICS]: '#4488ff',
  [LAW_CATEGORIES.BIOLOGY]: '#44cc44',
  [LAW_CATEGORIES.CHEMISTRY]: '#cc44cc',
  [LAW_CATEGORIES.THERMODYNAMICS]: '#ff8844',
  [LAW_CATEGORIES.METAPHYSICS]: '#ff4444',
};

// Category → [firstLawIndex, count]
export const LAW_CATEGORY_RANGES = {
  [LAW_CATEGORIES.PHYSICS]: [0, 16],
  [LAW_CATEGORIES.BIOLOGY]: [16, 16],
  [LAW_CATEGORIES.CHEMISTRY]: [32, 16],
  [LAW_CATEGORIES.THERMODYNAMICS]: [48, 10],
  [LAW_CATEGORIES.METAPHYSICS]: [58, 12],
};

// Multi-state law config: {lawIndex, maxState, labels}
export const MULTI_STATE_LAWS = [
  { index: LAW_INDEXES.WRAP, maxState: 3, labels: ['Off', 'Soft', 'Hard', 'Portal'] },
  { index: LAW_INDEXES.REPRODUCTION, maxState: 3, labels: ['Off', 'Clone', 'Sexual', 'Mitosis'] },
  { index: LAW_INDEXES.HARMONY, maxState: 2, labels: ['Off', 'Attune', 'Resonate'] },
];

// ── DNA Indexes (42 active params) ────────────────────────────────
export const DNA_INDEXES = {
  // Physics & Motion (0-3, 15, 26-28)
  FORCE: 0,
  VISCOSITY: 1,
  TORQUE: 2,
  JITTER: 3,
  TIDAL: 15,
  INERTIA: 26,
  FRICTION: 27,
  MAX_VELOCITY: 28,

  // Matter & Morphology (6-9, 16-17, 29-31)
  SYMMETRY: 6,
  HIDDEN_MASS: 7,
  STIFFNESS: 8,
  FUSION: 9,
  FUSION_MOMENTUM: 16,
  FUSION_TIME: 17,
  BASE_RADIUS: 29,
  ELASTICITY: 30,
  BOND_ANGLE: 31,

  // Electromagnetism & Chemistry (4-5, 32-33, 37-39)
  POLARITY: 4,
  ALPHA: 5,
  CONDUCTIVITY: 32,
  MAGNETIC_MOMENT: 33,
  REACTION_THRESHOLD: 37,
  CATALYSIS: 38,
  HEAT_OUTPUT: 39,

  // Biology & Life (10-12, 34-36, 41)
  BIRTH_RATE: 10,
  DEATH_RATE: 11,
  MUTATION: 12,
  ENERGY_EFFICIENCY: 34,
  SEX_CHANCE: 35,
  PREDATION_BIAS: 36,
  SPECIES_AFFINITY: 41,

  // Communication & Memory (13-14, 18-25, 40)
  SIGNAL_RESP: 13,
  PULSE_RATE: 14,
  NEIGHBORHOOD_RADIUS: 18,
  SIGNAL_STRENGTH: 19,
  SIGNAL_DECAY: 20,
  PROPAGATION_SPEED: 21,
  TUNING_CH1: 22,
  TUNING_CH2: 23,
  TUNING_CH3: 24,
  TUNING_CH4: 25,
  MEMORY_DECAY: 40,
};

// DNA parameter ranges: {min, max, default, step}
export const DNA_RANGES = {
  [DNA_INDEXES.FORCE]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Force' },
  [DNA_INDEXES.VISCOSITY]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Viscosity' },
  [DNA_INDEXES.TORQUE]: { min: 0.0, max: 1.0, default: 0.0, step: 0.01, label: 'Torque' },
  [DNA_INDEXES.JITTER]: { min: 0.0, max: 1.0, default: 0.01, step: 0.001, label: 'Jitter' },
  [DNA_INDEXES.TIDAL]: { min: 0.0, max: 1.0, default: 0.0, step: 0.01, label: 'Tidal' },
  [DNA_INDEXES.INERTIA]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Inertia' },
  [DNA_INDEXES.FRICTION]: { min: 0.0, max: 1.0, default: 0.01, step: 0.001, label: 'Friction' },
  [DNA_INDEXES.MAX_VELOCITY]: { min: 0.1, max: 10.0, default: 3.0, step: 0.1, label: 'Max Velocity' },
  [DNA_INDEXES.SYMMETRY]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Symmetry' },
  [DNA_INDEXES.HIDDEN_MASS]: { min: 0.0, max: 5.0, default: 1.0, step: 0.1, label: 'Hidden Mass' },
  [DNA_INDEXES.STIFFNESS]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Stiffness' },
  [DNA_INDEXES.FUSION]: { min: 0.0, max: 1.0, default: 0.0, step: 0.01, label: 'Fusion' },
  [DNA_INDEXES.FUSION_MOMENTUM]: { min: 0.0, max: 10.0, default: 2.0, step: 0.1, label: 'Fusion Momentum' },
  [DNA_INDEXES.FUSION_TIME]: { min: 0.0, max: 100.0, default: 10.0, step: 1.0, label: 'Fusion Time' },
  [DNA_INDEXES.BASE_RADIUS]: { min: 1.0, max: 20.0, default: 4.0, step: 0.5, label: 'Base Radius' },
  [DNA_INDEXES.ELASTICITY]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Elasticity' },
  [DNA_INDEXES.BOND_ANGLE]: { min: 0.0, max: 360.0, default: 120.0, step: 5.0, label: 'Bond Angle' },
  [DNA_INDEXES.POLARITY]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Polarity' },
  [DNA_INDEXES.ALPHA]: { min: 0.0, max: 1.0, default: 0.8, step: 0.01, label: 'Alpha' },
  [DNA_INDEXES.CONDUCTIVITY]: { min: 0.0, max: 1.0, default: 0.1, step: 0.01, label: 'Conductivity' },
  [DNA_INDEXES.MAGNETIC_MOMENT]: { min: 0.0, max: 1.0, default: 0.0, step: 0.01, label: 'Magnetic Moment' },
  [DNA_INDEXES.REACTION_THRESHOLD]: { min: 0.0, max: 100.0, default: 50.0, step: 1.0, label: 'Reaction Threshold' },
  [DNA_INDEXES.CATALYSIS]: { min: 0.0, max: 5.0, default: 1.0, step: 0.1, label: 'Catalysis' },
  [DNA_INDEXES.HEAT_OUTPUT]: { min: 0.0, max: 1.0, default: 0.0, step: 0.01, label: 'Heat Output' },
  [DNA_INDEXES.BIRTH_RATE]: { min: 0.0, max: 0.1, default: 0.01, step: 0.001, label: 'Birth Rate' },
  [DNA_INDEXES.DEATH_RATE]: { min: 0.0, max: 0.1, default: 0.005, step: 0.001, label: 'Death Rate' },
  [DNA_INDEXES.MUTATION]: { min: 0.0, max: 0.5, default: 0.05, step: 0.01, label: 'Mutation' },
  [DNA_INDEXES.ENERGY_EFFICIENCY]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Energy Efficiency' },
  [DNA_INDEXES.SEX_CHANCE]: { min: 0.0, max: 1.0, default: 0.0, step: 0.01, label: 'Sex Chance' },
  [DNA_INDEXES.PREDATION_BIAS]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Predation Bias' },
  [DNA_INDEXES.SPECIES_AFFINITY]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Species Affinity' },
  [DNA_INDEXES.SIGNAL_RESP]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Signal Response' },
  [DNA_INDEXES.PULSE_RATE]: { min: 0.0, max: 1.0, default: 0.1, step: 0.01, label: 'Pulse Rate' },
  [DNA_INDEXES.NEIGHBORHOOD_RADIUS]: { min: 10.0, max: 200.0, default: 50.0, step: 5.0, label: 'Neighborhood Radius' },
  [DNA_INDEXES.SIGNAL_STRENGTH]: { min: 0.0, max: 1.0, default: 0.5, step: 0.01, label: 'Signal Strength' },
  [DNA_INDEXES.SIGNAL_DECAY]: { min: 0.0, max: 1.0, default: 0.1, step: 0.01, label: 'Signal Decay' },
  [DNA_INDEXES.PROPAGATION_SPEED]: { min: 0.0, max: 1.0, default: 0.3, step: 0.01, label: 'Propagation Speed' },
  [DNA_INDEXES.TUNING_CH1]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Tuning CH1' },
  [DNA_INDEXES.TUNING_CH2]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Tuning CH2' },
  [DNA_INDEXES.TUNING_CH3]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Tuning CH3' },
  [DNA_INDEXES.TUNING_CH4]: { min: -1.0, max: 1.0, default: 0.0, step: 0.01, label: 'Tuning CH4' },
  [DNA_INDEXES.MEMORY_DECAY]: { min: 0.0, max: 1.0, default: 0.1, step: 0.01, label: 'Memory Decay' },
};

// ── DNA Groups ───────────────────────────────────────────────────
export const DNA_GROUPS = [
  {
    name: 'Physics & Motion',
    indexes: [DNA_INDEXES.FORCE, DNA_INDEXES.VISCOSITY, DNA_INDEXES.TORQUE, DNA_INDEXES.JITTER,
              DNA_INDEXES.TIDAL, DNA_INDEXES.INERTIA, DNA_INDEXES.FRICTION, DNA_INDEXES.MAX_VELOCITY],
  },
  {
    name: 'Matter & Morphology',
    indexes: [DNA_INDEXES.SYMMETRY, DNA_INDEXES.HIDDEN_MASS, DNA_INDEXES.STIFFNESS, DNA_INDEXES.FUSION,
              DNA_INDEXES.FUSION_MOMENTUM, DNA_INDEXES.FUSION_TIME, DNA_INDEXES.BASE_RADIUS,
              DNA_INDEXES.ELASTICITY, DNA_INDEXES.BOND_ANGLE],
  },
  {
    name: 'Electromagnetism & Chemistry',
    indexes: [DNA_INDEXES.POLARITY, DNA_INDEXES.ALPHA, DNA_INDEXES.CONDUCTIVITY, DNA_INDEXES.MAGNETIC_MOMENT,
              DNA_INDEXES.REACTION_THRESHOLD, DNA_INDEXES.CATALYSIS, DNA_INDEXES.HEAT_OUTPUT],
  },
  {
    name: 'Biology & Life',
    indexes: [DNA_INDEXES.BIRTH_RATE, DNA_INDEXES.DEATH_RATE, DNA_INDEXES.MUTATION,
              DNA_INDEXES.ENERGY_EFFICIENCY, DNA_INDEXES.SEX_CHANCE, DNA_INDEXES.PREDATION_BIAS,
              DNA_INDEXES.SPECIES_AFFINITY],
  },
  {
    name: 'Communication & Memory',
    indexes: [DNA_INDEXES.SIGNAL_RESP, DNA_INDEXES.PULSE_RATE, DNA_INDEXES.NEIGHBORHOOD_RADIUS,
              DNA_INDEXES.SIGNAL_STRENGTH, DNA_INDEXES.SIGNAL_DECAY, DNA_INDEXES.PROPAGATION_SPEED,
              DNA_INDEXES.TUNING_CH1, DNA_INDEXES.TUNING_CH2, DNA_INDEXES.TUNING_CH3, DNA_INDEXES.TUNING_CH4,
              DNA_INDEXES.MEMORY_DECAY],
  },
];

// ── Default Species Presets ──────────────────────────────────────
export const DEFAULT_SPECIES = {
  PREDATOR: {
    name: 'Predator',
    color: { r: 1.0, g: 0.2, b: 0.2 },
    dna: {
      [DNA_INDEXES.FORCE]: 0.4,
      [DNA_INDEXES.VISCOSITY]: 0.3,
      [DNA_INDEXES.PREDATION_BIAS]: 0.8,
      [DNA_INDEXES.SPECIES_AFFINITY]: -0.5,
      [DNA_INDEXES.BIRTH_RATE]: 0.005,
      [DNA_INDEXES.MUTATION]: 0.1,
      [DNA_INDEXES.BASE_RADIUS]: 5.0,
      [DNA_INDEXES.ALPHA]: 0.9,
      [DNA_INDEXES.POLARITY]: -0.3,
      [DNA_INDEXES.NEIGHBORHOOD_RADIUS]: 80.0,
    },
  },
  SOL: {
    name: 'Sol',
    color: { r: 1.0, g: 0.9, b: 0.3 },
    dna: {
      [DNA_INDEXES.FORCE]: 1.0,
      [DNA_INDEXES.VISCOSITY]: 0.99,
      [DNA_INDEXES.FUSION]: 0.8,
      [DNA_INDEXES.HEAT_OUTPUT]: 0.6,
      [DNA_INDEXES.BASE_RADIUS]: 8.0,
      [DNA_INDEXES.ALPHA]: 0.9,
      [DNA_INDEXES.POLARITY]: 0.5,
    },
  },
  LIFE: {
    name: 'Life',
    color: { r: 0.2, g: 1.0, b: 0.3 },
    dna: {
      [DNA_INDEXES.BIRTH_RATE]: 0.05,
      [DNA_INDEXES.ENERGY_EFFICIENCY]: 0.7,
      [DNA_INDEXES.MUTATION]: 0.15,
      [DNA_INDEXES.SEX_CHANCE]: 0.3,
      [DNA_INDEXES.BASE_RADIUS]: 3.0,
      [DNA_INDEXES.ALPHA]: 0.8,
      [DNA_INDEXES.SIGNAL_RESP]: 0.6,
    },
  },
  AETHER: {
    name: 'Aether',
    color: { r: 0.2, g: 0.8, b: 1.0 },
    dna: {
      [DNA_INDEXES.FORCE]: 0.4,
      [DNA_INDEXES.VISCOSITY]: 0.3,
      [DNA_INDEXES.SIGNAL_RESP]: 0.9,
      [DNA_INDEXES.SIGNAL_STRENGTH]: 0.7,
      [DNA_INDEXES.PROPAGATION_SPEED]: 0.6,
      [DNA_INDEXES.SPECIES_AFFINITY]: 0.5,
      [DNA_INDEXES.NEIGHBORHOOD_RADIUS]: 120.0,
      [DNA_INDEXES.BASE_RADIUS]: 3.0,
      [DNA_INDEXES.ALPHA]: 0.6,
    },
  },
  VOID: {
    name: 'Void',
    color: { r: 0.5, g: 0.2, b: 0.8 },
    dna: {
      [DNA_INDEXES.FORCE]: 0.05,
      [DNA_INDEXES.VISCOSITY]: 0.995,
      [DNA_INDEXES.ALPHA]: 0.15,
      [DNA_INDEXES.HIDDEN_MASS]: 3.0,
      [DNA_INDEXES.BASE_RADIUS]: 2.0,
      [DNA_INDEXES.STIFFNESS]: 0.9,
      [DNA_INDEXES.HEAT_OUTPUT]: -0.3,
    },
  },
};


// ── Law Display Names & Tooltips ─────────────────────────────────
export const LAW_DISPLAY_NAMES = {
  [LAW_INDEXES.GRAV]: 'Gravity',
  [LAW_INDEXES.DRAG]: 'Drag',
  [LAW_INDEXES.ENTR]: 'Entropy',
  [LAW_INDEXES.WRAP]: 'World Wrap',
  [LAW_INDEXES.COLL]: 'Collision',
  [LAW_INDEXES.ACCR]: 'Accretion',
  [LAW_INDEXES.PLANET]: 'Planetary',
  [LAW_INDEXES.VOID]: 'Void',
  [LAW_INDEXES.BOND]: 'Bonding',
  [LAW_INDEXES.INERTIA_LAW]: 'Inertia',
  [LAW_INDEXES.FRICTION_LAW]: 'Friction',
  [LAW_INDEXES.TIDAL_LAW]: 'Tidal Force',
  [LAW_INDEXES.TORQUE_LAW]: 'Torque',
  [LAW_INDEXES.VISCOSITY_LAW]: 'Viscosity',
  [LAW_INDEXES.JITTER_LAW]: 'Jitter',
  [LAW_INDEXES.BOIL]: 'Boil',
  [LAW_INDEXES.LIFE]: 'Life Cycle',
  [LAW_INDEXES.GLOW]: 'Glow / Signal',
  [LAW_INDEXES.AFFINITY]: 'Affinity',
  [LAW_INDEXES.REPRODUCTION]: 'Reproduction',
  [LAW_INDEXES.TRACKING]: 'Tracking',
  [LAW_INDEXES.SENESCENCE]: 'Senescence',
  [LAW_INDEXES.GENOTYPE]: 'Genotype',
  [LAW_INDEXES.PHENOTYPE]: 'Phenotype',
  [LAW_INDEXES.ENER]: 'Energy Transfer',
  [LAW_INDEXES.RAD]: 'Radiation',
  [LAW_INDEXES.PREDATION]: 'Predation',
  [LAW_INDEXES.HERBIVORY]: 'Herbivory',
  [LAW_INDEXES.SYMBIOSIS]: 'Symbiosis',
  [LAW_INDEXES.METAMORPH]: 'Metamorphosis',
  [LAW_INDEXES.SPORE]: 'Spore',
  [LAW_INDEXES.EXOP]: 'Exoplanet',
  [LAW_INDEXES.CATA]: 'Catalysis',
  [LAW_INDEXES.SOLV]: 'Solvation',
  [LAW_INDEXES.ACID]: 'Acid',
  [LAW_INDEXES.OXID]: 'Oxidation',
  [LAW_INDEXES.REDU]: 'Reduction',
  [LAW_INDEXES.POLY]: 'Polymerize',
  [LAW_INDEXES.ISOM]: 'Isomerize',
  [LAW_INDEXES.CHIR]: 'Chirality',
  [LAW_INDEXES.CRYS]: 'Crystallize',
  [LAW_INDEXES.ALLO]: 'Allotropy',
  [LAW_INDEXES.ELEC]: 'Electric',
  [LAW_INDEXES.MAGN]: 'Magnetic',
  [LAW_INDEXES.PLAS]: 'Plasma',
  [LAW_INDEXES.GAS]: 'Gas',
  [LAW_INDEXES.LIQ]: 'Liquid',
  [LAW_INDEXES.SOLID]: 'Solid',
  [LAW_INDEXES.HEAT]: 'Heat',
  [LAW_INDEXES.COLD]: 'Cold',
  [LAW_INDEXES.CONV]: 'Convection',
  [LAW_INDEXES.RADI]: 'Radiation',
  [LAW_INDEXES.SUBL]: 'Sublimation',
  [LAW_INDEXES.MELT]: 'Melt',
  [LAW_INDEXES.BOIL_THERMAL]: 'Boil (Thermal)',
  [LAW_INDEXES.COND]: 'Condensation',
  [LAW_INDEXES.DEPO]: 'Deposition',
  [LAW_INDEXES.EXOP_THERMAL]: 'Exoplanet (Thermal)',
  [LAW_INDEXES.TIME]: 'Time Dialation',
  [LAW_INDEXES.DIME]: 'Dimension',
  [LAW_INDEXES.HARMONY]: 'Harmony',
  [LAW_INDEXES.FATE]: 'Fate',
  [LAW_INDEXES.WILL]: 'Free Will',
  [LAW_INDEXES.SOUL]: 'Soul',
  [LAW_INDEXES.MIND]: 'Hive Mind',
  [LAW_INDEXES.TELE]: 'Telepathy',
  [LAW_INDEXES.CLAI]: 'Clairvoyance',
  [LAW_INDEXES.PREO]: 'Precognition',
  [LAW_INDEXES.ASTR]: 'Astral Projection',
  [LAW_INDEXES.CHRONOS]: 'Chronos',
};

export const LAW_TOOLTIPS = {
  [LAW_INDEXES.GRAV]: 'Particles attract each other proportional to mass. The gravitational constant G scales this force.',
  [LAW_INDEXES.DRAG]: 'Velocity-dependent damping. Higher drag slows particles down over time like air resistance.',
  [LAW_INDEXES.ENTR]: 'Entropy adds random thermal jitter to all particles. Higher entropy = more chaotic motion.',
  [LAW_INDEXES.WRAP]: 'Controls how the world edges behave. Soft: particles drift back. Hard: particles wrap around. Portal: teleport across.',
  [LAW_INDEXES.COLL]: 'Particles collide and bounce off each other. Elasticity and stiffness determine the bounce.',
  [LAW_INDEXES.ACCR]: 'Massive particles can merge on contact, combining mass and growing larger.',
  [LAW_INDEXES.PLANET]: 'Large masses attract smaller ones into orbit, creating planetary systems.',
  [LAW_INDEXES.VOID]: 'Empty space exerts a repulsive force, pushing particles away from void regions.',
  [LAW_INDEXES.BOND]: 'Particles can form chemical bonds, creating molecular chains and structures.',
  [LAW_INDEXES.INERTIA_LAW]: 'Resistance to acceleration. Higher inertia = harder to move, but also harder to stop.',
  [LAW_INDEXES.FRICTION_LAW]: 'Surface friction between nearby particles. Slows relative motion.',
  [LAW_INDEXES.TIDAL_LAW]: 'Differential gravitational forces that stretch and deform particle clusters.',
  [LAW_INDEXES.TORQUE_LAW]: 'Rotational momentum transfer between particles during interactions.',
  [LAW_INDEXES.VISCOSITY_LAW]: 'Internal fluid friction within particle clusters, resisting flow.',
  [LAW_INDEXES.JITTER_LAW]: 'Brownian motion — random thermal vibration scaled by temperature.',
  [LAW_INDEXES.BOIL]: 'High-energy particles can vaporize, converting mass to energy.',
  [LAW_INDEXES.LIFE]: 'Particles have a life cycle: birth, aging, death. Controls energy consumption over time.',
  [LAW_INDEXES.GLOW]: 'Particles emit visual signals. Signal strength, propagation speed, and decay are DNA-controlled.',
  [LAW_INDEXES.AFFINITY]: 'Species-specific social attraction. Positive affinity = swarming, negative = avoidance.',
  [LAW_INDEXES.REPRODUCTION]: 'Reproduction strategy. Clone: copy self. Sexual: two parents. Mitosis: split. Hybrid: mix species.',
  [LAW_INDEXES.TRACKING]: 'Predators track prey movement with memory. Prey can learn escape routes.',
  [LAW_INDEXES.SENESCENCE]: 'Aging accelerates over time. Old particles move slower, weaken, and eventually die.',
  [LAW_INDEXES.GENOTYPE]: 'DNA mutations are heritable. Offspring inherit mutated DNA from parents, enabling evolution.',
  [LAW_INDEXES.PHENOTYPE]: 'DNA parameters express as visible traits: color, size, alpha. Phenotype reflects genotype.',
  [LAW_INDEXES.ENER]: 'Particles can transfer energy to neighbors via conductivity. Energy flows from hot to cold.',
  [LAW_INDEXES.RAD]: 'Radioactive decay. Particles randomly lose mass and emit energy, potentially damaging neighbors.',
  [LAW_INDEXES.PREDATION]: 'Predator species hunt and consume prey. Predation bias determines hunting vs fleeing behavior.',
  [LAW_INDEXES.HERBIVORY]: 'Herbivore species consume energy from the environment rather than other particles.',
  [LAW_INDEXES.SYMBIOSIS]: 'Different species can form mutually beneficial partnerships, sharing energy and protection.',
  [LAW_INDEXES.METAMORPH]: 'Particles can transform between species/forms under specific conditions.',
  [LAW_INDEXES.SPORE]: 'Particles can release spores that grow into new particles, enabling long-range reproduction.',
  [LAW_INDEXES.EXOP]: 'Exoplanetary influences — external gravitational bodies affect the entire simulation.',
  [LAW_INDEXES.CATA]: 'Reactions occur faster in the presence of catalysts. Speeds up chemical processes.',
  [LAW_INDEXES.SOLV]: 'Particles can dissolve other particles with compatible polarity. Solvation rate depends on temperature.',
  [LAW_INDEXES.ACID]: 'Acidic particles corrode and damage other particle types on contact.',
  [LAW_INDEXES.OXID]: 'Oxidation reaction. Oxygen-like particles donate energy, altering the target\x27s properties.',
  [LAW_INDEXES.REDU]: 'Reduction reaction. Particles gain electrons (energy) from reducing agents.',
  [LAW_INDEXES.POLY]: 'Monomers link into polymer chains. Requires compatible bond angles and sufficient energy.',
  [LAW_INDEXES.ISOM]: 'Particle clusters can rearrange into different structural configurations.',
  [LAW_INDEXES.CHIR]: 'Handedness affects interaction compatibility. Left-handed and right-handed particles interact differently.',
  [LAW_INDEXES.CRYS]: 'Ordered particle lattices form crystal structures. Increases stability but reduces flexibility.',
  [LAW_INDEXES.ALLO]: 'Same elements can form different structural arrangements with distinct properties.',
  [LAW_INDEXES.ELEC]: 'Electrical charge interactions. Opposite polarities attract, same polarities repel.',
  [LAW_INDEXES.MAGN]: 'Magnetic moment alignment. Particles with aligned magnetic moments attract.',
  [LAW_INDEXES.PLAS]: 'High-energy plasma state. Particles lose electrons and become highly reactive.',
  [LAW_INDEXES.GAS]: 'Gas phase behavior. Low density, high velocity, random scattering.',
  [LAW_INDEXES.LIQ]: 'Liquid phase behavior. Medium density, surface tension, flow dynamics.',
  [LAW_INDEXES.SOLID]: 'Solid phase behavior. High density, rigid structure, vibration only.',
  [LAW_INDEXES.HEAT]: 'Thermal energy generation. Particle collisions and reactions produce heat.',
  [LAW_INDEXES.COLD]: 'Cold absorption. Particles can absorb thermal energy from surroundings, cooling the environment.',
  [LAW_INDEXES.CONV]: 'Convection currents. Hot particles rise, cool particles sink, creating fluid circulation.',
  [LAW_INDEXES.RADI]: 'Thermal radiation. Hot particles emit energy as radiation, cooling down over distance.',
  [LAW_INDEXES.SUBL]: 'Solid directly to gas phase transition. Bypasses liquid state.',
  [LAW_INDEXES.MELT]: 'Solid to liquid phase transition at temperature threshold.',
  [LAW_INDEXES.BOIL_THERMAL]: 'Liquid to gas phase transition at high temperature.',
  [LAW_INDEXES.COND]: 'Gas to liquid phase transition at low temperature.',
  [LAW_INDEXES.DEPO]: 'Gas directly to solid phase transition. Bypasses liquid state.',
  [LAW_INDEXES.EXOP_THERMAL]: 'External thermal influences affect the simulation\x27s temperature gradient.',
  [LAW_INDEXES.TIME]: 'Local time dilation. High-gravity regions experience slower time relative to low-gravity regions.',
  [LAW_INDEXES.DIME]: 'Higher-dimensional interactions. Particles can briefly occupy extra spatial dimensions.',
  [LAW_INDEXES.HARMONY]: 'Universal resonance. Attuned particles synchronize their oscillations, creating emergent order.',
  [LAW_INDEXES.FATE]: 'Destiny-based interactions. Certain particle encounters are statistically more likely.',
  [LAW_INDEXES.WILL]: 'Particles can exert autonomous force, acting against deterministic physics.',
  [LAW_INDEXES.SOUL]: 'Particles retain a "soul" after death — a faint ghost that can influence living particles.',
  [LAW_INDEXES.MIND]: 'Collective consciousness. Particles share information across the entire species instantly.',
  [LAW_INDEXES.TELE]: 'Information transfer at a distance without physical signal propagation.',
  [LAW_INDEXES.CLAI]: 'Particles can sense distant events beyond their normal neighborhood radius.',
  [LAW_INDEXES.PREO]: 'Particles can anticipate future positions of nearby particles and react preemptively.',
  [LAW_INDEXES.ASTR]: 'Out-of-body experience. Souls can project across the world, observing remote regions.',
  [LAW_INDEXES.CHRONOS]: 'Temporal manipulation. Select particles can briefly reverse their own timeline.',
}