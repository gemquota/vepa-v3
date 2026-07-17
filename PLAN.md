# Implementation Plan: VEPA v3 — Vector Emergent Physics Automata

**Branch**: `v3-recreation` | **Date**: 2026-07-17 | **Spec**: `v3/SPEC.md`

## Summary

VEPA v3 is a clean-slate recreation of the emergent physics simulation in a modular,
testable architecture. Physics runs in a Web Worker via SharedArrayBuffer, rendering
via PixiJS 8.x on the main thread, with intelligence engines (Narrative Consciousness,
Insight, Goal, Personality, etc.) communicating through an EventBus. The 42-parameter
DNA system and 64-law bitmask are preserved from v2 but with explicit boundaries,
validated ranges, and computed law synergies.

## Architectural Vision

1. **Physics Worker Layer**: Dedicated Web Worker owns the SharedArrayBuffer. Runs
   O(N²) spatial-hash-optimized physics at up to 10 sub-steps/frame. Reads law state
   and DNA configuration via postMessage config pushes — never reads from DOM or UI.
   All forces clamped to ±50.0 with NaN guards at every sub-step.

2. **Render Layer**: PixiJS 8.x on the main thread. Reads particle data from the
   shared Float32Array buffer. Updates sprite positions, colors, alpha, and radius
   each frame. Zero knowledge of law state or DNA — purely visual.

3. **DNA & Species System**: Separate Uint16Array buffer [64 species × 64 params].
   42 active parameters in 6 functional groups. Range-validated through DNA_RANGES.
   Phenotype expression (color, radius, alpha) derived each frame from DNA + state.

4. **Law System**: 64-law bitmask (lowFlags + highFlags) with 5 categories. Multi-state
   laws (Wrap, Harmony, Reproduction) have 2-4 tiers. Law synergies computed from
   category/type properties at runtime — not a declarative matrix.

5. **Intelligence Layer**: 8+ engines communicating exclusively via EventBus
   (pub/sub). Insight Engine clusters particles spatially. Narrative Consciousness
   generates multi-voice commentary. Goal Engine auto-tunes parameters. Each engine
   is independently testable.

6. **Persistence**: IndexedDB for preset save/load, state snapshots, and full
   simulation captures.

7. **Module Loading**: Vite-bundled async chunks — app shell loads subsystems
   on demand. Code-split by concern (physics, render, intelligence, UI).

## Technical Context

**Language/Version**: JavaScript (ESM), Node.js 20+ for tooling  
**Primary Dependencies**: pixi.js ^8.18.1, vite ^8.0.8  
**Storage**: IndexedDB (via idb wrapper or raw API)  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge — with SharedArrayBuffer support)  
**Project Type**: Single-page browser application (async chunk loading)  
**Performance Goals**: 60fps at 5,000 particles, physics tick <8ms  
**Constraints**: SharedArrayBuffer requires COOP/COEP headers; max 50K particles; deterministic from seed  
**Scale/Scope**: 64 species, 42 DNA params, 64 laws, ~8 intelligence engines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Flat buffer ECS architecture with SharedArrayBuffer
- ✅ NaN/Infinity guards at every physics sub-step
- ✅ All buffer accesses use `STRIDE * index + offset`
- ✅ Never hardcode law indices — always LAW_INDEXES constants
- ✅ Law synergies computed (not hardcoded strings)
- ✅ Intelligence engines communicate via EventBus only
- ✅ No Math.random() in simulation — SplitMix32 PRNG
- ✅ SSOT documentation sync required for all changes

## Project Structure

```
v3/
├── index.html                    # App shell entry point
├── package.json                  # V3-scoped dependencies
├── vite.config.js                # Vite config with COOP/COEP + code splitting
│
├── src/
│   ├── main.js                   # App orchestrator — boot, init, render loop
│   ├── constants.js              # All constants, STRIDE, LAW_INDEXES, DNA_INDEXES, DNA_RANGES
│   ├── core/
│   │   ├── eventBus.js            # Pub/sub EventBus
│   │   └── prng.js               # SplitMix32 deterministic PRNG
│   │
│   ├── physics/
│   │   ├── worker.js              # Web Worker entry + message handler
│   │   ├── engine.js              # Physics tick orchestrator (sub-steps, grid)
│   │   ├── spatialGrid.js         # 12×12×12 spatial hash grid
│   │   ├── forces.js              # Force computation per law
│   │   ├── laws.js                # Law bitmask logic + synergy computation
│   │   └── dna.js                 # DNA parameter access from buffer
│   │
│   ├── render/
│   │   ├── renderer.js            # PixiJS app setup + sprite pool
│   │   ├── spriteUpdater.js       # Per-frame sync from buffer to sprites
│   │   └── phenoType.js           # DNA→phenotype expression (color, radius, alpha)
│   │
│   ├── species/
│   │   ├── dnaBuffer.js           # Uint16Array DNA buffer [64×64]
│   │   └── speciesManager.js      # Species CRUD, preset profiles
│   │
│   ├── laws/
│   │   ├── lawManager.js          # Law state, bitmask computation
│   │   └── synergyEngine.js       # Computed law synergies from categories
│   │
│   ├── intelligence/
│   │   ├── insightEngine.js       # Cluster detection & pattern logging
│   │   ├── narrativeConsciousness.js  # Multi-voice monologue
│   │   ├── goalEngine.js          # Auto-tuning world constraints
│   │   ├── personalityEngine.js   # Systemic bias (Curiosity, Stability, Chaos)
│   │   ├── lineageTracker.js      # Evolutionary genealogy
│   │   ├── timelineEngine.js      # History recording & playback
│   │   └── emergentParamEngine.js # Emergent parameter discovery
│   │
│   ├── persistence/
│   │   └── store.js               # IndexedDB persistence layer
│   │
│   └── ui/
│       ├── ui.js                  # Main UI builder (law toggles, DNA sliders, HUD)
│       ├── presets.js             # Preset management (defaults + custom)
│       └── hud.js                 # FPS, particle count, tick time display
│
├── tests/
│   ├── unit/
│   │   ├── physics.test.js        # Physics engine tests (forces, grid)
│   │   ├── dna.test.js            # DNA buffer read/write/validation
│   │   ├── laws.test.js           # Law bitmask, synergies
│   │   └── prng.test.js           # Deterministic PRNG tests
│   ├── integration/
│   │   └── simulation.test.js     # Full simulation lifecycle
│   └── e2e/
│       └── smoke.spec.js          # Playwright smoke test
│
├── SPEC.md                        # This feature specification
└── PLAN.md                        # This implementation plan
```

