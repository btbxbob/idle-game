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
        _ => return 0.0,
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
        vec![Worker {
            name: "矿工".to_string(),
            skills: "mining".to_string(),
            background: "擅长挖矿的工人".to_string(),
            preferences: "金币矿山".to_string(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
        }]
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
        assert_eq!(production.len(), 10);
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
) -> [f64; 10] {
    let mut production = [0.0; 10];

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
