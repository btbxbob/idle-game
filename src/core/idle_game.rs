use crate::entities::{Building, Hobby, Housing, LimbSlot, PopulationQueue, Trait, Worker};
use crate::state::resource::ResourceType;
use crate::state::{GameStage, GameState, Statistics};
use crate::systems::{
    achievement::Achievement, event, production, stage, technology::TechnologyTree,
    unlock::UnlockedFeature,
};
use crate::utils::WorkerGenerator;
use base64::{engine::general_purpose, Engine as _};
use js_sys::Date;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct TechnologyView {
    id: String,
    name: String,
    description: String,
    tier: u8,
    costs: HashMap<String, f64>,
    dependencies: Vec<String>,
    purchased: bool,
    researched: bool,
    can_research: bool,
    effect_value: f64,
    effect: serde_json::Value,
}

#[derive(Serialize)]
struct BuildingView {
    index: usize,
    name: String,
    cost: f64,
    production_rate: f64,
    output_resource: ResourceType,
    count: u32,
}

#[derive(Serialize)]
struct ProgressionStateView {
    current_stage_id: String,
    current_stage_name: String,
    current_stage_description: String,
    human_pressure: f64,
    maggot_influence: f64,
    symbiosis_stability: f64,
    hybrid_population: f64,
    collective_consciousness: f64,
}

#[derive(Serialize)]
struct UnlockProgressView {
    current: f64,
    required: f64,
    percentage: f64,
}

#[derive(Serialize)]
struct ObjectiveStepView {
    id: String,
    title: String,
    description: String,
    current: f64,
    required: f64,
    completed: bool,
    reward: String,
    recommended_tab: String,
}

