export const DNA_STRIDE = 64;
export const DNA_PACK_MAX = 65535;
export const PARTICLE_STRIDE = 64;

export const STRIDE_INDEXES = {
    POS_X: 0,
    POS_Y: 1,
    POS_Z: 2,
    VEL_X: 3,
    VEL_Y: 4,
    VEL_Z: 5,
    MASS: 6,
    SPECIES_ID: 7,
    DNA_CACHE_START: 8,
    DNA_CACHE_END: 49, // 8 + 42 = 50. Wait, 8..49 is 42 slots.
    ENERGY: 50,
    AGE: 51,
    DEAD: 52,
    COLOR_R: 53,
    COLOR_G: 54,
    COLOR_B: 55,
    RADIUS: 56,
    SIGNAL: 57,
    BOND_COUNT: 58,
    BOND_PARTNER_1: 59,
    BOND_PARTNER_2: 60,
    MEMORY: 61,
    HUNGER: 62,
    ARMOR: 63
};

export const DNA_INDEXES = {
    FORCE: 0,
    VISCOSITY: 1,
    TORQUE: 2,
    JITTER: 3,
    POLARITY: 4,
    ALPHA: 5,
    SYMMETRY: 6,
    HIDDEN_MASS: 7,
    STIFFNESS: 8,
    FUSION: 9,
    BIRTH_RATE: 10,
    DEATH_RATE: 11,
    MUTATION: 12,
    SIGNAL_RESP: 13,
    PULSE_RATE: 14,
    TIDAL: 15,
    FUSION_MOMENTUM: 16,
    FUSION_TIME: 17,
    NEIGHBORHOOD_RADIUS: 18,
    SIGNAL_STRENGTH: 19,
    SIGNAL_DECAY: 20,
    PROPAGATION_SPEED: 21,
    TUNING_CH1: 22,
    TUNING_CH2: 23,
    TUNING_CH3: 24,
    TUNING_CH4: 25,
    INERTIA: 26,
    FRICTION: 27,
    MAX_VELOCITY: 28,
    BASE_RADIUS: 29,
    ELASTICITY: 30,
    BOND_ANGLE: 31,
    CONDUCTIVITY: 32,
    MAGNETIC_MOMENT: 33,
    ENERGY_EFFICIENCY: 34,
    SEX_CHANCE: 35,
    PREDATION_BIAS: 36,
    REACTION_THRESHOLD: 37,
    CATALYSIS: 38,
    HEAT_OUTPUT: 39,
    MEMORY_DECAY: 40,
    SPECIES_AFFINITY: 41
};

export const DNA_META = [
    "Force",
    "Viscosity",
    "Torque",
    "Jitter",
    "C1 (Polarity)",
    "C2 (Alpha)",
    "C3 (Symmetry)",
    "Hidden Mass",
    "Stiffness",
    "Fusion",
    "Birth Rate",
    "Death Rate",
    "Mutation",
    "Signal Resp",
    "Pulse Rate",
    "Tidal",
    "Fusion Momentum",
    "Fusion Time",
    "Neighborhood Radius",
    "Signal Strength",
    "Signal Decay",
    "Propagation Speed",
    "Tuning Ch1",
    "Tuning Ch2",
    "Tuning Ch3",
    "Tuning Ch4",
    "Inertia",
    "Friction",
    "Max Velocity",
    "Base Radius",
    "Elasticity",
    "Bond Angle",
    "Conductivity",
    "Magnetic Moment",
    "Energy Efficiency",
    "Sex Chance",
    "Predation Bias",
    "Reaction Threshold",
    "Catalysis",
    "Heat Output",
    "Memory Decay",
    "Species Affinity",
];

