# Tasks: VEPA v3 Implementation

**Input**: `v3/SPEC.md`, `v3/PLAN.md`
**Prerequisites**: Constitution ratified, spec clarified, plan approved
**Organization**: Grouped by implementation phase — each phase is independently testable

## Dependency Graph

```
Phase 1 (Foundation) ──→ Phase 2 (Physics) ──→ Phase 3 (Rendering) ──→ Phase 4 (UI) ──→ Phase 5 (Intelligence) ──→ Phase 6 (Testing)
       │                        │                       │                       │
       ├── T001–T011            ├── T012–T019            ├── T020–T027            ├── T028–T036
       │                        │                       │                       │
       └── (blocks Phase 2)     └── (blocks Phase 3)     └── (blocks Phase 4)    └── (blocks Phase 5)
```

## Phase 1: Foundation — Core Data Layer (P1)

**Purpose**: Constants, PRNG, EventBus, spatial grid, DNA buffer, Worker shell.
**Blocks**: All subsequent phases.

- [ ] T001 **Scaffold v3 project** — create `v3/package.json`, `v3/vite.config.js` (COOP/COEP headers, base `/vepa/`, code splitting), `v3/index.html` shell
- [ ] T002 **Implement `constants.js`** — `PARTICLE_STRIDE = 100`, `DNA_STRIDE = 64`, `MAX_SPECIES = 64`, `MAX_PARTICLES = 50000`, `LAW_COUNT = 64`, `GRID_SIZE = 12`, `MAX_CELL_CAPACITY = 100`, `MAX_INTERACTIONS = 500`, `MAX_SUBSTEPS = 10`, `MAX_FORCE = 50.0`
- [ ] T003 **Implement `LAW_INDEXES`** — all 64 law indices organized by category (Physics 0-15, Biology 16-31, Chemistry 32-47, Metaphysics 48-63) with multi-state law tiers
- [ ] T004 **Implement `DNA_INDEXES`** — all 42 DNA indices in 6 functional groups with `DNA_RANGES` (min/max/default/step per parameter)
- [ ] T005 **Implement `STRIDE_INDEXES`** — named stride offsets for all 100 fields (POS_X=0, VEL_X=3, MASS=6, SPECIES_ID=7, DNA_CACHE_START=8, ENERGY=72, AGE=73, DEAD=74, etc.)
- [ ] T006 **Implement `core/eventBus.js`** — minimal pub/sub with `on()`, `off()`, `emit()` methods
- [ ] T007 [P] **Implement `core/prng.js`** — SplitMix32 deterministic PRNG with `seed` parameter, `nextFloat()`, `nextInt(n)` methods
- [ ] T008 **Implement `physics/spatialGrid.js`** — 12×12×12 grid with `clear()`, `insert(particleIndex, x, y, z)`, `getNeighbors(particleIndex)` returning 27-cell neighborhood. Toroidal wrapping on all axes.
- [ ] T009 **Implement `species/dnaBuffer.js`** — `Uint16Array(64×64)` with `getDNA(speciesId, paramIndex)`, `setDNA(speciesId, paramIndex, value)`, `mutate(speciesId, mutationRate)`. Range validation against DNA_RANGES.
- [ ] T010 **Implement `physics/worker.js`** — Web Worker shell: message handler dispatching by `msg.type`, `SharedArrayBuffer` ownership, tick loop with `postMessage({type:'tick'})`
- [ ] T011 **Implement `physics/dna.js`** — `DNA_OFFSETS` computed from `DNA_INDEXES`, helper functions for cached DNA access on particle buffer: `getDNACached(particle, paramIndex)`, `cacheDNA(particle, speciesId)`

## Phase 2: Physics Engine (P1)

**Purpose**: Forces, laws, tick orchestrator — the core simulation loop.
**Blocks**: Rendering.