#[derive(Serialize)]
struct ObjectiveChainView {
    active: bool,
    stage_id: String,
    current_objective_id: Option<String>,
    steps: Vec<ObjectiveStepView>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkerSummaryView {
    index: usize,
    name: String,
    skills: String,
    background: String,
    preferences: String,
    assigned_building: Option<String>,
    level: u32,
    efficiency_multiplier: f64,
    xp: f64,
    xp_to_next_level: f64,
    gender: String,
    hobbies: Vec<String>,
    primary_trait: String,
    secondary_traits: Vec<String>,
    happiness: f64,
    hunger: f64,
    focus: f64,
    fatigue: f64,
    stress: f64,
    is_hungry: bool,
    missing_limbs: Vec<String>,
    maggot_limbs: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkerDetailView {
    index: usize,
    name: String,
    skills: String,
    background: String,
    preferences: String,
    assigned_building: Option<String>,
    level: u32,
    efficiency_multiplier: f64,
    base_efficiency: f64,
    total_efficiency: f64,
    efficiency_breakdown: Vec<String>,
    auto_assignment_target: Option<String>,
    xp: f64,
    xp_to_next_level: f64,
    gender: String,
    hobbies: Vec<String>,
    primary_trait: String,
    secondary_traits: Vec<String>,
    happiness: f64,
    hunger: f64,
    focus: f64,
    fatigue: f64,
    stress: f64,
    is_hungry: bool,
    missing_limbs: Vec<String>,
    maggot_limbs: Vec<String>,
    can_maggot_surgery: bool,
    maggot_surgery_cost: f64,
    maggot_surgery_reason: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkerPageView {
    total: usize,
    assigned_count: usize,
    page: usize,
    page_size: usize,
    workers: Vec<WorkerSummaryView>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BuildingAssignmentCountView {
    name: String,
    assigned_count: usize,
}

#[derive(Clone, Copy)]
struct WorkerJobProfile {
    labor: f64,
    precision: f64,
    cognitive: f64,
    organic: f64,
    social: f64,
}

#[wasm_bindgen]
pub struct IdleGame {
    state: Rc<RefCell<GameState>>,
    buildings: Vec<Building>,
    housing_buildings: Vec<Housing>,
    workers: Vec<Worker>,
    #[wasm_bindgen(skip)]
    population_queue: PopulationQueue,
    #[wasm_bindgen(skip)]
    last_food_consumption_time: f64,
    #[wasm_bindgen(skip)]
    last_worker_spawn_time: f64,
    #[wasm_bindgen(skip)]
    achievements: Vec<Achievement>,
    #[wasm_bindgen(skip)]
    #[wasm_bindgen(skip)]
    unlocked_features: Vec<UnlockedFeature>,
    #[wasm_bindgen(skip)]
    technology_tree: TechnologyTree,
    statistics: Rc<RefCell<Statistics>>,
}

/// Complete game save data structure for persistence
#[derive(Serialize, Deserialize, Clone)]
pub struct SavedGame {
    pub state: GameState,
    pub statistics: Statistics,
    pub buildings: Vec<Building>,
    pub housing_buildings: Vec<Housing>,
    pub workers: Vec<Worker>,
    #[serde(default)]
    pub population_queue: PopulationQueue,
    pub achievements: Vec<Achievement>,
    #[serde(default, alias = "crafting_recipes")]
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub legacy_crafting_recipes: Vec<serde_json::Value>,
    pub unlocked_features: Vec<UnlockedFeature>,
    #[serde(default)]
    pub technology_tree: TechnologyTree,
    #[serde(default)]
    pub last_food_consumption_time: f64,
    #[serde(default)]
    pub last_worker_spawn_time: f64,
    pub save_timestamp: f64,
    pub version: String,
}

fn infer_output_resource_from_building_name(building_name: &str) -> ResourceType {
    match normalize_building_name(building_name).as_str() {
        "金币矿山" => ResourceType::Gold,
        "伐木场" => ResourceType::Wood,
        "采石场" => ResourceType::Stone,
        "铁矿场" => ResourceType::IronOre,
        "铜矿场" => ResourceType::CopperOre,
        "铝矿场" => ResourceType::AluminumOre,
        "煤矿场" => ResourceType::Coal,
        "石油井" => ResourceType::Oil,
        "水晶矿" => ResourceType::Crystal,
        "农场" => ResourceType::Food,
        "铁锭冶炼厂" => ResourceType::IronIngot,
        "铜锭冶炼厂" => ResourceType::CopperIngot,
        "化学品厂" => ResourceType::Chemicals,
        "钢铁厂" => ResourceType::SteelPlate,
        "玻璃厂" => ResourceType::Glass,
        "塑料厂" => ResourceType::Plastic,
        "电路板厂" => ResourceType::CircuitBoard,
        "马达厂" => ResourceType::Motor,
        "传感器厂" => ResourceType::Sensor,
        "齿轮厂" => ResourceType::Gear,
        "电池厂" => ResourceType::Battery,
        "发电机厂" => ResourceType::Generator,
        "芯片制造厂" => ResourceType::Microchip,
        "量子计算中心" => ResourceType::QuantumComputer,
        "机器人工厂" => ResourceType::Robot,
        "纳米机器人工厂" => ResourceType::Nanobot,
        "反物质反应堆" => ResourceType::Antimatter,
        "时间水晶合成器" => ResourceType::TimeCrystal,
        "腐食育蛆槽" | "蛆虫工厂" | "腐肉育池" => ResourceType::Maggot,
        "共生培育舱" => ResourceType::Food,
        "神经尖塔" => ResourceType::DarkMatter,
        "深空孵化港" => ResourceType::Spaceship,
        _ => ResourceType::Gold,
    }
}

fn normalize_building_name(building_name: &str) -> String {
    match building_name {
        "Coin Mine" | "Coin Factory" | "Coin Corporation" => "金币矿山".to_string(),
        "Woodcutter" | "Lumber Mill" | "Forest Workshop" => "伐木场".to_string(),
        "Stone Quarry" | "Rock Crusher" | "Mason Workshop" => "采石场".to_string(),
        _ => building_name.to_string(),
    }
}

fn factory_building(
    name: &str,
    cost: f64,
    production_rate: f64,
    output_resource: ResourceType,
) -> Building {
    Building {
        name: name.to_string(),
        cost,
        production_rate,
        output_resource,
        count: 0,
    }
}

fn production_input_requirements(resource: ResourceType) -> &'static [(ResourceType, f64)] {
    match resource {
        ResourceType::IronIngot => &[(ResourceType::IronOre, 10.0)],
        ResourceType::CopperIngot => &[(ResourceType::CopperOre, 10.0)],
        ResourceType::Chemicals => &[(ResourceType::Oil, 4.0), (ResourceType::Coal, 2.0)],
        ResourceType::SteelPlate => &[(ResourceType::IronOre, 12.0), (ResourceType::Coal, 3.0)],
        ResourceType::Glass => &[(ResourceType::Stone, 8.0), (ResourceType::Coal, 1.0)],
        ResourceType::Plastic => &[(ResourceType::Oil, 5.0), (ResourceType::Coal, 1.0)],
        ResourceType::CircuitBoard => &[
            (ResourceType::CopperOre, 12.0),
            (ResourceType::Oil, 2.0),
            (ResourceType::Crystal, 1.0),
        ],
        ResourceType::Motor => &[
            (ResourceType::IronOre, 8.0),
            (ResourceType::CopperOre, 4.0),
            (ResourceType::Coal, 2.0),
        ],
        ResourceType::Sensor => &[
            (ResourceType::Crystal, 3.0),
            (ResourceType::CopperOre, 6.0),
            (ResourceType::Oil, 2.0),
        ],
        ResourceType::Gear => &[(ResourceType::IronOre, 6.0), (ResourceType::Coal, 2.0)],
        ResourceType::Battery => &[
            (ResourceType::Coal, 5.0),
            (ResourceType::Oil, 3.0),
            (ResourceType::Crystal, 1.0),
        ],
        ResourceType::Generator => &[
            (ResourceType::IronOre, 16.0),
            (ResourceType::CopperOre, 10.0),
            (ResourceType::Coal, 6.0),
        ],
        ResourceType::Microchip => &[
            (ResourceType::Crystal, 2.0),
            (ResourceType::CircuitBoard, 2.0),
        ],
        ResourceType::QuantumComputer => &[
            (ResourceType::Crystal, 5.0),
            (ResourceType::Microchip, 4.0),
            (ResourceType::CircuitBoard, 3.0),
        ],
        ResourceType::Robot => &[
            (ResourceType::Crystal, 2.0),
            (ResourceType::SteelPlate, 4.0),
            (ResourceType::Motor, 2.0),
            (ResourceType::Sensor, 2.0),
        ],
        ResourceType::Nanobot => &[
            (ResourceType::Oil, 5.0),
            (ResourceType::Microchip, 2.0),
            (ResourceType::Chemicals, 4.0),
        ],
        ResourceType::Antimatter => &[
            (ResourceType::Crystal, 20.0),
            (ResourceType::QuantumComputer, 3.0),
            (ResourceType::Chemicals, 10.0),
        ],
        ResourceType::TimeCrystal => &[
            (ResourceType::Crystal, 40.0),
            (ResourceType::Microchip, 10.0),
            (ResourceType::QuantumComputer, 2.0),
        ],
        ResourceType::DarkMatter => &[
            (ResourceType::Crystal, 50.0),
            (ResourceType::Microchip, 6.0),
            (ResourceType::QuantumComputer, 2.0),
        ],
        ResourceType::Spaceship => &[
            (ResourceType::Crystal, 80.0),
            (ResourceType::SteelPlate, 20.0),
            (ResourceType::Microchip, 10.0),
            (ResourceType::Generator, 4.0),
        ],
        _ => &[],
    }
}

fn normalize_worker_building_references(workers: &mut [Worker]) {
    for worker in workers {
        worker.preferences = normalize_building_name(&worker.preferences);
        if let Some(assigned) = &worker.assigned_building {
            worker.assigned_building = Some(normalize_building_name(assigned));
        }
    }
}

fn calculate_click_power_from_buildings(buildings: &[Building]) -> f64 {
    let coin_mine_count = buildings
        .iter()
        .find(|b| b.name == "金币矿山")
        .map(|b| b.count as f64)
        .unwrap_or(0.0);
    1.0 + coin_mine_count
}

fn normalize_housing_resource_key(resource: &str) -> Option<ResourceType> {
    match resource.trim().to_ascii_lowercase().as_str() {
        "gold" | "coins" | "coin" => Some(ResourceType::Gold),
        "wood" => Some(ResourceType::Wood),
        "stone" => Some(ResourceType::Stone),
        "ironore" | "iron_ore" => Some(ResourceType::IronOre),
        "coal" => Some(ResourceType::Coal),
        "crystal" => Some(ResourceType::Crystal),
        "food" => Some(ResourceType::Food),
        "ironingot" | "iron_ingot" => Some(ResourceType::IronIngot),
        "steelplate" | "steel_plate" => Some(ResourceType::SteelPlate),
        "glass" => Some(ResourceType::Glass),
        "plastic" => Some(ResourceType::Plastic),
        "chemicals" => Some(ResourceType::Chemicals),
        "gear" => Some(ResourceType::Gear),
        "motor" => Some(ResourceType::Motor),
        "battery" => Some(ResourceType::Battery),
        "circuitboard" | "circuit_board" => Some(ResourceType::CircuitBoard),
        "sensor" => Some(ResourceType::Sensor),
        "microchip" => Some(ResourceType::Microchip),
        "quantumcomputer" | "quantum_computer" => Some(ResourceType::QuantumComputer),
        "robot" => Some(ResourceType::Robot),
        "nanobot" => Some(ResourceType::Nanobot),
        "antimatter" => Some(ResourceType::Antimatter),
        "timecrystal" | "time_crystal" => Some(ResourceType::TimeCrystal),
        _ => None,
    }
}

fn housing_cost(entries: &[(&str, f64)]) -> HashMap<String, f64> {
    entries
        .iter()
        .map(|(resource, amount)| ((*resource).to_string(), *amount))
        .collect()
}

fn default_housing_catalog() -> Vec<Housing> {
    vec![
        Housing::with_details(
            "棚屋",
            housing_cost(&[("Gold", 100.0), ("Wood", 35.0)]),
            4,
            "用最基础的木料和布片拼出来的临时居所，能先把第一批劳动力安顿下来。",
            "⛺",
            None,
        ),
        Housing::with_details(
            "木梁小屋",
            housing_cost(&[("Gold", 180.0), ("Wood", 90.0), ("Stone", 30.0)]),
            6,
            "有了稳定伐木和采石之后，工人终于能住进不那么容易漏风的木屋。",
            "🪵",
            Some("BasicLogging"),
        ),
        Housing::with_details(
            "采石宿舍",
            housing_cost(&[("Gold", 320.0), ("Stone", 120.0), ("IronOre", 50.0)]),
            8,
            "石墙和矿梁让宿舍结构更稳，适合矿工和采石工长期驻扎。",
            "🪨",
            Some("BasicQuarrying"),
        ),
        Housing::with_details(
            "铸铁公寓",
            housing_cost(&[("Gold", 520.0), ("IronIngot", 90.0), ("Glass", 40.0)]),
            12,
            "冶炼和玻璃工艺成熟后，城市开始出现真正意义上的多层工人公寓。",
            "🏘️",
            Some("BasicSmelting"),
        ),
        Housing::with_details(
            "钢骨宿舍塔",
            housing_cost(&[
                ("Gold", 900.0),
                ("SteelPlate", 120.0),
                ("Gear", 60.0),
                ("IronIngot", 80.0),
            ]),
            16,
            "机械工程推动住房垂直扩张，结构件和供能线路让多人宿舍变得可靠。",
            "🏢",
            Some("BasicEngineering"),
        ),
        Housing::with_details(
            "聚合物生活舱",
            housing_cost(&[
                ("Gold", 1450.0),
                ("Plastic", 140.0),
                ("Chemicals", 90.0),
                ("Glass", 90.0),
            ]),
            20,
            "化工产业让轻量化居住舱变成现实，维护成本更低，扩张速度也更快。",
            "🧪",
            Some("AdvancedChemistry"),
        ),
        Housing::with_details(
            "自动化居住穹顶",
            housing_cost(&[
                ("Gold", 2400.0),
                ("CircuitBoard", 120.0),
                ("Motor", 90.0),
                ("Battery", 70.0),
            ]),
            26,
            "自动门、能源循环和基础维生系统把住房升级成了半自动化穹顶。",
            "🔋",
            Some("Automation"),
        ),
        Housing::with_details(
            "仿生共生巢",
            housing_cost(&[
                ("Gold", 4200.0),
                ("Plastic", 160.0),
                ("Chemicals", 140.0),
                ("Robot", 24.0),
            ]),
            32,
            "当生物技术介入住房设计，建筑开始像组织一样自我调节并容纳混合居民。",
            "🧬",
            Some("Biotechnology"),
        ),
        Housing::with_details(
            "量子静域居所",
            housing_cost(&[
                ("Gold", 7600.0),
                ("Microchip", 120.0),
                ("Sensor", 90.0),
                ("QuantumComputer", 18.0),
            ]),
            40,
            "量子计算接管环境调谐后，整片住宅区可以按居民状态实时优化。",
            "⚛️",
            Some("QuantumComputing"),
        ),
        Housing::with_details(
            "星轨方舟",
            housing_cost(&[
                ("Gold", 14000.0),
                ("Nanobot", 90.0),
                ("TimeCrystal", 24.0),
                ("Antimatter", 12.0),
            ]),
            52,
            "终局住房不再只是容纳人口，而是让整个群落像航行中的殖民方舟一样持续演化。",
            "🚀",
            Some("SpaceExploration"),
        ),
    ]
}

fn merge_loaded_housing_catalog(existing: Vec<Housing>) -> Vec<Housing> {
    let mut existing_by_name: HashMap<String, Housing> = existing
        .into_iter()
        .map(|housing| (housing.name.clone(), housing))
        .collect();

    let legacy_housing = existing_by_name.remove("住房");

    default_housing_catalog()
        .into_iter()
        .map(|mut default_housing| {
            let matched = existing_by_name.remove(&default_housing.name).or_else(|| {
                if default_housing.name == "棚屋" {
                    legacy_housing.clone()
                } else {
                    None
                }
            });

            if let Some(saved) = matched {
                default_housing.count = saved.count;
            }

            default_housing
        })
        .collect()
}

fn clamp_loaded_timestamp(saved_time: f64, now: f64, max_age_ms: f64) -> f64 {
    if !saved_time.is_finite() || saved_time <= 0.0 {
        return now;
    }

    let age = now - saved_time;
    if !age.is_finite() || age < 0.0 || age > max_age_ms {
        now
    } else {
        saved_time
    }
}

fn stage_from_unlock_id(feature_id: &str) -> Option<GameStage> {
    match feature_id {
        "stage_workers" => Some(GameStage::Workers),
        "stage_maggot" => Some(GameStage::Maggot),
        "stage_hybrid" => Some(GameStage::Hybrid),
        "stage_collective" => Some(GameStage::Collective),
        _ => None,
    }
}

fn production_resource_slots() -> &'static [(ResourceType, usize)] {
    &[
        (ResourceType::IronOre, 3),
        (ResourceType::CopperOre, 4),
        (ResourceType::AluminumOre, 5),
        (ResourceType::Coal, 6),
        (ResourceType::Oil, 7),
        (ResourceType::Crystal, 8),
        (ResourceType::Food, 9),
        (ResourceType::IronIngot, 10),
        (ResourceType::CopperIngot, 11),
        (ResourceType::AluminumIngot, 12),
        (ResourceType::SteelPlate, 13),
        (ResourceType::CopperPlate, 14),
        (ResourceType::AluminumPlate, 15),
        (ResourceType::Glass, 16),
        (ResourceType::Plastic, 17),
        (ResourceType::Chemicals, 18),
        (ResourceType::Fuel, 19),
        (ResourceType::Paper, 20),
        (ResourceType::Ink, 21),
        (ResourceType::Cloth, 22),
        (ResourceType::Leather, 23),
        (ResourceType::Ceramic, 24),
        (ResourceType::Cement, 25),
        (ResourceType::Brick, 26),
        (ResourceType::Rebar, 27),
        (ResourceType::Pipe, 29),
        (ResourceType::Valve, 30),
        (ResourceType::Gear, 31),
        (ResourceType::Bearing, 32),
        (ResourceType::Spring, 33),
        (ResourceType::Screw, 34),
        (ResourceType::Nut, 35),
        (ResourceType::Washer, 36),
        (ResourceType::Pump, 37),
        (ResourceType::Motor, 38),
        (ResourceType::Sensor, 39),
        (ResourceType::CircuitBoard, 40),
        (ResourceType::Capacitor, 41),
        (ResourceType::Resistor, 42),
        (ResourceType::Diode, 43),
        (ResourceType::Transistor, 44),
        (ResourceType::Transformer, 45),
        (ResourceType::Generator, 46),
        (ResourceType::Compressor, 47),
        (ResourceType::Battery, 48),
        (ResourceType::Microchip, 49),
        (ResourceType::Engine, 50),
        (ResourceType::Robot, 51),
        (ResourceType::Satellite, 52),
        (ResourceType::Spaceship, 53),
        (ResourceType::QuantumComputer, 54),
        (ResourceType::Antimatter, 55),
        (ResourceType::DarkMatter, 56),
        (ResourceType::TimeCrystal, 57),
        (ResourceType::Nanobot, 58),
    ]
}

#[cfg(test)]
mod normalization_tests {
    use super::*;

    #[test]
    fn test_normalize_building_name_from_legacy_english() {
        assert_eq!(normalize_building_name("Coin Factory"), "金币矿山");
        assert_eq!(normalize_building_name("Woodcutter"), "伐木场");
        assert_eq!(normalize_building_name("Mason Workshop"), "采石场");
    }

    #[test]
    fn test_normalize_worker_building_references() {
        let mut workers = vec![Worker::new("测试", "mining", "测试背景", "Coin Mine")];
        workers[0].assigned_building = Some("Stone Quarry".to_string());

        normalize_worker_building_references(&mut workers);

        assert_eq!(workers[0].preferences, "金币矿山");
        assert_eq!(workers[0].assigned_building.as_deref(), Some("采石场"));
    }

    #[test]
    fn test_normalize_housing_resource_key() {
        assert_eq!(
            normalize_housing_resource_key("coins"),
            Some(ResourceType::Gold)
        );
        assert_eq!(
            normalize_housing_resource_key("Gold"),
            Some(ResourceType::Gold)
        );
        assert_eq!(
            normalize_housing_resource_key(" coins "),
            Some(ResourceType::Gold)
        );
        assert_eq!(
            normalize_housing_resource_key("WOOD"),
            Some(ResourceType::Wood)
        );
        assert_eq!(
            normalize_housing_resource_key("stone"),
            Some(ResourceType::Stone)
        );
        assert_eq!(
            normalize_housing_resource_key("iron_ingot"),
            Some(ResourceType::IronIngot)
        );
        assert_eq!(
            normalize_housing_resource_key("QuantumComputer"),
            Some(ResourceType::QuantumComputer)
        );
        assert_eq!(
            normalize_housing_resource_key("crystal"),
            Some(ResourceType::Crystal)
        );
        assert_eq!(normalize_housing_resource_key("mystery"), None);
    }
}

impl IdleGame {
    fn worker_summary_view(worker: &Worker, index: usize) -> WorkerSummaryView {
        WorkerSummaryView {
            index,
            name: worker.name.clone(),
            skills: worker.skills.clone(),
            background: worker.background.clone(),
            preferences: worker.preferences.clone(),
            assigned_building: worker.assigned_building.clone(),
            level: worker.level,
            efficiency_multiplier: worker.efficiency_multiplier,
            xp: worker.xp,
            xp_to_next_level: worker.xp_to_next_level,
            gender: format!("{:?}", worker.gender),
            hobbies: worker
                .hobbies
                .iter()
                .map(|hobby| format!("{:?}", hobby))
                .collect(),
            primary_trait: format!("{:?}", worker.primary_trait),
            secondary_traits: worker
                .secondary_traits
                .iter()
                .map(|trait_value| format!("{:?}", trait_value))
                .collect(),
            happiness: worker.happiness,
            hunger: worker.hunger,
            focus: worker.focus,
            fatigue: worker.fatigue,
            stress: worker.stress,
            is_hungry: worker.is_hungry,
            missing_limbs: worker
                .missing_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
            maggot_limbs: worker
                .maggot_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
        }
    }

    fn worker_detail_view(&self, index: usize) -> Option<WorkerDetailView> {
        let worker = self.workers.get(index)?;
        let assigned_building = worker.assigned_building.as_deref();
        let base_efficiency = 1.0 + (worker.level as f64) * 0.05;
        let total_efficiency = assigned_building
            .map(|building| self.calculate_worker_efficiency_for(worker, building))
            .unwrap_or(base_efficiency);
        let breakdown = self.build_worker_efficiency_breakdown(worker, assigned_building);
        let (can_maggot_surgery, maggot_surgery_cost, maggot_surgery_reason) =
            self.get_maggot_limb_surgery_status(worker);
        let current_stage = self.state.borrow().current_stage;

        let auto_assignment_target = if assigned_building.is_none() {
            self.buildings
                .iter()
                .filter(|building| {
                    building.count > 0
                        && self.has_assignment_capacity(usize::MAX, &building.name)
                        && stage::is_building_revealed(
                            building,
                            current_stage,
                            &self.technology_tree,
                        )
                })
                .max_by(|a, b| {
                    let gain_a = a.production_rate
                        * a.count as f64
                        * (self.calculate_worker_efficiency_for(worker, &a.name) - 1.0);
                    let gain_b = b.production_rate
                        * b.count as f64
                        * (self.calculate_worker_efficiency_for(worker, &b.name) - 1.0);
                    gain_a
                        .partial_cmp(&gain_b)
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .map(|building| building.name.clone())
        } else {
            None
        };

        Some(WorkerDetailView {
            index,
            name: worker.name.clone(),
            skills: worker.skills.clone(),
            background: worker.background.clone(),
            preferences: worker.preferences.clone(),
            assigned_building: worker.assigned_building.clone(),
            level: worker.level,
            efficiency_multiplier: worker.efficiency_multiplier,
            base_efficiency,
            total_efficiency,
            efficiency_breakdown: breakdown,
            auto_assignment_target,
            xp: worker.xp,
            xp_to_next_level: worker.xp_to_next_level,
            gender: format!("{:?}", worker.gender),
            hobbies: worker
                .hobbies
                .iter()
                .map(|hobby| format!("{:?}", hobby))
                .collect(),
            primary_trait: format!("{:?}", worker.primary_trait),
            secondary_traits: worker
                .secondary_traits
                .iter()
                .map(|trait_value| format!("{:?}", trait_value))
                .collect(),
            happiness: worker.happiness,
            hunger: worker.hunger,
            focus: worker.focus,
            fatigue: worker.fatigue,
            stress: worker.stress,
            is_hungry: worker.is_hungry,
            missing_limbs: worker
                .missing_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
            maggot_limbs: worker
                .maggot_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
            can_maggot_surgery,
            maggot_surgery_cost,
            maggot_surgery_reason,
        })
    }

    fn build_filtered_worker_indices(
        &self,
        query: &str,
        filter_by: &str,
        sort_by: &str,
    ) -> Vec<usize> {
        let query = query.trim().to_lowercase();
        let mut indices: Vec<usize> = self
            .workers
            .iter()
            .enumerate()
            .filter(|(_, worker)| {
                let is_assigned = worker.assigned_building.is_some();
                if filter_by == "assigned" && !is_assigned {
                    return false;
                }
                if filter_by == "unassigned" && is_assigned {
                    return false;
                }
                if query.is_empty() {
                    return true;
                }

                Self::worker_matches_query(worker, &query)
            })
            .map(|(index, _)| index)
            .collect();

        indices.sort_unstable_by(|a, b| {
            let worker_a = &self.workers[*a];
            let worker_b = &self.workers[*b];
            match sort_by {
                "level" => worker_b.level.cmp(&worker_a.level),
                "efficiency" => worker_b
                    .efficiency_multiplier
                    .total_cmp(&worker_a.efficiency_multiplier),
                _ => worker_a.name.cmp(&worker_b.name),
            }
        });

        indices
    }

    fn worker_matches_query(worker: &Worker, query: &str) -> bool {
        Self::field_matches_query(&worker.name, query)
            || Self::field_matches_query(&worker.skills, query)
            || Self::field_matches_query(&worker.preferences, query)
            || worker
                .assigned_building
                .as_deref()
                .is_some_and(|building| Self::field_matches_query(building, query))
    }

    fn field_matches_query(value: &str, query: &str) -> bool {
        value.to_lowercase().contains(query)
    }

    fn limb_slot_label(slot: LimbSlot) -> &'static str {
        match slot {
            LimbSlot::LeftArm => "左手",
            LimbSlot::RightArm => "右手",
            LimbSlot::LeftLeg => "左腿",
            LimbSlot::RightLeg => "右腿",
        }
    }

    fn maggot_limb_surgery_cost(worker: &Worker) -> f64 {
        worker.missing_limbs.len() as f64 * 15.0
    }

    fn has_maggot_limb_surgery_unlock(&self) -> bool {
        self.state.borrow().current_stage >= GameStage::Maggot
    }

    fn get_maggot_limb_surgery_status(&self, worker: &Worker) -> (bool, f64, Option<String>) {
        let cost = Self::maggot_limb_surgery_cost(worker);
        if worker.missing_limbs.is_empty() {
            return (false, cost, Some("当前没有残缺肢体".to_string()));
        }

        if !self.has_maggot_limb_surgery_unlock() {
            return (false, cost, Some("蛆虫阶段尚未解锁肢体置换".to_string()));
        }

        let available_maggots = self.state.borrow().get_resource(ResourceType::Maggot);
        if available_maggots + 1e-10 < cost {
            return (
                false,
                cost,
                Some(format!("蛆虫不足：需要 {:.0}", cost.ceil())),
            );
        }

        (true, cost, None)
    }

    fn worker_job_profile(building_id: &str) -> WorkerJobProfile {
        match building_id {
            "金币矿山" | "伐木场" | "采石场" | "铁矿场" | "铜矿场" | "铝矿场" | "煤矿场"
            | "石油井" | "水晶矿" => WorkerJobProfile {
                labor: 1.0,
                precision: 0.2,
                cognitive: 0.1,
                organic: 0.0,
                social: 0.1,
            },
            "农场" | "腐食育蛆槽" | "蛆虫工厂" | "腐肉育池" | "共生培育舱" => {
                WorkerJobProfile {
                    labor: 0.4,
                    precision: 0.3,
                    cognitive: 0.2,
                    organic: 1.0,
                    social: 0.5,
                }
            }
            "铁锭冶炼厂" | "铜锭冶炼厂" | "钢铁厂" | "玻璃厂" | "塑料厂" | "齿轮厂" | "电池厂"
            | "发电机厂" | "机器人工厂" => WorkerJobProfile {
                labor: 0.8,
                precision: 0.55,
                cognitive: 0.35,
                organic: 0.0,
                social: 0.1,
            },
            "化学品厂"
            | "电路板厂"
            | "马达厂"
            | "传感器厂"
            | "芯片制造厂"
            | "量子计算中心"
            | "纳米机器人工厂"
            | "反物质反应堆"
            | "时间水晶合成器"
            | "神经尖塔"
            | "深空孵化港" => WorkerJobProfile {
                labor: 0.25,
                precision: 0.95,
                cognitive: 1.0,
                organic: 0.0,
                social: 0.25,
            },
            _ => WorkerJobProfile {
                labor: 0.35,
                precision: 0.35,
                cognitive: 0.35,
                organic: 0.1,
                social: 0.2,
            },
        }
    }

    fn count_workers_assigned_to_building(
        &self,
        building_id: &str,
        excluding_worker: Option<usize>,
    ) -> usize {
        self.workers
            .iter()
            .enumerate()
            .filter(|(index, worker)| {
                excluding_worker != Some(*index)
                    && worker.assigned_building.as_deref() == Some(building_id)
            })
            .count()
    }

    fn building_assignment_capacity(&self, building_id: &str) -> usize {
        self.buildings
            .iter()
            .find(|building| building.name == building_id)
            .map(|building| building.count as usize)
            .unwrap_or(0)
    }

    fn has_assignment_capacity(&self, worker_index: usize, building_id: &str) -> bool {
        self.count_workers_assigned_to_building(building_id, Some(worker_index))
            < self.building_assignment_capacity(building_id)
    }

    fn worker_limb_modifier(&self, worker: &Worker, profile: WorkerJobProfile) -> f64 {
        let mut modifier = 0.0;

        for limb in &worker.missing_limbs {
            modifier -= match limb {
                LimbSlot::LeftArm | LimbSlot::RightArm => {
                    0.06 + (profile.labor * 0.10) + (profile.precision * 0.16)
                }
                LimbSlot::LeftLeg | LimbSlot::RightLeg => {
                    0.05 + (profile.labor * 0.12)
                        + (profile.organic * 0.05)
                        + (profile.social * 0.03)
                }
            };
        }

        for limb in &worker.maggot_limbs {
            modifier += match limb {
                LimbSlot::LeftArm | LimbSlot::RightArm => {
                    (profile.organic * 0.10) + (profile.social * 0.03) - (profile.precision * 0.04)
                }
                LimbSlot::LeftLeg | LimbSlot::RightLeg => {
                    (profile.organic * 0.08) + (profile.labor * 0.03) - (profile.cognitive * 0.02)
                }
            };
        }

        modifier
    }

    fn worker_job_fit_bonus(
        &self,
        worker: &Worker,
        building_id: &str,
        profile: WorkerJobProfile,
    ) -> f64 {
        let skill = worker.skills.to_lowercase();
        let background = worker.background.to_lowercase();
        let mut bonus = 0.0;

        if worker.preferences == building_id {
            bonus += 0.35;
        }

        if (skill.contains("min") || skill.contains("石") || skill.contains("矿"))
            && profile.labor >= 0.8
        {
            bonus += 0.14;
        }
        if (skill.contains("farm") || skill.contains("food") || skill.contains("survival"))
            && profile.organic >= 0.8
        {
            bonus += 0.14;
        }
        if (skill.contains("factory") || skill.contains("craft") || skill.contains("engin"))
            && profile.precision >= 0.5
        {
            bonus += 0.12;
        }
        if (skill.contains("research") || skill.contains("tech") || skill.contains("comput"))
            && profile.cognitive >= 0.8
        {
            bonus += 0.14;
        }

        if (background.contains("工匠")
            || background.contains("车间")
            || background.contains("实验"))
            && profile.precision >= 0.5
        {
            bonus += 0.08;
        }
        if (background.contains("农") || background.contains("生存") || background.contains("照料"))
            && profile.organic >= 0.8
        {
            bonus += 0.08;
        }

        for hobby in &worker.hobbies {
            bonus += match hobby {
                Hobby::Gardening | Hobby::Cooking if profile.organic >= 0.8 => 0.08,
                Hobby::Reading | Hobby::Gaming | Hobby::Photography if profile.cognitive >= 0.8 => {
                    0.07
                }
                Hobby::Sports | Hobby::Fishing if profile.labor >= 0.8 => 0.06,
                Hobby::Music | Hobby::Art if profile.social >= 0.4 || profile.organic >= 0.8 => {
                    0.05
                }
                _ => 0.0,
            };
        }

        bonus += match worker.primary_trait {
            Trait::Careful if profile.precision >= 0.8 => 0.08,
            Trait::Creative if profile.cognitive >= 0.8 || profile.organic >= 0.8 => 0.08,
            Trait::Diligent | Trait::Persevering if profile.labor >= 0.8 => 0.08,
            Trait::Social | Trait::Charismatic if profile.social >= 0.4 => 0.07,
            Trait::Loner if profile.social >= 0.4 => -0.05,
            Trait::Clumsy | Trait::Careless if profile.precision >= 0.8 => -0.08,
            Trait::NightOwl if profile.cognitive >= 0.8 => 0.05,
            Trait::EarlyBird if profile.organic >= 0.8 || profile.labor >= 0.8 => 0.05,
            _ => 0.0,
        };

        bonus
    }

    fn worker_state_bonus(&self, worker: &Worker, profile: WorkerJobProfile) -> f64 {
        let happiness_bonus = ((worker.happiness - 50.0) / 50.0)
            * (0.08 + profile.social * 0.07 + profile.organic * 0.05);
        let focus_bonus = ((worker.focus - 50.0) / 50.0)
            * (0.04 + profile.precision * 0.08 + profile.cognitive * 0.1);
        let fatigue_penalty =
            (worker.fatigue / 100.0) * (0.05 + profile.labor * 0.18 + profile.precision * 0.05);
        let stress_penalty =
            (worker.stress / 100.0) * (0.04 + profile.cognitive * 0.12 + profile.social * 0.08);
        let hunger_penalty = if worker.is_hungry || worker.hunger >= 75.0 {
            0.22
        } else if worker.hunger >= 40.0 {
            0.11
        } else {
            0.0
        };

        happiness_bonus + focus_bonus - fatigue_penalty - stress_penalty - hunger_penalty
    }

    fn refresh_worker_state(&mut self, elapsed: f64) {
        if elapsed <= 0.0 {
            return;
        }

        for worker in &mut self.workers {
            let assigned = worker.assigned_building.clone();
            if let Some(building_id) = assigned.as_deref() {
                let profile = Self::worker_job_profile(building_id);
                let preference_drive = if worker.preferences == building_id {
                    -0.25
                } else {
                    0.2
                };

                worker.fatigue = (worker.fatigue
                    + ((0.5 + profile.labor * 1.8 + profile.cognitive * 0.4 + preference_drive)
                        * elapsed))
                    .clamp(0.0, 100.0);
                worker.stress = (worker.stress
                    + ((0.35 + profile.precision * 0.8 + profile.cognitive * 1.0
                        - worker.happiness * 0.004)
                        * elapsed))
                    .clamp(0.0, 100.0);
                worker.focus = (worker.focus
                    + ((0.2 + profile.cognitive * 0.8 + profile.precision * 0.6
                        - worker.stress * 0.01
                        - worker.hunger * 0.004)
                        * elapsed))
                    .clamp(0.0, 100.0);
            } else {
                worker.fatigue = (worker.fatigue - (1.4 * elapsed)).clamp(0.0, 100.0);
                worker.stress = (worker.stress - (1.1 * elapsed)).clamp(0.0, 100.0);
                worker.focus = (worker.focus + (0.8 * elapsed)).clamp(0.0, 100.0);
            }
        }
    }

    fn mark_objective_step_completed(&mut self, step_id: &str) {
        let mut state = self.state.borrow_mut();
        if !state
            .objective_chain
            .completed_steps
            .iter()
            .any(|completed| completed == step_id)
        {
            state
                .objective_chain
                .completed_steps
                .push(step_id.to_string());
        }
    }

    fn try_grant_stage_reward(&mut self, stage: GameStage) {
        if stage != GameStage::Workers {
            return;
        }

        let reward_id = "stage_workers";
        let mut state = self.state.borrow_mut();
        if state
            .objective_chain
            .granted_stage_rewards
            .iter()
            .any(|granted| granted == reward_id)
        {
            return;
        }

        state.add_resource(ResourceType::Food, 10.0);
        state.add_resource(ResourceType::Gold, 30.0);
        state
            .objective_chain
            .granted_stage_rewards
            .push(reward_id.to_string());
    }

    fn sync_objective_progress(&mut self) {
        let current_stage = self.state.borrow().current_stage;
        if current_stage < GameStage::Workers {
            return;
        }

        let farm_count = self
            .buildings
            .iter()
            .find(|building| building.name == "农场")
            .map(|building| building.count)
            .unwrap_or(0);
        let food_ready = self.state.borrow().get_resource(ResourceType::Food) >= 1.0;
        let assigned_workers = self
            .workers
            .iter()
            .filter(|worker| worker.assigned_building.is_some())
            .count();
        let purchased_technologies = self
            .technology_tree
            .technologies
            .values()
            .filter(|technology| technology.purchased)
            .count();

        if farm_count >= 1 {
            self.mark_objective_step_completed("build_farm");
        }
        if food_ready {
            self.mark_objective_step_completed("gain_food");
        }
        if assigned_workers >= 1 {
            self.mark_objective_step_completed("assign_worker");
        }
        if purchased_technologies >= 1 {
            self.mark_objective_step_completed("research_first_tech");
        }

        if current_stage >= GameStage::Maggot {
            let maggots_ready = self.state.borrow().get_resource(ResourceType::Maggot) >= 1.0;
            let maggot_factory_count = self
                .buildings
                .iter()
                .find(|building| building.name == "蛆虫工厂")
                .map(|building| building.count)
                .unwrap_or(0);
            let has_maggot_breeding = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::MaggotBreeding);
            let has_necrotic_recycling = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling);

            if maggots_ready {
                self.mark_objective_step_completed("gain_maggot");
            }
            if has_maggot_breeding || has_necrotic_recycling {
                self.mark_objective_step_completed("research_maggot_tech");
            }
            if maggot_factory_count >= 1 {
                self.mark_objective_step_completed("build_maggot_facility");
            }
        }

        if current_stage >= GameStage::Hybrid {
            let (hybrid_population, symbiosis_stability) = {
                let state = self.state.borrow();
                (
                    state.coexistence.hybrid_population,
                    state.coexistence.symbiosis_stability,
                )
            };
            let symbiosis_chambers = self
                .buildings
                .iter()
                .find(|building| building.name == "共生培育舱")
                .map(|building| building.count)
                .unwrap_or(0);
            let has_hive_mind = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::HiveMindProtocol);

            if hybrid_population >= 1.0 {
                self.mark_objective_step_completed("gain_hybrid_population");
            }
            if symbiosis_chambers >= 1 {
                self.mark_objective_step_completed("build_symbiosis_chamber");
            }
            if symbiosis_stability >= 55.0 {
                self.mark_objective_step_completed("stabilize_symbiosis");
            }
            if has_hive_mind {
                self.mark_objective_step_completed("research_hive_mind");
            }
        }

        if current_stage >= GameStage::Collective {
            let dark_matter_ready =
                self.state.borrow().get_resource(ResourceType::DarkMatter) >= 1.0;
            let spaceships_ready = self.state.borrow().get_resource(ResourceType::Spaceship) >= 1.0;
            let has_collective_awakening = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::CollectiveAwakening);
            let has_consciousness_upload = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::ConsciousnessUpload);

