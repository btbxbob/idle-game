use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Statistics {
    pub total_clicks: u32,
    pub total_coins_earned: f64,
    pub total_wood_earned: f64,
    pub total_stone_earned: f64,
    pub total_resources_crafted: u32,
    pub achievements_unlocked_count: u32,
    pub play_time_seconds: f64,
    pub buildings_purchased: u32,
    pub upgrades_purchased: u32,
}