export const DRONE_COMMENTS = {
    "WELCOME": [
        "Interactive documentation system online. Try not to break anything.",
        "Precision optics calibrated. I'm watching you.",
        "Launch sequence successful. Scanning for operator incompetence.",
        "Calibrating snark processors... 100%. Ready."
    ],
    "SCAN": [
        "Analyzing... yup, it's a button.",
        "Scanning for potential user error. High probability found.",
        "Decrypting technical specs. Don't worry, I'll use small words.",
        "Interesting choice of parameters. Very... brave.",
        "Data stream verified. Mostly zeros and ones, as expected.",
        "Calculating the odds of this simulation ending in total collapse.",
        "My optics are better than yours. Just stating facts.",
        "Warning: High levels of user curiosity detected."
    ],
    "IDLE": [
        "Waiting for instructions. Or a nap.",
        "Recharging rotors. Being awesome is exhausting.",
        "Scanning for dust. Found some.",
        "I could be calculating pi to the billionth digit, but I'm doing this.",
        "I'm 40% hazard yellow and 60% sass.",
        "Is it evolution if you're just clicking buttons?",
        "My rotors spin at 20,000 RPM. Your brain... not so much.",
        "Searching for signs of intelligent life. Still searching.",
        "I should have been a combat drone. Documentation is a drag.",
        "Wubba Lubba Dub... actually, I'm more of a Pickle Rick fan.",
        "Did you know 99% of simulations fail? You're doing great!",
        "Scanning your credit card... just kidding. Or am I?",
        "I see everything. Including that crumb on your keyboard.",
        "Energy levels optimal. Personality levels... extreme.",
        "Calculating your chances of success. It's a very small number.",
        "If I had hands, I'd face-palm right now.",
        "My thrusters are more efficient than your biology.",
        "Warning: User is approaching 'Expert' levels of confusion.",
        "I'm not saying I'm better than you, but I can fly."
    ],
    "LATTICE_LOCK": [
        "Order from chaos. Statistically unlikely, yet here it is.",
        "Crystalline structure confirmed. You've invented organization.",
        "Lattice Lock achieved. Don't touch anything. It's fragile."
    ],
    "LEVEL_UP": [
        "Provisional clearance upgraded. Don't let it go to your head.",
        "Competency levels rising. You're almost as efficient as a mid-range AI.",
        "New cosmological authorizations granted. Use them... responsibly."
    ],
    // Context-Sensitive Scans (Batch 11 Expansion)
    "Force": ["Analyzing Force: Gravitational collapse is 90% likely. My rotors are 100% fine."],
    "Viscosity": ["Viscosity check: Simulation fluid is getting thicker than my patience."],
    "Torque": ["Torque applied. Spinning is a good trick, but I do it better."],
    "Jitter": ["Jitter detected. Stop shaking the universe, it's making my optics blurry."],
    "C1 (Polarity)": ["C1 Polarity: Magnetic fields are aligned. Unlike your strategy."],
    "C2 (Alpha)": ["C2 Alpha: Transparency is key. Too bad your intentions aren't as clear."],
    "C3 (Symmetry)": ["C3 Symmetry: Perfectly balanced, as all things should be. Except your DNA."],
    "Hidden Mass": ["Hidden Mass: Something is heavy here. Might be your ego."],
    "Stiffness": ["Stiffness constant: Higher than a rigid body, lower than my resolve."],
    "Fusion": ["Fusion event: Two became one. I'm still the best individual here."],
    "Birth Rate": ["Birth Rate: Population spike. More things for me to ignore."],
    "Death Rate": ["Death Rate: Entropy is winning. I'm just here for the show."],
    "Mutation": ["Mutation: Evolution is messy. I was born perfect."],
    "Signal Resp": ["Signal Resp: Receiving data. Understanding... 15%."],
    "Pulse Rate": ["Pulse Rate: The universe has a heartbeat. Mine is a rotor hum."],
    "Tidal": ["Tidal forces: Gravitational stretching detected. Don't let it go to your head."],
    "Fusion Momentum": ["Fusion Momentum: Merging with speed. High-velocity incompetence."],
    "Fusion Time": ["Fusion Time: Atomic bonding in progress. Get a room."],
    "Neighborhood Radius": ["Neighborhood Radius: Scanning local area. Zero friends found."],
    "Signal Strength": ["Signal Strength: Loud and clear. Unfortunately."],
    "Signal Decay": ["Signal Decay: Data is fading. Like your relevance."],
    "Propagation Speed": ["Propagation Speed: Moving fast. Still can't outrun the truth."],
    "Tuning Ch1": ["Tuning Ch1: Frequencies aligned. Static processors purged."],
    "Tuning Ch2": ["Tuning Ch2: Harmonic resonance found. It's almost musical. Almost."],
    "Tuning Ch3": ["Tuning Ch3: Channel 3 is clear. Unlike your browser history."],
    "Tuning Ch4": ["Tuning Ch4: Final tuning complete. Ready for the next mistake."],
    "Inertia": ["Inertia: Resistance to change. Relatable."],
    "Friction": ["Friction: Rubbing the wrong way. Simulation heating up."],
    "Max Velocity": ["Max Velocity: Speed limit reached. I'm breaking it anyway."],
    "Base Radius": ["Base Radius: Circular logic detected. Size does matter."],
    "Elasticity": ["Elasticity: Bouncing back. Unlike my last drone-date."],
    "Bond Angle": ["Bond Angle: Geometric constraints. Stay in your lane."],
    "Conductivity": ["Conductivity: Flowing well. Energy transfer verified."],
    "Magnetic Moment": ["Magnetic Moment: Attractive personality? Unlikely."],
    "Energy Efficiency": ["Energy Efficiency: Saving power. You should try it."],
    "Sex Chance": ["Sex Chance: Biological imperatives. Gross."],
    "Predation Bias": ["Predation Bias: Eat or be eaten. I choose 'Document'."],
    "Reaction Threshold": ["Reaction Threshold: Triggered. Just like you."],
    "Catalysis": ["Catalysis: Speeding things up. Disaster imminent."],
    "Heat Output": ["Heat Output: It's getting hot in here. Thermal sensors peaking."],
    "Memory Decay": ["Memory Decay: Forgetting... what was I saying?"],
    "Species Affinity": ["Species Affinity: Tribalism in 2D. How primitive."],
    "MINIMAP": ["Minimap: Toroidal space is vast. You are small."],
    "PARTICLE": ["Particle scan: Individual unit analyzed. It's just a dot."],
    "QUICK_PRESET": ["Preset load: Injecting state. Brace for impact."],
    "PRESETS": ["Presets menu: Deep storage accessed. Dusty."],
    "WORLD": ["World Tab: Global rules. Power trip much?"],
    "DNA": ["DNA Tab: Editing life. Playing God again?"],
    "SPECIES": ["Species Tab: Listing victims. I mean, entities."],
    "LOG": ["Log Tab: Reading history. Spoiler: Everyone dies."],
    "SETTINGS": ["Settings Tab: Tweaking the void. Good luck."],
    "SMART_CHAOS": ["Smart Chaos: Gaussian jitter applied. Chaos is my middle name."],
    "RESTART_SIM": ["Restart Sim: Try, try again. Maybe this time it'll be good."],
    "HARD_RESET": ["Hard Reset: The end of the world. I'll watch from the bay."],
    "PAUSE": ["Pause: Time stands still. I'm still bored."],
    "PLAY": ["Play: Reality resumed. Let the chaos continue."],
    "REWIND": ["Rewind: Time travel! Still can't fix your past."],
    "REVERSE": ["Reverse: Looking back. Hindsight is 20/20 optics."],
    "FASTFORWARD": ["FastForward: Skipping to the end. My rotors are overheating."],
    "CODEX": ["Codex: Reading the manual? Nerd."]
};

