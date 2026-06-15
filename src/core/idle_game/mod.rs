pub(super) use crate::entities::{Building, Hobby, Housing, LimbSlot, PopulationQueue, Trait, Worker};
pub(super) use crate::state::resource::ResourceType;
pub(super) use crate::state::{GameStage, GameState, Statistics};
pub(super) use crate::systems::{
    achievement::Achievement, event, production, stage, technology::TechnologyTree,
    unlock::UnlockedFeature,
};
pub(super) use crate::utils::WorkerGenerator;
pub(super) use base64::{engine::general_purpose, Engine as _};
pub(super) use js_sys::Date;
pub(super) use serde::{Deserialize, Serialize};
pub(super) use std::cell::RefCell;
pub(super) use std::collections::HashMap;
pub(super) use std::rc::Rc;
pub(super) use wasm_bindgen::prelude::*;
pub(super) use wasm_bindgen::prelude::wasm_bindgen;

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

mod helpers;
mod wasm_api;
mod wasm_persistence;
