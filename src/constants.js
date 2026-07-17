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
