# Checklist: VEPA v3 Simulation Requirements Quality

**Generated**: 2026-07-17
**Scope**: Core simulation — physics engine, DNA system, law system, rendering, persistence
**Audience**: Spec author + implementation reviewer

---

## Requirement Completeness

- [ ] CHK001 — Are the exact particle stride layout and all 100 float offsets specified with named constants? [Spec §FR-001, Constitution §II]
- [ ] CHK002 — Are all 42 DNA parameters enumerated with their index, range, and functional group? [Spec §FR-006, Constitution §DNA Parameter System]
- [ ] CHK003 — Are all 64 laws enumerated with their index, category, and multi-state tiers (if applicable)? [Spec §FR-010–FR-012]
- [ ] CHK004 — Is the message protocol between Worker and main thread specified (message types, envelope format, sync cadence)? [Spec §FR-001, §FR-014]
- [ ] CHK005 — Are default species profiles (PRIME_DEFAULT and alternatives) specified with concrete DNA values? [Spec §User Story 5]
- [ ] CHK006 — Are all 8 intelligence engines specified with their trigger conditions and output format? [Spec §FR-021–FR-023, Constitution §VIII]

## Requirement Clarity

- [ ] CHK007 — Is "O(N²) with spatial hashing" quantified — grid resolution, max cell capacity, neighborhood size? [Spec §FR-001, Constitution §IV]
- [ ] CHK008 — Is "deterministic replay" defined with measurable criteria (same seed + same config → identical state after N ticks)? [Spec §SC-003]
- [ ] CHK009 — Are "toroidal world boundaries" explicitly defined (wrap modes: hard, soft, portal, infinite)? [Spec §FR-003, §User Story 3]
- [ ] CHK010 — Is "phenotype expression" specified with formulas for color, radius, and alpha derivation from DNA? [Spec §FR-007]
- [ ] CHK011 — Is "computed law synergy" defined — which law properties drive synergy values and the combination formula? [Spec §FR-013, Clarification §Q3]

## Requirement Consistency

- [ ] CHK012 — Do the 5 law categories (Physics, Biology, Chemistry, Thermodynamics, Metaphysics) have consistent bit ranges and UI color mappings? [Spec §FR-011, Constitution §III]
- [ ] CHK013 — Does the particle limit (soft 5K / hard 50K) align with the max cell capacity (100) × grid cells (1728)? [Spec §FR-016, Constitution §IV]
- [ ] CHK014 — Does the max sub-steps (10) × max interactions (500) produce a bounded compute budget per frame? [Spec §FR-005]
- [ ] CHK015 — Does the IndexedDB persistence schema match the full particle buffer layout for state captures? [Spec §FR-019, Clarification §Q4]

## Acceptance Criteria Quality

- [ ] CHK016 — Can "SC-001: 60fps at 5,000 particles" be measured with specific tooling (e.g., FPS counter in HUD)? [Spec §SC-001]
- [ ] CHK017 — Can "SC-003: deterministic replay" be verified by seeding the PRNG and comparing buffer hashes? [Spec §SC-003]
- [ ] CHK018 — Can "IT-006: Stability — 10,000 ticks with no NaN" be automated as a CI gate? [Spec §IT-006]
- [ ] CHK019 — Is "law produces observable behavioral change" testable for all 64 laws, not just a handful? [Spec §SC-004]

## Scenario Coverage

- [ ] CHK020 — Is the "empty world" scenario specified — what happens when all particles die? [Spec §Edge Cases]
- [ ] CHK021 — Is the "SharedArrayBuffer unavailable" fallback specified? [Spec §Edge Cases]
- [ ] CHK022 — Is the "browser tab hidden" behavior specified (pause physics? throttle?) [Spec §Edge Cases]
- [ ] CHK023 — Is the "50K particle degradation" mode specified (graceful FPS drop vs hard cap)? [Spec §Edge Cases]
- [ ] CHK024 — Is the "law index out of range" behavior specified? [Spec §Edge Cases]

## Dependencies & Assumptions

- [ ] CHK025 — Are COOP/COEP header requirements documented for SharedArrayBuffer? [Spec §Constraints]
- [ ] CHK026 — Is the browser compatibility matrix specified (Chrome, Firefox, Safari, Edge + versions)? [Spec §Target Platform]
- [ ] CHK027 — Is the SplitMix32 seed initialization strategy documented (user-supplied? time-based? fixed default?) [Spec §FR-023, Constitution §II]

## Ambiguities & Gaps

- [ ] CHK028 — Worker bundling strategy not specified (inline blob URL vs separate file) [Plan §Open Questions]
- [ ] CHK029 — Z-ordering / overlap resolution for particle sprites not specified [Plan §Open Questions]
- [ ] CHK030 — Preset migration from v2 localStorage to v3 IndexedDB not specified [Plan §Open Questions]