## Implementation Phases

### Phase 1: Foundation (Core Data Layer)
1. Scaffold v3 project — package.json, vite.config.js, index.html shell
2. Implement `constants.js` — STRIDE, LAW_INDEXES, DNA_INDEXES, DNA_RANGES
3. Implement `core/eventBus.js` + `core/prng.js` (SplitMix32)
4. Implement `physics/spatialGrid.js` — 12×12×12 hash grid with toroidal mapping
5. Implement `physics/dna.js` — DNA parameter access helpers
6. Implement `species/dnaBuffer.js` — Uint16Array species DNA store
7. Implement `physics/worker.js` — Web Worker shell with message protocol

### Phase 2: Physics Engine
1. Implement `physics/laws.js` — bitmask logic + synergy computation
2. Implement `physics/forces.js` — all force types (gravity, drag, collision, etc.)
3. Implement `physics/engine.js` — tick orchestrator, sub-step loop, spatial queries
4. Wire worker message protocol — config pushes, state reads, sync
5. NaN guards, force clamping, max interactions throttle

### Phase 3: Rendering
1. Implement `render/renderer.js` — PixiJS app, sprite pool managed
2. Implement `render/spriteUpdater.js` — per-frame buffer→sprite sync
3. Implement `render/phenoType.js` — DNA→color/radius/alpha expression
4. Implement `laws/lawManager.js` — law state + bitmask on main thread
5. Implement `species/speciesManager.js` — species CRUD, default profiles
6. Implement `main.js` — boot sequence, render loop, worker init

### Phase 4: UI Layer
1. Implement `ui/ui.js` — law toggles, DNA sliders, preset panel, category groups
2. Implement `ui/hud.js` — FPS counter, particle count, tick stats
3. Implement `ui/presets.js` — default presets (PRIME_DEFAULT, VOID_CORE, etc.)
4. Implement `persistence/store.js` — IndexedDB save/load

### Phase 5: Intelligence Engines
1. Implement `intelligence/insightEngine.js` — cluster detection
2. Implement `intelligence/narrativeConsciousness.js` — multi-voice engine
3. Implement `intelligence/goalEngine.js` — world constraint tuning
4. Implement `intelligence/personalityEngine.js` — systemic bias
5. Implement `intelligence/lineageTracker.js` — genealogy
6. Implement `intelligence/timelineEngine.js` — history recording
7. Implement `intelligence/emergentParamEngine.js` — param discovery

### Phase 6: Testing & Polish
1. Unit tests — physics, DNA, laws, PRNG (Vitest)
2. Integration tests — full simulation lifecycle
3. E2E tests — Playwright smoke test (page loads, sim runs)
4. SSOT documentation update
5. Build optimization and final validation

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | PixiJS 8.x only | GPU-accelerated, simpler than dual-path |
| Build | Modular async chunks | Subsystems loaded on demand, smaller initial bundle |
| Synergies | Computed function | Emergent from law properties, no maintenance burden |
| Persistence | IndexedDB | Handles large state dumps (50K particles) |
| Testing | Vitest + Playwright | Unit isolation + browser-level E2E coverage |
| PRNG | SplitMix32 | Deterministic, seeded randomness for simulation |
| Law bits | 64-bit (low+high flags) | Matches 64-law system, efficient bitwise ops |

## Open Questions

- Worker bundling strategy — inline blob URL vs separate file?
- Particle limit UI feedback at 5K / 10K / 50K thresholds?
- Z-ordering approach for overlapping particle sprites?
- Preset migration path from v2 localStorage to v3 IndexedDB?
