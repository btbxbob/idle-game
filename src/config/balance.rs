use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
pub struct BalanceConfig {
    pub version: String,
    pub game_loop: GameLoopConfig,
    pub click: ClickConfig,
    pub buildings: BuildingsConfig,
    pub crafting: HashMap<String, CraftingRecipe>,
    pub workers: WorkersConfig,
    pub traits: HashMap<String, TraitConfig>,
    pub housing: HousingConfig,
    pub decay: DecayConfig,
    pub prestige: PrestigeConfig,
    pub stages: HashMap<String, StageConfig>,
    pub technology_effects: TechEffectsConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GameLoopConfig {
    pub tick_interval_ms: u32,
    pub auto_save_interval_ms: u32,
    pub worker_spawn_interval_s: f64,
    pub food_consumption_interval_s: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ClickConfig {
    pub base_coins_per_click: f64,
    pub critical_click_chance: f64,
    pub critical_click_multiplier: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BuildingsConfig {
    pub cost_growth: f64,
    pub primary: HashMap<String, BuildingDef>,
    pub processing: HashMap<String, BuildingDef>,
    pub dark: HashMap<String, BuildingDef>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BuildingDef {
    pub base_cost: f64,
    pub production_rate: f64,
    pub output: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CraftingRecipe {
    pub inputs: HashMap<String, f64>,
    pub output: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WorkersConfig {
    pub food_per_consumption: f64,
    pub starvation_threshold_s: f64,
    pub xp_per_second: f64,
    pub xp_growth_per_level: f64,
    pub base_xp_to_next: f64,
    pub efficiency: EfficiencyConfig,
    pub states: WorkerStatesConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct EfficiencyConfig {
    pub preference_match_bonus: f64,
    pub skill_match_bonus: f64,
    pub background_bonus: f64,
    pub hobby_bonus: f64,
    pub level_bonus_per_level: f64,
    pub min_efficiency: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WorkerStatesConfig {
    pub initial: InitialWorkerState,
    pub working: WorkingStateModifiers,
    pub idle: IdleStateModifiers,
}

#[derive(Debug, Clone, Deserialize)]
pub struct InitialWorkerState {
    pub happiness: f64,
    pub health: f64,
    pub hunger: f64,
    pub focus: f64,
    pub fatigue: f64,
    pub stress: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WorkingStateModifiers {
    pub focus_gain: Vec<f64>,
    pub fatigue_gain: Vec<f64>,
    pub stress_gain: Vec<f64>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct IdleStateModifiers {
    pub focus_recovery: f64,
    pub fatigue_recovery: f64,
    pub stress_recovery: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TraitConfig {
    pub efficiency: f64,
    pub xp: f64,
    pub team: f64,
    pub time: f64,
    pub happiness: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct HousingConfig {
    pub cost_growth_gold: f64,
    pub cost_growth_other: f64,
    pub catalog: Vec<HousingDef>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct HousingDef {
    pub id: String,
    pub capacity: u32,
    pub costs: HashMap<String, f64>,
    pub required_tech: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DecayConfig {
    pub maggots_per_corpse: f64,
    pub corpse_decay_per_tick: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PrestigeConfig {
    pub base_threshold: f64,
    pub pp_formula: String,
    pub multiplier_per_pp: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StageConfig {
    pub unlock: String,
    pub resources: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TechEffectsConfig {
    pub production_bonus_compound: bool,
    pub ai_assistance_multiplier: f64,
    pub nuclear_power_multiplier: f64,
    pub symbiotic_hosts_multiplier: f64,
    pub hive_mind_multiplier: f64,
    pub collective_awakening_multiplier: f64,
    pub cost_reduction_per_tier4: f64,
    pub min_cost_multiplier: f64,
}

impl BalanceConfig {
    pub fn load() -> Result<Self, String> {
        let json_str = include_str!("../../config/balance.json");
        serde_json::from_str(json_str).map_err(|e| format!("Failed to parse balance config: {}", e))
    }

    pub fn get_building_def(&self, building_id: &str) -> Option<&BuildingDef> {
        self.buildings.primary.get(building_id)
            .or_else(|| self.buildings.processing.get(building_id))
            .or_else(|| self.buildings.dark.get(building_id))
    }

    pub fn get_crafting_recipe(&self, resource: &str) -> Option<&CraftingRecipe> {
        self.crafting.get(resource)
    }

    pub fn get_trait_config(&self, trait_name: &str) -> Option<&TraitConfig> {
        self.traits.get(trait_name)
    }
}
