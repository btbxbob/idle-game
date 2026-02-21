# src/core/ - IdleGame Core Logic

**Location**: `src/core/idle_game.rs` (~1400 lines)

## Overview
IdleGame struct + core game operations (click, buy, craft, game_loop).

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Click action logic | `idle_game.rs` `click_action()` |
| Purchase upgrade | `idle_game.rs` `buy_upgrade()` |
| Purchase building | `idle_game.rs` `buy_building()` |
| Resource crafting | `idle_game.rs` `craft_resource()` |
| Game loop tick | `idle_game.rs` `game_loop()` |
| Achievement check | `idle_game.rs` `check_achievement()` |

## ANTI-PATTERNS (CRITICAL)
### Borrow Scopes - MUST FOLLOW
```rust
// ❌ FORBIDDEN - borrow across method calls
let state = self.state.borrow();
if state.coins >= cost {
    self.check_achievement(); // PANIC: state still borrowed
}

// ✅ REQUIRED - explicit drop before method calls
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
// ✅ Exported to JS
#[wasm_bindgen]
pub fn click_action(&mut self) { }

// ✅ Internal helper (not exported)
fn check_achievement(&mut self, id: &str) { }

// ✅ Skipped complex types
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
