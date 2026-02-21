# src/entities/ - Game Entity Definitions

**Location**: `src/entities/`  
**Modules**: 3 entity structs (Building, Upgrade, Worker)  
**Purpose**: Core game entity data structures with serialization support

## Overview
This directory contains the core entity definitions for the idle game. Each entity is a serializable struct that represents a fundamental game object. These entities are used throughout the game logic in `src/lib.rs`.

## Structure
```
src/entities/
├── mod.rs           # Module exports
├── building.rs      # Building entity
├── upgrade.rs       # Upgrade entity
└── worker.rs        # Worker entity
```

## Entity Reference

### Building (`building.rs`)
**Purpose**: Represents a producible structure that generates resources over time.

```rust
pub struct Building {
    pub name: String,           // Building name (e.g., "Mine", "Lumber Mill")
    pub cost: f64,              // Purchase cost (scales with count)
    pub production_rate: f64,   // Resources produced per second
    pub count: u32,             // Number of buildings owned
}
```

**Usage Pattern**:
```rust
// Create a new building
let mine = Building {
    name: "Mine".to_string(),
    cost: 100.0,
    production_rate: 10.0,
    count: 0,
};

// Cost scaling (typical pattern)
building.cost *= 1.15; // 15% increase per purchase
```

### Upgrade (`upgrade.rs`)
**Purpose**: Represents a purchasable enhancement that improves production or click power.

```rust
pub struct Upgrade {
    pub name: String,               // Upgrade name (e.g., "Better Tools")
    pub cost: f64,                  // Purchase cost (one-time or per level)
    pub production_increase: f64,   // Production boost provided
    pub owned: u32,                 // Number of times purchased
    pub unlocked: bool,             // Whether upgrade is available
}
```

**Usage Pattern**:
```rust
// Check if upgrade can be purchased
if upgrade.unlocked && coins >= upgrade.cost {
    upgrade.owned += 1;
    coins -= upgrade.cost;
    // Apply production increase
}
```

### Worker (`worker.rs`)
**Purpose**: Represents a assignable character with skills, levels, and efficiency bonuses.

```rust
pub struct Worker {
    pub name: String,                   // Worker name (e.g., "Bob the Miner")
    pub skills: String,                 // Skill description
    pub background: String,             // Backstory/flavor text
    pub preferences: String,            // Preferred building types
    pub assigned_building: Option<String>, // Currently assigned building (if any)
    pub level: u32,                     // Worker level (1+)
    pub efficiency_multiplier: f64,     // Production bonus (1.0 = no bonus)
    pub xp: f64,                        // Current experience points
    pub xp_to_next_level: f64,          // XP required for next level
}
```

**Usage Pattern**:
```rust
// Assign worker to building
worker.assigned_building = Some("Mine".to_string());

// Grant XP and check for level up
worker.xp += earned_xp;
if worker.xp >= worker.xp_to_next_level {
    worker.level += 1;
    worker.efficiency_multiplier *= 1.1; // 10% bonus per level
    worker.xp = 0.0;
    worker.xp_to_next_level *= 1.5; // Harder to level up
}
```

## Module Exports (`mod.rs`)
```rust
pub mod building;
pub mod upgrade;
pub mod worker;

pub use building::Building;
pub use upgrade::Upgrade;
pub use worker::Worker;
```

## Common Patterns

### Serialization
All entities derive `Serialize` and `Deserialize` for:
- Save/load game state
- WASM-JS data transfer
- Configuration file parsing

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Entity { ... }
```

### Cost Scaling
Typical cost progression for buildings and upgrades:
```rust
// Exponential cost increase
new_cost = base_cost * (1.15 ^ count)
```

### Efficiency Calculation
Worker production bonus calculation:
```rust
effective_production = base_production * worker.efficiency_multiplier
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new building type | `building.rs` + `lib.rs` | Define in entities, instantiate in game state |
| Add new upgrade | `upgrade.rs` + `lib.rs` | Define structure, add to upgrade list |
| Modify worker system | `worker.rs` | Update struct, then update assignment logic in `lib.rs` |
| Add new entity type | Create `new_entity.rs` | Add module in `mod.rs`, define struct, use in `lib.rs` |

## Anti-Patterns

### ❌ FORBIDDEN
```rust
// Don't mix entity definitions with game logic
// Entities should be pure data structures
pub struct Building {
    pub name: String,
    pub cost: f64,
    // ❌ Don't add methods that modify game state
    pub fn produce(&mut self) { ... }
}
```

### ✅ CORRECT
```rust
// Entities are data-only
pub struct Building {
    pub name: String,
    pub cost: f64,
    pub production_rate: f64,
    pub count: u32,
}

// Logic lives in lib.rs
impl IdleGame {
    pub fn produce_resources(&mut self) {
        let state = self.state.borrow();
        for building in &state.buildings {
            // Process production
        }
    }
}
```

## Dependencies
- `serde` - Serialization/deserialization traits
- `serde-wasm-bindgen` - WASM integration (if needed)

## Testing
Entity tests are in `src/lib.rs` under `#[cfg(test)]`. Test patterns:

```rust
#[test]
fn test_building_creation() {
    let building = Building {
        name: "Test".to_string(),
        cost: 100.0,
        production_rate: 10.0,
        count: 1,
    };
    assert_eq!(building.name, "Test");
    assert_eq!(building.cost, 100.0);
}
```

## Related Files
- `src/lib.rs` - Main game logic using these entities
- `src/AGENTS.md` - Parent directory guidelines
- `docs/DESIGN.md` - Overall game architecture
