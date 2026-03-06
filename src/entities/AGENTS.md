# src/entities/ - Game Entity Definitions

**Location**: `src/entities/` (6 files)
**Purpose**: Pure data structs with serde. NO game logic.

## Structure
```
src/entities/
├── mod.rs               # Exports: Building, Housing, Worker, Gender, Hobby, Trait, TraitEffect, Technology, TechnologyId, TechnologyEffect, BuildingType
├── building.rs          # Building + Housing structs
├── worker.rs            # Worker (682 lines) — gender, hobbies, traits, happiness, hunger
├── technology.rs        # Technology tree entities (593 lines)
├── automation.rs        # Automation building definitions
└── population_queue.rs  # Population queue system
```

## Worker (worker.rs) — EXPANDED
```rust
pub struct Worker {
    // Base fields
    pub name: String, pub skills: String, pub background: String,
    pub preferences: String, pub assigned_building: Option<String>,
    pub level: u32, pub efficiency_multiplier: f64,
    pub xp: f64, pub xp_to_next_level: f64,
    // Phase 2 fields (all #[serde(default)])
    pub gender: Gender,              // Male/Female/Other
    pub hobbies: Vec<Hobby>,         // 10 hobby types
    pub primary_trait: Trait,        // 21 trait types (efficiency/learning/social/time/positive/negative)
    pub secondary_traits: Vec<Trait>,
    pub happiness: f64,              // default 50.0
    pub hunger: f64,                 // 0=full, 100=starving
}
```
Constructors: `Worker::new(name, skills, bg, prefs)` (defaults) | `Worker::new_full(...)` (all fields)

## Technology (technology.rs)
- `TechnologyId` enum — 50 planned variants (BasicMining, AdvancedSmelting, etc.)
- `Technology` struct — id, name, description, costs, dependencies, effect, purchased
- `TechnologyEffect` enum — ProductionBonus, BuildingUnlock, MechanicChange, UIUnlock
- `BuildingType` enum — CoinMine, Woodcutter, StoneQuarry, etc.

## Building + Housing (building.rs)
- `Building` — name, cost, production_rate, count
- `Housing` — name, cost, capacity, count (population capacity)

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Add building type | `building.rs` | Building or Housing struct |
| Modify worker system | `worker.rs` | Add `#[serde(default)]` on new fields |
| Add technology | `technology.rs` | TechnologyId variant + Technology struct |
| Add entity type | New file + `mod.rs` | Pure data only |

## Anti-Pattern: Entities are DATA ONLY
❌ No methods that modify game state. Logic lives in `src/systems/` and `src/core/`.