- [ ] T012 **Implement `physics/laws.js`** — bitmask logic: `isSet(flags, lawIndex)` using low/high 32-bit flags. Law config object with `{name, category, state, enabled}`.
- [ ] T013 **Implement `laws/synergyEngine.js`** — computed law synergies from law properties (category, polarity, intensity). Functions: `computeSynergy(lawA, lawB)` returning multiplier, `getActiveSynergies(flags)` returning array of active synergy pairs.
- [ ] T014 **Implement `physics/forces.js`** — all force types: gravitational attraction, drag/viscosity, collision response (elastic/inelastic), bond forces, predation bias vector, signal propagation, electromagnetic (polarity), fusion/merging logic, toroidal wrap forces. Each force function takes `(particleA, particleB, flags, config) => {fx, fy, fz}`.
- [ ] T015 **Implement `physics/engine.js`** — tick orchestrator: `tick(particleBuffer, speciesBuffer, lawFlags, config, grid)`. Sub-step loop (up to 10), spatial grid rebuild per sub-step, force accumulation per particle with MAX_INTERACTIONS throttle, NaN guard after each sub-step, MAX_FORCE clamp, velocity/position integration.
- [ ] T016 **Wire worker message protocol** — handler for `init` (receive SharedArrayBuffer, grid config, seed), `config` (update laws/DNA), `tick` (run one frame, post `tick-complete`), `getState` (snapshot), `setState` (restore). Config versioning for sync safety.
- [ ] T017 **Implement NaN stability layer** — `validateFloat(val)` guard called after every sub-step for all position/velocity/force values. Log + clamp on NaN. Counter/tripwire for repeated NaN events.
- [ ] T018 **Implement law categories enum** — `LAW_CATEGORIES = { PHYSICS:0, BIOLOGY:1, CHEMISTRY:2, THERMODYNAMICS:3, METAPHYSICS:4 }` with color mapping `{0:'#4488ff', 1:'#44cc44', 2:'#cc44cc', 3:'#ff8844', 4:'#ff4444'}`
- [ ] T019 **Implement default preset configs** — `PRESETS` object with PRIME_DEFAULT (Predator, Sol, Life, Aether, Void), VOID_CORE, NEURAL_DRIFT, SOLAR_FLARE, CRYSTAL_LATTICE, PREDATOR_SWARM, KINETIC_GAS, SYMBIOTIC_LOOP, CHRONOS_FLUX. Each has species DNA profiles + law states + environment params.

## Phase 3: Rendering (P1)

**Purpose**: PixiJS sprite management, buffer→sprite sync, phenotype expression.
**Blocks**: UI visibility.

- [ ] T020 **Implement `render/renderer.js`** — PixiJS Application setup (width, height, transparent background, antialiasing). Sprite pool management: `createSprite()`, `releaseSprite(index)`, `resizePool(count)`. Container for all particle sprites.
- [ ] T021 **Implement `render/phenoType.js`** — DNA→phenotype expression: `colorFromDNA(dnaCache, speciesId)`, `radiusFromDNA(dnaCache)`, `alphaFromDNA(dnaCache)`. Color from POLARITY/ALPHA/HIDDEN_MASS + species ID seed. Radius from BASE_RADIUS + MASS scaling. Alpha from ALPHA + ENERGY.
- [ ] T022 **Implement `render/spriteUpdater.js`** — per-frame sync: iterate particle buffer, update sprite position (x, y from toroidal to screen coords), color (RGB from stride), alpha, radius. Handle dead/soul particles (dimmed/half-alpha). Handle buffer-sprite count mismatch.
- [ ] T023 **Implement `laws/lawManager.js`** — main-thread law state: `setLaw(index, enabled)`, `setLawState(index, state)` for multi-state, `getFlags()` returning 64-bit bitmask (lowFlags + highFlags), `computeFlags()` from active laws. Pushes config to worker on change.
- [ ] T024 **Implement `species/speciesManager.js`** — species CRUD: `addSpecies(name, dnaValues)`, `removeSpecies(id)`, `getSpecies(id)`, `getAllSpecies()`. Default species profiles (PRIME_DEFAULT). Species color assignment.
- [ ] T025 **Implement `render/renderLoop.js`** — main animation loop via `requestAnimationFrame`: (1) post tick to worker, (2) on tick-complete → update sprites from buffer, (3) render PixiJS, (4) FPS timing. Separate from physics tick rate (allows rendering at display Hz while physics may throttle).
- [ ] T026 **Implement `main.js`** — VepaEngine orchestrator class: init sequence (create buffer → spawn worker → init worker → load presets → start render loop), pause/resume, reset. EventBus wiring for law changes → worker config push. Window resize handler.
- [ ] T027 **Implement camera/viewport** — basic pan/zoom via PixiJS stage transform. Clamp zoom level. Mouse drag to pan. Reset view button.

## Phase 4: UI Layer (P2)