            if has_collective_awakening {
                self.mark_objective_step_completed("awaken_collective");
            }
            if dark_matter_ready {
                self.mark_objective_step_completed("produce_dark_matter");
            }
            if has_consciousness_upload {
                self.mark_objective_step_completed("upload_consciousness");
            }
            if spaceships_ready {
                self.mark_objective_step_completed("launch_first_ship");
            }
        }
    }

    fn refresh_progression_state(&mut self) {
        let inferred_stage = {
            let state = self.state.borrow();
            stage::infer_stage_from_state(&state, &self.workers, &self.technology_tree)
        };

        let current_stage = {
            let mut state = self.state.borrow_mut();
            if state.current_stage < inferred_stage {
                state.current_stage = inferred_stage;
            }
            state.current_stage
        };

        self.try_grant_stage_reward(current_stage);
        self.sync_objective_progress();
    }

    fn get_worker_objective_chain_view(&self) -> ObjectiveChainView {
        let state = self.state.borrow();
        if state.current_stage < GameStage::Workers {
            return ObjectiveChainView {
                active: false,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id: None,
                steps: Vec::new(),
            };
        }

        if state.current_stage >= GameStage::Collective {
            let dark_matter = state.get_resource(ResourceType::DarkMatter);
            let spaceships = state.get_resource(ResourceType::Spaceship);
            let completed = &state.objective_chain.completed_steps;
            let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);
            let has_collective_awakening = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::CollectiveAwakening);
            let has_consciousness_upload = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::ConsciousnessUpload);

            let steps = vec![
                ObjectiveStepView {
                    id: "awaken_collective".to_string(),
                    title: "完成统一意识觉醒".to_string(),
                    description: "让共生体真正进入统一意识，终局扩张才会开启。".to_string(),
                    current: if is_completed("awaken_collective") || has_collective_awakening {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("awaken_collective") || has_collective_awakening,
                    reward: "终局网络已激活".to_string(),
                    recommended_tab: "technology".to_string(),
                },
                ObjectiveStepView {
                    id: "produce_dark_matter".to_string(),
                    title: "产出第一批暗物质".to_string(),
                    description: "让黑暗链条真正并入终局资源网络。".to_string(),
                    current: if is_completed("produce_dark_matter") {
                        1.0
                    } else {
                        dark_matter.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("produce_dark_matter"),
                    reward: "终局资源网络建立".to_string(),
                    recommended_tab: "resources".to_string(),
                },
                ObjectiveStepView {
                    id: "upload_consciousness".to_string(),
                    title: "研究意识上传".to_string(),
                    description: "把个体生产彻底并入统一调度体系。".to_string(),
                    current: if is_completed("upload_consciousness") || has_consciousness_upload {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("upload_consciousness") || has_consciousness_upload,
                    reward: "文明级效率跃迁".to_string(),
                    recommended_tab: "technology".to_string(),
                },
                ObjectiveStepView {
                    id: "launch_first_ship".to_string(),
                    title: "建造第一艘太空船".to_string(),
                    description: "把统一意识投射到文明尺度的远征网络。".to_string(),
                    current: if is_completed("launch_first_ship") {
                        1.0
                    } else {
                        spaceships.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("launch_first_ship"),
                    reward: "星际扩张开始".to_string(),
                    recommended_tab: "buildings".to_string(),
                },
            ];

            let current_objective_id = steps
                .iter()
                .find(|step| !step.completed)
                .map(|step| step.id.clone());

            return ObjectiveChainView {
                active: true,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id,
                steps,
            };
        }

        if state.current_stage >= GameStage::Hybrid {
            let hybrid_population = state.coexistence.hybrid_population;
            let symbiosis_stability = state.coexistence.symbiosis_stability;
            let completed = &state.objective_chain.completed_steps;
            let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);
            let symbiosis_chambers = self
                .buildings
                .iter()
                .find(|building| building.name == "共生培育舱")
                .map(|building| building.count as f64)
                .unwrap_or(0.0);
            let has_hive_mind = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::HiveMindProtocol);

            let steps = vec![
                ObjectiveStepView {
                    id: "gain_hybrid_population".to_string(),
                    title: "获得第一批混合人口".to_string(),
                    description: "让共生不再只是状态，而成为可用劳动力。".to_string(),
                    current: if is_completed("gain_hybrid_population") {
                        1.0
                    } else {
                        hybrid_population.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("gain_hybrid_population"),
                    reward: "共生劳动力可用".to_string(),
                    recommended_tab: "lifecycle".to_string(),
                },
                ObjectiveStepView {
                    id: "build_symbiosis_chamber".to_string(),
                    title: "建造第一座共生培育舱".to_string(),
                    description: "为混合人口提供稳定扩张的物理载体。".to_string(),
                    current: if is_completed("build_symbiosis_chamber") {
                        1.0
                    } else {
                        symbiosis_chambers.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("build_symbiosis_chamber"),
                    reward: "共生体系扩张".to_string(),
                    recommended_tab: "buildings".to_string(),
                },
                ObjectiveStepView {
                    id: "stabilize_symbiosis".to_string(),
                    title: "维持共生稳定度".to_string(),
                    description: "把社会风险控制在可运转范围内。".to_string(),
                    current: if is_completed("stabilize_symbiosis") {
                        55.0
                    } else {
                        symbiosis_stability.min(55.0)
                    },
                    required: 55.0,
                    completed: is_completed("stabilize_symbiosis"),
                    reward: "秩序暂时稳定".to_string(),
                    recommended_tab: "lifecycle".to_string(),
                },
                ObjectiveStepView {
                    id: "research_hive_mind".to_string(),
                    title: "研究蜂巢协议".to_string(),
                    description: "让共生个体进入共享思维网络，准备终局跃迁。".to_string(),
                    current: if is_completed("research_hive_mind") || has_hive_mind {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("research_hive_mind") || has_hive_mind,
                    reward: "集体意识入口已出现".to_string(),
                    recommended_tab: "technology".to_string(),
                },
            ];

            let current_objective_id = steps
                .iter()
                .find(|step| !step.completed)
                .map(|step| step.id.clone());

            return ObjectiveChainView {
                active: true,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id,
                steps,
            };
        }

        if state.current_stage >= GameStage::Maggot {
            let maggots = state.get_resource(ResourceType::Maggot);
            let completed = &state.objective_chain.completed_steps;
            let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);
            let maggot_factory = self
                .buildings
                .iter()
                .find(|building| building.name == "蛆虫工厂")
                .map(|building| building.count as f64)
                .unwrap_or(0.0);
            let has_maggot_breeding = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::MaggotBreeding);
            let has_necrotic_recycling = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling);
            let dark_conversion_completed = state.objective_chain.dark_conversion_completed
                || state
                    .objective_chain
                    .completed_steps
                    .iter()
                    .any(|value| value == "complete_dark_conversion");

            let steps = vec![
                ObjectiveStepView {
                    id: "inspect_decay".to_string(),
                    title: "查看生命周期异常".to_string(),
                    description: "先理解聚落正在发生什么，黑暗分支才有意义。".to_string(),
                    current: 1.0,
                    required: 1.0,
                    completed: true,
                    reward: "异常记录已更新".to_string(),
                    recommended_tab: "lifecycle".to_string(),
                },
                ObjectiveStepView {
                    id: "gain_maggot".to_string(),
                    title: "获得第一批蛆虫".to_string(),
                    description: "让死亡后果第一次转化为可利用的资源。".to_string(),
                    current: if is_completed("gain_maggot") {
                        1.0
                    } else {
                        maggots.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("gain_maggot"),
                    reward: "黑暗资源链出现".to_string(),
                    recommended_tab: "resources".to_string(),
                },
                ObjectiveStepView {
                    id: "research_maggot_tech".to_string(),
                    title: "研究首项黑暗科技".to_string(),
                    description: "用科技把黑暗链条从偶然转向可控扩张。".to_string(),
                    current: if is_completed("research_maggot_tech")
                        || has_maggot_breeding
                        || has_necrotic_recycling
                    {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("research_maggot_tech")
                        || has_maggot_breeding
                        || has_necrotic_recycling,
                    reward: "共生过渡路线出现".to_string(),
                    recommended_tab: "technology".to_string(),
                },
                ObjectiveStepView {
                    id: "build_maggot_facility".to_string(),
                    title: "建造第一座蛆虫工厂".to_string(),
                    description: "用黑暗科技把偶发尸腐转成稳定生产线。".to_string(),
                    current: if is_completed("build_maggot_facility") {
                        1.0
                    } else {
                        maggot_factory.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("build_maggot_facility"),
                    reward: "黑暗加工已开启".to_string(),
                    recommended_tab: "buildings".to_string(),
                },
                ObjectiveStepView {
                    id: "complete_dark_conversion".to_string(),
                    title: "完成第一次黑暗转化".to_string(),
                    description: "让蛆虫第一次被加工成可用产出，完成首轮黑暗闭环。".to_string(),
                    current: if dark_conversion_completed { 1.0 } else { 0.0 },
                    required: 1.0,
                    completed: dark_conversion_completed,
                    reward: "黑暗闭环成立".to_string(),
                    recommended_tab: "work".to_string(),
                },
            ];

            let current_objective_id = steps
                .iter()
                .find(|step| !step.completed)
                .map(|step| step.id.clone());

            return ObjectiveChainView {
                active: true,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id,
                steps,
            };
        }

        let farm_count = self
            .buildings
            .iter()
            .find(|building| building.name == "农场")
            .map(|building| building.count as f64)
            .unwrap_or(0.0);
        let food_amount = state.get_resource(ResourceType::Food);
        let assigned_workers = self
            .workers
            .iter()
            .filter(|worker| worker.assigned_building.is_some())
            .count() as f64;
        let purchased_technologies = self
            .technology_tree
            .technologies
            .values()
            .filter(|technology| technology.purchased)
            .count() as f64;
        let completed = &state.objective_chain.completed_steps;
        let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);

        let steps = vec![
            ObjectiveStepView {
                id: "build_farm".to_string(),
                title: "建造第一座农场".to_string(),
                description: "先建立稳定的食物来源，工人阶段才能真正运转。".to_string(),
                current: if is_completed("build_farm") {
                    1.0
                } else {
                    farm_count.min(1.0)
                },
                required: 1.0,
                completed: is_completed("build_farm"),
                reward: "食物补给 +5".to_string(),
                recommended_tab: "buildings".to_string(),
            },
            ObjectiveStepView {
                id: "gain_food".to_string(),
                title: "获得第一份食物".to_string(),
                description: "让聚落先吃上第一口饭，供养系统才算启动。".to_string(),
                current: if is_completed("gain_food") {
                    1.0
                } else {
                    food_amount.min(1.0)
                },
                required: 1.0,
                completed: is_completed("gain_food"),
                reward: "金币补给 +15".to_string(),
                recommended_tab: "resources".to_string(),
            },
            ObjectiveStepView {
                id: "assign_worker".to_string(),
                title: "分配第一名工人".to_string(),
                description: "让第一位工人进入岗位，开始真正的人口驱动产能。".to_string(),
                current: if is_completed("assign_worker") {
                    1.0
                } else {
                    assigned_workers.min(1.0)
                },
                required: 1.0,
                completed: is_completed("assign_worker"),
                reward: "效率观察已解锁".to_string(),
                recommended_tab: "workers".to_string(),
            },
            ObjectiveStepView {
                id: "research_first_tech".to_string(),
                title: "研究第一项科技".to_string(),
                description: "用第一项科技把聚落从生存模式推向系统化扩张。".to_string(),
                current: if is_completed("research_first_tech") {
                    1.0
                } else {
                    purchased_technologies.min(1.0)
                },
                required: 1.0,
                completed: is_completed("research_first_tech"),
                reward: "新生产线即将展开".to_string(),
                recommended_tab: "technology".to_string(),
            },
        ];

        let current_objective_id = steps
            .iter()
            .find(|step| !step.completed)
            .map(|step| step.id.clone());

        ObjectiveChainView {
            active: true,
            stage_id: state.current_stage.id().to_string(),
            current_objective_id,
            steps,
        }
    }

    fn calculate_worker_efficiency_multiplier(
        &self,
        worker_index: usize,
        building_id: &str,
    ) -> f64 {
        if worker_index >= self.workers.len() {
            return 1.0;
        }

        let worker = &self.workers[worker_index];
        self.calculate_worker_efficiency_for(worker, building_id)
    }

    fn calculate_worker_efficiency_for(&self, worker: &Worker, building_id: &str) -> f64 {
        let profile = Self::worker_job_profile(building_id);
        let mut efficiency = 1.0;
        efficiency += self.worker_job_fit_bonus(worker, building_id, profile);
        efficiency += (worker.level as f64) * 0.04;
        efficiency += worker.primary_trait.get_effect().efficiency_bonus;
        efficiency += worker
            .secondary_traits
            .iter()
            .map(|trait_value| trait_value.get_effect().efficiency_bonus * 0.5)
            .sum::<f64>();
        efficiency += self.worker_state_bonus(worker, profile);
        efficiency += self.worker_limb_modifier(worker, profile);
        efficiency.max(0.25)
    }

    fn build_worker_efficiency_breakdown(
        &self,
        worker: &Worker,
        building_id: Option<&str>,
    ) -> Vec<String> {
        let mut parts = vec!["基础 100%".to_string()];

        if let Some(target_building) = building_id {
            let profile = Self::worker_job_profile(target_building);
            if worker.preferences == target_building {
                parts.push("偏好岗位 +35%".to_string());
            }
            let fit_bonus = self.worker_job_fit_bonus(worker, target_building, profile);
            if fit_bonus.abs() > 0.001 {
                parts.push(format!("岗位契合 {:+.0}%", fit_bonus * 100.0));
            }
            let state_bonus = self.worker_state_bonus(worker, profile);
            if state_bonus.abs() > 0.001 {
                parts.push(format!("状态修正 {:+.0}%", state_bonus * 100.0));
            }
            let limb_bonus = self.worker_limb_modifier(worker, profile);
            if limb_bonus.abs() > 0.001 {
                parts.push(format!("肢体修正 {:+.0}%", limb_bonus * 100.0));
            }
        }

        let level_bonus = (worker.level as f64) * 4.0;
        if level_bonus > 0.0 {
            parts.push(format!("等级加成 +{:.0}%", level_bonus));
        }

        let primary_bonus = worker.primary_trait.get_effect().efficiency_bonus;
        if primary_bonus.abs() > f64::EPSILON {
            parts.push(format!("主特质 {:+.0}%", primary_bonus * 100.0));
        }

        let secondary_bonus = worker
            .secondary_traits
            .iter()
            .map(|trait_value| trait_value.get_effect().efficiency_bonus * 0.5)
            .sum::<f64>();
        if secondary_bonus.abs() > f64::EPSILON {
            parts.push(format!("副特质 {:+.0}%", secondary_bonus * 100.0));
        }

        parts.push(format!("专注 {:.0}", worker.focus));
        parts.push(format!("疲劳 {:.0}", worker.fatigue));
        parts.push(format!("压力 {:.0}", worker.stress));

        parts
    }

    fn lifecycle_anomaly_state(&self) -> (&'static str, &'static str) {
        let hungry_workers = self
            .workers
            .iter()
            .filter(|worker| worker.is_hungry)
            .count();
        let corpses = self.state.borrow().get_resource(ResourceType::Corpse);
        let food = self.state.borrow().get_resource(ResourceType::Food);

        if corpses >= 1.0 || hungry_workers >= 2 {
            return (
                "breach",
                "尸体开始出现不正常的异动，聚落里已经没人愿意靠近储藏区。",
            );
        }

        if hungry_workers >= 1 || food <= 0.0 {
            return (
                "decay",
                "饥饿和死亡的气味正在扩散，秩序已经出现肉眼可见的裂缝。",
            );
        }

        if food < self.workers.len() as f64 + 1.0 {
            return (
                "warning",
                "空气里开始弥漫紧张和腐败的味道，补给似乎撑不了太久。",
            );
        }

        (
            "stable",
            "聚落暂时维持住了秩序，但所有人都知道这种平衡并不牢靠。",
        )
    }

    fn calculate_assignment_gain(&self, worker_index: usize, building: &Building) -> f64 {
        if building.count == 0 {
            return 0.0;
        }

        let efficiency = self.calculate_worker_efficiency_multiplier(worker_index, &building.name);
        let base_output = building.production_rate * building.count as f64;
        (base_output * (efficiency - 1.0)).max(0.0)
    }

    /// Serialize entire game state to SavedGame structure
    pub fn save_game(&self) -> SavedGame {
        SavedGame {
            state: self.state.borrow().clone(),
            statistics: self.statistics.borrow().clone(),
            buildings: self.buildings.clone(),
            housing_buildings: self.housing_buildings.clone(),
            workers: self.workers.clone(),
            population_queue: self.population_queue.clone(),
            achievements: self.achievements.clone(),
            legacy_crafting_recipes: vec![],
            unlocked_features: self.unlocked_features.clone(),
            technology_tree: self.technology_tree.clone(),
            last_food_consumption_time: self.last_food_consumption_time,
            last_worker_spawn_time: self.last_worker_spawn_time,
            save_timestamp: Date::now(),
            version: crate::state::game_state::SAVE_VERSION.to_string(),
        }
    }

    /// Load game state from SavedGame structure
    pub fn load_game(&mut self, saved: SavedGame) {
        let now = Date::now();
        const MAX_RESUME_AGE_MS: f64 = 3_600_000.0;

        {
            let mut state = self.state.borrow_mut();
            *state = saved.state;
            state.last_update_time =
                clamp_loaded_timestamp(state.last_update_time, now, MAX_RESUME_AGE_MS);
        }

        {
            let mut stats = self.statistics.borrow_mut();
            *stats = saved.statistics;
        }

        self.buildings = saved.buildings;
        for building in &mut self.buildings {
            building.name = normalize_building_name(&building.name);
            let inferred = infer_output_resource_from_building_name(&building.name);
            if building.output_resource == ResourceType::Gold && inferred != ResourceType::Gold {
                building.output_resource = inferred;
            }
        }
        self.housing_buildings = merge_loaded_housing_catalog(saved.housing_buildings);
        self.workers = saved.workers;
        normalize_worker_building_references(&mut self.workers);
        self.population_queue = saved.population_queue;
        self.achievements = saved.achievements;
        self.unlocked_features = saved.unlocked_features;
        self.technology_tree = saved.technology_tree;
        {
            let inferred_stage = {
                let state = self.state.borrow();
                stage::infer_stage_from_state(&state, &self.workers, &self.technology_tree)
            };
            let mut state = self.state.borrow_mut();
            if state.current_stage < inferred_stage {
                state.current_stage = inferred_stage;
            }
        }
        self.last_food_consumption_time =
            clamp_loaded_timestamp(saved.last_food_consumption_time, now, MAX_RESUME_AGE_MS);
        self.last_worker_spawn_time =
            clamp_loaded_timestamp(saved.last_worker_spawn_time, now, MAX_RESUME_AGE_MS);

        {
            let mut state = self.state.borrow_mut();
            state.coins_per_click = calculate_click_power_from_buildings(&self.buildings);
        }

        self.update_production();

        // Ensure default workers exist if save is empty (backwards compatibility)
        if self.workers.is_empty() && self.state.borrow().current_stage >= GameStage::Workers {
            self.workers = vec![
                Worker::new("矿工", "mining", "擅长挖矿的工人", "金币矿山"),
                Worker::new("伐木工", "logging", "擅长伐木的工人", "伐木场"),
                Worker::new("石匠", "masonry", "擅长采石的工人", "采石场"),
                Worker::new("工厂工人", "factory", "擅长工厂生产的工人", "金币矿山"),
                Worker::new("高级工匠", "crafting", "擅长高级制作的工匠", "采石场"),
            ];
        }

        // Ensure default housing exists if save is empty (backwards compatibility)
        if self.housing_buildings.is_empty() {
            self.housing_buildings = default_housing_catalog();
        }

        self.refresh_progression_state();
    }
}

#[wasm_bindgen]
impl IdleGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> IdleGame {
        let now = Date::now();

        let achievements = vec![
            // Click achievements
            Achievement {
                id: "click_novice_10".to_string(),
                name: "点击新手".to_string(),
                description: "点击 10 次".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 10.0,
                category: "clicks".to_string(),
            },
            Achievement {
                id: "click_master_100".to_string(),
                name: "点击大师".to_string(),
                description: "点击 100 次".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 100.0,
                category: "clicks".to_string(),
            },
            Achievement {
                id: "click_legend_1000".to_string(),
                name: "点击传奇".to_string(),
                description: "点击 1000 次".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1000.0,
                category: "clicks".to_string(),
            },
            // Resource achievements
            Achievement {
                id: "first_coins_100".to_string(),
                name: "第一桶金".to_string(),
                description: "获得 100 金币".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 100.0,
                category: "resources".to_string(),
            },
            Achievement {
                id: "wood_collector_1000".to_string(),
                name: "木材收集者".to_string(),
                description: "获得 1000 木头".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1000.0,
                category: "resources".to_string(),
            },
            Achievement {
                id: "stone_hoarder_5000".to_string(),
                name: "石头囤积者".to_string(),
                description: "获得 5000 石头".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 5000.0,
                category: "resources".to_string(),
            },
            // Building achievements
            Achievement {
                id: "first_building".to_string(),
                name: "第一座建筑".to_string(),
                description: "购买第一座建筑".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1.0,
                category: "buildings".to_string(),
            },
            Achievement {
                id: "building_enthusiast_10".to_string(),
                name: "建筑爱好者".to_string(),
                description: "购买 10 座建筑".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 10.0,
                category: "buildings".to_string(),
            },
            Achievement {
                id: "building_tycoon_50".to_string(),
                name: "建筑大亨".to_string(),
                description: "购买 50 座建筑".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 50.0,
                category: "buildings".to_string(),
            },
            // Crafting achievements
            Achievement {
                id: "first_craft".to_string(),
                name: "第一次加工".to_string(),
                description: "通过工厂产出第一个加工资源".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1.0,
                category: "crafting".to_string(),
            },
            Achievement {
                id: "craft_master_100".to_string(),
                name: "工业大师".to_string(),
                description: "通过工厂累计产出 100 个加工资源".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 100.0,
                category: "crafting".to_string(),
            },
            // Unlock achievements
            Achievement {
                id: "first_unlock".to_string(),
                name: "首次解锁".to_string(),
                description: "解锁第一个成就".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1.0,
                category: "unlocks".to_string(),
            },
            Achievement {
                id: "progress_master_5".to_string(),
                name: "进度大师".to_string(),
                description: "解锁 5 个成就".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 5.0,
                category: "unlocks".to_string(),
            },
        ];

        IdleGame {
            state: Rc::new(RefCell::new(GameState {
                resources: {
                    let mut resources = HashMap::new();
                    resources.insert(ResourceType::Gold, 0.0);
                    resources.insert(ResourceType::Wood, 0.0);
                    resources.insert(ResourceType::Stone, 0.0);
                    resources
                },
                coins_per_click: 1.0,
                coins_per_second: 0.0,
                wood_per_second: 0.0,
                stone_per_second: 0.0,
                total_clicks: 0,
                last_update_time: now,
                version: crate::state::game_state::SAVE_VERSION.to_string(),
                prestige_points: 0.0,
                prestige_multiplier: 1.0,
                ..GameState::default()
            })),
            statistics: Rc::new(RefCell::new(Statistics {
                total_clicks: 0,
                total_coins_earned: 0.0,
                total_wood_earned: 0.0,
                total_stone_earned: 0.0,
                total_resources_crafted: 0,
                achievements_unlocked_count: 0,
                play_time_seconds: 0.0,
                buildings_purchased: 0,
                upgrades_purchased: 0,
            })),
            achievements: achievements,
            buildings: vec![
                // 10 primary resource buildings
                Building {
                    name: "金币矿山".to_string(),
                    cost: 15.0,
                    production_rate: 1.0,
                    output_resource: ResourceType::Gold,
                    count: 0,
                },
                Building {
                    name: "伐木场".to_string(),
                    cost: 20.0,
                    production_rate: 1.0,
                    output_resource: ResourceType::Wood,
                    count: 0,
                },
                Building {
                    name: "采石场".to_string(),
                    cost: 25.0,
                    production_rate: 0.5,
                    output_resource: ResourceType::Stone,
                    count: 0,
                },
                Building {
                    name: "铁矿场".to_string(),
                    cost: 50.0,
                    production_rate: 0.5,
                    output_resource: ResourceType::IronOre,
                    count: 0,
                },
                Building {
                    name: "铜矿场".to_string(),
                    cost: 40.0,
                    production_rate: 0.6,
                    output_resource: ResourceType::CopperOre,
                    count: 0,
                },
                Building {
                    name: "铝矿场".to_string(),
                    cost: 60.0,
                    production_rate: 0.4,
                    output_resource: ResourceType::AluminumOre,
                    count: 0,
                },
                Building {
                    name: "煤矿场".to_string(),
                    cost: 70.0,
                    production_rate: 0.5,
                    output_resource: ResourceType::Coal,
                    count: 0,
                },
                Building {
                    name: "石油井".to_string(),
                    cost: 100.0,
                    production_rate: 0.3,
                    output_resource: ResourceType::Oil,
                    count: 0,
                },
                Building {
                    name: "水晶矿".to_string(),
                    cost: 150.0,
                    production_rate: 0.2,
                    output_resource: ResourceType::Crystal,
                    count: 0,
                },
                Building {
                    name: "农场".to_string(),
                    cost: 30.0,
                    production_rate: 2.0,
                    output_resource: ResourceType::Food,
                    count: 0,
                },
                Building {
                    name: "腐食育蛆槽".to_string(),
                    cost: 160.0,
                    production_rate: 0.5,
                    output_resource: ResourceType::Maggot,
                    count: 0,
                },
                Building {
                    name: "蛆虫工厂".to_string(),
                    cost: 200.0,
                    production_rate: 1.0,
                    output_resource: ResourceType::Maggot,
                    count: 0,
                },
                Building {
                    name: "腐肉育池".to_string(),
                    cost: 420.0,
                    production_rate: 3.0,
                    output_resource: ResourceType::Maggot,
                    count: 0,
                },
                Building {
                    name: "共生培育舱".to_string(),
                    cost: 1800.0,
                    production_rate: 8.0,
                    output_resource: ResourceType::Food,
                    count: 0,
                },
                Building {
                    name: "神经尖塔".to_string(),
                    cost: 9000.0,
                    production_rate: 0.3,
                    output_resource: ResourceType::DarkMatter,
                    count: 0,
                },
                Building {
                    name: "深空孵化港".to_string(),
                    cost: 22000.0,
                    production_rate: 0.08,
                    output_resource: ResourceType::Spaceship,
                    count: 0,
                },
                factory_building("铁锭冶炼厂", 220.0, 0.1, ResourceType::IronIngot),
                factory_building("铜锭冶炼厂", 240.0, 0.1, ResourceType::CopperIngot),
                factory_building("化学品厂", 420.0, 0.08, ResourceType::Chemicals),
                factory_building("钢铁厂", 520.0, 0.06, ResourceType::SteelPlate),
                factory_building("玻璃厂", 460.0, 0.08, ResourceType::Glass),
                factory_building("塑料厂", 540.0, 0.08, ResourceType::Plastic),
                factory_building("电路板厂", 760.0, 0.065, ResourceType::CircuitBoard),
                factory_building("马达厂", 1200.0, 0.04, ResourceType::Motor),
                factory_building("传感器厂", 1250.0, 0.04, ResourceType::Sensor),
                factory_building("齿轮厂", 750.0, 0.06, ResourceType::Gear),
                factory_building("电池厂", 1200.0, 0.05, ResourceType::Battery),
                factory_building("发电机厂", 1800.0, 0.04, ResourceType::Generator),
                factory_building("芯片制造厂", 2600.0, 0.04, ResourceType::Microchip),
                factory_building("量子计算中心", 7000.0, 0.012, ResourceType::QuantumComputer),
                factory_building("机器人工厂", 5200.0, 0.02, ResourceType::Robot),
                factory_building("纳米机器人工厂", 9000.0, 0.015, ResourceType::Nanobot),
                factory_building("反物质反应堆", 25000.0, 0.005, ResourceType::Antimatter),
                factory_building("时间水晶合成器", 28000.0, 0.005, ResourceType::TimeCrystal),
            ],
            housing_buildings: default_housing_catalog(),
            workers: vec![],
            population_queue: PopulationQueue::new(),
            last_food_consumption_time: now,
            last_worker_spawn_time: now,
            unlocked_features: vec![
                UnlockedFeature {
                    id: "workers_tab".to_string(),
                    name: "工人面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 50.0,
                },
                UnlockedFeature {
                    id: "advanced_buildings".to_string(),
                    name: "高级建筑".to_string(),
                    feature_type: "building".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "buildings_owned".to_string(),
                    requirement_value: 20.0,
                },
                UnlockedFeature {
                    id: "prestige_system".to_string(),
                    name: "转生系统".to_string(),
                    feature_type: "mechanic".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_coins".to_string(),
                    requirement_value: 10000.0,
                },
                UnlockedFeature {
                    id: "statistics_panel".to_string(),
                    name: "统计面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 10.0,
                },
                UnlockedFeature {
                    id: "achievements_panel".to_string(),
                    name: "成就面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 25.0,
                },
            ],
            technology_tree: TechnologyTree::new(),
        }
    }

    #[wasm_bindgen]
    pub fn click_action(&mut self) {
        // First, update statistics (release borrow immediately)
        {
            let mut stats = self.statistics.borrow_mut();
            stats.total_clicks += 1;
            stats.total_coins_earned += self.state.borrow().coins_per_click;
        } // stats borrow released here

        // Then update game state
        {
            let mut state = self.state.borrow_mut();
            let earned = state.coins_per_click;
            state.add_coins(earned);
            state.total_clicks += 1;
        } // state borrow released here

        // Now check achievements (no conflicting borrows)
        self.check_achievement("click_novice_10");
        self.check_achievement("click_master_100");
        self.check_achievement("click_legend_1000");

        self.update_resources_only();
        self.update_buildings_only();
    }

    #[wasm_bindgen]
    pub fn buy_building(&mut self, index: usize) -> bool {
        if index >= self.buildings.len() {
            return false;
        }

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_building_revealed(
            &self.buildings[index],
            current_stage,
            &self.technology_tree,
        ) {
            return false;
        }

        let building_cost = self.buildings[index].cost;
        let can_afford = {
            let state = self.state.borrow();
            state.get_coins() + 1e-10 >= building_cost
        };

        if can_afford {
            {
                let mut state = self.state.borrow_mut();
                state.spend_coins(building_cost);
                self.buildings[index].count += 1;
                self.buildings[index].cost *= 1.15;
                state.coins_per_click = calculate_click_power_from_buildings(&self.buildings);
            }

            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
            drop(stats);

            self.check_achievement("first_building");
            self.check_achievement("building_enthusiast_10");
            self.check_achievement("building_tycoon_50");

            self.refresh_progression_state();
            self.update_production();
            self.update_resources_only();
            self.update_buildings_only();
            true
        } else {
            self.update_resources_only();
            false
        }
    }

    #[wasm_bindgen]
    pub fn buy_buildings(&mut self, index: usize, count: usize) -> usize {
        if index >= self.buildings.len() {
            return 0;
        }

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_building_revealed(
            &self.buildings[index],
            current_stage,
            &self.technology_tree,
        ) {
            return 0;
        }

        let mut purchased = 0;
        for _ in 0..count {
            let building_cost = self.buildings[index].cost;
            let can_afford = {
                let state = self.state.borrow();
                state.get_coins() + 1e-10 >= building_cost
            };

            if !can_afford {
                break;
            }

            {
                let mut state = self.state.borrow_mut();
                state.spend_coins(building_cost);
                self.buildings[index].count += 1;
                self.buildings[index].cost *= 1.15;
                state.coins_per_click = calculate_click_power_from_buildings(&self.buildings);
            }

            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
            drop(stats);

            purchased += 1;
        }

        if purchased > 0 {
            self.check_achievement("first_building");
            self.check_achievement("building_enthusiast_10");
            self.check_achievement("building_tycoon_50");
            self.refresh_progression_state();
            self.update_production();
            self.update_resources_only();
            self.update_buildings_only();
        }

        purchased
    }

    #[wasm_bindgen]
    pub fn get_max_affordable_building_count(&self, index: usize) -> usize {
        if index >= self.buildings.len() {
            return 0;
        }

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_building_revealed(
            &self.buildings[index],
            current_stage,
            &self.technology_tree,
        ) {
            return 0;
        }

        let coins = self.state.borrow().get_coins();
        let base_cost = self.buildings[index].cost;
        let current_count = self.buildings[index].count;

        let mut cost = base_cost * (1.15_f64).powi(current_count as i32);
        let mut affordable_count = 0;

        while coins + 1e-10 >= cost {
            affordable_count += 1;
            cost *= 1.15;
        }

        affordable_count
    }

    #[wasm_bindgen]
    pub fn build_housing(&mut self, cost: JsValue) -> Result<bool, String> {
        // Parse cost from JsValue to HashMap
        let cost_map: HashMap<String, f64> = serde_wasm_bindgen::from_value(cost)
            .map_err(|e| format!("Failed to parse cost: {}", e))?;

        // Validate cost is not empty
        if cost_map.is_empty() {
            return Err("Cost cannot be empty".to_string());
        }

        // Check if player can afford the housing
        let can_afford = {
            let state = self.state.borrow();
            for (resource, amount) in cost_map.iter() {
                let current = match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.get_resource(resource_type),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
                if current + 1e-10 < *amount {
                    return Err(format!(
                        "Insufficient {}: need {}, have {}",
                        resource, amount, current
                    ));
                }
            }
            true
        };

        if !can_afford {
            self.update_resources_only();
            return Ok(false);
        }

        // Deduct resources
        {
            let mut state = self.state.borrow_mut();
            for (resource, amount) in cost_map.iter() {
                match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.add_resource(resource_type, -*amount),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
            }
        }

        // Create new housing with unique name
        let housing_name = format!("住房{}", self.housing_buildings.len() + 1);
        let total_capacity: u32 = cost_map.values().map(|&v| v as u32).sum();
        let new_housing = Housing::new(&housing_name, cost_map.clone(), total_capacity);
        self.housing_buildings.push(new_housing);

        // Update statistics (release borrow before calling other methods)
        {
            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
        }

        self.update_resources_only();
        Ok(true)
    }

    #[wasm_bindgen]
    pub fn upgrade_housing(&mut self, building_index: usize) -> Result<bool, String> {
        // Validate index
        if building_index >= self.housing_buildings.len() {
            return Err(format!("Invalid housing index: {}", building_index));
        }

        // Get upgrade cost
        let upgrade_cost = {
            let housing = &self.housing_buildings[building_index];
            housing.get_upgrade_cost()
        };

        // Check if player can afford the upgrade
        let can_afford = {
            let state = self.state.borrow();
            for (resource, amount) in upgrade_cost.iter() {
                let current = match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.get_resource(resource_type),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
                if current + 1e-10 < *amount {
                    return Err(format!(
                        "Insufficient {}: need {}, have {}",
                        resource, amount, current
                    ));
                }
            }
            true
        };

        if !can_afford {
            self.update_resources_only();
            return Ok(false);
        }

        // Deduct resources
        {
            let mut state = self.state.borrow_mut();
            for (resource, amount) in upgrade_cost.iter() {
                match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.add_resource(resource_type, -*amount),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
            }
        }

        // Upgrade the housing
        {
            let housing = &mut self.housing_buildings[building_index];
            housing.upgrade();
        }

        // Update statistics (release borrow before calling other methods)
        {
            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
        }

        self.update_resources_only();
        Ok(true)
    }
    #[wasm_bindgen]
    pub fn get_coins(&self) -> f64 {
        self.state.borrow().get_coins()
    }

    #[wasm_bindgen]
    pub fn get_wood(&self) -> f64 {
        self.state.borrow().get_wood()
    }

    #[wasm_bindgen]
    pub fn get_stone(&self) -> f64 {
        self.state.borrow().get_stone()
    }

    #[wasm_bindgen]
    pub fn get_coins_per_second(&self) -> f64 {
        self.state.borrow().coins_per_second
    }

    #[wasm_bindgen]
    pub fn get_wood_per_second(&self) -> f64 {
        self.state.borrow().wood_per_second
    }

    #[wasm_bindgen]
    pub fn get_stone_per_second(&self) -> f64 {
        self.state.borrow().stone_per_second
    }

    #[wasm_bindgen]
    pub fn get_coins_per_click(&self) -> f64 {
        self.state.borrow().coins_per_click
    }

    #[wasm_bindgen]
    pub fn get_total_clicks(&self) -> u32 {
        self.state.borrow().total_clicks
    }

    #[wasm_bindgen]
    pub fn get_resources(&self) -> JsValue {
        let state = self.state.borrow();
        let mut resources = serde_wasm_bindgen::to_value(&HashMap::<String, f64>::new()).unwrap();

        for (resource_type, amount) in state.resources.iter() {
            let key = format!("{:?}", resource_type);
            js_sys::Reflect::set(
                &mut resources,
                &JsValue::from_str(&key),
                &JsValue::from_f64(*amount),
            )
            .unwrap();
        }

        js_sys::Reflect::set(
            &mut resources,
            &JsValue::from_str("coinsPerSecond"),
            &JsValue::from_f64(state.coins_per_second),
        )
        .unwrap();
        js_sys::Reflect::set(
            &mut resources,
            &JsValue::from_str("woodPerSecond"),
            &JsValue::from_f64(state.wood_per_second),
        )
        .unwrap();
        js_sys::Reflect::set(
            &mut resources,
            &JsValue::from_str("stonePerSecond"),
            &JsValue::from_f64(state.stone_per_second),
        )
        .unwrap();
        js_sys::Reflect::set(
            &mut resources,
            &JsValue::from_str("coinsPerClick"),
            &JsValue::from_f64(state.coins_per_click),
        )
        .unwrap();

        resources
    }

    #[wasm_bindgen]
    pub fn assign_worker(&mut self, worker_index: usize, building_id: &str) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let building_exists = self.buildings.iter().any(|b| b.name == building_id);
        if !building_exists {
            return false;
        }

        if !self.has_assignment_capacity(worker_index, building_id) {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let efficiency = self.calculate_worker_efficiency_multiplier(worker_index, building_id);
        self.workers[worker_index].efficiency_multiplier = efficiency;

        self.refresh_progression_state();
        self.update_production();

        true
    }

    #[wasm_bindgen]
    pub fn perform_maggot_limb_surgery(&mut self, worker_index: usize) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let (can_perform, cost, _) =
            self.get_maggot_limb_surgery_status(&self.workers[worker_index]);
        if !can_perform {
            return false;
        }

        {
            let mut state = self.state.borrow_mut();
            state.add_resource(ResourceType::Maggot, -cost);
        }

        let assigned_building = {
            let worker = &mut self.workers[worker_index];
            let replaced_limbs = worker.missing_limbs.clone();
            worker.missing_limbs.clear();
            for limb in replaced_limbs {
                if !worker.maggot_limbs.contains(&limb) {
                    worker.maggot_limbs.push(limb);
                }
            }
            worker.happiness = (worker.happiness + 6.0).clamp(0.0, 100.0);
            worker.focus = (worker.focus + 4.0).clamp(0.0, 100.0);
            worker.fatigue = (worker.fatigue + 10.0).clamp(0.0, 100.0);
            worker.stress = (worker.stress + 6.0).clamp(0.0, 100.0);
            worker.assigned_building.clone()
        };

        if let Some(building_id) = assigned_building {
            let efficiency =
                self.calculate_worker_efficiency_multiplier(worker_index, &building_id);
            self.workers[worker_index].efficiency_multiplier = efficiency;
        }

        self.refresh_progression_state();
        self.update_production();
        true
    }

    #[wasm_bindgen]
    pub fn get_worker_production_bonus(&self, worker_index: usize) -> f64 {
        if worker_index >= self.workers.len() {
            return 0.0;
        }

        let worker = &self.workers[worker_index];
        if worker.assigned_building.is_none() {
            return 0.0;
        }

        worker.efficiency_multiplier - 1.0
    }

    #[wasm_bindgen]
    pub fn get_workers(&self) -> js_sys::Array {
        let workers_array = js_sys::Array::new();
        let current_stage = self.state.borrow().current_stage;

        for worker in self.workers.iter() {
            let worker_obj = js_sys::Object::new();
            let assigned_building = worker.assigned_building.as_deref();
            let base_efficiency = 1.0 + (worker.level as f64) * 0.05;
            let total_efficiency = assigned_building
                .map(|building| self.calculate_worker_efficiency_for(worker, building))
                .unwrap_or(base_efficiency);
            let breakdown = self.build_worker_efficiency_breakdown(worker, assigned_building);
            let (can_maggot_surgery, maggot_surgery_cost, maggot_surgery_reason) =
                self.get_maggot_limb_surgery_status(worker);

            let recommended_assignment = if assigned_building.is_none() {
                self.buildings
                    .iter()
                    .filter(|building| {
                        building.count > 0
                            && self.has_assignment_capacity(usize::MAX, &building.name)
                            && stage::is_building_revealed(
                                building,
                                current_stage,
                                &self.technology_tree,
                            )
                    })
                    .max_by(|a, b| {
                        let gain_a = a.production_rate
                            * a.count as f64
                            * (self.calculate_worker_efficiency_for(worker, &a.name) - 1.0);
                        let gain_b = b.production_rate
                            * b.count as f64
                            * (self.calculate_worker_efficiency_for(worker, &b.name) - 1.0);
                        gain_a
                            .partial_cmp(&gain_b)
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .map(|building| building.name.clone())
            } else {
                None
            };

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&worker.name),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("skills"),
                &JsValue::from_str(&worker.skills),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("background"),
                &JsValue::from_str(&worker.background),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("preferences"),
                &JsValue::from_str(&worker.preferences),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("assignedBuilding"),
                &match &worker.assigned_building {
                    Some(building) => JsValue::from_str(building),
                    None => JsValue::NULL,
                },
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(worker.level as f64),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("efficiencyMultiplier"),
                &JsValue::from_f64(worker.efficiency_multiplier),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("baseEfficiency"),
                &JsValue::from_f64(base_efficiency),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("totalEfficiency"),
                &JsValue::from_f64(total_efficiency),
            )
            .unwrap();

            let breakdown_array = js_sys::Array::new();
            for part in breakdown {
                breakdown_array.push(&JsValue::from_str(&part));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("efficiencyBreakdown"),
                &breakdown_array,
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("autoAssignmentTarget"),
                &match recommended_assignment {
                    Some(ref building) => JsValue::from_str(building),
                    None => JsValue::NULL,
                },
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("xp"),
                &JsValue::from_f64(worker.xp),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("xpToNextLevel"),
                &JsValue::from_f64(worker.xp_to_next_level),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("gender"),
                &JsValue::from_str(&format!("{:?}", worker.gender)),
            )
            .unwrap();

            let hobbies = js_sys::Array::new();
            for hobby in &worker.hobbies {
                hobbies.push(&JsValue::from_str(&format!("{:?}", hobby)));
            }
            js_sys::Reflect::set(&worker_obj, &JsValue::from_str("hobbies"), &hobbies).unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("primaryTrait"),
                &JsValue::from_str(&format!("{:?}", worker.primary_trait)),
            )
            .unwrap();

            let secondary_traits = js_sys::Array::new();
            for t in &worker.secondary_traits {
                secondary_traits.push(&JsValue::from_str(&format!("{:?}", t)));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("secondaryTraits"),
                &secondary_traits,
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("happiness"),
                &JsValue::from_f64(worker.happiness),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("hunger"),
                &JsValue::from_f64(worker.hunger),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("focus"),
                &JsValue::from_f64(worker.focus),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("fatigue"),
                &JsValue::from_f64(worker.fatigue),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("stress"),
                &JsValue::from_f64(worker.stress),
            )
            .unwrap();

            let missing_limbs = js_sys::Array::new();
            for limb in &worker.missing_limbs {
                missing_limbs.push(&JsValue::from_str(Self::limb_slot_label(*limb)));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("missingLimbs"),
                &missing_limbs,
            )
            .unwrap();

            let maggot_limbs = js_sys::Array::new();
            for limb in &worker.maggot_limbs {
                maggot_limbs.push(&JsValue::from_str(Self::limb_slot_label(*limb)));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("maggotLimbs"),
                &maggot_limbs,
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("canMaggotSurgery"),
                &JsValue::from_bool(can_maggot_surgery),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("maggotSurgeryCost"),
                &JsValue::from_f64(maggot_surgery_cost),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("maggotSurgeryReason"),
                &match maggot_surgery_reason {
                    Some(ref reason) => JsValue::from_str(reason),
                    None => JsValue::NULL,
                },
            )
            .unwrap();

            workers_array.push(&worker_obj);
        }

        workers_array
    }

    #[wasm_bindgen]
    pub fn get_buildings(&self) -> JsValue {
        let current_stage = self.state.borrow().current_stage;
        let buildings: Vec<BuildingView> = self
            .buildings
            .iter()
            .enumerate()
            .filter(|(_, building)| {
                stage::is_building_revealed(building, current_stage, &self.technology_tree)
            })
            .map(|(index, building)| BuildingView {
                index,
                name: building.name.clone(),
                cost: building.cost,
                production_rate: building.production_rate,
                output_resource: building.output_resource,
                count: building.count,
            })
            .collect();
        serde_wasm_bindgen::to_value(&buildings).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_housing(&self) -> JsValue {
        let housing = js_sys::Array::new();
        for h in &self.housing_buildings {
            let obj = js_sys::Object::new();
            let level = h.count.max(1);
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&h.name),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("description"),
                &JsValue::from_str(&h.description),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("icon"),
                &JsValue::from_str(&h.icon),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("capacity"),
                &JsValue::from_f64((h.capacity * level) as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("baseCapacity"),
                &JsValue::from_f64(h.capacity as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(level as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("requiredTechnology"),
                &match &h.required_technology {
                    Some(value) => JsValue::from_str(value),
                    None => JsValue::NULL,
                },
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("upgradeCost"),
                &serde_wasm_bindgen::to_value(&h.get_upgrade_cost()).unwrap_or(JsValue::NULL),
            );
            housing.push(&obj);
        }
        housing.into()
    }

    #[wasm_bindgen]
    pub fn get_population_overview(&self) -> JsValue {
        let list = js_sys::Array::new();
        for (idx, worker) in self.workers.iter().enumerate() {
            let obj = js_sys::Object::new();
            let assigned = worker
                .assigned_building
                .clone()
                .unwrap_or_else(|| "未分配".to_string());
            let status = if worker.is_hungry {
                "饥饿"
            } else if worker.assigned_building.is_some() {
                "工作中"
            } else {
                "空闲"
            };
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("id"),
                &JsValue::from_f64(idx as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&worker.name),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("gender"),
                &JsValue::from_str(&format!("{:?}", worker.gender)),
            );
            let _ = js_sys::Reflect::set(&obj, &JsValue::from_str("age"), &JsValue::from_f64(0.0));
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("skill_level"),
                &JsValue::from_str(&worker.skills),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("assigned_building"),
                &JsValue::from_str(&assigned),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("efficiency"),
                &JsValue::from_f64(worker.efficiency_multiplier),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("mood"),
                &JsValue::from_f64(worker.happiness),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("health"),
                &JsValue::from_f64(worker.health.clamp(0.0, 100.0)),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(worker.level as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("status"),
                &JsValue::from_str(status),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("is_hungry"),
                &JsValue::from_bool(worker.is_hungry),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("focus"),
                &JsValue::from_f64(worker.focus),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("fatigue"),
                &JsValue::from_f64(worker.fatigue),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("stress"),
                &JsValue::from_f64(worker.stress),
            );
            list.push(&obj);
        }
        list.into()
    }

    #[wasm_bindgen]
    pub fn get_event_log_count(&self) -> usize {
        self.state.borrow().event_journal.entries.len()
    }

    #[wasm_bindgen]
    pub fn get_event_log_summaries(&self, offset: usize, limit: usize) -> JsValue {
        let state = self.state.borrow();
        let entries = &state.event_journal.entries;
        if entries.is_empty() || limit == 0 {
            return js_sys::Array::new().into();
        }

        let newest_first: Vec<_> = entries
            .iter()
            .rev()
            .skip(offset)
            .take(limit)
            .map(event::summarize_event_entry)
            .collect();
        serde_wasm_bindgen::to_value(&newest_first).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_event_log_detail(&self, event_id: u32) -> JsValue {
        let state = self.state.borrow();
        let rendered = state
            .event_journal
            .entries
            .iter()
            .find(|entry| entry.event_id == event_id)
            .and_then(event::render_event_entry);

        serde_wasm_bindgen::to_value(&rendered).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_active_event_modifiers(&self) -> JsValue {
        let state = self.state.borrow();
        let now = Date::now();
        let active: Vec<_> = state
            .event_journal
            .active_modifiers
            .iter()
            .filter_map(|modifier| event::render_active_modifier_view(modifier, now))
            .collect();

        serde_wasm_bindgen::to_value(&active).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_breaking_event_titles(&self, limit: usize) -> JsValue {
        let items = js_sys::Array::new();
        if limit == 0 {
            return items.into();
        }

        let state = self.state.borrow();
        for entry in state
            .event_journal
            .entries
            .iter()
            .rev()
            .filter(|entry| entry.is_breaking)
            .take(limit)
        {
            if let Some(rendered) = event::render_event_entry(entry) {
                let obj = js_sys::Object::new();
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("eventId"),
                    &JsValue::from_f64(rendered.event_id as f64),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("category"),
                    &JsValue::from_str(&rendered.category),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("impact"),
                    &JsValue::from_str(&rendered.impact),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("headlineZh"),
                    &JsValue::from_str(&rendered.headline_zh),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("headlineEn"),
                    &JsValue::from_str(&rendered.headline_en),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("timestamp"),
                    &JsValue::from_f64(rendered.timestamp),
                );
                items.push(&obj);
            }
        }

        items.into()
    }

    #[wasm_bindgen]
    pub fn get_event_catalog_capacity(&self) -> usize {
        event::catalog_capacity()
    }

    #[wasm_bindgen]
    pub fn get_worker_count(&self) -> u32 {
        self.workers.len() as u32
    }

    #[wasm_bindgen]
    pub fn get_worker_summaries(&self) -> JsValue {
        let workers: Vec<WorkerSummaryView> = self
            .workers
            .iter()
            .enumerate()
            .map(|(index, worker)| Self::worker_summary_view(worker, index))
            .collect();

        serde_wasm_bindgen::to_value(&workers).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_worker_page(
        &self,
        query: String,
        filter_by: String,
        sort_by: String,
        page: usize,
        page_size: usize,
    ) -> JsValue {
        let filtered_indices = self.build_filtered_worker_indices(&query, &filter_by, &sort_by);
        let total = filtered_indices.len();
        let assigned_count = filtered_indices
            .iter()
            .filter(|index| self.workers[**index].assigned_building.is_some())
            .count();
        let safe_page_size = page_size.max(1);
        let safe_page = page.max(1);
        let start = (safe_page - 1) * safe_page_size;

        let workers = if start >= total {
            Vec::new()
        } else {
            filtered_indices[start..(start + safe_page_size).min(total)]
                .iter()
                .map(|index| Self::worker_summary_view(&self.workers[*index], *index))
                .collect()
        };

        serde_wasm_bindgen::to_value(&WorkerPageView {
            total,
            assigned_count,
            page: safe_page,
            page_size: safe_page_size,
            workers,
        })
        .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_building_assignment_counts(&self) -> JsValue {
        let mut counts: HashMap<String, usize> = HashMap::new();
        for worker in &self.workers {
            if let Some(building) = worker.assigned_building.as_ref() {
                *counts.entry(building.clone()).or_insert(0) += 1;
            }
        }

        let mut items: Vec<BuildingAssignmentCountView> = self
            .buildings
            .iter()
            .map(|building| BuildingAssignmentCountView {
                name: building.name.clone(),
                assigned_count: counts.get(&building.name).copied().unwrap_or(0),
            })
            .collect();
        items.sort_unstable_by(|a, b| a.name.cmp(&b.name));

        serde_wasm_bindgen::to_value(&items).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_worker_details(&self, index: usize) -> JsValue {
        self.worker_detail_view(index)
            .and_then(|worker| serde_wasm_bindgen::to_value(&worker).ok())
            .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn assign_worker_auto(&mut self) -> u32 {
        let current_stage = self.state.borrow().current_stage;
        let candidate_buildings: Vec<String> = self
            .buildings
            .iter()
            .filter(|building| {
                building.count > 0
                    && stage::is_building_revealed(building, current_stage, &self.technology_tree)
            })
            .map(|building| building.name.clone())
            .collect();

        if candidate_buildings.is_empty() {
            return 0;
        }

        for worker in &mut self.workers {
            worker.assigned_building = None;
            worker.efficiency_multiplier = 1.0;
        }

        let mut assigned_count = 0u32;
        let mut remaining_slots: HashMap<String, usize> = self
            .buildings
            .iter()
            .filter(|building| {
                building.count > 0
                    && stage::is_building_revealed(building, current_stage, &self.technology_tree)
            })
            .map(|building| (building.name.clone(), building.count as usize))
            .collect();

        let mut worker_order: Vec<(usize, f64)> = (0..self.workers.len())
            .map(|idx| {
                let best_gain = self
                    .buildings
                    .iter()
                    .filter(|building| {
                        building.count > 0
                            && stage::is_building_revealed(
                                building,
                                current_stage,
                                &self.technology_tree,
                            )
                    })
                    .map(|building| self.calculate_assignment_gain(idx, building))
                    .fold(0.0, f64::max);
                (idx, best_gain)
            })
            .collect();

        worker_order.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        for (idx, _) in worker_order {
            let mut ranked_buildings: Vec<(String, f64)> = self
                .buildings
                .iter()
                .filter(|building| {
                    remaining_slots.get(&building.name).copied().unwrap_or(0) > 0
                        && stage::is_building_revealed(
                            building,
                            current_stage,
                            &self.technology_tree,
                        )
                })
                .map(|building| {
                    (
                        building.name.clone(),
                        self.calculate_assignment_gain(idx, building),
                    )
                })
                .collect();

            ranked_buildings.sort_by(|(name_a, gain_a), (name_b, gain_b)| {
                gain_b
                    .partial_cmp(gain_a)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| name_a.cmp(name_b))
            });

            if let Some((best_building, _)) = ranked_buildings.first() {
                if self.assign_worker(idx, best_building) {
                    if let Some(slots) = remaining_slots.get_mut(best_building) {
                        *slots = slots.saturating_sub(1);
                    }
                    assigned_count += 1;
                }
            }
        }

        assigned_count
    }

    #[wasm_bindgen]
    pub fn assign_worker_to_building(&mut self, worker_index: usize, building_id: &str) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let building_exists = self.buildings.iter().any(|b| b.name == building_id);
        if !building_exists {
            return false;
        }

        if !self.has_assignment_capacity(worker_index, building_id) {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let efficiency = self.calculate_worker_efficiency_multiplier(worker_index, building_id);
        self.workers[worker_index].efficiency_multiplier = efficiency;

        self.update_production();

        true
    }

    fn get_worker_bonus_for_building(&self, building_name: &str) -> f64 {
        let mut total_bonus = 1.0;

        for worker in &self.workers {
            if let Some(ref assigned) = worker.assigned_building {
                if assigned == building_name {
                    total_bonus += worker.efficiency_multiplier - 1.0;
                }
            }
        }

        total_bonus
    }

    fn update_production(&mut self) {
        let updated_efficiencies: Vec<f64> = self
            .workers
            .iter()
            .map(|worker| {
                worker
                    .assigned_building
                    .as_deref()
                    .map(|assigned_building| {
                        self.calculate_worker_efficiency_for(worker, assigned_building)
                    })
                    .unwrap_or(1.0)
            })
            .collect();

        for (worker, efficiency) in self
            .workers
            .iter_mut()
            .zip(updated_efficiencies.into_iter())
        {
            worker.efficiency_multiplier = efficiency;
        }

        let mut total_cps = 0.0;
        let mut total_wps = 0.0;
        let mut total_sps = 0.0;

        for building in &self.buildings {
            let base_production = building.production_rate * building.count as f64;
            let worker_bonus = self.get_worker_bonus_for_building(&building.name);
            let boosted_production = base_production * worker_bonus;

            match building.output_resource {
                ResourceType::Gold => {
                    total_cps += boosted_production;
                }
                ResourceType::Wood => {
                    total_wps += boosted_production;
                }
                ResourceType::Stone => {
                    total_sps += boosted_production;
                }
                _ => {}
            }
        }

        total_cps = if total_cps.is_finite() && total_cps >= 0.0 {
            total_cps
        } else {
            0.0
        };
        total_wps = if total_wps.is_finite() && total_wps >= 0.0 {
            total_wps
        } else {
            0.0
        };
        total_sps = if total_sps.is_finite() && total_sps >= 0.0 {
            total_sps
        } else {
            0.0
        };

        let now = Date::now();
        let modifier_totals = {
            let state = self.state.borrow();
            event::active_modifier_totals(&state, now)
        };

        total_cps = (total_cps + modifier_totals.coins_per_second_delta).max(0.0);
        total_wps = (total_wps + modifier_totals.wood_per_second_delta).max(0.0);
        total_sps = (total_sps + modifier_totals.stone_per_second_delta).max(0.0);

        let mut state = self.state.borrow_mut();
        state.coins_per_second = total_cps;
        state.wood_per_second = total_wps;
        state.stone_per_second = total_sps;
    }

    fn get_housing_capacity_internal(&self) -> u32 {
        self.housing_buildings
            .iter()
            .map(|h| h.capacity * h.count.max(1))
            .sum()
    }

    fn process_housing_queue(&mut self) {
        let capacity = self.get_housing_capacity_internal() as usize;
        while self.workers.len() < capacity {
            match self.population_queue.pop_front() {
                Some(worker) => self.workers.push(worker),
                None => break,
            }
        }
    }

    fn try_spawn_worker(&mut self, now: f64) {
        const WORKER_SPAWN_INTERVAL_MS: f64 = 30_000.0;
        if self.state.borrow().current_stage < GameStage::Workers {
            return;
        }
        if now - self.last_worker_spawn_time < WORKER_SPAWN_INTERVAL_MS {
            return;
        }

        self.last_worker_spawn_time = now;
        let worker = WorkerGenerator::generate_random_worker();
        let capacity = self.get_housing_capacity_internal() as usize;
        if self.workers.len() < capacity {
            self.workers.push(worker);
        } else {
            self.population_queue.push_back(worker);
        }

        self.assign_worker_auto();
    }

    fn grant_worker_xp(&mut self, elapsed: f64) {
        for i in 0..self.workers.len() {
            if self.workers[i].assigned_building.is_some() {
                let xp_gain = 10.0 * elapsed;
                self.workers[i].xp += xp_gain;

                while self.workers[i].xp >= self.workers[i].xp_to_next_level {
                    self.workers[i].xp -= self.workers[i].xp_to_next_level;
                    self.workers[i].level += 1;
                    self.workers[i].xp_to_next_level =
                        (self.workers[i].xp_to_next_level * 1.5).ceil();

                    let preference = &self.workers[i].preferences;
                    let assigned = self.workers[i].assigned_building.as_ref().unwrap();
                    let mut efficiency = 1.0;

                    if preference == assigned {
                        efficiency += 0.2;
                    }
                    efficiency += (self.workers[i].level as f64) * 0.05;
                    self.workers[i].efficiency_multiplier = efficiency;
                }
            }
        }

        // Don't call update_production here to avoid borrow conflicts
        // Caller should call it after releasing other borrows
    }

    #[wasm_bindgen]
    pub fn game_loop(&mut self) {
        let now = Date::now();

        // Get technology bonuses
        let tech_bonuses = self.technology_tree.calculate_bonuses();

        // Get production rates from production system BEFORE borrowing state mutably
        let production =
            production::update_production(&self.buildings, &self.workers, &tech_bonuses);

        let active_modifier_totals = {
            let state = self.state.borrow();
            event::active_modifier_totals(&state, now)
        };

        let (new_coins, new_wood, new_stone, new_last_update_time, elapsed) = {
            let state = self.state.borrow();
            let elapsed = (now - state.last_update_time) / 1000.0;

            if elapsed > 0.0 && elapsed < 3600.0 {
                // Use production[0] for coins, production[1] for wood, production[2] for stone
                let mut new_coins = state.get_coins()
                    + (production[0] + active_modifier_totals.coins_per_second_delta) * elapsed;
                let new_wood = state.get_wood()
                    + (production[1] + active_modifier_totals.wood_per_second_delta) * elapsed;
                let new_stone = state.get_stone()
                    + (production[2] + active_modifier_totals.stone_per_second_delta) * elapsed;

                new_coins = new_coins.max(0.0);

                (new_coins, new_wood, new_stone, now, elapsed)
            } else {
                (
                    state.get_coins(),
                    state.get_wood(),
                    state.get_stone(),
                    state.last_update_time,
                    0.0,
                )
            }
        };

        let mut processed_outputs = 0u32;
        {
            let mut state = self.state.borrow_mut();
            let current_coins = state.get_coins();
            let current_wood = state.get_wood();
            let current_stone = state.get_stone();

            state.set_coins(if new_coins.is_finite() {
                new_coins
            } else {
                current_coins
            });
            state.set_wood(if new_wood.is_finite() {
                new_wood
            } else {
                current_wood
            });
            state.set_stone(if new_stone.is_finite() {
                new_stone
            } else {
                current_stone
            });

            for (resource, index) in production_resource_slots() {
                let gain = production[*index] * elapsed;
                if gain.is_finite() && gain > 0.0 {
                    let input_requirements = production_input_requirements(*resource);
                    if input_requirements.is_empty() {
                        state.add_resource(*resource, gain);
                        if matches!(
                            *resource,
                            ResourceType::IronIngot
                                | ResourceType::CopperIngot
                                | ResourceType::Chemicals
                                | ResourceType::SteelPlate
                                | ResourceType::Glass
                                | ResourceType::Plastic
                                | ResourceType::CircuitBoard
                                | ResourceType::Motor
                                | ResourceType::Sensor
                                | ResourceType::Gear
                                | ResourceType::Battery
                                | ResourceType::Generator
                                | ResourceType::Microchip
                                | ResourceType::QuantumComputer
                                | ResourceType::Robot
                                | ResourceType::Nanobot
                                | ResourceType::Antimatter
                                | ResourceType::TimeCrystal
                                | ResourceType::DarkMatter
                                | ResourceType::Spaceship
                        ) {
                            processed_outputs += 1;
                        }
                        continue;
                    }

                    let can_produce =
                        input_requirements
                            .iter()
                            .all(|(input_resource, amount_per_unit)| {
                                let required_amount = gain * amount_per_unit;
                                state.get_resource(*input_resource) + 1e-10 >= required_amount
                            });

                    if can_produce {
                        for (input_resource, amount_per_unit) in input_requirements {
                            state.add_resource(*input_resource, -(gain * amount_per_unit));
                        }
                        state.add_resource(*resource, gain);
                        processed_outputs += 1;
                    }
                }
            }

            state.last_update_time = new_last_update_time;
            let _ = event::tick_active_modifiers(&mut state, now, elapsed);
        }

        // Update statistics (release borrow before calling other methods)
        if elapsed > 0.0 {
            {
                let mut stats = self.statistics.borrow_mut();
                stats.play_time_seconds += elapsed;
                stats.total_resources_crafted += processed_outputs;
            }

            // Grant XP to assigned workers based on production
            self.grant_worker_xp(elapsed);

            // Update production after worker XP changes (must be after grant_worker_xp)
            self.update_production();
            // Food consumption and starvation check
            {
                let mut state = self.state.borrow_mut();
                let mut last_consumption = self.last_food_consumption_time;
                let _hungry = crate::systems::population::consume_food_for_workers(
                    &mut self.workers,
                    &mut state.resources,
                    now,
                    &mut last_consumption,
                );
                self.last_food_consumption_time = last_consumption;

                if state.current_stage >= GameStage::Maggot {
                    let safe_maggot_diet = self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling);
                    let mut available_maggots = state.get_resource(ResourceType::Maggot);
                    let mut corpse_gain = 0.0;
                    let mut indices_to_remove = Vec::new();

                    for (idx, worker) in self.workers.iter_mut().enumerate() {
                        if !worker.is_hungry || available_maggots < 1.0 {
                            continue;
                        }

                        available_maggots -= 1.0;
                        worker.is_hungry = false;
                        worker.starvation_start_time = 0.0;
                        worker.hunger = (worker.hunger - 35.0).clamp(0.0, 100.0);

                        if !safe_maggot_diet {
                            worker.happiness = (worker.happiness - 10.0).clamp(0.0, 100.0);
                            worker.health = (worker.health - 14.0).clamp(0.0, 100.0);
                            worker.stress = (worker.stress + 6.0).clamp(0.0, 100.0);
                            worker.focus = (worker.focus - 4.0).clamp(0.0, 100.0);
                        }

                        if worker.happiness <= 0.0 || worker.health <= 0.0 {
                            indices_to_remove.push(idx);
                            corpse_gain += 1.0;
                        }
                    }

                    state.set_resource(ResourceType::Maggot, available_maggots);
                    if corpse_gain > 0.0 {
                        state.add_resource(ResourceType::Corpse, corpse_gain);
                    }
                    for idx in indices_to_remove.into_iter().rev() {
                        self.workers.remove(idx);
                    }
                }

                let mut corpse_decay_time = 0.0;
                let _deaths = crate::systems::population::check_worker_starvation_deaths(
                    &mut self.workers,
                    &mut state.resources,
                    now,
                    &mut corpse_decay_time,
                );
            }
            self.refresh_worker_state(elapsed);
            self.update_production();
            // Corpse decay: produce maggots from corpses
            {
                let mut state = self.state.borrow_mut();
                crate::systems::decay::produce_maggots(&mut state, now);

                let larva_trough = self.buildings.iter().find(|b| b.name == "腐食育蛆槽");
                let larva_trough_count = larva_trough.map(|b| b.count as f64).unwrap_or(0.0);
                let maggot_factory = self.buildings.iter().find(|b| b.name == "蛆虫工厂");
                let maggot_factory_count = maggot_factory.map(|b| b.count as f64).unwrap_or(0.0);
                let necrotic_pool = self.buildings.iter().find(|b| b.name == "腐肉育池");
                let necrotic_pool_count = necrotic_pool.map(|b| b.count as f64).unwrap_or(0.0);
                let symbiosis_chamber = self.buildings.iter().find(|b| b.name == "共生培育舱");
                let symbiosis_chamber_count =
                    symbiosis_chamber.map(|b| b.count as f64).unwrap_or(0.0);
                let symbiosis_chamber_output = symbiosis_chamber
                    .map(|b| b.production_rate * b.count as f64)
                    .unwrap_or(0.0);
                let neural_spire = self.buildings.iter().find(|b| b.name == "神经尖塔");
                let neural_spire_count = neural_spire.map(|b| b.count as f64).unwrap_or(0.0);
                let neural_spire_output = neural_spire
                    .map(|b| b.production_rate * b.count as f64)
                    .unwrap_or(0.0);
                let deep_space_hatchery = self.buildings.iter().find(|b| b.name == "深空孵化港");
                let deep_space_hatchery_count =
                    deep_space_hatchery.map(|b| b.count as f64).unwrap_or(0.0);
                let deep_space_hatchery_output = deep_space_hatchery
                    .map(|b| b.production_rate * b.count as f64)
                    .unwrap_or(0.0);

                let current_food = state.get_resource(ResourceType::Food);
                let spoilable_food = (current_food - 120.0).max(0.0);
                if spoilable_food > 0.0 {
                    let spoiled_food = (spoilable_food * 0.015 * elapsed).min(6.0 * elapsed);
                    if spoiled_food.is_finite() && spoiled_food > 0.0 {
                        state.add_resource(ResourceType::Food, -spoiled_food);
                        state.add_resource(ResourceType::Maggot, spoiled_food / 4.0);
                    }
                }

                if larva_trough_count > 0.0 {
                    let available_food = state.get_resource(ResourceType::Food);
                    let max_food_process = 3.0 * larva_trough_count * elapsed;
                    let process_amount = available_food.min(max_food_process).max(0.0);
                    if process_amount > 0.0 {
                        state.add_resource(ResourceType::Food, -process_amount);
                        state.add_resource(ResourceType::Maggot, process_amount / 2.0);
                    }
                }

                let maggot_gain = (maggot_factory_count + (necrotic_pool_count * 0.5)) * elapsed;
                if maggot_gain.is_finite() && maggot_gain > 0.0 {
                    state.add_resource(ResourceType::Maggot, maggot_gain);
                }

                if maggot_factory_count > 0.0 {
                    state.objective_chain.dark_conversion_completed = true;
                    if !state
                        .objective_chain
                        .completed_steps
                        .iter()
                        .any(|completed| completed == "complete_dark_conversion")
                    {
                        state
                            .objective_chain
                            .completed_steps
                            .push("complete_dark_conversion".to_string());
                    }
                }

                if necrotic_pool_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling)
                {
                    let current_maggot = state.get_resource(ResourceType::Maggot);
                    let process_amount = current_maggot
                        .min(8.0 * necrotic_pool_count * elapsed)
                        .max(0.0);
                    if process_amount > 0.0 {
                        state.add_resource(ResourceType::Maggot, -process_amount);
                        state.add_resource(ResourceType::Food, process_amount / 16.0);
                        state.add_resource(ResourceType::Chemicals, process_amount / 8.0);
                        state.objective_chain.dark_conversion_completed = true;
                        if !state
                            .objective_chain
                            .completed_steps
                            .iter()
                            .any(|completed| completed == "complete_dark_conversion")
                        {
                            state
                                .objective_chain
                                .completed_steps
                                .push("complete_dark_conversion".to_string());
                        }
                    }
                }

                if symbiosis_chamber_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::SymbioticHosts)
                {
                    state.coexistence.hybrid_population = (state.coexistence.hybrid_population
                        + (symbiosis_chamber_output * 0.004 * elapsed))
                        .clamp(0.0, 24.0);
                    state.coexistence.symbiosis_stability = (state.coexistence.symbiosis_stability
                        + (symbiosis_chamber_output * 0.01 * elapsed))
                        .clamp(0.0, 100.0);
                }

                if neural_spire_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::CollectiveAwakening)
                {
                    state.add_resource(ResourceType::DarkMatter, neural_spire_output * elapsed);
                }

                if deep_space_hatchery_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::ConsciousnessUpload)
                {
                    state.add_resource(
                        ResourceType::Spaceship,
                        deep_space_hatchery_output * elapsed,
                    );
                }
            }

            self.process_housing_queue();
            self.try_spawn_worker(now);

            let stage_snapshot = self.state.borrow().clone();
            let coexistence = stage::update_coexistence(
                &stage_snapshot.coexistence,
                &stage_snapshot,
                &self.workers,
                &self.buildings,
                &self.technology_tree,
                elapsed,
            );
            {
                let mut state = self.state.borrow_mut();
                state.coexistence = coexistence.clone();

                if state.current_stage >= GameStage::Hybrid {
                    let food_bonus = (coexistence.hybrid_population * 0.08)
                        + (coexistence.symbiosis_stability * 0.01);
                    let gold_bonus = coexistence.hybrid_population * 0.03;
                    if food_bonus > 0.0 {
                        state.add_resource(ResourceType::Food, food_bonus * elapsed);
                    }
                    if gold_bonus > 0.0 {
                        state.add_resource(ResourceType::Gold, gold_bonus * elapsed);
                    }
                }

                if state.current_stage >= GameStage::Collective {
                    let dark_bonus = (coexistence.collective_consciousness * 0.0025)
                        + (coexistence.hybrid_population * 0.01);
                    if dark_bonus > 0.0 {
                        state.add_resource(ResourceType::DarkMatter, dark_bonus * elapsed);
                    }
                }
            }

            {
                let mut state = self.state.borrow_mut();
                let _ = event::maybe_generate_event(
                    &mut state,
                    &mut self.workers,
                    &self.buildings,
                    &self.technology_tree,
                    now,
                );
            }
        }

        self.refresh_progression_state();

        self.check_achievement("first_coins_100");
        self.check_achievement("wood_collector_1000");
        self.check_achievement("stone_hoarder_5000");
        self.check_achievement("craft_master_100");

        self.update_resources_only();
    }

    #[wasm_bindgen]
    pub fn update_resources_only(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let coins_val = self.get_coins();
        let wood_val = self.get_wood();
        let stone_val = self.get_stone();
        let coins_per_sec = self.get_coins_per_second();
        let wood_per_sec = self.get_wood_per_second();
        let stone_per_sec = self.get_stone_per_second();
        let coins_per_click = self.get_coins_per_click();

        let update_resource_display_result =
            js_sys::Reflect::get(global_obj, &"updateResourceDisplay".into());
        if let Ok(update_func) = update_resource_display_result {
            let update_resource_display: js_sys::Function = update_func.into();
            let _ = update_resource_display.call7(
                &JsValue::NULL,
                &coins_val.into(),
                &wood_val.into(),
                &stone_val.into(),
                &coins_per_sec.into(),
                &wood_per_sec.into(),
                &stone_per_sec.into(),
                &coins_per_click.into(),
            );
        }
    }

    #[wasm_bindgen]
    pub fn update_buildings_only(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let buildings_serialized = self.get_buildings();
        if buildings_serialized.is_null() {
            return;
        }
        let update_buildings_result =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into());
        if let Ok(update_func) = update_buildings_result {
            let update_buildings: js_sys::Function = update_func.into();
            let coins = self.get_coins();
            let _ = update_buildings.call2(
                &JsValue::NULL,
                &buildings_serialized,
                &JsValue::from_f64(coins),
            );
        }
    }

    #[wasm_bindgen]
    pub fn update_ui(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let coins_val = self.get_coins();
        let wood_val = self.get_wood();
        let stone_val = self.get_stone();
        let coins_per_sec = self.get_coins_per_second();
        let wood_per_sec = self.get_wood_per_second();
        let stone_per_sec = self.get_stone_per_second();
        let coins_per_click = self.get_coins_per_click();

        let update_resource_display_result =
            js_sys::Reflect::get(global_obj, &"updateResourceDisplay".into());
        if let Ok(update_func) = update_resource_display_result {
            let update_resource_display: js_sys::Function = update_func.into();
            let _ = update_resource_display.call7(
                &JsValue::NULL,
                &coins_val.into(),
                &wood_val.into(),
                &stone_val.into(),
                &coins_per_sec.into(),
                &wood_per_sec.into(),
                &stone_per_sec.into(),
                &coins_per_click.into(),
            );
        }

        let buildings_serialized = self.get_buildings();
        if buildings_serialized.is_null() {
            return;
        }
        let update_buildings_result =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into());
        if let Ok(update_func) = update_buildings_result {
            let update_buildings: js_sys::Function = update_func.into();
            let coins = self.get_coins();
            let _ = update_buildings.call2(
                &JsValue::NULL,
                &buildings_serialized,
                &JsValue::from_f64(coins),
            );
        }
    }

    #[wasm_bindgen]
    pub fn unlock_feature(&mut self, feature_id: &str) -> bool {
        if !self.check_unlock(feature_id) {
            return false;
        }

        let next_stage = match stage_from_unlock_id(feature_id) {
            Some(stage) => stage,
            None => return false,
        };

        let mut state = self.state.borrow_mut();
        if state.current_stage >= next_stage {
            return true;
        }
        state.current_stage = next_stage;
        drop(state);

        if next_stage == GameStage::Workers && self.workers.is_empty() {
            self.workers.push(Worker::new(
                "新工人",
                "survival",
                "刚刚加入聚落的幸存者",
                "农场",
            ));
        }

        self.refresh_progression_state();
        true
    }

    #[wasm_bindgen]
    pub fn get_unlocks(&self) -> JsValue {
        let state = self.state.borrow().clone();
        let statistics = self.statistics.borrow().clone();
        let unlocks = stage::visible_unlocks(
            &state,
            &statistics,
            &self.workers,
            &self.buildings,
            &self.technology_tree,
        );
        serde_wasm_bindgen::to_value(&unlocks).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = getUnlockProgress)]
    pub fn get_unlock_progress(&self, feature_id: &str) -> JsValue {
        let state = self.state.borrow().clone();
        let statistics = self.statistics.borrow().clone();
        let unlocks = stage::visible_unlocks(
            &state,
            &statistics,
            &self.workers,
            &self.buildings,
            &self.technology_tree,
        );

        let progress = if let Some(unlock) = unlocks.iter().find(|unlock| unlock.id == feature_id) {
            let current = stage::requirement_progress(
                &unlock.requirement_type,
                &state,
                &statistics,
                &self.workers,
                &self.technology_tree,
            ) * unlock.requirement_value;
            UnlockProgressView {
                current,
                required: unlock.requirement_value,
                percentage: stage::requirement_progress(
                    &unlock.requirement_type,
                    &state,
                    &statistics,
                    &self.workers,
                    &self.technology_tree,
                ) * 100.0,
            }
        } else {
            UnlockProgressView {
                current: 0.0,
                required: 1.0,
                percentage: 0.0,
            }
        };

        progress
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = getUnlockRequirementDetails)]
    pub fn get_unlock_requirement_details(&self, feature_id: &str) -> JsValue {
        let state = self.state.borrow().clone();
        let statistics = self.statistics.borrow().clone();
        let unlocks = stage::visible_unlocks(
            &state,
            &statistics,
            &self.workers,
            &self.buildings,
            &self.technology_tree,
        );

        let Some(unlock) = unlocks.iter().find(|unlock| unlock.id == feature_id) else {
            return JsValue::NULL;
        };

        let details = stage::requirement_details(
            &unlock.requirement_type,
            unlock.requirement_value,
            &state,
            &statistics,
            &self.workers,
            &self.technology_tree,
        );

        details
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = getProgressionStateJson)]
    pub fn get_progression_state_json(&self) -> String {
        let state = self.state.borrow();
        let view = ProgressionStateView {
            current_stage_id: state.current_stage.id().to_string(),
            current_stage_name: state.current_stage.name().to_string(),
            current_stage_description: state.current_stage.short_description().to_string(),
            human_pressure: state.coexistence.human_pressure,
            maggot_influence: state.coexistence.maggot_influence,
            symbiosis_stability: state.coexistence.symbiosis_stability,
            hybrid_population: state.coexistence.hybrid_population,
            collective_consciousness: state.coexistence.collective_consciousness,
        };
        serde_json::to_string(&view).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen(js_name = getCurrentObjectiveChainJson)]
    pub fn get_current_objective_chain_json(&self) -> String {
        let view = self.get_worker_objective_chain_view();
        serde_json::to_string(&view).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn reset_game(&mut self) {
        let fresh_game = IdleGame::new();

        {
            let fresh_state = fresh_game.state.borrow().clone();
            let mut state = self.state.borrow_mut();
            *state = fresh_state;
        }

        {
            let fresh_statistics = fresh_game.statistics.borrow().clone();
            let mut statistics = self.statistics.borrow_mut();
            *statistics = fresh_statistics;
        }

        self.buildings = fresh_game.buildings;
        self.housing_buildings = fresh_game.housing_buildings;
        self.workers = fresh_game.workers;
        self.population_queue = fresh_game.population_queue;
        self.last_food_consumption_time = fresh_game.last_food_consumption_time;
        self.last_worker_spawn_time = fresh_game.last_worker_spawn_time;
        self.achievements = fresh_game.achievements;
        self.unlocked_features = fresh_game.unlocked_features;
        self.technology_tree = fresh_game.technology_tree;

        self.update_production();
        self.update_ui();
    }

    #[wasm_bindgen(js_name = get_achievements)]
    pub fn get_achievements_js(&self) -> JsValue {
        match serde_wasm_bindgen::to_value(&self.achievements) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen(js_name = getStatistics)]
    pub fn get_statistics_js(&self) -> JsValue {
        let stats = self.statistics.borrow().clone();
        match serde_wasm_bindgen::to_value(&stats) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> JsValue {
        self.get_statistics_js()
    }

    #[wasm_bindgen]
    pub fn do_prestige(&mut self, pp_gain: f64) -> bool {
        if !pp_gain.is_finite() || pp_gain <= 0.0 {
            return false;
        }

        self.reset_game();
        let mut state = self.state.borrow_mut();
        state.prestige_points += pp_gain;
        state.prestige_multiplier = 1.0 + state.prestige_points * 0.01;
        true
    }

    #[wasm_bindgen]
    pub fn check_achievement(&mut self, achievement_id: &str) -> bool {
        // First, read state and stats (release borrows immediately)
        let (
            total_clicks,
            coins,
            wood,
            stone,
            buildings_purchased,
            total_resources_crafted,
            achievements_unlocked_count,
        ) = {
            let state = self.state.borrow();
            let stats = self.statistics.borrow();
            (
                state.total_clicks as f64,
                state.get_coins(),
                state.get_wood(),
                state.get_stone(),
                stats.buildings_purchased as f64,
                stats.total_resources_crafted as f64,
                stats.achievements_unlocked_count as f64,
            )
        }; // All borrows released here

        // Find and update the achievement (separate borrow)
        let mut unlocked_this_call = false;
        {
            let achievement = match self
                .achievements
                .iter_mut()
                .find(|a| a.id == achievement_id)
            {
                Some(a) => a,
                None => return false,
            };

            if achievement.unlocked {
                return true;
            }

            let current_value = match achievement.category.as_str() {
                "clicks" => total_clicks,
                "resources" => {
                    if achievement.id == "first_coins_100" {
                        coins
                    } else if achievement.id == "wood_collector_1000" {
                        wood
                    } else if achievement.id == "stone_hoarder_5000" {
                        stone
                    } else {
                        0.0
                    }
                }
                "buildings" => buildings_purchased,
                "crafting" => total_resources_crafted,
                "unlocks" => achievements_unlocked_count,
                _ => 0.0,
            };

            achievement.progress = current_value;

            if achievement.progress >= achievement.requirement {
                achievement.unlocked = true;
                achievement.unlock_timestamp = Some(Date::now());
                unlocked_this_call = true;
            }
        } // achievement borrow released here

        // Update statistics if unlocked (separate borrow)
        if unlocked_this_call {
            {
                let mut stats_mut = self.statistics.borrow_mut();
                stats_mut.achievements_unlocked_count += 1;
            } // stats borrow released here

            // Recursively check dependent achievements (all previous borrows released)
            self.check_achievement("first_unlock");
            self.check_achievement("progress_master_5");

            return true;
        }

        false
    }

    pub fn check_all_achievements(&mut self) {
        let achievement_ids: Vec<String> = self.achievements.iter().map(|a| a.id.clone()).collect();
        for id in achievement_ids {
            self.check_achievement(&id);
        }
    }

    pub fn check_unlock(&mut self, feature_id: &str) -> bool {
        let state = self.state.borrow().clone();
        let stats = self.statistics.borrow().clone();
        stage::can_unlock_stage(
            feature_id,
            &state,
            &stats,
            &self.workers,
            &self.technology_tree,
        )
    }
}

#[wasm_bindgen]
impl IdleGame {
    /// Save game to localStorage via JS interop
    #[wasm_bindgen(js_name = saveToLocalStorage)]
    pub fn save_to_local_storage(&self) -> Result<(), JsValue> {
        let saved_game = self.save_game();

        // Serialize to JSON
        let json_str = serde_json::to_string(&saved_game)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;

        // Save to localStorage using JavaScript
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("Window not available"))?;

        let local_storage = window
            .local_storage()
            .map_err(|e| JsValue::from_str(&format!("localStorage access error: {:?}", e)))?
            .ok_or_else(|| JsValue::from_str("localStorage not available"))?;

        local_storage
            .set_item("idle_game_save", &json_str)
            .map_err(|e| JsValue::from_str(&format!("localStorage set error: {:?}", e)))?;

        Ok(())
    }

    /// Load game from localStorage via JS interop
    #[wasm_bindgen(js_name = loadFromLocalStorage)]
    pub fn load_from_local_storage(&mut self) -> Result<bool, JsValue> {
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("Window not available"))?;

        let local_storage = window
            .local_storage()
            .map_err(|e| JsValue::from_str(&format!("localStorage access error: {:?}", e)))?
            .ok_or_else(|| JsValue::from_str("localStorage not available"))?;

        // Try to get saved game data
        let saved_data = local_storage
            .get_item("idle_game_save")
            .map_err(|e| JsValue::from_str(&format!("localStorage get error: {:?}", e)))?;

        match saved_data {
            Some(json_str) => {
                // Deserialize from JSON
                let saved_game: SavedGame = serde_json::from_str(&json_str)
                    .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

                // Load the saved game state
                self.load_game(saved_game);
                Ok(true)
            }
            None => Ok(false), // No saved game found
        }
    }

    /// Export game save to BASE64 string
    #[wasm_bindgen(js_name = exportToBase64)]
    pub fn export_to_base64(&self) -> Result<String, JsValue> {
        let saved_game = self.save_game();

        // Serialize to JSON
        let json_str = serde_json::to_string(&saved_game)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;

        // Encode to BASE64
        let base64_str = general_purpose::STANDARD.encode(&json_str);
        Ok(base64_str)
    }

    /// Import game save from BASE64 string
    #[wasm_bindgen(js_name = importFromBase64)]
    pub fn import_from_base64(&mut self, base64_str: &str) -> Result<(), JsValue> {
        // Decode from BASE64
        let json_bytes = general_purpose::STANDARD
            .decode(base64_str)
            .map_err(|e| JsValue::from_str(&format!("BASE64 decode error: {}", e)))?;

        let json_str = String::from_utf8(json_bytes)
            .map_err(|e| JsValue::from_str(&format!("UTF8 conversion error: {}", e)))?;

        // Deserialize from JSON
        let saved_game: SavedGame = serde_json::from_str(&json_str)
            .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

        // Load the saved game state
        self.load_game(saved_game);
        Ok(())
    }

    // ========== Technology System WASM Exports ==========

    #[wasm_bindgen]
    pub fn research_technology(&mut self, tech_id_str: &str) -> Result<bool, JsValue> {
        use crate::entities::technology::TechnologyId;
        let tech_id = match serde_json::from_str::<TechnologyId>(&format!("\"{}\"", tech_id_str)) {
            Ok(id) => id,
            Err(_) => {
                return Err(JsValue::from_str(&format!(
                    "Invalid technology ID: {}",
                    tech_id_str
                )))
            }
        };

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_technology_revealed(tech_id, current_stage) {
            return Err(JsValue::from_str("Technology is still hidden"));
        }

        if !self.technology_tree.can_research(tech_id) {
            return Err(JsValue::from_str(
                "Cannot research: dependencies not met or already purchased",
            ));
        }

        // Check affordability
        {
            let state = self.state.borrow();
            if let Some(tech) = self.technology_tree.technologies.get(&tech_id) {
                for (resource, cost) in &tech.costs {
                    if state.get_resource(*resource) < *cost {
                        return Err(JsValue::from_str(&format!(
                            "Cannot afford: need {} {:?}",
                            cost, resource
                        )));
                    }
                }
            }
        }

        // Deduct costs
        {
            let mut state = self.state.borrow_mut();
            if let Some(tech) = self.technology_tree.technologies.get(&tech_id) {
                for (resource, cost) in &tech.costs {
                    let current = state.get_resource(*resource);
                    state.set_resource(*resource, current - cost);
                }
            }
        }

        // Research
        self.technology_tree
            .research(tech_id)
            .map_err(|e| JsValue::from_str(&e))?;
        self.refresh_progression_state();
        Ok(true)
    }

    #[wasm_bindgen]
    pub fn get_technology_tree_json(&self) -> String {
        serde_json::to_string(&self.technology_tree).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_technologies(&self) -> Result<JsValue, JsValue> {
        let current_stage = self.state.borrow().current_stage;
        let mut technologies = Vec::new();
        for (tech_id, tech) in &self.technology_tree.technologies {
            if !stage::is_technology_revealed(*tech_id, current_stage) {
                continue;
            }
            let dependencies = tech
                .dependencies
                .iter()
                .map(|dep| format!("{:?}", dep))
                .collect::<Vec<_>>();
            let costs = tech
                .costs
                .iter()
                .map(|(resource, amount)| (format!("{:?}", resource), *amount))
                .collect::<HashMap<_, _>>();
            let effect = serde_json::to_value(&tech.effect)
                .unwrap_or_else(|_| serde_json::json!({ "type": "unknown" }));

            technologies.push(TechnologyView {
                id: format!("{:?}", tech_id),
                name: tech.name.clone(),
                description: tech.description.clone(),
                tier: tech.tier(),
                costs,
                dependencies,
                purchased: tech.purchased,
                researched: tech.purchased,
                can_research: self.technology_tree.can_research(*tech_id),
                effect_value: tech.effect_value,
                effect,
            });
        }

        technologies
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize technologies: {}", e)))
    }

    #[wasm_bindgen]
    pub fn get_available_technologies_json(&self) -> String {
        let available = self.technology_tree.get_available_research();
        serde_json::to_string(&available).unwrap_or_else(|_| "[]".to_string())
    }

    // ========== Work Overview WASM Export ==========
    #[wasm_bindgen]
    pub fn get_work_overview_json(&self) -> String {
        use crate::state::job_stats::{JobStats, WorkOverview};
        use std::collections::HashMap;
        let mut job_map: HashMap<String, (u32, f64, f64)> = HashMap::new();
        let mut unassigned = 0u32;
        for worker in &self.workers {
            if let Some(ref building) = worker.assigned_building {
                let building_output = self
                    .buildings
                    .iter()
                    .find(|candidate| candidate.name == *building)
                    .map(|candidate| candidate.production_rate * candidate.count as f64)
                    .unwrap_or(0.0);
                let contribution = building_output * (worker.efficiency_multiplier - 1.0).max(0.0);
                let entry = job_map.entry(building.clone()).or_insert((0, 0.0, 0.0));
                entry.0 += 1;
                entry.1 += worker.efficiency_multiplier;
                entry.2 += contribution;
            } else {
                unassigned += 1;
            }
        }
        let jobs: Vec<JobStats> = job_map
            .into_iter()
            .map(|(job_type, (count, total_eff, total_output))| JobStats {
                job_type,
                worker_count: count,
                avg_efficiency: if count > 0 {
                    total_eff / count as f64
                } else {
                    0.0
                },
                total_output,
            })
            .collect();
        let total_workers = self.workers.len() as u32;
        let total_efficiency: f64 = self.workers.iter().map(|w| w.efficiency_multiplier).sum();
        let overview = WorkOverview {
            jobs,
            unassigned_workers: unassigned,
            total_workers,
            total_efficiency,
        };
        serde_json::to_string(&overview).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_housing_capacity(&self) -> u32 {
        self.get_housing_capacity_internal()
    }

    #[wasm_bindgen]
    pub fn get_housing_occupied(&self) -> u32 {
        self.workers.len() as u32
    }

    #[wasm_bindgen]
    pub fn get_population_queue_json(&self) -> String {
        serde_json::to_string(&self.population_queue).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_lifecycle_status_json(&self) -> String {
        let hungry_workers = self.workers.iter().filter(|w| w.is_hungry).count() as u32;
        let state = self.state.borrow();
        let dark_cycle_revealed = state.current_stage >= GameStage::Maggot;
        let coexistence_revealed = state.current_stage >= GameStage::Hybrid;
        let (anomaly_level, anomaly_text) = self.lifecycle_anomaly_state();
        let status = serde_json::json!({
            "workers": self.workers.len() as u32,
            "hungry_workers": hungry_workers,
            "queue_workers": self.population_queue.len() as u32,
            "housing_capacity": self.get_housing_capacity_internal(),
            "food": state.get_resource(ResourceType::Food),
            "anomaly_level": anomaly_level,
            "anomaly_text": anomaly_text,
            "dark_cycle_revealed": dark_cycle_revealed,
            "coexistence_revealed": coexistence_revealed,
            "corpses": if dark_cycle_revealed { serde_json::Value::from(state.get_resource(ResourceType::Corpse)) } else { serde_json::Value::Null },
            "maggots": if dark_cycle_revealed { serde_json::Value::from(state.get_resource(ResourceType::Maggot)) } else { serde_json::Value::Null },
            "human_pressure": if coexistence_revealed { serde_json::Value::from(state.coexistence.human_pressure) } else { serde_json::Value::Null },
            "maggot_influence": if coexistence_revealed { serde_json::Value::from(state.coexistence.maggot_influence) } else { serde_json::Value::Null },
            "symbiosis_stability": if coexistence_revealed { serde_json::Value::from(state.coexistence.symbiosis_stability) } else { serde_json::Value::Null },
            "hybrid_population": if coexistence_revealed { serde_json::Value::from(state.coexistence.hybrid_population) } else { serde_json::Value::Null }
        });
        serde_json::to_string(&status).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_workers_filtered_json(&self, only_unassigned: bool, sort_by: &str) -> String {
        let mut workers: Vec<&Worker> = self
            .workers
            .iter()
            .filter(|w| !only_unassigned || w.assigned_building.is_none())
            .collect();

        match sort_by {
            "level" => workers.sort_by_key(|w| std::cmp::Reverse(w.level)),
            "efficiency" => workers.sort_by(|a, b| {
                b.efficiency_multiplier
                    .partial_cmp(&a.efficiency_multiplier)
                    .unwrap_or(std::cmp::Ordering::Equal)
            }),
            _ => workers.sort_by(|a, b| a.name.cmp(&b.name)),
        }

        serde_json::to_string(&workers).unwrap_or_else(|_| "[]".to_string())
    }

    /// Get the game version
    #[wasm_bindgen]
    pub fn get_version(&self) -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }
}
