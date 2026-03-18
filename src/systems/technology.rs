use crate::entities::technology::BuildingType;
use crate::entities::technology::{Technology, TechnologyEffect, TechnologyId};
use crate::state::resource::ResourceType;
use crate::state::GameState;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Technology bonuses calculated from all purchased technologies
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct TechnologyBonuses {
    /// Production bonus multiplier for each resource (1.0 = no bonus)
    pub production_bonus: HashMap<ResourceType, f64>,
    /// Click efficiency multiplier (1.0 = no bonus)
    pub click_bonus: f64,
    /// Cost reduction multiplier (1.0 = no reduction, 0.9 = 10% off)
    pub cost_reduction: f64,
    /// Production multiplier (global, 1.0 = no bonus)
    pub production_multiplier: f64,
    /// Critical click chance (0.0 = none, 1.0 = 100%)
    pub critical_click_chance: f64,
    /// Critical click multiplier
    pub critical_click_multiplier: f64,
    /// Unlocked building types
    pub unlocked_buildings: HashSet<BuildingType>,
    /// Enabled mechanics
    pub enabled_mechanics: HashSet<String>,
}

/// Technology tree system managing research and dependencies
#[derive(Serialize, Deserialize, Clone)]
pub struct TechnologyTree {
    pub technologies: HashMap<TechnologyId, Technology>,
    pub unlocked: HashSet<TechnologyId>,
}

impl TechnologyTree {
    /// Create a new technology tree with all technologies locked
    pub fn new() -> Self {
        let technologies = Self::get_all_technologies();
        let unlocked = HashSet::new();
        TechnologyTree {
            technologies,
            unlocked,
        }
    }

    /// Get all default technologies
    pub fn get_all_technologies() -> HashMap<TechnologyId, Technology> {
        Self::initialize_technologies()
    }

    /// Check if all dependencies for a technology are met
    pub fn can_research(&self, tech_id: TechnologyId) -> bool {
        let tech = match self.technologies.get(&tech_id) {
            Some(t) => t,
            None => return false,
        };

        if tech.purchased {
            return false;
        }

        tech.dependencies
            .iter()
            .all(|dep| self.unlocked.contains(dep))
    }

    /// Research a technology
    pub fn research(&mut self, tech_id: TechnologyId) -> Result<(), String> {
        if !self.can_research(tech_id) {
            return Err("Dependencies not met".to_string());
        }

        if let Some(tech) = self.technologies.get_mut(&tech_id) {
            tech.purchased = true;
            self.unlocked.insert(tech_id);
            Ok(())
        } else {
            Err("Technology not found".to_string())
        }
    }

    /// Get dependencies for a technology
    pub fn get_dependencies(&self, tech_id: TechnologyId) -> Vec<TechnologyId> {
        self.technologies
            .get(&tech_id)
            .map(|t| t.dependencies.clone())
            .unwrap_or_default()
    }

    /// Check if a technology is unlocked
    pub fn is_unlocked(&self, tech_id: TechnologyId) -> bool {
        self.unlocked.contains(&tech_id)
    }

    /// Get all technologies available for research
    pub fn get_available_research(&self) -> Vec<TechnologyId> {
        self.technologies
            .keys()
            .filter(|&&id| self.can_research(id))
            .cloned()
            .collect()
    }

    /// Calculate all bonuses from purchased technologies
    pub fn calculate_bonuses(&self) -> TechnologyBonuses {
        let mut bonuses = TechnologyBonuses::default();

        // Initialize defaults
        bonuses.click_bonus = 1.0;
        bonuses.cost_reduction = 1.0;
        bonuses.production_multiplier = 1.0;
        bonuses.critical_click_chance = 0.0;
        bonuses.critical_click_multiplier = 2.0;

        // Iterate through all purchased technologies
        for (tech_id, tech) in &self.technologies {
            if !tech.purchased {
                continue;
            }

            match &tech.effect {
                TechnologyEffect::ProductionBonus(resource, bonus) => {
                    // Add to production bonus (compounding)
                    let current = bonuses
                        .production_bonus
                        .get(resource)
                        .copied()
                        .unwrap_or(1.0);
                    bonuses.production_bonus.insert(*resource, current + bonus);
                }
                TechnologyEffect::UnlockBuilding(building_type) => {
                    bonuses.unlocked_buildings.insert(*building_type);
                }
                TechnologyEffect::UnlockUI => {
                    // UI unlocking is handled separately in the UI layer
                }
                TechnologyEffect::MechanicChange(mechanic) => {
                    bonuses.enabled_mechanics.insert(mechanic.clone());
                    // Handle specific mechanics
                    match mechanic.as_str() {
                        "auto_production" | "full_automation" => {
                            // Automation is handled separately
                        }
                        "ai_assistance" | "ai_optimization" => {
                            // AI optimization adds production bonus
                            bonuses.production_multiplier += tech.effect_value * 0.1;
                        }
                        "nuclear_power" | "fusion_power" => {
                            // Energy techs add global production
                            bonuses.production_multiplier += tech.effect_value * 0.1;
                        }
                        "symbiotic_hosts" => {
                            bonuses.production_multiplier += tech.effect_value * 0.08;
                        }
                        "hive_mind" | "collective_awakening" => {
                            bonuses.production_multiplier += tech.effect_value * 0.12;
                            bonuses.click_bonus += tech.effect_value * 0.05;
                        }
                        _ => {}
                    }
                }
            }

            // Apply tier 4 bonuses based on tech ID
            match tech_id {
                TechnologyId::ClickEfficiency => {
                    bonuses.click_bonus += tech.effect_value;
                }
                TechnologyId::ResourceBoost => {
                    // Temporary boost - handled in UI
                }
                TechnologyId::ProductionMultiplier => {
                    bonuses.production_multiplier += tech.effect_value;
                }
                TechnologyId::CostReduction => {
                    bonuses.cost_reduction -= tech.effect_value * 0.1; // 10% per level
                    bonuses.cost_reduction = bonuses.cost_reduction.max(0.1); // Min 10% cost
                }
                TechnologyId::CriticalClick => {
                    bonuses.critical_click_chance = tech.effect_value;
                }
                TechnologyId::AutoAssignment => {
                    // Auto assignment is handled separately
                }
                TechnologyId::Prestige | TechnologyId::Legacy | TechnologyId::Ascension => {
                    // Prestige mechanics handled separately
                }
                TechnologyId::Omniscience => {
                    // Omniscience provides all bonuses
                    bonuses.click_bonus += 1.0;
                    bonuses.production_multiplier += 0.5;
                    bonuses.critical_click_chance = 0.1;
                }
                _ => {}
            }
        }

        // Ensure all production bonuses are at least 1.0
        for resource in self.technologies.values() {
            if let TechnologyEffect::ProductionBonus(resource_type, _) = &resource.effect {
                if !bonuses.production_bonus.contains_key(resource_type) {
                    bonuses.production_bonus.insert(*resource_type, 1.0);
                }
            }
        }

        bonuses
    }

