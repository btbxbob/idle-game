use crate::entities::{Building, Upgrade, Worker};

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

/// Update production rates based on buildings and worker bonuses
pub fn update_production(
    buildings: &[Building],
    upgrades: &[Upgrade],
    workers: &[Worker],
) -> (f64, f64, f64) {
    let mut total_cps = 0.0;
    let mut total_wps = 0.0;
    let mut total_sps = 0.0;

    for building in buildings {
        let base_production = building.production_rate * building.count as f64;
        let worker_bonus = get_worker_bonus_for_building(workers, &building.name);
        let boosted_production = base_production * worker_bonus;

        match building.name.as_str() {
            "Coin Mine" | "Coin Factory" | "Coin Corporation" => {
                total_cps += boosted_production;
            }
            "Woodcutter" | "Lumber Mill" | "Forest Workshop" => {
                total_wps += boosted_production;
            }
            "Stone Quarry" | "Rock Crusher" | "Mason Workshop" => {
                total_sps += boosted_production;
            }
            _ => {}
        }
    }

    for upgrade in upgrades {
        if upgrade.name == "Lumberjack Efficiency" {
            total_wps += upgrade.production_increase * upgrade.owned as f64;
        }
        if upgrade.name == "Stone Mason Skill" {
            total_sps += upgrade.production_increase * upgrade.owned as f64;
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

    (total_cps, total_wps, total_sps)
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
