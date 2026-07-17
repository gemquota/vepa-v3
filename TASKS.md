# Tasks: VEPA v3 Recreation

**Created**: 2026-07-16
**Based on**: SPEC.md, PLAN.md, Constitution

---

## Phase 1: Foundation — Project Scaffold & Core Infrastructure

**Goal**: Bootstrappable project with all constants, buffers, and bootstrap wiring.
**Independent Test**: `npx vite build` succeeds. `node --check` passes on all Phase 1 files.

### Setup Tasks

- [ ] T001 — Create `v3/package.json` (name: "vepa-v3", type: "module", deps: pixi.js ^8.18.1, devDeps: vite ^8.0.8, vitest, @playwright/test)
- [ ] T002 — Create `v3/vite.config.js` (async chunk splitting, COOP/COEP headers for SharedArrayBuffer)
- [ ] T003 — Create `v3/index.html` (minimal shell: canvas container, dark theme, no inline scripts)
- [ ] T004 — Create `v3/style.css` (neon-noir dark theme, CSS variables, `.chunk-inner` panel classes)

### Core Infrastructure Tasks

- [ ] T005 — Write `src/core/eventBus.js` (ESM module: `on(event, fn)`, `emit(event, data)`, `off(event, fn)`)
- [ ] T006 — Write `src/core/prng.js` (SplitMix32: seeded via constructor, `next()` returns float [0, 1))
- [ ] T007 — Write `src/constants.js` (all indexes: `STRIDE_INDEXES`, `DNA_INDEXES`, `LAW_INDEXES`, `DNA_RANGES`, `PARTICLE_STRIDE = 100`)
- [ ] T008 — Write `src/state/particleBuffer.js` (SharedArrayBuffer create/resize, `getParticle(index)`, `setParticle(index, data)`)
- [ ] T009 — Write `src/state/lawState.js` (64-bit bitmask: `lowFlags` + `highFlags`, `toggle(law)`, `isSet(law)`, `computeFlags()`)
- [ ] T010 — Write `src/dna/dnaBuffer.js` (Uint16Array [64×64], `getDNA(species, param)`, `setDNA(species, param, value)`, range validation)
- [ ] T011 — Write `src/main.js` (bootstrap: init EventBus, async-import subsystems, start render loop)

---

## Phase 2: Physics Engine

**Goal**: Particles move in toroidal world under law-governed forces at 60fps.
**Independent Test**: Worker processes 100 ticks with 200 particles — no NaN, positions change deterministically.

### Physics Tasks

- [ ] T012 — Write `src/physics/spatialGrid.js` (12×12×12 cell grid, `insert(particle)`, `getNeighbors(cellX, cellY, cellZ)` → array of nearby indices)
- [ ] T013 — Write `src/physics/laws.js` (per-law force modifiers: `applyGrav()`, `applyDrag()`, `applyColl()`, etc. — gated by `isSet(LAW_INDEXES.X)`)
- [ ] T014 — Write `src/physics/synergy.js` (computed synergy from law category + polarity + intensity → modifies force calculations)
- [ ] T015 — Write `src/physics/solver.js` (main tick: sub-step loop → build spatial grid → compute forces per particle → apply → clamp → NaN guard)
- [ ] T016 — Write `src/physics/worker.js` (Worker entry: `onmessage` handler for INIT/CONFIG/TOGGLE_LAW/TICK, autonomous tick loop, postMessage TICK_COMPLETE)

---

## Phase 3: Rendering

**Goal**: Particles visible on screen, sprites update from buffer each frame.
**Independent Test**: Open `index.html` — 200 colored dots visible and moving on dark background.

### Rendering Tasks

- [ ] T017 — Write `src/dna/expression.js` (DNA → phenotype: compute color (R/G/B), radius, alpha from species DNA + particle state)
- [ ] T018 — Write `src/render/renderer.js` (PixiJS Application init, sprite pool creation, canvas resize handler)
- [ ] T019 — Write `src/render/spriteSync.js` (each frame: iterate particle buffer → update sprite position/x/y, tint, alpha, scale)

---

## Phase 4: UI

**Goal**: Law toggles, DNA sliders, HUD, preset management all functional.
**Independent Test**: Toggle `grav` off → particles stop accelerating toward each other. FPS counter updates.

### UI Tasks

