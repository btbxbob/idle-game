use crate::entities::{Building, Upgrade, Worker};
use crate::state::resource::ResourceType;
use crate::systems::technology::TechnologyBonuses;

/// Calculate worker bonus for a specific building
pub fn get_worker_bonus_for_building(workers: &[Worker], building_name: &str) -> f64 {
    let mut total_bonus = 1.0;

    for worker in workers {
        if let Some(ref assigned) = worker.assigned_building {
            if assigned == building_name {
                total_bonus += worker.efficiency_multiplier - 1.0;
            }
        }
    }

    total_bonus
}

/// Calculate production for a specific resource type based on buildings
fn legacy_building_aliases(resource: ResourceType) -> &'static [&'static str] {
    match resource {
        // Tier 1: Basic Resources
        ResourceType::Gold => &["金币矿山", "Coin Mine", "Coin Factory", "Coin Corporation"],
        ResourceType::Wood => &["伐木场", "Woodcutter", "Lumber Mill", "Forest Workshop"],
        ResourceType::Stone => &["采石场", "Stone Quarry", "Rock Crusher", "Mason Workshop"],
        ResourceType::IronOre => &["铁矿场"],
        ResourceType::CopperOre => &["铜矿场"],
        ResourceType::AluminumOre => &["铝矿场"],
        ResourceType::Coal => &["煤矿场"],
        ResourceType::Oil => &["石油井"],
        ResourceType::Crystal => &["水晶矿"],
        ResourceType::Food => &["农场"],
        ResourceType::Corpse => &["停尸房"],
        ResourceType::Maggot => &["蛆虫工厂"],
        // Tier 2: Processed Resources (40)
        ResourceType::IronIngot => &["铁锭冶炼厂"],
        ResourceType::CopperIngot => &["铜锭冶炼厂"],
        ResourceType::AluminumIngot => &["铝锭冶炼厂"],
        ResourceType::SteelPlate => &["钢铁厂"],
        ResourceType::CopperPlate => &["铜板厂"],
        ResourceType::AluminumPlate => &["铝板厂"],
        ResourceType::Glass => &["玻璃厂"],
        ResourceType::Plastic => &["塑料厂"],
        ResourceType::Chemicals => &["化学品厂"],
        ResourceType::Fuel => &["燃料精炼厂"],
        ResourceType::Paper => &["造纸厂"],
        ResourceType::Ink => &["墨水厂"],
        ResourceType::Cloth => &["纺织厂"],
        ResourceType::Leather => &["皮革厂"],
        ResourceType::Ceramic => &["陶瓷厂"],
        ResourceType::Cement => &["水泥厂"],
        ResourceType::Brick => &["砖厂"],
        ResourceType::Rebar => &["钢筋厂"],
        ResourceType::Wire => &["电线厂"],
        ResourceType::Pipe => &["管道厂"],
        ResourceType::Valve => &["阀门厂"],
        ResourceType::Gear => &["齿轮厂"],
        ResourceType::Bearing => &["轴承厂"],
        ResourceType::Spring => &["弹簧厂"],
        ResourceType::Screw => &["螺丝厂"],
        ResourceType::Nut => &["螺母厂"],
        ResourceType::Washer => &["垫片厂"],
        ResourceType::Pump => &["泵厂"],
        ResourceType::Motor => &["马达厂"],
        ResourceType::Sensor => &["传感器厂"],
        ResourceType::CircuitBoard => &["电路板厂"],
        ResourceType::Capacitor => &["电容器厂"],
        ResourceType::Resistor => &["电阻厂"],
        ResourceType::Diode => &["二极管厂"],
        ResourceType::Transistor => &["晶体管厂"],
        ResourceType::Transformer => &["变压器厂"],
        ResourceType::Generator => &["发电机厂"],
        ResourceType::Compressor => &["压缩机厂"],
        ResourceType::Battery => &["电池厂"],
        // Tier 3: High-Tech Resources (10)
        ResourceType::Microchip => &["芯片制造厂"],
        ResourceType::Engine => &["引擎装配厂"],
        ResourceType::Robot => &["机器人工厂"],
        ResourceType::Satellite => &["卫星装配中心"],
        ResourceType::Spaceship => &["太空船坞"],
        ResourceType::QuantumComputer => &["量子计算中心"],
        ResourceType::Antimatter => &["反物质反应堆"],
        ResourceType::DarkMatter => &["暗物质提取器"],
        ResourceType::TimeCrystal => &["时间水晶合成器"],
        ResourceType::Nanobot => &["纳米机器人工厂"],
    }
}