    /// Get production bonus for a specific resource
    pub fn get_production_bonus(&self, resource: ResourceType) -> f64 {
        self.calculate_bonuses()
            .production_bonus
            .get(&resource)
            .copied()
            .unwrap_or(1.0)
    }

    /// Get click bonus multiplier
    pub fn get_click_bonus(&self) -> f64 {
        self.calculate_bonuses().click_bonus
    }

    /// Get cost reduction multiplier
    pub fn get_cost_reduction(&self) -> f64 {
        self.calculate_bonuses().cost_reduction
    }

    /// Get global production multiplier
    pub fn get_production_multiplier(&self) -> f64 {
        self.calculate_bonuses().production_multiplier
    }

    /// Get critical click chance
    pub fn get_critical_click_chance(&self) -> f64 {
        self.calculate_bonuses().critical_click_chance
    }

    /// Get critical click multiplier
    pub fn get_critical_click_multiplier(&self) -> f64 {
        self.calculate_bonuses().critical_click_multiplier
    }

    /// Check if a building type is unlocked
    pub fn is_building_unlocked(&self, building: BuildingType) -> bool {
        self.calculate_bonuses()
            .unlocked_buildings
            .contains(&building)
    }

    /// Check if a mechanic is enabled
    pub fn is_mechanic_enabled(&self, mechanic: &str) -> bool {
        self.calculate_bonuses()
            .enabled_mechanics
            .contains(mechanic)
    }

    /// Get all unlocked buildings
    pub fn get_unlocked_buildings(&self) -> HashSet<BuildingType> {
        self.calculate_bonuses().unlocked_buildings
    }

    /// Apply technology effect to game state (legacy compatibility)
    pub fn apply_effect(&self, tech_id: TechnologyId, _game_state: &mut GameState) {
        if let Some(tech) = self.technologies.get(&tech_id) {
            match &tech.effect {
                TechnologyEffect::ProductionBonus(_, _) => {
                    // Apply production bonus logic
                }
                TechnologyEffect::UnlockBuilding(_) => {
                    // Unlock building logic
                }
                TechnologyEffect::UnlockUI => {
                    // Unlock UI logic
                }
                TechnologyEffect::MechanicChange(_) => {
                    // Mechanic change logic
                }
            }
        }
    }

    /// Check for circular dependencies in the technology tree
    pub fn validate_no_circular_dependencies(&self) -> Result<(), String> {
        for tech_id in self.technologies.keys() {
            if self.has_cycle(*tech_id, &mut HashSet::new(), &mut HashSet::new()) {
                return Err(format!(
                    "Circular dependency detected involving {:?}",
                    tech_id
                ));
            }
        }
        Ok(())
    }

    fn has_cycle(
        &self,
        tech_id: TechnologyId,
        visited: &mut HashSet<TechnologyId>,
        rec_stack: &mut HashSet<TechnologyId>,
    ) -> bool {
        if rec_stack.contains(&tech_id) {
            return true;
        }
        if visited.contains(&tech_id) {
            return false;
        }

        visited.insert(tech_id);
        rec_stack.insert(tech_id);

        if let Some(tech) = self.technologies.get(&tech_id) {
            for dep in &tech.dependencies {
                if self.has_cycle(*dep, visited, rec_stack) {
                    return true;
                }
            }
        }

        rec_stack.remove(&tech_id);
        false
    }

    /// Check if all technologies are reachable from the starting techs (those with no dependencies)
    pub fn validate_all_reachable(&self) -> Result<(), String> {
        let mut visited = HashSet::new();
        // Collect all techs with no dependencies as starting points
        let mut queue: Vec<_> = self
            .technologies
            .iter()
            .filter(|(_, tech)| tech.dependencies.is_empty())
            .map(|(id, _)| *id)
            .collect();

        for start in &queue {
            visited.insert(*start);
        }

        while let Some(current) = queue.pop() {
            for (tech_id, tech) in &self.technologies {
                if !visited.contains(tech_id) && tech.dependencies.contains(&current) {
                    // Check if all dependencies of this tech are now visited
                    let all_deps_met = tech.dependencies.iter().all(|dep| visited.contains(dep));
                    if all_deps_met {
                        visited.insert(*tech_id);
                        queue.push(*tech_id);
                    }
                }
            }
        }

        let all_techs: HashSet<_> = self.technologies.keys().cloned().collect();
        let unreachable: Vec<_> = all_techs.difference(&visited).collect();

        if unreachable.is_empty() {
            Ok(())
        } else {
            Err(format!("Unreachable technologies: {:?}", unreachable))
        }
    }
}

