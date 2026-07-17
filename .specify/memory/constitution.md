<!--
Sync Impact Report:
- Version: Template → 1.0.0 (Initial ratification)
- Principles Added: I. Architecture & Simulation Model, II. Data Architecture (Stride System),
  III. GPU-Accelerated Rendering, IV. Concurrency & Worker Model, V. Code Quality & Testing,
  VI. Documentation SSOT, VII. Performance & Numerical Safety, VIII. Modular Engine Design
- Sections Added: Project Identity, Simulation Constraints, DNA Parameter System
- Templates Status:
  ✅ plan-template.md - Aligned with simulation-specific planning
  ✅ spec-template.md - Aligned with VEPA specs
  ✅ tasks-template.md - Aligned with VEPA task structure
  ⚠ README.md - Manual update recommended
- Deferred: DNA Law synergy matrix (batch after specification phase)
- Created: 2026-07-16
-->

# VEPA v3 Constitution — Vector Emergent Physics Automata

## Project Identity

VEPA is a **GPU-accelerated (Web Workers + Canvas2D/PixiJS) emergent physics simulation** —
a synthetic petri dish where particles governed by DNA profiles interact under global laws.
A Narrative Consciousness layer acts as the functional "ink," rewriting physics based on
the unfolding story of simulated species.

| Attribute | Value |
|-----------|-------|
| **Version** | 3.0.0 (v3 recreation) |
| **Runtime** | Browser (ESM), Web Workers |
| **Render** | PixiJS 8.x / Canvas2D |
| **Physics** | O(N²) with spatial hashing (12×12×12 grid) |
| **Memory Model** | SharedArrayBuffer + Float32Array |
| **Particle Limit** | Soft: 5,000 / Hard: 50,000 |
| **Species Limit** | 64 |
| **Module System** | ESM (`"type": "module"`) |
| **Package Manager** | npm |

---

## Core Principles

### I. Architecture & Simulation Model — MANDATORY

**The simulation MUST follow a flat buffer + ECS-like architecture:**

- All particle state lives in `Float32Array` backed by `SharedArrayBuffer` (the Stride System)
- Every particle occupies exactly 100 consecutive floats (the STRIDE)
- Species DNA is stored in a separate `Uint16Array` buffer `[64 species × 64 params]`
- The physics engine runs in a **dedicated Web Worker** — never on the main thread
- The main thread handles ONLY rendering (PixiJS sprites) and UI orchestration
- Communication between worker and main thread uses `postMessage` with `Transferable` objects
- All simulation state MUST be deterministic given the same seed and input sequence

**Rationale:** Flat buffers allow zero-copy sharing between threads via SharedArrayBuffer,
avoid GC pressure from object allocation, and enable the O(N²) physics to run at 60fps.

### II. Data Architecture (Stride System) — MANDATORY

**The particle stride layout at offsets 0-99 MUST be strictly observed:**

| Range | Field Group | Size |
|-------|-------------|------|
| 0-5 | Position & Velocity (X/Y/Z) | 6 floats |
| 6 | Mass | 1 float |
| 7 | Species ID | 1 float |
| 8-71 | DNA Cache (64 cached params) | 64 floats |
| 72 | Energy | 1 float |
| 73 | Age | 1 float |
| 74 | Dead/Soul flag | 1 float |
| 75-77 | Color (R/G/B) | 3 floats |
| 78 | Memory | 1 float |
| 79 | Signal | 1 float |
| 80 | Radius | 1 float |
| 81 | Alpha | 1 float |
| 82 | Mitosis Timer | 1 float |
| 83 | Partner ID | 1 float |
| 84 | Hunger | 1 float |
| 85 | Armor | 1 float |
| 86 | Bond Count | 1 float |
| 87 | Chain Length | 1 float |
| 88-93 | Bond Partners (1-6) | 6 floats |
| 94 | Species Class | 1 float |
| 95 | Combat State | 1 float |
| 96-98 | Stigmergy (X/Y/Z) | 3 floats |
| 99 | Reserved | 1 float |

