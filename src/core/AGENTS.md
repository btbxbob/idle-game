# src/core/ - IdleGame Core Logic

**Location**: `src/core/idle_game/` (split from idle_game.rs)

## Structure
```
src/core/idle_game/
├── mod.rs              # View structs, types, free functions, tests (661 lines)
├── helpers.rs          # Internal helper methods (1304 lines)
├── wasm_api/           # WASM API (split by function)
│   ├── mod.rs
│   ├── constructor.rs  # new() constructor (365 lines)
│   ├── actions.rs      # click, buy, build, housing, resources (385 lines)
│   ├── queries.rs      # get_workers, get_buildings, event logs (675 lines)
│   ├── simulation.rs   # game_loop, production, population (583 lines)
│   └── progression.rs  # unlocks, achievements, prestige (299 lines)
└── wasm_persistence.rs # save/load, tech tree APIs (333 lines)
```

## Overview
IdleGame struct + core game operations (10 systems: resources, workers, tech, housing, decay, prestige).

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Click action logic | `wasm_api/actions.rs` `click_action()` |
| Purchase upgrade | `wasm_api/actions.rs` `buy_building()` |
| Purchase building | `wasm_api/actions.rs` `buy_building()` |
| Resource crafting | `wasm_persistence.rs` `craft_resource()` |
| Game loop tick | `wasm_api/simulation.rs` `game_loop()` |
| Achievement check | `wasm_api/progression.rs` `check_achievement()` |
| Spawn worker | `wasm_api/simulation.rs` `try_spawn_worker()` |
| Kill worker | `wasm_api/simulation.rs` (in game_loop) |
| Corpse decay | `wasm_api/simulation.rs` (in game_loop) |
| Research tech | `wasm_persistence.rs` `research_technology()` |
| Housing capacity | `wasm_api/actions.rs` `build_housing()` |
| Population growth | `wasm_api/simulation.rs` `process_housing_queue()` |
| Prestige reset | `wasm_api/progression.rs` `do_prestige()` |
| Save/Load game | `wasm_persistence.rs` |
| Worker details | `wasm_api/queries.rs` `get_workers()` |
| Building info | `wasm_api/queries.rs` `get_buildings()` |

## ANTI-PATTERNS (CRITICAL)
### Borrow Scopes - MUST FOLLOW
```rust
// FORBIDDEN - borrow across method calls
let state = self.state.borrow();
if state.coins >= cost {
    self.check_achievement(); // PANIC: state still borrowed
}

// REQUIRED - explicit drop before method calls
let state = self.state.borrow();
if state.coins >= cost {
    drop(state); // or use scope block { }
    self.check_achievement(); // OK
}
```

### Key Rules
- Never hold borrow across `self.method()` calls
- Use `drop(borrow)` or scope blocks `{ }` explicitly
- Borrow order: statistics → state (never reverse in same scope)
- All borrows released before `update_*` calls

## UNIQUE PATTERNS
### Rc<RefCell<T>> State Management
```rust
pub struct IdleGame {
    state: Rc<RefCell<GameState>>,
    statistics: Rc<RefCell<Statistics>>,
    upgrades: Vec<Upgrade>,        // Direct Vec (skip WASM export)
    #[wasm_bindgen(skip)]
    achievements: Vec<Achievement>, // Internal only
}
```

### Method Call Sequence
```rust
// 1. Check cost (immutable borrow)
let state = self.state.borrow();
if state.coins >= cost {
    drop(state);
    
    // 2. Update state (mutable borrow)
    let mut state = self.state.borrow_mut();
    state.coins -= cost;
    drop(state);
    
    // 3. Update statistics (separate borrow)
    let mut stats = self.statistics.borrow_mut();
    stats.purchases += 1;
    drop(stats);
    
    // 4. Check achievements (no borrows held)
    self.check_achievement("...");
    
    // 5. Trigger UI updates (callbacks to JS)
    self.update_resources_only();
}
```

### WASM Export Boundaries
```rust
// Exported to JS
#[wasm_bindgen]
pub fn click_action(&mut self) { }

// Internal helper (not exported)
fn check_achievement(&mut self, id: &str) { }

// Skipped complex types
#[wasm_bindgen(skip)]
achievements: Vec<Achievement>
```

## Commands
```bash
# Run tests (tests in parent lib.rs)
cargo test

# Check borrow errors
cargo clippy -- -W clippy::borrow_interior_mutable
```