impl Default for TechnologyTree {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper function to create a cost HashMap
fn costs(resources: &[(ResourceType, f64)]) -> HashMap<ResourceType, f64> {
    resources.iter().cloned().collect()
}

/// Get all default technologies (55 total)
impl TechnologyTree {
    fn initialize_technologies() -> HashMap<TechnologyId, Technology> {
        let mut map = HashMap::new();

        // ========== TIER 1: Basic Technologies (15) ==========

        // Mining branch - no dependencies
        map.insert(
            TechnologyId::BasicMining,
            Technology::new(
                TechnologyId::BasicMining,
                costs(&[(ResourceType::Gold, 100.0), (ResourceType::Wood, 50.0)]),
                vec![],
                TechnologyEffect::ProductionBonus(ResourceType::Coal, 0.1),
                0.1,
            ),
        );

        map.insert(
            TechnologyId::AdvancedMining,
            Technology::new(
                TechnologyId::AdvancedMining,
                costs(&[
                    (ResourceType::Gold, 500.0),
                    (ResourceType::Stone, 200.0),
                    (ResourceType::IronOre, 100.0),
                ]),
                vec![TechnologyId::BasicMining],
                TechnologyEffect::ProductionBonus(ResourceType::IronOre, 0.2),
                0.2,
            ),
        );

        // Logging branch - no dependencies
        map.insert(
            TechnologyId::BasicLogging,
            Technology::new(
                TechnologyId::BasicLogging,
                costs(&[(ResourceType::Gold, 100.0), (ResourceType::Stone, 50.0)]),
                vec![],
                TechnologyEffect::ProductionBonus(ResourceType::Wood, 0.1),
                0.1,
            ),
        );

        map.insert(
            TechnologyId::AdvancedLogging,
            Technology::new(
                TechnologyId::AdvancedLogging,
                costs(&[
                    (ResourceType::Gold, 500.0),
                    (ResourceType::Wood, 300.0),
                    (ResourceType::IronOre, 50.0),
                ]),
                vec![TechnologyId::BasicLogging],
                TechnologyEffect::ProductionBonus(ResourceType::Wood, 0.25),
                0.25,
            ),
        );

        // Quarrying branch - no dependencies
        map.insert(
            TechnologyId::BasicQuarrying,
            Technology::new(
                TechnologyId::BasicQuarrying,
                costs(&[(ResourceType::Gold, 100.0), (ResourceType::Wood, 100.0)]),
                vec![],
                TechnologyEffect::ProductionBonus(ResourceType::Stone, 0.1),
                0.1,
            ),
        );

        map.insert(
            TechnologyId::AdvancedQuarrying,
            Technology::new(
                TechnologyId::AdvancedQuarrying,
                costs(&[
                    (ResourceType::Gold, 500.0),
                    (ResourceType::Stone, 400.0),
                    (ResourceType::Coal, 100.0),
                ]),
                vec![TechnologyId::BasicQuarrying],
                TechnologyEffect::ProductionBonus(ResourceType::Crystal, 0.15),
                0.15,
            ),
        );

        // Smelting branch - depends on mining
        map.insert(
            TechnologyId::BasicSmelting,
            Technology::new(
                TechnologyId::BasicSmelting,
                costs(&[
                    (ResourceType::Gold, 200.0),
                    (ResourceType::Stone, 150.0),
                    (ResourceType::Coal, 100.0),
                ]),
                vec![TechnologyId::BasicMining],
                TechnologyEffect::UnlockBuilding(BuildingType::Smelter),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AdvancedSmelting,
            Technology::new(
                TechnologyId::AdvancedSmelting,
                costs(&[
                    (ResourceType::Gold, 800.0),
                    (ResourceType::IronOre, 200.0),
                    (ResourceType::Coal, 300.0),
                ]),
                vec![TechnologyId::BasicSmelting, TechnologyId::AdvancedMining],
                TechnologyEffect::ProductionBonus(ResourceType::IronOre, 0.3),
                0.3,
            ),
        );

        // Agriculture branch - no dependencies
        map.insert(
            TechnologyId::BasicAgriculture,
            Technology::new(
                TechnologyId::BasicAgriculture,
                costs(&[(ResourceType::Gold, 150.0), (ResourceType::Wood, 100.0)]),
                vec![],
                TechnologyEffect::UnlockBuilding(BuildingType::Farm),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AdvancedAgriculture,
            Technology::new(
                TechnologyId::AdvancedAgriculture,
                costs(&[
                    (ResourceType::Gold, 600.0),
                    (ResourceType::Wood, 300.0),
                    (ResourceType::Food, 200.0),
                ]),
                vec![TechnologyId::BasicAgriculture],
                TechnologyEffect::ProductionBonus(ResourceType::Food, 0.25),
                0.25,
            ),
        );

        // Refining branch - depends on smelting
        map.insert(
            TechnologyId::BasicRefining,
            Technology::new(
                TechnologyId::BasicRefining,
                costs(&[
                    (ResourceType::Gold, 300.0),
                    (ResourceType::IronOre, 120.0),
                    (ResourceType::Coal, 150.0),
                ]),
                vec![TechnologyId::BasicSmelting],
                TechnologyEffect::UnlockBuilding(BuildingType::Refinery),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AdvancedRefining,
            Technology::new(
                TechnologyId::AdvancedRefining,
                costs(&[
                    (ResourceType::Gold, 1000.0),
                    (ResourceType::IronOre, 250.0),
                    (ResourceType::CopperOre, 150.0),
                    (ResourceType::Oil, 100.0),
                ]),
                vec![TechnologyId::BasicRefining, TechnologyId::AdvancedSmelting],
                TechnologyEffect::ProductionBonus(ResourceType::Oil, 0.3),
                0.3,
            ),
        );

        // Chemistry branch - depends on refining
        map.insert(
            TechnologyId::BasicChemistry,
            Technology::new(
                TechnologyId::BasicChemistry,
                costs(&[
                    (ResourceType::Gold, 400.0),
                    (ResourceType::Oil, 100.0),
                    (ResourceType::Coal, 200.0),
                ]),
                vec![TechnologyId::BasicRefining],
                TechnologyEffect::UnlockBuilding(BuildingType::ChemicalPlant),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AdvancedChemistry,
            Technology::new(
                TechnologyId::AdvancedChemistry,
                costs(&[
                    (ResourceType::Gold, 1200.0),
                    (ResourceType::Oil, 300.0),
                    (ResourceType::Coal, 250.0),
                    (ResourceType::Crystal, 50.0),
                ]),
                vec![TechnologyId::BasicChemistry, TechnologyId::AdvancedRefining],
                TechnologyEffect::ProductionBonus(ResourceType::Coal, 0.35),
                0.35,
            ),
        );

        // Engineering branch - combines multiple basics
        map.insert(
            TechnologyId::BasicEngineering,
            Technology::new(
                TechnologyId::BasicEngineering,
                costs(&[
                    (ResourceType::Gold, 500.0),
                    (ResourceType::Wood, 200.0),
                    (ResourceType::Stone, 200.0),
                    (ResourceType::IronOre, 150.0),
                ]),
                vec![
                    TechnologyId::BasicMining,
                    TechnologyId::BasicLogging,
                    TechnologyId::BasicQuarrying,
                ],
                TechnologyEffect::UnlockBuilding(BuildingType::Factory),
                1.0,
            ),
        );

        // ========== TIER 2: Industrial Technologies (15) ==========

        // Mass Production - depends on engineering
        map.insert(
            TechnologyId::MassProduction,
            Technology::new(
                TechnologyId::MassProduction,
                costs(&[
                    (ResourceType::Gold, 2000.0),
                    (ResourceType::IronIngot, 500.0),
                    (ResourceType::CopperIngot, 300.0),
                ]),
                vec![TechnologyId::BasicEngineering],
                TechnologyEffect::ProductionBonus(ResourceType::Gold, 0.15),
                0.15,
            ),
        );

        // Automation - depends on engineering and advanced smelting
        map.insert(
            TechnologyId::Automation,
            Technology::new(
                TechnologyId::Automation,
                costs(&[
                    (ResourceType::Gold, 3000.0),
                    (ResourceType::SteelPlate, 200.0),
                    (ResourceType::CircuitBoard, 50.0),
                ]),
                vec![
                    TechnologyId::BasicEngineering,
                    TechnologyId::AdvancedSmelting,
                ],
                TechnologyEffect::MechanicChange("auto_production".to_string()),
                1.0,
            ),
        );

        // Robotics branch
        map.insert(
            TechnologyId::Robotics,
            Technology::new(
                TechnologyId::Robotics,
                costs(&[
                    (ResourceType::Gold, 5000.0),
                    (ResourceType::SteelPlate, 400.0),
                    (ResourceType::Motor, 100.0),
                    (ResourceType::Sensor, 50.0),
                ]),
                vec![TechnologyId::Automation, TechnologyId::MassProduction],
                TechnologyEffect::ProductionBonus(ResourceType::Robot, 0.5),
                0.5,
            ),
        );

        map.insert(
            TechnologyId::AdvancedRobotics,
            Technology::new(
                TechnologyId::AdvancedRobotics,
                costs(&[
                    (ResourceType::Gold, 15000.0),
                    (ResourceType::Robot, 50.0),
                    (ResourceType::CircuitBoard, 300.0),
                    (ResourceType::Microchip, 100.0),
                ]),
                vec![TechnologyId::Robotics],
                TechnologyEffect::MechanicChange("full_automation".to_string()),
                1.0,
            ),
        );

        // Electronics branch
        map.insert(
            TechnologyId::Electronics,
            Technology::new(
                TechnologyId::Electronics,
                costs(&[
                    (ResourceType::Gold, 2500.0),
                    (ResourceType::CopperIngot, 500.0),
                    (ResourceType::Glass, 200.0),
                    (ResourceType::Plastic, 100.0),
                ]),
                vec![TechnologyId::BasicChemistry, TechnologyId::BasicEngineering],
                TechnologyEffect::UnlockBuilding(BuildingType::ChipFab),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AdvancedElectronics,
            Technology::new(
                TechnologyId::AdvancedElectronics,
                costs(&[
                    (ResourceType::Gold, 8000.0),
                    (ResourceType::CircuitBoard, 300.0),
                    (ResourceType::Microchip, 100.0),
                    (ResourceType::Gold, 2000.0),
                ]),
                vec![TechnologyId::Electronics],
                TechnologyEffect::ProductionBonus(ResourceType::CircuitBoard, 0.4),
                0.4,
            ),
        );

        // Computer branch
        map.insert(
            TechnologyId::ComputerTechnology,
            Technology::new(
                TechnologyId::ComputerTechnology,
                costs(&[
                    (ResourceType::Gold, 7000.0),
                    (ResourceType::Microchip, 120.0),
                    (ResourceType::CircuitBoard, 260.0),
                    (ResourceType::Plastic, 180.0),
                ]),
                vec![TechnologyId::AdvancedElectronics, TechnologyId::Robotics],
                TechnologyEffect::UnlockBuilding(BuildingType::ResearchLab),
                1.0,
            ),
        );

        // AI branch
        map.insert(
            TechnologyId::AITechnology,
            Technology::new(
                TechnologyId::AITechnology,
                costs(&[
                    (ResourceType::Gold, 14000.0),
                    (ResourceType::Microchip, 260.0),
                    (ResourceType::QuantumComputer, 4.0),
                ]),
                vec![TechnologyId::ComputerTechnology],
                TechnologyEffect::MechanicChange("ai_assistance".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AdvancedAI,
            Technology::new(
                TechnologyId::AdvancedAI,
                costs(&[
                    (ResourceType::Gold, 24000.0),
                    (ResourceType::QuantumComputer, 16.0),
                    (ResourceType::Microchip, 420.0),
                ]),
                vec![TechnologyId::AITechnology],
                TechnologyEffect::MechanicChange("ai_optimization".to_string()),
                2.0,
            ),
        );

        // Nanotechnology branch
        map.insert(
            TechnologyId::Nanotechnology,
            Technology::new(
                TechnologyId::Nanotechnology,
                costs(&[
                    (ResourceType::Gold, 18000.0),
                    (ResourceType::Chemicals, 420.0),
                    (ResourceType::Microchip, 160.0),
                ]),
                vec![
                    TechnologyId::AdvancedChemistry,
                    TechnologyId::AdvancedElectronics,
                ],
                TechnologyEffect::ProductionBonus(ResourceType::Nanobot, 0.5),
                0.5,
            ),
        );

        map.insert(
            TechnologyId::AdvancedNanotech,
            Technology::new(
                TechnologyId::AdvancedNanotech,
                costs(&[
                    (ResourceType::Gold, 80000.0),
                    (ResourceType::Nanobot, 200.0),
                    (ResourceType::Microchip, 800.0),
                ]),
                vec![TechnologyId::Nanotechnology],
                TechnologyEffect::MechanicChange("molecular_assembly".to_string()),
                1.0,
            ),
        );

        // Biotechnology branch
        map.insert(
            TechnologyId::Biotechnology,
            Technology::new(
                TechnologyId::Biotechnology,
                costs(&[
                    (ResourceType::Gold, 25000.0),
                    (ResourceType::Chemicals, 800.0),
                    (ResourceType::Food, 2000.0),
                ]),
                vec![
                    TechnologyId::AdvancedChemistry,
                    TechnologyId::AdvancedAgriculture,
                ],
                TechnologyEffect::ProductionBonus(ResourceType::Food, 0.5),
                0.5,
            ),
        );

        map.insert(
            TechnologyId::GeneticEngineering,
            Technology::new(
                TechnologyId::GeneticEngineering,
                costs(&[
                    (ResourceType::Gold, 60000.0),
                    (ResourceType::Nanobot, 100.0),
                    (ResourceType::Chemicals, 2000.0),
                ]),
                vec![TechnologyId::Biotechnology, TechnologyId::Nanotechnology],
                TechnologyEffect::MechanicChange("genetic_optimization".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::MaggotBreeding,
            Technology::new(
                TechnologyId::MaggotBreeding,
                costs(&[
                    (ResourceType::Gold, 1800.0),
                    (ResourceType::Food, 40.0),
                    (ResourceType::Maggot, 12.0),
                ]),
                vec![TechnologyId::BasicAgriculture],
                TechnologyEffect::ProductionBonus(ResourceType::Maggot, 0.75),
                0.75,
            ),
        );

        map.insert(
            TechnologyId::NecroticRecycling,
            Technology::new(
                TechnologyId::NecroticRecycling,
                costs(&[
                    (ResourceType::Gold, 4200.0),
                    (ResourceType::Chemicals, 60.0),
                    (ResourceType::Maggot, 40.0),
                ]),
                vec![TechnologyId::MaggotBreeding, TechnologyId::BasicChemistry],
                TechnologyEffect::MechanicChange("necrotic_recycling".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::SymbioticHosts,
            Technology::new(
                TechnologyId::SymbioticHosts,
                costs(&[
                    (ResourceType::Gold, 7200.0),
                    (ResourceType::CircuitBoard, 45.0),
                    (ResourceType::Maggot, 90.0),
                    (ResourceType::Food, 110.0),
                ]),
                vec![
                    TechnologyId::NecroticRecycling,
                    TechnologyId::BasicEngineering,
                ],
                TechnologyEffect::MechanicChange("symbiotic_hosts".to_string()),
                1.5,
            ),
        );

        map.insert(
            TechnologyId::HiveMindProtocol,
            Technology::new(
                TechnologyId::HiveMindProtocol,
                costs(&[
                    (ResourceType::Gold, 16000.0),
                    (ResourceType::CircuitBoard, 110.0),
                    (ResourceType::Maggot, 140.0),
                    (ResourceType::Battery, 36.0),
                ]),
                vec![TechnologyId::SymbioticHosts, TechnologyId::Electronics],
                TechnologyEffect::MechanicChange("hive_mind".to_string()),
                2.0,
            ),
        );

        map.insert(
            TechnologyId::CollectiveAwakening,
            Technology::new(
                TechnologyId::CollectiveAwakening,
                costs(&[
                    (ResourceType::Gold, 42000.0),
                    (ResourceType::CircuitBoard, 220.0),
                    (ResourceType::Battery, 80.0),
                    (ResourceType::Microchip, 180.0),
                ]),
                vec![TechnologyId::HiveMindProtocol, TechnologyId::AdvancedAI],
                TechnologyEffect::MechanicChange("collective_awakening".to_string()),
                2.5,
            ),
        );

        // Energy branches
        map.insert(
            TechnologyId::RenewableEnergy,
            Technology::new(
                TechnologyId::RenewableEnergy,
                costs(&[
                    (ResourceType::Gold, 15000.0),
                    (ResourceType::Battery, 500.0),
                    (ResourceType::CircuitBoard, 300.0),
                ]),
                vec![TechnologyId::Electronics, TechnologyId::AdvancedRefining],
                TechnologyEffect::UnlockBuilding(BuildingType::PowerPlant),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::NuclearEnergy,
            Technology::new(
                TechnologyId::NuclearEnergy,
                costs(&[
                    (ResourceType::Gold, 24000.0),
                    (ResourceType::SteelPlate, 520.0),
                    (ResourceType::Generator, 90.0),
                    (ResourceType::CircuitBoard, 220.0),
                ]),
                vec![
                    TechnologyId::AdvancedElectronics,
                    TechnologyId::AdvancedSmelting,
                ],
                TechnologyEffect::MechanicChange("nuclear_power".to_string()),
                2.0,
            ),
        );

        // ========== TIER 3: Advanced Technologies (10) ==========

        map.insert(
            TechnologyId::QuantumComputing,
            Technology::new(
                TechnologyId::QuantumComputing,
                costs(&[
                    (ResourceType::Gold, 35000.0),
                    (ResourceType::Microchip, 450.0),
                    (ResourceType::Crystal, 900.0),
                ]),
                vec![TechnologyId::AdvancedAI, TechnologyId::AdvancedElectronics],
                TechnologyEffect::UnlockBuilding(BuildingType::QuantumLab),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::FusionEnergy,
            Technology::new(
                TechnologyId::FusionEnergy,
                costs(&[
                    (ResourceType::Gold, 60000.0),
                    (ResourceType::QuantumComputer, 30.0),
                    (ResourceType::Generator, 180.0),
                    (ResourceType::SteelPlate, 800.0),
                ]),
                vec![TechnologyId::QuantumComputing, TechnologyId::NuclearEnergy],
                TechnologyEffect::MechanicChange("fusion_power".to_string()),
                3.0,
            ),
        );

        map.insert(
            TechnologyId::AntimatterEnergy,
            Technology::new(
                TechnologyId::AntimatterEnergy,
                costs(&[
                    (ResourceType::Gold, 300000.0),
                    (ResourceType::QuantumComputer, 200.0),
                    (ResourceType::Antimatter, 50.0),
                ]),
                vec![TechnologyId::FusionEnergy, TechnologyId::QuantumComputing],
                TechnologyEffect::ProductionBonus(ResourceType::Antimatter, 1.0),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::SpaceExploration,
            Technology::new(
                TechnologyId::SpaceExploration,
                costs(&[
                    (ResourceType::Gold, 65000.0),
                    (ResourceType::Spaceship, 8.0),
                    (ResourceType::QuantumComputer, 28.0),
                    (ResourceType::SteelPlate, 900.0),
                ]),
                vec![
                    TechnologyId::CollectiveAwakening,
                    TechnologyId::ConsciousnessUpload,
                    TechnologyId::FusionEnergy,
                ],
                TechnologyEffect::UnlockBuilding(BuildingType::SpacePort),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Terraforming,
            Technology::new(
                TechnologyId::Terraforming,
                costs(&[
                    (ResourceType::Gold, 500000.0),
                    (ResourceType::Nanobot, 1000.0),
                    (ResourceType::Robot, 2000.0),
                    (ResourceType::Antimatter, 100.0),
                ]),
                vec![
                    TechnologyId::SpaceExploration,
                    TechnologyId::AdvancedNanotech,
                    TechnologyId::GeneticEngineering,
                ],
                TechnologyEffect::MechanicChange("terraforming".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::TimeManipulation,
            Technology::new(
                TechnologyId::TimeManipulation,
                costs(&[
                    (ResourceType::Gold, 1000000.0),
                    (ResourceType::TimeCrystal, 100.0),
                    (ResourceType::QuantumComputer, 500.0),
                ]),
                vec![
                    TechnologyId::QuantumComputing,
                    TechnologyId::AntimatterEnergy,
                ],
                TechnologyEffect::MechanicChange("time_manipulation".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::DimensionalTravel,
            Technology::new(
                TechnologyId::DimensionalTravel,
                costs(&[
                    (ResourceType::Gold, 2000000.0),
                    (ResourceType::TimeCrystal, 500.0),
                    (ResourceType::DarkMatter, 200.0),
                    (ResourceType::Antimatter, 500.0),
                ]),
                vec![
                    TechnologyId::TimeManipulation,
                    TechnologyId::AntimatterEnergy,
                ],
                TechnologyEffect::MechanicChange("dimensional_travel".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::ConsciousnessUpload,
            Technology::new(
                TechnologyId::ConsciousnessUpload,
                costs(&[
                    (ResourceType::Gold, 38000.0),
                    (ResourceType::QuantumComputer, 6.0),
                    (ResourceType::Nanobot, 28.0),
                    (ResourceType::Microchip, 120.0),
                ]),
                vec![
                    TechnologyId::CollectiveAwakening,
                    TechnologyId::HiveMindProtocol,
                    TechnologyId::AdvancedAI,
                ],
                TechnologyEffect::MechanicChange("consciousness_upload".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Immortality,
            Technology::new(
                TechnologyId::Immortality,
                costs(&[
                    (ResourceType::Gold, 10000000.0),
                    (ResourceType::TimeCrystal, 1000.0),
                    (ResourceType::Nanobot, 10000.0),
                ]),
                vec![
                    TechnologyId::ConsciousnessUpload,
                    TechnologyId::Terraforming,
                ],
                TechnologyEffect::MechanicChange("immortality".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Godhood,
            Technology::new(
                TechnologyId::Godhood,
                costs(&[
                    (ResourceType::Gold, 50000000.0),
                    (ResourceType::TimeCrystal, 5000.0),
                    (ResourceType::DarkMatter, 1000.0),
                    (ResourceType::Antimatter, 2000.0),
                ]),
                vec![TechnologyId::Immortality, TechnologyId::DimensionalTravel],
                TechnologyEffect::MechanicChange("godhood".to_string()),
                1.0,
            ),
        );

        // ========== TIER 4: Special/UI Technologies (10) ==========

        map.insert(
            TechnologyId::ClickEfficiency,
            Technology::new(
                TechnologyId::ClickEfficiency,
                costs(&[(ResourceType::Gold, 1000.0), (ResourceType::Wood, 500.0)]),
                vec![TechnologyId::BasicEngineering],
                TechnologyEffect::MechanicChange("click_efficiency".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::ResourceBoost,
            Technology::new(
                TechnologyId::ResourceBoost,
                costs(&[(ResourceType::Gold, 3000.0), (ResourceType::Crystal, 100.0)]),
                vec![TechnologyId::AdvancedQuarrying],
                TechnologyEffect::MechanicChange("resource_boost".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::ProductionMultiplier,
            Technology::new(
                TechnologyId::ProductionMultiplier,
                costs(&[
                    (ResourceType::Gold, 10000.0),
                    (ResourceType::IronIngot, 1000.0),
                    (ResourceType::CopperIngot, 500.0),
                ]),
                vec![TechnologyId::MassProduction],
                TechnologyEffect::MechanicChange("production_multiplier".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::CostReduction,
            Technology::new(
                TechnologyId::CostReduction,
                costs(&[
                    (ResourceType::Gold, 5000.0),
                    (ResourceType::SteelPlate, 200.0),
                ]),
                vec![TechnologyId::Automation],
                TechnologyEffect::MechanicChange("cost_reduction".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::CriticalClick,
            Technology::new(
                TechnologyId::CriticalClick,
                costs(&[(ResourceType::Gold, 8000.0), (ResourceType::Crystal, 500.0)]),
                vec![TechnologyId::ClickEfficiency, TechnologyId::Electronics],
                TechnologyEffect::MechanicChange("critical_click".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::AutoAssignment,
            Technology::new(
                TechnologyId::AutoAssignment,
                costs(&[
                    (ResourceType::Gold, 1200.0),
                    (ResourceType::IronIngot, 40.0),
                    (ResourceType::CircuitBoard, 12.0),
                ]),
                vec![TechnologyId::BasicEngineering, TechnologyId::Electronics],
                TechnologyEffect::MechanicChange("auto_assignment".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Prestige,
            Technology::new(
                TechnologyId::Prestige,
                costs(&[
                    (ResourceType::Gold, 100000.0),
                    (ResourceType::QuantumComputer, 10.0),
                ]),
                vec![TechnologyId::QuantumComputing],
                TechnologyEffect::UnlockUI,
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Legacy,
            Technology::new(
                TechnologyId::Legacy,
                costs(&[
                    (ResourceType::Gold, 500000.0),
                    (ResourceType::QuantumComputer, 50.0),
                    (ResourceType::Nanobot, 1000.0),
                ]),
                vec![TechnologyId::Prestige, TechnologyId::AdvancedNanotech],
                TechnologyEffect::MechanicChange("legacy_bonus".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Ascension,
            Technology::new(
                TechnologyId::Ascension,
                costs(&[
                    (ResourceType::Gold, 2000000.0),
                    (ResourceType::TimeCrystal, 100.0),
                    (ResourceType::QuantumComputer, 200.0),
                ]),
                vec![TechnologyId::Legacy, TechnologyId::SpaceExploration],
                TechnologyEffect::MechanicChange("ascension".to_string()),
                1.0,
            ),
        );

        map.insert(
            TechnologyId::Omniscience,
            Technology::new(
                TechnologyId::Omniscience,
                costs(&[
                    (ResourceType::Gold, 10000000.0),
                    (ResourceType::TimeCrystal, 1000.0),
                    (ResourceType::DarkMatter, 500.0),
                    (ResourceType::Antimatter, 2000.0),
                ]),
                vec![TechnologyId::Ascension, TechnologyId::Godhood],
                TechnologyEffect::MechanicChange("omniscience".to_string()),
                1.0,
            ),
        );

        map
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_tree_all_locked() {
        let tree = TechnologyTree::new();
        assert!(tree.unlocked.is_empty());
    }

    #[test]
    fn test_is_unlocked_initially_false() {
        let tree = TechnologyTree::new();
        assert!(!tree.is_unlocked(TechnologyId::BasicMining));
        assert!(!tree.is_unlocked(TechnologyId::Godhood));
    }

    #[test]
    fn test_all_technologies_initialized() {
        let tree = TechnologyTree::new();
        assert_eq!(tree.technologies.len(), 55);
    }

    #[test]
    fn test_no_circular_dependencies() {
        let tree = TechnologyTree::new();
        tree.validate_no_circular_dependencies()
            .expect("Technology tree should not have circular dependencies");
    }

    #[test]
    fn test_all_technologies_reachable() {
        let tree = TechnologyTree::new();
        tree.validate_all_reachable()
            .expect("All technologies should be reachable from starting techs");
    }

    #[test]
    fn test_tier1_dependencies() {
        let tree = TechnologyTree::new();

        // Tier 1 basics have no dependencies
        let basic_mining = tree.technologies.get(&TechnologyId::BasicMining).unwrap();
        assert!(basic_mining.dependencies.is_empty());

        let basic_logging = tree.technologies.get(&TechnologyId::BasicLogging).unwrap();
        assert!(basic_logging.dependencies.is_empty());

        let basic_quarrying = tree
            .technologies
            .get(&TechnologyId::BasicQuarrying)
            .unwrap();
        assert!(basic_quarrying.dependencies.is_empty());

        let basic_agriculture = tree
            .technologies
            .get(&TechnologyId::BasicAgriculture)
            .unwrap();
        assert!(basic_agriculture.dependencies.is_empty());

        // Tier 1 advanced depend on basics
        let advanced_mining = tree
            .technologies
            .get(&TechnologyId::AdvancedMining)
            .unwrap();
        assert!(advanced_mining
            .dependencies
            .contains(&TechnologyId::BasicMining));

        let advanced_logging = tree
            .technologies
            .get(&TechnologyId::AdvancedLogging)
            .unwrap();
        assert!(advanced_logging
            .dependencies
            .contains(&TechnologyId::BasicLogging));
    }

    #[test]
    fn test_tier2_dependencies() {
        let tree = TechnologyTree::new();

        // Tier 2 techs depend on Tier 1
        let mass_production = tree
            .technologies
            .get(&TechnologyId::MassProduction)
            .unwrap();
        assert!(mass_production
            .dependencies
            .contains(&TechnologyId::BasicEngineering));

        let automation = tree.technologies.get(&TechnologyId::Automation).unwrap();
        assert!(automation
            .dependencies
            .contains(&TechnologyId::BasicEngineering));
        assert!(automation
            .dependencies
            .contains(&TechnologyId::AdvancedSmelting));
    }

    #[test]
    fn test_tier3_dependencies() {
        let tree = TechnologyTree::new();

        // Tier 3 techs depend on Tier 2
        let quantum = tree
            .technologies
            .get(&TechnologyId::QuantumComputing)
            .unwrap();
        assert!(quantum.dependencies.contains(&TechnologyId::AdvancedAI));
        assert!(quantum
            .dependencies
            .contains(&TechnologyId::AdvancedElectronics));

        let fusion = tree.technologies.get(&TechnologyId::FusionEnergy).unwrap();
        assert!(fusion
            .dependencies
            .contains(&TechnologyId::QuantumComputing));
    }

    #[test]
    fn test_tier4_dependencies() {
        let tree = TechnologyTree::new();

        // Tier 4 depends on mix of tiers
        let prestige = tree.technologies.get(&TechnologyId::Prestige).unwrap();
        assert!(prestige
            .dependencies
            .contains(&TechnologyId::QuantumComputing));

        let omniscience = tree.technologies.get(&TechnologyId::Omniscience).unwrap();
        assert!(omniscience.dependencies.contains(&TechnologyId::Ascension));
        assert!(omniscience.dependencies.contains(&TechnologyId::Godhood));
    }

    #[test]
    fn test_tech_costs_non_empty() {
        let tree = TechnologyTree::new();

        // Most techs should have costs
        let basic_mining = tree.technologies.get(&TechnologyId::BasicMining).unwrap();
        assert!(!basic_mining.costs.is_empty());

        let godhood = tree.technologies.get(&TechnologyId::Godhood).unwrap();
        assert!(!godhood.costs.is_empty());
    }

    #[test]
    fn test_tier1_technologies_only_reference_primary_resources() {
        use crate::state::resource::ResourceTier;
        let tree = TechnologyTree::new();

        for tech in tree.technologies.values().filter(|tech| tech.tier() == 1) {
            for resource in tech.costs.keys() {
                assert_eq!(
                    resource.tier_enum(),
                    ResourceTier::Primary,
                    "Tier 1 tech {:?} uses non-primary cost resource {:?}",
                    tech.id,
                    resource
                );
            }

            if let TechnologyEffect::ProductionBonus(resource, _) = &tech.effect {
                assert_eq!(
                    resource.tier_enum(),
                    ResourceTier::Primary,
                    "Tier 1 tech {:?} uses non-primary effect resource {:?}",
                    tech.id,
                    resource
                );
            }
        }
    }

    #[test]
    fn test_can_research_basic() {
        let tree = TechnologyTree::new();

        // Should be able to research Tier 1 basics
        assert!(tree.can_research(TechnologyId::BasicMining));
        assert!(tree.can_research(TechnologyId::BasicLogging));
        assert!(tree.can_research(TechnologyId::BasicQuarrying));
        assert!(tree.can_research(TechnologyId::BasicAgriculture));

        // Should not be able to research without dependencies
        assert!(!tree.can_research(TechnologyId::AdvancedMining));
        assert!(!tree.can_research(TechnologyId::QuantumComputing));
    }

    #[test]
    fn test_research_flow() {
        let mut tree = TechnologyTree::new();

        // Research basic mining
        assert!(tree.can_research(TechnologyId::BasicMining));
        tree.research(TechnologyId::BasicMining).unwrap();

        // Should now be unlocked
        assert!(tree.is_unlocked(TechnologyId::BasicMining));
        assert!(!tree.can_research(TechnologyId::BasicMining)); // Already purchased

        // Should now be able to research advanced mining
        assert!(tree.can_research(TechnologyId::AdvancedMining));
    }

    #[test]
    fn test_research_dependencies_not_met() {
        let mut tree = TechnologyTree::new();

        // Cannot research without dependencies
        let result = tree.research(TechnologyId::AdvancedMining);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_available_research() {
        let tree = TechnologyTree::new();

        // Initially, only Tier 1 basics should be available
        let available = tree.get_available_research();
        assert!(available.contains(&TechnologyId::BasicMining));
        assert!(available.contains(&TechnologyId::BasicLogging));
        assert!(available.contains(&TechnologyId::BasicQuarrying));
        assert!(available.contains(&TechnologyId::BasicAgriculture));
        assert!(!available.contains(&TechnologyId::AdvancedMining));
        assert!(!available.contains(&TechnologyId::QuantumComputing));
    }
}
