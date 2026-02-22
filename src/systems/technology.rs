use crate::entities::technology::{Technology, TechnologyId, TechnologyEffect};
use crate::state::GameState;
use std::collections::{HashMap, HashSet};

/// Technology tree system managing research and dependencies
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
        let mut map = HashMap::new();
        // Add initial set of technologies here
        map
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

        tech.dependencies.iter().all(|dep| self.unlocked.contains(dep))
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

    /// Apply technology effect to game state
    pub fn apply_effect(&self, tech_id: TechnologyId, game_state: &mut GameState) {
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
}

impl Default for TechnologyTree {
    fn default() -> Self {
        Self::new()
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
        // Test with a sample technology ID
    }
}

/// Get all default technologies (50 total)
impl TechnologyTree {
    fn initialize_technologies() -> HashMap<TechnologyId, Technology> {
        let mut map = HashMap::new();
        
        // Tier 1: Basic production bonuses (10 technologies)
        map.insert(TechnologyId::BasicMining, Technology {
            id: TechnologyId::BasicMining,
            name: "基础采矿",
            description: "矿井生产效率 +10%",
            costs: HashMap::new(),
            dependencies: vec![],
            effect: TechnologyEffect::ProductionBonus(crate::state::resource::ResourceType::Coal, 0.1),
            effect_value: 0.1,
            purchased: false,
        });
        
        // Tier 2: Building unlocks (10 technologies)
        // Tier 3: UI/automation unlocks (10 technologies)
        // Tier 4: Mechanic changes (10 technologies)
        // Tier 5: Advanced technologies (10 technologies)
        
        map
    }
}
