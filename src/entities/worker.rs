use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Worker {
    pub name: String,
    pub skills: String,
    pub background: String,
    pub preferences: String,
    pub assigned_building: Option<String>,
    pub level: u32,
    pub efficiency_multiplier: f64,
    pub xp: f64,
    pub xp_to_next_level: f64,
}