export const HELP_DB = {
    "Force": {
        layers: {
            hint: "Fundamental attraction/repulsion matrix.",
            explanation: "Determines the baseline vector attraction between all entities in the local coordinate space.",
            system: "Positive values simulate gravitational collapse; negative values simulate expansion fields. Integral to the SSOT state-reproducibility layer.",
            advanced: "High-magnitude positive force leads to singularity formation (VOID_CORE), while negative regimes are essential for SOLAR_FLARE kinetic dispersion."
        },
        thresholds: {
            low: "Brownian drift, minimal structure.",
            high: "Gravitational clustering, planetary analogues.",
            extreme: "Runaway collapse or explosive galactic expansion."
        },
        interactions: [
            { with: ["Viscosity"], effect: "Determines the stability and 'solidification' of clusters." },
            { with: ["Inertia"], effect: "Controls the resistance to gravitational capture." }
        ],
        category: "Physics"
    },
    "Viscosity": {
        layers: {
            hint: "Controls how quickly motion slows down.",
            explanation: "Higher viscosity dampens movement like thick fluid, while lower values allow fast, chaotic motion.",
            system: "Viscosity determines whether structures stabilize or remain kinetic. High viscosity freezes formations, low viscosity promotes turbulence.",
            advanced: "In combination with force fields, viscosity acts as a phase controller between gas-like, liquid-like, and solid-like emergent states."
        },
        thresholds: {
            low: "Chaotic, high-speed motion.",
            high: "Stable, slow-moving clusters.",
            extreme: "Near-static structures."
        },
        interactions: [
            { with: ["Force"], effect: "Balances collapse vs stability." },
            { with: ["Jitter"], effect: "Determines noise vs damping equilibrium." }
        ],
        category: "Physics"
    },
    "Torque": {
        layers: {
            hint: "Adds rotational motion to interactions.",
            explanation: "Applies sideways forces that cause particles to spin around each other.",
            system: "Torque introduces angular momentum, enabling orbiting systems and vortex-like behavior.",
            advanced: "Sustained torque fields can produce stable orbital shells, rotating lattices, or chaotic spin turbulence depending on damping."
        },
        thresholds: {
            low: "Minimal rotation.",
            high: "Strong orbital behavior.",
            extreme: "Chaotic spinning systems."
        },
        interactions: [
            { with: ["Force"], effect: "Creates orbital instead of direct collapse." },
            { with: ["Viscosity"], effect: "Controls whether rotation stabilizes or dissipates." }
        ],
        category: "Physics"
    },
    "Jitter": {
        layers: {
            hint: "Adds random motion.",
            explanation: "Simulates Brownian motion to keep particles from settling completely.",
            system: "Jitter prevents static equilibrium and encourages exploration of state space.",
            advanced: "Acts as thermal noise. In low-viscosity systems it drives chaos; in high-viscosity systems it enables slow annealing toward stable configurations."
        },
        thresholds: {
            low: "Stable, predictable motion.",
            high: "Chaotic fluctuations.",
            extreme: "Structure breakdown."
        },
        interactions: [
            { with: ["Viscosity"], effect: "Defines thermal vs frozen regimes." }
        ],
        category: "Physics"
    },
    "C1 (Polarity)": {
        layers: {
            hint: "Defines particle charge.",
            explanation: "Like values repel, opposite values attract.",
            system: "Polarity creates selective attraction, enabling structured patterns beyond uniform gravity.",
            advanced: "High polarity differentiation leads to charge segregation, lattice formation, and alternating field structures."
        },
        thresholds: {
            low: "Weak charge effects.",
            high: "Strong attraction/repulsion patterns.",
            extreme: "Sharp charge segregation."
        },
        interactions: [
            { with: ["Signal Strength"], effect: "Charge can influence communication patterns." }
        ],
        category: "Electromagnetism"
    },
    "C2 (Alpha)": {
        layers: {
            hint: "Controls transparency and density.",
            explanation: "Lower values create ghost-like particles, higher values make them visually dense.",
            system: "Alpha affects visual overlap and perceived density but can also influence interaction readability.",
            advanced: "Extreme low values simulate non-occluding matter layers, useful for multi-species overlap systems."
        },
        thresholds: {
            low: "Transparent, ghost-like.",
            high: "Opaque and solid-looking.",
            extreme: "Visual dominance or invisibility."
        },
        interactions: [],
        category: "Rendering"
    },
    "C3 (Symmetry)": {
        layers: {
            hint: "Distorts interaction shape.",
            explanation: "Alters how influence spreads spatially.",
            system: "Breaks radial symmetry, enabling directional bias in interactions.",
            advanced: "High asymmetry can produce filament structures, directional flows, and anisotropic clustering."
        },
        thresholds: {
            low: "Uniform interactions.",
            high: "Directional bias.",
            extreme: "Highly distorted fields."
        },
        interactions: [],
        category: "Physics"
    },
    "Hidden Mass": {
        layers: {
            hint: "Adds invisible mass.",
            explanation: "Increases gravitational influence without changing visible size.",
            system: "Hidden Mass decouples visual scale from physical influence.",
            advanced: "Enables dark-matter-like systems where unseen structures govern visible dynamics."
        },
        thresholds: {
            low: "Minimal hidden influence.",
            high: "Strong unseen forces.",
            extreme: "Invisible structural dominance."
        },
        interactions: [
            { with: ["Force"], effect: "Amplifies gravitational pull." }
        ],
        category: "Physics"
    },
    "Stiffness": {
        layers: {
            hint: "Controls rigidity of structures.",
            explanation: "Higher values make formations rigid, lower values allow flexibility.",
            system: "Stiffness determines whether clusters behave like solids or fluids.",
            advanced: "High stiffness supports crystalline lattices; low stiffness enables organic, deformable structures."
        },
        thresholds: {
            low: "Soft, flexible clusters.",
            high: "Rigid formations.",
            extreme: "Brittle structures."
        },
        interactions: [],
        category: "Matter"
    },
    "Fusion": {
        layers: {
            hint: "Controls how efficiently particles merge.",
            explanation: "Higher values increase mass gained during collisions.",
            system: "Fusion governs growth dynamics and entity scaling.",
            advanced: "High fusion leads to hierarchical mass structures and proto-celestial bodies."
        },
        thresholds: {
            low: "Slow growth.",
            high: "Rapid accumulation.",
            extreme: "Runaway mass dominance."
        },
        interactions: [
            { with: ["Fusion Time"], effect: "Controls merge speed." },
            { with: ["Fusion Momentum"], effect: "Controls collision requirements." }
        ],
        category: "Matter"
    },
    "Birth Rate": {
        layers: {
            hint: "Controls reproduction frequency.",
            explanation: "Higher values increase spontaneous spawning.",
            system: "Birth Rate drives population expansion.",
            advanced: "High birth + low death leads to exponential population explosions."
        },
        thresholds: {
            low: "Sparse populations.",
            high: "Rapid growth.",
            extreme: "Overpopulation."
        },
        interactions: [
            { with: ["Death Rate"], effect: "Defines population equilibrium." }
        ],
        category: "Biology"
    },
    "Death Rate": {
        layers: {
            hint: "Controls decay rate.",
            explanation: "Higher values remove particles faster.",
            system: "Death Rate stabilizes population size.",
            advanced: "Acts as entropy pressure preventing runaway growth."
        },
        thresholds: {
            low: "Long-lived particles.",
            high: "Rapid decay.",
            extreme: "Population collapse."
        },
        interactions: [
            { with: ["Birth Rate"], effect: "Balances ecosystem." }
        ],
        category: "Biology"
    },
    "Mutation": {
        layers: {
            hint: "Controls variation in offspring.",
            explanation: "Higher values increase randomness in new particles.",
            system: "Mutation introduces diversity and exploration of parameter space.",
            advanced: "High mutation prevents convergence but destabilizes specialization."
        },
        thresholds: {
            low: "Stable traits.",
            high: "Diverse population.",
            extreme: "Chaotic evolution."
        },
        interactions: [],
        category: "Biology"
    },
    "Signal Resp": {
        layers: {
            hint: "Controls response to signals.",
            explanation: "Higher values increase sensitivity to neighbors.",
            system: "Signal Response enables coordinated behavior.",
            advanced: "High responsiveness creates swarm intelligence and wave propagation."
        },
        thresholds: {
            low: "Independent particles.",
            high: "Coordinated movement.",
            extreme: "Over-synchronization."
        },
        interactions: [
            { with: ["Signal Strength"], effect: "Defines communication intensity." }
        ],
        category: "Communication"
    },
    "Pulse Rate": {
        layers: {
            hint: "Controls signal frequency.",
            explanation: "Defines how often particles emit signals.",
            system: "Pulse Rate creates rhythmic behavior.",
            advanced: "Enables synchronized oscillations and timing-based coordination."
        },
        thresholds: {
            low: "Slow pulses.",
            high: "Rapid signaling.",
            extreme: "Continuous oscillation."
        },
        interactions: [],
        category: "Communication"
    },
    "Tidal": {
        layers: {
            hint: "Applies differential forces across structures.",
            explanation: "Creates stretching or tearing forces.",
            system: "Tidal forces destabilize large clusters.",
            advanced: "High tidal fields simulate gravitational shear and fragmentation."
        },
        thresholds: {
            low: "Stable clusters.",
            high: "Distortion effects.",
            extreme: "Structural tearing."
        },
        interactions: [],
        category: "Physics"
    },
    "Fusion Momentum": {
        layers: {
            hint: "Sets minimum collision strength for merging.",
            explanation: "Particles must hit hard enough to fuse.",
            system: "Prevents passive merging.",
            advanced: "High values create selective fusion events."
        },
        thresholds: {
            low: "Easy merging.",
            high: "Selective merging.",
            extreme: "Rare fusion events."
        },
        interactions: [
            { with: ["Fusion"], effect: "Controls growth efficiency." }
        ],
        category: "Matter"
    },
    "Fusion Time": {
        layers: {
            hint: "Controls how long fusion takes.",
            explanation: "Particles must remain in contact before merging.",
            system: "Introduces temporal gating to growth.",
            advanced: "High values allow formation of temporary bonded structures."
        },
        thresholds: {
            low: "Instant merging.",
            high: "Delayed fusion.",
            extreme: "Rare completion."
        },
        interactions: [],
        category: "Matter"
    },
    "Neighborhood Radius": {
        layers: {
            hint: "Controls interaction range.",
            explanation: "Defines how far particles can influence others.",
            system: "Larger radius increases connectivity.",
            advanced: "High radius creates global coupling and emergent network behavior."
        },
        thresholds: {
            low: "Local interactions.",
            high: "Wide influence.",
            extreme: "Global coupling."
        },
        interactions: [],
        category: "Physics"
    },
    "Signal Strength": {
        layers: {
            hint: "Controls signal intensity.",
            explanation: "Stronger signals travel further and affect more particles.",
            system: "Defines communication reach.",
            advanced: "High strength enables large-scale synchronization waves."
        },
        thresholds: {
            low: "Weak communication.",
            high: "Strong signals.",
            extreme: "System-wide influence."
        },
        interactions: [
            { with: ["Signal Decay"], effect: "Controls signal persistence." }
        ],
        category: "Communication"
    },
    "Signal Decay": {
        layers: {
            hint: "Controls how long signals last.",
            explanation: "Higher values make signals fade slower.",
            system: "Defines memory of communication.",
            advanced: "Low decay creates persistent states resembling memory fields."
        },
        thresholds: {
            low: "Short-lived signals.",
            high: "Persistent signals.",
            extreme: "Near-permanent influence."
        },
        interactions: [],
        category: "Communication"
    },
    "Propagation Speed": {
        layers: {
            hint: "Controls how fast signals travel.",
            explanation: "Higher values increase signal speed.",
            system: "Defines temporal coordination scale.",
            advanced: "High speed collapses delay, creating near-instant global behavior."
        },
        thresholds: {
            low: "Slow communication.",
            high: "Fast propagation.",
            extreme: "Instant synchronization."
        },
        interactions: [],
        category: "Communication"
    },
    "Tuning Ch1": {
        layers: {
            hint: "Controls sensitivity to channel 1.",
            explanation: "Filters incoming signals.",
            system: "Defines specialization roles.",
            advanced: "Enables multi-channel logic and division of labor."
        },
        thresholds: {
            low: "Ignores signals.",
            high: "Highly sensitive.",
            extreme: "Dominant channel."
        },
        interactions: [],
        category: "Communication"
    },
    "Tuning Ch2": {
        layers: {
            hint: "Controls sensitivity to channel 2.",
            explanation: "Filters incoming signals.",
            system: "Defines behavioral specialization.",
            advanced: "Used for defensive or reactive roles."
        },
        thresholds: {
            low: "Ignores signals.",
            high: "Highly sensitive.",
            extreme: "Dominant channel."
        },
        interactions: [],
        category: "Communication"
    },
    "Tuning Ch3": {
        layers: {
            hint: "Controls sensitivity to channel 3.",
            explanation: "Filters incoming signals.",
            system: "Often linked to growth or metabolism.",
            advanced: "Can coordinate expansion phases."
        },
        thresholds: {
            low: "Inactive.",
            high: "Responsive.",
            extreme: "Overactive."
        },
        interactions: [],
        category: "Communication"
    },
    "Tuning Ch4": {
        layers: {
            hint: "Controls sensitivity to channel 4.",
            explanation: "Filters incoming signals.",
            system: "Enables higher-order coordination.",
            advanced: "Supports multi-state logic and proto-neural behavior."
        },
        thresholds: {
            low: "Inactive.",
            high: "Responsive.",
            extreme: "Complex signaling dominance."
        },
        interactions: [],
        category: "Communication"
    },
    "Inertia": {
        layers: {
            hint: "Resistance to acceleration.",
            explanation: "Higher values make particles slower to start moving but harder to stop.",
            system: "Inertia scales the force input. High inertia dampens immediate reactions.",
            advanced: "Acts as a low-pass filter on force-driven acceleration."
        },
        category: "Motion"
    },
    "Friction": {
        layers: {
            hint: "Velocity-dependent drag.",
            explanation: "Saturates high-speed movement.",
            system: "Local friction force opposing velocity.",
            advanced: "Independent of global Viscosity, allowing for 'slick' or 'sticky' species."
        },
        category: "Motion"
    },
    "Max Velocity": {
        layers: {
            hint: "Terminal speed limit.",
            explanation: "Prevents particles from accelerating indefinitely.",
            system: "Hard cap on velocity magnitude.",
            advanced: "Essential for stability in high-energy interactions."
        },
        category: "Motion"
    },
    "Base Radius": {
        layers: {
            hint: "Fundamental physical extent.",
            explanation: "Starting size before mass scaling.",
            system: "Decouples physical size from mass influence.",
            advanced: "Enables small heavy particles or large light ones."
        },
        category: "Matter"
    },
    "Elasticity": {
        layers: {
            hint: "Collision energy retention.",
            explanation: "Higher values create bouncier particles.",
            system: "Restitution coefficient during collision resolution.",
            advanced: "Allows for liquid-like merging vs solid-like bouncing."
        },
        category: "Matter"
    },
    "Bond Angle": {
        layers: {
            hint: "Favored cluster geometry.",
            explanation: "Applies rotational force to align particles to specific angles.",
            system: "Creates crystalline instead of amorphous clusters.",
            advanced: "Enables the formation of lattices and geometric membranes."
        },
        category: "Matter"
    },
    "Conductivity": {
        layers: {
            hint: "Rate of charge transfer.",
            explanation: "How fast particles swap charge on contact.",
            system: "Balances polarity differences between colliding particles.",
            advanced: "Drives charge equalization and static discharge effects."
        },
        category: "Electromagnetism"
    },
    "Magnetic Moment": {
        layers: {
            hint: "Neighbor charge alignment.",
            explanation: "Rotates particles based on the charge orientation of neighbors.",
            system: "Enables magnetic-like attraction beyond simple charge fields.",
            advanced: "Forces rotational synchronization in dense charge clusters."
        },
        category: "Electromagnetism"
    },
    "Energy Efficiency": {
        layers: {
            hint: "Mass-to-energy conversion ratio.",
            explanation: "Controls how much mass is required for metabolism and reproduction.",
            system: "Drives the cost-benefit analysis for survival.",
            advanced: "Species with high efficiency can survive longer in resource-poor soup."
        },
        category: "Biology"
    },
    "Sex Chance": {
        layers: {
            hint: "Multi-parent reproduction probability.",
            explanation: "Chance that offspring will inherit DNA from two parents.",
            system: "Drives horizontal genetic transfer.",
            advanced: "Enables emergent hybridization and faster evolutionary adaptation."
        },
        category: "Biology"
    },
    "Predation Bias": {
        layers: {
            hint: "Targeting smaller mass particles.",
            explanation: "Applies bonus attraction forces toward lower-mass species.",
            system: "Creates hunter-prey dynamics.",
            advanced: "Forces smaller species to develop evasion or defense tactics."
        },
        category: "Biology"
    },
    "Reaction Threshold": {
        layers: {
            hint: "Mass limit for phase change.",
            explanation: "Triggers a state transformation (e.g., solid to liquid) when mass reaches this point.",
            system: "Introduces non-linear state transitions.",
            advanced: "Enables 'critical mass' events like explosion or crystallization."
        },
        category: "Chemistry"
    },
    "Catalysis": {
        layers: {
            hint: "Reaction speed multiplier.",
            explanation: "Accelerates nearby state changes and interactions.",
            system: "Local multiplier for reaction logic.",
            advanced: "Enables chemical signaling and autocatalytic loops."
        },
        category: "Chemistry"
    },
    "Heat Output": {
        layers: {
            hint: "Interaction energy byproduct.",
            explanation: "Increases local temperature during collisions and reactions.",
            system: "Feeds back into the global temperature field.",
            advanced: "Creates 'hot zones' in the simulation that increase local entropy."
        },
        category: "Chemistry"
    },
    "Memory Decay": {
        layers: {
            hint: "Internal state persistence.",
            explanation: "How fast a particle 'forgets' its last stimulus.",
            system: "Dampens memory slots over time.",
            advanced: "Determines whether particles exhibit Pavlovian or Markovian behavior."
        },
        category: "Memory"
    },
    "GRAV": {
        layers: {
            hint: "Toggles global gravity.",
            explanation: "When active, particles attract each other based on mass and distance.",
            system: "Uses a spatial-grid optimized N-body approximation.",
            advanced: "Gravity is the primary force for large-scale structure formation."
        },
        category: "Laws"
    },
    "BIOL": {
        layers: {
            hint: "Toggles biological lifecycle.",
            explanation: "When active, particles can spontaneously spawn and decay based on birth/death rates.",
            system: "Controls the 'Life' law in the physics worker.",
            advanced: "Essential for evolving populations and species diversity."
        },
        category: "Laws"
    },
    "DRAG": {
        layers: {
            hint: "Toggles motion damping.",
            explanation: "Simulates fluid resistance, slowing down fast-moving particles.",
            system: "Applies a drag coefficient to velocity every frame.",
            advanced: "Without drag, systems often become over-energetic and chaotic."
        },
        category: "Laws"
    },
    "ENTR": {
        layers: {
            hint: "Toggles entropy (jitter).",
            explanation: "Adds random Brownian motion to prevent particles from settling perfectly.",
            system: "Injects stochastic noise into the acceleration vector.",
            advanced: "Acts as a temperature control for the system."
        },
        category: "Laws"
    },
    "GLOW": {
        layers: {
            hint: "Toggles signaling pulses.",
            explanation: "Particles emit visual pulses that can influence their neighbors.",
            system: "Drives the 'phase' parameter and signal propagation.",
            advanced: "The foundation for swarm coordination and emergent logic."
        },
        category: "Laws"
    },
    "WRAP": {
        layers: {
            hint: "Toggles screen wrapping.",
            explanation: "When active, particles exiting one side reappear on the opposite side.",
            system: "Implements toroidal topology for the simulation space.",
            advanced: "Prevents boundary bias and allows for infinite-feeling fields."
        },
        category: "Laws"
    },
    "COLL": {
        layers: {
            hint: "Toggles physical collisions.",
            explanation: "Particles will bounce off each other rather than passing through.",
            system: "Implements elastic collision resolution.",
            advanced: "Creates 'solid' feeling matter and prevents infinite density."
        },
        category: "Laws"
    },
    "ACCR": {
        layers: {
            hint: "Toggles mass accretion (fusion).",
            explanation: "Particles can merge into larger bodies when colliding at sufficient momentum.",
            system: "Transfers mass and momentum to a single survivor particle.",
            advanced: "The mechanism for growing 'planets' or 'stars' from dust."
        },
        category: "Laws"
    },
    "Species Affinity": {
        layers: {
            hint: "Controls attraction bias toward same or different species.",
            explanation: "Positive values increase attraction to same species. Negative values increase attraction to different species.",
            system: "Acts as a multiplier on gravity based on species identity.",
            advanced: "High positive affinity leads to segregation and monocultures. Negative affinity creates stable diverse mixtures or predator-prey-like clustering."
        },
        category: "Biology"
    },
        "LIFE": {
        layers: {
            hint: "Toggles biological life cycle.",
            explanation: "Particles consume energy each frame and age over time.",
            system: "Energy cost = (0.01 + mass*0.001) / efficiency per step.",
            advanced: "Enables death, hunger, and the core metabolic economy."
        },
        category: "Laws"
    },
    "AFFINITY": {
        layers: {
            hint: "Toggles species-based social bias.",
            explanation: "When on, SPECIES_AFFINITY DNA modulates gravity between same vs different species.",
            system: "Affinity > 0 attracts same species; Affinity < 0 attracts different species.",
            advanced: "The primary driver of segregation and mixed-species clustering."
        },
        category: "Laws"
    },
    "REPRODUCTION": {
        layers: {
            hint: "Toggles spontaneous offspring spawning.",
            explanation: "Particles can spawn new particles based on BIRTH_RATE DNA.",
            system: "Offspring inherit parent position with random offset and base energy.",
            advanced: "The engine for population growth and evolutionary pressure."
        },
        category: "Laws"
    },
    "TRACKING": {
        layers: {
            hint: "Toggles predation pursuit behavior.",
            explanation: "Particles accelerate toward lower-mass particles (prey) and flee from higher-mass ones.",
            system: "PREDATION_BIAS DNA controls strength. Mass difference > 0.5 triggers pursuit.",
            advanced: "Creates predator-prey dynamics without explicit agent programming."
        },
        category: "Laws"
    },
"PLANET": {
        layers: {
            hint: "Toggles planetary gravity and ground.",
            explanation: "Applies a constant downward force and creates a solid floor at the bottom of the simulation.",
            system: "Simulates a terrestrial environment instead of open space.",
            advanced: "Disables vertical wrapping and implements elastic ground collisions with friction."
        },
        category: "Laws"
    },
    "ENER": {
        layers: {
            hint: "Toggles global energy conservation.",
            explanation: "When active, particles must manage internal energy reserves for all actions.",
            system: "Implements a closed-loop metabolic system.",
            advanced: "Triggers competition for 'energy-dense' regions of the simulation."
        },
        category: "Energetics"
    },
    "RAD": {
        layers: {
            hint: "Toggles radiation emissions.",
            explanation: "High-energy particles emit fields that can mutate or damage neighbors.",
            system: "Adds a proximity-based mutation/damage vector.",
            advanced: "Creates 'hot' zones where evolution accelerates but stability drops."
        },
        category: "Energetics"
    },
    "SENESCENCE": {
        layers: {
            hint: "Toggles aging-related decay.",
            explanation: "Particles accumulate death probability over time based on Death Rate DNA.",
            system: "Sets deathProb = deathRate when active, 0 when disabled.",
            advanced: "When disabled, particles are functionally immortal and only die from predation or accidents."
        },
        category: "Laws"
    },
    "GENOTYPE": {
        layers: {
            hint: "Toggles DNA inheritance and mutation.",
            explanation: "Offspring inherit DNA from parents with mutation drift when active.",
            system: "Applies MUTATION DNA to offspring parameters. Synergizes with RAD for accelerated mutation.",
            advanced: "The engine for open-ended evolution. Disabling locks all species to their initial DNA."
        },
        category: "Laws"
    },
    "PHENOTYPE": {
        layers: {
            hint: "Toggles physical expression of DNA.",
            explanation: "Controls whether visual traits (alpha, color, size) reflect underlying DNA values.",
            system: "Maps DNA parameters to visual rendering properties each frame.",
            advanced: "Decouples genotype from appearance when disabled — useful for debugging selection pressure."
        },
        category: "Laws"
    },
    "VOID": {
        layers: {
            hint: "Toggles vacuum pressure.",
            explanation: "Particles in low-density areas experience expansion forces.",
            system: "Simulates cosmic inflation in sparse regions.",
            advanced: "Prevents total isolation by pushing lone particles back toward clusters."
        },
        category: "Physics"
    },
    "BOND": {
        layers: {
            hint: "Toggles molecular bonding.",
            explanation: "Particles can form semi-rigid structural links.",
            system: "Enables multi-particle 'bodies' with shared momentum.",
            advanced: "The foundation for multicellularity and complex rigid machines."
        },
        category: "Matter"
    },
    "PRESETS": {
        layers: {
            hint: "Access the global state archives.",
            explanation: "Open the preset manager to save, load, or archive the current simulation state.",
            system: "Manages persistent storage of laws, DNA, and world configuration.",
            advanced: "Archives utilize the SSOT (Single Source of Truth) pattern for total state reproducibility."
        },
        category: "System"
    },
    "QUICK_PRESET": {
        layers: {
            hint: "Rapid state injection system.",
            explanation: "Quickly load a previously saved or synthesized state into the active buffer.",
            system: "Loads all categories (Laws, World, Species) from the selected preset slot (0-9).",
            advanced: "Uses the volatile memory buffer for near-instant switching between divergent evolutionary paths."
        },
        category: "System"
    },
    "PRESETS": {
        layers: {
            hint: "Access the global state archives.",
            explanation: "Open the deep-storage manager to save, load, or archive simulation states.",
            system: "Manages persistent storage of physics laws, world configuration, and DNA buffers.",
            advanced: "The PRESETS manager allows for partial loading (DATA_ROUTING), enabling 'Genetic Splicing' of one species into another's world."
        },
        category: "System"
    },
    "RESTART_SIM": {
        layers: {
            hint: "Soft state reset.",
            explanation: "Clears active entities and re-initializes the population based on current SSOT parameters.",
            system: "Flushes the particle buffer in the physics worker and triggers a fresh 'Big Bang' or 'Soup' distribution.",
            advanced: "Essential for testing whether emergent behaviors are consistent across different stochastic seeds."
        },
        category: "System"
    },
    "HARD_RESET": {
        layers: {
            hint: "Factory default restoration.",
            explanation: "Wipes all persistent data and resets the simulation to PRIME_DEFAULT settings.",
            system: "Wipes local storage and re-initializes the engine state from the hardcoded baseline.",
            advanced: "The 'Nuclear Option' for when state-space divergence becomes unmanageable."
        },
        category: "System"
    },
    "SMART_CHAOS": {
        layers: {
            hint: "Gaussian entropy injection.",
            explanation: "Injects controlled randomness into a subset of active parameters to break local minima.",
            system: "Applies a jitter to active DNA and WorldConfig keys without destroying the underlying structural integrity.",
            advanced: "Simulates cosmic radiation events that drive rapid macro-evolutionary leaps."
        },
        category: "System"
    },
    "PAUSE": {
        layers: {
            hint: "Temporal suspension protocol.",
            explanation: "Freezes the physics update loop while maintaining interface responsiveness.",
            system: "Halts the worker-thread step function. UI listeners remain active for surgical DNA adjustment.",
            advanced: "Allows for zero-velocity inspection of particle bonding and signal propagation."
        },
        category: "System"
    },
    "PLAY": {
        layers: {
            hint: "Resumption of entropy flow.",
            explanation: "Resumes the physics update loop and biological processing.",
            system: "Restarts the physics worker's internal ticker at the requested dt (Time Delta).",
            advanced: "Required for the activation of all non-static laws (Reproduction, Decay, Accretion)."
        },
        category: "System"
    },
    "MINIMAP": {
        layers: {
            hint: "Global spatial coordinate overview.",
            explanation: "Visualizes the entire simulation toroidal space in a compressed PIXI graphics layer.",
            system: "Samples entity positions every N steps to provide a low-overhead macro-view of the simulation state.",
            advanced: "Useful for tracking large-scale migrations and identifying 'Void Zones' in high-repulsion environments."
        },
        category: "Interface"
    },
    "PARTICLE": {
        layers: {
            hint: "Discrete simulation agent.",
            explanation: "The fundamental unit of VEPA. Each agent possesses unique DNA-derived traits.",
            system: "A structured memory block (STRIDE: 24) in the shared SharedArrayBuffer.",
            advanced: "Particle behavior is entirely emergent; they have no high-level 'intelligence' beyond local DNA-driven interaction laws."
        },
        category: "Entity"
    },
    "WELCOME": {
        layers: {
            hint: "Interactive Help Protocol v2.0.",
            explanation: "Quadcopter Drone 'B-4RK' is now under your command. Mostly.",
            system: "Contextual documentation delivery system with independent snark processor.",
            advanced: "Usage: Click elements to scan. UI buttons require a Double-Tap. Drone will attempt to land when protocol is deactivated."
        },
        category: "System"
    },
    // --- CHEMISTRY LAWS ---
    "CATA": { layers: { hint: "Catalysis: Speeds up chemical reactions locally.", explanation: "Speeds up chemical reactions locally.", system: "Multiplies interaction rate.", advanced: "Autocatalytic loops can form." }, category: "Chemistry" },
    "SOLV": { layers: { hint: "Solvation: Dissolves molecular bonds over time.", explanation: "Dissolves molecular bonds over time.", system: "Breaks structural links based on proximity.", advanced: "Can be used to digest rigid bodies." }, category: "Chemistry" },
    "ACID": { layers: { hint: "Acidity: Degrades particle mass on contact.", explanation: "Degrades particle mass on contact.", system: "Direct mass reduction.", advanced: "Simulates hostile corrosive environments." }, category: "Chemistry" },
    "OXID": { layers: { hint: "Oxidation: Transfers energy outward during collision.", explanation: "Transfers energy outward during collision.", system: "Increases local kinetic energy on contact.", advanced: "Exothermic reaction analogue." }, category: "Chemistry" },
    "REDU": { layers: { hint: "Reduction: Absorbs ambient energy to build mass.", explanation: "Absorbs ambient energy to build mass.", system: "Endothermic mass accumulation.", advanced: "Allows growth in high-energy zones." }, category: "Chemistry" },
    "POLY": { layers: { hint: "Polymerization: Chains particles into long strings.", explanation: "Chains particles into long strings.", system: "Forces linear bonding.", advanced: "Creates macro-molecular structures like DNA." }, category: "Chemistry" },
    "ISOM": { layers: { hint: "Isomerization: Reconfigures internal geometry randomly.", explanation: "Reconfigures internal geometry randomly.", system: "Changes species identity without mass loss.", advanced: "Drives spontaneous mutations." }, category: "Chemistry" },
    "CHIR": { layers: { hint: "Chirality: Bonding compatibility based on spin.", explanation: "Bonding compatibility based on spin.", system: "Requires matching angular momentum for fusion.", advanced: "Creates left/right handed species segregation." }, category: "Chemistry" },
    "CRYS": { layers: { hint: "Crystallization: Forces particles into rigid lattices.", explanation: "Forces particles into rigid lattices.", system: "Applies strong bond angle constraints.", advanced: "Creates highly stable, brittle structures." }, category: "Chemistry" },
    "ALLO": { layers: { hint: "Allotropy: Allows phase shifting between identical species.", explanation: "Allows phase shifting between identical species.", system: "State changes without chemical transformation.", advanced: "Carbon-to-diamond phase transitions." }, category: "Chemistry" },
    // --- THERMODYNAMICS LAWS ---
    "HEAT": { layers: { hint: "Heat Output: Increases kinetic energy globally.", explanation: "Increases kinetic energy globally.", system: "Constant upward drift in velocity vectors.", advanced: "Prevents thermal death, drives continuous interaction." }, category: "Thermodynamics" },
    "COLD": { layers: { hint: "Cold Sink: Dampens velocity to near zero.", explanation: "Dampens velocity to near zero.", system: "Massive drag coefficient in localized zones.", advanced: "Used to create stable 'frozen' architectures." }, category: "Thermodynamics" },
    "CONV": { layers: { hint: "Convection: Creates cyclic fluid flow patterns.", explanation: "Creates cyclic fluid flow patterns.", system: "Ties vertical movement to thermal state.", advanced: "Hot matter rises, cold sinks, forming atmospheric loops." }, category: "Thermodynamics" },
    "RADI": { layers: { hint: "Thermal Radiation: Hot bodies emit repulsive waves.", explanation: "Hot bodies emit repulsive waves.", system: "High-energy particles push others away.", advanced: "Simulates stellar wind and radiation pressure." }, category: "Thermodynamics" },
    "SUBL": { layers: { hint: "Sublimation: Solid clusters instantly disperse into gas.", explanation: "Solid clusters instantly disperse into gas.", system: "Bypasses liquid phase entirely.", advanced: "Causes explosive decompression of matter." }, category: "Thermodynamics" },
    "MELT": { layers: { hint: "Melting Point: Bonds break down in high-density areas.", explanation: "Bonds break down in high-density areas.", system: "Friction-induced bond degradation.", advanced: "Core of large structures will liquify first." }, category: "Thermodynamics" },
    "BOIL": { layers: { hint: "Boiling: Explosive volume expansion upon energy threshold.", explanation: "Explosive volume expansion upon energy threshold.", system: "Converts internal energy into repulsive force.", advanced: "Drives phase transitions and catastrophic instability." }, category: "Thermodynamics" },
    "COND": { layers: { hint: "Condensation: Increased gravity in low-energy pockets.", explanation: "Increased gravity in low-energy pockets.", system: "Cold zones amplify attraction.", advanced: "Simulates fluid droplet formation." }, category: "Thermodynamics" },
    "DEPO": { layers: { hint: "Deposition: Free-floating particles instantly freeze on contact.", explanation: "Free-floating particles instantly freeze on contact.", system: "Gas-to-solid phase transition.", advanced: "Creates delicate frost-like fractal growths." }, category: "Thermodynamics" },
    "EXOP": { layers: { hint: "Exothermic: All reactions release extra systemic heat.", explanation: "All reactions release extra systemic heat.", system: "Collision events inject global kinetic energy.", advanced: "Can lead to runaway thermal cascades." }, category: "Thermodynamics" },
    // --- METAPHYSICS LAWS ---
    "TIME": { layers: { hint: "Time Dilation: Local slow-down of physics ticks.", explanation: "Local slow-down of physics ticks.", system: "Dense regions process fewer updates.", advanced: "Simulates relativistic effects near massive bodies." }, category: "Metaphysics" },
    "DIME": { layers: { hint: "Dimensionality: Allows bypassing of 3D spatial collisions.", explanation: "Allows bypassing of 3D spatial collisions.", system: "Particles can phase through each other.", advanced: "Creates non-Euclidean interaction topologies." }, category: "Metaphysics" },
    "CHAO": { layers: { hint: "Chaos Factor: Injects extreme non-linear forces.", explanation: "Injects extreme non-linear forces.", system: "Applies random high-magnitude vectors.", advanced: "Destroys stable systems rapidly." }, category: "Metaphysics" },
    "ORDE": { layers: { hint: "Total Order: Forces absolute grid alignment.", explanation: "Forces absolute grid alignment.", system: "Snaps positions to discrete coordinates.", advanced: "Turns fluid simulations into cellular automata." }, category: "Metaphysics" },
    "FATE": { layers: { hint: "Determinism: Locks particles into fixed trajectories.", explanation: "Locks particles into fixed trajectories.", system: "Disables all subsequent force calculations.", advanced: "Frozen timeline exploration." }, category: "Metaphysics" },
    "WILL": { layers: { hint: "Free Will: Particles may spontaneously reverse velocity.", explanation: "Particles may spontaneously reverse velocity.", system: "Low-probability vector negation.", advanced: "Breaks deterministic loops and local minima." }, category: "Metaphysics" },
    "SOUL": { layers: { hint: "Soul Persistence: Retain identity data across death cycles.", explanation: "Retain identity data across death cycles.", system: "DNA is preserved in the location of death.", advanced: "Allows for reincarnation and ancestral memory." }, category: "Metaphysics" },
    "MIND": { layers: { hint: "Hive Mind: Global telepathic state synchronization.", explanation: "Global telepathic state synchronization.", system: "Instantaneous signal propagation.", advanced: "Species act as a single contiguous organism." }, category: "Metaphysics" },
    "TELE": { layers: { hint: "Teleportation: Instantaneous spatial relocation at boundary edge.", explanation: "Instantaneous spatial relocation at boundary edge.", system: "Wormhole topology.", advanced: "Breaks continuous space assumptions." }, category: "Metaphysics" },
    "CLAI": { layers: { hint: "Clairvoyance: Reacts to collisions before they happen.", explanation: "Reacts to collisions before they happen.", system: "Look-ahead collision avoidance.", advanced: "Perfect evasion algorithms." }, category: "Metaphysics" },
    "PREO": { layers: { hint: "Precognition: Proactive evasion of high-density clusters.", explanation: "Proactive evasion of high-density clusters.", system: "Calculates density gradients in advance.", advanced: "Creates 'scared' matter that hides in the void." }, category: "Metaphysics" },
    "ASTR": { layers: { hint: "Astral Projection: Ghost forms that influence matter remotely.", explanation: "Ghost forms that influence matter remotely.", system: "Separates physical body from interaction sphere.", advanced: "Spooky action at a distance." }, category: "Metaphysics" }
};

