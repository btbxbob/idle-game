use crate::entities::{Building, Worker};
use crate::entities::technology::TechnologyId;
use crate::state::{CoexistenceState, GameStage, GameState, ResourceType, Statistics};
use crate::systems::technology::TechnologyTree;
use crate::systems::unlock::UnlockedFeature;
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct RequirementLine {
    pub label: String,
    pub current: f64,
    pub required: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct RequirementDetails {
    pub summary: String,
    pub lines: Vec<RequirementLine>,
}

pub fn required_stage_for_building(building_name: &str) -> GameStage {
    match building_name {
        "金币矿山" | "伐木场" | "采石场" => GameStage::Genesis,
        "铁矿场" | "铜矿场" | "铝矿场" | "煤矿场" | "石油井" | "水晶矿" | "农场" => {
            GameStage::Workers
        }
        "蛆虫工厂" | "腐肉育池" => GameStage::Maggot,
        "共生培育舱" => GameStage::Hybrid,
        "神经尖塔" | "深空孵化港" => GameStage::Collective,
        _ => GameStage::Collective,
    }
}

pub fn is_building_revealed(building: &Building, current_stage: GameStage) -> bool {
    current_stage >= required_stage_for_building(&building.name)
}

pub fn technology_stage(tech_id: TechnologyId) -> GameStage {
    match tech_id {
        TechnologyId::BasicMining
        | TechnologyId::AdvancedMining
        | TechnologyId::BasicLogging
        | TechnologyId::AdvancedLogging
        | TechnologyId::BasicQuarrying
        | TechnologyId::AdvancedQuarrying
        | TechnologyId::ClickEfficiency => GameStage::Genesis,
        TechnologyId::BasicSmelting
        | TechnologyId::AdvancedSmelting
        | TechnologyId::BasicAgriculture
        | TechnologyId::AdvancedAgriculture
        | TechnologyId::BasicRefining
        | TechnologyId::AdvancedRefining
        | TechnologyId::BasicChemistry
        | TechnologyId::AdvancedChemistry
        | TechnologyId::BasicEngineering
        | TechnologyId::MassProduction
        | TechnologyId::Automation
        | TechnologyId::Robotics
        | TechnologyId::AdvancedRobotics
        | TechnologyId::Electronics
        | TechnologyId::AdvancedElectronics
        | TechnologyId::ComputerTechnology
        | TechnologyId::AITechnology
        | TechnologyId::AdvancedAI
        | TechnologyId::Nanotechnology
        | TechnologyId::AdvancedNanotech
        | TechnologyId::Biotechnology
        | TechnologyId::GeneticEngineering
        | TechnologyId::RenewableEnergy
        | TechnologyId::NuclearEnergy
        | TechnologyId::ResourceBoost
        | TechnologyId::ProductionMultiplier
        | TechnologyId::CostReduction
        | TechnologyId::CriticalClick
        | TechnologyId::AutoAssignment => GameStage::Workers,
        TechnologyId::MaggotBreeding | TechnologyId::NecroticRecycling | TechnologyId::SymbioticHosts => {
            GameStage::Maggot
        }
        TechnologyId::HiveMindProtocol => GameStage::Hybrid,
        TechnologyId::CollectiveAwakening
        | TechnologyId::QuantumComputing
        | TechnologyId::FusionEnergy
        | TechnologyId::AntimatterEnergy
        | TechnologyId::SpaceExploration
        | TechnologyId::Terraforming
        | TechnologyId::TimeManipulation
        | TechnologyId::DimensionalTravel
        | TechnologyId::ConsciousnessUpload
        | TechnologyId::Immortality
        | TechnologyId::Godhood
        | TechnologyId::Prestige
        | TechnologyId::Legacy
        | TechnologyId::Ascension
        | TechnologyId::Omniscience => GameStage::Collective,
    }
}

pub fn is_technology_revealed(tech_id: TechnologyId, current_stage: GameStage) -> bool {
    current_stage >= technology_stage(tech_id)
}

pub fn infer_stage_from_state(
    state: &GameState,
    workers: &[Worker],
    tech_tree: &TechnologyTree,
) -> GameStage {
    if tech_tree.is_unlocked(TechnologyId::CollectiveAwakening)
        || state.get_resource(ResourceType::DarkMatter) > 0.0
        || state.get_resource(ResourceType::Spaceship) > 0.0
        || state.coexistence.collective_consciousness > 0.0
    {
        return GameStage::Collective;
    }

    if tech_tree.is_unlocked(TechnologyId::SymbioticHosts)
        || tech_tree.is_unlocked(TechnologyId::HiveMindProtocol)
        || state.coexistence.hybrid_population > 0.0
    {
        return GameStage::Hybrid;
    }

    if tech_tree.is_unlocked(TechnologyId::MaggotBreeding)
        || tech_tree.is_unlocked(TechnologyId::NecroticRecycling)
        || state.get_resource(ResourceType::Maggot) > 0.0
    {
        return GameStage::Maggot;
    }

    if workers.len() > 0
        || state.get_resource(ResourceType::Food) > 0.0
        || state.get_resource(ResourceType::IronOre) > 0.0
    {
        return GameStage::Workers;
    }

    GameStage::Genesis
}

pub fn update_coexistence(
    previous: &CoexistenceState,
    state: &GameState,
    workers: &[Worker],
    buildings: &[Building],
    tech_tree: &TechnologyTree,
    elapsed: f64,
) -> CoexistenceState {
    let hungry_workers = workers.iter().filter(|worker| worker.is_hungry).count() as f64;
    let human_count = workers.len() as f64;
    let food = state.get_resource(ResourceType::Food);
    let maggots = state.get_resource(ResourceType::Maggot);
    let corpses = state.get_resource(ResourceType::Corpse);
    let maggot_buildings = buildings
        .iter()
        .filter(|building| matches!(building.name.as_str(), "蛆虫工厂" | "腐肉育池"))
        .map(|building| building.count as f64)
        .sum::<f64>();
    let hybrid_support = buildings
        .iter()
        .find(|building| building.name == "共生培育舱")
        .map(|building| building.count as f64)
        .unwrap_or(0.0);
    let collective_support = buildings
        .iter()
        .filter(|building| matches!(building.name.as_str(), "神经尖塔" | "深空孵化港"))
        .map(|building| building.count as f64)
        .sum::<f64>();

    let mut human_pressure = previous.human_pressure;
    human_pressure += ((human_count * 1.2) + hungry_workers * 4.0 - previous.hybrid_population * 0.8) * elapsed * 0.05;
    human_pressure = human_pressure.clamp(0.0, 100.0);

    let mut maggot_influence = previous.maggot_influence;
    maggot_influence += ((maggots / 18.0) + (corpses / 3.0) + maggot_buildings * 2.0) * elapsed * 0.08;
    if tech_tree.is_unlocked(TechnologyId::MaggotBreeding) {
        maggot_influence += elapsed * 0.9;
    }
    if tech_tree.is_unlocked(TechnologyId::NecroticRecycling) {
        maggot_influence += elapsed * 0.6;
    }
    maggot_influence = maggot_influence.clamp(0.0, 100.0);

    let food_buffer = if human_count > 0.0 { food / human_count } else { food };
    let mut symbiosis_stability = previous.symbiosis_stability;
    symbiosis_stability += (food_buffer * 0.35 + hybrid_support * 1.8 - hungry_workers * 2.5) * elapsed * 0.05;
    symbiosis_stability -= ((human_pressure - maggot_influence).abs() * 0.03) * elapsed;
    if tech_tree.is_unlocked(TechnologyId::SymbioticHosts) {
        symbiosis_stability += elapsed * 0.75;
    }
    if tech_tree.is_unlocked(TechnologyId::HiveMindProtocol) {
        symbiosis_stability += elapsed * 0.55;
    }
    symbiosis_stability = symbiosis_stability.clamp(0.0, 100.0);

    let mut hybrid_population = previous.hybrid_population;
    if tech_tree.is_unlocked(TechnologyId::SymbioticHosts) && maggot_influence >= 20.0 {
        let growth = ((maggot_influence - human_pressure + symbiosis_stability).max(0.0) / 60.0)
            + hybrid_support * 0.06;
        hybrid_population += growth * elapsed;
    }
    if hungry_workers > 0.0 || symbiosis_stability < 20.0 {
        hybrid_population -= elapsed * 0.12;
    }
    hybrid_population = hybrid_population.clamp(0.0, 24.0);

    let mut collective_consciousness = previous.collective_consciousness;
    if tech_tree.is_unlocked(TechnologyId::HiveMindProtocol) {
        collective_consciousness +=
            ((hybrid_population / 3.0) + collective_support * 0.8 + symbiosis_stability * 0.02) * elapsed * 0.08;
    }
    if tech_tree.is_unlocked(TechnologyId::CollectiveAwakening) {
        collective_consciousness += elapsed * 1.2;
    }
    collective_consciousness = collective_consciousness.clamp(0.0, 100.0);

    CoexistenceState {
        human_pressure,
        maggot_influence,
        symbiosis_stability,
        hybrid_population,
        collective_consciousness,
    }
}

pub fn visible_unlocks(
    state: &GameState,
    statistics: &Statistics,
    _workers: &[Worker],
    buildings: &[Building],
    tech_tree: &TechnologyTree,
) -> Vec<UnlockedFeature> {
    let mut unlocks = Vec::new();

    if state.current_stage == GameStage::Genesis {
        unlocks.push(UnlockedFeature {
            id: GameStage::Workers.id().to_string(),
            name: GameStage::Workers.name().to_string(),
            feature_type: "stage".to_string(),
            unlocked: state.current_stage >= GameStage::Workers,
            unlock_timestamp: None,
            requirement_type: "workers_stage".to_string(),
            requirement_value: 1.0,
        });
    }

    if state.current_stage == GameStage::Workers && state.get_resource(ResourceType::Maggot) > 0.0 {
        unlocks.push(UnlockedFeature {
            id: GameStage::Maggot.id().to_string(),
            name: GameStage::Maggot.name().to_string(),
            feature_type: "stage".to_string(),
            unlocked: false,
            unlock_timestamp: None,
            requirement_type: "maggot_stage".to_string(),
            requirement_value: 1.0,
        });
    }

    if state.current_stage == GameStage::Maggot {
        unlocks.push(UnlockedFeature {
            id: GameStage::Hybrid.id().to_string(),
            name: GameStage::Hybrid.name().to_string(),
            feature_type: "stage".to_string(),
            unlocked: false,
            unlock_timestamp: None,
            requirement_type: "hybrid_stage".to_string(),
            requirement_value: 1.0,
        });
    }

    if state.current_stage == GameStage::Hybrid {
        unlocks.push(UnlockedFeature {
            id: GameStage::Collective.id().to_string(),
            name: GameStage::Collective.name().to_string(),
            feature_type: "stage".to_string(),
            unlocked: false,
            unlock_timestamp: None,
            requirement_type: "collective_stage".to_string(),
            requirement_value: 1.0,
        });
    }

    if state.current_stage >= GameStage::Hybrid {
        unlocks.push(UnlockedFeature {
            id: "coexistence_balance".to_string(),
            name: "共生平衡".to_string(),
            feature_type: "system".to_string(),
            unlocked: state.coexistence.symbiosis_stability >= 55.0,
            unlock_timestamp: None,
            requirement_type: "symbiosis_stability".to_string(),
            requirement_value: 55.0,
        });
    }

    if state.current_stage >= GameStage::Workers && statistics.total_clicks >= 10 {
        unlocks.push(UnlockedFeature {
            id: "statistics_panel".to_string(),
            name: "统计面板".to_string(),
            feature_type: "area".to_string(),
            unlocked: true,
            unlock_timestamp: None,
            requirement_type: "total_clicks".to_string(),
            requirement_value: 10.0,
        });
    }

    if state.current_stage >= GameStage::Workers && statistics.total_clicks >= 25 {
        unlocks.push(UnlockedFeature {
            id: "achievements_panel".to_string(),
            name: "成就面板".to_string(),
            feature_type: "area".to_string(),
            unlocked: true,
            unlock_timestamp: None,
            requirement_type: "total_clicks".to_string(),
            requirement_value: 25.0,
        });
    }

    if state.current_stage >= GameStage::Workers {
        unlocks.push(UnlockedFeature {
            id: "workers_tab".to_string(),
            name: "工人面板".to_string(),
            feature_type: "area".to_string(),
            unlocked: true,
            unlock_timestamp: None,
            requirement_type: "workers_stage".to_string(),
            requirement_value: 1.0,
        });
    }

    if state.current_stage >= GameStage::Maggot && buildings.iter().any(|building| building.name == "蛆虫工厂") {
        unlocks.push(UnlockedFeature {
            id: "dark_biology".to_string(),
            name: "黑暗生物链".to_string(),
            feature_type: "system".to_string(),
            unlocked: tech_tree.is_unlocked(TechnologyId::MaggotBreeding),
            unlock_timestamp: None,
            requirement_type: "maggot_tech".to_string(),
            requirement_value: 1.0,
        });
    }

    unlocks
}

pub fn requirement_progress(
    requirement_type: &str,
    state: &GameState,
    statistics: &Statistics,
    _workers: &[Worker],
    tech_tree: &TechnologyTree,
) -> f64 {
    match requirement_type {
        "workers_stage" => {
            (statistics.buildings_purchased as f64 / 3.0).min(1.0)
        }
        "maggot_stage" => (state.get_resource(ResourceType::Maggot) / 10.0).min(1.0),
        "hybrid_stage" => {
            let tech_ready = if tech_tree.is_unlocked(TechnologyId::SymbioticHosts)
                || tech_tree.is_unlocked(TechnologyId::HiveMindProtocol)
            {
                1.0
            } else if tech_tree.is_unlocked(TechnologyId::GeneticEngineering)
                || tech_tree.is_unlocked(TechnologyId::MaggotBreeding)
            {
                0.5
            } else {
                0.0
            };
            let influence = (state.coexistence.maggot_influence / 35.0).min(1.0);
            let stability = (state.coexistence.symbiosis_stability / 45.0).min(1.0);
            ((tech_ready + influence + stability) / 3.0).min(1.0)
        }
        "collective_stage" => {
            let consciousness = (state.coexistence.collective_consciousness / 60.0).min(1.0);
            let hybrid = (state.coexistence.hybrid_population / 6.0).min(1.0);
            let tech_ready = if tech_tree.is_unlocked(TechnologyId::CollectiveAwakening)
                || tech_tree.is_unlocked(TechnologyId::HiveMindProtocol)
            {
                1.0
            } else {
                0.0
            };
            ((consciousness + hybrid + tech_ready) / 3.0).min(1.0)
        }
        "symbiosis_stability" => (state.coexistence.symbiosis_stability / 55.0).min(1.0),
        _ => 0.0,
    }
}

pub fn can_unlock_stage(
    stage_id: &str,
    state: &GameState,
    statistics: &Statistics,
    workers: &[Worker],
    tech_tree: &TechnologyTree,
) -> bool {
    match stage_id {
        "stage_workers" => requirement_progress("workers_stage", state, statistics, workers, tech_tree) >= 1.0,
        "stage_maggot" => requirement_progress("maggot_stage", state, statistics, workers, tech_tree) >= 1.0,
        "stage_hybrid" => requirement_progress("hybrid_stage", state, statistics, workers, tech_tree) >= 1.0,
        "stage_collective" => {
            requirement_progress("collective_stage", state, statistics, workers, tech_tree) >= 1.0
        }
        _ => false,
    }
}

pub fn requirement_details(
    requirement_type: &str,
    requirement_value: f64,
    state: &GameState,
    statistics: &Statistics,
    _workers: &[Worker],
    tech_tree: &TechnologyTree,
) -> RequirementDetails {
    match requirement_type {
        "workers_stage" => RequirementDetails {
            summary: "工人阶段现在只看一条条件：累计购买 3 座建筑。".to_string(),
            lines: vec![RequirementLine {
                label: "已购买建筑".to_string(),
                current: statistics.buildings_purchased as f64,
                required: 3.0,
            }],
        },
        "maggot_stage" => RequirementDetails {
            summary: "让黑暗分支显形：需要至少积累 10 点蛆虫资源。".to_string(),
            lines: vec![RequirementLine {
                label: "蛆虫".to_string(),
                current: state.get_resource(ResourceType::Maggot),
                required: 10.0,
            }],
        },
        "hybrid_stage" => RequirementDetails {
            summary: "蛆虫人阶段看三项共同推进：黑暗科技准备度、蛆虫影响、共生稳定度。总进度是三项平均值。".to_string(),
            lines: vec![
                RequirementLine {
                    label: "黑暗科技准备度".to_string(),
                    current: if tech_tree.is_unlocked(TechnologyId::SymbioticHosts)
                        || tech_tree.is_unlocked(TechnologyId::HiveMindProtocol)
                    {
                        1.0
                    } else if tech_tree.is_unlocked(TechnologyId::GeneticEngineering)
                        || tech_tree.is_unlocked(TechnologyId::MaggotBreeding)
                    {
                        0.5
                    } else {
                        0.0
                    },
                    required: 1.0,
                },
                RequirementLine {
                    label: "蛆虫影响".to_string(),
                    current: state.coexistence.maggot_influence,
                    required: 35.0,
                },
                RequirementLine {
                    label: "共生稳定度".to_string(),
                    current: state.coexistence.symbiosis_stability,
                    required: 45.0,
                },
            ],
        },
        "collective_stage" => RequirementDetails {
            summary: "集体意识阶段同样按三项平均推进：集体意识、混合人口、关键科技。".to_string(),
            lines: vec![
                RequirementLine {
                    label: "集体意识".to_string(),
                    current: state.coexistence.collective_consciousness,
                    required: 60.0,
                },
                RequirementLine {
                    label: "混合人口".to_string(),
                    current: state.coexistence.hybrid_population,
                    required: 6.0,
                },
                RequirementLine {
                    label: "关键科技".to_string(),
                    current: if tech_tree.is_unlocked(TechnologyId::CollectiveAwakening)
                        || tech_tree.is_unlocked(TechnologyId::HiveMindProtocol)
                    {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                },
            ],
        },
        "symbiosis_stability" => RequirementDetails {
            summary: "把共生稳定度维持在安全线以上，系统才会承认当前平衡可持续。".to_string(),
            lines: vec![RequirementLine {
                label: "共生稳定度".to_string(),
                current: state.coexistence.symbiosis_stability,
                required: 55.0,
            }],
        },
        "total_clicks" => RequirementDetails {
            summary: format!("继续点击并积累基础操作次数，达到 {} 次。", requirement_value as i64),
            lines: vec![RequirementLine {
                label: "总点击次数".to_string(),
                current: statistics.total_clicks as f64,
                required: requirement_value,
            }],
        },
        _ => RequirementDetails {
            summary: "满足当前阶段条件。".to_string(),
            lines: vec![],
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn stats_with_buildings(buildings: u32) -> Statistics {
        Statistics {
            total_clicks: 0,
            total_coins_earned: 0.0,
            total_wood_earned: 0.0,
            total_stone_earned: 0.0,
            total_resources_crafted: 0,
            achievements_unlocked_count: 0,
            play_time_seconds: 0.0,
            buildings_purchased: buildings,
            upgrades_purchased: 0,
        }
    }

    #[test]
    fn hides_hybrid_tech_before_maggot_stage() {
        assert!(!is_technology_revealed(TechnologyId::HiveMindProtocol, GameStage::Maggot));
        assert!(is_technology_revealed(TechnologyId::HiveMindProtocol, GameStage::Hybrid));
    }

    #[test]
    fn infers_stage_from_dark_resources() {
        let mut state = GameState::default();
        state.set_resource(ResourceType::Maggot, 12.0);
        let tree = TechnologyTree::new();
        assert_eq!(infer_stage_from_state(&state, &[], &tree), GameStage::Maggot);
    }

    #[test]
    fn workers_stage_unlocks_after_early_buildout() {
        let state = GameState::default();
        let stats = stats_with_buildings(3);
        let tree = TechnologyTree::new();
        assert!(can_unlock_stage("stage_workers", &state, &stats, &[], &tree));
    }

    #[test]
    fn collective_stage_requires_deeper_progress() {
        let mut state = GameState::default();
        state.current_stage = GameStage::Hybrid;
        state.coexistence.hybrid_population = 6.0;
        state.coexistence.collective_consciousness = 60.0;
        let mut tree = TechnologyTree::new();
        if let Some(tech) = tree.technologies.get_mut(&TechnologyId::HiveMindProtocol) {
            tech.purchased = true;
        }
        tree.unlocked.insert(TechnologyId::HiveMindProtocol);

        assert!(can_unlock_stage(
            "stage_collective",
            &state,
            &stats_with_buildings(12),
            &[],
            &tree,
        ));
    }
}
