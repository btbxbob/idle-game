use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub unlocked: bool,
    pub unlock_timestamp: Option<f64>,
    pub progress: f64,
    pub requirement: f64,
    pub category: String,
}

impl Achievement {
    /// Check and update achievement progress
    /// Returns true if achievement was unlocked this call
    pub fn check_progress(
        &mut self,
        total_clicks: f64,
        coins: f64,
        wood: f64,
        stone: f64,
        buildings_purchased: f64,
        total_resources_crafted: f64,
        achievements_unlocked_count: f64,
    ) -> bool {
        if self.unlocked {
            return true;
        }

        let current_value = match self.category.as_str() {
            "clicks" => total_clicks,
            "resources" => {
                if self.id == "first_coins_100" {
                    coins
                } else if self.id == "wood_collector_1000" {
                    wood
                } else if self.id == "stone_hoarder_5000" {
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

        self.progress = current_value;

        if self.progress >= self.requirement {
            self.unlocked = true;
            #[cfg(not(test))]
            {
                self.unlock_timestamp = Some(js_sys::Date::now());
            }
            #[cfg(test)]
            {
                self.unlock_timestamp = Some(0.0);
            }
            return true;
        }

        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_achievement(id: &str, requirement: f64, category: &str) -> Achievement {
        Achievement {
            id: id.to_string(),
            name: "Test Achievement".to_string(),
            description: "Test description".to_string(),
            unlocked: false,
            unlock_timestamp: None,
            progress: 0.0,
            requirement,
            category: category.to_string(),
        }
    }

    #[test]
    fn test_check_progress_clicks_unlocks() {
        let mut achievement = create_achievement("click_novice_10", 10.0, "clicks");
        
        let result = achievement.check_progress(10.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert!(achievement.unlock_timestamp.is_some());
        assert_eq!(achievement.progress, 10.0);
    }

    #[test]
    fn test_check_progress_clicks_not_met() {
        let mut achievement = create_achievement("click_novice_10", 10.0, "clicks");
        
        let result = achievement.check_progress(5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        
        assert!(!result);
        assert!(!achievement.unlocked);
        assert_eq!(achievement.progress, 5.0);
    }

    #[test]
    fn test_check_progress_first_coins_100() {
        let mut achievement = create_achievement("first_coins_100", 100.0, "resources");
        
        let result = achievement.check_progress(0.0, 150.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert_eq!(achievement.progress, 150.0);
    }

    #[test]
    fn test_check_progress_wood_collector_1000() {
        let mut achievement = create_achievement("wood_collector_1000", 1000.0, "resources");
        
        let result = achievement.check_progress(0.0, 0.0, 1200.0, 0.0, 0.0, 0.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert_eq!(achievement.progress, 1200.0);
    }

    #[test]
    fn test_check_progress_stone_hoarder_5000() {
        let mut achievement = create_achievement("stone_hoarder_5000", 5000.0, "resources");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 6000.0, 0.0, 0.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert_eq!(achievement.progress, 6000.0);
    }

    #[test]
    fn test_check_progress_resources_not_met() {
        let mut achievement = create_achievement("first_coins_100", 100.0, "resources");
        
        let result = achievement.check_progress(0.0, 50.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        
        assert!(!result);
        assert!(!achievement.unlocked);
        assert_eq!(achievement.progress, 50.0);
    }

    #[test]
    fn test_check_progress_buildings_unlocks() {
        let mut achievement = create_achievement("first_building", 1.0, "buildings");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert_eq!(achievement.progress, 5.0);
    }

    #[test]
    fn test_check_progress_buildings_not_met() {
        let mut achievement = create_achievement("first_building", 5.0, "buildings");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0);
        
        assert!(!result);
        assert!(!achievement.unlocked);
        assert_eq!(achievement.progress, 2.0);
    }

    #[test]
    fn test_check_progress_crafting_unlocks() {
        let mut achievement = create_achievement("first_craft", 1.0, "crafting");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert_eq!(achievement.progress, 10.0);
    }

    #[test]
    fn test_check_progress_crafting_not_met() {
        let mut achievement = create_achievement("first_craft", 5.0, "crafting");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 0.0);
        
        assert!(!result);
        assert!(!achievement.unlocked);
        assert_eq!(achievement.progress, 2.0);
    }

    #[test]
    fn test_check_progress_unlocks_unlocks() {
        let mut achievement = create_achievement("first_unlock", 1.0, "unlocks");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 3.0);
        
        assert!(result);
        assert!(achievement.unlocked);
        assert_eq!(achievement.progress, 3.0);
    }

    #[test]
    fn test_check_progress_unlocks_not_met() {
        let mut achievement = create_achievement("progress_master_5", 5.0, "unlocks");
        
        let result = achievement.check_progress(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0);
        
        assert!(!result);
        assert!(!achievement.unlocked);
        assert_eq!(achievement.progress, 2.0);
    }

    #[test]
    fn test_check_progress_already_unlocked_returns_true() {
        let mut achievement = Achievement {
            id: "click_novice_10".to_string(),
            name: "点击新手".to_string(),
            description: "Test".to_string(),
            unlocked: true,
            unlock_timestamp: Some(1000.0),
            progress: 10.0,
            requirement: 10.0,
            category: "clicks".to_string(),
        };
        
        let result = achievement.check_progress(5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        
        assert!(result);
        assert!(achievement.unlocked);
    }

    #[test]
    fn test_check_progress_unknown_category() {
        let mut achievement = create_achievement("unknown", 10.0, "unknown_category");
        
        let result = achievement.check_progress(100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0);
        
        assert!(!result);
        assert!(!achievement.unlocked);
        assert_eq!(achievement.progress, 0.0);
    }
}