- [ ] T020 — Write `src/ui/hud.js` (FPS counter, particle count, tick time, species count — updates each frame via EventBus)
- [ ] T021 — Write `src/ui/lawPanel.js` (5 category groups: Physics/Blue, Biology/Green, Chemistry/Purple, Thermodynamics/Orange, Metaphysics/Red — toggle buttons with state indicators for multi-state laws)
- [ ] T022 — Write `src/ui/dnaPanel.js` (species selector dropdown, 42 DNA sliders with range-constrained inputs, live update on change)
- [ ] T023 — Write `src/ui/presetPanel.js` (save with name, load from list, delete — connected to presetManager)
- [ ] T024 — Write `src/ui/narrativePanel.js` (scrollback text area for narrative/insight output)
- [ ] T025 — Write `src/ui/ui.js` (main UI builder: layout orchestration, panel wiring, keyboard shortcuts)

---

## Phase 5: Intelligence Engines

**Goal**: Cluster detection, narrative commentary, goal tuning, lineage tracking.
**Independent Test**: After 500 frames with 3+ species, insight engine emits a cluster event.

### Engine Tasks

- [ ] T026 — Write `src/engines/insightEngine.js` (spatio-temporal cluster detection every N frames, emit `cluster:detected` event)
- [ ] T027 — Write `src/engines/narrativeEngine.js` (4 voices: Stabilizer, Diverger, Observer, Dissolver — consume events, produce text)
- [ ] T028 — Write `src/engines/goalEngine.js` (auto-tune world params toward stability/complexity targets, emit `goal:adjusted`)
- [ ] T029 — Write `src/engines/lineageTracker.js` (reproductive tree per species, emit `lineage:branch` on mutation)
- [ ] T030 — Write `src/engines/timelineEngine.js` (periodic state snapshots to IndexedDB, `scrub(tick)` for replay)

---

## Phase 6: Persistence

**Goal**: Save and load simulation state via IndexedDB.
**Independent Test**: Save preset → reload page → load preset → identical simulation state.

### Persistence Tasks

- [ ] T031 — Write `src/state/presetManager.js` (IndexedDB via idb-keyval: `save(name, state)`, `load(name)`, `list()`, `delete(name)` — serialization/deserialization of law bitmask, DNA buffer, world params)
- [ ] T032 — Write default preset data (PRIME_DEFAULT: 5 species — Predator, Sol, Life, Aether, Void — with DNA values, law defaults, world params)

---

## Phase 7: Testing

**Goal**: Automated test suite validates correctness, determinism, and stability.
**Independent Test**: `npx vitest run` passes all tests. `npx playwright test` passes E2E.

### Test Tasks

- [ ] T033 — Write `tests/unit/prng.test.js` (determinism: same seed → same sequence, distribution: 10K values in [0,1), seed independence)
- [ ] T034 — Write `tests/unit/buffer.test.js` (stride layout: offset correctness, wrap-around on species index, SharedArrayBuffer cross-read)
- [ ] T035 — Write `tests/unit/laws.test.js` (bitmask: toggle/set/clear, computeFlags returns expected uint64, synergy computation)
- [ ] T036 — Write `tests/unit/dna.test.js` (range validation: clamp out-of-range, expression: known DNA → expected color/radius/alpha)
- [ ] T037 — Write `tests/unit/physics.test.js` (determinism: 1000 ticks same seed → identical state, NaN guard: no NaN after 10K ticks, force clamp: max force ≤ 50.0)
- [ ] T038 — Write `tests/e2e/simulation.test.js` (Playwright: load page → particles move → toggle law → save preset → reload → verify)

---

## Phase 8: Documentation

**Goal**: All SSOT docs synchronized with code.
**Independent Test**: `python3 .tests/validate_engine.py` passes (SSOT alignment + law coverage).

### Documentation Tasks

- [ ] T039 — Write `CHANGELOG.md` (v3.0.0 initial entry)
- [ ] T040 — Write `ENGINE_SSOT.md` (law tables, DNA parameter tables, stride layout)
- [ ] T041 — Write `README.md` (v3-specific quick-start)
- [ ] T042 — Write `GUIDE.md` (emergent behavior recipes for v3)
- [ ] T043 — Write `docs/fullaudit.md` (system audit — all 42 traits + 28 world params)
- [ ] T044 — Write `docs/lawaudit.md` (comprehensive law audit — all 64 laws with code proof)
- [ ] T045 — Write HELP_DB entries in constants.js (4-tier: HINT, EXPLANATION, SYSTEM, ADVANCED — one per law)

---

## Dependency Graph

```
Phase 1 ─────────────────────────────────────────────┐
  └─→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ─┤
                    Phase 6 (parallel with Phase 5) ─┤
                      Phase 7 (parallel with all) ──┤
                        Phase 8 (final pass) ←──────┘
```

T001–T011 must be completed before anything else.
T012–T016 depend on T005–T011.
T017–T019 depend on T012–T016.
T020–T025 depend on T017–T019.
T026–T030 depend on T020–T025.
T031–T032 can start after T020 (needs UI wiring).
T033–T038 should be written alongside their respective phases.
T039–T045 are the final pass.
