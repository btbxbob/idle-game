use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Upgrade {
    pub name: String,
    pub cost: f64,
    pub production_increase: f64,
    pub owned: u32,
    pub unlocked: bool,
}