**Rules:**
- All buffer accesses MUST use `STRIDE * index + offset` — never hardcoded positions
- `STRIDE` MUST be a named constant (`PARTICLE_STRIDE = 100`)
- Every DNA offset access in the worker MUST use `DNA_OFFSETS` (built from `DNA_INDEXES`)
- The DNA buffer MUST be `Uint16Array` (packed 0-65535) mapped to float ranges via `DNA_RANGES`
- Never use `Math.random()` for simulation-critical randomness — use `SplitMix32` PRNG

### III. GPU-Accelerated Rendering — MANDATORY

**Rendering MUST never block the physics tick:**

- PixiJS (or Canvas2D) runs on the main thread — rendering is a read-only operation
- Sprites are updated from the shared particle buffer after each physics tick
- Particle colors, alpha, and radius are phenotype-expressed from DNA + state
- The UI layer (sliders, toggles, HUD) MUST be decoupled from the render loop
- Z-sorting or alpha-based flicker suppression MUST be applied for overlapping particles
- Visual categories: BLUE=Physics laws, GREEN=Biology, PURPLE=Chemistry, ORANGE=Thermodynamics, RED=Metaphysics

### IV. Concurrency & Worker Model — MANDATORY

**The physics worker is the single source of truth for simulation state:**

- The worker owns the `SharedArrayBuffer` and writes particle data each tick
- The main thread reads (never writes) the shared buffer for rendering
- Message envelope: `{type, data, config, version}` via `postMessage`
- The spatial grid (12×12×12, max 100 particles/cell) optimizes O(N²) to local neighborhood checks
- Forces only computed for particles in same or adjacent cells (27-cell neighborhood)
- Maximum 500 interactions per particle per frame (relativistic stability layer)
- Maximum 10 physics sub-steps per frame (tunneling prevention)
- Maximum force clamp: 50.0 (NaN explosion prevention)

### V. Code Quality & Testing — MANDATORY

**All code MUST be validated before commit:**

- Syntax check: `find src -name '*.js' -exec node --check {} +`
- Python validation suite: `python3 .tests/validate_engine.py` (3 suites: JS syntax, SSOT alignment, law coverage)
- Vite build must succeed: `npx vite build`
- Every law toggle change MUST be reflected in `computeFlags()` — no dead toggles
- Never hardcode law indices — always reference `LAW_INDEXES.GRAV` etc.
- Every law MUST have a 4-tier `HELP_DB` entry (HINT, EXPLANATION, SYSTEM, ADVANCED)
- No file extensions in import paths (bare module specifiers resolve via bundler)

### VI. Documentation SSOT (Single Source of Truth) — MANDATORY

**Every significant code change MUST be synchronized across these files:**

| File | Content | Sync Trigger |
|------|---------|--------------|
| `CHANGELOG.md` | Versioned change history | Any functional change |
| `README.md` | Project overview | Architecture shifts |
| `GUIDE.md` | User-facing recipes | New emergent behaviors |
| `ENGINE_SSOT.md` | Technical SSOT | Law/DNA changes |
| `docs/fullaudit.md` | System audit | Parameter/law index changes |
| `docs/lawaudit.md` | Law audit | New laws, law behavior changes |
| `src/constants.js` (HELP_DB) | 4-tier documentation | New laws or parameters |
| `codex/entries.json` | In-engine encyclopedia | After HELP_DB changes |

**The B-4RK Principle:** Documentation is not an afterthought — it is a feature.
All new laws MUST have complete 4-tier HELP_DB entries.

### VII. Performance & Numerical Safety — MANDATORY

**Stability layers MUST be in place to prevent simulation explosion:**

- NaN/Infinity guards: every physics sub-step validates coordinates and velocities
- Max velocity clamp: prevents particles from escaping the toroidal world
- Max force clamp: ±50.0 prevents runaway acceleration
- Max sub-steps: 10 per frame prevents tunneling through cells
- Max interactions: 500 per frame prevents O(N²) stall
- Double-buffering with sync lock prevents torn reads during render
- The simulation MUST survive 10,000+ ticks without numerical drift