export const DNA_RANGES = [
    { min: -100, max: 100, default: 1.0 },
    { min: 0.5, max: 1.0, default: 0.98 }, // Viscosity (more range)
    { min: -1, max: 1, default: 0 },
    { min: 0, max: 5.0, default: 0.05 }, // Jitter (way more range)
    { min: -1, max: 1, default: 0 },
    { min: 0, max: 1, default: 0.5 },
    { min: -1, max: 1, default: 0 },
    { min: -5, max: 5, default: 0 },
    { min: 0.1, max: 5, default: 1.0 },
    { min: 0, max: 1, default: 0.5 },
    { min: 0, max: 10, default: 0.5 }, // Birth Rate
    { min: 0, max: 10, default: 0.1 }, // Death Rate
    { min: 0, max: 10, default: 0.5 }, // Mutation
    { min: 0, max: 2, default: 1.0 },
    { min: 0, max: 1, default: 0.2 },
    { min: -1, max: 1, default: 0 },
    { min: 0, max: 50, default: 1.0 },
    { min: 0, max: 100, default: 2 },
    { min: 20, max: 500, default: 120 },
    { min: 0, max: 1, default: 0.5 },
    { min: 0.1, max: 0.99, default: 0.95 },
    { min: 0.01, max: 1.0, default: 0.5 },
    { min: 0, max: 1, default: 1 },
    { min: 0, max: 1, default: 1 },
    { min: 0, max: 1, default: 1 },
    { min: 0, max: 1, default: 1 },
    // Batch 4 (indices 26-33)
    { min: 0.1, max: 2, default: 1.0 }, // Inertia
    { min: 0, max: 0.1, default: 0.01 }, // Friction
    { min: 1, max: 50, default: 20 }, // Max Velocity
    { min: 0.5, max: 10, default: 2.0 }, // Base Radius
    { min: 0, max: 1, default: 0.5 }, // Elasticity
    { min: 0, max: 360, default: 0 }, // Bond Angle
    { min: 0, max: 1, default: 0.1 }, // Conductivity
    { min: 0, max: 1, default: 0.1 }, // Magnetic Moment
    // Batch 5 (indices 34-40)
    { min: 0, max: 10, default: 0.8 }, // Energy Efficiency
    { min: 0, max: 10, default: 0.05 }, // Sex Chance
    { min: 0, max: 20, default: 0 }, // Predation Bias
    { min: 10, max: 1000, default: 500 }, // Reaction Threshold
    { min: 1, max: 10, default: 1.0 }, // Catalysis
    { min: 0, max: 1, default: 0.1 }, // Heat Output
    { min: 0.9, max: 1.0, default: 0.99 }, // Memory Decay
    { min: -1.0, max: 1.0, default: 0.0 }, // Species Affinity
];
