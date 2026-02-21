use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameState {
    pub coins: f64,
    pub wood: f64,
    pub stone: f64,
    pub coins_per_click: f64,
    pub coins_per_second: f64,
    pub wood_per_second: f64,
    pub stone_per_second: f64,
    pub autoclick_count: u32,
    pub total_clicks: u32,
    pub last_update_time: f64,
}
