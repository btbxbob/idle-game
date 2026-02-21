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
            self.unlock_timestamp = Some(js_sys::Date::now());
            return true;
        }

        false
    }
}
