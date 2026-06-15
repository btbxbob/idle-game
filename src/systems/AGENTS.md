# src/systems/ - Game Systems
**Location**: src/systems/ (includes event/ and event_data/ directories)

## Structure
```
src/systems/
├── mod.rs              # Module exports
├── achievement.rs      # 13 achievements, 5 categories
├── production.rs       # Per-resource production, worker bonuses
├── unlock.rs           # 5 progressive features
├── decay.rs            # Corpse decay system
├── technology.rs       # Technology tree
├── prestige.rs         # Reset-for-bonus system
├── population.rs       # Population growth/death cycle
├── stage.rs            # Stage progression logic
├── event/              # Event system (split from event.rs)
│   ├── mod.rs          # Core event logic
│   ├── effects.rs      # Event effects application
│   └── compose/        # Event composition (split from compose.rs)
│       ├── mod.rs
│       ├── styles.rs   # News style detection and formatting
│       ├── templates.rs # Full template rendering
│       └── render.rs   # Event entry rendering
└── event_data/         # Event data (split from event_data.rs)
    ├── mod.rs          # Types, constants, accessors
    ├── stages.rs       # Stage subjects and tech topics
    ├── voice_zh.rs     # Chinese voice pack
    └── voice_en.rs     # English voice pack
```

## Systems Reference
1. **achievement.rs** — 13 achievements, 5 categories, `check_progress()` returns bool
2. **production.rs** (548 lines) — Per-resource production, worker bonuses, XP system
3. **unlock.rs** — 5 progressive features, threshold checks
4. **decay.rs** — Corpse decay: `CORPSE_DECAY_TIME_SECONDS` (300s), 20 maggots/corpse
5. **technology.rs** (1365 lines) — TechnologyTree with `can_research()`, `research()`, `apply_effect()`
6. **prestige.rs** — Reset-for-bonus: `calculate_pp_on_rebirth()` based on resources + techs
7. **population.rs** — Food consumption, starvation, death cycle management
8. **stage.rs** (694 lines) — Stage progression logic

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Add achievement | `achievement.rs` `get_default_achievements()` |
| Modify production formula | `production.rs` `update_production()` |
| Add unlock feature | `unlock.rs` `get_default_features()` |
| Adjust decay timing | `decay.rs` `CORPSE_DECAY_TIME_SECONDS` constant |
| Add technology | `technology.rs` `get_all_technologies()` |
| Modify prestige calculation | `prestige.rs` `calculate_pp_on_rebirth()` |
| Change food/starvation | `population.rs` `FOOD_CONSUMPTION_INTERVAL` |
| Add/modify stage | `stage.rs` stage progression logic |

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