**Purpose**: Law toggles, DNA sliders, preset management, HUD, persistence.
**Depends on**: Phase 3 (rendering visible).

- [ ] T028 [P] **Implement `ui/hud.js`** — FPS counter, particle count, species count, tick time, frame time. DOM-based overlay (not PixiJS). Updates each frame from render stats.
- [ ] T029 **Implement `persistence/store.js`** — IndexedDB wrapper: `open(dbName, version)`, `savePreset(name, state)`, `loadPreset(name)`, `listPresets()`, `deletePreset(name)`, `saveSnapshot(fullState)`, `loadSnapshot(id)`. Schema: object stores for presets and snapshots.
- [ ] T030 **Implement `ui/presets.js`** — preset browser panel: list saved presets, load/delete buttons. Built-in default presets always available. Import/export preset as JSON file.
- [ ] T031 **Implement `ui/lawToggles.js`** — law toggle panel with category tabs (Physics, Biology, Chemistry, Thermodynamics, Metaphysics). Each law has toggle switch + state counter for multi-state laws. Color-coded by category. `data-help-key` attributes on each toggle.
- [ ] T032 **Implement `ui/dnaSliders.js`** — species selector dropdown → DNA parameter sliders. Each slider shows param name, current value, min/max from DNA_RANGES. Grouped by functional category (Physics & Motion, Matter & Morphology, etc.). Real-time update on drag.
- [ ] T033 **Implement `ui/environmentPanel.js`** — global sim controls: particle spawn count, world size, spread axes (X/Y/Z), distribution mode selector (Soup, Grid, Big Bang, Bipolar, Galaxy), camera controls. Reset button.
- [ ] T034 **Implement `ui/lawInfoPanel.js`** — HELP_DB panel: click a law toggle → show 4-tier help (HINT, EXPLANATION, SYSTEM, ADVANCED). Active synergy display showing currently interacting laws.
- [ ] T035 **Implement `ui/accordionLayout.js`** — collapsible side-bar panel system with `.chunk-type-*` CSS theming. SVG icons for each category. Neon-noir aesthetic with `.bolt` corner decorations. Responsive layout.
- [ ] T036 **Implement `ui.js`** — main UI builder: orchestrates lawToggles, dnaSliders, environmentPanel, presets, hud, lawInfoPanel into the app shell. EventBus subscriptions for state changes.

## Phase 5: Intelligence Engines (P3)

**Purpose**: Insight, narrative, goal, personality, lineage, timeline, emergent param.
**Depends on**: Phase 3 (simulation must run to observe).

### Phase 5a — Observation

- [ ] T037 **Implement `intelligence/insightEngine.js`** — every N frames (configurable), scan spatial grid for particle clusters. Cluster detection: groups of ≥3 same-species within NEIGHBORHOOD_RADIUS. Scores clusters by density, size, longevity. Emits `insight:cluster` events on EventBus.
- [ ] T038 **Implement `intelligence/lineageTracker.js`** — tracks parent→offspring relationships. On each birth event, logs lineage entry `{parentId, childId, speciesId, tick, mutationDelta}`. Query: `getAncestors(particleId)`, `getDescendants(speciesId)`. Emits `lineage:birth`, `lineage:extinction` events.

### Phase 5b — Narrative

- [ ] T039 **Implement `intelligence/narrativeConsciousness.js`** — 4-voice monologue engine: Stabilizer (cautious), Diverger (curious), Observer (detached), Dissolver (chaotic). Each voice has personality weights from personalityEngine. Listens to insight events and generates contextual commentary strings.
- [ ] T040 **Implement `intelligence/narrativeRenderer.js`** — narrative log panel in UI. Scrollable text area with voice-colored entries. Filters by voice. Auto-scroll toggle. Timestamp per entry.

### Phase 5c — Meta

- [ ] T041 **Implement `intelligence/goalEngine.js`** — observes simulation metrics (species count, diversity index, energy distribution) and auto-tunes world parameters toward targets: stability (low extinction rate), complexity (high species diversity), chaos (high mutation/energy variance). Emits `goal:adjusted` events.
- [ ] T042 **Implement `intelligence/personalityEngine.js`** — three-axis systemic bias: Curiosity (exploration weight), Stability (homeostasis weight), Chaos (entropy weight). Each axis 0.0–1.0. Drives goal engine targets and narrative voice selection probability.
- [ ] T043 **Implement `intelligence/timelineEngine.js`** — circular buffer of simulation snapshots (configurable interval). Playback: scrub forward/backward through history at variable speed. Emits `timeline:frame` events during playback. Save/load timeline to IndexedDB.
- [ ] T044 **Implement `intelligence/emergentParamEngine.js`** — periodically probes parameter space by temporarily mutating DNA/law configs and measuring interestingness (diversity, novelty, instability). Records promising configurations as "discoveries." Emits `emergent:discovery` events.