pub fn calculate_production(
    buildings: &[Building],
    workers: &[Worker],
    resource: ResourceType,
    tech_bonuses: &TechnologyBonuses,
) -> f64 {
    let building = match buildings
        .iter()
        .find(|b| b.output_resource == resource)
        .or_else(|| {
            let aliases = legacy_building_aliases(resource);
            buildings
                .iter()
                .find(|b| aliases.iter().any(|alias| b.name.as_str() == *alias))
        }) {
        Some(b) => b,
        None => return 0.0,
    };

    let base_production = building.production_rate * building.count as f64;
    let worker_bonus = get_worker_bonus_for_building(workers, &building.name);
    
    // Apply technology bonuses
    let tech_bonus = tech_bonuses.production_bonus.get(&resource).copied().unwrap_or(1.0);
    let global_multiplier = if tech_bonuses.production_multiplier > 0.0 {
        tech_bonuses.production_multiplier
    } else {
        1.0 // Default to no multiplier if not set
    };
    
    let boosted_production = base_production * worker_bonus * tech_bonus * global_multiplier;

    if boosted_production.is_finite() && boosted_production >= 0.0 {
        boosted_production
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_buildings() -> Vec<Building> {
        vec![
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
        ]
    }

    fn create_test_workers() -> Vec<Worker> {
        vec![Worker::new("矿工", "mining", "擅长挖矿的工人", "金币矿山")]
    }

    fn default_bonuses() -> TechnologyBonuses {
        TechnologyBonuses::default()
    }

    #[test]
    fn test_gold_production_no_buildings() {
        let buildings = create_test_buildings();
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Gold, &bonuses),
            0.0
        );
    }

    #[test]
    fn test_gold_production_with_buildings() {
        let mut buildings = create_test_buildings();
        buildings[0].count = 10;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Gold, &bonuses),
            10.0
        );
    }

    #[test]
    fn test_wood_production() {
        let mut buildings = create_test_buildings();
        buildings[1].count = 5;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Wood, &bonuses),
            5.0
        );
    }

    #[test]
    fn test_stone_production() {
        let mut buildings = create_test_buildings();
        buildings[2].count = 4;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Stone, &bonuses),
            2.0
        );
    }

    #[test]
    fn test_iron_production() {
        let mut buildings = create_test_buildings();
        buildings[3].count = 2;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::IronOre, &bonuses),
            1.0
        );
    }

    #[test]
    fn test_copper_production() {
        let mut buildings = create_test_buildings();
        buildings[4].count = 5;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::CopperOre, &bonuses),
            3.0
        );
    }

    #[test]
    fn test_aluminum_production() {
        let mut buildings = create_test_buildings();
        buildings[5].count = 10;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::AluminumOre, &bonuses),
            4.0
        );
    }

    #[test]
    fn test_coal_production() {
        let mut buildings = create_test_buildings();
        buildings[6].count = 6;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Coal, &bonuses),
            3.0
        );
    }

    #[test]
    fn test_oil_production() {
        let mut buildings = create_test_buildings();
        buildings[7].count = 10;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Oil, &bonuses),
            3.0
        );
    }

    #[test]
    fn test_crystal_production() {
        let mut buildings = create_test_buildings();
        buildings[8].count = 5;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Crystal, &bonuses),
            1.0
        );
    }

    #[test]
    fn test_food_production() {
        let mut buildings = create_test_buildings();
        buildings[9].count = 10;
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Food, &bonuses),
            20.0
        );
    }

    #[test]
    fn test_food_production_supports_ten_workers_target_balance() {
        let mut buildings = create_test_buildings();
        buildings[9].count = 1;
        let workers = create_test_workers();
        let bonuses = default_bonuses();

        let food_per_second = calculate_production(&buildings, &workers, ResourceType::Food, &bonuses);
        assert!(
            food_per_second >= 2.0,
            "food production should support 10 workers baseline, got {}",
            food_per_second
        );
    }

    #[test]
    fn test_worker_bonus() {
        let mut buildings = create_test_buildings();
        buildings[0].count = 10;

        let mut workers = create_test_workers();
        workers[0].assigned_building = Some("金币矿山".to_string());
        workers[0].efficiency_multiplier = 1.2;
        let bonuses = default_bonuses();

        let production = calculate_production(&buildings, &workers, ResourceType::Gold, &bonuses);
        assert!(production > 10.0);
        assert!((production - 12.0).abs() < 0.01);
    }

    #[test]
    fn test_update_production_all_resources() {
        let mut buildings = create_test_buildings();
        buildings[0].count = 1;
        buildings[1].count = 1;
        buildings[2].count = 1;
        let workers = create_test_workers();
        let upgrades = vec![];
        let bonuses = default_bonuses();

        let production = update_production(&buildings, &upgrades, &workers, &bonuses);
        assert_eq!(production.len(), 60);
        assert!(production[0] > 0.0);
        assert!(production[1] > 0.0);
        assert!(production[2] > 0.0);
    }

    #[test]
    fn test_non_primary_resource() {
        let buildings = create_test_buildings();
        let workers = create_test_workers();
        let bonuses = default_bonuses();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::IronIngot, &bonuses),
            0.0
        );
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Microchip, &bonuses),
            0.0
        );
    }

    #[test]
    fn test_production_uses_output_resource_field() {
        let buildings = vec![Building {
            name: "自定义木材站".to_string(),
            cost: 10.0,
            production_rate: 1.5,
            output_resource: ResourceType::Wood,
            count: 2,
        }];
        let workers = vec![];
        let bonuses = default_bonuses();

        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Wood, &bonuses),
            3.0
        );
    }

    #[test]
    fn test_production_supports_legacy_english_building_names() {
        let buildings = vec![Building {
            name: "Woodcutter".to_string(),
            cost: 20.0,
            production_rate: 2.0,
            output_resource: ResourceType::Gold,
            count: 1,
        }];
        let workers = vec![];
        let bonuses = default_bonuses();

        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Wood, &bonuses),
            2.0
        );
    }
}

