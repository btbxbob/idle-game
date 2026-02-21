# src/systems/ - Game Systems

**Location**: `src/systems/` (4 modules)

## Overview
Modular game system implementations separated from main `lib.rs`. Each module handles a specific game mechanic with clean interfaces and no WASM dependencies.

## Structure
```
src/systems/
├── mod.rs              # Module exports
├── achievement.rs      # Achievement tracking (13 achievements, 5 categories)
├── crafting.rs         # Recipe system (6 bidirectional recipes)
├── production.rs       # Production calculation with worker bonuses
└── unlock.rs           # Progressive feature unlocking (5 features)
```

## Module Responsibilities

### achievement.rs
**Purpose**: Achievement data structure and progress tracking

**Key Types**:
```rust
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub unlocked: bool,
    pub unlock_timestamp: Option<f64>,
    pub progress: f64,
    pub requirement: f64,
    pub category: String,
}
```

**Categories** (5):
- `clicks` - Click-based achievements
- `resources` - Resource accumulation (coins, wood, stone)
- `buildings` - Building ownership milestones
- `crafting` - Resource crafting milestones
- `unlocks` - Achievement count milestones

**Key Methods**:
```rust
impl Achievement {
    /// Check and update achievement progress
    /// Returns true if achievement was unlocked this call
    pub fn check_progress(
        &mut self,
        total_clicks: f64,
        coins: f64,
        wood: f64,
        stone: f64,
        buildings_purchased: f64,
        total_resources_crafted: f64,
        achievements_unlocked_count: f64,
    ) -> bool
}
```

**WHERE TO LOOK**:
| Task | Location |
|------|----------|
| Add new achievement | `achievement.rs` `get_default_achievements()` |
| Add new category | `achievement.rs` `check_progress()` match arms |
| Modify progress logic | `achievement.rs` `check_progress()` |

---

### crafting.rs
**Purpose**: Recipe definitions for resource conversion

**Key Types**:
```rust
pub struct CraftingRecipe {
    pub id: String,
    pub name: String,
    pub input_resource: String,
    pub input_amount: f64,
    pub output_resource: String,
    pub output_amount: f64,
    pub unlocked: bool,
}
```

**Default Recipes** (6 bidirectional, 100:10:1 ratio):
1. `coins_to_wood` - 100 coins → 10 wood
2. `wood_to_coins` - 10 wood → 100 coins
3. `coins_to_stone` - 100 coins → 1 stone
4. `stone_to_coins` - 1 stone → 100 coins
5. `wood_to_stone` - 10 wood → 1 stone
6. `stone_to_wood` - 1 stone → 10 wood

**Key Methods**:
```rust
impl CraftingRecipe {
    pub fn get_default_recipes() -> Vec<CraftingRecipe>
}
```

**WHERE TO LOOK**:
| Task | Location |
|------|----------|
| Add new recipe | `crafting.rs` `get_default_recipes()` |
| Change exchange rate | `crafting.rs` recipe definitions |
| Add crafting validation | Call from `lib.rs` crafting logic |

---

### production.rs
**Purpose**: Production calculation with worker bonuses and XP system

**Key Functions**:
```rust
/// Calculate worker bonus for a specific building
pub fn get_worker_bonus_for_building(
    workers: &[Worker],
    building_name: &str,
) -> f64

/// Update production rates based on buildings and worker bonuses
pub fn update_production(
    buildings: &[Building],
    upgrades: &[Upgrade],
    workers: &[Worker],
) -> (f64, f64, f64)  // (cps, wps, sps)

/// Grant XP to workers assigned to buildings
pub fn grant_worker_xp(
    workers: &mut [Worker],
    elapsed: f64,
)
```

**Production Formula**:
```
base_production = building.production_rate * building.count
worker_bonus = sum(worker.efficiency_multiplier - 1.0) for assigned workers
boosted_production = base_production * worker_bonus
```

**XP System**:
- XP gain: `10.0 * elapsed` per second
- Level up: When `xp >= xp_to_next_level`
- XP scaling: `xp_to_next_level *= 1.5` on level up
- Efficiency formula: `1.0 + preference_bonus(0.2) + level_bonus(level * 0.05)`

**WHERE TO LOOK**:
| Task | Location |
|------|----------|
| Add production modifier | `production.rs` `update_production()` |
| Change XP formula | `production.rs` `grant_worker_xp()` |
| Add worker bonus type | `production.rs` `get_worker_bonus_for_building()` |

---

### unlock.rs
**Purpose**: Progressive feature unlocking system

**Key Types**:
```rust
pub struct UnlockedFeature {
    pub id: String,
    pub name: String,
    pub feature_type: String,
    pub unlocked: bool,
    pub unlock_timestamp: Option<f64>,
    pub requirement_type: String,
    pub requirement_value: f64,
}
```

**Feature Types** (3):
- `achievement` - Tied to achievement completion
- `building` - Tied to building ownership count
- `system` - Tied to game milestone (resources, clicks, etc.)