### Phase 5d — UI Integration

- [ ] T045 **Implement intelligence panel UI** — tabs for each engine's output (Insight log, Narrative feed, Lineage tree, Timeline scrubber). Goal engine target indicators. Personality axis visualizers.

## Phase 6: Testing & Polish (P2)

**Purpose**: Validation, documentation, build optimization.

- [ ] T046 **Set up Vitest** — `vitest.config.js`, test directory structure. First test: PRNG determinism (same seed → same sequence).
- [ ] T047 **Write unit tests: Physics** — force computation, spatial grid insert/query, sub-step loop, NaN guard triggers, force clamping, max interactions throttle.
- [ ] T048 **Write unit tests: DNA** — buffer read/write, range validation, mutation, cache behavior, species CRUD.
- [ ] T049 **Write unit tests: Laws** — bitmask computation, multi-state tiers, `computeFlags()`, synergy computation, all 64 law indices.
- [ ] T050 **Write unit tests: EventBus** — on/off/emit, listener lifecycle, error isolation.
- [ ] T051 **Write integration tests: Simulation lifecycle + sync integrity** — seed PRNG → init sim → run 1000 ticks → verify particle count > 0, no NaN in buffer, deterministic output.
- [ ] T052 **Set up Playwright** — `playwright.config.js`, browser install. Simple smoke test: page loads, sim starts, FPS counter visible.
- [ ] T053 **Write E2E test: Law toggle** — load page → toggle law OFF → verify flag state → toggle ON → verify flag restored.
- [ ] T054 **Write E2E test: Preset save/load** — load page → save preset → reload → load preset → verify identical state.
- [ ] T055 **Write E2E test: Multi-species** — load PRIME_DEFAULT → verify 5 species present with correct DNA defaults.
- [ ] T056 **Write E2E test: Stability** — run 10,000 ticks → verify no console errors, FPS > 30.
- [ ] T056b **HELP_DB entries** — write 4-tier HELP_DB entries (HINT, EXPLANATION, SYSTEM, ADVANCED) for all 64 laws and 42 DNA params. Build script to generate HELP_DB from LAW_INDEXES + DNA_INDEXES
- [ ] T056c **Codex entries sync** — rebuild codex/entries.json from HELP_DB after changes (equivalent to node scripts/build_codex.js)
- [ ] T057 **SSOT documentation update** — CHANGELOG.md, ENGINE_SSOT.md, docs/fullaudit.md, docs/lawaudit.md synced with v3 constants.
- [ ] T058 **Build optimization** — Vite code-splitting audit, worker bundling strategy, PixiJS tree-shaking. Verify `npx vite build` succeeds with <500KB initial JS.
- [ ] T059 **HTML shell polish** — favicon, title ("VEPA v3: Particle God"), meta tags, viewport config. COOP/COEP headers verified.

## Parallel Execution Map

```
Phase 1 (Foundation):
  T001–T005 ──→ T006 + T007 (parallel)
                   │
                   ├──→ T008
                   ├──→ T009
                   └──→ T010 + T011 (parallel)

Phase 2 (Physics):
  T012 + T013 + T018 ──→ T014 + T015 + T016 + T017 (parallel after law indexes)
                            │
                            └──→ T019

Phase 3 (Rendering):
  T020 + T021 + T024 ──→ T022 + T023 + T025 + T026 + T027 (parallel)

Phase 4 (UI):
  T028 + T029 ──→ T030 + T031 + T032 + T033 + T034 + T035 + T036 (parallel)

Phase 5 (Intelligence):
  T037 + T038 ──→ T039 + T040 ──→ T041 + T042 + T043 + T044 ──→ T045

Phase 6 (Testing):
  T046 ──→ T047 + T048 + T049 + T050 (parallel)
  T052 ──→ T053 + T054 + T055 + T056 (parallel)
  T051 + T057 + T058 + T059 (parallel after unit tests)
```
