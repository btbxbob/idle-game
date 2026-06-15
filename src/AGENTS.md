# src/ - Rust Game Logic

**Location**: `src/` directory
**Structure**: Core orchestrator + state/entities/systems modules with WASM exports in `lib.rs`

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add game mechanic | `core/idle_game/` | Split into wasm_api/, helpers.rs, wasm_persistence.rs |
| Add state field | `state/game_state.rs` | Add `#[serde(default)]` |
| Add entity | `entities/` | Building/Worker/Technology/Population |
| Add system logic | `systems/` | 10 system modules (event/ and event_data/ are directories) |
| Add Rust UI callback | `ui/callbacks.rs` | Keep callback layer thin and JS-friendly |
| Add test | `test_utils/` | TestGameState + balance tests |
| Fix borrow error | `core/idle_game/` | Check `RefCell` scopes |

## Module Structure

```
src/
├── lib.rs                    # Entry point (21 lines)
├── core/
│   ├── idle_game/            # Split into submodules
│   │   ├── mod.rs            # View structs, types, free functions
│   │   ├── helpers.rs        # Internal helper methods
│   │   ├── wasm_api/         # WASM API split by function
│   │   │   ├── constructor.rs
│   │   │   ├── actions.rs
│   │   │   ├── queries.rs
│   │   │   ├── simulation.rs
│   │   │   └── progression.rs
│   │   └── wasm_persistence.rs
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
│   ├── event/                # Event system (split)
│   │   ├── mod.rs
│   │   ├── effects.rs
│   │   └── compose/          # Event composition (split)
│   │       ├── mod.rs
│   │       ├── styles.rs
│   │       ├── templates.rs
│   │       └── render.rs
│   ├── event_data/           # Event data (split)
│   │   ├── mod.rs
│   │   ├── stages.rs
│   │   ├── voice_zh.rs
│   │   └── voice_en.rs
│   └── mod.rs
├── utils/
│   ├── name_generator.rs     # Worker names
│   ├── worker_generator.rs   # Worker traits/hobbies
│   └── mod.rs
├── ui/
│   ├── callbacks.rs          # update_* functions
│   └── mod.rs
└── test_utils/
    ├── test_game_state.rs    # Core tests
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