/// Get default technology bonuses (no bonuses)
pub fn default_tech_bonuses() -> TechnologyBonuses {
    TechnologyBonuses::default()
}

/// Update production rates based on buildings and worker bonuses
pub fn update_production(
    buildings: &[Building],
    upgrades: &[Upgrade],
    workers: &[Worker],
    tech_bonuses: &TechnologyBonuses,
) -> [f64; 60] {
    let mut production = [0.0; 60];

    // Tier 1: Basic Resources (0-9)
    production[0] = calculate_production(buildings, workers, ResourceType::Gold, tech_bonuses);
    production[1] = calculate_production(buildings, workers, ResourceType::Wood, tech_bonuses);
    production[2] = calculate_production(buildings, workers, ResourceType::Stone, tech_bonuses);
    production[3] = calculate_production(buildings, workers, ResourceType::IronOre, tech_bonuses);
    production[4] = calculate_production(buildings, workers, ResourceType::CopperOre, tech_bonuses);
    production[5] = calculate_production(buildings, workers, ResourceType::AluminumOre, tech_bonuses);
    production[6] = calculate_production(buildings, workers, ResourceType::Coal, tech_bonuses);
    production[7] = calculate_production(buildings, workers, ResourceType::Oil, tech_bonuses);
    production[8] = calculate_production(buildings, workers, ResourceType::Crystal, tech_bonuses);
    production[9] = calculate_production(buildings, workers, ResourceType::Food, tech_bonuses);

    // Tier 2: Processed Resources (10-49)
    production[10] = calculate_production(buildings, workers, ResourceType::IronIngot, tech_bonuses);
    production[11] = calculate_production(buildings, workers, ResourceType::CopperIngot, tech_bonuses);
    production[12] = calculate_production(buildings, workers, ResourceType::AluminumIngot, tech_bonuses);
    production[13] = calculate_production(buildings, workers, ResourceType::SteelPlate, tech_bonuses);
    production[14] = calculate_production(buildings, workers, ResourceType::CopperPlate, tech_bonuses);
    production[15] = calculate_production(buildings, workers, ResourceType::AluminumPlate, tech_bonuses);
    production[16] = calculate_production(buildings, workers, ResourceType::Glass, tech_bonuses);
    production[17] = calculate_production(buildings, workers, ResourceType::Plastic, tech_bonuses);
    production[18] = calculate_production(buildings, workers, ResourceType::Chemicals, tech_bonuses);
    production[19] = calculate_production(buildings, workers, ResourceType::Fuel, tech_bonuses);
    production[20] = calculate_production(buildings, workers, ResourceType::Paper, tech_bonuses);
    production[21] = calculate_production(buildings, workers, ResourceType::Ink, tech_bonuses);
    production[22] = calculate_production(buildings, workers, ResourceType::Cloth, tech_bonuses);
    production[23] = calculate_production(buildings, workers, ResourceType::Leather, tech_bonuses);
    production[24] = calculate_production(buildings, workers, ResourceType::Ceramic, tech_bonuses);
    production[25] = calculate_production(buildings, workers, ResourceType::Cement, tech_bonuses);
    production[26] = calculate_production(buildings, workers, ResourceType::Brick, tech_bonuses);
    production[27] = calculate_production(buildings, workers, ResourceType::Rebar, tech_bonuses);
    production[28] = calculate_production(buildings, workers, ResourceType::Wire, tech_bonuses);
    production[29] = calculate_production(buildings, workers, ResourceType::Pipe, tech_bonuses);
    production[30] = calculate_production(buildings, workers, ResourceType::Valve, tech_bonuses);
    production[31] = calculate_production(buildings, workers, ResourceType::Gear, tech_bonuses);
    production[32] = calculate_production(buildings, workers, ResourceType::Bearing, tech_bonuses);
    production[33] = calculate_production(buildings, workers, ResourceType::Spring, tech_bonuses);
    production[34] = calculate_production(buildings, workers, ResourceType::Screw, tech_bonuses);
    production[35] = calculate_production(buildings, workers, ResourceType::Nut, tech_bonuses);
    production[36] = calculate_production(buildings, workers, ResourceType::Washer, tech_bonuses);
    production[37] = calculate_production(buildings, workers, ResourceType::Pump, tech_bonuses);
    production[38] = calculate_production(buildings, workers, ResourceType::Motor, tech_bonuses);
    production[39] = calculate_production(buildings, workers, ResourceType::Sensor, tech_bonuses);
    production[40] = calculate_production(buildings, workers, ResourceType::CircuitBoard, tech_bonuses);
    production[41] = calculate_production(buildings, workers, ResourceType::Capacitor, tech_bonuses);
    production[42] = calculate_production(buildings, workers, ResourceType::Resistor, tech_bonuses);
    production[43] = calculate_production(buildings, workers, ResourceType::Diode, tech_bonuses);
    production[44] = calculate_production(buildings, workers, ResourceType::Transistor, tech_bonuses);
    production[45] = calculate_production(buildings, workers, ResourceType::Transformer, tech_bonuses);
    production[46] = calculate_production(buildings, workers, ResourceType::Generator, tech_bonuses);
    production[47] = calculate_production(buildings, workers, ResourceType::Compressor, tech_bonuses);
    production[48] = calculate_production(buildings, workers, ResourceType::Battery, tech_bonuses);

    // Tier 3: High-Tech Resources (49-58)
    production[49] = calculate_production(buildings, workers, ResourceType::Microchip, tech_bonuses);
    production[50] = calculate_production(buildings, workers, ResourceType::Engine, tech_bonuses);
    production[51] = calculate_production(buildings, workers, ResourceType::Robot, tech_bonuses);
    production[52] = calculate_production(buildings, workers, ResourceType::Satellite, tech_bonuses);
    production[53] = calculate_production(buildings, workers, ResourceType::Spaceship, tech_bonuses);
    production[54] = calculate_production(buildings, workers, ResourceType::QuantumComputer, tech_bonuses);
    production[55] = calculate_production(buildings, workers, ResourceType::Antimatter, tech_bonuses);
    production[56] = calculate_production(buildings, workers, ResourceType::DarkMatter, tech_bonuses);
    production[57] = calculate_production(buildings, workers, ResourceType::TimeCrystal, tech_bonuses);
    production[58] = calculate_production(buildings, workers, ResourceType::Nanobot, tech_bonuses);

    // Special Resources (59-60) - no production
    production[59] = 0.0; // Corpse

    for upgrade in upgrades {
        if upgrade.name == "Lumberjack Efficiency" {
            production[1] += upgrade.production_increase * upgrade.owned as f64;
        }
        if upgrade.name == "Stone Mason Skill" {
            production[2] += upgrade.production_increase * upgrade.owned as f64;
        }
    }

    production
}

