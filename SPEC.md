# Feature Specification: VEPA v3 — Vector Emergent Physics Automata

**Feature Branch**: `v3-recreation`
**Created**: 2026-07-16
**Status**: Draft
**Input**: Constitution ratified — full recreation in v3/ subdirectory

## Problem Statement

VEPA v2.x (the existing codebase) grew organically from experiments into a ~7K LOC
simulation with 20+ source files. While functionally rich, it suffers from:

- **Tight coupling** between UI, physics, and intelligence engines — hard to test in isolation
- **No module boundary** between the core physics worker and the intelligence layer
- **Inconsistent law synergy system** — synergies are hardcoded strings in the worker
- **No formal test suite** for the simulation itself (only syntax / SSOT alignment checks)
- **Mixed concerns** in `main.js` (1,251 LOC) — orchestrator, render loop, law state, UI wiring
- **Legacy baggage** from v1.x patterns (global callbacks, inline HTML event handlers)

VEPA v3 is a clean-slate recreation that preserves all emergent capabilities while
enforcing clean module boundaries, testability, and documented architecture from day one.

## Business Value

- **Clean architecture** — each subsystem testable in isolation
- **Deterministic physics** — reproducible simulations from seed
- **Documented law synergies** — explicit synergy matrix, not hardcoded strings
- **Modular intelligence layer** — engines communicate via EventBus only
- **Type-safe DNA system** — validated ranges, clear parameter groups
- **Production-ready build** — Vite-bundled with proper code splitting

## User Scenarios & Testing

### User Story 1 — Simulation Initializes & Runs (P1)

A user opens `index.html` and sees particles moving in a toroidal world governed by
active laws. The simulation runs at 60fps with responsive UI controls.

**Why this priority**: Core viability — without a running simulation, nothing else matters.

**Independent Test**: Opening the app shows ≥1 species with ≥10 particles. Physics tick
advances each frame. UI reflects current law state.

**Acceptance Scenarios**:
1. **Given** the app is loaded, **When** the physics worker initializes, **Then** particles
   are spawned according to the default preset with valid positions and velocities
2. **Given** a running simulation, **When** 100 frames elapse, **Then** particles have moved
   (positions changed), no NaN values exist in buffer
3. **Given** the simulation runs, **When** the user toggles a law off, **Then** the law's
   effects cease and visual indicator updates

---

### User Story 2 — DNA-Driven Species Behavior (P2)

Particles of different species exhibit distinct behaviors based on their 42 DNA parameters —
predators chase prey, social species swarm, solars attract.

**Why this priority**: This is the core emergent gameplay — without DNA differentiation,
it's just a particle screen saver.

**Independent Test**: Two species with opposite DNA profiles (Predator vs. Prey) produce
observably different behavior within 200 frames.

**Acceptance Scenarios**:
1. **Given** two species with different `FORCE` values, **When** the simulation runs,
   **Then** the high-force species exerts stronger attraction/repulsion
2. **Given** a species with high `PREDATION_BIAS`, **When** lower-mass particles are nearby,
   **Then** the predator moves toward them
3. **Given** a species with high `BIRTH_RATE`, **When** energy is sufficient, **Then** new
   particles spawn with inherited DNA + mutation

---

### User Story 3 — Law Toggles Change Simulation (P1)

Users toggle the 64 global laws (grouped by category) and see real-time changes in
particle behavior. Multi-state laws (Wrap, Harmony, Reproduction) have 2-4 tiers.

**Why this priority**: Law interaction is the primary user interface.

**Independent Test**: Flipping `grav` on/off changes particle acceleration vectors.
Flipping `life` on/off stops/starts reproduction.

**Acceptance Scenarios**:
1. **Given** `grav` is ON, **When** particles are near each other, **Then** they
   accelerate toward each other proportional to mass
2. **Given** `wrap` is set to state 2 (hard wrap), **When** a particle exits world bounds,
   **Then** it appears on the opposite edge
3. **Given** `life` is OFF, **When** a particle reaches reproduction threshold,
   **Then** no new particle spawns

---

### User Story 4 — Intelligence Engines Produce Narratives (P3)

The Narrative Consciousness layer observes simulation state and generates multi-voice
commentary about emergent phenomena (stabilizer, diverger, observer, dissolver).

**Why this priority**: This is a signature VEPA feature but sits above core physics.

**Independent Test**: After 500 frames with cluster detection, the insight engine emits
a log entry describing a detected pattern.

**Acceptance Scenarios**:
1. **Given** the simulation runs, **When** particles form a stable cluster,
   **Then** the insight engine logs a cluster event with position and species info
2. **Given** the narrative engine is active, **When** an interesting event occurs,
   **Then** a voice emits a commentary string in the UI

---

### User Story 5 — Presets & Persistence (P2)

Users can save the current simulation state (laws, DNA, particle positions) as a named
preset and reload it later. Default presets (PRIME_DEFAULT, VOID_CORE, etc.) ship built-in.

**Why this priority**: Without save/load, every session starts from scratch.

**Independent Test**: Save a state, reload the page, load the preset — simulation restores
identically.

**Acceptance Scenarios**:
1. **Given** the simulation is running with custom settings, **When** the user saves
   a preset, **Then** the preset is stored in localStorage
2. **Given** a saved preset exists, **When** the user loads it, **Then** all laws, DNA,
   and environment parameters restore to saved values

### Edge Cases

