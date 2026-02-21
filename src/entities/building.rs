use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Building {
    pub name: String,
    pub cost: f64,
    pub production_rate: f64,
    pub count: u32,
}
