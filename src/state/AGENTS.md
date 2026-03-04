# src/state/ - Game State Data

**Location**: src/state/ (6 files)

## Structure

```
src/state/
├── mod.rs           # Module exports
├── game_state.rs    # GameState struct, SAVE_VERSION
├── resource.rs      # ResourceType enum (60+ types), ResourceTier, ResourceCategory
├── statistics.rs    # Statistics struct (9 metrics)
├── job_stats.rs     # JobStats + WorkOverview structs
└── work_stats.rs    # Alternative JobStats/WorkOverview (unused)
```

## GameState (game_state.rs)

```rust
pub struct GameState {
    pub version: String,              // SAVE_VERSION for compatibility
    pub resources: HashMap<ResourceType, f64>,
    pub coins_per_click: f64,
    pub coins_per_second: f64,
    pub wood_per_second: f64,
    pub stone_per_second: f64,
    pub total_clicks: u32,
    pub last_update_time: f64,
    pub prestige_points: f64,
    pub prestige_multiplier: f64,
}
```

- `resources`: HashMap stores all 60+ resource amounts by ResourceType
- `version`: SAVE_VERSION constant for save compatibility checking
- Custom Deserialize impl handles version migration from old saves

## ResourceType (resource.rs)

- 60+ resource types across 3 tiers
- `ResourceTier`: Primary, Secondary, Advanced
- `ResourceCategory`: alias for ResourceTier
- Tier 1: Gold, Wood, Stone, IronOre, CopperOre, AluminumOre, Coal, Oil, Crystal, Food
- Tier 2-3: 50+ processed/advanced materials (Ingots, Plates, Chemicals, etc.)

## Statistics (statistics.rs)

9 metrics tracking player progress:
- total_clicks, total_coins_earned, total_wood_earned, total_stone_earned
- total_resources_crafted, achievements_unlocked_count
- play_time_seconds, buildings_purchased, upgrades_purchased

## JobStats + WorkOverview (job_stats.rs)

Worker job statistics:
- `JobStats`: job_type, worker_count, avg_efficiency, total_output
- `WorkOverview`: jobs Vec, unassigned_workers, total_workers, total_efficiency

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add resource type | resource.rs - ResourceType enum |
| Add state field | game_state.rs - GameState struct |
| Add stat metric | statistics.rs - Statistics struct |
| Change save version | game_state.rs - SAVE_VERSION const |

## CRITICAL: #[serde(default)] on ALL new fields

All new GameState fields MUST have `#[serde(default)]` for backward compatibility with old saves. Version check in deserializer resets saves on breaking changes (0.5.0+).
