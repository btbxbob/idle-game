# src/ - Rust Game Logic

**Location**: `src/lib.rs` (~3000 lines, 38 tests)

## Overview
ALL core game logic in single Rust file. Compiled to WASM via wasm-bindgen.

## Structure
```
src/lib.rs
├── GameState struct         # Game state (Rc<RefCell>)
├── Statistics struct        # 9 metrics tracking
├── Achievement struct       # 13 achievements, 5 categories
├── CraftingRecipe struct    # 6 bidirectional recipes
├── UnlockedFeature struct   # 5 progressive unlocks
├── Worker struct            # 5 types, levels, XP, efficiency
├── IdleGame impl            # Main game logic
└── #[cfg(test)] tests      # 38 unit tests
```

## WHERE TO LOOK
| Task | Location | Line Range |
|------|----------|------------|
| Add game mechanic | `lib.rs` | Core logic section |
| Add WASM export | `lib.rs` + `#[wasm_bindgen]` | Export section |
| Add test | `lib.rs` `#[cfg(test)]` | ~line 2300+ |
| Fix borrow error | `lib.rs` | Check `RefCell` scopes |

## ANTI-PATTERNS (CRITICAL)
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

### WASM Exports
```rust
// ❌ FORBIDDEN - Vec<T> direct exposure
pub fn get_achievements(&self) -> Vec<Achievement>

// ✅ REQUIRED - skip for complex types
#[wasm_bindgen(skip)]
achievements: Vec<Achievement>

// ✅ OR provide wrapper function
#[wasm_bindgen]
pub fn get_achievement_count(&self) -> usize
```

## Key Patterns
### GameState Management
```rust
state: Rc<RefCell<GameState>>
```
- Use `Rc<RefCell<T>>` for shared mutable state
- Always borrow within scope blocks
- Release borrows before calling other methods

### WASM Exports Pattern
```rust
#[wasm_bindgen]
pub fn click_action(&mut self) {
    // 1. Update statistics (scope block)
    {
        let mut stats = self.statistics.borrow_mut();
        stats.total_clicks += 1;
    }
    
    // 2. Update game state (separate scope)
    {
        let mut state = self.state.borrow_mut();
        state.coins += earned;
    }
    
    // 3. Call other methods (all borrows released)
    self.check_achievement("...");
}
```

## Commands
```bash
# Run tests
cargo test

# Build WASM
wasm-pack build --target web --out-dir pkg --dev

# Check errors
cargo clippy
```

## Dependencies
- `wasm-bindgen` - WASM-JS interop
- `web-sys` - Web API bindings
- `serde` - Serialization
- `serde-wasm-bindgen` - Serde + WASM integration