/// Legacy function - returns (coins, wood, stone) for backward compatibility
pub fn update_production_legacy(
    buildings: &[Building],
    upgrades: &[Upgrade],
    workers: &[Worker],
) -> (f64, f64, f64) {
    let tech_bonuses = default_tech_bonuses();
    let production = update_production(buildings, upgrades, workers, &tech_bonuses);
    (production[0], production[1], production[2])
}

/// Grant XP to workers assigned to buildings
pub fn grant_worker_xp(workers: &mut [Worker], elapsed: f64) {
    for i in 0..workers.len() {
        if workers[i].assigned_building.is_some() {
            let xp_gain = 10.0 * elapsed;
            workers[i].xp += xp_gain;

            while workers[i].xp >= workers[i].xp_to_next_level {
                workers[i].xp -= workers[i].xp_to_next_level;
                workers[i].level += 1;
                workers[i].xp_to_next_level = (workers[i].xp_to_next_level * 1.5).ceil();

                let preference = &workers[i].preferences;
                let assigned = workers[i].assigned_building.as_ref().unwrap();
                let mut efficiency = 1.0;

                if preference == assigned {
                    efficiency += 0.2;
                }
                efficiency += (workers[i].level as f64) * 0.05;
                workers[i].efficiency_multiplier = efficiency;
            }
        }
    }
}