**Default Features** (5):
1. `first_unlock` - 10 total clicks
2. `progress_master_5` - 50 total clicks
3. `unlock_building_1` - 5 buildings owned
4. `unlock_building_2` - 15 buildings owned
5. `unlock_crafting` - 500 total coins

**Key Methods**:
```rust
impl UnlockedFeature {
    pub fn get_default_features() -> Vec<UnlockedFeature>
}
```

**WHERE TO LOOK**:
| Task | Location |
|------|----------|
| Add new unlock | `unlock.rs` `get_default_features()` |
| Add feature type | `unlock.rs` + `lib.rs` unlock checking logic |
| Change requirement logic | `lib.rs` unlock checking functions |

---

## Anti-Patterns (CRITICAL)

### ❌ FORBIDDEN - Direct Vec exposure to WASM
```rust
// DON'T expose Vec<T> directly via wasm_bindgen
#[wasm_bindgen]
pub fn get_recipes(&self) -> Vec<CraftingRecipe> // PANIC risk
```

### ✅ REQUIRED - Use wrapper functions
```rust
// DO provide count/accessor functions
#[wasm_bindgen]
pub fn get_recipe_count(&self) -> usize {
    self.recipes.len()
}

#[wasm_bindgen]
pub fn get_recipe(&self, index: usize) -> Option<CraftingRecipeDTO> {
    self.recipes.get(index).map(|r| r.to_dto())
}
```

### ❌ FORBIDDEN - Holding borrows across system calls
```rust
// DON'T hold RefCell borrows when calling system functions
let state = self.state.borrow();
production::update_production(&state.buildings, ...); // Borrow still held!
self.check_achievement(); // PANIC: can't borrow again
```

### ✅ REQUIRED - Release borrows before system calls
```rust
// DO extract data first, then call system functions
let (buildings, workers) = {
    let state = self.state.borrow();
    (state.buildings.clone(), state.workers.clone())
}; // released
let production = production::update_production(&buildings, &workers);
```

---

## Key Patterns

### System Function Pattern (production.rs)
```rust
// Pure functions with explicit inputs/outputs
pub fn update_production(
    buildings: &[Building],
    upgrades: &[Upgrade],
    workers: &[Worker],
) -> (f64, f64, f64) {
    // No state mutation, no RefCell
    // Easy to test in isolation
}
```

### Achievement Check Pattern (achievement.rs)
```rust
// Returns bool for "unlocked this call"
pub fn check_progress(&mut self, ...) -> bool {
    if self.unlocked {
        return true; // Already unlocked
    }
    
    // Calculate progress based on category
    let current_value = match self.category.as_str() { ... };
    self.progress = current_value;
    
    if self.progress >= self.requirement {
        self.unlocked = true;
        self.unlock_timestamp = Some(js_sys::Date::now());
        return true; // Just unlocked!
    }
    
    false // Not unlocked
}
```

### Data-Only Struct Pattern (unlock.rs, crafting.rs)
```rust
// Simple data structures with serde derive
#[derive(Serialize, Deserialize, Clone)]
pub struct CraftingRecipe {
    pub id: String,
    // ... fields
}

// Static factory method for defaults
impl CraftingRecipe {
    pub fn get_default_recipes() -> Vec<CraftingRecipe> {
        vec![ /* recipe literals */ ]
    }
}
```

---

## Testing Guidelines

### Unit Tests (in lib.rs)
```rust
#[cfg(test)]
mod tests {
    use crate::systems::production::*;
    
    #[test]
    fn test_worker_bonus_calculation() {
        let workers = vec![ /* test workers */ ];
        let bonus = get_worker_bonus_for_building(&workers, "Coin Mine");
        assert!(bonus > 1.0);
    }
    
    #[test]
    fn test_achievement_progress() {
        let mut achievement = Achievement { ... };
        let just_unlocked = achievement.check_progress(100.0, ...);
        assert!(just_unlocked);
    }
}
```

### Test Coverage
- **production.rs**: Test bonus calculation, XP gain, level thresholds
- **achievement.rs**: Test each category, progress tracking, unlock detection
- **crafting.rs**: Test recipe validation, resource conversion
- **unlock.rs**: Test feature types, requirement checking

---

## Commands
```bash
# Run Rust tests (includes system tests)
cargo test

# Check for borrow errors
cargo clippy

# Build WASM
wasm-pack build --target web --out-dir pkg --dev
```

## Dependencies
- **serde** - Serialization for game state persistence
- **js-sys** - Date handling for timestamps (achievement.rs)
- **crate::entities** - Building, Upgrade, Worker types (production.rs)

## Related Modules
- **`src/entities/`** - Data types used by systems
- **`src/state/`** - GameState that contains system data
- **`src/lib.rs`** - Main integration point for all systems
- **`src/ui/`** - UI callbacks that display system state