- What happens when all particles die? (reset or empty world state)
- How does the system handle browser tab visibility change? (pause physics)
- What happens when SharedArrayBuffer is unavailable? (fallback to message-passing)
- How does the system handle 50,000 particles? (performance degradation, not crash)
- What happens when a law index is out of range? (bitmask ignores, logged warning)

## Requirements

### Functional Requirements

**Core Physics:**
- **FR-001**: System MUST run O(N²) physics in a dedicated Web Worker with spatial hashing
- **FR-002**: System MUST share particle state via SharedArrayBuffer (Float32Array, stride=100)
- **FR-003**: System MUST enforce toroidal world boundaries (configurable via `wrap` law)
- **FR-004**: System MUST clamp forces to ±50.0 and validate for NaN every sub-step
- **FR-005**: System MUST support max 10 sub-steps and max 500 interactions per particle per frame

**DNA System:**
- **FR-006**: System MUST support 42 DNA parameters per species stored as Uint16Array (0-65535)
- **FR-007**: System MUST express DNA as phenotype (color, radius, alpha) each frame
- **FR-008**: System MUST inherit DNA with mutation during reproduction
- **FR-009**: System MUST validate DNA ranges against DNA_RANGES on load/save

**Law System:**
- **FR-010**: System MUST support 64 laws organized as a 64-bit bitmask (lowFlags + highFlags)
- **FR-011**: System MUST categorize laws into Physics, Biology, Chemistry, Thermodynamics, Metaphysics
- **FR-012**: System MUST support multi-state laws (0-3 tiers: Wrap, Thermal, Harmony, Reproduction)
- **FR-013**: System MUST compute law synergies from an explicit synergy matrix

**Rendering:**
- **FR-014**: System MUST render particles via PixiJS 8.x on the main thread (read-only buffer)
- **FR-015**: System MUST update sprite positions/colors/alpha from buffer each frame
- **FR-016**: System MUST achieve 60fps at 5,000 particles

**UI:**
- **FR-017**: System MUST provide category-grouped law toggles with visual state indicators
- **FR-018**: System MUST provide DNA sliders per species with range-constrained inputs
- **FR-019**: System MUST provide preset save/load with IndexedDB persistence
- **FR-020**: System MUST show HUD (FPS, particle count, tick time, species count)

**Intelligence:**
- **FR-021**: System MUST detect spatio-temporal particle clusters each N frames
- **FR-022**: System MUST generate multi-voice narrative commentary on events
- **FR-023**: System MUST log lineage and evolutionary history per species

### Key Entities

- **Particle**: A single simulation entity with 100 float properties (position, velocity, DNA cache, energy, age, color, etc.)
- **Species**: A DNA profile group (42 parameters) shared by particles of the same type
- **Law**: A global toggleable rule that modifies physics behavior (64-bit bitmask)
- **Preset**: A snapshot of all laws, DNA profiles, and environment parameters
- **Event**: A noteworthy simulation occurrence (cluster formation, death, birth, fusion) consumed by intelligence engines

## Success Criteria

### Measurable Outcomes

- **SC-001**: Simulation runs at 60fps with 5,000 particles on mid-range hardware (2022 laptop)
- **SC-002**: Physics tick completes in <8ms per frame (leaving 8ms for rendering at 60fps)
- **SC-003**: Deterministic replay: same seed + same input → identical particle state after 1,000 ticks
- **SC-004**: All 64 laws independently toggleable and produce observable behavioral changes
- **SC-005**: 42 DNA parameters all produce differentiable phenotype/behavior changes
- **SC-006**: Save/load round-trip preserves exact simulation state

## Integration Tests

- **IT-001**: End-to-end: Load page → simulation auto-starts → particles move → FPS counter updates
- **IT-002**: Law toggle cycle: Toggle each of 64 laws ON then OFF → verify flag state in computeFlags()
- **IT-003**: DNA preset: Load PRIME_DEFAULT → verify 5 species exist with correct DNA values
- **IT-004**: Persistence: Save preset → reload page → load preset → verify identical state
- **IT-005**: Multi-species: Spawn Predator + Prey → verify predation behavior within 500 frames
- **IT-006**: Stability: Run 10,000 ticks → verify no NaN in buffer, particle count > 0
- **IT-007**: Worker sync: Verify buffer sync doesn't produce torn reads over 1,000 frames

## Acceptance Criteria

1. The physics worker runs in isolation — main thread can be blocked without pausing simulation
2. Law synergies are declared in a matrix, not hardcoded in worker logic
3. DNA ranges are validated against a single source of truth (DNA_RANGES in constants.js)
4. No `Math.random()` used in simulation-critical paths — only SplitMix32
5. Every law has a HELP_DB entry with all 4 tiers (HINT, EXPLANATION, SYSTEM, ADVANCED)
6. The UI layer has zero knowledge of buffer offsets — it reads from a render-state abstraction
7. Intelligence engines communicate only via EventBus — no direct function calls between engines
8. All particle buffer accesses use `STRIDE * index + offset` — no hardcoded positions

## Clarifications

### Session 2026-07-16
- Q: Rendering backend? → A: PixiJS 8.x only (no Canvas2D fallback)
- Q: Build structure? → A: Fully modular — app shell loads subsystems as async chunks
- Q: Law synergy system? → A: Computed function (derived from law category/type properties, not declarative matrix)
- Q: Persistence backend? → A: IndexedDB (better for large state dumps with 50K particles)
- Q: Testing approach? → A: Vitest unit tests (physics, DNA, laws) + Playwright E2E (browser integration)
- Q: Testing approach? → A: Vitest for unit tests + Playwright for E2E browser tests
