# src/systems/ - Game Systems
**Location**: src/systems/ (9 files including mod.rs)

## Structure
```
src/systems/
├── mod.rs              # Module exports (12 lines)
├── achievement.rs      # 13 achievements, 5 categories
├── crafting.rs         # 6+ bidirectional recipes, multi-resource
├── production.rs       # Per-resource production, worker bonuses
├── unlock.rs           # 5 progressive features
├── decay.rs            # Corpse decay system (134 lines)
├── technology.rs       # Technology tree (151 lines)
├── prestige.rs         # Reset-for-bonus system (91 lines)
└── population.rs       # Population growth/death cycle (290 lines)
```

## Systems Reference
1. **achievement.rs** — 13 achievements, 5 categories, `check_progress()` returns bool
2. **crafting.rs** (636 lines) — 6+ bidirectional recipes, 100:10:1 ratio, multi-resource
3. **production.rs** (468 lines) — Per-resource production, worker bonuses, XP system
4. **unlock.rs** — 5 progressive features, threshold checks
5. **decay.rs** — Corpse decay: `CORPSE_DECAY_TIME_SECONDS` (300s), 20 maggots/corpse
6. **technology.rs** — TechnologyTree with `can_research()`, `research()`, `apply_effect()`
7. **prestige.rs** — Reset-for-bonus: `calculate_pp_on_rebirth()` based on resources + techs
8. **population.rs** — Food consumption, starvation, death cycle management

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Add achievement | `achievement.rs` `get_default_achievements()` |
| Add crafting recipe | `crafting.rs` `get_default_recipes()` |
| Modify production formula | `production.rs` `update_production()` |
| Add unlock feature | `unlock.rs` `get_default_features()` |
| Adjust decay timing | `decay.rs` `CORPSE_DECAY_TIME_SECONDS` constant |
| Add technology | `technology.rs` `get_all_technologies()` |
| Modify prestige calculation | `prestige.rs` `calculate_pp_on_rebirth()` |
| Change food/starvation | `population.rs` `FOOD_CONSUMPTION_INTERVAL` |

## Key Pattern: Pure Functions
Extract data first, then call system functions. No RefCell inside systems.
```rust
// CORRECT - release borrow before calling
let (buildings, workers) = {
    let state = self.state.borrow();
    (state.buildings.clone(), state.workers.clone())
}; // released
let production = production::update_production(&buildings, &workers);
```

## Anti-Patterns
- **DON'T** hold borrows across system calls
- **DON'T** expose Vec<T> directly to WASM
- Systems are pure functions with explicit inputs/outputs
