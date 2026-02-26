# src/ - Rust Game Logic (Phase 2)

**Location**: `src/` directory (33 files, ~7000 lines, 109 tests)
**Structure**: Phase 2 complete - technology, decay, prestige, housing, population systems

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add game mechanic | `core/idle_game.rs` | Core logic, ~1700 lines |
| Add state field | `state/game_state.rs` | Add `#[serde(default)]` |
| Add entity | `entities/` | Building/Worker/Technology/Population |
| Add system logic | `systems/` | 10 system modules |
| Add test | `test_utils/` | TestGameState + balance tests |
| Fix borrow error | `core/idle_game.rs` | Check `RefCell` scopes |

## Module Structure

```
src/
├── lib.rs                    # Entry point (21 lines)
├── core/
│   ├── idle_game.rs          # IdleGame struct + main operations
│   └── mod.rs
├── state/
│   ├── game_state.rs         # GameState (save/load)
│   ├── statistics.rs         # Statistics (9 metrics)
│   ├── resource.rs           # 60+ ResourceType variants
│   ├── job_stats.rs          # Per-worker job statistics
│   ├── work_stats.rs         # Work tracking
│   └── mod.rs
├── entities/
│   ├── building.rs           # Building definitions
│   ├── worker.rs             # Worker (gender/hobbies/traits/XP)
│   ├── upgrade.rs            # Upgrade definitions
│   ├── technology.rs         # Technology tree nodes
│   ├── automation.rs         # Automation buildings
│   ├── population_queue.rs   # Housing queue system
│   └── mod.rs
├── systems/
│   ├── achievement.rs        # 13 achievements, 5 categories
│   ├── crafting.rs           # 6+ bidirectional recipes
│   ├── production.rs         # Per-resource production
│   ├── unlock.rs             # 5 progressive unlocks
│   ├── decay.rs              # Corpse decay system
│   ├── technology.rs         # Tech tree processing
│   ├── prestige.rs           # Reset-for-bonus
│   ├── population.rs         # Housing/population logic
│   └── mod.rs
├── utils/
│   ├── name_generator.rs     # Worker names
│   ├── worker_generator.rs   # Worker traits/hobbies
│   └── mod.rs
├── ui/
│   ├── callbacks.rs          # update_* functions
│   └── mod.rs
└── test_utils/
    ├── test_game_state.rs    # Core tests (109 total)
    ├── balance_test.rs       # Balance validation
    └── mod.rs
```

## rand 0.10 API

```rust
use rand::RngExt;  // Required for random_range

// OLD: rng.gen_range(1..10)
// NEW: rng.random_range(1..10)

// OLD: slice.choose_multiple(&mut rng, n)
// NEW: slice.sample(&mut rng, n)  // requires IndexedRandom
```

## Anti-Patterns

See root `AGENTS.md` for borrow rules and WASM export patterns.
