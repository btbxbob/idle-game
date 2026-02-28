use crate::entities::{Building, Upgrade, Worker};
use crate::state::resource::ResourceType;

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
pub fn calculate_production(
    buildings: &[Building],
    workers: &[Worker],
    resource: ResourceType,
) -> f64 {
    let building_name = match resource {
        // Tier 1: Basic Resources
        ResourceType::Gold => "金币矿山",
        ResourceType::Wood => "伐木场",
        ResourceType::Stone => "采石场",
        ResourceType::IronOre => "铁矿场",
        ResourceType::CopperOre => "铜矿场",
        ResourceType::AluminumOre => "铝矿场",
        ResourceType::Coal => "煤矿场",
        ResourceType::Oil => "石油井",
        ResourceType::Crystal => "水晶矿",
        ResourceType::Food => "农场",
        ResourceType::Corpse => "停尸房",
        ResourceType::Maggot => "蛆虫工厂",
        // Tier 2: Processed Resources (40)
        ResourceType::IronIngot => "铁锭冶炼厂",
        ResourceType::CopperIngot => "铜锭冶炼厂",
        ResourceType::AluminumIngot => "铝锭冶炼厂",
        ResourceType::SteelPlate => "钢铁厂",
        ResourceType::CopperPlate => "铜板厂",
        ResourceType::AluminumPlate => "铝板厂",
        ResourceType::Glass => "玻璃厂",
        ResourceType::Plastic => "塑料厂",
        ResourceType::Chemicals => "化学品厂",
        ResourceType::Fuel => "燃料精炼厂",
        ResourceType::Paper => "造纸厂",
        ResourceType::Ink => "墨水厂",
        ResourceType::Cloth => "纺织厂",
        ResourceType::Leather => "皮革厂",
        ResourceType::Ceramic => "陶瓷厂",
        ResourceType::Cement => "水泥厂",
        ResourceType::Brick => "砖厂",
        ResourceType::Rebar => "钢筋厂",
        ResourceType::Wire => "电线厂",
        ResourceType::Pipe => "管道厂",
        ResourceType::Valve => "阀门厂",
        ResourceType::Gear => "齿轮厂",
        ResourceType::Bearing => "轴承厂",
        ResourceType::Spring => "弹簧厂",
        ResourceType::Screw => "螺丝厂",
        ResourceType::Nut => "螺母厂",
        ResourceType::Washer => "垫片厂",
        ResourceType::Pump => "泵厂",
        ResourceType::Motor => "马达厂",
        ResourceType::Sensor => "传感器厂",
        ResourceType::CircuitBoard => "电路板厂",
        ResourceType::Capacitor => "电容器厂",
        ResourceType::Resistor => "电阻厂",
        ResourceType::Diode => "二极管厂",
        ResourceType::Transistor => "晶体管厂",
        ResourceType::Transformer => "变压器厂",
        ResourceType::Generator => "发电机厂",
        ResourceType::Compressor => "压缩机厂",
        ResourceType::Battery => "电池厂",
        // Tier 3: High-Tech Resources (10)
        ResourceType::Microchip => "芯片制造厂",
        ResourceType::Engine => "引擎装配厂",
        ResourceType::Robot => "机器人工厂",
        ResourceType::Satellite => "卫星装配中心",
        ResourceType::Spaceship => "太空船坞",
        ResourceType::QuantumComputer => "量子计算中心",
        ResourceType::Antimatter => "反物质反应堆",
        ResourceType::DarkMatter => "暗物质提取器",
        ResourceType::TimeCrystal => "时间水晶合成器",
        ResourceType::Nanobot => "纳米机器人工厂",
    };

    let building = match buildings.iter().find(|b| b.name == building_name) {
        Some(b) => b,
        None => return 0.0,
    };

    let base_production = building.production_rate * building.count as f64;
    let worker_bonus = get_worker_bonus_for_building(workers, building_name);
    let boosted_production = base_production * worker_bonus;

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
                count: 0,
            },
            Building {
                name: "伐木场".to_string(),
                cost: 20.0,
                production_rate: 1.0,
                count: 0,
            },
            Building {
                name: "采石场".to_string(),
                cost: 25.0,
                production_rate: 0.5,
                count: 0,
            },
            Building {
                name: "铁矿场".to_string(),
                cost: 50.0,
                production_rate: 0.5,
                count: 0,
            },
            Building {
                name: "铜矿场".to_string(),
                cost: 40.0,
                production_rate: 0.6,
                count: 0,
            },
            Building {
                name: "铝矿场".to_string(),
                cost: 60.0,
                production_rate: 0.4,
                count: 0,
            },
            Building {
                name: "煤矿场".to_string(),
                cost: 70.0,
                production_rate: 0.5,
                count: 0,
            },
            Building {
                name: "石油井".to_string(),
                cost: 100.0,
                production_rate: 0.3,
                count: 0,
            },
            Building {
                name: "水晶矿".to_string(),
                cost: 150.0,
                production_rate: 0.2,
                count: 0,
            },
            Building {
                name: "农场".to_string(),
                cost: 30.0,
                production_rate: 0.8,
                count: 0,
            },
        ]
    }

    fn create_test_workers() -> Vec<Worker> {
        vec![Worker::new("矿工", "mining", "擅长挖矿的工人", "金币矿山")]
    }

    #[test]
    fn test_gold_production_no_buildings() {
        let buildings = create_test_buildings();
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Gold),
            0.0
        );
    }

    #[test]
    fn test_gold_production_with_buildings() {
        let mut buildings = create_test_buildings();
        buildings[0].count = 10;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Gold),
            10.0
        );
    }

    #[test]
    fn test_wood_production() {
        let mut buildings = create_test_buildings();
        buildings[1].count = 5;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Wood),
            5.0
        );
    }

    #[test]
    fn test_stone_production() {
        let mut buildings = create_test_buildings();
        buildings[2].count = 4;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Stone),
            2.0
        );
    }

    #[test]
    fn test_iron_production() {
        let mut buildings = create_test_buildings();
        buildings[3].count = 2;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::IronOre),
            1.0
        );
    }

    #[test]
    fn test_copper_production() {
        let mut buildings = create_test_buildings();
        buildings[4].count = 5;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::CopperOre),
            3.0
        );
    }

    #[test]
    fn test_aluminum_production() {
        let mut buildings = create_test_buildings();
        buildings[5].count = 10;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::AluminumOre),
            4.0
        );
    }

    #[test]
    fn test_coal_production() {
        let mut buildings = create_test_buildings();
        buildings[6].count = 6;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Coal),
            3.0
        );
    }

    #[test]
    fn test_oil_production() {
        let mut buildings = create_test_buildings();
        buildings[7].count = 10;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Oil),
            3.0
        );
    }

    #[test]
    fn test_crystal_production() {
        let mut buildings = create_test_buildings();
        buildings[8].count = 5;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Crystal),
            1.0
        );
    }

    #[test]
    fn test_food_production() {
        let mut buildings = create_test_buildings();
        buildings[9].count = 10;
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Food),
            8.0
        );
    }

    #[test]
    fn test_worker_bonus() {
        let mut buildings = create_test_buildings();
        buildings[0].count = 10;

        let mut workers = create_test_workers();
        workers[0].assigned_building = Some("金币矿山".to_string());
        workers[0].efficiency_multiplier = 1.2;

        let production = calculate_production(&buildings, &workers, ResourceType::Gold);
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

        let production = update_production(&buildings, &upgrades, &workers);
        assert_eq!(production.len(), 60);
        assert!(production[0] > 0.0);
        assert!(production[1] > 0.0);
        assert!(production[2] > 0.0);
    }

    #[test]
    fn test_non_primary_resource() {
        let buildings = create_test_buildings();
        let workers = create_test_workers();
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::IronIngot),
            0.0
        );
        assert_eq!(
            calculate_production(&buildings, &workers, ResourceType::Microchip),
            0.0
        );
    }
}

