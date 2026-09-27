use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize)]
pub struct UiSnapshot {
    pub resources: HashMap<String, ResourceState>,
    pub buildings: Vec<BuildingCard>,
    pub workers: Vec<WorkerCard>,
    pub technologies: Vec<TechCard>,
    pub housing: HousingState,
    pub prestige: PrestigeState,
    pub progression: ProgressionState,
    pub events: Vec<EventEntry>,
    pub statistics: StatisticsState,
    pub tick_ms: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ResourceState {
    pub amount: f64,
    pub per_second: f64,
    pub tier: u8,
    pub revealed: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct BuildingCard {
    pub id: String,
    pub name: String,
    pub description: String,
    pub count: u32,
    pub cost: f64,
    pub production_rate: f64,
    pub output_resource: String,
    pub can_afford: bool,
    pub unlocked: bool,
    pub category: String,
    pub input_requirements: Vec<InputReq>,
}

#[derive(Debug, Clone, Serialize)]
pub struct InputReq {
    pub resource: String,
    pub amount: f64,
    pub available: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct WorkerCard {
    pub index: usize,
    pub name: String,
    pub level: u32,
    pub xp: f64,
    pub xp_to_next: f64,
    pub efficiency: f64,
    pub assigned_building: Option<String>,
    pub happiness: f64,
    pub hunger: f64,
    pub focus: f64,
    pub fatigue: f64,
    pub stress: f64,
    pub is_hungry: bool,
    pub primary_trait: String,
    pub secondary_traits: Vec<String>,
    pub skills: String,
    pub background: String,
    pub preferences: String,
    pub gender: String,
    pub hobbies: Vec<String>,
    pub missing_limbs: Vec<String>,
    pub maggot_limbs: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TechCard {
    pub id: String,
    pub name: String,
    pub description: String,
    pub effect: String,
    pub tier: u8,
    pub researched: bool,
    pub available: bool,
    pub costs: HashMap<String, f64>,
    pub dependencies: Vec<String>,
    pub recommended: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct HousingState {
    pub catalog: Vec<HousingCard>,
    pub total_capacity: u32,
    pub current_occupancy: u32,
    pub queue_size: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct HousingCard {
    pub id: String,
    pub name: String,
    pub description: String,
    pub capacity: u32,
    pub count: u32,
    pub costs: HashMap<String, f64>,
    pub can_afford: bool,
    pub unlocked: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PrestigeState {
    pub unlocked: bool,
    pub current_pp: f64,
    pub pp_on_rebirth: f64,
    pub multiplier: f64,
    pub can_prestige: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProgressionState {
    pub current_stage: String,
    pub stage_name: String,
    pub objectives: Vec<ObjectiveEntry>,
    pub unlocks: Vec<UnlockEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ObjectiveEntry {
    pub id: String,
    pub description: String,
    pub progress: f64,
    pub target: f64,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct UnlockEntry {
    pub id: String,
    pub name: String,
    pub description: String,
    pub unlocked: bool,
    pub progress: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct EventEntry {
    pub id: String,
    pub category: String,
    pub headline: String,
    pub body: String,
    pub timestamp: f64,
    pub priority: u8,
}

#[derive(Debug, Clone, Serialize)]
pub struct StatisticsState {
    pub total_clicks: u64,
    pub total_coins_earned: f64,
    pub total_wood_earned: f64,
    pub total_stone_earned: f64,
    pub total_resources_crafted: u64,
    pub play_time_s: f64,
    pub buildings_purchased: u64,
    pub upgrades_purchased: u64,
    pub achievements_unlocked: u64,
    pub workers_count: u32,
    pub deaths_count: u64,
}
