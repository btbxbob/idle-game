# src/ - Rust Game Logic (Modular)

**Location**: `src/` directory (19 files, ~1800 lines, 38 tests)
**Structure**: Modular - recently refactored from single 2983-line file

## Overview
Modular Rust game logic. Compiled to WASM via wasm-bindgen. **Recently split** from monolithic lib.rs into organized modules.

## WHERE TO LOOK (UPDATED)
| Task | Location | Notes |
|------|----------|-------|
| Add game mechanic | `core/idle_game.rs` | Core logic |
| Add state field | `state/game_state.rs` | Pure data |
| Add entity | `entities/` | Building/Upgrade/Worker |
| Add system logic | `systems/` | Achievement/Crafting/etc |
| Add WASM export | `core/idle_game.rs` + `#[wasm_bindgen]` | Export section |
| Add test | `test_utils/test_game_state.rs` | `#[cfg(test)]` |
| Fix borrow error | `core/idle_game.rs` | Check `RefCell` scopes |

## Module Structure
```
src/
├── lib.rs                    # Entry point (19 lines, re-exports only)
├── core/                     # Core game logic
│   ├── idle_game.rs          # IdleGame struct + main operations
│   └── mod.rs
├── state/                    # Pure data structures
│   ├── game_state.rs         # GameState
│   ├── statistics.rs         # Statistics (9 metrics)
│   └── mod.rs
├── entities/                 # Game entities (pure data)
│   ├── upgrade.rs            # Upgrade
│   ├── building.rs           # Building
│   ├── worker.rs             # Worker (levels, XP)
│   └── mod.rs
├── systems/                  # Business logic
│   ├── achievement.rs        # 13 achievements
│   ├── crafting.rs           # 6 recipes
│   ├── unlock.rs             # 5 unlocks
│   ├── production.rs         # Production calculation
│   └── mod.rs
├── ui/                       # WASM-JS callbacks
│   ├── callbacks.rs          # update_* functions
│   └── mod.rs
└── test_utils/               # Testing (no WASM deps)
    ├── test_game_state.rs    # TestGameState + 38 tests
    └── mod.rs
```

## ANTI-PATTERNS (CRITICAL) - Unchanged from monolithic
### Rust Borrowing - MUST FOLLOW
```rust
// ❌ FORBIDDEN - borrow conflict
let state = self.state.borrow();
let stats = self.statistics.borrow();
self.check_achievement(); // PANIC!

// ✅ REQUIRED - use scope blocks
{
    let state = self.state.borrow();
    let value = state.coins;
} // released BEFORE next call
self.check_achievement(); // OK
```

**Key Rules**:
- Never hold `RefCell` borrows across method calls
- Never borrow `state` and `statistics` simultaneously
- ALWAYS use scope blocks `{ }` to release borrows
- Drop borrows before calling other methods

### WASM Exports - Unchanged
```rust
// ❌ FORBIDDEN - Vec<T> direct exposure
pub fn get_achievements(&self) -> Vec<Achievement>

// ✅ REQUIRED - skip for complex types
#[wasm_bindgen(skip)]
achievements: Vec<Achievement>
```