/// Update production rates based on buildings and worker bonuses
pub fn update_production(
    buildings: &[Building],
    upgrades: &[Upgrade],
    workers: &[Worker],
) -> [f64; 60] {
    let mut production = [0.0; 60];

    // Tier 1: Basic Resources (0-9)
    production[0] = calculate_production(buildings, workers, ResourceType::Gold);
    production[1] = calculate_production(buildings, workers, ResourceType::Wood);
    production[2] = calculate_production(buildings, workers, ResourceType::Stone);
    production[3] = calculate_production(buildings, workers, ResourceType::IronOre);
    production[4] = calculate_production(buildings, workers, ResourceType::CopperOre);
    production[5] = calculate_production(buildings, workers, ResourceType::AluminumOre);
    production[6] = calculate_production(buildings, workers, ResourceType::Coal);
    production[7] = calculate_production(buildings, workers, ResourceType::Oil);
    production[8] = calculate_production(buildings, workers, ResourceType::Crystal);
    production[9] = calculate_production(buildings, workers, ResourceType::Food);

    // Tier 2: Processed Resources (10-49)
    production[10] = calculate_production(buildings, workers, ResourceType::IronIngot);
    production[11] = calculate_production(buildings, workers, ResourceType::CopperIngot);
    production[12] = calculate_production(buildings, workers, ResourceType::AluminumIngot);
    production[13] = calculate_production(buildings, workers, ResourceType::SteelPlate);
    production[14] = calculate_production(buildings, workers, ResourceType::CopperPlate);
    production[15] = calculate_production(buildings, workers, ResourceType::AluminumPlate);
    production[16] = calculate_production(buildings, workers, ResourceType::Glass);
    production[17] = calculate_production(buildings, workers, ResourceType::Plastic);
    production[18] = calculate_production(buildings, workers, ResourceType::Chemicals);
    production[19] = calculate_production(buildings, workers, ResourceType::Fuel);
    production[20] = calculate_production(buildings, workers, ResourceType::Paper);
    production[21] = calculate_production(buildings, workers, ResourceType::Ink);
    production[22] = calculate_production(buildings, workers, ResourceType::Cloth);
    production[23] = calculate_production(buildings, workers, ResourceType::Leather);
    production[24] = calculate_production(buildings, workers, ResourceType::Ceramic);
    production[25] = calculate_production(buildings, workers, ResourceType::Cement);
    production[26] = calculate_production(buildings, workers, ResourceType::Brick);
    production[27] = calculate_production(buildings, workers, ResourceType::Rebar);
    production[28] = calculate_production(buildings, workers, ResourceType::Wire);
    production[29] = calculate_production(buildings, workers, ResourceType::Pipe);
    production[30] = calculate_production(buildings, workers, ResourceType::Valve);
    production[31] = calculate_production(buildings, workers, ResourceType::Gear);
    production[32] = calculate_production(buildings, workers, ResourceType::Bearing);
    production[33] = calculate_production(buildings, workers, ResourceType::Spring);
    production[34] = calculate_production(buildings, workers, ResourceType::Screw);
    production[35] = calculate_production(buildings, workers, ResourceType::Nut);
    production[36] = calculate_production(buildings, workers, ResourceType::Washer);
    production[37] = calculate_production(buildings, workers, ResourceType::Pump);
    production[38] = calculate_production(buildings, workers, ResourceType::Motor);
    production[39] = calculate_production(buildings, workers, ResourceType::Sensor);
    production[40] = calculate_production(buildings, workers, ResourceType::CircuitBoard);
    production[41] = calculate_production(buildings, workers, ResourceType::Capacitor);
    production[42] = calculate_production(buildings, workers, ResourceType::Resistor);
    production[43] = calculate_production(buildings, workers, ResourceType::Diode);
    production[44] = calculate_production(buildings, workers, ResourceType::Transistor);
    production[45] = calculate_production(buildings, workers, ResourceType::Transformer);
    production[46] = calculate_production(buildings, workers, ResourceType::Generator);
    production[47] = calculate_production(buildings, workers, ResourceType::Compressor);
    production[48] = calculate_production(buildings, workers, ResourceType::Battery);

    // Tier 3: High-Tech Resources (49-58)
    production[49] = calculate_production(buildings, workers, ResourceType::Microchip);
    production[50] = calculate_production(buildings, workers, ResourceType::Engine);
    production[51] = calculate_production(buildings, workers, ResourceType::Robot);
    production[52] = calculate_production(buildings, workers, ResourceType::Satellite);
    production[53] = calculate_production(buildings, workers, ResourceType::Spaceship);
    production[54] = calculate_production(buildings, workers, ResourceType::QuantumComputer);
    production[55] = calculate_production(buildings, workers, ResourceType::Antimatter);
    production[56] = calculate_production(buildings, workers, ResourceType::DarkMatter);
    production[57] = calculate_production(buildings, workers, ResourceType::TimeCrystal);
    production[58] = calculate_production(buildings, workers, ResourceType::Nanobot);

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
    let production = update_production(buildings, upgrades, workers);
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