### VIII. Modular Engine Design — RECOMMENDED

**The intelligence layer above physics SHOULD be separated into distinct engines:**

- Insight Engine: spatio-temporal cluster detection & pattern logging
- Narrative Consciousness: multi-voice internal monologue
- Goal Engine: auto-tunes world constraints toward stability/complexity
- Personality Engine: drives systemic bias (Curiosity, Stability, Chaos)
- Lineage Tracker: evolutionary genealogy tracking
- Timeline Engine: history recording and scrubbing playback
- Emergent Param Engine: discovers emergent parameter configurations
- Persistence Engine: save/load state to localStorage
- Policy Engine: cross-engine coordination
- Prediction Engine: short-term trajectory forecasting

Each engine communicates via the EventBus (`core/eventBus.js`) — never direct coupling.

---

## Simulation Constraints

| Parameter | Value | Notes |
|-----------|-------|-------|
| Particle stride | 100 floats | `PARTICLE_STRIDE` |
| DNA params per species | 42 | Indices 0-41 of 64 |
| DNA buffer | 64 × 64 Uint16 | Packed 0-65535 |
| Max species | 64 | Hard limit |
| Max particles | 50,000 | Soft cap at 5,000 |
| Grid resolution | 12×12×12 | Spatial hash cells |
| Max cell capacity | 100 | Particles per cell |
| Max interactions | 500 | Per particle per frame |
| Max sub-steps | 10 | Per frame |
| Max force | 50.0 | Clamp value |
| Law count | 64 | 64-bit bitmask |
| PRNG | SplitMix32 | Deterministic |

## DNA Parameter System (42 Indices)

Six functional groups:

1. **Physics & Motion** (0-3, 15, 26-28): FORCE, VISCOSITY, TORQUE, JITTER, TIDAL, INERTIA, FRICTION, MAX_VELOCITY
2. **Matter & Morphology** (6-9, 16-17, 29-31): SYMMETRY, HIDDEN_MASS, STIFFNESS, FUSION, FUSION_MOMENTUM, FUSION_TIME, BASE_RADIUS, ELASTICITY, BOND_ANGLE
3. **Electromagnetism & Chemistry** (4-5, 32-33, 37-39): POLARITY, ALPHA, CONDUCTIVITY, MAGNETIC_MOMENT, REACTION_THRESHOLD, CATALYSIS, HEAT_OUTPUT
4. **Biology & Life** (10-12, 34-36, 41): BIRTH_RATE, DEATH_RATE, MUTATION, ENERGY_EFFICIENCY, SEX_CHANCE, PREDATION_BIAS, SPECIES_AFFINITY
5. **Communication & Memory** (13-14, 18-25, 40): SIGNAL_RESP, PULSE_RATE, NEIGHBORHOOD_RADIUS, SIGNAL_STRENGTH, SIGNAL_DECAY, PROPAGATION_SPEED, TUNING_CH1-4, MEMORY_DECAY
6. **Reserved** (42-63): Future expansion slots

## Governance

### Constitution Authority

This constitution supersedes all other development practices and guidelines for the v3
codebase. When conflicts arise between this constitution and other documentation,
**the constitution takes precedence**.

### Amendment Process

**Minor (1.x.y → 1.x.y+1):** Clarifications, typo fixes.
Requires: 1 approval + PR review.

**Feature (1.x.y → 1.x+1.0):** New principles, expanded guidance.
Requires: 2 approvals + team discussion.

**Breaking (x.y.z → x+1.0.0):** Principle removals, incompatible changes.
Requires: Team vote (2/3 majority) + migration plan.

### Compliance Verification

Every PR MUST verify:
- [ ] Buffer stride layout respected (no hardcoded offsets)
- [ ] Law bitmask uses LAW_INDEXES constants
- [ ] HELP_DB entries complete (all 4 tiers)
- [ ] NaN guards in place for physics calculations
- [ ] SSOT documents updated (minimal: CHANGELOG + ENGINE_SSOT)
- [ ] no `Math.random()` for simulation logic

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
